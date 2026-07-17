import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowUpLeft,
  CheckCircle2,
  Circle,
  CircleAlert,
  Clock3,
  FileChartColumn,
  FilePenLine,
  ListChecks,
  RotateCcw,
} from "lucide-react";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductionFeatureState } from "@/components/dashboard/production-feature-state";
import { isDemoMode } from "@/config/env";

export const metadata: Metadata = { title: "خطة التحسين" };

const phases = [
  {
    range: "اليوم 1–30",
    title: "وضوح الأساس",
    outcome: "كيان واضح وحقائق منتجات موثّقة ومفيدة.",
    tasks: [
      { title: "توسيع صفحة العلامة بمعلومات موثقة", category: "وضوح الكيان", status: "open", impact: "مرتفع", effort: "متوسط" },
      { title: "توثيق حقائق 9 منتجات ذات أولوية", category: "المحتوى", status: "draft", impact: "مرتفع", effort: "متوسط" },
      { title: "توحيد canonical في صفحتي المنتج", category: "تقني", status: "completed", impact: "متوسط", effort: "منخفض" },
      { title: "إضافة تواريخ تحديث لمصادر الحقائق", category: "الثقة", status: "completed", impact: "متوسط", effort: "منخفض" },
    ],
  },
  {
    range: "اليوم 31–60",
    title: "إجابات ومحتوى موثّق",
    outcome: "إجابات مباشرة عن أسئلة الشراء دون ادعاءات جديدة.",
    tasks: [
      { title: "إنشاء إجابات استخدام لأعلى 6 أسئلة", category: "قابلية الإجابة", status: "draft", impact: "مرتفع", effort: "متوسط" },
      { title: "تحسين Product schema للحقائق المؤكدة", category: "بيانات منظمة", status: "open", impact: "مرتفع", effort: "متوسط" },
      { title: "إنشاء صفحة مقارنة واحدة مدعومة بالمصادر", category: "المحتوى", status: "open", impact: "متوسط", effort: "مرتفع" },
      { title: "ربط صفحات السياسات بصفحات المنتجات", category: "الثقة", status: "completed", impact: "متوسط", effort: "منخفض" },
    ],
  },
  {
    range: "اليوم 61–90",
    title: "قياس وتكرار",
    outcome: "إعادة فحص موثقة وتحديد التغير دون استنتاج سببية زائفة.",
    tasks: [
      { title: "إعادة فحص الصفحات العشر نفسها", category: "القياس", status: "open", impact: "مرتفع", effort: "منخفض" },
      { title: "مراجعة عينة الظهور بمنهج ثابت", category: "القياس", status: "open", impact: "متوسط", effort: "متوسط" },
      { title: "تحويل أسئلة وكيل المبيعات إلى فرص محتوى", category: "حلقة النمو", status: "draft", impact: "متوسط", effort: "متوسط" },
      { title: "مقارنة التقرير وحفظ تفسير التغير", category: "التقرير", status: "completed", impact: "متوسط", effort: "منخفض" },
    ],
  },
] as const;

const statusDetails = {
  open: { label: "مفتوح", icon: CircleAlert, className: "bg-warning-soft text-warning hover:bg-warning-soft" },
  draft: { label: "مسودة", icon: FilePenLine, className: "bg-primary/10 text-primary hover:bg-primary/10" },
  completed: { label: "مكتمل", icon: CheckCircle2, className: "bg-success-soft text-success hover:bg-success-soft" },
} as const;

