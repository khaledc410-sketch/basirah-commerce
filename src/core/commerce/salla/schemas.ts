import { z } from "zod";

/**
 * Salla's examples contain number/string and object/empty-object drift. These
 * schemas validate every field the mapper consumes while allowing unrelated
 * upstream additions. The mapped commerce objects are the strict boundary.
 */

export const sallaIdSchema = z.union([
  z.number().int().nonnegative(),
  z.string().trim().regex(/^\d+$/),
]);

export const sallaDecimalSchema = z.union([
  z.number().finite(),
  z.string().trim().regex(/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/),
]);

const emptyObjectSchema = z.object({}).strict();
const nullableTextSchema = z.string().nullable().optional();

export const sallaMoneySchema = z
  .object({
    amount: sallaDecimalSchema,
    currency: z.string().trim().length(3),
  })
  .passthrough();

export const sallaMaybeMoneySchema = z
  .union([sallaMoneySchema, emptyObjectSchema, z.null()])
  .optional();

export const sallaDateSchema = z.union([
  z.string().min(1),
  z
    .object({
      date: z.string().min(1),
      timezone_type: z.number().int().optional(),
      timezone: z.string().optional(),
    })
    .passthrough(),
]);

export const sallaPaginationSchema = z
  .object({
    count: z.coerce.number().int().nonnegative(),
    total: z.coerce.number().int().nonnegative(),
    perPage: z.coerce.number().int().positive(),
    currentPage: z.coerce.number().int().nonnegative(),
    totalPages: z.coerce.number().int().nonnegative(),
    links: z
      .union([
        z.array(z.string()),
        z
          .object({
            previous: z.string().nullable().optional(),
            next: z.string().nullable().optional(),
          })
          .passthrough(),
      ])
      .default([]),
  })
  .passthrough();

export const sallaImageSchema = z
  .object({
    id: sallaIdSchema,
    url: z.string().min(1),
    main: z.boolean().optional(),
    three_d_image_url: nullableTextSchema,
    alt: nullableTextSchema,
    video_url: nullableTextSchema,
    type: z.enum(["image", "video"]).optional(),
    sort: z.coerce.number().optional(),
  })
  .passthrough();

const sallaOptionValueTranslationSchema = z
  .object({
    option_details_name: z.string().optional(),
  })
  .passthrough();

const sallaOptionTranslationSchema = z
  .object({
    option_name: z.string().optional(),
    description: z.string().nullable().optional(),
  })
  .passthrough();

const noTranslationsSchema = z.array(z.unknown()).length(0);

export const sallaOptionValueSchema = z
  .object({
    id: sallaIdSchema,
    name: z.string(),
    price: sallaMoneySchema.optional(),
    formatted_price: nullableTextSchema,
    display_value: nullableTextSchema,
    option_id: sallaIdSchema.optional(),
    image_url: nullableTextSchema,
    translations: z
      .union([
        z.record(z.string(), sallaOptionValueTranslationSchema),
        noTranslationsSchema,
      ])
      .optional(),
    is_default: z.boolean().optional(),
    is_out_of_stock: z.boolean().optional(),
  })
  .passthrough();

export const sallaOptionSchema = z
  .object({
    id: sallaIdSchema,
    name: z.string(),
    description: nullableTextSchema,
    type: z.string().min(1),
    required: z.boolean().optional(),
    translations: z
      .union([z.record(z.string(), sallaOptionTranslationSchema), noTranslationsSchema])
      .optional(),
    values: z.array(sallaOptionValueSchema).default([]),
  })
  .passthrough();

export const sallaVariantSchema = z
  .object({
    id: sallaIdSchema,
    price: sallaMoneySchema,
    regular_price: sallaMaybeMoneySchema,
    sale_price: sallaMaybeMoneySchema,
    cost_price: sallaMaybeMoneySchema,
    has_special_price: z.boolean().optional(),
    stock_quantity: sallaDecimalSchema.nullable().optional(),
    unlimited_quantity: z.boolean().optional(),
    notify_low: sallaDecimalSchema.nullable().optional(),
    barcode: nullableTextSchema,
    sku: nullableTextSchema,
    mpn: nullableTextSchema,
    gtin: nullableTextSchema,
    related_option_values: z.array(sallaIdSchema).default([]),
    updated_at: sallaDateSchema.nullable().optional(),
    is_default: z.boolean().optional(),
  })
  .passthrough();

export const sallaEmbeddedCategorySchema = z
  .object({
    id: sallaIdSchema,
    name: z.string(),
    parent_id: sallaIdSchema.nullable().optional(),
    status: z.enum(["active", "hidden"]).optional(),
    update_at: sallaDateSchema.nullable().optional(),
  })
  .passthrough();

