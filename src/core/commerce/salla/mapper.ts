import type { PaginationInfo } from "@/core/commerce/connector";
import type {
  LocalizedText,
  Money,
  ProductAttribute,
  ProductMedia,
  ProductStatus,
  UnifiedCategory,
  UnifiedProduct,
  UnifiedProductVariant,
  UnifiedStore,
} from "@/core/commerce/types";
import type {
  SallaCategory,
  SallaDecimal,
  SallaMoney,
  SallaOption,
  SallaPagination,
  SallaProduct,
  SallaStore,
  SallaVariant,
} from "@/core/commerce/salla/schemas";

const SALLA_SOURCE_VERSION = "salla-admin-v2";

function externalId(value: string | number) {
  return String(value);
}

function localized(ar: string, en?: string | null): LocalizedText {
  const cleanEnglish = en?.trim();
  return cleanEnglish ? { ar, en: cleanEnglish } : { ar };
}

function resourceId(storeId: string, resource: "product" | "variant" | "category", id: string) {
  return `${storeId}:${resource}:${id}`;
}

function pow10(exponent: number) {
  if (!Number.isInteger(exponent) || exponent < 0 || exponent > 100) {
    throw new RangeError("Decimal exponent is outside the supported range.");
  }
  return BigInt(10) ** BigInt(exponent);
}

/** Convert a Salla major-unit decimal to integer halalas without binary multiplication. */
export function decimalToMinorUnits(input: SallaDecimal): number {
  const source = String(input).trim();
  const match = /^([+-]?)(\d*)(?:\.(\d*))?(?:[eE]([+-]?\d+))?$/.exec(source);
  if (!match || (!match[2] && !match[3])) throw new Error(`Invalid decimal amount: ${source}`);

  const sign = match[1] === "-" ? -BigInt(1) : BigInt(1);
  const integer = match[2] || "0";
  const fraction = match[3] || "";
  const exponent = Number(match[4] ?? "0");
  if (!Number.isSafeInteger(exponent)) throw new RangeError("Unsafe decimal exponent.");

  const digits = BigInt(`${integer}${fraction}` || "0");
  const decimalPlaces = fraction.length - exponent;
  let minor: bigint;

  if (decimalPlaces <= 2) {
    minor = digits * pow10(2 - decimalPlaces);
  } else {
    const divisor = pow10(decimalPlaces - 2);
    const quotient = digits / divisor;
    const remainder = digits % divisor;
    minor = quotient +
      (remainder * BigInt(2) >= divisor ? BigInt(1) : BigInt(0));
  }

  const signedMinor = sign * minor;
  if (
    signedMinor > BigInt(Number.MAX_SAFE_INTEGER) ||
    signedMinor < BigInt(Number.MIN_SAFE_INTEGER)
  ) {
    throw new RangeError("Money amount exceeds the safe integer range.");
  }
  return Number(signedMinor);
}

function mapMoney(value: SallaMoney): Money {
  const currency = value.currency.toUpperCase();
  if (currency !== "SAR") {
    throw new Error(`Unsupported Salla catalog currency: ${currency}`);
  }
  return { amount: decimalToMinorUnits(value.amount), currency: "SAR" };
}

function isMoney(value: unknown): value is SallaMoney {
  return Boolean(
    value &&
      typeof value === "object" &&
      "amount" in value &&
      "currency" in value,
  );
}

function choosePrice(
  baseRaw: SallaMoney,
  saleRaw?: SallaMoney | Record<string, never> | null,
  regularRaw?: SallaMoney | Record<string, never> | null,
) {
  const base = mapMoney(baseRaw);
  const sale = isMoney(saleRaw) ? mapMoney(saleRaw) : undefined;
  const regular = isMoney(regularRaw) ? mapMoney(regularRaw) : undefined;
  const saleIsCurrent = Boolean(
    sale &&
      sale.amount > 0 &&
      sale.currency === base.currency &&
      sale.amount < Math.max(base.amount, regular?.amount ?? 0),
  );
  const price = saleIsCurrent && sale ? sale : base;
  const comparisonCandidate = regular && regular.amount > price.amount ? regular : base;
  const compareAtPrice = comparisonCandidate.amount > price.amount ? comparisonCandidate : undefined;
  return { price, compareAtPrice };
}

function integerStock(value: SallaDecimal | null | undefined) {
  if (value === null || value === undefined) return 0;
  const stock = Number(value);
  if (!Number.isFinite(stock)) return 0;
  return Math.max(0, Math.trunc(stock));
}

function mapStatus(status: SallaProduct["status"]): ProductStatus {
  if (status === "hidden") return "draft";
  if (status === "deleted") return "archived";
  return "active";
}

function dateSource(value: SallaProduct["updated_at"]) {
  if (!value) return "unknown";
  return typeof value === "string" ? value : value.date;
}

