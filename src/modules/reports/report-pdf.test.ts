import { describe, expect, it } from "vitest";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import type { TenantReportDetailDto } from "@/modules/reports/tenant-reports";

import {
  assertPaidReportPdfAccess,
  generatePaidReportPdf,
  paidReportPdfFilename,
} from "./report-pdf";

function report(
  accessLevel: "preview" | "full" = "full",
): TenantReportDetailDto {
  return {
    id: "report-12345678",
    domain: "example.sa",
    score: 72,
    coverage: 90,
    confidence: 86,
    methodologyVersion: "site-readiness-v1",
    generatedAt: "2026-07-14T00:00:00.000Z",
    expiresAt: "2027-07-14T00:00:00.000Z",
    pagesScanned: 3,
    findingsCount: 3,
    accessLevel,
    shareActive: false,
    components: [
      { key: "technical", label: "تقني", weight: 20, score: 72, coverage: 100 },
      { key: "content", label: "المحتوى", weight: 25, score: 58, coverage: 90 },
      {
        key: "entity",
        label: "وضوح الكيان",
        weight: 15,
        score: 44,
        coverage: 85,
      },
      { key: "trust", label: "الثقة", weight: 15, score: 76, coverage: 100 },
      {
        key: "answerability",
        label: "قابلية الإجابة",
        weight: 10,
        score: 63,
        coverage: 80,
      },
      {
        key: "structuredData",
        label: "البيانات المنظمة",
        weight: 10,
        score: 38,
        coverage: 75,
      },
      {
        key: "externalEvidence",
        label: "الأدلة الخارجية",
        weight: 5,
        score: null,
        coverage: 0,
      },
    ],
    findings: [
      {
        id: "finding-1",
        component: "technical",
        title: "العنوان لا يوضح هوية المتجر",
        description: "العنوان الحالي عام ولا يشرح الفئة أو العلامة.",
        severity: "high",
        recommendation: "اكتب عنوانًا مباشرًا يوضح العلامة والفئة.",
        evidenceIds: ["evidence-1"],
      },
      {
        id: "finding-2",
        component: "structuredData",
        title: "حقائق المنتج غير مكتملة في البيانات المنظمة",
        description:
          "صفحة المنتج لا تعرض السعر والتوفر ضمن بيانات Product وOffer.",
        severity: "high",
        recommendation:
          "أضف القيم الحقيقية المتطابقة مع الصفحة واختبرها قبل النشر.",
        evidenceIds: ["evidence-2"],
      },
      {
        id: "finding-3",
        component: "content",
        title: "صفحات المنتجات لا تجيب عن أسئلة الشراء",
        description:
          "المحتوى يذكر اسم المنتج فقط ولا يشرح الاستخدام أو الاختيار.",
        severity: "medium",
        recommendation:
          "أضف إجابات قصيرة موثقة حول الاستخدام والمواصفات والشحن.",
        evidenceIds: ["evidence-3"],
      },
    ],
    evidence: [
      {
        id: "evidence-1",
        component: "technical",
        checkKey: "page-title",
        status: "fail",
        message: "لم يتضمن العنوان تعريفًا واضحًا.",
        urls: ["https://example.sa/"],
      },
      {
        id: "evidence-2",
        component: "structuredData",
        checkKey: "product-offer-schema",
        status: "fail",
        message: "لم تظهر بيانات Product وOffer مكتملة في صفحة المنتج.",
        urls: ["https://example.sa/products/example"],
      },
      {
        id: "evidence-3",
        component: "content",
        checkKey: "product-answerability",
        status: "unknown",
        message: "المحتوى المتاح لا يكفي لإجابة أسئلة الاستخدام والاختيار.",
        urls: ["https://example.sa/products/example"],
      },
    ],
    narrative: null,
    limitations: ["Search Console غير متصل."],
    pages: [
      {
        url: "https://example.sa/",
        canonicalUrl: null,
        title: "المتجر",
        httpStatus: 200,
      },
      {
        url: "https://example.sa/products/example",
        canonicalUrl: null,
        title: "منتج تجريبي",
        httpStatus: 200,
      },
      {
        url: "https://example.sa/policies/returns",
        canonicalUrl: null,
        title: "سياسة الاسترجاع",
        httpStatus: 200,
      },
    ],
  };
}

describe("paid report PDF", () => {
  it("rejects preview reports before rendering", () => {
    expect(() => assertPaidReportPdfAccess(report("preview"))).toThrowError(
      expect.objectContaining({ code: "REPORT_LOCKED", status: 403 }),
    );
  });

  it("creates a bounded Arabic PDF with document pages", async () => {
    const pdf = await generatePaidReportPdf(report());
    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
    expect(pdf.byteLength).toBeGreaterThan(10_000);
    expect(pdf.byteLength).toBeLessThan(5_000_000);
    expect(pdf.toString("latin1").match(/\/Type \/Page\b/gu)?.length).toBe(3);
    if (process.env.WRITE_REPORT_PDF_FIXTURE === "1") {
      const output = resolve("output/pdf");
      await mkdir(output, { recursive: true });
      await writeFile(resolve(output, "basirah-arabic-report-sample.pdf"), pdf);
    }
    expect(paidReportPdfFilename(report())).toBe(
      "basirah-visibility-example.sa-report-12345.pdf",
    );
  }, 15_000);
});
