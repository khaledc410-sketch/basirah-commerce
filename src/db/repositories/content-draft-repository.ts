import "server-only";

import { createHash } from "node:crypto";

import { and, desc, eq, or } from "drizzle-orm";

import { isDemoMode } from "@/config/env";
import { getDb } from "@/db/client";
import {
  auditFindings,
  contentDrafts,
  contentVersions,
  pageAudits,
  productAudits,
  storePages,
  type JsonObject,
} from "@/db/schema";
import { recordProductEvent } from "@/lib/telemetry/record";
import { telemetryOpaqueId } from "@/lib/telemetry/opaque-id";
import {
  buildFindingDraft,
  evidenceIdsFromFinding,
  type FindingDraftArtifact,
  type FindingDraftSource,
} from "@/modules/content/finding-draft";

export class FindingDraftError extends Error {
  constructor(
    readonly code: "FINDING_NOT_FOUND" | "DRAFT_UNAVAILABLE",
    readonly status: number,
    readonly publicMessage: string,
  ) {
    super(publicMessage);
    this.name = "FindingDraftError";
  }
}

export interface FindingDraftDto {
  id: string;
  findingId: string;
  status: "draft";
  version: 1;
  created: boolean;
  artifact: FindingDraftArtifact;
  exports: {
    markdown: string;
    html: string;
  };
  publication: {
    enabled: false;
    reason: string;
  };
}

interface PersistedFinding {
  id: string;
  category: string;
  severity: "urgent" | "high" | "medium" | "low";
  title: string;
  description: string;
  recommendation: string;
  confidenceBps: number;
  evidence: unknown;
  pageAuditId: string | null;
  productAuditId: string | null;
  pageId: string | null;
  productId: string | null;
  pageUrl: string | null;
  pageTitle: string | null;
}

const demoDrafts = new Map<string, FindingDraftDto>();

export async function createDraftFromFinding(input: {
  storeId: string;
  findingId: string;
}) {
  if (isDemoMode()) return createDemoDraft(input);

  const finding = await loadFinding(input.storeId, input.findingId);
  if (!finding) {
    throw new FindingDraftError(
      "FINDING_NOT_FOUND",
      404,
      "لم يتم العثور على النتيجة في مساحة هذا المتجر.",
    );
  }

  const source = findingSource(finding);
  const artifact = buildFindingDraft(source);
  const draftId = deterministicUuid(`finding-draft:${input.storeId}:${finding.id}`);
  const checksum = createHash("sha256")
    .update(JSON.stringify(artifact), "utf8")
    .digest("hex");
  const reportId = reportIdFromFinding(finding);

  const result = await getDb().transaction(async (tx) => {
    const [inserted] = await tx
      .insert(contentDrafts)
      .values({
        id: draftId,
        storeId: input.storeId,
        productId: finding.productId,
        pageId: finding.pageId,
        type: contentTypeFor(finding.category),
        status: "draft",
        title: source.title,
        targetType: "audit_finding",
        targetReference: finding.id,
        highRisk: false,
        generatedFromEvidence: artifact.sourceFinding,
      })
      .onConflictDoNothing({ target: contentDrafts.id })
      .returning({ id: contentDrafts.id });

    if (inserted) {
      await tx.insert(contentVersions).values({
        storeId: input.storeId,
        draftId,
        version: 1,
        content: artifact,
        checksumSha256: checksum,
        changeSummary: "مسودة إصلاح أولية مولّدة حتميًا من نتيجة الفحص وأدلتها.",
      });
      return { created: true };
    }

    const [existingVersion] = await tx
      .select({ content: contentVersions.content })
      .from(contentVersions)
      .where(
        and(
          eq(contentVersions.storeId, input.storeId),
          eq(contentVersions.draftId, draftId),
          eq(contentVersions.version, 1),
        ),
      )
      .limit(1);
    if (!existingVersion) {
      throw new FindingDraftError(
        "DRAFT_UNAVAILABLE",
        409,
        "المسودة قيد الإنشاء الآن. أعد المحاولة بعد لحظات.",
      );
    }
    return {
      created: false,
      artifact: existingVersion.content as FindingDraftArtifact,
    };
  });

  const resolvedArtifact = result.artifact ?? artifact;
  emitDraftEvents({
    reportId,
    finding,
    draftId,
    created: result.created,
  });
  return dto(draftId, finding.id, result.created, resolvedArtifact);
}

