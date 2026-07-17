import { describe, expect, it } from "vitest";

import { demoProducts } from "@/core/demo/seed";
import {
  auditProduct,
  calculateStoreReadiness,
  storeReadinessComponents,
} from "@/modules/visibility/readiness";

describe("AI visibility readiness methodology", () => {
  it("keeps the documented component weights at 100 percent", () => {
    expect(storeReadinessComponents.reduce((sum, component) => sum + component.weight, 0)).toBe(100);
  });

  it("returns a weighted readiness score without mention data", () => {
    expect(calculateStoreReadiness()).toBe(75);
    expect(storeReadinessComponents.every((component) => !("mentions" in component))).toBe(true);
  });

  it("explicitly limits product audit claims", () => {
    const audit = auditProduct(demoProducts[0]);
    expect(audit.score).toBeGreaterThan(0);
    expect(audit.score).toBeLessThanOrEqual(100);
    expect(audit.limitation).toContain("ليست قياسًا لظهور المنتج فعليًا");
    expect(audit.scoringVersion).toBe("product-readiness-v2");
  });

  it("penalizes missing verified content deterministically", () => {
    const incomplete = structuredClone(demoProducts[0]);
    incomplete.description.ar = "قصير";
    incomplete.description.en = undefined;
    incomplete.attributes = [];
    expect(auditProduct(incomplete).score).toBeLessThan(auditProduct(demoProducts[0]).score);
  });
});
