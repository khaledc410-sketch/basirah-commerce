import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import { z } from "zod";

import { getServerEnv } from "@/config/env";
import {
  ConnectorUnavailableError,
  type AuthResult,
  type CategoryQuery,
  type CommercePlatformConnector,
  type ConnectorContext,
  type CustomerQuery,
  type OrderQuery,
  type PaginatedResult,
  type ProductQuery,
  type ProductUpdate,
  type TokenResult,
} from "@/core/commerce/connector";
import { SallaHttpClient } from "@/core/commerce/salla/http-client";
import {
  mapSallaCategory,
  mapSallaPagination,
  mapSallaProduct,
  mapSallaStore,
} from "@/core/commerce/salla/mapper";
import type {
  ConnectorCapabilities,
  UnifiedCart,
  UnifiedCategory,
  UnifiedCustomer,
  UnifiedOrder,
  UnifiedProduct,
  UnifiedStore,
  UnifiedSubscription,
} from "@/core/commerce/types";

const SALLA_AUTH_URL = "https://accounts.salla.sa/oauth2/auth";
const SALLA_TOKEN_URL = "https://accounts.salla.sa/oauth2/token";

const SALLA_CUSTOM_MODE_SCOPES = [
  "products.read",
  "categories.read",
  "offline_access",
] as const;

type SallaTokenGrant =
  | {
      grant_type: "authorization_code";
      code: string;
      redirect_uri: string;
    }
  | {
      grant_type: "refresh_token";
      refresh_token: string;
    };

const tokenResponseSchema = z
  .object({
    access_token: z.string(),
    refresh_token: z.string().optional(),
    // Salla documents `expires` on the initial exchange and `expires_in` on refresh.
    expires: z.coerce.number().positive().optional(),
    expires_in: z.coerce.number().positive().optional(),
    token_type: z.string().default("Bearer"),
    scope: z.string().optional(),
  })
  .refine((value) => value.expires_in !== undefined || value.expires !== undefined, {
    message: "Salla token response is missing its expiry duration.",
  });

export class SallaConnector implements CommercePlatformConnector {
  readonly platform = "salla" as const;

  async authorize(state: string): Promise<AuthResult> {
    const env = getServerEnv();
    if (env.SALLA_AUTH_MODE === "easy") {
      if (!env.SALLA_APP_ID) {
        throw new ConnectorUnavailableError(
          "Salla App ID is required for marketplace Easy Mode installation.",
          "missing_credentials",
        );
      }
      return {
        authorizationUrl: `https://s.salla.sa/apps/install/${encodeURIComponent(env.SALLA_APP_ID)}`,
        flow: "webhook_install",
      };
    }

    if (!env.SALLA_CLIENT_ID || !env.SALLA_REDIRECT_URI) {
      throw new ConnectorUnavailableError(
        "Salla OAuth credentials are not configured.",
        "missing_credentials",
      );
    }

    const url = new URL(SALLA_AUTH_URL);
    url.searchParams.set("client_id", env.SALLA_CLIENT_ID);
    url.searchParams.set("redirect_uri", env.SALLA_REDIRECT_URI);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", SALLA_CUSTOM_MODE_SCOPES.join(" "));
    url.searchParams.set("state", state);
    return { authorizationUrl: url.toString(), flow: "oauth_callback", state };
  }

  async exchangeCode(code: string): Promise<TokenResult> {
    const env = getServerEnv();
    if (env.SALLA_AUTH_MODE !== "custom" || !env.SALLA_REDIRECT_URI) {
      throw new ConnectorUnavailableError(
        "Salla Custom Mode OAuth credentials are not configured.",
        "missing_credentials",
      );
    }

    return this.requestToken({
      grant_type: "authorization_code",
      code,
      redirect_uri: env.SALLA_REDIRECT_URI,
    });
  }

  async refreshToken(refreshToken: string): Promise<TokenResult> {
    return this.requestToken({ grant_type: "refresh_token", refresh_token: refreshToken });
  }

