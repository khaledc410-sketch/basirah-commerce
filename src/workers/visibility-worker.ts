import { UnrecoverableError, Worker } from "bullmq";

import { getServerEnv } from "@/config/env";
import { catalogRedisOptions } from "@/core/jobs/catalog-queue";
import {
  visibilityJobName,
  visibilityQueueName,
  visibilityScanJobDataSchema,
  visibilityScanTokenSchema,
  visibilityWorkerHeartbeatKey,
  delayVisibilityJobUntilLeaseAvailable,
} from "@/core/jobs/visibility-queue";
import { decryptSecret } from "@/core/security/token-vault";
import { closeDb } from "@/db/client";
import { logEvent } from "@/lib/logger";
import { closeRedis, getRedis } from "@/lib/redis";
import { purgeExpiredAnonymousScans } from "@/modules/acquisition";
import {
  isRetryableScannerErrorCode,
  runScan,
  ScannerError,
} from "@/modules/visibility/scanner";

const worker = new Worker(
  visibilityQueueName,
  async (job, workerToken) => {
    if (job.name !== visibilityJobName) {
      throw new UnrecoverableError("Unknown visibility-scan job.");
    }
    const { encryptedToken } = visibilityScanJobDataSchema.parse(job.data);
    const keyMaterial = getServerEnv().TOKEN_ENCRYPTION_KEY;
    if (!keyMaterial) {
      throw new UnrecoverableError("Visibility worker encryption is not configured.");
    }
    const token = visibilityScanTokenSchema.parse(
      decryptSecret(encryptedToken, keyMaterial),
    );
    const maxAttempts = job.opts.attempts ?? 1;
    const finalAttempt = job.attemptsMade + 1 >= maxAttempts;
    let result;
    try {
      result = await runScan(token, { rethrowRetryable: !finalAttempt });
    } catch (error) {
      if (error instanceof ScannerError && error.code === "SCAN_LEASE_BUSY") {
        await delayVisibilityJobUntilLeaseAvailable(
          job,
          workerToken,
          error.retryAt?.getTime() ?? Date.now() + 1_000,
        );
      }
      throw error;
    }
    if (
      result?.status === "failed" &&
      result.error &&
      isRetryableScannerErrorCode(result.error.code)
    ) {
      throw new Error("Retryable visibility scan exhausted all attempts.");
    }
    return result;
  },
  {
    connection: catalogRedisOptions(null),
    concurrency: 2,
    lockDuration: 180_000,
    stalledInterval: 30_000,
    maxStalledCount: 1,
  },
);

worker.on("completed", (job) => {
  logEvent("info", "visibility_scan_job_completed", {
    jobId: job.id,
    attemptsMade: job.attemptsMade,
  });
});
worker.on("failed", (job, error) => {
  logEvent("error", "visibility_scan_job_failed", {
    jobId: job?.id,
    attemptsMade: job?.attemptsMade,
    errorName: error.name,
  });
});
worker.on("stalled", (jobId) => {
  logEvent("warn", "visibility_scan_job_stalled", { jobId });
});
worker.on("error", (error) => {
  logEvent("error", "visibility_scan_worker_error", { errorName: error.name });
});

let purging = false;
async function purgeExpiredData() {
  if (purging) return;
  purging = true;
  let deleted = 0;
  try {
    for (let batch = 0; batch < 10; batch += 1) {
      const batchDeleted = await purgeExpiredAnonymousScans(500);
      deleted += batchDeleted;
      if (batchDeleted < 500) break;
    }
    logEvent("info", "visibility_scan_retention_completed", { deleted });
  } catch (error) {
    logEvent("error", "visibility_scan_retention_failed", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
  } finally {
    purging = false;
  }
}

void purgeExpiredData();
const retentionTimer = setInterval(() => void purgeExpiredData(), 24 * 60 * 60 * 1_000);
retentionTimer.unref();

async function recordHeartbeat() {
  await getRedis().set(
    visibilityWorkerHeartbeatKey,
    new Date().toISOString(),
    "EX",
    30,
  );
}
await recordHeartbeat().catch(() => {
  logEvent("warn", "visibility_worker_heartbeat_failed");
});
const heartbeatTimer = setInterval(() => {
  void recordHeartbeat().catch(() => {
    logEvent("warn", "visibility_worker_heartbeat_failed");
  });
}, 10_000);
heartbeatTimer.unref();

async function shutdown(signal: string) {
  logEvent("info", "visibility_scan_worker_stopping", { signal });
  clearInterval(retentionTimer);
  clearInterval(heartbeatTimer);
  await worker.close();
  await getRedis().del(visibilityWorkerHeartbeatKey).catch(() => undefined);
  await closeRedis();
  await closeDb();
  process.exit(0);
}

process.once("SIGTERM", () => void shutdown("SIGTERM"));
process.once("SIGINT", () => void shutdown("SIGINT"));

logEvent("info", "visibility_scan_worker_ready", {
  queue: visibilityQueueName,
  concurrency: 2,
});
