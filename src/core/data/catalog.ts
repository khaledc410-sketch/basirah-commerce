import "server-only";

import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";

const productRowSchema = z.object({
  id: z.string().uuid(),
  external_id: z.string(),
  sku: z.string().nullable(),
  slug: z.string().nullable(),
  status: z.enum(["draft", "active", "archived"]),
  title: z.string(),
  description: z.string().nullable(),
  currency: z.string(),
  price_minor: z.number().int(),
  compare_at_price_minor: z.number().int().nullable(),
  stock_quantity: z.number().int().nullable(),
  track_inventory: z.boolean(),
  available_for_sale: z.boolean(),
  metadata: z.record(z.string(), z.unknown()).nullable(),
  source_updated_at: z.string().nullable(),
  updated_at: z.string(),
});

const mediaSchema = z.object({
  product_id: z.string().uuid(),
  url: z.string().url(),
  alt_text: z.string().nullable(),
  position: z.number().int(),
});

const variantSchema = z.object({
  id: z.string().uuid(),
  external_id: z.string(),
  sku: z.string().nullable(),
  title: z.string(),
  currency: z.string(),
  price_minor: z.number().int(),
  compare_at_price_minor: z.number().int().nullable(),
  stock_quantity: z.number().int().nullable(),
  available_for_sale: z.boolean(),
  attributes: z.record(z.string(), z.unknown()).nullable(),
});

const attributeSchema = z.object({
  key: z.string(),
  values: z.array(z.string()),
  locale: z.enum(["ar", "en"]).nullable(),
  verified: z.boolean(),
});

export interface LiveCatalogProduct {
  id: string;
  externalId: string;
  sku: string | null;
  slug: string | null;
  status: "draft" | "active" | "archived";
  title: string;
  description: string | null;
  currency: string;
  priceMinor: number;
  compareAtPriceMinor: number | null;
  stockQuantity: number | null;
  trackInventory: boolean;
  availableForSale: boolean;
  category: string | null;
  productUrl: string | null;
  imageUrl: string | null;
  sourceUpdatedAt: string | null;
  updatedAt: string;
  variants?: z.infer<typeof variantSchema>[];
  attributes?: z.infer<typeof attributeSchema>[];
}

function textMetadata(metadata: Record<string, unknown> | null, key: string) {
  const value = metadata?.[key];
  return typeof value === "string" && value ? value : null;
}

function mapProduct(
  row: z.infer<typeof productRowSchema>,
  image?: z.infer<typeof mediaSchema>,
): LiveCatalogProduct {
  return {
    id: row.id,
    externalId: row.external_id,
    sku: row.sku,
    slug: row.slug,
    status: row.status,
    title: row.title,
    description: row.description,
    currency: row.currency,
    priceMinor: row.price_minor,
    compareAtPriceMinor: row.compare_at_price_minor,
    stockQuantity: row.stock_quantity,
    trackInventory: row.track_inventory,
    availableForSale: row.available_for_sale,
    category: textMetadata(row.metadata, "primaryCategory"),
    productUrl: textMetadata(row.metadata, "productUrl"),
    imageUrl: image?.url ?? textMetadata(row.metadata, "mainImageUrl"),
    sourceUpdatedAt: row.source_updated_at,
    updatedAt: row.updated_at,
  };
}

export async function listLiveCatalogProducts(storeId: string, limit = 100, offset = 0) {
  const supabase = await createSupabaseServerClient();
  const { data, error, count } = await supabase
    .from("products")
    .select(
      "id, external_id, sku, slug, status, title, description, currency, price_minor, compare_at_price_minor, stock_quantity, track_inventory, available_for_sale, metadata, source_updated_at, updated_at",
      { count: "exact" },
    )
    .eq("store_id", storeId)
    .is("source_deleted_at", null)
    .order("updated_at", { ascending: false })
    .range(
      Math.max(0, offset),
      Math.max(0, offset) + Math.max(1, Math.min(limit, 100)) - 1,
    );
  if (error) throw new Error("The live catalog could not be loaded.");
  const rows = z.array(productRowSchema).parse(data ?? []);
  if (rows.length === 0) return { products: [], total: count ?? 0 };

  const { data: mediaData, error: mediaError } = await supabase
    .from("product_media")
    .select("product_id, url, alt_text, position")
    .eq("store_id", storeId)
    .in("product_id", rows.map((row) => row.id))
    .order("position", { ascending: true });
  if (mediaError) throw new Error("The live product media could not be loaded.");
  const media = z.array(mediaSchema).parse(mediaData ?? []);
  const firstImage = new Map<string, z.infer<typeof mediaSchema>>();
  for (const image of media) if (!firstImage.has(image.product_id)) firstImage.set(image.product_id, image);

  return {
    products: rows.map((row) => mapProduct(row, firstImage.get(row.id))),
    total: count ?? rows.length,
  };
}

export async function getLiveCatalogSummary(storeId: string) {
  const supabase = await createSupabaseServerClient();
  const base = () =>
    supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("store_id", storeId)
      .is("source_deleted_at", null);
  const [total, available, outOfStock, drafts] = await Promise.all([
    base(),
    base().eq("available_for_sale", true),
    base().eq("track_inventory", true).lte("stock_quantity", 0),
    base().eq("status", "draft"),
  ]);
  if (total.error || available.error || outOfStock.error || drafts.error) {
    throw new Error("The live catalog summary could not be loaded.");
  }
  return {
    total: total.count ?? 0,
    available: available.count ?? 0,
    outOfStock: outOfStock.count ?? 0,
    drafts: drafts.count ?? 0,
  };
}

export async function getLiveCatalogProduct(storeId: string, productId: string) {
  if (!z.string().uuid().safeParse(productId).success) return null;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      "id, external_id, sku, slug, status, title, description, currency, price_minor, compare_at_price_minor, stock_quantity, track_inventory, available_for_sale, metadata, source_updated_at, updated_at",
    )
    .eq("store_id", storeId)
    .eq("id", productId)
    .is("source_deleted_at", null)
    .maybeSingle();
  if (error) throw new Error("The live product could not be loaded.");
  if (!data) return null;
  const row = productRowSchema.parse(data);

  const [mediaResult, variantsResult, attributesResult] = await Promise.all([
    supabase.from("product_media").select("product_id, url, alt_text, position").eq("store_id", storeId).eq("product_id", productId).order("position"),
    supabase.from("product_variants").select("id, external_id, sku, title, currency, price_minor, compare_at_price_minor, stock_quantity, available_for_sale, attributes").eq("store_id", storeId).eq("product_id", productId).is("source_deleted_at", null).order("created_at"),
    supabase.from("product_attributes").select("key, values, locale, verified").eq("store_id", storeId).eq("product_id", productId).order("key"),
  ]);
  if (mediaResult.error || variantsResult.error || attributesResult.error) {
    throw new Error("The live product details could not be loaded.");
  }
  const media = z.array(mediaSchema).parse(mediaResult.data ?? []);
  return {
    ...mapProduct(row, media[0]),
    variants: z.array(variantSchema).parse(variantsResult.data ?? []),
    attributes: z.array(attributeSchema).parse(attributesResult.data ?? []),
  };
}
