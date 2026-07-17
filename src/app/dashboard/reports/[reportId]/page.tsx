import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { TenantReportView } from "@/components/dashboard/tenant-report-view";
import { requireStoreContext } from "@/core/data/tenant";
import { getTenantReportRepository } from "@/modules/reports/tenant-reports";

export const metadata: Metadata = { title: "تقرير الظهور" };
export const dynamic = "force-dynamic";

export default async function TenantReportPage({
  params,
}: {
  params: Promise<{ reportId: string }>;
}) {
  const [{ reportId }, store] = await Promise.all([params, requireStoreContext()]);
  const report = await getTenantReportRepository().get(store.storeId, reportId);
  if (!report) notFound();
  return <TenantReportView report={report} role={store.role} storeId={store.storeId} />;
}
