import "server-only";

import { createHash, randomBytes } from "node:crypto";

import { and, eq, gt, inArray, isNull, lt, lte, or, sql } from "drizzle-orm";
import { z } from "zod";

import { getServerEnv } from "@/config/env";
import type { TokenResult } from "@/core/commerce/connector";
import type { CommercePlatform } from "@/core/commerce/types";
import { hashOAuthState } from "@/core/security/oauth-state";
import {
  decryptSecret,
  encryptSecret,
  type EncryptedSecret,
} from "@/core/security/token-vault";
import { getDb, type Database } from "@/db/client";
import {
  oauthStates,
  pendingPlatformAuthorizations,
  platformBindingClaims,
  platformConnections,
  stores,
  syncErrors,
  syncJobs,
} from "@/db/schema";

type LivePlatform = Exclude<CommercePlatform, "mock-salla">;
type EventAwareTokenResult = TokenResult & { providerEventCreatedAt?: string };
type PlatformTransaction = Parameters<Parameters<Database["transaction"]>[0]>[0];

export type CredentialFreshness = "applied" | "current" | "stale";

const bindingClaimSecretSchema = z
  .string()
  .min(32)
  .max(128)
  .regex(/^[A-Za-z0-9_-]+$/u);
const maxBindingClaimTtlSeconds = 10 * 60;

const encryptedSecretSchema = z.object({
  version: z.literal(1),
  algorithm: z.literal("aes-256-gcm"),
  ciphertext: z.string().min(1),
  iv: z.string().min(1),
  authTag: z.string().min(1),
});

export async function createOAuthState(input: {
  organizationId: string;
  storeId: string;
  userId: string;
  platform: LivePlatform;
  state: string;
  redirectUri: string;
}) {
  await getDb().insert(oauthStates).values({
    organizationId: input.organizationId,
    storeId: input.storeId,
    initiatedByUserId: input.userId,
    platform: input.platform,
    stateHash: hashOAuthState(input.state),
    redirectUri: input.redirectUri,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  });
}

export async function consumeOAuthState(input: {
  state: string;
  userId: string;
  platform: LivePlatform;
}) {
  return getDb().transaction(async (tx) => {
    const [record] = await tx
      .select()
      .from(oauthStates)
      .where(
        and(
          eq(oauthStates.stateHash, hashOAuthState(input.state)),
          eq(oauthStates.initiatedByUserId, input.userId),
          eq(oauthStates.platform, input.platform),
          isNull(oauthStates.consumedAt),
          gt(oauthStates.expiresAt, new Date()),
        ),
      )
      .for("update")
      .limit(1);
    if (!record?.storeId) return null;

    await tx
      .update(oauthStates)
      .set({ consumedAt: new Date() })
      .where(eq(oauthStates.id, record.id));
    return record;
  });
}

export async function getOAuthState(input: {
  state: string;
  userId: string;
  platform: LivePlatform;
}) {
  const [record] = await getDb()
    .select()
    .from(oauthStates)
    .where(
      and(
        eq(oauthStates.stateHash, hashOAuthState(input.state)),
        eq(oauthStates.initiatedByUserId, input.userId),
        eq(oauthStates.platform, input.platform),
        isNull(oauthStates.consumedAt),
        gt(oauthStates.expiresAt, new Date()),
      ),
    )
    .limit(1);
  return record?.storeId ? record : null;
}

export async function upsertPlatformConnection(input: {
  storeId: string;
  platform: LivePlatform;
  externalStoreId: string;
  tokens: EventAwareTokenResult;
}) {
  const key = encryptionKey();
  const authorizationEventCreatedAt = input.tokens.providerEventCreatedAt
    ? parseProviderEventCreatedAt(input.tokens.providerEventCreatedAt)
    : null;
  const credentialValues = encryptedConnectionValues(input, key);
  const values = {
    storeId: input.storeId,
    platform: input.platform,
    ...credentialValues,
    authorizationEventCreatedAt,
    ...(authorizationEventCreatedAt ? { updatedAt: authorizationEventCreatedAt } : {}),
  };

  const [connection] = await getDb()
    .insert(platformConnections)
    .values(values)
    .onConflictDoUpdate({
      target: [platformConnections.storeId, platformConnections.platform],
      set: {
        ...credentialValues,
        ...(authorizationEventCreatedAt
          ? {
              authorizationEventCreatedAt,
              // Provider-auth ordering is tracked separately from local
              // refresh wall-clock time.
              updatedAt: authorizationEventCreatedAt,
            }
          : {}),
        tokenVersion: sql`${platformConnections.tokenVersion} + 1`,
      },
      setWhere: authorizationEventCreatedAt
        ? and(
            or(
              isNull(platformConnections.authorizationEventCreatedAt),
              lt(platformConnections.authorizationEventCreatedAt, authorizationEventCreatedAt),
            ),
            or(
              isNull(platformConnections.disconnectedAt),
              lt(platformConnections.disconnectedAt, authorizationEventCreatedAt),
            ),
          )
        : undefined,
    })
    .returning({ id: platformConnections.id });

  if (connection) return connection.id;

  const [current] = await getDb()
    .select({ id: platformConnections.id })
    .from(platformConnections)
    .where(
      and(
        eq(platformConnections.storeId, input.storeId),
        eq(platformConnections.platform, input.platform),
        eq(platformConnections.externalStoreId, input.externalStoreId),
      ),
    )
    .limit(1);
  if (!current) throw new Error("The platform connection could not be persisted.");
  return current.id;
}

