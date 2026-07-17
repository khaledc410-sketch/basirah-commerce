import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { MethodologyContent } from "@/components/visibility-checker/methodology-content";
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
          ? "منهجية فحص الظهور | بصيرة"
          : "Visibility check methodology | Basirah",
    },
    description:
      locale === "ar"
        ? "كيف تطبق بصيرة إرشادات Google Search الرسمية، وتفصل جاهزية الموقع عن اكتشاف Google والظهور المرصود."
        : "How Basirah applies official Google Search guidance while separating site readiness, Google discovery, and observed visibility.",
    alternates: {
      canonical: `/${locale}/methodology`,
      languages: { ar: "/ar/methodology", en: "/en/methodology" },
    },
  };
}

export default async function MethodologyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isPublicLocale(locale)) notFound();
  return <MethodologyContent locale={locale} />;
}