function normalizedSourceDate(value: SallaProduct["updated_at"]) {
  const source = dateSource(value);
  if (source === "unknown") return source;
  const riyadhDateTime = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(?:\.\d+)?$/.test(source)
    ? `${source.replace(" ", "T")}+03:00`
    : source;
  const parsed = Date.parse(riyadhDateTime);
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : source;
}

function productUrl(product: SallaProduct) {
  return product.urls?.customer || product.url || "";
}

function productSlug(product: SallaProduct) {
  const url = productUrl(product);
  if (url) {
    try {
      const segments = new URL(url).pathname.split("/").filter(Boolean);
      const productMarker = segments.findIndex((segment) => /^p\d+$/i.test(segment));
      const slug = productMarker > 0 ? segments[productMarker - 1] : segments.at(-1);
      if (slug) return decodeURIComponent(slug);
    } catch {
      // Fall through to the documented short code/id.
    }
  }
  return product.short_link_code || `product-${externalId(product.id)}`;
}

function productImage(product: SallaProduct) {
  return (
    product.main_image ||
    product.thumbnail ||
    product.images.find((image) => image.main)?.url ||
    product.images[0]?.url ||
    ""
  );
}

function mapProductMedia(product: SallaProduct): ProductMedia[] {
  const media: ProductMedia[] = product.images.map((image, index) => ({
    externalId: externalId(image.id),
    url: image.url,
    ...(image.alt?.trim() ? { alt: image.alt.trim() } : {}),
    position: image.sort ?? index,
  }));
  const knownUrls = new Set(media.map((item) => item.url));
  if (product.main_image && !knownUrls.has(product.main_image)) {
    media.unshift({ url: product.main_image, position: 0 });
  }
  return media;
}

interface OptionValue {
  optionName: string;
  valueName: string;
}

function optionValueLookup(options: SallaOption[]) {
  const lookup = new Map<string, OptionValue>();
  for (const option of options) {
    for (const value of option.values) {
      lookup.set(externalId(value.id), {
        optionName: option.name,
        valueName: value.name,
      });
    }
  }
  return lookup;
}

function valuesForVariant(variant: SallaVariant, lookup: Map<string, OptionValue>) {
  return variant.related_option_values
    .map((id) => lookup.get(externalId(id)))
    .filter((value): value is OptionValue => Boolean(value));
}

function mapVariant(
  variant: SallaVariant,
  englishVariant: SallaVariant | undefined,
  product: SallaProduct,
  englishProduct: SallaProduct | undefined,
  storeId: string,
  arLookup: Map<string, OptionValue>,
  enLookup: Map<string, OptionValue>,
): UnifiedProductVariant {
  const id = externalId(variant.id);
  const arValues = valuesForVariant(variant, arLookup);
  const enValues = valuesForVariant(englishVariant ?? variant, enLookup);
  const stock = integerStock(variant.stock_quantity);
  const unlimitedStock = variant.unlimited_quantity ?? false;
  const { price, compareAtPrice } = choosePrice(
    variant.price,
    variant.sale_price,
    variant.regular_price,
  );

  const arName = arValues.map((value) => value.valueName).join(" - ") || product.name;
  const enName =
    enValues.map((value) => value.valueName).join(" - ") || englishProduct?.name;

  return {
    id: resourceId(storeId, "variant", id),
    externalId: id,
    sku: variant.sku?.trim() || `variant-${id}`,
    name: localized(arName, enName),
    price,
    ...(compareAtPrice ? { compareAtPrice } : {}),
    stock,
    unlimitedStock,
    available:
      product.status === "sale" &&
      product.is_available &&
      (unlimitedStock || variant.stock_quantity === undefined || stock > 0),
    options: Object.fromEntries(arValues.map((value) => [value.optionName, value.valueName])),
  };
}

function baseVariant(
  product: SallaProduct,
  englishProduct: SallaProduct | undefined,
  storeId: string,
  price: Money,
  compareAtPrice: Money | undefined,
): UnifiedProductVariant {
  const id = externalId(product.id);
  const stock = integerStock(product.quantity);
  const unlimitedStock = product.unlimited_quantity ?? false;
  return {
    id: resourceId(storeId, "variant", id),
    externalId: id,
    sku: product.sku?.trim() || `product-${id}`,
    name: localized(product.name, englishProduct?.name),
    price,
    ...(compareAtPrice ? { compareAtPrice } : {}),
    stock,
    unlimitedStock,
    available: product.status === "sale" && product.is_available,
    options: {},
  };
}

function slugKey(value: string, fallback: string) {
  const key = value
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-|-$/g, "");
  return key || fallback;
}

