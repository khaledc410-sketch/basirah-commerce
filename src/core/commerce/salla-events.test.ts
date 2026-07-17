import { describe, expect, it } from "vitest";

import { parseSallaAppEvent, parseSallaAuthorizationEvent } from "@/core/commerce/salla-events";

describe("parseSallaAuthorizationEvent", () => {
  it("maps Easy Mode expiry as a Unix timestamp and preserves the merchant boundary", () => {
    const event = parseSallaAuthorizationEvent({
      event: "app.store.authorize",
      merchant: 1234509876,
      created_at: "2026-07-13 12:00:00",
      data: {
        access_token: "fake-access-token",
        expires: 1_800_000_000,
        refresh_token: "fake-refresh-token",
        scope: "products.read categories.read offline_access",
        token_type: "bearer",
      },
    });

    expect(event.merchantId).toBe("1234509876");
    expect(event.tokens.expiresAt).toBe("2027-01-15T08:00:00.000Z");
    expect(event.tokens.scopes).toEqual([
      "products.read",
      "categories.read",
      "offline_access",
    ]);
  });

  it("rejects event-shaped payloads that are not authorization events", () => {
    expect(() =>
      parseSallaAuthorizationEvent({ event: "app.uninstalled", merchant: 1, data: {} }),
    ).toThrow();
  });

  it("parses actionable lifecycle hints and safely accepts unused automatic app events", () => {
    expect(
      parseSallaAppEvent({
        event: "app.updated",
        merchant: "123",
        created_at: "2026-07-13 12:00:00",
      }),
    ).toEqual({ kind: "updated", merchantId: "123", createdAt: "2026-07-13 12:00:00" });
    expect(parseSallaAppEvent({ event: "app.uninstalled", merchant: 123 })).toEqual({
      kind: "uninstalled",
      merchantId: "123",
      createdAt: undefined,
    });
    expect(
      parseSallaAppEvent({
        event: "app.installed",
        merchant: 123,
        created_at: "2026-07-13 12:00:00",
      }),
    ).toEqual({
      kind: "ignored",
      eventName: "app.installed",
      merchantId: "123",
      createdAt: "2026-07-13 12:00:00",
    });
    expect(parseSallaAppEvent({ event: "app.subscription.renewed" })).toEqual({
      kind: "ignored",
      eventName: "app.subscription.renewed",
      merchantId: undefined,
      createdAt: undefined,
    });
    expect(() => parseSallaAppEvent({ event: "product.updated", merchant: 123 })).toThrow();
  });
});
