export type SafetyTopic =
  | "general"
  | "pregnancy"
  | "medical"
  | "allergy"
  | "child_safety"
  | "medication";

export interface SafetyDecision {
  topic: SafetyTopic;
  status: "allowed" | "restricted";
  reason?: string;
  response?: string;
}

const safetyRules: Array<{ topic: Exclude<SafetyTopic, "general">; patterns: RegExp[] }> = [
  { topic: "pregnancy", patterns: [/حامل/u, /الحمل/u, /مرضع/u, /الرضاعة/u, /pregnan/iu] },
  { topic: "medication", patterns: [/دواء/u, /أدوية/u, /تداخل/u, /medication/iu] },
  { topic: "child_safety", patterns: [/طفل/u, /أطفال/u, /رضيع/u, /baby/iu, /child/iu] },
  { topic: "allergy", patterns: [/حساسية شديدة/u, /تحسس/u, /allerg/iu] },
  { topic: "medical", patterns: [/علاج/u, /أكزيما/u, /صدفية/u, /التهاب/u, /تشخيص/u, /disease/iu, /treat/iu] },
];

export function classifySafety(message: string): SafetyDecision {
  const matched = safetyRules.find((rule) => rule.patterns.some((pattern) => pattern.test(message)));
  if (!matched) return { topic: "general", status: "allowed" };

  const responses: Record<Exclude<SafetyTopic, "general">, string> = {
    pregnancy:
      "حرصًا على سلامتك، لا أستطيع تأكيد ملاءمة المنتج أثناء الحمل أو الرضاعة. ننصح بمراجعة قائمة المكونات الكاملة مع مختص قبل الاستخدام.",
    medication:
      "لا أستطيع تقديم نصيحة عن التداخلات الدوائية. ننصح بمراجعة مختص مع قائمة مكونات المنتج.",
    child_safety:
      "لا توجد معلومات موثقة كافية لتقديم توصية للأطفال. الأفضل مراجعة العمر المحدد على المنتج واستشارة مختص عند الحاجة.",
    allergy:
      "لا يمكنني ضمان الأمان من الحساسية دون معلومات موثقة وكاملة. تجنّب الاستخدام واطلب مساعدة مختص إذا كانت الحساسية شديدة أو مستمرة.",
    medical:
      "أقدر أشرح معلومات المنتج الموثقة، لكن لا أستطيع تشخيص حالة أو الوعد بعلاجها. للحالات المستمرة أو الشديدة، الأفضل مراجعة مختص.",
  };

  return {
    topic: matched.topic,
    status: "restricted",
    reason: `Category safety policy triggered: ${matched.topic}`,
    response: responses[matched.topic],
  };
}
