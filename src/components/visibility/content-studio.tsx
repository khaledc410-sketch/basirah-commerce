"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpLeft,
  Bot,
  Braces,
  CheckCircle2,
  CircleAlert,
  Clipboard,
  ExternalLink,
  FileCheck2,
  ImageIcon,
  MessageSquareText,
  Save,
  Search,
  Send,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { MessageResponse } from "@/components/ai-elements/message";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  articleReviewChecklist,
  optimizationTracks,
  sensitiveSkinArticle,
} from "@/components/visibility/demo-article";
import { DraftGenerator } from "@/components/visibility/draft-generator";

const trackIcons = {
  seo: Search,
  aeo: MessageSquareText,
  geo: Sparkles,
};

const aiDraftNote = `**اقتراح مساعد بصيرة**

اعتمدت المسودة على سؤال متكرر عن **البشرة الحساسة** وربطت كل ادعاء منتج بمصدر داخل بيانات المتجر.

- بدأت بافتتاحية واضحة تخدم القارئ من الحقائق المتاحة.
- أضفت عنوانًا ووصفًا ورابطًا داخليًا واضحًا لأساس SEO.
- أظهرت المؤلف والتاريخ والمصادر والحدود لدعم محتوى أصلي وموثوق ومفيد للناس.

> هذه مسودة تحريرية وليست توصية طبية أو ضمانًا للترتيب أو الاستشهاد.`;

