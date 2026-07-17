import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, CircleAlert, Wrench } from "lucide-react";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { calculateStoreReadiness, storeReadinessComponents } from "@/modules/visibility/readiness";
import { ProductionFeatureState } from "@/components/dashboard/production-feature-state";
import { isDemoMode } from "@/config/env";

export const metadata: Metadata = { title: "جاهزية المتجر للظهور" };

export default function ReadinessPage() {
  if (!isDemoMode()) return <ProductionFeatureState title="تدقيق الجاهزية غير متاح لهذه المساحة" description="الدرجة الحالية مبنية على بيانات العرض. شغّل فحصًا حقيقيًا واحفظ أدلته قبل إظهار أي نتيجة لعميل." />;
  const total = calculateStoreReadiness();
  return (
    <>
      <DashboardHeader actions={<Button asChild variant="outline"><Link href="/dashboard/visibility"><ArrowRight />الظهور</Link></Button>} description="درجة مركّبة موثّقة من فحوص تقنية ومحتوى وكيان وثقة. الأوزان ظاهرة وقابلة للتطوير." title="تدقيق جاهزية المتجر للظهور" />
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6 lg:px-8"><Card><CardContent className="grid gap-6 p-6 md:grid-cols-[220px_1fr] md:items-center"><div className="mx-auto flex size-44 flex-col items-center justify-center rounded-full border-[14px] border-primary/15"><span className="metric-numbers text-5xl font-semibold text-primary">{total}</span><span className="text-sm text-muted-foreground">من 100</span></div><div><Badge>الإصدار site-readiness-v2</Badge><h2 className="mt-4 text-2xl font-semibold">الأساس جيد، لكن الثقة الخارجية والمصادر تحتاج عملًا</h2><p className="mt-3 text-muted-foreground">تحسن النتيجة يوضح أن صفحاتك أصبحت أوضح فنيًا ومحتوىً؛ لا يعني أن منصة معينة ستعرضها أو تستشهد بها.</p><div className="mt-5 flex gap-3 rounded-xl bg-warning-soft p-4 text-sm"><CircleAlert className="size-5 shrink-0 text-warning" /><p>الظهور الفعلي والاستشهادات يُقاسان في سجلات منفصلة بطريقة تحقق وتاريخ وبلد ولغة.</p></div></div></CardContent></Card>
        <section className="space-y-4">{storeReadinessComponents.map((component) => <Card key={component.key}><CardContent className="p-5 sm:p-6"><div className="grid gap-5 sm:grid-cols-[110px_1fr_auto] sm:items-start"><div><p className="metric-numbers text-3xl font-semibold">{component.score}</p><p className="text-xs text-muted-foreground">الوزن {component.weight}٪</p></div><div><h2 className="font-semibold">{component.label}</h2><p className="mt-2 text-sm text-muted-foreground"><span className="font-medium text-foreground">الدليل:</span> {component.evidence}</p><p className="mt-2 text-sm text-primary"><span className="font-semibold">الإصلاح:</span> {component.recommendation}</p></div><Badge className="w-fit" variant={component.score >= 80 ? "secondary" : "outline"}>{component.score >= 80 ? <CheckCircle2 className="size-3" /> : <Wrench className="size-3" />}{component.score >= 80 ? "جيد" : "يحتاج تحسين"}</Badge></div></CardContent></Card>)}</section>
      </div>
    </>
  );
}
