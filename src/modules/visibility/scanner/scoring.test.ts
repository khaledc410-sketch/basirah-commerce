import { describe, expect, it } from "vitest";

import { calculateComponentScores, evaluateCrawl, type DeterministicCheck } from "./scoring";
import { SITE_READINESS_METHODOLOGY_VERSION, type CrawlResult, type PageInspection } from "./types";

const page: PageInspection = {
  url: "https://shop.example.com/",
  statusCode: 200,
  contentType: "text/html",
  checksum: "abc",
  title: "متجر بصيرة",
  description: "وصف عربي موثق للمتجر",
  canonical: "https://shop.example.com/",
  language: "ar",
  visibleText: "منتج عربي ".repeat(100),
  wordCount: 200,
  arabicCharacterRatio: 0.8,
  headings: ["متجر بصيرة", "كيف تختار المنتج؟"],
  h1Count: 1,
  questionHeadingCount: 1,
  jsonLdTypes: ["Organization", "Product", "FAQPage"],
  jsonLdBlocks: 1,
  invalidJsonLdBlocks: 0,
  internalLinks: [
    "https://shop.example.com/about",
    "https://shop.example.com/privacy",
    "https://shop.example.com/returns",
  ],
  hasEmail: true,
  hasPhone: false,
  policyKinds: ["privacy", "returns"],
};

