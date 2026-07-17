export type CommercePlatform = "salla" | "zid" | "mock-salla";

export type ProductStatus = "active" | "draft" | "archived";

export interface Money {
  /** Integer minor units (halalas), never a floating-point major-unit amount. */
  amount: number;
  currency: "SAR";
}

export interface LocalizedText {
  ar: string;
  en?: string;
}

export interface SourceProvenance {
  platform: CommercePlatform;
  externalId: string;
  externalUpdatedAt: string;
  sourceVersion: string;
}

export interface UnifiedStore {
  id: string;
  externalId: string;
  platform: CommercePlatform;
  name: LocalizedText;
  domain: string;
  currency: "SAR";
  timezone: "Asia/Riyadh";
  category: StoreCategory;
  locale: "ar-SA" | "en-SA";
}

export type StoreCategory =
  | "beauty"
  | "perfume"
  | "fashion"
  | "electronics"
  | "home"
  | "food"
  | "supplements"
  | "general";

export interface ProductAttribute {
  key: string;
  label: LocalizedText;
  values: string[];
  verified: boolean;
  source: "platform" | "merchant" | "document";
}

export interface ProductMedia {
  externalId?: string;
  url: string;
  alt?: string;
  position?: number;
}

export interface UnifiedProductVariant {
  id: string;
  externalId: string;
  sku: string;
  name: LocalizedText;
  price: Money;
  compareAtPrice?: Money;
  stock: number;
  unlimitedStock?: boolean;
  available: boolean;
  options: Record<string, string>;
}

export interface UnifiedProduct {
  id: string;
  storeId: string;
  externalId: string;
  slug: string;
  status: ProductStatus;
  name: LocalizedText;
  description: LocalizedText;
  category: string;
  categoryExternalIds?: string[];
  imageUrl: string;
  media?: ProductMedia[];
  productUrl: string;
  price: Money;
  compareAtPrice?: Money;
  stock: number;
  unlimitedStock?: boolean;
  available: boolean;
  variants: UnifiedProductVariant[];
  attributes: ProductAttribute[];
  exclusions: string[];
  priority: number;
  provenance: SourceProvenance;
}

export interface UnifiedCategory {
  id: string;
  storeId: string;
  externalId: string;
  name: LocalizedText;
  parentId?: string;
}

export interface UnifiedOrderItem {
  id: string;
  productId: string;
  variantId?: string;
  quantity: number;
  unitPrice: Money;
}

export interface UnifiedOrder {
  id: string;
  storeId: string;
  externalId: string;
  customerId?: string;
  status: string;
  total: Money;
  items: UnifiedOrderItem[];
  createdAt: string;
}

export interface UnifiedCustomer {
  id: string;
  storeId: string;
  externalId: string;
  displayName?: string;
  createdAt: string;
}

export interface UnifiedCart {
  id: string;
  storeId: string;
  externalId: string;
  customerId?: string;
  total: Money;
  updatedAt: string;
}

export interface UnifiedSubscription {
  status: "trial" | "active" | "past_due" | "cancelled" | "unknown";
  planExternalId?: string;
  renewsAt?: string;
}

export type CapabilityState =
  | "documented"
  | "sandbox_verified"
  | "degraded"
  | "blocked"
  | "unavailable";

export interface CapabilityEvidence {
  state: CapabilityState;
  note: string;
  sourceReference?: string;
  verifiedAt?: string;
}

export interface ConnectorCapabilities {
  oauth: CapabilityEvidence;
  productsRead: CapabilityEvidence;
  productsWrite: CapabilityEvidence;
  ordersRead: CapabilityEvidence;
  customersRead: CapabilityEvidence;
  abandonedCartsRead: CapabilityEvidence;
  webhooks: CapabilityEvidence;
  storefrontScript: CapabilityEvidence;
  storefrontAddToCart: CapabilityEvidence;
  billingRead: CapabilityEvidence;
  notes: string[];
}
