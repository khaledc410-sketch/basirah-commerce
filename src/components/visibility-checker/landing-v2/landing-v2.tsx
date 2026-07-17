import {
  ArrowLeft,
  ArrowRight,
  Bot,
  Check,
  ChevronDown,
  FileCheck2,
  Gauge,
  Globe2,
  Lock,
  MessagesSquare,
  ScanSearch,
  Search,
  ShieldCheck,
  Sparkles,
  Store,
} from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { publicPath, type PublicLocale } from "@/i18n/public";

import { DomainCheckForm } from "../domain-check-form";
import { Reveal } from "../reveal";
import { CountUp } from "./count-up";
import { HeroDashboard } from "./hero-dashboard";
import { TextRotator, type RotatorLine } from "./text-rotator";

interface LandingV2Props {
  locale: PublicLocale;
}

export function LandingV2({ locale }: LandingV2Props) {
  const isAr = locale === "ar";
  const Arrow = isAr ? ArrowLeft : ArrowRight;

  const aiQuestions = isAr
    ? [
        "وش أفضل سيروم للبشرة الدهنية بأقل من ٢٠٠ ريال؟",
        "أفضل متجر عطور نسائية يوصّل الرياض بسرعة؟",
        "عباية عملية للدوام بجودة ممتازة؟",
        "قارن لي بين زيت الأرغان والجوجوبا للشعر الجاف",
        "هدية عطر رجالي فخمة بأقل من ٣٠٠ ريال؟",
        "متجر سعودي موثوق لمكياج أصلي؟",
        "أفضل واقي شمس خفيف للبشرة المختلطة؟",
      ]
    : [
        "Best serum for oily skin under SAR 200?",
        "Which Saudi perfume store delivers to Riyadh fast?",
        "A practical high-quality abaya for work?",
        "Compare argan and jojoba oil for dry hair",
        "A premium men's fragrance gift under SAR 300?",
        "A trusted Saudi store for authentic makeup?",
        "Best lightweight sunscreen for combination skin?",
      ];

  const rotatorLines: RotatorLine[] = isAr
    ? [
        { lead: "افحص متجرك", highlight: "بأدلة", tail: "لا تخمين" },
        { lead: "افهم كل فجوة", highlight: "ولماذا", tail: "تهم" },
        { lead: "أصلح المحتوى", highlight: "من حقائق", tail: "متجرك" },
        { lead: "بِع بوكيل", highlight: "عربي", tail: "يعرف كتالوجك" },
        { lead: "أثبِت التحسن", highlight: "بالقياس", tail: "لا بالادعاء" },
      ]
    : [
        { lead: "Scan your store with", highlight: "evidence", tail: "not guesses" },
        { lead: "Understand every gap and", highlight: "why", tail: "it matters" },
        { lead: "Fix content from your store's", highlight: "verified facts" },
        { lead: "Sell with an", highlight: "Arabic agent", tail: "that knows your catalog" },
        { lead: "Prove improvement by", highlight: "measuring", tail: "not claiming" },
      ];

  const bentoTiles = [
    {
      icon: FileCheck2,
      title: isAr ? "دليل لكل نتيجة" : "Evidence for every finding",
      body: isAr
        ? "كل ملاحظة في التقرير تشير إلى الصفحة التي جاءت منها. لا درجات غامضة."
        : "Every finding points to the exact page it came from. No opaque scores.",
    },
    {
      icon: Gauge,
      title: isAr ? "غير متاح ≠ صفر" : "Unavailable ≠ zero",
      body: isAr
        ? "ما لا نستطيع قياسه نعرضه كما هو: غير متاح. لا نحوّله إلى فشل مصطنع."
        : "What we cannot measure is shown as unavailable—never converted into an artificial failure.",
    },
    {
      icon: ShieldCheck,
      title: isAr ? "أمان مدمج في الوكيل" : "Safety built into the agent",
      body: isAr
        ? "لا ادعاءات طبية، لا وعود مضللة، وتحويل مهذب لفريقك في الأسئلة الحساسة."
        : "No medical claims, no misleading promises, and a polite handoff to your team for sensitive questions.",
    },
    {
      icon: Lock,
      title: isAr ? "فحص عام وآمن" : "A public, safe scan",
      body: isAr
        ? "الفحص يقرأ صفحاتك العامة فقط. لا كلمة مرور، ولا وصول لبيانات عملائك."
        : "The scan reads your public pages only. No password, no access to your customer data.",
    },
  ];

  const productFacts = [
    { value: 7, suffix: "", label: isAr ? "مكونات جاهزية موزونة" : "Weighted readiness components" },
    { value: 10, suffix: "", label: isAr ? "صفحات في الفحص المجاني" : "Pages in the free check" },
    { value: 7, suffix: "", label: isAr ? "صفحات في التقرير التنفيذي" : "Pages in the executive report" },
    { value: 90, suffix: isAr ? " يومًا" : " days", label: isAr ? "خطة إصلاح مرتبة بالأثر" : "Impact-ranked repair plan" },
  ];

  const engineOneChecks = [
    isAr
      ? "درجة جاهزية من 7 مكونات موزونة، مع الدليل خلف كل رقم"
      : "A readiness score from 7 weighted components, with evidence behind every number",
    isAr
      ? "خريطة أسئلة الشراء التي لا يجيب عنها متجرك بعد"
      : "A map of the buying questions your store doesn't answer yet",
    isAr
      ? "خطة 30/60/90 يومًا مرتبة بالأثر، واستوديو محتوى ينفذها"
      : "An impact-ranked 30/60/90-day plan, and a content studio that executes it",
  ];

  const engineTwoChecks = [
    isAr
      ? "يرد على عملائك على مدار الساعة، بهوية متجرك وألوانك"
      : "Answers your customers around the clock, in your brand and colors",
    isAr
      ? "كل محادثة تتحول إلى إشارة: احتياجات صاعدة، اعتراضات متكررة، فجوات طلب"
      : "Every conversation becomes a signal: rising needs, repeated objections, demand gaps",
    isAr
      ? "أسئلة العملاء التي بلا إجابة تتحول تلقائيًا إلى فرص محتوى"
      : "Unanswered customer questions automatically become content opportunities",
  ];

  const aiPlatforms = [
    { icon: Search, label: "Google" },
    { icon: Bot, label: "ChatGPT" },
    { icon: Sparkles, label: "Gemini" },
    { icon: Store, label: isAr ? "سلة" : "Salla" },
  ];

  const faqs = [
    {
      q: isAr
        ? "هل يخترع وكيل المبيعات سعرًا أو معلومة غير موجودة؟"
        : "Can the sales agent invent a price or a fact?",
      a: isAr
        ? "لا. الوكيل يرشّح فقط من منتجاتك المتاحة والمتزامنة من سلة، ويعرض السعر والمخزون من نفس السجل. إذا غابت معلومة قال إنها غير متوفرة أو حوّل السؤال لفريقك."
        : "No. The agent recommends only from your available, Salla-synced products, and shows price and stock from the same record. When a fact is missing it says so, or hands the question to your team.",
    },
    {
      q: isAr ? "هل تضمنون ظهوري في ChatGPT أو Google؟" : "Do you guarantee visibility in ChatGPT or Google?",
      a: isAr
        ? "لا أحد يستطيع ضمان ذلك بصدق. نقيس جاهزية متجرك بأدلة قابلة للتحقق، ونفصلها عن الاكتشاف الفعلي والظهور المرصود، ونثبت التحسن بإعادة الفحص."
        : "Nobody can honestly guarantee that. We measure your store's readiness with verifiable evidence, keep it separate from actual discovery and observed visibility, and prove improvement through rescans.",
    },
    {
      q: isAr ? "هل أحتاج إلى ربط متجر سلة قبل الفحص؟" : "Do I need to connect my Salla store before checking?",
      a: isAr
        ? "لا. الفحص يبدأ من نطاقك العام فقط، بلا حساب أو بريد. ربط سلة يأتي لاحقًا عندما تفعّل وكيل المبيعات ومزامنة الكتالوج."
        : "No. The check starts from your public domain only—no account or email. Connecting Salla comes later, when you activate the sales agent and catalog sync.",
    },
    {
      q: isAr ? "هل التقرير الكامل مجاني فعلًا؟" : "Is the full report really free?",
      a: isAr
        ? "نعم. تشاهد الدرجة وأهم 3 مشاكل بلا بريد، ثم تدخل بريدًا واحدًا لفتح كل المشاكل والأدلة وخطة العمل وPDF تنفيذي من 7 صفحات."
        : "Yes. See the score and top three issues without email, then enter one email to unlock every issue, the evidence, the action plan, and a seven-page executive PDF.",
    },
  ];

  return (
    <main id="main-content">
      {/* ---------------------------------------------------------------- */}
      {/* Hero — centered claim, domain check, dashboard recreation         */}
      {/* ---------------------------------------------------------------- */}
      <section className="hero-wash relative overflow-hidden" id="checker">
        <div aria-hidden="true" className="subtle-grid absolute inset-0 -z-10" />
        <div className="mx-auto max-w-7xl px-4 pb-24 pt-16 sm:px-6 sm:pt-24 lg:pb-32">
          <div className="mx-auto max-w-4xl text-center">
            <div className="anim-blur-rise flex flex-wrap justify-center gap-2">
              <Badge className="h-7 gap-2 bg-primary/10 px-3 text-primary hover:bg-primary/10">
                <Sparkles />
                {isAr ? "الظهور والمبيعات بالذكاء الاصطناعي" : "AI visibility and AI sales"}
              </Badge>
              <Badge className="h-7 gap-1.5" variant="outline">
                <Store className="size-3.5" />
                {isAr ? "لمتاجر سلة" : "For Salla stores"}
              </Badge>
            </div>
            <h1 className="mt-8 text-[42px] font-bold leading-[1.15] tracking-tight sm:text-6xl lg:text-7xl">
              <span className="anim-blur-rise block" style={{ animationDelay: "90ms" }}>
                {isAr ? "عملاؤك يسألون الذكاء الاصطناعي" : "Your customers ask AI"}
              </span>
              <span className="anim-blur-rise block text-primary" style={{ animationDelay: "220ms" }}>
                {isAr ? "هل متجرك ضمن الإجابة؟" : "Is your store part of the answer?"}
              </span>
            </h1>
            <p
              className="anim-blur-rise mx-auto mt-7 max-w-2xl text-lg leading-8 text-muted-foreground"
              style={{ animationDelay: "330ms" }}
            >
              {isAr ? (
                <>
                  بصيرة تفحص جاهزية متجرك للظهور في غوغل وشات جي بي تي وجيمناي بأدلة موثّقة،
                  وتمنحك وكيل مبيعات عربيًا يجيب عملاءك من بيانات متجرك فقط.
                </>
              ) : (
                <>
                  Basirah checks how ready your store is to be understood by Google, ChatGPT, and
                  Gemini—with evidence—and gives you an Arabic sales agent that answers customers
                  from your store data only.
                </>
              )}
            </p>
            <div className="anim-blur-rise mx-auto mt-9 max-w-xl" style={{ animationDelay: "430ms" }}>
              <DomainCheckForm locale={locale} />
            </div>
            <div
              className="anim-blur-rise mt-6 flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm text-muted-foreground"
              style={{ animationDelay: "520ms" }}
            >
              {[
                isAr ? "بلا حساب أو بريد" : "No account or email",
                isAr ? "نتيجة خلال دقائق" : "A result in minutes",
                isAr ? "أدلة، لا وعود ترتيب" : "Evidence, not ranking promises",
              ].map((item) => (
                <span className="flex items-center gap-2" key={item}>
                  <Check className="size-4 text-success" />
                  {item}
                </span>
              ))}
            </div>
          </div>

          <HeroDashboard locale={locale} />
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Marquee — the questions shoppers already ask AI                   */}
      {/* ---------------------------------------------------------------- */}
      <section className="border-y bg-card py-9">
        <p className="flex flex-wrap items-center justify-center gap-2 px-4 text-center text-sm font-semibold">
          {isAr
            ? "أسئلة من النوع الذي يُطرح على الذكاء الاصطناعي كل يوم"
            : "The kind of questions shoppers ask AI every day"}
          <Badge className="text-[10px]" variant="outline">
            {isAr ? "أمثلة توضيحية" : "Illustrative examples"}
          </Badge>
        </p>
        <div
          className="mt-5 overflow-hidden"
          style={{
            maskImage: "linear-gradient(to right, transparent, black 12%, black 88%, transparent)",
          }}
        >
          <div className="anim-marquee flex w-max gap-3">
            {[0, 1].map((copy) => (
              <div aria-hidden={copy === 1} className="flex shrink-0 gap-3 pe-3" key={copy}>
                {aiQuestions.map((question) => (
                  <span
                    className="flex items-center gap-2 whitespace-nowrap rounded-full border bg-background px-4 py-2 text-sm text-muted-foreground"
                    key={question}
                  >
                    <MessagesSquare className="size-4 text-primary" />
                    {question}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Scroll-driven statement rotator                                   */}
      {/* ---------------------------------------------------------------- */}
      <section aria-label={isAr ? "كيف يعمل" : "How it works"}>
        <TextRotator lines={rotatorLines} />
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Engine 01 — visibility report                                     */}
      {/* ---------------------------------------------------------------- */}
      <section className="scroll-mt-24 border-t bg-card py-20 sm:py-28" id="report">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <p className="metric-numbers text-sm font-bold text-primary">01</p>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
              {isAr ? "محرك الظهور بالذكاء الاصطناعي" : "The AI visibility engine"}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              {isAr
                ? "فحص حتمي يقرأ متجرك كما تقرؤه أنظمة البحث والإجابة، ثم يحوّل كل فجوة إلى خطوة إصلاح لها دليل."
                : "A deterministic scan reads your store the way search and answer systems do, then turns every gap into a fix with evidence."}
            </p>
            <ul className="mt-7 space-y-3">
              {engineOneChecks.map((item) => (
                <li className="flex gap-3" key={item}>
                  <Check className="mt-1 size-4 shrink-0 text-success" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <Button asChild className="press-scale mt-8 h-11" variant="outline">
              <Link href={publicPath(locale, "/methodology")}>
                {isAr ? "كيف نقيس؟ المنهجية كاملة" : "How we measure—full methodology"}
                <Arrow />
              </Link>
            </Button>
          </Reveal>
          <Reveal delay={120}>
            <Card className="overflow-hidden shadow-xl shadow-primary/5">
              <div className="flex items-center justify-between border-b px-5 py-4">
                <p className="text-sm font-semibold">
                  {isAr ? "لقطة من تقرير متجرك" : "A snapshot from your report"}
                </p>
                <Badge variant="secondary">{isAr ? "PDF + رابط مشاركة" : "PDF + share link"}</Badge>
              </div>
              <CardContent className="space-y-3 p-5">
                <div className="grid gap-3 rounded-2xl bg-primary/[0.045] p-4 sm:grid-cols-[auto_1fr] sm:items-center">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">
                      {isAr ? "درجة الجاهزية" : "Readiness score"}
                    </p>
                    <p className="metric-numbers mt-1 text-4xl font-bold text-primary">
                      <CountUp value={78} />
                      <span className="text-sm text-muted-foreground">/100</span>
                    </p>
                  </div>
                  <div className="border-t pt-3 sm:border-s sm:border-t-0 sm:ps-4 sm:pt-0">
                    <p className="text-xs font-semibold text-primary">
                      {isAr ? "الملخص التنفيذي" : "Executive summary"}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      {isAr
                        ? "متجرك قابل للفهم تقنيًا، لكن 12 صفحة منتج لا تجيب أسئلة الشراء الأعلى نية."
                        : "Your store is technically understandable, but 12 product pages miss high-intent buyer questions."}
                    </p>
                  </div>
                </div>
                {[
                  {
                    severity: isAr ? "عالية" : "High",
                    tone: "destructive" as const,
                    title: isAr
                      ? "وصف المنتجات لا يجيب أسئلة الشراء"
                      : "Product copy misses buyer questions",
                    pages: isAr ? "12 صفحة متأثرة" : "12 affected pages",
                  },
                  {
                    severity: isAr ? "عالية" : "High",
                    tone: "destructive" as const,
                    title: isAr
                      ? "بيانات Product المنظمة ناقصة السعر والتوفر"
                      : "Product structured data missing price and availability",
                    pages: isAr ? "8 صفحات متأثرة" : "8 affected pages",
                  },
                  {
                    severity: isAr ? "متوسطة" : "Medium",
                    tone: "secondary" as const,
                    title: isAr
                      ? "صفحة «من نحن» لا تعرّف الكيان التجاري بوضوح"
                      : "The about page doesn't clearly define the business entity",
                    pages: isAr ? "صفحة واحدة" : "1 page",
                  },
                ].map((finding) => (
                  <div className="rounded-xl border p-4" key={finding.title}>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={finding.tone}>{finding.severity}</Badge>
                      <p className="font-semibold">{finding.title}</p>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {finding.pages} ·{" "}
                      {isAr ? "الدليل والإصلاح داخل التقرير" : "Evidence and fix in the report"}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </Reveal>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Engine 02 — Arabic sales agent                                    */}
      {/* ---------------------------------------------------------------- */}
      <section className="scroll-mt-24 py-20 sm:py-28" id="agent">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16">
          <Reveal className="lg:order-2">
            <p className="metric-numbers text-sm font-bold text-primary">02</p>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
              {isAr ? "وكيل مبيعات يبيع من بيانات متجرك" : "A sales agent that sells from your store data"}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              {isAr
                ? "يفهم الاحتياج والميزانية واللهجة بالعربية، ثم يرشّح من كتالوجك المتزامن فقط. السعر والمخزون من نفس سجل المنتج، دائمًا."
                : "It understands need, budget, and dialect in Arabic, then recommends only from your synced catalog. Price and stock always come from the same product record."}
            </p>
            <ul className="mt-7 space-y-3">
              {engineTwoChecks.map((item) => (
                <li className="flex gap-3" key={item}>
                  <Check className="mt-1 size-4 shrink-0 text-success" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-7 flex items-center gap-2 text-sm text-muted-foreground">
              <ShieldCheck className="size-4 shrink-0 text-primary" />
              {isAr
                ? "يتطلب حسابًا ومتجر سلة متزامنًا ضمن خطة التجارة."
                : "Requires an account and a synced Salla store on the Commerce plan."}
            </p>
          </Reveal>
          <Reveal className="lg:order-1" delay={120}>
            <Card className="overflow-hidden shadow-xl shadow-primary/5">
              <div className="flex items-center gap-3 border-b bg-foreground px-5 py-4 text-background">
                <span className="grid size-10 place-items-center rounded-full bg-primary text-primary-foreground">
                  <Bot className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {isAr ? "مستشار متجرك" : "Your store's advisor"}
                  </p>
                  <p className="flex items-center gap-1.5 text-xs text-background/70">
                    <span className="size-1.5 rounded-full bg-success" />
                    {isAr ? "يجيب من بيانات المتجر" : "Answers from store data"}
                  </p>
                </div>
              </div>
              <CardContent className="space-y-3 bg-muted/30 p-5">
                <div className="flex justify-end">
                  <p className="max-w-[80%] rounded-2xl rounded-ee-md bg-primary px-4 py-2.5 text-sm text-primary-foreground">
                    {isAr ? "بشرتي دهنية وميزانيتي ١٥٠ ريال" : "I have oily skin and a SAR 150 budget"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                    <Bot className="size-4" />
                  </span>
                  <p className="max-w-[85%] rounded-2xl rounded-ss-md border bg-card px-4 py-2.5 text-sm">
                    {isAr ? (
                      <>
                        أرشّح لك <strong>سيروم التوازن بالنياسيناميد</strong> — مذكور في وصفه للبشرة
                        الدهنية، وضمن ميزانيتك.
                      </>
                    ) : (
                      <>
                        I recommend the <strong>Niacinamide Balancing Serum</strong>—its description
                        mentions oily skin, and it fits your budget.
                      </>
                    )}
                  </p>
                </div>
                <div className="ms-10 overflow-hidden rounded-2xl border bg-card shadow-sm">
                  <div className="p-3.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold">
                        {isAr ? "سيروم التوازن بالنياسيناميد" : "Niacinamide Balancing Serum"}
                      </p>
                      <Badge className="bg-success-soft text-[10px] text-success hover:bg-success-soft">
                        {isAr ? "الأنسب" : "Best match"}
                      </Badge>
                    </div>
                    <p className="metric-numbers mt-1 text-sm font-bold">
                      {isAr ? "١٢٩ ر.س" : "SAR 129"}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-success">
                      <Check className="size-3.5" />
                      {isAr ? "متوفر · 42 قطعة" : "In stock · 42 units"}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 divide-x divide-border border-t text-center text-xs font-semibold rtl:divide-x-reverse">
                    <span className="bg-primary py-2.5 text-primary-foreground">
                      {isAr ? "أضف للسلة" : "Add to cart"}
                    </span>
                    <span className="py-2.5 text-primary">{isAr ? "عرض المنتج" : "View product"}</span>
                  </div>
                </div>
                <p className="flex items-center justify-center gap-1.5 pt-1 text-[11px] text-muted-foreground">
                  <ShieldCheck className="size-3.5 text-success" />
                  {isAr
                    ? "السعر والمخزون من كتالوج المتجر مباشرة — لا يخترع الوكيل معلومة"
                    : "Price and stock come straight from the catalog—the agent never invents a fact"}
                </p>
              </CardContent>
            </Card>
          </Reveal>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Honesty bento + facts band (dark)                                 */}
      {/* ---------------------------------------------------------------- */}
      <section className="relative overflow-hidden bg-foreground py-20 text-background sm:py-28">
        <div aria-hidden="true" className="subtle-grid-dark absolute inset-0" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold">
              <span className="rounded-full bg-primary px-3 py-1 text-primary-foreground">
                {isAr ? "قياس صادق" : "Honest measurement"}
              </span>
            </p>
            <h2 className="mt-6 text-3xl font-bold sm:text-5xl">
              {isAr ? "لا نعدك بالترتيب. نعدك بالدليل." : "We don't promise rankings. We promise evidence."}
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-background/70">
              {isAr
                ? "أي أداة تضمن لك الظهور في ChatGPT تبيعك وعدًا لا تملكه. نحن نقيس ما يمكن إثباته."
                : "Any tool that guarantees you'll appear in ChatGPT is selling a promise it doesn't own. We measure what can be proven."}
            </p>
          </Reveal>
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {bentoTiles.map((tile, index) => (
              <Reveal delay={index * 80} key={tile.title}>
                <div className="group h-full rounded-2xl border border-background/15 bg-background/5 p-6 backdrop-blur-sm transition-transform duration-300 hover:-translate-y-1">
                  <span className="grid size-11 place-items-center rounded-xl bg-primary text-primary-foreground">
                    <tile.icon className="size-5" />
                  </span>
                  <h3 className="mt-5 text-lg font-bold">{tile.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-background/70">{tile.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal className="mt-14" delay={120}>
            <div className="grid gap-6 rounded-3xl border border-background/15 bg-background/5 p-8 text-center sm:grid-cols-4">
              {productFacts.map((fact) => (
                <div key={fact.label}>
                  <p className="metric-numbers text-4xl font-bold">
                    <CountUp suffix={fact.suffix} value={fact.value} />
                  </p>
                  <p className="mt-2 text-sm text-background/70">{fact.label}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Platforms readiness panel + free-check banner                     */}
      {/* ---------------------------------------------------------------- */}
      <section className="py-20 sm:py-28" id="platforms">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal>
            <div className="relative overflow-hidden rounded-4xl border bg-gradient-to-b from-primary/[0.07] via-primary/[0.03] to-transparent px-6 py-16 text-center sm:py-20">
              <div aria-hidden="true" className="subtle-grid absolute inset-0 opacity-60" />
              <div className="relative">
                <h2 className="mx-auto max-w-3xl text-3xl font-bold sm:text-5xl">
                  {isAr
                    ? "جاهز للظهور حيث يسأل عملاؤك"
                    : "Ready to appear where your customers ask"}
                </h2>
                <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
                  {isAr
                    ? "نجهّز صفحات متجرك لتُفهم من أنظمة البحث والإجابة، ونزامن كتالوجك من سلة — ونثبت كل ذلك بالدليل."
                    : "We prepare your store's pages to be understood by search and answer systems, sync your catalog from Salla—and prove all of it with evidence."}
                </p>
                <div className="mt-10 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
                  {aiPlatforms.map((platform, index) => (
                    <Reveal delay={index * 70} key={platform.label}>
                      <span className="flex items-center gap-2.5 rounded-full border bg-background px-5 py-2.5 text-base font-semibold shadow-sm transition-transform duration-300 hover:-translate-y-0.5 sm:px-6 sm:py-3">
                        <platform.icon className="size-5 text-primary" />
                        <bdi dir="ltr">{platform.label}</bdi>
                      </span>
                    </Reveal>
                  ))}
                </div>
                <Reveal className="mx-auto mt-12 max-w-3xl" delay={120}>
                  <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border-2 border-dashed border-primary/30 bg-background/80 p-5 backdrop-blur-sm sm:flex-row sm:text-start">
                    <div className="flex items-center gap-4">
                      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-success-soft text-success">
                        <ScanSearch className="size-5" />
                      </span>
                      <div>
                        <p className="font-bold">
                          {isAr ? "الفحص والتقرير — مجانًا" : "The check and report — free"}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {isAr
                            ? "5–10 صفحات، معاينة فورية، ثم تقرير كامل ببريد واحد."
                            : "5–10 pages, an instant preview, then a complete report with one email."}
                        </p>
                      </div>
                    </div>
                    <Button asChild className="press-scale h-11 w-full shrink-0 sm:w-auto">
                      <Link href={publicPath(locale, "/#checker")}>
                        {isAr ? "افحص الآن" : "Check now"}
                        <Arrow />
                      </Link>
                    </Button>
                  </div>
                </Reveal>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* FAQ — numbered cards                                              */}
      {/* ---------------------------------------------------------------- */}
      <section className="border-y bg-card py-20 sm:py-28" id="faq">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal className="text-center">
            <p className="text-sm font-semibold text-primary">
              {isAr ? "الأسئلة الشائعة" : "Frequently asked questions"}
            </p>
            <h2 className="mt-4 text-3xl font-bold sm:text-4xl">
              {isAr ? "إجابات مباشرة قبل أن تبدأ" : "Straight answers before you start"}
            </h2>
          </Reveal>
          <div className="mt-12 grid items-start gap-4 lg:grid-cols-2">
            {faqs.map((item, index) => (
              <Reveal delay={index * 70} key={item.q}>
                <details className="group rounded-2xl border bg-background p-5 transition-shadow duration-300 hover:shadow-md hover:shadow-primary/5 open:shadow-lg open:shadow-primary/5 sm:p-6">
                  <summary className="flex min-h-11 cursor-pointer list-none items-center gap-4 font-bold">
                    <span className="metric-numbers grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-sm text-primary">
                      0{index + 1}
                    </span>
                    <span className="flex-1">{item.q}</span>
                    <span className="grid size-8 shrink-0 place-items-center rounded-full border text-muted-foreground transition-all duration-300 group-open:rotate-180 group-open:border-primary group-open:bg-primary group-open:text-primary-foreground">
                      <ChevronDown className="size-4" />
                    </span>
                  </summary>
                  <p className="pb-1 pt-4 leading-7 text-muted-foreground sm:ps-13">{item.a}</p>
                </details>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Final CTA — gradient panel with peeking score card                */}
      {/* ---------------------------------------------------------------- */}
      <section className="py-20 sm:py-28" id="cta">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal>
            <div className="relative overflow-hidden rounded-4xl bg-gradient-to-b from-primary to-primary/85 px-6 pb-40 pt-16 text-center text-primary-foreground sm:px-12 sm:pb-48 sm:pt-24">
              <div aria-hidden="true" className="subtle-grid absolute inset-0 opacity-10" />
              <div
                aria-hidden="true"
                className="absolute -top-24 start-1/2 size-72 -translate-x-1/2 rounded-full bg-primary-foreground/10 blur-3xl"
              />
              <div className="relative">
                <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary-foreground/10">
                  <Globe2 className="size-7" />
                </span>
                <h2 className="mx-auto mt-6 max-w-2xl text-3xl font-bold sm:text-5xl">
                  {isAr
                    ? "الإجابة عن متجرك تُكتب الآن. شارك في كتابتها."
                    : "The answer about your store is being written now. Help write it."}
                </h2>
                <p className="mx-auto mt-5 max-w-2xl text-lg text-primary-foreground/80">
                  {isAr
                    ? "خلال دقائق ستعرف ما الذي تفهمه أنظمة الذكاء الاصطناعي عن متجرك، وما أول ثلاث مشاكل تستحق الإصلاح."
                    : "In minutes, know what AI systems understand about your store—and the first three issues worth fixing."}
                </p>
                <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
                  <Button
                    asChild
                    className="press-scale h-13 bg-background px-8 text-base font-bold text-foreground hover:bg-background/90"
                  >
                    <Link href={publicPath(locale, "/#checker")}>
                      {isAr ? "افحص متجرك مجانًا الآن" : "Check your store free now"}
                      <Arrow />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    className="press-scale h-13 border border-primary-foreground/30 bg-transparent px-8 text-base font-bold text-primary-foreground hover:bg-primary-foreground/10"
                  >
                    <Link href={publicPath(locale, "/pricing")}>
                      {isAr ? "شاهد الأسعار" : "See pricing"}
                    </Link>
                  </Button>
                </div>
                <p className="mt-5 text-sm text-primary-foreground/70">
                  {isAr
                    ? "المعاينة بلا بريد · التقرير الكامل ببريد واحد · بلا بطاقة"
                    : "Preview without email · full report with one email · no card"}
                </p>
              </div>

              {/* Peeking score card, clipped by the panel's bottom edge */}
              <div
                aria-hidden="true"
                className="absolute -bottom-8 start-1/2 w-72 -translate-x-1/2 rotate-2 sm:-bottom-6 sm:w-80"
              >
                <div className="rounded-2xl border border-primary/15 bg-card p-5 text-start text-foreground shadow-2xl">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-muted-foreground">
                      {isAr ? "جاهزية الظهور" : "Visibility readiness"}
                    </p>
                    <Badge className="bg-success-soft text-[10px] text-success hover:bg-success-soft">
                      {isAr ? "+8 منذ آخر فحص" : "+8 since last scan"}
                    </Badge>
                  </div>
                  <p className="metric-numbers mt-2 text-3xl font-bold text-primary">
                    75<span className="text-sm font-medium text-muted-foreground"> / 100</span>
                  </p>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                    <div className="anim-bar h-full w-3/4 rounded-full bg-primary" />
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