  private async requestToken(grant: SallaTokenGrant): Promise<TokenResult> {
    const env = getServerEnv();
    if (!env.SALLA_CLIENT_ID || !env.SALLA_CLIENT_SECRET) {
      throw new ConnectorUnavailableError(
        "Salla OAuth credentials are not configured.",
        "missing_credentials",
      );
    }

    const body = new URLSearchParams({
      client_id: env.SALLA_CLIENT_ID,
      client_secret: env.SALLA_CLIENT_SECRET,
      ...grant,
    });
    const response = await fetch(SALLA_TOKEN_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) {
      throw new Error(`Salla token exchange failed with status ${response.status}.`);
    }
    const parsed = tokenResponseSchema.parse(await response.json());
    const expiresIn = parsed.expires_in ?? parsed.expires;
    if (expiresIn === undefined) throw new Error("Salla token expiry is missing.");
    return {
      accessToken: parsed.access_token,
      refreshToken: parsed.refresh_token,
      expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
      // Persist only scopes Salla actually returned; never infer authorization.
      scopes: parsed.scope?.split(" ").filter(Boolean) ?? [],
      tokenType: parsed.token_type,
    };
  }

  async verifyWebhook(rawBody: Uint8Array, headers: Headers): Promise<boolean> {
    const secret = getServerEnv().SALLA_WEBHOOK_SECRET;
    const signature = headers.get("x-salla-signature");
    const strategy = headers.get("x-salla-security-strategy");
    if (!secret || !signature || strategy?.toLowerCase() !== "signature") return false;

    const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
    const actualBuffer = Buffer.from(signature, "utf8");
    const expectedBuffer = Buffer.from(expected, "utf8");
    return (
      actualBuffer.length === expectedBuffer.length &&
      timingSafeEqual(actualBuffer, expectedBuffer)
    );
  }

  async getCapabilities(): Promise<ConnectorCapabilities> {
    const documented = (note: string, sourceReference: string) => ({
      state: "documented" as const,
      note,
      sourceReference,
    });
    const blocked = (note: string, sourceReference?: string) => ({
      state: "blocked" as const,
      note,
      sourceReference,
    });
    return {
      oauth: documented(
        "Easy Mode installation, encrypted pending-token persistence, and account binding are implemented; the full install lifecycle still needs verification against a real Salla development store.",
        "https://docs.salla.dev/421118m0",
      ),
      productsRead: documented(
        "Read-only catalog transport and defensive mapping are implemented from official documentation; demo-store contract verification is still required.",
        "https://docs.salla.dev/5394168e0",
      ),
      productsWrite: blocked("Writes remain approval-gated and have no read-back/rollback fixture."),
      ordersRead: blocked("Official endpoint exists; sequential pagination and item mapping are unverified.", "https://docs.salla.dev/5394146e0"),
      customersRead: blocked("PII mapping and minimization are not verified.", "https://docs.salla.dev/5394121e0"),
      abandonedCartsRead: blocked("Plan availability, fields, and privacy behavior are unverified.", "https://docs.salla.dev/841783f0"),
      webhooks: blocked(
        "HMAC verification and durable idempotent ingress are implemented; real signed fixtures, Partner Portal registration, and dev-store replay/token-rotation validation remain pending.",
        "https://docs.salla.dev/421119m0",
      ),
      storefrontScript: blocked("App Snippet requires partner review and storefront performance testing.", "https://docs.salla.dev/1724504m0"),
      storefrontAddToCart: blocked("No supported third-party add-to-cart contract has been verified."),
      billingRead: blocked("Subscription lifecycle and entitlement fixtures are not implemented."),
      notes: [
        "Marketplace Easy Mode credentials arrive through app.store.authorize.",
        "Refresh tokens rotate and must be refreshed under a distributed lock.",
        "Product mutation remains approval-gated.",
      ],
    };
  }

