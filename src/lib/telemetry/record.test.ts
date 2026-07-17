import { afterEach, describe, expect, it, vi } from "vitest";

import type { ProductEvent } from "@/lib/telemetry/events";
import { telemetryOpaqueId } from "@/lib/telemetry/opaque-id";
import { recordProductEvent } from "@/lib/telemetry/record";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("product event logging boundary", () => {
  it("refuses raw bearer IDs without writing them to logs", () => {
    const rawBearer = "raw-public-scan-bearer-value-123456789";
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    const accepted = recordProductEvent({
      type: "visibility_check_submitted",
      source: "public_checker",
      scanId: rawBearer,
      locale: "ar",
      countryCode: "SA",
      pageLimit: 10,
    } as ProductEvent);

    expect(accepted).toBe(false);
    expect(info).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledOnce();
    expect(JSON.stringify(warn.mock.calls)).not.toContain(rawBearer);
  });

  it("logs only the derived telemetry identifier for an accepted event", () => {
    const rawBearer = "raw-public-report-bearer-value-12345678";
    const safeReportId = telemetryOpaqueId("report", rawBearer);
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);

    const accepted = recordProductEvent({
      type: "report_order_created",
      source: "public_checker",
      reportId: safeReportId,
      orderId: "order_12345678",
      amountMinor: 39_900,
      currency: "SAR",
      orderStatus: "pending_payment",
    });

    expect(accepted).toBe(true);
    expect(info).toHaveBeenCalledOnce();
    expect(JSON.stringify(info.mock.calls)).toContain(safeReportId);
    expect(JSON.stringify(info.mock.calls)).not.toContain(rawBearer);
  });
});
