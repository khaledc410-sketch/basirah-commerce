import { NextResponse } from "next/server";
import { z } from "zod";

import { getServerEnv, isDemoMode } from "@/config/env";
import { clientAddress, enforceRateLimit } from "@/core/security/rate-limit";
import { acceptsJson, isSameOrigin, safeInternalPath } from "@/core/security/request";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const requestSchema = z.object({
  email: z.string().trim().email().max(254),
  next: z.string().max(2_000).optional(),
});

export async function POST(request: Request) {
  if (!isSameOrigin(request) || !acceptsJson(request)) {
    return noStoreJson({ error: "طلب غير صالح." }, { status: 400 });
  }
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "اكتب بريدًا إلكترونيًا صحيحًا." }, { status: 400 });
  }

  if (isDemoMode()) {
    return noStoreJson({
      ok: true,
      redirectTo: safeInternalPath(parsed.data.next) ?? "/setup/workspace",
      mode: "demo",
    });
  }

  const rateLimit = await enforceRateLimit({
    namespace: "auth:magic-link",
    identifier: `${clientAddress(request)}:${parsed.data.email.toLowerCase()}`,
    limit: 5,
    windowSeconds: 15 * 60,
  });
  if (!rateLimit.allowed) {
    return noStoreJson(
      { error: "محاولات كثيرة. انتظر قليلًا ثم حاول مجددًا." },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
      },
    );
  }

  const env = getServerEnv();
  const callbackUrl = new URL("/auth/callback", env.APP_URL);
  callbackUrl.searchParams.set("next", safeInternalPath(parsed.data.next) ?? "/setup/workspace");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      emailRedirectTo: callbackUrl.toString(),
      shouldCreateUser: true,
    },
  });

  if (error) {
    // Avoid exposing provider/account details to unauthenticated callers.
    return noStoreJson(
      { error: "تعذر إرسال رابط الدخول الآن. حاول لاحقًا." },
      { status: error.status === 429 ? 429 : 502 },
    );
  }

  return noStoreJson({ ok: true, mode: "production" });
}

function noStoreJson(body: unknown, init?: ResponseInit) {
  const response = NextResponse.json(body, init);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
