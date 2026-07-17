import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { z } from "zod";

import { isDemoMode } from "@/config/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const claimsSchema = z
  .object({
    sub: z.string().uuid(),
    email: z.string().email().optional(),
  })
  .passthrough();

export interface AuthIdentity {
  userId: string;
  email?: string;
  mode: "demo" | "production";
}

const demoIdentity: AuthIdentity = {
  userId: "00000000-0000-4000-8000-000000000001",
  email: "owner@mada-demo.sa",
  mode: "demo",
};

export const getCurrentIdentity = cache(async (): Promise<AuthIdentity | null> => {
  if (isDemoMode()) return demoIdentity;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) return null;

  const parsed = claimsSchema.safeParse(data.claims);
  if (!parsed.success) return null;

  return {
    userId: parsed.data.sub,
    email: parsed.data.email,
    mode: "production",
  };
});

export async function requireIdentity(redirectTo = "/signin") {
  const identity = await getCurrentIdentity();
  if (!identity) redirect(redirectTo);
  return identity;
}

export async function getApiIdentity() {
  return getCurrentIdentity();
}

/** Use for high-impact mutations where immediate server-side revocation matters. */
export async function getFreshApiIdentity(): Promise<AuthIdentity | null> {
  if (isDemoMode()) return demoIdentity;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;

  const parsed = z.string().uuid().safeParse(data.user.id);
  if (!parsed.success) return null;
  return {
    userId: parsed.data,
    email: data.user.email,
    mode: "production",
  };
}
