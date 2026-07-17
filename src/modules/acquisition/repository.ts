import "server-only";

import { randomUUID } from "node:crypto";

import {
  and,
  eq,
  inArray,
  isNull,
  lte,
  notExists,
  or,
} from "drizzle-orm";
import { z } from "zod";

import { getServerEnv, isDemoMode } from "@/config/env";
import { getDb } from "@/db/client";
import {
  aiVisibilityScoreComponents,
  aiVisibilityScores,
  auditFindings,
  leadConsents,
  pageAudits,
  prospectReportAccess,
  prospectReportSnapshots,
  prospectScanEvidence,
  prospectScanFindings,
  prospectScanPages,
  prospectScanRequests,
  prospectScanRuns,
  reportOrders,
  storePages,
  stores,
  type JsonObject,
  type JsonValue,
} from "@/db/schema";
import { getVisibilityScanRepository } from "@/modules/visibility/scanner";
import { recordProductEvent } from "@/lib/telemetry/record";
import { telemetryOpaqueId } from "@/lib/telemetry/opaque-id";
import type {
  VisibilityScanRecord,
  VisibilityScanReport,
} from "@/modules/visibility/scanner/types";

import { AcquisitionError } from "./errors";
import { storedVisibilityReportSchema } from "./schemas";
import {
  deriveShareToken,
  encryptContactField,
  encryptLeadEmail,
  hashEmail,
  hashOpaqueToken,
  normalizeEmail,
  normalizePhone,
} from "./security";
import type {
  ClaimScanInput,
  CreateReportOrderInput,
  PublicSharedReportDto,
  ReportAccessLevel,
  ReportOrderDto,
  SaveLeadInput,
  SavedLeadDto,
  ScanClaimDto,
} from "./types";
import {
  getDemoSharedTenantReport,
  registerClaimedDemoReport,
} from "@/modules/reports/tenant-reports";

const demoKey = "basirah-demo-only-acquisition-key-v1";
const uuidSchema = z.string().uuid();
const unpaidOrderRetentionMs = 30 * 24 * 60 * 60 * 1_000;
const freeReportRetentionMs = 30 * 24 * 60 * 60 * 1_000;

type Awaitable<T> = T | Promise<T>;
type ScanResolver = (token: string) => Awaitable<VisibilityScanRecord | null>;

export interface AcquisitionRepository {
  saveLead(input: SaveLeadInput): Promise<SavedLeadDto>;
  createReportOrder(input: CreateReportOrderInput): Promise<ReportOrderDto>;
  claimScan(input: ClaimScanInput): Promise<ScanClaimDto>;
  getSharedReport(shareToken: string): Promise<PublicSharedReportDto | null>;
  purgeExpiredAnonymousScans(limit: number): Promise<number>;
}

function orderDto(id: string, locale: "ar" | "en"): ReportOrderDto {
  return {
    id,
    status: "pending_payment",
    amount: 399,
    amountMinor: 39_900,
    currency: "SAR",
    taxIncluded: false,
    message:
      locale === "ar"
        ? "تم إنشاء الطلب بحالة انتظار الدفع. سيرسل الفريق رابط دفع أو فاتورة منفصلة."
        : "The order is pending payment. The team will send a separate payment link or invoice.",
  };
}

function publicReport(
  report: VisibilityScanReport,
  accessLevel: ReportAccessLevel,
  expiresAt: Date,
): PublicSharedReportDto {
  return {
    report: {
      domain: report.domain,
      score: report.score,
      coverage: report.coverage,
      confidence: report.confidence,
      components: report.components,
      findings: accessLevel === "full" ? report.findings : report.findings.slice(0, 3),
      evidence: accessLevel === "full" ? report.evidence : [],
      ...(accessLevel === "full" && report.organicGrowthPlan
        ? { organicGrowthPlan: report.organicGrowthPlan }
        : {}),
      limitations: report.limitations,
      scannedAt: report.scannedAt,
      pagesScanned: report.pagesScanned,
    },
    accessLevel,
    expiresAt: expiresAt.toISOString(),
  };
}

function parseStoredReport(summary: JsonObject) {
  const parsed = storedVisibilityReportSchema.safeParse(summary.report);
  if (!parsed.success) {
    throw new AcquisitionError(
      "ACQUISITION_UNAVAILABLE",
      500,
      "تعذر قراءة نسخة التقرير المحفوظة.",
    );
  }
  return parsed.data as VisibilityScanReport;
}

function tenantLocale(value: string | null, fallback: "ar" | "en") {
  if (value?.toLowerCase().startsWith("ar")) return "ar" as const;
  if (value?.toLowerCase().startsWith("en")) return "en" as const;
  return fallback;
}

