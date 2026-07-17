import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import type { PublicSharedReportDto } from "@/modules/acquisition/types";

import { freeReportPdfFilename, generateFreeReportPdf } from "./free-report-pdf";

function result(): PublicSharedReportDto {
  return {
    accessLevel: "full",
    expiresAt: "2026-08-14T00:00:00.000Z",
    report: {
      domain: "example.sa",
      score: 61,
      coverage: 90,
      confidence: 84,
      pagesScanned: 5,
      scannedAt: "2026-07-16T08:00:00.000Z",
      components: [
        { key: "technical", label: "تقني", weight: 20, score: 61, coverage: 100 },
        { key: "content", label: "المحتوى", weight: 20, score: 54, coverage: 80 },
        { key: "entity", label: "وضوح الكيان", weight: 10, score: 42, coverage: 100 },
        { key: "trust", label: "الثقة", weight: 15, score: 68, coverage: 100 },
        { key: "answerability", label: "قابلية الإجابة", weight: 15, score: 49, coverage: 75 },
        { key: "structuredData", label: "البيانات المنظمة", weight: 10, score: 72, coverage: 100 },
        { key: "externalEvidence", label: "الأدلة الخارجية", weight: 10, score: null, coverage: 0 },
      ],
      findings: [
        {
          id: "finding_1",
          component: "entity",
          title: "هوية المتجر غير واضحة بما يكفي",
          description: "لا تشرح الصفحة الرئيسية العلامة والفئة والسوق بوضوح.",
          severity: "high",
          recommendation: "أضف تعريفًا مباشرًا بالعلامة والفئة والسوق في الصفحة الرئيسية وصفحة من نحن.",
          evidenceIds: ["evidence_1"],
        },
        {
          id: "finding_2",
          component: "answerability",
          title: "صفحات المنتجات لا تجيب عن أسئلة الشراء",
          description: "المعلومات الحالية مواصفات متفرقة وليست إجابات مباشرة.",
          severity: "high",
          recommendation: "أضف إجابات قصيرة للأسئلة المتكررة حول الاستخدام والاختيار والشحن.",
          evidenceIds: ["evidence_2"],
        },
        {
          id: "finding_3",
          component: "trust",
          title: "سياسة الإرجاع صعبة الاكتشاف",
          description: "لم يظهر رابط واضح للسياسة من صفحات المنتجات.",
          severity: "medium",
          recommendation: "اربط سياسة الإرجاع بوضوح من صفحات المنتجات والتذييل.",
          evidenceIds: ["evidence_3"],
        },
      ],
      evidence: [
        {
          id: "evidence_1",
          component: "entity",
          checkKey: "entity-description",
          status: "fail",
          message: "لم نجد تعريفًا مباشرًا بالعلامة والفئة والسوق.",
          urls: ["https://example.sa/"],
        },
        {
          id: "evidence_2",
          component: "answerability",
          checkKey: "buyer-questions",
          status: "fail",
          message: "لا توجد إجابات مباشرة عن أسئلة الاختيار والاستخدام.",
          urls: ["https://example.sa/products/example"],
        },
        {
          id: "evidence_3",
          component: "trust",
          checkKey: "return-policy-link",
          status: "fail",
          message: "رابط سياسة الإرجاع غير ظاهر من صفحة المنتج.",
          urls: ["https://example.sa/products/example"],
        },
      ],
      organicGrowthPlan: {
        source: "deterministic-public-pages",
        keywordMethod: "مرشحات موضوعية من عناوين الصفحات في العينة؛ يجب التحقق منها في Search Console.",
        pageSnapshots: [
          {
            url: "https://example.sa/products/example",
            kind: "product",
            title: "سيروم لطيف للبشرة الحساسة",
            descriptionPresent: false,
            wordCount: 58,
            h1Count: 2,
            questionHeadingCount: 0,
            structuredDataTypes: [],
          },
        ],
        keywordOpportunities: [
          {
            keyword: "سيروم لطيف للبشرة الحساسة",
            intent: "transactional",
            targetUrl: "https://example.sa/products/example",
            source: "title",
            confidence: "high",
            rationale: "مرشح من عنوان صفحة المنتج، ويحتاج تحققًا من Search Console.",
          },
          {
            keyword: "منتجات العناية السعودية",
            intent: "commercial",
            targetUrl: "https://example.sa/category/skincare",
            source: "title",
            confidence: "high",
            rationale: "مرشح من عنوان صفحة الفئة، ويحتاج تحققًا من مشرفي بحث غوغل.",
          },
          {
            keyword: "روتين البشرة الحساسة",
            intent: "informational",
            targetUrl: "https://example.sa/blog/sensitive-skin",
            source: "heading",
            confidence: "medium",
            rationale: "مرشح من عنوان مقال، ويحتاج تحققًا من مشرفي بحث غوغل.",
          },
        ],
        productEnhancements: [
          {
            url: "https://example.sa/products/example",
            currentTitle: "سيروم لطيف للبشرة الحساسة",
            targetKeyword: "سيروم لطيف للبشرة الحساسة",
            suggestedTitle: "سيروم لطيف للبشرة الحساسة | example.sa",
            actions: ["أضف وصفًا فريدًا.", "أضف بيانات المنتج المنظمة من الحقائق الظاهرة فقط."],
            evidence: {
              descriptionPresent: false,
              wordCount: 58,
              h1Count: 2,
              hasProductSchema: false,
            },
          },
        ],
        contentOpportunities: [
          {
            type: "buying-guide",
            label: "دليل شراء",
            targetKeyword: "سيروم لطيف للبشرة الحساسة",
            workingTitle: "دليل اختيار سيروم لطيف للبشرة الحساسة",
            sourceUrl: "https://example.sa/products/example",
            reason: "يبني على موضوع موجود في الموقع.",
          },
          {
            type: "comparison",
            label: "مقارنة",
            targetKeyword: "سيروم لطيف للبشرة الحساسة",
            workingTitle: "مقارنة خيارات السيروم حسب الاحتياج",
            sourceUrl: "https://example.sa/products/example",
            reason: "يبني على موضوع موجود في الموقع.",
          },
          {
            type: "how-to",
            label: "شرح عملي",
            targetKeyword: "سيروم لطيف للبشرة الحساسة",
            workingTitle: "كيفية اختيار السيروم واستخدامه",
            sourceUrl: "https://example.sa/products/example",
            reason: "يبني على موضوع موجود في الموقع.",
          },
          {
            type: "faq",
            label: "أسئلة شائعة",
            targetKeyword: "سيروم لطيف للبشرة الحساسة",
            workingTitle: "أسئلة شائعة عن السيروم والشحن والإرجاع",
            sourceUrl: "https://example.sa/products/example",
            reason: "يبني على موضوع موجود في الموقع.",
          },
        ],
        searchConsole: {
          status: "not_connected",
          property: "sc-domain:example.sa",
          links: {
            console: "https://search.google.com/search-console?resource_id=sc-domain%3Aexample.sa",
            setupGuide: "https://support.google.com/webmasters/answer/34592",
            performanceGuide: "https://support.google.com/webmasters/answer/7576553",
            urlInspectionGuide: "https://support.google.com/webmasters/answer/9012289",
            sitemapsGuide: "https://support.google.com/webmasters/answer/7451001",
          },
          metrics: [
            { key: "clicks", label: "النقرات", value: null, status: "not_connected" },
            { key: "impressions", label: "مرات الظهور", value: null, status: "not_connected" },
            { key: "ctr", label: "نسبة النقر", value: null, status: "not_connected" },
            { key: "position", label: "متوسط الموضع", value: null, status: "not_connected" },
            { key: "queries", label: "الاستعلامات", value: null, status: "not_connected" },
            { key: "pages", label: "الصفحات", value: null, status: "not_connected" },
          ],
        },
      },
      limitations: ["Search Console وGA4 غير متصلين."],
    },
  };
}

