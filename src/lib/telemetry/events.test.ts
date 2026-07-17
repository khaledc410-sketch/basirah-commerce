import { describe, expect, it } from "vitest";

import { safeParseProductEvent } from "@/lib/telemetry/events";

const scanId = `scan_${"s".repeat(32)}`;
const previousScanId = `scan_${"p".repeat(32)}`;
const reportId = `report_${"r".repeat(32)}`;

const validEvents = [
  {
    type: "visibility_check_submitted",
    scanId,
    locale: "ar",
    countryCode: "SA",
    pageLimit: 10,
  },
  {
    type: "visibility_check_completed",
    scanId,
    outcome: "completed",
    durationMs: 25_000,
    pagesScanned: 10,
    coveragePercent: 90,
    readinessScore: 72,
  },
  {
    type: "report_preview_viewed",
    scanId,
    coveragePercent: 90,
    readinessScore: 72,
  },
  {
    type: "report_order_created",
    reportId,
    orderId: "order_12345678",
    amountMinor: 39_900,
    currency: "SAR",
    orderStatus: "pending_payment",
  },
  {
    type: "report_unlocked",
    reportId,
    entitlement: "deep_report",
  },
  {
    type: "finding_started",
    reportId,
    findingId: "finding_12345678",
    category: "structured_data",
    severity: "high",
  },
  {
    type: "content_draft_created",
    reportId,
    findingId: "finding_12345678",
    draftId: "draft_12345678",
    contentType: "article",
    locale: "ar",
  },
  {
    type: "content_exported",
    draftId: "draft_12345678",
    exportFormat: "markdown",
  },
  {
    type: "sales_agent_activated",
    storeId: "store_12345678",
    platform: "salla",
    surface: "widget",
  },
  {
    type: "rescan_completed",
    scanId,
    previousScanId,
    durationMs: 22_000,
    pagesScanned: 10,
    coveragePercent: 100,
    readinessScore: 82,
    readinessScoreDelta: 10,
  },
] as const;

describe("product event telemetry", () => {
  it.each(validEvents)("accepts the safe $type contract", (event) => {
    expect(safeParseProductEvent(event).success).toBe(true);
  });

  it.each([
    "email",
    "customer_email",
    "phone",
    "mobileNumber",
    "message",
    "customerMessages",
    "accessToken",
    "refresh_token",
    "raw_page_content",
    "pageHtmlBody",
  ])("explicitly rejects sensitive field %s", (field) => {
    const result = safeParseProductEvent({
      ...validEvents[0],
      [field]: "must-never-be-collected",
    });
    expect(result).toMatchObject({ success: false, reason: "sensitive_field" });
  });

  it("rejects sensitive fields at any nesting depth", () => {
    const result = safeParseProductEvent({
      ...validEvents[0],
      metadata: { safe: { messages: ["private customer text"] } },
    });
    expect(result).toMatchObject({ success: false, reason: "sensitive_field" });
  });

  it("rejects unknown fields instead of silently stripping them", () => {
    const result = safeParseProductEvent({ ...validEvents[0], campaign: "summer" });
    expect(result).toEqual({ success: false, reason: "invalid_event" });
  });

  it("does not allow an email or numeric phone number to masquerade as an identifier", () => {
    expect(
      safeParseProductEvent({ ...validEvents[0], scanId: "merchant@example.com" }),
    ).toEqual({ success: false, reason: "invalid_event" });
    expect(
      safeParseProductEvent({ ...validEvents[0], scanId: "966500000000" }),
    ).toEqual({ success: false, reason: "invalid_event" });
  });

  it("rejects raw scan and report bearer values as telemetry identifiers", () => {
    const rawScanBearer = "N0PrefixPublicScanBearerValue123456789";
    const rawReportBearer = "N0PrefixPublicReportBearerValue1234567";

    expect(
      safeParseProductEvent({ ...validEvents[0], scanId: rawScanBearer }),
    ).toEqual({ success: false, reason: "invalid_event" });
    expect(
      safeParseProductEvent({ ...validEvents[3], reportId: rawReportBearer }),
    ).toEqual({ success: false, reason: "invalid_event" });
  });

  it("accepts a non-secret database report UUID", () => {
    expect(
      safeParseProductEvent({
        ...validEvents[3],
        reportId: "a797e5d5-6338-49ca-84f3-4eec29ee7ae4",
      }).success,
    ).toBe(true);
  });
});