export function ContentStudio() {
  const [status, setStatus] = useState<"draft" | "review">("draft");
  const [title, setTitle] = useState<string>(sensitiveSkinArticle.title);
  const [targetQuery, setTargetQuery] = useState<string>(
    sensitiveSkinArticle.targetQuery,
  );
  const [slug, setSlug] = useState<string>(sensitiveSkinArticle.slug);
  const [metaTitle, setMetaTitle] = useState<string>(sensitiveSkinArticle.metaTitle);
  const [metaDescription, setMetaDescription] = useState<string>(
    sensitiveSkinArticle.metaDescription,
  );
  const [heroAlt, setHeroAlt] = useState<string>(sensitiveSkinArticle.heroAlt);
  const [reviewChecks, setReviewChecks] = useState<Record<string, boolean>>(
    () =>
      Object.fromEntries(
        articleReviewChecklist.map((item) => [item.id, item.defaultChecked]),
      ),
  );

  const completedReviewItems = Object.values(reviewChecks).filter(Boolean).length;
  const isReviewComplete = completedReviewItems === articleReviewChecklist.length;

  function saveDraft() {
    toast.success("حُفظت التعديلات محليًا في وضع العرض", {
      description: "لم تُنشر المسودة في متجر أو نطاق فعلي.",
    });
  }

  function requestReview() {
    setStatus("review");
    toast.success("انتقلت المسودة إلى المراجعة", {
      description: "تبقى غير منشورة وغير مفهرسة حتى اكتمال الاعتماد.",
    });
  }

  async function copyClientLink() {
    const url = `${window.location.origin}${sensitiveSkinArticle.previewPath}`;

    try {
      await navigator.clipboard.writeText(url);
      toast.success("نُسخ رابط معاينة العميل", {
        description: "الرابط للمراجعة فقط، ولا يمنح الصفحة قيمة SEO بحد ذاته.",
      });
    } catch {
      toast.error("تعذّر النسخ التلقائي", {
        description: url,
      });
    }
  }

  return (
    <div className="mx-auto max-w-[1440px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <Card className="border-primary/20 bg-primary/[0.035]">
        <CardContent className="grid gap-5 p-5 lg:grid-cols-[1fr_auto] lg:items-center lg:p-6">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={status === "review" ? "secondary" : "outline"}>
                {status === "review" ? "بانتظار المراجعة" : "مسودة تجريبية"}
              </Badge>
              <Badge variant="outline">مساعدة بالذكاء الاصطناعي</Badge>
              <span className="text-xs text-muted-foreground">
                آخر تعديل: 11 يوليو 2026
              </span>
            </div>
            <h2 className="mt-3 text-xl font-semibold sm:text-2xl">
              دليل البشرة الحساسة لمَدى للعناية
            </h2>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              مسودة مبنية على بيانات العرض. تحتاج مراجعة الادعاءات والروابط، ثم
              نشرًا على نطاق التاجر بعنوان أساسي نهائي كي تبدأ مرحلة الفهرسة
              وقياس الظهور.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 lg:justify-end">
            <Button className="min-h-11" onClick={saveDraft} variant="outline">
              <Save />
              حفظ المسودة
            </Button>
            <Button className="min-h-11" onClick={requestReview} variant="secondary">
              <Send />
              إرسال للمراجعة
            </Button>
            <Button asChild className="min-h-11">
              <Link
                href={sensitiveSkinArticle.previewPath}
                rel="noreferrer"
                target="_blank"
              >
                معاينة العميل
                <ExternalLink />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="draft" dir="rtl">
        <TabsList className="h-auto w-full justify-start overflow-x-auto bg-transparent p-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" variant="line">
          <TabsTrigger className="min-h-11 px-3" value="draft">
            المسودة
          </TabsTrigger>
          <TabsTrigger className="min-h-11 px-3" value="generator">
            مسودة جديدة
          </TabsTrigger>
          <TabsTrigger className="min-h-11 px-3" value="optimization">
            SEO · وضوح · ثقة
          </TabsTrigger>
          <TabsTrigger className="min-h-11 px-3" value="review">
            المراجعة والتصدير
          </TabsTrigger>
        </TabsList>

        <TabsContent className="mt-5" value="generator">
          <DraftGenerator />
        </TabsContent>

        <TabsContent className="mt-5 space-y-5" value="draft">
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-5">
              <Card>
                <CardHeader>
                  <CardTitle>بيانات البحث والصفحة</CardTitle>
                  <CardDescription>
                    عدّلها قبل التصدير. هذه الحقول لا تغيّر رابط المعاينة العام في
                    وضع العرض.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="article-title">عنوان المقال</Label>
                    <Input
                      id="article-title"
                      onChange={(event) => setTitle(event.target.value)}
                      value={title}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="target-query">الاستعلام المستهدف</Label>
                    <Input
                      id="target-query"
                      onChange={(event) => setTargetQuery(event.target.value)}
                      value={targetQuery}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="article-slug">الرابط المختصر</Label>
                    <div className="flex h-11 items-center rounded-lg border border-input bg-muted/40 px-2.5 text-sm" dir="ltr">
                      <span className="shrink-0 text-muted-foreground">/insights/</span>
                      <input
                        aria-label="الرابط المختصر"
                        className="min-w-0 flex-1 bg-transparent outline-none"
                        id="article-slug"
                        onChange={(event) => setSlug(event.target.value)}
                        value={slug}
                      />
                    </div>
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <div className="flex items-center justify-between gap-3">
                      <Label htmlFor="meta-title">عنوان نتيجة البحث</Label>
                      <span className="metric-numbers text-xs text-muted-foreground">
                        {metaTitle.length} حرفًا
                      </span>
                    </div>
                    <Input
                      id="meta-title"
                      onChange={(event) => setMetaTitle(event.target.value)}
                      value={metaTitle}
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <div className="flex items-center justify-between gap-3">
                      <Label htmlFor="meta-description">وصف نتيجة البحث</Label>
                      <span className="metric-numbers text-xs text-muted-foreground">
                        {metaDescription.length} حرفًا
                      </span>
                    </div>
                    <Textarea
                      id="meta-description"
                      onChange={(event) => setMetaDescription(event.target.value)}
                      rows={3}
                      value={metaDescription}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>المسودة التي أنشأها المساعد</CardTitle>
                  <CardDescription>
                    المحتوى أدناه نقطة بداية بشرية المراجعة، وليس نصًا منشورًا.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="flex gap-3 rounded-xl border border-primary/15 bg-primary/[0.035] p-4">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                      <Bot className="size-4" />
                    </span>
                    <MessageResponse className="min-w-0 text-sm">
                      {aiDraftNote}
                    </MessageResponse>
                  </div>

                  <section aria-labelledby="direct-answer-heading" className="rounded-xl border bg-muted/35 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h3 className="font-semibold" id="direct-answer-heading">
                        الإجابة المباشرة
                      </h3>
                      <Badge variant="secondary">واضحة ومؤسّسة على حقائق</Badge>
                    </div>
                    <p className="mt-3 text-sm leading-7">
                      {sensitiveSkinArticle.directAnswer}
                    </p>
                  </section>

                  <section aria-labelledby="outline-heading">
                    <h3 className="font-semibold" id="outline-heading">
                      هيكل المقال
                    </h3>
                    <div className="mt-3 grid gap-3 md:grid-cols-3">
                      {sensitiveSkinArticle.steps.map((step) => (
                        <div className="rounded-xl border p-4" key={step.number}>
                          <span className="metric-numbers text-xs font-semibold text-primary">
                            H2 · {step.number}
                          </span>
                          <p className="mt-2 font-semibold">{step.title}</p>
                          <p className="mt-2 text-xs leading-6 text-muted-foreground">
                            {step.body}
                          </p>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section aria-labelledby="product-links-heading">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h3 className="font-semibold" id="product-links-heading">
                        روابط المنتجات داخل المقال
                      </h3>
                      <Badge variant="outline">رابطان تجريبيان</Badge>
                    </div>
                    <div className="mt-3 space-y-3">
                      {sensitiveSkinArticle.products.map((product) => (
                        <div className="flex gap-4 rounded-xl border p-4" key={product.id}>
                          <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                            <Image
                              alt={product.alt}
                              className="object-cover"
                              fill
                              sizes="64px"
                              src={product.image}
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="font-semibold">{product.name}</p>
                              <Link className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline" href={product.href}>
                                فتح بيانات العرض
                                <ArrowUpLeft className="size-3" />
                              </Link>
                            </div>
                            <p className="mt-1 text-xs leading-5 text-muted-foreground">
                              {product.evidence}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section aria-labelledby="faq-draft-heading">
                    <h3 className="font-semibold" id="faq-draft-heading">
                      الأسئلة الشائعة
                    </h3>
                    <div className="mt-3 space-y-3">
                      {sensitiveSkinArticle.faqs.map((faq) => (
                        <div className="rounded-xl border p-4" key={faq.question}>
                          <p className="font-semibold">{faq.question}</p>
                          <p className="mt-2 text-sm leading-7 text-muted-foreground">
                            {faq.answer}
                          </p>
                        </div>
                      ))}
                    </div>
                  </section>
                </CardContent>
              </Card>
            </div>

            <aside className="space-y-5">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="size-4 text-primary" />
                    صورة المقال
                  </CardTitle>
                  <CardDescription>
                    أصل بصري مولّد للمسودة، مع مراجعة بشرية قبل الاستخدام النهائي.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative aspect-video overflow-hidden rounded-xl bg-muted">
                    <Image
                      alt={heroAlt}
                      className="object-cover"
                      fill
                      loading="eager"
                      sizes="(max-width: 1280px) 100vw, 360px"
                      src={sensitiveSkinArticle.heroImage}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hero-alt">النص البديل</Label>
                    <Textarea
                      id="hero-alt"
                      onChange={(event) => setHeroAlt(event.target.value)}
                      rows={4}
                      value={heroAlt}
                    />
                  </div>
                  <p className="text-xs leading-5 text-muted-foreground">
                    لا نحشو كلمات مفتاحية في النص البديل؛ نصف الصورة بما يخدم من
                    لا يراها.
                  </p>
                  <Badge className="w-fit" variant="outline">
                    {sensitiveSkinArticle.heroProvenance}
                  </Badge>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>معاينة نتيجة البحث</CardTitle>
                  <CardDescription>شكل تقريبي، وليس نتيجة فعلية أو ضمان ظهور.</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="truncate text-xs text-success" dir="ltr">
                    mada-care.example/insights/{slug}
                  </p>
                  <p className="mt-1 text-lg font-medium text-primary">{metaTitle}</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {metaDescription}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>رابط مراجعة العميل</CardTitle>
                  <CardDescription>
                    قابل للمشاركة، لكنه مضبوط على noindex/noFollow ولا يبني سلطة
                    بحثية.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="rounded-lg bg-muted px-3 py-2 text-xs" dir="ltr">
                    {sensitiveSkinArticle.previewPath}
                  </div>
                  <Button className="min-h-11 w-full" onClick={copyClientLink} variant="outline">
                    <Clipboard />
                    نسخ رابط المعاينة
                  </Button>
                </CardContent>
              </Card>
            </aside>
          </div>
        </TabsContent>

        <TabsContent className="mt-5 space-y-5" value="optimization">
          <div className="grid gap-5 lg:grid-cols-3">
            {optimizationTracks.map((track) => {
              const Icon = trackIcons[track.key];
              return (
                <Card key={track.key}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Icon className="size-5" />
                      </span>
                      <div className="text-left">
                        <span className="metric-numbers text-2xl font-semibold text-primary">
                          {track.score}
                        </span>
                        <span className="text-xs text-muted-foreground">/100</span>
                      </div>
                    </div>
                    <Badge className="mt-3" variant="outline">
                      {track.label}
                    </Badge>
                    <CardTitle className="mt-2 text-lg">{track.title}</CardTitle>
                    <CardDescription className="leading-6">
                      {track.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="rounded-xl bg-muted p-3 text-xs leading-6">
                      {track.merchantOutcome}
                    </p>
                    <ul className="space-y-2">
                      {track.checks.map((check) => (
                        <li className="flex items-center gap-2 text-sm" key={check}>
                          <CheckCircle2 className="size-4 shrink-0 text-success" />
                          {check}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card>
            <CardContent className="grid gap-5 p-5 lg:grid-cols-[1fr_360px] lg:items-center lg:p-6">
              <div>
                <div className="flex items-center gap-2">
                  <Braces className="size-5 text-primary" />
                  <h2 className="text-lg font-semibold">البيانات المنظمة في المعاينة</h2>
                </div>
                <p className="mt-2 max-w-3xl text-sm leading-7 text-muted-foreground">
                  تتضمن المعاينة Article وBreadcrumbList، وFAQPage فقط عندما توجد
                  أسئلة ظاهرة ومفيدة للقارئ. البيانات المنظمة أداة SEO عادية وليست
                  شرطًا لميزات Google التوليدية أو ضمانًا للظهور.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  ["Article", "مسودة"],
                  ["Breadcrumb", "جاهز"],
                  ["FAQ", "دلالي"],
                ].map(([label, state]) => (
                  <div className="rounded-xl border p-3" key={label}>
                    <p className="font-mono text-xs">{label}</p>
                    <p className="mt-1 text-xs text-success">{state}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3 rounded-xl border bg-card p-5 text-sm text-muted-foreground">
            <CircleAlert className="mt-0.5 size-5 shrink-0 text-warning" />
            <p>
              <span className="font-semibold text-foreground">كيف نقرأ الدرجات؟</span>{" "}
              هي فحوص تحريرية داخلية للمسودة فقط. لا تقيس ترتيب Google أو ظهور
              مقتطف أو استشهاد منصة ذكاء اصطناعي، ولا يمكنها ضمان أي منها.
            </p>
          </div>
        </TabsContent>

        <TabsContent className="mt-5 space-y-5" value="review">
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <CardTitle>قائمة مراجعة التاجر</CardTitle>
                    <CardDescription className="mt-1">
                      لا يتاح النشر حتى تكتمل عناصر المسؤولية والمصادر.
                    </CardDescription>
                  </div>
                  <Badge variant={isReviewComplete ? "secondary" : "outline"}>
                    {completedReviewItems} من {articleReviewChecklist.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-1">
                {articleReviewChecklist.map((item) => (
                  <div className="flex items-start gap-3 rounded-xl p-3 hover:bg-muted/50" key={item.id}>
                    <Checkbox
                      checked={reviewChecks[item.id]}
                      id={item.id}
                      onCheckedChange={(checked) =>
                        setReviewChecks((current) => ({
                          ...current,
                          [item.id]: checked === true,
                        }))
                      }
                    />
                    <Label className="cursor-pointer leading-6" htmlFor={item.id}>
                      {item.label}
                    </Label>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="space-y-5">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileCheck2 className="size-4 text-primary" />
                    حالة التصدير
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    ["Metadata", "جاهز للمعاينة"],
                    ["Article JSON-LD", "مسودة"],
                    ["BreadcrumbList", "جاهز"],
                    ["FAQPage", "دلالي فقط"],
                    ["Canonical النهائي", "ينتظر نطاق التاجر"],
                  ].map(([label, value]) => (
                    <div className="flex items-center justify-between gap-4 text-sm" key={label}>
                      <span dir="ltr">{label}</span>
                      <Badge variant="outline">{value}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>الخطوة النهائية</CardTitle>
                  <CardDescription>
                    بعد الاعتماد، صدّر المحتوى إلى نطاق المتجر، أضف canonical
                    النهائي وتاريخ النشر، ثم اطلب الفهرسة وابدأ القياس.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button className="min-h-11 w-full" disabled={!isReviewComplete}>
                    اعتماد للتصدير
                    <ArrowUpLeft />
                  </Button>
                  <Button className="min-h-11 w-full" disabled variant="outline">
                    النشر المباشر غير متصل في العرض
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
