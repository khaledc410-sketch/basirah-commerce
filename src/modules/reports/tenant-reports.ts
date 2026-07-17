import "server-only";

import { randomBytes, randomUUID } from "node:crypto";

import { and, desc, eq, gt, inArray, isNull, or } from "drizzle-orm";

import { isDemoMode } from "@/config/env";
import { getDb } from "@/db/client";
import {
  prospectReportAccess,
  prospectReportSnapshots,
  prospectScanPages,
  prospectScanRequests,
} from "@/db/schema";
import { AcquisitionError } from "@/modules/acquisition/errors";
import { storedVisibilityReportSchema } from "@/modules/acquisition/schemas";
import { hashOpaqueToken } from "@/modules/acquisition/security";
import type {
  PublicSharedReportDto,
  ReportAccessLevel,
} from "@/modules/acquisition/types";
import {
  reportNarrativeSchema,
  type ArabicReportNarrative,
} from "@/modules/visibility/report-narrative";
import {
  SITE_READINESS_METHODOLOGY_VERSION,
  type VisibilityScanReport,
} from "@/modules/visibility/scanner/types";

export interface TenantReportListItemDto {
  id: string;
  domain: string;
  score: number;
  coverage: number;
  confidence: number;
  methodologyVersion: string;
  generatedAt: string;
  expiresAt: string;
  pagesScanned: number;
  findingsCount: number;
  accessLevel: ReportAccessLevel;
  shareActive: boolean;
}

export interface TenantReportDetailDto extends TenantReportListItemDto {
  components: VisibilityScanReport["components"];
  findings: VisibilityScanReport["findings"];
  evidence: VisibilityScanReport["evidence"];
  narrative: ArabicReportNarrative | null;
  limitations: string[];
  pages: Array<{
    url: string;
    canonicalUrl: string | null;
    title: string | null;
    httpStatus: number | null;
  }>;
}

export interface TenantReportShareDto {
  shareToken: string;
  sharePath: string;
  expiresAt: string;
}

export interface TenantReportRepository {
  list(storeId: string, limit: number): Promise<TenantReportListItemDto[]>;
  get(storeId: string, reportId: string): Promise<TenantReportDetailDto | null>;
  createShare(storeId: string, reportId: string, locale: "ar" | "en"): Promise<TenantReportShareDto>;
  revokeShare(storeId: string, reportId: string): Promise<{ revoked: true }>;
}

interface DemoTenantReport {
  id: string;
  storeId: string;
  report: VisibilityScanReport;
  methodologyVersion: string;
  generatedAt: Date;
  expiresAt: Date;
  accessLevel: ReportAccessLevel;
  shareTokenHash: string;
  shareRevokedAt: Date | null;
}

interface DemoTenantState {
  reports: Map<string, DemoTenantReport>;
  shareReportIds: Map<string, string>;
}

const demoStateKey = Symbol.for("basirah.tenant-reports.demo-state");

function globalDemoState(): DemoTenantState {
  const scope = globalThis as unknown as Record<symbol, DemoTenantState | undefined>;
  scope[demoStateKey] ??= { reports: new Map(), shareReportIds: new Map() };
  return scope[demoStateKey];
}

function parseReport(value: unknown) {
  const parsed = storedVisibilityReportSchema.safeParse(value);
  if (!parsed.success) {
    throw new AcquisitionError(
      "ACQUISITION_UNAVAILABLE",
      500,
      "تعذر قراءة نسخة التقرير المحفوظة.",
    );
  }
  return parsed.data as VisibilityScanReport;
}

function listDto(input: {
  id: string;
  report: VisibilityScanReport;
  methodologyVersion: string;
  generatedAt: Date;
  expiresAt: Date;
  accessLevel: ReportAccessLevel;
  shareActive: boolean;
}): TenantReportListItemDto {
  return {
    id: input.id,
    domain: input.report.domain,
    score: input.report.score,
    coverage: input.report.coverage,
    confidence: input.report.confidence,
    methodologyVersion: input.methodologyVersion,
    generatedAt: input.generatedAt.toISOString(),
    expiresAt: input.expiresAt.toISOString(),
    pagesScanned: input.report.pagesScanned,
    findingsCount: input.report.findings.length,
    accessLevel: input.accessLevel,
    shareActive: input.shareActive,
  };
}

