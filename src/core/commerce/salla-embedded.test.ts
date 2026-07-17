import { jwtVerify } from "jose";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  activeConnection: vi.fn(),
  env: {
    APP_URL: "https://app.basirah.test",
    SALLA_APP_ID: "app-123",
    TOKEN_ENCRYPTION_KEY: "test-token-encryption-key-that-is-more-than-32-bytes",
  },
}));

vi.mock("@/config/env", () => ({ getServerEnv: () => mocks.env }));
vi.mock("@/db/repositories/platform-connection-repository", () => ({
  findActivePlatformConnectionByExternalStoreId: mocks.activeConnection,
}));

import {
  issueSallaEmbeddedSession,
  sallaEmbeddedSessionAudience,
  verifySallaEmbeddedSession,
} from "@/core/commerce/salla-embedded";

const storeId = "00000000-0000-4000-8000-000000000001";
const connectionId = "00000000-0000-4000-8000-000000000002";

describe("Salla embedded sessions", () => {
  beforeEach(() => {
    mocks.activeConnection.mockReset();
    mocks.activeConnection.mockResolvedValue({
      id: connectionId,
      storeId,
      status: "connected",
      tokenVersion: 1,
    });
  });

  it("issues an HS256 session bound to app, merchant, user, store, connection and jti", async () => {
    const issued = await issueSallaEmbeddedSession({
      merchantId: "merchant-123",
      userId: "salla-user-9",
      storeId,
      connectionId,
      authorityExpiresAt: new Date(Date.now() + 20 * 60 * 1_000),
    });

    const claims = await verifySallaEmbeddedSession(issued.sessionToken);
    expect(claims).toMatchObject({
      aud: sallaEmbeddedSessionAudience,
      app: "app-123",
      merchant: "merchant-123",
      user: "salla-user-9",
      store: storeId,
      connection: connectionId,
    });
    expect(claims.jti).toMatch(/^[0-9a-f-]{36}$/u);
    expect(claims.exp - claims.iat).toBeLessThanOrEqual(10 * 60);
    expect(mocks.activeConnection).toHaveBeenCalledWith("salla", "merchant-123");
  });

  it("does not sign with the raw credential-encryption secret", async () => {
    const issued = await issueSallaEmbeddedSession({
      merchantId: "merchant-123",
      userId: "salla-user-9",
      storeId,
      connectionId,
      authorityExpiresAt: new Date(Date.now() + 20 * 60 * 1_000),
    });

    await expect(
      jwtVerify(
        issued.sessionToken,
        new TextEncoder().encode(mocks.env.TOKEN_ENCRYPTION_KEY),
        { algorithms: ["HS256"] },
      ),
    ).rejects.toThrow();
  });

  it("caps the session at the upstream authority expiry", async () => {
    const authorityExpiresAt = new Date(Date.now() + 90 * 1_000);
    const issued = await issueSallaEmbeddedSession({
      merchantId: "merchant-123",
      userId: "salla-user-9",
      storeId,
      connectionId,
      authorityExpiresAt,
    });
    expect(issued.expiresAt.getTime()).toBeLessThanOrEqual(authorityExpiresAt.getTime());
  });

  it("rejects a still-signed token after the active store/connection boundary disappears", async () => {
    const issued = await issueSallaEmbeddedSession({
      merchantId: "merchant-123",
      userId: "salla-user-9",
      storeId,
      connectionId,
      authorityExpiresAt: new Date(Date.now() + 20 * 60 * 1_000),
    });
    mocks.activeConnection.mockResolvedValue(null);

    await expect(verifySallaEmbeddedSession(issued.sessionToken)).rejects.toThrow(
      "no longer active",
    );
  });

  it("rejects a token when the merchant now resolves to a different connection", async () => {
    const issued = await issueSallaEmbeddedSession({
      merchantId: "merchant-123",
      userId: "salla-user-9",
      storeId,
      connectionId,
      authorityExpiresAt: new Date(Date.now() + 20 * 60 * 1_000),
    });
    mocks.activeConnection.mockResolvedValue({
      id: "00000000-0000-4000-8000-000000000003",
      storeId,
      status: "connected",
      tokenVersion: 2,
    });

    await expect(verifySallaEmbeddedSession(issued.sessionToken)).rejects.toThrow(
      "no longer active",
    );
  });
});
