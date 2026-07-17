import "server-only";

import { and, eq, isNotNull, isNull } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "@/db/client";
import {
  prospectReportAccess,
  prospectReportSnapshots,
  prospectScanRequests,
  reportOrders,
  stores,
  type JsonObject,
  type JsonValue,
} from "@/db/schema";
import { recordProductEvent } from "@/lib/telemetry/record";
import { AcquisitionError } from "@/modules/acquisition/errors";
import { storedVisibilityReportSchema } from "@/modules/acquisition/schemas";
import {
  buildDeterministicArabicNarrative,
  generateArabicReportNarrative,
  reportNarrativeSchema,
  visibilityReportBackendSkillKeys,
  type GeneratedNarrative,
  type NarrativeReportInput,
} from "@/modules/visibility/report-narrative";
import type { VisibilityScanReport } from "@/modules/visibility/scanner/types";

const dayMs = 24 * 60 * 60 * 1_000;
const defaultPaidRetentionDays = 365;

export const paymentReferenceSchema = z
  .string()
  .trim()
  .min(6)
  .max(160)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:/-]*$/u)
  .transform((value) => value.normalize("NFKC"));

export const fulfillPaidReportInputSchema = z
  .object({
    orderId: z.string().uuid(),
    paymentReference: paymentReferenceSchema,
  })
  .strict();

export type FulfillPaidReportInput = z.infer<typeof fulfillPaidReportInputSchema>;
export type ReportOrderState =
  | "pending_payment"
  | "paid"
  | "fulfilled"
  | "cancelled"
  | "refunded";

export interface PaymentTransitionInput {
  orderId: string;
  status: ReportOrderState;
  currentPaymentReference: string | null;
  requestedPaymentReference: string;
  referenceOwnerOrderId: string | null;
}

export type PaymentTransition = "mark_paid" | "resume_paid" | "already_fulfilled";

/** Pure transition policy shared by Postgres and unit tests. */
export function planPaymentTransition(input: PaymentTransitionInput): PaymentTransition {
  if (
    input.referenceOwnerOrderId &&
    input.referenceOwnerOrderId !== input.orderId
  ) {
    throw new AcquisitionError(
      "DUPLICATE_PAYMENT_REFERENCE",
      409,
      "مرجع الدفع مستخدم لطلب تقرير آخر.",
    );
  }
  if (
    input.currentPaymentReference &&
    input.currentPaymentReference !== input.requestedPaymentReference
  ) {
    throw new AcquisitionError(
      "PAYMENT_REFERENCE_MISMATCH",
      409,
      "مرجع الدفع لا يطابق المرجع المسجل لهذا الطلب.",
    );
  }
  if (input.status === "pending_payment") return "mark_paid";
  if (input.status === "paid") return "resume_paid";
  if (input.status === "fulfilled") return "already_fulfilled";
  throw new AcquisitionError(
    "INVALID_ORDER_STATE",
    409,
    "لا يمكن تنفيذ هذا الطلب من حالته الحالية.",
  );
}

interface PreparedPaidReport {
  orderId: string;
  reportId: string;
  report: VisibilityScanReport;
  alreadyFulfilled: boolean;
  expiresAt: Date;
  existingNarrativeSource: "ai" | "deterministic" | null;
  existingModelId: string | null;
}

interface CompletedPaidReport {
  orderId: string;
  reportId: string;
  newlyFulfilled: boolean;
  expiresAt: Date;
  narrativeSource: "ai" | "deterministic";
  modelId: string | null;
}

export interface PaidReportFulfillmentRepository {
  markPaid(input: FulfillPaidReportInput): Promise<PreparedPaidReport>;
  complete(input: {
    orderId: string;
    paymentReference: string;
    generated: GeneratedNarrative;
    report: VisibilityScanReport;
  }): Promise<CompletedPaidReport>;
}

export interface PaidReportFulfillmentDto {
  orderId: string;
  reportId: string;
  status: "fulfilled";
  newlyFulfilled: boolean;
  accessLevel: "full";
  narrativeSource: "ai" | "deterministic" | "existing";
  modelId: string | null;
  expiresAt: string;
}

