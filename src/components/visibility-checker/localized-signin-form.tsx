"use client";

import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, LockKeyhole } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PublicLocale } from "@/i18n/public";

interface LocalizedSigninFormProps {
  locale: PublicLocale;
  nextPath?: string;
}

export function LocalizedSigninForm({ locale, nextPath }: LocalizedSigninFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string>();
  const Arrow = locale === "ar" ? ArrowLeft : ArrowRight;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    setSubmitting(true);
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") || "").trim();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError(locale === "ar" ? "اكتب بريدًا إلكترونيًا صحيحًا." : "Enter a valid email address.");
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, next: nextPath }),
      });
      const result = (await response.json().catch(() => ({}))) as { error?: string; redirectTo?: string };
      if (!response.ok) throw new Error(result.error || (locale === "ar" ? "تعذر إرسال رابط الدخول." : "Could not send the sign-in link."));
      if (result.redirectTo) {
        router.push(result.redirectTo);
        return;
      }
      setSent(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : locale === "ar" ? "تعذر الاتصال بالخادم." : "Could not connect to the server.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="space-y-5" noValidate onSubmit={submit}>
      <div className="space-y-2">
        <Label htmlFor="signin-email">{locale === "ar" ? "البريد الإلكتروني" : "Email address"}</Label>
        <Input
          autoComplete="email"
          className="h-12 text-start"
          dir="ltr"
          id="signin-email"
          inputMode="email"
          name="email"
          placeholder="name@example.com"
          required
          type="email"
        />
      </div>
      {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
      {sent && (
        <div className="rounded-xl bg-success-soft p-4 text-sm text-success" role="status">
          <CheckCircle2 className="mb-2 size-5" />
          {locale === "ar" ? "أرسلنا رابط دخول قصير الصلاحية. افتح بريدك لإكمال الدخول." : "We sent a short-lived sign-in link. Open your inbox to continue."}
        </div>
      )}
      <Button className="h-12 w-full text-base" disabled={submitting || sent} type="submit">
        {submitting ? <Loader2 className="animate-spin" /> : <Arrow />}
        {sent
          ? locale === "ar"
            ? "تم إرسال الرابط"
            : "Link sent"
          : locale === "ar"
            ? "إرسال رابط دخول آمن"
            : "Send secure sign-in link"}
      </Button>
      <p className="flex items-start gap-2 text-xs text-muted-foreground">
        <LockKeyhole className="mt-0.5 size-4 shrink-0 text-primary" />
        {locale === "ar" ? "لن نطلب كلمة مرور متجر سلة أو زد." : "We will never ask for your Salla or Zid password."}
      </p>
    </form>
  );
}
