import {
  AcquisitionError,
  acquisitionErrorResponse,
  acquisitionJson,
  getAcquisitionRepository,
  opaqueIdentifierSchema,
  readBoundedJson,
  reportOrderRequestSchema,
} from "@/modules/acquisition";
import { enforceAcquisitionRateLimit } from "@/modules/acquisition/rate-limit";
import { isSameOrigin } from "@/core/security/request";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    if (request.headers.get("origin") && !isSameOrigin(request)) {
      throw new AcquisitionError("INVALID_ORIGIN", 403, "مصدر الطلب غير صالح.");
    }
    const parsedIdentifier = opaqueIdentifierSchema.safeParse((await params).id);
    if (!parsedIdentifier.success) {
      throw new AcquisitionError("INVALID_TOKEN", 400, "معرّف التقرير غير صالح.");
    }
    await enforceAcquisitionRateLimit({
      request,
      namespace: "public-report-order",
      resource: parsedIdentifier.data,
      limit: 5,
      windowSeconds: 60 * 60,
    });
    const parsedBody = reportOrderRequestSchema.safeParse(await readBoundedJson(request));
    if (!parsedBody.success) {
      throw new AcquisitionError(
        "INVALID_REQUEST",
        400,
        "تحقق من الاسم والبريد ورقم الجوال.",
      );
    }
    const result = await getAcquisitionRepository().createReportOrder({
      reportIdentifier: parsedIdentifier.data,
      ...parsedBody.data,
    });
    return acquisitionJson(result, { status: 201 });
  } catch (error) {
    return acquisitionErrorResponse(error);
  }
}
