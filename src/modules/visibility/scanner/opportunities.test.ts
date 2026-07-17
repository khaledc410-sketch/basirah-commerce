import { describe, expect, it } from "vitest";

import type { CrawlResult, PageInspection } from "./types";
import { buildOrganicGrowthPlan } from "./opportunities";

function page(overrides: Partial<PageInspection> = {}): PageInspection {
  return {
    url: "https://shop.example.sa/",
    statusCode: 200,
    contentType: "text/html",
    checksum: "abc",
    title: "متجر العناية السعودية | Example",
    description: "منتجات عناية موثقة",
    canonical: "https://shop.example.sa/",
    language: "ar",
    visibleText: "منتجات عناية موثقة",
    wordCount: 20,
    arabicCharacterRatio: 0.8,
    headings: ["متجر العناية السعودية"],
    h1Count: 1,
    questionHeadingCount: 0,
    jsonLdTypes: ["Organization"],
    jsonLdBlocks: 1,
    invalidJsonLdBlocks: 0,
    internalLinks: [],
    hasEmail: false,
    hasPhone: false,
    policyKinds: [],
    ...overrides,
  };
}

describe("organic growth plan", () => {
  it("derives website-specific keyword, product, content, and Search Console work", () => {
    const crawl: CrawlResult = {
      requestedUrl: "https://shop.example.sa/",
      domain: "shop.example.sa",
      robots: { status: "available", url: "https://shop.example.sa/robots.txt" },
      sitemap: { status: "available", urlsDiscovered: 2 },
      pages: [
        page(),
        page({
          url: "https://shop.example.sa/products/serum",
          title: "سيروم لطيف للبشرة الحساسة | Example",
          description: null,
          headings: ["سيروم لطيف للبشرة الحساسة"],
          jsonLdTypes: [],
          h1Count: 2,
          wordCount: 58,
        }),
      ],
      attemptedPages: 2,
      scannedAt: "2026-07-16T00:00:00.000Z",
    };

    const plan = buildOrganicGrowthPlan(crawl, "ar");

    expect(plan.pageSnapshots).toHaveLength(2);
    expect(plan.keywordOpportunities).toEqual(expect.arrayContaining([
      expect.objectContaining({ keyword: "سيروم لطيف للبشرة الحساسة", intent: "transactional" }),
    ]));
    expect(plan.productEnhancements[0]).toMatchObject({
      targetKeyword: "سيروم لطيف للبشرة الحساسة",
      evidence: { descriptionPresent: false, h1Count: 2, hasProductSchema: false },
    });
    expect(plan.productEnhancements[0]?.actions).toHaveLength(5);
    expect(plan.contentOpportunities.map((item) => item.type)).toEqual([
      "buying-guide",
      "comparison",
      "how-to",
      "faq",
    ]);
    expect(plan.searchConsole).toMatchObject({
      status: "not_connected",
      property: "sc-domain:shop.example.sa",
    });
    expect(plan.searchConsole.links.console).toContain("resource_id=sc-domain%3Ashop.example.sa");
    expect(plan.searchConsole.metrics.every((metric) => metric.value === null)).toBe(true);
  });

  it("never invents product work when the sampled pages contain no product page", () => {
    const crawl: CrawlResult = {
      requestedUrl: "https://example.com/",
      domain: "example.com",
      robots: { status: "not_found", url: "https://example.com/robots.txt" },
      sitemap: { status: "not_found", urlsDiscovered: 0 },
      pages: [page({ url: "https://example.com/", title: "Example Domain" })],
      attemptedPages: 1,
      scannedAt: "2026-07-16T00:00:00.000Z",
    };

    const plan = buildOrganicGrowthPlan(crawl, "en");
    expect(plan.productEnhancements).toEqual([]);
    expect(plan.contentOpportunities).toHaveLength(4);
  });

  it("recognizes Salla-style product and category paths and excludes policy pages", () => {
    const crawl: CrawlResult = {
      requestedUrl: "https://example.com/",
      domain: "example.com",
      robots: { status: "available", url: "https://example.com/robots.txt" },
      sitemap: { status: "available", urlsDiscovered: 3 },
      pages: [
        page({
          url: "https://example.com/ar/fragrance/p123456",
          title: "عطر زهري يومي | Example",
          jsonLdTypes: [],
        }),
        page({
          url: "https://example.com/ar/perfumes/c987654",
          title: "عطور نسائية | Example",
          jsonLdTypes: [],
        }),
        page({
          url: "https://example.com/ar/page-1",
          title: "سياسة الاستبدال | Example",
          policyKinds: ["returns"],
        }),
      ],
      attemptedPages: 3,
      scannedAt: "2026-07-16T00:00:00.000Z",
    };

    const plan = buildOrganicGrowthPlan(crawl, "ar");

    expect(plan.pageSnapshots.map((snapshot) => snapshot.kind)).toEqual([
      "product",
      "category",
      "policy",
    ]);
    expect(plan.keywordOpportunities.map((item) => item.intent)).toEqual([
      "transactional",
      "commercial",
    ]);
    expect(plan.productEnhancements).toHaveLength(1);
  });

  it("does not treat a product as a policy because policy text appears in its footer", () => {
    const crawl: CrawlResult = {
      requestedUrl: "https://example.com/",
      domain: "example.com",
      robots: { status: "available", url: "https://example.com/robots.txt" },
      sitemap: { status: "available", urlsDiscovered: 1 },
      pages: [
        page({
          url: "https://example.com/ar/fragrance/p123456",
          title: "عطر زهري يومي | Example",
          policyKinds: ["returns", "shipping"],
        }),
      ],
      attemptedPages: 1,
      scannedAt: "2026-07-16T00:00:00.000Z",
    };

    const plan = buildOrganicGrowthPlan(crawl, "ar");
    expect(plan.pageSnapshots[0]?.kind).toBe("product");
    expect(plan.productEnhancements).toHaveLength(1);
  });

  it("uses the descriptive title segment instead of a one-word brand", () => {
    const crawl: CrawlResult = {
      requestedUrl: "https://example.com/",
      domain: "example.com",
      robots: { status: "available", url: "https://example.com/robots.txt" },
      sitemap: { status: "available", urlsDiscovered: 1 },
      pages: [
        page({
          url: "https://example.com/ar/hair-cream/p123",
          title: "ميلي | كريم تصفيف الشعر اليومي بإكليل الجبل والنعناع 240 مل | Example",
          headings: ["ميلي"],
        }),
      ],
      attemptedPages: 1,
      scannedAt: "2026-07-16T00:00:00.000Z",
    };

    const plan = buildOrganicGrowthPlan(crawl, "ar");
    expect(plan.keywordOpportunities[0]?.keyword).toBe(
      "كريم تصفيف الشعر اليومي بإكليل الجبل والنعناع 240 مل",
    );
  });

  it("removes a leading Latin brand fragment from an otherwise Arabic candidate", () => {
    const crawl: CrawlResult = {
      requestedUrl: "https://example.com/",
      domain: "example.com",
      robots: { status: "available", url: "https://example.com/robots.txt" },
      sitemap: { status: "not_found", urlsDiscovered: 0 },
      pages: [page({ title: "Raw Beauty تسوقي أحدث منتجات العناية بالبشرة" })],
      attemptedPages: 1,
      scannedAt: "2026-07-16T00:00:00.000Z",
    };

    expect(buildOrganicGrowthPlan(crawl, "ar").keywordOpportunities[0]?.keyword).toBe(
      "تسوقي أحدث منتجات العناية بالبشرة",
    );
  });
});
