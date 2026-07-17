import type {
  CommercePlatform,
  ConnectorCapabilities,
  UnifiedCart,
  UnifiedCategory,
  UnifiedCustomer,
  UnifiedOrder,
  UnifiedProduct,
  UnifiedStore,
  UnifiedSubscription,
} from "@/core/commerce/types";

export interface AuthResult {
  authorizationUrl: string;
  flow: "oauth_callback" | "webhook_install";
  state?: string;
}

export interface TokenResult {
  accessToken: string;
  authorizationToken?: string;
  refreshToken?: string;
  expiresAt: string;
  scopes: string[];
  tokenType: string;
}

export type CommerceContentLanguage = "ar" | "en";

export interface PageQuery {
  /** One-based page number. */
  page?: number;
  /** Requested records per page. Platforms may impose a lower maximum. */
  perPage?: number;
  /** Fetch and merge English content in addition to the Arabic source record. */
  includeEnglish?: boolean;
}

export interface ProductQuery extends PageQuery {
  keyword?: string;
  status?: "sale" | "out" | "hidden";
  categoryId?: string;
}

export interface CategoryQuery extends PageQuery {
  keyword?: string;
  status?: "active" | "hidden";
}

export interface PaginationInfo {
  count: number;
  total: number;
  perPage: number;
  currentPage: number;
  totalPages: number;
  nextPage?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: PaginationInfo;
}

export interface OrderQuery {
  cursor?: string;
  limit?: number;
  changedSince?: string;
}

export interface CustomerQuery {
  cursor?: string;
  limit?: number;
}

export interface ProductUpdate {
  title?: string;
  description?: string;
  expectedSourceVersion: string;
  idempotencyKey: string;
}

export interface ConnectorContext {
  storeId: string;
  accessToken?: string;
  authorizationToken?: string;
  refreshToken?: string;
}

export interface CommercePlatformConnector {
  readonly platform: CommercePlatform;

  authorize(state: string): Promise<AuthResult>;
  exchangeCode(code: string): Promise<TokenResult>;
  refreshToken(refreshToken: string): Promise<TokenResult>;
  disconnect(context: ConnectorContext): Promise<void>;

  getStore(context: ConnectorContext): Promise<UnifiedStore>;
  listProducts(
    context: ConnectorContext,
    params?: ProductQuery,
  ): Promise<PaginatedResult<UnifiedProduct>>;
  getProduct(context: ConnectorContext, id: string): Promise<UnifiedProduct>;
  updateProduct(context: ConnectorContext, id: string, input: ProductUpdate): Promise<void>;

  listCategories(
    context: ConnectorContext,
    params?: CategoryQuery,
  ): Promise<PaginatedResult<UnifiedCategory>>;
  listOrders(context: ConnectorContext, params?: OrderQuery): Promise<UnifiedOrder[]>;
  listCustomers(context: ConnectorContext, params?: CustomerQuery): Promise<UnifiedCustomer[]>;
  listAbandonedCarts?(context: ConnectorContext): Promise<UnifiedCart[]>;

  registerWebhooks(context: ConnectorContext): Promise<void>;
  verifyWebhook(rawBody: Uint8Array, headers: Headers): Promise<boolean>;
  getSubscription(context: ConnectorContext): Promise<UnifiedSubscription>;
  getCapabilities(): Promise<ConnectorCapabilities>;
}

export class ConnectorUnavailableError extends Error {
  constructor(
    message: string,
    readonly reason: "missing_credentials" | "pending_verification" | "not_supported",
  ) {
    super(message);
    this.name = "ConnectorUnavailableError";
  }
}
