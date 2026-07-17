import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PricingContent } from "@/components/visibility-checker/pricing-content";
import { isPublicLocale } from "@/i18n/public";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isPublicLocale(locale)) return {};
  return {
    title: {
      absolute: locale === "ar" ? "الأسعار | بصيرة" : "Pricing | Basirah",
    },
    description:
      locale === "ar"
        ? "الفحص والتقرير المجاني من بصيرة، ثم خطط التنفيذ والتحسين المستمر للنمو والتجارة."
        : "Basirah's free check and full report, followed by Growth and Commerce implementation plans.",
    alternates: {
      canonical: `/${locale}/pricing`,
      languages: { ar: "/ar/pricing", en: "/en/pricing" },
    },
  };
}

export default async function PricingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isPublicLocale(locale)) notFound();
  return <PricingContent locale={locale} />;
}
