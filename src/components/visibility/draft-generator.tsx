"use client";

import {
  CheckCircle2,
  CircleAlert,
  FileText,
  ListChecks,
  ShieldCheck,
  Sparkles,
  Wand2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import type { ArticleBrief, ArticleDraft, ArticleReview } from "@/modules/content";

interface StudioResponse {
  brief: ArticleBrief;
  draft: ArticleDraft;
  review: ArticleReview;
  structuredData: { blogPosting: unknown; faqPage: unknown };
  limitation: string;
}

const ratingLabels: Record<ArticleReview["rating"], string> = {
  exceptional: "استثنائية",
  strong: "قوية",
  acceptable: "مقبولة",
  "below-standard": "دون المستوى",
  rewrite: "تحتاج إعادة كتابة",
};

const severityLabels: Record<string, string> = {
  critical: "حرجة",
  high: "مرتفعة",
  medium: "متوسطة",
  low: "منخفضة",
};

const pipelinePhases = [
  { icon: ListChecks, label: "الموجز والحقائق" },
  { icon: FileText, label: "الهيكل" },
  { icon: Wand2, label: "المسودة" },
  { icon: ShieldCheck, label: "بوابة الفحص" },
  { icon: Sparkles, label: "البيانات المنظمة" },
];

export function DraftGenerator() {
  const [topic, setTopic] = useState("دليل اختيار روتين للبشرة الحساسة بثقة");
  const [targetQuery, setTargetQuery] = useState("ما أفضل روتين للبشرة الحساسة؟");
  const [demandEvidence, setDemandEvidence] = useState(
    "126 محادثة موافق عليها سألت عن البشرة الحساسة خلال آخر 30 يومًا",
  );
  const [slug, setSlug] = useState("sensitive-skin-routine-guide");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<StudioResponse | null>(null);

  async function generate() {
    setLoading(true);
    try {
      const response = await fetch("/api/content/studio", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ topic, targetQuery, demandEvidence, slug }),
      });
      const payload = (await response.json()) as StudioResponse & { error?: string };
      if (!response.ok) {
        toast.error(payload.error ?? "تعذر إنشاء المسودة.");
        return;
      }
      setResult(payload);
      toast.success("اكتملت المراحل الخمس", {
        description: `درجة الفحص ${payload.review.score}/100 · ${payload.review.blocking ? "المسودة محجوبة عن النشر" : "جاهزة للمراجعة البشرية"}`,
      });
    } catch {
      toast.error("تعذر الاتصال بخدمة المحتوى.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>أنشئ مسودة جديدة بالمنهجية الكاملة</CardTitle>
          <CardDescription>
            موجز من الحقائق الموثّقة فقط، ثم هيكل وأسلوب الإجابة أولًا، ثم فحص تحريري من 100 نقطة
            يحجب المسودة عند أي ادعاء بلا مصدر.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="gen-topic">موضوع المقال</Label>
              <Input id="gen-topic" onChange={(event) => setTopic(event.target.value)} value={topic} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gen-query">السؤال المستهدف</Label>
              <Input
                id="gen-query"
                onChange={(event) => setTargetQuery(event.target.value)}
                value={targetQuery}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gen-slug">الرابط المختصر (لاتيني بشرطات)</Label>
              <Input dir="ltr" id="gen-slug" onChange={(event) => setSlug(event.target.value)} value={slug} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="gen-demand">دليل الطلب من محادثات عملائك</Label>
              <Textarea
                id="gen-demand"
                onChange={(event) => setDemandEvidence(event.target.value)}
                rows={2}
                value={demandEvidence}
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              {pipelinePhases.map((phase, index) => (
                <span
                  className="flex items-center gap-1.5 rounded-full border bg-muted/40 px-3 py-1.5 text-xs font-medium"
                  key={phase.label}
                >
                  {result ? (
                    <CheckCircle2 className="size-3.5 text-success" />
                  ) : (
                    <phase.icon className="size-3.5 text-primary" />
                  )}
                  {index + 1}. {phase.label}
                </span>
              ))}
            </div>
            <Button className="min-h-11" disabled={loading} onClick={generate}>
              {loading ? <Spinner className="size-4" /> : <Wand2 />}
              {loading ? "تعمل المراحل الخمس…" : "أنشئ المسودة"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {result && (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
          {/* ---------- Draft preview ---------- */}
          <div className="space-y-5">
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <CardTitle>{result.draft.title}</CardTitle>
                  <Badge variant="outline" dir="ltr">/insights/{result.draft.slug}</Badge>
                </div>
                <CardDescription>
                  {result.draft.author} · {result.draft.metaTitle}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <section className="rounded-xl border bg-muted/35 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="font-semibold">الإجابة المباشرة</h3>
                    <Badge variant="secondary">واضحة ومفيدة للقارئ</Badge>
                  </div>
                  <p className="mt-3 text-sm leading-7">{result.draft.directAnswer}</p>
                </section>

                <section className="rounded-xl border border-primary/15 bg-primary/[0.035] p-5">
                  <h3 className="font-semibold">أهم الخلاصات</h3>
                  <ul className="mt-3 space-y-2 text-sm leading-7">
                    {result.draft.keyTakeaways.map((takeaway) => (
                      <li className="flex gap-2" key={takeaway}>
                        <CheckCircle2 className="mt-1.5 size-4 shrink-0 text-primary" />
                        {takeaway}
                      </li>
                    ))}
                  </ul>
                </section>

                {result.draft.sections.map((section) => (
                  <section key={section.heading}>
                    <h3 className="font-semibold">{section.heading}</h3>
                    <div className="mt-2 space-y-2">
                      {section.paragraphs.map((paragraph) => (
                        <p className="text-sm leading-7 text-muted-foreground" key={paragraph}>
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </section>
                ))}

                <section>
                  <h3 className="font-semibold">أسئلة شائعة</h3>
                  <div className="mt-3 space-y-3">
                    {result.draft.faqs.map((faq) => (
                      <div className="rounded-xl border p-4" key={faq.question}>
                        <p className="text-sm font-semibold">{faq.question}</p>
                        <p className="mt-1.5 text-sm leading-7 text-muted-foreground">{faq.answer}</p>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="rounded-xl border border-dashed p-4">
                  <h3 className="text-sm font-semibold">المصادر والحدود</h3>
                  <ul className="mt-2 space-y-1.5 text-xs leading-6 text-muted-foreground">
                    {result.draft.sources.map((source) => (
                      <li key={source.name}>• {source.name} — {source.detail}</li>
                    ))}
                    {result.draft.limitations.map((limitation) => (
                      <li key={limitation}>• {limitation}</li>
                    ))}
                  </ul>
                </section>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>البيانات المنظمة المولّدة</CardTitle>
                <CardDescription>BlogPosting وFAQPage من حقائق المسودة فقط.</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="max-h-72 overflow-auto rounded-xl bg-muted/40 p-4 text-xs" dir="ltr">
                  {JSON.stringify(result.structuredData, null, 2)}
                </pre>
              </CardContent>
            </Card>
          </div>

          {/* ---------- Review sidebar ---------- */}
          <div className="space-y-5">
            <Card className={result.review.blocking ? "border-destructive/40" : "border-success/40"}>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <CardTitle>بوابة الفحص التحريري</CardTitle>
                  <Badge variant={result.review.blocking ? "destructive" : "secondary"}>
                    {result.review.blocking ? "محجوبة عن النشر" : "اجتازت البوابة"}
                  </Badge>
                </div>
                <CardDescription>{result.review.blockingReason}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-baseline gap-2">
                  <span className="metric-numbers text-4xl font-bold text-primary">
                    {result.review.score}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    / 100 · جودة {ratingLabels[result.review.rating]}
                  </span>
                </div>
                <div className="space-y-3">
                  {result.review.categories.map((category) => (
                    <div key={category.key}>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium">{category.label}</span>
                        <span className="metric-numbers text-muted-foreground">
                          {category.score}/{category.max}
                        </span>
                      </div>
                      <Progress className="mt-1.5" value={(category.score / category.max) * 100} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>كشف الأنماط الآلية</CardTitle>
                <CardDescription>فحوص تمنع نشر محتوى يبدو مولّدًا آليًا.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center justify-between rounded-lg border px-3 py-2">
                  <span>تفاوت أطوال الجمل</span>
                  <Badge variant={result.review.aiSignals.burstinessBand === "flagged" ? "destructive" : "secondary"}>
                    {result.review.aiSignals.burstiness}
                  </Badge>
                </div>
                <div className="flex items-center justify-between rounded-lg border px-3 py-2">
                  <span>تنوع المفردات</span>
                  <Badge variant={result.review.aiSignals.ttrBand === "low" ? "destructive" : "secondary"}>
                    {result.review.aiSignals.typeTokenRatio}
                  </Badge>
                </div>
                <div className="flex items-center justify-between rounded-lg border px-3 py-2">
                  <span>عبارات مرتبطة بالمحتوى الآلي</span>
                  <Badge variant={result.review.aiSignals.bannedPhrases.length > 0 ? "destructive" : "secondary"}>
                    {result.review.aiSignals.bannedPhrases.length}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>الحقائق التي بُنيت عليها المسودة</CardTitle>
                <CardDescription>
                  {result.brief.facts.length} حقيقة موثّقة · {result.brief.missingFacts.length} حقيقة
                  ناقصة مُعلنة
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {result.brief.facts.slice(0, 6).map((fact) => (
                  <div className="rounded-lg border px-3 py-2 text-xs leading-6" key={fact.claim}>
                    <p>{fact.claim}</p>
                    <p className="text-muted-foreground">المصدر: {fact.source}</p>
                  </div>
                ))}
                {result.review.issues.length > 0 && (
                  <div className="rounded-lg border border-amber-300/60 bg-amber-50/50 px-3 py-2 text-xs leading-6 dark:bg-amber-950/20">
                    <p className="flex items-center gap-1.5 font-semibold">
                      <CircleAlert className="size-3.5" />
                      ملاحظات الفحص ({result.review.issues.length})
                    </p>
                    <ul className="mt-1 space-y-1">
                      {result.review.issues.map((issue) => (
                        <li key={issue.message}>
                          <Badge className="me-1.5" variant="outline">{severityLabels[issue.severity]}</Badge>
                          {issue.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <p className="pt-1 text-[11px] leading-5 text-muted-foreground">{result.limitation}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
