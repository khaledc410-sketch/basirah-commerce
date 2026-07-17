import {
  AcquisitionError,
  acquisitionErrorResponse,
  acquisitionJson,
  getAcquisitionRepository,
  leadRequestSchema,
  opaqueIdentifierSchema,
  readBoundedJson,
} from "@/modules/acquisition";
import { enforceAcquisitionRateLimit } from "@/modules/acquisition/rate-limit";
import { isSameOrigin } from "@/core/security/request";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    if (request.headers.get("origin") && !isSameOrigin(request)) {
      throw new AcquisitionError("INVALID_ORIGIN", 403, "مصدر الطلب غير صالح.");
    }
    const parsedToken = opaqueIdentifierSchema.safeParse((await params).token);
    if (!parsedToken.success) {
      throw new AcquisitionError("INVALID_TOKEN", 400, "رمز الفحص غير صالح.");
    }
    await enforceAcquisitionRateLimit({
      request,
      namespace: "public-scan-lead",
      resource: parsedToken.data,
      limit: 10,
      windowSeconds: 60 * 60,
    });
    const parsedBody = leadRequestSchema.safeParse(await readBoundedJson(request));
    if (!parsedBody.success) {
      throw new AcquisitionError("INVALID_REQUEST", 400, "أدخل بريدًا إلكترونيًا صالحًا.");
    }
    const result = await getAcquisitionRepository().saveLead({
      scanToken: parsedToken.data,
      ...parsedBody.data,
    });
    return acquisitionJson(result, { status: 201 });
  } catch (error) {
    return acquisitionErrorResponse(error);
  }
}
