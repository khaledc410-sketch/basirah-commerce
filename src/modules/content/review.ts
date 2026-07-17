import type {
  AiPatternSignals,
  ArticleDraft,
  ArticleReview,
  ReviewCategoryScore,
  ReviewIssue,
} from "@/modules/content/types";

// عبارات مرتبطة إحصائيًا بالمحتوى المولّد آليًا (عربية وإنجليزية)
const BANNED_PHRASES = [
  "في عالم اليوم",
  "في عصرنا الحالي",
  "من الجدير بالذكر",
  "لا يخفى على أحد",
  "في الختام",
  "يعتبر من أهم",
  "في ظل التطور",
  "بشكل سلس",
  "ثورة في عالم",
  "حجر الزاوية",
  "in today's digital landscape",
  "it's important to note",
  "game-changer",
  "cutting-edge",
  "seamlessly",
  "harness the power",
];

function splitSentences(text: string): string[] {
  return text
    .split(/[.!؟?؛]+/u)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0);
}

function words(text: string): string[] {
  return text.split(/\s+/u).filter((word) => word.length > 0);
}

function draftBodyText(draft: ArticleDraft): string {
  return [
    draft.directAnswer,
    ...draft.sections.flatMap((section) => section.paragraphs),
    ...draft.faqs.map((faq) => faq.answer),
  ].join(" ");
}

export function detectAiPatterns(draft: ArticleDraft): AiPatternSignals {
  const body = draftBodyText(draft);
  const sentences = splitSentences(body);
  const lengths = sentences.map((sentence) => words(sentence).length);
  const mean = lengths.reduce((sum, length) => sum + length, 0) / Math.max(lengths.length, 1);
  const variance =
    lengths.reduce((sum, length) => sum + (length - mean) ** 2, 0) / Math.max(lengths.length, 1);
  const burstiness = mean > 0 ? Math.sqrt(variance) / mean : 0;

  const allWords = words(body.toLowerCase());
  const typeTokenRatio = allWords.length > 0 ? new Set(allWords).size / allWords.length : 0;

  const lowerBody = body.toLowerCase();
  const bannedPhrases = BANNED_PHRASES.filter((phrase) => lowerBody.includes(phrase.toLowerCase()));

  const questionHeadings = draft.sections.filter((section) => section.heading.includes("؟")).length;
  const questionHeadingRatio =
    draft.sections.length > 0 ? questionHeadings / draft.sections.length : 0;

  return {
    burstiness: Number(burstiness.toFixed(3)),
    burstinessBand: burstiness > 0.5 ? "natural" : burstiness >= 0.3 ? "borderline" : "flagged",
    typeTokenRatio: Number(typeTokenRatio.toFixed(3)),
    ttrBand: typeTokenRatio > 0.6 ? "rich" : typeTokenRatio >= 0.4 ? "normal" : "low",
    bannedPhrases,
    questionHeadingRatio: Number(questionHeadingRatio.toFixed(2)),
  };
}

function ratio(passed: number, total: number, max: number): number {
  if (total === 0) return 0;
  return Math.round((passed / total) * max);
}

