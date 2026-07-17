import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";

import { getProductionReadiness, getServerEnv, isDemoMode } from "@/config/env";
import { visibilityWorkerHeartbeatKey } from "@/core/jobs/visibility-queue";
import { getDb } from "@/db/client";
import { getRedis } from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function GET() {
  if (isDemoMode()) {
    return NextResponse.json({
      app: "basirah",
      mode: "demo",
      status: "ok",
      checkerStatus: "simulated",
      integrations: { salla: "simulated", zid: "simulated" },
    });
  }

  const readiness = getProductionReadiness();
  let database = "not_checked";
  let redis = "not_checked";
  let catalogWorker = "not_checked";
  let visibilityWorker = "not_checked";
  if (readiness.common.missing.includes("DATABASE_URL") === false) {
    try {
      await getDb().execute(sql`
        select 1
        from "platform_connections"
        cross join "pending_platform_authorizations"
        cross join "sync_jobs"
        cross join "products"
        cross join "prospect_scan_requests"
        cross join "prospect_scan_runs"
        cross join "prospect_scan_pages"
        cross join "prospect_scan_evidence"
        cross join "prospect_scan_findings"
        cross join "prospect_report_snapshots"
        cross join "prospect_report_access"
        cross join "report_orders"
        cross join "content_drafts"
        limit 0
      `);
      database = "schema_ready";
    } catch {
      database = "schema_unavailable";
    }
  }
  if (readiness.checker.missing.includes("REDIS_URL") === false) {
    try {
      const client = getRedis();
      redis = (await client.ping()) === "PONG" ? "connected" : "unavailable";
      const heartbeat = await client.get("basirah:worker:catalog:heartbeat");
      const heartbeatAge = heartbeat ? Date.now() - Date.parse(heartbeat) : Number.POSITIVE_INFINITY;
      catalogWorker = Number.isFinite(heartbeatAge) && heartbeatAge < 30_000
        ? "healthy"
        : "unavailable";
      const visibilityHeartbeat = await client.get(visibilityWorkerHeartbeatKey);
      const visibilityHeartbeatAge = visibilityHeartbeat
        ? Date.now() - Date.parse(visibilityHeartbeat)
        : Number.POSITIVE_INFINITY;
      visibilityWorker =
        Number.isFinite(visibilityHeartbeatAge) && visibilityHeartbeatAge < 30_000
          ? "healthy"
          : "unavailable";
    } catch {
      redis = "unavailable";
    }
  }
  const ready = readiness.ready && database === "schema_ready" && redis === "connected";
  const scannerEnabled = getServerEnv().VISIBILITY_SCAN_ENABLED;
  const checkerReady = ready && scannerEnabled && visibilityWorker === "healthy";
  const operationalReady = ready && (!scannerEnabled || checkerReady);
  const commerceReady =
    ready && readiness.auth.ready && readiness.salla.ready && catalogWorker === "healthy";

  return NextResponse.json(
    {
      app: "basirah",
      mode: "production",
      database,
      redis,
      catalogWorker,
      visibilityWorker,
      status: operationalReady ? "ok" : "not_ready",
      checkerStatus: scannerEnabled
        ? checkerReady
          ? "ok"
          : "not_ready"
        : "disabled",
      commerceStatus: commerceReady ? "ok" : "not_ready",
      checks: {
        common: readiness.common.ready ? "configured" : "missing_configuration",
        checker: scannerEnabled
          ? readiness.checker.ready
            ? "configured"
            : "missing_configuration"
          : "disabled",
        auth: readiness.auth.ready ? "configured" : "missing_configuration",
        salla: readiness.salla.ready ? "configured_unverified" : "missing_configuration",
        zid: readiness.zid.ready ? "optional_configured_unverified" : "optional_not_configured",
      },
    },
    { status: operationalReady ? 200 : 503 },
  );
}
