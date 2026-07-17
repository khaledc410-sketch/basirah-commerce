import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { LandingV2 } from "@/components/visibility-checker/landing-v2/landing-v2";
import { isPublicLocale } from "@/i18n/public";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isPublicLocale(locale)) return {};
  return {
    title:
      locale === "ar"
        ? "معاينة الصفحة الجديدة — بصيرة"
        : "New landing preview — Basirah",
    robots: { index: false, follow: false },
  };
}

export default async function LandingV2Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isPublicLocale(locale)) notFound();
  return <LandingV2 locale={locale} />;
}
