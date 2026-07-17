import { getScan } from "@/modules/visibility/scanner";

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

  return Response.json(
    {
      scan: {
        token: record.token,
        status: record.status,
        progress: record.progress,
        currentStep: record.currentStep,
        ...(record.error ? { error: record.error } : {}),
      },
    },
    { headers: { "cache-control": "no-store" } },
  );
}
