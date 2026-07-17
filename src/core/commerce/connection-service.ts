import "server-only";

import { randomUUID } from "node:crypto";

import { SallaConnector } from "@/core/commerce/salla-connector";
import {
  compareAndSwapPlatformConnectionTokens,
  getPlatformConnection,
} from "@/db/repositories/platform-connection-repository";
import { getRedis } from "@/lib/redis";

const REFRESH_AHEAD_MS = 2 * 60 * 1000;
const REFRESH_LOCK_MS = 30 * 1000;

function usableUntil(expiresAt: Date | null) {
  return Boolean(expiresAt && expiresAt.getTime() > Date.now() + REFRESH_AHEAD_MS);
}

function wait(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function releaseLock(key: string, owner: string) {
  await getRedis().eval(
    "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end",
    1,
    key,
    owner,
  );
}

/**
 * Returns a usable Salla connection. Refresh-token rotation is serialized in
 * Redis because Salla refresh tokens are single-use and rotate on success.
 */
export async function getUsableSallaConnection(storeId: string) {
  let connection = await getPlatformConnection(storeId, "salla");
  if (!connection) throw new Error("The store does not have a connected Salla account.");
  if (usableUntil(connection.tokenExpiresAt)) return connection;
  if (!connection.context.refreshToken) {
    throw new Error("The Salla connection has expired and cannot be refreshed.");
  }

  const redis = getRedis();
  const lockKey = `locks:salla-token-refresh:${connection.id}`;
  const owner = randomUUID();
  let acquired = await redis.set(lockKey, owner, "PX", REFRESH_LOCK_MS, "NX");

  for (let attempt = 0; !acquired && attempt < 20; attempt += 1) {
    await wait(250);
    connection = await getPlatformConnection(storeId, "salla");
    if (!connection) throw new Error("The Salla connection was disconnected.");
    if (usableUntil(connection.tokenExpiresAt)) return connection;
    acquired = await redis.set(lockKey, owner, "PX", REFRESH_LOCK_MS, "NX");
  }
  if (!acquired) throw new Error("The Salla credential refresh is already in progress.");

  try {
    connection = await getPlatformConnection(storeId, "salla");
    if (!connection) throw new Error("The Salla connection was disconnected.");
    if (usableUntil(connection.tokenExpiresAt)) return connection;
    if (!connection.context.refreshToken) {
      throw new Error("The Salla connection has expired and cannot be refreshed.");
    }

    const tokens = await new SallaConnector().refreshToken(connection.context.refreshToken);
    const applied = await compareAndSwapPlatformConnectionTokens({
      connectionId: connection.id,
      storeId,
      platform: "salla",
      externalStoreId: connection.externalStoreId,
      expectedTokenVersion: connection.tokenVersion,
      tokens,
    });
    if (!applied) {
      const current = await getPlatformConnection(storeId, "salla");
      if (!current) throw new Error("The Salla connection was disconnected.");
      if (usableUntil(current.tokenExpiresAt)) return current;
      throw new Error("The Salla connection credentials changed during refresh.");
    }
    const refreshed = await getPlatformConnection(storeId, "salla");
    if (!refreshed) throw new Error("The refreshed Salla connection could not be loaded.");
    return refreshed;
  } finally {
    await releaseLock(lockKey, owner).catch(() => undefined);
  }
}