/**
 * Persists a remote refresh only if the exact connected credential generation
 * that initiated the network call is still current. Uninstall and concurrent
 * authorization rotation therefore win instead of being resurrected.
 */
export async function compareAndSwapPlatformConnectionTokens(input: {
  connectionId: string;
  storeId: string;
  platform: LivePlatform;
  externalStoreId: string;
  expectedTokenVersion: number;
  tokens: TokenResult;
}) {
  const values = encryptedConnectionValues(input, encryptionKey());
  const [updated] = await getDb()
    .update(platformConnections)
    .set({
      ...values,
      tokenVersion: sql`${platformConnections.tokenVersion} + 1`,
    })
    .where(
      and(
        eq(platformConnections.id, input.connectionId),
        eq(platformConnections.storeId, input.storeId),
        eq(platformConnections.platform, input.platform),
        eq(platformConnections.externalStoreId, input.externalStoreId),
        eq(platformConnections.status, "connected"),
        eq(platformConnections.tokenVersion, input.expectedTokenVersion),
      ),
    )
    .returning({
      id: platformConnections.id,
      tokenVersion: platformConnections.tokenVersion,
    });
  return updated ?? null;
}

export async function rotatePlatformConnectionAuthorization(input: {
  connectionId: string;
  storeId: string;
  platform: LivePlatform;
  externalStoreId: string;
  eventCreatedAt: string;
  tokens: TokenResult;
}): Promise<{ connectionId: string; freshness: CredentialFreshness }> {
  const eventCreatedAt = parseProviderEventCreatedAt(input.eventCreatedAt);
  const values = encryptedConnectionValues(input, encryptionKey());
  const [updated] = await getDb()
    .update(platformConnections)
    .set({
      ...values,
      authorizationEventCreatedAt: eventCreatedAt,
      updatedAt: eventCreatedAt,
      tokenVersion: sql`${platformConnections.tokenVersion} + 1`,
    })
    .where(
      and(
        eq(platformConnections.id, input.connectionId),
        eq(platformConnections.storeId, input.storeId),
        eq(platformConnections.platform, input.platform),
        eq(platformConnections.externalStoreId, input.externalStoreId),
        or(
          isNull(platformConnections.authorizationEventCreatedAt),
          lt(platformConnections.authorizationEventCreatedAt, eventCreatedAt),
        ),
        or(
          isNull(platformConnections.disconnectedAt),
          lt(platformConnections.disconnectedAt, eventCreatedAt),
        ),
      ),
    )
    .returning({ id: platformConnections.id });

  if (updated) return { connectionId: updated.id, freshness: "applied" };

  const [current] = await getDb()
    .select({
      status: platformConnections.status,
      eventCreatedAt: platformConnections.authorizationEventCreatedAt,
      disconnectedAt: platformConnections.disconnectedAt,
    })
    .from(platformConnections)
    .where(
      and(
        eq(platformConnections.id, input.connectionId),
        eq(platformConnections.storeId, input.storeId),
        eq(platformConnections.platform, input.platform),
        eq(platformConnections.externalStoreId, input.externalStoreId),
      ),
    )
    .limit(1);
  if (!current) throw new Error("The platform connection no longer exists.");

  return {
    connectionId: input.connectionId,
    freshness:
      current.status === "connected" &&
      current.eventCreatedAt?.getTime() === eventCreatedAt.getTime() &&
      (!current.disconnectedAt || current.disconnectedAt < eventCreatedAt)
        ? "current"
        : "stale",
  };
}

export async function getPlatformConnection(storeId: string, platform: LivePlatform) {
  const [record] = await getDb()
    .select()
    .from(platformConnections)
    .where(
      and(
        eq(platformConnections.storeId, storeId),
        eq(platformConnections.platform, platform),
        eq(platformConnections.status, "connected"),
      ),
    )
    .limit(1);
  if (!record) return null;

  const key = encryptionKey();
  return {
    id: record.id,
    storeId: record.storeId,
    platform: record.platform,
    externalStoreId: record.externalStoreId,
    tokenVersion: record.tokenVersion,
    tokenExpiresAt: record.tokenExpiresAt,
    context: {
      storeId,
      accessToken: decryptStored(record.accessTokenEncrypted, key, connectionAad(platform, storeId, "access")),
      authorizationToken: record.authorizationTokenEncrypted
        ? decryptStored(record.authorizationTokenEncrypted, key, connectionAad(platform, storeId, "authorization"))
        : undefined,
      refreshToken: record.refreshTokenEncrypted
        ? decryptStored(record.refreshTokenEncrypted, key, connectionAad(platform, storeId, "refresh"))
        : undefined,
    },
  };
}

