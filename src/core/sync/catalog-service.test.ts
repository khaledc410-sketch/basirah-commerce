import { describe, expect, it, vi } from "vitest";

import {
  classifyCatalogPreflightError,
  classifyCatalogSyncError,
  createCatalogSyncService,
  isCatalogResource,
  readNextPage,
  validateCatalogPage,
} from "@/core/sync/catalog-service";
import type { CatalogRepository } from "@/db/repositories/catalog-repository";
import type { SyncRepository } from "@/db/repositories/sync-repository";

describe("catalog sync service foundations", () => {
  it("resumes from the committed next page and recognizes a completed cursor", () => {
    expect(readNextPage(null)).toBe(1);
    expect(readNextPage({ version: 1, nextPage: 4, complete: false })).toBe(4);
    expect(readNextPage({ version: 1, nextPage: null, complete: true })).toBeNull();
  });

  it("rejects page drift before a checkpoint can advance", () => {
    expect(() =>
      validateCatalogPage(
        { items: [], total: 10, currentPage: 3, totalPages: 5, perPage: 2 },
        2,
      ),
    ).toThrow(/invalid catalog pagination/);
    expect(
      validateCatalogPage(
        { items: ["record"], total: 1, currentPage: 1, totalPages: 1, perPage: 50 },
        1,
      ).items,
    ).toEqual(["record"]);
  });

  it("classifies only transient platform failures as retryable", () => {
    expect(classifyCatalogSyncError({ status: 429 })).toMatchObject({
      code: "platform_rate_limited",
      retryable: true,
    });
    expect(classifyCatalogSyncError({ statusCode: 503 })).toMatchObject({
      code: "platform_temporarily_unavailable",
      retryable: true,
    });
    expect(classifyCatalogSyncError({ status: 401 })).toMatchObject({
      code: "platform_authorization_failed",
      retryable: false,
    });
    expect(classifyCatalogSyncError(new Error("bad mapping"))).toMatchObject({
      code: "catalog_sync_failed",
      retryable: false,
    });
  });

  it("classifies preflight credential boundaries separately from transient setup failures", () => {
    expect(
      classifyCatalogPreflightError(
        new Error("The catalog job connection is no longer active."),
      ),
    ).toMatchObject({ code: "platform_authorization_failed", retryable: false });
    expect(
      classifyCatalogPreflightError(
        new Error("The Salla credential refresh is already in progress."),
      ),
    ).toMatchObject({ code: "platform_refresh_in_progress", retryable: true });
    expect(
      classifyCatalogPreflightError(new Error("Salla token exchange failed with status 503.")),
    ).toMatchObject({ code: "platform_temporarily_unavailable", retryable: true });
    expect(
      classifyCatalogPreflightError(new Error("Salla token exchange failed with status 400.")),
    ).toMatchObject({ code: "platform_authorization_failed", retryable: false });
    expect(classifyCatalogPreflightError(new Error("Database connection reset."))).toMatchObject({
      code: "catalog_preflight_failed",
      retryable: true,
    });
  });

  it("records transient preflight failures only after BullMQ exhausts its attempts", async () => {
    const recordRunFailure = vi.fn().mockResolvedValue({ id: "job-store" });
    const now = new Date("2026-07-14T08:00:00Z");
    const service = createCatalogSyncService({
      syncRepository: { recordRunFailure } as unknown as SyncRepository,
      catalogRepository: {} as CatalogRepository,
      now: () => now,
    });
    const input = {
      storeId: "store-1",
      connectionId: "connection-1",
      runId: "run-1",
      error: { status: 503 },
    };

    await expect(service.handlePreflightFailure({ ...input, finalAttempt: false })).resolves.toEqual({
      failure: expect.objectContaining({ retryable: true }),
      recorded: false,
    });
    expect(recordRunFailure).not.toHaveBeenCalled();

    await expect(service.handlePreflightFailure({ ...input, finalAttempt: true })).resolves.toEqual({
      failure: expect.objectContaining({ retryable: true }),
      recorded: true,
    });
    expect(recordRunFailure).toHaveBeenCalledWith({
      storeId: "store-1",
      connectionId: "connection-1",
      runId: "run-1",
      errorCode: "platform_temporarily_unavailable",
      message: "The commerce platform is temporarily unavailable.",
      retryable: true,
      details: { status: 503 },
      occurredAt: now,
    });
  });

  it("records deterministic preflight failures immediately", async () => {
    const recordRunFailure = vi.fn().mockResolvedValue({ id: "job-store" });
    const service = createCatalogSyncService({
      syncRepository: { recordRunFailure } as unknown as SyncRepository,
      catalogRepository: {} as CatalogRepository,
    });
    const result = await service.handlePreflightFailure({
      storeId: "store-1",
      connectionId: "connection-1",
      runId: "run-1",
      error: new Error("The Salla token belongs to a different merchant."),
      finalAttempt: false,
    });

    expect(result).toMatchObject({ failure: { retryable: false }, recorded: true });
    expect(recordRunFailure).toHaveBeenCalledOnce();
  });

  it("stops before a remote fetch when the credential generation was revoked", async () => {
    const jobs = ["store", "categories", "products"].map((resourceType, index) => ({
      id: `job-${resourceType}`,
      storeId: "store-1",
      connectionId: "connection-1",
      runId: "run-1",
      resourceType,
      status: "queued",
      cursor: null,
      startedAt: null,
      createdAt: new Date(index),
    }));
    const getStore = vi.fn();
    const recordFailure = vi.fn().mockResolvedValue(jobs[0]);
    const service = createCatalogSyncService({
      syncRepository: {
        listRunJobs: vi.fn().mockResolvedValue(jobs),
        claimJob: vi.fn().mockResolvedValue({ ...jobs[0], status: "running" }),
        isActiveConnectionBoundary: vi.fn().mockResolvedValue(false),
        recordFailure,
      } as unknown as SyncRepository,
      catalogRepository: {} as CatalogRepository,
    });

    await expect(
      service.processRun({
        storeId: "store-1",
        connectionId: "connection-1",
        connectionTokenVersion: 4,
        runId: "run-1",
        source: {
          getStore,
          listCategories: vi.fn(),
          listProducts: vi.fn(),
        },
      }),
    ).rejects.toMatchObject({
      failure: { code: "platform_authorization_failed", retryable: false },
    });
    expect(getStore).not.toHaveBeenCalled();
    expect(recordFailure).toHaveBeenCalledWith(
      expect.objectContaining({
        errorCode: "platform_authorization_failed",
        retryable: false,
      }),
    );
  });

  it("keeps the supported resource set explicit", () => {
    expect(isCatalogResource("store")).toBe(true);
    expect(isCatalogResource("categories")).toBe(true);
    expect(isCatalogResource("products")).toBe(true);
    expect(isCatalogResource("policies")).toBe(false);
  });
});
