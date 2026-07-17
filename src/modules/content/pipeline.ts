import type { UnifiedProduct, UnifiedStore } from "@/core/commerce/types";
import type {
  ArticleBrief,
  ArticleDraft,
  ArticleFact,
  ArticleOutline,
  ContentBuyerStage,
} from "@/modules/content/types";

export interface BriefRequest {
  topic: string;
  targetQuery: string;
  audience: string;
  demandEvidence: string;
  slug: string;
}

const factSourceLabels: Record<string, string> = {
  document: "ورقة المنتج المرفوعة من المتجر",
  merchant: "بيانات المنتج المدخلة من المتجر",
  platform: "بيانات منصة المتجر",
};

function inferBuyerStage(query: string): ContentBuyerStage {
  if (/كيفية|كيف|خطوات|دليل|شرح|ما هو|ما هي/u.test(query)) return "awareness";
  if (/أفضل|مقارنة|مقابل|الفرق|أنسب/u.test(query)) return "consideration";
  if (/سعر|شراء|اطلب|توصيل|ضمان|تقييم/u.test(query)) return "decision";
  if (/استخدام|تركيب|إعداد|تشغيل|العناية/u.test(query)) return "implementation";
  return "consideration";
}

function buildRelatedQuestions(topic: string, targetQuery: string): string[] {
  const normalizedTopic = topic.replace(/[؟?]+$/u, "").trim();
  const normalizedQuery = targetQuery.replace(/[؟?]+$/u, "").trim();
  return [
    `ما الحقائق الموثقة التي تجيب عن «${normalizedQuery}»؟`,
    `كيف تقارن الخيارات المرتبطة بموضوع «${normalizedTopic}»؟`,
    `ما الذي يجب التحقق منه قبل اتخاذ قرار الشراء؟`,
    `ما المعلومات الناقصة التي ينبغي توثيقها قبل الاعتماد على هذا الدليل؟`,
    `ما الخطوة العملية التالية بعد اختيار الخيار المناسب؟`,
  ];
}

export function collectVerifiedFacts(products: UnifiedProduct[]): ArticleFact[] {
  return products.flatMap((product) =>
    product.attributes
      .filter((attribute) => attribute.verified)
      .map((attribute) => ({
        claim: `${product.name.ar}: ${attribute.label.ar} — ${attribute.values.join("، ")}`,
        source: factSourceLabels[attribute.source] ?? attribute.source,
        verified: true,
        productId: product.id,
      })),
  );
}

export function buildBrief(
  store: UnifiedStore,
  products: UnifiedProduct[],
  request: BriefRequest,
): ArticleBrief {
  const facts = collectVerifiedFacts(products);
  const missingFacts = products
    .filter(
      (product) =>
        !product.attributes.some(
          (attribute) => attribute.verified && attribute.source === "document",
        ),
    )
    .map((product) => `${product.name.ar}: لا يوجد مستند معتمد يدعم حقائق المكونات أو المواصفات.`);

  return {
    briefVersion: "content-brief-v1",
    topic: request.topic,
    targetQuery: request.targetQuery,
    audience: request.audience,
    demandEvidence: request.demandEvidence,
    storeName: store.name,
    facts,
    missingFacts,
    suggestedSlug: request.slug,
    strategy: {
      mode: "searchable",
      contentType: "evidence-led-guide",
      buyerStage: inferBuyerStage(request.targetQuery),
      primaryReaderQuestion: request.targetQuery,
      relatedQuestions: buildRelatedQuestions(request.topic, request.targetQuery),
      relatedQuestionsBasis: "editorial-hypotheses",
      demandBasis: "merchant-provided",
    },
  };
}

export function buildOutline(brief: ArticleBrief): ArticleOutline {
  const factRefs = brief.facts.map((_, index) => index);
  return {
    outlineVersion: "content-outline-v1",
    title: brief.topic,
    directAnswerGoal:
      "افتتاحية واضحة ومفيدة تجيب حاجة القارئ من الحقائق الموثّقة فقط، دون استهداف طول أو صياغة خاصة بمحركات الذكاء الاصطناعي.",
    sections: [
      {
        heading: `${brief.targetQuery}`,
        isQuestion: true,
        goal: "افتتاحية بأسلوب الإجابة أولًا تجيب السؤال المستهدف مباشرة.",
        factRefs: factRefs.slice(0, 2),
      },
      {
        heading: "ما تؤكده بيانات المنتجات الموثّقة",
        isQuestion: false,
        goal: "عرض الحقائق المسندة لمصدر، حقيقة حقيقة، دون تعميم.",
        factRefs,
      },
      {
        heading: "خطوات الاختيار بثقة",
        isQuestion: false,
        goal: "خطوات عملية قصيرة مبنية على الحقائق المتاحة فقط.",
        factRefs: factRefs.slice(0, 3),
      },
      {
        heading: "حدود هذا الدليل",
        isQuestion: false,
        goal: "تصريح واضح بما لا يغطيه المحتوى وما يحتاج مختصًا.",
        factRefs: [],
      },
    ],
    faqCount: Math.min(3 + (brief.facts.length > 6 ? 2 : 0), 5),
  };
}

