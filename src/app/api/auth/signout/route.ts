import { NextResponse } from "next/server";

import { isDemoMode } from "@/config/env";
import { isSameOrigin } from "@/core/security/request";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }
  if (!isDemoMode()) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut({ scope: "local" });
  }

  const response = NextResponse.redirect(new URL("/signin", request.url), 303);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
