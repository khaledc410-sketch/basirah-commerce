import { ArrowUpLeft, ImageIcon, RefreshCw } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { ExternalProductImage } from "@/components/dashboard/external-product-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { isDemoMode } from "@/config/env";
import { listLiveCatalogProducts } from "@/core/data/catalog";
import { requireStoreContext } from "@/core/data/tenant";
import { demoRepository } from "@/core/demo/store";
import { formatCurrency, formatDate, formatNumber, formatPercent } from "@/lib/format";
import { auditProduct } from "@/modules/visibility/readiness";

export const metadata: Metadata = { title: "المنتجات" };
export const dynamic = "force-dynamic";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  if (!isDemoMode()) {
    const query = await searchParams;
    const requestedPage = Number(query.page ?? "1");
    const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
    const perPage = 50;
    const store = await requireStoreContext();
    const catalog = await listLiveCatalogProducts(store.storeId, perPage, (page - 1) * perPage);
    const totalPages = Math.max(1, Math.ceil(catalog.total / perPage));
    if (catalog.total > 0 && page > totalPages) redirect(`/dashboard/products?page=${totalPages}`);
    return (
      <>
        <DashboardHeader
          actions={<Button asChild variant="outline"><Link href="/setup/sync"><RefreshCw />حالة المزامنة</Link></Button>}
          description={`${formatNumber(catalog.total)} منتجًا مستوردًا من اتصال المتجر الحالي.`}
          title="المنتجات الحية"
        />
        <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">
          {catalog.products.length === 0 ? (
            <Card><CardContent className="flex min-h-72 flex-col items-center justify-center p-8 text-center"><ImageIcon className="size-10 text-muted-foreground" /><h2 className="mt-4 text-xl font-semibold">لا توجد منتجات مستوردة بعد</h2><p className="mt-2 max-w-lg text-sm text-muted-foreground">ابدأ المزامنة، ثم ستظهر هنا المنتجات التي أعادتها واجهة سلة فعليًا.</p><Button asChild className="mt-5"><Link href="/setup/sync"><RefreshCw />فتح المزامنة</Link></Button></CardContent></Card>
          ) : (
            <div className="space-y-4"><Card className="overflow-hidden">
              <div className="hidden grid-cols-[1.7fr_.7fr_.7fr_.7fr_auto] gap-3 border-b bg-muted/40 px-5 py-3 text-xs font-semibold text-muted-foreground lg:grid"><span>المنتج</span><span>الحالة</span><span>السعر</span><span>المخزون</span><span /></div>
              {catalog.products.map((product) => (
                <div className="grid gap-4 border-b px-5 py-4 last:border-0 lg:grid-cols-[1.7fr_.7fr_.7fr_.7fr_auto] lg:items-center" key={product.id}>
                  <div className="flex items-center gap-3">
                    <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted">
                      {product.imageUrl ? <ExternalProductImage alt={`صورة ${product.title}`} className="size-full object-cover" src={product.imageUrl} /> : <ImageIcon className="size-5 text-muted-foreground" />}
                    </div>
                    <div className="min-w-0"><Link className="font-semibold hover:text-primary" href={`/dashboard/products/${product.id}`}>{product.title}</Link><p className="mt-1 text-xs text-muted-foreground"><bdi dir="ltr">{product.sku ?? product.externalId}</bdi>{product.category ? ` · ${product.category}` : ""} · حُدّث {formatDate(product.sourceUpdatedAt ?? product.updatedAt)}</p></div>
                  </div>
                  <Badge className="w-fit" variant={product.availableForSale ? "secondary" : "outline"}>{product.status === "archived" ? "مؤرشف" : product.availableForSale ? "متاح" : "غير متاح"}</Badge>
                  <p className="metric-numbers font-semibold">{formatCurrency(product.priceMinor)}</p>
                  <p className="metric-numbers font-semibold">{product.trackInventory ? formatNumber(product.stockQuantity ?? 0) : "غير محدود"}</p>
                  <Button asChild size="icon" variant="ghost"><Link aria-label={`فتح ${product.title}`} href={`/dashboard/products/${product.id}`}><ArrowUpLeft /></Link></Button>
                </div>
              ))}
            </Card><nav aria-label="صفحات المنتجات" className="flex items-center justify-between gap-3"><span className="text-sm text-muted-foreground">صفحة {Math.min(page, totalPages)} من {totalPages}</span><div className="flex gap-2">{page > 1 ? <Button asChild variant="outline"><Link href={`/dashboard/products?page=${page - 1}`}>السابق</Link></Button> : <Button disabled variant="outline">السابق</Button>}{page < totalPages ? <Button asChild variant="outline"><Link href={`/dashboard/products?page=${page + 1}`}>التالي</Link></Button> : <Button disabled variant="outline">التالي</Button>}</div></nav></div>
          )}
        </div>
      </>
    );
  }

  const products = demoRepository.listProducts();
  return (
    <>
      <DashboardHeader description="بيانات عرض: أداء افتراضي وجاهزية محتوى لكل منتج." title="المنتجات والتحسين" />
      <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8"><Card className="overflow-hidden"><div className="hidden grid-cols-[1.5fr_repeat(5,.6fr)_auto] gap-3 border-b bg-muted/40 px-5 py-3 text-xs font-semibold text-muted-foreground lg:grid"><span>المنتج</span><span>الترشيحات</span><span>النقرات</span><span>السلة</span><span>الشراء</span><span>الجاهزية</span><span /></div>{products.map((product) => { const metrics = demoRepository.getProductMetrics(product); const audit = auditProduct(product); return <div className="grid gap-4 border-b px-5 py-4 last:border-0 lg:grid-cols-[1.5fr_repeat(5,.6fr)_auto] lg:items-center" key={product.id}><div className="flex items-center gap-3"><div className="relative size-14 shrink-0 overflow-hidden rounded-xl"><Image alt={`صورة ${product.name.ar}`} fill sizes="56px" src={product.imageUrl} className="object-cover" /></div><div className="min-w-0"><Link className="font-semibold hover:text-primary" href={`/dashboard/products/${product.id}`}>{product.name.ar}</Link><p className="mt-1 text-xs text-muted-foreground"><bdi dir="ltr">{product.variants[0].sku}</bdi> · {formatCurrency(product.price.amount)} · {product.stock} متوفر</p></div></div><div><p className="metric-numbers font-semibold">{formatNumber(metrics.impressions)}</p><p className="text-xs text-muted-foreground lg:hidden">ترشيح</p></div><div><p className="metric-numbers font-semibold">{formatNumber(metrics.clicks)}</p><p className="text-xs text-muted-foreground lg:hidden">نقر</p></div><div><p className="metric-numbers font-semibold">{formatNumber(metrics.addToCarts)}</p><p className="text-xs text-muted-foreground lg:hidden">سلة</p></div><div><p className="metric-numbers font-semibold">{formatPercent(metrics.conversionRate)}</p><p className="text-xs text-muted-foreground lg:hidden">شراء</p></div><Badge className="w-fit" variant={audit.score >= 80 ? "secondary" : "outline"}>{audit.score}/100</Badge><Button asChild size="icon" variant="ghost"><Link aria-label={`فتح ${product.name.ar}`} href={`/dashboard/products/${product.id}`}><ArrowUpLeft /></Link></Button></div>; })}</Card></div>
    </>
  );
}
