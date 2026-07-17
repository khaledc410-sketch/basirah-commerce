import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { z } from "zod";

import { isDemoMode } from "@/config/env";
import { getCurrentIdentity } from "@/core/auth/session";
import { demoRepository } from "@/core/demo/store";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type StoreRole = "owner" | "admin" | "analyst" | "support" | "viewer";

export interface StoreContext {
  storeId: string;
  organizationId: string;
  name: string;
  role: StoreRole;
  runtimeMode: "live" | "demo";
}

const membershipSchema = z.object({
  store_id: z.string().uuid(),
  role: z.enum(["owner", "admin", "analyst", "support", "viewer"]),
  stores: z.object({
    id: z.string().uuid(),
    organization_id: z.string().uuid(),
    name: z.string(),
    runtime_mode: z.enum(["live", "demo"]),
    status: z.enum(["onboarding", "active", "suspended", "disconnected", "archived"]),
  }),
});

export const getCurrentStoreContext = cache(async (): Promise<StoreContext | null> => {
  if (isDemoMode()) {
    const store = demoRepository.getStore();
    return {
      storeId: store.id,
      organizationId: "demo-organization",
      name: store.name.ar,
      role: "owner",
      runtimeMode: "demo",
    };
  }

  const identity = await getCurrentIdentity();
  if (!identity) return null;

  const selectedStoreId = (await cookies()).get("basirah_active_store")?.value;
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("store_members")
    .select("store_id, role, stores!inner(id, organization_id, name, runtime_mode, status)")
    .eq("user_id", identity.userId)
    .is("disabled_at", null)
    .not("stores.status", "in", '("suspended","archived")')
    .order("joined_at", { ascending: true })
    .limit(1);
  if (selectedStoreId && z.string().uuid().safeParse(selectedStoreId).success) {
    query = query.eq("store_id", selectedStoreId);
  }

  const { data, error } = await query.maybeSingle();
  if (error || !data) return null;
  const parsed = membershipSchema.safeParse(data);
  if (!parsed.success) return null;

  return {
    storeId: parsed.data.store_id,
    organizationId: parsed.data.stores.organization_id,
    name: parsed.data.stores.name,
    role: parsed.data.role,
    runtimeMode: parsed.data.stores.runtime_mode,
  };
});

export async function requireStoreContext() {
  const context = await getCurrentStoreContext();
  if (!context) redirect("/setup/workspace");
  return context;
}

export async function requireStoreRole(roles: readonly StoreRole[]) {
  const context = await requireStoreContext();
  if (!roles.includes(context.role)) redirect("/dashboard?error=forbidden");
  return context;
}
