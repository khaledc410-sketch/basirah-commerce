import { getServerEnv } from "@/config/env";
import {
  AcquisitionError,
  acquisitionErrorResponse,
  getAcquisitionRepository,
  opaqueIdentifierSchema,
} from "@/modules/acquisition";
import { enforceAcquisitionRateLimit } from "@/modules/acquisition/rate-limit";
import { logEvent } from "@/lib/logger";
import {
  freeReportPdfFilename,
  generateFreeReportPdf,
} from "@/modules/reports/free-report-pdf";

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
      namespace: "public-report-pdf",
      resource: parsedToken.data,
      limit: 10,
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
    if (result.accessLevel !== "full") {
      throw new AcquisitionError(
        "REPORT_LOCKED",
        403,
        "أدخل بريدك في نتيجة الفحص لفتح التقرير المجاني الكامل.",
      );
    }

    const locale = new URL(request.url).searchParams.get("locale") === "en" ? "en" : "ar";
    const appUrl = getServerEnv().APP_URL;
    const reportUrl = new URL(
      `/${locale}/report/${encodeURIComponent(parsedToken.data)}`,
      appUrl,
    ).toString();
    const pricingUrl = new URL(`/${locale}/pricing`, appUrl).toString();
    const pdf = await generateFreeReportPdf({
      result,
      locale,
      reportUrl,
      pricingUrl,
    });
    const filename = freeReportPdfFilename(result.report.domain);

    return new Response(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
        "content-length": String(pdf.byteLength),
        "cache-control": "private, no-store, max-age=0",
        "referrer-policy": "no-referrer",
        "x-content-type-options": "nosniff",
        "x-robots-tag": "noindex, nofollow, noarchive",
      },
    });
  } catch (error) {
    if (!(error instanceof AcquisitionError)) {
      logEvent("error", "public_report_pdf_failed", {
        errorName: error instanceof Error ? error.name : "UnknownError",
        errorMessage: error instanceof Error ? error.message.slice(0, 500) : "Unknown error",
      });
    }
    return acquisitionErrorResponse(error);
  }
}
