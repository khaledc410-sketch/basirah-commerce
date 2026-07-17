import { createHash } from "node:crypto";

import { and, eq, inArray, lt, or, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { SallaConnector } from "@/core/commerce/salla-connector";
import { parseSallaAppEvent } from "@/core/commerce/salla-events";
import { dispatchCatalogSyncOutbox } from "@/core/jobs/catalog-queue";
import {
  findPlatformConnectionByExternalStoreId,
  revokePlatformInstallation,
  rotatePlatformConnectionAuthorization,
  savePendingPlatformAuthorization,
} from "@/db/repositories/platform-connection-repository";
import { createSyncRepository } from "@/db/repositories/sync-repository";
import { getDb } from "@/db/client";
import { webhookEvents, type JsonValue } from "@/db/schema";
import { logEvent, requestContext } from "@/lib/logger";

export const dynamic = "force-dynamic";

const maxWebhookBytes = 256 * 1024;

export async function POST(request: Request) {
  const context = requestContext(request);
  let inboxContext: { id: string; storeId: string } | undefined;
  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > maxWebhookBytes) {
    return NextResponse.json({ error: "Payload too large." }, { status: 413 });
  }
  const rawBody = new Uint8Array(await request.arrayBuffer());
  if (rawBody.byteLength === 0 || rawBody.byteLength > maxWebhookBytes) {
    return NextResponse.json({ error: "Invalid payload size." }, { status: 400 });
  }
  if (!(await new SallaConnector().verifyWebhook(rawBody, request.headers))) {
    logEvent("warn", "salla_webhook_signature_rejected", context);
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  try {
    const payload = JSON.parse(Buffer.from(rawBody).toString("utf8")) as unknown;
    const event = parseSallaAppEvent(payload);
    const payloadHash = createHash("sha256").update(rawBody).digest("hex");
    if (event.kind === "ignored") {
      logEvent("info", "salla_automatic_app_event_ignored", {
        ...context,
        eventName: event.eventName,
        merchantId: event.merchantId,
      });
      return NextResponse.json(
        { accepted: true, ignored: true, event: event.eventName },
        { status: 202 },
      );
    }
    if (event.kind === "uninstalled") {
      if (!event.createdAt) {
        logEvent("warn", "salla_uninstall_missing_timestamp_ignored", {
          ...context,
          merchantId: event.merchantId,
        });
        return NextResponse.json(
          { accepted: true, ignored: true, reason: "missing_event_timestamp" },
          { status: 202 },
        );
      }
      const revocation = await revokePlatformInstallation({
        platform: "salla",
        externalStoreId: event.merchantId,
        eventCreatedAt: event.createdAt,
      });
      if (revocation.storeId && revocation.connectionId) {
        await getDb()
          .insert(webhookEvents)
          .values({
            storeId: revocation.storeId,
            connectionId: revocation.connectionId,
            platform: "salla",
            eventType: event.kind,
            providerDeliveryId: request.headers.get("x-salla-delivery-id"),
            idempotencyKey: `salla:${payloadHash}`,
            signatureVerified: true,
            headers: {
              strategy:
                request.headers.get("x-salla-security-strategy") ?? "signature",
            },
            payload: {
              event: event.kind,
              merchant: event.merchantId,
              createdAt: event.createdAt,
            } satisfies JsonValue,
            payloadHash,
            status: "delivered",
            attemptCount: 1,
            processedAt: new Date(),
          })
          .onConflictDoNothing();
      }
      logEvent("info", "salla_installation_uninstalled", {
        ...context,
        storeId: revocation.storeId ?? undefined,
        freshness: revocation.freshness,
        cancelledJobs: revocation.cancelledJobs,
      });
      return NextResponse.json(
        { accepted: true, freshness: revocation.freshness },
        { status: 202 },
      );
    }
    const existing = await findPlatformConnectionByExternalStoreId("salla", event.merchantId);

    if (event.kind === "authorize" && !existing) {
      const pending = await savePendingPlatformAuthorization({
        platform: "salla",
        externalStoreId: event.merchantId,
        eventCreatedAt: event.createdAt,
        tokens: event.tokens,
      });
      logEvent("info", pending.freshness === "stale"
        ? "salla_authorization_stale_ignored"
        : "salla_authorization_pending_binding", {
        ...context,
        merchantId: event.merchantId,
        freshness: pending.freshness,
      });
      return NextResponse.json(
        { accepted: true, pendingBinding: true, freshness: pending.freshness },
        { status: 202 },
      );
    }
    if (!existing) {
      return NextResponse.json({ accepted: true, ignored: true }, { status: 202 });
    }

    let [inbox] = await getDb()
      .insert(webhookEvents)
      .values({
        storeId: existing.storeId,
        connectionId: existing.id,
        platform: "salla",
        eventType: event.kind,
        providerDeliveryId: request.headers.get("x-salla-delivery-id"),
        idempotencyKey: `salla:${payloadHash}`,
        signatureVerified: true,
        headers: {
          strategy: request.headers.get("x-salla-security-strategy") ?? "signature",
        },
        // Tokens are intentionally excluded; only the verified lifecycle envelope is retained.
        payload: {
          event: event.kind,
          merchant: event.merchantId,
          createdAt: event.createdAt ?? null,
        } satisfies JsonValue,
        payloadHash,
        status: "processing",
        attemptCount: 1,
      })
      .onConflictDoNothing()
      .returning({ id: webhookEvents.id });
    if (!inbox) {
      const [prior] = await getDb()
        .select({
          id: webhookEvents.id,
          status: webhookEvents.status,
          receivedAt: webhookEvents.receivedAt,
        })
        .from(webhookEvents)
        .where(
          and(
            eq(webhookEvents.storeId, existing.storeId),
            eq(webhookEvents.idempotencyKey, `salla:${payloadHash}`),
          ),
        )
        .limit(1);
      if (!prior || prior.status === "delivered") {
        return NextResponse.json({ accepted: true, duplicate: true });
      }
      const [reclaimed] = await getDb()
        .update(webhookEvents)
        .set({
          status: "processing",
          attemptCount: sql`${webhookEvents.attemptCount} + 1`,
          failedAt: null,
          lastError: null,
        })
        .where(
          and(
            eq(webhookEvents.id, prior.id),
            eq(webhookEvents.storeId, existing.storeId),
            or(
              inArray(webhookEvents.status, ["pending", "failed"]),
              and(
                eq(webhookEvents.status, "processing"),
                lt(webhookEvents.receivedAt, new Date(Date.now() - 5 * 60 * 1000)),
              ),
            ),
          ),
        )
        .returning({ id: webhookEvents.id });
      if (!reclaimed) return NextResponse.json({ accepted: true, processing: true }, { status: 202 });
      inbox = reclaimed;
    }
    inboxContext = { id: inbox.id, storeId: existing.storeId };

    if (event.kind === "authorize") {
      const rotation = await rotatePlatformConnectionAuthorization({
        connectionId: existing.id,
        storeId: existing.storeId,
        platform: "salla",
        externalStoreId: event.merchantId,
        eventCreatedAt: event.createdAt,
        tokens: event.tokens,
      });
      if (rotation.freshness === "stale") {
        logEvent("info", "salla_authorization_stale_ignored", {
          ...context,
          storeId: existing.storeId,
        });
      } else {
        // Equal timestamps are allowed to finish idempotent downstream work after
        // a retry that persisted credentials but failed before creating the run.
        const sync = await createSyncRepository().createOrGetCatalogRun({
          storeId: existing.storeId,
          connectionId: existing.id,
          kind: "reconciliation",
          idempotencyKey: `salla-webhook:${payloadHash}`,
        });
        await dispatchCatalogSyncOutbox();
        logEvent("info", "salla_authorization_rotated", {
          ...context,
          storeId: existing.storeId,
          runId: sync.runId,
          freshness: rotation.freshness,
        });
      }
    }

    await getDb()
      .update(webhookEvents)
      .set({ status: "delivered", processedAt: new Date() })
      .where(and(eq(webhookEvents.id, inbox.id), eq(webhookEvents.storeId, existing.storeId)));
    return NextResponse.json({ accepted: true });
  } catch (error) {
    if (inboxContext) {
      await getDb()
        .update(webhookEvents)
        .set({
          status: "failed",
          failedAt: new Date(),
          lastError: "Salla webhook processing failed.",
        })
        .where(
          and(
            eq(webhookEvents.id, inboxContext.id),
            eq(webhookEvents.storeId, inboxContext.storeId),
          ),
        )
        .catch(() => undefined);
    }
    logEvent("error", "salla_webhook_processing_failed", {
      ...context,
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    const invalid = error instanceof SyntaxError || error instanceof ZodError;
    return NextResponse.json(
      { error: invalid ? "Invalid or unsupported event." : "Webhook processing failed." },
      { status: invalid ? 400 : 500 },
    );
  }
}
