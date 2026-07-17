export const publicLocales = ["ar", "en"] as const;

export type PublicLocale = (typeof publicLocales)[number];

export function isPublicLocale(value: string): value is PublicLocale {
  return publicLocales.includes(value as PublicLocale);
}

export function getPublicDirection(locale: PublicLocale) {
  return locale === "ar" ? "rtl" : "ltr";
}

export function publicPath(locale: PublicLocale, path = "") {
  const normalizedPath = path === "/" ? "" : path.startsWith("/") ? path : `/${path}`;
  return `/${locale}${normalizedPath}`;
}

export const publicMessages = {
  ar: {
    common: {
      home: "الرئيسية",
      pricing: "الأسعار",
      methodology: "المنهجية",
      signin: "تسجيل الدخول",
      startCheck: "افحص متجرك",
      switchLanguage: "English",
      skip: "انتقل إلى المحتوى الرئيسي",
      footer:
        "جاهزية موثّقة للتجارة العربية. لا نضمن ترتيبًا أو ذكرًا في أي منصة.",
    },
  },
  en: {
    common: {
      home: "Home",
      pricing: "Pricing",
      methodology: "Methodology",
      signin: "Sign in",
      startCheck: "Check your store",
      switchLanguage: "العربية",
      skip: "Skip to main content",
      footer:
        "Evidence-led readiness for Arabic commerce. We never guarantee ranking or a platform mention.",
    },
  },
} as const;
