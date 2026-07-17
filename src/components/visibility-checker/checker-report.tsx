import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Bot,
  BookOpen,
  CheckCircle2,
  CircleHelp,
  Clock3,
  Download,
  ExternalLink,
  FileSearch,
  Globe2,
  KeyRound,
  PackageSearch,
  RefreshCw,
  SearchCheck,
  ShieldCheck,
  Target,
  TableProperties,
  Wrench,
} from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { publicPath, type PublicLocale } from "@/i18n/public";

import { ReportLeadForm } from "./report-lead-form";
import type { ReportFinding, ScanReport } from "./types";

interface CheckerReportProps {
  locale: PublicLocale;
  report: ScanReport;
  reportId: string;
  shared?: boolean;
  accessLevel?: "preview" | "full";
}

const componentLabels: Record<string, { ar: string; en: string }> = {
  technical: { ar: "تقني", en: "Technical" },
  content: { ar: "المحتوى", en: "Content" },
  entity: { ar: "وضوح الكيان", en: "Entity clarity" },
  trust: { ar: "الثقة", en: "Trust" },
  answerability: { ar: "قابلية الإجابة", en: "Answerability" },
  structuredData: { ar: "البيانات المنظمة", en: "Structured data" },
  externalEvidence: { ar: "الأدلة الخارجية", en: "External evidence" },
};

function severityDetails(severity: ReportFinding["severity"], locale: PublicLocale) {
  if (severity === "high") {
    return { label: locale === "ar" ? "أولوية عالية" : "High priority", variant: "destructive" as const };
  }
  if (severity === "medium") {
    return { label: locale === "ar" ? "أولوية متوسطة" : "Medium priority", variant: "secondary" as const };
  }
  return { label: locale === "ar" ? "أولوية منخفضة" : "Low priority", variant: "outline" as const };
}

