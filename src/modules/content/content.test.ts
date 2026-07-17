import { describe, expect, it } from "vitest";

import { demoProducts, demoStore } from "@/core/demo/seed";
import {
  buildArticleJsonLd,
  buildBrief,
  buildEvidenceLedArticle,
  buildFaqJsonLd,
  buildOutline,
  collectVerifiedFacts,
  composeDraft,
  detectAiPatterns,
  reviewArticle,
} from "@/modules/content";

const request = {
  topic: "دليل اختيار روتين للبشرة الحساسة بثقة",
  targetQuery: "ما أفضل روتين للبشرة الحساسة؟",
  audience: "عميلات يبحثن عن روتين لطيف موثوق",
  demandEvidence: "126 محادثة موافق عليها سألت عن البشرة الحساسة خلال 30 يومًا",
  slug: "sensitive-skin-routine-guide",
};

function makeDraft() {
  const brief = buildBrief(demoStore, demoProducts, request);
  const outline = buildOutline(brief);
  return { brief, outline, draft: composeDraft(brief, outline) };
}

describe("content pipeline", () => {
  it("executes the exact content-strategy, blog, and AI SEO stack", () => {
    const article = buildEvidenceLedArticle(demoStore, demoProducts, request);
    expect(article.appliedSkills).toEqual(["content-strategy", "blog", "ai-seo"]);
    expect(article.review.categories.map((category) => category.key)).toEqual(
      expect.arrayContaining(["seo", "evidence", "peopleFirst"]),
    );
    expect(article.structuredData.blogPosting["@type"]).toBe("BlogPosting");
    expect(article.brief.strategy).toMatchObject({
      mode: "searchable",
      contentType: "evidence-led-guide",
      buyerStage: "consideration",
      demandBasis: "merchant-provided",
      relatedQuestionsBasis: "editorial-hypotheses",
    });
    expect(article.brief.strategy.relatedQuestions).toHaveLength(5);
  });

  it("collects only verified facts with named sources", () => {
    const facts = collectVerifiedFacts(demoProducts);
    expect(facts.length).toBeGreaterThan(5);
    expect(facts.every((fact) => fact.verified && fact.source.length > 0)).toBe(true);
  });

  it("surfaces missing document-backed facts instead of filling them", () => {
    const withoutDocs = demoProducts.map((product) => ({
      ...product,
      attributes: product.attributes.filter((attribute) => attribute.source !== "document"),
    }));
    const brief = buildBrief(demoStore, withoutDocs, request);
    expect(brief.missingFacts.length).toBe(withoutDocs.length);
  });

  it("uses a natural mix of question and descriptive headings", () => {
    const { outline } = makeDraft();
    expect(outline.sections.filter((section) => section.isQuestion)).toHaveLength(1);
    expect(outline.sections.some((section) => !section.isQuestion)).toBe(true);
  });

  it("composes a draft where every factual paragraph names its source", () => {
    const { draft } = makeDraft();
    const factualParagraphs = draft.sections
      .flatMap((section) => section.paragraphs)
      .filter((paragraph) => paragraph.includes("—"));
    expect(factualParagraphs.length).toBeGreaterThan(0);
    expect(factualParagraphs.every((paragraph) => paragraph.includes("المصدر:"))).toBe(true);
    expect(draft.metaDescription.length).toBeLessThanOrEqual(165);
    expect(draft.limitations.length).toBeGreaterThan(0);
  });
});

describe("content review", () => {
  it("scores the deterministic draft without critical issues", () => {
    const { draft } = makeDraft();
    const review = reviewArticle(draft);
    expect(review.score).toBeGreaterThanOrEqual(60);
    expect(review.score).toBeLessThanOrEqual(100);
    expect(review.issues.some((issue) => issue.severity === "critical")).toBe(false);
    expect(review.categories.reduce((sum, category) => sum + category.max, 0)).toBe(100);
    expect(review.limitation).toContain("ليس ضمانًا");
  });

  it("keeps generic phrasing as a non-blocking editorial diagnostic", () => {
    const { draft } = makeDraft();
    draft.sections[0].paragraphs.push(
      "في عالم اليوم، من الجدير بالذكر أن هذا المنتج حجر الزاوية لكل روتين.",
    );
    const review = reviewArticle(draft);
    expect(review.aiSignals.bannedPhrases.length).toBeGreaterThanOrEqual(2);
    expect(review.issues.some((issue) => issue.severity === "critical")).toBe(false);
    expect(review.issues.some((issue) => issue.category === "contentQuality")).toBe(true);
    expect(review.blocking).toBe(false);
  });

  it("does not require FAQs or question-form headings to pass review", () => {
    const { draft } = makeDraft();
    draft.faqs = [];
    draft.sections = draft.sections.map((section, index) => ({
      ...section,
      heading: `قسم وصفي ${index + 1}`,
    }));
    const review = reviewArticle(draft);
    expect(review.issues.some((issue) => issue.message.includes("FAQ"))).toBe(false);
    expect(review.issues.some((issue) => issue.message.includes("صيغة سؤال"))).toBe(false);
  });

  it("blocks drafts that lose their sources", () => {
    const { draft } = makeDraft();
    draft.sources = [];
    const review = reviewArticle(draft);
    expect(review.blocking).toBe(true);
    expect(review.blockingReason.length).toBeGreaterThan(0);
  });

  it("measures burstiness and vocabulary diversity deterministically", () => {
    const { draft } = makeDraft();
    const signals = detectAiPatterns(draft);
    expect(signals.burstiness).toBeGreaterThan(0);
    expect(signals.typeTokenRatio).toBeGreaterThan(0);
    expect(["natural", "borderline", "flagged"]).toContain(signals.burstinessBand);
  });
});

describe("article structured data", () => {
  it("builds BlogPosting and FAQPage from the draft only", () => {
    const { draft } = makeDraft();
    const blogPosting = buildArticleJsonLd(demoStore, draft);
    expect(blogPosting["@type"]).toBe("BlogPosting");
    expect(blogPosting.mainEntityOfPage).toContain(draft.slug);
    const faqPage = buildFaqJsonLd(draft);
    expect(faqPage.mainEntity).toHaveLength(draft.faqs.length);
  });
});
