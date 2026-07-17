import { describe, expect, it } from "vitest";

import { demoProducts } from "@/core/demo/seed";
import {
  advise,
  extractConstraints,
  selectCandidateProducts,
} from "@/modules/advisor/recommendation";

describe("advisor recommendation invariants", () => {
  it("normalizes Arabic digits in budget constraints", () => {
    expect(extractConstraints("ميزانيتي ١٠٠ ريال").budgetMinor).toBe(10_000);
  });

  it("never recommends inactive or out-of-stock products", () => {
    const products = structuredClone(demoProducts);
    products[0].status = "draft";
    products[1].stock = 0;
    products[1].available = false;
    const results = selectCandidateProducts(products, {
      skinTypes: [],
      concerns: [],
    });
    expect(results.map((product) => product.id)).toEqual(["prod_barrier_moisturizer"]);
  });

  it("enforces budget as a hard filter", () => {
    const result = advise("أبي منتج تحت 100 ريال", demoProducts);
    expect(result.products.map((product) => product.id)).toEqual(["prod_gentle_cleanser"]);
    expect(result.products.every((product) => product.price.amount <= 10_000)).toBe(true);
  });

  it("enforces requested skin type before merchant priority", () => {
    const products = structuredClone(demoProducts);
    products[2].priority = 10_000;
    const result = advise("بشرتي دهنية وأبي شيء للمسام", products);
    expect(result.products.map((product) => product.id)).toEqual(["prod_serum_balance"]);
  });

  it("returns an honest no-result response instead of inventing a product", () => {
    const result = advise("بشرتي دهنية وميزانيتي 50 ريال", demoProducts);
    expect(result.products).toHaveLength(0);
    expect(result.assistantText).toContain("لم أجد منتجًا متاحًا");
  });

  it("only names selected products in the grounded explanation", () => {
    const result = advise("بشرتي دهنية وميزانيتي 150 ريال", demoProducts);
    expect(result.assistantText).toContain(result.products[0].name.ar);
    expect(result.assistantText).not.toContain("مرطب الحاجز");
  });
});