function truncateAtWord(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  const cut = text.slice(0, maxLength + 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > 40 ? lastSpace : maxLength)}…`;
}

export function composeDraft(brief: ArticleBrief, outline: ArticleOutline): ArticleDraft {
  const storeName = brief.storeName.ar;
  const primaryFacts = brief.facts.slice(0, 3);

  const directAnswer =
    `${brief.targetQuery.replace(/؟$/u, "")}؟ الإجابة المختصرة: ابدأ بالحقائق الموثّقة قبل أي وعد تسويقي. ` +
    (primaryFacts.length > 0
      ? `تؤكد ${primaryFacts[0].source} أن ${primaryFacts[0].claim}. `
      : "") +
    "قارن ما هو مسند لمصدر فقط، وتأكد من ملاءمة الخيار لحاجتك قبل الشراء. اتبع إرشادات المنتج الموثقة وأي متطلبات سلامة خاصة به.";

  const sections = outline.sections.map((section) => {
    if (section.factRefs.length === 0) {
      return {
        heading: section.heading,
        paragraphs: [
          "هذا المحتوى تثقيفي عام مبني على بيانات المتجر الموثّقة، وليس تشخيصًا أو ضمان نتيجة. الحالات الفردية والأعراض المستمرة تحتاج تقييم مختص مؤهل.",
          ...brief.missingFacts.map((missing) => `حقيقة ناقصة تحتاج توثيقًا قبل النشر: ${missing}`),
        ],
      };
    }
    const facts = section.factRefs
      .map((index) => brief.facts[index])
      .filter((fact): fact is ArticleFact => Boolean(fact));
    return {
      heading: section.heading,
      paragraphs: [
        `${section.goal} استنادًا إلى ${facts.length} من الحقائق المسندة لمصدر في بيانات ${storeName}.`,
        ...facts.map((fact) => `${fact.claim}. المصدر: ${fact.source}.`),
      ],
    };
  });

  const faqs = primaryFacts.map((fact) => ({
    question: `هل «${fact.claim.split(":")[0]}» موثّق فعلًا؟`,
    answer: `نعم ضمن حدود المصدر المتاح: ${fact.claim}. المصدر: ${fact.source}. خارج هذا النطاق لا نقدم ادعاءً إضافيًا.`,
  }));

  const uniqueSources = [...new Set(brief.facts.map((fact) => fact.source))];

  return {
    draftVersion: "content-draft-v1",
    title: brief.topic,
    slug: brief.suggestedSlug,
    metaTitle: truncateAtWord(`${brief.topic} | ${storeName}`, 60),
    metaDescription: truncateAtWord(
      `${brief.targetQuery} إجابة عملية من حقائق موثّقة في بيانات ${storeName}، مع خطوات اختيار واضحة وحدود صريحة لما لا يغطيه الدليل.`,
      160,
    ),
    directAnswer,
    keyTakeaways: [
      `الطلب حقيقي: ${brief.demandEvidence}.`,
      ...primaryFacts.slice(0, 2).map((fact) => `${fact.claim} (${fact.source}).`),
      "أي ادعاء بلا مصدر في هذا الدليل يعامل كحقيقة ناقصة، لا كوعد.",
    ],
    sections,
    faqs,
    sources: uniqueSources.map((source) => ({
      name: source,
      detail: "بيانات متجر تجريبية معلَّمة — تحتاج مراجعة التاجر قبل النشر.",
    })),
    limitations: [
      "المحتوى تثقيفي عام ولا يقيّم حالة فردية ولا يضمن نتيجة.",
      "المسودة غير مفهرسة حتى اكتمال المراجعة البشرية واعتماد الروابط النهائية.",
      ...brief.missingFacts,
    ],
    author: `فريق محتوى ${storeName}`,
    heroAlt: `صورة تعبيرية لموضوع «${brief.topic}» بهوية ${storeName}`,
  };
}

export function buildArticleJsonLd(store: UnifiedStore, draft: ArticleDraft) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: draft.title,
    description: draft.metaDescription,
    inLanguage: "ar",
    author: { "@type": "Organization", name: draft.author },
    publisher: { "@type": "Organization", name: store.name.ar },
    mainEntityOfPage: `https://${store.domain}/insights/${draft.slug}`,
  };
}

export function buildFaqJsonLd(draft: ArticleDraft) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: draft.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };
}