function formatDate(date: string, locale: PublicLocale) {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-SA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

export function CheckerReport({
  locale,
  report,
  reportId,
  shared = false,
  accessLevel = "preview",
}: CheckerReportProps) {
  const Arrow = locale === "ar" ? ArrowLeft : ArrowRight;
  const isAr = locale === "ar";
  const isFull = accessLevel === "full";
  const evidence = report.evidence ?? [];
  const growthPlan = report.organicGrowthPlan;
  const immediateActions = report.findings.slice(0, 2).map((finding) => finding.recommendation);
  const actionPlan = [
    {
      label: isAr ? "خلال 30 يومًا" : "In 30 days",
      icon: Wrench,
      items: immediateActions.length
        ? immediateActions
        : [isAr ? "وسّع الفحص ليشمل صفحات المنتجات والسياسات الأساسية." : "Expand the scan to key product and policy pages."],
    },
    {
      label: isAr ? "خلال 60 يومًا" : "In 60 days",
      icon: Target,
      items: [
        isAr
          ? "حوّل أسئلة الشراء المهمة إلى إجابات مباشرة مبنية على حقائق المنتجات."
          : "Turn high-value buying questions into direct answers grounded in product facts.",
        isAr
          ? "وحّد اسم العلامة والسياسات وبيانات الكيان عبر الصفحات الأساسية."
          : "Make brand, policy, and entity facts consistent across key pages.",
      ],
    },
    {
      label: isAr ? "خلال 90 يومًا" : "In 90 days",
      icon: RefreshCw,
      items: [
        isAr
          ? "أعد الفحص بالمنهجية نفسها لإثبات ما تغيّر بدل الاعتماد على الانطباع."
          : "Rescan with the same method to prove what changed instead of relying on impressions.",
        isAr
          ? "اربط Search Console وGA4 عندما يتوفر التكامل لقياس الاكتشاف والمصدر بشكل منفصل."
          : "Connect Search Console and GA4 when the integration is available to measure discovery and source separately.",
      ],
    },
  ];

  return (
    <div className="space-y-8">
      <section aria-labelledby="report-summary" className="grid gap-5 lg:grid-cols-[.72fr_1.28fr]">
        <Card className="justify-center bg-foreground text-background">
          <CardContent className="flex flex-col items-center px-6 py-8 text-center">
            <div
              aria-label={isAr ? `درجة الجاهزية ${report.score} من 100` : `Readiness score ${report.score} out of 100`}
              className="grid size-40 place-items-center rounded-full p-3"
              role="img"
              style={{
                background: `conic-gradient(var(--primary) ${report.score * 3.6}deg, color-mix(in oklab, var(--background) 18%, transparent) 0deg)`,
              }}
            >
              <div className="grid size-full place-items-center rounded-full bg-foreground">
                <div>
                  <p className="metric-numbers text-5xl font-semibold">{report.score}</p>
                  <p className="text-xs text-background/65">/ 100</p>
                </div>
              </div>
            </div>
            <p className="mt-5 text-sm font-semibold text-background/75">
              {isAr ? "درجة الجاهزية الحتمية" : "Deterministic readiness score"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">
                {isFull
                  ? isAr
                    ? "التقرير الكامل — مجانًا"
                    : "Full report — free"
                  : isAr
                    ? "معاينة مجانية"
                    : "Free preview"}
              </Badge>
              <span className="text-xs text-muted-foreground" dir="ltr">{report.domain}</span>
            </div>
            <h1 className="mt-3 text-2xl font-semibold sm:text-3xl" id="report-summary">
              {isFull
                ? isAr
                  ? "تشخيص جاهزية متجرك"
                  : "Your store readiness diagnosis"
                : isAr
                  ? "ملخص جاهزية متجرك"
                  : "Your store readiness summary"}
            </h1>
            <p className="text-muted-foreground">
              {isAr
                ? "هذه النتيجة تقيس ما استطعنا التحقق منه في صفحات موقعك، ولا تعني ظهورًا فعليًا في منصة بعينها."
                : "This result measures what we could verify on your public pages. It is not a claim of live visibility on any platform."}
            </p>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            {[
              { icon: FileSearch, label: isAr ? "تغطية الفحص" : "Check coverage", value: `${report.coverage}%` },
              { icon: ShieldCheck, label: isAr ? "الثقة" : "Confidence", value: `${report.confidence}%` },
              { icon: Clock3, label: isAr ? "وقت الفحص" : "Checked", value: formatDate(report.scannedAt, locale) },
            ].map((metric) => (
              <div className="rounded-xl bg-muted p-4" key={metric.label}>
                <metric.icon className="size-5 text-primary" />
                <p className="mt-3 text-xs text-muted-foreground">{metric.label}</p>
                <p className="metric-numbers mt-1 font-semibold">{metric.value}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section aria-labelledby="measurement-lenses">
        <div className="mb-4">
          <h2 className="text-2xl font-semibold" id="measurement-lenses">
            {isAr ? "ثلاث عدسات لا نخلط بينها" : "Three lenses we keep separate"}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {isAr
              ? "القيمة غير المتاحة تبقى غير متاحة، ولا تتحول إلى صفر."
              : "Unavailable data stays unavailable; it never becomes a zero."}
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-5">
              <SearchCheck className="size-6 text-primary" />
              <h3 className="mt-4 font-semibold">{isAr ? "الجاهزية" : "Readiness"}</h3>
              <p className="metric-numbers mt-2 text-3xl font-semibold text-primary">{report.score}%</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {isAr ? "فحوص حتمية للموقع والأدلة المتاحة." : "Deterministic checks of the site and available evidence."}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <Globe2 className="size-6 text-muted-foreground" />
              <h3 className="mt-4 font-semibold">{isAr ? "الاكتشاف في Google" : "Google discovery"}</h3>
              <p className="mt-2 font-semibold text-muted-foreground">{isAr ? "لم يتم التحقق" : "Not verified"}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {isAr ? "يتطلب بيانات فهرسة أو Search Console." : "Requires indexing or Search Console data."}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <Bot className="size-6 text-muted-foreground" />
              <h3 className="mt-4 font-semibold">{isAr ? "الظهور المرصود" : "Observed AI visibility"}</h3>
              <p className="mt-2 font-semibold text-muted-foreground">{isAr ? "لم يتم القياس" : "Not measured"}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {isAr ? "لا ندّعي نتيجة ChatGPT أو Gemini من استجابة API عامة." : "We do not label a generic API response as a ChatGPT or Gemini result."}
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section aria-labelledby="component-scores">
        <h2 className="text-2xl font-semibold" id="component-scores">
          {isAr ? "محاور الجاهزية" : "Readiness components"}
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {report.components.map((component) => {
            const localizedLabel = componentLabels[component.key]?.[locale] ?? component.label;
            return (
              <Card key={component.key}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold">{localizedLabel}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {isAr ? `الوزن ${component.weight}% · التغطية ${component.coverage}%` : `Weight ${component.weight}% · coverage ${component.coverage}%`}
                      </p>
                    </div>
                    <p className="metric-numbers text-2xl font-semibold">
                      {component.score === null ? "—" : component.score}
                    </p>
                  </div>
                  <Progress
                    aria-label={localizedLabel}
                    className="mt-4 h-2"
                    value={component.score ?? 0}
                  />
                  {component.score === null && (
                    <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <CircleHelp className="size-3.5" />
                      {isAr ? "بيانات غير كافية، ولم تُحسب كفشل." : "Insufficient data; this was not scored as a failure."}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="top-findings">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-primary">{isAr ? "الأولوية الآن" : "What to fix first"}</p>
            <h2 className="mt-2 text-2xl font-semibold" id="top-findings">
              {isFull
                ? isAr
                  ? `المشاكل التي وجدناها (${report.findings.length})`
                  : `Issues we found (${report.findings.length})`
                : isAr
                  ? "أهم 3 مشاكل وجدناها"
                  : "The top three issues we found"}
            </h2>
          </div>
          <Badge variant="outline">{isAr ? "مرتب حسب الأثر" : "Ordered by impact"}</Badge>
        </div>
        <div className="mt-5 space-y-4">
          {report.findings.length > 0 ? (
            report.findings.map((finding, index) => {
              const severity = severityDetails(finding.severity, locale);
              return (
                <Card key={finding.id}>
                  <CardContent className="p-5 sm:p-6">
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                      <span className="metric-numbers grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 font-semibold text-primary">
                        {index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold sm:text-lg">{finding.title}</h3>
                          <Badge variant={severity.variant}>{severity.label}</Badge>
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">{finding.description}</p>
                        <div className="mt-4 rounded-xl bg-muted p-4">
                          <p className="text-xs font-semibold text-primary">{isAr ? "الإصلاح المقترح" : "Recommended fix"}</p>
                          <p className="mt-1 text-sm">{finding.recommendation}</p>
                        </div>
                        <p className="mt-3 text-xs text-muted-foreground">
                          {isAr ? "الأدلة المرتبطة" : "Linked evidence"}: {finding.evidenceIds.length || 0}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card>
              <CardContent className="flex items-start gap-3 p-5">
                <CheckCircle2 className="mt-0.5 size-5 text-success" />
                <p>{isAr ? "لم نجد مشكلة ذات أولوية ضمن الصفحات المفحوصة." : "No priority issue was found in the checked pages."}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {isFull && (
        <section aria-labelledby="action-plan">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold text-primary">
              {isAr ? "من التشخيص إلى التنفيذ" : "From diagnosis to execution"}
            </p>
            <h2 className="mt-2 text-2xl font-semibold" id="action-plan">
              {isAr ? "خطة عمل 30 / 60 / 90 يومًا" : "Your 30 / 60 / 90-day action plan"}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {isAr
                ? "ابدأ بما يمنع الفهم الآن، ثم ثبّت الحقائق والمحتوى، وبعدها قِس التغيّر بالطريقة نفسها."
                : "Fix what blocks understanding now, strengthen facts and content next, then measure the change with the same method."}
            </p>
          </div>
          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            {actionPlan.map((phase) => (
              <Card key={phase.label}>
                <CardContent className="p-5">
                  <phase.icon className="size-6 text-primary" />
                  <h3 className="mt-4 font-semibold">{phase.label}</h3>
                  <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                    {phase.items.map((item) => (
                      <li className="flex gap-2" key={item}>
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {isFull && growthPlan && (
        <section aria-labelledby="organic-growth-plan" className="space-y-8">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold text-primary">
              {isAr ? "من بيانات الموقع إلى فرص عضوية" : "From site data to organic opportunities"}
            </p>
            <h2 className="mt-2 text-2xl font-semibold" id="organic-growth-plan">
              {isAr ? "خطة الكلمات والمنتجات والمحتوى" : "Keyword, product, and content plan"}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">{growthPlan.keywordMethod}</p>
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-primary">
                    {isAr ? "البيانات التي قرأناها" : "Data we actually read"}
                  </p>
                  <h3 className="mt-1 text-xl font-semibold">
                    {isAr ? "عينة الصفحات المفحوصة" : "Sampled page facts"}
                  </h3>
                </div>
                <Badge variant="outline">
                  <TableProperties />
                  {growthPlan.pageSnapshots.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-sm">
                  <thead className="border-y bg-muted/45 text-muted-foreground">
                    <tr>
                      <th className="px-5 py-3 text-start font-medium">{isAr ? "الصفحة" : "Page"}</th>
                      <th className="px-3 py-3 text-start font-medium">{isAr ? "النوع" : "Type"}</th>
                      <th className="px-3 py-3 text-start font-medium">{isAr ? "الكلمات" : "Words"}</th>
                      <th className="px-3 py-3 text-start font-medium">H1</th>
                      <th className="px-3 py-3 text-start font-medium">Meta</th>
                      <th className="px-5 py-3 text-start font-medium">Schema</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {growthPlan.pageSnapshots.map((page) => (
                      <tr key={page.url}>
                        <td className="max-w-md px-5 py-4 align-top">
                          <p className="font-medium">{page.title || (isAr ? "بلا عنوان" : "Untitled")}</p>
                          <a className="mt-1 block break-all text-xs text-primary hover:underline" href={page.url} rel="noreferrer" target="_blank">
                            {page.url}
                          </a>
                        </td>
                        <td className="px-3 py-4 align-top"><Badge variant="secondary">{page.kind}</Badge></td>
                        <td className="metric-numbers px-3 py-4 align-top">{page.wordCount}</td>
                        <td className="metric-numbers px-3 py-4 align-top">{page.h1Count}</td>
                        <td className="px-3 py-4 align-top">{page.descriptionPresent ? (isAr ? "موجود" : "Present") : (isAr ? "ناقص" : "Missing")}</td>
                        <td className="px-5 py-4 align-top text-xs text-muted-foreground">
                          {page.structuredDataTypes.length ? page.structuredDataTypes.join(" · ") : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-5 xl:grid-cols-[.8fr_1.2fr]">
            <Card>
              <CardHeader>
                <KeyRound className="size-6 text-primary" />
                <h3 className="mt-3 text-xl font-semibold">
                  {isAr ? "مرشحات الكلمات والنية" : "Keyword and intent candidates"}
                </h3>
              </CardHeader>
              <CardContent className="space-y-3">
                {growthPlan.keywordOpportunities.length ? growthPlan.keywordOpportunities.map((item) => (
                  <article className="rounded-xl border p-4" key={`${item.targetUrl}-${item.keyword}`}>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{item.keyword}</p>
                      <Badge variant="outline">{item.intent}</Badge>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">{item.rationale}</p>
                    <a className="mt-2 block break-all text-xs text-primary hover:underline" href={item.targetUrl} rel="noreferrer" target="_blank">
                      {item.targetUrl}
                    </a>
                  </article>
                )) : (
                  <p className="text-sm text-muted-foreground">
                    {isAr ? "لم تكن عناوين العينة كافية لاستخراج مرشح موثوق." : "The sampled titles were insufficient for a reliable candidate."}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <PackageSearch className="size-6 text-primary" />
                <h3 className="mt-3 text-xl font-semibold">
                  {isAr ? "تحسين SEO لصفحات المنتجات" : "Product-page SEO enhancements"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {isAr
                    ? "كل اقتراح مرتبط بصفحة منتج ظهرت فعلًا في العينة وبمرشح موضوعي من الصفحة نفسها."
                    : "Every suggestion is tied to a product page found in the sample and a candidate derived from that page."}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {growthPlan.productEnhancements.length ? growthPlan.productEnhancements.map((item) => (
                  <article className="rounded-xl border p-4 sm:p-5" key={item.url}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold text-primary">{isAr ? "الكلمة المرشحة" : "Candidate keyword"}</p>
                        <h4 className="mt-1 font-semibold">{item.targetKeyword}</h4>
                      </div>
                      <Badge variant="secondary">
                        {isAr ? `${item.evidence.wordCount} كلمة` : `${item.evidence.wordCount} words`}
                      </Badge>
                    </div>
                    <div className="mt-4 rounded-lg bg-muted p-3 text-sm">
                      <span className="font-semibold">{isAr ? "عنوان مقترح بعد التحقق:" : "Suggested title after validation:"}</span>{" "}
                      {item.suggestedTitle}
                    </div>
                    <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                      {item.actions.map((action) => (
                        <li className="flex gap-2" key={action}>
                          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                    <a className="mt-4 block break-all text-xs text-primary hover:underline" href={item.url} rel="noreferrer" target="_blank">
                      {item.url}
                    </a>
                  </article>
                )) : (
                  <div className="rounded-xl bg-muted p-4 text-sm text-muted-foreground">
                    {isAr
                      ? "لم يكتشف الفحص صفحة منتج مؤكدة ضمن العينة. لا ننسب اقتراحات منتجات إلى الموقع دون صفحة ودليل."
                      : "No confirmed product page was found in the sample. We do not invent product recommendations without a page and evidence."}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <div className="mb-4 flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary"><BookOpen className="size-5" /></span>
              <div>
                <h3 className="text-xl font-semibold">{isAr ? "أنواع المحتوى التي سنكتبها" : "Content types we will create"}</h3>
                <p className="text-sm text-muted-foreground">{isAr ? "عناوين عمل قابلة للتحرير وليست مقالات مولدة أو جاهزة للنشر." : "Editable working titles, not generated or publish-ready articles."}</p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {growthPlan.contentOpportunities.map((item) => (
                <Card key={`${item.type}-${item.targetKeyword}`}>
                  <CardContent className="p-5">
                    <Badge variant="secondary">{item.label}</Badge>
                    <h4 className="mt-4 font-semibold">{item.workingTitle}</h4>
                    <p className="mt-3 text-xs text-muted-foreground">{item.reason}</p>
                    <p className="mt-4 text-xs font-semibold text-primary">{item.targetKeyword}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Card className="border-primary/20">
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-primary"><BarChart3 className="size-5" /><p className="text-sm font-semibold">Google Search Console</p></div>
                  <h3 className="mt-2 text-xl font-semibold">{isAr ? "بيانات البحث: غير متصلة، وليست صفرًا" : "Search data: not connected, not zero"}</h3>
                  <p className="mt-2 text-sm text-muted-foreground" dir="ltr">{growthPlan.searchConsole.property}</p>
                </div>
                <Badge variant="outline">{isAr ? "بانتظار إثبات الملكية" : "Ownership required"}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                {growthPlan.searchConsole.metrics.map((metric) => (
                  <div className="rounded-xl bg-muted p-4" key={metric.key}>
                    <p className="text-xs text-muted-foreground">{metric.label}</p>
                    <p className="mt-2 font-semibold text-muted-foreground">{isAr ? "غير متصل" : "Not connected"}</p>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {[
                  { href: growthPlan.searchConsole.links.console, label: isAr ? "فتح خاصية Search Console" : "Open Search Console property" },
                  { href: growthPlan.searchConsole.links.setupGuide, label: isAr ? "إضافة وإثبات الملكية" : "Add and verify property" },
                  { href: growthPlan.searchConsole.links.performanceGuide, label: isAr ? "دليل الأداء والاستعلامات" : "Performance and queries guide" },
                  { href: growthPlan.searchConsole.links.urlInspectionGuide, label: isAr ? "فحص الروابط" : "Inspect URLs" },
                  { href: growthPlan.searchConsole.links.sitemapsGuide, label: isAr ? "إرسال sitemap" : "Submit sitemap" },
                ].map((link) => (
                  <Button asChild className="min-h-11" key={link.href} variant="outline">
                    <a href={link.href} rel="noreferrer" target="_blank">{link.label}<ExternalLink /></a>
                  </Button>
                ))}
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                {isAr
                  ? "بعد الربط سنستخدم النقرات ومرات الظهور وCTR ومتوسط الموضع والاستعلامات والصفحات لتأكيد أو رفض مرشحات الكلمات أعلاه. لا نعرض أرقامًا تجريبية لموقع حقيقي."
                  : "After connection, clicks, impressions, CTR, average position, queries, and pages will validate or reject the candidates above. We never show demo numbers for a real site."}
              </p>
            </CardContent>
          </Card>
        </section>
      )}

      {isFull && evidence.length > 0 && (
        <section aria-labelledby="report-evidence">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-primary">
                {isAr ? "لماذا نقول ذلك؟" : "Why we say this"}
              </p>
              <h2 className="mt-2 text-2xl font-semibold" id="report-evidence">
                {isAr ? `الأدلة المسجلة (${evidence.length})` : `Recorded evidence (${evidence.length})`}
              </h2>
            </div>
            <Badge variant="outline">
              {isAr
                ? `${report.pagesScanned ?? 0} صفحات مفحوصة`
                : `${report.pagesScanned ?? 0} pages checked`}
            </Badge>
          </div>
          <div className="mt-5 space-y-3">
            {evidence.map((item) => (
              <details className="rounded-2xl border bg-card p-5" key={item.id}>
                <summary className="cursor-pointer font-semibold">
                  {item.status === "pass"
                    ? isAr
                      ? "ناجح"
                      : "Passed"
                    : item.status === "fail"
                      ? isAr
                        ? "يحتاج إصلاح"
                        : "Needs a fix"
                      : isAr
                        ? "غير متاح"
                        : "Unavailable"}
                  {" — "}
                  {item.message}
                </summary>
                <p className="mt-3 text-xs text-muted-foreground" dir="ltr">
                  {item.checkKey}
                </p>
                {item.urls.length > 0 && (
                  <ul className="mt-3 space-y-2 text-xs text-muted-foreground" dir="ltr">
                    {item.urls.map((url) => (
                      <li className="break-all" key={url}>{url}</li>
                    ))}
                  </ul>
                )}
              </details>
            ))}
          </div>
        </section>
      )}

      {report.limitations.length > 0 && (
        <Card className="border bg-warning-soft">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 size-5 shrink-0 text-warning" />
              <div>
                <h2 className="font-semibold">{isAr ? "ما لم نتمكن من التحقق منه" : "What we could not verify"}</h2>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  {report.limitations.map((limitation) => (
                    <li className="flex gap-2" key={limitation}>
                      <span aria-hidden="true">—</span>
                      <span>{limitation}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!shared && (
        <section
          aria-labelledby="save-free-result"
          className="grid gap-6 rounded-3xl border bg-card p-5 sm:p-7 lg:grid-cols-[1.1fr_.9fr] lg:items-center"
        >
          <div>
            <p className="text-sm font-semibold text-primary">
              {isAr ? "تقريرك الكامل مجاني" : "Your full report is free"}
            </p>
            <h2 className="mt-2 text-2xl font-semibold" id="save-free-result">
              {isAr ? "افتح كل المشاكل والأدلة وخطة العمل" : "Unlock every issue, the evidence, and your action plan"}
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              {isAr
                ? "أدخل بريدك فقط لننشئ رابطًا خاصًا صالحًا 30 يومًا ونسخة PDF تنفيذية من سبع صفحات. لا بطاقة ولا حساب. موافقة التسويق منفصلة واختيارية."
                : "Enter only your email for a private 30-day link and a seven-page executive PDF. No card or account. Marketing consent is separate and optional."}
            </p>
            <ul className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
              {[
                isAr ? "كل المشاكل مرتبة حسب الأولوية" : "Every issue ranked by priority",
                isAr ? "الأدلة والصفحات المرتبطة" : "Evidence and linked pages",
                isAr ? "خطة 30 / 60 / 90 يومًا" : "30 / 60 / 90-day plan",
                isAr ? "PDF قابل للحفظ والمشاركة" : "A saveable, shareable PDF",
              ].map((item) => (
                <li className="flex gap-2" key={item}>
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <ReportLeadForm locale={locale} scanToken={reportId} />
        </section>
      )}

      {shared && isFull && (
        <section
          aria-labelledby="implementation-offer"
          className="grid gap-7 rounded-3xl bg-foreground p-5 text-background sm:p-8 lg:grid-cols-[1.1fr_.9fr] lg:items-center"
        >
          <div>
            <Badge className="bg-background/10 text-background hover:bg-background/10">
              {isAr ? "التقرير مجاني — التنفيذ هو الخدمة" : "The report is free — implementation is the service"}
            </Badge>
            <h2 className="mt-5 text-3xl font-semibold" id="implementation-offer">
              {isAr ? "الآن تعرف المشكلة. الخطوة التالية هي إصلاحها وقياس النتيجة." : "Now you know the problem. Next, fix it and measure the result."}
            </h2>
            <p className="mt-4 text-background/70">
              {isAr
                ? "بصيرة ترتّب الإصلاحات، تساعدك على إنتاج محتوى مبني على أدلتك، ثم تعيد الفحص بالطريقة نفسها. لا نبيع وعدًا بالترتيب؛ نبيع عملًا قابلًا للقياس."
                : "Basirah prioritizes the fixes, helps produce content grounded in your evidence, then rescans with the same method. We do not sell a ranking promise; we sell measurable work."}
            </p>
            <ul className="mt-6 space-y-3 text-sm">
              {[
                isAr ? "أولويات تنفيذ واضحة بدل قائمة طويلة" : "A clear implementation order instead of a long list",
                isAr ? "مسودات محتوى مرتبطة بالمشكلة والدليل" : "Content drafts tied to the issue and evidence",
                isAr ? "إعادة فحص تثبت ما تغيّر وما بقي" : "A rescan that proves what changed and what remains",
              ].map((item) => (
                <li className="flex gap-2" key={item}>
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-3 rounded-2xl bg-background p-5 text-foreground sm:p-6">
            <Button asChild className="h-12 w-full">
              <a href={`/api/v1/public/reports/${encodeURIComponent(reportId)}/pdf?locale=${locale}`}>
                <Download />
                {isAr ? "نزّل التقرير التنفيذي — 7 صفحات" : "Download the seven-page executive report"}
              </a>
            </Button>
            <Button asChild className="h-12 w-full" variant="outline">
              <Link href={publicPath(locale, "/pricing")}>
                {isAr ? "شاهد خيارات التنفيذ" : "See implementation options"}
                <Arrow />
              </Link>
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              {isAr
                ? "لا يتم تحصيل أي مبلغ مقابل هذا التقرير. تفعيل الخطط المدفوعة يتم بشكل منفصل."
                : "There is no charge for this report. Paid plan activation is handled separately."}
            </p>
          </div>
        </section>
      )}

      <div className="flex flex-col justify-center gap-3 sm:flex-row">
        <Button asChild className="h-11" variant="outline">
          <Link href={publicPath(locale, "/methodology")}>
            {isAr ? "اقرأ المنهجية والقيود" : "Read the methodology and limits"}
          </Link>
        </Button>
        <Button asChild className="h-11">
          <Link href={publicPath(locale, "/#checker")}>
            {isAr ? "افحص متجرًا آخر" : "Check another store"}
            <Arrow />
          </Link>
        </Button>
      </div>
    </div>
  );
}
