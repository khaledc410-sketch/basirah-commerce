import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpLeft, CircleAlert, FileQuestion, Lightbulb, MessagesSquare, Search, TrendingUp, UsersRound } from "lucide-react";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductionFeatureState } from "@/components/dashboard/production-feature-state";
import { isDemoMode } from "@/config/env";

export const metadata: Metadata = { title: "ذكاء العملاء" };

const needs = [
  { label: "منتج للبشرة الحساسة", value: 126, conversion: "12.4٪" },
  { label: "تقليل اللمعان والمسام", value: 94, conversion: "16.8٪" },
  { label: "تنظيف لطيف بلا عطر", value: 71, conversion: "18.1٪" },
  { label: "دعم حاجز البشرة", value: 53, conversion: "14.2٪" },
];

const objections = [
  { label: "طريقة الاستخدام غير واضحة", value: 34, severity: "مرتفع" },
  { label: "معلومات المكونات ناقصة", value: 27, severity: "مرتفع" },
  { label: "هل يناسب البشرة الحساسة؟", value: 22, severity: "متوسط" },
  { label: "السعر مقارنة بالحجم", value: 15, severity: "متوسط" },
];

export default function IntelligencePage() {
  if (!isDemoMode()) return <ProductionFeatureState title="ذكاء العملاء ينتظر بيانات حقيقية" description="لا توجد محادثات حية كافية لاستخراج احتياجات أو اعتراضات؛ لن نعرض الإشارات التجريبية في مساحة العميل." />;
  return (
    <>
      <DashboardHeader description="الاحتياجات والاعتراضات والأسئلة والطلب الناشئ، مستخرجة كإشارات منظمة من المحادثات." title="ذكاء العملاء" />
      <div className="mx-auto max-w-[1440px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[
          { icon: UsersRound, label: "احتياجات فريدة", value: "18", note: "+3 هذا الأسبوع" },
          { icon: CircleAlert, label: "اعتراضات متكررة", value: "9", note: "2 تحتاج إجراء" },
          { icon: FileQuestion, label: "أسئلة بلا إجابة", value: "19", note: "بسبب نقص مصدر" },
          { icon: TrendingUp, label: "موضوع ناشئ", value: "البشرة الحساسة", note: "+31٪ عن الأسبوع السابق" },
        ].map((metric) => <Card key={metric.label}><CardContent className="p-5"><metric.icon className="size-5 text-primary" /><p className="mt-4 text-sm text-muted-foreground">{metric.label}</p><p className="metric-numbers mt-1 text-2xl font-semibold">{metric.value}</p><p className="mt-2 text-xs text-muted-foreground">{metric.note}</p></CardContent></Card>)}</section>

        <section className="grid gap-5 xl:grid-cols-2"><Card><CardHeader><div className="flex items-center justify-between"><div><CardTitle>ماذا يريد العملاء؟</CardTitle><p className="mt-1 text-sm text-muted-foreground">العدد والتحويل حسب الاحتياج · آخر 30 يومًا</p></div><MessagesSquare className="size-5 text-muted-foreground" /></div></CardHeader><CardContent className="space-y-5">{needs.map((need) => <div key={need.label}><div className="mb-2 flex items-center justify-between gap-3 text-sm"><span className="font-medium">{need.label}</span><span className="metric-numbers text-xs text-muted-foreground">{need.value} محادثة · {need.conversion}</span></div><div className="h-2 rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${(need.value / needs[0].value) * 100}%` }} /></div></div>)}</CardContent></Card>
          <Card><CardHeader><div className="flex items-center justify-between"><div><CardTitle>ما الذي يمنع الشراء؟</CardTitle><p className="mt-1 text-sm text-muted-foreground">اعتراضات متكررة مع مستوى الأولوية</p></div><CircleAlert className="size-5 text-warning" /></div></CardHeader><CardContent className="divide-y">{objections.map((objection) => <div className="flex items-center gap-4 py-4 first:pt-0 last:pb-0" key={objection.label}><span className="flex size-9 items-center justify-center rounded-full bg-warning-soft text-sm font-semibold text-warning">{objection.value}</span><p className="min-w-0 flex-1 text-sm font-medium">{objection.label}</p><Badge variant="outline">{objection.severity}</Badge></div>)}</CardContent></Card></section>

        <section className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]"><Card><CardHeader><div className="flex items-center justify-between"><div><CardTitle>إشارة تحتاج قرارًا</CardTitle><p className="mt-1 text-sm text-muted-foreground">من طلب العملاء إلى فرصة متجر</p></div><Badge className="bg-warning-soft text-warning hover:bg-warning-soft">ثقة مرتفعة</Badge></div></CardHeader><CardContent><div className="rounded-2xl border bg-muted/30 p-5"><p className="text-lg font-semibold">126 عميلًا سألوا عن البشرة الحساسة</p><p className="mt-2 text-sm text-muted-foreground">صفحة الغسول تذكر أنها خالية من العطر، لكن صفحة المرطب لا توضح مصدر الملاءمة أو قائمة المكونات الكاملة.</p><div className="mt-5 grid gap-3 sm:grid-cols-3"><div className="rounded-xl bg-card p-3"><p className="text-xs text-muted-foreground">طلب العملاء</p><p className="mt-1 font-semibold">126 محادثة</p></div><div className="rounded-xl bg-card p-3"><p className="text-xs text-muted-foreground">الصفحات المتأثرة</p><p className="mt-1 font-semibold">منتجان</p></div><div className="rounded-xl bg-card p-3"><p className="text-xs text-muted-foreground">الإجابات الآمنة</p><p className="mt-1 font-semibold">71٪ فقط</p></div></div><div className="mt-5 flex flex-wrap gap-2"><Button asChild><Link href="/dashboard/opportunities">إنشاء فرصة<ArrowUpLeft /></Link></Button><Button asChild variant="outline"><Link href="/dashboard/conversations">عرض المحادثات</Link></Button></div></div></CardContent></Card><Card><CardHeader><CardTitle>فجوات الطلب</CardTitle></CardHeader><CardContent className="space-y-4">{[{ icon: Search, label: "منتج للبشرة شديدة الحساسية", value: "47 طلبًا · لا تطابق كامل" }, { icon: Lightbulb, label: "روتين مكوّن من خطوتين", value: "39 طلبًا · لا توجد باقة" }, { icon: FileQuestion, label: "دليل ترتيب الاستخدام", value: "34 سؤالًا · لا توجد صفحة" }].map((gap) => <div className="flex gap-3" key={gap.label}><span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted"><gap.icon className="size-4 text-primary" /></span><div><p className="text-sm font-semibold">{gap.label}</p><p className="text-xs text-muted-foreground">{gap.value}</p></div></div>)}</CardContent></Card></section>
      </div>
    </>
  );
}