export function reviewArticle(draft: ArticleDraft): ArticleReview {
  const issues: ReviewIssue[] = [];
  const signals = detectAiPatterns(draft);
  const body = draftBodyText(draft);

  // جودة المحتوى (30)
  const paragraphs = draft.sections.flatMap((section) => section.paragraphs);
  const longParagraphs = paragraphs.filter((paragraph) => words(paragraph).length > 150);
  const directAnswerWords = words(draft.directAnswer).length;
  const contentChecks = [
    directAnswerWords > 0,
    longParagraphs.length === 0,
    draft.keyTakeaways.length >= 3,
    draft.sections.length >= 3,
    splitSentences(body).length >= 8,
    signals.bannedPhrases.length === 0,
  ];
  if (!contentChecks[0])
    issues.push({
      severity: "high",
      category: "contentQuality",
      message: "لا توجد مقدمة مفيدة للقارئ؛ أضف افتتاحية واضحة من الحقائق المتاحة دون استهداف طول ثابت.",
    });
  if (longParagraphs.length > 0)
    issues.push({
      severity: "high",
      category: "contentQuality",
      message: `${longParagraphs.length} فقرة تتجاوز 150 كلمة؛ قسّمها لفكرة واحدة لكل فقرة.`,
    });
  if (signals.bannedPhrases.length > 0)
    issues.push({
      severity: "medium",
      category: "contentQuality",
      message: `عبارات عامة تستحق مراجعة تحريرية: ${signals.bannedPhrases.join("، ")} — استبدلها بخبرة أو مثال محدد إن أمكن.`,
    });

  // تحسين الظهور (25)
  const seoChecks = [
    draft.title.length >= 20 && draft.title.length <= 70,
    draft.metaTitle.length >= 15 && draft.metaTitle.length <= 65,
    draft.metaDescription.length >= 70 && draft.metaDescription.length <= 165,
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(draft.slug),
    draft.sections.length > 0 &&
      draft.sections.every((section) => section.heading.trim().length > 0) &&
      new Set(draft.sections.map((section) => section.heading.trim())).size === draft.sections.length,
  ];
  if (!seoChecks[2])
    issues.push({
      severity: "high",
      category: "seo",
      message: `الوصف التعريفي ${draft.metaDescription.length} حرفًا؛ المستهدف 70–165 حرفًا.`,
    });
  if (!seoChecks[4])
    issues.push({
      severity: "medium",
      category: "seo",
      message: "اجعل عناوين الأقسام وصفية وفريدة وسهلة التصفح؛ لا يلزم أن تكون بصيغة سؤال.",
    });

  // الإسناد والموثوقية (15)
  const evidenceChecks = [
    draft.sources.length > 0,
    draft.limitations.length > 0,
    draft.author.trim().length > 0,
    draft.sections.some((section) =>
      section.paragraphs.some((paragraph) => paragraph.includes("المصدر")),
    ),
  ];
  if (!evidenceChecks[0])
    issues.push({
      severity: "critical",
      category: "evidence",
      message: "لا توجد قائمة مصادر؛ كل ادعاء يحتاج مصدرًا ظاهرًا قبل النشر.",
    });
  if (!evidenceChecks[1])
    issues.push({
      severity: "high",
      category: "evidence",
      message: "لا توجد حدود صريحة للمحتوى؛ أضف ما لا يغطيه الدليل.",
    });

  // العناصر التقنية (15)
  const technicalChecks = [
    Boolean(draft.heroAlt && draft.heroAlt.length > 15),
    draft.faqs.every((faq) => faq.question.trim().length > 0 && faq.answer.trim().length > 0),
    draft.slug.length <= 60,
  ];
  if (!technicalChecks[1])
    issues.push({
      severity: "medium",
      category: "technical",
      message: "يوجد سؤال شائع بلا سؤال أو جواب مكتمل؛ أصلحه أو احذفه. وجود FAQ اختياري وليس شرطًا للبحث التوليدي.",
    });

  // قيمة أصلية ومفيدة للناس (15)
  const peopleFirstChecks = [
    directAnswerWords > 0,
    draft.sources.length > 0,
    draft.author.trim().length > 0,
    draft.keyTakeaways.length >= 3,
  ];
  if (signals.burstinessBand === "flagged")
    issues.push({
      severity: "low",
      category: "peopleFirst",
      message: `تفاوت أطوال الجمل منخفض (${signals.burstiness})؛ هذه ملاحظة أسلوبية للمراجع وليست حكمًا على جودة المحتوى أو ظهوره.`,
    });
  if (signals.ttrBand === "low")
    issues.push({
      severity: "low",
      category: "peopleFirst",
      message: `تنوع المفردات منخفض (${signals.typeTokenRatio})؛ راجعه تحريريًا فقط، فهو لا يثبت أن المحتوى آلي أو غير مفيد.`,
    });

  const categories: ReviewCategoryScore[] = [
    {
      key: "contentQuality",
      label: "جودة المحتوى",
      score: ratio(contentChecks.filter(Boolean).length, contentChecks.length, 30),
      max: 30,
    },
    {
      key: "seo",
      label: "تحسين الظهور",
      score: ratio(seoChecks.filter(Boolean).length, seoChecks.length, 25),
      max: 25,
    },
    {
      key: "evidence",
      label: "الإسناد والموثوقية",
      score: ratio(evidenceChecks.filter(Boolean).length, evidenceChecks.length, 15),
      max: 15,
    },
    {
      key: "technical",
      label: "العناصر التقنية",
      score: ratio(technicalChecks.filter(Boolean).length, technicalChecks.length, 15),
      max: 15,
    },
    {
      key: "peopleFirst",
      label: "القيمة للناس",
      score: ratio(peopleFirstChecks.filter(Boolean).length, peopleFirstChecks.length, 15),
      max: 15,
    },
  ];

  const score = categories.reduce((sum, category) => sum + category.score, 0);
  const hasCritical = issues.some((issue) => issue.severity === "critical");
  const blocking = score < 80 || hasCritical;

  return {
    reviewVersion: "content-review-v2",
    score,
    rating:
      score >= 90
        ? "exceptional"
        : score >= 80
          ? "strong"
          : score >= 70
            ? "acceptable"
            : score >= 60
              ? "below-standard"
              : "rewrite",
    categories,
    issues,
    aiSignals: signals,
    blocking,
    blockingReason: blocking
      ? hasCritical
        ? "توجد مشكلة حرجة (ادعاء بلا مصدر أو عبارات آلية) يجب إصلاحها قبل عرض المسودة للنشر."
        : `الدرجة ${score}/100 دون عتبة النشر (80)؛ عالج القائمة ذات الأولوية ثم أعد الفحص.`
      : "اجتازت المسودة بوابات الفحص؛ تبقى المراجعة البشرية النهائية شرطًا للنشر.",
    limitation:
      "هذا فحص تحريري حتمي لقيمة المسودة وبنيتها وإسنادها وفق مبادئ المحتوى المفيد للناس، وليس ضمانًا للترتيب أو الاستشهاد في أي منصة، ولا يغني عن المراجعة البشرية.",
  };
}
