import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpLeft, CheckCircle2, CircleAlert, ExternalLink, Eye, FileSearch, Globe2, Search, ShieldCheck, TrendingUp } from "lucide-react";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { ProductionFeatureState } from "@/components/dashboard/production-feature-state";
import { VisibilityTrend } from "@/components/dashboard/visibility-trend";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isDemoMode } from "@/config/env";
import { demoRepository } from "@/core/demo/store";
import { calculateStoreReadiness } from "@/modules/visibility/readiness";

export const metadata: Metadata = { title: "الظهور بالذكاء الاصطناعي" };

const monitoredQueries = [
  { query: "أفضل سيروم للبشرة الدهنية", platform: "تحقق يدوي", mentioned: true, citations: 1, date: "11 يوليو" },
  { query: "منتجات سعودية للبشرة الحساسة", platform: "تحقق يدوي", mentioned: false, citations: 0, date: "11 يوليو" },
  { query: "غسول لطيف خالي من العطر", platform: "تحقق يدوي", mentioned: true, citations: 2, date: "10 يوليو" },
  { query: "best Saudi skincare products", platform: "غير متاح آليًا", mentioned: false, citations: 0, date: "غير متحقق" },
];

export default function VisibilityPage() {
  if (!isDemoMode()) {
    return <ProductionFeatureState title="قياس الظهور غير مفعّل" description="لن ننشئ نتائج ظهور مصطنعة. يلزم إعداد منهج تحقق ومصادر أدلة معتمدة قبل تشغيل هذا القسم." />;
  }
  const readiness = calculateStoreReadiness();
  const trend = demoRepository.listDailyMetrics().map((item) => ({ date: item.date.slice(5), readiness: item.visibilityReadiness, mentions: item.mentionedQueries }));
  return (
    <>
      <DashboardHeader actions={<div className="flex flex-wrap gap-2"><Button asChild><Link href="/dashboard/visibility/content"><FileSearch />استوديو SEO · وضوح · ثقة</Link></Button><Button disabled variant="outline"><Search />إضافة الاستعلامات في المرحلة 3</Button></div>} description="الجاهزية والظهور الفعلي والاستشهادات قياسات منفصلة، مع طريقة تحقق وحدود لكل نتيجة." title="الظهور بالذكاء الاصطناعي" />
      <div className="mx-auto max-w-[1440px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]"><Card className="overflow-hidden"><CardHeader className="border-b"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-muted-foreground">جاهزية المتجر للظهور</p><CardTitle className="mt-1 text-xl">هل تستطيع الأنظمة فهم الصفحات؟</CardTitle></div><span className="metric-numbers text-4xl font-semibold text-primary">{readiness}/100</span></div></CardHeader><CardContent className="p-6"><div className="h-3 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${readiness}%` }} /></div><p className="mt-4 text-sm text-muted-foreground">تقييم بنية ومحتوى وكيان وثقة وقابلية إجابة. لا يقيس ظهور الاسم فعليًا ولا يضمنه.</p><Button asChild className="mt-5" variant="outline"><Link href="/dashboard/visibility/readiness">عرض التدقيق الكامل<ArrowUpLeft /></Link></Button></CardContent></Card><Card><CardHeader><p className="text-sm font-medium text-muted-foreground">الظهور الفعلي · عرض تجريبي</p><CardTitle className="text-xl">ظهر في 8 من 25 استعلامًا</CardTitle></CardHeader><CardContent><div className="grid grid-cols-3 gap-3"><div className="rounded-xl bg-muted p-3 text-center"><p className="metric-numbers text-xl font-semibold">25</p><p className="text-xs text-muted-foreground">متحقق</p></div><div className="rounded-xl bg-success-soft p-3 text-center"><p className="metric-numbers text-xl font-semibold text-success">8</p><p className="text-xs text-muted-foreground">ظهر</p></div><div className="rounded-xl bg-muted p-3 text-center"><p className="metric-numbers text-xl font-semibold">5</p><p className="text-xs text-muted-foreground">استشهادات</p></div></div><div className="mt-4 flex gap-2 rounded-xl bg-warning-soft p-3 text-xs"><CircleAlert className="size-4 shrink-0 text-warning" /><p>الطريقة: تحقق يدوي مسجّل في العرض. لا توجد ادعاءات بفحص مباشر للمنصات.</p></div></CardContent></Card></div>
        <div className="grid gap-5 xl:grid-cols-[1fr_330px]"><Card><CardHeader><div className="flex items-center justify-between"><div><CardTitle>اتجاه الجاهزية</CardTitle><p className="mt-1 text-sm text-muted-foreground">تحسنت 8 نقاط بعد اكتمال سمات المحتوى التجريبي</p></div><TrendingUp className="size-5 text-success" /></div></CardHeader><CardContent><VisibilityTrend data={trend} /></CardContent></Card><Card><CardHeader><CardTitle>أهم فجوات الجاهزية</CardTitle></CardHeader><CardContent className="space-y-4">{[{ icon: FileSearch, title: "مصادر المكونات", detail: "ورقة واحدة مفقودة" }, { icon: ShieldCheck, title: "صفحة العلامة", detail: "الكيان غير مفصل" }, { icon: Globe2, title: "حضور خارجي", detail: "أدلة محدودة" }].map((gap) => <div className="flex gap-3" key={gap.title}><span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted"><gap.icon className="size-4 text-primary" /></span><div><p className="text-sm font-semibold">{gap.title}</p><p className="text-xs text-muted-foreground">{gap.detail}</p></div></div>)}</CardContent></Card></div>
        <Card><CardHeader><div className="flex items-center justify-between"><div><CardTitle>الاستعلامات المراقبة</CardTitle><p className="mt-1 text-sm text-muted-foreground">المنصة والطريقة والتاريخ والنتيجة منفصلة لكل صف</p></div><Badge variant="outline">4 استعلامات تجريبية</Badge></div></CardHeader><CardContent className="p-0"><div className="hidden grid-cols-[1fr_.6fr_.5fr_.4fr_.4fr] gap-4 border-y bg-muted/40 px-5 py-3 text-xs font-semibold text-muted-foreground md:grid"><span>الاستعلام</span><span>طريقة التحقق</span><span>النتيجة</span><span>المصادر</span><span>التاريخ</span></div>{monitoredQueries.map((item) => <div className="grid gap-3 border-b px-5 py-4 last:border-b-0 md:grid-cols-[1fr_.6fr_.5fr_.4fr_.4fr] md:items-center" key={item.query}><p className="font-medium">{item.query}</p><Badge className="w-fit" variant="outline">{item.platform}</Badge><span className={`flex items-center gap-2 text-sm ${item.mentioned ? "text-success" : "text-muted-foreground"}`}>{item.mentioned ? <CheckCircle2 className="size-4" /> : <Eye className="size-4" />}{item.mentioned ? "ظهر المتجر" : item.date === "غير متحقق" ? "لم يتم التحقق" : "لم يظهر"}</span><span className="text-sm">{item.citations} مصدر</span><span className="text-xs text-muted-foreground">{item.date}</span></div>)}</CardContent></Card>
        <div className="flex items-start gap-3 rounded-xl border bg-card p-5 text-sm text-muted-foreground"><ExternalLink className="mt-0.5 size-5 shrink-0 text-primary" /><p><span className="font-semibold text-foreground">حدود المنهجية:</span> لا نفترض أن كل منصة توفر API مراقبة. النتيجة غير المتاحة تبقى «لم يتم التحقق» ولا تتحول إلى «لم يظهر».</p></div>
      </div>
    </>
  );
}
