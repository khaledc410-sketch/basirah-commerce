import "server-only";

import { and, asc, eq, inArray, lte, sql } from "drizzle-orm";
import { Queue, type ConnectionOptions } from "bullmq";
import { z } from "zod";

import { getServerEnv } from "@/config/env";
import { getDb } from "@/db/client";
import { outboxEvents } from "@/db/schema";

export const catalogQueueName = "basirah-catalog-sync";
export const catalogJobName = "catalog-sync";

export const catalogSyncJobDataSchema = z.object({
  storeId: z.string().uuid(),
  connectionId: z.string().uuid(),
  runId: z.string().uuid(),
});

export type CatalogSyncJobData = z.infer<typeof catalogSyncJobDataSchema>;

let queue: Queue<CatalogSyncJobData, unknown, typeof catalogJobName> | undefined;

function redisUrl() {
  const url = getServerEnv().REDIS_URL;
  if (!url) throw new Error("REDIS_URL is required for catalog jobs.");
  return url;
}

export function catalogRedisOptions(maxRetriesPerRequest: number | null): ConnectionOptions {
  const parsed = new URL(redisUrl());
  const database = parsed.pathname.replace(/^\//, "");
  return {
    host: parsed.hostname,
    port: parsed.port ? Number(parsed.port) : 6379,
    username: parsed.username ? decodeURIComponent(parsed.username) : undefined,
    password: parsed.password ? decodeURIComponent(parsed.password) : undefined,
    db: database ? Number(database) : 0,
    ...(parsed.protocol === "rediss:" ? { tls: {} } : {}),
    maxRetriesPerRequest,
    enableReadyCheck: true,
    connectTimeout: 5_000,
    commandTimeout: 5_000,
  };
}

export function getCatalogQueue() {
  if (queue) return queue;
  queue = new Queue<CatalogSyncJobData, unknown, typeof catalogJobName>(catalogQueueName, {
    connection: catalogRedisOptions(1),
    defaultJobOptions: {
      attempts: 5,
      backoff: { type: "exponential", delay: 10_000 },
      removeOnComplete: { age: 24 * 60 * 60, count: 1_000 },
      removeOnFail: { age: 7 * 24 * 60 * 60, count: 5_000 },
    },
  });
  return queue;
}

export async function enqueueCatalogRun(data: CatalogSyncJobData) {
  const parsed = catalogSyncJobDataSchema.parse(data);
  return getCatalogQueue().add(catalogJobName, parsed, { jobId: parsed.runId });
}

/**
 * Dispatches transactionally-created sync outbox events. BullMQ's runId job ID
 * makes concurrent or recovery dispatches idempotent.
 */
export async function dispatchCatalogSyncOutbox(limit = 50) {
  const db = getDb();
  const now = new Date();
  const events = await db
    .select()
    .from(outboxEvents)
    .where(
      and(
        eq(outboxEvents.eventType, "sync.catalog.requested"),
        inArray(outboxEvents.status, ["pending", "failed"]),
        lte(outboxEvents.availableAt, now),
      ),
    )
    .orderBy(asc(outboxEvents.createdAt))
    .limit(Math.max(1, Math.min(limit, 100)));

  let delivered = 0;
  for (const event of events) {
    try {
      const data = catalogSyncJobDataSchema.parse(event.payload);
      await enqueueCatalogRun(data);
      await db
        .update(outboxEvents)
        .set({
          status: "delivered",
          deliveredAt: new Date(),
          lockedAt: null,
          lastError: null,
        })
        .where(eq(outboxEvents.id, event.id));
      delivered += 1;
    } catch {
      await db
        .update(outboxEvents)
        .set({
          status: "failed",
          attemptCount: sql`${outboxEvents.attemptCount} + 1`,
          availableAt: new Date(Date.now() + 30_000),
          lockedAt: null,
          lastError: "Catalog queue dispatch failed.",
        })
        .where(eq(outboxEvents.id, event.id));
    }
  }
  return { scanned: events.length, delivered };
}

export async function closeCatalogQueue() {
  await queue?.close();
  queue = undefined;
}
