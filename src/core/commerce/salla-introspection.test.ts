import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/config/env", () => ({
  getServerEnv: () => ({ SALLA_APP_ID: "app-123" }),
}));

import {
  SallaIntrospectionError,
  introspectSallaEmbeddedToken,
  parseSallaIntrospection,
} from "@/core/commerce/salla-introspection";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("Salla embedded token introspection", () => {
  it("parses the documented response envelope and ISO expiry", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-19T10:00:00Z"));
    expect(
      parseSallaIntrospection({
        status: 200,
        success: true,
        data: { merchant_id: 123456, user_id: 987654, exp: "2026-01-19T12:00:00Z" },
      }),
    ).toEqual({
      merchantId: "123456",
      userId: "987654",
      expiresAt: new Date("2026-01-19T12:00:00Z"),
    });
  });

  it("rejects expired or unwrapped responses", () => {
    expect(() =>
      parseSallaIntrospection({
        status: 200,
        success: true,
        data: { merchant_id: 1, exp: "2020-01-01T00:00:00Z" },
      }),
    ).toThrow(/expired/);
    expect(() => parseSallaIntrospection({ merchant_id: 1, exp: 4_000_000_000 })).toThrow();
  });

  it("classifies invalid token responses as non-retryable", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 401 })));

    await expect(introspectSallaEmbeddedToken("invalid-token")).rejects.toMatchObject({
      name: "SallaIntrospectionError",
      kind: "invalid_token",
    } satisfies Partial<SallaIntrospectionError>);
  });

  it.each([429, 500, 503])("classifies HTTP %i as retryable", async (status) => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status })));

    await expect(introspectSallaEmbeddedToken("temporary-token")).rejects.toMatchObject({
      name: "SallaIntrospectionError",
      kind: "unavailable",
    } satisfies Partial<SallaIntrospectionError>);
  });

  it("classifies timeout/network failures as retryable", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new Error("timeout"))));

    await expect(introspectSallaEmbeddedToken("temporary-token")).rejects.toMatchObject({
      name: "SallaIntrospectionError",
      kind: "unavailable",
    } satisfies Partial<SallaIntrospectionError>);
  });
});
