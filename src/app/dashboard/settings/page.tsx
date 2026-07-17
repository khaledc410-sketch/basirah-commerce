import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpLeft, Palette } from "lucide-react";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { SettingsPanel } from "@/components/settings/settings-panel";
import { Button } from "@/components/ui/button";
import { ProductionFeatureState } from "@/components/dashboard/production-feature-state";
import { isDemoMode } from "@/config/env";

export const metadata: Metadata = { title: "الإعدادات" };

export default function SettingsPage() {
  if (!isDemoMode()) return <ProductionFeatureState title="إعدادات المستشار غير منشورة" description="اتصال الكتالوج يُدار من مسار الربط والمزامنة. إعدادات الصوت والخصوصية لن تُحفظ محليًا على أنها إنتاجية." />;
  return <><DashboardHeader actions={<Button asChild variant="outline"><Link href="/dashboard/widget"><Palette />تخصيص هوية المستشار<ArrowUpLeft /></Link></Button>} description="المتجر والتكاملات والصوت والسلامة والخصوصية — مع حالات التجربة والإنتاج واضحة." title="الإعدادات" /><div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8"><SettingsPanel /></div></>;
}
