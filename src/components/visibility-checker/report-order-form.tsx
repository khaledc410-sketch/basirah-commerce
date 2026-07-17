"use client";

import { CheckCircle2, FileText, Loader2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PublicLocale } from "@/i18n/public";

import { apiErrorMessage, type ApiError } from "./types";

interface ReportOrderFormProps {
  locale: PublicLocale;
  reportId: string;
}

export function ReportOrderForm({ locale, reportId }: ReportOrderFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState<string>();
  const [marketingConsent, setMarketingConsent] = useState(false);

  async function submitOrder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    setSubmitting(true);
    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch(`/api/v1/reports/${encodeURIComponent(reportId)}/orders`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          email: formData.get("email"),
          phone: formData.get("phone"),
          marketingConsent,
          locale,
        }),
      });
      const result = (await response.json().catch(() => ({}))) as {
        error?: string | ApiError;
      };
      if (!response.ok) {
        throw new Error(
          apiErrorMessage(
            result.error,
            locale === "ar"
              ? "تعذر إنشاء الطلب الآن. أعد المحاولة أو تواصل معنا."
              : "We could not create the order. Try again or contact us.",
          ),
        );
      }
      setComplete(true);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : locale === "ar"
            ? "تعذر إنشاء الطلب الآن."
            : "We could not create the order.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (complete) {
    return (
      <div className="rounded-xl bg-success-soft p-5 text-success" role="status">
        <CheckCircle2 className="size-6" />
        <p className="mt-3 font-semibold">
          {locale === "ar" ? "تم إنشاء طلب التقرير" : "Your report order is created"}
        </p>
        <p className="mt-1 text-sm">
          {locale === "ar"
            ? "سيتواصل معك الفريق برابط الدفع أو الفاتورة. لن نعرض لك عملية دفع وهمية."
            : "The team will send a payment link or invoice. We never show a fake checkout."}
        </p>
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={submitOrder}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="report-name">{locale === "ar" ? "الاسم" : "Name"}</Label>
          <Input autoComplete="name" className="h-11" id="report-name" name="name" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="report-email">{locale === "ar" ? "البريد الإلكتروني" : "Email"}</Label>
          <Input
            autoComplete="email"
            className="h-11 text-start"
            dir="ltr"
            id="report-email"
            inputMode="email"
            name="email"
            required
            type="email"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="report-phone">{locale === "ar" ? "رقم الجوال" : "Mobile number"}</Label>
        <Input
          autoComplete="tel"
          className="h-11 text-start"
          dir="ltr"
          id="report-phone"
          inputMode="tel"
          name="phone"
          placeholder="+966 5X XXX XXXX"
          required
          type="tel"
        />
      </div>
      <div className="flex items-start gap-3">
        <Checkbox
          checked={marketingConsent}
          id="marketing-consent"
          onCheckedChange={(checked) => setMarketingConsent(checked === true)}
        />
        <Label className="font-normal leading-6 text-muted-foreground" htmlFor="marketing-consent">
          {locale === "ar"
            ? "أوافق اختياريًا على استلام نصائح وعروض بصيرة. لا تؤثر هذه الموافقة على طلب التقرير."
            : "I optionally agree to receive Basirah tips and offers. This does not affect my report order."}
        </Label>
      </div>
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      <Button className="h-12 w-full text-base" disabled={submitting} type="submit">
        {submitting ? <Loader2 className="animate-spin" /> : <FileText />}
        {submitting
          ? locale === "ar"
            ? "جارٍ إنشاء الطلب…"
            : "Creating order…"
          : locale === "ar"
            ? "اطلب التقرير العربي — 399 ر.س"
            : "Order the in-depth report — SAR 399"}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        {locale === "ar"
          ? "السعر قبل الضريبة. ينشأ طلب بحالة انتظار الدفع ويتواصل معك الفريق."
          : "Price excludes VAT. We create a pending-payment order and the team follows up."}
      </p>
    </form>
  );
}
