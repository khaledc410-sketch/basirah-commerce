import { NextResponse } from "next/server";
import { z } from "zod";

import { safeInternalPath } from "@/core/security/request";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const callbackSchema = z.object({
  code: z.string().min(20).max(2_000),
  next: z.string().max(300).optional(),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = callbackSchema.safeParse({
    code: url.searchParams.get("code"),
    next: url.searchParams.get("next") ?? undefined,
  });

  if (!parsed.success) return authError(request, "invalid_callback");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(parsed.data.code);
  if (error) return authError(request, "session_exchange_failed");

  const nextPath = safeInternalPath(parsed.data.next) ?? "/setup/workspace";
  const response = NextResponse.redirect(new URL(nextPath, request.url));
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

function authError(request: Request, code: string) {
  const response = NextResponse.redirect(new URL(`/signin?error=${code}`, request.url));
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
