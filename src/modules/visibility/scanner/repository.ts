import "server-only";

import { createHash, randomBytes, randomUUID } from "node:crypto";

import { and, desc, eq, gt, isNull, lte, or } from "drizzle-orm";

import { getServerEnv, isDemoMode } from "@/config/env";
import { getDb } from "@/db/client";
import {
  prospectReportSnapshots,
  prospectScanEvidence,
  prospectScanFindings,
  prospectScanPages,
  prospectScanRequests,
  prospectScanRuns,
  type JsonObject,
  type JsonValue,
} from "@/db/schema";

import {
  SITE_READINESS_METHODOLOGY_VERSION,
  type CrawlResult,
  type NormalizedScanInput,
  type VisibilityScanRecord,
  type VisibilityScanReport,
} from "./types";

const sevenDaysMs = 7 * 24 * 60 * 60 * 1_000;
const scanClaimLeaseMs = 150_000;

export interface VisibilityScanRepository {
  create(input: NormalizedScanInput): Awaitable<VisibilityScanRecord>;
  get(token: string): Awaitable<VisibilityScanRecord | null>;
  tryStart(token: string): Awaitable<VisibilityScanRecord | null>;
  updateProgress(token: string, progress: number, currentStep: string, attemptId?: string): Awaitable<VisibilityScanRecord | null>;
  requeue(token: string, error: { code: string; message: string }, attemptId?: string): Awaitable<VisibilityScanRecord | null>;
  complete(token: string, report: VisibilityScanReport, crawl?: CrawlResult, attemptId?: string): Awaitable<VisibilityScanRecord | null>;
  fail(token: string, error: { code: string; message: string }, attemptId?: string): Awaitable<VisibilityScanRecord | null>;
}

export type Awaitable<T> = T | Promise<T>;

export class InMemoryVisibilityScanRepository implements VisibilityScanRepository {
  private readonly records = new Map<string, VisibilityScanRecord>();

  constructor(
    private readonly now: () => Date = () => new Date(),
    private readonly ttlMs = sevenDaysMs,
  ) {}

  private cleanup() {
    const currentTime = this.now().getTime();
    for (const [token, record] of this.records) {
      if (new Date(record.expiresAt).getTime() <= currentTime) this.records.delete(token);
    }
  }

  create(input: NormalizedScanInput) {
    this.cleanup();
    const createdAt = this.now();
    const record: VisibilityScanRecord = {
      token: randomBytes(24).toString("base64url"),
      input,
      status: "queued",
      progress: 0,
      currentStep: "في انتظار بدء الفحص",
      createdAt: createdAt.toISOString(),
      expiresAt: new Date(createdAt.getTime() + this.ttlMs).toISOString(),
    };
    this.records.set(record.token, record);
    return structuredClone(record);
  }

  get(token: string) {
    this.cleanup();
    const record = this.records.get(token);
    return record ? structuredClone(record) : null;
  }

  tryStart(token: string) {
    const record = this.records.get(token);
    const leaseExpired =
      record?.status === "running" &&
      (!record.leaseExpiresAt ||
        new Date(record.leaseExpiresAt).getTime() <= this.now().getTime());
    if (!record || (record.status !== "queued" && !leaseExpired)) return null;
    record.status = "running";
    record.progress = Math.max(3, record.progress);
    record.currentStep = "بدء الفحص الآمن للموقع";
    record.attemptId = randomUUID();
    record.leaseExpiresAt = new Date(this.now().getTime() + scanClaimLeaseMs).toISOString();
    delete record.error;
    return structuredClone(record);
  }

  updateProgress(token: string, progress: number, currentStep: string, attemptId?: string) {
    const record = this.records.get(token);
    if (!record || record.status === "completed" || record.status === "failed") return null;
    if (attemptId && record.attemptId !== attemptId) return null;
    record.status = "running";
    record.progress = Math.max(record.progress, Math.min(99, Math.round(progress)));
    record.currentStep = currentStep;
    record.leaseExpiresAt = new Date(this.now().getTime() + scanClaimLeaseMs).toISOString();
    return structuredClone(record);
  }

