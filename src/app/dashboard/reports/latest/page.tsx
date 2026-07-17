import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowUpLeft,
  CheckCircle2,
  CircleAlert,
  ExternalLink,
  FilePenLine,
  Info,
  ListChecks,
  MessageCircleQuestion,
} from "lucide-react";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { ReportPrintButton } from "@/components/dashboard/report-print-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { calculateStoreReadiness, storeReadinessComponents } from "@/modules/visibility/readiness";
import { ProductionFeatureState } from "@/components/dashboard/production-feature-state";
import { isDemoMode } from "@/config/env";

export const metadata: Metadata = { title: "التقرير العربي المتعمق" };

const findings = [
  {
    id: "demo-finding-brand-entity",
    severity: "عالية",
    confidence: "94٪",
    title: "صفحة العلامة لا تبني كيانًا واضحًا",
    evidence: "صفحة /about تتضمن وصفًا عامًا من 47 كلمة دون موقع العمل أو تخصص المتجر أو مصادر الثقة.",
    fix: "اكتب تعريفًا واقعيًا موثقًا يربط الاسم والتخصص والموقع وسياسات الثقة.",
    owner: "المحتوى",
  },
  {
    id: "demo-finding-product-facts",
    severity: "عالية",
    confidence: "91٪",
    title: "حقائق 9 منتجات غير منظمة",
    evidence: "المكونات وطريقة الاستخدام موجودة كنص حر في 9 من 24 منتجًا ممثلًا ولا تحمل مصدرًا ظاهرًا.",
    fix: "حوّل الحقائق المؤكدة إلى سمات منظمة مع مصدر، ثم حدّث وصف المنتج وProduct schema.",
    owner: "الكتالوج",
  },
  {
    id: "demo-finding-canonical",
    severity: "متوسطة",
    confidence: "88٪",
    title: "canonical غير متسق في صفحتين",
    evidence: "العنوان الأساسي المعلن في صفحتي منتج لا يطابق عنوان الصفحة النهائي بعد التحويل.",
    fix: "وحّد canonical مع العنوان النهائي القابل للفهرسة وأعد الفحص.",
    owner: "تقني",
  },
  {
    id: "demo-finding-direct-answer",
    severity: "متوسطة",
    confidence: "86٪",
    title: "إجابات الاستخدام لا تبدأ بإجابة مباشرة",
    evidence: "4 صفحات تشرح الاستخدام داخل فقرات طويلة يصعب على القارئ اتباعها.",
    fix: "نظّم طريقة الاستخدام في خطوات واضحة مدعومة بحقائق المنتج، من دون استهداف طول ثابت.",
    owner: "المحتوى",
  },
] as const;

const platformLenses = [
  { name: "Google", score: 78, label: "جاهزية جيدة", detail: "البنية والبيانات المنظمة أقوى من وضوح الكيان." },
  { name: "ChatGPT", score: 74, label: "جاهزية متوسطة", detail: "الإجابات المباشرة والمصادر الخارجية تحتاج دعمًا." },
  { name: "Gemini", score: 73, label: "جاهزية متوسطة", detail: "المحتوى واضح جزئيًا، لكن أدلة العلامة محدودة." },
] as const;

const questionGroups = [
  { title: "أسئلة العلامة", count: 7, examples: "من هي بصمة نقية؟ وهل منتجاتها سعودية؟" },
  { title: "أسئلة المقارنة", count: 11, examples: "ما الفرق بين السيروم والمرطب للبشرة الحساسة؟" },
  { title: "أسئلة المشكلة والفئة", count: 18, examples: "ما روتين لطيف للبشرة الدهنية دون عطر؟" },
] as const;

