import type { ReactNode } from "react";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { isDemoMode } from "@/config/env";
import { requireStoreContext } from "@/core/data/tenant";
import { demoRepository } from "@/core/demo/store";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  if (isDemoMode()) {
    const store = demoRepository.getStore();
    return <DashboardShell mode="demo" storeName={store.name.ar}>{children}</DashboardShell>;
  }
  const store = await requireStoreContext();
  return <DashboardShell mode="production" storeName={store.name}>{children}</DashboardShell>;
}
