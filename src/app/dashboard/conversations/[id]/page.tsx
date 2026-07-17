import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Bot, CheckCircle2, CircleUserRound, ExternalLink, MousePointerClick, ShoppingBag } from "lucide-react";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { ProductionFeatureState } from "@/components/dashboard/production-feature-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isDemoMode } from "@/config/env";
import { demoRepository } from "@/core/demo/store";
import { formatCurrency, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/dashboard/conversations/[id]">): Promise<Metadata> {
  const { id } = await params;
  return { title: `المحادثة ${id.slice(0, 10)}` };
}

export default async function ConversationDetailPage({ params }: PageProps<"/dashboard/conversations/[id]">) {
  if (!isDemoMode()) {
    return <ProductionFeatureState title="المحادثة غير متاحة" description="هذا المسار لا يعرض سجلات العرض في الإنتاج. افتحه بعد تفعيل جلسات الواجهة وتخزين المحادثات للمتجر الحالي." />;
  }
  const { id } = await params;
  const conversation = demoRepository.getConversation(id);
  if (!conversation) notFound();
  const products = demoRepository.listProducts().filter((product) => conversation.recommendedProductIds.includes(product.id));
  return (
    <>
      <DashboardHeader actions={<Button asChild variant="outline"><Link href="/dashboard/conversations"><ArrowRight />كل المحادثات</Link></Button>} description={`بدأت ${formatDate(conversation.createdAt)} · معرّف الزائر مجهول الهوية`} title={conversation.need} />
      <div className="mx-auto grid max-w-[1440px] gap-6 px-4 py-6 sm:px-6 xl:grid-cols-[minmax(0,1fr)_350px] lg:px-8">
        <div className="space-y-6"><Card><CardHeader><div className="flex flex-wrap items-center justify-between gap-3"><CardTitle>نص المحادثة</CardTitle><Badge variant="outline">العربية</Badge></div></CardHeader><CardContent className="space-y-5">{conversation.messages.map((message) => <div className={`flex gap-3 ${message.role === "customer" ? "justify-end" : "justify-start"}`} key={message.id}>{message.role === "assistant" && <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"><Bot className="size-4" /></span>}<div className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm ${message.role === "customer" ? "rounded-ee-sm bg-primary text-primary-foreground" : "rounded-es-sm bg-muted"}`} dir="auto">{message.text}</div>{message.role === "customer" && <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary"><CircleUserRound className="size-4" /></span>}</div>)}</CardContent></Card>
          <Card><CardHeader><CardTitle>المنتجات التي ظهرت للعميل</CardTitle></CardHeader><CardContent>{products.length > 0 ? <div className="grid gap-4 sm:grid-cols-2">{products.map((product) => <article className="flex gap-4 rounded-xl border p-3" key={product.id}><div className="relative size-20 shrink-0 overflow-hidden rounded-lg"><Image alt={`صورة ${product.name.ar}`} fill sizes="80px" src={product.imageUrl} className="object-cover" /></div><div className="min-w-0"><Link className="font-semibold hover:text-primary" href={`/dashboard/products/${product.id}`}>{product.name.ar}</Link><p className="metric-numbers mt-1 text-sm">{formatCurrency(product.price.amount)}</p><p className="mt-2 text-xs text-success">متوفر وقت الترشيح · مصدره الكتالوج</p></div></article>)}</div> : <p className="text-sm text-muted-foreground">لم يظهر منتج لأن سياسة السلامة أو نقص المعلومات منعا التوصية.</p>}</CardContent></Card>
        </div>
        <aside className="space-y-5"><Card><CardHeader><CardTitle>النتيجة</CardTitle></CardHeader><CardContent className="space-y-4"><div className="flex items-center gap-3"><span className={`flex size-10 items-center justify-center rounded-full ${conversation.outcome === "purchased" ? "bg-success-soft text-success" : "bg-muted text-muted-foreground"}`}>{conversation.outcome === "purchased" ? <CheckCircle2 /> : <MousePointerClick />}</span><div><p className="font-semibold">{conversation.outcome === "purchased" ? "شراء مؤكد" : conversation.outcome === "added_to_cart" ? "أضيف للسلة" : conversation.outcome === "clicked" ? "نقر المنتج" : "لم يسجل تحويل"}</p><p className="text-xs text-muted-foreground">الإسناد منفصل عن التأثير</p></div></div>{conversation.outcome === "purchased" && <div className="rounded-xl bg-success-soft p-4 text-sm"><p className="font-semibold text-success">مباشر بمساعدة المستشار</p><p className="mt-1 text-muted-foreground">أكدت منصة المتجر الطلب بعد النقر والإضافة ضمن النافذة المباشرة.</p></div>}</CardContent></Card>
          <Card><CardHeader><CardTitle>الإشارات المنظمة</CardTitle></CardHeader><CardContent className="space-y-3 text-sm">{[["النية", conversation.intent], ["الاحتياج", conversation.need], ["الاعتراض", conversation.objection ?? "لا يوجد"], ["المشاعر", conversation.sentiment === "positive" ? "إيجابية" : conversation.sentiment === "negative" ? "سلبية" : "محايدة"]].map(([label, value]) => <div className="flex justify-between gap-4 border-b pb-3 last:border-0 last:pb-0" key={label}><span className="text-muted-foreground">{label}</span><span className="text-end font-medium">{value}</span></div>)}</CardContent></Card>
          <Card><CardHeader><CardTitle>مسار الحدث</CardTitle></CardHeader><CardContent className="space-y-4 text-sm">{[{ icon: Bot, label: "بدأت المحادثة" }, { icon: ExternalLink, label: products.length ? "ظهر الترشيح" : "تدخلت السلامة" }, { icon: ShoppingBag, label: conversation.outcome === "purchased" || conversation.outcome === "added_to_cart" ? "أضيف للسلة" : "لا توجد إضافة" }].map((event) => <div className="flex items-center gap-3" key={event.label}><span className="flex size-8 items-center justify-center rounded-full bg-muted"><event.icon className="size-4" /></span>{event.label}</div>)}</CardContent></Card>
        </aside>
      </div>
    </>
  );
}
