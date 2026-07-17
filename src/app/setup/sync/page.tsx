import type { Metadata } from "next";

import { SetupPageShell } from "@/components/setup/setup-page-shell";
import { SyncProgress } from "@/components/setup/sync-progress";
import { isDemoMode } from "@/config/env";
import { requireStoreContext } from "@/core/data/tenant";

export const metadata: Metadata = { title: "مزامنة المتجر" };

export default async function SyncPage({
  searchParams,
}: {
  searchParams: Promise<{ runId?: string }>;
}) {
  const demo = isDemoMode();
  if (!demo) await requireStoreContext();
  const { runId } = await searchParams;
  return <SetupPageShell currentStep={3} label="قراءة بيانات المتجر والمنتجات والفئات مع حالة فعلية لكل مرحلة."><SyncProgress initialRunId={runId} mode={demo ? "demo" : "production"} /></SetupPageShell>;
}
