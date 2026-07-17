"use client";

import { FileDown, Loader2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PublicLocale } from "@/i18n/public";

import { apiErrorMessage, type ApiError } from "./types";

interface ReportLeadFormProps {
  locale: PublicLocale;
  scanToken: string;
}

export function ReportLeadForm({ locale, scanToken }: ReportLeadFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();
  const [marketingConsent, setMarketingConsent] = useState(false);
  const isAr = locale === "ar";

  async function submitLead(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(undefined);
    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch(
        `/api/v1/public/scans/${encodeURIComponent(scanToken)}/lead`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            email: formData.get("email"),
            marketingConsent,
            locale,
          }),
        },
      );
      const result = (await response.json().catch(() => ({}))) as {
        error?: string | ApiError;
        sharePath?: string;
      };
      if (!response.ok) {
        throw new Error(
          apiErrorMessage(
            result.error,
            isAr ? "تعذر فتح التقرير الآن." : "Could not unlock the report.",
          ),
        );
      }
      if (!result.sharePath?.startsWith(`/${locale}/report/`)) {
        throw new Error(
          isAr
            ? "تم حفظ التقرير، لكن تعذر فتح رابطه."
            : "The report was saved, but its link could not be opened.",
        );
      }
      window.location.assign(result.sharePath);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : isAr
            ? "تعذر فتح التقرير الآن."
            : "Could not unlock the report.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={submitLead}>
      <div className="space-y-2">
        <Label htmlFor="save-report-email">
          {isAr ? "البريد الإلكتروني" : "Email address"}
        </Label>
        <Input
          autoComplete="email"
          className="h-11 text-start"
          dir="ltr"
          id="save-report-email"
          inputMode="email"
          name="email"
          placeholder="name@company.com"
          required
          type="email"
        />
      </div>
      <div className="flex items-start gap-3">
        <Checkbox
          checked={marketingConsent}
          id="save-marketing-consent"
          onCheckedChange={(checked) => setMarketingConsent(checked === true)}
        />
        <Label
          className="font-normal leading-6 text-muted-foreground"
          htmlFor="save-marketing-consent"
        >
          {isAr
            ? "أوافق اختياريًا على نصائح وعروض بصيرة. فتح التقرير لا يتطلب هذه الموافقة."
            : "I optionally agree to Basirah tips and offers. Unlocking the report does not require this consent."}
        </Label>
      </div>
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      <Button className="h-11 w-full" disabled={submitting} type="submit">
        {submitting ? <Loader2 className="animate-spin" /> : <FileDown />}
        {submitting
          ? isAr
            ? "جارٍ تجهيز التقرير…"
            : "Preparing your report…"
          : isAr
            ? "افتح تقريري الكامل مجانًا"
            : "Unlock my full report free"}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        {isAr
          ? "بلا بطاقة · بلا حساب · رابط خاص صالح 30 يومًا"
          : "No card · no account · private link valid for 30 days"}
      </p>
    </form>
  );
}
