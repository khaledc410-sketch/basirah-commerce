import type { Metadata } from "next";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { notFound } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LocalizedSigninForm } from "@/components/visibility-checker/localized-signin-form";
import { safeInternalPath } from "@/core/security/request";
import { isPublicLocale } from "@/i18n/public";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: {
      absolute: locale === "ar" ? "تسجيل الدخول | بصيرة" : "Sign in | Basirah",
    },
    robots: { index: false },
  };
}

export default async function LocalizedSigninPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string | string[]; next?: string | string[] }>;
}) {
  const { locale } = await params;
  if (!isPublicLocale(locale)) notFound();
  const query = await searchParams;
  const error = typeof query.error === "string" ? query.error : undefined;
  const nextPath = safeInternalPath(typeof query.next === "string" ? query.next : undefined) ?? undefined;
  const isAr = locale === "ar";

  return (
    <main className="grid min-h-[calc(100dvh-4.5rem)] lg:grid-cols-2" id="main-content">
      <section className="flex items-center justify-center px-5 py-12 sm:px-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <p className="text-sm font-semibold text-primary">{isAr ? "مرحبًا بعودتك" : "Welcome back"}</p>
            <CardTitle className="mt-2 text-3xl">{isAr ? "ادخل إلى مساحة متجرك" : "Sign in to your store workspace"}</CardTitle>
            <p className="mt-2 text-muted-foreground">
              {isAr
                ? "احفظ تقاريرك، تابع الإصلاحات، وأنشئ المحتوى من الأدلة."
                : "Save reports, track fixes, and create content from evidence."}
            </p>
          </CardHeader>
          <CardContent>
            {error && (
              <p className="mb-4 rounded-xl bg-destructive/10 p-4 text-sm text-destructive" role="alert">
                {error === "auth_configuration"
                  ? isAr
                    ? "إعدادات الدخول الإنتاجية غير مكتملة."
                    : "Production authentication is not configured."
                  : isAr
                    ? "تعذر التحقق من رابط الدخول أو انتهت صلاحيته."
                    : "The sign-in link is invalid or expired."}
              </p>
            )}
            <LocalizedSigninForm locale={locale} nextPath={nextPath} />
          </CardContent>
        </Card>
      </section>
      <aside className="relative hidden overflow-hidden bg-foreground p-12 text-background lg:flex lg:flex-col lg:justify-between">
        <div className="subtle-grid absolute inset-0 opacity-15" />
        <div className="relative max-w-xl">
          <ShieldCheck className="size-10 text-primary" />
          <h1 className="mt-8 text-4xl font-semibold leading-tight">
            {isAr ? "التقرير يبدأ بالدليل، والتنفيذ يبقى تحت سيطرتك." : "Reports start with evidence, and execution stays under your control."}
          </h1>
          <p className="mt-5 text-lg text-background/70">
            {isAr
              ? "الدرجات حتمية، القيم غير المتاحة لا تصبح صفرًا، ولا ننشر محتوى أو نفعّل وكيل المبيعات دون متطلبات واضحة."
              : "Scores are deterministic, unavailable values never become zero, and content or the sales agent only activate with explicit requirements."}
          </p>
        </div>
        <ul className="relative space-y-4">
          {[
            isAr ? "عزل بيانات كل متجر" : "Tenant-isolated store data",
            isAr ? "مصدر لكل ادعاء في المحتوى" : "A source for every content claim",
            isAr ? "مراجعة قبل أي نشر" : "Review before any publishing",
          ].map((item) => (
            <li className="flex items-center gap-3" key={item}>
              <CheckCircle2 className="size-5 text-primary" />
              {item}
            </li>
          ))}
        </ul>
      </aside>
    </main>
  );
}
