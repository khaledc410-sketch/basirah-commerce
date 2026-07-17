import { describe, expect, it, vi } from "vitest";

import type { PaidReportFulfillmentRepository } from "./paid-report-fulfillment";
import {
  fulfillPaidReport,
  planPaymentTransition,
} from "./paid-report-fulfillment";

const orderId = "00000000-0000-4000-8000-000000000010";
const reportId = "00000000-0000-4000-8000-000000000020";

const report = {
  domain: "example.sa",
  score: 60,
  coverage: 80,
  confidence: 75,
  components: [{ key: "technical" as const, label: "تقني", weight: 20, score: 60, coverage: 100 }],
  findings: [{
    id: "finding-1",
    component: "technical" as const,
    title: "عنوان الصفحة غير واضح",
    description: "لا يشرح العنوان هوية المتجر.",
    severity: "high" as const,
    recommendation: "اكتب عنوانًا مباشرًا وموثقًا.",
    evidenceIds: ["evidence-1"],
  }],
  evidence: [{
    id: "evidence-1",
    component: "technical" as const,
    checkKey: "page-title",
    status: "fail" as const,
    message: "العنوان عام.",
    urls: ["https://example.sa/"],
  }],
  limitations: ["تعذر ربط بيانات الاكتشاف."],
  scannedAt: "2026-07-14T00:00:00.000Z",
  pagesScanned: 1,
};

describe("paid report fulfillment", () => {
  it("allows only idempotent pending, paid, and fulfilled transitions", () => {
    expect(planPaymentTransition({
      orderId,
      status: "pending_payment",
      currentPaymentReference: null,
      requestedPaymentReference: "invoice-100",
      referenceOwnerOrderId: null,
    })).toBe("mark_paid");
    expect(planPaymentTransition({
      orderId,
      status: "paid",
      currentPaymentReference: "invoice-100",
      requestedPaymentReference: "invoice-100",
      referenceOwnerOrderId: orderId,
    })).toBe("resume_paid");
    expect(() => planPaymentTransition({
      orderId,
      status: "cancelled",
      currentPaymentReference: null,
      requestedPaymentReference: "invoice-100",
      referenceOwnerOrderId: null,
    })).toThrowError(expect.objectContaining({ code: "INVALID_ORDER_STATE" }));
  });

  it("falls back to an evidence-bound deterministic narrative", async () => {
    const complete = vi.fn().mockImplementation(async (input) => ({
      orderId,
      reportId,
      newlyFulfilled: true,
      expiresAt: new Date("2027-07-14T00:00:00.000Z"),
      narrativeSource: input.generated.source,
      modelId: input.generated.modelId,
    }));
    const repository = {
      markPaid: vi.fn().mockResolvedValue({
        orderId,
        reportId,
        report,
        alreadyFulfilled: false,
        expiresAt: new Date("2026-07-21T00:00:00.000Z"),
        existingNarrativeSource: null,
        existingModelId: null,
      }),
      complete,
    } as PaidReportFulfillmentRepository;
    const result = await fulfillPaidReport(
      { orderId, paymentReference: "invoice-100" },
      {
        repository,
        generateNarrative: vi.fn().mockRejectedValue(new Error("provider unavailable")),
      },
    );

    expect(result).toMatchObject({
      status: "fulfilled",
      newlyFulfilled: true,
      accessLevel: "full",
      narrativeSource: "deterministic",
    });
    expect(complete).toHaveBeenCalledWith(expect.objectContaining({
      paymentReference: "invoice-100",
      generated: expect.objectContaining({
        source: "deterministic",
        appliedSkills: ["ai-seo", "canvas-design"],
        narrative: expect.objectContaining({
          priorities: [expect.objectContaining({ findingId: "finding-1" })],
        }),
      }),
    }));
  });

  it("returns an already fulfilled order without regenerating or completing it", async () => {
    const complete = vi.fn();
    const generateNarrative = vi.fn();
    const repository = {
      markPaid: vi.fn().mockResolvedValue({
        orderId,
        reportId,
        report,
        alreadyFulfilled: true,
        expiresAt: new Date("2027-07-14T00:00:00.000Z"),
        existingNarrativeSource: "ai",
        existingModelId: "model-1",
      }),
      complete,
    } as PaidReportFulfillmentRepository;

    await expect(fulfillPaidReport(
      { orderId, paymentReference: "invoice-100" },
      { repository, generateNarrative },
    )).resolves.toMatchObject({ newlyFulfilled: false, narrativeSource: "ai" });
    expect(generateNarrative).not.toHaveBeenCalled();
    expect(complete).not.toHaveBeenCalled();
  });
});
