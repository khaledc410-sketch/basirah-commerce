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
    title: { absolute: locale === "ar" ? "سياسة الخصوصية | بصيرة" : "Privacy policy | Basirah" },
    description:
      locale === "ar"
        ? "كيف تتعامل بصيرة مع بيانات الفحص والتقارير واتصال متجر سلة ومحادثات العملاء."
        : "How Basirah handles website checks, reports, Salla store connections, and customer conversations.",
    alternates: {
      canonical: `/${locale}/privacy`,
      languages: { ar: "/ar/privacy", en: "/en/privacy" },
    },
  };
}

export default async function PrivacyPage({
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
          ? "تشرح هذه السياسة البيانات التي تحتاجها بصيرة لتقديم الفحص المجاني ووكيل المبيعات وذكاء العملاء، وما لا نطلبه، وكيف نحد من استخدامها."
          : "This policy explains the data Basirah needs for the free check, sales agent, and customer intelligence; what we do not request; and how we limit its use."
      }
      locale={locale}
      title={isAr ? "سياسة الخصوصية" : "Privacy policy"}
      sections={
        isAr
          ? [
              {
                title: "ما الذي نجمعه؟",
                bullets: [
                  "رابط المتجر العام والصفحات العامة اللازمة للفحص، مع الأدلة الفنية والمحتوى المستخرج منها.",
                  "البريد الإلكتروني فقط عندما تختار فتح التقرير الكامل أو تسجيل الدخول. موافقة الرسائل التسويقية منفصلة وغير محددة افتراضيًا.",
                  "عند ربط سلة: معرّفات المتجر والاتصال، وبيانات الكتالوج المسموح بها، وحالة المزامنة، وسجلات التشغيل الضرورية.",
                  "عند تفعيل وكيل المبيعات: محتوى المحادثة، الاحتياجات والقيود والاعتراضات والنتائج اللازمة لتقديم الخدمة وتحسينها.",
                ],
              },
              {
                title: "ما الذي لا نطلبه؟",
                bullets: [
                  "لا نطلب كلمة مرور سلة؛ الربط يتم عبر OAuth الرسمي.",
                  "لا نبيع بيانات العملاء أو قوائم البريد.",
                  "لا نستخدم بيانات متجر لإنتاج أرقام أو نتائج لمتجر آخر.",
                  "لا نحوّل القياس غير المتاح إلى صفر أو ادعاء سلبي مصطنع.",
                ],
              },
              {
                title: "لماذا نستخدم البيانات؟",
                bullets: [
                  "إجراء الفحص، إنشاء التقرير، وتقديم الأدلة وخطة الإصلاح.",
                  "مزامنة المنتجات المتاحة وتقديم توصيات قائمة على حقائق الكتالوج.",
                  "استخراج إشارات مجمعة مثل الاحتياجات المتكررة والاعتراضات وفجوات الطلب.",
                  "حماية الخدمة، تطبيق حدود الاستخدام، تشخيص الأعطال، وتسجيل الأحداث الأمنية الضرورية.",
                ],
              },
              {
                title: "الاحتفاظ والمشاركة",
                paragraphs: [
                  "سجل الفحص المجهول مصمم للاحتفاظ لمدة سبعة أيام، ورابط التقرير المفتوح بالبريد لمدة 30 يومًا. تحدد إعدادات التاجر وسياسة الخدمة المعتمدة مدة محادثات المتجر قبل الإطلاق الإنتاجي.",
                  "قد نعالج البيانات لدى مزودي الاستضافة وقاعدة البيانات والبريد والذكاء الاصطناعي اللازمين لتشغيل الخدمة، بعقود وضوابط وصول مناسبة. لا نشاركها للإعلانات السلوكية أو لإعادة بيعها.",
                ],
              },
              {
                title: "الأمان وحقوقك",
                paragraphs: [
                  "نستخدم عزل بيانات المتاجر، وضوابط صلاحيات، وتشفيرًا لرموز الاتصال والحقول الحساسة، وسجلات تدقيق. لا توجد خدمة آمنة بنسبة 100٪، لذلك نحد من البيانات والصلاحيات ونراجع الحوادث.",
                  "لطلب الوصول أو التصحيح أو الحذف أو الاعتراض، استخدم قناة الدعم الرسمية الظاهرة في صفحة تطبيق بصيرة على متجر تطبيقات سلة أو صفحة الدعم في هذا الموقع. لن نطلب منك إرسال رمز OAuth أو كلمة مرور أو سر عبر رسالة دعم.",
                ],
              },
            ]
          : [
              {
                title: "What we collect",
                bullets: [
                  "The public store URL and public pages needed for the check, plus the technical and content evidence found on them.",
                  "An email only when you choose to unlock the full report or sign in. Marketing consent is separate and off by default.",
                  "When Salla is connected: store and connection identifiers, permitted catalog data, sync status, and necessary operational records.",
                  "When the sales agent is enabled: conversation content, needs, constraints, objections, and outcomes required to provide and improve the service.",
                ],
              },
              {
                title: "What we do not request",
                bullets: [
                  "We do not ask for your Salla password; connection uses official OAuth.",
                  "We do not sell customer data or email lists.",
                  "We do not use one store's data to fabricate results for another.",
                  "We do not turn unavailable measurements into a zero or an artificial negative claim.",
                ],
              },
              {
                title: "Why we use data",
                bullets: [
                  "Run the check, create the report, and provide evidence and an improvement plan.",
                  "Synchronize available products and provide catalog-grounded recommendations.",
                  "Derive aggregated signals such as repeated needs, objections, and demand gaps.",
                  "Protect the service, enforce limits, diagnose failures, and record necessary security events.",
                ],
              },
              {
                title: "Retention and sharing",
                paragraphs: [
                  "Anonymous check records are designed for seven-day retention, and email-unlocked report links for 30 days. Merchant settings and the approved service policy will govern store-conversation retention before a production release.",
                  "Hosting, database, email, and AI providers needed to operate the service may process data under appropriate contracts and access controls. We do not share it for behavioral advertising or resale.",
                ],
              },
              {
                title: "Security and your choices",
                paragraphs: [
                  "We use tenant isolation, access controls, encryption for connection tokens and sensitive fields, and audit records. No service is perfectly secure, so we minimize data and permissions and review incidents.",
                  "To request access, correction, deletion, or objection, use the official support channel shown on Basirah's Salla App Store page or this site's support page. We will never ask you to send an OAuth token, password, or secret in a support message.",
                ],
              },
            ]
      }
    />
  );
}
