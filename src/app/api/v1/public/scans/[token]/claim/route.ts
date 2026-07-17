import { getFreshApiIdentity } from "@/core/auth/session";
import { getCurrentStoreContext } from "@/core/data/tenant";
import { isSameOrigin } from "@/core/security/request";
import {
  AcquisitionError,
  acquisitionErrorResponse,
  acquisitionJson,
  claimRequestSchema,
  getAcquisitionRepository,
  opaqueIdentifierSchema,
  readBoundedJson,
} from "@/modules/acquisition";
import { enforceAcquisitionRateLimit } from "@/modules/acquisition/rate-limit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    if (!isSameOrigin(request)) {
      throw new AcquisitionError("INVALID_ORIGIN", 403, "مصدر الطلب غير صالح.");
    }
    const parsedToken = opaqueIdentifierSchema.safeParse((await params).token);
    if (!parsedToken.success) {
      throw new AcquisitionError("INVALID_TOKEN", 400, "رمز الفحص غير صالح.");
    }
    const hasBody = request.body !== null && request.headers.get("content-length") !== "0";
    const parsedBody = claimRequestSchema.safeParse(
      hasBody ? await readBoundedJson(request, 1_024) : {},
    );
    if (!parsedBody.success) {
      throw new AcquisitionError("INVALID_REQUEST", 400, "بيانات المطالبة غير صالحة.");
    }

    const identity = await getFreshApiIdentity();
    if (!identity) {
      throw new AcquisitionError(
        "AUTHENTICATION_REQUIRED",
        401,
        "سجل الدخول قبل المطالبة بالفحص.",
      );
    }
    const store = await getCurrentStoreContext();
    if (!store) {
      throw new AcquisitionError("STORE_REQUIRED", 409, "أنشئ مساحة متجر قبل المطالبة بالفحص.");
    }
    await enforceAcquisitionRateLimit({
      request,
      namespace: "public-scan-claim",
      resource: `${identity.userId}:${store.storeId}:${parsedToken.data}`,
      limit: 10,
      windowSeconds: 15 * 60,
    });
    const result = await getAcquisitionRepository().claimScan({
      scanToken: parsedToken.data,
      userId: identity.userId,
      storeId: store.storeId,
    });
    return acquisitionJson(result);
  } catch (error) {
    return acquisitionErrorResponse(error);
  }
}
