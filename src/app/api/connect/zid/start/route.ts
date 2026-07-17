import { randomBytes } from "node:crypto";

import { NextResponse } from "next/server";

import { isDemoMode } from "@/config/env";
import { oauthStateCookieName } from "@/core/security/oauth-state";

export async function GET(request: Request) {
  if (!isDemoMode()) {
    return NextResponse.redirect(new URL("/setup/connect?error=zid_not_available", request.url));
  }
  const state = randomBytes(32).toString("base64url");
  const authorizationUrl = new URL(`/api/oauth/zid/callback?code=demo-code&state=${state}`, request.url).toString();
  const response = NextResponse.redirect(authorizationUrl);
  response.cookies.set(oauthStateCookieName("zid"), state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 10 * 60,
    path: "/",
  });
  return response;
}
