import "server-only";

import { randomUUID } from "node:crypto";

import { and, asc, count, desc, eq, inArray, isNull, lt, or, sql } from "drizzle-orm";

import { getDb, type Database } from "@/db/client";
import {
  categories,
  outboxEvents,
  platformConnections,
  products,
  productVariants,
  syncCheckpoints,
  syncErrors,
  syncJobs,
  type JsonObject,
} from "@/db/schema";

export const catalogSyncResources = ["store", "categories", "products"] as const;

export type CatalogSyncResource = (typeof catalogSyncResources)[number];
export type SyncJobStatus = typeof syncJobs.$inferSelect.status;
export type SyncTransaction = Parameters<Parameters<Database["transaction"]>[0]>[0];

export interface SyncStageSnapshot {
  id: string;
  resourceType: string;
  status: SyncJobStatus;
  recordsTotal: number | null;
  recordsProcessed: number;
  recordsFailed: number;
  cursor: JsonObject | null;
  startedAt: Date | null;
  heartbeatAt: Date | null;
  completedAt: Date | null;
}

export interface SyncStageStatus extends SyncStageSnapshot {
  percent: number | null;
  error?: {
    code: string | null;
    message: string;
    retryable: boolean;
    occurredAt: Date;
  };
}

export interface SyncRunStatus {
  runId: string;
  overallStatus: SyncJobStatus;
  stages: SyncStageStatus[];
  summary: {
    products: number;
    variants: number;
    categories: number;
  };
  canRetry: boolean;
  canContinue: boolean;
  freshness: Date | null;
}

export interface CreateCatalogRunInput {
  storeId: string;
  connectionId: string;
  kind: typeof syncJobs.$inferInsert.kind;
  idempotencyKey: string;
  requestedByUserId?: string;
  runId?: string;
}

export interface CommitSyncPageInput {
  storeId: string;
  jobId: string;
  connectionId: string;
  connectionTokenVersion: number;
  resourceType: string;
  cursor: JsonObject;
  recordsProcessed: number;
  recordsFailed?: number;
  recordsTotal?: number;
  sourceVersion?: string;
  lastExternalUpdatedAt?: Date;
  heartbeatAt?: Date;
}

export interface RecordSyncFailureInput {
  storeId: string;
  jobId: string;
  resourceType: string;
  errorCode?: string;
  message: string;
  retryable: boolean;
  externalId?: string;
  details?: JsonObject;
  deadLetter?: boolean;
  occurredAt?: Date;
}

export interface RecordSyncRunFailureInput {
  storeId: string;
  connectionId: string;
  runId: string;
  errorCode?: string;
  message: string;
  retryable: boolean;
  details?: JsonObject;
  occurredAt?: Date;
}

export interface SyncRunFailureBoundary {
  storeId: string;
  connectionId: string;
  runId: string;
}

export type SyncRunFailureStage = Pick<
  typeof syncJobs.$inferSelect,
  "id" | "storeId" | "connectionId" | "runId" | "resourceType" | "status"
>;

const terminalStatuses: SyncJobStatus[] = ["succeeded", "failed", "cancelled", "dead_letter"];

/**
 * Selects the first incomplete stage only when the full catalog run belongs to
 * the exact store, connection, and run boundary supplied by the queue payload.
 * This pure guard is also used by the transactional failure path below.
 */
export function selectSyncRunFailureTarget<T extends SyncRunFailureStage>(
  stages: readonly T[],
  boundary: SyncRunFailureBoundary,
): T | undefined {
  if (stages.length !== catalogSyncResources.length) return undefined;

  const byResource = new Map<CatalogSyncResource, T>();
  for (const stage of stages) {
    if (
      stage.storeId !== boundary.storeId ||
      stage.connectionId !== boundary.connectionId ||
      stage.runId !== boundary.runId ||
      !catalogSyncResources.includes(stage.resourceType as CatalogSyncResource)
    ) {
      return undefined;
    }
    const resourceType = stage.resourceType as CatalogSyncResource;
    if (byResource.has(resourceType)) return undefined;
    byResource.set(resourceType, stage);
  }

  const ordered = catalogSyncResources.map((resourceType) => byResource.get(resourceType));
  if (ordered.some((stage) => !stage)) return undefined;
  if (ordered.some((stage) => stage?.status === "cancelled" || stage?.status === "dead_letter")) {
    return undefined;
  }
  return ordered.find((stage) => stage?.status !== "succeeded");
}