export default function FixPlanPage() {
  if (!isDemoMode()) return <ProductionFeatureState title="لا توجد خطة تحسين حية" description="خطة العرض لا تُنسب إلى متجر العميل. أنشئ تقريرًا حقيقيًا قبل توليد إجراءات 30 / 60 / 90 يومًا." />;
  return (
    <>
      <DashboardHeader
        actions={<Button asChild className="min-h-11" variant="outline"><Link href="/dashboard/reports/latest"><FileChartColumn />العودة إلى التقرير</Link></Button>}
        description="خطة 30 / 60 / 90 يومًا تبدأ بالأثر الأعلى، وتربط كل إجراء بنتيجة التقرير وصاحب عمل واضح."
        showDateRange={false}
        title="خطة التحسين"
      />
      <div className="mx-auto max-w-[1440px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <section aria-labelledby="plan-progress-heading" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "التقدم الكلي", value: "42٪", detail: "5 من 12 إجراءً", icon: ListChecks },
            { label: "أولوية هذا الأسبوع", value: "3", detail: "إجراءات عالية الأثر", icon: CircleAlert },
            { label: "مسودات للمراجعة", value: "3", detail: "لا شيء منشور تلقائيًا", icon: FilePenLine },
            { label: "إعادة الفحص", value: "20 يومًا", detail: "بعد توثيق الإصلاحات", icon: RotateCcw },
          ].map((metric, index) => (
            <Card key={metric.label}>
              <CardContent className="p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-sm text-muted-foreground" id={index === 0 ? "plan-progress-heading" : undefined}>{metric.label}</p><p className="metric-numbers mt-1 text-2xl font-semibold">{metric.value}</p><p className="mt-1 text-xs text-muted-foreground">{metric.detail}</p></div><span className="flex size-10 items-center justify-center rounded-xl bg-muted text-primary"><metric.icon aria-hidden="true" className="size-5" /></span></div></CardContent>
            </Card>
          ))}
        </section>

        <section aria-labelledby="next-actions-heading">
          <Card className="border-primary/20">
            <CardHeader className="border-b bg-primary/[0.035]"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-medium text-primary">ابدأ من هنا</p><CardTitle className="mt-1 text-xl" id="next-actions-heading">الإجراءات الثلاثة التالية</CardTitle></div><Badge variant="outline">مرتبة بالأثر والثقة والجهد</Badge></div></CardHeader>
            <CardContent className="grid gap-4 p-5 lg:grid-cols-3">
              {[
                { number: "01", title: "وضّح صفحة العلامة", detail: "اجمع حقائق العلامة وموقعها وتخصصها وسياساتها في تعريف واحد موثق.", meta: "أثر مرتفع · جهد متوسط", href: "/dashboard/visibility/content" },
                { number: "02", title: "راجع حقائق 9 منتجات", detail: "أثبت المكونات والاستخدام بمصدر قبل تحويلها إلى محتوى أو schema.", meta: "أثر مرتفع · جهد متوسط", href: "/dashboard/visibility/content" },
                { number: "03", title: "تحقق من canonical", detail: "راجع الصفحتين بعد الإصلاح وسجل العنوان النهائي والدليل الجديد.", meta: "أثر متوسط · جهد منخفض", href: "/dashboard/reports/latest" },
              ].map((action) => (
                <div className="rounded-xl border bg-card p-5" key={action.number}><span className="metric-numbers text-sm font-semibold text-primary">{action.number}</span><h3 className="mt-3 font-semibold">{action.title}</h3><p className="mt-2 text-sm text-muted-foreground">{action.detail}</p><p className="mt-4 text-xs text-muted-foreground">{action.meta}</p><Button asChild className="mt-4 min-h-11 w-full" variant="outline"><Link href={action.href}>ابدأ الإجراء<ArrowUpLeft /></Link></Button></div>
              ))}
            </CardContent>
          </Card>
        </section>

        <section aria-labelledby="roadmap-heading">
          <div className="mb-3"><h2 className="text-xl font-semibold" id="roadmap-heading">خريطة 30 / 60 / 90 يومًا</h2><p className="mt-1 text-sm text-muted-foreground">كل مرحلة لها ناتج قابل للتحقق قبل الانتقال إلى المرحلة التالية.</p></div>
          <div className="grid gap-5 xl:grid-cols-3">
            {phases.map((phase) => (
              <Card key={phase.range}>
                <CardHeader className="border-b"><div className="flex items-center justify-between gap-3"><Badge variant="secondary">{phase.range}</Badge><Clock3 aria-hidden="true" className="size-5 text-muted-foreground" /></div><CardTitle className="mt-3 text-lg">{phase.title}</CardTitle><p className="text-sm text-muted-foreground">{phase.outcome}</p></CardHeader>
                <CardContent className="divide-y p-0">
                  {phase.tasks.map((task) => {
                    const status = statusDetails[task.status];
                    const StatusIcon = status.icon;
                    return (
                      <article className="p-4" key={task.title}>
                        <div className="flex items-start gap-3"><StatusIcon aria-hidden="true" className={`mt-0.5 size-5 shrink-0 ${task.status === "completed" ? "text-success" : task.status === "draft" ? "text-primary" : "text-warning"}`} /><div className="min-w-0 flex-1"><h3 className={task.status === "completed" ? "font-medium text-muted-foreground line-through" : "font-medium"}>{task.title}</h3><div className="mt-2 flex flex-wrap items-center gap-2"><Badge className={status.className}>{status.label}</Badge><span className="text-xs text-muted-foreground">{task.category}</span></div><p className="mt-2 text-xs text-muted-foreground">أثر {task.impact} · جهد {task.effort}</p></div></div>
                      </article>
                    );
                  })}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <div className="flex gap-3 rounded-xl border bg-card p-5 text-sm text-muted-foreground"><Circle aria-hidden="true" className="mt-1 size-4 shrink-0 text-primary" /><p><span className="font-semibold text-foreground">قاعدة الإكمال:</span> لا يصبح الإجراء «مكتملًا» إلا بعد حفظ التغيير ودليله ورابط الصفحة. إعادة الفحص تقيس التغير، لكنها لا تثبت أن الإصلاح سبب ظهورًا في منصة بعينها.</p></div>
      </div>
    </>
  );
}
