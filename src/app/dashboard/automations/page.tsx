import type { Metadata } from "next";

import { AutomationList } from "@/components/automations/automation-list";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { ProductionFeatureState } from "@/components/dashboard/production-feature-state";
import { isDemoMode } from "@/config/env";

export const metadata: Metadata = { title: "الأتمتة" };

export default function AutomationsPage() {
  if (!isDemoMode()) return <ProductionFeatureState title="الأتمتة غير مفعّلة" description="لا توجد مهام نشر أو تعديل حية. تشغيل الأتمتة ينتظر موافقات واضحة وسجل تدقيق واسترجاعًا مختبرًا." />;
  return <><DashboardHeader description="قراءة وتجميع ومسودات مضبوطة. لا سعر ولا سياسة ولا ادعاء يُنشر تلقائيًا." title="الأتمتة" /><div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8"><AutomationList /></div></>;
}