  requeue(token: string, error: { code: string; message: string }, attemptId?: string) {
    const record = this.records.get(token);
    if (!record || record.status === "completed" || record.status === "failed") return null;
    if (attemptId && record.attemptId !== attemptId) return null;
    record.status = "queued";
    record.currentStep = "سيعاد الفحص بعد تعذر مؤقت";
    record.error = error;
    delete record.attemptId;
    delete record.leaseExpiresAt;
    return structuredClone(record);
  }

  complete(token: string, report: VisibilityScanReport, _crawl?: CrawlResult, attemptId?: string) {
    const record = this.records.get(token);
    if (!record) return null;
    if (attemptId && record.attemptId !== attemptId) return null;
    record.status = "completed";
    record.progress = 100;
    record.currentStep = "اكتمل الفحص";
    record.report = report;
    delete record.error;
    delete record.attemptId;
    delete record.leaseExpiresAt;
    return structuredClone(record);
  }

  fail(token: string, error: { code: string; message: string }, attemptId?: string) {
    const record = this.records.get(token);
    if (!record) return null;
    if (attemptId && record.attemptId !== attemptId) return null;
    record.status = "failed";
    record.currentStep = "تعذر إكمال الفحص";
    record.error = error;
    delete record.attemptId;
    delete record.leaseExpiresAt;
    return structuredClone(record);
  }
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("base64url");
}

function reportFromSnapshot(value: JsonObject): VisibilityScanReport | undefined {
  const report = value.report;
  return report && typeof report === "object" && !Array.isArray(report)
    ? (report as unknown as VisibilityScanReport)
    : undefined;
}

/**
 * Durable service repository for staging/production workers. Only token hashes
 * are stored; the opaque token remains with the caller.
 */
export class PostgresVisibilityScanRepository implements VisibilityScanRepository {
  constructor(
    private readonly now: () => Date = () => new Date(),
    private readonly ttlMs = sevenDaysMs,
  ) {}

  private async rowsForToken(token: string) {
    const db = getDb();
    const [request] = await db
      .select()
      .from(prospectScanRequests)
      .where(
        and(
          eq(prospectScanRequests.tokenHash, hashToken(token)),
          gt(prospectScanRequests.expiresAt, this.now()),
        ),
      )
      .limit(1);
    if (!request) return null;
    const [run] = await db
      .select()
      .from(prospectScanRuns)
      .where(eq(prospectScanRuns.requestId, request.id))
      .orderBy(desc(prospectScanRuns.createdAt))
      .limit(1);
    if (!run) return null;
    return { request, run };
  }

  async create(input: NormalizedScanInput) {
    const token = randomBytes(24).toString("base64url");
    const createdAt = this.now();
    const expiresAt = new Date(createdAt.getTime() + this.ttlMs);
    await getDb().transaction(async (tx) => {
      const [request] = await tx
        .insert(prospectScanRequests)
        .values({
          tokenHash: hashToken(token),
          normalizedUrl: input.normalizedUrl,
          domain: input.domain,
          locale: input.locale,
          countryCode: input.countryCode,
          maxPages: Math.min(10, getServerEnv().VISIBILITY_SCAN_MAX_PAGES),
          status: "queued",
          expiresAt,
        })
        .returning({ id: prospectScanRequests.id });
      if (!request) throw new Error("Failed to create prospect scan request.");
      await tx.insert(prospectScanRuns).values({
        requestId: request.id,
        status: "queued",
        progress: 0,
        currentStep: "في انتظار بدء الفحص",
        methodologyVersion: SITE_READINESS_METHODOLOGY_VERSION,
        config: { locale: input.locale, countryCode: input.countryCode },
      });
    });
    return {
      token,
      input,
      status: "queued" as const,
      progress: 0,
      currentStep: "في انتظار بدء الفحص",
      createdAt: createdAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };
  }

