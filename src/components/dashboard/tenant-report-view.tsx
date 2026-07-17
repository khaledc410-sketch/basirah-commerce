import { AlertCircle, ArrowUpLeft, CheckCircle2, Info, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { TenantReportActions } from "@/components/dashboard/tenant-report-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { StoreRole } from "@/core/data/tenant";
import type { TenantReportDetailDto } from "@/modules/reports/tenant-reports";

const componentLabels: Record<string, string> = {
  technical: "تقني",
  content: "المحتوى",
  entity: "وضوح الكيان",
  trust: "الثقة",
  answerability: "قابلية الإجابة",
  structuredData: "البيانات المنظمة",
  externalEvidence: "الأدلة الخارجية",
};

export function TenantReportView({
  report,
  storeId,
  role,
}: {
  report: TenantReportDetailDto;
  storeId: string;
  role: StoreRole;
}) {
  const full = report.accessLevel === "full";
  const platformLenses = [
    {
      name: "Google",
      score: componentAverage(report, ["technical", "structuredData", "content"]),
      detail: "تقدير جاهزية تقني ومحتوى من أدلة الموقع، وليس ترتيبًا أو بيانات Search Console.",
    },
    {
      name: "ChatGPT",
      score: componentAverage(report, ["entity", "trust", "answerability", "externalEvidence"]),
      detail: "تقدير قابلية الفهم والإجابة والاستشهاد، وليس نتيجة من واجهة ChatGPT.",
    },
    {
      name: "Gemini",
      score: componentAverage(report, ["technical", "entity", "structuredData", "answerability"]),
      detail: "تقدير جاهزية متوقع من الفحوص الحتمية، وليس قياس ظهور مباشرًا.",
    },
  ];

  return (
    <>
      <DashboardHeader
        actions={<TenantReportActions canDownload={full && ["owner", "admin", "analyst"].includes(role)} canShare={role === "owner" || role === "admin"} reportId={report.id} storeId={storeId} />}
        description="نسخة ثابتة مؤرخة؛ الجاهزية منفصلة عن اكتشاف Google والظهور المرصود."
        showDateRange={false}
        title={`تقرير ${report.domain}`}
      />
      <main className="print-report mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8" id="main-content">
        <section className="grid gap-5 lg:grid-cols-[.7fr_1.3fr]" aria-labelledby="tenant-summary-heading">
          <Card className="border-primary/20 bg-primary/[0.035]">
            <CardContent className="p-6">
              <Badge className={full ? "bg-success-soft text-success hover:bg-success-soft" : ""} variant={full ? "default" : "secondary"}>
                {full ? "تقرير كامل" : "معاينة محفوظة"}
              </Badge>
              <p className="mt-5 text-sm font-semibold">درجة الجاهزية</p>
              <p className="metric-numbers mt-2 text-6xl font-semibold text-primary">{report.score}<span className="text-xl text-muted-foreground">/100</span></p>
              <div className="mt-5 space-y-2 text-sm text-muted-foreground">
                <p>التغطية {report.coverage}٪ · الثقة {report.confidence}٪</p>
                <p>{report.pagesScanned} صفحات · {formatArabicDate(report.generatedAt)}</p>
                <p>المنهجية: {report.methodologyVersion}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle id="tenant-summary-heading">الملخص التنفيذي</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="leading-8">
                {report.narrative?.executiveSummary ?? `سجل المتجر درجة جاهزية ${report.score} من 100 ضمن تغطية ${report.coverage}٪. الأولوية التالية هي معالجة النتائج الأعلى شدة وثقة، ثم إعادة الفحص بالمنهج نفسه. هذه الدرجة لا تمثل وعدًا بالترتيب أو الذكر.`}
              </p>
              <div className="flex gap-3 rounded-xl bg-warning-soft p-4 text-sm">
                <AlertCircle className="mt-0.5 size-5 shrink-0 text-warning" aria-hidden="true" />
                <p>الاكتشاف في Google والظهور المرصود غير متاحين في هذه اللقطة ما لم يظهرا كمصدر منفصل؛ لا يُحتسبان صفرًا.</p>
              </div>
              {!full && (
                <div className="rounded-xl border border-primary/20 bg-primary/[0.03] p-4">
                  <p className="font-semibold">المعاينة تعرض أهم 3 نتائج فقط</p>
                  <p className="mt-1 text-sm text-muted-foreground">يُفتح ملحق الأدلة والنتائج الكاملة بعد تأكيد طلب التقرير من الخادم.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {full && report.narrative && (
          <section aria-labelledby="tenant-plan-heading">
            <div className="mb-3"><h2 className="text-xl font-semibold" id="tenant-plan-heading">خطة 30 / 60 / 90 يومًا</h2><p className="mt-1 text-sm text-muted-foreground">خطة تنفيذ مرتبطة بنتائج هذه النسخة الثابتة.</p></div>
            <div className="grid gap-4 md:grid-cols-3">
              {([
                ["30 يومًا", report.narrative.plan30Days],
                ["60 يومًا", report.narrative.plan60Days],
                ["90 يومًا", report.narrative.plan90Days],
              ] as const).map(([label, items]) => (
                <Card key={label}><CardHeader><CardTitle>{label}</CardTitle></CardHeader><CardContent><ol className="space-y-3 text-sm leading-7">{items.map((item, index) => <li className="flex gap-3" key={item}><span className="metric-numbers text-primary">{index + 1}</span><span>{item}</span></li>)}</ol></CardContent></Card>
              ))}
            </div>
          </section>
        )}

        <section aria-labelledby="tenant-axes-heading">
          <div className="mb-3"><h2 className="text-xl font-semibold" id="tenant-axes-heading">محاور الجاهزية السبعة</h2><p className="mt-1 text-sm text-muted-foreground">المجهول يخفض التغطية والثقة، ولا يتحول إلى فشل.</p></div>
          <div className="grid gap-4 md:grid-cols-2">
            {report.components.map((component) => (
              <Card key={component.key}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div><h3 className="font-semibold">{componentLabels[component.key] ?? component.label}</h3><p className="mt-1 text-xs text-muted-foreground">الوزن {component.weight}٪ · تغطية {component.coverage}٪</p></div>
                    <span className="metric-numbers text-2xl font-semibold text-primary">{component.score ?? "غير متاح"}</span>
                  </div>
                  {component.score !== null && <div aria-label={`${component.label}: ${component.score} من 100`} aria-valuemax={100} aria-valuemin={0} aria-valuenow={component.score} className="mt-4 h-2 overflow-hidden rounded-full bg-muted" role="progressbar"><div className="h-full rounded-full bg-primary" style={{ width: `${component.score}%` }} /></div>}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section aria-labelledby="tenant-lenses-heading">
          <div className="mb-3"><h2 className="text-xl font-semibold" id="tenant-lenses-heading">عدسة المنصات — جاهزية متوقعة</h2><p className="mt-1 text-sm text-muted-foreground">اشتقاق من محاور الموقع فقط؛ لا يحاكي واجهات المنصات ولا يدّعي ظهورًا فعليًا.</p></div>
          <div className="grid gap-4 md:grid-cols-3">
            {platformLenses.map((lens) => <Card key={lens.name}><CardContent className="p-5"><div className="flex items-start justify-between gap-3"><h3 className="font-semibold" dir="ltr">{lens.name}</h3><span className="metric-numbers text-3xl font-semibold text-primary">{lens.score ?? "—"}</span></div><p className="mt-4 text-sm text-muted-foreground">{lens.detail}</p></CardContent></Card>)}
          </div>
        </section>

        <section aria-labelledby="tenant-findings-heading">
          <Card>
            <CardHeader className="border-b"><CardTitle id="tenant-findings-heading">النتائج والإصلاحات</CardTitle></CardHeader>
            <CardContent className="divide-y p-0">
              {report.findings.map((finding) => (
                <article className="p-5" key={finding.id}>
                  <div className="flex flex-wrap items-start justify-between gap-3"><div className="flex flex-wrap items-center gap-2"><Badge variant={finding.severity === "high" ? "destructive" : "secondary"}>{severityLabel(finding.severity)}</Badge><h3 className="font-semibold">{finding.title}</h3></div><span className="text-xs text-muted-foreground">{componentLabels[finding.component]}</span></div>
                  <div className="mt-4 grid gap-4 md:grid-cols-2"><div className="rounded-xl border bg-muted/30 p-4"><p className="text-xs font-semibold text-muted-foreground">المشكلة والدليل</p><p className="mt-2 text-sm leading-7">{finding.description}</p>{full && <p className="mt-3 text-xs text-muted-foreground">مراجع: {finding.evidenceIds.join(" · ")}</p>}</div><div className="rounded-xl border border-primary/15 bg-primary/[0.035] p-4"><p className="text-xs font-semibold text-primary">الإصلاح المقترح</p><p className="mt-2 text-sm leading-7">{finding.recommendation}</p></div></div>
                  <div className="mt-3 flex justify-end"><Button asChild className="min-h-11" variant="ghost"><Link href={`/dashboard/visibility/content?finding=${encodeURIComponent(finding.id)}`}>إنشاء مسودة موثقة<ArrowUpLeft /></Link></Button></div>
                </article>
              ))}
              {report.findings.length === 0 && <p className="p-6 text-sm text-muted-foreground">لا توجد نتيجة مؤكدة ضمن التغطية الحالية.</p>}
            </CardContent>
          </Card>
        </section>

        {full && (
          <section className="grid gap-5 lg:grid-cols-2" aria-label="ملحق الأدلة والصفحات">
            <Card>
              <CardHeader><CardTitle>ملحق الأدلة</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {report.evidence.map((evidence) => <div className="rounded-xl border p-4" key={evidence.id}><div className="flex items-center justify-between gap-3"><p className="font-medium">{evidence.checkKey}</p><Badge variant={evidence.status === "pass" ? "secondary" : evidence.status === "fail" ? "destructive" : "outline"}>{evidence.status === "unknown" ? "غير متاح" : evidence.status === "pass" ? "ناجح" : "يحتاج إصلاح"}</Badge></div><p className="mt-2 text-sm text-muted-foreground">{evidence.message}</p>{evidence.urls.length > 0 && <p className="mt-2 break-all text-xs text-muted-foreground">{evidence.urls.join(" · ")}</p>}</div>)}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>الصفحات المفحوصة</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {report.pages.map((page) => <div className="rounded-xl border p-4" key={page.url}><div className="flex items-center justify-between gap-3"><p className="truncate text-sm font-medium" dir="ltr">{page.title ?? page.url}</p><Badge variant="outline">{page.httpStatus ?? "—"}</Badge></div><p className="mt-2 break-all text-xs text-muted-foreground" dir="ltr">{page.url}</p></div>)}
              </CardContent>
            </Card>
          </section>
        )}

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="size-5 text-primary" aria-hidden="true" />المنهجية والقيود</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {report.limitations.map((limitation) => <p className="flex gap-3 text-sm text-muted-foreground" key={limitation}><Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />{limitation}</p>)}
            <p className="flex gap-3 text-sm text-muted-foreground"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />الدرجة حتمية من الأدلة؛ السرد لا يحسبها ولا يغيرها.</p>
          </CardContent>
        </Card>
      </main>
    </>
  );
}

function componentAverage(report: TenantReportDetailDto, keys: string[]) {
  const values = report.components.flatMap((component) =>
    keys.includes(component.key) && component.score !== null ? [component.score] : [],
  );
  if (values.length === 0) return null;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function severityLabel(severity: "high" | "medium" | "low") {
  return severity === "high" ? "عالية" : severity === "medium" ? "متوسطة" : "منخفضة";
}

function formatArabicDate(value: string) {
  return new Intl.DateTimeFormat("ar-SA", { dateStyle: "medium" }).format(new Date(value));
}
