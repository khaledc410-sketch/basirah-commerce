import { randomBytes } from "node:crypto";

import { NextResponse } from "next/server";

import { getServerEnv, isDemoMode } from "@/config/env";
import { getFreshApiIdentity } from "@/core/auth/session";
import { SallaConnector } from "@/core/commerce/salla-connector";
import { requireStoreRole } from "@/core/data/tenant";
import { oauthStateCookieName } from "@/core/security/oauth-state";
import { enforceRateLimit } from "@/core/security/rate-limit";
import { isSameOrigin } from "@/core/security/request";
import { createOAuthState } from "@/db/repositories/platform-connection-repository";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }
  const state = randomBytes(32).toString("base64url");
  if (isDemoMode()) {
    const response = NextResponse.redirect(
        new URL(`/api/oauth/salla/callback?code=demo-code&state=${state}`, request.url),
        303,
      );
    response.cookies.set(oauthStateCookieName("salla"), state, oauthCookieOptions());
    return response;
  }

  const identity = await getFreshApiIdentity();
  if (!identity) {
    return NextResponse.redirect(new URL("/signin?next=/setup/connect", request.url), 303);
  }
  const limit = await enforceRateLimit({
    namespace: "salla-connect",
    identifier: identity.userId,
    limit: 10,
    windowSeconds: 15 * 60,
  });
  if (!limit.allowed) {
    return NextResponse.redirect(new URL("/setup/connect?error=too_many_attempts", request.url), 303);
  }
  const store = await requireStoreRole(["owner", "admin"]);
  const auth = await new SallaConnector().authorize(state);
  const response = NextResponse.redirect(auth.authorizationUrl, 303);
  if (auth.flow === "oauth_callback") {
    const redirectUri = getServerEnv().SALLA_REDIRECT_URI;
    if (!redirectUri) {
      return NextResponse.redirect(new URL("/setup/connect?error=salla_configuration", request.url), 303);
    }
    await createOAuthState({
      organizationId: store.organizationId,
      storeId: store.storeId,
      userId: identity.userId,
      platform: "salla",
      state,
      redirectUri,
    });
    response.cookies.set(oauthStateCookieName("salla"), state, oauthCookieOptions());
  }
  return response;
}

function oauthCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    maxAge: 10 * 60,
    path: "/",
  };
}