  async disconnect(_context: ConnectorContext): Promise<void> {
    throw new ConnectorUnavailableError(
      "Production disconnect behavior requires a configured Salla application.",
      "missing_credentials",
    );
  }

  private operationPending(): never {
    throw new ConnectorUnavailableError(
      "This Salla operation remains disabled until its scopes, persistence, and demo-store contract are verified.",
      "pending_verification",
    );
  }

  private catalogClient(context: ConnectorContext) {
    if (!context.accessToken) {
      throw new ConnectorUnavailableError(
        "A Salla merchant access token is required.",
        "missing_credentials",
      );
    }
    return new SallaHttpClient({ accessToken: context.accessToken });
  }

  async getStore(context: ConnectorContext): Promise<UnifiedStore> {
    const response = await this.catalogClient(context).getStore("ar");
    return mapSallaStore(response.data, undefined, context.storeId);
  }

  async listProducts(
    context: ConnectorContext,
    params: ProductQuery = {},
  ): Promise<PaginatedResult<UnifiedProduct>> {
    const client = this.catalogClient(context);
    const request = {
      page: params.page,
      perPage: params.perPage,
      keyword: params.keyword,
      status: params.status,
      categoryId: params.categoryId,
    };
    const [arabic, english] = await Promise.all([
      client.listProducts({ ...request, language: "ar" }),
      params.includeEnglish === false
        ? Promise.resolve(undefined)
        : client.listProducts({ ...request, language: "en" }),
    ]);
    const englishById = new Map(
      (english?.data ?? []).map((product) => [String(product.id), product]),
    );

    return {
      items: arabic.data.map((product) =>
        mapSallaProduct(product, englishById.get(String(product.id)), context.storeId),
      ),
      pagination: mapSallaPagination(arabic.pagination),
    };
  }

  async getProduct(context: ConnectorContext, id: string): Promise<UnifiedProduct> {
    const client = this.catalogClient(context);
    const [arabic, english] = await Promise.all([
      client.getProduct(id, "ar"),
      client.getProduct(id, "en"),
    ]);
    return mapSallaProduct(arabic.data, english.data, context.storeId);
  }

  async updateProduct(
    _context: ConnectorContext,
    _id: string,
    _input: ProductUpdate,
  ): Promise<void> {
    return this.operationPending();
  }

  async listCategories(
    context: ConnectorContext,
    params: CategoryQuery = {},
  ): Promise<PaginatedResult<UnifiedCategory>> {
    const client = this.catalogClient(context);
    const request = {
      page: params.page,
      perPage: params.perPage,
      keyword: params.keyword,
      status: params.status,
    };
    const [arabic, english] = await Promise.all([
      client.listCategories({ ...request, language: "ar" }),
      params.includeEnglish === false
        ? Promise.resolve(undefined)
        : client.listCategories({ ...request, language: "en" }),
    ]);
    const englishById = new Map(
      (english?.data ?? []).map((category) => [String(category.id), category]),
    );
    return {
      items: arabic.data.map((category) =>
        mapSallaCategory(category, englishById.get(String(category.id)), context.storeId),
      ),
      pagination: mapSallaPagination(arabic.pagination),
    };
  }

  async listOrders(_context: ConnectorContext, _params?: OrderQuery): Promise<UnifiedOrder[]> {
    return this.operationPending();
  }

  async listCustomers(
    _context: ConnectorContext,
    _params?: CustomerQuery,
  ): Promise<UnifiedCustomer[]> {
    return this.operationPending();
  }

  async listAbandonedCarts(_context: ConnectorContext): Promise<UnifiedCart[]> {
    return this.operationPending();
  }

  async registerWebhooks(_context: ConnectorContext): Promise<void> {
    return this.operationPending();
  }

  async getSubscription(_context: ConnectorContext): Promise<UnifiedSubscription> {
    return this.operationPending();
  }
}
