import type { UnifiedProduct } from "@/core/commerce/types";

export type ReadinessCategory =
  | "technical"
  | "content"
  | "entity"
  | "trust"
  | "answerability"
  | "structuredData"
  | "externalEvidence";

export interface ReadinessComponent {
  key: ReadinessCategory;
  label: string;
  score: number;
  weight: number;
  evidence: string;
  recommendation: string;
}

export interface ProductAuditResult {
  productId: string;
  score: number;
  scoringVersion: "product-readiness-v2";
  checkedAt: string;
  checks: Array<{
    label: string;
    status: "pass" | "warning" | "fail";
    evidence: string;
    recommendation?: string;
  }>;
  limitation: string;
}

export function auditProduct(product: UnifiedProduct): ProductAuditResult {
  const verifiedAttributes = product.attributes.filter((attribute) => attribute.verified).length;
  const hasArabic = product.name.ar.trim().length > 0 && product.description.ar.trim().length > 0;
  const hasEnglish = Boolean(product.name.en && product.description.en);
  const hasUsage = /استخدام|روتين|use/iu.test(product.description.ar);
  const hasSafetySource = product.attributes.some(
    (attribute) => attribute.source === "document" && attribute.verified,
  );

  const checks: ProductAuditResult["checks"] = [
    {
      label: "وصف عربي واضح",
      status: hasArabic ? "pass" : "fail",
      evidence: hasArabic ? "العنوان والوصف العربيان موجودان." : "العنوان أو الوصف العربي مفقود؛ لا يُستخدم طول ثابت للحكم على الفائدة.",
      recommendation: hasArabic ? undefined : "أضف وصفًا واقعيًا يشرح الاستخدام والمواصفات.",
    },
    {
      label: "سمات منتج موثّقة",
      status: verifiedAttributes >= 4 ? "pass" : verifiedAttributes >= 2 ? "warning" : "fail",
      evidence: `${verifiedAttributes} سمات موثّقة متاحة للاسترجاع والترشيح.`,
      recommendation: verifiedAttributes >= 4 ? undefined : "أكمل السمات التي يسأل عنها العملاء بدل تركها في نص حر.",
    },
    {
      label: "تعليمات الاستخدام",
      status: hasUsage ? "pass" : "warning",
      evidence: hasUsage ? "الوصف يتضمن سياق استخدام." : "لا توجد طريقة استخدام صريحة في الصفحة.",
      recommendation: hasUsage ? undefined : "أضف خطوات استخدام قصيرة ومراجَعة.",
    },
    {
      label: "مصدر سلامة أو مكونات",
      status: hasSafetySource ? "pass" : "fail",
      evidence: hasSafetySource ? "يوجد مستند موثّق يدعم بعض حقائق المنتج." : "لا يوجد مصدر مرفوع لحقائق السلامة أو المكونات.",
      recommendation: hasSafetySource ? undefined : "ارفع ورقة مكونات أو مواصفات معتمدة.",
    },
    {
      label: "اتساق العربية والإنجليزية",
      status: hasEnglish ? "pass" : "warning",
      evidence: hasEnglish ? "نسختا المحتوى متاحتان." : "المحتوى الإنجليزي غير مكتمل.",
      recommendation: hasEnglish ? undefined : "أضف نسخة إنجليزية متسقة إذا كان المتجر يخدم اللغتين.",
    },
  ];

  const weights = { pass: 20, warning: 11, fail: 2 } as const;
  const score = checks.reduce((total, check) => total + weights[check.status], 0);
  return {
    productId: product.id,
    score,
    scoringVersion: "product-readiness-v2",
    checkedAt: "2026-07-11T12:00:00.000Z",
    checks,
    limitation:
      "هذه نتيجة جاهزية محتوى حتمية وليست قياسًا لظهور المنتج فعليًا في ChatGPT أو Google أو أي منصة أخرى.",
  };
}

export const storeReadinessComponents: ReadinessComponent[] = [
  { key: "technical", label: "الجاهزية التقنية", score: 82, weight: 25, evidence: "الفهرسة وملف sitemap والروابط الأساسية متاحة في فحص العرض التجريبي.", recommendation: "أصلح صفحتين بهما canonical غير متسق." },
  { key: "content", label: "قيمة المنتجات والمحتوى", score: 74, weight: 30, evidence: "81٪ من المنتجات النشطة لديها وصف عربي وسمات موثّقة.", recommendation: "أكمل الحقائق الأصلية والسمات الموثّقة لـ 9 منتجات." },
  { key: "entity", label: "وضوح العلامة والكيان", score: 72, weight: 10, evidence: "اسم العلامة وبيانات الاتصال واضحة، لكن صفحة من نحن تفتقد تفاصيل الخبرة.", recommendation: "أضف معلومات واقعية عن العلامة وخبرتها ومصادرها." },
  { key: "trust", label: "الثقة والسلطة", score: 70, weight: 15, evidence: "سياسات الشحن والاسترجاع متاحة؛ تواريخ التحديث ومصادر المكونات غير مكتملة.", recommendation: "أضف تواريخ تحديث ومصادر لكل ادعاء منتج." },
  { key: "answerability", label: "الوضوح والفائدة للقارئ", score: 78, weight: 10, evidence: "39 من أصل 50 سؤالًا متكررًا يمكن الإجابة عنها من حقائق عامة موثّقة.", recommendation: "أضف معلومات الاستخدام والسلامة عندما تخدم حاجة حقيقية؛ FAQ اختياري." },
  { key: "structuredData", label: "البيانات المنظمة", score: 84, weight: 5, evidence: "Product وBreadcrumb متاحان على غالبية الصفحات المفحوصة.", recommendation: "أكمل Product بالحقائق المتاحة لدعم نتائج Google الغنية، لا كشرط للبحث التوليدي." },
  { key: "externalEvidence", label: "أدلة خارجية", score: 60, weight: 5, evidence: "عُثر على مصادر خارجية محدودة للعلامة في وضع العرض التجريبي.", recommendation: "ابنِ حضورًا خارجيًا حقيقيًا قبل تفسير أي تحسن على أنه سببي." },
];

export function calculateStoreReadiness() {
  return Math.round(
    storeReadinessComponents.reduce(
      (total, component) => total + component.score * (component.weight / 100),
      0,
    ),
  );
}
