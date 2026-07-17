import { z } from "zod";

import { isSameOrigin } from "@/core/security/request";
import {
  AcquisitionError,
  acquisitionErrorResponse,
} from "@/modules/acquisition";
import { enforceAcquisitionRateLimit } from "@/modules/acquisition/rate-limit";
import {
  generatePaidReportPdf,
  paidReportPdfFilename,
} from "@/modules/reports/report-pdf";
import { authorizeTenantRoute } from "@/modules/reports/route-access";
import { getTenantReportRepository } from "@/modules/reports/tenant-reports";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const identifierSchema = z.string().min(8).max(128).regex(/^[A-Za-z0-9_-]+$/u);

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
    const { identity } = await authorizeTenantRoute(parsedStoreId.data, [
      "owner",
      "admin",
      "analyst",
    ]);
    await enforceAcquisitionRateLimit({
      request,
      namespace: "tenant-report-pdf",
      resource: `${identity.userId}:${parsedStoreId.data}:${parsedReportId.data}`,
      limit: 10,
      windowSeconds: 60 * 60,
    });
    const report = await getTenantReportRepository().get(
      parsedStoreId.data,
      parsedReportId.data,
    );
    if (!report) {
      throw new AcquisitionError("REPORT_NOT_FOUND", 404, "لم يتم العثور على التقرير.");
    }
    const pdf = await generatePaidReportPdf(report);
    const filename = paidReportPdfFilename(report);
    return new Response(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
        "content-length": String(pdf.byteLength),
        "cache-control": "private, no-store, max-age=0",
        "x-content-type-options": "nosniff",
      },
    });
  } catch (error) {
    return acquisitionErrorResponse(error);
  }
}
