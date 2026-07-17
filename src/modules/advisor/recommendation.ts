import type { UnifiedProduct } from "@/core/commerce/types";
import { classifySafety } from "@/modules/safety/policy";

export interface AdvisorConstraints {
  budgetMinor?: number;
  skinTypes: string[];
  concerns: string[];
  category?: string;
}

export interface RankedProduct extends UnifiedProduct {
  reason: string;
  score: number;
}

const arabicDigits = "٠١٢٣٤٥٦٧٨٩";

function normalizeDigits(value: string) {
  return value.replace(/[٠-٩]/gu, (digit) => String(arabicDigits.indexOf(digit)));
}

function matchTerms(message: string, dictionary: Record<string, string[]>) {
  return Object.entries(dictionary)
    .filter(([, terms]) => terms.some((term) => message.includes(term)))
    .map(([key]) => key);
}

export function detectIntent(message: string) {
  if (/قارن|مقارنة|الفرق|وش الفرق|compare/iu.test(message)) return "مقارنة منتجات";
  if (/شحن|توصيل|استرجاع|إرجاع|ضمان|shipping|return/iu.test(message)) return "سياسات المتجر";
  if (/استخدم|طريقة الاستخدام|مكونات|ingredient|use/iu.test(message)) return "معلومات منتج";
  return "اختيار منتج";
}

export function extractConstraints(rawMessage: string): AdvisorConstraints {
  const message = normalizeDigits(rawMessage.toLowerCase());
  const numberMatch = message.match(/(?:ميزاني|تحت|أقل من|حدود|بحدود)\D{0,12}(\d{2,4})/u);
  const skinTypes = matchTerms(message, {
    دهنية: ["دهنية", "دهنيه", "زيتي", "oily"],
    مختلطة: ["مختلطة", "مختلطه", "combination"],
    حساسة: ["حساسة", "حساسه", "sensitive"],
    جافة: ["جافة", "جافه", "dry"],
  });
  const concerns = matchTerms(message, {
    المسام: ["مسام", "pores"],
    اللمعان: ["لمعان", "دهون", "oil control"],
    الجفاف: ["جفاف", "ترطيب", "dryness"],
    "تنظيف لطيف": ["غسول", "تنظيف", "cleanser"],
    "دعم الحاجز": ["حاجز", "سيراميد", "barrier"],
  });

  return {
    budgetMinor: numberMatch ? Number(numberMatch[1]) * 100 : undefined,
    skinTypes,
    concerns,
    category: /غسول|تنظيف|cleanser/iu.test(message)
      ? "cleansers"
      : /مرطب|ترطيب|moistur/iu.test(message)
        ? "moisturizers"
        : /سيروم|serum/iu.test(message)
          ? "serums"
          : undefined,
  };
}

function valuesFor(product: UnifiedProduct, key: string) {
  return product.attributes
    .filter((attribute) => attribute.key === key && attribute.verified)
    .flatMap((attribute) => attribute.values);
}

export function selectCandidateProducts(
  products: UnifiedProduct[],
  constraints: AdvisorConstraints,
): RankedProduct[] {
  const eligible = products.filter((product) => {
    if (product.status !== "active" || !product.available || product.stock <= 0) return false;
    if (product.exclusions.length > 0) return false;
    if (constraints.budgetMinor && product.price.amount > constraints.budgetMinor) return false;
    if (constraints.category && product.category !== constraints.category) return false;

    const productSkinTypes = valuesFor(product, "skin_type");
    if (
      constraints.skinTypes.length > 0 &&
      !constraints.skinTypes.some((skinType) => productSkinTypes.includes(skinType))
    ) {
      return false;
    }
    return true;
  });

  return eligible
    .map((product) => {
      const skinMatches = constraints.skinTypes.filter((value) =>
        valuesFor(product, "skin_type").includes(value),
      );
      const concernMatches = constraints.concerns.filter((value) =>
        valuesFor(product, "concern").includes(value),
      );
      const priceFit = constraints.budgetMinor
        ? Math.max(0, 2 - (constraints.budgetMinor - product.price.amount) / constraints.budgetMinor)
        : 1;
      const score = skinMatches.length * 5 + concernMatches.length * 4 + priceFit + product.priority * 0.1;
      const reasons = [
        skinMatches.length ? `مذكور للبشرة ${skinMatches.join(" و")}` : undefined,
        concernMatches.length ? `يطابق احتياج ${concernMatches.join(" و")}` : undefined,
        constraints.budgetMinor ? "ضمن الميزانية المحددة" : undefined,
      ].filter((reason): reason is string => Boolean(reason));
      return {
        ...product,
        score: Number(score.toFixed(2)),
        reason: reasons[0] ?? "متاح وتفاصيله موثقة في بيانات المتجر",
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

export function advise(message: string, products: UnifiedProduct[]) {
  const safety = classifySafety(message);
  const intent = detectIntent(message);
  const constraints = extractConstraints(message);

  if (safety.status === "restricted") {
    return {
      intent: "سؤال حساس",
      constraints,
      safety,
      products: [] as RankedProduct[],
      assistantText: safety.response ?? "لا تتوفر معلومات موثقة كافية للإجابة بأمان.",
    };
  }

  const candidates = selectCandidateProducts(products, constraints);
  if (candidates.length === 0) {
    return {
      intent,
      constraints,
      safety,
      products: candidates,
      assistantText:
        "عذرًا، لم أجد منتجًا متاحًا يطابق طلبك حاليًا. يسعدني توسيع الخيارات أو تعديل أحد الشروط، أو تحويلك لفريق المتجر للمساعدة.",
    };
  }

  const primary = candidates[0];
  const alternatives = candidates.length - 1;
  return {
    intent,
    constraints,
    safety,
    products: candidates,
    assistantText: `أرشّح لك **${primary.name.ar}**؛ ${primary.reason}. ستجد السعر والتوفر المحدّثين في بطاقة المنتج.${alternatives > 0 ? ` وأضفت ${alternatives} من البدائل للمقارنة.` : ""}`,
  };
}
