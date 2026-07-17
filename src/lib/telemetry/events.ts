import { z } from "zod";

const opaqueIdSchema = z
  .string()
  .min(8)
  .max(128)
  .regex(/^(?=.*[A-Za-z_-])[A-Za-z0-9_-]+$/, "Expected an opaque, non-PII identifier.");

// Scan/report route tokens are bearer credentials. Product telemetry accepts
// only the stable, one-way identifiers produced by telemetryOpaqueId().
const scanTelemetryIdSchema = z.string().regex(/^scan_[A-Za-z0-9_-]{32}$/u);
const reportTelemetryIdSchema = z.union([
  z.string().regex(/^report_[A-Za-z0-9_-]{32}$/u),
  // Database report IDs are non-secret resource identifiers, unlike public
  // share/report bearer values.
  z.uuid(),
]);

const commonEventShape = {
  eventId: opaqueIdSchema.optional(),
  occurredAt: z.iso.datetime({ offset: true }).optional(),
  source: z
    .enum(["public_checker", "workspace", "content_writer", "sales_agent", "system"])
    .optional(),
};

const scoreSchema = z.number().finite().min(0).max(100);
const coverageSchema = z.number().finite().min(0).max(100);
const durationSchema = z.number().int().nonnegative().max(86_400_000);
const pageCountSchema = z.number().int().nonnegative().max(10_000);
const failureCodeSchema = z.string().min(2).max(64).regex(/^[A-Z][A-Z0-9_]*$/);

const visibilityCheckSubmittedSchema = z
  .object({
    type: z.literal("visibility_check_submitted"),
    ...commonEventShape,
    scanId: scanTelemetryIdSchema,
    locale: z.enum(["ar", "en"]),
    countryCode: z.string().regex(/^[A-Z]{2}$/),
    pageLimit: z.number().int().min(1).max(100),
    entryPoint: z.enum(["homepage", "pricing", "workspace", "rescan"]).optional(),
  })
  .strict();

const visibilityCheckCompletedSchema = z
  .object({
    type: z.literal("visibility_check_completed"),
    ...commonEventShape,
    scanId: scanTelemetryIdSchema,
    outcome: z.enum(["completed", "partial", "failed"]),
    durationMs: durationSchema,
    pagesScanned: pageCountSchema,
    coveragePercent: coverageSchema,
    readinessScore: scoreSchema.optional(),
    failureCode: failureCodeSchema.optional(),
  })
  .strict();

const reportPreviewViewedSchema = z
  .object({
    type: z.literal("report_preview_viewed"),
    ...commonEventShape,
    scanId: scanTelemetryIdSchema,
    reportId: reportTelemetryIdSchema.optional(),
    coveragePercent: coverageSchema,
    readinessScore: scoreSchema.optional(),
  })
  .strict();

const reportOrderCreatedSchema = z
  .object({
    type: z.literal("report_order_created"),
    ...commonEventShape,
    reportId: reportTelemetryIdSchema,
    orderId: opaqueIdSchema,
    amountMinor: z.number().int().nonnegative().max(100_000_000),
    currency: z.literal("SAR"),
    orderStatus: z.literal("pending_payment"),
  })
  .strict();

const reportUnlockedSchema = z
  .object({
    type: z.literal("report_unlocked"),
    ...commonEventShape,
    reportId: reportTelemetryIdSchema,
    orderId: opaqueIdSchema.optional(),
    entitlement: z.enum(["deep_report", "growth", "commerce", "rescan"]),
  })
  .strict();

const findingStartedSchema = z
  .object({
    type: z.literal("finding_started"),
    ...commonEventShape,
    reportId: reportTelemetryIdSchema,
    findingId: opaqueIdSchema,
    category: z.enum([
      "technical",
      "content",
      "entity_clarity",
      "trust",
      "answerability",
      "structured_data",
      "external_evidence",
    ]),
    severity: z.enum(["critical", "high", "medium", "low"]),
  })
  .strict();

