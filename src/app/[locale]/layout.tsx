import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { notFound } from "next/navigation";

import { PublicShell } from "@/components/visibility-checker/public-shell";
import {
  getPublicDirection,
  isPublicLocale,
  publicLocales,
  publicMessages,
} from "@/i18n/public";

export function generateStaticParams() {
  return publicLocales.map((locale) => ({ locale }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isPublicLocale(locale)) return {};

  return {
    title: {
      default:
        locale === "ar"
          ? "بصيرة — فاحص ظهور المتاجر بالذكاء الاصطناعي"
          : "Basirah — AI visibility checker for Arabic commerce",
      template: locale === "ar" ? "%s | بصيرة" : "%s | Basirah",
    },
    description:
      locale === "ar"
        ? "افحص جاهزية متجرك للظهور في Google وChatGPT وGemini بأدلة موثّقة، واحصل على تقرير عربي وخطة إصلاح، ووكيل مبيعات يجيب عملاءك من بيانات متجرك فقط — دون وعود بالترتيب."
        : "Check how ready your store is to be understood by Google, ChatGPT, and Gemini—with evidence—then get an Arabic report, a repair plan, and a sales agent that answers customers from your store data only. No ranking promises.",
    alternates: {
      languages: { ar: "/ar", en: "/en" },
    },
  };
}

export default async function PublicLocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isPublicLocale(locale)) notFound();

  return (
    <NextIntlClientProvider locale={locale} messages={publicMessages[locale]}>
      <div dir={getPublicDirection(locale)} lang={locale}>
        <PublicShell locale={locale}>{children}</PublicShell>
      </div>
    </NextIntlClientProvider>
  );
}