function publicSharedReport(report: DemoTenantReport): PublicSharedReportDto {
  return {
    report: {
      domain: report.report.domain,
      score: report.report.score,
      coverage: report.report.coverage,
      confidence: report.report.confidence,
      components: report.report.components,
      findings:
        report.accessLevel === "full"
          ? report.report.findings
          : report.report.findings.slice(0, 3),
      evidence: report.accessLevel === "full" ? report.report.evidence : [],
      limitations: report.report.limitations,
      scannedAt: report.report.scannedAt,
      pagesScanned: report.report.pagesScanned,
    },
    accessLevel: report.accessLevel,
    expiresAt: report.expiresAt.toISOString(),
  };
}

export class InMemoryTenantReportRepository implements TenantReportRepository {
  constructor(
    private readonly state: DemoTenantState = globalDemoState(),
    private readonly now: () => Date = () => new Date(),
  ) {}

  register(input: Omit<DemoTenantReport, "shareTokenHash" | "shareRevokedAt">) {
    if (!this.state.reports.has(input.id)) {
      this.state.reports.set(input.id, {
        ...input,
        report: structuredClone(input.report),
        shareTokenHash: hashOpaqueToken(`unshared:${randomUUID()}`),
        shareRevokedAt: new Date(0),
      });
    }
  }

  async list(storeId: string, limit: number) {
    return [...this.state.reports.values()]
      .filter((report) => report.storeId === storeId)
      .sort((a, b) => b.generatedAt.getTime() - a.generatedAt.getTime())
      .slice(0, limit)
      .map((report) =>
        listDto({
          ...report,
          shareActive:
            !report.shareRevokedAt && report.expiresAt.getTime() > this.now().getTime(),
        }),
      );
  }

  async get(storeId: string, reportId: string) {
    const record = this.state.reports.get(reportId);
    if (!record || record.storeId !== storeId) return null;
    const summary = listDto({
      ...record,
      shareActive:
        !record.shareRevokedAt && record.expiresAt.getTime() > this.now().getTime(),
    });
    return {
      ...summary,
      components: structuredClone(record.report.components),
      findings: structuredClone(
        record.accessLevel === "full"
          ? record.report.findings
          : record.report.findings.slice(0, 3),
      ),
      evidence:
        record.accessLevel === "full" ? structuredClone(record.report.evidence) : [],
      narrative: null,
      limitations: structuredClone(record.report.limitations),
      pages: [],
    } satisfies TenantReportDetailDto;
  }

  async createShare(storeId: string, reportId: string, locale: "ar" | "en") {
    const record = this.state.reports.get(reportId);
    if (!record || record.storeId !== storeId) {
      throw new AcquisitionError("REPORT_NOT_FOUND", 404, "لم يتم العثور على التقرير.");
    }
    const token = randomBytes(32).toString("base64url");
    const tokenHash = hashOpaqueToken(token);
    if (record.shareTokenHash) this.state.shareReportIds.delete(record.shareTokenHash);
    record.shareTokenHash = tokenHash;
    record.shareRevokedAt = null;
    this.state.shareReportIds.set(tokenHash, record.id);
    return {
      shareToken: token,
      sharePath: `/${locale}/report/${token}`,
      expiresAt: record.expiresAt.toISOString(),
    } satisfies TenantReportShareDto;
  }

  async revokeShare(storeId: string, reportId: string) {
    const record = this.state.reports.get(reportId);
    if (!record || record.storeId !== storeId) {
      throw new AcquisitionError("REPORT_NOT_FOUND", 404, "لم يتم العثور على التقرير.");
    }
    this.state.shareReportIds.delete(record.shareTokenHash);
    record.shareTokenHash = hashOpaqueToken(`revoked:${randomUUID()}`);
    record.shareRevokedAt = this.now();
    return { revoked: true as const };
  }

  shared(shareToken: string) {
    const hash = hashOpaqueToken(shareToken);
    const reportId = this.state.shareReportIds.get(hash);
    if (!reportId) return null;
    const report = this.state.reports.get(reportId);
    if (
      !report ||
      report.shareTokenHash !== hash ||
      report.shareRevokedAt ||
      report.expiresAt.getTime() <= this.now().getTime()
    ) {
      return null;
    }
    return publicSharedReport(report);
  }
}

