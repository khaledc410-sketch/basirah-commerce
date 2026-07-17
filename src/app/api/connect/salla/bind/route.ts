import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getFreshApiIdentity } from "@/core/auth/session";
import { isValidSallaBindingClaim } from "@/core/commerce/salla-binding";
import { clearSallaBindingCookie } from "@/core/commerce/salla-binding-cookie";
import { SallaConnector } from "@/core/commerce/salla-connector";
import { sallaBindingCookieName } from "@/core/commerce/salla-embedded";
import { getSallaAuthorizerIdentity } from "@/core/commerce/salla-user-info";
import { getCurrentStoreContext } from "@/core/data/tenant";
import { dispatchCatalogSyncOutbox } from "@/core/jobs/catalog-queue";
import { enforceRateLimit } from "@/core/security/rate-limit";
import { acceptsJson, isSameOrigin } from "@/core/security/request";
import {
  finalizePendingPlatformBinding,
  findPlatformConnectionByExternalStoreId,
  getPendingPlatformAuthorization,
  getPlatformConnection,
  peekPlatformBindingClaim,
} from "@/db/repositories/platform-connection-repository";
import { createSyncRepository } from "@/db/repositories/sync-repository";
import { logEvent, requestContext } from "@/lib/logger";

export async function POST(request: Request) {
  const context = requestContext(request);
  if (!isSameOrigin(request) || !acceptsJson(request, 1_024)) {
    return bindingResponse({ error: "الطلب غير صالح." }, 400);
  }

  const identity = await getFreshApiIdentity();
  const store = await getCurrentStoreContext();
  if (!identity || !store) {
    return bindingResponse({ error: "يلزم تسجيل الدخول لإكمال الربط." }, 401);
  }
  if (store.role !== "owner" && store.role !== "admin") {
    return bindingResponse({ error: "يلزم دور المالك أو المسؤول لربط المتجر." }, 403);
  }

  const limit = await enforceRateLimit({
    namespace: "salla-easy-bind",
    identifier: `${identity.userId}:${store.storeId}`,
    limit: 8,
    windowSeconds: 15 * 60,
  });
  if (!limit.allowed) {
    return bindingResponse(
      { error: "محاولات ربط كثيرة. انتظر قليلًا ثم أعد المحاولة." },
      429,
      { "retry-after": String(limit.retryAfterSeconds) },
    );
  }

  const claimSecret = (await cookies()).get(sallaBindingCookieName)?.value;
  if (!isValidSallaBindingClaim(claimSecret)) {
    return invalidClaimResponse();
  }

  let claimConsumed = false;
  try {
    const claim = await peekPlatformBindingClaim(claimSecret, "salla");
    if (!claim) return invalidClaimResponse();

    const [externalConnection, internalConnection] = await Promise.all([
      findPlatformConnectionByExternalStoreId("salla", claim.externalStoreId),
      getPlatformConnection(store.storeId, "salla"),
    ]);
    if (externalConnection && externalConnection.storeId !== store.storeId) {
      return bindingResponse({ error: "متجر سلة هذا مرتبط بمساحة أخرى." }, 409);
    }
    if (
      internalConnection &&
      internalConnection.externalStoreId !== claim.externalStoreId
    ) {
      return bindingResponse(
        {
          error: "هذه المساحة مرتبطة بمتجر سلة آخر. افصله قبل تبديل المتجر.",
        },
        409,
      );
    }

    const pending = await getPendingPlatformAuthorization("salla", claim.externalStoreId);
    if (!pending) {
      return bindingResponse(
        { error: "تفويض سلة لم يصل بعد. انتظر بضع ثوانٍ ثم أعد المحاولة." },
        409,
        { "retry-after": "3" },
      );
    }

    const [remoteStore, authorizer] = await Promise.all([
      new SallaConnector().getStore({
        storeId: store.storeId,
        accessToken: pending.tokens.accessToken,
        authorizationToken: pending.tokens.authorizationToken,
        refreshToken: pending.tokens.refreshToken,
      }),
      getSallaAuthorizerIdentity(pending.tokens.accessToken),
    ]);
    if (
      remoteStore.externalId !== claim.externalStoreId ||
      authorizer.merchantId !== claim.externalStoreId ||
      authorizer.userId !== claim.externalUserId
    ) {
      logEvent("warn", "salla_binding_merchant_mismatch", {
        ...context,
        storeId: store.storeId,
      });
      return bindingResponse(
        { error: "هوية متجر سلة لا تطابق التفويض المعلّق." },
        409,
        undefined,
        true,
      );
    }

    const finalized = await finalizePendingPlatformBinding({
      claimSecret,
      claimId: claim.id,
      pendingAuthorizationId: pending.id,
      externalUserId: claim.externalUserId,
      storeId: store.storeId,
      platform: "salla",
      externalStoreId: claim.externalStoreId,
      expectedEventCreatedAt: pending.eventCreatedAt,
    });
    if (finalized.status === "conflict") {
      return bindingResponse({ error: "متجر سلة هذا مرتبط بمساحة أخرى." }, 409);
    }
    if (finalized.status !== "bound") return invalidClaimResponse();
    claimConsumed = true;

    const sync = await createSyncRepository().createOrGetCatalogRun({
      storeId: store.storeId,
      connectionId: finalized.connectionId,
      kind: "initial",
      idempotencyKey: `salla-easy:${pending.id}`,
      requestedByUserId: identity.userId,
    });

    try {
      await dispatchCatalogSyncOutbox();
    } catch (error) {
      logEvent("warn", "salla_initial_sync_dispatch_deferred", {
        ...context,
        storeId: store.storeId,
        runId: sync.runId,
        errorName: error instanceof Error ? error.name : "UnknownError",
      });
    }
    logEvent("info", "salla_easy_connection_bound", {
      ...context,
      storeId: store.storeId,
      runId: sync.runId,
    });
    return successResponse({ connected: true, runId: sync.runId }, 202);
  } catch (error) {
    logEvent("error", "salla_easy_binding_failed", {
      ...context,
      storeId: store.storeId,
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return bindingResponse(
      {
        error: claimConsumed
          ? "تعذر إكمال الربط بعد استهلاك الطلب. افتح بصيرة من سلة مجددًا."
          : "تعذر إكمال الربط. أعد المحاولة.",
      },
      500,
      undefined,
      claimConsumed,
    );
  }
}

function invalidClaimResponse() {
  return bindingResponse(
    { error: "طلب ربط سلة غير صالح أو انتهت صلاحيته. افتح بصيرة من سلة مجددًا." },
    400,
    undefined,
    true,
  );
}

function successResponse(body: unknown, status = 200) {
  return bindingResponse(body, status, undefined, true);
}

function bindingResponse(
  body: unknown,
  status: number,
  headers?: Record<string, string>,
  clearCookie = false,
) {
  const response = NextResponse.json(body, {
    status,
    headers: { "cache-control": "private, no-store", ...headers },
  });
  if (clearCookie) clearSallaBindingCookie(response);
  return response;
}
