import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpLeft, CalendarDays, CheckCircle2, FileChartColumn, FileText, ShieldCheck } from "lucide-react";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { isDemoMode } from "@/config/env";
import { requireStoreContext } from "@/core/data/tenant";
import { getTenantReportRepository } from "@/modules/reports/tenant-reports";

export const metadata: Metadata = { title: "تقارير الظهور" };

const reports = [
  {
    id: "latest",
    date: "11 يوليو 2026",
    score: 76,
    change: "+8",
    coverage: "92٪",
    pages: 10,
    status: "التقرير الحالي",
    method: "فاحص الجاهزية العربي v1",
  },
  {
    id: "previous",
    date: "12 يونيو 2026",
    score: 68,
    change: "—",
    coverage: "84٪",
    pages: 10,
    status: "نسخة سابقة",
    method: "فاحص الجاهزية العربي v1",
  },
] as const;

export default async function ReportsPage() {
  if (!isDemoMode()) return <LiveReportsPage />;
  return (
    <>
      <DashboardHeader
        actions={<Button asChild className="min-h-11"><Link href="/dashboard/reports/latest"><FileChartColumn />فتح أحدث تقرير</Link></Button>}
        description="كل تقرير لقطة مؤرخة تحفظ الدرجة والتغطية والأدلة والمنهجية، حتى تكون المقارنة قابلة للمراجعة."
        showDateRange={false}
        title="تقارير الظهور"
      />
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <section aria-labelledby="latest-report-heading">
          <Card className="border-primary/20 bg-primary/[0.035]">
            <CardContent className="grid gap-6 p-6 lg:grid-cols-[1fr_auto] lg:items-center">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary"><FileChartColumn aria-hidden="true" className="size-6" /></span>
                <div>
                  <div className="flex flex-wrap items-center gap-2"><Badge className="bg-success-soft text-success hover:bg-success-soft">مكتمل</Badge><Badge variant="outline">{reports[0].date}</Badge></div>
                  <h2 className="mt-3 text-2xl font-semibold" id="latest-report-heading">التقرير العربي المتعمق</h2>
                  <p className="mt-2 max-w-2xl text-sm text-muted-foreground">10 صفحات ممثلة، 7 محاور جاهزية، و12 نتيجة مرتبطة بدليل وخطوة إصلاح. لا يخلط التقرير الجاهزية بالظهور الفعلي.</p>
                  <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground"><span>المنهجية: {reports[0].method}</span><span>التغطية: {reports[0].coverage}</span><span>الثقة: 88٪</span></div>
                </div>
              </div>
              <div className="flex items-end justify-between gap-8 lg:flex-col lg:items-end lg:justify-center">
                <div className="text-end"><p className="metric-numbers text-4xl font-semibold text-primary">{reports[0].score}<span className="text-lg text-muted-foreground">/100</span></p><p className="mt-1 text-xs text-success">{reports[0].change} عن التقرير السابق</p></div>
                <Button asChild className="min-h-11"><Link href="/dashboard/reports/latest">راجع التقرير<ArrowUpLeft /></Link></Button>
              </div>
            </CardContent>
          </Card>
        </section>

        <section aria-labelledby="report-history-heading">
          <div className="mb-3"><h2 className="text-xl font-semibold" id="report-history-heading">سجل التقارير</h2><p className="mt-1 text-sm text-muted-foreground">المقارنة تعكس نسخًا محفوظة، لا بيانات حية قابلة للتغير بعد إصدار التقرير.</p></div>
          <div className="space-y-4">
            {reports.map((report) => (
              <Card key={report.id}>
                <CardContent className="grid gap-5 p-5 md:grid-cols-[1fr_auto] md:items-center">
                  <div className="flex gap-4">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted text-primary"><FileText aria-hidden="true" className="size-5" /></span>
                    <div><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">تقرير جاهزية المتجر</h3><Badge variant={report.id === "latest" ? "secondary" : "outline"}>{report.status}</Badge></div><p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground"><CalendarDays aria-hidden="true" className="size-4" />{report.date} · {report.pages} صفحات</p><p className="mt-2 text-xs text-muted-foreground">{report.method} · تغطية {report.coverage}</p></div>
                  </div>
                  <div className="flex items-center justify-between gap-6 md:justify-end">
                    <div className="text-end"><p className="metric-numbers text-2xl font-semibold">{report.score}/100</p><p className="text-xs text-muted-foreground">{report.change === "—" ? "خط أساس" : `${report.change} نقطة`}</p></div>
                    {report.id === "latest" ? <Button asChild className="min-h-11" variant="outline"><Link href="/dashboard/reports/latest">فتح<ArrowUpLeft /></Link></Button> : <Button className="min-h-11" disabled variant="ghost">معاينة العرض</Button>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck aria-hidden="true" className="size-5 text-primary" />كيف نحافظ على قابلية المراجعة؟</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            {[
              ["نسخة ثابتة", "تبقى الدرجة والأدلة كما كانت لحظة إصدار التقرير."],
              ["منهجية معلنة", "يظهر إصدار الفاحص وحدود القياس داخل كل نسخة."],
              ["قيم غير متاحة", "لا تتحول البيانات غير المتصلة أو غير المتحققة إلى صفر."],
            ].map(([title, detail]) => <div className="rounded-xl border bg-muted/25 p-4" key={title}><CheckCircle2 aria-hidden="true" className="size-5 text-success" /><h3 className="mt-3 font-semibold">{title}</h3><p className="mt-1 text-sm text-muted-foreground">{detail}</p></div>)}
          </CardContent>
          <CardFooter className="text-xs text-muted-foreground">هذه الواجهة تعرض بيانات تجريبية حتى يكتمل محرك الفحص العام وتخزين لقطات التقرير.</CardFooter>
        </Card>
      </div>
    </>
  );
}

async function LiveReportsPage() {
  const store = await requireStoreContext();
  const liveReports = await getTenantReportRepository().list(store.storeId, 50);
  const latest = liveReports[0];

  return (
    <>
      <DashboardHeader
        actions={latest ? <Button asChild className="min-h-11"><Link href={`/dashboard/reports/${latest.id}`}><FileChartColumn />فتح أحدث تقرير</Link></Button> : undefined}
        description="كل تقرير لقطة مؤرخة تحفظ الدرجة والتغطية والأدلة والمنهجية. لا تظهر أي بيانات تجريبية داخل مساحة الإنتاج."
        showDateRange={false}
        title="تقارير الظهور"
      />
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8" id="main-content">
        {latest ? (
          <Card className="border-primary/20 bg-primary/[0.035]">
            <CardContent className="grid gap-6 p-6 md:grid-cols-[1fr_auto] md:items-center">
              <div className="flex gap-4">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary"><FileChartColumn className="size-6" aria-hidden="true" /></span>
                <div>
                  <div className="flex flex-wrap items-center gap-2"><Badge className="bg-success-soft text-success hover:bg-success-soft">مكتمل</Badge><Badge variant="outline">{formatArabicDate(latest.generatedAt)}</Badge><Badge variant="secondary">{latest.accessLevel === "full" ? "كامل" : "معاينة"}</Badge></div>
                  <h2 className="mt-3 text-2xl font-semibold">أحدث تقرير: {latest.domain}</h2>
                  <p className="mt-2 text-sm text-muted-foreground">{latest.pagesScanned} صفحات · {latest.findingsCount} نتائج · تغطية {latest.coverage}٪ · ثقة {latest.confidence}٪</p>
                  <p className="mt-2 text-xs text-muted-foreground">المنهجية: {latest.methodologyVersion}</p>
                </div>
              </div>
              <div className="flex items-center justify-between gap-6 md:justify-end">
                <p className="metric-numbers text-4xl font-semibold text-primary">{latest.score}<span className="text-lg text-muted-foreground">/100</span></p>
                <Button asChild className="min-h-11"><Link href={`/dashboard/reports/${latest.id}`}>راجع الأدلة<ArrowUpLeft /></Link></Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-8 text-center sm:p-12">
              <FileChartColumn className="mx-auto size-10 text-primary" aria-hidden="true" />
              <h2 className="mt-5 text-2xl font-semibold">لا توجد تقارير محفوظة بعد</h2>
              <p className="mx-auto mt-2 max-w-xl text-muted-foreground">ابدأ فحصًا حقيقيًا ثم طالب بالنتيجة بعد تسجيل الدخول؛ لن نعرض تقرير العرض على أنه بيانات متجرك.</p>
              <Button asChild className="mt-6 min-h-11"><Link href="/ar#checker">ابدأ فحصًا جديدًا<ArrowUpLeft /></Link></Button>
            </CardContent>
          </Card>
        )}

        {liveReports.length > 0 && (
          <section aria-labelledby="live-report-history-heading">
            <div className="mb-3"><h2 className="text-xl font-semibold" id="live-report-history-heading">سجل التقارير</h2><p className="mt-1 text-sm text-muted-foreground">نسخ ثابتة مرتبة من الأحدث إلى الأقدم.</p></div>
            <div className="space-y-4">
              {liveReports.map((report) => (
                <Card key={report.id}>
                  <CardContent className="grid gap-5 p-5 md:grid-cols-[1fr_auto] md:items-center">
                    <div className="flex gap-4"><span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted text-primary"><FileText className="size-5" aria-hidden="true" /></span><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{report.domain}</h3><Badge variant={report.accessLevel === "full" ? "secondary" : "outline"}>{report.accessLevel === "full" ? "تقرير كامل" : "معاينة"}</Badge>{report.shareActive && <Badge variant="outline">رابط مشاركة فعّال</Badge>}</div><p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground"><CalendarDays className="size-4" aria-hidden="true" />{formatArabicDate(report.generatedAt)} · {report.pagesScanned} صفحات</p><p className="mt-2 text-xs text-muted-foreground">{report.methodologyVersion} · تغطية {report.coverage}٪ · ثقة {report.confidence}٪</p></div></div>
                    <div className="flex items-center justify-between gap-6 md:justify-end"><p className="metric-numbers text-2xl font-semibold">{report.score}/100</p><Button asChild className="min-h-11" variant="outline"><Link href={`/dashboard/reports/${report.id}`}>فتح<ArrowUpLeft /></Link></Button></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="size-5 text-primary" aria-hidden="true" />قابلية المراجعة</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            {[
              ["نسخة ثابتة", "تبقى الدرجة والأدلة كما كانت لحظة إصدار التقرير."],
              ["منهجية معلنة", "يظهر إصدار الفاحص والتغطية والثقة داخل كل نسخة."],
              ["مجهول ليس صفرًا", "القيمة غير المتاحة تخفض التغطية ولا تصبح إخفاقًا."],
            ].map(([title, detail]) => <div className="rounded-xl border p-4" key={title}><CheckCircle2 className="size-5 text-success" aria-hidden="true" /><h3 className="mt-3 font-semibold">{title}</h3><p className="mt-1 text-sm text-muted-foreground">{detail}</p></div>)}
          </CardContent>
        </Card>
      </main>
    </>
  );
}

function formatArabicDate(value: string) {
  return new Intl.DateTimeFormat("ar-SA", { dateStyle: "medium" }).format(new Date(value));
}