  async get(token: string) {
    const rows = await this.rowsForToken(token);
    if (!rows) return null;
    const [snapshot] = await getDb()
      .select({ executiveSummary: prospectReportSnapshots.executiveSummary })
      .from(prospectReportSnapshots)
      .where(eq(prospectReportSnapshots.runId, rows.run.id))
      .limit(1);
    const status = rows.run.status === "expired" ? "failed" : rows.run.status;
    return {
      token,
      input: {
        domain: rows.request.domain,
        normalizedUrl: rows.request.normalizedUrl,
        locale: rows.request.locale,
        countryCode: rows.request.countryCode,
      },
      status,
      progress: rows.run.progress,
      currentStep: rows.run.currentStep,
      ...(rows.run.attemptId ? { attemptId: rows.run.attemptId } : {}),
      ...(rows.run.leaseExpiresAt
        ? { leaseExpiresAt: rows.run.leaseExpiresAt.toISOString() }
        : {}),
      ...(rows.run.errorCode && rows.run.errorMessage
        ? { error: { code: rows.run.errorCode, message: rows.run.errorMessage } }
        : {}),
      ...(snapshot ? { report: reportFromSnapshot(snapshot.executiveSummary) } : {}),
      createdAt: rows.request.createdAt.toISOString(),
      expiresAt: rows.request.expiresAt.toISOString(),
    } satisfies VisibilityScanRecord;
  }

  async updateProgress(token: string, progress: number, currentStep: string, attemptId?: string) {
    const rows = await this.rowsForToken(token);
    if (!rows || rows.run.status === "completed" || rows.run.status === "failed") return null;
    const boundedProgress = Math.max(rows.run.progress, Math.min(99, Math.round(progress)));
    const updatedAt = this.now();
    const updated = await getDb().transaction(async (tx) => {
      const [run] = await tx
        .update(prospectScanRuns)
        .set({
          status: "running",
          progress: boundedProgress,
          currentStep,
          startedAt: rows.run.startedAt ?? this.now(),
          leaseExpiresAt: new Date(updatedAt.getTime() + scanClaimLeaseMs),
        })
        .where(
          and(
            eq(prospectScanRuns.id, rows.run.id),
            eq(prospectScanRuns.status, "running"),
            ...(attemptId ? [eq(prospectScanRuns.attemptId, attemptId)] : []),
          ),
        )
        .returning({ id: prospectScanRuns.id });
      if (!run) return false;
      await tx
        .update(prospectScanRequests)
        .set({ status: "running", updatedAt })
        .where(eq(prospectScanRequests.id, rows.request.id));
      return true;
    });
    if (!updated) return null;
    return this.get(token);
  }

  async tryStart(token: string) {
    const rows = await this.rowsForToken(token);
    if (!rows || !["queued", "running"].includes(rows.run.status)) return null;
    const claimedAt = this.now();
    const attemptId = randomUUID();
    const claimed = await getDb().transaction(async (tx) => {
      const [run] = await tx
        .update(prospectScanRuns)
        .set({
          status: "running",
          progress: Math.max(3, rows.run.progress),
          currentStep: "بدء الفحص الآمن للموقع",
          startedAt: claimedAt,
          attemptId,
          leaseExpiresAt: new Date(claimedAt.getTime() + scanClaimLeaseMs),
          errorCode: null,
          errorMessage: null,
        })
        .where(
          and(
            eq(prospectScanRuns.id, rows.run.id),
            or(
              eq(prospectScanRuns.status, "queued"),
              and(
                eq(prospectScanRuns.status, "running"),
                or(
                  isNull(prospectScanRuns.leaseExpiresAt),
                  lte(prospectScanRuns.leaseExpiresAt, claimedAt),
                ),
              ),
            ),
          ),
        )
        .returning({ id: prospectScanRuns.id });
      if (!run) return null;
      await tx
        .update(prospectScanRequests)
        .set({ status: "running", updatedAt: claimedAt })
        .where(eq(prospectScanRequests.id, rows.request.id));
      return run;
    });
    if (!claimed) return null;
    return this.get(token);
  }

