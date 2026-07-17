import type { Metadata } from "next";
import { Geist_Mono, IBM_Plex_Sans_Arabic } from "next/font/google";
import { headers } from "next/headers";

import { AppProviders } from "@/components/app-providers";
import { getServerEnv } from "@/config/env";
import { normalizeAppOrigin } from "@/lib/site-url";

import "./globals.css";

const arabicSans = IBM_Plex_Sans_Arabic({
  variable: "--font-arabic-sans",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const fallbackOrigin = normalizeAppOrigin(getServerEnv().APP_URL);
  const forwardedHost = requestHeaders.get("x-forwarded-host")?.split(",")[0]?.trim();
  const directHost = requestHeaders.get("host")?.split(",")[0]?.trim();
  const host = forwardedHost || directHost;
  const forwardedProtocol = requestHeaders.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const protocol = forwardedProtocol === "http" ? "http" : "https";
  let requestOrigin = fallbackOrigin;
  if (host) {
    try {
      requestOrigin = normalizeAppOrigin(`${protocol}://${host}`);
    } catch {
      requestOrigin = fallbackOrigin;
    }
  }
  const socialImage = new URL("/og.png", requestOrigin).toString();

  return {
    metadataBase: new URL(requestOrigin),
    title: {
      default: "بصيرة — ظهور أوضح ومبيعات أذكى بالذكاء الاصطناعي",
      template: "%s | بصيرة",
    },
    description:
      "افحص جاهزية متجرك للظهور بالذكاء الاصطناعي، احصل على تقرير موثّق، وحوّل فجوات المحتوى وأسئلة العملاء إلى مقالات أفضل ومبيعات أذكى.",
    applicationName: "بصيرة",
    openGraph: {
      type: "website",
      title: "بصيرة — الظهور والمحتوى والمبيعات بالذكاء الاصطناعي",
      description: "تقرير موثّق، محتوى محسّن، ووكيل مبيعات عربي من بيانات متجرك.",
      images: [{ alt: "بصيرة للظهور والمحتوى والمبيعات بالذكاء الاصطناعي", height: 630, url: socialImage, width: 1200 }],
    },
    twitter: {
      card: "summary_large_image",
      title: "بصيرة — الظهور والمحتوى والمبيعات بالذكاء الاصطناعي",
      description: "تقرير موثّق، محتوى محسّن، ووكيل مبيعات عربي من بيانات متجرك.",
      images: [socialImage],
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = (await headers()).get("x-basirah-locale") === "en" ? "en" : "ar";
  const direction = locale === "ar" ? "rtl" : "ltr";

  return (
    <html
      lang={locale}
      dir={direction}
      data-scroll-behavior="smooth"
      className={`${arabicSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        <a
          className="sr-only z-[1000] rounded-md bg-primary px-4 py-3 text-primary-foreground focus:not-sr-only focus:fixed focus:start-4 focus:top-4"
          href="#main-content"
        >
          {locale === "ar" ? "انتقل إلى المحتوى الرئيسي" : "Skip to main content"}
        </a>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
