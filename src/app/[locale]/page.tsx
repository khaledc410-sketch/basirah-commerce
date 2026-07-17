import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { MarketingHome } from "@/components/visibility-checker/marketing-home";
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
      absolute:
        locale === "ar"
          ? "عملاؤك يسألون الذكاء الاصطناعي قبل أن يشتروا — هل متجرك ضمن الإجابة؟ | بصيرة"
          : "Your customers ask AI before they buy—is your store part of the answer? | Basirah",
    },
    alternates: {
      canonical: `/${locale}`,
      languages: { ar: "/ar", en: "/en" },
    },
  };
}

export default async function LocalizedHomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isPublicLocale(locale)) notFound();
  return <MarketingHome locale={locale} />;
}
