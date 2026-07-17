import type { Skill, SkillInput, SkillReport } from "@/modules/skills/types";
import { buildCheck, scoreChecks } from "@/modules/skills/types";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;

export function runSeoSkill({ product }: SkillInput): SkillReport {
  const titleLength = product.name.ar.trim().length;
  const descriptionLength = product.description.ar.trim().length;
  const slugValid = SLUG_PATTERN.test(product.slug) && product.slug.length <= 60;
  const hasImage = product.imageUrl.trim().length > 0;
  const hasEnglish = Boolean(product.name.en?.trim() && product.description.en?.trim());
  const hasSnippetFacts = product.price.amount > 0 && typeof product.available === "boolean";

  const checks = [
    buildCheck({
      key: "title_length",
      label: "طول عنوان الصفحة",
      status: titleLength >= 15 && titleLength <= 60 ? "pass" : titleLength >= 8 ? "warning" : "fail",
      evidence: `العنوان العربي الحالي ${titleLength} حرفًا.`,
      recommendation: "اجعل العنوان وصفيًا بين 15 و60 حرفًا ويتضمن اسم المنتج وفائدته الأساسية.",
    }),
    buildCheck({
      key: "meta_description_length",
      label: "طول الوصف التعريفي",
      status:
        descriptionLength >= 70 && descriptionLength <= 160
          ? "pass"
          : descriptionLength >= 40
            ? "warning"
            : "fail",
      evidence: `الوصف العربي الحالي ${descriptionLength} حرفًا.`,
      recommendation: "اكتب وصفًا واقعيًا بين 70 و160 حرفًا يلخص المنتج ويشجع على النقر دون مبالغة.",
    }),
    buildCheck({
      key: "slug_quality",
      label: "جودة الرابط الدائم",
      status: slugValid ? "pass" : "warning",
      evidence: slugValid
        ? `الرابط \`${product.slug}\` قصير وبصيغة أحرف لاتينية مفصولة بشرطات.`
        : `الرابط \`${product.slug}\` يخالف الصيغة الموصى بها.`,
      recommendation: "استخدم رابطًا قصيرًا بأحرف لاتينية صغيرة مفصولة بشرطات دون رموز أو مسافات.",
    }),
    buildCheck({
      key: "image_with_alt_source",
      label: "صورة منتج بنص بديل قابل للاشتقاق",
      status: hasImage && titleLength > 0 ? "pass" : "fail",
      evidence: hasImage
        ? "توجد صورة منتج ويمكن اشتقاق نص بديل من الاسم الموثّق."
        : "لا توجد صورة منتج مسجلة.",
      recommendation: "أضف صورة أصلية للمنتج مع نص بديل يصف المحتوى الفعلي للصورة.",
    }),
    buildCheck({
      key: "snippet_facts",
      label: "حقائق السعر والتوفر للمقتطفات",
      status: hasSnippetFacts ? "pass" : "fail",
      evidence: hasSnippetFacts
        ? "السعر وحالة التوفر متاحان من بيانات المتجر ويمكن عرضهما في نتائج البحث."
        : "السعر أو حالة التوفر غير مكتملة.",
      recommendation: "أكمل السعر وحالة التوفر حتى تظهر معلومات دقيقة في نتائج البحث.",
    }),
    buildCheck({
      key: "bilingual_parity",
      label: "اتساق المحتوى العربي والإنجليزي",
      status: hasEnglish ? "pass" : "warning",
      pointsAvailable: 10,
      evidence: hasEnglish ? "نسختا المحتوى متوفرتان للاسم والوصف." : "النسخة الإنجليزية غير مكتملة.",
      recommendation: "أضف نسخة إنجليزية متسقة إذا كان المتجر يستهدف الباحثين باللغتين.",
    }),
  ];

  return {
    skill: "seo",
    skillVersion: "seo-skill-v1",
    productId: product.id,
    score: scoreChecks(checks),
    checks,
    limitation:
      "هذه فحوصات جاهزية تحريرية وتقنية حتمية على بيانات المتجر، وليست قياسًا للترتيب الفعلي ولا ضمانًا له في أي محرك بحث.",
  };
}

export const seoSkill: Skill = {
  key: "seo",
  label: { ar: "تحسين محركات البحث", en: "SEO" },
  description: "يفحص عناصر SEO الأساسية للمنتج: العنوان، الوصف التعريفي، الرابط، الصورة، وحقائق المقتطفات.",
  version: "seo-skill-v1",
  run: runSeoSkill,
};
