/**
 * SYNTHETIC, REDACTED TEST DATA shaped from docs.salla.dev examples.
 * These payloads were not recorded from a Salla demo/sandbox/live store and
 * must never be used as evidence that the connector is sandbox verified.
 */
export const SYNTHETIC_FIXTURE_NOTICE =
  "Synthetic official-doc shape; not captured from a Salla store.";

export const syntheticStoreResponse = {
  status: 200,
  success: true,
  data: {
    id: 9_000_000_001,
    name: "متجر تجريبي منقح",
    entity: "company",
    plan: "pro",
    type: "demo",
    status: "active",
    verified: false,
    currency: "SAR",
    domain: "https://example.invalid/store/",
    description: "بيانات اصطناعية",
  },
};

export const syntheticArabicProduct = {
  id: 9_100_000_001,
  type: "product",
  name: "قميص اختباري",
  description: "وصف اصطناعي",
  sku: "RED-A-1",
  mpn: null,
  gtin: null,
  short_link_code: "redacted",
  status: "sale",
  is_available: true,
  price: { amount: "96.33", currency: "SAR" },
  regular_price: { amount: "100.00", currency: "SAR" },
  sale_price: { amount: "90.50", currency: "SAR" },
  sale_end: {},
  quantity: "4",
  unlimited_quantity: false,
  managed_by_branches: false,
  urls: {
    customer: "https://example.invalid/ar/store/test-shirt/p9100000001",
    admin: "https://example.invalid/admin/products/9100000001",
  },
  thumbnail: "https://example.invalid/media/thumb.jpg",
  main_image: null,
  images: [
    {
      id: 9_110_000_001,
      url: "https://example.invalid/media/main.jpg",
      main: true,
      three_d_image_url: null,
      alt: "صورة",
      video_url: null,
      type: "image",
      sort: 1,
    },
  ],
  updated_at: "2026-07-13 12:00:00",
  options: [
    {
      id: 9_120_000_001,
      name: "اللون",
      description: null,
      type: "radio",
      required: true,
      translations: {
        ar: { option_name: "اللون", description: null },
      },
      values: [
        {
          id: 9_130_000_001,
          name: "أزرق",
          price: { amount: 0, currency: "SAR" },
          option_id: 9_120_000_001,
          display_value: "#0000ff",
          image_url: null,
          translations: {
            ar: { option_details_name: "أزرق" },
          },
          is_default: true,
          is_out_of_stock: false,
        },
      ],
    },
  ],
  skus: [
    {
      id: 9_140_000_001,
      price: { amount: "96.33", currency: "SAR" },
      regular_price: { amount: "100.00", currency: "SAR" },
      sale_price: { amount: "90.50", currency: "SAR" },
      cost_price: {},
      has_special_price: true,
      stock_quantity: "4",
      unlimited_quantity: false,
      notify_low: "1",
      barcode: "REDACTED-BARCODE",
      sku: "RED-A-BLUE",
      mpn: null,
      gtin: null,
      related_option_values: [9_130_000_001],
      updated_at: {
        date: "2026-07-13 12:00:00.000000",
        timezone_type: 3,
        timezone: "Asia/Riyadh",
      },
      is_default: true,
    },
  ],
  categories: [
    {
      id: 9_150_000_001,
      name: "ملابس",
      parent_id: 0,
      status: "active",
      update_at: {
        date: "2026-07-13 11:00:00.000000",
        timezone_type: 3,
        timezone: "Asia/Riyadh",
      },
    },
  ],
};

export const syntheticEnglishProduct = {
  ...syntheticArabicProduct,
  name: "Test shirt",
  description: "Synthetic description",
  options: [
    {
      ...syntheticArabicProduct.options[0],
      name: "Color",
      translations: { en: { option_name: "Color", description: null } },
      values: [
        {
          ...syntheticArabicProduct.options[0].values[0],
          name: "Blue",
          translations: { en: { option_details_name: "Blue" } },
        },
      ],
    },
  ],
  categories: [
    {
      ...syntheticArabicProduct.categories[0],
      name: "Clothing",
    },
  ],
};

export const syntheticProductPageResponse = {
  status: 200,
  success: true,
  data: [syntheticArabicProduct],
  pagination: {
    count: 1,
    total: 61,
    perPage: 60,
    currentPage: 1,
    totalPages: 2,
    links: {
      previous: null,
      next: "https://api.salla.dev/admin/v2/products?page=2",
    },
  },
};

export const syntheticArabicCategory = {
  id: 9_150_000_001,
  name: "ملابس",
  image: null,
  parent_id: 0,
  sort_order: 1,
  status: "active",
  update_at: "2026-07-13 11:00:00",
  translations: {
    en: { name: "Clothing", metadata: { title: null, description: null, url: null } },
  },
};

export const syntheticEnglishCategory = {
  ...syntheticArabicCategory,
  name: "Clothing",
  translations: [],
};

export const syntheticCategoryPageResponse = {
  status: 200,
  success: true,
  data: [syntheticArabicCategory],
  pagination: {
    count: 1,
    total: 1,
    perPage: 60,
    currentPage: 1,
    totalPages: 1,
    links: [],
  },
};
