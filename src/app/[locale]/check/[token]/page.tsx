import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CheckerExperience } from "@/components/visibility-checker/checker-experience";
import { isPublicLocale } from "@/i18n/public";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: {
      absolute: locale === "ar" ? "نتيجة فحص الظهور | بصيرة" : "Visibility check | Basirah",
    },
    robots: { index: false, follow: false },
  };
}

export default async function CheckPage({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  const { locale, token } = await params;
  if (!isPublicLocale(locale) || !token) notFound();

  return (
    <main className="py-12 sm:py-16" id="main-content">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <CheckerExperience locale={locale} token={token} />
      </div>
    </main>
  );
}
