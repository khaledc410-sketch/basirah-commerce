import { describe, expect, it, vi } from "vitest";

import { syntheticProductPageResponse } from "@/core/commerce/salla/fixtures/official-docs.synthetic";
import {
  parseRetryAfterMs,
  SallaHttpClient,
  SallaHttpError,
} from "@/core/commerce/salla/http-client";

describe("SallaHttpClient", () => {
  it("sends bearer auth, locale and documented page query parameters", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify(syntheticProductPageResponse), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    const client = new SallaHttpClient({
      accessToken: "redacted-access-token",
      fetchImpl: fetchMock as unknown as typeof fetch,
    });

    const response = await client.listProducts({
      page: 2,
      perPage: 40,
      keyword: "shirt",
      status: "sale",
      categoryId: "9150000001",
      language: "en",
    });

    expect(response.data).toHaveLength(1);
    const [input, init] = fetchMock.mock.calls[0] as unknown as [URL, RequestInit];
    const url = new URL(input);
    expect(url.pathname).toBe("/admin/v2/products");
    expect(Object.fromEntries(url.searchParams)).toEqual({
      page: "2",
      per_page: "40",
      keyword: "shirt",
      status: "sale",
      category: "9150000001",
    });
    const headers = new Headers(init.headers);
    expect(headers.get("authorization")).toBe("Bearer redacted-access-token");
    expect(headers.get("accept-language")).toBe("en");
  });

  it("classifies 429 responses and exposes Retry-After in milliseconds", async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(null, { status: 429, headers: { "retry-after": "2.5" } }),
    ) as unknown as typeof fetch;
    const client = new SallaHttpClient({ accessToken: "redacted", fetchImpl });

    await expect(
      client.listProducts({ page: 1, perPage: 60, language: "ar" }),
    ).rejects.toMatchObject({
      name: "SallaHttpError",
      kind: "rate_limited",
      status: 429,
      retryAfterMs: 2_500,
    });
  });

  it("parses an HTTP-date Retry-After against the injected clock", () => {
    const now = Date.parse("2026-07-13T09:00:00.000Z");
    expect(parseRetryAfterMs("Mon, 13 Jul 2026 09:00:03 GMT", now)).toBe(3_000);
  });

  it("aborts and classifies requests that exceed the configured timeout", async () => {
    const fetchImpl = vi.fn(
      (_input: URL | RequestInfo, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () =>
            reject(new DOMException("Aborted", "AbortError")),
          );
        }),
    ) as unknown as typeof fetch;
    const client = new SallaHttpClient({
      accessToken: "redacted",
      fetchImpl,
      timeoutMs: 5,
    });

    const error = await client
      .getProduct("9100000001", "ar")
      .catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(SallaHttpError);
    expect(error).toMatchObject({ kind: "timeout" });
  });
});
