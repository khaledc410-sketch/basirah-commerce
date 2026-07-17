import { ArrowLeft, ArrowRight, Check, PenLine, RefreshCw, SearchCheck, Wrench } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { publicPath, type PublicLocale } from "@/i18n/public";

interface PricingContentProps {
  locale: PublicLocale;
}
export function PricingContent({ locale }: PricingContentProps) {
  const isAr = locale === "ar";
  const Arrow = isAr ? ArrowLeft : ArrowRight;
  const plans = [
    {
      id: "report",
      name: isAr ? "التقرير الكامل" : "Full report",
      price: "0",
      cadence: isAr ? "ر.س — مجاني" : "SAR — free",
      description: isAr ? "تشخيص مقنع ومفيد لمتجر واحد، بلا بطاقة أو حساب." : "A useful, persuasive diagnosis for one store, with no card or account.",
      features: isAr
        ? ["فحص 5–10 صفحات عامة", "كل المشاكل والأدلة", "خطة 30/60/90 يومًا", "PDF تنفيذي من 7 صفحات", "رابط خاص صالح 30 يومًا"]
        : ["Scan 5–10 public pages", "Every issue and its evidence", "30/60/90-day plan", "Seven-page executive PDF", "Private link valid for 30 days"],
    },
    {
      id: "growth",
      name: isAr ? "النمو" : "Growth",
      price: "699",
      cadence: isAr ? "ر.س شهريًا" : "SAR / month",
      description: isAr ? "للمتاجر التي تريد قياس التحسن وإنتاج المحتوى." : "For stores that want continuous measurement and content creation.",
      features: isAr
        ? ["تقرير شهري", "سجل التحسن", "كاتب محتوى مؤسس على الأدلة", "حتى 8 مسودات شهريًا", "تصدير HTML وMarkdown"]
        : ["Monthly report", "Improvement history", "Evidence-grounded content writer", "Up to 8 drafts per month", "HTML and Markdown export"],
    },
    {
      id: "commerce",
      name: isAr ? "التجارة" : "Commerce",
      price: "1,499",
      cadence: isAr ? "ر.س شهريًا" : "SAR / month",
      description: isAr ? "حلقة واحدة للظهور والمحتوى ومبيعات سلة." : "One loop for visibility, content, and Salla sales.",
      features: isAr
        ? ["جميع مزايا النمو", "وكيل المبيعات", "مزامنة سلة", "حتى 2,000 رسالة عميل", "تحليلات المحادثات والتحويل"]
        : ["Everything in Growth", "AI sales agent", "Salla sync", "Up to 2,000 customer messages", "Conversation and conversion analytics"],
    },
  ];
  const rows = [
    [isAr ? "صفحات الفحص" : "Checked pages", "5–10", isAr ? "حتى 10 شهريًا" : "Up to 10 monthly", isAr ? "حتى 10 شهريًا" : "Up to 10 monthly"],
    [isAr ? "خطة 30/60/90" : "30/60/90 plan", "✓", "✓", "✓"],
    [isAr ? "كاتب المحتوى" : "Content writer", "—", isAr ? "8 مسودات" : "8 drafts", isAr ? "8 مسودات" : "8 drafts"],
    [isAr ? "وكيل المبيعات" : "Sales agent", "—", "—", "✓"],
    [isAr ? "رسائل العملاء" : "Customer messages", "—", "—", "2,000"],
    [isAr ? "إعادة الفحص" : "Rescan", "—", isAr ? "شهريًا" : "Monthly", isAr ? "شهريًا" : "Monthly"],
  ];

  return (
    <main id="main-content">
      <section className="relative border-b py-16 sm:py-24">
        <div aria-hidden="true" className="subtle-grid absolute inset-0 -z-10" />
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <Badge variant="secondary">{isAr ? "تسعير الإطلاق" : "Launch pricing"}</Badge>
          <h1 className="mt-5 text-4xl font-bold sm:text-5xl">
            {isAr ? "التشخيص مجاني. ادفع فقط مقابل التنفيذ والتحسين المستمر." : "The diagnosis is free. Pay only for implementation and continuous improvement."}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
            {isAr
              ? "شاهد الدرجة وأهم 3 مشاكل بلا بريد، ثم افتح التقرير الكامل مجانًا ببريد واحد. الأسعار المدفوعة أدناه قبل الضريبة."
              : "See the score and top three issues without email, then unlock the full report free with one email field. Paid prices below exclude VAT."}
          </p>
          <Button asChild className="mt-8 h-12 px-6 text-base">
            <Link href={publicPath(locale, "/#checker")}>
              {isAr ? "افحص متجرك مجانًا" : "Check your store free"}
              <Arrow />
            </Link>
          </Button>
        </div>
      </section>

      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Card className="mb-8 bg-success-soft text-success">
            <CardContent className="flex flex-col items-start justify-between gap-5 p-5 sm:flex-row sm:items-center">
              <div className="flex items-start gap-3">
                <SearchCheck className="mt-1 size-6 shrink-0" />
                <div>
                  <h2 className="text-lg font-semibold">{isAr ? "الفحص والتقرير مجانًا" : "Free check and full report"}</h2>
                  <p className="mt-1 text-sm">{isAr ? "نطاق واحد · 5–10 صفحات · معاينة فورية · تقرير تنفيذي من 7 صفحات" : "One domain · 5–10 pages · instant preview · seven-page executive report"}</p>
                </div>
              </div>
              <Button asChild className="h-11 bg-background text-foreground hover:bg-background/90">
                <Link href={publicPath(locale, "/#checker")}>{isAr ? "ابدأ مجانًا" : "Start free"}</Link>
              </Button>
            </CardContent>
          </Card>
          <div className="grid gap-5 lg:grid-cols-3">
            {plans.map((plan) => (
              <Card className={plan.id === "growth" ? "relative ring-2 ring-primary shadow-xl shadow-primary/10" : "relative"} key={plan.id}>
                {plan.id === "growth" && <Badge className="absolute -top-3 start-6">{isAr ? "الأنسب للنمو" : "Most popular"}</Badge>}
                <CardContent className="flex h-full flex-col p-6 sm:p-7">
                  <h2 className="text-xl font-semibold">{plan.name}</h2>
                  <p className="mt-3 min-h-12 text-sm text-muted-foreground">{plan.description}</p>
                  <p className="metric-numbers mt-7 text-4xl font-semibold">{plan.price}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{plan.cadence}</p>
                  <ul className="mt-7 flex-1 space-y-3">
                    {plan.features.map((feature) => (
                      <li className="flex gap-2 text-sm" key={feature}>
                        <Check className="mt-0.5 size-4 shrink-0 text-success" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button asChild className="mt-7 h-11" variant={plan.id === "growth" ? "default" : "outline"}>
                    <Link href={publicPath(locale, "/#checker")}>{isAr ? "ابدأ بالفحص" : "Start with a check"}</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            {isAr
              ? "لا يتم تحصيل أي مبلغ في مسار التقرير. الخطط المدفوعة اختيار منفصل عندما تريد أن ننفّذ ونقيس معك."
              : "Nothing is charged in the report flow. Paid plans are a separate choice when you want implementation and ongoing measurement."}
          </p>
        </div>
      </section>

      <section className="border-y bg-card py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-8">
            <p className="text-sm font-semibold text-primary">{isAr ? "مقارنة سريعة" : "Quick comparison"}</p>
            <h2 className="mt-3 text-3xl font-semibold">{isAr ? "ما الذي تحصل عليه؟" : "What is included?"}</h2>
          </div>
          <div className="overflow-hidden rounded-2xl border bg-background">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{isAr ? "الميزة" : "Feature"}</TableHead>
                  <TableHead>{plans[0].name}</TableHead>
                  <TableHead>{plans[1].name}</TableHead>
                  <TableHead>{plans[2].name}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row[0]}>
                    {row.map((cell, index) => (
                      <TableCell className={index === 0 ? "font-medium" : "metric-numbers"} key={`${row[0]}-${index}`}>{cell}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold text-primary">{isAr ? "ما الذي تدفع مقابله؟" : "What do you pay for?"}</p>
            <h2 className="mt-3 text-3xl font-semibold">{isAr ? "ليس التقرير. بل تحويله إلى نتيجة." : "Not the report. Turning it into a result."}</h2>
          </div>
          <ol className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              { icon: Wrench, title: isAr ? "تنفيذ الأولويات" : "Implement priorities", body: isAr ? "ترتيب الإصلاحات والعمل عليها بدل تركها داخل PDF." : "Prioritize and work through the fixes instead of leaving them in a PDF." },
              { icon: PenLine, title: isAr ? "إنتاج محتوى موثّق" : "Produce grounded content", body: isAr ? "تحويل الفجوات إلى مسودات مبنية على حقائق متجرك." : "Turn gaps into drafts grounded in your store facts." },
              { icon: RefreshCw, title: isAr ? "قياس التحسن" : "Measure improvement", body: isAr ? "إعادة الفحص بنفس المنهجية وإظهار ما تغيّر." : "Rescan with the same method and show what changed." },
            ].map((step, index) => (
              <li className="rounded-2xl border bg-card p-6" key={step.title}>
                <div className="flex items-center justify-between">
                  <step.icon className="size-6 text-primary" />
                  <span className="metric-numbers text-xs text-muted-foreground">0{index + 1}</span>
                </div>
                <h3 className="mt-5 font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </main>
  );
}
