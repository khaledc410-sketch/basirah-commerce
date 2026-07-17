import { describe, expect, it } from "vitest";

import {
  calculateSyncPercent,
  catalogSyncJobKey,
  deriveOverallSyncStatus,
  selectSyncRunFailureTarget,
  summarizeSyncRun,
  type SyncRunFailureStage,
  type SyncStageStatus,
} from "@/db/repositories/sync-repository";

function stage(overrides: Partial<SyncStageStatus> = {}): SyncStageStatus {
  return {
    id: "job-1",
    resourceType: "products",
    status: "queued",
    recordsTotal: null,
    recordsProcessed: 0,
    recordsFailed: 0,
    cursor: null,
    startedAt: null,
    heartbeatAt: null,
    completedAt: null,
    percent: null,
    ...overrides,
  };
}

function runStage(
  resourceType: SyncRunFailureStage["resourceType"],
  overrides: Partial<SyncRunFailureStage> = {},
): SyncRunFailureStage {
  return {
    id: `job-${resourceType}`,
    storeId: "store-1",
    connectionId: "connection-1",
    runId: "run-1",
    resourceType,
    status: "queued",
    ...overrides,
  };
}

describe("sync repository status logic", () => {
  it("keeps progress indeterminate until a total is known", () => {
    expect(calculateSyncPercent(stage())).toBeNull();
    expect(
      calculateSyncPercent(
        stage({ status: "running", recordsTotal: 10, recordsProcessed: 4, recordsFailed: 1 }),
      ),
    ).toBe(50);
    expect(calculateSyncPercent(stage({ status: "succeeded", recordsTotal: 0 }))).toBe(100);
  });

  it("derives terminal failures before running and queued states", () => {
    expect(deriveOverallSyncStatus([stage({ status: "running" }), stage({ status: "failed" })])).toBe(
      "failed",
    );
    expect(
      deriveOverallSyncStatus([stage({ status: "failed" }), stage({ status: "dead_letter" })]),
    ).toBe("dead_letter");
    expect(
      deriveOverallSyncStatus([
        stage({ status: "succeeded" }),
        stage({ status: "succeeded" }),
      ]),
    ).toBe("succeeded");
  });

  it("only allows onboarding after every required stage and a non-empty catalog", () => {
    const stages = [
      stage({ id: "store", resourceType: "store", status: "succeeded" }),
      stage({ id: "categories", resourceType: "categories", status: "succeeded" }),
      stage({ id: "products", resourceType: "products", status: "succeeded" }),
    ];
    expect(
      summarizeSyncRun({
        runId: "run-1",
        stages,
        productCount: 0,
        variantCount: 0,
        categoryCount: 0,
      }).canContinue,
    ).toBe(false);
    expect(
      summarizeSyncRun({
        runId: "run-1",
        stages,
        productCount: 1,
        variantCount: 1,
        categoryCount: 1,
      }).canContinue,
    ).toBe(true);
  });

  it("exposes retry only for retryable failed stages", () => {
    const result = summarizeSyncRun({
      runId: "run-1",
      stages: [
        stage({
          status: "failed",
          error: {
            code: "platform_rate_limited",
            message: "Rate limited",
            retryable: true,
            occurredAt: new Date("2026-07-13T10:00:00Z"),
          },
        }),
      ],
      productCount: 0,
      variantCount: 0,
      categoryCount: 0,
    });
    expect(result.canRetry).toBe(true);
  });

  it("derives stable resource-specific idempotency keys", () => {
    expect(catalogSyncJobKey(" install-123 ", "products")).toBe("install-123:products");
    expect(() => catalogSyncJobKey("  ", "store")).toThrow(/cannot be blank/);
  });

  it("selects a failure target only inside the exact tenant run boundary", () => {
    const boundary = { storeId: "store-1", connectionId: "connection-1", runId: "run-1" };
    const stages = [
      runStage("store", { status: "succeeded" }),
      runStage("categories"),
      runStage("products"),
    ];
    expect(selectSyncRunFailureTarget(stages, boundary)?.resourceType).toBe("categories");
    for (const mismatch of [
      { storeId: "other-store" },
      { connectionId: "other-connection" },
      { runId: "other-run" },
    ]) {
      expect(
        selectSyncRunFailureTarget(
          stages.map((item) =>
            item.resourceType === "products" ? { ...item, ...mismatch } : item,
          ),
          boundary,
        ),
      ).toBeUndefined();
    }
  });

  it("does not rewrite cancelled catalog runs", () => {
    const boundary = { storeId: "store-1", connectionId: "connection-1", runId: "run-1" };
    expect(
      selectSyncRunFailureTarget(
        [runStage("store"), runStage("categories", { status: "cancelled" }), runStage("products")],
        boundary,
      ),
    ).toBeUndefined();
  });
});
