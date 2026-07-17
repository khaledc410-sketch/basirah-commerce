import { z } from "zod";

import { getFreshApiIdentity } from "@/core/auth/session";
import { getCurrentStoreContext } from "@/core/data/tenant";
import { isSameOrigin } from "@/core/security/request";
import {
  createDraftFromFinding,
  FindingDraftError,
} from "@/db/repositories/content-draft-repository";
import { enforceAcquisitionRateLimit } from "@/modules/acquisition/rate-limit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const routeParamsSchema = z.object({
  storeId: z.string().min(3).max(128),
  findingId: z.string().min(3).max(128),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ storeId: string; findingId: string }> },
) {
  if (!isSameOrigin(request)) {
    return jsonError("INVALID_ORIGIN", "مصدر الطلب غير صالح.", 403);
  }
  const parsedParams = routeParamsSchema.safeParse(await params);
  if (!parsedParams.success) {
    return jsonError("INVALID_REQUEST", "معرّف النتيجة غير صالح.", 400);
  }

  const [identity, store] = await Promise.all([
    getFreshApiIdentity(),
    getCurrentStoreContext(),
  ]);
  if (!identity) return jsonError("AUTHENTICATION_REQUIRED", "يلزم تسجيل الدخول.", 401);
  if (!store || store.storeId !== parsedParams.data.storeId) {
    return jsonError("FINDING_NOT_FOUND", "لم يتم العثور على النتيجة.", 404);
  }
  if (!(["owner", "admin", "analyst"] as const).includes(store.role as "owner" | "admin" | "analyst")) {
    return jsonError("FORBIDDEN", "لا تملك صلاحية إنشاء مسودة من هذه النتيجة.", 403);
  }

  try {
    await enforceAcquisitionRateLimit({
      request,
      namespace: "store-finding-draft",
      resource: `${identity.userId}:${store.storeId}:${parsedParams.data.findingId}`,
      limit: 12,
      windowSeconds: 15 * 60,
    });
    const draft = await createDraftFromFinding(parsedParams.data);
    return Response.json(
      { draft },
      { status: draft.created ? 201 : 200, headers: { "cache-control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof FindingDraftError) {
      return jsonError(error.code, error.publicMessage, error.status);
    }
    return jsonError("DRAFT_UNAVAILABLE", "تعذر إنشاء المسودة الآن.", 500);
  }
}

function jsonError(code: string, message: string, status: number) {
  return Response.json(
    { error: { code, message } },
    { status, headers: { "cache-control": "no-store" } },
  );
}
