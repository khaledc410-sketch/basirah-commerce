import type { Metadata } from "next";

import { MerchantAdvisor } from "@/components/advisor/merchant-advisor";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { ProductionFeatureState } from "@/components/dashboard/production-feature-state";
import { isDemoMode } from "@/config/env";

export const metadata: Metadata = { title: "اسأل بيانات متجرك" };

export default function AdvisorPage() {
  if (!isDemoMode()) return <ProductionFeatureState title="مساعد البيانات غير مفعّل" description="لن نسمح لمساعد نصي بالوصول إلى متجر حي قبل ربط أدوات مقيدة الصلاحيات واختبار سجلات التدقيق." />;
  return (
    <>
      <DashboardHeader description="مساعد أدوات وتحليلات؛ ليس محادثة عامة مع نموذج لغوي." showDateRange={false} title="اسأل بيانات متجرك" />
      <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8"><MerchantAdvisor /></div>
    </>
  );
}
