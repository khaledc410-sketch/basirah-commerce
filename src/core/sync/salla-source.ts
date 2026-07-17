import "server-only";

import type { ConnectorContext } from "@/core/commerce/connector";
import { SallaConnector } from "@/core/commerce/salla-connector";
import type {
  UnifiedCategory,
  UnifiedProduct,
  UnifiedStore,
} from "@/core/commerce/types";
import type {
  CatalogCategoryInput,
  CatalogProductInput,
  CatalogStoreInput,
} from "@/db/repositories/catalog-repository";

import type { CatalogPageRequest, CatalogSyncSource } from "./catalog-service";

function sourceDate(value: string) {
  if (!value || value === "unknown") return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parentExternalId(category: UnifiedCategory) {
  if (!category.parentId) return null;
  const prefix = `${category.storeId}:category:`;
  return category.parentId.startsWith(prefix)
    ? category.parentId.slice(prefix.length)
    : category.parentId;
}

export function toCatalogStore(store: UnifiedStore): CatalogStoreInput {
  return {
    name: store.name.ar,
    externalDomain: store.domain || null,
    currency: store.currency,
    defaultLocale: store.locale === "en-SA" ? "en" : "ar",
    timezone: store.timezone,
  };
}

export function toCatalogCategory(category: UnifiedCategory): CatalogCategoryInput {
  return {
    externalId: category.externalId,
    parentExternalId: parentExternalId(category),
    name: category.name.ar,
    active: true,
  };
}

export function toCatalogProduct(product: UnifiedProduct): CatalogProductInput {
  const updatedAt = sourceDate(product.provenance.externalUpdatedAt);
  return {
    externalId: product.externalId,
    sku: product.variants.length === 1 ? product.variants[0]?.sku : null,
    slug: product.slug || null,
    status: product.status,
    title: product.name.ar,
    description: product.description.ar || null,
    currency: product.price.currency,
    priceMinor: product.price.amount,
    compareAtPriceMinor: product.compareAtPrice?.amount ?? null,
    stockQuantity: product.unlimitedStock ? null : product.stock,
    trackInventory: !product.unlimitedStock,
    availableForSale: product.available,
    sourceVersion: product.provenance.sourceVersion,
    sourceUpdatedAt: updatedAt,
    metadata: {
      source: product.provenance.platform,
      productUrl: product.productUrl,
      mainImageUrl: product.imageUrl,
      primaryCategory: product.category,
      unlimitedStock: product.unlimitedStock ?? false,
    },
    translations: [
      {
        locale: "ar",
        title: product.name.ar,
        description: product.description.ar || null,
      },
      ...(product.name.en
        ? [
            {
              locale: "en" as const,
              title: product.name.en,
              description: product.description.en || null,
            },
          ]
        : []),
    ],
    media: (product.media ?? []).map((item, position) => ({
      externalId: item.externalId ?? null,
      mediaType: "image",
      url: item.url,
      altText: item.alt ?? product.name.ar,
      position: item.position ?? position,
    })),
    variants: product.variants.map((variant) => ({
      externalId: variant.externalId,
      sku: variant.sku || null,
      title: variant.name.ar,
      currency: variant.price.currency,
      priceMinor: variant.price.amount,
      compareAtPriceMinor: variant.compareAtPrice?.amount ?? null,
      stockQuantity: variant.unlimitedStock ? null : variant.stock,
      availableForSale: variant.available,
      attributes: variant.options,
      sourceVersion: product.provenance.sourceVersion,
      sourceUpdatedAt: updatedAt,
    })),
    categoryExternalIds: product.categoryExternalIds ?? [],
    attributes: product.attributes
      .filter((attribute) => attribute.source === "platform")
      .map((attribute) => ({
        key: attribute.key,
        values: attribute.values,
        locale: "ar" as const,
        verified: attribute.verified,
      })),
  };
}

export class SallaCatalogSyncSource implements CatalogSyncSource {
  private readonly connector = new SallaConnector();
  private verifiedStore: UnifiedStore | undefined;

  constructor(
    private readonly context: ConnectorContext,
    private readonly expectedExternalStoreId: string,
  ) {}

  async verifyMerchant() {
    const remote = await this.connector.getStore(this.context);
    if (remote.externalId !== this.expectedExternalStoreId) {
      throw new Error("The Salla token belongs to a different merchant.");
    }
    this.verifiedStore = remote;
    return remote;
  }

  async getStore() {
    return toCatalogStore(this.verifiedStore ?? await this.verifyMerchant());
  }

  async listCategories(request: CatalogPageRequest) {
    const result = await this.connector.listCategories(this.context, {
      page: request.page,
      perPage: request.perPage,
      includeEnglish: true,
    });
    return {
      items: result.items.map(toCatalogCategory),
      total: result.pagination.total,
      currentPage: result.pagination.currentPage,
      totalPages: result.pagination.totalPages,
      perPage: result.pagination.perPage,
    };
  }

  async listProducts(request: CatalogPageRequest) {
    const result = await this.connector.listProducts(this.context, {
      page: request.page,
      perPage: request.perPage,
      includeEnglish: true,
    });
    return {
      items: result.items.map(toCatalogProduct),
      total: result.pagination.total,
      currentPage: result.pagination.currentPage,
      totalPages: result.pagination.totalPages,
      perPage: result.pagination.perPage,
    };
  }
}
