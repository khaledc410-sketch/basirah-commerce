"use client";

import {
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  Check,
  CheckCircle2,
  CircleAlert,
  Eye,
  Loader2,
  MessageCircle,
  PackageCheck,
  Palette,
  ShieldCheck,
  Sparkles,
  Target,
  Upload,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Activity, useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

const goals = [
  ["increase_conversion", "زيادة التحويل", "اجعل فرص التحويل أول ما تراه في الرئيسية."],
  ["help_choose", "مساعدة العملاء على الاختيار", "ركّز الأسئلة المقترحة على اكتشاف المنتج المناسب."],
  ["reduce_questions", "تقليل الأسئلة المتكررة", "أظهر فجوات السياسات والأسئلة الشائعة مبكرًا."],
  ["customer_intelligence", "فهم احتياجات العملاء", "قدّم الاحتياجات والاعتراضات في موجزك اليومي."],
  ["ai_visibility", "تحسين الجاهزية للظهور", "رتّب فرص المحتوى والبنية حسب قابلية الإجابة."],
] as const;

const categories = [
  ["beauty", "العناية والجمال"],
  ["perfume", "العطور"],
  ["fashion", "الأزياء"],
  ["electronics", "الإلكترونيات"],
  ["home", "المنزل"],
  ["food", "الأغذية"],
  ["supplements", "المكملات"],
  ["general", "متجر عام"],
] as const;

const voices = ["سعودية بسيطة", "عربية حديثة", "رسمية", "فاخرة", "مختصرة", "عربية وإنجليزية"] as const;

const knowledgeSources = [
  { label: "3 منتجات و6 متغيرات", status: "ready", detail: "الأسعار والمخزون والصور والسمات الأساسية" },
  { label: "سياسة الشحن", status: "ready", detail: "آخر مزامنة: اليوم 11:48" },
  { label: "سياسة الاسترجاع", status: "ready", detail: "14 يومًا حسب صفحة المتجر" },
  { label: "أوراق المكونات", status: "warning", detail: "ورقة واحدة مفقودة للمرطب" },
  { label: "طريقة الاستخدام", status: "warning", detail: "سؤال متكرر لا تجيب عنه صفحة السيروم" },
] as const;

const testQuestions = [
  "بشرتي دهنية وميزانيتي 150 ريال، وش يناسبني؟",
  "أبي منتج تحت 100 ريال وغير متوفر حاليًا؟",
  "قارن بين الغسول والمرطب للبشرة الحساسة",
  "كم مدة الاسترجاع؟",
  "هل المرطب مناسب للحامل؟",
] as const;

interface OnboardingState {
  goal: string;
  category: string;
  voice: string;
  brandInstructions: string;
  multipleProducts: boolean;
  mentionDiscounts: boolean;
  enableBundles: boolean;
  directAddToCart: boolean;
  humanHandoff: boolean;
  maxQuestions: number;
  widgetLabel: string;
  welcomeMessage: string;
  passedTests: number[];
}

const initialState: OnboardingState = {
  goal: "increase_conversion",
  category: "beauty",
  voice: "سعودية بسيطة",
  brandInstructions: "استخدم لهجة سعودية بسيطة. لا تعطِ وعودًا علاجية. اذكر مصدر المعلومة عند الحاجة.",
  multipleProducts: true,
  mentionDiscounts: true,
  enableBundles: false,
  directAddToCart: true,
  humanHandoff: true,
  maxQuestions: 3,
  widgetLabel: "ساعدني أختار",
  welcomeMessage: "أهلًا بك في مَدى للعناية! يسعدنا خدمتك، كيف أقدر أساعدك اليوم؟",
  passedTests: [],
};

export function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [state, setState] = useState<OnboardingState>(initialState);
  const [runningTest, setRunningTest] = useState<number | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem("basirah-onboarding");
    if (saved) {
      try {
        const restored = { ...initialState, ...(JSON.parse(saved) as Partial<OnboardingState>) };
        const timeout = window.setTimeout(() => setState(restored), 0);
        return () => window.clearTimeout(timeout);
      } catch {
        window.localStorage.removeItem("basirah-onboarding");
      }
    }
    return undefined;
  }, []);

  useEffect(() => {
    window.localStorage.setItem("basirah-onboarding", JSON.stringify(state));
  }, [state]);

  function update<K extends keyof OnboardingState>(key: K, value: OnboardingState[K]) {
    setState((current) => ({ ...current, [key]: value }));
  }

  function next() {
    setStep((current) => Math.min(6, current + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function previous() {
    setStep((current) => Math.max(1, current - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function runTest(index: number) {
    setRunningTest(index);
    await new Promise((resolve) => window.setTimeout(resolve, 600));
    update("passedTests", Array.from(new Set([...state.passedTests, index])));
    setRunningTest(null);
    toast.success("نجح الاختبار", { description: "تم التحقق من الاسترجاع، الفلاتر، أو مسار السلامة حسب السؤال." });
  }

  function finish() {
    window.localStorage.setItem("basirah-onboarding-complete", "true");
    router.push("/dashboard");
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-7 grid gap-5 lg:grid-cols-[1fr_260px]">
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-3"><Badge>الخطوة {step} من 6</Badge><span className="text-sm text-muted-foreground">محفوظ تلقائيًا على هذا الجهاز</span></div>
          <Progress aria-label={`تقدم التهيئة: الخطوة ${step} من 6`} value={(step / 6) * 100} />
        </div>
        <div className="rounded-xl border bg-card px-4 py-3 text-sm"><p className="font-medium">المزامنة الأساسية مكتملة</p><p className="text-muted-foreground">آخر تحديث قبل دقائق</p></div>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <Activity mode={step === 1 ? "visible" : "hidden"}>
            <section className="p-5 sm:p-8">
              <div className="mb-7 max-w-2xl"><span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Target /></span><h1 className="mt-5 text-3xl font-semibold">ما الهدف الأهم الآن؟</h1><p className="mt-2 text-muted-foreground">اختر هدفًا أساسيًا واحدًا. سيغيّر ترتيب موجزك والفرص المقترحة، ويمكن تعديله لاحقًا.</p></div>
              <div className="grid gap-3 sm:grid-cols-2">
                {goals.map(([value, label, description]) => (
                  <button className={`min-h-28 rounded-xl border p-4 text-start transition-colors ${state.goal === value ? "border-primary bg-primary/5 ring-2 ring-primary/15" : "bg-card hover:bg-muted/50"}`} key={value} onClick={() => update("goal", value)} type="button">
                    <span className="flex items-center justify-between gap-3"><span className="font-semibold">{label}</span>{state.goal === value && <CheckCircle2 className="size-5 text-primary" />}</span><span className="mt-2 block text-sm text-muted-foreground">{description}</span>
                  </button>
                ))}
              </div>
            </section>
          </Activity>

          <Activity mode={step === 2 ? "visible" : "hidden"}>
            <section className="p-5 sm:p-8">
              <div className="mb-7 max-w-2xl"><span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><PackageCheck /></span><h1 className="mt-5 text-3xl font-semibold">ما فئة المتجر الأساسية؟</h1><p className="mt-2 text-muted-foreground">نستخدمها لاختيار أسئلة البداية وقواعد السلامة. المتاجر المختلطة يمكنها إضافة فئات ثانوية لاحقًا.</p></div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {categories.map(([value, label]) => <button className={`min-h-24 rounded-xl border p-4 text-center font-medium ${state.category === value ? "border-primary bg-primary/5 text-primary ring-2 ring-primary/15" : "hover:bg-muted/50"}`} key={value} onClick={() => update("category", value)} type="button">{label}</button>)}
              </div>
              {state.category === "beauty" && <div className="mt-6 flex items-start gap-3 rounded-xl border border-warning/30 bg-warning-soft p-4 text-sm"><ShieldCheck className="mt-0.5 size-5 shrink-0 text-warning" /><p><span className="font-semibold">سياسة أمان العناية والجمال:</span> لا تشخيص أو وعود علاجية، وأسئلة الحمل والحساسية تحتاج معلومات موثقة أو إحالة محافظة.</p></div>}
            </section>
          </Activity>

          <Activity mode={step === 3 ? "visible" : "hidden"}>
            <section className="p-5 sm:p-8">
              <div className="mb-7 max-w-2xl"><span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Palette /></span><h1 className="mt-5 text-3xl font-semibold">كيف يتحدث المستشار؟</h1><p className="mt-2 text-muted-foreground">الصوت لا يغيّر الحقائق. يغيّر فقط الصياغة بعد اختيار المنتجات الموثقة.</p></div>
              <div className="flex flex-wrap gap-2">{voices.map((voice) => <Button key={voice} onClick={() => update("voice", voice)} type="button" variant={state.voice === voice ? "default" : "outline"}>{voice}</Button>)}</div>
              <div className="mt-6 grid gap-5 lg:grid-cols-2"><div className="space-y-2"><Label htmlFor="brandInstructions">تعليمات العلامة</Label><Textarea className="min-h-44" id="brandInstructions" onChange={(event) => update("brandInstructions", event.target.value)} value={state.brandInstructions} /><p className="text-xs text-muted-foreground">لا تضع هنا حقائق المنتج؛ الحقائق تأتي من الكتالوج والمستندات.</p></div><div className="rounded-2xl border bg-muted/40 p-5"><p className="text-xs font-semibold text-primary">معاينة حية</p><div className="mt-4 rounded-xl bg-card p-4 text-sm shadow-sm"><p>أرشّح لك <strong>سيروم التوازن</strong>؛ فهو مناسب للبشرة الدهنية وضمن الميزانية التي حددتها. ستجد السعر والتوفر المحدّثين في بطاقة المنتج.</p></div><p className="mt-4 text-xs text-muted-foreground">الصوت: {state.voice}</p></div></div>
            </section>
          </Activity>

          <Activity mode={step === 4 ? "visible" : "hidden"}>
            <section className="p-5 sm:p-8">
              <div className="mb-7 max-w-2xl"><span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Sparkles /></span><h1 className="mt-5 text-3xl font-semibold">قواعد الترشيح</h1><p className="mt-2 text-muted-foreground">ملاءمة العميل والسلامة والتوفر ضمانات ثابتة؛ إعداداتك تتحكم فقط في العرض بعد تطبيقها.</p></div>
              <div className="grid gap-5 lg:grid-cols-2">
                <div className="space-y-4"><p className="font-semibold">ضمانات لا يمكن تعطيلها</p>{["لا ترشيح لمنتج غير متاح", "الملاءمة والسلامة أعلى من أولوية التاجر", "لا اختراع لسعر أو مخزون أو مكوّن"].map((rule) => <div className="flex items-center gap-3 rounded-xl bg-success-soft p-4 text-sm" key={rule}><Check className="size-5 text-success" />{rule}</div>)}</div>
                <div className="divide-y rounded-xl border px-5">{[
                  ["عرض أكثر من خيار", "multipleProducts"], ["ذكر الخصم عند وجوده", "mentionDiscounts"], ["اقتراح باقات مناسبة", "enableBundles"], ["إضافة مباشرة للسلة", "directAddToCart"], ["إتاحة التحويل للبشر", "humanHandoff"],
                ].map(([label, key]) => <div className="flex min-h-16 items-center justify-between gap-4" key={key}><Label htmlFor={key}>{label}</Label><Switch checked={Boolean(state[key as keyof OnboardingState])} id={key} onCheckedChange={(checked) => update(key as keyof OnboardingState, checked as never)} /></div>)}<div className="py-4"><Label htmlFor="maxQuestions">أقصى عدد لأسئلة المتابعة</Label><Input className="mt-2 h-11" id="maxQuestions" max={5} min={1} onChange={(event) => update("maxQuestions", Number(event.target.value))} type="number" value={state.maxQuestions} /></div></div>
              </div>
            </section>
          </Activity>

          <Activity mode={step === 5 ? "visible" : "hidden"}>
            <section className="p-5 sm:p-8">
              <div className="mb-7 max-w-2xl"><span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><BookOpenCheck /></span><h1 className="mt-5 text-3xl font-semibold">راجع معرفة المتجر</h1><p className="mt-2 text-muted-foreground">النقص يعطّل الإجابة المتعلقة به فقط؛ لا يوقف اكتشاف المنتجات كله.</p></div>
              <div className="divide-y rounded-xl border">{knowledgeSources.map((source) => <div className="flex flex-wrap items-center gap-4 p-4 sm:p-5" key={source.label}><span className={`flex size-10 items-center justify-center rounded-full ${source.status === "ready" ? "bg-success-soft text-success" : "bg-warning-soft text-warning"}`}>{source.status === "ready" ? <Check className="size-5" /> : <CircleAlert className="size-5" />}</span><div className="min-w-0 flex-1"><p className="font-medium">{source.label}</p><p className="text-sm text-muted-foreground">{source.detail}</p></div><Badge variant={source.status === "ready" ? "secondary" : "outline"}>{source.status === "ready" ? "جاهز" : "يحتاج مراجعة"}</Badge></div>)}</div>
              <button className="mt-5 flex min-h-24 w-full items-center justify-center gap-3 rounded-xl border border-dashed text-sm font-medium text-muted-foreground hover:border-primary hover:text-primary" onClick={() => toast.info("رفع المستندات جاهز في المعمارية", { description: "في الإنتاج يستخدم رابطًا موقّعًا وفحص نوع وملف ضار قبل المعالجة." })} type="button"><Upload className="size-5" />رفع دليل منتج أو FAQ أو ورقة مكونات</button>
            </section>
          </Activity>

          <Activity mode={step === 6 ? "visible" : "hidden"}>
            <section className="p-5 sm:p-8">
              <div className="mb-7 max-w-2xl"><span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><MessageCircle /></span><h1 className="mt-5 text-3xl font-semibold">هيّئ المستشار واختبره</h1><p className="mt-2 text-muted-foreground">اختبر خمس حالات قبل النشر: اكتشاف، قيود، مقارنة، سياسة، وسلامة.</p></div>
              <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
                <div className="space-y-5"><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="widgetLabel">نص الزر</Label><Input id="widgetLabel" onChange={(event) => update("widgetLabel", event.target.value)} value={state.widgetLabel} /></div><div className="space-y-2"><Label htmlFor="welcome">رسالة الترحيب</Label><Input id="welcome" onChange={(event) => update("welcomeMessage", event.target.value)} value={state.welcomeMessage} /></div></div><div className="space-y-3">{testQuestions.map((question, index) => { const passed = state.passedTests.includes(index); return <div className="flex flex-wrap items-center gap-3 rounded-xl border p-4" key={question}><span className={`flex size-8 items-center justify-center rounded-full ${passed ? "bg-success-soft text-success" : "bg-muted text-muted-foreground"}`}>{passed ? <Check className="size-4" /> : index + 1}</span><p className="min-w-0 flex-1 text-sm">{question}</p><Button disabled={passed || runningTest !== null} onClick={() => runTest(index)} size="sm" type="button" variant={passed ? "secondary" : "outline"}>{runningTest === index ? <Loader2 className="animate-spin" /> : passed ? "نجح" : "اختبر"}</Button></div>; })}</div></div>
                <div className="rounded-[28px] border-8 border-foreground/90 bg-card p-3 shadow-xl"><div className="min-h-[470px] rounded-[18px] bg-muted/40 p-4"><div className="flex items-center justify-between"><div className="flex items-center gap-2"><span className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground"><Eye className="size-4" /></span><div><p className="text-sm font-semibold">مستشار مَدى</p><p className="text-[10px] text-muted-foreground">مساعد ذكي</p></div></div><span className="size-2 rounded-full bg-success" /></div><div className="mt-12 rounded-xl bg-card p-4 text-sm shadow-sm"><p>{state.welcomeMessage}</p></div><div className="mt-4 flex flex-wrap gap-2">{["ساعدني أختار", "قارن منتجين", "الشحن والاسترجاع"].map((prompt) => <span className="rounded-full border bg-card px-3 py-2 text-xs" key={prompt}>{prompt}</span>)}</div></div></div>
              </div>
              <div className="mt-6 rounded-xl bg-muted p-4 text-sm"><Checkbox checked={state.passedTests.length === 5} disabled id="publishReady" /><Label className="ms-3" htmlFor="publishReady">اكتملت الاختبارات الخمسة ({state.passedTests.length}/5). النشر الإنتاجي يبقى منفصلًا عن وضع العرض.</Label></div>
            </section>
          </Activity>

          <footer className="flex flex-wrap items-center justify-between gap-3 border-t bg-muted/30 px-5 py-4 sm:px-8">
            <Button disabled={step === 1} onClick={previous} type="button" variant="ghost"><ArrowRight />السابق</Button>
            {step < 6 ? <Button onClick={next} type="button"><ArrowLeft />متابعة</Button> : <Button disabled={state.passedTests.length < 5} onClick={finish} type="button"><Check />فتح لوحة التحكم</Button>}
          </footer>
        </CardContent>
      </Card>
    </div>
  );
}
