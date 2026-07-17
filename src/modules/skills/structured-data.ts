import type { UnifiedProduct, UnifiedStore } from "@/core/commerce/types";
import type { Skill, SkillInput, SkillReport } from "@/modules/skills/types";
import { buildCheck, scoreChecks } from "@/modules/skills/types";

function formatMinorAmount(amountMinor: number) {
  return (amountMinor / 100).toFixed(2);
}

export function buildProductJsonLd(store: UnifiedStore, product: UnifiedProduct) {
  const verifiedAttributes = product.attributes.filter((attribute) => attribute.verified);
  const primaryVariant = product.variants[0];

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name.ar,
    ...(product.name.en ? { alternateName: product.name.en } : {}),
    description: product.description.ar,
    image: product.imageUrl,
    ...(primaryVariant?.sku ? { sku: primaryVariant.sku } : {}),
    brand: { "@type": "Brand", name: store.name.ar },
    offers: {
      "@type": "Offer",
      price: formatMinorAmount(product.price.amount),
      priceCurrency: product.price.currency,
      availability:
        product.available && product.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      url: product.productUrl,
    },
    additionalProperty: verifiedAttributes.map((attribute) => ({
      "@type": "PropertyValue",
      name: attribute.label.ar,
      value: attribute.values.join("، "),
    })),
  };
}

export function buildOrganizationJsonLd(store: UnifiedStore) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: store.name.ar,
    ...(store.name.en ? { alternateName: store.name.en } : {}),
    url: `https://${store.domain}`,
  };
}

export function runStructuredDataSkill({ store, product }: SkillInput): SkillReport {
  const jsonLd = buildProductJsonLd(store, product);
  const primaryVariant = product.variants[0];
  const hasRequiredFields =
    product.name.ar.trim().length > 0 &&
    product.description.ar.trim().length > 0 &&
    product.imageUrl.trim().length > 0;
  const hasCompleteOffer = product.price.amount > 0 && product.price.currency === "SAR";
  const hasIdentifier = Boolean(primaryVariant?.sku);
  const hasGlobalIdentifier = product.attributes.some(
    (attribute) => ["gtin", "mpn", "barcode"].includes(attribute.key) && attribute.verified,
  );

  const checks = [
    buildCheck({
      key: "required_product_fields",
      label: "الحقول الأساسية لمخطط المنتج",
      status: hasRequiredFields ? "pass" : "fail",
      evidence: hasRequiredFields
        ? "الاسم والوصف والصورة متوفرة لتوليد مخطط Product صالح."
        : "حقل أساسي (اسم أو وصف أو صورة) مفقود.",
      recommendation: "أكمل الاسم والوصف والصورة قبل توليد البيانات المنظمة.",
    }),
    buildCheck({
      key: "offer_completeness",
      label: "اكتمال بيانات العرض",
      status: hasCompleteOffer ? "pass" : "fail",
      evidence: hasCompleteOffer
        ? `السعر ${formatMinorAmount(product.price.amount)} ${product.price.currency} وحالة التوفر مأخوذان من بيانات المتجر.`
        : "السعر أو العملة غير مكتملين لمخطط Offer.",
      recommendation: "أكمل السعر والعملة وحالة التوفر من مصدر المنصة.",
    }),
    buildCheck({
      key: "identifier_presence",
      label: "معرّف المنتج (SKU)",
      status: hasIdentifier ? "pass" : "warning",
      evidence: hasIdentifier
        ? `SKU متاح من المتغير الأساسي (${primaryVariant?.sku}).`
        : "لا يوجد SKU مسجل للمتغير الأساسي.",
      recommendation: "أضف SKU لكل متغير حتى تتطابق البيانات المنظمة مع الكتالوج.",
    }),
    buildCheck({
      key: "global_identifier",
      label: "معرّف عالمي (GTIN/MPN)",
      status: hasGlobalIdentifier ? "pass" : "warning",
      pointsAvailable: 10,
      evidence: hasGlobalIdentifier
        ? "يوجد معرّف عالمي موثّق ضمن السمات."
        : "لا يوجد GTIN أو MPN موثّق؛ أُسقط من المخطط بدل اختلاقه.",
      recommendation: "أضف GTIN أو MPN كسمة موثّقة عند توفر حقيقة معتمدة فقط.",
    }),
    buildCheck({
      key: "verified_properties_only",
      label: "الاقتصار على السمات الموثّقة",
      status: "pass",
      pointsAvailable: 10,
      evidence: `المخطط المولّد يتضمن ${jsonLd.additionalProperty.length} سمة موثّقة فقط ولا يضيف حقائق غير مسندة.`,
    }),
  ];

  return {
    skill: "structured-data",
    skillVersion: "structured-data-skill-v1",
    productId: product.id,
    score: scoreChecks(checks),
    checks,
    artifacts: {
      productJsonLd: jsonLd,
      organizationJsonLd: buildOrganizationJsonLd(store),
    },
    limitation:
      "المخطط مولّد من حقائق المتجر الموثّقة فقط؛ صحة البنية لا تضمن ظهور النتائج المنسقة في أي محرك أو مساعد.",
  };
}

export const structuredDataSkill: Skill = {
  key: "structured-data",
  label: { ar: "البيانات المنظمة", en: "Structured data" },
  description: "يولّد مخطط Product وOrganization من الحقائق الموثّقة فقط ويفحص اكتمال الحقول المطلوبة.",
  version: "structured-data-skill-v1",
  run: runStructuredDataSkill,
};
