import { z } from "zod";

import {
  AcquisitionError,
  acquisitionErrorResponse,
  acquisitionJson,
} from "@/modules/acquisition";
import { authorizeTenantRoute } from "@/modules/reports/route-access";
import { getTenantReportRepository } from "@/modules/reports/tenant-reports";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const identifierSchema = z.string().min(8).max(128).regex(/^[A-Za-z0-9_-]+$/u);

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ storeId: string; reportId: string }> },
) {
  try {
    const routeParams = await params;
    const parsedStoreId = identifierSchema.safeParse(routeParams.storeId);
    const parsedReportId = identifierSchema.safeParse(routeParams.reportId);
    if (!parsedStoreId.success || !parsedReportId.success) {
      throw new AcquisitionError("INVALID_REQUEST", 400, "معرّف التقرير غير صالح.");
    }
    await authorizeTenantRoute(parsedStoreId.data);
    const report = await getTenantReportRepository().get(
      parsedStoreId.data,
      parsedReportId.data,
    );
    if (!report) {
      throw new AcquisitionError("REPORT_NOT_FOUND", 404, "لم يتم العثور على التقرير.");
    }
    return acquisitionJson({ report });
  } catch (error) {
    return acquisitionErrorResponse(error);
  }
}
