import type { Skill, SkillInput, SkillReport } from "@/modules/skills/types";
import { buildCheck, scoreChecks } from "@/modules/skills/types";

function firstSentence(text: string) {
  return text.split(/[.!؟?]/u)[0]?.trim() ?? "";
}

export function runAeoSkill({ product }: SkillInput): SkillReport {
  const description = product.description.ar;
  const leadSentence = firstSentence(description);
  const hasUsageContext = /استخدام|طريقة|روتين|خطوات|use/iu.test(description);
  const verifiedAttributes = product.attributes.filter((attribute) => attribute.verified);
  const answersAudienceFit = verifiedAttributes.some((attribute) =>
    ["skin_type", "concern", "audience", "compatibility"].includes(attribute.key),
  );
  const hasIngredientFacts = verifiedAttributes.some((attribute) =>
    ["ingredient", "fragrance", "material", "spec"].includes(attribute.key),
  );

  const checks = [
    buildCheck({
      key: "direct_answer_lead",
      label: "افتتاحية واضحة ومفيدة",
      status: leadSentence.length > 0 ? "pass" : "warning",
      evidence:
        leadSentence.length > 0
          ? `يبدأ الوصف بجملة واضحة من ${leadSentence.length} حرفًا تخدم القارئ.`
          : "لا توجد جملة افتتاحية واضحة.",
      recommendation: "ابدأ الوصف بإجابة واضحة عن حاجة المشتري من الحقائق المتاحة، دون استهداف طول ثابت أو صياغة خاصة للذكاء الاصطناعي.",
    }),
    buildCheck({
      key: "usage_guidance",
      label: "سياق استخدام صريح",
      status: hasUsageContext ? "pass" : "warning",
      evidence: hasUsageContext
        ? "الوصف يتضمن سياق استخدام أو روتينًا صريحًا."
        : "لا توجد طريقة استخدام صريحة تساعد المشتري على اتخاذ قرار.",
      recommendation: "أضف طريقة استخدام مراجَعة عندما تكون مفيدة للمشتري، ونظّمها بخطوات طبيعية يسهل اتباعها.",
    }),
    buildCheck({
      key: "audience_fit_answerable",
      label: "إجابة سؤال \"هل يناسبني؟\" من سمات موثّقة",
      status: answersAudienceFit ? "pass" : "fail",
      evidence: answersAudienceFit
        ? "توجد سمات موثّقة لنوع البشرة أو الاحتياج تجيب سؤال الملاءمة دون تخمين."
        : "لا توجد سمة موثّقة تحدد لمن يناسب المنتج.",
      recommendation: "وثّق سمات الفئة المستهدفة (نوع البشرة/الاحتياج) بدل تركها في نص حر.",
    }),
    buildCheck({
      key: "fact_transparency",
      label: "شفافية المكونات أو المواصفات",
      status: hasIngredientFacts ? "pass" : "warning",
      evidence: hasIngredientFacts
        ? "توجد حقائق مكونات أو مواصفات موثّقة قابلة للاسترجاع."
        : "لا توجد حقائق مكونات أو مواصفات موثّقة.",
      recommendation: "أضف المكونات أو المواصفات التي يسأل عنها العملاء كسمات موثّقة بمصدر.",
    }),
    buildCheck({
      key: "answerable_fact_depth",
      label: "عمق الحقائق القابلة للإجابة",
      status: verifiedAttributes.length >= 4 ? "pass" : verifiedAttributes.length >= 2 ? "warning" : "fail",
      evidence: `${verifiedAttributes.length} سمات موثّقة متاحة لتوليد إجابات وأسئلة شائعة.`,
      recommendation: "استهدف أربع سمات موثّقة على الأقل لتغطية الأسئلة المتكررة عن المنتج.",
    }),
  ];

  return {
    skill: "aeo",
    skillVersion: "aeo-skill-v2",
    productId: product.id,
    score: scoreChecks(checks),
    checks,
    limitation:
      "هذه فحوصات وضوح وفائدة حتمية على المحتوى الموثّق. لا تشترط Google صياغة خاصة لمحركات الإجابة، ولا تضمن هذه النتيجة الظهور في أي ميزة بحث.",
  };
}

export const aeoSkill: Skill = {
  key: "aeo",
  label: { ar: "وضوح إجابات المشتري", en: "Buyer-answer clarity" },
  description: "يفحص قدرة محتوى المنتج على مساعدة المشتري من حقائق موثّقة؛ ويُبقي AEO مصطلحًا وصفيًا لا اختصارًا مستقلًا للظهور في Google.",
  version: "aeo-skill-v2",
  run: runAeoSkill,
};
