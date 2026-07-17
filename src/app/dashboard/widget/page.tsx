import type { Metadata } from "next";
import { CheckCircle2, Eye, MessageCircleMore, ShieldCheck } from "lucide-react";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BrandStudio } from "@/components/widget/brand-studio";
import { ProductionFeatureState } from "@/components/dashboard/production-feature-state";
import { isDemoMode } from "@/config/env";

export const metadata: Metadata = { title: "مستشار العملاء" };

export default function WidgetPage() {
  if (!isDemoMode()) return <ProductionFeatureState title="واجهة المستشار غير منشورة" description="الكتالوج الحي متاح للوحة التاجر، لكن واجهة العميل تحتاج تثبيتًا موقّعًا وموافقة وقيود سلامة قبل النشر." />;
  return (
    <>
      <DashboardHeader
        actions={<Button variant="outline"><Eye />معاينة المتجر</Button>}
        description="خصص هوية المستشار وبداية المحادثة، ثم اختبر رحلة الاختيار والقيود قبل أي نشر."
        title="مستشار العملاء"
      />
      <div className="mx-auto max-w-[1440px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle>الحالة والإطلاق</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">المستشار في وضع الاختبار ولا يظهر في متجر حقيقي.</p>
              </div>
              <Badge className="gap-1.5" variant="outline">
                <span className="size-2 rounded-full bg-warning" />وضع الاختبار
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            {[
              { icon: CheckCircle2, label: "المعرفة", value: "3 منتجات جاهزة" },
              { icon: ShieldCheck, label: "السلامة", value: "سياسة الجمال مفعلة" },
              { icon: MessageCircleMore, label: "الاختبارات", value: "5 من 5 مكتملة" },
            ].map((item) => (
              <div className="rounded-xl bg-muted/50 p-4" key={item.label}>
                <item.icon className="size-5 text-primary" />
                <p className="mt-3 text-xs text-muted-foreground">{item.label}</p>
                <p className="mt-1 text-sm font-semibold">{item.value}</p>
              </div>
            ))}
          </CardContent>
        </Card>
        <BrandStudio />
      </div>
    </>
  );
}
