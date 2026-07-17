import { and, eq, inArray, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";

import { verifySallaEmbeddedSession } from "@/core/commerce/salla-embedded";
import { enforceRateLimit } from "@/core/security/rate-limit";
import { getDb } from "@/db/client";
import { createSyncRepository } from "@/db/repositories/sync-repository";
import { stores } from "@/db/schema";
import { logEvent, requestContext } from "@/lib/logger";

export const dynamic = "force-dynamic";

const noStoreHeaders = { "cache-control": "no-store", pragma: "no-cache" };

export async function GET(request: Request) {
  const context = requestContext(request);
  const sessionToken = bearerToken(request.headers.get("authorization"));
  if (!sessionToken) {
    return NextResponse.json(
      { error: "An embedded session is required." },
      { status: 401, headers: noStoreHeaders },
    );
  }

  let session: Awaited<ReturnType<typeof verifySallaEmbeddedSession>>;
  try {
    session = await verifySallaEmbeddedSession(sessionToken);
  } catch (error) {
    logEvent("warn", "salla_embedded_session_rejected", {
      ...context,
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return NextResponse.json(
      { error: "The embedded session is invalid or expired." },
      { status: 401, headers: noStoreHeaders },
    );
  }

  try {
    const limit = await enforceRateLimit({
      namespace: "salla-embedded-overview",
      identifier: `${session.store}:${session.jti}`,
      limit: 120,
      windowSeconds: 5 * 60,
    });
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Too many embedded overview requests. Please retry shortly." },
        {
          status: 429,
          headers: { ...noStoreHeaders, "retry-after": String(limit.retryAfterSeconds) },
        },
      );
    }
  } catch (error) {
    logEvent("error", "salla_embedded_overview_rate_limit_failed", {
      ...context,
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return NextResponse.json(
      { error: "The embedded store overview is temporarily unavailable." },
      { status: 503, headers: { ...noStoreHeaders, "retry-after": "3" } },
    );
  }

  try {
    const [store, sync] = await Promise.all([
      getVerifiedStoreSummary(session.store),
      createSyncRepository().getLatestRunStatus(session.store),
    ]);
    if (!store) {
      return NextResponse.json(
        { error: "The embedded store is no longer available." },
        { status: 401, headers: noStoreHeaders },
      );
    }

    return NextResponse.json(
      {
        store: {
          name: store.name,
          externalDomain: store.externalDomain,
          status: store.status,
          currency: store.currency,
          defaultLocale: store.defaultLocale,
        },
        sync: sync
          ? {
              status: sync.overallStatus,
              progress: safeSyncProgress(sync),
              recordsProcessed: sync.stages.reduce(
                (total, stage) => total + stage.recordsProcessed,
                0,
              ),
              recordsFailed: sync.stages.reduce(
                (total, stage) => total + stage.recordsFailed,
                0,
              ),
              updatedAt: latestStageTimestamp(sync.stages)?.toISOString() ?? null,
            }
          : null,
      },
      { headers: noStoreHeaders },
    );
  } catch (error) {
    logEvent("error", "salla_embedded_overview_failed", {
      ...context,
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return NextResponse.json(
      { error: "The embedded store overview is temporarily unavailable." },
      { status: 503, headers: { ...noStoreHeaders, "retry-after": "3" } },
    );
  }
}

function bearerToken(value: string | null) {
  if (!value || value.length > 8_192) return null;
  const match = /^Bearer ([A-Za-z0-9._~-]+)$/u.exec(value);
  return match?.[1] ?? null;
}

async function getVerifiedStoreSummary(storeId: string) {
  const [store] = await getDb()
    .select({
      name: stores.name,
      externalDomain: stores.externalDomain,
      status: stores.status,
      currency: stores.currency,
      defaultLocale: stores.defaultLocale,
    })
    .from(stores)
    .where(
      and(
        eq(stores.id, storeId),
        inArray(stores.status, ["onboarding", "active"]),
        isNull(stores.archivedAt),
      ),
    )
    .limit(1);
  return store ?? null;
}

function safeSyncProgress(sync: {
  overallStatus: string;
  stages: Array<{ percent: number | null }>;
}) {
  if (sync.overallStatus === "succeeded") return 100;
  if (sync.stages.length === 0) return 0;
  return Math.floor(
    sync.stages.reduce((total, stage) => total + (stage.percent ?? 0), 0) /
      sync.stages.length,
  );
}

function latestStageTimestamp(
  stages: Array<{
    startedAt: Date | null;
    heartbeatAt: Date | null;
    completedAt: Date | null;
  }>,
) {
  const timestamps = stages.flatMap((stage) =>
    [stage.completedAt, stage.heartbeatAt, stage.startedAt].filter(
      (value): value is Date => value !== null,
    ),
  );
  return timestamps.length === 0
    ? null
    : timestamps.reduce((latest, value) => (value > latest ? value : latest));
}
