import { z } from "zod";

import { isSameOrigin } from "@/core/security/request";
import {
  AcquisitionError,
  acquisitionErrorResponse,
  acquisitionJson,
  readBoundedJson,
} from "@/modules/acquisition";
import { enforceAcquisitionRateLimit } from "@/modules/acquisition/rate-limit";
import { authorizeTenantRoute } from "@/modules/reports/route-access";
import { getTenantReportRepository } from "@/modules/reports/tenant-reports";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const identifierSchema = z.string().min(8).max(128).regex(/^[A-Za-z0-9_-]+$/u);
const requestSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("create"), locale: z.enum(["ar", "en"]).default("ar") }).strict(),
  z.object({ action: z.literal("revoke") }).strict(),
]);

export async function POST(
  request: Request,
  { params }: { params: Promise<{ storeId: string; reportId: string }> },
) {
  try {
    if (!isSameOrigin(request)) {
      throw new AcquisitionError("INVALID_ORIGIN", 403, "مصدر الطلب غير صالح.");
    }
    const routeParams = await params;
    const parsedStoreId = identifierSchema.safeParse(routeParams.storeId);
    const parsedReportId = identifierSchema.safeParse(routeParams.reportId);
    if (!parsedStoreId.success || !parsedReportId.success) {
      throw new AcquisitionError("INVALID_REQUEST", 400, "معرّف التقرير غير صالح.");
    }
    const { identity } = await authorizeTenantRoute(parsedStoreId.data, ["owner", "admin"]);
    await enforceAcquisitionRateLimit({
      request,
      namespace: "tenant-report-share",
      resource: `${identity.userId}:${parsedStoreId.data}:${parsedReportId.data}`,
      limit: 30,
      windowSeconds: 60 * 60,
    });
    const parsedBody = requestSchema.safeParse(await readBoundedJson(request, 1_024));
    if (!parsedBody.success) {
      throw new AcquisitionError("INVALID_REQUEST", 400, "إجراء المشاركة غير صالح.");
    }
    const repository = getTenantReportRepository();
    const result =
      parsedBody.data.action === "create"
        ? await repository.createShare(
            parsedStoreId.data,
            parsedReportId.data,
            parsedBody.data.locale,
          )
        : await repository.revokeShare(parsedStoreId.data, parsedReportId.data);
    return acquisitionJson(result);
  } catch (error) {
    return acquisitionErrorResponse(error);
  }
}
