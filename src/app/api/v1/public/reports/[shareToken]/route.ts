import {
  AcquisitionError,
  acquisitionErrorResponse,
  acquisitionJson,
  getAcquisitionRepository,
  opaqueIdentifierSchema,
} from "@/modules/acquisition";
import { enforceAcquisitionRateLimit } from "@/modules/acquisition/rate-limit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ shareToken: string }> },
) {
  try {
    const parsedToken = opaqueIdentifierSchema.safeParse((await params).shareToken);
    if (!parsedToken.success) {
      throw new AcquisitionError("INVALID_TOKEN", 400, "رابط التقرير غير صالح.");
    }
    await enforceAcquisitionRateLimit({
      request,
      namespace: "public-shared-report",
      resource: parsedToken.data,
      limit: 60,
      windowSeconds: 60 * 60,
    });
    const result = await getAcquisitionRepository().getSharedReport(parsedToken.data);
    if (!result) {
      throw new AcquisitionError(
        "REPORT_NOT_FOUND",
        404,
        "هذا الرابط غير صالح أو انتهت صلاحيته.",
      );
    }
    return acquisitionJson(result, {
      headers: {
        "referrer-policy": "no-referrer",
        "x-robots-tag": "noindex, nofollow, noarchive",
      },
    });
  } catch (error) {
    return acquisitionErrorResponse(error);
  }
}
