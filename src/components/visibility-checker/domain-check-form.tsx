"use client";

import { ArrowLeft, ArrowRight, Loader2, SearchCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { publicPath, type PublicLocale } from "@/i18n/public";

import { apiErrorMessage, type ApiError, type CreateScanResponse } from "./types";

interface DomainCheckFormProps {
  locale: PublicLocale;
}

function normalizeDomainInput(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export function DomainCheckForm({ locale }: DomainCheckFormProps) {
  const router = useRouter();
  const [domain, setDomain] = useState("");
  const [error, setError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const Arrow = locale === "ar" ? ArrowLeft : ArrowRight;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);

    const normalizedDomain = normalizeDomainInput(domain);
    try {
      const url = new URL(normalizedDomain);
      if (!url.hostname.includes(".")) throw new Error("invalid");
    } catch {
      setError(
        locale === "ar"
          ? "اكتب نطاق متجر صحيحًا، مثل store.example.com"
          : "Enter a valid store domain, such as store.example.com",
      );
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/v1/public/scans", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          domain: normalizedDomain,
          locale,
          countryCode: "SA",
        }),
      });
      const result = (await response.json().catch(() => ({}))) as Partial<CreateScanResponse> & {
        error?: string | ApiError;
        token?: string;
      };
      if (!response.ok) {
        throw new Error(
          apiErrorMessage(
            result.error,
            locale === "ar" ? "تعذر بدء الفحص." : "Unable to start the check.",
          ),
        );
      }
      const token = result.scan?.token ?? result.token;
      if (!token) throw new Error(locale === "ar" ? "لم يُرجع الخادم رمز الفحص." : "The server did not return a check token.");
      router.push(publicPath(locale, `/check/${encodeURIComponent(token)}`));
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : locale === "ar"
            ? "تعذر الاتصال بالخادم. أعد المحاولة."
            : "Could not connect to the server. Try again.",
      );
      setSubmitting(false);
    }
  }

  return (
    <form className="space-y-3" noValidate onSubmit={handleSubmit}>
      <Label className="sr-only" htmlFor="store-domain">
        {locale === "ar" ? "نطاق المتجر" : "Store domain"}
      </Label>
      <div className="flex flex-col gap-3 rounded-2xl border bg-card p-2 shadow-lg shadow-primary/5 sm:flex-row">
        <div className="relative flex-1">
          <SearchCheck
            aria-hidden="true"
            className="absolute start-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            aria-describedby={error ? "store-domain-error" : "store-domain-help"}
            aria-invalid={Boolean(error)}
            autoCapitalize="none"
            autoComplete="url"
            className="h-13 border-0 bg-transparent ps-12 text-start shadow-none focus-visible:ring-0"
            dir="ltr"
            id="store-domain"
            inputMode="url"
            onChange={(event) => setDomain(event.target.value)}
            placeholder="store.example.com"
            spellCheck={false}
            value={domain}
          />
        </div>
        <Button className="h-13 px-6 text-base" disabled={submitting} type="submit">
          {submitting ? <Loader2 className="animate-spin" /> : <Arrow />}
          {submitting
            ? locale === "ar"
              ? "نبدأ الفحص…"
              : "Starting…"
            : locale === "ar"
              ? "افحص الظهور مجانًا"
              : "Check visibility free"}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground" id="store-domain-help">
        {locale === "ar"
          ? "لا حساب ولا بريد. نفحص حتى 10 صفحات عامة ونبني درجة حتمية موثّقة."
          : "No account or email. We check up to 10 public pages and calculate an evidence-based score."}
      </p>
      {error && (
        <p className="text-sm font-medium text-destructive" id="store-domain-error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
