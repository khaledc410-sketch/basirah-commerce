import { UnrecoverableError, Worker } from "bullmq";

import { getUsableSallaConnection } from "@/core/commerce/connection-service";
import {
  catalogJobName,
  catalogQueueName,
  catalogSyncJobDataSchema,
  catalogRedisOptions,
  dispatchCatalogSyncOutbox,
} from "@/core/jobs/catalog-queue";
import {
  CatalogSyncExecutionError,
  createCatalogSyncService,
} from "@/core/sync/catalog-service";
import { SallaCatalogSyncSource } from "@/core/sync/salla-source";
import { closeDb } from "@/db/client";
import { logEvent } from "@/lib/logger";
import { closeRedis, getRedis } from "@/lib/redis";

const service = createCatalogSyncService();
const workerHeartbeatKey = "basirah:worker:catalog:heartbeat";

const worker = new Worker(
  catalogQueueName,
  async (job) => {
    if (job.name !== catalogJobName) throw new UnrecoverableError("Unknown catalog job.");
    const data = catalogSyncJobDataSchema.parse(job.data);
    const maxAttempts = job.opts.attempts ?? 1;
    const finalAttempt = job.attemptsMade + 1 >= maxAttempts;
    let source: SallaCatalogSyncSource;
    let connectionTokenVersion: number;
    try {
      const platformConnection = await getUsableSallaConnection(data.storeId);
      if (platformConnection.id !== data.connectionId) {
        throw new Error("The catalog job connection is no longer active.");
      }
      source = new SallaCatalogSyncSource(
        platformConnection.context,
        platformConnection.externalStoreId,
      );
      connectionTokenVersion = platformConnection.tokenVersion;
      await source.verifyMerchant();
    } catch (error) {
      const result = await service.handlePreflightFailure({
        ...data,
        error,
        finalAttempt,
      });
      if (!result.failure.retryable) {
        throw new UnrecoverableError(result.failure.message);
      }
      throw error;
    }

    try {
      return await service.processRun({
        ...data,
        connectionTokenVersion,
        source,
        perPage: 60,
      });
    } catch (error) {
      if (error instanceof CatalogSyncExecutionError && !error.failure.retryable) {
        throw new UnrecoverableError(error.failure.message);
      }
      throw error;
    }
  },
  {
    connection: catalogRedisOptions(null),
    concurrency: 1,
    lockDuration: 60_000,
  },
);

worker.on("completed", (job) => {
  logEvent("info", "catalog_sync_completed", { jobId: job.id });
});
worker.on("failed", (job, error) => {
  logEvent("error", "catalog_sync_failed", {
    jobId: job?.id,
    errorName: error.name,
  });
});
worker.on("error", (error) => {
  logEvent("error", "catalog_worker_error", { errorName: error.name });
});

await dispatchCatalogSyncOutbox().catch(() => {
  logEvent("warn", "catalog_outbox_recovery_failed");
});
async function recordHeartbeat() {
  await getRedis().set(workerHeartbeatKey, new Date().toISOString(), "EX", 30);
}
await recordHeartbeat().catch(() => logEvent("warn", "catalog_worker_heartbeat_failed"));
const heartbeatTimer = setInterval(() => {
  void recordHeartbeat().catch(() => logEvent("warn", "catalog_worker_heartbeat_failed"));
}, 10_000);
heartbeatTimer.unref();
let dispatching = false;
const outboxTimer = setInterval(() => {
  if (dispatching) return;
  dispatching = true;
  void dispatchCatalogSyncOutbox()
    .catch(() => logEvent("warn", "catalog_outbox_recovery_failed"))
    .finally(() => {
      dispatching = false;
    });
}, 10_000);
outboxTimer.unref();

async function shutdown(signal: string) {
  logEvent("info", "catalog_worker_stopping", { signal });
  clearInterval(heartbeatTimer);
  clearInterval(outboxTimer);
  await worker.close();
  await closeRedis();
  await closeDb();
  process.exit(0);
}

process.once("SIGTERM", () => void shutdown("SIGTERM"));
process.once("SIGINT", () => void shutdown("SIGINT"));

logEvent("info", "catalog_worker_ready", { queue: catalogQueueName });