export async function findPlatformConnectionByExternalStoreId(
  platform: LivePlatform,
  externalStoreId: string,
) {
  const [record] = await getDb()
    .select({
      id: platformConnections.id,
      storeId: platformConnections.storeId,
      status: platformConnections.status,
      tokenVersion: platformConnections.tokenVersion,
    })
    .from(platformConnections)
    .where(
      and(
        eq(platformConnections.platform, platform),
        eq(platformConnections.externalStoreId, externalStoreId),
      ),
    )
    .limit(1);
  return record ?? null;
}

/** Active embedded boundary: connection and internal store must both be live. */
export async function findActivePlatformConnectionByExternalStoreId(
  platform: LivePlatform,
  externalStoreId: string,
) {
  const [record] = await getDb()
    .select({
      id: platformConnections.id,
      storeId: platformConnections.storeId,
      status: platformConnections.status,
      tokenVersion: platformConnections.tokenVersion,
    })
    .from(platformConnections)
    .innerJoin(stores, eq(stores.id, platformConnections.storeId))
    .where(
      and(
        eq(platformConnections.platform, platform),
        eq(platformConnections.externalStoreId, externalStoreId),
        eq(platformConnections.status, "connected"),
        inArray(stores.status, ["onboarding", "active"]),
        isNull(stores.archivedAt),
      ),
    )
    .limit(1);
  return record ?? null;
}

export async function savePendingPlatformAuthorization(input: {
  platform: LivePlatform;
  externalStoreId: string;
  eventCreatedAt: string;
  tokens: TokenResult;
}) {
  const key = encryptionKey();
  const now = new Date();
  const eventCreatedAt = parseProviderEventCreatedAt(input.eventCreatedAt);
  const values = {
    platform: input.platform,
    externalStoreId: input.externalStoreId,
    eventCreatedAt,
    accessTokenEncrypted: serializeSecret(encryptSecret(input.tokens.accessToken, key, pendingAad(input.platform, input.externalStoreId, "access"))),
    authorizationTokenEncrypted: input.tokens.authorizationToken
      ? serializeSecret(encryptSecret(input.tokens.authorizationToken, key, pendingAad(input.platform, input.externalStoreId, "authorization")))
      : null,
    refreshTokenEncrypted: input.tokens.refreshToken
      ? serializeSecret(encryptSecret(input.tokens.refreshToken, key, pendingAad(input.platform, input.externalStoreId, "refresh")))
      : null,
    tokenExpiresAt: new Date(input.tokens.expiresAt),
    scopes: input.tokens.scopes,
    tokenType: input.tokens.tokenType,
    consumedAt: null,
    updatedAt: now,
  };
  const [saved] = await getDb()
    .insert(pendingPlatformAuthorizations)
    .values(values)
    .onConflictDoUpdate({
      target: [
        pendingPlatformAuthorizations.platform,
        pendingPlatformAuthorizations.externalStoreId,
      ],
      set: values,
      setWhere: lt(pendingPlatformAuthorizations.eventCreatedAt, eventCreatedAt),
    })
    .returning({ eventCreatedAt: pendingPlatformAuthorizations.eventCreatedAt });

  if (saved) return { freshness: "applied" as const };

  const [current] = await getDb()
    .select({ eventCreatedAt: pendingPlatformAuthorizations.eventCreatedAt })
    .from(pendingPlatformAuthorizations)
    .where(
      and(
        eq(pendingPlatformAuthorizations.platform, input.platform),
        eq(pendingPlatformAuthorizations.externalStoreId, input.externalStoreId),
      ),
    )
    .limit(1);
  return {
    freshness:
      current?.eventCreatedAt.getTime() === eventCreatedAt.getTime()
        ? ("current" as const)
        : ("stale" as const),
  };
}