describe("free report PDF", () => {
  it("creates a decision-ready seven-page report", async () => {
    const pdf = await generateFreeReportPdf({
      result: result(),
      locale: "ar",
      reportUrl: "https://basirah.example/ar/report/private-token",
      pricingUrl: "https://basirah.example/ar/pricing",
    });

    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
    expect(pdf.byteLength).toBeGreaterThan(10_000);
    expect(pdf.byteLength).toBeLessThan(2_000_000);
    expect(pdf.toString("latin1").match(/\/Type \/Page\b/gu)?.length).toBe(7);

    if (process.env.WRITE_FREE_REPORT_PDF_FIXTURE === "1") {
      const output = resolve("output/pdf");
      await mkdir(output, { recursive: true });
      await writeFile(resolve(output, "basirah-free-report-sample.pdf"), pdf);
    }
  }, 15_000);

  it("uses a stable safe filename", () => {
    expect(freeReportPdfFilename("example.sa")).toBe(
      "basirah-free-visibility-report-example.sa.pdf",
    );
  });

  it("renders the same complete structure in English", async () => {
    const pdf = await generateFreeReportPdf({
      result: result(),
      locale: "en",
      reportUrl: "https://basirah.example/en/report/private-token",
      pricingUrl: "https://basirah.example/en/pricing",
    });

    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
    expect(pdf.toString("latin1").match(/\/Type \/Page\b/gu)?.length).toBe(7);

    if (process.env.WRITE_FREE_REPORT_PDF_FIXTURE === "1") {
      const output = resolve("output/pdf");
      await mkdir(output, { recursive: true });
      await writeFile(resolve(output, "basirah-free-report-sample-en.pdf"), pdf);
    }
  }, 15_000);
});