export function catalogSyncJobKey(baseKey: string, resourceType: CatalogSyncResource) {
  const normalized = baseKey.trim();
  if (!normalized) throw new Error("Catalog sync idempotency key cannot be blank.");
  return `${normalized}:${resourceType}`;
}

export function calculateSyncPercent(stage: Pick<
  SyncStageSnapshot,
  "recordsTotal" | "recordsProcessed" | "recordsFailed" | "status"
>): number | null {
  if (stage.recordsTotal === null) return null;
  if (stage.recordsTotal === 0) return stage.status === "succeeded" ? 100 : 0;
  const completed = stage.recordsProcessed + stage.recordsFailed;
  return Math.min(100, Math.max(0, Math.floor((completed / stage.recordsTotal) * 100)));
}

export function deriveOverallSyncStatus(stages: readonly Pick<SyncStageSnapshot, "status">[]): SyncJobStatus {
  if (stages.some((stage) => stage.status === "dead_letter")) return "dead_letter";
  if (stages.some((stage) => stage.status === "failed")) return "failed";
  if (stages.some((stage) => stage.status === "cancelled")) return "cancelled";
  if (stages.length > 0 && stages.every((stage) => stage.status === "succeeded")) {
    return "succeeded";
  }
  if (stages.some((stage) => stage.status === "running")) return "running";
  return "queued";
}

export function summarizeSyncRun(input: {
  runId: string;
  stages: SyncStageStatus[];
  productCount: number;
  variantCount: number;
  categoryCount: number;
  freshness?: Date | null;
}): SyncRunStatus {
  const overallStatus = deriveOverallSyncStatus(input.stages);
  const requiredSucceeded = catalogSyncResources.every((resource) =>
    input.stages.some((stage) => stage.resourceType === resource && stage.status === "succeeded"),
  );
  return {
    runId: input.runId,
    overallStatus,
    stages: input.stages,
    summary: {
      products: input.productCount,
      variants: input.variantCount,
      categories: input.categoryCount,
    },
    canRetry: input.stages.some(
      (stage) => stage.status === "failed" && stage.error?.retryable === true,
    ),
    canContinue: requiredSucceeded && input.productCount > 0,
    freshness: input.freshness ?? null,
  };
}

function resourceOrder(resourceType: string) {
  const index = catalogSyncResources.indexOf(resourceType as CatalogSyncResource);
  return index === -1 ? catalogSyncResources.length : index;
}

