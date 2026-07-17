import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CheckCircle2, CircleAlert, ExternalLink, FileText, ImageIcon, MessageCircleQuestion, PackageCheck, Sparkles, XCircle } from "lucide-react";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { ExternalProductImage } from "@/components/dashboard/external-product-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { isDemoMode } from "@/config/env";
import { getLiveCatalogProduct } from "@/core/data/catalog";
import { requireStoreContext } from "@/core/data/tenant";
import { demoRepository } from "@/core/demo/store";
import { formatCurrency, formatDate, formatNumber, formatPercent } from "@/lib/format";
import { auditProduct } from "@/modules/visibility/readiness";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/dashboard/products/[id]">): Promise<Metadata> {
  if (!isDemoMode()) return { title: "تفاصيل المنتج" };
  const { id } = await params;
  const product = demoRepository.getProduct(id);
  return { title: product?.name.ar ?? "المنتج" };
}

export default async function ProductDetailPage({ params }: PageProps<"/dashboard/products/[id]">) {
  const { id } = await params;
  if (!isDemoMode()) return <LiveProductDetail productId={id} />;
  const product = demoRepository.getProduct(id);
  if (!product) notFound();
  const metrics = demoRepository.getProductMetrics(product);
  const audit = auditProduct(product);
  return (
    <>
      <DashboardHeader actions={<><Button asChild variant="outline"><Link href="/dashboard/products"><ArrowRight />المنتجات</Link></Button><Button disabled variant="outline"><ExternalLink />رابط المتجر غير متاح في العرض</Button></>} description={`آخر مزامنة ناجحة · مصدر المنتج: ${product.provenance.platform}`} title={product.name.ar} />
      <div className="mx-auto max-w-[1440px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="grid gap-5 lg:grid-cols-[300px_1fr]"><Card className="overflow-hidden"><div className="relative aspect-square bg-muted"><Image alt={`صورة ${product.name.ar}`} fill priority sizes="300px" src={product.imageUrl} className="object-cover" /></div><CardContent className="p-5"><div className="flex items-center justify-between"><p className="metric-numbers text-2xl font-semibold">{formatCurrency(product.price.amount)}</p><Badge className="bg-success-soft text-success hover:bg-success-soft">متوفر</Badge></div><p className="mt-2 text-sm text-muted-foreground"><bdi dir="ltr">{product.variants[0].sku}</bdi> · {product.stock} في المخزون</p></CardContent></Card><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[{ icon: Sparkles, label: "مرات الترشيح", value: formatNumber(metrics.impressions), note: "آخر 30 يومًا" }, { icon: ExternalLink, label: "معدل النقر", value: formatPercent(metrics.clicks / metrics.impressions), note: `${metrics.clicks} نقرة` }, { icon: PackageCheck, label: "الإضافة للسلة", value: formatPercent(metrics.addToCarts / metrics.impressions), note: `${metrics.addToCarts} إضافة` }, { icon: MessageCircleQuestion, label: "أكثر سؤال", value: metrics.mostCommonQuestion, note: "من المحادثات" }].map((metric) => <Card key={metric.label}><CardContent className="p-5"><metric.icon className="size-5 text-primary" /><p className="mt-4 text-xs text-muted-foreground">{metric.label}</p><p className="metric-numbers mt-1 font-semibold">{metric.value}</p><p className="mt-2 text-xs text-muted-foreground">{metric.note}</p></CardContent></Card>)}</div></section>
        <Tabs defaultValue="audit"><TabsList><TabsTrigger value="audit">تدقيق المحتوى</TabsTrigger><TabsTrigger value="performance">الأداء</TabsTrigger><TabsTrigger value="questions">الأسئلة</TabsTrigger><TabsTrigger value="versions">الإصدارات</TabsTrigger></TabsList><TabsContent value="audit" className="mt-5"><div className="grid gap-5 xl:grid-cols-[1fr_330px]"><Card><CardHeader><div className="flex items-center justify-between"><div><CardTitle>جاهزية محتوى المنتج</CardTitle><p className="mt-1 text-sm text-muted-foreground">فحص حتمي · الإصدار {audit.scoringVersion}</p></div><span className="metric-numbers text-3xl font-semibold text-primary">{audit.score}/100</span></div></CardHeader><CardContent className="divide-y">{audit.checks.map((check) => <div className="flex gap-4 py-4 first:pt-0 last:pb-0" key={check.label}><span className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full ${check.status === "pass" ? "bg-success-soft text-success" : check.status === "warning" ? "bg-warning-soft text-warning" : "bg-destructive/10 text-destructive"}`}>{check.status === "pass" ? <CheckCircle2 className="size-4" /> : check.status === "warning" ? <CircleAlert className="size-4" /> : <XCircle className="size-4" />}</span><div><p className="font-semibold">{check.label}</p><p className="mt-1 text-sm text-muted-foreground">{check.evidence}</p>{check.recommendation && <p className="mt-2 text-sm text-primary">الإجراء: {check.recommendation}</p>}</div></div>)}</CardContent></Card><Card><CardHeader><CardTitle>حدود النتيجة</CardTitle></CardHeader><CardContent><div className="rounded-xl bg-warning-soft p-4 text-sm text-warning"><CircleAlert className="mb-3 size-5" /><p>{audit.limitation}</p></div><Button asChild className="mt-5 w-full"><Link href="/dashboard/opportunities">إنشاء مسودة تحسين</Link></Button></CardContent></Card></div></TabsContent><TabsContent value="performance"><Card className="mt-5"><CardContent className="p-6"><p className="font-semibold">قمع المنتج</p><div className="mt-5 grid gap-4 sm:grid-cols-4">{[["ترشيح", metrics.impressions], ["نقر", metrics.clicks], ["سلة", metrics.addToCarts], ["شراء", metrics.purchases]].map(([label, value]) => <div className="rounded-xl bg-muted p-4" key={label}><p className="text-sm text-muted-foreground">{label}</p><p className="metric-numbers mt-1 text-2xl font-semibold">{value}</p></div>)}</div></CardContent></Card></TabsContent><TabsContent value="questions"><Card className="mt-5"><CardContent className="p-6"><p className="font-semibold">{metrics.mostCommonQuestion}</p><p className="mt-2 text-sm text-muted-foreground">ظهر السؤال 34 مرة. افتح المحادثات لمراجعة الأدلة قبل صياغة إجابة.</p><Button asChild className="mt-4" variant="outline"><Link href="/dashboard/conversations">عرض المحادثات</Link></Button></CardContent></Card></TabsContent><TabsContent value="versions"><Card className="mt-5"><CardContent className="flex min-h-48 flex-col items-center justify-center p-8 text-center"><FileText className="size-8 text-muted-foreground" /><p className="mt-4 font-semibold">لا تغييرات منشورة من بصيرة</p><p className="mt-1 text-sm text-muted-foreground">ستظهر هنا المسودات والموافقات وإصدارات المصدر.</p></CardContent></Card></TabsContent></Tabs>
      </div>
    </>
  );
}

async function LiveProductDetail({ productId }: { productId: string }) {
  const store = await requireStoreContext();
  const product = await getLiveCatalogProduct(store.storeId, productId);
  if (!product) notFound();
  let storefrontUrl: string | null = null;
  try {
    const parsed = product.productUrl ? new URL(product.productUrl) : null;
    if (parsed?.protocol === "https:") storefrontUrl = parsed.toString();
  } catch {
    storefrontUrl = null;
  }

  return (
    <>
      <DashboardHeader
        actions={<><Button asChild variant="outline"><Link href="/dashboard/products"><ArrowRight />المنتجات</Link></Button>{storefrontUrl ? <Button asChild variant="outline"><a href={storefrontUrl} rel="noreferrer" target="_blank"><ExternalLink />فتح في المتجر</a></Button> : null}</>}
        description={`مصدر حي من سلة · آخر تحديث للمصدر ${formatDate(product.sourceUpdatedAt ?? product.updatedAt)}`}
        title={product.title}
      />
      <div className="mx-auto max-w-[1200px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="grid gap-5 lg:grid-cols-[300px_1fr]">
          <Card className="overflow-hidden"><div className="flex aspect-square items-center justify-center bg-muted">{product.imageUrl ? <ExternalProductImage alt={`صورة ${product.title}`} className="size-full object-cover" eager src={product.imageUrl} /> : <ImageIcon className="size-10 text-muted-foreground" />}</div><CardContent className="p-5"><div className="flex items-center justify-between"><p className="metric-numbers text-2xl font-semibold">{formatCurrency(product.priceMinor)}</p><Badge variant={product.availableForSale ? "secondary" : "outline"}>{product.availableForSale ? "متوفر للبيع" : "غير متوفر"}</Badge></div><p className="mt-2 text-sm text-muted-foreground"><bdi dir="ltr">{product.sku ?? product.externalId}</bdi> · {product.trackInventory ? `${formatNumber(product.stockQuantity ?? 0)} في المخزون` : "مخزون غير محدود"}</p></CardContent></Card>
          <div className="space-y-5"><Card><CardHeader><CardTitle>وصف المنتج</CardTitle></CardHeader><CardContent><p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{product.description || "لم تُرجع سلة وصفًا لهذا المنتج."}</p></CardContent></Card><div className="grid gap-4 sm:grid-cols-3">{[["الحالة", product.status === "active" ? "نشط" : product.status === "draft" ? "مسودة" : "مؤرشف"], ["الفئة", product.category ?? "غير مصنّف"], ["المتغيرات", formatNumber(product.variants?.length ?? 0)]].map(([label, value]) => <Card key={label}><CardContent className="p-5"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-2 font-semibold">{value}</p></CardContent></Card>)}</div></div>
        </section>
        <Card><CardHeader><CardTitle>المتغيرات والأسعار</CardTitle></CardHeader><CardContent className="divide-y">{product.variants?.length ? product.variants.map((variant) => <div className="grid gap-2 py-4 first:pt-0 last:pb-0 sm:grid-cols-[1fr_.7fr_.7fr]" key={variant.id}><div><p className="font-medium">{variant.title}</p><p className="text-xs text-muted-foreground"><bdi dir="ltr">{variant.sku ?? variant.external_id}</bdi></p></div><p className="metric-numbers">{formatCurrency(variant.price_minor)}</p><p className="text-sm text-muted-foreground">{variant.stock_quantity === null ? "غير محدود" : `${formatNumber(variant.stock_quantity)} في المخزون`}</p></div>) : <p className="text-sm text-muted-foreground">لا توجد متغيرات منفصلة.</p>}</CardContent></Card>
        <Card><CardHeader><CardTitle>السمات المستوردة</CardTitle></CardHeader><CardContent>{product.attributes?.length ? <div className="flex flex-wrap gap-3">{product.attributes.map((attribute) => <div className="rounded-xl border px-4 py-3" key={`${attribute.key}:${attribute.locale}`}><p className="text-xs font-semibold text-muted-foreground">{attribute.key}</p><p className="mt-1 text-sm">{attribute.values.join("، ")}</p></div>)}</div> : <p className="text-sm text-muted-foreground">لم تُرجع سلة سمات إضافية.</p>}</CardContent></Card>
      </div>
    </>
  );
}
