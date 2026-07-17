"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpLeft,
  Bot,
  Check,
  ChevronDown,
  CircleUserRound,
  Loader2,
  Send,
  ShoppingBag,
  UserRound,
} from "lucide-react";
import { useState, type CSSProperties } from "react";
import { toast } from "sonner";

import { MessageResponse } from "@/components/ai-elements/message";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  defaultAdvisorBrandSettings,
  getReadableTextColor,
  isHexColor,
  type AdvisorBrandSettings,
} from "@/components/widget/brand-settings";
import type { UnifiedProduct } from "@/core/commerce/types";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

interface AdvisorResponse {
  conversationId: string;
  intent: string;
  assistantText: string;
  products: Array<UnifiedProduct & { reason: string; score: number }>;
  safety: { status: "allowed" | "restricted"; reason?: string };
}

interface Turn {
  id: string;
  question: string;
  answer?: AdvisorResponse;
}

interface CustomerAdvisorWidgetProps {
  brandSettings?: AdvisorBrandSettings;
  compact?: boolean;
}

const widgetCornerClasses = {
  soft: "rounded-xl",
  rounded: "rounded-[24px]",
  "extra-rounded": "rounded-[32px]",
} as const;

const bubbleCornerClasses = {
  soft: "rounded-xl",
  rounded: "rounded-2xl",
  "extra-rounded": "rounded-3xl",
} as const;