function parseReport(summary: JsonObject) {
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

function existingNarrativeSource(summary: JsonObject) {
  const source = (summary.narrativeMetadata as JsonObject | undefined)?.source;
  return source === "ai" || source === "deterministic" ? source : null;
}

function narrativeInput(report: VisibilityScanReport): NarrativeReportInput {
  return {
    domain: report.domain,
    score: report.score,
    coverage: report.coverage,
    confidence: report.confidence,
    findings: report.findings.map((finding) => ({
      id: finding.id,
      title: finding.title,
      description: finding.description,
      recommendation: finding.recommendation,
      severity: finding.severity,
      evidenceIds: finding.evidenceIds,
    })),
    limitations: report.limitations,
  };
}

function deterministicGeneration(
  input: NarrativeReportInput,
  startedAt: number,
): GeneratedNarrative {
  return {
    narrative: buildDeterministicArabicNarrative(input),
    source: "deterministic",
    modelId: null,
    promptVersion: "visibility-report-ar-v1",
    appliedSkills: [...visibilityReportBackendSkillKeys],
    durationMs: Date.now() - startedAt,
  };
}

function validateGeneratedNarrative(
  generated: GeneratedNarrative,
  report: VisibilityScanReport,
) {
  const parsed = reportNarrativeSchema.safeParse(generated.narrative);
  if (!parsed.success) return false;
  const findingIds = new Set(report.findings.map((finding) => finding.id));
  return parsed.data.priorities.every((priority) => findingIds.has(priority.findingId));
}

function markdownForNarrative(generated: GeneratedNarrative) {
  const narrative = generated.narrative;
  const bullets = (items: string[]) => items.map((item) => `- ${item}`).join("\n");
  const priorities = narrative.priorities
    .map(
      (priority) =>
        `### ${priority.title}\n${priority.reason}\n\n**الإجراء التالي:** ${priority.nextAction}\n\n` +
        `**مرجع النتيجة:** \`${priority.findingId}\``,
    )
    .join("\n\n");
  return [
    "# الملخص التنفيذي",
    narrative.executiveSummary,
    "## نقاط القوة",
    bullets(narrative.strengths),
    "## الأولويات",
    priorities || "لم تسجل أولوية مؤكدة ضمن التغطية الحالية.",
    "## خطة 30 يومًا",
    bullets(narrative.plan30Days),
    "## خطة 60 يومًا",
    bullets(narrative.plan60Days),
    "## خطة 90 يومًا",
    bullets(narrative.plan90Days),
    "## القيود",
    bullets(narrative.limitations),
  ].join("\n\n");
}

function isUniqueViolation(error: unknown): boolean {
  let candidate: unknown = error;
  for (let depth = 0; depth < 4 && candidate; depth += 1) {
    if (
      typeof candidate === "object" &&
      candidate !== null &&
      "code" in candidate &&
      (candidate as { code?: unknown }).code === "23505"
    ) {
      return true;
    }
    candidate =
      typeof candidate === "object" && candidate !== null && "cause" in candidate
        ? (candidate as { cause?: unknown }).cause
        : null;
  }
  return false;
}

export class PostgresPaidReportFulfillmentRepository
  implements PaidReportFulfillmentRepository
{
  constructor(private readonly now: () => Date = () => new Date()) {}

  async markPaid(input: FulfillPaidReportInput): Promise<PreparedPaidReport> {
    try {
      return await getDb().transaction(async (tx) => {
        const [row] = await tx
          .select({
            orderId: reportOrders.id,
            reportId: reportOrders.reportId,
            status: reportOrders.status,
            paymentReference: reportOrders.paymentReference,
            executiveSummary: prospectReportSnapshots.executiveSummary,
            modelId: prospectReportSnapshots.modelId,
            expiresAt: prospectReportSnapshots.expiresAt,
          })
          .from(reportOrders)
          .innerJoin(
            prospectReportSnapshots,
            eq(prospectReportSnapshots.id, reportOrders.reportId),
          )
          .where(eq(reportOrders.id, input.orderId))
          .limit(1)
          .for("update");
        if (!row) {
          throw new AcquisitionError("ORDER_NOT_FOUND", 404, "لم يتم العثور على طلب التقرير.");
        }
        const [referenceOwner] = await tx
          .select({ orderId: reportOrders.id })
          .from(reportOrders)
          .where(eq(reportOrders.paymentReference, input.paymentReference))
          .limit(1);
        const transition = planPaymentTransition({
          orderId: row.orderId,
          status: row.status,
          currentPaymentReference: row.paymentReference,
          requestedPaymentReference: input.paymentReference,
          referenceOwnerOrderId: referenceOwner?.orderId ?? null,
        });
        if (transition === "mark_paid") {
          const now = this.now();
          await tx
            .update(reportOrders)
            .set({
              status: "paid",
              paymentReference: input.paymentReference,
              paidAt: now,
              updatedAt: now,
            })
            .where(eq(reportOrders.id, row.orderId));
        }
        return {
          orderId: row.orderId,
          reportId: row.reportId,
          report: parseReport(row.executiveSummary),
          alreadyFulfilled: transition === "already_fulfilled",
          expiresAt: row.expiresAt,
          existingNarrativeSource: existingNarrativeSource(row.executiveSummary),
          existingModelId: row.modelId,
        };
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new AcquisitionError(
          "DUPLICATE_PAYMENT_REFERENCE",
          409,
          "مرجع الدفع مستخدم لطلب تقرير آخر.",
        );
      }
      throw error;
    }
  }

  async complete(input: {
    orderId: string;
    paymentReference: string;
    generated: GeneratedNarrative;
    report: VisibilityScanReport;
  }): Promise<CompletedPaidReport> {
    return getDb().transaction(async (tx) => {
      const [row] = await tx
        .select({
          orderId: reportOrders.id,
          reportId: reportOrders.reportId,
          status: reportOrders.status,
          paymentReference: reportOrders.paymentReference,
          requestId: prospectReportSnapshots.requestId,
          executiveSummary: prospectReportSnapshots.executiveSummary,
          snapshotExpiresAt: prospectReportSnapshots.expiresAt,
          requestExpiresAt: prospectScanRequests.expiresAt,
          claimedStoreId: prospectScanRequests.claimedStoreId,
        })
        .from(reportOrders)
        .innerJoin(
          prospectReportSnapshots,
          eq(prospectReportSnapshots.id, reportOrders.reportId),
        )
        .innerJoin(
          prospectScanRequests,
          eq(prospectScanRequests.id, prospectReportSnapshots.requestId),
        )
        .where(eq(reportOrders.id, input.orderId))
        .limit(1)
        .for("update");
      if (!row) {
        throw new AcquisitionError("ORDER_NOT_FOUND", 404, "لم يتم العثور على طلب التقرير.");
      }
      if (row.paymentReference !== input.paymentReference) {
        throw new AcquisitionError(
          "PAYMENT_REFERENCE_MISMATCH",
          409,
          "مرجع الدفع لا يطابق المرجع المسجل لهذا الطلب.",
        );
      }
      if (row.status === "fulfilled") {
        return {
          orderId: row.orderId,
          reportId: row.reportId,
          newlyFulfilled: false,
          expiresAt: row.snapshotExpiresAt,
          narrativeSource: existingNarrativeSource(row.executiveSummary) ?? "deterministic",
          modelId: null,
        };
      }
      if (row.status !== "paid") {
        throw new AcquisitionError(
          "INVALID_ORDER_STATE",
          409,
          "يجب تسجيل الدفع قبل تنفيذ التقرير.",
        );
      }

      const now = this.now();
      let retentionDays = defaultPaidRetentionDays;
      if (row.claimedStoreId) {
        const [store] = await tx
          .select({ dataRetentionDays: stores.dataRetentionDays })
          .from(stores)
          .where(eq(stores.id, row.claimedStoreId))
          .limit(1);
        if (store) retentionDays = store.dataRetentionDays;
      }
      const expiresAt = new Date(
        Math.max(
          row.snapshotExpiresAt.getTime(),
          row.requestExpiresAt.getTime(),
          now.getTime() + retentionDays * dayMs,
        ),
      );
      const referencedFindingIds = input.generated.narrative.priorities.map(
        (priority) => priority.findingId,
      );
      const referencedEvidenceIds = input.report.findings
        .filter((finding) => referencedFindingIds.includes(finding.id))
        .flatMap((finding) => finding.evidenceIds);
      const executiveSummary: JsonObject = {
        ...row.executiveSummary,
        narrative: input.generated.narrative as unknown as JsonValue,
        narrativeMetadata: {
          source: input.generated.source,
          modelId: input.generated.modelId,
          promptVersion: input.generated.promptVersion,
          appliedSkills: input.generated.appliedSkills,
          durationMs: input.generated.durationMs,
          generatedAt: now.toISOString(),
          findingReferences: referencedFindingIds,
          evidenceReferences: [...new Set(referencedEvidenceIds)],
        },
      };

      await tx
        .update(prospectReportSnapshots)
        .set({
          accessLevel: "full",
          executiveSummary,
          narrativeMarkdown: markdownForNarrative(input.generated),
          modelId: input.generated.modelId,
          promptVersion: input.generated.promptVersion,
          expiresAt,
        })
        .where(eq(prospectReportSnapshots.id, row.reportId));
      await tx
        .update(prospectScanRequests)
        .set({ expiresAt, updatedAt: now })
        .where(eq(prospectScanRequests.id, row.requestId));

      await tx
        .update(prospectReportAccess)
        .set({ accessLevel: "full", expiresAt })
        .where(
          and(
            eq(prospectReportAccess.reportId, row.reportId),
            isNotNull(prospectReportAccess.granteeStoreId),
            isNull(prospectReportAccess.revokedAt),
          ),
        );
      if (row.claimedStoreId) {
        const [storeGrant] = await tx
          .select({ id: prospectReportAccess.id })
          .from(prospectReportAccess)
          .where(
            and(
              eq(prospectReportAccess.reportId, row.reportId),
              eq(prospectReportAccess.granteeStoreId, row.claimedStoreId),
              isNull(prospectReportAccess.revokedAt),
            ),
          )
          .limit(1);
        if (!storeGrant) {
          await tx.insert(prospectReportAccess).values({
            reportId: row.reportId,
            accessLevel: "full",
            granteeStoreId: row.claimedStoreId,
            expiresAt,
          });
        }
      }

      await tx
        .update(reportOrders)
        .set({ status: "fulfilled", fulfilledAt: now, updatedAt: now })
        .where(eq(reportOrders.id, row.orderId));

      return {
        orderId: row.orderId,
        reportId: row.reportId,
        newlyFulfilled: true,
        expiresAt,
        narrativeSource: input.generated.source,
        modelId: input.generated.modelId,
      };
    });
  }
}

export async function fulfillPaidReport(
  rawInput: FulfillPaidReportInput,
  dependencies: {
    repository?: PaidReportFulfillmentRepository;
    generateNarrative?: typeof generateArabicReportNarrative;
  } = {},
): Promise<PaidReportFulfillmentDto> {
  const input = fulfillPaidReportInputSchema.parse(rawInput);
  const repository =
    dependencies.repository ?? new PostgresPaidReportFulfillmentRepository();
  const prepared = await repository.markPaid(input);
  if (prepared.alreadyFulfilled) {
    return {
      orderId: prepared.orderId,
      reportId: prepared.reportId,
      status: "fulfilled",
      newlyFulfilled: false,
      accessLevel: "full",
      narrativeSource: prepared.existingNarrativeSource ?? "existing",
      modelId: prepared.existingModelId,
      expiresAt: prepared.expiresAt.toISOString(),
    };
  }

  const reportInput = narrativeInput(prepared.report);
  const generationStartedAt = Date.now();
  let generated: GeneratedNarrative;
  try {
    generated = await (dependencies.generateNarrative ?? generateArabicReportNarrative)(
      reportInput,
    );
    if (!validateGeneratedNarrative(generated, prepared.report)) {
      generated = deterministicGeneration(reportInput, generationStartedAt);
    }
  } catch {
    generated = deterministicGeneration(reportInput, generationStartedAt);
  }

  const completed = await repository.complete({
    orderId: prepared.orderId,
    paymentReference: input.paymentReference,
    generated,
    report: prepared.report,
  });
  if (completed.newlyFulfilled) {
    recordProductEvent({
      type: "report_unlocked",
      source: "system",
      reportId: completed.reportId,
      orderId: completed.orderId,
      entitlement: "deep_report",
    });
  }
  return {
    orderId: completed.orderId,
    reportId: completed.reportId,
    status: "fulfilled",
    newlyFulfilled: completed.newlyFulfilled,
    accessLevel: "full",
    narrativeSource: completed.narrativeSource,
    modelId: completed.modelId,
    expiresAt: completed.expiresAt.toISOString(),
  };
}
