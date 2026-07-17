import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  verifySession: vi.fn(),
  rateLimit: vi.fn(),
  latestSync: vi.fn(),
  storeRows: [] as unknown[],
}));

vi.mock("@/core/commerce/salla-embedded", () => ({
  verifySallaEmbeddedSession: mocks.verifySession,
}));
vi.mock("@/core/security/rate-limit", () => ({
  enforceRateLimit: mocks.rateLimit,
}));
vi.mock("@/db/client", () => ({
  getDb: () => ({
    select: () => ({
      from: () => ({
        where: () => ({
          limit: async () => mocks.storeRows,
        }),
      }),
    }),
  }),
}));
vi.mock("@/db/repositories/sync-repository", () => ({
  createSyncRepository: () => ({ getLatestRunStatus: mocks.latestSync }),
}));
vi.mock("@/lib/logger", () => ({
  logEvent: vi.fn(),
  requestContext: () => ({}),
}));

import { GET } from "@/app/api/embedded/salla/overview/route";

const storeId = "00000000-0000-4000-8000-000000000001";

function overviewRequest(token = "signed.embedded.session") {
  return new Request("https://app.basirah.test/api/embedded/salla/overview", {
    headers: { authorization: `Bearer ${token}` },
  });
}

describe("Salla embedded overview route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.storeRows = [
      {
        name: "Store",
        externalDomain: "store.example",
        status: "active",
        currency: "SAR",
        defaultLocale: "ar",
      },
    ];
    mocks.verifySession.mockResolvedValue({
      store: storeId,
      jti: "00000000-0000-4000-8000-000000000009",
    });
    mocks.rateLimit.mockResolvedValue({ allowed: true, remaining: 119, retryAfterSeconds: 0 });
    mocks.latestSync.mockResolvedValue({
      runId: "00000000-0000-4000-8000-000000000008",
      overallStatus: "running",
      stages: [
        {
          percent: 50,
          recordsProcessed: 12,
          recordsFailed: 1,
          startedAt: new Date("2026-07-14T12:00:00.000Z"),
          heartbeatAt: new Date("2026-07-14T12:01:00.000Z"),
          completedAt: null,
        },
      ],
      summary: { products: 12, variants: 20, categories: 3 },
      freshness: null,
    });
  });

  it("returns only the safe store and sync DTO with no tenant identifiers", async () => {
    const response = await GET(overviewRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body).toEqual({
      store: {
        name: "Store",
        externalDomain: "store.example",
        status: "active",
        currency: "SAR",
        defaultLocale: "ar",
      },
      sync: {
        status: "running",
        progress: 50,
        recordsProcessed: 12,
        recordsFailed: 1,
        updatedAt: "2026-07-14T12:01:00.000Z",
      },
    });
    expect(JSON.stringify(body)).not.toContain(storeId);
    expect(JSON.stringify(body)).not.toContain("runId");
  });

  it("rejects missing and revoked bearer sessions", async () => {
    const missing = await GET(
      new Request("https://app.basirah.test/api/embedded/salla/overview"),
    );
    expect(missing.status).toBe(401);
    expect(missing.headers.get("cache-control")).toBe("no-store");

    mocks.verifySession.mockRejectedValue(new Error("revoked"));
    const revoked = await GET(overviewRequest());
    expect(revoked.status).toBe(401);
    expect(mocks.latestSync).not.toHaveBeenCalled();
  });

  it("rate-limits a valid session by its verified store and jti", async () => {
    mocks.rateLimit.mockResolvedValue({ allowed: false, remaining: 0, retryAfterSeconds: 42 });

    const response = await GET(overviewRequest());
    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("42");
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(mocks.rateLimit).toHaveBeenCalledWith(
      expect.objectContaining({ identifier: `${storeId}:00000000-0000-4000-8000-000000000009` }),
    );
    expect(mocks.latestSync).not.toHaveBeenCalled();
  });
});