export function CustomerAdvisorWidget({ brandSettings, compact = false }: CustomerAdvisorWidgetProps) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [handoffRequested, setHandoffRequested] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const sessionId = "demo-widget-session";
  const brand = {
    ...defaultAdvisorBrandSettings,
    ...brandSettings,
    suggestedPrompts:
      brandSettings?.suggestedPrompts.length
        ? brandSettings.suggestedPrompts
        : defaultAdvisorBrandSettings.suggestedPrompts,
  };
  const primaryColor = isHexColor(brand.primaryColor)
    ? brand.primaryColor
    : defaultAdvisorBrandSettings.primaryColor;
  const accentColor = isHexColor(brand.accentColor)
    ? brand.accentColor
    : defaultAdvisorBrandSettings.accentColor;
  const primaryForeground = getReadableTextColor(primaryColor);
  const accentForeground = getReadableTextColor(accentColor);
  const logoDataUrl = brand.logoDataUrl?.startsWith("data:image/") ? brand.logoDataUrl : undefined;
  const brandStyle = {
    "--advisor-primary": primaryColor,
    "--advisor-primary-foreground": primaryForeground,
    "--advisor-accent": accentColor,
    "--advisor-accent-foreground": accentForeground,
  } as CSSProperties;

  async function ask(question: string) {
    const trimmed = question.trim();
    if (trimmed.length < 2 || pending) return;
    const id = crypto.randomUUID();
    setTurns((current) => [...current, { id, question: trimmed }]);
    setInput("");
    setPending(true);
    setAnnouncement("جارٍ التحقق من المنتجات المتاحة والملاءمة.");
    try {
      const response = await fetch("/api/advisor", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: trimmed, sessionId }),
      });
      if (!response.ok) throw new Error("advisor_request_failed");
      const answer = (await response.json()) as AdvisorResponse;
      setTurns((current) => current.map((turn) => (turn.id === id ? { ...turn, answer } : turn)));
      setAnnouncement("وصل رد المستشار مع النتائج المتاحة.");
    } catch {
      toast.error("تعذر الوصول للمستشار", { description: "تحقق من الاتصال ثم أعد المحاولة." });
      setTurns((current) => current.filter((turn) => turn.id !== id));
      setAnnouncement("تعذر الوصول للمستشار. تحقق من الاتصال ثم أعد المحاولة.");
    } finally {
      setPending(false);
    }
  }

  async function recordAction(
    type: "product_clicked" | "product_added_to_cart",
    productId: string,
    conversationId: string,
  ) {
    await fetch("/api/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        idempotencyKey: `${conversationId}:${type}:${productId}`,
        sessionId,
        conversationId,
        productId,
        type,
        consentState: "analytics",
      }),
    });
    toast.success(type === "product_clicked" ? "سُجّل فتح المنتج" : "أضيف للسلة في وضع العرض", {
      description: "سيظهر الحدث في تفاصيل المحادثة ولوحة التاجر.",
    });
  }

  return (
    <section
      aria-label={`معاينة ${brand.advisorName}`}
      className={cn(
        "flex w-full flex-col overflow-hidden border bg-card shadow-xl",
        widgetCornerClasses[brand.cornerStyle],
        minimized
          ? "h-auto"
          : compact
            ? "h-[560px]"
            : "h-[680px] max-h-[calc(100dvh-2rem)]",
      )}
      data-launcher-position={brand.launcherPosition}
      style={brandStyle}
    >
      <header className="flex min-h-18 items-center justify-between gap-3 border-b border-black/10 bg-[var(--advisor-primary)] px-4 text-[var(--advisor-primary-foreground)]">
        <div className="flex min-w-0 items-center gap-3">
          <span className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/95 text-[var(--advisor-primary)]">
            {logoDataUrl ? (
              <Image
                alt={`شعار ${brand.storeName}`}
                className="size-full object-contain p-1"
                height={44}
                src={logoDataUrl}
                unoptimized
                width={44}
              />
            ) : (
              <Bot className="size-5" />
            )}
            <span className="absolute -bottom-0.5 -end-0.5 size-3 rounded-full border-2 border-white bg-success" />
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold">{brand.advisorName}</h2>
            <p className="truncate text-xs opacity-75">مساعدك الشخصي في {brand.storeName}</p>
          </div>
        </div>
        <Button
          aria-expanded={!minimized}
          aria-label={minimized ? "توسيع نافذة المستشار" : "تصغير نافذة المستشار"}
          className="size-11 shrink-0 text-current hover:bg-black/10 hover:text-current"
          onClick={() => setMinimized((current) => !current)}
          size="icon"
          type="button"
          variant="ghost"
        >
          <ChevronDown className={cn("size-5 transition-transform", minimized && "rotate-180")} />
        </Button>
      </header>

      {!minimized && (
        <>
          <p aria-live="polite" className="sr-only" role="status">
            {announcement}
          </p>
          <div className="flex-1 space-y-5 overflow-y-auto p-4">
            <div
              className={cn(
                "rounded-se-sm bg-[var(--advisor-accent)] p-4 text-sm text-[var(--advisor-accent-foreground)]",
                bubbleCornerClasses[brand.cornerStyle],
              )}
            >
              <p>{brand.welcomeMessage}</p>
            </div>

            {turns.length === 0 && (
              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground">ابدأ من هنا</p>
                <div className="flex flex-wrap gap-2">
                  {brand.suggestedPrompts.map((suggestion) => (
                    <button
                      className="min-h-11 rounded-full border bg-card px-3 text-xs font-medium text-[var(--advisor-primary)] transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                      key={suggestion}
                      onClick={() => void ask(suggestion)}
                      style={{ borderColor: "var(--advisor-primary)" }}
                      type="button"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {turns.map((turn) => (
              <div className="space-y-4" key={turn.id}>
                <div className="ms-auto flex max-w-[88%] items-end justify-end gap-2">
                  <div
                    className={cn(
                      "rounded-ee-sm bg-[var(--advisor-primary)] px-4 py-3 text-sm text-[var(--advisor-primary-foreground)]",
                      bubbleCornerClasses[brand.cornerStyle],
                    )}
                  >
                    {turn.question}
                  </div>
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary">
                    <UserRound className="size-4" />
                  </span>
                </div>
                {turn.answer ? (
                  <div className="space-y-3">
                    <div className="flex max-w-[95%] items-start gap-2">
                      <span className="mt-1 flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-[var(--advisor-primary)]">
                        <Bot className="size-4" />
                      </span>
                      <div
                        className={cn(
                          "min-w-0 rounded-es-sm bg-muted p-4 text-sm",
                          bubbleCornerClasses[brand.cornerStyle],
                        )}
                      >
                        <MessageResponse>{turn.answer.assistantText}</MessageResponse>
                        {turn.answer.safety.status === "restricted" && (
                          <Badge className="mt-3" variant="outline">
                            تدخلت سياسة السلامة
                          </Badge>
                        )}
                      </div>
                    </div>
                    {turn.answer.products.map((product, index) => (
                      <article className="overflow-hidden rounded-2xl border bg-card" key={product.id}>
                        <div className="grid grid-cols-[96px_1fr] gap-3 p-3">
                          <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
                            <Image
                              alt={`صورة ${product.name.ar}`}
                              className="object-cover"
                              fill
                              sizes="96px"
                              src={product.imageUrl}
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="text-sm font-semibold">{product.name.ar}</h3>
                              {index === 0 && (
                                <Badge
                                  className="shrink-0 border-transparent bg-[var(--advisor-accent)] text-[var(--advisor-accent-foreground)]"
                                >
                                  الأنسب
                                </Badge>
                              )}
                            </div>
                            <p className="metric-numbers mt-1 font-semibold">
                              {formatCurrency(product.price.amount)}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">{product.reason}</p>
                            <p className="mt-2 flex items-center gap-1 text-[11px] text-success">
                              <Check className="size-3" />متوفر · {product.stock} قطعة
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 border-t">
                          <Button
                            asChild
                            className="min-h-11 rounded-none border-0 text-[var(--advisor-primary)]"
                            variant="ghost"
                          >
                            <Link
                              href={product.productUrl}
                              onClick={() =>
                                void recordAction("product_clicked", product.id, turn.answer!.conversationId)
                              }
                            >
                              عرض المنتج<ArrowUpLeft />
                            </Link>
                          </Button>
                          <Button
                            className="min-h-11 rounded-none border-0 border-s bg-[var(--advisor-primary)] text-[var(--advisor-primary-foreground)] hover:opacity-90"
                            onClick={() =>
                              void recordAction("product_added_to_cart", product.id, turn.answer!.conversationId)
                            }
                            variant="ghost"
                          >
                            <ShoppingBag />أضف للسلة
                          </Button>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" />أتحقق من الملاءمة والتوفر…
                  </div>
                )}
              </div>
            ))}
          </div>

          <footer className="border-t bg-card p-3">
            <form
              className="flex gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                void ask(input);
              }}
            >
              <Input
                aria-label="اكتب سؤالك"
                className="h-11"
                disabled={pending}
                maxLength={500}
                onChange={(event) => setInput(event.target.value)}
                placeholder="اكتب سؤالك هنا…"
                value={input}
              />
              <Button
                aria-label="إرسال السؤال"
                className="size-11 bg-[var(--advisor-primary)] text-[var(--advisor-primary-foreground)] hover:opacity-90"
                disabled={pending || input.trim().length < 2}
                size="icon"
                type="submit"
              >
                <Send />
              </Button>
            </form>
            <div className="mt-2 flex items-center justify-between gap-2">
              <button
                className="flex min-h-11 items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground disabled:opacity-60"
                disabled={handoffRequested}
                onClick={() => {
                  setHandoffRequested(true);
                  toast.success("تم طلب المساعدة البشرية", {
                    description: "في الإنتاج تُطلب وسيلة التواصل بموافقة واضحة.",
                  });
                }}
                type="button"
              >
                {handoffRequested ? <Check className="size-3.5" /> : <CircleUserRound className="size-3.5" />}
                {handoffRequested ? "تم طلب المساعدة" : "تحدث مع شخص"}
              </button>
              <span className="text-[10px] text-muted-foreground">وضع العرض · سياسة الخصوصية</span>
            </div>
          </footer>
        </>
      )}
    </section>
  );
}