async function loadFinding(storeId: string, findingId: string) {
  const [finding] = await getDb()
    .select({
      id: auditFindings.id,
      category: auditFindings.category,
      severity: auditFindings.severity,
      title: auditFindings.title,
      description: auditFindings.description,
      recommendation: auditFindings.recommendedFix,
      confidenceBps: auditFindings.confidenceBps,
      evidence: auditFindings.evidence,
      pageAuditId: auditFindings.pageAuditId,
      productAuditId: auditFindings.productAuditId,
      pageId: pageAudits.pageId,
      productId: productAudits.productId,
      pageUrl: storePages.url,
      pageTitle: storePages.title,
    })
    .from(auditFindings)
    .leftJoin(
      pageAudits,
      and(
        eq(pageAudits.storeId, auditFindings.storeId),
        eq(pageAudits.id, auditFindings.pageAuditId),
      ),
    )
    .leftJoin(
      storePages,
      and(eq(storePages.storeId, auditFindings.storeId), eq(storePages.id, pageAudits.pageId)),
    )
    .leftJoin(
      productAudits,
      and(
        eq(productAudits.storeId, auditFindings.storeId),
        eq(productAudits.id, auditFindings.productAuditId),
      ),
    )
    .where(
      and(
        eq(auditFindings.storeId, storeId),
        or(eq(auditFindings.id, findingId), eq(auditFindings.code, findingId)),
      ),
    )
    .orderBy(desc(auditFindings.createdAt))
    .limit(1);
  return (finding ?? null) as PersistedFinding | null;
}

function findingSource(finding: PersistedFinding): FindingDraftSource {
  return {
    id: finding.id,
    category: finding.category,
    severity: finding.severity,
    title: finding.title,
    description: finding.description,
    recommendation: finding.recommendation,
    confidenceBps: finding.confidenceBps,
    evidenceIds: evidenceIdsFromFinding(finding.evidence, finding.id),
    sourceUrl: finding.pageUrl,
    pageTitle: finding.pageTitle,
  };
}

function contentTypeFor(category: string) {
  if (category === "structuredData" || category === "structured_data") {
    return "structured_data" as const;
  }
  if (category === "technical") return "metadata" as const;
  if (category === "answerability") return "faq" as const;
  return "other" as const;
}

function reportIdFromFinding(finding: PersistedFinding) {
  const evidence = finding.evidence;
  if (evidence && typeof evidence === "object" && !Array.isArray(evidence)) {
    const record = evidence as { reportId?: unknown; sourceReportId?: unknown };
    const value = record.reportId ?? record.sourceReportId;
    if (
      typeof value === "string" &&
      (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(value) ||
        /^report_[A-Za-z0-9_-]{32}$/u.test(value))
    ) {
      return value;
    }
  }
  return telemetryOpaqueId(
    "report",
    finding.pageAuditId ?? finding.productAuditId ?? finding.id,
  );
}

function telemetryCategory(category: string) {
  const mapping: Record<string, "technical" | "content" | "entity_clarity" | "trust" | "answerability" | "structured_data" | "external_evidence"> = {
    technical: "technical",
    content: "content",
    entity: "entity_clarity",
    entity_clarity: "entity_clarity",
    trust: "trust",
    answerability: "answerability",
    structuredData: "structured_data",
    structured_data: "structured_data",
    externalEvidence: "external_evidence",
    external_evidence: "external_evidence",
  };
  return mapping[category] ?? "content";
}

