import { and, eq, isNull, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";
import { z } from "zod";

import { isDemoMode } from "@/config/env";
import { getFreshApiIdentity } from "@/core/auth/session";
import { acceptsJson, isSameOrigin } from "@/core/security/request";
import { getDb } from "@/db/client";
import {
  organizationMembers,
  organizations,
  storeMembers,
  stores,
} from "@/db/schema";

const requestSchema = z.object({
  workspaceName: z.string().trim().min(2).max(80),
  teamSize: z.enum(["1-3", "4-10", "11+", "agency"]),
});

export async function POST(request: Request) {
  if (!isSameOrigin(request) || !acceptsJson(request)) {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "تحقق من اسم المساحة وحجم الفريق." }, { status: 400 });
  }

  if (isDemoMode()) {
    return workspaceResponse(
      { ok: true, storeId: "store_mada_demo", mode: "demo" },
      "store_mada_demo",
      201,
    );
  }

  const identity = await getFreshApiIdentity();
  if (!identity) return Response.json({ error: "Unauthenticated." }, { status: 401 });
  if (!identity.email) {
    return Response.json({ error: "Verified email is required." }, { status: 422 });
  }

  const created = await getDb().transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${identity.userId}, 0))`);

    const [existing] = await tx
      .select({ storeId: storeMembers.storeId })
      .from(storeMembers)
      .innerJoin(stores, eq(stores.id, storeMembers.storeId))
      .where(
        and(
          eq(storeMembers.userId, identity.userId),
          isNull(storeMembers.disabledAt),
          isNull(stores.archivedAt),
        ),
      )
      .limit(1);
    if (existing) return { id: existing.storeId, existing: true };

    const [organization] = await tx
      .insert(organizations)
      .values({
        name: parsed.data.workspaceName,
        slug: `org-${nanoid(12).toLowerCase()}`,
      })
      .returning({ id: organizations.id });

    await tx.insert(organizationMembers).values({
      organizationId: organization.id,
      userId: identity.userId,
      role: "owner",
    });

    const [store] = await tx
      .insert(stores)
      .values({
        organizationId: organization.id,
        name: parsed.data.workspaceName,
        runtimeMode: "live",
        status: "onboarding",
      })
      .returning({ id: stores.id });

    await tx.insert(storeMembers).values({
      storeId: store.id,
      userId: identity.userId,
      role: "owner",
    });

    return { id: store.id, existing: false };
  });

  return workspaceResponse(
    { ok: true, storeId: created.id, mode: "production", existing: created.existing },
    created.id,
    created.existing ? 200 : 201,
  );
}

function workspaceResponse(body: unknown, storeId: string, status: number) {
  const response = NextResponse.json(body, { status });
  response.cookies.set("basirah_active_store", storeId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
