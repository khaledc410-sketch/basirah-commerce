import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowUpLeft,
  CheckCircle2,
  CircleAlert,
  FileChartColumn,
  FilePenLine,
  ImageIcon,
  ListChecks,
  ScanSearch,
  SearchCheck,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  RefreshCw,
} from "lucide-react";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { ExternalProductImage } from "@/components/dashboard/external-product-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { isDemoMode } from "@/config/env";
import { getLiveCatalogSummary, listLiveCatalogProducts } from "@/core/data/catalog";
import { requireStoreContext } from "@/core/data/tenant";
import { formatCurrency, formatNumber } from "@/lib/format";
import { calculateStoreReadiness } from "@/modules/visibility/readiness";

export const metadata: Metadata = { title: "ملخص الظهور" };
export const dynamic = "force-dynamic";

const priorityFindings = [
  {
    title: "صفحة العلامة لا تشرح من أنتم بوضوح",
    detail: "صفحة «من نحن» قصيرة ولا تجمع اسم العلامة وتخصصها وموقعها ومصادر الثقة في سياق واحد.",
    category: "وضوح الكيان",
    confidence: "ثقة 94٪",
    severity: "عالية",
    href: "/dashboard/plan",
  },
  {
    title: "9 منتجات تفتقد حقائق منظمة قابلة للاستشهاد",
    detail: "حقائق المكونات وطريقة الاستخدام موجودة في نص حر أو غير مدعومة بمصدر ظاهر.",
    category: "المحتوى",
    confidence: "ثقة 91٪",
    severity: "عالية",
    href: "/dashboard/visibility/content",
  },
  {
    title: "رابط canonical غير متسق في صفحتين",
    detail: "العنوان الأساسي المعلن لا يطابق الصفحة النهائية بعد التحويل، ما يضعف وضوح النسخة المعتمدة.",
    category: "تقني",
    confidence: "ثقة 88٪",
    severity: "متوسطة",
    href: "/dashboard/plan",
  },
] as const;

const measurementLenses = [
  {
    icon: SearchCheck,
    label: "الجاهزية",
    value: "76 / 100",
    detail: "فحوص حتمية لبنية المتجر ومحتواه ووضوح كيانه.",
    state: "متاح",
  },
  {
    icon: ShieldCheck,
    label: "الاكتشاف في Google",
    value: "غير متصل",
    detail: "يحتاج Search Console أو دليل فهرسة موثّقًا؛ لا يُحتسب صفرًا.",
    state: "غير متاح",
  },
  {
    icon: ScanSearch,
    label: "الظهور المرصود",
    value: "8 من 25",
    detail: "عينة تحقق يدوي في العرض، وليست نتيجة مباشرة من واجهات المنصات.",
    state: "عينة",
  },
] as const;

