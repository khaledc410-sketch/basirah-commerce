import "server-only";

import {
  and,
  eq,
  inArray,
  isNull,
  lt,
  notInArray,
  or,
  sql,
} from "drizzle-orm";

import type { Database } from "@/db/client";
import {
  categories,
  outboxEvents,
  productAttributes,
  productCategories,
  productMedia,
  products,
  productTranslations,
  productVariants,
  stores,
  type JsonObject,
} from "@/db/schema";

export type CatalogTransaction = Parameters<Parameters<Database["transaction"]>[0]>[0];

export interface CatalogStoreInput {
  name: string;
  externalDomain?: string | null;
  currency: string;
  defaultLocale?: "ar" | "en";
  timezone?: string;
}

export interface CatalogCategoryInput {
  externalId: string;
  parentExternalId?: string | null;
  name: string;
  slug?: string | null;
  description?: string | null;
  position?: number;
  active: boolean;
  sourceUpdatedAt?: Date | null;
}

export interface CatalogProductTranslationInput {
  locale: "ar" | "en";
  title: string;
  description?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
}

export interface CatalogProductMediaInput {
  externalId?: string | null;
  mediaType?: string;
  url: string;
  altText?: string | null;
  locale?: "ar" | "en" | null;
  position?: number;
  width?: number | null;
  height?: number | null;
}

export interface CatalogProductVariantInput {
  externalId: string;
  sku?: string | null;
  title: string;
  currency: string;
  priceMinor: number;
  compareAtPriceMinor?: number | null;
  stockQuantity?: number | null;
  availableForSale: boolean;
  attributes?: JsonObject;
  sourceVersion?: string | null;
  sourceUpdatedAt?: Date | null;
}

export interface CatalogProductAttributeInput {
  key: string;
  values: string[];
  locale?: "ar" | "en" | null;
  verified?: boolean;
}

export interface CatalogProductInput {
  externalId: string;
  sku?: string | null;
  slug?: string | null;
  status: typeof products.$inferInsert.status;
  title: string;
  description?: string | null;
  currency: string;
  priceMinor: number;
  compareAtPriceMinor?: number | null;
  costMinor?: number | null;
  stockQuantity?: number | null;
  trackInventory: boolean;
  availableForSale: boolean;
  sourceVersion: string;
  sourceUpdatedAt?: Date | null;
  metadata?: JsonObject;
  translations?: CatalogProductTranslationInput[];
  media?: CatalogProductMediaInput[];
  variants?: CatalogProductVariantInput[];
  categoryExternalIds?: string[];
  attributes?: CatalogProductAttributeInput[];
}

function excluded(column: string) {
  return sql.raw(`excluded."${column}"`);
}