export const sallaProductSchema = z
  .object({
    id: sallaIdSchema,
    type: z
      .enum([
        "product",
        "service",
        "group_products",
        "codes",
        "digital",
        "food",
        "donating",
        "booking",
      ])
      .optional(),
    name: z.string(),
    description: nullableTextSchema,
    sku: nullableTextSchema,
    mpn: nullableTextSchema,
    gtin: nullableTextSchema,
    short_link_code: nullableTextSchema,
    status: z.enum(["sale", "out", "hidden", "deleted"]),
    is_available: z.boolean(),
    price: sallaMoneySchema,
    regular_price: sallaMaybeMoneySchema,
    sale_price: sallaMaybeMoneySchema,
    sale_end: z.union([z.string(), emptyObjectSchema, z.null()]).optional(),
    quantity: sallaDecimalSchema.nullable().optional(),
    unlimited_quantity: z.boolean().optional(),
    managed_by_branches: z.boolean().optional(),
    url: nullableTextSchema,
    urls: z
      .object({
        customer: nullableTextSchema,
        admin: nullableTextSchema,
      })
      .passthrough()
      .optional(),
    thumbnail: nullableTextSchema,
    main_image: nullableTextSchema,
    images: z.array(sallaImageSchema).default([]),
    updated_at: sallaDateSchema.nullable().optional(),
    options: z.array(sallaOptionSchema).default([]),
    skus: z.array(sallaVariantSchema).default([]),
    categories: z.array(sallaEmbeddedCategorySchema).default([]),
  })
  .passthrough();

const categoryTranslationSchema = z
  .object({
    name: z.string().optional(),
    metadata: z
      .object({
        title: nullableTextSchema,
        description: nullableTextSchema,
        url: nullableTextSchema,
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

export const sallaCategorySchema = z
  .object({
    id: sallaIdSchema,
    name: z.string(),
    image: nullableTextSchema,
    parent_id: sallaIdSchema.nullable().optional(),
    sort_order: z.coerce.number().nullable().optional(),
    status: z.enum(["active", "hidden"]),
    update_at: sallaDateSchema.nullable().optional(),
    translations: z
      .union([z.record(z.string(), categoryTranslationSchema), noTranslationsSchema])
      .optional(),
    // Nested items are not requested by the catalog transport and remain raw.
    items: z.array(z.unknown()).optional(),
    sub_categories: z.array(z.unknown()).optional(),
  })
  .passthrough();

export const sallaStoreSchema = z
  .object({
    id: sallaIdSchema,
    name: z.string().min(1),
    entity: z.string().optional(),
    plan: z.string().optional(),
    type: z.string().optional(),
    status: z.string().optional(),
    verified: z.boolean().optional(),
    currency: z.string().trim().length(3),
    domain: z.string().min(1),
    description: nullableTextSchema,
  })
  .passthrough();

export const sallaStoreResponseSchema = z
  .object({
    status: z.coerce.number().int(),
    success: z.literal(true),
    data: sallaStoreSchema,
  })
  .passthrough();

export const sallaProductResponseSchema = z
  .object({
    status: z.coerce.number().int(),
    success: z.literal(true),
    data: sallaProductSchema,
  })
  .passthrough();

export const sallaProductPageSchema = z
  .object({
    status: z.coerce.number().int(),
    success: z.literal(true),
    data: z.array(sallaProductSchema),
    pagination: sallaPaginationSchema,
  })
  .passthrough();

export const sallaCategoryPageSchema = z
  .object({
    status: z.coerce.number().int(),
    success: z.literal(true),
    data: z.array(sallaCategorySchema),
    pagination: sallaPaginationSchema,
  })
  .passthrough();

export type SallaDecimal = z.infer<typeof sallaDecimalSchema>;
export type SallaMoney = z.infer<typeof sallaMoneySchema>;
export type SallaPagination = z.infer<typeof sallaPaginationSchema>;
export type SallaImage = z.infer<typeof sallaImageSchema>;
export type SallaOption = z.infer<typeof sallaOptionSchema>;
export type SallaOptionValue = z.infer<typeof sallaOptionValueSchema>;
export type SallaVariant = z.infer<typeof sallaVariantSchema>;
export type SallaProduct = z.infer<typeof sallaProductSchema>;
export type SallaStore = z.infer<typeof sallaStoreSchema>;
export type SallaProductPage = z.infer<typeof sallaProductPageSchema>;
export type SallaProductResponse = z.infer<typeof sallaProductResponseSchema>;
export type SallaStoreResponse = z.infer<typeof sallaStoreResponseSchema>;
export type SallaCategory = z.infer<typeof sallaCategorySchema>;
export type SallaCategoryPage = z.infer<typeof sallaCategoryPageSchema>;