const contentDraftCreatedSchema = z
  .object({
    type: z.literal("content_draft_created"),
    ...commonEventShape,
    reportId: reportTelemetryIdSchema,
    findingId: opaqueIdSchema,
    draftId: opaqueIdSchema,
    contentType: z.enum(["article", "product_page", "category_page", "faq"]),
    locale: z.enum(["ar", "en"]),
  })
  .strict();

const contentExportedSchema = z
  .object({
    type: z.literal("content_exported"),
    ...commonEventShape,
    draftId: opaqueIdSchema,
    exportFormat: z.enum(["html", "markdown", "plain_text", "json_ld"]),
    revision: z.number().int().min(1).max(10_000).optional(),
  })
  .strict();

const salesAgentActivatedSchema = z
  .object({
    type: z.literal("sales_agent_activated"),
    ...commonEventShape,
    storeId: opaqueIdSchema,
    platform: z.literal("salla"),
    surface: z.enum(["widget", "workspace"]),
  })
  .strict();

const rescanCompletedSchema = z
  .object({
    type: z.literal("rescan_completed"),
    ...commonEventShape,
    scanId: scanTelemetryIdSchema,
    previousScanId: scanTelemetryIdSchema,
    reportId: reportTelemetryIdSchema.optional(),
    durationMs: durationSchema,
    pagesScanned: pageCountSchema,
    coveragePercent: coverageSchema,
    readinessScore: scoreSchema.optional(),
    readinessScoreDelta: z.number().finite().min(-100).max(100).optional(),
  })
  .strict();

export const productEventSchema = z.discriminatedUnion("type", [
  visibilityCheckSubmittedSchema,
  visibilityCheckCompletedSchema,
  reportPreviewViewedSchema,
  reportOrderCreatedSchema,
  reportUnlockedSchema,
  findingStartedSchema,
  contentDraftCreatedSchema,
  contentExportedSchema,
  salesAgentActivatedSchema,
  rescanCompletedSchema,
]);

export type ProductEvent = z.infer<typeof productEventSchema>;
export type ProductEventName = ProductEvent["type"];

const sensitiveKeyFragments = [
  "authorization",
  "cookie",
  "email",
  "htmlbody",
  "message",
  "mobile",
  "pagecontent",
  "password",
  "phone",
  "rawcontent",
  "rawhtml",
  "secret",
  "token",
] as const;

function normalizeKey(key: string) {
  return key.normalize("NFKC").replace(/[^a-z0-9]/gi, "").toLowerCase();
}

function sensitiveFieldPath(
  value: unknown,
  path: Array<string | number> = [],
  seen = new WeakSet<object>(),
): Array<string | number> | null {
  if (!value || typeof value !== "object") return null;
  if (seen.has(value)) return null;
  seen.add(value);

  for (const [key, child] of Object.entries(value)) {
    const normalizedKey = normalizeKey(key);
    if (sensitiveKeyFragments.some((fragment) => normalizedKey.includes(fragment))) {
      return [...path, key];
    }
    const nested = sensitiveFieldPath(child, [...path, key], seen);
    if (nested) return nested;
  }
  return null;
}

export type ProductEventParseResult =
  | { success: true; data: ProductEvent }
  | {
      success: false;
      reason: "invalid_event" | "sensitive_field";
      sensitivePath?: Array<string | number>;
    };

/**
 * Parses an event with a closed allow-list. Sensitive field names are detected
 * before Zod validation so they are rejected explicitly, never silently stripped.
 */
export function safeParseProductEvent(input: unknown): ProductEventParseResult {
  const sensitivePath = sensitiveFieldPath(input);
  if (sensitivePath) {
    return { success: false, reason: "sensitive_field", sensitivePath };
  }

  const parsed = productEventSchema.safeParse(input);
  if (!parsed.success) return { success: false, reason: "invalid_event" };
  return { success: true, data: parsed.data };
}
