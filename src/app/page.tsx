import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpLeft,
  Bot,
  Check,
  CheckCircle2,
  ChevronDown,
  FileCheck2,
  Gauge,
  Globe2,
  Lightbulb,
  LockKeyhole,
  MessageCircleMore,
  PackageSearch,
  SearchCheck,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  TrendingUp,
  UsersRound,
} from "lucide-react";

import { BrandMark } from "@/components/brand-mark";
import { HeroDashboardPreview } from "@/components/marketing/hero-dashboard-preview";
import { demoAdvisorBrandSettings } from "@/components/widget/brand-settings";
import { CustomerAdvisorWidget } from "@/components/widget/customer-advisor-widget";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "بصيرة — حوّل أسئلة العملاء إلى مبيعات وقرارات أوضح",
};

const navItems = [
  ["#features", "المزايا"],
  ["#how", "كيف يعمل"],
  ["#visibility", "الظهور بالذكاء الاصطناعي"],
  ["#pricing", "الأسعار"],
  ["#faq", "الأسئلة الشائعة"],
] as const;

export default function HomePage() {
  return (
    <div className="overflow-x-clip bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur-xl"><div className="mx-auto flex min-h-18 max-w-7xl items-center justify-between gap-5 px-4 sm:px-6"><Link className="text-primary" href="/"><BrandMark /></Link><nav aria-label="التنقل التسويقي" className="hidden items-center gap-6 lg:flex">{navItems.map(([href, label]) => <Link className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground" href={href} key={href}>{label}</Link>)}</nav><div className="flex items-center gap-2"><Button asChild className="hidden sm:inline-flex" variant="ghost"><Link href="/signin">تسجيل الدخول</Link></Button><Button asChild><Link href="/signin">ابدأ الآن<ArrowLeft /></Link></Button></div></div></header>

      <main id="main-content">
        <section className="relative"><div aria-hidden="true" className="subtle-grid absolute inset-0 -z-10" /><div className="mx-auto grid max-w-7xl items-center gap-12 px-4 pb-20 pt-16 sm:px-6 sm:pt-24 lg:grid-cols-[.9fr_1.1fr] lg:pb-28"><div><div className="mb-6 flex flex-wrap gap-2"><Badge className="gap-2 bg-primary/10 text-primary hover:bg-primary/10"><span className="size-2 rounded-full bg-warning" />عرض تجريبي لسلة وزد</Badge><Badge variant="outline">التكامل الإنتاجي قيد الاختبار</Badge></div><h1 className="max-w-2xl text-4xl font-bold leading-[1.25] tracking-tight sm:text-5xl lg:text-[58px]">حوّل أسئلة عملائك إلى مبيعات — <span className="text-primary">واعرف ما الذي يمنعهم</span> من الشراء.</h1><p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">مستشار مبيعات ذكي لمتاجر سلة وزد، يرشّح المنتجات من كتالوج موحّد بعد التحقق من اتصال المنصة، ويحلّل أسئلة العملاء واعتراضاتهم بالأدلة، ويكشف مدى جاهزية الصفحات للبحث والذكاء الاصطناعي.</p><div className="mt-8 flex flex-col gap-3 sm:flex-row"><Button asChild className="h-12 px-6 text-base"><Link href="/signin">ابدأ بالعرض التجريبي<ArrowLeft /></Link></Button><Button asChild className="h-12 px-6 text-base" variant="outline"><Link href="/dashboard/widget">جرّبه كعميل<ArrowUpLeft /></Link></Button></div><p className="mt-5 flex max-w-lg items-start gap-2 text-xs text-muted-foreground"><LockKeyhole className="mt-0.5 size-4 shrink-0 text-primary" />لا نطلب كلمة مرور سلة أو زد. الربط الحي لا يُفعّل قبل اعتماد التطبيق واجتياز اختبارات متجر التطوير.</p></div><HeroDashboardPreview /></div></section>

        <section className="border-y bg-card"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-10 gap-y-4 px-4 py-6 text-sm text-muted-foreground sm:px-6"><span className="font-semibold text-foreground">مصمم للتجارة الخليجية</span>{["سلة وزد", "العربية من البداية", "أسعار ومخزون موثّقان", "موافقة قبل التعديل", "جاهزية ≠ ظهور فعلي"].map((item) => <span className="flex items-center gap-2" key={item}><Check className="size-4 text-success" />{item}</span>)}</div></section>

        <section className="scroll-mt-24 py-20 sm:py-28" id="features"><div className="mx-auto max-w-7xl px-4 sm:px-6"><div className="mx-auto max-w-3xl text-center"><p className="text-sm font-semibold text-primary">ثلاث نتائج، حلقة واحدة</p><h2 className="mt-4 text-3xl font-semibold sm:text-4xl">ليس صندوق محادثة آخر</h2><p className="mt-4 text-lg text-muted-foreground">المستشار يبيع من الحقائق، والمحادثات تصبح ذكاءً، والذكاء يتحول إلى تحسين قابل للمراجعة.</p></div><div className="mt-12 grid gap-5 lg:grid-cols-3">{[
          { icon: Bot, title: "يساعد العميل على الاختيار", body: "يفهم الاحتياج والميزانية، ثم يفلتر المنتجات المتاحة قبل أن يشرح سبب الترشيح.", detail: "لا منتج مخترع · لا سعر متوقع" },
          { icon: UsersRound, title: "يكشف ما يمنع الشراء", body: "يحوّل كل محادثة إلى نية واحتياج واعتراض ونتيجة، ثم يربطها بقمع التحويل.", detail: "ملاحظة منفصلة عن الاستنتاج" },
          { icon: SearchCheck, title: "يحسّن قابلية فهم الصفحات", body: "يفحص السمات والمحتوى والبنية والثقة، ويصنع مسودات من أسئلة العملاء الحقيقية.", detail: "لا وعود بالترتيب أو الظهور" },
        ].map((feature) => <Card className="group overflow-hidden" key={feature.title}><CardContent className="p-6 sm:p-8"><span className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><feature.icon className="size-6" /></span><h3 className="mt-6 text-xl font-semibold">{feature.title}</h3><p className="mt-3 text-muted-foreground">{feature.body}</p><p className="mt-6 border-t pt-4 text-xs font-medium text-primary">{feature.detail}</p></CardContent></Card>)}</div></div></section>

        <section className="scroll-mt-24 border-y bg-card py-20 sm:py-28" id="how"><div className="mx-auto max-w-7xl px-4 sm:px-6"><div className="grid gap-12 lg:grid-cols-[.8fr_1.2fr] lg:items-center"><div><p className="text-sm font-semibold text-primary">كيف يعمل</p><h2 className="mt-4 text-3xl font-semibold sm:text-4xl">من اتصال المتجر إلى فرصة تحسين موثّقة</h2><p className="mt-4 text-muted-foreground">لا تحتاج إلى تدريب نموذج يدويًا. بصيرة يقرأ الكتالوج والسياسات والسمات، ويطلب منك فقط مراجعة النواقص وقواعد العلامة.</p><Button asChild className="mt-7" variant="outline"><Link href="/setup/connect">شاهد مسار الإعداد<ArrowUpLeft /></Link></Button></div><ol className="grid gap-4 sm:grid-cols-2">{[
          { icon: Store, number: "01", title: "اربط متجرك", body: "OAuth آمن ومزامنة أساسية لا تنتظر الطلبات التاريخية." },
          { icon: PackageSearch, number: "02", title: "نفهم المنتجات والسياسات", body: "نموذج موحّد للأسعار والمخزون والسمات والمصادر." },
          { icon: MessageCircleMore, number: "03", title: "يساعد المستشار العملاء", body: "اختيار وفلترة وترتيب ثم شرح مؤسّس على حقائق." },
          { icon: Lightbulb, number: "04", title: "راجع الفرصة ووافق", body: "دليل ومسودة قبل/بعد وسجل موافقة قبل أي نشر." },
        ].map((step) => <li className="rounded-2xl border bg-background p-5" key={step.number}><div className="flex items-center justify-between"><span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><step.icon className="size-5" /></span><span className="metric-numbers text-xs font-semibold text-muted-foreground">{step.number}</span></div><h3 className="mt-5 font-semibold">{step.title}</h3><p className="mt-2 text-sm text-muted-foreground">{step.body}</p></li>)}</ol></div></div></section>

        <section className="py-20 sm:py-28"><div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[.8fr_1.2fr]"><div className="mx-auto w-full max-w-[420px]"><CustomerAdvisorWidget brandSettings={demoAdvisorBrandSettings} compact /></div><div><Badge variant="secondary">واجهة العميل</Badge><h2 className="mt-5 text-3xl font-semibold sm:text-4xl">منتج مناسب خلال سؤال أو سؤالين — لا استجواب طويل</h2><p className="mt-5 text-lg text-muted-foreground">تبدأ الواجهة بأسئلة خاصة بفئة المتجر، وتعرض خيارًا أساسيًا وبدائل محدودة. كل بطاقة تُعبّأ من الكتالوج بعد الاختيار، لا من نص النموذج.</p><div className="mt-8 grid gap-4 sm:grid-cols-2">{[
          [ShoppingBag, "بطاقات منتج جميلة", "صورة وسعر ومخزون وسبب ترشيح موثّق"],
          [Gauge, "قواعد ملاءمة صلبة", "الفئة والميزانية والمتغير والتوفر أولًا"],
          [ShieldCheck, "سلامة حسب الفئة", "الحمل والحساسية والطب لها مسار محافظ"],
          [MessageCircleMore, "تحويل للبشر", "ملخص وسبب ومنتجات مع موافقة على التواصل"],
        ].map(([Icon, title, body]) => { const FeatureIcon = Icon as typeof Bot; return <div className="flex gap-3" key={title as string}><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted"><FeatureIcon className="size-5 text-primary" /></span><div><p className="font-semibold">{title as string}</p><p className="mt-1 text-sm text-muted-foreground">{body as string}</p></div></div>; })}</div></div></div></section>

        <section className="scroll-mt-24 border-y bg-foreground py-20 text-background sm:py-28" id="visibility"><div className="mx-auto max-w-7xl px-4 sm:px-6"><div className="grid gap-12 lg:grid-cols-2 lg:items-center"><div><Badge className="bg-background/10 text-background hover:bg-background/10">قياس صادق</Badge><h2 className="mt-5 text-3xl font-semibold sm:text-4xl">الجاهزية للظهور ليست هي الظهور الفعلي.</h2><p className="mt-5 text-lg text-background/70">نقيّم وضوح صفحات متجرك وبنيتها أولًا، ثم نرصد—حيث تسمح المنصات—متى يظهر اسم متجرك وما المصادر المذكورة. لا وعود بالترتيب، ولا نتائج مصطنعة.</p><div className="mt-8 space-y-3">{["الجاهزية التقنية والمحتوى والكيان", "الظهور الفعلي بتاريخ وطريقة تحقق", "الاستشهادات والمنافسون منفصلون", "غير متاح لا يعني لم يظهر"].map((item) => <p className="flex items-center gap-3" key={item}><CheckCircle2 className="size-5 text-emerald-400" />{item}</p>)}</div></div><div className="rounded-[28px] border border-background/15 bg-background/5 p-5 sm:p-7"><div className="grid gap-4 sm:grid-cols-2"><div className="rounded-2xl bg-background p-5 text-foreground"><p className="text-sm text-muted-foreground">جاهزية المتجر</p><p className="metric-numbers mt-2 text-4xl font-semibold text-primary">76/100</p><p className="mt-4 text-xs text-muted-foreground">فحص حتمي موثق · لا يقيس ظهور الاسم</p></div><div className="rounded-2xl bg-background p-5 text-foreground"><p className="text-sm text-muted-foreground">الظهور الفعلي · تجريبي</p><p className="metric-numbers mt-2 text-4xl font-semibold">8/25</p><p className="mt-4 text-xs text-muted-foreground">طريقة التحقق: يدوي مسجّل</p></div></div><div className="mt-4 rounded-2xl bg-background p-5 text-foreground"><div className="flex items-start gap-3"><Globe2 className="size-5 text-primary" /><div><p className="font-semibold">استعلام بلا نتيجة آلية</p><p className="mt-1 text-sm text-muted-foreground">يبقى «لم يتم التحقق» بدل تحويله إلى نتيجة سلبية مصطنعة.</p></div></div></div></div></div></div></section>

        <section className="py-20 sm:py-28"><div className="mx-auto max-w-7xl px-4 sm:px-6"><div className="grid gap-12 lg:grid-cols-[.8fr_1.2fr] lg:items-center"><div><p className="text-sm font-semibold text-primary">من السؤال إلى الإجراء</p><h2 className="mt-4 text-3xl font-semibold sm:text-4xl">184 سؤالًا عن الثبات أو الحساسية يمكن أن يصبح محتوىً أفضل</h2><p className="mt-4 text-muted-foreground">بصيرة يربط طلب العملاء بصفحة أو منتج، ثم يقترح تغييرًا محددًا مع الدليل والثقة والنص قبل/بعد.</p></div><div className="grid gap-4 sm:grid-cols-3">{[{ icon: MessageCircleMore, title: "طلب متكرر", value: "126", detail: "سؤالًا عن البشرة الحساسة" }, { icon: FileCheck2, title: "فجوة صفحة", value: "2", detail: "منتجان بلا مصدر كامل" }, { icon: TrendingUp, title: "إجراء", value: "1", detail: "دليل ومسودة للمراجعة" }].map((item) => <Card key={item.title}><CardContent className="p-6"><item.icon className="size-5 text-primary" /><p className="mt-5 text-sm text-muted-foreground">{item.title}</p><p className="metric-numbers mt-1 text-3xl font-semibold">{item.value}</p><p className="mt-2 text-xs text-muted-foreground">{item.detail}</p></CardContent></Card>)}</div></div></div></section>

        <section className="border-y bg-card py-20 sm:py-28"><div className="mx-auto max-w-7xl px-4 sm:px-6"><div className="mx-auto max-w-3xl text-center"><p className="text-sm font-semibold text-primary">الثقة قبل الأتمتة</p><h2 className="mt-4 text-3xl font-semibold sm:text-4xl">مصمم ليقول «لا أعرف» عندما تنقص الحقيقة</h2></div><div className="mt-12 grid gap-5 md:grid-cols-3">{[
          { icon: LockKeyhole, title: "اتصال وتخزين آمنان", body: "OAuth state أحادي الاستخدام، رموز مشفرة، عزل متجر، وسجل تدقيق." },
          { icon: ShieldCheck, title: "سياسات سلامة قبل وبعد الجواب", body: "تصنيف حساس، تقييد الأدوات، تحقق من الناتج، وإحالة محافظة عند الحاجة." },
          { icon: FileCheck2, title: "موافقة قبل أي تغيير", body: "المسودة لا تصبح تحديثًا. الموافقة على checksum مستقل ثم النشر من عامل منفصل." },
        ].map((item) => <div className="rounded-2xl border bg-background p-6" key={item.title}><item.icon className="size-6 text-primary" /><h3 className="mt-5 text-lg font-semibold">{item.title}</h3><p className="mt-2 text-sm text-muted-foreground">{item.body}</p></div>)}</div></div></section>

        <section className="scroll-mt-24 py-20 sm:py-28" id="pricing"><div className="mx-auto max-w-7xl px-4 sm:px-6"><div className="mx-auto max-w-2xl text-center"><p className="text-sm font-semibold text-primary">تسعير قابل للتكوين</p><h2 className="mt-4 text-3xl font-semibold sm:text-4xl">ابدأ بالمستشار، وتوسع عندما تظهر القيمة</h2><p className="mt-4 text-muted-foreground">الأسعار النهائية وحدود الاستخدام تُضبط من لوحة الخطط؛ لا تُبنى كشرط ثابت داخل الواجهة.</p></div><div className="mt-12 grid gap-5 lg:grid-cols-4">{[
          { name: "Starter", ar: "البداية", price: "يُحدد", featured: false, features: ["مستشار العملاء", "تحليلات أساسية", "تدقيق جاهزية أساسي"] },
          { name: "Growth", ar: "النمو", price: "يُحدد", featured: true, features: ["اسأل بيانات متجرك", "ذكاء العملاء", "إسناد التحويل", "مسودات المحتوى"] },
          { name: "Pro", ar: "الاحتراف", price: "يُحدد", featured: false, features: ["منافسو الظهور", "تحليلات متقدمة", "إجراءات مضبوطة", "عدة مستخدمين"] },
          { name: "Enterprise", ar: "المؤسسات", price: "مخصص", featured: false, features: ["عدة متاجر", "حوكمة متقدمة", "SLA", "خصائص الوكالات"] },
        ].map((plan) => <Card className={plan.featured ? "relative border-primary shadow-lg shadow-primary/10" : undefined} key={plan.name}>{plan.featured && <Badge className="absolute -top-3 start-5">الأنسب للنمو</Badge>}<CardContent className="p-6"><p className="text-sm text-muted-foreground">{plan.name}</p><h3 className="mt-1 text-xl font-semibold">{plan.ar}</h3><p className="metric-numbers mt-6 text-3xl font-semibold">{plan.price}</p><Button asChild className="mt-6 w-full" variant={plan.featured ? "default" : "outline"}><Link href="/signin">ابدأ بالعرض</Link></Button><ul className="mt-6 space-y-3">{plan.features.map((feature) => <li className="flex gap-2 text-sm" key={feature}><Check className="mt-0.5 size-4 text-success" />{feature}</li>)}</ul></CardContent></Card>)}</div></div></section>

        <section className="scroll-mt-24 border-y bg-card py-20 sm:py-28" id="faq"><div className="mx-auto max-w-4xl px-4 sm:px-6"><div className="text-center"><p className="text-sm font-semibold text-primary">الأسئلة الشائعة</p><h2 className="mt-4 text-3xl font-semibold sm:text-4xl">إجابات واضحة قبل أن تبدأ</h2></div><div className="mt-10 divide-y rounded-2xl border bg-background px-5 sm:px-7">{[
          ["هل بصيرة يختلق توصيات؟", "لا. اختيار المرشحين يبدأ من فلاتر قاعدة البيانات: المنتج نشط، متوفر، مناسب للفئة والميزانية والمتغير وقواعد السلامة. النموذج يشرح الخيارات المحددة فقط."],
          ["هل تربطون المتجر بكلمة المرور؟", "لا. الربط عبر OAuth الرسمي. لا نطلب اسم مستخدم أو كلمة مرور منصة التجارة."],
          ["هل تضمنون الظهور في ChatGPT أو Google؟", "لا. نفصل جاهزية الصفحات عن الظهور الفعلي، ونوثّق طريقة كل فحص وثقته وحدوده."],
          ["هل تنشرون التغييرات تلقائيًا؟", "لا افتراضيًا. المسودات تحتاج مراجعة وموافقة. السعر والسياسات والادعاءات الطبية لا تُنشر تلقائيًا."],
          ["هل سلة وزد متاحان إنتاجيًا؟", "مسارا العرض متاحان لكليهما. التفعيل الحي لكل منصة مستقل، ويتطلب اعتماد التطبيق وبيانات متجر تطوير واختبارات OAuth وwebhooks والمزامنة الخاصة بها."],
        ].map(([question, answer]) => <details className="group py-5" key={question}><summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-5 font-semibold"><span>{question}</span><ChevronDown className="size-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" /></summary><p className="max-w-3xl pb-2 pt-3 text-sm text-muted-foreground">{answer}</p></details>)}</div></div></section>

        <section className="py-20 sm:py-28"><div className="mx-auto max-w-5xl px-4 sm:px-6"><div className="relative overflow-hidden rounded-[32px] bg-primary px-6 py-12 text-center text-primary-foreground sm:px-12 sm:py-16"><div aria-hidden="true" className="subtle-grid absolute inset-0 opacity-10" /><div className="relative"><Sparkles className="mx-auto size-8" /><h2 className="mt-5 text-3xl font-semibold sm:text-4xl">ابدأ من سؤال عميل حقيقي</h2><p className="mx-auto mt-4 max-w-2xl text-primary-foreground/75">اربط بيئة العرض، اختبر الاختيار والقيود والسلامة، ثم شاهد المحادثة والأثر والفرصة في لوحة التاجر.</p><div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row"><Button asChild className="h-12 bg-background text-foreground hover:bg-background/90"><Link href="/signin">ابدأ بربط متجرك<ArrowLeft /></Link></Button><Button asChild className="h-12 border-primary-foreground/25 bg-transparent text-primary-foreground hover:bg-primary-foreground/10" variant="outline"><Link href="/dashboard">شاهد لوحة العرض<ArrowUpLeft /></Link></Button></div></div></div></div></section>
      </main>

      <footer className="border-t bg-card"><div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between"><BrandMark className="text-primary" /><p className="text-sm text-muted-foreground">منتج تجريبي تأسيسي · لا يدّعي امتثالًا قانونيًا أو تكاملًا إنتاجيًا قبل المراجعة والاعتماد.</p><div className="flex gap-5 text-sm text-muted-foreground"><Link href="/dashboard/settings">الخصوصية</Link><Link href="/dashboard/settings">الأمان</Link><Link href="/signin">الدخول</Link></div></div></footer>
    </div>
  );
}