  async requeue(token: string, error: { code: string; message: string }, attemptId?: string) {
    const rows = await this.rowsForToken(token);
    if (!rows || rows.run.status === "completed" || rows.run.status === "failed") return null;
    const updated = await getDb().transaction(async (tx) => {
      const [run] = await tx
        .update(prospectScanRuns)
        .set({
          status: "queued",
          currentStep: "سيعاد الفحص بعد تعذر مؤقت",
          errorCode: error.code,
          errorMessage: error.message,
          attemptId: null,
          leaseExpiresAt: null,
        })
        .where(
          and(
            eq(prospectScanRuns.id, rows.run.id),
            eq(prospectScanRuns.status, "running"),
            ...(attemptId ? [eq(prospectScanRuns.attemptId, attemptId)] : []),
          ),
        )
        .returning({ id: prospectScanRuns.id });
      if (!run) return false;
      await tx
        .update(prospectScanRequests)
        .set({ status: "queued", updatedAt: this.now() })
        .where(eq(prospectScanRequests.id, rows.request.id));
      return true;
    });
    if (!updated) return null;
    return this.get(token);
  }

  async complete(token: string, report: VisibilityScanReport, crawl?: CrawlResult, attemptId?: string) {
    const rows = await this.rowsForToken(token);
    if (!rows) return null;
    const db = getDb();
    const completed = await db.transaction(async (tx) => {
      if (attemptId) {
        const [lease] = await tx
          .update(prospectScanRuns)
          .set({ leaseExpiresAt: new Date(this.now().getTime() + scanClaimLeaseMs) })
          .where(
            and(
              eq(prospectScanRuns.id, rows.run.id),
              eq(prospectScanRuns.status, "running"),
              eq(prospectScanRuns.attemptId, attemptId),
            ),
          )
          .returning({ id: prospectScanRuns.id });
        if (!lease) return false;
      }
      const pageIds = new Map<string, string>();
      if (crawl?.pages.length) {
        const insertedPages = await tx
          .insert(prospectScanPages)
          .values(
            crawl.pages.map((page) => ({
              runId: rows.run.id,
              url: page.url,
              canonicalUrl: page.canonical,
              httpStatus: page.statusCode,
              contentType: page.contentType,
              title: page.title,
              detectedLocale: page.language,
              contentHash: page.checksum,
              bytesRead:
                page.bytesRead ?? new TextEncoder().encode(page.visibleText).byteLength,
              durationMs: page.durationMs,
              evidence: {
                wordCount: page.wordCount,
                h1Count: page.h1Count,
                jsonLdTypes: page.jsonLdTypes,
                hreflangLocales: page.hreflangLocales ?? [],
                robotsDirectives: page.robotsDirectives ?? [],
              },
              fetchedAt: new Date(crawl.scannedAt),
            })),
          )
          .returning({ id: prospectScanPages.id, url: prospectScanPages.url });
        insertedPages.forEach((page) => pageIds.set(page.url, page.id));
      }
      if (report.evidence.length) {
        const pagesByUrl = new Map(crawl?.pages.map((page) => [page.url, page]) ?? []);
        await tx.insert(prospectScanEvidence).values(
          report.evidence.map((evidence) => {
            const sourceUrl = evidence.urls[0];
            return {
              runId: rows.run.id,
              pageId: sourceUrl ? pageIds.get(sourceUrl) : undefined,
              category: evidence.component,
              key: evidence.checkKey,
              status: evidence.status,
              value: evidence.message,
              sourceUrl,
              checksum: sourceUrl ? pagesByUrl.get(sourceUrl)?.checksum : undefined,
            };
          }),
        );
      }
      const evidenceById = new Map(report.evidence.map((evidence) => [evidence.id, evidence]));
      if (report.findings.length) {
        await tx.insert(prospectScanFindings).values(
          report.findings.map((finding) => {
            const sourceUrl = evidenceById.get(finding.evidenceIds[0] ?? "")?.urls[0];
            return {
              runId: rows.run.id,
              pageId: sourceUrl ? pageIds.get(sourceUrl) : undefined,
              code: finding.id,
              category: finding.component,
              severity: finding.severity,
              title: finding.title,
              description: finding.description,
              evidence: { ids: finding.evidenceIds },
              recommendedFix: finding.recommendation,
              confidenceBps: report.confidence * 100,
              effort: finding.severity === "high" ? "high" : finding.severity === "medium" ? "medium" : "low",
              suggestedOwner: "marketing",
            };
          }),
        );
      }
      await tx.insert(prospectReportSnapshots).values({
        requestId: rows.request.id,
        runId: rows.run.id,
        shareTokenHash: hashToken(`report:${token}`),
        accessLevel: "preview",
        overallScore: report.score,
        coverageBps: report.coverage * 100,
        confidenceBps: report.confidence * 100,
        methodologyVersion: SITE_READINESS_METHODOLOGY_VERSION,
        components: report.components as unknown as JsonValue,
        executiveSummary: { report: report as unknown as JsonValue },
        expiresAt: rows.request.expiresAt,
      });
      await tx
        .update(prospectScanRuns)
        .set({
          status: "completed",
          progress: 100,
          currentStep: "اكتمل الفحص",
          pagesDiscovered: Math.max(crawl?.sitemap.urlsDiscovered ?? report.pagesScanned, report.pagesScanned),
          pagesScanned: report.pagesScanned,
          completedAt: this.now(),
          attemptId: null,
          leaseExpiresAt: null,
        })
        .where(
          and(
            eq(prospectScanRuns.id, rows.run.id),
            ...(attemptId ? [eq(prospectScanRuns.attemptId, attemptId)] : []),
          ),
        );
      await tx
        .update(prospectScanRequests)
        .set({ status: "completed", updatedAt: this.now() })
        .where(eq(prospectScanRequests.id, rows.request.id));
      return true;
    });
    if (!completed) return null;
    return this.get(token);
  }