function emitDraftEvents(input: {
  reportId: string;
  finding: PersistedFinding;
  draftId: string;
  created: boolean;
}) {
  recordProductEvent({
    type: "finding_started",
    source: "workspace",
    reportId: input.reportId,
    findingId: input.finding.id,
    category: telemetryCategory(input.finding.category),
    severity: input.finding.severity === "urgent" ? "critical" : input.finding.severity,
  });
  if (input.created) {
    recordProductEvent({
      type: "content_draft_created",
      source: "content_writer",
      reportId: input.reportId,
      findingId: input.finding.id,
      draftId: input.draftId,
      contentType: input.finding.category === "answerability" ? "faq" : "article",
      locale: "ar",
    });
  }
}

function createDemoDraft(input: { storeId: string; findingId: string }) {
  const key = `${input.storeId}:${input.findingId}`;
  const existing = demoDrafts.get(key);
  if (existing) return { ...existing, created: false };
  const artifact = buildFindingDraft({
    id: input.findingId,
    category: "content",
    severity: "high",
    title: "المحتوى لا يبدأ بإجابة مباشرة",
    description: "يعرض مثال التقرير فقرة طويلة قبل توضيح الإجابة المطلوبة.",
    recommendation: "ابدأ بإجابة موجزة مرتبطة بالدليل ثم أضف خطوات قابلة للمراجعة.",
    confidenceBps: 9100,
    evidenceIds: ["demo-evidence-direct-answer"],
    sourceUrl: "https://example.com/product",
    pageTitle: "صفحة منتج تجريبية",
  });
  const draftId = deterministicUuid(`finding-draft:${key}`);
  const created = dto(draftId, input.findingId, true, artifact);
  demoDrafts.set(key, created);
  const demoFinding: PersistedFinding = {
    id: input.findingId,
    category: "content",
    severity: "high",
    title: "المحتوى لا يبدأ بإجابة مباشرة",
    description: "يعرض مثال التقرير فقرة طويلة قبل توضيح الإجابة المطلوبة.",
    recommendation: "ابدأ بإجابة موجزة مرتبطة بالدليل ثم أضف خطوات قابلة للمراجعة.",
    confidenceBps: 9100,
    evidence: {
      ids: ["demo-evidence-direct-answer"],
      reportId: telemetryOpaqueId("report", "demo-latest-report"),
    },
    pageAuditId: null,
    productAuditId: null,
    pageId: null,
    productId: null,
    pageUrl: "https://example.com/product",
    pageTitle: "صفحة منتج تجريبية",
  };
  emitDraftEvents({
    reportId: telemetryOpaqueId("report", "demo-latest-report"),
    finding: demoFinding,
    draftId,
    created: true,
  });
  return created;
}

function dto(
  draftId: string,
  findingId: string,
  created: boolean,
  artifact: FindingDraftArtifact,
): FindingDraftDto {
  const draft = artifact.draft as JsonObject;
  const exports = draft.exports as JsonObject;
  return {
    id: draftId,
    findingId,
    status: "draft",
    version: 1,
    created,
    artifact,
    exports: {
      markdown: String(exports.markdown ?? ""),
      html: String(exports.html ?? ""),
    },
    publication: {
      enabled: false,
      reason: "النشر المباشر مؤجل حتى اجتياز اختبارات الكتابة والقراءة والرجوع مع سلة.",
    },
  };
}

function deterministicUuid(value: string) {
  const hex = createHash("sha256").update(value, "utf8").digest("hex").slice(0, 32).split("");
  hex[12] = "5";
  hex[16] = ((Number.parseInt(hex[16] ?? "0", 16) & 0x3) | 0x8).toString(16);
  const joined = hex.join("");
  return `${joined.slice(0, 8)}-${joined.slice(8, 12)}-${joined.slice(12, 16)}-${joined.slice(16, 20)}-${joined.slice(20)}`;
}
