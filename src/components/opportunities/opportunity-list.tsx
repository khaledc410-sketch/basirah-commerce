"use client";

import { Check, Clock3, Eye, FileDiff, Lightbulb, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { DemoOpportunity } from "@/core/demo/types";

interface OpportunityListProps {
  opportunities: DemoOpportunity[];
}

const draftByOpportunity: Record<string, { before: string; after: string }> = {
  opp_size_faq: {
    before: "طريقة الاستخدام غير مذكورة في صفحة المنتج.",
    after: "**طريقة الاستخدام:** بعد التنظيف، ضَع كمية قليلة ضمن روتينك ثم استخدم المرطب. هذه إرشادات استخدام متجر وليست وصفة علاجية.",
  },
  opp_pregnancy_info: {
    before: "لا توجد ورقة مكونات كاملة أو معلومة موثقة للحمل.",
    after: "لا يمكن نشر مسودة محتوى آمنة قبل رفع ورقة المكونات ومراجعتها. الإجراء المقترح هنا هو طلب المصدر فقط.",
  },
  opp_ai_answerability: {
    before: "لا يوجد دليل يربط أسئلة البشرة الحساسة بالمنتجات المتاحة.",
    after: "مسودة دليل: كيف تختار منتجًا للبشرة الحساسة؟ يعرض فقط السمات الموثقة، مع رابط للغسول والمرطب وحدود كل معلومة.",
  },
};

export function OpportunityList({ opportunities }: OpportunityListProps) {
  const [selected, setSelected] = useState<DemoOpportunity | null>(null);
  const [statuses, setStatuses] = useState<Record<string, "open" | "approved" | "dismissed">>({});
  const draft = selected ? draftByOpportunity[selected.id] : undefined;

  return (
    <>
      <div className="space-y-4">{opportunities.map((opportunity) => { const status = statuses[opportunity.id] ?? "open"; return <Card className={status === "dismissed" ? "opacity-60" : undefined} key={opportunity.id}><CardContent className="p-5 sm:p-6"><div className="flex flex-wrap items-start gap-5"><span className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${opportunity.priority === "high" ? "bg-warning-soft text-warning" : "bg-primary/10 text-primary"}`}><Lightbulb /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><Badge variant={opportunity.priority === "high" ? "default" : "secondary"}>{opportunity.priority === "high" ? "أولوية عالية" : "أولوية متوسطة"}</Badge><Badge variant="outline">ثقة {opportunity.confidence === "high" ? "مرتفعة" : "متوسطة"}</Badge>{status !== "open" && <Badge className={status === "approved" ? "bg-success-soft text-success hover:bg-success-soft" : ""} variant="secondary">{status === "approved" ? "تمت الموافقة في العرض" : "مؤجلة"}</Badge>}</div><h2 className="mt-3 text-xl font-semibold">{opportunity.title}</h2><p className="mt-2 text-sm text-muted-foreground">{opportunity.evidence}</p><div className="mt-5 grid gap-3 sm:grid-cols-2"><div className="rounded-xl bg-muted/50 p-4"><p className="text-xs font-semibold text-muted-foreground">لماذا تهم؟</p><p className="mt-2 text-sm">{opportunity.whyItMatters}</p></div><div className="rounded-xl bg-muted/50 p-4"><p className="text-xs font-semibold text-muted-foreground">الإجراء المقترح</p><p className="mt-2 text-sm">{opportunity.proposedAction}</p></div></div><div className="mt-5 flex flex-wrap gap-2"><Button disabled={status !== "open"} onClick={() => setSelected(opportunity)}><Eye />راجع الدليل والمسودة</Button><Button disabled={status !== "open"} onClick={() => { setStatuses((current) => ({ ...current, [opportunity.id]: "dismissed" })); toast.info("تم تأجيل الفرصة", { description: "يمكن إعادتها من سجل الفرص لاحقًا." }); }} variant="outline"><Clock3 />لاحقًا</Button></div></div></div></CardContent></Card>; })}</div>
      <Dialog onOpenChange={(open) => !open && setSelected(null)} open={Boolean(selected)}><DialogContent className="max-h-[90dvh] max-w-3xl overflow-y-auto"><DialogHeader><DialogTitle>{selected?.title}</DialogTitle><DialogDescription>راجع النص قبل وبعد. الموافقة هنا تغيّر حالة العرض فقط ولا تنشر إلى متجر سلة.</DialogDescription></DialogHeader>{selected && draft && <div className="space-y-5"><div className="rounded-xl border p-4"><p className="text-xs font-semibold text-muted-foreground">الدليل</p><p className="mt-2 text-sm">{selected.evidence}</p></div><div className="grid gap-4 md:grid-cols-2"><div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4"><p className="flex items-center gap-2 text-sm font-semibold"><X className="size-4 text-destructive" />قبل</p><p className="mt-3 text-sm text-muted-foreground">{draft.before}</p></div><div className="rounded-xl border border-success/20 bg-success-soft p-4"><p className="flex items-center gap-2 text-sm font-semibold"><FileDiff className="size-4 text-success" />المسودة المقترحة</p><p className="mt-3 text-sm">{draft.after}</p></div></div><div className="rounded-xl bg-warning-soft p-4 text-sm"><p className="font-semibold text-warning">حدود الإجراء</p><p className="mt-1 text-muted-foreground">السعر والخصم والسياسات والادعاءات الطبية خارج هذا التغيير. أي نشر إنتاجي يحتاج نسخة مصدر، checksum، وصلاحية مستخدم.</p></div></div>}<DialogFooter><Button onClick={() => setSelected(null)} variant="outline">إغلاق</Button><Button onClick={() => { if (!selected) return; setStatuses((current) => ({ ...current, [selected.id]: "approved" })); setSelected(null); toast.success("تمت الموافقة في وضع العرض", { description: "سُجلت الحالة دون إرسال أي تغيير للمتجر." }); }}><Check />الموافقة على المسودة التجريبية</Button></DialogFooter></DialogContent></Dialog>
    </>
  );
}
