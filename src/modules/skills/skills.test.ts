import { describe, expect, it } from "vitest";

import { demoProducts, demoStore } from "@/core/demo/seed";
import { getSkill, runSkillsForProduct, skillRegistry, summarizeReports } from "@/modules/skills";
import { runAeoSkill } from "@/modules/skills/aeo";
import { runGeoSkill } from "@/modules/skills/geo";
import { runSeoSkill } from "@/modules/skills/seo";
import { buildProductJsonLd, runStructuredDataSkill } from "@/modules/skills/structured-data";

const input = { store: demoStore, product: demoProducts[0] };

describe("skill registry", () => {
  it("registers unique skills with versions and Arabic labels", () => {
    const keys = skillRegistry.map((skill) => skill.key);
    expect(new Set(keys).size).toBe(skillRegistry.length);
    for (const skill of skillRegistry) {
      expect(skill.version).toMatch(/-v\d+$/);
      expect(skill.label.ar.length).toBeGreaterThan(0);
      expect(getSkill(skill.key)).toBe(skill);
    }
  });

  it("runs all skills for a product and summarizes per skill", () => {
    const reports = runSkillsForProduct(demoStore, demoProducts[0]);
    expect(reports).toHaveLength(skillRegistry.length);
    for (const report of reports) {
      expect(report.score).toBeGreaterThanOrEqual(0);
      expect(report.score).toBeLessThanOrEqual(100);
      expect(report.limitation.length).toBeGreaterThan(0);
    }
    const summary = summarizeReports(reports);
    expect(summary).toHaveLength(skillRegistry.length);
    expect(summary.every((entry) => entry.productsAudited === 1)).toBe(true);
  });
});

describe("seo skill", () => {
  it("passes on the complete seeded product", () => {
    const report = runSeoSkill(input);
    expect(report.score).toBeGreaterThan(80);
    expect(report.checks.find((check) => check.key === "slug_quality")?.status).toBe("pass");
  });

  it("penalizes a short description and broken slug deterministically", () => {
    const degraded = structuredClone(demoProducts[0]);
    degraded.description.ar = "قصير";
    degraded.slug = "Bad Slug_!!";
    const report = runSeoSkill({ store: demoStore, product: degraded });
    expect(report.score).toBeLessThan(runSeoSkill(input).score);
    expect(report.checks.find((check) => check.key === "meta_description_length")?.status).toBe("fail");
    expect(report.checks.find((check) => check.key === "slug_quality")?.status).toBe("warning");
  });
});

describe("aeo skill", () => {
  it("recognizes answerable verified facts", () => {
    const report = runAeoSkill(input);
    expect(report.skillVersion).toBe("aeo-skill-v2");
    expect(report.checks.find((check) => check.key === "audience_fit_answerable")?.status).toBe("pass");
    expect(report.checks.find((check) => check.key === "usage_guidance")?.status).toBe("pass");
  });

  it("fails audience fit when attributes are removed", () => {
    const degraded = structuredClone(demoProducts[0]);
    degraded.attributes = [];
    const report = runAeoSkill({ store: demoStore, product: degraded });
    expect(report.checks.find((check) => check.key === "audience_fit_answerable")?.status).toBe("fail");
    expect(report.score).toBeLessThan(runAeoSkill(input).score);
  });
});

describe("geo skill", () => {
  it("passes claim checks on sourced seed content", () => {
    const report = runGeoSkill(input);
    expect(report.skillVersion).toBe("geo-skill-v2");
    expect(report.checks.find((check) => check.key === "no_unverifiable_claims")?.status).toBe("pass");
    expect(report.checks.find((check) => check.key === "document_backed_facts")?.status).toBe("pass");
  });

  it("fails when unverifiable superlative or medical claims appear", () => {
    const degraded = structuredClone(demoProducts[0]);
    degraded.description.ar = "الأفضل في المملكة ويعالج كل مشاكل البشرة.";
    const report = runGeoSkill({ store: demoStore, product: degraded });
    expect(report.checks.find((check) => check.key === "no_unverifiable_claims")?.status).toBe("fail");
  });
});

describe("structured-data skill", () => {
  it("generates Product JSON-LD from verified facts with major-unit pricing", () => {
    const jsonLd = buildProductJsonLd(demoStore, demoProducts[0]);
    expect(jsonLd["@type"]).toBe("Product");
    expect(jsonLd.offers.price).toBe("129.00");
    expect(jsonLd.offers.priceCurrency).toBe("SAR");
    expect(jsonLd.brand.name).toBe(demoStore.name.ar);
    expect(jsonLd.additionalProperty.length).toBe(
      demoProducts[0].attributes.filter((attribute) => attribute.verified).length,
    );
  });

  it("omits unverified attributes instead of fabricating identifiers", () => {
    const degraded = structuredClone(demoProducts[0]);
    degraded.attributes = degraded.attributes.map((attribute) => ({ ...attribute, verified: false }));
    const jsonLd = buildProductJsonLd(demoStore, degraded);
    expect(jsonLd.additionalProperty).toHaveLength(0);
    const report = runStructuredDataSkill({ store: demoStore, product: degraded });
    expect(report.checks.find((check) => check.key === "global_identifier")?.status).toBe("warning");
    expect(report.artifacts?.productJsonLd).toBeDefined();
  });
});