export const catalogRepository = {
  async upsertStoreProfile(
    tx: CatalogTransaction,
    input: { storeId: string; profile: CatalogStoreInput; updatedAt?: Date },
  ) {
    const updatedAt = input.updatedAt ?? new Date();
    const [store] = await tx
      .update(stores)
      .set({
        name: input.profile.name,
        externalDomain: input.profile.externalDomain,
        currency: input.profile.currency,
        defaultLocale: input.profile.defaultLocale,
        timezone: input.profile.timezone,
        updatedAt,
      })
      .where(eq(stores.id, input.storeId))
      .returning();
    if (!store) throw new Error("The store profile is outside the current tenant boundary.");
    return store;
  },

  async upsertCategoryPage(
    tx: CatalogTransaction,
    input: {
      storeId: string;
      categories: CatalogCategoryInput[];
      seenAt: Date;
    },
  ) {
    if (input.categories.length === 0) return [];
    return tx
      .insert(categories)
      .values(
        input.categories.map((category) => ({
          storeId: input.storeId,
          externalId: category.externalId,
          parentId: null,
          parentExternalId: category.parentExternalId || null,
          name: category.name,
          slug: category.slug,
          description: category.description,
          position: category.position ?? 0,
          active: category.active,
          sourceUpdatedAt: category.sourceUpdatedAt,
          sourceSeenAt: input.seenAt,
          sourceDeletedAt: null,
          updatedAt: input.seenAt,
        })),
      )
      .onConflictDoUpdate({
        target: [categories.storeId, categories.externalId],
        set: {
          parentId: null,
          parentExternalId: excluded("parent_external_id"),
          name: excluded("name"),
          slug: excluded("slug"),
          description: excluded("description"),
          position: excluded("position"),
          active: excluded("active"),
          sourceUpdatedAt: excluded("source_updated_at"),
          sourceSeenAt: excluded("source_seen_at"),
          sourceDeletedAt: null,
          updatedAt: input.seenAt,
        },
      })
      .returning();
  },

  async resolveCategoryParents(tx: CatalogTransaction, storeId: string, updatedAt = new Date()) {
    await tx
      .update(categories)
      .set({ parentId: null, updatedAt })
      .where(eq(categories.storeId, storeId));
    await tx.execute(sql`
      update ${categories} as child
      set parent_id = parent.id, updated_at = ${updatedAt}
      from ${categories} as parent
      where child.store_id = ${storeId}
        and parent.store_id = ${storeId}
        and child.parent_external_id is not null
        and child.parent_external_id = parent.external_id
        and child.id <> parent.id
    `);
  },

  async finalizeCategoryScan(
    tx: CatalogTransaction,
    input: { storeId: string; scanStartedAt: Date; completedAt?: Date },
  ) {
    const completedAt = input.completedAt ?? new Date();
    return tx
      .update(categories)
      .set({
        active: false,
        sourceDeletedAt: completedAt,
        updatedAt: completedAt,
      })
      .where(
        and(
          eq(categories.storeId, input.storeId),
          isNull(categories.sourceDeletedAt),
          or(isNull(categories.sourceSeenAt), lt(categories.sourceSeenAt, input.scanStartedAt)),
        ),
      )
      .returning({ id: categories.id });
  },

  async upsertProductPage(
    tx: CatalogTransaction,
    input: {
      storeId: string;
      products: CatalogProductInput[];
      seenAt: Date;
    },
  ) {
    if (input.products.length === 0) return { products: [], changedExternalIds: [] };
    const externalIds = input.products.map((product) => product.externalId);
    const previous = await tx
      .select({ externalId: products.externalId, sourceVersion: products.sourceVersion })
      .from(products)
      .where(and(eq(products.storeId, input.storeId), inArray(products.externalId, externalIds)));
    const previousVersions = new Map(previous.map((row) => [row.externalId, row.sourceVersion]));

    const persisted = await tx
      .insert(products)
      .values(
        input.products.map((product) => ({
          storeId: input.storeId,
          externalId: product.externalId,
          sku: product.sku,
          slug: product.slug,
          status: product.status,
          title: product.title,
          description: product.description,
          currency: product.currency,
          priceMinor: product.priceMinor,
          compareAtPriceMinor: product.compareAtPriceMinor,
          costMinor: product.costMinor,
          stockQuantity: product.stockQuantity,
          trackInventory: product.trackInventory,
          availableForSale: product.availableForSale,
          sourceVersion: product.sourceVersion,
          sourceUpdatedAt: product.sourceUpdatedAt,
          sourceSeenAt: input.seenAt,
          sourceDeletedAt: null,
          metadata: product.metadata ?? {},
          updatedAt: input.seenAt,
        })),
      )
      .onConflictDoUpdate({
        target: [products.storeId, products.externalId],
        set: {
          sku: excluded("sku"),
          slug: excluded("slug"),
          status: excluded("status"),
          title: excluded("title"),
          description: excluded("description"),
          currency: excluded("currency"),
          priceMinor: excluded("price_minor"),
          compareAtPriceMinor: excluded("compare_at_price_minor"),
          costMinor: excluded("cost_minor"),
          stockQuantity: excluded("stock_quantity"),
          trackInventory: excluded("track_inventory"),
          availableForSale: excluded("available_for_sale"),
          sourceVersion: excluded("source_version"),
          sourceUpdatedAt: excluded("source_updated_at"),
          sourceSeenAt: excluded("source_seen_at"),
          sourceDeletedAt: null,
          metadata: excluded("metadata"),
          updatedAt: input.seenAt,
        },
      })
      .returning({ id: products.id, externalId: products.externalId });
    const productIds = persisted.map((product) => product.id);
    const productIdByExternalId = new Map(
      persisted.map((product) => [product.externalId, product.id]),
    );

    // Keep child-table lock acquisition in one consistent order across every page transaction.
    await tx
      .delete(productTranslations)
      .where(
        and(
          eq(productTranslations.storeId, input.storeId),
          inArray(productTranslations.productId, productIds),
        ),
      );
    await tx
      .delete(productMedia)
      .where(
        and(eq(productMedia.storeId, input.storeId), inArray(productMedia.productId, productIds)),
      );
    await tx
      .delete(productCategories)
      .where(
        and(
          eq(productCategories.storeId, input.storeId),
          inArray(productCategories.productId, productIds),
        ),
      );
    await tx
      .delete(productAttributes)
      .where(
        and(
          eq(productAttributes.storeId, input.storeId),
          inArray(productAttributes.productId, productIds),
          eq(productAttributes.source, "platform"),
        ),
      );

    const translations = input.products.flatMap((product) => {
      const productId = productIdByExternalId.get(product.externalId);
      if (!productId) return [];
      return (product.translations ?? []).map((translation) => ({
        storeId: input.storeId,
        productId,
        locale: translation.locale,
        title: translation.title,
        description: translation.description,
        seoTitle: translation.seoTitle,
        seoDescription: translation.seoDescription,
        updatedAt: input.seenAt,
      }));
    });
    if (translations.length > 0) await tx.insert(productTranslations).values(translations);

    const media = input.products.flatMap((product) => {
      const productId = productIdByExternalId.get(product.externalId);
      if (!productId) return [];
      return (product.media ?? []).map((item) => ({
        storeId: input.storeId,
        productId,
        externalId: item.externalId,
        mediaType: item.mediaType ?? "image",
        url: item.url,
        altText: item.altText,
        locale: item.locale,
        position: item.position ?? 0,
        width: item.width,
        height: item.height,
        updatedAt: input.seenAt,
      }));
    });
    if (media.length > 0) await tx.insert(productMedia).values(media);

    const attributes = input.products.flatMap((product) => {
      const productId = productIdByExternalId.get(product.externalId);
      if (!productId) return [];
      return (product.attributes ?? []).map((attribute) => ({
        storeId: input.storeId,
        productId,
        key: attribute.key,
        values: attribute.values,
        locale: attribute.locale,
        source: "platform",
        verified: attribute.verified ?? false,
        updatedAt: input.seenAt,
      }));
    });
    if (attributes.length > 0) await tx.insert(productAttributes).values(attributes);

    const categoryExternalIds = [
      ...new Set(input.products.flatMap((product) => product.categoryExternalIds ?? [])),
    ];
    if (categoryExternalIds.length > 0) {
      const categoryRows = await tx
        .select({ id: categories.id, externalId: categories.externalId })
        .from(categories)
        .where(
          and(
            eq(categories.storeId, input.storeId),
            inArray(categories.externalId, categoryExternalIds),
          ),
        );
      const categoryIdByExternalId = new Map(
        categoryRows.map((category) => [category.externalId, category.id]),
      );
      const links = input.products.flatMap((product) => {
        const productId = productIdByExternalId.get(product.externalId);
        if (!productId) return [];
        return (product.categoryExternalIds ?? []).flatMap((externalId) => {
          const categoryId = categoryIdByExternalId.get(externalId);
          return categoryId ? [{ storeId: input.storeId, productId, categoryId }] : [];
        });
      });
      if (links.length > 0) await tx.insert(productCategories).values(links).onConflictDoNothing();
    }

    const variants = input.products.flatMap((product) => {
      const productId = productIdByExternalId.get(product.externalId);
      if (!productId) return [];
      return (product.variants ?? []).map((variant) => ({
        storeId: input.storeId,
        productId,
        externalId: variant.externalId,
        sku: variant.sku,
        title: variant.title,
        currency: variant.currency,
        priceMinor: variant.priceMinor,
        compareAtPriceMinor: variant.compareAtPriceMinor,
        stockQuantity: variant.stockQuantity,
        availableForSale: variant.availableForSale,
        attributes: variant.attributes ?? {},
        sourceVersion: variant.sourceVersion,
        sourceUpdatedAt: variant.sourceUpdatedAt,
        sourceDeletedAt: null,
        updatedAt: input.seenAt,
      }));
    });
    if (variants.length > 0) {
      await tx
        .insert(productVariants)
        .values(variants)
        .onConflictDoUpdate({
          target: [productVariants.storeId, productVariants.externalId],
          set: {
            productId: excluded("product_id"),
            sku: excluded("sku"),
            title: excluded("title"),
            currency: excluded("currency"),
            priceMinor: excluded("price_minor"),
            compareAtPriceMinor: excluded("compare_at_price_minor"),
            stockQuantity: excluded("stock_quantity"),
            availableForSale: excluded("available_for_sale"),
            attributes: excluded("attributes"),
            sourceVersion: excluded("source_version"),
            sourceUpdatedAt: excluded("source_updated_at"),
            sourceDeletedAt: null,
            updatedAt: input.seenAt,
          },
        });
    }

    for (const product of input.products) {
      const productId = productIdByExternalId.get(product.externalId);
      if (!productId) continue;
      const currentVariantIds = (product.variants ?? []).map((variant) => variant.externalId);
      const conditions = [
        eq(productVariants.storeId, input.storeId),
        eq(productVariants.productId, productId),
        isNull(productVariants.sourceDeletedAt),
      ];
      if (currentVariantIds.length > 0) {
        conditions.push(notInArray(productVariants.externalId, currentVariantIds));
      }
      await tx
        .update(productVariants)
        .set({
          availableForSale: false,
          sourceDeletedAt: input.seenAt,
          updatedAt: input.seenAt,
        })
        .where(and(...conditions));
    }

    const changedExternalIds = input.products
      .filter((product) => previousVersions.get(product.externalId) !== product.sourceVersion)
      .map((product) => product.externalId);
    if (changedExternalIds.length > 0) {
      await tx
        .insert(outboxEvents)
        .values(
          changedExternalIds.map((externalId) => {
            const product = input.products.find((candidate) => candidate.externalId === externalId)!;
            return {
              storeId: input.storeId,
              aggregateType: "product",
              aggregateId: productIdByExternalId.get(externalId)!,
              eventType: "catalog.product.changed",
              idempotencyKey: `catalog.product.changed:${externalId}:${product.sourceVersion}`,
              payload: { externalId, sourceVersion: product.sourceVersion },
            };
          }),
        )
        .onConflictDoNothing();
    }

    return { products: persisted, changedExternalIds };
  },

  async finalizeProductScan(
    tx: CatalogTransaction,
    input: { storeId: string; scanStartedAt: Date; completedAt?: Date },
  ) {
    const completedAt = input.completedAt ?? new Date();
    const deleted = await tx
      .update(products)
      .set({
        status: "archived",
        availableForSale: false,
        sourceDeletedAt: completedAt,
        updatedAt: completedAt,
      })
      .where(
        and(
          eq(products.storeId, input.storeId),
          isNull(products.sourceDeletedAt),
          or(isNull(products.sourceSeenAt), lt(products.sourceSeenAt, input.scanStartedAt)),
        ),
      )
      .returning({ id: products.id });
    if (deleted.length > 0) {
      await tx
        .update(productVariants)
        .set({
          availableForSale: false,
          sourceDeletedAt: completedAt,
          updatedAt: completedAt,
        })
        .where(
          and(
            eq(productVariants.storeId, input.storeId),
            inArray(
              productVariants.productId,
              deleted.map((product) => product.id),
            ),
            isNull(productVariants.sourceDeletedAt),
          ),
        );
    }
    return deleted;
  },
};

export type CatalogRepository = typeof catalogRepository;
