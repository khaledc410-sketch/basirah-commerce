import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Bot,
  Check,
  ChevronDown,
  FileCheck2,
  FileText,
  Gauge,
  Globe2,
  Lock,
  MessagesSquare,
  PenLine,
  RefreshCw,
  ScanSearch,
  Send,
  ShieldCheck,
  Sparkles,
  Store,
  TrendingUp,
  User,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { publicPath, type PublicLocale } from "@/i18n/public";

import { DomainCheckForm } from "./domain-check-form";
import { Reveal } from "./reveal";

interface MarketingHomeProps {
  locale: PublicLocale;
}

const GAUGE_CIRCUMFERENCE = 283;
const GAUGE_SCORE = 78;

export function MarketingHome({ locale }: MarketingHomeProps) {
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

  const visibilityChecks = [
    { label: isAr ? "بيانات المنتج المنظمة" : "Structured product data", value: 84 },
    { label: isAr ? "وضوح الكيان التجاري" : "Entity clarity", value: 66 },
    { label: isAr ? "الإجابة عن أسئلة الشراء" : "Buyer-question coverage", value: 52 },
  ];

  const needScenarios = [
    {
      label: isAr ? "العناية بالبشرة" : "Skincare",
      question: isAr
        ? "بشرتي حساسة وأبغى روتين بسيط تحت ٢٥٠ ريال"
        : "I have sensitive skin and want a simple routine under SAR 250",
      answer: isAr
        ? "بدأت بخيارين متوفرين، واستبعدت العطور لأن الحساسية أولوية."
        : "I started with two in-stock options and excluded fragrance because sensitivity is the priority.",
      product: isAr ? "سيروم توازن + منظف لطيف" : "Balancing serum + gentle cleanser",
      price: isAr ? "٢١٨ ر.س" : "SAR 218",
      image: "/landing/advisor-skincare.webp",
      alt: isAr
        ? "سيروم ومنظف وعناية يومية بلقطة منتج هادئة"
        : "Serum, cleanser, and daily-care products in a calm product photograph",
    },
    {
      label: isAr ? "الأداء الرياضي" : "Performance",
      question: isAr
        ? "أتمرن للجري الطويل، وش يناسب الثبات ومتابعة النبض؟"
        : "I train for long runs—what supports stability and heart-rate tracking?",
      answer: isAr
        ? "رشّحت حذاءً للدعم مع ساعة GPS، بعد مطابقة المقاس والميزانية."
        : "I matched a supportive shoe and GPS watch after checking size and budget.",
      product: isAr ? "طقم الجري الطويل" : "Long-run performance kit",
      price: isAr ? "٦٨٩ ر.س" : "SAR 689",
      image: "/landing/advisor-performance.webp",
      alt: isAr
        ? "حذاء جري وساعة رياضية وقبعة تدريب"
        : "Running shoes, sports watch, and training cap",
    },
    {
      label: isAr ? "الطريق والسفر" : "Road & travel",
      question: isAr
        ? "أحتاج تجهيز عملي لخط الرياض–العلا بدون قطع غير ضرورية"
        : "I need a practical Riyadh–AlUla road kit without unnecessary extras",
      answer: isAr
        ? "ثلاثة أساسيات متوافقة مع احتياج الطريق، وكلها متوفرة الآن."
        : "Three road-ready essentials, all currently in stock.",
      product: isAr ? "طقم الطريق العملي" : "Practical road kit",
      price: isAr ? "٣٤٧ ر.س" : "SAR 347",
      image: "/landing/advisor-road.webp",
      alt: isAr
        ? "حامل هاتف وكوب سفر ونظارة قيادة داخل سيارة"
        : "Phone mount, travel tumbler, and driving glasses inside a car",
    },
  ];

  const loopSteps = [
    {
      icon: ScanSearch,
      title: isAr ? "افحص" : "Scan",
      body: isAr
        ? "أدخل نطاق متجرك. نقرأ حتى 10 صفحات عامة ونقيس 7 مكونات جاهزية موزونة — بلا حساب."
        : "Enter your store domain. We read up to 10 public pages and measure 7 weighted readiness components—no account.",
    },
    {
      icon: FileText,
      title: isAr ? "افهم" : "Understand",
      body: isAr
        ? "تقرير عربي يشرح كل فجوة بدليل من صفحاتك: أين وجدناها، ولماذا تهم، وكيف تُصلح."
        : "An Arabic report explains every gap with evidence from your own pages: where we found it, why it matters, how to fix it.",
    },
    {
      icon: PenLine,
      title: isAr ? "أصلح" : "Fix",
      body: isAr
        ? "استوديو المحتوى يحوّل كل فجوة إلى مسودة عربية مبنية على حقائق متجرك الموثّقة فقط."
        : "The content studio turns each gap into an Arabic draft grounded only in your store's verified facts.",
    },
    {
      icon: Bot,
      title: isAr ? "بِع" : "Sell",
      body: isAr
        ? "وكيل المبيعات يجيب عملاءك من كتالوجك المتزامن، ويحوّل أسئلتهم المتكررة إلى فرص محتوى جديدة."
        : "The sales agent answers customers from your synced catalog and turns their repeated questions into new content opportunities.",
    },
    {
      icon: RefreshCw,
      title: isAr ? "أثبِت" : "Prove",
      body: isAr
        ? "أعد الفحص وقارن الدرجة بالأدلة. التحسن يُقاس، لا يُدّعى."
        : "Rescan and compare the score with evidence. Improvement is measured, never claimed.",
    },
  ];

  const trustTiles = [
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
    { value: "7", label: isAr ? "مكونات جاهزية موزونة" : "Weighted readiness components" },
    { value: "10", label: isAr ? "صفحات في الفحص المجاني" : "Pages in the free check" },
    { value: "7", label: isAr ? "صفحات في التقرير التنفيذي" : "Pages in the executive report" },
    { value: "30·60·90", label: isAr ? "خطة إصلاح بالأيام" : "Day-by-day repair plan" },
  ];

  const plans = [
    {
      name: isAr ? "التقرير الكامل" : "Full report",
      price: "0",
      suffix: isAr ? "ر.س — مجاني" : "SAR — free",
      featured: false,
      description: isAr
        ? "تشخيص واضح يريك المشكلة وما الذي يجب فعله بعدها."
        : "A clear diagnosis of the problem and what to do next.",
      features: isAr
        ? ["فحص 5–10 صفحات", "كل المشاكل والأدلة", "PDF تنفيذي من 7 صفحات", "خطة 30/60/90 يومًا"]
        : ["Scan 5–10 pages", "Every issue and its evidence", "Seven-page executive PDF", "30/60/90-day plan"],
    },
    {
      name: isAr ? "النمو" : "Growth",
      price: "699",
      suffix: isAr ? "ر.س شهريًا" : "SAR / month",
      featured: true,
      description: isAr
        ? "لقياس التحسن وتحويل الفجوات إلى محتوى."
        : "Measure improvement and turn gaps into content.",
      features: isAr
        ? ["تقرير شهري وسجل تحسن", "كاتب المحتوى الموثّق", "حتى 8 مسودات شهريًا", "أولويات مرتبة بالأثر"]
        : ["Monthly report and history", "Evidence-led content writer", "Up to 8 drafts a month", "Impact-ranked priorities"],
    },
    {
      name: isAr ? "التجارة" : "Commerce",
      price: "1,499",
      suffix: isAr ? "ر.س شهريًا" : "SAR / month",
      featured: false,
      description: isAr
        ? "الظهور والمبيعات من حلقة واحدة."
        : "Visibility and sales from one loop.",
      features: isAr
        ? ["كل مزايا النمو", "وكيل المبيعات بالعربية", "مزامنة كتالوج سلة", "حتى 2,000 رسالة عميل"]
        : ["Everything in Growth", "The Arabic sales agent", "Salla catalog sync", "Up to 2,000 customer messages"],
    },
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
      q: isAr
        ? "هل تضمنون ظهوري في ChatGPT أو Google؟"
        : "Do you guarantee visibility in ChatGPT or Google?",
      a: isAr
        ? "لا أحد يستطيع ضمان ذلك بصدق. نقيس جاهزية متجرك بأدلة قابلة للتحقق، ونفصلها عن الاكتشاف الفعلي والظهور المرصود، ونثبت التحسن بإعادة الفحص."
        : "Nobody can honestly guarantee that. We measure your store's readiness with verifiable evidence, keep it separate from actual discovery and observed visibility, and prove improvement through rescans.",
    },
    {
      q: isAr
        ? "هل أحتاج إلى ربط متجر سلة قبل الفحص؟"
        : "Do I need to connect my Salla store before checking?",
      a: isAr
        ? "لا. الفحص يبدأ من نطاقك العام فقط، بلا حساب أو بريد. ربط سلة يأتي لاحقًا عندما تفعّل وكيل المبيعات ومزامنة الكتالوج."
        : "No. The check starts from your public domain only—no account or email. Connecting Salla comes later, when you activate the sales agent and catalog sync.",
    },
    {
      q: isAr
        ? "ماذا يحدث عندما لا يمكن التحقق من شيء؟"
        : "What happens when something cannot be verified?",
      a: isAr
        ? "نعرضه كغير متاح ونخفّض التغطية أو الثقة بشفافية. لا نحوّل غياب البيانات إلى صفر ولا إلى نجاح."
        : "We label it unavailable and transparently lower coverage or confidence. Missing data never becomes a zero—or a success.",
    },
    {
      q: isAr ? "هل التقرير الكامل مجاني فعلًا؟" : "Is the full report really free?",
      a: isAr
        ? "نعم. تشاهد الدرجة وأهم 3 مشاكل بلا بريد، ثم تدخل بريدًا واحدًا لفتح كل المشاكل والأدلة وخطة العمل وPDF تنفيذي من 7 صفحات. الدفع يكون فقط عندما تختار خدمة التنفيذ والتحسين المستمر."
        : "Yes. See the score and top three issues without email, then enter one email to unlock every issue, the evidence, the action plan, and a seven-page executive PDF. You pay only if you choose implementation and continuous improvement.",
    },
  ];

  return (
    <main id="main-content">
      {/* ---------------------------------------------------------------- */}
      {/* Hero: claim + domain check + self-playing product demo            */}
      {/* ---------------------------------------------------------------- */}
      <section className="relative overflow-hidden" id="checker">
        <div aria-hidden="true" className="subtle-grid absolute inset-0 -z-10" />
        <div
          aria-hidden="true"
          className="absolute -top-40 start-1/2 -z-10 size-[560px] -translate-x-1/2 rounded-full bg-primary/8 blur-3xl"
        />
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 pb-24 pt-14 sm:px-6 sm:pt-20 lg:grid-cols-[1.05fr_.95fr] lg:pb-32">
          <div>
            <div className="anim-rise flex flex-wrap gap-2">
              <Badge className="h-7 gap-2 bg-primary/10 px-3 text-primary hover:bg-primary/10">
                <Sparkles />
                {isAr ? "الظهور والمبيعات بالذكاء الاصطناعي" : "AI visibility and AI sales"}
              </Badge>
              <Badge className="h-7 gap-1.5" variant="outline">
                <Store className="size-3.5" />
                {isAr ? "لمتاجر سلة" : "For Salla stores"}
              </Badge>
            </div>
            <h1
              className="anim-rise mt-6 max-w-3xl text-[40px] font-bold leading-[1.18] tracking-tight sm:text-5xl lg:text-6xl"
              style={{ animationDelay: "80ms" }}
            >
              {isAr ? (
                <>
                  عملاؤك يسألون الذكاء الاصطناعي قبل أن يشتروا.{" "}
                  <span className="text-primary">هل متجرك ضمن الإجابة؟</span>
                </>
              ) : (
                <>
                  Your customers ask AI before they buy.{" "}
                  <span className="text-primary">Is your store part of the answer?</span>
                </>
              )}
            </h1>
            <p
              className="anim-rise mt-6 max-w-2xl text-lg leading-8 text-muted-foreground"
              style={{ animationDelay: "160ms" }}
            >
              {isAr ? (
                <>
                  بصيرة تفحص جاهزية متجرك للظهور في غوغل وشات جي بي تي وجيمناي بأدلة موثّقة،
                  وتمنحك وكيل مبيعات عربيًا يجيب عملاءك من بيانات متجرك فقط - سعر حقيقي، مخزون
                  حقيقي، بلا اختراع.
                </>
              ) : (
                <>
                  Basirah checks how ready your store is to be understood by Google, ChatGPT, and
                  Gemini—with evidence—and gives you an Arabic sales agent that answers customers
                  from your store data only. Real prices, real stock, nothing invented.
                </>
              )}
            </p>
            <div className="anim-rise mt-8 max-w-2xl" style={{ animationDelay: "240ms" }}>
              <DomainCheckForm locale={locale} />
            </div>
            <div
              className="anim-rise mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted-foreground"
              style={{ animationDelay: "320ms" }}
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

          {/* Self-playing demo: visibility scorecard layered behind the agent chat */}
          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            <div
              aria-hidden="true"
              className="absolute -inset-10 -z-10 rounded-full bg-primary/10 blur-3xl"
            />

            {/* Visibility scorecard */}
            <Card
              className="anim-pop relative z-0 me-auto hidden w-72 rotate-2 border-primary/15 shadow-xl shadow-primary/10 sm:block"
              style={{ animationDelay: "500ms" }}
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">
                    {isAr ? "جاهزية الظهور" : "Visibility readiness"}
                  </p>
                  <Badge className="text-[10px]" variant="secondary">
                    {isAr ? "بيانات توضيحية" : "Illustrative"}
                  </Badge>
                </div>
                <div className="mt-4 flex items-center gap-4">
                  <div className="relative size-24 shrink-0">
                    <svg className="size-24 -rotate-90" viewBox="0 0 100 100">
                      <circle
                        className="stroke-muted"
                        cx="50"
                        cy="50"
                        fill="none"
                        r="45"
                        strokeWidth="8"
                      />
                      <circle
                        className="anim-gauge stroke-primary"
                        cx="50"
                        cy="50"
                        fill="none"
                        r="45"
                        strokeDasharray={GAUGE_CIRCUMFERENCE}
                        strokeLinecap="round"
                        strokeWidth="8"
                        style={
                          {
                            "--gauge-offset": `${GAUGE_CIRCUMFERENCE * (1 - GAUGE_SCORE / 100)}`,
                            animationDelay: "900ms",
                          } as React.CSSProperties
                        }
                      />
                    </svg>
                    <p className="anim-fade absolute inset-0 grid place-items-center" style={{ animationDelay: "1400ms" }}>
                      <span className="metric-numbers text-2xl font-bold">
                        {GAUGE_SCORE}
                        <span className="text-xs font-medium text-muted-foreground"> /100</span>
                      </span>
                    </p>
                  </div>
                  <div className="min-w-0 flex-1 space-y-2.5">
                    {visibilityChecks.map((check, index) => (
                      <div key={check.label}>
                        <div className="flex items-center justify-between gap-2 text-[11px]">
                          <span className="truncate text-muted-foreground">{check.label}</span>
                          <span className="metric-numbers font-semibold">{check.value}%</span>
                        </div>
                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                          <div
                            className="anim-bar h-full rounded-full bg-primary"
                            style={{
                              width: `${check.value}%`,
                              animationDelay: `${1000 + index * 180}ms`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sales-agent conversation */}
            <Card
              className="anim-pop relative z-10 ms-auto w-full max-w-sm overflow-hidden shadow-2xl shadow-primary/15 sm:-mt-10"
              style={{ animationDelay: "300ms" }}
            >
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
              <CardContent className="space-y-3 bg-muted/30 p-4">
                {/* Shopper question */}
                <div className="anim-pop flex justify-end gap-2" style={{ animationDelay: "220ms" }}>
                  <p className="max-w-[80%] rounded-2xl rounded-ee-md bg-primary px-4 py-2.5 text-sm text-primary-foreground">
                    {isAr ? "بشرتي دهنية وميزانيتي ١٥٠ ريال" : "I have oily skin and a SAR 150 budget"}
                  </p>
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-secondary text-secondary-foreground">
                    <User className="size-4" />
                  </span>
                </div>

                {/* Agent reply with typing indicator overlaying its slot */}
                <div className="relative">
                  <div
                    aria-hidden="true"
                    className="anim-typing-window absolute top-0 flex items-center gap-1 rounded-2xl rounded-ss-md border bg-card px-4 py-3"
                    style={
                      {
                        animationDelay: "380ms, 820ms",
                        insetInlineStart: "2.5rem",
                      } as React.CSSProperties
                    }
                  >
                    {[0, 1, 2].map((dot) => (
                      <span
                        className="typing-dot size-1.5 rounded-full bg-muted-foreground"
                        key={dot}
                        style={{ animationDelay: `${dot * 150}ms` }}
                      />
                    ))}
                  </div>
                  <div className="anim-pop flex gap-2" style={{ animationDelay: "920ms" }}>
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                      <Bot className="size-4" />
                    </span>
                    <p className="max-w-[85%] rounded-2xl rounded-ss-md border bg-card px-4 py-2.5 text-sm">
                      {isAr ? (
                        <>
                          أرشّح لك <strong>سيروم التوازن بالنياسيناميد</strong> — مذكور في وصفه
                          للبشرة الدهنية، وضمن ميزانيتك.
                        </>
                      ) : (
                        <>
                          I recommend the <strong>Niacinamide Balancing Serum</strong>—its
                          description mentions oily skin, and it fits your budget.
                        </>
                      )}
                    </p>
                  </div>
                </div>

                {/* Product card from the live catalog */}
                <div className="anim-pop ms-10" style={{ animationDelay: "1120ms" }}>
                  <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
                    <div className="flex items-center gap-3 p-3.5">
                      <span className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-success-soft">
                        <Image
                          alt={
                            isAr
                              ? "سيروم ومنظف من توصية وكيل المبيعات"
                              : "Serum and cleanser recommended by the sales agent"
                          }
                          className="object-cover"
                          fill
                          sizes="56px"
                          src="/landing/advisor-skincare.webp"
                        />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-semibold">
                            {isAr ? "سيروم التوازن بالنياسيناميد" : "Niacinamide Balancing Serum"}
                          </p>
                          <Badge className="bg-success-soft text-[10px] text-success hover:bg-success-soft">
                            {isAr ? "الأنسب" : "Best match"}
                          </Badge>
                        </div>
                        <p className="metric-numbers mt-0.5 text-sm font-bold">
                          {isAr ? "١٢٩ ر.س" : "SAR 129"}
                        </p>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-success">
                          <Check className="size-3.5" />
                          {isAr ? "متوفر · 42 قطعة" : "In stock · 42 units"}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 divide-x divide-border rtl:divide-x-reverse border-t text-center text-xs font-semibold">
                      <span className="bg-primary py-2.5 text-primary-foreground">
                        {isAr ? "أضف للسلة" : "Add to cart"}
                      </span>
                      <span className="py-2.5 text-primary">{isAr ? "عرض المنتج" : "View product"}</span>
                    </div>
                  </div>
                </div>

                <p
                  className="anim-fade flex items-center justify-center gap-1.5 pt-1 text-[11px] text-muted-foreground"
                  style={{ animationDelay: "1320ms" }}
                >
                  <BadgeCheck className="size-3.5 text-success" />
                  {isAr
                    ? "السعر والمخزون من كتالوج المتجر مباشرة — لا يخترع الوكيل معلومة"
                    : "Price and stock come straight from the catalog—the agent never invents a fact"}
                </p>
              </CardContent>
              <div className="flex items-center gap-2 border-t bg-card px-4 py-3">
                <p className="flex-1 rounded-full border bg-muted/40 px-4 py-2 text-xs text-muted-foreground">
                  {isAr ? "اكتب سؤالك هنا…" : "Type your question…"}
                </p>
                <span className="grid size-8 place-items-center rounded-full bg-primary/10 text-primary">
                  <Send className="size-4 rtl:-scale-x-100" />
                </span>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Marquee: the questions shoppers already ask AI                    */}
      {/* ---------------------------------------------------------------- */}
      <section className="border-y bg-card py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <p className="flex flex-wrap items-center justify-center gap-2 text-center text-sm font-semibold">
            {isAr
              ? "أسئلة من النوع الذي يُطرح على الذكاء الاصطناعي كل يوم"
              : "The kind of questions shoppers ask AI every day"}
            <Badge className="text-[10px]" variant="outline">
              {isAr ? "أمثلة توضيحية" : "Illustrative examples"}
            </Badge>
          </p>
        </div>
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
        <p className="mt-5 text-center text-sm text-muted-foreground">
          {isAr
            ? "عندما يسأل عميلك، تُبنى الإجابة مما تفهمه هذه الأنظمة عن متجرك."
            : "When your customer asks, the answer is built from what these systems understand about your store."}
        </p>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Two engines                                                       */}
      {/* ---------------------------------------------------------------- */}
      <section className="py-20 sm:py-28" id="engines">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold text-primary">
              {isAr ? "منصة واحدة، محركان" : "One platform, two engines"}
            </p>
            <h2 className="mt-4 text-3xl font-bold sm:text-4xl">
              {isAr
                ? "محرك يجعل متجرك مفهومًا، ومحرك يبيع من بياناته"
                : "One engine makes your store understood. The other sells from its data."}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              {isAr
                ? "الظهور بلا مبيعات إحصائية جميلة، والمبيعات بلا ظهور سقف منخفض. بصيرة تديرهما من حلقة بيانات واحدة."
                : "Visibility without sales is a pretty statistic. Sales without visibility hit a ceiling. Basirah runs both from a single data loop."}
            </p>
          </Reveal>

          {/* Engine 01 — AI visibility */}
          <div className="mt-16 grid scroll-mt-24 items-center gap-10 lg:grid-cols-2 lg:gap-16" id="report">
            <Reveal>
              <p className="metric-numbers text-sm font-bold text-primary">01</p>
              <h3 className="mt-3 text-2xl font-bold sm:text-3xl">
                {isAr ? "محرك الظهور بالذكاء الاصطناعي" : "The AI visibility engine"}
              </h3>
              <p className="mt-4 text-muted-foreground">
                {isAr
                  ? "فحص حتمي يقرأ متجرك كما تقرؤه أنظمة البحث والإجابة: البنية، والبيانات المنظمة، ووضوح الكيان، وقدرة صفحاتك على الإجابة عن أسئلة الشراء. ثم يحوّل كل فجوة إلى خطوة إصلاح لها دليل."
                  : "A deterministic scan reads your store the way search and answer systems do: structure, structured data, entity clarity, and whether your pages answer buying questions. Every gap becomes a fix with evidence."}
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  isAr
                    ? "درجة جاهزية من 7 مكونات موزونة، مع الدليل خلف كل رقم"
                    : "A readiness score from 7 weighted components, with evidence behind every number",
                  isAr
                    ? "خريطة أسئلة الشراء التي لا يجيب عنها متجرك بعد"
                    : "A map of the buying questions your store doesn't answer yet",
                  isAr
                    ? "خطة 30/60/90 يومًا مرتبة بالأثر، واستوديو محتوى ينفذها"
                    : "An impact-ranked 30/60/90-day plan, and a content studio that executes it",
                ].map((item) => (
                  <li className="flex gap-3" key={item}>
                    <Check className="mt-1 size-4 shrink-0 text-success" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Button asChild className="mt-7 h-11" variant="outline">
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
                        78<span className="text-sm text-muted-foreground">/100</span>
                      </p>
                    </div>
                    <div className="border-t pt-3 sm:border-s sm:border-t-0 sm:ps-4 sm:pt-0">
                      <p className="text-xs font-semibold text-primary">
                        {isAr ? "الملخص التنفيذي" : "Executive summary"}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        {isAr
                          ? "متجرك قابل للفهم تقنيًا، لكن 12 صفحة منتج لا تجيب أسئلة الشراء الأعلى نية. ابدأ بالمحتوى والبيانات المنظمة."
                          : "Your store is technically understandable, but 12 product pages miss high-intent buyer questions. Start with content and structured data."}
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
                  <div className="grid gap-2 border-t pt-4 text-xs text-muted-foreground sm:grid-cols-3">
                    {[
                      isAr ? "7 محاور بدرجاتها" : "7 scored components",
                      isAr ? "ملحق الأدلة والصفحات" : "Evidence and page appendix",
                      isAr ? "خطة 30 / 60 / 90 يومًا" : "30 / 60 / 90-day plan",
                    ].map((item) => (
                      <p className="flex items-center gap-2" key={item}>
                        <Check className="size-4 shrink-0 text-success" />
                        {item}
                      </p>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </Reveal>
          </div>

          {/* Engine 02 — sales agent */}
          <div className="mt-20 grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <Reveal className="lg:order-2">
              <p className="metric-numbers text-sm font-bold text-primary">02</p>
              <h3 className="mt-3 text-2xl font-bold sm:text-3xl">
                {isAr ? "وكيل مبيعات يبيع من بيانات متجرك" : "A sales agent that sells from your store data"}
              </h3>
              <p className="mt-4 text-muted-foreground">
                {isAr
                  ? "يفهم الاحتياج والميزانية واللهجة بالعربية، ثم يرشّح من كتالوجك المتزامن فقط — تصفية حتمية قبل أي توليد لغة. السعر والمخزون من نفس سجل المنتج، دائمًا."
                  : "It understands need, budget, and dialect in Arabic, then recommends only from your synced catalog—deterministic filtering before any language generation. Price and stock always come from the same product record."}
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  isAr
                    ? "يرد على عملائك على مدار الساعة، بهوية متجرك وألوانك"
                    : "Answers your customers around the clock, in your brand and colors",
                  isAr
                    ? "كل محادثة تتحول إلى إشارة: احتياجات صاعدة، اعتراضات متكررة، فجوات طلب"
                    : "Every conversation becomes a signal: rising needs, repeated objections, demand gaps",
                  isAr
                    ? "أسئلة العملاء التي بلا إجابة تتحول تلقائيًا إلى فرص محتوى للمحرك الأول"
                    : "Unanswered customer questions automatically become content opportunities for engine one",
                ].map((item) => (
                  <li className="flex gap-3" key={item}>
                    <Check className="mt-1 size-4 shrink-0 text-success" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
                <ShieldCheck className="size-4 shrink-0 text-primary" />
                {isAr
                  ? "يتطلب حسابًا ومتجر سلة متزامنًا ضمن خطة التجارة."
                  : "Requires an account and a synced Salla store on the Commerce plan."}
              </p>
            </Reveal>
            <Reveal className="lg:order-1" delay={120}>
              <Card className="overflow-hidden shadow-xl shadow-primary/5">
                <div className="flex items-center justify-between border-b px-5 py-4">
                  <p className="text-sm font-semibold">
                    {isAr ? "ماذا يريد عملاؤك هذا الأسبوع؟" : "What do your customers want this week?"}
                  </p>
                  <Badge variant="secondary">{isAr ? "بيانات توضيحية" : "Illustrative"}</Badge>
                </div>
                <CardContent className="space-y-3 p-5">
                  {[
                    {
                      icon: TrendingUp,
                      label: isAr ? "احتياج صاعد" : "Rising need",
                      body: isAr
                        ? "«روتين بسيط للبشرة الدهنية» — تكرر في 31 محادثة"
                        : "\"A simple oily-skin routine\"—repeated in 31 conversations",
                    },
                    {
                      icon: MessagesSquare,
                      label: isAr ? "اعتراض متكرر" : "Repeated objection",
                      body: isAr
                        ? "«طريقة الاستخدام غير واضحة» — أعلى سبب لتردد الشراء"
                        : "\"Usage instructions unclear\"—the top purchase hesitation",
                    },
                    {
                      icon: PenLine,
                      label: isAr ? "فرصة محتوى" : "Content opportunity",
                      body: isAr
                        ? "لا توجد صفحة تقارن السيروم بالتونر — والعملاء يسألون"
                        : "No page compares serum vs. toner—and customers keep asking",
                    },
                  ].map((signal) => (
                    <div className="flex items-start gap-3 rounded-xl border p-4" key={signal.label}>
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                        <signal.icon className="size-5" />
                      </span>
                      <div>
                        <p className="text-xs font-semibold text-primary">{signal.label}</p>
                        <p className="mt-1 text-sm">{signal.body}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* AI sales agent across high-intent needs                           */}
      {/* ---------------------------------------------------------------- */}
      <section className="scroll-mt-24 border-y bg-card py-20 sm:py-28" id="agent">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold text-primary">
              {isAr ? "وكيل واحد، احتياجات كثيرة" : "One agent, many needs"}
            </p>
            <h2 className="mt-4 text-3xl font-bold sm:text-4xl">
              {isAr
                ? "لا يحفظ سيناريوًا واحدًا — يفهم سبب الشراء"
                : "It does not memorize one script—it understands the reason to buy"}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              {isAr
                ? "من العناية بالبشرة إلى الأداء والطريق، يبدأ الوكيل من السؤال ثم يفلتر كتالوجك حسب الملاءمة والتوفر والميزانية قبل أن يجيب."
                : "From skincare to performance and the road, the agent starts with the question and filters your catalog for fit, stock, and budget before it answers."}
            </p>
          </Reveal>

          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {needScenarios.map((scenario, index) => (
              <Reveal delay={index * 90} key={scenario.label}>
                <article className="group flex h-full flex-col overflow-hidden rounded-3xl border bg-background shadow-sm transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10">
                  <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                    <Image
                      alt={scenario.alt}
                      className="object-cover transition-transform duration-300 group-hover:scale-[1.025]"
                      fill
                      sizes="(max-width: 1024px) 100vw, 33vw"
                      src={scenario.image}
                    />
                    <Badge className="absolute start-4 top-4 border-background/50 bg-background/90 text-foreground backdrop-blur-md hover:bg-background/90">
                      {scenario.label}
                    </Badge>
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <div className="ms-8 rounded-2xl rounded-ee-md bg-primary px-4 py-3 text-sm leading-6 text-primary-foreground">
                      {scenario.question}
                    </div>
                    <div className="mt-3 flex gap-2">
                      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                        <Bot className="size-4" />
                      </span>
                      <p className="rounded-2xl rounded-ss-md border bg-card px-4 py-3 text-sm leading-6">
                        {scenario.answer}
                      </p>
                    </div>
                    <div className="mt-5 flex items-center justify-between gap-4 border-t pt-4">
                      <div>
                        <p className="text-sm font-bold">{scenario.product}</p>
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-success">
                          <Check className="size-3.5" />
                          {isAr ? "متوفر الآن · من الكتالوج" : "In stock · from the catalog"}
                        </p>
                      </div>
                      <p className="metric-numbers shrink-0 font-bold text-primary">
                        {scenario.price}
                      </p>
                    </div>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
          <Reveal className="mt-7 text-center" delay={120}>
            <p className="inline-flex items-center gap-2 rounded-full border bg-background px-4 py-2 text-sm text-muted-foreground">
              <ShieldCheck className="size-4 text-primary" />
              {isAr
                ? "الادعاء غير الموجود يبقى غير موجودًا، والسؤال الحساس يتحول لفريقك."
                : "A missing claim stays missing, and a sensitive question is handed to your team."}
            </p>
          </Reveal>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Content enhancement preview                                       */}
      {/* ---------------------------------------------------------------- */}
      <section className="scroll-mt-24 py-20 sm:py-28" id="content">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[.8fr_1.2fr] lg:gap-16">
          <Reveal>
            <p className="text-sm font-semibold text-primary">
              {isAr ? "من سؤال متكرر إلى مقال أقوى" : "From repeated question to stronger article"}
            </p>
            <h2 className="mt-4 text-3xl font-bold sm:text-4xl">
              {isAr
                ? "بصيرة لا يقترح عنوانًا فقط. يعيد بناء الصفحة لتجيب."
                : "Basirah does more than suggest a title. It rebuilds the page to answer."}
            </h2>
            <p className="mt-5 text-lg text-muted-foreground">
              {isAr
                ? "نربط فجوة التقرير بسؤال حقيقي من العملاء، ثم نصنع مسودة عربية فيها إجابة مباشرة، بنية واضحة، منتجات موثّقة، مصادر وحدود للمعلومة."
                : "We connect a report gap to a real customer question, then create an Arabic draft with a direct answer, clear structure, verified products, sources, and explicit limits."}
            </p>
            <ul className="mt-7 space-y-3">
              {[
                isAr ? "قبل/بعد واضح للمراجعة والموافقة" : "Clear before/after for review and approval",
                isAr ? "كل ادعاء منتج يعود إلى مصدر في متجرك" : "Every product claim traces to a store source",
                isAr ? "الأسئلة الشائعة تأتي من الطلب الحقيقي، لا من الحشو" : "FAQs come from real demand, not filler",
                isAr ? "المسودة لا تُنشر قبل موافقتك" : "Nothing publishes before your approval",
              ].map((item) => (
                <li className="flex gap-3" key={item}>
                  <Check className="mt-1 size-4 shrink-0 text-success" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <Button asChild className="mt-8 h-11" variant="outline">
              <Link href="/insights">
                {isAr ? "شاهد مثال المقال الكامل" : "See the complete article example"}
                <Arrow />
              </Link>
            </Button>
          </Reveal>

          <Reveal delay={120}>
            <div className="relative">
              <div className="mb-4 rounded-2xl border border-dashed bg-muted/35 p-4 sm:me-12">
                <div className="flex items-center justify-between gap-4">
                  <Badge variant="outline">{isAr ? "قبل" : "Before"}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {isAr ? "صفحة منتج قصيرة" : "Thin product page"}
                  </span>
                </div>
                <p className="mt-3 font-semibold text-muted-foreground line-through decoration-destructive/60">
                  {isAr ? "سيروم مناسب لجميع أنواع البشرة بجودة عالية" : "A high-quality serum for every skin type"}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {isAr ? "لا سؤال مجاب · لا مصدر · لا حدود للادعاء" : "No answered question · no source · no claim limits"}
                </p>
              </div>

              <article className="overflow-hidden rounded-3xl border bg-card shadow-2xl shadow-primary/10 sm:ms-8">
                <div className="relative aspect-[16/8] overflow-hidden bg-muted">
                  <Image
                    alt={
                      isAr
                        ? "منتجات عناية بالبشرة في صورة مقال محسنة"
                        : "Skincare products in an enhanced article image"
                    }
                    className="object-cover"
                    fill
                    sizes="(max-width: 1024px) 100vw, 58vw"
                    src="/landing/advisor-skincare.webp"
                  />
                  <Badge className="absolute start-5 top-5 bg-background/90 text-foreground backdrop-blur-md hover:bg-background/90">
                    {isAr ? "بعد · مسودة موثّقة" : "After · evidence-led draft"}
                  </Badge>
                </div>
                <div className="p-6 sm:p-8">
                  <p className="text-xs font-semibold text-primary">
                    {isAr ? "دليل العناية · البشرة الحساسة" : "Care guide · sensitive skin"}
                  </p>
                  <h3 className="mt-3 text-2xl font-bold leading-snug sm:text-3xl">
                    {isAr
                      ? "كيف تختارين روتينًا بسيطًا للبشرة الحساسة؟"
                      : "How do you choose a simple routine for sensitive skin?"}
                  </h3>
                  <div className="mt-5 rounded-2xl bg-primary/[0.055] p-4">
                    <p className="flex items-center gap-2 text-sm font-bold text-primary">
                      <Bot className="size-4" />
                      {isAr ? "الإجابة المختصرة" : "The short answer"}
                    </p>
                    <p className="mt-2 text-sm leading-7">
                      {isAr
                        ? "ابدئي بمنظف لطيف ومرطب بسيط، وأضيفي منتجًا واحدًا فقط كل مرة. تحققي من مكونات المنتج ومصدر الادعاء قبل الشراء."
                        : "Start with a gentle cleanser and simple moisturizer, adding only one product at a time. Check the ingredient claim and its source before buying."}
                    </p>
                  </div>
                  <div className="mt-5 grid gap-3 text-xs sm:grid-cols-3">
                    {[
                      isAr ? "4 أسئلة قبل الاختيار" : "4 checks before choosing",
                      isAr ? "منتجان من الكتالوج" : "2 catalog products",
                      isAr ? "3 مصادر وحدود واضحة" : "3 sources and clear limits",
                    ].map((item) => (
                      <p className="rounded-xl border bg-background px-3 py-2.5 text-center text-muted-foreground" key={item}>
                        {item}
                      </p>
                    ))}
                  </div>
                </div>
              </article>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* The loop                                                          */}
      {/* ---------------------------------------------------------------- */}
      <section className="scroll-mt-24 border-y bg-card py-20 sm:py-28" id="how-it-works">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold text-primary">
              {isAr ? "كيف يعمل" : "How it works"}
            </p>
            <h2 className="mt-4 text-3xl font-bold sm:text-4xl">
              {isAr ? "حلقة واحدة تغذّي نفسها" : "One loop that feeds itself"}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              {isAr
                ? "كل مسودة ومحادثة تعود إلى دليل في التقرير، وكل إعادة فحص تثبت ما تغيّر."
                : "Every draft and conversation traces back to report evidence, and every rescan proves what changed."}
            </p>
          </Reveal>
          <ol className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {loopSteps.map((step, index) => (
              <Reveal as="li" delay={index * 90} key={step.title}>
                <div className="group h-full rounded-2xl border bg-background p-5 transition-shadow hover:shadow-lg hover:shadow-primary/5">
                  <div className="flex items-center justify-between">
                    <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      <step.icon className="size-5" />
                    </span>
                    <span className="metric-numbers text-xs font-bold text-muted-foreground">
                      0{index + 1}
                    </span>
                  </div>
                  <h3 className="mt-5 text-lg font-bold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.body}</p>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Honesty / trust — dark section                                    */}
      {/* ---------------------------------------------------------------- */}
      <section className="relative overflow-hidden bg-foreground py-20 text-background sm:py-28">
        <div aria-hidden="true" className="subtle-grid-dark absolute inset-0" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold text-primary-foreground/90">
              <span className="rounded-full bg-primary px-3 py-1">
                {isAr ? "قياس صادق" : "Honest measurement"}
              </span>
            </p>
            <h2 className="mt-6 text-3xl font-bold sm:text-5xl">
              {isAr ? "لا نعدك بالترتيب. نعدك بالدليل." : "We don't promise rankings. We promise evidence."}
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-background/70">
              {isAr
                ? "أي أداة تضمن لك الظهور في ChatGPT تبيعك وعدًا لا تملكه. نحن نقيس ما يمكن إثباته، ونسمّي ما لا يمكن قياسه باسمه: غير متاح."
                : "Any tool that guarantees you'll appear in ChatGPT is selling a promise it doesn't own. We measure what can be proven, and call what can't be measured by its name: unavailable."}
            </p>
          </Reveal>
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {trustTiles.map((tile, index) => (
              <Reveal delay={index * 80} key={tile.title}>
                <div className="h-full rounded-2xl border border-background/15 bg-background/5 p-6 backdrop-blur-sm">
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
                  <p className="metric-numbers text-4xl font-bold text-primary-foreground">
                    <bdi dir="ltr">{fact.value}</bdi>
                  </p>
                  <p className="mt-2 text-sm text-background/70">{fact.label}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Pricing                                                           */}
      {/* ---------------------------------------------------------------- */}
      <section className="scroll-mt-24 py-20 sm:py-28" id="pricing">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold text-primary">{isAr ? "أسعار واضحة" : "Clear pricing"}</p>
            <h2 className="mt-4 text-3xl font-bold sm:text-4xl">
              {isAr
                ? "التشخيص مجاني. ادفع فقط مقابل التنفيذ والتحسين."
                : "The diagnosis is free. Pay only for implementation and improvement."}
            </h2>
            <p className="mt-4 text-muted-foreground">
              {isAr
                ? "التقرير الكامل لا يكلف شيئًا. الأسعار المدفوعة أدناه لخدمة العمل المستمر، وقبل الضريبة."
                : "The full report costs nothing. Paid prices below are for ongoing work and exclude VAT."}
            </p>
          </Reveal>
          <Reveal className="mt-10" delay={80}>
            <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 p-5 sm:flex-row">
              <div className="flex items-center gap-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-success-soft text-success">
                  <ScanSearch className="size-5" />
                </span>
                <div>
                  <p className="font-bold">{isAr ? "الفحص والتقرير — مجانًا" : "The check and report — free"}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {isAr
                      ? "5–10 صفحات، معاينة فورية، ثم تقرير تنفيذي من 7 صفحات ببريد واحد."
                      : "5–10 pages, an instant preview, then a seven-page executive report with one email field."}
                  </p>
                </div>
              </div>
              <Button asChild className="h-11 w-full sm:w-auto">
                <Link href={publicPath(locale, "/#checker")}>
                  {isAr ? "افحص الآن" : "Check now"}
                  <Arrow />
                </Link>
              </Button>
            </div>
          </Reveal>
          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {plans.map((plan, index) => (
              <Reveal delay={index * 90} key={plan.name}>
                <Card
                  className={
                    plan.featured
                      ? "relative h-full ring-2 ring-primary shadow-2xl shadow-primary/15 lg:-translate-y-2"
                      : "relative h-full transition-shadow hover:shadow-lg hover:shadow-primary/5"
                  }
                >
                  {plan.featured && (
                    <Badge className="absolute -top-3 start-6">{isAr ? "الأنسب للنمو" : "Best for growth"}</Badge>
                  )}
                  <CardContent className="flex h-full flex-col p-6 sm:p-7">
                    <h3 className="text-xl font-bold">{plan.name}</h3>
                    <p className="mt-3 min-h-12 text-sm text-muted-foreground">{plan.description}</p>
                    <p className="mt-6 flex items-baseline gap-2">
                      <span className="metric-numbers text-4xl font-bold">{plan.price}</span>
                      <span className="text-sm text-muted-foreground">{plan.suffix}</span>
                    </p>
                    <ul className="mt-6 flex-1 space-y-3">
                      {plan.features.map((feature) => (
                        <li className="flex gap-2 text-sm" key={feature}>
                          <Check className="mt-0.5 size-4 shrink-0 text-success" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Button
                      asChild
                      className="mt-7 h-11 w-full"
                      variant={plan.featured ? "default" : "outline"}
                    >
                      <Link href={publicPath(locale, "/#checker")}>
                        {isAr ? "ابدأ بالفحص المجاني" : "Start with the free check"}
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </Reveal>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Button asChild className="h-11" variant="link">
              <Link href={publicPath(locale, "/pricing")}>
                {isAr ? "قارن تفاصيل الخطط والحدود" : "Compare plan details and limits"}
                <Arrow />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* FAQ                                                               */}
      {/* ---------------------------------------------------------------- */}
      <section className="border-y bg-card py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <Reveal className="text-center">
            <p className="text-sm font-semibold text-primary">
              {isAr ? "الأسئلة الشائعة" : "Frequently asked questions"}
            </p>
            <h2 className="mt-4 text-3xl font-bold sm:text-4xl">
              {isAr ? "إجابات مباشرة قبل أن تبدأ" : "Straight answers before you start"}
            </h2>
          </Reveal>
          <Reveal className="mt-10" delay={100}>
            <div className="divide-y rounded-2xl border bg-background px-5 sm:px-7">
              {faqs.map((item) => (
                <details className="group py-5" key={item.q}>
                  <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-5 font-bold">
                    <span>{item.q}</span>
                    <span className="grid size-8 shrink-0 place-items-center rounded-full border text-muted-foreground transition-all group-open:rotate-180 group-open:border-primary group-open:text-primary">
                      <ChevronDown className="size-4" />
                    </span>
                  </summary>
                  <p className="max-w-3xl pb-2 pt-3 leading-7 text-muted-foreground">{item.a}</p>
                </details>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Final CTA                                                         */}
      {/* ---------------------------------------------------------------- */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <Reveal>
            <div className="relative overflow-hidden rounded-4xl bg-primary px-6 py-14 text-center text-primary-foreground sm:px-12 sm:py-20">
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
                <Button
                  asChild
                  className="mt-9 h-13 bg-background px-8 text-base font-bold text-foreground hover:bg-background/90"
                >
                  <Link href={publicPath(locale, "/#checker")}>
                    {isAr ? "افحص متجرك مجانًا الآن" : "Check your store free now"}
                    <Arrow />
                  </Link>
                </Button>
                <p className="mt-5 text-sm text-primary-foreground/70">
                  {isAr ? "المعاينة بلا بريد · التقرير الكامل ببريد واحد · بلا بطاقة" : "Preview without email · full report with one email · no card"}
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
