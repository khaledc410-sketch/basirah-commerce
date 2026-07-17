"use client";

import { CheckCircle2, Clock3, FileCheck2, Play, ShieldCheck, Workflow } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

const automations = [
  { id: "weekly", title: "موجز الفرص الأسبوعي", description: "يجمع التغيرات والاعتراضات وفجوات المحتوى كل أحد.", risk: "قراءة فقط", active: true },
  { id: "unanswered", title: "تجميع الأسئلة بلا إجابة", description: "ينشئ قائمة مراجعة عندما يتكرر سؤال ناقص المصدر 5 مرات.", risk: "قراءة فقط", active: true },
  { id: "draft", title: "مسودة FAQ منخفضة المخاطر", description: "ينشئ مسودة من معلومة موثقة؛ لا ينشر دون مراجعة.", risk: "تحتاج موافقة", active: false },
] as const;

export function AutomationList() {
  const [enabled, setEnabled] = useState<Record<string, boolean>>(() => Object.fromEntries(automations.map((item) => [item.id, item.active])));
  return <div className="space-y-4">{automations.map((automation) => <Card key={automation.id}><CardContent className="flex flex-wrap items-start gap-5 p-5 sm:p-6"><span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Workflow /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold">{automation.title}</h2><Badge variant="outline">{automation.risk}</Badge></div><p className="mt-2 text-sm text-muted-foreground">{automation.description}</p><div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground"><span className="flex items-center gap-1"><Clock3 className="size-3.5" />آخر تشغيل: لم يُشغّل في العرض</span><span className="flex items-center gap-1"><ShieldCheck className="size-3.5" />حدود الإجراء محفوظة</span></div></div><div className="flex items-center gap-3"><Switch aria-label={`تفعيل ${automation.title}`} checked={enabled[automation.id]} onCheckedChange={(checked) => { setEnabled((current) => ({ ...current, [automation.id]: checked })); toast.success(checked ? "فُعّلت الأتمتة التجريبية" : "أوقفت الأتمتة", { description: "لم يُنشأ أي عمل خارجي." }); }} /><Button aria-label={`تشغيل ${automation.title} الآن`} disabled={!enabled[automation.id]} onClick={() => toast.success("اكتمل التشغيل التجريبي", { description: "تمت القراءة فقط ولم يُنشر أي تغيير." })} size="icon" variant="outline"><Play /></Button></div></CardContent></Card>)}<div className="grid gap-4 md:grid-cols-3">{[{ icon: CheckCircle2, label: "تشغيلات ناجحة", value: "0" }, { icon: FileCheck2, label: "مسودات تنتظر موافقة", value: "0" }, { icon: ShieldCheck, label: "إجراءات نشرت تلقائيًا", value: "0" }].map((metric) => <Card key={metric.label}><CardContent className="p-5"><metric.icon className="size-5 text-primary" /><p className="metric-numbers mt-4 text-2xl font-semibold">{metric.value}</p><p className="mt-1 text-xs text-muted-foreground">{metric.label}</p></CardContent></Card>)}</div></div>;
}