export async function getPendingPlatformAuthorization(
  platform: LivePlatform,
  externalStoreId: string,
) {
  const [record] = await getDb()
    .select()
    .from(pendingPlatformAuthorizations)
    .where(
      and(
        eq(pendingPlatformAuthorizations.platform, platform),
        eq(pendingPlatformAuthorizations.externalStoreId, externalStoreId),
        isNull(pendingPlatformAuthorizations.consumedAt),
        gt(pendingPlatformAuthorizations.tokenExpiresAt, new Date()),
      ),
    )
    .limit(1);
  if (!record) return null;
  const key = encryptionKey();
  const tokens: EventAwareTokenResult = {
    accessToken: decryptStored(record.accessTokenEncrypted, key, pendingAad(platform, externalStoreId, "access")),
    authorizationToken: record.authorizationTokenEncrypted
      ? decryptStored(record.authorizationTokenEncrypted, key, pendingAad(platform, externalStoreId, "authorization"))
      : undefined,
    refreshToken: record.refreshTokenEncrypted
      ? decryptStored(record.refreshTokenEncrypted, key, pendingAad(platform, externalStoreId, "refresh"))
      : undefined,
    expiresAt: record.tokenExpiresAt.toISOString(),
    scopes: record.scopes,
    tokenType: record.tokenType,
    providerEventCreatedAt: record.eventCreatedAt.toISOString(),
  };
  return {
    id: record.id,
    externalStoreId: record.externalStoreId,
    eventCreatedAt: record.eventCreatedAt.toISOString(),
    tokens,
  };
}

export async function hasPendingPlatformAuthorization(
  platform: LivePlatform,
  externalStoreId: string,
) {
  const [record] = await getDb()
    .select({ id: pendingPlatformAuthorizations.id })
    .from(pendingPlatformAuthorizations)
    .where(
      and(
        eq(pendingPlatformAuthorizations.platform, platform),
        eq(pendingPlatformAuthorizations.externalStoreId, externalStoreId),
        isNull(pendingPlatformAuthorizations.consumedAt),
        gt(pendingPlatformAuthorizations.tokenExpiresAt, new Date()),
      ),
    )
    .limit(1);
  return Boolean(record);
}

export interface PlatformBindingClaim {
  id: string;
  platform: LivePlatform;
  externalStoreId: string;
  externalUserId: string;
  expiresAt: Date;
  consumedAt: Date | null;
}

/**
 * Issues a one-time handoff only while an unconsumed provider authorization is
 * still live. The raw claim is returned once and only its SHA-256 digest is
 * persisted. A new handoff supersedes older unconsumed claims for the same
 * provider user and merchant.
 */
export async function issuePlatformBindingClaim(input: {
  platform: LivePlatform;
  externalStoreId: string;
  externalUserId: string;
  ttlSeconds?: number;
}) {
  const now = new Date();
  const ttlSeconds = Math.max(
    1,
    Math.min(maxBindingClaimTtlSeconds, Math.floor(input.ttlSeconds ?? maxBindingClaimTtlSeconds)),
  );
  const expiresAt = new Date(now.getTime() + ttlSeconds * 1_000);
  const secret = randomBytes(32).toString("base64url");
  const claimHash = hashPlatformBindingClaim(secret);

  const issued = await getDb().transaction(async (tx) => {
    const [pending] = await tx
      .select({ id: pendingPlatformAuthorizations.id })
      .from(pendingPlatformAuthorizations)
      .where(
        and(
          eq(pendingPlatformAuthorizations.platform, input.platform),
          eq(pendingPlatformAuthorizations.externalStoreId, input.externalStoreId),
          isNull(pendingPlatformAuthorizations.consumedAt),
          gt(pendingPlatformAuthorizations.tokenExpiresAt, now),
        ),
      )
      .for("update")
      .limit(1);
    if (!pending) return null;

    await tx
      .update(platformBindingClaims)
      .set({ consumedAt: now, updatedAt: now })
      .where(
        and(
          eq(platformBindingClaims.platform, input.platform),
          eq(platformBindingClaims.externalStoreId, input.externalStoreId),
          eq(platformBindingClaims.externalUserId, input.externalUserId),
          isNull(platformBindingClaims.consumedAt),
        ),
      );

    const [claim] = await tx
      .insert(platformBindingClaims)
      .values({
        platform: input.platform,
        externalStoreId: input.externalStoreId,
        externalUserId: input.externalUserId,
        claimHash,
        expiresAt,
        createdAt: now,
        updatedAt: now,
      })
      .returning({ id: platformBindingClaims.id });
    return claim ?? null;
  });

  return issued ? { secret, expiresAt } : null;
}

export async function peekPlatformBindingClaim(
  secret: string,
  platform: LivePlatform,
): Promise<PlatformBindingClaim | null> {
  if (!bindingClaimSecretSchema.safeParse(secret).success) return null;
  const [claim] = await getDb()
    .select(bindingClaimProjection)
    .from(platformBindingClaims)
    .where(activeBindingClaimWhere(secret, platform, new Date()))
    .limit(1);
  return claim ?? null;
}

/** Atomically consumes only the claim row; callers own subsequent bind work. */
export async function consumePlatformBindingClaim(
  secret: string,
  platform: LivePlatform,
): Promise<PlatformBindingClaim | null> {
  if (!bindingClaimSecretSchema.safeParse(secret).success) return null;
  const now = new Date();
  const [claim] = await getDb()
    .update(platformBindingClaims)
    .set({ consumedAt: now, updatedAt: now })
    .where(activeBindingClaimWhere(secret, platform, now))
    .returning(bindingClaimProjection);
  return claim ?? null;
}