export function createSyncRepository(db: Database = getDb()) {
  async function listRunJobs(storeId: string, runId: string) {
    const rows = await db
      .select()
      .from(syncJobs)
      .where(and(eq(syncJobs.storeId, storeId), eq(syncJobs.runId, runId)))
      .orderBy(asc(syncJobs.createdAt));
    return rows.sort((left, right) => resourceOrder(left.resourceType) - resourceOrder(right.resourceType));
  }

  return {
    async createOrGetCatalogRun(input: CreateCatalogRunInput) {
      const proposedRunId = input.runId ?? randomUUID();
      const createdAt = new Date();

      return db.transaction(async (tx) => {
        const [connection] = await tx
          .select({ id: platformConnections.id })
          .from(platformConnections)
          .where(
            and(
              eq(platformConnections.id, input.connectionId),
              eq(platformConnections.storeId, input.storeId),
              eq(platformConnections.status, "connected"),
            ),
          )
          .for("update")
          .limit(1);
        if (!connection) {
          throw new Error("The platform connection is not active for sync scheduling.");
        }

        const controlKey = catalogSyncJobKey(input.idempotencyKey, "store");
        const [control] = await tx
          .insert(syncJobs)
          .values({
            runId: proposedRunId,
            storeId: input.storeId,
            connectionId: input.connectionId,
            kind: input.kind,
            resourceType: "store",
            idempotencyKey: controlKey,
            requestedByUserId: input.requestedByUserId,
            createdAt,
            updatedAt: createdAt,
          })
          .onConflictDoNothing()
          .returning({ runId: syncJobs.runId });

        if (!control) {
          const [existing] = await tx
            .select({ runId: syncJobs.runId })
            .from(syncJobs)
            .where(
              and(
                eq(syncJobs.storeId, input.storeId),
                eq(syncJobs.idempotencyKey, controlKey),
              ),
            )
            .limit(1);

          const [active] = existing
            ? [existing]
            : await tx
                .select({ runId: syncJobs.runId })
                .from(syncJobs)
                .where(
                  and(
                    eq(syncJobs.storeId, input.storeId),
                    eq(syncJobs.connectionId, input.connectionId),
                    inArray(syncJobs.status, ["queued", "running"]),
                  ),
                )
                .orderBy(desc(syncJobs.createdAt))
                .limit(1);

          if (!active) {
            throw new Error("Unable to create or locate the catalog sync run.");
          }

          const jobs = await tx
            .select()
            .from(syncJobs)
            .where(and(eq(syncJobs.storeId, input.storeId), eq(syncJobs.runId, active.runId)));
          return { runId: active.runId, jobs, created: false };
        }

        await tx.insert(syncJobs).values(
          catalogSyncResources.slice(1).map((resourceType) => ({
            runId: proposedRunId,
            storeId: input.storeId,
            connectionId: input.connectionId,
            kind: input.kind,
            resourceType,
            idempotencyKey: catalogSyncJobKey(input.idempotencyKey, resourceType),
            requestedByUserId: input.requestedByUserId,
            createdAt,
            updatedAt: createdAt,
          })),
        );

        await tx
          .insert(outboxEvents)
          .values({
            storeId: input.storeId,
            aggregateType: "sync_run",
            aggregateId: proposedRunId,
            eventType: "sync.catalog.requested",
            idempotencyKey: `sync.catalog.requested:${proposedRunId}`,
            payload: {
              runId: proposedRunId,
              storeId: input.storeId,
              connectionId: input.connectionId,
            },
            createdAt,
          })
          .onConflictDoNothing();

        const jobs = await tx
          .select()
          .from(syncJobs)
          .where(and(eq(syncJobs.storeId, input.storeId), eq(syncJobs.runId, proposedRunId)));
        return { runId: proposedRunId, jobs, created: true };
      });
    },

    listRunJobs,

    async isActiveConnectionBoundary(
      storeId: string,
      connectionId: string,
      tokenVersion: number,
    ) {
      const [connection] = await db
        .select({ id: platformConnections.id })
        .from(platformConnections)
        .where(
          and(
            eq(platformConnections.id, connectionId),
            eq(platformConnections.storeId, storeId),
            eq(platformConnections.status, "connected"),
            eq(platformConnections.tokenVersion, tokenVersion),
          ),
        )
        .limit(1);
      return Boolean(connection);
    },

    async claimJob(storeId: string, jobId: string, now = new Date()) {
      const [claimed] = await db
        .update(syncJobs)
        .set({
          status: "running",
          startedAt: sql`coalesce(${syncJobs.startedAt}, ${now})`,
          heartbeatAt: now,
          completedAt: null,
          updatedAt: now,
        })
        .where(
          and(
            eq(syncJobs.storeId, storeId),
            eq(syncJobs.id, jobId),
            eq(syncJobs.status, "queued"),
          ),
        )
        .returning();
      if (claimed) return claimed;

      // A running job may only be reclaimed after its heartbeat lease is stale.
      // The conditional update prevents two recovery workers from sharing it.
      const staleBefore = new Date(now.getTime() - 2 * 60 * 1000);
      const [reclaimed] = await db
        .update(syncJobs)
        .set({ heartbeatAt: now, updatedAt: now })
        .where(
          and(
            eq(syncJobs.storeId, storeId),
            eq(syncJobs.id, jobId),
            eq(syncJobs.status, "running"),
            or(isNull(syncJobs.heartbeatAt), lt(syncJobs.heartbeatAt, staleBefore)),
          ),
        )
        .returning();
      return reclaimed;
    },

    async heartbeat(storeId: string, jobId: string, now = new Date()) {
      const [job] = await db
        .update(syncJobs)
        .set({ heartbeatAt: now, updatedAt: now })
        .where(
          and(
            eq(syncJobs.storeId, storeId),
            eq(syncJobs.id, jobId),
            eq(syncJobs.status, "running"),
          ),
        )
        .returning();
      return job;
    },

    async commitPage<T>(
      input: CommitSyncPageInput,
      apply: (tx: SyncTransaction) => Promise<T>,
    ): Promise<T> {
      return db.transaction(async (tx) => {
        const [connection] = await tx
          .select({ id: platformConnections.id })
          .from(platformConnections)
          .where(
            and(
              eq(platformConnections.id, input.connectionId),
              eq(platformConnections.storeId, input.storeId),
              eq(platformConnections.status, "connected"),
              eq(platformConnections.tokenVersion, input.connectionTokenVersion),
            ),
          )
          .for("share")
          .limit(1);
        if (!connection) {
          throw new Error("The platform connection changed before the sync page commit.");
        }

        const [job] = await tx
          .select()
          .from(syncJobs)
          .where(
            and(
              eq(syncJobs.storeId, input.storeId),
              eq(syncJobs.id, input.jobId),
              eq(syncJobs.connectionId, input.connectionId),
              eq(syncJobs.resourceType, input.resourceType),
              eq(syncJobs.status, "running"),
            ),
          )
          .for("update")
          .limit(1);
        if (!job) throw new Error("The sync job is not running or is outside the store boundary.");

        const applied = await apply(tx);
        const recordsFailed = job.recordsFailed + (input.recordsFailed ?? 0);
        const recordsProcessed = job.recordsProcessed + input.recordsProcessed;
        const completedRecords = recordsProcessed + recordsFailed;
        const recordsTotal =
          input.recordsTotal === undefined
            ? job.recordsTotal
            : Math.max(input.recordsTotal, completedRecords);
        const now = input.heartbeatAt ?? new Date();

        await tx
          .insert(syncCheckpoints)
          .values({
            storeId: input.storeId,
            connectionId: input.connectionId,
            resourceType: input.resourceType,
            cursor: input.cursor,
            sourceVersion: input.sourceVersion,
            lastExternalUpdatedAt: input.lastExternalUpdatedAt,
            updatedAt: now,
          })
          .onConflictDoUpdate({
            target: [syncCheckpoints.connectionId, syncCheckpoints.resourceType],
            set: {
              cursor: input.cursor,
              sourceVersion: input.sourceVersion,
              lastExternalUpdatedAt: input.lastExternalUpdatedAt,
              updatedAt: now,
            },
          });

        await tx
          .update(syncJobs)
          .set({
            cursor: input.cursor,
            recordsTotal,
            recordsProcessed,
            recordsFailed,
            heartbeatAt: now,
            updatedAt: now,
          })
          .where(and(eq(syncJobs.storeId, input.storeId), eq(syncJobs.id, input.jobId)));

        return applied;
      });
    },

    async completeJob<T>(input: {
      storeId: string;
      jobId: string;
      connectionId: string;
      connectionTokenVersion: number;
      resourceType: string;
      completedAt?: Date;
      apply?: (tx: SyncTransaction) => Promise<T>;
    }): Promise<T | undefined> {
      return db.transaction(async (tx) => {
        const completedAt = input.completedAt ?? new Date();
        const [connection] = await tx
          .select({ id: platformConnections.id })
          .from(platformConnections)
          .where(
            and(
              eq(platformConnections.id, input.connectionId),
              eq(platformConnections.storeId, input.storeId),
              eq(platformConnections.status, "connected"),
              eq(platformConnections.tokenVersion, input.connectionTokenVersion),
            ),
          )
          .for("share")
          .limit(1);
        if (!connection) {
          throw new Error("The platform connection changed before sync completion.");
        }

        const [job] = await tx
          .select()
          .from(syncJobs)
          .where(
            and(
              eq(syncJobs.storeId, input.storeId),
              eq(syncJobs.id, input.jobId),
              eq(syncJobs.connectionId, input.connectionId),
              eq(syncJobs.resourceType, input.resourceType),
              eq(syncJobs.status, "running"),
            ),
          )
          .for("update")
          .limit(1);
        if (!job) throw new Error("The sync job cannot transition to succeeded from its current state.");
        if (job.recordsFailed > 0) {
          throw new Error("A sync job with failed records cannot be marked succeeded.");
        }

        const applied = input.apply ? await input.apply(tx) : undefined;
        await tx
          .update(syncJobs)
          .set({
            status: "succeeded",
            heartbeatAt: completedAt,
            completedAt,
            updatedAt: completedAt,
          })
          .where(and(eq(syncJobs.storeId, input.storeId), eq(syncJobs.id, input.jobId)));
        await tx
          .update(syncCheckpoints)
          .set({ lastSuccessfulSyncAt: completedAt, updatedAt: completedAt })
          .where(
            and(
              eq(syncCheckpoints.storeId, input.storeId),
              eq(syncCheckpoints.connectionId, input.connectionId),
              eq(syncCheckpoints.resourceType, input.resourceType),
            ),
          );
        return applied;
      });
    },

    async recordFailure(input: RecordSyncFailureInput) {
      return db.transaction(async (tx) => {
        const occurredAt = input.occurredAt ?? new Date();
        const status: SyncJobStatus = input.deadLetter ? "dead_letter" : "failed";
        await tx.insert(syncErrors).values({
          storeId: input.storeId,
          syncJobId: input.jobId,
          resourceType: input.resourceType,
          externalId: input.externalId,
          errorCode: input.errorCode,
          message: input.message,
          retryable: input.retryable,
          details: input.details ?? {},
          occurredAt,
          createdAt: occurredAt,
        });
        const [job] = await tx
          .update(syncJobs)
          .set({
            status,
            completedAt: occurredAt,
            heartbeatAt: occurredAt,
            updatedAt: occurredAt,
          })
          .where(
            and(
              eq(syncJobs.storeId, input.storeId),
              eq(syncJobs.id, input.jobId),
              inArray(syncJobs.status, ["queued", "running"]),
            ),
          )
          .returning();
        return job;
      });
    },

    /**
     * Persists a failure that happened before a resource job could be claimed
     * (connection load/refresh and merchant verification). The full run is
     * locked and boundary-checked before its first incomplete stage changes.
     */
    async recordRunFailure(input: RecordSyncRunFailureInput) {
      return db.transaction(async (tx) => {
        const occurredAt = input.occurredAt ?? new Date();
        const stages = await tx
          .select()
          .from(syncJobs)
          .where(and(eq(syncJobs.storeId, input.storeId), eq(syncJobs.runId, input.runId)))
          .orderBy(asc(syncJobs.createdAt))
          .for("update");
        const target = selectSyncRunFailureTarget(stages, input);
        if (!target) return undefined;

        let failedJob = target;
        if (target.status !== "failed") {
          const [transitioned] = await tx
            .update(syncJobs)
            .set({
              status: "failed",
              completedAt: occurredAt,
              heartbeatAt: occurredAt,
              updatedAt: occurredAt,
            })
            .where(
              and(
                eq(syncJobs.id, target.id),
                eq(syncJobs.storeId, input.storeId),
                eq(syncJobs.connectionId, input.connectionId),
                eq(syncJobs.runId, input.runId),
                eq(syncJobs.resourceType, target.resourceType),
                inArray(syncJobs.status, ["queued", "running"]),
              ),
            )
            .returning();
          if (!transitioned) return undefined;
          failedJob = transitioned;
        }

        // A newer preflight failure supersedes a previous unresolved stage
        // error so retry eligibility always reflects the current root cause.
        await tx
          .update(syncErrors)
          .set({ resolvedAt: occurredAt })
          .where(
            and(
              eq(syncErrors.storeId, input.storeId),
              eq(syncErrors.syncJobId, target.id),
              isNull(syncErrors.resolvedAt),
            ),
          );
        await tx.insert(syncErrors).values({
          storeId: input.storeId,
          syncJobId: target.id,
          resourceType: target.resourceType,
          errorCode: input.errorCode,
          message: input.message,
          retryable: input.retryable,
          details: input.details ?? {},
          occurredAt,
          createdAt: occurredAt,
        });
        return failedJob;
      });
    },

    async requeueFailedJob(storeId: string, jobId: string, now = new Date()) {
      return db.transaction(async (tx) => {
        const [latestError] = await tx
          .select()
          .from(syncErrors)
          .where(
            and(
              eq(syncErrors.storeId, storeId),
              eq(syncErrors.syncJobId, jobId),
              isNull(syncErrors.resolvedAt),
            ),
          )
          .orderBy(desc(syncErrors.occurredAt))
          .limit(1);
        if (!latestError?.retryable) return undefined;

        const [job] = await tx
          .update(syncJobs)
          .set({ status: "queued", completedAt: null, heartbeatAt: null, updatedAt: now })
          .where(
            and(
              eq(syncJobs.storeId, storeId),
              eq(syncJobs.id, jobId),
              eq(syncJobs.status, "failed"),
            ),
          )
          .returning();
        if (!job) return undefined;

        await tx
          .update(syncErrors)
          .set({ resolvedAt: now })
          .where(
            and(
              eq(syncErrors.storeId, storeId),
              eq(syncErrors.syncJobId, jobId),
              isNull(syncErrors.resolvedAt),
            ),
          );
        return job;
      });
    },

    async getRunStatus(storeId: string, runId: string): Promise<SyncRunStatus | undefined> {
      const jobs = await listRunJobs(storeId, runId);
      if (jobs.length === 0) return undefined;
      const jobIds = jobs.map((job) => job.id);
      const [errors, [productCount], [variantCount], [categoryCount], checkpoints] =
        await Promise.all([
          db
            .select()
            .from(syncErrors)
            .where(
              and(
                eq(syncErrors.storeId, storeId),
                inArray(syncErrors.syncJobId, jobIds),
                isNull(syncErrors.resolvedAt),
              ),
            )
            .orderBy(desc(syncErrors.occurredAt)),
          db
            .select({ value: count() })
            .from(products)
            .where(and(eq(products.storeId, storeId), isNull(products.sourceDeletedAt))),
          db
            .select({ value: count() })
            .from(productVariants)
            .where(and(eq(productVariants.storeId, storeId), isNull(productVariants.sourceDeletedAt))),
          db
            .select({ value: count() })
            .from(categories)
            .where(and(eq(categories.storeId, storeId), isNull(categories.sourceDeletedAt))),
          db
            .select({ lastSuccessfulSyncAt: syncCheckpoints.lastSuccessfulSyncAt })
            .from(syncCheckpoints)
            .where(
              and(
                eq(syncCheckpoints.storeId, storeId),
                eq(syncCheckpoints.connectionId, jobs[0].connectionId),
                inArray(syncCheckpoints.resourceType, [...catalogSyncResources]),
              ),
            ),
        ]);

      const stages: SyncStageStatus[] = jobs.map((job) => {
        const latestError = errors.find((error) => error.syncJobId === job.id);
        const snapshot: SyncStageSnapshot = {
          id: job.id,
          resourceType: job.resourceType,
          status: job.status,
          recordsTotal: job.recordsTotal,
          recordsProcessed: job.recordsProcessed,
          recordsFailed: job.recordsFailed,
          cursor: job.cursor,
          startedAt: job.startedAt,
          heartbeatAt: job.heartbeatAt,
          completedAt: job.completedAt,
        };
        return {
          ...snapshot,
          percent: calculateSyncPercent(snapshot),
          error: latestError
            ? {
                code: latestError.errorCode,
                message: latestError.message,
                retryable: latestError.retryable,
                occurredAt: latestError.occurredAt,
              }
            : undefined,
        };
      });
      const successfulCheckpointTimes = checkpoints.flatMap((checkpoint) =>
        checkpoint.lastSuccessfulSyncAt ? [checkpoint.lastSuccessfulSyncAt] : [],
      );
      const freshness =
        successfulCheckpointTimes.length === catalogSyncResources.length
          ? successfulCheckpointTimes.reduce((oldest, timestamp) =>
              timestamp < oldest ? timestamp : oldest,
            )
          : null;

      return summarizeSyncRun({
        runId,
        stages,
        productCount: productCount?.value ?? 0,
        variantCount: variantCount?.value ?? 0,
        categoryCount: categoryCount?.value ?? 0,
        freshness,
      });
    },

    async getLatestRunStatus(storeId: string): Promise<SyncRunStatus | undefined> {
      const [latest] = await db
        .select({ runId: syncJobs.runId })
        .from(syncJobs)
        .where(eq(syncJobs.storeId, storeId))
        .orderBy(desc(syncJobs.createdAt))
        .limit(1);
      return latest ? this.getRunStatus(storeId, latest.runId) : undefined;
    },

    isTerminal(status: SyncJobStatus) {
      return terminalStatuses.includes(status);
    },
  };
}

export type SyncRepository = ReturnType<typeof createSyncRepository>;
