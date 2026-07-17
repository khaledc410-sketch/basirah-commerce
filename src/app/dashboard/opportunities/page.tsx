import type { Metadata } from "next";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { ProductionFeatureState } from "@/components/dashboard/production-feature-state";
import { OpportunityList } from "@/components/opportunities/opportunity-list";
import { Badge } from "@/components/ui/badge";
import { isDemoMode } from "@/config/env";
import { demoRepository } from "@/core/demo/store";

export const metadata: Metadata = { title: "الفرص" };

export default function OpportunitiesPage() {
  if (!isDemoMode()) {
    return <ProductionFeatureState title="لا توجد فرص موثقة بعد" description="يبدأ محرك الفرص بعد مزامنة الكتالوج وتراكم أدلة حقيقية من صفحات المتجر والمحادثات." />;
  }
  const opportunities = demoRepository.listOpportunities();
  return (
    <>
      <DashboardHeader actions={<Badge className="h-10 px-4">{opportunities.length} فرص مفتوحة</Badge>} description="كل فرصة تربط الدليل بالأثر والثقة والمسودة. لا موافقة قبل عرض التغيير." title="فرص قابلة للتنفيذ" />
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8"><OpportunityList opportunities={opportunities} /></div>
    </>
  );
}