export type FinalizePlatformBindingResult =
  | { status: "bound"; connectionId: string }
  | { status: "conflict" }
  | { status: "invalid" };

/**
 * Final account binding boundary. The provider merchant lock, pending row and
 * one-time claim are all validated and consumed in the same transaction as the
 * connection write. A concurrent uninstall either completes first and makes
 * this fail, or waits and revokes the newly bound connection immediately.
 */
export async function finalizePendingPlatformBinding(input: {
  claimSecret: string;
  claimId: string;
  pendingAuthorizationId: string;
  platform: LivePlatform;
  externalStoreId: string;
  externalUserId: string;
  expectedEventCreatedAt: string;
  storeId: string;
}): Promise<FinalizePlatformBindingResult> {
  if (!bindingClaimSecretSchema.safeParse(input.claimSecret).success) {
    return { status: "invalid" };
  }
  const expectedEventCreatedAt = parseProviderEventCreatedAt(
    input.expectedEventCreatedAt,
  );
  const now = new Date();

  return getDb().transaction(async (tx) => {
    await lockPlatformMerchant(tx, input.platform, input.externalStoreId);

    const [pending] = await tx
      .select()
      .from(pendingPlatformAuthorizations)
      .where(
        and(
          eq(pendingPlatformAuthorizations.id, input.pendingAuthorizationId),
          eq(pendingPlatformAuthorizations.platform, input.platform),
          eq(pendingPlatformAuthorizations.externalStoreId, input.externalStoreId),
          eq(pendingPlatformAuthorizations.eventCreatedAt, expectedEventCreatedAt),
          isNull(pendingPlatformAuthorizations.consumedAt),
          gt(pendingPlatformAuthorizations.tokenExpiresAt, now),
        ),
      )
      .for("update")
      .limit(1);
    if (!pending || pending.accessTokenEncrypted === "destroyed") {
      return { status: "invalid" };
    }

    const [claim] = await tx
      .select(bindingClaimProjection)
      .from(platformBindingClaims)
      .where(
        and(
          activeBindingClaimWhere(input.claimSecret, input.platform, now),
          eq(platformBindingClaims.id, input.claimId),
          eq(platformBindingClaims.externalStoreId, input.externalStoreId),
          eq(platformBindingClaims.externalUserId, input.externalUserId),
        ),
      )
      .for("update")
      .limit(1);
    if (!claim) return { status: "invalid" };

    const connections = await tx
      .select()
      .from(platformConnections)
      .where(
        and(
          eq(platformConnections.platform, input.platform),
          or(
            eq(platformConnections.storeId, input.storeId),
            eq(platformConnections.externalStoreId, input.externalStoreId),
          ),
        ),
      )
      .for("update");
    if (
      connections.some(
        (connection) =>
          connection.storeId !== input.storeId ||
          connection.externalStoreId !== input.externalStoreId,
      )
    ) {
      return { status: "conflict" };
    }

    const existing = connections[0];
    if (
      existing?.disconnectedAt &&
      expectedEventCreatedAt.getTime() <= existing.disconnectedAt.getTime()
    ) {
      return { status: "invalid" };
    }
    if (
      existing?.authorizationEventCreatedAt &&
      existing.authorizationEventCreatedAt.getTime() > expectedEventCreatedAt.getTime()
    ) {
      return { status: "invalid" };
    }

    const tokens = pendingAuthorizationTokens(pending, input.platform);
    const credentialValues = encryptedConnectionValues(
      {
        storeId: input.storeId,
        platform: input.platform,
        externalStoreId: input.externalStoreId,
        tokens,
      },
      encryptionKey(),
    );

    let connectionId: string;
    if (existing) {
      if (
        existing.status === "connected" &&
        existing.authorizationEventCreatedAt?.getTime() ===
          expectedEventCreatedAt.getTime()
      ) {
        connectionId = existing.id;
      } else {
        if (existing.status !== "connected" && existing.status !== "disconnected") {
          return { status: "conflict" };
        }
        const [updated] = await tx
          .update(platformConnections)
          .set({
            ...credentialValues,
            authorizationEventCreatedAt: expectedEventCreatedAt,
            updatedAt: now,
            tokenVersion: sql`${platformConnections.tokenVersion} + 1`,
          })
          .where(
            and(
              eq(platformConnections.id, existing.id),
              eq(platformConnections.storeId, input.storeId),
              eq(platformConnections.platform, input.platform),
              eq(platformConnections.externalStoreId, input.externalStoreId),
              eq(platformConnections.tokenVersion, existing.tokenVersion),
            ),
          )
          .returning({ id: platformConnections.id });
        if (!updated) return { status: "invalid" };
        connectionId = updated.id;
      }
    } else {
      const [created] = await tx
        .insert(platformConnections)
        .values({
          storeId: input.storeId,
          platform: input.platform,
          ...credentialValues,
          authorizationEventCreatedAt: expectedEventCreatedAt,
          updatedAt: now,
        })
        .returning({ id: platformConnections.id });
      if (!created) return { status: "invalid" };
      connectionId = created.id;
    }

    const [consumedClaim] = await tx
      .update(platformBindingClaims)
      .set({ consumedAt: now, updatedAt: now })
      .where(
        and(
          eq(platformBindingClaims.id, claim.id),
          activeBindingClaimWhere(input.claimSecret, input.platform, now),
        ),
      )
      .returning({ id: platformBindingClaims.id });
    const [consumedPending] = await tx
      .update(pendingPlatformAuthorizations)
      .set({ consumedAt: now, updatedAt: now })
      .where(
        and(
          eq(pendingPlatformAuthorizations.id, pending.id),
          eq(pendingPlatformAuthorizations.eventCreatedAt, expectedEventCreatedAt),
          isNull(pendingPlatformAuthorizations.consumedAt),
        ),
      )
      .returning({ id: pendingPlatformAuthorizations.id });
    if (!consumedClaim || !consumedPending) {
      throw new Error("The platform binding boundary changed during finalization.");
    }

    return { status: "bound", connectionId };
  });
}

