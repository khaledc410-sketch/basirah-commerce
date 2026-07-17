import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { isDemoMode } from "@/config/env";
import { hashOAuthState, oauthStateCookieName, verifyOAuthState } from "@/core/security/oauth-state";

const callbackSchema = z.object({
  code: z.string().min(1),
  state: z.string().min(20),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = callbackSchema.safeParse({
    code: url.searchParams.get("code"),
    state: url.searchParams.get("state"),
  });
  const cookieStore = await cookies();
  const cookieName = oauthStateCookieName("zid");
  const expectedState = cookieStore.get(cookieName)?.value;

  if (
    !parsed.success ||
    !expectedState ||
    !verifyOAuthState(parsed.data.state, hashOAuthState(expectedState))
  ) {
    return NextResponse.redirect(new URL("/setup/connect?error=invalid_oauth_state", request.url));
  }

  const response = isDemoMode()
    ? NextResponse.redirect(new URL("/setup/sync?provider=zid&connected=1", request.url))
    : NextResponse.redirect(new URL("/setup/connect?error=production_persistence_required", request.url));
  response.cookies.delete(cookieName);
  return response;
}
