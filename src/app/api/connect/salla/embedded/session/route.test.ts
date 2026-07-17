import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  introspect: vi.fn(),
  activeConnection: vi.fn(),
  hasPending: vi.fn(),
  issueClaim: vi.fn(),
  issueSession: vi.fn(),
  rateLimit: vi.fn(),
}));

vi.mock("@/config/env", () => ({
  getServerEnv: () => ({ APP_URL: "https://app.basirah.test" }),
}));
vi.mock("@/core/commerce/salla-introspection", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/core/commerce/salla-introspection")>()),
  introspectSallaEmbeddedToken: mocks.introspect,
}));
vi.mock("@/core/commerce/salla-embedded", () => ({
  issueSallaEmbeddedSession: mocks.issueSession,
}));
vi.mock("@/core/security/rate-limit", () => ({
  clientAddress: () => "203.0.113.10",
  enforceRateLimit: mocks.rateLimit,
}));
vi.mock("@/core/security/request", () => ({
  acceptsJson: () => true,
  isSameOrigin: () => true,
}));
vi.mock("@/db/repositories/platform-connection-repository", () => ({
  findActivePlatformConnectionByExternalStoreId: mocks.activeConnection,
  hasPendingPlatformAuthorization: mocks.hasPending,
  issuePlatformBindingClaim: mocks.issueClaim,
}));
vi.mock("@/lib/logger", () => ({
  logEvent: vi.fn(),
  requestContext: () => ({}),
}));

import { POST } from "@/app/api/connect/salla/embedded/session/route";
import { SallaIntrospectionError } from "@/core/commerce/salla-introspection";

const storeId = "00000000-0000-4000-8000-000000000001";
const connectionId = "00000000-0000-4000-8000-000000000002";

function embeddedRequest() {
  return new Request("https://app.basirah.test/api/connect/salla/embedded/session", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "https://app.basirah.test",
    },
    body: JSON.stringify({ token: "t".repeat(40) }),
  });
}

describe("Salla embedded session route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.rateLimit.mockResolvedValue({ allowed: true, remaining: 19, retryAfterSeconds: 0 });
    mocks.introspect.mockResolvedValue({
      merchantId: "merchant-123",
      userId: "user-7",
      expiresAt: new Date(Date.now() + 20 * 60 * 1_000),
    });
    mocks.activeConnection.mockResolvedValue({
      id: connectionId,
      storeId,
      status: "connected",
      tokenVersion: 1,
    });
    mocks.hasPending.mockResolvedValue(false);
    mocks.issueSession.mockResolvedValue({
      sessionToken: "signed.embedded.session",
      expiresAt: new Date("2026-07-14T12:10:00.000Z"),
    });
  });

  it("issues an in-memory session for an active connection", async () => {
    const response = await POST(embeddedRequest());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      status: "connected",
      sessionToken: "signed.embedded.session",
      expiresAt: "2026-07-14T12:10:00.000Z",
    });
    expect(mocks.issueSession).toHaveBeenCalledWith(
      expect.objectContaining({
        merchantId: "merchant-123",
        userId: "user-7",
        storeId,
        connectionId,
      }),
    );
  });

  it("returns a fragment-only one-time continuation when webhook authorization exists", async () => {
    mocks.activeConnection.mockResolvedValue(null);
    mocks.hasPending.mockResolvedValue(true);
    mocks.issueClaim.mockResolvedValue({
      secret: "claim_secret_that_is_never_put_in_query_logs_1234",
      expiresAt: new Date(Date.now() + 10 * 60 * 1_000),
    });

    const response = await POST(embeddedRequest());
    const body = await response.json();
    const continueUrl = new URL(body.continueUrl as string);

    expect(response.status).toBe(200);
    expect(body.status).toBe("link_required");
    expect(continueUrl.origin).toBe("https://app.basirah.test");
    expect(continueUrl.pathname).toBe("/salla/continue");
    expect(continueUrl.search).toBe("");
    expect(continueUrl.hash).toContain("#claim=");
  });

  it("returns retryable 409 while the signed webhook is still pending", async () => {
    mocks.activeConnection.mockResolvedValue(null);

    const response = await POST(embeddedRequest());
    expect(response.status).toBe(409);
    expect(response.headers.get("retry-after")).toBe("3");
    expect(await response.json()).toMatchObject({ status: "authorization_pending" });
  });

  it("fails closed when introspection omits the embedded user", async () => {
    mocks.introspect.mockResolvedValue({
      merchantId: "merchant-123",
      expiresAt: new Date(Date.now() + 20 * 60 * 1_000),
    });

    const response = await POST(embeddedRequest());
    expect(response.status).toBe(401);
    expect(mocks.activeConnection).not.toHaveBeenCalled();
  });

  it("returns 401 only for invalid or expired authority", async () => {
    mocks.introspect.mockRejectedValue(
      new SallaIntrospectionError("invalid_token", "invalid"),
    );

    const response = await POST(embeddedRequest());
    expect(response.status).toBe(401);
    expect(response.headers.get("retry-after")).toBeNull();
  });

  it.each(["unavailable", "configuration"] as const)(
    "returns retryable 503 for %s introspection failures",
    async (kind) => {
      mocks.introspect.mockRejectedValue(new SallaIntrospectionError(kind, "retry"));

      const response = await POST(embeddedRequest());
      expect(response.status).toBe(503);
      expect(response.headers.get("retry-after")).toBe("3");
    },
  );
});