interface PersistedTenantReport {
  id: string;
  runId: string;
  domain: string;
  methodologyVersion: string;
  executiveSummary: Record<string, unknown>;
  snapshotAccessLevel: ReportAccessLevel;
  generatedAt: Date;
  expiresAt: Date;
  revokedAt: Date | null;
}

export class PostgresTenantReportRepository implements TenantReportRepository {
  constructor(private readonly now: () => Date = () => new Date()) {}

  private selection() {
    return {
      id: prospectReportSnapshots.id,
      runId: prospectReportSnapshots.runId,
      domain: prospectScanRequests.domain,
      methodologyVersion: prospectReportSnapshots.methodologyVersion,
      executiveSummary: prospectReportSnapshots.executiveSummary,
      snapshotAccessLevel: prospectReportSnapshots.accessLevel,
      generatedAt: prospectReportSnapshots.generatedAt,
      expiresAt: prospectReportSnapshots.expiresAt,
      revokedAt: prospectReportSnapshots.revokedAt,
    };
  }

  private async accessLevels(storeId: string, reports: PersistedTenantReport[]) {
    const reportIds = reports.map((report) => report.id);
    if (!reportIds.length) return new Map<string, ReportAccessLevel>();
    const grants = await getDb()
      .select({
        reportId: prospectReportAccess.reportId,
        accessLevel: prospectReportAccess.accessLevel,
      })
      .from(prospectReportAccess)
      .where(
        and(
          inArray(prospectReportAccess.reportId, reportIds),
          eq(prospectReportAccess.granteeStoreId, storeId),
          isNull(prospectReportAccess.revokedAt),
          or(
            isNull(prospectReportAccess.expiresAt),
            gt(prospectReportAccess.expiresAt, this.now()),
          ),
        ),
      );
    const levels = new Map<string, ReportAccessLevel>();
    for (const report of reports) levels.set(report.id, report.snapshotAccessLevel);
    for (const grant of grants) {
      if (grant.accessLevel === "full" || !levels.has(grant.reportId)) {
        levels.set(grant.reportId, grant.accessLevel);
      }
    }
    return levels;
  }

  private reportFromRow(row: PersistedTenantReport) {
    return parseReport(row.executiveSummary.report);
  }

  private narrativeFromRow(row: PersistedTenantReport) {
    const parsed = reportNarrativeSchema.safeParse(row.executiveSummary.narrative);
    return parsed.success ? parsed.data : null;
  }

  async list(storeId: string, limit: number) {
    const rows = await getDb()
      .select(this.selection())
      .from(prospectReportSnapshots)
      .innerJoin(
        prospectScanRequests,
        eq(prospectScanRequests.id, prospectReportSnapshots.requestId),
      )
      .where(eq(prospectScanRequests.claimedStoreId, storeId))
      .orderBy(desc(prospectReportSnapshots.generatedAt))
      .limit(limit);
    const levels = await this.accessLevels(storeId, rows);
    return rows.map((row) => {
      const report = this.reportFromRow(row);
      return listDto({
        id: row.id,
        report,
        methodologyVersion: row.methodologyVersion,
        generatedAt: row.generatedAt,
        expiresAt: row.expiresAt,
        accessLevel: levels.get(row.id) ?? "preview",
        shareActive: !row.revokedAt && row.expiresAt.getTime() > this.now().getTime(),
      });
    });
  }

