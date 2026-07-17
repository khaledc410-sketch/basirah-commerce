"use client";

import Image from "next/image";
import {
  Bot,
  CheckCircle2,
  ImagePlus,
  MessageCircleMore,
  Palette,
  Plus,
  RotateCcw,
  Save,
  ShieldCheck,
  Sparkles,
  Trash2,
  WandSparkles,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  ADVISOR_BRAND_STORAGE_KEY,
  demoAdvisorBrandSettings,
  isHexColor,
  parseStoredBrandSettings,
  type AdvisorBrandSettings,
  type AdvisorCornerStyle,
  type AdvisorLauncherPosition,
} from "@/components/widget/brand-settings";
import { WidgetPreview } from "@/components/widget/widget-preview";
import { cn } from "@/lib/utils";

interface AiProposal {
  id: string;
  label: string;
  welcomeMessage: string;
  suggestedPrompts: string[];
}

type ValidationErrors = Record<string, string>;

const acceptedLogoTypes = ["image/png", "image/jpeg", "image/webp"];
const maximumLogoSize = 500 * 1024;

const cornerOptions: Array<{ value: AdvisorCornerStyle; label: string; description: string }> = [
  { value: "soft", label: "هادئة", description: "12 بكسل" },
  { value: "rounded", label: "متوازنة", description: "24 بكسل" },
  { value: "extra-rounded", label: "دائرية", description: "32 بكسل" },
];

const launcherOptions: Array<{ value: AdvisorLauncherPosition; label: string }> = [
  { value: "right", label: "يمين الشاشة" },
  { value: "left", label: "يسار الشاشة" },
];

function createAiProposals(storeName: string): AiProposal[] {
  const safeStoreName = storeName.trim() || "متجرك";
  const comparisonPrompts = [
    "رشّح لي حسب احتياجي وميزانيتي",
    "قارن لي بين الخيارات المتاحة",
    "ما المنتجات المتوفرة الآن؟",
    "ما سياسة الشحن والاسترجاع؟",
  ];

  return [
    {
      id: "guided",
      label: "مباشرة وواضحة",
      welcomeMessage: `أهلًا بك في ${safeStoreName}! يسعدنا وجودك، كيف أقدر أساعدك اليوم؟`,
      suggestedPrompts: comparisonPrompts,
    },
    {
      id: "comparison",
      label: "تركّز على المقارنة",
      welcomeMessage: `مرحبًا بك في ${safeStoreName}! يسعدني مساعدتك في المقارنة بين المنتجات واختيار الأنسب لك.`,
      suggestedPrompts: [
        "ساعدني أختار المنتج الأنسب",
        "قارن بين منتجين متاحين",
        "أحتاج خيارًا ضمن ميزانيتي",
        "أريد معرفة الشحن والاسترجاع",
      ],
    },
    {
      id: "support",
      label: "خدمة ودودة",
      welcomeMessage: `أهلًا وسهلًا! أنا مساعد ${safeStoreName}، هنا لخدمتك في أي سؤال عن منتجاتنا أو الشحن والاسترجاع.`,
      suggestedPrompts: [
        "ماذا يناسب احتياجي؟",
        "ما المتوفر ضمن ميزانيتي؟",
        "ما الفرق بين هذه المنتجات؟",
        "كيف يعمل الشحن والاسترجاع؟",
      ],
    },
  ];
}

