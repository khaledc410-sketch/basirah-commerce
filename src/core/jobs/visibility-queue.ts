import "server-only";

import { createHmac } from "node:crypto";

import { DelayedError, Queue } from "bullmq";
import { z } from "zod";

import { getServerEnv } from "@/config/env";
import { catalogRedisOptions } from "@/core/jobs/catalog-queue";
import { encryptSecret } from "@/core/security/token-vault";

export const visibilityQueueName = "basirah-visibility-scan";
export const visibilityJobName = "visibility-scan";
export const visibilityWorkerHeartbeatKey = "basirah:worker:visibility:heartbeat";

export const visibilityScanTokenSchema = z
  .string()
  .regex(/^[A-Za-z0-9_-]{24,128}$/u);

export const visibilityScanJobDataSchema = z
  .object({
    encryptedToken: z
      .object({
        version: z.literal(1),
        algorithm: z.literal("aes-256-gcm"),
        ciphertext: z.string().min(16).max(512),
        iv: z.string().min(12).max(64),
        authTag: z.string().min(12).max(64),
      })
      .strict(),
  })
  .strict();

export type VisibilityScanJobData = z.infer<typeof visibilityScanJobDataSchema>;

interface DelayableVisibilityJob {
  moveToDelayed(timestamp: number, token?: string): Promise<void>;
}

/**
 * Keep a stalled BullMQ redelivery alive without consuming a retry while the
 * durable scanner lease is still owned by the prior attempt.
 */
export async function delayVisibilityJobUntilLeaseAvailable(
  job: DelayableVisibilityJob,
  workerToken: string | undefined,
  retryAtMs: number,
  nowMs = Date.now(),
): Promise<never> {
  const validRetryAtMs = Number.isFinite(retryAtMs) ? retryAtMs : nowMs;
  const delayedUntil = Math.max(nowMs + 1_000, validRetryAtMs + 250);
  await job.moveToDelayed(delayedUntil, workerToken);
  // BullMQ requires this sentinel after a manual active -> delayed move. It
  // prevents the processor from subsequently moving the job to failed.
  throw new DelayedError();
}

let queue: Queue<VisibilityScanJobData, unknown, typeof visibilityJobName> | undefined;

export function getVisibilityQueue() {
  if (queue) return queue;
  queue = new Queue<VisibilityScanJobData, unknown, typeof visibilityJobName>(
    visibilityQueueName,
    {
      connection: catalogRedisOptions(1),
      defaultJobOptions: {
        attempts: 4,
        backoff: { type: "exponential", delay: 5_000 },
        removeOnComplete: { age: 24 * 60 * 60, count: 2_000 },
        // Retained failed jobs are the operator-visible dead-letter queue.
        removeOnFail: { age: 7 * 24 * 60 * 60, count: 10_000 },
      },
    },
  );
  return queue;
}

export async function enqueueVisibilityScan(token: string) {
  const parsedToken = visibilityScanTokenSchema.parse(token);
  const keyMaterial = getServerEnv().TOKEN_ENCRYPTION_KEY;
  if (!keyMaterial) throw new Error("TOKEN_ENCRYPTION_KEY is required for visibility jobs.");
  const data = visibilityScanJobDataSchema.parse({
    encryptedToken: encryptSecret(parsedToken, keyMaterial),
  });
  const jobId = `scan-${createHmac("sha256", keyMaterial)
    .update(parsedToken)
    .digest("base64url")}`;
  return getVisibilityQueue().add(visibilityJobName, data, {
    jobId,
  });
}

export async function closeVisibilityQueue() {
  await queue?.close();
  queue = undefined;
}
