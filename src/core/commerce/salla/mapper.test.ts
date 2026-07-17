import { describe, expect, it } from "vitest";

import {
  syntheticArabicCategory,
  syntheticArabicProduct,
  syntheticEnglishCategory,
  syntheticEnglishProduct,
  syntheticProductPageResponse,
  syntheticStoreResponse,
} from "@/core/commerce/salla/fixtures/official-docs.synthetic";
import {
  decimalToMinorUnits,
  mapSallaCategory,
  mapSallaPagination,
  mapSallaProduct,
  mapSallaStore,
} from "@/core/commerce/salla/mapper";
import {
  sallaCategorySchema,
  sallaPaginationSchema,
  sallaProductSchema,
  sallaStoreResponseSchema,
} from "@/core/commerce/salla/schemas";

describe("Salla catalog mapper", () => {
  it("converts decimal major units to integer halalas without float multiplication", () => {
    expect(decimalToMinorUnits("96.33")).toBe(9_633);
    expect(decimalToMinorUnits(0.1)).toBe(10);
    expect(decimalToMinorUnits("1.005")).toBe(101);
    expect(decimalToMinorUnits("1e2")).toBe(10_000);
  });

  it("maps localized product, sale pricing, media, options, stock and provenance", () => {
    const arabic = sallaProductSchema.parse(syntheticArabicProduct);
    const english = sallaProductSchema.parse(syntheticEnglishProduct);
    const product = mapSallaProduct(arabic, english, "store-local-1");

    expect(product).toMatchObject({
      id: "store-local-1:product:9100000001",
      storeId: "store-local-1",
      externalId: "9100000001",
      slug: "test-shirt",
      status: "active",
      name: { ar: "قميص اختباري", en: "Test shirt" },
      description: { ar: "وصف اصطناعي", en: "Synthetic description" },
      category: "ملابس",
      categoryExternalIds: ["9150000001"],
      imageUrl: "https://example.invalid/media/thumb.jpg",
      media: [
        {
          externalId: "9110000001",
          url: "https://example.invalid/media/main.jpg",
          alt: "صورة",
          position: 1,
        },
      ],
      price: { amount: 9_050, currency: "SAR" },
      compareAtPrice: { amount: 10_000, currency: "SAR" },
      stock: 4,
      unlimitedStock: false,
      available: true,
      provenance: {
        platform: "salla",
        externalId: "9100000001",
        externalUpdatedAt: "2026-07-13T09:00:00.000Z",
        sourceVersion: "salla-admin-v2:2026-07-13 12:00:00",
      },
    });
    expect(product.variants[0]).toMatchObject({
      externalId: "9140000001",
      sku: "RED-A-BLUE",
      name: { ar: "أزرق", en: "Blue" },
      price: { amount: 9_050, currency: "SAR" },
      compareAtPrice: { amount: 10_000, currency: "SAR" },
      stock: 4,
      available: true,
      options: { "اللون": "أزرق" },
    });
    expect(product.attributes).toEqual([
      {
        key: "color",
        label: { ar: "اللون", en: "Color" },
        values: ["أزرق"],
        verified: true,
        source: "platform",
      },
    ]);
  });

  it("maps out-of-stock status separately from catalog lifecycle status", () => {
    const raw = sallaProductSchema.parse({
      ...syntheticArabicProduct,
      status: "out",
      is_available: false,
      quantity: 0,
      skus: [],
      sale_price: {},
    });
    const product = mapSallaProduct(raw, undefined, "store-local-1");

    expect(product.status).toBe("active");
    expect(product.available).toBe(false);
    expect(product.variants[0].available).toBe(false);
  });

  it("preserves unlimited availability without inventing a huge stock number", () => {
    const raw = sallaProductSchema.parse({
      ...syntheticArabicProduct,
      quantity: null,
      unlimited_quantity: true,
      skus: [],
    });
    const product = mapSallaProduct(raw, undefined, "store-local-1");

    expect(product.stock).toBe(0);
    expect(product.unlimitedStock).toBe(true);
    expect(product.available).toBe(true);
  });

  it("maps store and localized category identities within the tenant boundary", () => {
    const store = mapSallaStore(
      sallaStoreResponseSchema.parse(syntheticStoreResponse).data,
      undefined,
      "store-local-1",
    );
    const category = mapSallaCategory(
      sallaCategorySchema.parse(syntheticArabicCategory),
      sallaCategorySchema.parse(syntheticEnglishCategory),
      "store-local-1",
    );

    expect(store).toMatchObject({
      id: "store-local-1",
      externalId: "9000000001",
      domain: "https://example.invalid/store",
      currency: "SAR",
      timezone: "Asia/Riyadh",
    });
    expect(category).toEqual({
      id: "store-local-1:category:9150000001",
      storeId: "store-local-1",
      externalId: "9150000001",
      name: { ar: "ملابس", en: "Clothing" },
    });
  });

  it("normalizes page metadata and derives the next page", () => {
    const pagination = sallaPaginationSchema.parse(syntheticProductPageResponse.pagination);

    expect(mapSallaPagination(pagination)).toEqual({
      count: 1,
      total: 61,
      perPage: 60,
      currentPage: 1,
      totalPages: 2,
      nextPage: 2,
    });
  });
});
