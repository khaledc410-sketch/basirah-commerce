import "server-only";

import { getServerEnv, isDemoMode } from "@/config/env";
import { recordProductEvent } from "@/lib/telemetry/record";
import { telemetryOpaqueId } from "@/lib/telemetry/opaque-id";

import { crawlWebsite, type CrawlOptions } from "./crawler";
import { ScannerError, toScannerError } from "./errors";
import { getVisibilityScanRepository, type VisibilityScanRepository } from "./repository";
import { evaluateCrawl } from "./scoring";
import type { ScanInput, VisibilityScanRecord } from "./types";
import { normalizedUrlString } from "./url";

export interface ScannerRuntimeDependencies {
  repository?: VisibilityScanRepository;
  crawlOptions?: Omit<CrawlOptions, "onProgress">;
  enqueue?: (token: string) => void | Promise<void>;
  rethrowRetryable?: boolean;
}

const retryableErrorCodes = new Set([
  "DNS_UNAVAILABLE",
  "FETCH_FAILED",
  "ROBOTS_UNAVAILABLE",
  "SCAN_DEADLINE_EXCEEDED",
  "SCAN_FAILED",
]);

export function isRetryableScannerError(error: ScannerError) {
  return isRetryableScannerErrorCode(error.code);
}

export function isRetryableScannerErrorCode(code: string) {
  return retryableErrorCodes.has(code);
}

function repositoryFrom(dependencies?: ScannerRuntimeDependencies) {
  return dependencies?.repository ?? getVisibilityScanRepository();
}

export async function createVisibilityScan(input: ScanInput, dependencies?: ScannerRuntimeDependencies) {
  const publicUrl = new URL(normalizedUrlString(input.domain));
  publicUrl.pathname = "/";
  publicUrl.search = "";
  publicUrl.hash = "";
  const normalizedUrl = publicUrl.toString();
  return repositoryFrom(dependencies).create({
    ...input,
    domain: new URL(normalizedUrl).hostname,
    normalizedUrl,
  });
}

export async function runScan(token: string, dependencies?: ScannerRuntimeDependencies) {
  const repository = repositoryFrom(dependencies);
  const record = await repository.get(token);
  if (!record) {
    throw new ScannerError("SCAN_NOT_FOUND", "لم يعد هذا الفحص متاحًا.");
  }
  if (record.status === "completed" || record.status === "failed") return record;
  if (!getServerEnv().VISIBILITY_SCAN_ENABLED) {
    return repository.fail(token, {
      code: "SCANNER_DISABLED",
      message: "الفحص متوقف مؤقتًا للصيانة.",
    });
  }
  const claimed = await repository.tryStart(token);
  if (!claimed) {
    // A BullMQ job can be redelivered after its Redis lock is considered
    // stalled while the previous process still owns a valid database lease.
    // Returning a running record here would let BullMQ mark that redelivery as
    // successfully completed. Make the contention explicit so the worker can
    // delay this same job until the durable lease can be reclaimed.
    const current = await repository.get(token);
    if (!current) {
      throw new ScannerError("SCAN_NOT_FOUND", "لم يعد هذا الفحص متاحًا.");
    }
    if (current.status === "completed" || current.status === "failed") {
      return current;
    }
    const leaseExpiresAt = current.leaseExpiresAt
      ? new Date(current.leaseExpiresAt)
      : null;
    const retryAt =
      leaseExpiresAt && Number.isFinite(leaseExpiresAt.getTime()) && leaseExpiresAt.getTime() > Date.now()
        ? leaseExpiresAt
        : new Date(Date.now() + 1_000);
    throw new ScannerError(
      "SCAN_LEASE_BUSY",
      "هناك محاولة فحص أخرى قيد التنفيذ.",
      { retryAt },
    );
  }
  const attemptId = claimed.attemptId;
  if (!attemptId) {
    throw new ScannerError("SCAN_LEASE_UNAVAILABLE", "تعذر حجز محاولة الفحص بأمان.");
  }

  try {
    const requestedMaxPages = dependencies?.crawlOptions?.maxPages ?? getServerEnv().VISIBILITY_SCAN_MAX_PAGES;
    const crawl = await crawlWebsite(record.input.normalizedUrl, {
      ...dependencies?.crawlOptions,
      maxPages: Math.min(10, requestedMaxPages),
      onProgress: async ({ progress, currentStep }) => {
        const updated = await repository.updateProgress(
          token,
          progress,
          currentStep,
          attemptId,
        );
        if (!updated) {
          throw new ScannerError("SCAN_LEASE_LOST", "انتقلت مهمة الفحص إلى محاولة أحدث.");
        }
      },
    });
    const analyzing = await repository.updateProgress(
      token,
      90,
      "تحليل الأدلة وحساب الجاهزية",
      attemptId,
    );
    if (!analyzing) {
      throw new ScannerError("SCAN_LEASE_LOST", "انتقلت مهمة الفحص إلى محاولة أحدث.");
    }
    const report = evaluateCrawl(crawl, record.input.locale);
    const completed = await repository.complete(token, report, crawl, attemptId);
    if (!completed) {
      throw new ScannerError("SCAN_LEASE_LOST", "انتقلت مهمة الفحص إلى محاولة أحدث.");
    }
    recordProductEvent({
      type: "visibility_check_completed",
      source: "system",
      scanId: telemetryOpaqueId("scan", token),
      outcome: report.coverage < 100 ? "partial" : "completed",
      durationMs: Math.min(
        86_400_000,
        Math.max(0, Date.now() - new Date(record.createdAt).getTime()),
      ),
      pagesScanned: report.pagesScanned,
      coveragePercent: report.coverage,
      readinessScore: report.score,
    });
    return completed;
  } catch (error) {
    const scannerError = toScannerError(error);
    if (scannerError.code === "SCAN_LEASE_LOST") throw scannerError;
    if (dependencies?.rethrowRetryable && isRetryableScannerError(scannerError)) {
      await repository.requeue(token, {
        code: scannerError.code,
        message: scannerError.publicMessage,
      }, attemptId);
      throw scannerError;
    }
    const failed = await repository.fail(token, {
      code: scannerError.code,
      message: scannerError.publicMessage,
    }, attemptId);
    recordProductEvent({
      type: "visibility_check_completed",
      source: "system",
      scanId: telemetryOpaqueId("scan", token),
      outcome: "failed",
      durationMs: Math.min(
        86_400_000,
        Math.max(0, Date.now() - new Date(record.createdAt).getTime()),
      ),
      pagesScanned: 0,
      coveragePercent: 0,
      failureCode: scannerError.code,
    });
    return failed;
  }
}

export async function scheduleScan(token: string, dependencies?: ScannerRuntimeDependencies) {
  if (dependencies?.enqueue) {
    await dependencies.enqueue(token);
    return;
  }
  if (!isDemoMode()) {
    throw new ScannerError(
      "SCAN_QUEUE_UNAVAILABLE",
      "خدمة طابور الفحص غير متاحة، ولم يبدأ الفحص.",
    );
  }
  queueMicrotask(() => void runScan(token, dependencies));
}

export async function getScan(token: string, dependencies?: ScannerRuntimeDependencies): Promise<VisibilityScanRecord | null> {
  if (!/^[\w-]{24,128}$/u.test(token)) return null;
  return repositoryFrom(dependencies).get(token);
}
