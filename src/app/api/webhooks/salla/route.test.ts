import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  verifyWebhook: vi.fn(),
  findConnection: vi.fn(),
  revokeInstallation: vi.fn(),
}));

vi.mock("@/core/commerce/salla-connector", () => ({
  SallaConnector: class {
    verifyWebhook = mocks.verifyWebhook;
  },
}));
vi.mock("@/db/repositories/platform-connection-repository", () => ({
  findPlatformConnectionByExternalStoreId: mocks.findConnection,
  revokePlatformInstallation: mocks.revokeInstallation,
  rotatePlatformConnectionAuthorization: vi.fn(),
  savePendingPlatformAuthorization: vi.fn(),
}));
vi.mock("@/core/jobs/catalog-queue", () => ({ dispatchCatalogSyncOutbox: vi.fn() }));
vi.mock("@/db/repositories/sync-repository", () => ({
  createSyncRepository: () => ({ createOrGetCatalogRun: vi.fn() }),
}));
vi.mock("@/db/client", () => ({
  getDb: () => {
    throw new Error("Inbox persistence must not run for an unbound uninstall.");
  },
}));
vi.mock("@/lib/logger", () => ({
  logEvent: vi.fn(),
  requestContext: () => ({}),
}));

import { POST } from "@/app/api/webhooks/salla/route";

function uninstallRequest(createdAt?: string) {
  return new Request("https://app.basirah.test/api/webhooks/salla", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      event: "app.uninstalled",
      merchant: "merchant-123",
      ...(createdAt ? { created_at: createdAt } : {}),
    }),
  });
}

function automaticAppEventRequest(event: string) {
  return new Request("https://app.basirah.test/api/webhooks/salla", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      event,
      merchant: "merchant-123",
      created_at: "2026-07-14 12:00:00",
    }),
  });
}

describe("Salla pending uninstall webhook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.verifyWebhook.mockResolvedValue(true);
    mocks.findConnection.mockResolvedValue(null);
    mocks.revokeInstallation.mockResolvedValue({
      freshness: "applied",
      storeId: null,
      connectionId: null,
      cancelledJobs: 0,
    });
  });

  it("destroys pending credentials and invalidates claims before tenant binding", async () => {
    const response = await POST(uninstallRequest("2026-07-14 12:00:00"));

    expect(response.status).toBe(202);
    expect(await response.json()).toEqual({ accepted: true, freshness: "applied" });
    expect(mocks.revokeInstallation).toHaveBeenCalledWith({
      platform: "salla",
      externalStoreId: "merchant-123",
      eventCreatedAt: "2026-07-14 12:00:00",
    });
  });

  it("ignores an uninstall without provider time instead of revoking a newer install", async () => {
    const response = await POST(uninstallRequest());

    expect(response.status).toBe(202);
    expect(await response.json()).toMatchObject({
      accepted: true,
      ignored: true,
      reason: "missing_event_timestamp",
    });
    expect(mocks.findConnection).not.toHaveBeenCalled();
    expect(mocks.revokeInstallation).not.toHaveBeenCalled();
  });

  it("acknowledges unused automatic app events without creating provider retries", async () => {
    const response = await POST(automaticAppEventRequest("app.installed"));

    expect(response.status).toBe(202);
    expect(await response.json()).toEqual({
      accepted: true,
      ignored: true,
      event: "app.installed",
    });
    expect(mocks.findConnection).not.toHaveBeenCalled();
    expect(mocks.revokeInstallation).not.toHaveBeenCalled();
  });
});
