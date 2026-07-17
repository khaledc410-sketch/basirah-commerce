import { describe, expect, it } from "vitest";

import {
  backendSkillRegistry,
  buildBackendSkillInstructions,
  listPublicBackendSkills,
  resolveBackendSkills,
} from "@/modules/skills/backend";

describe("backend skill registry", () => {
  it("registers the six runtime capabilities with unique keys", () => {
    expect(backendSkillRegistry).toHaveLength(6);
    expect(new Set(backendSkillRegistry.map((skill) => skill.key)).size).toBe(6);
    expect(listPublicBackendSkills()).toHaveLength(6);
  });

  it("automatically composes the content stack for a blog task", () => {
    const selected = resolveBackendSkills("اكتب مقال مدونة يظهر في إجابات ChatGPT");
    expect(selected.map((skill) => skill.key)).toEqual(
      expect.arrayContaining(["content-strategy", "blog", "ai-seo"]),
    );
    expect(selected.map((skill) => skill.category)).not.toContain("reporting");
  });

  it("selects AI SEO and visual design for a PDF visibility report", () => {
    const selected = resolveBackendSkills(
      "Create an AI visibility PDF report with an executive summary",
    );
    expect(selected.map((skill) => skill.key)).toEqual(
      expect.arrayContaining(["ai-seo", "canvas-design"]),
    );
    expect(selected.map((skill) => skill.key)).not.toEqual(
      expect.arrayContaining(["blog", "docx", "power-bi-report-design-consultation"]),
    );
  });

  it("keeps Power BI scoped to dashboard requests", () => {
    expect(resolveBackendSkills("Design a Power BI dashboard").map((skill) => skill.key)).toContain(
      "power-bi-report-design-consultation",
    );
    expect(resolveBackendSkills("Write a blog article").map((skill) => skill.key)).not.toContain(
      "power-bi-report-design-consultation",
    );
  });

  it("builds server instructions without exposing trigger patterns", () => {
    const selected = resolveBackendSkills("Create a DOCX report with a visual cover");
    const prompt = buildBackendSkillInstructions(selected);
    expect(prompt).toContain("Document report design");
    expect(prompt).toContain("Visual report design");
    expect(prompt).not.toContain("RegExp");
  });

  it("keeps Google guidance people-first and rejects unsupported AI requirements", () => {
    const prompt = buildBackendSkillInstructions([
      backendSkillRegistry.find((skill) => skill.key === "ai-seo")!,
    ]);
    expect(prompt).toContain("people-first");
    expect(prompt).toContain("Do not recommend AI-only rewrites");
    expect(prompt).toContain("not a requirement for Google's generative Search features");
  });
});