export async function invalidatePlatformBindingClaims(
  platform: LivePlatform,
  externalStoreId: string,
) {
  const now = new Date();
  await getDb()
    .update(platformBindingClaims)
    .set({ consumedAt: now, updatedAt: now })
    .where(
      and(
        eq(platformBindingClaims.platform, platform),
        eq(platformBindingClaims.externalStoreId, externalStoreId),
        isNull(platformBindingClaims.consumedAt),
      ),
    );
}

/**
 * Applies an uninstall to every local authorization surface under one
 * provider-merchant lock. It never relies on a pre-transaction "existing"
 * lookup, so an install committed while the webhook was waiting is revoked in
 * this same transaction. Provider event time is compared only with provider
 * authorization generations; local refresh wall-clock time never outranks it.
 */
export async function revokePlatformInstallation(input: {
  platform: LivePlatform;
  externalStoreId: string;
  eventCreatedAt: string;
}) {
  const now = new Date();
  const eventCreatedAt = parseProviderEventCreatedAt(input.eventCreatedAt);
  const providerSecondEnd = providerRevocationSecondEnd(input.eventCreatedAt);
  return getDb().transaction(async (tx) => {
    await lockPlatformMerchant(tx, input.platform, input.externalStoreId);

    const [pendingRevoked] = await tx
      .update(pendingPlatformAuthorizations)
      .set({
        accessTokenEncrypted: "destroyed",
        authorizationTokenEncrypted: null,
        refreshTokenEncrypted: null,
        tokenExpiresAt: now,
        eventCreatedAt,
        consumedAt: now,
        updatedAt: now,
      })
      .where(
        and(
          eq(pendingPlatformAuthorizations.platform, input.platform),
          eq(pendingPlatformAuthorizations.externalStoreId, input.externalStoreId),
          lte(pendingPlatformAuthorizations.eventCreatedAt, eventCreatedAt),
        ),
      )
      .returning({ id: pendingPlatformAuthorizations.id });

    const [connectionRevoked] = await tx
      .update(platformConnections)
      .set({
        status: "disconnected",
        accessTokenEncrypted: "destroyed",
        authorizationTokenEncrypted: null,
        refreshTokenEncrypted: null,
        disconnectedAt: eventCreatedAt,
        updatedAt: now,
        tokenVersion: sql`${platformConnections.tokenVersion} + 1`,
      })
      .where(
        and(
          eq(platformConnections.platform, input.platform),
          eq(platformConnections.externalStoreId, input.externalStoreId),
          eq(platformConnections.status, "connected"),
          or(
            isNull(platformConnections.authorizationEventCreatedAt),
            lte(platformConnections.authorizationEventCreatedAt, providerSecondEnd),
          ),
        ),
      )
      .returning({
        id: platformConnections.id,
        storeId: platformConnections.storeId,
      });

    const [pendingCurrent] = await tx
      .select({
        eventCreatedAt: pendingPlatformAuthorizations.eventCreatedAt,
        consumedAt: pendingPlatformAuthorizations.consumedAt,
        accessTokenEncrypted: pendingPlatformAuthorizations.accessTokenEncrypted,
      })
      .from(pendingPlatformAuthorizations)
      .where(
        and(
          eq(pendingPlatformAuthorizations.platform, input.platform),
          eq(pendingPlatformAuthorizations.externalStoreId, input.externalStoreId),
        ),
      )
      .limit(1);
    const [connectionCurrent] = await tx
      .select({
        id: platformConnections.id,
        storeId: platformConnections.storeId,
        status: platformConnections.status,
        authorizationEventCreatedAt: platformConnections.authorizationEventCreatedAt,
        disconnectedAt: platformConnections.disconnectedAt,
      })
      .from(platformConnections)
      .where(
        and(
          eq(platformConnections.platform, input.platform),
          eq(platformConnections.externalStoreId, input.externalStoreId),
        ),
      )
      .limit(1);

    const pendingIsNewer = Boolean(
      pendingCurrent && pendingCurrent.eventCreatedAt > eventCreatedAt,
    );
    const connectionIsNewer = Boolean(
      connectionCurrent?.status === "connected" &&
        connectionCurrent.authorizationEventCreatedAt &&
        connectionCurrent.authorizationEventCreatedAt > providerSecondEnd,
    );
    const laterDisconnect = Boolean(
      connectionCurrent?.status === "disconnected" &&
        connectionCurrent.disconnectedAt &&
        connectionCurrent.disconnectedAt > eventCreatedAt,
    );
    const stale = pendingIsNewer || connectionIsNewer || laterDisconnect;

    if (!stale) {
      await invalidatePlatformBindingClaimsWith(
        tx,
        input.platform,
        input.externalStoreId,
        now,
      );
    }

    const revokedConnection = connectionRevoked ??
      (!stale && connectionCurrent?.status === "disconnected"
        ? { id: connectionCurrent.id, storeId: connectionCurrent.storeId }
        : null);
    let cancelledJobs = 0;
    if (revokedConnection) {
      const activeJobs = await tx
        .select({
          id: syncJobs.id,
          storeId: syncJobs.storeId,
          resourceType: syncJobs.resourceType,
        })
        .from(syncJobs)
        .where(
          and(
            eq(syncJobs.storeId, revokedConnection.storeId),
            eq(syncJobs.connectionId, revokedConnection.id),
            inArray(syncJobs.status, ["queued", "running"]),
          ),
        )
        .for("update");
      if (activeJobs.length > 0) {
        cancelledJobs = activeJobs.length;
        await tx.insert(syncErrors).values(
          activeJobs.map((job) => ({
            storeId: job.storeId,
            syncJobId: job.id,
            resourceType: job.resourceType,
            errorCode: "platform_connection_revoked",
            message: "The commerce platform connection was revoked.",
            retryable: false,
            details: {},
            occurredAt: now,
            createdAt: now,
          })),
        );
        await tx
          .update(syncJobs)
          .set({
            status: "cancelled",
            completedAt: now,
            heartbeatAt: now,
            updatedAt: now,
          })
          .where(
            and(
              eq(syncJobs.storeId, revokedConnection.storeId),
              eq(syncJobs.connectionId, revokedConnection.id),
              inArray(syncJobs.status, ["queued", "running"]),
            ),
          );
      }
    }

    const applied = Boolean(pendingRevoked || connectionRevoked);
    const current = !stale && Boolean(
      (pendingCurrent?.consumedAt && pendingCurrent.accessTokenEncrypted === "destroyed") ||
        connectionCurrent?.status === "disconnected",
    );
    return {
      freshness: stale
        ? ("stale" as const)
        : applied
          ? ("applied" as const)
          : current
            ? ("current" as const)
            : ("missing" as const),
      connectionId: revokedConnection?.id ?? connectionCurrent?.id ?? null,
      storeId: revokedConnection?.storeId ?? connectionCurrent?.storeId ?? null,
      cancelledJobs,
    };
  });
}

