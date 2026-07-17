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

const storeIdSchema = z.string().min(8).max(128).regex(/^[A-Za-z0-9_-]+$/u);
const limitSchema = z.coerce.number().int().min(1).max(100).default(50);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ storeId: string }> },
) {
  try {
    const parsedStoreId = storeIdSchema.safeParse((await params).storeId);
    if (!parsedStoreId.success) {
      throw new AcquisitionError("INVALID_REQUEST", 400, "معرّف المتجر غير صالح.");
    }
    const parsedLimit = limitSchema.safeParse(new URL(request.url).searchParams.get("limit") ?? 50);
    if (!parsedLimit.success) {
      throw new AcquisitionError("INVALID_REQUEST", 400, "حد النتائج غير صالح.");
    }
    await authorizeTenantRoute(parsedStoreId.data);
    const reports = await getTenantReportRepository().list(
      parsedStoreId.data,
      parsedLimit.data,
    );
    return acquisitionJson({ reports });
  } catch (error) {
    return acquisitionErrorResponse(error);
  }
}
