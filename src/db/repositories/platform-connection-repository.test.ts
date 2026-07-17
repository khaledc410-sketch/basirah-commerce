import { beforeEach, describe, expect, it, vi } from "vitest";

const databaseState = vi.hoisted(() => ({
  queries: [] as Array<{ sql: string; params: unknown[] }>,
  rows: [] as unknown[][][],
}));

vi.mock("@/config/env", () => ({
  getServerEnv: () => ({
    TOKEN_ENCRYPTION_KEY: "test-platform-token-encryption-key-that-is-long-enough",
  }),
}));

vi.mock("@/db/client", async () => {
  const [{ drizzle }, schema] = await Promise.all([
    import("drizzle-orm/pg-proxy"),
    import("@/db/schema"),
  ]);
  const database = drizzle(
    async (query, params) => {
      databaseState.queries.push({ sql: query, params });
      return { rows: databaseState.rows.shift() ?? [] };
    },
    { schema },
  );
  return { getDb: () => database };
});

import {
  consumePlatformBindingClaim,
  hasPendingPlatformAuthorization,
  peekPlatformBindingClaim,
  providerRevocationSecondEnd,
  rotatePlatformConnectionAuthorization,
  savePendingPlatformAuthorization,
  upsertPlatformConnection,
} from "@/db/repositories/platform-connection-repository";

const tokens = {
  accessToken: "new-access-token",
  refreshToken: "new-refresh-token",
  expiresAt: "2026-08-01T00:00:00.000Z",
  scopes: ["products.read", "offline_access"],
  tokenType: "bearer",
};