/** Backwards-compatible entry point; uninstall now always revokes both sides. */
export function destroyPendingPlatformAuthorization(input: {
  platform: LivePlatform;
  externalStoreId: string;
  eventCreatedAt: string;
}) {
  return revokePlatformInstallation(input);
}

export async function markPendingPlatformAuthorizationConsumed(id: string) {
  await getDb()
    .update(pendingPlatformAuthorizations)
    .set({ consumedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(pendingPlatformAuthorizations.id, id), isNull(pendingPlatformAuthorizations.consumedAt)));
}

export async function disconnectPlatformConnection(input: {
  platform: LivePlatform;
  externalStoreId: string;
  eventCreatedAt: string;
}) {
  return revokePlatformInstallation(input);
}

export function providerRevocationSecondEnd(eventCreatedAt: string) {
  return new Date(parseProviderEventCreatedAt(eventCreatedAt).getTime() + 999);
}

function encryptionKey() {
  const key = getServerEnv().TOKEN_ENCRYPTION_KEY;
  if (!key) throw new Error("TOKEN_ENCRYPTION_KEY is required for platform credentials.");
  return key;
}

function serializeSecret(secret: EncryptedSecret) {
  return JSON.stringify(secret);
}

function connectionAad(platform: LivePlatform, storeId: string, token: string) {
  return `platform-connection:${platform}:${storeId}:${token}`;
}

