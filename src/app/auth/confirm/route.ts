import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { z } from "zod";

import { safeInternalPath } from "@/core/security/request";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const confirmSchema = z.object({
  token_hash: z.string().min(20).max(2_000),
  type: z.enum(["signup", "invite", "magiclink", "recovery", "email"]),
  next: z.string().max(300).optional(),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = confirmSchema.safeParse({
    token_hash: url.searchParams.get("token_hash"),
    type: url.searchParams.get("type"),
    next: url.searchParams.get("next") ?? undefined,
  });
  if (!parsed.success) return authError(request);

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.verifyOtp({
    token_hash: parsed.data.token_hash,
    type: parsed.data.type as EmailOtpType,
  });
  if (error) return authError(request);

  const next = safeInternalPath(parsed.data.next) ?? "/setup/workspace";
  const response = NextResponse.redirect(new URL(next, request.url));
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

function authError(request: Request) {
  const response = NextResponse.redirect(new URL("/signin?error=verification_failed", request.url));
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
