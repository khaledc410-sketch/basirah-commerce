import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { isDemoMode } from "@/config/env";
import { getFreshApiIdentity } from "@/core/auth/session";
import { SallaConnector } from "@/core/commerce/salla-connector";
import { dispatchCatalogSyncOutbox } from "@/core/jobs/catalog-queue";
import {
  hashOAuthState,
  oauthStateCookieName,
  verifyOAuthState,
} from "@/core/security/oauth-state";
import {
  consumeOAuthState,
  getOAuthState,
  upsertPlatformConnection,
} from "@/db/repositories/platform-connection-repository";
import { createSyncRepository } from "@/db/repositories/sync-repository";
import { logEvent, requestContext } from "@/lib/logger";

const callbackSchema = z.object({
  code: z.string().min(1).max(4_096),
  state: z.string().min(20).max(512),
});

function redirectWithClearedState(request: Request, path: string) {
  const response = NextResponse.redirect(new URL(path, request.url));
  response.cookies.delete(oauthStateCookieName("salla"));
  response.headers.set("cache-control", "no-store");
  return response;
}

export async function GET(request: Request) {
  const context = requestContext(request);
  const url = new URL(request.url);
  const parsed = callbackSchema.safeParse({
    code: url.searchParams.get("code"),
    state: url.searchParams.get("state"),
  });
  const cookieStore = await cookies();
  const expectedState = cookieStore.get(oauthStateCookieName("salla"))?.value;

  if (
    !parsed.success ||
    !expectedState ||
    !verifyOAuthState(parsed.data.state, hashOAuthState(expectedState))
  ) {
    logEvent("warn", "salla_oauth_state_rejected", context);
    return redirectWithClearedState(request, "/setup/connect?error=invalid_oauth_state");
  }

  if (isDemoMode()) {
    return redirectWithClearedState(request, "/setup/sync?provider=salla&connected=1");
  }

  const identity = await getFreshApiIdentity();
  if (!identity) return redirectWithClearedState(request, "/signin?next=/setup/connect");

  try {
    const pending = await getOAuthState({
      state: parsed.data.state,
      userId: identity.userId,
      platform: "salla",
    });
    if (!pending?.storeId) {
      return redirectWithClearedState(request, "/setup/connect?error=invalid_oauth_state");
    }

    const connector = new SallaConnector();
    const tokens = await connector.exchangeCode(parsed.data.code);
    const remoteStore = await connector.getStore({
      storeId: pending.storeId,
      accessToken: tokens.accessToken,
      authorizationToken: tokens.authorizationToken,
      refreshToken: tokens.refreshToken,
    });

    const consumed = await consumeOAuthState({
      state: parsed.data.state,
      userId: identity.userId,
      platform: "salla",
    });
    if (!consumed?.storeId || consumed.storeId !== pending.storeId) {
      return redirectWithClearedState(request, "/setup/connect?error=invalid_oauth_state");
    }

    const connectionId = await upsertPlatformConnection({
      storeId: consumed.storeId,
      platform: "salla",
      externalStoreId: remoteStore.externalId,
      tokens,
    });
    const sync = await createSyncRepository().createOrGetCatalogRun({
      storeId: consumed.storeId,
      connectionId,
      kind: "initial",
      idempotencyKey: `salla-oauth:${hashOAuthState(parsed.data.state)}`,
      requestedByUserId: identity.userId,
    });
    await dispatchCatalogSyncOutbox();
    logEvent("info", "salla_connection_created", {
      ...context,
      storeId: consumed.storeId,
      runId: sync.runId,
    });
    return redirectWithClearedState(
      request,
      `/setup/sync?provider=salla&connected=1&runId=${encodeURIComponent(sync.runId)}`,
    );
  } catch (error) {
    logEvent("error", "salla_oauth_callback_failed", {
      ...context,
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return redirectWithClearedState(request, "/setup/connect?error=salla_connection_failed");
  }
}
