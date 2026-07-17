import Image from "next/image";
import Link from "next/link";
import { ArrowUpLeft, Box, MousePointerClick, ShoppingCart } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { UnifiedProduct } from "@/core/commerce/types";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/format";

interface ProductRowCardProps {
  product: UnifiedProduct;
  metrics: { impressions: number; clicks: number; addToCarts: number; purchases: number; conversionRate: number };
}

export function ProductRowCard({ product, metrics }: ProductRowCardProps) {
  return (
    <div className="grid gap-4 border-b py-5 last:border-b-0 sm:grid-cols-[minmax(220px,1.4fr)_repeat(4,minmax(80px,.5fr))_auto] sm:items-center">
      <div className="flex items-center gap-3"><div className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-muted"><Image alt={`صورة ${product.name.ar}`} fill sizes="56px" src={product.imageUrl} className="object-cover" /></div><div className="min-w-0"><Link className="font-semibold hover:text-primary" href={`/dashboard/products/${product.id}`}>{product.name.ar}</Link><div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground"><span>{formatCurrency(product.price.amount)}</span><Badge className="h-5" variant="outline">{product.stock} متوفر</Badge></div></div></div>
      {[{ icon: Box, value: metrics.impressions, label: "ترشيح" }, { icon: MousePointerClick, value: metrics.clicks, label: "نقر" }, { icon: ShoppingCart, value: metrics.addToCarts, label: "سلة" }].map((item) => <div className="flex items-center gap-2 sm:block" key={item.label}><item.icon className="size-4 text-muted-foreground sm:hidden" /><p className="metric-numbers font-semibold">{formatNumber(item.value)}</p><p className="text-xs text-muted-foreground">{item.label}</p></div>)}
      <div><p className="metric-numbers font-semibold">{formatPercent(metrics.conversionRate)}</p><p className="text-xs text-muted-foreground">إلى شراء</p></div>
      <Button asChild size="icon" variant="ghost"><Link aria-label={`فتح ${product.name.ar}`} href={`/dashboard/products/${product.id}`}><ArrowUpLeft /></Link></Button>
    </div>
  );
}
