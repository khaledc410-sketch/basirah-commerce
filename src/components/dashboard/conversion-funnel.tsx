import { formatNumber, formatPercent } from "@/lib/format";

interface ConversionFunnelProps {
  recommendations: number;
  clicks: number;
  addToCarts: number;
  purchases: number;
}

export function ConversionFunnel({ recommendations, clicks, addToCarts, purchases }: ConversionFunnelProps) {
  const stages = [
    { label: "ترشيح ظهر", value: recommendations, rate: 1, width: "100%" },
    { label: "نقر على المنتج", value: clicks, rate: clicks / recommendations, width: "72%" },
    { label: "إضافة إلى السلة", value: addToCarts, rate: addToCarts / recommendations, width: "50%" },
    { label: "شراء مؤكد", value: purchases, rate: purchases / recommendations, width: "30%" },
  ];
  return (
    <div aria-label="قمع تحويل توصيات المستشار" className="space-y-3" role="img">
      {stages.map((stage, index) => (
        <div className="grid grid-cols-[90px_1fr_58px] items-center gap-3 text-sm" key={stage.label}>
          <span className="text-muted-foreground">{stage.label}</span>
          <div className="flex h-10 items-center rounded-md bg-muted"><div className="flex h-full items-center justify-between rounded-md bg-primary px-3 text-primary-foreground" style={{ width: stage.width }}><span className="metric-numbers font-semibold">{formatNumber(stage.value)}</span>{index > 0 && <span className="hidden text-[10px] opacity-80 sm:inline">{formatPercent(stage.rate)}</span>}</div></div>
          <span className="metric-numbers text-end text-xs font-medium">{formatPercent(stage.rate)}</span>
        </div>
      ))}
      <p className="pt-2 text-xs text-muted-foreground">السطر الأخير يعتمد على طلبات مؤكدة من منصة المتجر في بيانات العرض، وليس على حدث متصفح فقط.</p>
    </div>
  );
}