describe("platform authorization credential freshness", () => {
  beforeEach(() => {
    databaseState.queries.length = 0;
    databaseState.rows.length = 0;
  });

  it("guards pending credential replacement inside the conflict update", async () => {
    databaseState.rows.push([[new Date("2026-07-14T12:00:00.000Z")]]);

    await expect(
      savePendingPlatformAuthorization({
        platform: "salla",
        externalStoreId: "merchant-1",
        eventCreatedAt: "2026-07-14 12:00:00",
        tokens,
      }),
    ).resolves.toEqual({ freshness: "applied" });

    expect(databaseState.queries).toHaveLength(1);
    expect(databaseState.queries[0]?.sql).toMatch(
      /on conflict \("platform","external_store_id"\) do update set[\s\S]+where "pending_platform_authorizations"\."event_created_at" < \$\d+/u,
    );
  });

  it("treats an equal pending event as current without replacing ciphertext", async () => {
    databaseState.rows.push([], [["2026-07-14T12:00:00.000Z"]]);

    await expect(
      savePendingPlatformAuthorization({
        platform: "salla",
        externalStoreId: "merchant-1",
        eventCreatedAt: "2026-07-14 12:00:00",
        tokens,
      }),
    ).resolves.toEqual({ freshness: "current" });
  });

  it("atomically rejects an authorization that cannot advance the provider boundary", async () => {
    databaseState.rows.push(
      [],
      [["connected", "2026-07-14T10:00:00.000Z", null]],
    );

    await expect(
      rotatePlatformConnectionAuthorization({
        connectionId: "00000000-0000-4000-8000-000000000001",
        storeId: "00000000-0000-4000-8000-000000000002",
        platform: "salla",
        externalStoreId: "merchant-1",
        eventCreatedAt: "2026-07-14 11:00:00",
        tokens,
      }),
    ).resolves.toEqual({
      connectionId: "00000000-0000-4000-8000-000000000001",
      freshness: "stale",
    });

    const guardedUpdate = databaseState.queries[0]?.sql ?? "";
    expect(guardedUpdate).toMatch(
      /"platform_connections"\."authorization_event_created_at" < \$\d+/u,
    );
    expect(guardedUpdate).toMatch(
      /"platform_connections"\."disconnected_at" < \$\d+/u,
    );
    expect(guardedUpdate).not.toMatch(/"platform_connections"\."updated_at" < \$\d+/u);
    expect(guardedUpdate).toContain('"updated_at" =');
  });

  it("timestamps a normal refresh without clearing the last authorization event", async () => {
    databaseState.rows.push([["00000000-0000-4000-8000-000000000001"]]);

    await upsertPlatformConnection({
      storeId: "00000000-0000-4000-8000-000000000002",
      platform: "salla",
      externalStoreId: "merchant-1",
      tokens,
    });

    const conflictUpdate = (databaseState.queries[0]?.sql ?? "").split("do update set")[1] ?? "";
    expect(conflictUpdate).toContain('"updated_at" =');
    expect(conflictUpdate).not.toContain('"authorization_event_created_at" =');
  });

  it("classifies exact authorization timestamp equality as an idempotent retry", async () => {
    databaseState.rows.push(
      [],
      [["connected", "2026-07-14T11:00:00.000Z", null]],
    );

    await expect(
      rotatePlatformConnectionAuthorization({
        connectionId: "00000000-0000-4000-8000-000000000001",
        storeId: "00000000-0000-4000-8000-000000000002",
        platform: "salla",
        externalStoreId: "merchant-1",
        eventCreatedAt: "2026-07-14 11:00:00",
        tokens,
      }),
    ).resolves.toMatchObject({ freshness: "current" });
  });

  it("does not classify an equal authorization as current after revocation", async () => {
    databaseState.rows.push(
      [],
      [[
        "disconnected",
        "2026-07-14T11:00:00.000Z",
        "2026-07-14T11:00:00.000Z",
      ]],
    );

    await expect(
      rotatePlatformConnectionAuthorization({
        connectionId: "00000000-0000-4000-8000-000000000001",
        storeId: "00000000-0000-4000-8000-000000000002",
        platform: "salla",
        externalStoreId: "merchant-1",
        eventCreatedAt: "2026-07-14 11:00:00",
        tokens,
      }),
    ).resolves.toMatchObject({ freshness: "stale" });
  });

  it("biases same-second lifecycle ordering toward revocation without accepting older events", () => {
    const cutoff = providerRevocationSecondEnd("2026-07-14 12:00:00");

    expect(new Date("2026-07-14T12:00:00.999Z") <= cutoff).toBe(true);
    expect(new Date("2026-07-14T12:00:01.000Z") <= cutoff).toBe(false);
    expect(new Date("2026-07-14T12:00:01.000Z") <=
      providerRevocationSecondEnd("2026-07-14 11:59:59")).toBe(false);
  });

  it("peeks and atomically consumes a valid one-time claim by its digest boundary", async () => {
    const claimId = "00000000-0000-4000-8000-000000000009";
    const expiresAt = new Date("2026-08-01T00:00:00.000Z");
    const secret = "a".repeat(43);
    databaseState.rows.push([
      [claimId, "salla", "merchant-1", "user-1", expiresAt, null],
    ]);

    await expect(peekPlatformBindingClaim(secret, "salla")).resolves.toMatchObject({
      id: claimId,
      externalStoreId: "merchant-1",
      externalUserId: "user-1",
      consumedAt: null,
    });
    expect(databaseState.queries[0]?.sql).toContain('"platform_binding_claims"."claim_hash" =');
    expect(databaseState.queries[0]?.sql).toContain('"platform_binding_claims"."consumed_at" is null');
    expect(databaseState.queries[0]?.sql).toContain('"platform_binding_claims"."expires_at" >');

    const consumedAt = new Date();
    databaseState.rows.push([
      [claimId, "salla", "merchant-1", "user-1", expiresAt, consumedAt],
    ]);
    await expect(consumePlatformBindingClaim(secret, "salla")).resolves.toMatchObject({
      id: claimId,
      externalStoreId: "merchant-1",
      externalUserId: "user-1",
    });
    expect(databaseState.queries[1]?.sql).toMatch(
      /update "platform_binding_claims" set "consumed_at" =[^]*where[^]*"consumed_at" is null[^]*returning/iu,
    );
  });

  it("checks pending authorization existence without decrypting credentials", async () => {
    databaseState.rows.push([["00000000-0000-4000-8000-000000000010"]]);

    await expect(hasPendingPlatformAuthorization("salla", "merchant-1")).resolves.toBe(true);
    const query = databaseState.queries[0]?.sql ?? "";
    expect(query).toContain('select "id" from "pending_platform_authorizations"');
    expect(query).not.toContain("access_token_encrypted");
  });
});