function mapAttributes(product: SallaProduct, englishProduct?: SallaProduct): ProductAttribute[] {
  const englishOptions = new Map(
    (englishProduct?.options ?? []).map((option) => [externalId(option.id), option]),
  );
  return product.options.map((option) => {
    const id = externalId(option.id);
    const english = englishOptions.get(id);
    return {
      key: slugKey(english?.name || option.name, `option-${id}`),
      label: localized(option.name, english?.name),
      values: option.values.map((value) => value.name),
      verified: true,
      source: "platform",
    };
  });
}

export function mapSallaProduct(
  product: SallaProduct,
  englishProduct: SallaProduct | undefined,
  storeId: string,
): UnifiedProduct {
  const id = externalId(product.id);
  const englishMatches =
    englishProduct && externalId(englishProduct.id) === id ? englishProduct : undefined;
  const { price, compareAtPrice } = choosePrice(
    product.price,
    product.sale_price,
    product.regular_price,
  );
  const arLookup = optionValueLookup(product.options);
  const enLookup = optionValueLookup(englishMatches?.options ?? []);
  const englishVariants = new Map(
    (englishMatches?.skus ?? []).map((variant) => [externalId(variant.id), variant]),
  );
  const variants = product.skus.length
    ? product.skus.map((variant) =>
        mapVariant(
          variant,
          englishVariants.get(externalId(variant.id)),
          product,
          englishMatches,
          storeId,
          arLookup,
          enLookup,
        ),
      )
    : [baseVariant(product, englishMatches, storeId, price, compareAtPrice)];
  const unlimitedStock =
    (product.unlimited_quantity ?? false) || variants.some((variant) => variant.unlimitedStock);
  const stock = product.skus.length
    ? variants.reduce((total, variant) => total + variant.stock, 0)
    : integerStock(product.quantity);
  const updatedAt = normalizedSourceDate(product.updated_at);

  return {
    id: resourceId(storeId, "product", id),
    storeId,
    externalId: id,
    slug: productSlug(product),
    status: mapStatus(product.status),
    name: localized(product.name, englishMatches?.name),
    description: localized(product.description ?? "", englishMatches?.description),
    category: product.categories[0]?.name ?? "عام",
    categoryExternalIds: product.categories.map((category) => externalId(category.id)),
    imageUrl: productImage(product),
    media: mapProductMedia(product),
    productUrl: productUrl(product),
    price,
    ...(compareAtPrice ? { compareAtPrice } : {}),
    stock,
    unlimitedStock,
    available: product.status === "sale" && product.is_available,
    variants,
    attributes: mapAttributes(product, englishMatches),
    exclusions: [],
    priority: 0,
    provenance: {
      platform: "salla",
      externalId: id,
      externalUpdatedAt: updatedAt,
      sourceVersion: `${SALLA_SOURCE_VERSION}:${dateSource(product.updated_at)}`,
    },
  };
}

function translatedCategoryName(category: SallaCategory, language: "ar" | "en") {
  if (Array.isArray(category.translations)) return undefined;
  return category.translations?.[language]?.name;
}

export function mapSallaCategory(
  category: SallaCategory,
  englishCategory: SallaCategory | undefined,
  storeId: string,
): UnifiedCategory {
  const id = externalId(category.id);
  const enName =
    (englishCategory && externalId(englishCategory.id) === id ? englishCategory.name : undefined) ??
    translatedCategoryName(category, "en");
  const parentId = category.parent_id == null ? undefined : externalId(category.parent_id);
  return {
    id: resourceId(storeId, "category", id),
    storeId,
    externalId: id,
    name: localized(translatedCategoryName(category, "ar") ?? category.name, enName),
    ...(parentId && parentId !== "0"
      ? { parentId: resourceId(storeId, "category", parentId) }
      : {}),
  };
}

export function mapSallaStore(
  store: SallaStore,
  englishStore: SallaStore | undefined,
  storeId: string,
): UnifiedStore {
  if (store.currency.toUpperCase() !== "SAR") {
    throw new Error(`Unsupported Salla store currency: ${store.currency}`);
  }
  return {
    id: storeId,
    externalId: externalId(store.id),
    platform: "salla",
    name: localized(store.name, englishStore?.name),
    domain: store.domain.replace(/\/$/, ""),
    currency: "SAR",
    timezone: "Asia/Riyadh",
    category: "general",
    locale: "ar-SA",
  };
}

export function mapSallaPagination(pagination: SallaPagination): PaginationInfo {
  const nextPage =
    pagination.currentPage < pagination.totalPages ? pagination.currentPage + 1 : undefined;
  return {
    count: pagination.count,
    total: pagination.total,
    perPage: pagination.perPage,
    currentPage: pagination.currentPage,
    totalPages: pagination.totalPages,
    ...(nextPage ? { nextPage } : {}),
  };
}