function tenantPageType(url: string) {
  const pathname = new URL(url).pathname.toLowerCase();
  if (pathname === "/") return "home";
  if (/\/(?:products?|p)\//u.test(pathname)) return "product";
  if (/(?:privacy|terms|returns?|refund|shipping)/u.test(pathname)) return "policy";
  return "page";
}

interface MemoryShare {
  report: VisibilityScanReport;
  accessLevel: ReportAccessLevel;
  expiresAt: Date;
  revokedAt: Date | null;
  scanTokenHash: string;
}

export class InMemoryAcquisitionRepository implements AcquisitionRepository {
  private readonly shares = new Map<string, MemoryShare>();
  private readonly claims = new Map<string, { storeId: string; userId: string; reportId: string }>();
  private readonly orderedScanHashes = new Set<string>();

  constructor(
    private readonly scanResolver: ScanResolver = (token) =>
      getVisibilityScanRepository().get(token),
    private readonly now: () => Date = () => new Date(),
    private readonly keyMaterial = demoKey,
  ) {}

  private async completedScan(token: string) {
    const record = await this.scanResolver(token);
    if (!record) {
      throw new AcquisitionError("SCAN_NOT_FOUND", 404, "لم يعد هذا الفحص متاحًا.");
    }
    if (new Date(record.expiresAt).getTime() <= this.now().getTime()) {
      throw new AcquisitionError("REPORT_EXPIRED", 410, "انتهت صلاحية هذا الفحص.");
    }
    if (record.status !== "completed" || !record.report) {
      throw new AcquisitionError("SCAN_NOT_READY", 409, "يجب اكتمال الفحص قبل متابعة الطلب.");
    }
    return { ...record, report: record.report };
  }

  async saveLead(input: SaveLeadInput) {
    const record = await this.completedScan(input.scanToken);
    const shareToken = deriveShareToken(input.scanToken, this.keyMaterial);
    const expiresAt = new Date(
      Math.max(
        new Date(record.expiresAt).getTime(),
        this.now().getTime() + freeReportRetentionMs,
      ),
    );
    this.shares.set(hashOpaqueToken(shareToken), {
      report: structuredClone(record.report),
      accessLevel: "full",
      expiresAt,
      revokedAt: null,
      scanTokenHash: hashOpaqueToken(input.scanToken),
    });
    // Demo state intentionally stores only a keyed digest, never the address.
    hashEmail(input.email, this.keyMaterial);
    recordProductEvent({
      type: "report_unlocked",
      source: "public_checker",
      reportId: telemetryOpaqueId("report", shareToken),
      entitlement: "deep_report",
    });
    return {
      saved: true,
      shareToken,
      sharePath: `/${input.locale}/report/${shareToken}`,
      marketingConsent: input.marketingConsent,
    } satisfies SavedLeadDto;
  }

  private async resolveMemoryReport(identifier: string) {
    const directShare = this.shares.get(hashOpaqueToken(identifier));
    if (directShare) {
      if (directShare.revokedAt) {
        throw new AcquisitionError("REPORT_REVOKED", 410, "تم إبطال رابط هذا التقرير.");
      }
      if (directShare.expiresAt.getTime() <= this.now().getTime()) {
        throw new AcquisitionError("REPORT_EXPIRED", 410, "انتهت صلاحية هذا التقرير.");
      }
      return directShare;
    }

    const scanToken = identifier.startsWith("report:")
      ? identifier.slice("report:".length)
      : identifier;
    const record = await this.completedScan(scanToken);
    return {
      report: record.report,
      accessLevel: "preview" as const,
      expiresAt: new Date(record.expiresAt),
      revokedAt: null,
      scanTokenHash: hashOpaqueToken(scanToken),
    };
  }

  async createReportOrder(input: CreateReportOrderInput) {
    const report = await this.resolveMemoryReport(input.reportIdentifier);
    this.orderedScanHashes.add(report.scanTokenHash);
    // Demo state deliberately does not retain the buyer's contact fields.
    hashEmail(input.email, this.keyMaterial);
    const order = orderDto(randomUUID(), input.locale);
    recordProductEvent({
      type: "report_order_created",
      source: "public_checker",
      reportId: telemetryOpaqueId("report", input.reportIdentifier),
      orderId: order.id,
      amountMinor: order.amountMinor,
      currency: order.currency,
      orderStatus: order.status,
    });
    return order;
  }

  async claimScan(input: ClaimScanInput) {
    const record = await this.completedScan(input.scanToken);
    const tokenHash = hashOpaqueToken(input.scanToken);
    const existing = this.claims.get(tokenHash);
    if (existing && existing.storeId !== input.storeId) {
      throw new AcquisitionError(
        "SCAN_ALREADY_CLAIMED",
        409,
        "تمت المطالبة بهذا الفحص من مساحة متجر أخرى.",
      );
    }
    if (existing) {
      return {
        claimed: true,
        alreadyClaimed: true,
        storeId: existing.storeId,
        reportId: existing.reportId,
        claimMode: "copied",
        accessLevel: "full",
      } satisfies ScanClaimDto;
    }

    const reportId = `demo_report_${randomUUID()}`;
    const claimedExpiresAt = new Date(
      Math.max(
        new Date(record.expiresAt).getTime(),
        this.now().getTime() + 365 * 24 * 60 * 60 * 1_000,
      ),
    );
    this.claims.set(tokenHash, { storeId: input.storeId, userId: input.userId, reportId });
    registerClaimedDemoReport({
      id: reportId,
      storeId: input.storeId,
      report: record.report,
      // Demo mirrors the default tenant retention policy instead of leaving a
      // claimed report on the seven-day anonymous lifetime.
      expiresAt: claimedExpiresAt,
      accessLevel: "full",
    });
    return {
      claimed: true,
      alreadyClaimed: false,
      storeId: input.storeId,
      reportId,
      claimMode: "copied",
      accessLevel: "full",
    } satisfies ScanClaimDto;
  }

  async getSharedReport(shareToken: string) {
    const tenantShare = getDemoSharedTenantReport(shareToken);
    if (tenantShare) return tenantShare;
    try {
      const resolved = await this.resolveMemoryReport(shareToken);
      return publicReport(resolved.report, resolved.accessLevel, resolved.expiresAt);
    } catch (error) {
      if (
        error instanceof AcquisitionError &&
        (error.code === "SCAN_NOT_FOUND" || error.code === "REPORT_EXPIRED")
      ) {
        return null;
      }
      throw error;
    }
  }

  async purgeExpiredAnonymousScans(limit: number) {
    let purged = 0;
    for (const [shareHash, share] of this.shares) {
      if (purged >= limit) break;
      if (
        share.expiresAt.getTime() <= this.now().getTime() &&
        !this.claims.has(share.scanTokenHash) &&
        !this.orderedScanHashes.has(share.scanTokenHash)
      ) {
        this.shares.delete(shareHash);
        purged += 1;
      }
    }
    return purged;
  }

  /** Test/admin seam for the same revoked-at behavior enforced by Postgres. */
  revokeShare(shareToken: string) {
    const share = this.shares.get(hashOpaqueToken(shareToken));
    if (share) share.revokedAt = this.now();
  }
}

interface PersistedReport {
  requestId: string;
  requestStatus: "queued" | "running" | "completed" | "failed" | "expired";
  requestExpiresAt: Date;
  reportId: string;
  reportExpiresAt: Date;
  revokedAt: Date | null;
  accessLevel: ReportAccessLevel;
  executiveSummary: JsonObject;
}

export class PostgresAcquisitionRepository implements AcquisitionRepository {
  private readonly keyMaterial: string;

  constructor(private readonly now: () => Date = () => new Date()) {
    const key = getServerEnv().TOKEN_ENCRYPTION_KEY;
    if (!key) throw new Error("TOKEN_ENCRYPTION_KEY is required for acquisition data.");
    this.keyMaterial = key;
  }

  private reportSelection() {
    return {
      requestId: prospectScanRequests.id,
      requestStatus: prospectScanRequests.status,
      requestExpiresAt: prospectScanRequests.expiresAt,
      reportId: prospectReportSnapshots.id,
      reportExpiresAt: prospectReportSnapshots.expiresAt,
      revokedAt: prospectReportSnapshots.revokedAt,
      accessLevel: prospectReportSnapshots.accessLevel,
      executiveSummary: prospectReportSnapshots.executiveSummary,
    };
  }

  private assertUsable(
    row: PersistedReport,
    notFoundCode: "SCAN_NOT_FOUND" | "REPORT_NOT_FOUND",
    requireActiveShare = false,
  ) {
    if (row.requestExpiresAt.getTime() <= this.now().getTime() || row.reportExpiresAt.getTime() <= this.now().getTime()) {
      throw new AcquisitionError("REPORT_EXPIRED", 410, "انتهت صلاحية هذا التقرير.");
    }
    if (requireActiveShare && row.revokedAt) {
      throw new AcquisitionError("REPORT_REVOKED", 410, "تم إبطال رابط هذا التقرير.");
    }
    if (row.requestStatus !== "completed") {
      throw new AcquisitionError(
        notFoundCode === "SCAN_NOT_FOUND" ? "SCAN_NOT_READY" : "REPORT_NOT_FOUND",
        notFoundCode === "SCAN_NOT_FOUND" ? 409 : 404,
        notFoundCode === "SCAN_NOT_FOUND"
          ? "يجب اكتمال الفحص قبل متابعة الطلب."
          : "لم يتم العثور على التقرير.",
      );
    }
    return row;
  }

  private async scanReport(scanToken: string) {
    const [row] = await getDb()
      .select(this.reportSelection())
      .from(prospectScanRequests)
      .innerJoin(
        prospectReportSnapshots,
        eq(prospectReportSnapshots.requestId, prospectScanRequests.id),
      )
      .where(eq(prospectScanRequests.tokenHash, hashOpaqueToken(scanToken)))
      .limit(1);
    if (!row) {
      throw new AcquisitionError("SCAN_NOT_FOUND", 404, "لم يعد هذا الفحص متاحًا.");
    }
    return this.assertUsable(row, "SCAN_NOT_FOUND");
  }

  private async reportByIdentifier(identifier: string) {
    const identifierHash = hashOpaqueToken(identifier);
    const prefixedHash = hashOpaqueToken(`report:${identifier}`);
    const identifierIsUuid = uuidSchema.safeParse(identifier).success;
    const [row] = await getDb()
      .select(this.reportSelection())
      .from(prospectReportSnapshots)
      .innerJoin(
        prospectScanRequests,
        eq(prospectScanRequests.id, prospectReportSnapshots.requestId),
      )
      .where(
        or(
          eq(prospectScanRequests.tokenHash, identifierHash),
          eq(prospectReportSnapshots.shareTokenHash, identifierHash),
          eq(prospectReportSnapshots.shareTokenHash, prefixedHash),
          ...(identifierIsUuid ? [eq(prospectReportSnapshots.id, identifier)] : []),
        ),
      )
      .limit(1);
    if (!row) {
      throw new AcquisitionError("REPORT_NOT_FOUND", 404, "لم يتم العثور على التقرير.");
    }
    return this.assertUsable(row, "REPORT_NOT_FOUND");
  }

  private async reportByShareToken(shareToken: string) {
    const [row] = await getDb()
      .select(this.reportSelection())
      .from(prospectReportSnapshots)
      .innerJoin(
        prospectScanRequests,
        eq(prospectScanRequests.id, prospectReportSnapshots.requestId),
      )
      .where(
        or(
          eq(prospectReportSnapshots.shareTokenHash, hashOpaqueToken(shareToken)),
          // Compatibility with the scanner's initial `report:<scan token>` digest.
          eq(prospectReportSnapshots.shareTokenHash, hashOpaqueToken(`report:${shareToken}`)),
        ),
      )
      .limit(1);
    if (!row) return null;
    return this.assertUsable(row, "REPORT_NOT_FOUND", true);
  }

  async saveLead(input: SaveLeadInput) {
    const report = await this.scanReport(input.scanToken);
    const normalizedEmail = normalizeEmail(input.email);
    const emailDigest = hashEmail(normalizedEmail, this.keyMaterial);
    const shareToken = deriveShareToken(input.scanToken, this.keyMaterial);
    const leadConsentId = randomUUID();
    const now = this.now();
    const expiresAt = new Date(
      Math.max(
        report.reportExpiresAt.getTime(),
        now.getTime() + freeReportRetentionMs,
      ),
    );
    await getDb().transaction(async (tx) => {
      await tx
        .update(prospectReportSnapshots)
        .set({
          shareTokenHash: hashOpaqueToken(shareToken),
          accessLevel: "full",
          expiresAt,
          revokedAt: null,
        })
        .where(eq(prospectReportSnapshots.id, report.reportId));

      await tx
        .update(prospectScanRequests)
        .set({ expiresAt, updatedAt: now })
        .where(eq(prospectScanRequests.id, report.requestId));

      const [existingAccess] = await tx
        .select({ id: prospectReportAccess.id })
        .from(prospectReportAccess)
        .where(
          and(
            eq(prospectReportAccess.reportId, report.reportId),
            eq(prospectReportAccess.granteeEmailHash, emailDigest),
            isNull(prospectReportAccess.revokedAt),
          ),
        )
        .limit(1);
      if (!existingAccess) {
        await tx.insert(prospectReportAccess).values({
          reportId: report.reportId,
          accessLevel: "full",
          granteeEmailHash: emailDigest,
          expiresAt,
        });
      } else {
        await tx
          .update(prospectReportAccess)
          .set({ accessLevel: "full", expiresAt })
          .where(eq(prospectReportAccess.id, existingAccess.id));
      }
      await tx.insert(leadConsents).values({
        id: leadConsentId,
        requestId: report.requestId,
        emailHash: emailDigest,
        emailEncrypted: encryptLeadEmail({
          value: normalizedEmail,
          keyMaterial: this.keyMaterial,
          consentId: leadConsentId,
        }),
        marketingGranted: input.marketingConsent,
        source: "free_report_unlock",
      });
    });
    recordProductEvent({
      type: "report_unlocked",
      source: "public_checker",
      reportId: report.reportId,
      entitlement: "deep_report",
    });
    return {
      saved: true,
      shareToken,
      sharePath: `/${input.locale}/report/${shareToken}`,
      marketingConsent: input.marketingConsent,
    } satisfies SavedLeadDto;
  }

  async createReportOrder(input: CreateReportOrderInput) {
    const report = await this.reportByIdentifier(input.reportIdentifier);
    const orderId = randomUUID();
    const normalizedEmail = normalizeEmail(input.email);
    const normalizedPhone = normalizePhone(input.phone);
    const emailDigest = hashEmail(normalizedEmail, this.keyMaterial);

    await getDb().transaction(async (tx) => {
      await tx.insert(reportOrders).values({
        id: orderId,
        reportId: report.reportId,
        status: "pending_payment",
        amountMinor: 39_900,
        currency: "SAR",
        buyerNameEncrypted: encryptContactField({
          value: input.name.trim().normalize("NFKC"),
          keyMaterial: this.keyMaterial,
          orderId,
          field: "name",
        }),
        buyerEmailEncrypted: encryptContactField({
          value: normalizedEmail,
          keyMaterial: this.keyMaterial,
          orderId,
          field: "email",
        }),
        buyerPhoneEncrypted: encryptContactField({
          value: normalizedPhone,
          keyMaterial: this.keyMaterial,
          orderId,
          field: "phone",
        }),
      });
      await tx.insert(leadConsents).values({
        requestId: report.requestId,
        reportOrderId: orderId,
        emailHash: emailDigest,
        marketingGranted: input.marketingConsent,
        source: "report_order",
      });
    });
    const order = orderDto(orderId, input.locale);
    recordProductEvent({
      type: "report_order_created",
      source: "public_checker",
      reportId: report.reportId,
      orderId,
      amountMinor: order.amountMinor,
      currency: order.currency,
      orderStatus: order.status,
    });
    return order;
  }

  async claimScan(input: ClaimScanInput) {
    const now = this.now();
    return getDb().transaction(async (tx) => {
      const [request] = await tx
        .select({
          id: prospectScanRequests.id,
          status: prospectScanRequests.status,
          domain: prospectScanRequests.domain,
          normalizedUrl: prospectScanRequests.normalizedUrl,
          locale: prospectScanRequests.locale,
          expiresAt: prospectScanRequests.expiresAt,
          claimedStoreId: prospectScanRequests.claimedStoreId,
          claimedByUserId: prospectScanRequests.claimedByUserId,
        })
        .from(prospectScanRequests)
        .where(eq(prospectScanRequests.tokenHash, hashOpaqueToken(input.scanToken)))
        .limit(1)
        .for("update");
      if (!request || request.expiresAt.getTime() <= now.getTime()) {
        throw new AcquisitionError("SCAN_NOT_FOUND", 404, "لم يعد هذا الفحص متاحًا.");
      }
      if (request.status !== "completed") {
        throw new AcquisitionError("SCAN_NOT_READY", 409, "يجب اكتمال الفحص قبل المطالبة به.");
      }
      if (request.claimedStoreId && request.claimedStoreId !== input.storeId) {
        throw new AcquisitionError(
          "SCAN_ALREADY_CLAIMED",
          409,
          "تمت المطالبة بهذا الفحص من مساحة متجر أخرى.",
        );
      }

      const [snapshot] = await tx
        .select({
          id: prospectReportSnapshots.id,
          runId: prospectReportSnapshots.runId,
          overallScore: prospectReportSnapshots.overallScore,
          coverageBps: prospectReportSnapshots.coverageBps,
          confidenceBps: prospectReportSnapshots.confidenceBps,
          methodologyVersion: prospectReportSnapshots.methodologyVersion,
          executiveSummary: prospectReportSnapshots.executiveSummary,
          generatedAt: prospectReportSnapshots.generatedAt,
          expiresAt: prospectReportSnapshots.expiresAt,
        })
        .from(prospectReportSnapshots)
        .where(eq(prospectReportSnapshots.requestId, request.id))
        .limit(1);
      if (!snapshot || snapshot.expiresAt.getTime() <= now.getTime()) {
        throw new AcquisitionError("REPORT_NOT_FOUND", 404, "لم يتم العثور على التقرير.");
      }

      const alreadyClaimed = request.claimedStoreId === input.storeId;
      const [storePolicy] = await tx
        .select({ dataRetentionDays: stores.dataRetentionDays })
        .from(stores)
        .where(eq(stores.id, input.storeId))
        .limit(1);
      if (!storePolicy) {
        throw new AcquisitionError("STORE_REQUIRED", 409, "لم يتم العثور على مساحة المتجر.");
      }

      const [existingScore] = await tx
        .select({ id: aiVisibilityScores.id })
        .from(aiVisibilityScores)
        .where(
          and(
            eq(aiVisibilityScores.storeId, input.storeId),
            eq(aiVisibilityScores.scoreType, "site_readiness"),
            eq(aiVisibilityScores.capturedAt, snapshot.generatedAt),
          ),
        )
        .limit(1);
      const needsCopy = !existingScore;
      const configuredExpiry = new Date(
        now.getTime() + storePolicy.dataRetentionDays * 24 * 60 * 60 * 1_000,
      );
      const retentionExpiresAt = needsCopy
        ? new Date(
            Math.max(
              configuredExpiry.getTime(),
              request.expiresAt.getTime(),
              snapshot.expiresAt.getTime(),
            ),
          )
        : new Date(Math.max(request.expiresAt.getTime(), snapshot.expiresAt.getTime()));

      if (needsCopy) {
        const report = parseStoredReport(snapshot.executiveSummary);
        const [run, sourcePages, sourceEvidence, sourceFindings] = await Promise.all([
          tx
            .select({
              startedAt: prospectScanRuns.startedAt,
              completedAt: prospectScanRuns.completedAt,
            })
            .from(prospectScanRuns)
            .where(eq(prospectScanRuns.id, snapshot.runId))
            .limit(1)
            .then((rows) => rows[0]),
          tx
            .select()
            .from(prospectScanPages)
            .where(eq(prospectScanPages.runId, snapshot.runId)),
          tx
            .select()
            .from(prospectScanEvidence)
            .where(eq(prospectScanEvidence.runId, snapshot.runId)),
          tx
            .select()
            .from(prospectScanFindings)
            .where(eq(prospectScanFindings.runId, snapshot.runId)),
        ]);
        if (!run) {
          throw new AcquisitionError(
            "ACQUISITION_UNAVAILABLE",
            500,
            "تعذر نسخ سجل الفحص إلى مساحة المتجر.",
          );
        }

        const auditBySourcePage = new Map<string, string>();
        let rootAuditId: string | undefined;
        const pagesToCopy = sourcePages.length
          ? sourcePages
          : [
              {
                id: `synthetic:${snapshot.id}`,
                url: request.normalizedUrl,
                canonicalUrl: request.normalizedUrl,
                httpStatus: null,
                contentType: null,
                title: request.domain,
                detectedLocale: request.locale,
                contentHash: null,
                bytesRead: 0,
                durationMs: null,
                evidence: {} as JsonObject,
                fetchedAt: snapshot.generatedAt,
                createdAt: snapshot.generatedAt,
                runId: snapshot.runId,
              },
            ];

        for (const [pageIndex, page] of pagesToCopy.entries()) {
          const metadata = {
            source: "prospect_scan_claim",
            sourceReportId: snapshot.id,
            prospectPageId: page.id,
            httpStatus: page.httpStatus,
            contentType: page.contentType,
            bytesRead: page.bytesRead,
            durationMs: page.durationMs,
            crawlEvidence: page.evidence,
          } satisfies JsonObject;
          const [insertedPage] = await tx
            .insert(storePages)
            .values({
              storeId: input.storeId,
              externalId: `prospect:${page.id}`,
              pageType: tenantPageType(page.url),
              url: page.url,
              canonicalUrl: page.canonicalUrl,
              locale: tenantLocale(page.detectedLocale, request.locale),
              title: page.title,
              indexable: page.httpStatus === 200,
              sourceVersion: page.contentHash,
              sourceUpdatedAt: page.fetchedAt,
              metadata,
            })
            .onConflictDoNothing({ target: [storePages.storeId, storePages.url] })
            .returning({ id: storePages.id });
          const tenantPage = insertedPage ??
            (
              await tx
                .select({ id: storePages.id })
                .from(storePages)
                .where(
                  and(
                    eq(storePages.storeId, input.storeId),
                    eq(storePages.url, page.url),
                  ),
                )
                .limit(1)
            )[0];
          if (!tenantPage) {
            throw new AcquisitionError(
              "ACQUISITION_UNAVAILABLE",
              500,
              "تعذر نسخ صفحات الفحص إلى مساحة المتجر.",
            );
          }

          const pageEvidence = sourceEvidence
            .filter(
              (evidence) =>
                evidence.pageId === page.id ||
                (pageIndex === 0 && evidence.pageId === null),
            )
            .map((evidence) => ({
              id: evidence.id,
              category: evidence.category,
              key: evidence.key,
              status: evidence.status,
              value: evidence.value,
              sourceUrl: evidence.sourceUrl,
              checksum: evidence.checksum,
              capturedAt: evidence.capturedAt.toISOString(),
            })) as JsonValue[];
          const [audit] = await tx
            .insert(pageAudits)
            .values({
              storeId: input.storeId,
              pageId: tenantPage.id,
              status: "succeeded",
              auditVersion: snapshot.methodologyVersion,
              evidence: {
                source: "prospect_scan_claim",
                sourceReportId: snapshot.id,
                prospectPageId: page.id,
                checks: pageEvidence,
              },
              startedAt: run.startedAt,
              completedAt: run.completedAt ?? snapshot.generatedAt,
            })
            .returning({ id: pageAudits.id });
          if (!audit) {
            throw new AcquisitionError(
              "ACQUISITION_UNAVAILABLE",
              500,
              "تعذر نسخ تدقيق الصفحات إلى مساحة المتجر.",
            );
          }
          auditBySourcePage.set(page.id, audit.id);
          if (pageIndex === 0) rootAuditId = audit.id;
        }

        if (!rootAuditId) {
          throw new AcquisitionError(
            "ACQUISITION_UNAVAILABLE",
            500,
            "تعذر إنشاء مرجع تدقيق للتقرير.",
          );
        }
        if (sourceFindings.length) {
          await tx.insert(auditFindings).values(
            sourceFindings.map((finding) => ({
              storeId: input.storeId,
              pageAuditId:
                (finding.pageId ? auditBySourcePage.get(finding.pageId) : undefined) ??
                rootAuditId,
              code: finding.code,
              category: finding.category,
              severity: finding.severity,
              title: finding.title,
              description: finding.description,
              evidence: {
                source: "prospect_scan_claim",
                sourceReportId: snapshot.id,
                sourceFindingId: finding.id,
                sourcePageId: finding.pageId,
                evidence: finding.evidence,
                effort: finding.effort,
                suggestedOwner: finding.suggestedOwner,
              },
              recommendedFix: finding.recommendedFix,
              confidenceBps: finding.confidenceBps,
            })),
          );
        }

        const [tenantScore] = await tx
          .insert(aiVisibilityScores)
          .values({
            storeId: input.storeId,
            scoreType: "site_readiness",
            overallScore: snapshot.overallScore,
            methodologyVersion: snapshot.methodologyVersion,
            evidenceCount: sourceEvidence.length,
            confidenceBps: snapshot.confidenceBps,
            explanation:
              `نسخة مطالَب بها من الفحص العام ${snapshot.id}. ` +
              `التغطية ${Math.round(snapshot.coverageBps / 100)}٪؛ القيم غير المتاحة لم تُحسب كفشل.`,
            capturedAt: snapshot.generatedAt,
          })
          .returning({ id: aiVisibilityScores.id });
        if (!tenantScore) {
          throw new AcquisitionError(
            "ACQUISITION_UNAVAILABLE",
            500,
            "تعذر حفظ درجة الجاهزية في مساحة المتجر.",
          );
        }
        const knownComponents = report.components.filter(
          (component): component is typeof component & { score: number } =>
            component.score !== null,
        );
        if (knownComponents.length) {
          await tx.insert(aiVisibilityScoreComponents).values(
            knownComponents.map((component) => ({
              storeId: input.storeId,
              scoreId: tenantScore.id,
              component: component.key,
              score: Math.round(component.score),
              weightBps: Math.round(component.weight * 100),
              evidence: {
                source: "prospect_scan_claim",
                sourceReportId: snapshot.id,
                label: component.label,
                coverage: component.coverage,
                evidenceIds: sourceEvidence
                  .filter((evidence) => evidence.category === component.key)
                  .map((evidence) => evidence.id),
              },
              recommendedFix: sourceFindings.find(
                (finding) => finding.category === component.key,
              )?.recommendedFix,
            })),
          );
        }
      }

      if (!alreadyClaimed) {
        await tx
          .update(prospectScanRequests)
          .set({
            claimedStoreId: input.storeId,
            claimedByUserId: input.userId,
            claimedAt: now,
            expiresAt: retentionExpiresAt,
            updatedAt: now,
          })
          .where(eq(prospectScanRequests.id, request.id));
      } else if (needsCopy) {
        await tx
          .update(prospectScanRequests)
          .set({ expiresAt: retentionExpiresAt, updatedAt: now })
          .where(eq(prospectScanRequests.id, request.id));
      }
      if (needsCopy) {
        await tx
          .update(prospectReportSnapshots)
          .set({ expiresAt: retentionExpiresAt })
          .where(eq(prospectReportSnapshots.id, snapshot.id));
      }

      const [storeAccess] = await tx
        .select({ id: prospectReportAccess.id })
        .from(prospectReportAccess)
        .where(
          and(
            eq(prospectReportAccess.reportId, snapshot.id),
            eq(prospectReportAccess.granteeStoreId, input.storeId),
            isNull(prospectReportAccess.revokedAt),
          ),
        )
        .limit(1);
      if (!storeAccess) {
        await tx.insert(prospectReportAccess).values({
          reportId: snapshot.id,
          accessLevel: "full",
          userId: input.userId,
          granteeStoreId: input.storeId,
          expiresAt: retentionExpiresAt,
        });
      } else {
        await tx
          .update(prospectReportAccess)
          .set({ accessLevel: "full", expiresAt: retentionExpiresAt })
          .where(eq(prospectReportAccess.id, storeAccess.id));
      }

      return {
        claimed: true,
        alreadyClaimed,
        storeId: input.storeId,
        reportId: snapshot.id,
        claimMode: "copied",
        accessLevel: "full",
      } satisfies ScanClaimDto;
    });
  }

  async getSharedReport(shareToken: string) {
    const row = await this.reportByShareToken(shareToken);
    if (!row) return null;
    return publicReport(
      parseStoredReport(row.executiveSummary),
      row.accessLevel,
      row.reportExpiresAt,
    );
  }

  async purgeExpiredAnonymousScans(limit: number) {
    const now = this.now();
    return getDb().transaction(async (tx) => {
      // Unpaid requests contain encrypted contact details but are not financial
      // records. Remove abandoned/cancelled requests after 30 days so a stale
      // order cannot pin an anonymous seven-day scan forever.
      const staleUnpaidOrders = await tx
        .select({ id: reportOrders.id })
        .from(reportOrders)
        .innerJoin(
          prospectReportSnapshots,
          eq(prospectReportSnapshots.id, reportOrders.reportId),
        )
        .innerJoin(
          prospectScanRequests,
          eq(prospectScanRequests.id, prospectReportSnapshots.requestId),
        )
        .where(
          and(
            inArray(reportOrders.status, ["pending_payment", "cancelled"]),
            isNull(reportOrders.paidAt),
            lte(reportOrders.createdAt, new Date(now.getTime() - unpaidOrderRetentionMs)),
            lte(prospectScanRequests.expiresAt, now),
            isNull(prospectScanRequests.claimedStoreId),
            isNull(prospectScanRequests.claimedByUserId),
          ),
        )
        .limit(limit)
        .for("update", { skipLocked: true });
      if (staleUnpaidOrders.length > 0) {
        await tx
          .delete(reportOrders)
          .where(inArray(reportOrders.id, staleUnpaidOrders.map((order) => order.id)));
      }

      const candidates = await tx
        .select({ id: prospectScanRequests.id })
        .from(prospectScanRequests)
        .where(
          and(
            lte(prospectScanRequests.expiresAt, now),
            isNull(prospectScanRequests.claimedStoreId),
            isNull(prospectScanRequests.claimedByUserId),
            notExists(
              tx
                .select({ id: reportOrders.id })
                .from(reportOrders)
                .innerJoin(
                  prospectReportSnapshots,
                  eq(prospectReportSnapshots.id, reportOrders.reportId),
                )
                .where(eq(prospectReportSnapshots.requestId, prospectScanRequests.id)),
            ),
          ),
        )
        .limit(limit)
        .for("update", { skipLocked: true });
      const requestIds = candidates.map((candidate) => candidate.id);
      if (requestIds.length === 0) return 0;

      const snapshots = await tx
        .select({ id: prospectReportSnapshots.id })
        .from(prospectReportSnapshots)
        .where(inArray(prospectReportSnapshots.requestId, requestIds));
      const reportIds = snapshots.map((snapshot) => snapshot.id);
      if (reportIds.length > 0) {
        await tx
          .delete(prospectReportAccess)
          .where(inArray(prospectReportAccess.reportId, reportIds));
        await tx
          .delete(prospectReportSnapshots)
          .where(inArray(prospectReportSnapshots.id, reportIds));
      }
      const deleted = await tx
        .delete(prospectScanRequests)
        .where(inArray(prospectScanRequests.id, requestIds))
        .returning({ id: prospectScanRequests.id });
      return deleted.length;
    });
  }
}

const repositoryKey = Symbol.for("basirah.acquisition.repository");

export function getAcquisitionRepository(): AcquisitionRepository {
  const scope = globalThis as unknown as Record<symbol, AcquisitionRepository | undefined>;
  scope[repositoryKey] ??= isDemoMode()
    ? new InMemoryAcquisitionRepository()
    : new PostgresAcquisitionRepository();
  return scope[repositoryKey];
}
