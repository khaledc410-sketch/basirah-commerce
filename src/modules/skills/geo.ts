import type { Skill, SkillInput, SkillReport } from "@/modules/skills/types";
import { buildCheck, scoreChecks } from "@/modules/skills/types";

const UNVERIFIABLE_CLAIMS = /(الأفضل|أفضل منتج|رقم\s*[1١]|معجزة|يعالج|يشفي|مضمون|نتيجة فورية)/u;

export function runGeoSkill({ store, product }: SkillInput): SkillReport {
  const verifiedAttributes = product.attributes.filter((attribute) => attribute.verified);
  const verifiedRatio =
    product.attributes.length > 0 ? verifiedAttributes.length / product.attributes.length : 0;
  const hasDocumentSource = verifiedAttributes.some((attribute) => attribute.source === "document");
  const hasEntityClarity =
    store.name.ar.trim().length > 0 && Boolean(store.name.en?.trim()) && store.domain.trim().length > 0;
  const fullText = `${product.name.ar} ${product.description.ar}`;
  const hasUnverifiableClaim = UNVERIFIABLE_CLAIMS.test(fullText);
  const updatedAt = Date.parse(product.provenance.externalUpdatedAt);
  const hasFreshness = Number.isFinite(updatedAt);

  const checks = [
    buildCheck({
      key: "entity_clarity",
      label: "وضوح كيان العلامة",
      status: hasEntityClarity ? "pass" : "warning",
      evidence: hasEntityClarity
        ? `اسم المتجر متاح بالعربية والإنجليزية مع نطاق واضح (${store.domain}).`
        : "اسم العلامة أو النطاق غير مكتمل باللغتين.",
      recommendation: "ثبّت اسم العلامة بالعربية والإنجليزية ونطاقًا واحدًا حتى يفهم الزائر ومحركات البحث الكيان الصحيح.",
    }),
    buildCheck({
      key: "claim_provenance",
      label: "نسبة الادعاءات المسندة لمصدر",
      status: verifiedRatio >= 0.8 ? "pass" : verifiedRatio >= 0.5 ? "warning" : "fail",
      evidence: `${verifiedAttributes.length} من أصل ${product.attributes.length} سمة موثّقة المصدر.`,
      recommendation: "اجعل كل ادعاء منتج مسندًا لسمة موثّقة؛ المحتوى الأصلي والموثوق والمفيد للناس هو أساس Google Search.",
    }),
    buildCheck({
      key: "document_backed_facts",
      label: "حقائق مدعومة بمستند",
      status: hasDocumentSource ? "pass" : "fail",
      evidence: hasDocumentSource
        ? "يوجد مستند مرفوع يدعم بعض حقائق المنتج (مكونات أو مواصفات)."
        : "لا يوجد مصدر مستندي لأي حقيقة منتج.",
      recommendation: "ارفع ورقة مكونات أو مواصفات معتمدة حتى تبقى الحقائق قابلة للتحقق والمراجعة.",
    }),
    buildCheck({
      key: "no_unverifiable_claims",
      label: "خلو المحتوى من ادعاءات غير قابلة للتحقق",
      status: hasUnverifiableClaim ? "fail" : "pass",
      evidence: hasUnverifiableClaim
        ? "المحتوى يتضمن ادعاء تفضيل أو علاج غير مسند يضعف موثوقيته للقارئ ومحركات البحث."
        : "لم تُرصد صيغ تفضيل مطلق أو ادعاءات علاجية في المحتوى المفحوص.",
      recommendation: "استبدل صيغ \"الأفضل\" والادعاءات العلاجية بحقائق موثّقة قابلة للتحقق.",
    }),
    buildCheck({
      key: "freshness_signal",
      label: "إشارة حداثة المحتوى",
      status: hasFreshness ? "pass" : "warning",
      pointsAvailable: 10,
      evidence: hasFreshness
        ? `آخر تحديث مسجل من المنصة: ${product.provenance.externalUpdatedAt}.`
        : "لا يوجد تاريخ تحديث صالح مسجل للمنتج.",
      recommendation: "أظهر تاريخ آخر تحديث عندما يكون مفيدًا للقارئ، وحدّث الحقائق المتغيرة بدل استخدام التاريخ كإشارة شكلية.",
    }),
  ];

  return {
    skill: "geo",
    skillVersion: "geo-skill-v2",
    productId: product.id,
    score: scoreChecks(checks),
    checks,
    limitation:
      "هذه فحوصات جاهزية بحث حتمية على بيانات المتجر. تعتبر Google ما يسمى GEO جزءًا من SEO، ولا تقيس النتيجة ذكر أي منصة للمتجر فعليًا ولا تضمنه.",
  };
}

export const geoSkill: Skill = {
  key: "geo",
  label: { ar: "جاهزية البحث التوليدي", en: "Generative Search readiness" },
  description: "يفحص وضوح الكيان وإسناد الادعاءات والحداثة ضمن أساس SEO المفيد للناس؛ ويُبقي GEO مصطلحًا وصفيًا لا نظام ترتيب مستقلًا لدى Google.",
  version: "geo-skill-v2",
  run: runGeoSkill,
};