function pendingAad(platform: LivePlatform, externalStoreId: string, token: string) {
  return `pending-platform-authorization:${platform}:${externalStoreId}:${token}`;
}

function decryptStored(value: string, key: string, aad: string) {
  return decryptSecret(encryptedSecretSchema.parse(JSON.parse(value)), key, aad);
}

function parseProviderEventCreatedAt(value: string) {
  const canonical = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/u.test(value)
    ? `${value.replace(" ", "T")}Z`
    : value;
  const timestamp = new Date(canonical);
  if (Number.isNaN(timestamp.getTime())) {
    throw new z.ZodError([
      {
        code: "custom",
        path: ["created_at"],
        message: "Invalid provider event timestamp.",
      },
    ]);
  }
  return timestamp;
}

const bindingClaimProjection = {
  id: platformBindingClaims.id,
  platform: platformBindingClaims.platform,
  externalStoreId: platformBindingClaims.externalStoreId,
  externalUserId: platformBindingClaims.externalUserId,
  expiresAt: platformBindingClaims.expiresAt,
  consumedAt: platformBindingClaims.consumedAt,
};

function hashPlatformBindingClaim(secret: string) {
  return createHash("sha256").update(secret, "utf8").digest("hex");
}

function activeBindingClaimWhere(secret: string, platform: LivePlatform, now: Date) {
  return and(
    eq(platformBindingClaims.claimHash, hashPlatformBindingClaim(secret)),
    eq(platformBindingClaims.platform, platform),
    isNull(platformBindingClaims.consumedAt),
    gt(platformBindingClaims.expiresAt, now),
  );
}

function pendingAuthorizationTokens(
  record: typeof pendingPlatformAuthorizations.$inferSelect,
  platform: LivePlatform,
): EventAwareTokenResult {
  const key = encryptionKey();
  const externalStoreId = record.externalStoreId;
  return {
    accessToken: decryptStored(
      record.accessTokenEncrypted,
      key,
      pendingAad(platform, externalStoreId, "access"),
    ),
    authorizationToken: record.authorizationTokenEncrypted
      ? decryptStored(
          record.authorizationTokenEncrypted,
          key,
          pendingAad(platform, externalStoreId, "authorization"),
        )
      : undefined,
    refreshToken: record.refreshTokenEncrypted
      ? decryptStored(
          record.refreshTokenEncrypted,
          key,
          pendingAad(platform, externalStoreId, "refresh"),
        )
      : undefined,
    expiresAt: record.tokenExpiresAt.toISOString(),
    scopes: record.scopes,
    tokenType: record.tokenType,
    providerEventCreatedAt: record.eventCreatedAt.toISOString(),
  };
}

function lockPlatformMerchant(
  tx: PlatformTransaction,
  platform: LivePlatform,
  externalStoreId: string,
) {
  const lockKey = `platform-installation:${platform}:${externalStoreId}`;
  return tx.execute(
    sql`select pg_advisory_xact_lock(hashtextextended(${lockKey}, 0))`,
  );
}

function invalidatePlatformBindingClaimsWith(
  database: Pick<ReturnType<typeof getDb>, "update">,
  platform: LivePlatform,
  externalStoreId: string,
  now: Date,
) {
  return database
    .update(platformBindingClaims)
    .set({ consumedAt: now, updatedAt: now })
    .where(
      and(
        eq(platformBindingClaims.platform, platform),
        eq(platformBindingClaims.externalStoreId, externalStoreId),
        isNull(platformBindingClaims.consumedAt),
      ),
    );
}

function encryptedConnectionValues(
  input: {
    storeId: string;
    platform: LivePlatform;
    externalStoreId: string;
    tokens: TokenResult;
  },
  key: string,
) {
  const now = new Date();
  return {
    externalStoreId: input.externalStoreId,
    status: "connected" as const,
    accessTokenEncrypted: serializeSecret(
      encryptSecret(
        input.tokens.accessToken,
        key,
        connectionAad(input.platform, input.storeId, "access"),
      ),
    ),
    authorizationTokenEncrypted: input.tokens.authorizationToken
      ? serializeSecret(
          encryptSecret(
            input.tokens.authorizationToken,
            key,
            connectionAad(input.platform, input.storeId, "authorization"),
          ),
        )
      : null,
    refreshTokenEncrypted: input.tokens.refreshToken
      ? serializeSecret(
          encryptSecret(
            input.tokens.refreshToken,
            key,
            connectionAad(input.platform, input.storeId, "refresh"),
          ),
        )
      : null,
    tokenExpiresAt: new Date(input.tokens.expiresAt),
    scopes: input.tokens.scopes,
    lastVerifiedAt: now,
    disconnectedAt: null,
    metadata: { tokenType: input.tokens.tokenType },
    updatedAt: now,
  };
}
