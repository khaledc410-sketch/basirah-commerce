import { describe, expect, it } from "vitest";

import { buildFindingDraft, evidenceIdsFromFinding } from "./finding-draft";

describe("finding-linked content drafts", () => {
  it("keeps every factual paragraph linked to recorded evidence", () => {
    const artifact = buildFindingDraft({
      id: "finding-content-direct-answer",
      category: "answerability",
      severity: "high",
      title: "الإجابة المباشرة مفقودة",
      description: "تبدأ الصفحة بمقدمة طويلة قبل الإجابة.",
      recommendation: "أضف إجابة موجزة ثم خطوات واضحة.",
      confidenceBps: 9300,
      evidenceIds: ["evidence-h1", "evidence-copy"],
      sourceUrl: "https://example.com/product",
      pageTitle: "منتج تجريبي",
    });

    const draft = artifact.draft as {
      sections: Array<{ paragraphs: Array<{ evidenceIds: string[] }> }>;
      structuredData: { status: string };
      exports: { html: string; markdown: string };
    };
    const paragraphs = draft.sections.flatMap((section) => section.paragraphs);
    expect(paragraphs).not.toHaveLength(0);
    expect(paragraphs.every((paragraph) => paragraph.evidenceIds.length > 0)).toBe(true);
    expect(draft.structuredData.status).toBe("not_generated");
    expect(draft.exports.html).toContain('dir="rtl"');
    expect(draft.exports.markdown).toContain("لا يُعد اختلاف لقطة واحدة اتجاهًا");
    expect(artifact.claimCheck).toMatchObject({
      status: "passed",
      unsupportedClaims: 0,
      allFactualParagraphsHaveEvidence: true,
    });
    expect(artifact.appliedSkills).toEqual(["content-strategy", "blog", "ai-seo"]);
    expect(artifact.brief).toMatchObject({
      strategy: {
        mode: "searchable",
        contentType: "page-improvement",
        buyerStage: "implementation",
        relatedQuestionsBasis: "finding-derived-editorial-hypotheses",
      },
    });
  });

  it("escapes source-controlled values in the HTML export", () => {
    const artifact = buildFindingDraft({
      id: "finding-xss-safe",
      category: "content",
      severity: "medium",
      title: '<img src=x onerror="alert(1)">',
      description: "الوصف يحتاج تحسينًا.",
      recommendation: "اكتب وصفًا واضحًا.",
      confidenceBps: 8000,
      evidenceIds: [],
    });
    const html = ((artifact.draft as { exports: { html: string } }).exports).html;
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;img");
  });

  it("extracts bounded evidence identifiers and has a safe fallback", () => {
    expect(evidenceIdsFromFinding({ ids: ["evidence-1", "evidence-1", 3] }, "finding-1"))
      .toEqual(["evidence-1"]);
    expect(evidenceIdsFromFinding({ evidence: { ids: ["evidence-2"] } }, "finding-1"))
      .toEqual(["evidence-2"]);
    expect(evidenceIdsFromFinding({}, "finding-1")).toEqual(["finding-1"]);
  });
});
