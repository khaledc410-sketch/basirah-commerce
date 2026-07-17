import { describe, expect, it, vi } from "vitest";

import {
  clearEmbeddedRefreshGuard,
  requestEmbeddedAuthRefresh,
  requestEmbeddedOverview,
  requestEmbeddedSession,
  retryAfterMilliseconds,
  stripEmbeddedToken,
  trustedContinueUrl,
} from "@/core/commerce/salla-embedded-client";

const validClaim = "a".repeat(43);

describe("Salla embedded browser client", () => {
  it("strips only the raw Salla token from browser history", () => {
    expect(
      stripEmbeddedToken(
        "https://app.example/salla/embedded?token=raw-secret&app_id=app-1#section",
      ),
    ).toBe("/salla/embedded?app_id=app-1#section");
  });

  it("accepts only the exact same-origin fragment continuation", () => {
    expect(
      trustedContinueUrl(
        `https://app.example/salla/continue#claim=${validClaim}`,
        "https://app.example",
      ),
    ).toBe(`https://app.example/salla/continue#claim=${validClaim}`);
    expect(
      trustedContinueUrl(
        `https://evil.example/salla/continue#claim=${validClaim}`,
        "https://app.example",
      ),
    ).toBeNull();
    expect(
      trustedContinueUrl(
        `https://app.example/salla/continue?claim=${validClaim}#claim=${validClaim}`,
        "https://app.example",
      ),
    ).toBeNull();
    expect(
      trustedContinueUrl(
        `https://app.example/salla/continue#claim=${validClaim}&next=/dashboard`,
        "https://app.example",
      ),
    ).toBeNull();
    expect(
      trustedContinueUrl(
        `https://app.example/salla/continue#claim=${validClaim}&claim=${validClaim}`,
        "https://app.example",
      ),
    ).toBeNull();
  });

  it("establishes a cookie-free session with the raw token only in the POST body", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({
        status: "connected",
        sessionToken: "s".repeat(40),
        expiresAt: "2026-07-14T12:00:00.000Z",
      }),
    );

    await expect(
      requestEmbeddedSession({ token: "t".repeat(40), fetchImpl: fetchMock as typeof fetch }),
    ).resolves.toEqual({
      status: "connected",
      sessionToken: "s".repeat(40),
      expiresAt: "2026-07-14T12:00:00.000Z",
    });

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/api/connect/salla/embedded/session");
    expect(init.credentials).toBe("omit");
    expect(init.cache).toBe("no-store");
    expect(init.body).toBe(JSON.stringify({ token: "t".repeat(40) }));
  });

  it("bounds the webhook race to three attempts and honors Retry-After", async () => {
    let now = 1_000;
    const sleep = vi.fn(async (milliseconds: number) => {
      now += milliseconds;
    });
    const fetchMock = vi.fn(async () =>
      Response.json(
        { status: "authorization_pending", error: "Pending" },
        { status: 409, headers: { "retry-after": "2" } },
      ),
    );

    await expect(
      requestEmbeddedSession({
        token: "t".repeat(40),
        fetchImpl: fetchMock as typeof fetch,
        clock: { now: () => now, sleep },
      }),
    ).resolves.toEqual({ status: "authorization_pending" });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(sleep).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenNthCalledWith(1, 2_000);
  });

  it("surfaces 401 without retrying so the SDK can refresh only once", async () => {
    const fetchMock = vi.fn(async () => Response.json({ error: "Expired" }, { status: 401 }));

    await expect(
      requestEmbeddedSession({ token: "t".repeat(40), fetchImpl: fetchMock as typeof fetch }),
    ).rejects.toMatchObject({ status: 401 });
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("loads the safe overview with an in-memory bearer and no browser credentials", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({
        store: {
          name: "متجر تجريبي",
          externalDomain: "store.example",
          status: "active",
          currency: "SAR",
          defaultLocale: "ar",
        },
        sync: {
          status: "running",
          progress: 50,
          recordsProcessed: 12,
          recordsFailed: 0,
          updatedAt: "2026-07-14T12:00:00.000Z",
        },
      }),
    );

    await expect(
      requestEmbeddedOverview({
        sessionToken: "session-secret",
        fetchImpl: fetchMock as typeof fetch,
      }),
    ).resolves.toMatchObject({ store: { currency: "SAR" }, sync: { progress: 50 } });

    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(init.credentials).toBe("omit");
    expect(init.headers).toMatchObject({ authorization: "Bearer session-secret" });
  });

  it("parses both numeric and HTTP-date Retry-After forms", () => {
    expect(retryAfterMilliseconds("2", 0)).toBe(2_000);
    expect(retryAfterMilliseconds("Thu, 01 Jan 1970 00:00:03 GMT", 1_000)).toBe(2_000);
  });

  it("allows one SDK refresh until a verified session clears the tab guard", () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    };
    const refresh = vi.fn();

    expect(requestEmbeddedAuthRefresh({ refresh }, storage)).toBe(true);
    expect(requestEmbeddedAuthRefresh({ refresh }, storage)).toBe(false);
    expect(refresh).toHaveBeenCalledOnce();

    clearEmbeddedRefreshGuard(storage);
    expect(requestEmbeddedAuthRefresh({ refresh }, storage)).toBe(true);
    expect(refresh).toHaveBeenCalledTimes(2);
  });
});
