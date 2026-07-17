import type { Metadata } from "next";
import { Check, CircleDollarSign, MessageCircleMore, SearchCheck, Sparkles, UsersRound } from "lucide-react";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ProductionFeatureState } from "@/components/dashboard/production-feature-state";
import { isDemoMode } from "@/config/env";

export const metadata: Metadata = { title: "الخطة والاستخدام" };

export default function BillingPage() {
  if (!isDemoMode()) return <ProductionFeatureState title="الفوترة غير مفعّلة" description="لن نعرض خطة أو استخدامًا أو فاتورة افتراضية. تفعيل الدفع يحتاج مزودًا حقيقيًا وويبهوك اشتراك مختبرًا." />;
  return <><DashboardHeader description="الخطط والحدود قابلة للتكوين. الأرقام أدناه للاستخدام التجريبي وليست فاتورة." title="الخطة والاستخدام" /><div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8"><Card className="border-primary/30"><CardContent className="flex flex-wrap items-center gap-6 p-6"><span className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground"><CircleDollarSign /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="text-xl font-semibold">Growth · عرض تجريبي</h2><Badge>غير مفوتر</Badge></div><p className="mt-1 text-sm text-muted-foreground">يوضح حزمة المزايا المقترحة فقط؛ لا اشتراك حقيقي أو بيانات دفع.</p></div><Button disabled>ترقية الإنتاج غير متاحة</Button></CardContent></Card><div className="grid gap-5 md:grid-cols-2">{[{ icon: MessageCircleMore, label: "محادثات العملاء", used: 1248, limit: 5000 }, { icon: Sparkles, label: "رسائل مساعد المتجر", used: 37, limit: 250 }, { icon: SearchCheck, label: "فحوص الظهور", used: 25, limit: 100 }, { icon: UsersRound, label: "أعضاء الفريق", used: 1, limit: 5 }].map((usage) => <Card key={usage.label}><CardContent className="p-5"><div className="flex items-center justify-between"><div className="flex items-center gap-2"><usage.icon className="size-5 text-primary" /><p className="font-semibold">{usage.label}</p></div><p className="metric-numbers text-sm">{usage.used} / {usage.limit}</p></div><Progress className="mt-5" value={(usage.used / usage.limit) * 100} /><p className="mt-2 text-xs text-muted-foreground">تجميع العرض التجريبي لهذا الشهر</p></CardContent></Card>)}</div><Card><CardHeader><CardTitle>ما يتضمنه Growth</CardTitle></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2">{["مستشار العملاء", "اسأل بيانات متجرك", "ذكاء العملاء", "إسناد التحويل", "مراقبة الاستعلامات", "مسودات المحتوى"].map((item) => <p className="flex items-center gap-2 text-sm" key={item}><Check className="size-4 text-success" />{item}</p>)}</CardContent></Card></div></>;
}
