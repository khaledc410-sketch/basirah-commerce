import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";
import { z } from "zod";

import { isDemoMode } from "@/config/env";
import { getFreshApiIdentity } from "@/core/auth/session";
import { getCurrentStoreContext } from "@/core/data/tenant";
import { dispatchCatalogSyncOutbox } from "@/core/jobs/catalog-queue";
import { enforceRateLimit } from "@/core/security/rate-limit";
import { isSameOrigin } from "@/core/security/request";
import { getPlatformConnection } from "@/db/repositories/platform-connection-repository";
import { createSyncRepository } from "@/db/repositories/sync-repository";
import { logEvent, requestContext } from "@/lib/logger";

export const dynamic = "force-dynamic";

const runIdSchema = z.string().uuid();

export async function GET(request: Request) {
  if (isDemoMode()) {
    return NextResponse.json({ error: "Demo sync is simulated in the browser." }, { status: 404 });
  }
  const store = await getCurrentStoreContext();
  if (!store) return NextResponse.json({ error: "Authentication is required." }, { status: 401 });

  const requestedRunId = new URL(request.url).searchParams.get("runId");
  if (requestedRunId && !runIdSchema.safeParse(requestedRunId).success) {
    return NextResponse.json({ error: "Invalid sync run." }, { status: 400 });
  }
  const repository = createSyncRepository();
  const status = requestedRunId
    ? await repository.getRunStatus(store.storeId, requestedRunId)
    : await repository.getLatestRunStatus(store.storeId);
  if (!status) return NextResponse.json({ error: "No sync run was found." }, { status: 404 });
  return NextResponse.json(status, { headers: { "cache-control": "no-store" } });
}

export async function POST(request: Request) {
  if (isDemoMode()) {
    return NextResponse.json({ runId: "demo", status: "queued" }, { status: 202 });
  }
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }
  const context = requestContext(request);
  const identity = await getFreshApiIdentity();
  const store = await getCurrentStoreContext();
  if (!identity || !store) {
    return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  }
  if (!(["owner", "admin"] as const).includes(store.role as "owner" | "admin")) {
    return NextResponse.json({ error: "Store administrator access is required." }, { status: 403 });
  }

  const limit = await enforceRateLimit({
    namespace: "catalog-sync",
    identifier: `${identity.userId}:${store.storeId}`,
    limit: 6,
    windowSeconds: 10 * 60,
  });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many sync requests. Please wait before retrying." },
      { status: 429, headers: { "retry-after": String(limit.retryAfterSeconds) } },
    );
  }

  const connection = await getPlatformConnection(store.storeId, "salla");
  if (!connection) {
    return NextResponse.json({ error: "Connect Salla before starting a sync." }, { status: 409 });
  }
  const headerKey = request.headers.get("idempotency-key");
  const idempotencyKey = headerKey?.slice(0, 128) || `manual:${randomUUID()}`;
  const sync = await createSyncRepository().createOrGetCatalogRun({
    storeId: store.storeId,
    connectionId: connection.id,
    kind: "reconciliation",
    idempotencyKey,
    requestedByUserId: identity.userId,
  });
  const dispatch = await dispatchCatalogSyncOutbox();
  logEvent("info", "catalog_sync_requested", {
    ...context,
    storeId: store.storeId,
    runId: sync.runId,
    dispatched: dispatch.delivered > 0,
  });
  return NextResponse.json(
    { runId: sync.runId, status: "queued", dispatched: dispatch.delivered > 0 },
    { status: 202, headers: { "cache-control": "no-store" } },
  );
}