function validateSettings(settings: AdvisorBrandSettings): ValidationErrors {
  const errors: ValidationErrors = {};
  const storeLength = settings.storeName.trim().length;
  const advisorLength = settings.advisorName.trim().length;
  const welcomeLength = settings.welcomeMessage.trim().length;

  if (storeLength < 2 || storeLength > 40) errors.storeName = "اكتب اسمًا بين حرفين و40 حرفًا.";
  if (advisorLength < 2 || advisorLength > 40) errors.advisorName = "اكتب اسمًا بين حرفين و40 حرفًا.";
  if (welcomeLength < 15 || welcomeLength > 200) errors.welcomeMessage = "اكتب رسالة بين 15 و200 حرف.";
  if (!isHexColor(settings.primaryColor)) errors.primaryColor = "استخدم رمز لون كامل مثل #4338CA.";
  if (!isHexColor(settings.accentColor)) errors.accentColor = "استخدم رمز لون كامل مثل #0F9F8F.";
  if (settings.suggestedPrompts.length < 2 || settings.suggestedPrompts.length > 4) {
    errors.suggestedPrompts = "اختر من اقتراحين إلى أربعة اقتراحات.";
  }

  settings.suggestedPrompts.forEach((prompt, index) => {
    const length = prompt.trim().length;
    if (length < 4 || length > 60) errors[`prompt-${index}`] = "اكتب اقتراحًا بين 4 و60 حرفًا.";
  });

  const uniquePrompts = new Set(settings.suggestedPrompts.map((prompt) => prompt.trim()));
  if (uniquePrompts.size !== settings.suggestedPrompts.length) {
    errors.suggestedPrompts = "اجعل كل اقتراح مختلفًا عن الآخر.";
  }

  return errors;
}