export default async function DashboardPage() {
  if (!isDemoMode()) return <LiveCatalogDashboard />;
  const readiness = calculateStoreReadiness();

  return (
    <>
      <DashboardHeader
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild className="min-h-11">
              <Link href="/dashboard/plan"><ListChecks />ابدأ خطة التحسين</Link>
            </Button>
            <Button asChild className="min-h-11" variant="outline">
              <Link href="/dashboard/reports/latest"><FileChartColumn />فتح التقرير الأخير</Link>
            </Button>
          </div>
        }
        description="درجة الجاهزية، أهم المشكلات، والخطوة التالية — وكل استنتاج مرتبط بدليل وحدود واضحة."
        showDateRange={false}
        title="ملخص ظهور متجرك"
      />

      <div className="mx-auto max-w-[1440px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <section aria-labelledby="readiness-heading" className="grid gap-5 xl:grid-cols-[1.45fr_.75fr]">
          <Card className="overflow-hidden">
            <CardHeader className="border-b bg-muted/25">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Badge className="bg-success-soft text-success hover:bg-success-soft">اكتمل الفحص</Badge>
                    <Badge variant="outline">10 صفحات · 11 يوليو 2026</Badge>
                  </div>
                  <CardTitle className="text-xl" id="readiness-heading">جاهزية المتجر للظهور</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">المنهجية: فاحص الجاهزية العربي v1 · بيانات عرض تجريبي</p>
                </div>
                <div className="text-end">
                  <p className="metric-numbers text-4xl font-semibold tracking-tight text-primary sm:text-5xl">{readiness}</p>
                  <p className="text-xs text-muted-foreground">من 100</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div
                aria-label={`درجة الجاهزية ${readiness} من 100`}
                aria-valuemax={100}
                aria-valuemin={0}
                aria-valuenow={readiness}
                className="h-3 overflow-hidden rounded-full bg-muted"
                role="progressbar"
              >
                <div className="h-full rounded-full bg-primary" style={{ width: `${readiness}%` }} />
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {[
                  ["تغطية الفحص", "92٪", "المفحوص من الصفحات المكتشفة"],
                  ["ثقة النتيجة", "88٪", "بحسب اكتمال الأدلة"],
                  ["التغيّر", "+8", "مقارنة بالفحص السابق"],
                ].map(([label, value, detail]) => (
                  <div className="rounded-xl border bg-background p-4" key={label}>
                    <p className="text-xs font-medium text-muted-foreground">{label}</p>
                    <p className="metric-numbers mt-1 text-2xl font-semibold">{value}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="flex flex-wrap justify-between gap-3 text-xs text-muted-foreground">
              <span>الدرجة تقيس الجاهزية ولا تضمن ترتيبًا أو ذكرًا في أي منصة.</span>
              <Link className="inline-flex min-h-11 items-center gap-1 font-medium text-primary" href="/dashboard/reports/latest">
                راجع الأدلة والمنهجية<ArrowUpLeft aria-hidden="true" className="size-4" />
              </Link>
            </CardFooter>
          </Card>

          <Card className="border-primary/20 bg-primary/[0.035]">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Sparkles aria-hidden="true" className="size-5" /></span>
                <Badge className="bg-warning-soft text-warning hover:bg-warning-soft">الأولوية الأولى</Badge>
              </div>
              <CardTitle className="mt-3 text-xl">وضّح كيان علامتك أولًا</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-7 text-muted-foreground">ابدأ بصفحة علامة موثقة تجمع من أنتم، ماذا تبيعون، أين تعملون، ولماذا يمكن الوثوق بكم. هذا الإصلاح يدعم فهم المتجر قبل إنشاء مزيد من المحتوى.</p>
              <div className="mt-5 rounded-xl border bg-card p-4">
                <p className="text-xs font-semibold text-muted-foreground">الأثر المتوقع</p>
                <p className="mt-1 text-sm font-medium">تحسين وضوح الكيان والثقة والفائدة للقارئ</p>
              </div>
            </CardContent>
            <CardFooter>
              <Button asChild className="min-h-11 w-full"><Link href="/dashboard/plan">عرض الخطوات والدليل<ArrowUpLeft /></Link></Button>
            </CardFooter>
          </Card>
        </section>

        <section aria-labelledby="measurements-heading">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <div><h2 className="text-xl font-semibold" id="measurements-heading">ما الذي نعرفه فعلًا؟</h2><p className="mt-1 text-sm text-muted-foreground">ثلاثة قياسات منفصلة حتى لا تتحول القيمة غير المتاحة إلى فشل.</p></div>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {measurementLenses.map((item) => (
              <Card key={item.label}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-muted text-primary"><item.icon aria-hidden="true" className="size-5" /></span>
                    <Badge variant={item.state === "غير متاح" ? "outline" : "secondary"}>{item.state}</Badge>
                  </div>
                  <p className="mt-4 text-sm font-semibold">{item.label}</p>
                  <p className="metric-numbers mt-1 text-2xl font-semibold">{item.value}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{item.detail}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section aria-labelledby="priorities-heading" className="grid gap-5 xl:grid-cols-[1.35fr_.65fr]">
          <Card>
            <CardHeader className="border-b">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div><CardTitle className="text-xl" id="priorities-heading">أهم 3 مشاكل الآن</CardTitle><p className="mt-1 text-sm text-muted-foreground">مرتبة حسب الشدة والثقة، لا حسب سهولة العرض.</p></div>
                <Button asChild className="min-h-11" variant="outline"><Link href="/dashboard/reports/latest">كل نتائج التقرير<ArrowUpLeft /></Link></Button>
              </div>
            </CardHeader>
            <CardContent className="divide-y p-0">
              {priorityFindings.map((finding, index) => (
                <article className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start" key={finding.title}>
                  <span className="metric-numbers flex size-10 shrink-0 items-center justify-center rounded-xl bg-destructive/10 font-semibold text-destructive">{index + 1}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{finding.title}</h3><Badge variant={finding.severity === "عالية" ? "destructive" : "secondary"}>{finding.severity}</Badge></div>
                    <p className="mt-2 text-sm text-muted-foreground">{finding.detail}</p>
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground"><span>{finding.category}</span><span>{finding.confidence}</span></div>
                  </div>
                  <Button asChild className="min-h-11 shrink-0" variant="ghost"><Link href={finding.href}>ابدأ الإصلاح<ArrowUpLeft /></Link></Button>
                </article>
              ))}
            </CardContent>
          </Card>

          <div className="space-y-5">
            <Card>
              <CardHeader><CardTitle>تقدّم خطة التحسين</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-end justify-between"><div><p className="metric-numbers text-3xl font-semibold">5 من 12</p><p className="mt-1 text-sm text-muted-foreground">إجراءً مكتملًا</p></div><TrendingUp aria-hidden="true" className="size-5 text-success" /></div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full w-[42%] rounded-full bg-primary" /></div>
                <div className="mt-5 space-y-3 text-sm">
                  <div className="flex items-center justify-between"><span className="flex items-center gap-2"><CircleAlert className="size-4 text-warning" />مفتوح</span><span className="metric-numbers font-semibold">3</span></div>
                  <div className="flex items-center justify-between"><span className="flex items-center gap-2"><FilePenLine className="size-4 text-primary" />مسودات</span><span className="metric-numbers font-semibold">4</span></div>
                  <div className="flex items-center justify-between"><span className="flex items-center gap-2"><CheckCircle2 className="size-4 text-success" />مكتمل</span><span className="metric-numbers font-semibold">5</span></div>
                </div>
              </CardContent>
              <CardFooter><Button asChild className="min-h-11 w-full" variant="outline"><Link href="/dashboard/plan">فتح خطة 30 / 60 / 90<ArrowUpLeft /></Link></Button></CardFooter>
            </Card>
          </div>
        </section>
      </div>
    </>
  );
}

async function LiveCatalogDashboard() {
  const store = await requireStoreContext();
  const [catalog, summary] = await Promise.all([
    listLiveCatalogProducts(store.storeId, 6),
    getLiveCatalogSummary(store.storeId),
  ]);
  return (
    <>
      <DashboardHeader
        actions={<Button asChild><Link href="/setup/sync"><RefreshCw />مزامنة المتجر</Link></Button>}
        description="ملخص مباشر للكتالوج المستورد؛ لا تظهر أرقام مبيعات أو ظهور تجريبية في مساحة الإنتاج."
        showDateRange={false}
        title={`مرحبًا، ${store.name}`}
      />
      <div className="mx-auto max-w-[1440px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["إجمالي المنتجات", formatNumber(summary.total)],
            ["متاحة للبيع", formatNumber(summary.available)],
            ["نفد مخزونها", formatNumber(summary.outOfStock)],
            ["مسودات", formatNumber(summary.drafts)],
          ].map(([label, value]) => <Card key={label}><CardContent className="p-5"><p className="text-sm text-muted-foreground">{label}</p><p className="metric-numbers mt-2 text-3xl font-semibold">{value}</p></CardContent></Card>)}
        </section>
        <Card>
          <CardHeader><div className="flex items-center justify-between gap-4"><div><CardTitle>أحدث المنتجات المستوردة</CardTitle><p className="mt-1 text-sm text-muted-foreground">الأسعار والمخزون كما أعادتها سلة في آخر مزامنة.</p></div><Button asChild size="sm" variant="outline"><Link href="/dashboard/products">كل المنتجات<ArrowUpLeft /></Link></Button></div></CardHeader>
          <CardContent className="divide-y">
            {catalog.products.length ? catalog.products.map((product) => <div className="flex items-center gap-3 py-4 first:pt-0 last:pb-0" key={product.id}><div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">{product.imageUrl ? <ExternalProductImage alt="" className="size-full object-cover" src={product.imageUrl} /> : <ImageIcon className="size-4 text-muted-foreground" />}</div><div className="min-w-0 flex-1"><Link className="font-medium hover:text-primary" href={`/dashboard/products/${product.id}`}>{product.title}</Link><p className="text-xs text-muted-foreground">{product.category ?? "غير مصنّف"}</p></div><p className="metric-numbers font-semibold">{formatCurrency(product.priceMinor)}</p></div>) : <div className="py-12 text-center"><p className="font-semibold">لا توجد منتجات بعد</p><p className="mt-1 text-sm text-muted-foreground">افتح صفحة المزامنة لبدء الاستخراج.</p></div>}
          </CardContent>
        </Card>
        <Card className="border-primary/20 bg-primary/5"><CardContent className="flex gap-3 p-5"><CircleAlert className="mt-0.5 size-5 shrink-0 text-primary" /><div><p className="font-semibold">الميزات التحليلية تبدأ بعد جمع بيانات حقيقية</p><p className="mt-1 text-sm text-muted-foreground">المحادثات والظهور والخطط لن تعرض أرقامًا حتى تُفعّل مصادرها وتحفظ أدلتها.</p></div></CardContent></Card>
      </div>
    </>
  );
}
