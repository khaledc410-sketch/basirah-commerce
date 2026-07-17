import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SharedReportExperience } from "@/components/visibility-checker/shared-report-experience";
import { isPublicLocale } from "@/i18n/public";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: {
      absolute:
        locale === "ar" ? "تقرير الظهور المشترك | بصيرة" : "Shared visibility report | Basirah",
    },
    robots: { index: false, follow: false },
  };
}

export default async function SharedReportPage({
  params,
}: {
  params: Promise<{ locale: string; shareToken: string }>;
}) {
  const { locale, shareToken } = await params;
  if (!isPublicLocale(locale) || !shareToken) notFound();

  return (
    <main className="py-12 sm:py-16" id="main-content">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SharedReportExperience locale={locale} shareToken={shareToken} />
      </div>
    </main>
  );
}