export function BrandStudio() {
  const [settings, setSettings] = useState<AdvisorBrandSettings>(demoAdvisorBrandSettings);
  const [savedSettings, setSavedSettings] = useState<AdvisorBrandSettings>(demoAdvisorBrandSettings);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [logoError, setLogoError] = useState("");
  const [aiProposals, setAiProposals] = useState<AiProposal[]>([]);
  const [saveAnnouncement, setSaveAnnouncement] = useState("");
  const dirty = JSON.stringify(settings) !== JSON.stringify(savedSettings);

  useEffect(() => {
    const stored = window.localStorage.getItem(ADVISOR_BRAND_STORAGE_KEY);
    if (!stored) return undefined;

    const restored = parseStoredBrandSettings(stored);
    if (!restored) {
      window.localStorage.removeItem(ADVISOR_BRAND_STORAGE_KEY);
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      setSettings(restored);
      setSavedSettings(restored);
    }, 0);
    return () => window.clearTimeout(timeout);
  }, []);

  function updateSetting<K extends keyof AdvisorBrandSettings>(key: K, value: AdvisorBrandSettings[K]) {
    setSettings((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  function updatePrompt(index: number, value: string) {
    setSettings((current) => ({
      ...current,
      suggestedPrompts: current.suggestedPrompts.map((prompt, promptIndex) =>
        promptIndex === index ? value : prompt,
      ),
    }));
    setErrors((current) => {
      const next = { ...current };
      delete next[`prompt-${index}`];
      delete next.suggestedPrompts;
      return next;
    });
  }

  function addPrompt() {
    if (settings.suggestedPrompts.length >= 4) return;
    updateSetting("suggestedPrompts", [...settings.suggestedPrompts, "اسأل عن المنتجات المتاحة"]);
  }

  function removePrompt(index: number) {
    if (settings.suggestedPrompts.length <= 2) return;
    updateSetting(
      "suggestedPrompts",
      settings.suggestedPrompts.filter((_, promptIndex) => promptIndex !== index),
    );
  }

  function handleLogoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!acceptedLogoTypes.includes(file.type)) {
      setLogoError("صيغة الشعار غير مدعومة. استخدم PNG أو JPG أو WebP.");
      return;
    }
    if (file.size > maximumLogoSize) {
      setLogoError("حجم الشعار أكبر من 500 كيلوبايت. اضغطه ثم أعد المحاولة.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        setLogoError("تعذرت قراءة الشعار. جرّب ملفًا آخر.");
        return;
      }
      updateSetting("logoDataUrl", reader.result);
      setLogoError("");
      toast.success("تمت إضافة الشعار للمعاينة", { description: "احفظ التغييرات للاحتفاظ به في هذا المتصفح." });
    };
    reader.onerror = () => setLogoError("تعذرت قراءة الشعار. جرّب ملفًا آخر.");
    reader.readAsDataURL(file);
  }

  function generateAiOptions() {
    setAiProposals(createAiProposals(settings.storeName));
    setSaveAnnouncement("جهّز مساعد AI ثلاثة اقتراحات قابلة للتحرير. لم يتم تطبيق أي اقتراح بعد.");
  }

  function updateAiProposal(id: string, welcomeMessage: string) {
    setAiProposals((current) =>
      current.map((proposal) => (proposal.id === id ? { ...proposal, welcomeMessage } : proposal)),
    );
  }

  function applyAiProposal(proposal: AiProposal) {
    setSettings((current) => ({
      ...current,
      welcomeMessage: proposal.welcomeMessage,
      suggestedPrompts: proposal.suggestedPrompts,
    }));
    setErrors((current) => {
      const next = { ...current };
      delete next.welcomeMessage;
      delete next.suggestedPrompts;
      Object.keys(next).forEach((key) => {
        if (key.startsWith("prompt-")) delete next[key];
      });
      return next;
    });
    setSaveAnnouncement(`تم تطبيق اقتراح «${proposal.label}» في المعاينة فقط. راجعه ثم احفظه.`);
    toast.success("طُبّق الاقتراح في المعاينة", { description: "يمكنك تحريره قبل الحفظ." });
  }

  function save() {
    const normalized: AdvisorBrandSettings = {
      ...settings,
      storeName: settings.storeName.trim(),
      advisorName: settings.advisorName.trim(),
      welcomeMessage: settings.welcomeMessage.trim(),
      primaryColor: settings.primaryColor.toUpperCase(),
      accentColor: settings.accentColor.toUpperCase(),
      suggestedPrompts: settings.suggestedPrompts.map((prompt) => prompt.trim()),
    };
    const nextErrors = validateSettings(normalized);
    setErrors(nextErrors);
    const firstError = Object.keys(nextErrors)[0];

    if (firstError) {
      const fieldId = firstError === "suggestedPrompts" ? "prompt-0" : firstError;
      window.setTimeout(() => document.getElementById(fieldId)?.focus(), 0);
      toast.error("راجع الحقول المعلّمة", { description: "لم تُحفظ إعدادات غير مكتملة." });
      return;
    }

    try {
      window.localStorage.setItem(ADVISOR_BRAND_STORAGE_KEY, JSON.stringify(normalized));
      setSettings(normalized);
      setSavedSettings(normalized);
      setSaveAnnouncement("تم حفظ هوية المستشار التجريبية في هذا المتصفح.");
      toast.success("تم حفظ هوية المستشار", { description: "الحفظ محلي للعرض ولا ينشر إلى متجر حقيقي." });
    } catch {
      toast.error("تعذر الحفظ في المتصفح", { description: "أزل الشعار أو استخدم ملفًا أصغر ثم أعد المحاولة." });
    }
  }

  function reset() {
    window.localStorage.removeItem(ADVISOR_BRAND_STORAGE_KEY);
    setSettings(demoAdvisorBrandSettings);
    setSavedSettings(demoAdvisorBrandSettings);
    setErrors({});
    setLogoError("");
    setAiProposals([]);
    setSaveAnnouncement("تمت استعادة الإعدادات التجريبية الافتراضية.");
    toast.success("تمت استعادة الإعدادات الافتراضية");
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_430px]">
      <div className="min-w-0 space-y-6">
        <Card>
          <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">تخصيص تجريبي</Badge>
                <Badge className={cn(dirty && "border-warning text-warning")} variant="outline">
                  {dirty ? "تغييرات غير محفوظة" : "محفوظ محليًا"}
                </Badge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                تُحفظ الإعدادات في هذا المتصفح فقط، ولا تُنشر إلى متجر حقيقي.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button className="min-h-11" onClick={reset} type="button" variant="outline">
                <RotateCcw />استعادة الافتراضي
              </Button>
              <Button className="min-h-11" disabled={!dirty} onClick={save} type="button">
                <Save />حفظ التغييرات
              </Button>
            </div>
            <p aria-live="polite" className="sr-only" role="status">{saveAnnouncement}</p>
          </CardContent>
        </Card>

        <Tabs defaultValue="identity">
          <TabsList className="grid h-auto w-full grid-cols-2 sm:grid-cols-4">
            <TabsTrigger className="min-h-11" value="identity"><ImagePlus />الهوية</TabsTrigger>
            <TabsTrigger className="min-h-11" value="opening"><MessageCircleMore />البداية</TabsTrigger>
            <TabsTrigger className="min-h-11" value="appearance"><Palette />المظهر</TabsTrigger>
            <TabsTrigger className="min-h-11" value="safety"><ShieldCheck />الأمان</TabsTrigger>
          </TabsList>

          <TabsContent value="identity">
            <Card>
              <CardHeader>
                <CardTitle>هوية المستشار</CardTitle>
                <p className="text-sm text-muted-foreground">استخدم اسمًا وشعارًا يعرفهما عميلك فورًا.</p>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="storeName">اسم المتجر</Label>
                    <Input
                      aria-describedby={errors.storeName ? "storeName-error" : "storeName-help"}
                      aria-invalid={Boolean(errors.storeName)}
                      className="h-11"
                      id="storeName"
                      maxLength={40}
                      onChange={(event) => updateSetting("storeName", event.target.value)}
                      value={settings.storeName}
                    />
                    <p className="text-xs text-muted-foreground" id="storeName-help">يظهر أسفل اسم المستشار.</p>
                    {errors.storeName && <p className="text-xs text-destructive" id="storeName-error" role="alert">{errors.storeName}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="advisorName">اسم المستشار</Label>
                    <Input
                      aria-describedby={errors.advisorName ? "advisorName-error" : "advisorName-help"}
                      aria-invalid={Boolean(errors.advisorName)}
                      className="h-11"
                      id="advisorName"
                      maxLength={40}
                      onChange={(event) => updateSetting("advisorName", event.target.value)}
                      value={settings.advisorName}
                    />
                    <p className="text-xs text-muted-foreground" id="advisorName-help">مثال: مستشارة نورة.</p>
                    {errors.advisorName && <p className="text-xs text-destructive" id="advisorName-error" role="alert">{errors.advisorName}</p>}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="brand-logo">شعار المتجر</Label>
                  <div className="flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-center">
                    <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-muted">
                      {settings.logoDataUrl ? (
                        <Image
                          alt={`معاينة شعار ${settings.storeName}`}
                          className="size-full object-contain p-2"
                          height={80}
                          src={settings.logoDataUrl}
                          unoptimized
                          width={80}
                        />
                      ) : (
                        <Bot className="size-7 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <Input
                        accept="image/png,image/jpeg,image/webp"
                        aria-describedby="brand-logo-help brand-logo-error"
                        className="h-11 file:me-2"
                        id="brand-logo"
                        onChange={handleLogoUpload}
                        type="file"
                      />
                      <p className="mt-2 text-xs text-muted-foreground" id="brand-logo-help">
                        PNG أو JPG أو WebP، بحد أقصى 500 كيلوبايت. الأفضل شعار مربع بخلفية واضحة.
                      </p>
                      {logoError && <p className="mt-2 text-xs text-destructive" id="brand-logo-error" role="alert">{logoError}</p>}
                    </div>
                    {settings.logoDataUrl && (
                      <Button
                        aria-label="إزالة شعار المتجر"
                        className="min-h-11"
                        onClick={() => {
                          updateSetting("logoDataUrl", undefined);
                          setLogoError("");
                        }}
                        type="button"
                        variant="outline"
                      >
                        <Trash2 />إزالة
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="opening">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <CardTitle>أول رسالة يراها العميل</CardTitle>
                      <p className="mt-1 text-sm text-muted-foreground">وضّح ما يستطيع المستشار فعله دون عروض أو ادعاءات غير موثقة.</p>
                    </div>
                    <Button className="min-h-11" onClick={generateAiOptions} type="button" variant="outline">
                      <WandSparkles />مساعد AI
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Label htmlFor="welcomeMessage">رسالة الترحيب</Label>
                  <Textarea
                    aria-describedby={errors.welcomeMessage ? "welcomeMessage-error" : "welcomeMessage-help"}
                    aria-invalid={Boolean(errors.welcomeMessage)}
                    className="min-h-28 resize-y"
                    id="welcomeMessage"
                    maxLength={200}
                    onChange={(event) => updateSetting("welcomeMessage", event.target.value)}
                    value={settings.welcomeMessage}
                  />
                  <div className="flex items-start justify-between gap-3 text-xs text-muted-foreground" id="welcomeMessage-help">
                    <span>تظهر قبل أن يرسل العميل أي سؤال.</span>
                    <span className="metric-numbers">{settings.welcomeMessage.length}/200</span>
                  </div>
                  {errors.welcomeMessage && <p className="text-xs text-destructive" id="welcomeMessage-error" role="alert">{errors.welcomeMessage}</p>}
                </CardContent>
              </Card>

              {aiProposals.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Sparkles className="size-4 text-primary" />اقتراحات مساعد AI</CardTitle>
                    <p className="text-sm leading-6 text-muted-foreground">
                      مبنية محليًا على اسم المتجر، فئة العناية والجمال، والنوايا المتحققة: الاختيار والمقارنة والشحن والاسترجاع. عدّل أي رسالة ثم طبّقها؛ لن يتغير شيء تلقائيًا.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {aiProposals.map((proposal, index) => (
                      <div className="space-y-3 rounded-xl border p-4" key={proposal.id}>
                        <div className="flex items-center justify-between gap-3">
                          <Label htmlFor={`ai-proposal-${proposal.id}`}>الخيار {index + 1}: {proposal.label}</Label>
                          <Badge variant="secondary">قابل للتحرير</Badge>
                        </div>
                        <Textarea
                          className="min-h-24 resize-y"
                          id={`ai-proposal-${proposal.id}`}
                          maxLength={200}
                          onChange={(event) => updateAiProposal(proposal.id, event.target.value)}
                          value={proposal.welcomeMessage}
                        />
                        <div aria-label="الأسئلة المقترحة مع هذا الخيار" className="flex flex-wrap gap-2">
                          {proposal.suggestedPrompts.map((prompt) => <Badge key={prompt} variant="outline">{prompt}</Badge>)}
                        </div>
                        <Button className="min-h-11" onClick={() => applyAiProposal(proposal)} type="button" variant="outline">
                          <CheckCircle2 />استخدم هذا الاقتراح
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>الأسئلة المقترحة في البداية</CardTitle>
                  <p className="text-sm text-muted-foreground">اعرض من سؤالين إلى أربعة أسئلة تساعد العميل بدل ترك مربع فارغ.</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {settings.suggestedPrompts.map((prompt, index) => (
                    <div className="space-y-2" key={`prompt-${index}`}>
                      <Label htmlFor={`prompt-${index}`}>الاقتراح {index + 1}</Label>
                      <div className="flex items-start gap-2">
                        <Input
                          aria-invalid={Boolean(errors[`prompt-${index}`])}
                          className="h-11"
                          id={`prompt-${index}`}
                          maxLength={60}
                          onChange={(event) => updatePrompt(index, event.target.value)}
                          value={prompt}
                        />
                        <Button
                          aria-label={`حذف الاقتراح ${index + 1}`}
                          className="size-11 shrink-0"
                          disabled={settings.suggestedPrompts.length <= 2}
                          onClick={() => removePrompt(index)}
                          size="icon"
                          type="button"
                          variant="outline"
                        >
                          <Trash2 />
                        </Button>
                      </div>
                      {errors[`prompt-${index}`] && <p className="text-xs text-destructive" role="alert">{errors[`prompt-${index}`]}</p>}
                    </div>
                  ))}
                  {errors.suggestedPrompts && <p className="text-xs text-destructive" role="alert">{errors.suggestedPrompts}</p>}
                  <Button
                    className="min-h-11"
                    disabled={settings.suggestedPrompts.length >= 4}
                    onClick={addPrompt}
                    type="button"
                    variant="outline"
                  >
                    <Plus />إضافة اقتراح
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="appearance">
            <Card>
              <CardHeader>
                <CardTitle>ألوان وشكل المستشار</CardTitle>
                <p className="text-sm text-muted-foreground">يختار النظام لون نص مقروء تلقائيًا فوق ألوان هويتك.</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="primaryColor">اللون الأساسي</Label>
                    <div className="flex gap-2">
                      <Input
                        aria-label="اختيار اللون الأساسي"
                        className="size-11 shrink-0 cursor-pointer p-1"
                        onChange={(event) => updateSetting("primaryColor", event.target.value.toUpperCase())}
                        type="color"
                        value={isHexColor(settings.primaryColor) ? settings.primaryColor : "#4338CA"}
                      />
                      <Input
                        aria-invalid={Boolean(errors.primaryColor)}
                        className="metric-numbers h-11 text-left"
                        dir="ltr"
                        id="primaryColor"
                        maxLength={7}
                        onChange={(event) => updateSetting("primaryColor", event.target.value.toUpperCase())}
                        value={settings.primaryColor}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">للرأس، زر الإرسال ورسائل العميل.</p>
                    {errors.primaryColor && <p className="text-xs text-destructive" role="alert">{errors.primaryColor}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accentColor">اللون المساند</Label>
                    <div className="flex gap-2">
                      <Input
                        aria-label="اختيار اللون المساند"
                        className="size-11 shrink-0 cursor-pointer p-1"
                        onChange={(event) => updateSetting("accentColor", event.target.value.toUpperCase())}
                        type="color"
                        value={isHexColor(settings.accentColor) ? settings.accentColor : "#0F9F8F"}
                      />
                      <Input
                        aria-invalid={Boolean(errors.accentColor)}
                        className="metric-numbers h-11 text-left"
                        dir="ltr"
                        id="accentColor"
                        maxLength={7}
                        onChange={(event) => updateSetting("accentColor", event.target.value.toUpperCase())}
                        value={settings.accentColor}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">للترحيب والعناصر المميزة فقط.</p>
                    {errors.accentColor && <p className="text-xs text-destructive" role="alert">{errors.accentColor}</p>}
                  </div>
                </div>

                <fieldset className="space-y-3">
                  <legend className="text-sm font-medium">استدارة الزوايا</legend>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {cornerOptions.map((option) => (
                      <button
                        aria-checked={settings.cornerStyle === option.value}
                        className={cn(
                          "min-h-16 rounded-xl border p-3 text-start transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                          settings.cornerStyle === option.value && "border-primary bg-primary/5",
                        )}
                        key={option.value}
                        onClick={() => updateSetting("cornerStyle", option.value)}
                        role="radio"
                        type="button"
                      >
                        <span className="block text-sm font-medium">{option.label}</span>
                        <span className="mt-1 block text-xs text-muted-foreground">{option.description}</span>
                      </button>
                    ))}
                  </div>
                </fieldset>

                <fieldset className="space-y-3">
                  <legend className="text-sm font-medium">مكان زر فتح المستشار</legend>
                  <div className="grid grid-cols-2 gap-2">
                    {launcherOptions.map((option) => (
                      <button
                        aria-checked={settings.launcherPosition === option.value}
                        className={cn(
                          "min-h-12 rounded-xl border px-3 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                          settings.launcherPosition === option.value && "border-primary bg-primary/5",
                        )}
                        key={option.value}
                        onClick={() => updateSetting("launcherPosition", option.value)}
                        role="radio"
                        type="button"
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">افتح «زر الإطلاق» في المعاينة لرؤية مكانه على المتجر.</p>
                </fieldset>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="safety">
            <Card>
              <CardHeader>
                <CardTitle>قواعد ثابتة فوق الهوية</CardTitle>
                <p className="text-sm text-muted-foreground">ألوان العلامة وصوتها لا يغيران قواعد التوفر أو السلامة.</p>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  "يرشّح منتجات نشطة ومتوفرة فقط",
                  "يقرأ السعر والمخزون من بيانات المتجر",
                  "لا يخترع عروضًا أو خصومات أو ادعاءات علاجية",
                  "يطلب تدخلًا بشريًا عندما تتطلب الحالة ذلك",
                ].map((rule) => (
                  <div className="flex min-h-12 items-center gap-3 rounded-xl bg-success-soft p-4 text-sm" key={rule}>
                    <CheckCircle2 className="size-4 shrink-0 text-success" />{rule}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <WidgetPreview settings={settings} />
    </div>
  );
}
