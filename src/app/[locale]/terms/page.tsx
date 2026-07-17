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
    title: { absolute: locale === "ar" ? "شروط الاستخدام | بصيرة" : "Terms of use | Basirah" },
    description:
      locale === "ar"
        ? "الشروط التي تحكم الفحص المجاني وتقارير بصيرة واتصال متجر سلة ووكيل المبيعات."
        : "Terms governing Basirah's free check, reports, Salla connection, and sales agent.",
    alternates: {
      canonical: `/${locale}/terms`,
      languages: { ar: "/ar/terms", en: "/en/terms" },
    },
  };
}

export default async function TermsPage({
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
          ? "باستخدام بصيرة، فإنك توافق على استخدام الخدمة بصورة قانونية وعلى فهم حدود الفحص والتوصيات والتكاملات الخارجية."
          : "By using Basirah, you agree to use the service lawfully and understand the limits of checks, recommendations, and third-party integrations."
      }
      locale={locale}
      title={isAr ? "شروط الاستخدام" : "Terms of use"}
      sections={
        isAr
          ? [
              {
                title: "الخدمة",
                paragraphs: [
                  "تقدم بصيرة فحصًا لمحتوى المواقع العامة، وتقارير جاهزية، وأدوات تحسين، ووكيل مبيعات وذكاء عملاء عند تفعيل تكامل المتجر. قد تختلف المزايا المتاحة حسب مرحلة الإطلاق وخطة المتجر واعتماد سلة.",
                  "التقرير الكامل للفحص العام مجاني بحسب العرض المنشور. أي تنفيذ مدفوع أو اشتراك لا يصبح نافذًا إلا عندما يظهر سعره وشروطه بوضوح في قناة شراء معتمدة.",
                ],
              },
              {
                title: "لا ضمان للترتيب أو النتيجة",
                bullets: [
                  "درجة الجاهزية تقيس شروطًا قابلة للتحقق في الصفحات؛ لا تثبت أن منصة ذكاء اصطناعي ستذكر المتجر.",
                  "الظهور المرصود والاكتشاف في Google والاستشهادات قياسات منفصلة لها تاريخ وطريقة وحدود.",
                  "توصيات المنتجات تساعد على الاختيار ولا تستبدل حكم التاجر أو المختص، خصوصًا في الأسئلة الطبية أو القانونية أو المالية.",
                ],
              },
              {
                title: "مسؤوليات التاجر والمستخدم",
                bullets: [
                  "يجب أن تملك الحق في فحص الموقع وربط متجر سلة والبيانات التي تقدمها.",
                  "يجب أن تكون معلومات المنتجات والأسعار والمخزون والسياسات التي يديرها المتجر دقيقة ومحدثة.",
                  "يحظر استخدام الخدمة للتضليل، أو الادعاءات الطبية غير الموثقة، أو انتهاك حقوق الآخرين، أو محاولة تجاوز الأمان أو حدود الاستخدام.",
                  "لا ترسل كلمات مرور أو مفاتيح سرية أو بيانات دفع أو معلومات حساسة غير لازمة داخل المحادثات أو رسائل الدعم.",
                ],
              },
              {
                title: "التكاملات والتوفر",
                paragraphs: [
                  "تعتمد بعض الوظائف على سلة ومزودي استضافة وقواعد بيانات وذكاء اصطناعي من أطراف أخرى. قد تتوقف ميزة مؤقتًا عند تغير واجهة خارجية أو أثناء الصيانة أو المراجعة الأمنية.",
                  "يجوز تعليق اتصال أو حساب عند وجود خطر أمني، أو إساءة استخدام، أو مخالفة جوهرية، مع السعي لإشعار التاجر عندما يكون ذلك آمنًا وممكنًا.",
                ],
              },
              {
                title: "الملكية والمسؤولية",
                paragraphs: [
                  "يحتفظ التاجر بحقوق بياناته ومحتواه. تحتفظ بصيرة بحقوق البرمجيات والتصميم والمنهجية والعلامة. تمنحنا فقط الصلاحية اللازمة لمعالجة البيانات وتقديم الخدمة.",
                  "إلى الحد الذي يسمح به النظام، تقدم النتائج كأداة دعم قرار ولا نتحمل خسائر ناتجة عن معلومات متجر غير دقيقة، أو قرارات نشر دون مراجعة، أو خدمات خارجية، أو وعود نتائج لم نقدمها. تخضع النسخة النهائية للنشر التجاري لمراجعة قانونية وشروط متجر تطبيقات سلة.",
                ],
              },
            ]
          : [
              {
                title: "The service",
                paragraphs: [
                  "Basirah provides public-site checks, readiness reports, improvement tools, and—when a store integration is enabled—a sales agent and customer intelligence. Available features may vary by launch stage, merchant plan, and Salla approval.",
                  "The full public-site report is free under the published offer. Paid implementation or a subscription takes effect only when its price and terms are clearly shown through an approved purchase channel.",
                ],
              },
              {
                title: "No ranking or outcome guarantee",
                bullets: [
                  "A readiness score measures verifiable page conditions; it does not prove that an AI platform will mention the store.",
                  "Observed visibility, Google discovery, and citations are separate measurements with a date, method, and limits.",
                  "Product recommendations assist selection and do not replace merchant or professional judgment, especially for medical, legal, or financial questions.",
                ],
              },
              {
                title: "Merchant and user responsibilities",
                bullets: [
                  "You must have the right to check the site and connect the Salla store and data you provide.",
                  "Store-managed product, price, stock, and policy information must be accurate and current.",
                  "You may not use the service to mislead, make unsupported medical claims, violate others' rights, or bypass security or usage limits.",
                  "Do not place passwords, secret keys, payment data, or unnecessary sensitive information in conversations or support messages.",
                ],
              },
              {
                title: "Integrations and availability",
                paragraphs: [
                  "Some functions depend on Salla and third-party hosting, database, and AI providers. A feature may be temporarily unavailable when an external interface changes or during maintenance or security review.",
                  "A connection or account may be suspended for a security risk, abuse, or material breach, with notice where safe and practical.",
                ],
              },
              {
                title: "Ownership and responsibility",
                paragraphs: [
                  "The merchant retains rights to its data and content. Basirah retains rights to its software, design, methodology, and brand. You grant only the permission needed to process data and provide the service.",
                  "To the extent permitted by law, results are decision-support tools. We are not responsible for losses caused by inaccurate store information, unreviewed publishing decisions, third-party services, or outcome promises we did not make. The final commercial release remains subject to legal review and Salla App Store terms.",
                ],
              },
            ]
      }
    />
  );
}
