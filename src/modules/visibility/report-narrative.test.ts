import { describe, expect, it } from "vitest";

import {
  buildDeterministicArabicNarrative,
  generateArabicReportNarrative,
  visibilityReportBackendSkillKeys,
} from "@/modules/visibility/report-narrative";

describe("buildDeterministicArabicNarrative", () => {
  it("preserves evidence ids and separates readiness from observed visibility", () => {
    const result = buildDeterministicArabicNarrative({
      domain: "example.sa",
      score: 62,
      coverage: 80,
      confidence: 78,
      findings: [
        {
          id: "finding-1",
          title: "صفحة العلامة غير واضحة",
          description: "لا يوجد وصف صريح للعلامة أو مجال عملها.",
          recommendation: "أضف تعريفًا مباشرًا ومدعومًا بحقائق قابلة للتحقق.",
          severity: "high",
          evidenceIds: ["evidence-1"],
        },
      ],
      limitations: ["تعذر فحص صفحتين بسبب robots.txt."],
    });

    expect(result.priorities[0]?.findingId).toBe("finding-1");
    expect(result.executiveSummary).toContain("لا تمثل ظهورًا فعليًا");
    expect(result.limitations.join(" ")).toContain("لا يضمن");
  });

  it("binds AI visibility reports to AI SEO and PDF visual design only", async () => {
    expect(visibilityReportBackendSkillKeys).toEqual(["ai-seo", "canvas-design"]);
    const generated = await generateArabicReportNarrative({
      domain: "example.sa",
      score: 70,
      coverage: 90,
      confidence: 85,
      findings: [],
      limitations: ["لا تتوفر بيانات ظهور مرصود."],
    });
    expect(generated.appliedSkills).toEqual(["ai-seo", "canvas-design"]);
  });
});
