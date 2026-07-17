import { Eye, MessageCircleMore, PanelBottom } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getReadableTextColor,
  type AdvisorBrandSettings,
} from "@/components/widget/brand-settings";
import { CustomerAdvisorWidget } from "@/components/widget/customer-advisor-widget";
import { cn } from "@/lib/utils";

interface WidgetPreviewProps {
  settings: AdvisorBrandSettings;
}

export function WidgetPreview({ settings }: WidgetPreviewProps) {
  const [view, setView] = useState<"chat" | "launcher">("chat");
  const primaryForeground = getReadableTextColor(settings.primaryColor);

  return (
    <Card className="lg:sticky lg:top-6 lg:h-fit">
      <CardHeader className="border-b">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2"><Eye className="size-4" />معاينة حية</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">كل تعديل يظهر هنا قبل الحفظ.</p>
          </div>
          <Badge variant="secondary">عرض فقط</Badge>
        </div>
        <div aria-label="نوع المعاينة" className="mt-3 grid grid-cols-2 gap-2" role="group">
          <Button
            aria-pressed={view === "chat"}
            className="min-h-11"
            onClick={() => setView("chat")}
            type="button"
            variant={view === "chat" ? "default" : "outline"}
          >
            <MessageCircleMore />المحادثة
          </Button>
          <Button
            aria-pressed={view === "launcher"}
            className="min-h-11"
            onClick={() => setView("launcher")}
            type="button"
            variant={view === "launcher" ? "default" : "outline"}
          >
            <PanelBottom />زر الإطلاق
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {view === "chat" ? (
          <CustomerAdvisorWidget brandSettings={settings} />
        ) : (
          <div className="relative min-h-[560px] overflow-hidden rounded-2xl border bg-muted/40 p-5 sm:p-7">
            <div className="flex items-center justify-between rounded-xl border bg-card p-4 shadow-sm">
              <div>
                <p className="text-xs text-muted-foreground">واجهة متجر تجريبية</p>
                <p className="mt-1 font-semibold">{settings.storeName}</p>
              </div>
              <div className="h-9 w-24 rounded-lg bg-muted" />
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {["أ", "ب"].map((item) => (
                <div className="rounded-xl border bg-card p-3" key={item}>
                  <div className="aspect-[4/3] rounded-lg bg-muted" />
                  <div className="mt-3 h-3 w-3/4 rounded-full bg-muted" />
                  <div className="mt-2 h-3 w-1/3 rounded-full bg-muted" />
                </div>
              ))}
            </div>
            <p className="mt-6 max-w-sm text-sm leading-6 text-muted-foreground">
              يظهر زر المستشار في أسفل الشاشة حسب الجهة التي يختارها التاجر، بعيدًا عن عناصر الشراء الأساسية.
            </p>
            <button
              aria-label={`فتح ${settings.advisorName}`}
              className={cn(
                "absolute bottom-5 flex size-14 items-center justify-center rounded-full shadow-lg transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                settings.launcherPosition === "right" ? "right-5" : "left-5",
              )}
              onClick={() => setView("chat")}
              style={{ backgroundColor: settings.primaryColor, color: primaryForeground }}
              type="button"
            >
              <MessageCircleMore className="size-6" />
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
