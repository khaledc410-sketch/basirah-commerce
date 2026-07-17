import { z } from "zod";

import {
  sallaCategoryPageSchema,
  sallaProductPageSchema,
  sallaProductResponseSchema,
  sallaStoreResponseSchema,
  type SallaCategoryPage,
  type SallaProductPage,
  type SallaProductResponse,
  type SallaStoreResponse,
} from "@/core/commerce/salla/schemas";

const DEFAULT_BASE_URL = "https://api.salla.dev/admin/v2";
const DEFAULT_TIMEOUT_MS = 15_000;
const MAX_PER_PAGE = 60;

export type SallaLanguage = "ar" | "en";

export interface SallaProductPageRequest {
  page?: number;
  perPage?: number;
  keyword?: string;
  status?: "sale" | "out" | "hidden";
  categoryId?: string;
  language: SallaLanguage;
}

export interface SallaCategoryPageRequest {
  page?: number;
  perPage?: number;
  keyword?: string;
  status?: "active" | "hidden";
  language: SallaLanguage;
}

export type SallaHttpErrorKind =
  | "timeout"
  | "rate_limited"
  | "unauthorized"
  | "http"
  | "invalid_response";

export class SallaHttpError extends Error {
  constructor(
    message: string,
    readonly kind: SallaHttpErrorKind,
    readonly status?: number,
    readonly retryAfterMs?: number,
  ) {
    super(message);
    this.name = "SallaHttpError";
  }
}

export interface SallaHttpClientOptions {
  accessToken: string;
  baseUrl?: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
  now?: () => number;
}

function positiveInteger(value: number | undefined, fallback: number, maximum?: number) {
  if (value === undefined) return fallback;
  if (!Number.isInteger(value) || value < 1 || (maximum !== undefined && value > maximum)) {
    throw new RangeError(
      maximum === undefined
        ? "Expected a positive integer."
        : `Expected an integer between 1 and ${maximum}.`,
    );
  }
  return value;
}

export function parseRetryAfterMs(value: string | null, now = Date.now()) {
  if (!value) return undefined;
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) return Math.ceil(seconds * 1_000);

  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return undefined;
  return Math.max(0, timestamp - now);
}

export class SallaHttpClient {
  private readonly accessToken: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly fetchImpl: typeof fetch;
  private readonly now: () => number;

  constructor(options: SallaHttpClientOptions) {
    if (!options.accessToken.trim()) throw new Error("Salla access token is required.");
    this.accessToken = options.accessToken;
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
    this.timeoutMs = positiveInteger(options.timeoutMs, DEFAULT_TIMEOUT_MS);
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.now = options.now ?? Date.now;
  }

  async getStore(language: SallaLanguage = "ar"): Promise<SallaStoreResponse> {
    return this.get("/store/info", language, sallaStoreResponseSchema);
  }

  async getProduct(
    productId: string,
    language: SallaLanguage,
  ): Promise<SallaProductResponse> {
    if (!productId.trim()) throw new Error("Salla product id is required.");
    return this.get(
      `/products/${encodeURIComponent(productId)}`,
      language,
      sallaProductResponseSchema,
    );
  }

  async listProducts(request: SallaProductPageRequest): Promise<SallaProductPage> {
    const search = new URLSearchParams({
      page: String(positiveInteger(request.page, 1)),
      per_page: String(positiveInteger(request.perPage, MAX_PER_PAGE, MAX_PER_PAGE)),
    });
    if (request.keyword) search.set("keyword", request.keyword);
    if (request.status) search.set("status", request.status);
    if (request.categoryId) search.set("category", request.categoryId);

    return this.get("/products", request.language, sallaProductPageSchema, search);
  }

  async listCategories(request: SallaCategoryPageRequest): Promise<SallaCategoryPage> {
    const search = new URLSearchParams({
      page: String(positiveInteger(request.page, 1)),
      per_page: String(positiveInteger(request.perPage, MAX_PER_PAGE, MAX_PER_PAGE)),
      with: "translations",
    });
    if (request.keyword) search.set("keyword", request.keyword);
    if (request.status) search.set("status", request.status);

    return this.get("/categories", request.language, sallaCategoryPageSchema, search);
  }

  private async get<T>(
    path: string,
    language: SallaLanguage,
    schema: z.ZodType<T>,
    search?: URLSearchParams,
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`);
    if (search) url.search = search.toString();

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await this.fetchImpl(url, {
        method: "GET",
        headers: {
          accept: "application/json",
          authorization: `Bearer ${this.accessToken}`,
          "accept-language": language,
        },
        cache: "no-store",
        signal: controller.signal,
      });

      if (response.status === 429) {
        throw new SallaHttpError(
          "Salla rate limit exceeded.",
          "rate_limited",
          429,
          parseRetryAfterMs(response.headers.get("retry-after"), this.now()),
        );
      }
      if (response.status === 401 || response.status === 403) {
        throw new SallaHttpError(
          "Salla rejected the access token or required scope.",
          "unauthorized",
          response.status,
        );
      }
      if (!response.ok) {
        throw new SallaHttpError(
          `Salla request failed with status ${response.status}.`,
          "http",
          response.status,
        );
      }

      let json: unknown;
      try {
        json = JSON.parse(await response.text()) as unknown;
      } catch {
        throw new SallaHttpError(
          "Salla returned a non-JSON response.",
          "invalid_response",
          response.status,
        );
      }

      const parsed = schema.safeParse(json);
      if (!parsed.success) {
        throw new SallaHttpError(
          `Salla response failed contract validation: ${z.prettifyError(parsed.error)}`,
          "invalid_response",
          response.status,
        );
      }
      return parsed.data;
    } catch (error) {
      if (error instanceof SallaHttpError) throw error;
      if (controller.signal.aborted) {
        throw new SallaHttpError(
          `Salla request timed out after ${this.timeoutMs}ms.`,
          "timeout",
        );
      }
      throw new SallaHttpError("Salla request failed before a response was received.", "http");
    } finally {
      clearTimeout(timeout);
    }
  }
}
