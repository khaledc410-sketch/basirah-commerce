import { getScan } from "@/modules/visibility/scanner";
import { recordProductEvent } from "@/lib/telemetry/record";
import { telemetryOpaqueId } from "@/lib/telemetry/opaque-id";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const record = await getScan(token);
  if (!record) {
    return Response.json(
      { error: { code: "SCAN_NOT_FOUND", message: "لم يعد هذا الفحص متاحًا." } },
      { status: 404, headers: { "cache-control": "no-store" } },
    );
  }
  if (record.status === "failed") {
    return Response.json(
      { scan: { token, status: record.status, progress: record.progress }, error: record.error },
      { status: 409, headers: { "cache-control": "no-store" } },
    );
  }
  if (record.status !== "completed" || !record.report) {
    return Response.json(
      { scan: { token, status: record.status, progress: record.progress, currentStep: record.currentStep } },
      { status: 202, headers: { "cache-control": "no-store", "retry-after": "2" } },
    );
  }

  const report = record.report;
  recordProductEvent({
    type: "report_preview_viewed",
    source: "public_checker",
    scanId: telemetryOpaqueId("scan", token),
    readinessScore: report.score,
    coveragePercent: report.coverage,
  });
  return Response.json(
    {
      report: {
        domain: report.domain,
        score: report.score,
        coverage: report.coverage,
        confidence: report.confidence,
        components: report.components,
        findings: report.findings.slice(0, 3),
        limitations: report.limitations,
        scannedAt: report.scannedAt,
      },
    },
    { headers: { "cache-control": "no-store" } },
  );
}
