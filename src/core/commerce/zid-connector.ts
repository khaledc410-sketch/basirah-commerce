import "server-only";

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
import type {
  ConnectorCapabilities,
  UnifiedCategory,
  UnifiedCustomer,
  UnifiedOrder,
  UnifiedProduct,
  UnifiedStore,
  UnifiedSubscription,
} from "@/core/commerce/types";

const ZID_TOKEN_URL = "https://oauth.zid.sa/oauth/token";

const tokenResponseSchema = z
  .object({
    access_token: z.string().min(1),
    authorization: z.string().min(1).optional(),
    Authorization: z.string().min(1).optional(),
    refresh_token: z.string().min(1).optional(),
    expires_in: z.coerce.number().positive(),
    token_type: z.string().default("Bearer"),
    scope: z.string().optional(),
  })
  .refine((value) => value.authorization || value.Authorization, {
    message: "Zid token response is missing the authorization token.",
  });

export class ZidConnector implements CommercePlatformConnector {
  readonly platform = "zid" as const;

  private unavailable(): never {
    throw new ConnectorUnavailableError(
      "Zid is feature-flagged until token lifetime, endpoint header, and webhook-verification ambiguities are resolved with sandbox contract tests.",
      "pending_verification",
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
      oauth: documented("Authorization-code flow and dual-token response are implemented as an unverified foundation.", "https://docs.zid.sa/authorization"),
      productsRead: blocked("Endpoint-family headers and product-class mappings need development-store fixtures.", "https://docs.zid.sa/retrieve-a-list-of-products"),
      productsWrite: blocked("No reviewed write scope, conflict policy, or read-back fixture exists."),
      ordersRead: blocked("Order/item mapping and masked customer fields are unverified.", "https://docs.zid.sa/list-of-orders"),
      customersRead: blocked("PII minimization and nullable/masked field handling are unverified.", "https://docs.zid.sa/list-of-customers"),
      abandonedCartsRead: blocked("List/detail availability and retention behavior are unverified."),
      webhooks: blocked("Zid documents Basic Auth, but per-connection credentials, inbox, and delivery fixtures are not implemented.", "https://docs.zid.sa/create-a-webhook"),
      storefrontScript: blocked("Custom Snippet requires Zid review and development-store testing.", "https://docs.zid.sa/app-scripts-649611m0"),
      storefrontAddToCart: blocked("No supported third-party add-to-cart contract has been verified."),
      billingRead: blocked("Plan, subscription, and entitlement fixtures are not implemented."),
      notes: [
        "Live resource automation remains disabled until contract fixtures pass.",
        "Endpoint families use different header names and must be tested independently.",
        "No platform HMAC webhook signature is currently documented.",
      ],
    };
  }

  async authorize(state: string): Promise<AuthResult> {
    const env = getServerEnv();
    if (!env.ZID_CLIENT_ID || !env.ZID_AUTHORIZATION_URL || !env.ZID_REDIRECT_URI) {
      throw new ConnectorUnavailableError(
        "Zid OAuth credentials and Partner Dashboard authorization URL are not configured.",
        "missing_credentials",
      );
    }
    const url = new URL(env.ZID_AUTHORIZATION_URL);
    url.searchParams.set("client_id", env.ZID_CLIENT_ID);
    url.searchParams.set("redirect_uri", env.ZID_REDIRECT_URI);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("state", state);
    return { authorizationUrl: url.toString(), flow: "oauth_callback", state };
  }

  async exchangeCode(code: string): Promise<TokenResult> {
    return this.requestToken({ grant_type: "authorization_code", code });
  }

  async refreshToken(refreshToken: string): Promise<TokenResult> {
    return this.requestToken({ grant_type: "refresh_token", refresh_token: refreshToken });
  }

  private async requestToken(grant: Record<string, string>): Promise<TokenResult> {
    const env = getServerEnv();
    if (!env.ZID_CLIENT_ID || !env.ZID_CLIENT_SECRET || !env.ZID_REDIRECT_URI) {
      throw new ConnectorUnavailableError("Zid OAuth credentials are not configured.", "missing_credentials");
    }
    const response = await fetch(ZID_TOKEN_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: env.ZID_CLIENT_ID,
        client_secret: env.ZID_CLIENT_SECRET,
        redirect_uri: env.ZID_REDIRECT_URI,
        ...grant,
      }),
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error(`Zid token exchange failed with status ${response.status}.`);
    }
    const parsed = tokenResponseSchema.parse(await response.json());
    const authorizationToken = (parsed.authorization ?? parsed.Authorization)?.replace(/^Bearer\s+/i, "");
    return {
      accessToken: parsed.access_token,
      authorizationToken,
      refreshToken: parsed.refresh_token,
      expiresAt: new Date(Date.now() + parsed.expires_in * 1000).toISOString(),
      scopes: parsed.scope?.split(/[ ,]+/).filter(Boolean) ?? [],
      tokenType: parsed.token_type,
    };
  }
  async disconnect(_context: ConnectorContext): Promise<void> { return this.unavailable(); }
  async getStore(_context: ConnectorContext): Promise<UnifiedStore> { return this.unavailable(); }
  async listProducts(_context: ConnectorContext, _params?: ProductQuery): Promise<PaginatedResult<UnifiedProduct>> { return this.unavailable(); }
  async getProduct(_context: ConnectorContext, _id: string): Promise<UnifiedProduct> { return this.unavailable(); }
  async updateProduct(_context: ConnectorContext, _id: string, _input: ProductUpdate): Promise<void> { return this.unavailable(); }
  async listCategories(_context: ConnectorContext, _params?: CategoryQuery): Promise<PaginatedResult<UnifiedCategory>> { return this.unavailable(); }
  async listOrders(_context: ConnectorContext, _params?: OrderQuery): Promise<UnifiedOrder[]> { return this.unavailable(); }
  async listCustomers(_context: ConnectorContext, _params?: CustomerQuery): Promise<UnifiedCustomer[]> { return this.unavailable(); }
  async registerWebhooks(_context: ConnectorContext): Promise<void> { return this.unavailable(); }
  async verifyWebhook(_rawBody: Uint8Array, _headers: Headers): Promise<boolean> { return false; }
  async getSubscription(_context: ConnectorContext): Promise<UnifiedSubscription> { return this.unavailable(); }
}
