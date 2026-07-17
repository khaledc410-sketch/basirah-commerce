import {
  Bot,
  Braces,
  CircleHelp,
  ExternalLink,
  FileCheck2,
  FileSearch,
  Globe2,
  Languages,
  Link2,
  Scale,
  SearchCheck,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { publicPath, type PublicLocale } from "@/i18n/public";

interface MethodologyContentProps {
  locale: PublicLocale;
}
export function MethodologyContent({ locale }: MethodologyContentProps) {
  const isAr = locale === "ar";
  const components = [
    ["technical", isAr ? "تقني" : "Technical", "25%"],
    ["content", isAr ? "المحتوى" : "Content", "30%"],
    ["entity", isAr ? "وضوح الكيان" : "Entity clarity", "10%"],
    ["trust", isAr ? "الثقة" : "Trust", "15%"],
    ["answerability", isAr ? "الوضوح والفائدة" : "Clarity and usefulness", "10%"],
    ["structuredData", isAr ? "البيانات المنظمة" : "Structured data", "5%"],
    ["externalEvidence", isAr ? "الأدلة الخارجية" : "External evidence", "5%"],
  ];
  const googlePrinciples = [
    {
      icon: FileCheck2,
      title: isAr ? "1. قيمة أصلية للناس" : "1. Original value for people",
      body: isAr
        ? "نبحث عن حقائق المتجر وخبرته ومصادره ووضوح الفائدة. لا نعتبر إعادة صياغة المحتوى الشائع أو إنتاج صفحات كثيرة قيمة بحد ذاتهما."
        : "We look for store facts, expertise, sources, and useful information. Rephrasing common material or producing many pages is not treated as value by itself.",
    },
    {
      icon: Globe2,
      title: isAr ? "2. أساس تقني وتجاري" : "2. Technical and commerce foundations",
      body: isAr
        ? "نختبر قابلية Googlebot للقراءة، وnoindex، وcanonical، وsitemap، وHTML المرئي، ودقة بيانات المنتجات والسياسات ضمن حدود الفحص."
        : "Within the scan's limits, we test Googlebot access, noindex, canonicals, sitemaps, visible HTML, and accurate product and policy data.",
    },
    {
      icon: SearchCheck,
      title: isAr ? "3. قياس من مصدر رسمي" : "3. First-party measurement",
      body: isAr
        ? "عند ربط مصدر رسمي نعرض بيانات Search Console، بما فيها تقرير أداء الذكاء الاصطناعي التوليدي حيث يتوفر، منفصلة عن درجة الجاهزية."
        : "When an official source is connected, Search Console data—including the Generative AI performance report where available—stays separate from readiness scoring.",
    },
  ];

  return (
    <main id="main-content">
      <section className="relative border-b py-16 sm:py-24">
        <div aria-hidden="true" className="subtle-grid absolute inset-0 -z-10" />
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <Badge variant="secondary">{isAr ? "المنهجية والحدود" : "Methodology and limits"}</Badge>
          <h1 className="mt-5 text-4xl font-bold sm:text-5xl">
            {isAr ? "نحسب الجاهزية من الأدلة، لا من انطباع نموذج" : "We score readiness from evidence, not a model's impression"}
          </h1>
          <p className="mx-auto mt-5 max-w-3xl text-lg text-muted-foreground">
            {isAr
              ? "الفاحص يقرأ HTML وXML وJSON-LD العام، يسجل الدليل، ثم يحسب النتيجة حتميًا. يمكن للذكاء الاصطناعي أن يشرح النتيجة، لكنه لا يختار الدرجة."
              : "The checker reads public HTML, XML, and JSON-LD, records evidence, then computes the score deterministically. AI may explain the result, but it never chooses the score."}
          </p>
          <Button asChild className="mt-8 h-12 px-6">
            <Link href={publicPath(locale, "/#checker")}>{isAr ? "ابدأ فحصًا مجانيًا" : "Start a free check"}</Link>
          </Button>
        </div>
      </section>

      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-5 lg:grid-cols-3">
            {[
              {
                icon: SearchCheck,
                title: isAr ? "الجاهزية" : "Readiness",
                body: isAr ? "اختبارات قابلة للتكرار للموقع نفسه وفي الوقت نفسه." : "Repeatable checks of the same site at the same time.",
                note: isAr ? "تدخل في الدرجة" : "Included in the score",
              },
              {
                icon: Globe2,
                title: isAr ? "الاكتشاف في Google" : "Google discovery",
                body: isAr ? "بيانات فهرسة أو Search Console عند توفر مصدر رسمي." : "Indexing or Search Console data when a first-party source exists.",
                note: isAr ? "مقياس منفصل" : "A separate measure",
              },
              {
                icon: Bot,
                title: isAr ? "الظهور المرصود" : "Observed AI visibility",
                body: isAr ? "عينة مؤرخة باسم المنصة وطريقة القياس، وتتطلب التكرار قبل وصف الاتجاه." : "A dated sample naming platform and method; repetition is required before calling it a trend.",
                note: isAr ? "مقياس منفصل" : "A separate measure",
              },
            ].map((item) => (
              <Card key={item.title}>
                <CardContent className="p-6">
                  <item.icon className="size-7 text-primary" />
                  <h2 className="mt-5 text-xl font-semibold">{item.title}</h2>
                  <p className="mt-3 text-muted-foreground">{item.body}</p>
                  <p className="mt-6 border-t pt-4 text-xs font-semibold text-primary">{item.note}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y bg-card py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold text-primary">
              {isAr ? "مرجعنا في Google Search" : "Our Google Search reference"}
            </p>
            <h2 className="mt-3 text-3xl font-semibold">
              {isAr ? "نطبّق الإرشادات الرسمية في ثلاث طبقات قابلة للمراجعة" : "We apply the official guidance through three auditable layers"}
            </h2>
            <p className="mt-4 text-muted-foreground">
              {isAr
                ? "هذه مواءمة مع وثائق Google Search وليست اعتمادًا أو شراكة أو وعدًا بالظهور. آخر مراجعة للمصدر: 14 يوليو 2026."
                : "This is alignment with Google Search documentation—not certification, partnership, or a visibility promise. Source last reviewed: July 14, 2026."}
            </p>
          </div>
          <ol className="mt-10 grid gap-5 lg:grid-cols-3">
            {googlePrinciples.map((principle) => (
              <li className="rounded-2xl border bg-background p-6" key={principle.title}>
                <principle.icon className="size-7 text-primary" aria-hidden="true" />
                <h3 className="mt-5 text-xl font-semibold">{principle.title}</h3>
                <p className="mt-3 text-muted-foreground">{principle.body}</p>
              </li>
            ))}
          </ol>
          <div className="mt-8 grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
            <div className="rounded-2xl border bg-background p-6">
              <h3 className="text-lg font-semibold">{isAr ? "ما لا نعامله كشرط للظهور في Google" : "What we do not treat as a Google visibility requirement"}</h3>
              <ul className="mt-4 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
                {[
                  isAr ? "ملفات llms.txt أو ملفات AI خاصة" : "llms.txt or special AI files",
                  isAr ? "طول مثالي ثابت أو تقسيم النص إلى شذرات" : "A fixed ideal length or tiny content chunks",
                  isAr ? "إجبار العناوين على صيغة سؤال أو FAQ" : "Forced question headings or FAQs",
                  isAr ? "إعادة كتابة نسخة منفصلة لمحركات الذكاء الاصطناعي" : "Separate rewrites for AI systems",
                  isAr ? "إشارات خارجية غير أصيلة أو مصطنعة" : "Inauthentic or manufactured mentions",
                  isAr ? "بيانات منظمة خاصة بالبحث التوليدي" : "Special generative-search structured data",
                ].map((item) => (
                  <li className="flex gap-2" key={item}>
                    <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl bg-foreground p-6 text-background">
              <h3 className="text-lg font-semibold">{isAr ? "مصادر Google التجارية" : "Google commerce sources"}</h3>
              <p className="mt-3 text-sm text-background/70">
                {isAr
                  ? "يمكن أن تدعم Merchant Center وGoogle Business Profile ظهور المنتجات والأعمال. تبقى حالتها «غير متاحة» حتى يربط التاجر مصدرًا رسميًا يمكن التحقق منه."
                  : "Merchant Center and Google Business Profile can support product and business visibility. They remain unavailable until the merchant connects a verifiable first-party source."}
              </p>
              <a
                className="mt-5 inline-flex min-h-11 items-center gap-2 font-semibold text-primary hover:underline"
                href="https://developers.google.com/search/docs/fundamentals/ai-optimization-guide"
                rel="noreferrer"
                target="_blank"
              >
                {isAr ? "دليل Google Search الرسمي" : "Official Google Search guide"}
                <ExternalLink className="size-4" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[.72fr_1.28fr] lg:items-start">
          <div>
            <p className="text-sm font-semibold text-primary">{isAr ? "النموذج الحسابي" : "Scoring model"}</p>
            <h2 className="mt-3 text-3xl font-semibold">{isAr ? "سبعة محاور، مع تغطية وثقة منفصلتين" : "Seven components, with separate coverage and confidence"}</h2>
            <p className="mt-4 text-muted-foreground">
              {isAr
                ? "إذا تعذر اختبار محور أو صفحة، لا يصبح ذلك صفرًا. تقل التغطية أو الثقة، وتبقى القيمة غير المتاحة واضحة."
                : "If a component or page cannot be checked, it does not become a zero. Coverage or confidence falls, and unavailable values remain explicit."}
            </p>
            <div className="mt-6 flex items-start gap-3 rounded-xl bg-info-soft p-4 text-sm">
              <CircleHelp className="mt-0.5 size-5 shrink-0 text-primary" />
              <p>{isAr ? "الأوزان أولية وتثبت مع نسخة المنهجية المحفوظة في كل تقرير." : "Weights are initial and are stored with the methodology version in each report."}</p>
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl border bg-background">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{isAr ? "المحور" : "Component"}</TableHead>
                  <TableHead>{isAr ? "المعرّف" : "Key"}</TableHead>
                  <TableHead>{isAr ? "الوزن" : "Weight"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {components.map(([key, label, weight]) => (
                  <TableRow key={key}>
                    <TableCell className="font-medium">{label}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{key}</TableCell>
                    <TableCell className="metric-numbers">{weight}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold text-primary">{isAr ? "ما الذي نقرأه؟" : "What do we inspect?"}</p>
            <h2 className="mt-3 text-3xl font-semibold">{isAr ? "فحص محدود وآمن للصفحات العامة" : "A bounded, safe check of public pages"}</h2>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: FileSearch, title: isAr ? "الصفحات والخرائط" : "Pages and sitemaps", body: isAr ? "العناوين والوصف وcanonical وhreflang وsitemap." : "Titles, descriptions, canonical, hreflang, and sitemap." },
              { icon: Braces, title: isAr ? "البيانات المنظمة" : "Structured data", body: isAr ? "JSON-LD وأنواع المنتج والمنظمة والأسئلة الشائعة." : "JSON-LD and product, organization, and FAQ types." },
              { icon: Languages, title: isAr ? "اللغة والإجابات" : "Language and answers", body: isAr ? "وضوح العربية وإجابات أسئلة الشراء والمقارنة." : "Arabic clarity and answers to purchase and comparison questions." },
              { icon: Link2, title: isAr ? "الثقة والكيان" : "Trust and entity", body: isAr ? "السياسات والتواصل والهوية والروابط القابلة للإثبات." : "Policies, contact, identity, and verifiable links." },
            ].map((item) => (
              <Card key={item.title}>
                <CardContent className="p-5">
                  <item.icon className="size-6 text-primary" />
                  <h3 className="mt-4 font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y bg-foreground py-16 text-background sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <ShieldCheck className="size-8 text-primary" />
              <h2 className="mt-5 text-3xl font-semibold">{isAr ? "حدود الأمان" : "Safety boundaries"}</h2>
              <ul className="mt-6 space-y-4 text-background/75">
                {[
                  isAr ? "نقبل HTTP وHTTPS العام فقط ونحظر العناوين الخاصة وواجهات metadata." : "Only public HTTP and HTTPS are accepted; private addresses and metadata endpoints are blocked.",
                  isAr ? "نعيد التحقق بعد كل redirect ونحترم robots.txt." : "We revalidate every redirect and respect robots.txt.",
                  isAr ? "نحدد عدد الصفحات والحجم والوقت والتزامن لكل نطاق." : "Pages, bytes, duration, and concurrency are bounded per domain.",
                  isAr ? "لا نشغّل JavaScript في الإصدار الأول." : "JavaScript is not executed in the first release.",
                ].map((item) => (
                  <li className="flex gap-3" key={item}>
                    <FileCheck2 className="mt-0.5 size-5 shrink-0 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <Scale className="size-8 text-primary" />
              <h2 className="mt-5 text-3xl font-semibold">{isAr ? "حدود الاستنتاج" : "Interpretation boundaries"}</h2>
              <ul className="mt-6 space-y-4 text-background/75">
                {[
                  isAr ? "لا نضمن ترتيبًا أو ظهورًا أو استشهادًا في أي منصة." : "We do not guarantee ranking, visibility, or citation on any platform.",
                  isAr ? "استجابة API عامة ليست نتيجة واجهة ChatGPT أو Gemini." : "A generic API response is not a ChatGPT or Gemini interface result.",
                  isAr ? "القياس الواحد لا يسمى اتجاهًا؛ يلزم التكرار والمنهج نفسه." : "A single observation is not a trend; repeated use of the same method is required.",
                  isAr ? "كل تقرير يحفظ تاريخ الفحص ونسخة المنهجية والتغطية والقيود." : "Every report stores check date, methodology version, coverage, and limitations.",
                ].map((item) => (
                  <li className="flex gap-3" key={item}>
                    <FileCheck2 className="mt-0.5 size-5 shrink-0 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
