import {
  Bot,
  Check,
  FileText,
  Gauge,
  LayoutDashboard,
  ListChecks,
  PenLine,
  Settings,
  Sparkles,
  TrendingUp,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { PublicLocale } from "@/i18n/public";

const GAUGE_CIRCUMFERENCE = 283;
const GAUGE_SCORE = 75;

interface HeroDashboardProps {
  locale: PublicLocale;
}

/**
 * Marketing recreation of the real dashboard overview (see /dashboard in demo
 * mode). Built as DOM instead of a bitmap so it stays retina-sharp, animates,
 * and always matches the current brand tokens.
 */
export function HeroDashboard({ locale }: HeroDashboardProps) {
  const isAr = locale === "ar";

  const navItems = [
    { icon: LayoutDashboard, label: isAr ? "الملخص" : "Overview", active: true },
    { icon: FileText, label: isAr ? "التقارير" : "Reports", active: false },
    { icon: ListChecks, label: isAr ? "خطة التحسين" : "Improvement plan", active: false },
    { icon: PenLine, label: isAr ? "المحتوى" : "Content", active: false },
    { icon: Bot, label: isAr ? "وكيل المبيعات" : "Sales agent", active: false },
    { icon: Settings, label: isAr ? "الإعدادات" : "Settings", active: false },
  ];

  const stats = [
    { value: "92%", label: isAr ? "تغطية الفحص" : "Scan coverage" },
    { value: "88%", label: isAr ? "ثقة النتيجة" : "Result confidence" },
    { value: "+8", label: isAr ? "التغيّر منذ آخر فحص" : "Change since last scan" },
  ];

  return (
    <div className="relative mx-auto mt-16 max-w-5xl sm:mt-20">
      {/* Soft glow behind the frame */}
      <div
        aria-hidden="true"
        className="absolute -inset-8 -z-10 rounded-[3rem] bg-primary/10 blur-3xl"
      />

      {/* Browser frame */}
      <div className="anim-pop overflow-hidden rounded-3xl border border-primary/15 bg-card shadow-2xl shadow-primary/15 ring-1 ring-primary/5" style={{ animationDelay: "550ms" }}>
        <div className="flex items-center gap-2 border-b bg-muted/40 px-5 py-3">
          <span className="flex gap-1.5" aria-hidden="true">
            <span className="size-2.5 rounded-full bg-destructive/50" />
            <span className="size-2.5 rounded-full bg-warning/60" />
            <span className="size-2.5 rounded-full bg-success/60" />
          </span>
          <span className="mx-auto rounded-full border bg-background px-4 py-1 text-[11px] text-muted-foreground" dir="ltr">
            app.basirah.ai/dashboard
          </span>
        </div>

        <div className="grid md:grid-cols-[13rem_1fr]">
          {/* Sidebar */}
          <aside className="hidden border-e bg-muted/20 p-4 md:block">
            <p className="px-2 text-lg font-bold text-primary">{isAr ? "بصيرة" : "Basirah"}</p>
            <nav className="mt-5 space-y-1">
              {navItems.map((item) => (
                <p
                  className={
                    item.active
                      ? "flex items-center gap-2.5 rounded-lg bg-primary/10 px-2.5 py-2 text-xs font-semibold text-primary"
                      : "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs text-muted-foreground"
                  }
                  key={item.label}
                >
                  <item.icon className="size-3.5 shrink-0" />
                  {item.label}
                </p>
              ))}
            </nav>
          </aside>

          {/* Main panel */}
          <div className="space-y-4 p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-base font-bold sm:text-lg">
                  {isAr ? "ملخص ظهور متجرك" : "Your store's visibility summary"}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {isAr
                    ? "درجة الجاهزية، أهم المشكلات، والخطوة التالية — بدليل"
                    : "Readiness score, top issues, and the next step—with evidence"}
                </p>
              </div>
              <Badge className="bg-success-soft text-success hover:bg-success-soft">
                {isAr ? "اكتمل الفحص" : "Scan complete"}
              </Badge>
            </div>

            {/* Score card */}
            <div className="rounded-2xl border bg-background p-4 sm:p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">
                    {isAr ? "جاهزية المتجر للظهور" : "Store visibility readiness"}
                  </p>
                  <p className="metric-numbers mt-1 text-4xl font-bold text-primary sm:text-5xl">
                    75
                    <span className="text-sm font-medium text-muted-foreground">
                      {" "}
                      / 100
                    </span>
                  </p>
                </div>
                <Badge variant="outline" className="text-[10px]">
                  {isAr ? "10 صفحات · فاحص الجاهزية العربي" : "10 pages · Arabic readiness scanner"}
                </Badge>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
                <div className="anim-bar h-full w-3/4 rounded-full bg-primary" style={{ animationDelay: "1100ms" }} />
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2.5">
                {stats.map((stat) => (
                  <div className="rounded-xl border bg-muted/25 px-3 py-2.5 text-center" key={stat.label}>
                    <p className="metric-numbers text-lg font-bold sm:text-xl">
                      <bdi dir="ltr">{stat.value}</bdi>
                    </p>
                    <p className="mt-0.5 truncate text-[10px] text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* First priority */}
            <div className="rounded-2xl border border-primary/20 bg-primary/[0.04] p-4">
              <div className="flex items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
                  <Sparkles className="size-4" />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold">
                      {isAr ? "وضّح كيان علامتك أولًا" : "Clarify your brand entity first"}
                    </p>
                    <Badge className="bg-warning-soft text-[10px] text-warning hover:bg-warning-soft">
                      {isAr ? "الأولوية الأولى" : "First priority"}
                    </Badge>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                    {isAr
                      ? "ابدأ بصفحة علامة موثقة تجمع من أنتم وماذا تبيعون — هذا الإصلاح يدعم فهم المتجر قبل إنشاء مزيد من المحتوى."
                      : "Start with a verified brand page covering who you are and what you sell—this fix helps systems understand the store before more content is created."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating: readiness gauge */}
      <div className="anim-pop absolute -start-6 top-24 hidden w-56 -rotate-3 lg:block" style={{ animationDelay: "900ms" }}>
        <div className="anim-float rounded-2xl border border-primary/15 bg-card p-4 shadow-xl shadow-primary/10">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold">{isAr ? "جاهزية الظهور" : "Visibility readiness"}</p>
            <Gauge className="size-4 text-primary" />
          </div>
          <div className="mt-3 flex items-center gap-3">
            <div className="relative size-16 shrink-0">
              <svg className="size-16 -rotate-90" viewBox="0 0 100 100">
                <circle className="stroke-muted" cx="50" cy="50" fill="none" r="45" strokeWidth="10" />
                <circle
                  className="anim-gauge stroke-primary"
                  cx="50"
                  cy="50"
                  fill="none"
                  r="45"
                  strokeDasharray={GAUGE_CIRCUMFERENCE}
                  strokeLinecap="round"
                  strokeWidth="10"
                  style={
                    {
                      "--gauge-offset": `${GAUGE_CIRCUMFERENCE * (1 - GAUGE_SCORE / 100)}`,
                      animationDelay: "1400ms",
                    } as React.CSSProperties
                  }
                />
              </svg>
              <p className="metric-numbers absolute inset-0 grid place-items-center text-sm font-bold">
                {GAUGE_SCORE}
              </p>
            </div>
            <div className="space-y-1 text-[10px] text-muted-foreground">
              <p className="flex items-center gap-1">
                <Check className="size-3 text-success" />
                {isAr ? "بيانات منظمة" : "Structured data"}
              </p>
              <p className="flex items-center gap-1">
                <Check className="size-3 text-success" />
                {isAr ? "وضوح الكيان" : "Entity clarity"}
              </p>
              <p className="flex items-center gap-1">
                <Check className="size-3 text-success" />
                {isAr ? "أسئلة الشراء" : "Buyer questions"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Floating: agent conversation */}
      <div className="anim-pop absolute -end-8 top-10 hidden w-64 rotate-2 lg:block" style={{ animationDelay: "1100ms" }}>
        <div className="anim-float rounded-2xl border bg-card p-4 shadow-xl shadow-primary/10" style={{ animationDelay: "1.8s" }}>
          <p className="flex items-center gap-2 text-xs font-semibold">
            <span className="grid size-6 place-items-center rounded-full bg-primary text-primary-foreground">
              <Bot className="size-3.5" />
            </span>
            {isAr ? "وكيل المبيعات" : "Sales agent"}
            <span className="ms-auto flex items-center gap-1 text-[10px] font-normal text-success">
              <span className="size-1.5 rounded-full bg-success" />
              {isAr ? "متصل" : "Online"}
            </span>
          </p>
          <p className="ms-6 mt-3 rounded-xl rounded-ee-sm bg-primary px-3 py-2 text-[11px] leading-5 text-primary-foreground">
            {isAr ? "بشرتي دهنية وميزانيتي ١٥٠ ريال" : "Oily skin, SAR 150 budget"}
          </p>
          <p className="me-6 mt-2 rounded-xl rounded-ss-sm border bg-background px-3 py-2 text-[11px] leading-5">
            {isAr
              ? "أرشّح سيروم التوازن — ١٢٩ ر.س، متوفر الآن"
              : "Try the balancing serum—SAR 129, in stock"}
          </p>
        </div>
      </div>

      {/* Floating: content signal */}
      <div className="anim-pop absolute -bottom-6 -end-2 hidden w-60 -rotate-2 xl:block" style={{ animationDelay: "1300ms" }}>
        <div className="anim-float rounded-2xl border bg-card p-4 shadow-xl shadow-primary/10" style={{ animationDelay: "3.4s" }}>
          <p className="flex items-center gap-2 text-xs font-semibold">
            <span className="grid size-6 place-items-center rounded-lg bg-primary/10 text-primary">
              <TrendingUp className="size-3.5" />
            </span>
            {isAr ? "فرصة محتوى جديدة" : "New content opportunity"}
          </p>
          <p className="mt-2 text-[11px] leading-5 text-muted-foreground">
            {isAr
              ? "«روتين بسيط للبشرة الدهنية» تكرر في 31 محادثة — لا توجد صفحة تجيب عنه بعد."
              : "\"A simple oily-skin routine\" appeared in 31 conversations—no page answers it yet."}
          </p>
        </div>
      </div>
    </div>
  );
}
