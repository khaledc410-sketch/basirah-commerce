import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getFreshApiIdentity: vi.fn(),
  getCurrentStoreContext: vi.fn(),
  createDraftFromFinding: vi.fn(),
  enforceAcquisitionRateLimit: vi.fn(),
}));

vi.mock("@/core/auth/session", () => ({ getFreshApiIdentity: mocks.getFreshApiIdentity }));
vi.mock("@/core/data/tenant", () => ({ getCurrentStoreContext: mocks.getCurrentStoreContext }));
vi.mock("@/core/security/request", () => ({ isSameOrigin: () => true }));
vi.mock("@/db/repositories/content-draft-repository", () => ({
  createDraftFromFinding: mocks.createDraftFromFinding,
  FindingDraftError: class FindingDraftError extends Error {},
}));
vi.mock("@/modules/acquisition/rate-limit", () => ({
  enforceAcquisitionRateLimit: mocks.enforceAcquisitionRateLimit,
}));

import { POST } from "./route";

const params = {
  storeId: "00000000-0000-4000-8000-000000000010",
  findingId: "00000000-0000-4000-8000-000000000020",
};

describe("finding draft route tenant boundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getFreshApiIdentity.mockResolvedValue({
      userId: "00000000-0000-4000-8000-000000000001",
      mode: "production",
    });
    mocks.getCurrentStoreContext.mockResolvedValue({
      storeId: params.storeId,
      organizationId: "00000000-0000-4000-8000-000000000002",
      name: "متجر",
      role: "owner",
      runtimeMode: "live",
    });
    mocks.enforceAcquisitionRateLimit.mockResolvedValue(undefined);
    mocks.createDraftFromFinding.mockResolvedValue({
      id: "00000000-0000-5000-8000-000000000030",
      created: true,
      status: "draft",
    });
  });

  it("creates a draft only inside the selected store", async () => {
    const response = await POST(new Request("https://basirah.example/api", { method: "POST" }), {
      params: Promise.resolve(params),
    });
    expect(response.status).toBe(201);
    expect(mocks.createDraftFromFinding).toHaveBeenCalledWith(params);
  });

  it("hides a finding when the route store differs from the active tenant", async () => {
    mocks.getCurrentStoreContext.mockResolvedValue({
      storeId: "00000000-0000-4000-8000-000000000099",
      organizationId: "00000000-0000-4000-8000-000000000002",
      name: "متجر آخر",
      role: "owner",
      runtimeMode: "live",
    });
    const response = await POST(new Request("https://basirah.example/api", { method: "POST" }), {
      params: Promise.resolve(params),
    });
    expect(response.status).toBe(404);
    expect(mocks.createDraftFromFinding).not.toHaveBeenCalled();
  });

  it("blocks read-only members from creating drafts", async () => {
    mocks.getCurrentStoreContext.mockResolvedValue({
      storeId: params.storeId,
      organizationId: "00000000-0000-4000-8000-000000000002",
      name: "متجر",
      role: "viewer",
      runtimeMode: "live",
    });
    const response = await POST(new Request("https://basirah.example/api", { method: "POST" }), {
      params: Promise.resolve(params),
    });
    expect(response.status).toBe(403);
    expect(mocks.createDraftFromFinding).not.toHaveBeenCalled();
  });
});