describe("deterministic visibility scoring", () => {
  it("uses the Google-aligned v2 methodology weights", () => {
    const report = evaluateCrawl({
      requestedUrl: page.url,
      domain: "shop.example.com",
      robots: { status: "available", url: "https://shop.example.com/robots.txt" },
      sitemap: { status: "available", urlsDiscovered: 1 },
      pages: [page],
      attemptedPages: 1,
      scannedAt: "2026-07-14T00:00:00.000Z",
    }, "ar");
    expect(SITE_READINESS_METHODOLOGY_VERSION).toBe("site-readiness-v2");
    expect(Object.fromEntries(report.components.map((component) => [component.key, component.weight]))).toEqual({
      technical: 25,
      content: 30,
      entity: 10,
      trust: 15,
      answerability: 10,
      structuredData: 5,
      externalEvidence: 5,
    });
  });

  it("lowers coverage, not score, for unknown evidence", () => {
    const known: DeterministicCheck[] = [
      { key: "a", component: "technical", status: "pass", message: "known" },
    ];
    const withUnknown = [
      ...known,
      { key: "external", component: "externalEvidence", status: "unknown", message: "unknown" },
    ] satisfies DeterministicCheck[];

    expect(calculateComponentScores(known).score).toBe(100);
    expect(calculateComponentScores(withUnknown).score).toBe(100);
    expect(calculateComponentScores(withUnknown).coverage).toBeLessThan(100);
  });

  it("always returns all seven components and evidence-linked findings", () => {
    const crawl: CrawlResult = {
      requestedUrl: page.url,
      domain: "shop.example.com",
      robots: { status: "available", url: "https://shop.example.com/robots.txt" },
      sitemap: { status: "available", urlsDiscovered: 1 },
      pages: [{ ...page, jsonLdTypes: [] }],
      attemptedPages: 1,
      scannedAt: "2026-07-13T10:00:00.000Z",
    };
    const report = evaluateCrawl(crawl, "ar");

    expect(report.components).toHaveLength(7);
    expect(report.components.find((component) => component.key === "externalEvidence")).toMatchObject({
      score: null,
      coverage: 0,
    });
    expect(report.findings.every((finding) => finding.evidenceIds.length > 0)).toBe(true);
  });

  it("records short copy and missing FAQs as context without failing them", () => {
    const report = evaluateCrawl({
      requestedUrl: page.url,
      domain: "shop.example.com",
      robots: { status: "available", url: "https://shop.example.com/robots.txt" },
      sitemap: { status: "available", urlsDiscovered: 1 },
      pages: [{ ...page, visibleText: "وصف مفيد", wordCount: 2, questionHeadingCount: 0, jsonLdTypes: ["Organization", "Product"] }],
      attemptedPages: 1,
      scannedAt: "2026-07-14T00:00:00.000Z",
    }, "ar");
    expect(report.evidence).toEqual(expect.arrayContaining([
      expect.objectContaining({ checkKey: "content-depth", status: "unknown" }),
      expect.objectContaining({ checkKey: "question-content", status: "unknown" }),
    ]));
    expect(report.findings.some((finding) => ["content-depth", "question-content"].some((key) => finding.id.includes(key)))).toBe(false);
  });

  it("lowers coverage and confidence when candidate pages are unavailable", () => {
    const base: CrawlResult = {
      requestedUrl: page.url,
      domain: "shop.example.com",
      robots: { status: "available", url: "https://shop.example.com/robots.txt" },
      sitemap: { status: "available", urlsDiscovered: 3 },
      pages: [page],
      attemptedPages: 1,
      scannedAt: "2026-07-13T10:00:00.000Z",
    };
    const complete = evaluateCrawl(base, "ar");
    const partial = evaluateCrawl(
      {
        ...base,
        attemptedPages: 3,
        unavailablePageUrls: [
          "https://shop.example.com/p/2",
          "https://shop.example.com/p/3",
        ],
      },
      "ar",
    );

    expect(partial.score).toBe(complete.score);
    expect(partial.coverage).toBeLessThan(complete.coverage);
    expect(partial.confidence).toBeLessThan(complete.confidence);
    expect(partial.evidence).toContainEqual(
      expect.objectContaining({ checkKey: "page-fetch-coverage", status: "unknown" }),
    );
  });

  it("does not penalize a sitemap that could not be verified", () => {
    const report = evaluateCrawl(
      {
        requestedUrl: page.url,
        domain: "shop.example.com",
        robots: { status: "available", url: "https://shop.example.com/robots.txt" },
        sitemap: { status: "unavailable", urlsDiscovered: 0 },
        pages: [page],
        attemptedPages: 1,
        rootPageStatus: "available",
        scannedAt: "2026-07-13T10:00:00.000Z",
      },
      "ar",
    );

    expect(report.evidence).toContainEqual(
      expect.objectContaining({ checkKey: "sitemap", status: "unknown" }),
    );
    expect(report.findings.some((finding) => finding.id === "finding-technical-sitemap")).toBe(false);
  });

  it("keeps root indexability unknown when only a deeper page was readable", () => {
    const report = evaluateCrawl(
      {
        requestedUrl: page.url,
        domain: "shop.example.com",
        robots: { status: "available", url: "https://shop.example.com/robots.txt" },
        sitemap: { status: "available", urlsDiscovered: 1 },
        pages: [
          {
            ...page,
            url: "https://shop.example.com/p/1",
            robotsDirectives: ["noindex"],
          },
        ],
        attemptedPages: 2,
        rootPageStatus: "unavailable",
        unavailablePageUrls: [page.url],
        scannedAt: "2026-07-13T10:00:00.000Z",
      },
      "ar",
    );

    expect(report.evidence).toContainEqual(
      expect.objectContaining({ checkKey: "root-indexability", status: "unknown" }),
    );
    expect(
      report.findings.some((finding) => finding.id === "finding-technical-root-indexability"),
    ).toBe(false);
    expect(report.coverage).toBeLessThan(100);
  });

  it("scores search crawler access but never penalizes training choices", () => {
    const base: CrawlResult = {
      requestedUrl: page.url,
      domain: "shop.example.com",
      robots: {
        status: "available",
        url: "https://shop.example.com/robots.txt",
        access: {
          retrieval: { googlebot: true, oaiSearchBot: true },
          training: { gptBot: true, googleExtended: true },
        },
      },
      sitemap: { status: "available", urlsDiscovered: 1 },
      pages: [page],
      attemptedPages: 1,
      rootPageStatus: "available",
      scannedAt: "2026-07-13T10:00:00.000Z",
    };
    const allowed = evaluateCrawl(base, "ar");
    const trainingBlocked = evaluateCrawl(
      {
        ...base,
        robots: {
          ...base.robots,
          access: {
            retrieval: { googlebot: true, oaiSearchBot: true },
            training: { gptBot: false, googleExtended: false },
          },
        },
      },
      "ar",
    );
    const searchBlocked = evaluateCrawl(
      {
        ...base,
        robots: {
          ...base.robots,
          access: {
            retrieval: { googlebot: false, oaiSearchBot: false },
            training: { gptBot: false, googleExtended: false },
          },
        },
      },
      "ar",
    );

    expect(trainingBlocked.score).toBe(allowed.score);
    expect(trainingBlocked.coverage).toBe(allowed.coverage);
    expect(trainingBlocked.findings.some((finding) => finding.id.includes("training"))).toBe(false);
    expect(searchBlocked.score).toBeLessThan(allowed.score);
    expect(searchBlocked.findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "finding-technical-googlebot-root-access" }),
        expect.objectContaining({ id: "finding-technical-oai-searchbot-root-access" }),
      ]),
    );
  });
});