  async fail(token: string, error: { code: string; message: string }, attemptId?: string) {
    const rows = await this.rowsForToken(token);
    if (!rows) return null;
    const updated = await getDb().transaction(async (tx) => {
      const [run] = await tx
        .update(prospectScanRuns)
        .set({
          status: "failed",
          currentStep: "تعذر إكمال الفحص",
          errorCode: error.code,
          errorMessage: error.message,
          completedAt: this.now(),
          attemptId: null,
          leaseExpiresAt: null,
        })
        .where(
          and(
            eq(prospectScanRuns.id, rows.run.id),
            ...(attemptId ? [eq(prospectScanRuns.attemptId, attemptId)] : []),
          ),
        )
        .returning({ id: prospectScanRuns.id });
      if (!run) return false;
      await tx
        .update(prospectScanRequests)
        .set({ status: "failed", updatedAt: this.now() })
        .where(eq(prospectScanRequests.id, rows.request.id));
      return true;
    });
    if (!updated) return null;
    return this.get(token);
  }
}

const repositoryKey = Symbol.for("basirah.visibility-scanner.demo-repository");

export function getVisibilityScanRepository(): VisibilityScanRepository {
  const scope = globalThis as unknown as Record<symbol, VisibilityScanRepository | undefined>;
  scope[repositoryKey] ??= isDemoMode()
    ? new InMemoryVisibilityScanRepository()
    : new PostgresVisibilityScanRepository();
  return scope[repositoryKey];
}
