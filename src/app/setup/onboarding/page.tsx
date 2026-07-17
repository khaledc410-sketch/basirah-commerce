import { ArrowLeft, CheckCircle2, CircleAlert, PackageCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { OnboardingWizard } from "@/components/setup/onboarding-wizard";
import { SetupPageShell } from "@/components/setup/setup-page-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isDemoMode } from "@/config/env";
import { getLiveCatalogSummary } from "@/core/data/catalog";
import { requireStoreContext } from "@/core/data/tenant";
import { formatNumber } from "@/lib/format";

export const metadata: Metadata = { title: "اكتمال الإعداد" };

export default async function OnboardingPage() {
  if (isDemoMode()) {
    return <SetupPageShell currentStep={4} label="ست خطوات تجريبية لاستعراض إعدادات المستشار."><OnboardingWizard /></SetupPageShell>;
  }

  const store = await requireStoreContext();
  const summary = await getLiveCatalogSummary(store.storeId);
  return (
    <SetupPageShell currentStep={4} label="اكتمل اتصال البيانات. الميزات التالية لا تُفعّل إلا بعد توفر مصدر حقيقي لها.">
      <div className="mx-auto grid max-w-4xl gap-5 md:grid-cols-2">
        <Card className="border-success/30"><CardHeader><CheckCircle2 className="size-9 text-success" /><CardTitle className="mt-3">الكتالوج جاهز</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">تم حفظ {formatNumber(summary.total)} منتجًا من مساحة المتجر المعزولة، منها {formatNumber(summary.available)} متاحًا للبيع.</p><Button asChild className="mt-5 w-full"><Link href="/dashboard/products"><PackageCheck />مراجعة المنتجات<ArrowLeft /></Link></Button></CardContent></Card>
        <Card><CardHeader><CircleAlert className="size-9 text-warning" /><CardTitle className="mt-3">المستشار غير منشور</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">لن نعرض اختبارات أو إعدادات افتراضية على أنها حية. النشر يحتاج قواعد علامتك ومصادر السياسات واختبار سلامة منفصلًا.</p><Button asChild className="mt-5 w-full" variant="outline"><Link href="/dashboard">فتح لوحة البيانات<ArrowLeft /></Link></Button></CardContent></Card>
      </div>
    </SetupPageShell>
  );
}
