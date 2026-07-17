import { describe, expect, it } from "vitest";

import {
  SYNTHETIC_FIXTURE_NOTICE,
  syntheticCategoryPageResponse,
  syntheticEnglishCategory,
  syntheticProductPageResponse,
} from "@/core/commerce/salla/fixtures/official-docs.synthetic";
import {
  sallaCategoryPageSchema,
  sallaCategorySchema,
  sallaProductPageSchema,
} from "@/core/commerce/salla/schemas";

describe("Salla upstream schemas", () => {
  it("labels contract fixtures as synthetic rather than sandbox evidence", () => {
    expect(SYNTHETIC_FIXTURE_NOTICE).toContain("not captured from a Salla store");
  });

  it("accepts documented product response drift without coercing decimal values", () => {
    const parsed = sallaProductPageSchema.parse(syntheticProductPageResponse);

    expect(parsed.data[0].quantity).toBe("4");
    expect(parsed.data[0].skus[0].cost_price).toEqual({});
    expect(parsed.pagination.links).toEqual({
      previous: null,
      next: "https://api.salla.dev/admin/v2/products?page=2",
    });
  });

  it("accepts array pagination links and empty translation arrays from category examples", () => {
    const page = sallaCategoryPageSchema.parse(syntheticCategoryPageResponse);
    const category = sallaCategorySchema.parse(syntheticEnglishCategory);

    expect(page.pagination.links).toEqual([]);
    expect(category.translations).toEqual([]);
  });
});
