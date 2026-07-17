"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, CheckCircle2, Loader2, LockKeyhole } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  email: z.string().email("اكتب بريدًا إلكترونيًا صحيحًا."),
});

type SigninValues = z.infer<typeof schema>;

export function SigninForm({ nextPath }: { nextPath?: string }) {
  const router = useRouter();
  const [submitted, setSubmitted] = useState(false);
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState<string>();
  const form = useForm<SigninValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "owner@mada-demo.sa" },
  });

  async function onSubmit(values: SigninValues) {
    setSubmitted(true);
    setServerError(undefined);
    try {
      const response = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...values, next: nextPath }),
      });
      const result = (await response.json()) as {
        error?: string;
        redirectTo?: string;
      };
      if (!response.ok) {
        setServerError(result.error ?? "تعذر إرسال رابط الدخول الآن.");
        return;
      }
      if (result.redirectTo) {
        router.push(result.redirectTo);
        return;
      }
      setSent(true);
    } catch {
      setServerError("تعذر الاتصال بالخادم. تحقق من الشبكة وأعد المحاولة.");
    } finally {
      setSubmitted(false);
    }
  }

  return (
    <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <div className="space-y-2">
        <Label htmlFor="email">البريد الإلكتروني</Label>
        <Input
          autoComplete="email"
          className="h-12 bg-background text-start"
          dir="ltr"
          id="email"
          inputMode="email"
          {...form.register("email")}
        />
        {form.formState.errors.email && (
          <p className="text-sm text-destructive" role="alert">
            {form.formState.errors.email.message}
          </p>
        )}
      </div>
      {serverError && <p className="text-sm text-destructive" role="alert">{serverError}</p>}
      {sent && (
        <p className="rounded-lg bg-success-soft p-4 text-sm text-success" role="status">
          أرسلنا رابط دخول قصير الصلاحية. افتح بريدك لإكمال تسجيل الدخول.
        </p>
      )}
      <Button className="h-12 w-full" disabled={submitted || sent} type="submit">
        {submitted ? <Loader2 className="animate-spin" /> : <ArrowLeft />}
        {sent ? "تم إرسال الرابط" : "إرسال رابط دخول آمن"}
      </Button>
      <div className="flex items-start gap-3 rounded-lg bg-muted p-4 text-sm text-muted-foreground">
        <LockKeyhole className="mt-0.5 size-4 shrink-0 text-primary" />
        <p>في العرض ننتقل مباشرة. في الإنتاج نرسل رابطًا أحادي الاستخدام ونحفظ الجلسة في ملفات ارتباط آمنة.</p>
      </div>
      <p className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <CheckCircle2 className="size-3.5 text-success" />
        لن نطلب كلمة مرور متجر سلة أو زد.
      </p>
    </form>
  );
}
