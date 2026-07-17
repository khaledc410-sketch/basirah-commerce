import "server-only";

import Redis from "ioredis";

import { getServerEnv } from "@/config/env";

let redis: Redis | undefined;

export function getRedis() {
  if (redis) return redis;
  const url = getServerEnv().REDIS_URL;
  if (!url) throw new Error("REDIS_URL is required for production operations.");

  redis = new Redis(url, {
    lazyConnect: true,
    connectTimeout: 3_000,
    commandTimeout: 3_000,
    maxRetriesPerRequest: 1,
    enableReadyCheck: true,
  });
  redis.on("error", () => {
    // Callers surface a safe operational error; never log URLs or credentials.
  });
  return redis;
}

export async function closeRedis() {
  if (!redis) return;
  await redis.quit().catch(() => redis?.disconnect());
  redis = undefined;
}