export default function LatestReportPage() {
  if (!isDemoMode()) return <ProductionFeatureState title="لا يوجد تقرير حي" description="التقرير التجريبي محجوب عن مساحات العملاء حتى يكتمل فحص موثق ويحفظ لقطة قابلة للمراجعة." />;
  const readiness = calculateStoreReadiness();

  return (
    <>
      <DashboardHeader
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild className="min-h-11"><Link href="/dashboard/plan"><ListChecks />خطة التحسين</Link></Button>
            <Button asChild className="min-h-11" variant="outline"><Link href="/dashboard/visibility/content"><FilePenLine />إنشاء مسودة</Link></Button>
            <ReportPrintButton />
          </div>
        }
        description="تقرير جاهزية عربي مبني على فحوص حتمية وأدلة مرتبطة بالصفحات. لا يمثل وعدًا بالترتيب أو الظهور."
        showDateRange={false}
        title="التقرير العربي المتعمق"
      />
      <div className="print-report mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <section aria-labelledby="executive-summary-heading" className="grid gap-5 lg:grid-cols-[.7fr_1.3fr]">
          <Card className="border-primary/20 bg-primary/[0.035]">
            <CardContent className="flex h-full flex-col justify-between p-6">
              <div><Badge className="bg-success-soft text-success hover:bg-success-soft">اكتمل في 11 يوليو 2026</Badge><h2 className="mt-4 text-lg font-semibold">درجة الجاهزية</h2><p className="metric-numbers mt-2 text-6xl font-semibold tracking-tight text-primary">{readiness}<span className="text-xl text-muted-foreground">/100</span></p><p className="mt-3 text-sm text-muted-foreground">ثقة 88٪ · تغطية 92٪ · 10 صفحات ممثلة</p></div>
              <div className="mt-8 border-t pt-4"><p className="text-xs text-muted-foreground">المنهجية</p><p className="mt-1 text-sm font-medium">فاحص الجاهزية العربي v1</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-xl" id="executive-summary-heading">الملخص التنفيذي</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <p className="text-base leading-8">المتجر قابل للاكتشاف والفهم تقنيًا بدرجة جيدة، لكنه لا يقدم كيان العلامة ومصادر حقائق المنتجات بالوضوح نفسه. أكبر فرصة ليست إنتاج محتوى أكثر؛ بل تنظيم الحقائق الموجودة وربطها بمصدر ثم صياغتها كإجابات مباشرة.</p>
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  ["أقوى محور", "البيانات المنظمة", "84 / 100"],
                  ["أضعف محور", "الأدلة الخارجية", "60 / 100"],
                  ["الأولوية", "وضوح العلامة", "أثر مرتفع"],
                ].map(([label, title, value]) => <div className="rounded-xl bg-muted/60 p-4" key={label}><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-semibold">{title}</p><p className="metric-numbers mt-1 text-xs text-muted-foreground">{value}</p></div>)}
              </div>
              <div className="flex gap-3 rounded-xl bg-warning-soft p-4 text-sm"><CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-warning" /><p><span className="font-semibold">القرار المقترح:</span> أصلح تعريف العلامة وحقائق المنتجات أولًا، ثم أنشئ محتوى للأسئلة التي يمكن إجابتها من تلك الحقائق.</p></div>
            </CardContent>
          </Card>
        </section>

        <section aria-labelledby="axes-heading">
          <div className="mb-3"><h2 className="text-xl font-semibold" id="axes-heading">محاور الجاهزية السبعة</h2><p className="mt-1 text-sm text-muted-foreground">الدرجة الموزونة تُحسب من الأدلة؛ النص التفسيري لا يغيّرها.</p></div>
          <div className="grid gap-4 md:grid-cols-2">
            {storeReadinessComponents.map((component) => (
              <Card key={component.key}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4"><div><h3 className="font-semibold">{component.label}</h3><p className="mt-1 text-xs text-muted-foreground">الوزن {component.weight}٪</p></div><span className="metric-numbers text-2xl font-semibold text-primary">{component.score}</span></div>
                  <div aria-label={`${component.label}: ${component.score} من 100`} aria-valuemax={100} aria-valuemin={0} aria-valuenow={component.score} className="mt-4 h-2 overflow-hidden rounded-full bg-muted" role="progressbar"><div className="h-full rounded-full bg-primary" style={{ width: `${component.score}%` }} /></div>
                  <p className="mt-4 text-sm text-muted-foreground"><span className="font-medium text-foreground">الدليل: </span>{component.evidence}</p>
                  <p className="mt-3 text-sm"><span className="font-medium">الإصلاح: </span>{component.recommendation}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section aria-labelledby="platform-lenses-heading">
          <div className="mb-3"><h2 className="text-xl font-semibold" id="platform-lenses-heading">عدسة المنصات</h2><p className="mt-1 text-sm text-muted-foreground">تقدير للجاهزية المتوقعة فقط، وليس قياسًا لنتيجة واجهة Google أو ChatGPT أو Gemini.</p></div>
          <div className="grid gap-4 md:grid-cols-3">
            {platformLenses.map((platform) => (
              <Card key={platform.name}>
                <CardContent className="p-5"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold" dir="ltr">{platform.name}</p><Badge className="mt-2" variant="secondary">{platform.label}</Badge></div><span className="metric-numbers text-3xl font-semibold text-primary">{platform.score}</span></div><p className="mt-4 text-sm text-muted-foreground">{platform.detail}</p></CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-4 flex gap-3 rounded-xl border bg-card p-4 text-sm text-muted-foreground"><Info aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-primary" /><p>لا نستخدم استجابة نموذج API عام كبديل لنتيجة المنتج الفعلية، ولا نصف التغير بأنه اتجاه قبل تكرار القياس بمنهج ثابت.</p></div>
        </section>

        <section aria-labelledby="findings-heading">
          <Card>
            <CardHeader className="border-b"><div className="flex flex-wrap items-center justify-between gap-3"><div><CardTitle className="text-xl" id="findings-heading">النتائج ذات الأولوية</CardTitle><p className="mt-1 text-sm text-muted-foreground">المشكلة والدليل والثقة والإصلاح وصاحب المهمة في مكان واحد.</p></div><Badge variant="outline">4 من 12 نتيجة</Badge></div></CardHeader>
            <CardContent className="divide-y p-0">
              {findings.map((finding) => (
                <article className="p-5" key={finding.title}>
                  <div className="flex flex-wrap items-start justify-between gap-3"><div className="flex flex-wrap items-center gap-2"><Badge variant={finding.severity === "عالية" ? "destructive" : "secondary"}>{finding.severity}</Badge><h3 className="font-semibold">{finding.title}</h3></div><span className="text-xs text-muted-foreground">ثقة {finding.confidence}</span></div>
                  <div className="mt-4 grid gap-4 md:grid-cols-2"><div className="rounded-xl border bg-muted/30 p-4"><p className="text-xs font-semibold text-muted-foreground">الدليل</p><p className="mt-2 text-sm">{finding.evidence}</p></div><div className="rounded-xl border border-primary/15 bg-primary/[0.035] p-4"><p className="text-xs font-semibold text-primary">الإصلاح المقترح</p><p className="mt-2 text-sm">{finding.fix}</p></div></div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3"><span className="text-xs text-muted-foreground">صاحب المهمة المقترح: {finding.owner}</span><Button asChild className="min-h-11" variant="ghost"><Link href={finding.owner === "المحتوى" ? `/dashboard/visibility/content?finding=${finding.id}` : "/dashboard/plan"}>{finding.owner === "المحتوى" ? "إنشاء مسودة" : "أضف إلى الخطة"}<ArrowUpLeft /></Link></Button></div>
                </article>
              ))}
            </CardContent>
          </Card>
        </section>

        <section aria-labelledby="questions-heading">
          <div className="mb-3"><h2 className="text-xl font-semibold" id="questions-heading">خريطة أسئلة الشراء</h2><p className="mt-1 text-sm text-muted-foreground">فرص محتوى مرتبة حسب صلتها برحلة العميل وإمكانية دعم الإجابة بحقيقة.</p></div>
          <div className="grid gap-4 md:grid-cols-3">
            {questionGroups.map((group) => <Card key={group.title}><CardContent className="p-5"><MessageCircleQuestion aria-hidden="true" className="size-5 text-primary" /><div className="mt-3 flex items-center justify-between gap-3"><h3 className="font-semibold">{group.title}</h3><Badge variant="outline">{group.count} سؤالًا</Badge></div><p className="mt-3 text-sm text-muted-foreground">{group.examples}</p></CardContent></Card>)}
          </div>
        </section>

        <Card className="border-primary/20">
          <CardContent className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between"><div className="flex gap-4"><span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><CheckCircle2 aria-hidden="true" className="size-5" /></span><div><h2 className="text-lg font-semibold">حوّل التقرير إلى خطوات قابلة للإنجاز</h2><p className="mt-1 text-sm text-muted-foreground">ابدأ بالأثر الأعلى، عيّن صاحب المهمة، ثم أعد الفحص بعد توثيق الإصلاح.</p></div></div><Button asChild className="min-h-11 shrink-0"><Link href="/dashboard/plan">فتح خطة 30 / 60 / 90<ArrowUpLeft /></Link></Button></CardContent>
          <CardFooter className="flex items-center gap-2 text-xs text-muted-foreground"><ExternalLink aria-hidden="true" className="size-4" />المصادر الخارجية والـPDF ورابط المشاركة تظهر هنا بعد اكتمال خدمات التقرير الإنتاجية.</CardFooter>
        </Card>
      </div>
    </>
  );
}