  async get(storeId: string, reportId: string) {
    const [row] = await getDb()
      .select(this.selection())
      .from(prospectReportSnapshots)
      .innerJoin(
        prospectScanRequests,
        eq(prospectScanRequests.id, prospectReportSnapshots.requestId),
      )
      .where(
        and(
          eq(prospectReportSnapshots.id, reportId),
          eq(prospectScanRequests.claimedStoreId, storeId),
        ),
      )
      .limit(1);
    if (!row) return null;
    const [levels, pages] = await Promise.all([
      this.accessLevels(storeId, [row]),
      getDb()
        .select({
          url: prospectScanPages.url,
          canonicalUrl: prospectScanPages.canonicalUrl,
          title: prospectScanPages.title,
          httpStatus: prospectScanPages.httpStatus,
        })
        .from(prospectScanPages)
        .where(eq(prospectScanPages.runId, row.runId)),
    ]);
    const accessLevel = levels.get(row.id) ?? "preview";
    const report = this.reportFromRow(row);
    return {
      ...listDto({
        id: row.id,
        report,
        methodologyVersion: row.methodologyVersion,
        generatedAt: row.generatedAt,
        expiresAt: row.expiresAt,
        accessLevel,
        shareActive: !row.revokedAt && row.expiresAt.getTime() > this.now().getTime(),
      }),
      components: report.components,
      findings: accessLevel === "full" ? report.findings : report.findings.slice(0, 3),
      evidence: accessLevel === "full" ? report.evidence : [],
      narrative: accessLevel === "full" ? this.narrativeFromRow(row) : null,
      limitations: report.limitations,
      pages,
    } satisfies TenantReportDetailDto;
  }

  async createShare(storeId: string, reportId: string, locale: "ar" | "en") {
    const token = randomBytes(32).toString("base64url");
    const [updated] = await getDb()
      .update(prospectReportSnapshots)
      .set({ shareTokenHash: hashOpaqueToken(token), revokedAt: null })
      .where(
        and(
          eq(prospectReportSnapshots.id, reportId),
          gt(prospectReportSnapshots.expiresAt, this.now()),
          inArray(
            prospectReportSnapshots.requestId,
            getDb()
              .select({ id: prospectScanRequests.id })
              .from(prospectScanRequests)
              .where(eq(prospectScanRequests.claimedStoreId, storeId)),
          ),
        ),
      )
      .returning({ expiresAt: prospectReportSnapshots.expiresAt });
    if (!updated) {
      throw new AcquisitionError("REPORT_NOT_FOUND", 404, "لم يتم العثور على التقرير.");
    }
    return {
      shareToken: token,
      sharePath: `/${locale}/report/${token}`,
      expiresAt: updated.expiresAt.toISOString(),
    } satisfies TenantReportShareDto;
  }

  async revokeShare(storeId: string, reportId: string) {
    const [updated] = await getDb()
      .update(prospectReportSnapshots)
      .set({
        shareTokenHash: hashOpaqueToken(`revoked:${randomBytes(32).toString("base64url")}`),
        revokedAt: this.now(),
      })
      .where(
        and(
          eq(prospectReportSnapshots.id, reportId),
          inArray(
            prospectReportSnapshots.requestId,
            getDb()
              .select({ id: prospectScanRequests.id })
              .from(prospectScanRequests)
              .where(eq(prospectScanRequests.claimedStoreId, storeId)),
          ),
        ),
      )
      .returning({ id: prospectReportSnapshots.id });
    if (!updated) {
      throw new AcquisitionError("REPORT_NOT_FOUND", 404, "لم يتم العثور على التقرير.");
    }
    return { revoked: true as const };
  }
}

const repositoryKey = Symbol.for("basirah.tenant-reports.repository");

export function getTenantReportRepository(): TenantReportRepository {
  const scope = globalThis as unknown as Record<symbol, TenantReportRepository | undefined>;
  scope[repositoryKey] ??= isDemoMode()
    ? new InMemoryTenantReportRepository()
    : new PostgresTenantReportRepository();
  return scope[repositoryKey];
}

export function registerClaimedDemoReport(input: {
  id: string;
  storeId: string;
  report: VisibilityScanReport;
  expiresAt: Date;
  accessLevel?: ReportAccessLevel;
}) {
  const repository = getTenantReportRepository();
  if (repository instanceof InMemoryTenantReportRepository) {
    repository.register({
      id: input.id,
      storeId: input.storeId,
      report: input.report,
      methodologyVersion: SITE_READINESS_METHODOLOGY_VERSION,
      generatedAt: new Date(input.report.scannedAt),
      expiresAt: input.expiresAt,
      accessLevel: input.accessLevel ?? "full",
    });
  }
}

export function getDemoSharedTenantReport(shareToken: string) {
  const repository = getTenantReportRepository();
  return repository instanceof InMemoryTenantReportRepository
    ? repository.shared(shareToken)
    : null;
}
