import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { TrustPage } from "@/components/visibility-checker/trust-page";
import { isPublicLocale } from "@/i18n/public";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isPublicLocale(locale)) return {};
  return {
    title: { absolute: locale === "ar" ? "الدعم | بصيرة" : "Support | Basirah" },
    description:
      locale === "ar"
        ? "طريقة طلب الدعم للفحص والتقارير وربط متجر سلة ومزامنة المنتجات ووكيل المبيعات."
        : "How to request help with checks, reports, Salla connection, product sync, and the sales agent.",
    alternates: {
      canonical: `/${locale}/support`,
      languages: { ar: "/ar/support", en: "/en/support" },
    },
  };
}

export default async function SupportPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isPublicLocale(locale)) notFound();
  const isAr = locale === "ar";

  return (
    <TrustPage
      intro={
        isAr
          ? "لأسرع تشخيص، أرسل وصفًا واضحًا للمشكلة من قناة الدعم الرسمية في صفحة تطبيق بصيرة على متجر تطبيقات سلة."
          : "For the fastest diagnosis, send a clear problem description through the official support channel on Basirah's Salla App Store page."
      }
      locale={locale}
      title={isAr ? "مركز الدعم" : "Support center"}
      sections={
        isAr
          ? [
              {
                title: "قبل إرسال الطلب",
                bullets: [
                  "اذكر القسم المتأثر: الفحص، التقرير، ربط سلة، المزامنة، وكيل المبيعات، أو لوحة التاجر.",
                  "أرسل الوقت التقريبي للمشكلة ورابط الصفحة الآمن ومعرّف الخطأ أو التشغيل إن ظهر.",
                  "أرفق لقطة شاشة بعد إخفاء أسماء العملاء وبيانات التواصل وأي معلومات حساسة.",
                  "وضح النتيجة المتوقعة وما حدث بدلًا منها، وهل تكررت المشكلة.",
                ],
              },
              {
                title: "لا ترسل هذه البيانات",
                bullets: [
                  "كلمة مرور حساب سلة أو البريد.",
                  "رمز OAuth أو client secret أو webhook secret أو مفتاح قاعدة البيانات.",
                  "بيانات دفع أو هوية أو سجل محادثة كامل يتضمن معلومات شخصية غير لازمة.",
                ],
              },
              {
                title: "الأولوية والاستجابة",
                paragraphs: [
                  "نعطي الأولوية لانقطاع الربط، وتسريب البيانات المحتمل، والتوصية غير الآمنة، وتعطل المزامنة أو الفحص. الحالات العامة وطلبات المزايا تراجع بعد الحوادث المؤثرة.",
                  "قناة الدعم وعنوان البريد المعتمدان سيظهران في صفحة التطبيق بسلة عند اعتماد النشر. استخدم تلك القناة حتى نتمكن من التحقق من ملكية المتجر وربط الطلب بالتطبيق الصحيح.",
                ],
              },
              {
                title: "بلاغ أمني",
                paragraphs: [
                  "إذا اشتبهت في كشف رمز أو وصول غير مصرح به، افصل التطبيق من سلة إن كان ذلك آمنًا، ولا تنسخ السر في البلاغ. اذكر نوع السر ووقت الاشتباه فقط، وسنطلب التفاصيل عبر قناة مقيدة عند الحاجة.",
                ],
              },
            ]
          : [
              {
                title: "Before sending a request",
                bullets: [
                  "Name the affected area: check, report, Salla connection, sync, sales agent, or merchant dashboard.",
                  "Include the approximate time, a safe page URL, and any visible error or run identifier.",
                  "Attach a screenshot only after hiding customer names, contact details, and other sensitive information.",
                  "Explain the expected result, what happened instead, and whether the issue repeats.",
                ],
              },
              {
                title: "Never send these",
                bullets: [
                  "Your Salla or email password.",
                  "An OAuth token, client secret, webhook secret, or database key.",
                  "Payment or identity data, or a full conversation containing unnecessary personal information.",
                ],
              },
              {
                title: "Priority and response",
                paragraphs: [
                  "We prioritize connection outages, potential data exposure, unsafe recommendations, and failed syncs or checks. General questions and feature requests follow incidents affecting service.",
                  "The approved support channel and email will appear on the Salla listing when publication is approved. Use that channel so store ownership can be verified and the request can be linked to the correct app.",
                ],
              },
              {
                title: "Security report",
                paragraphs: [
                  "If you suspect token exposure or unauthorized access, disconnect the app from Salla when safe and do not paste the secret into the report. State only the secret type and approximate time; we will request details through a restricted channel if needed.",
                ],
              },
            ]
      }
    />
  );
}
