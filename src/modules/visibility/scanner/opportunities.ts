import type {
  ContentOpportunity,
  CrawlResult,
  KeywordOpportunity,
  OrganicGrowthPlan,
  PageInspection,
  PageSeoKind,
  ProductSeoEnhancement,
  SearchIntent,
} from "./types";

const genericTitles = new Set([
  "home",
  "homepage",
  "الرئيسية",
  "الصفحة الرئيسية",
  "store",
  "shop",
  "متجر",
]);

function compact(value: string) {
  return value.replace(/\s+/gu, " ").trim();
}

function pageKind(page: PageInspection): PageSeoKind {
  const path = decodeURIComponent(new URL(page.url).pathname).toLowerCase();
  const title = page.title?.toLowerCase() ?? "";
  const types = new Set(page.jsonLdTypes.map((type) => type.toLowerCase()));
  if (path === "/" || path === "") return "home";
  if (types.has("product") || /\/(?:products?\/|p\d+(?:\/|$))/u.test(path)) return "product";
  if (types.has("article") || types.has("blogposting") || /\/(?:blog|articles?|insights?)\//u.test(path)) {
    return "article";
  }
  if (/\/(?:categories?\/|collections?\/|departments?\/|c\d+(?:\/|$))/u.test(path)) return "category";
  if (/(?:privacy|terms|returns?|refund|shipping|سياس|شحن|استرجاع|استبدال|بياناتك|التنبيهات قبل الطلب)/u.test(`${path} ${title}`)) return "policy";
  return "other";
}

function cleanCandidate(value: string | null | undefined, domain: string) {
  if (!value) return null;
  const withoutDomain = compact(value.replace(new RegExp(domain.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&"), "giu"), ""));
  const segments = withoutDomain
    .split(/\s(?:\||–|—|·)\s|\s+-\s+/gu)
    .map(compact)
    .filter(Boolean);
  const meaningfulSegments = segments.filter(
    (segment) => !genericTitles.has(segment.toLowerCase()),
  );
  const candidate = meaningfulSegments.sort((left, right) => {
    const score = (segment: string) => {
      const words = segment.split(/\s+/u).filter(Boolean).length;
      const arabicCharacters = segment.match(/[\u0600-\u06ff]/gu)?.length ?? 0;
      return words * 20 + Math.min(segment.length, 90) + (arabicCharacters > 0 ? 100 : 0);
    };
    return score(right) - score(left);
  })[0] ?? segments[0];
  if (!candidate || genericTitles.has(candidate.toLowerCase())) return null;
  const withoutLeadingLatinBrand = /[\u0600-\u06ff]/u.test(candidate)
    ? candidate.replace(/^(?:[A-Za-z][A-Za-z\d'&.-]*\s+){1,3}(?=[\u0600-\u06ff])/u, "")
    : candidate;
  return withoutLeadingLatinBrand.slice(0, 90).trim();
}

function keywordForPage(page: PageInspection, domain: string) {
  const title = cleanCandidate(page.title, domain);
  if (title) return { keyword: title, source: "title" as const };
  for (const heading of page.headings) {
    const candidate = cleanCandidate(heading, domain);
    if (candidate) return { keyword: candidate, source: "heading" as const };
  }
  const slug = decodeURIComponent(new URL(page.url).pathname)
    .split("/")
    .filter(Boolean)
    .at(-1)
    ?.replace(/[-_]+/gu, " ");
  const candidate = cleanCandidate(slug, domain);
  return candidate ? { keyword: candidate, source: "heading" as const } : null;
}

function intentForKind(kind: PageSeoKind): SearchIntent {
  if (kind === "product") return "transactional";
  if (kind === "category") return "commercial";
  if (kind === "home") return "navigational";
  return "informational";
}

function keywordRationale(kind: PageSeoKind, locale: "ar" | "en") {
  const source = locale === "ar" ? "العنوان أو H1 الحالي" : "the current title or H1";
  const target = locale === "ar"
    ? kind === "product"
      ? "صفحة منتج"
      : kind === "category"
        ? "صفحة فئة"
        : kind === "article"
          ? "مقال"
          : "صفحة الموقع"
    : kind === "product"
      ? "a product page"
      : kind === "category"
        ? "a category page"
        : kind === "article"
          ? "an article"
          : "a site page";
  return locale === "ar"
    ? `مرشح مستخرج من ${source} في ${target}؛ يجب التحقق من الطلب والانطباعات داخل أدوات مشرفي بحث غوغل قبل اعتماده.`
    : `A candidate derived from ${source} on ${target}; validate demand and impressions in Search Console before adoption.`;
}

function productEnhancement(
  page: PageInspection,
  keyword: string,
  domain: string,
  locale: "ar" | "en",
): ProductSeoEnhancement {
  const hasProductSchema = page.jsonLdTypes.some((type) => type.toLowerCase() === "product");
  const actions: string[] = [];
  if (!page.description) {
    actions.push(locale === "ar" ? "اكتب وصفًا تعريفيًا فريدًا يطابق المنتج والنية دون حشو." : "Write a unique meta description that matches the product and intent without stuffing.");
  }
  if (page.h1Count !== 1) {
    actions.push(locale === "ar" ? "استخدم عنوانًا رئيسيًا واحدًا يصف المنتج بدقة ويطابق موضوع الصفحة." : "Use one H1 that accurately describes the product and matches the page topic.");
  }
  if (!hasProductSchema) {
    actions.push(locale === "ar" ? "أضف بيانات المنتج والعرض المنظمة من السعر والمخزون والحقائق الظاهرة فقط." : "Add Product and Offer schema using only visible price, availability, and verified facts.");
  }
  if (page.wordCount < 120) {
    actions.push(locale === "ar" ? "وسّع حقائق المنتج الموثقة: الاستخدام، السمات، المقاس أو المكونات، الشحن والإرجاع عند صلتها." : "Expand verified product facts: use, attributes, size or ingredients, shipping, and returns where relevant.");
  }
  actions.push(locale === "ar" ? "تحقق من هذا المرشح في استعلامات مشرفي بحث غوغل قبل تثبيته كالكلمة الأساسية." : "Validate this candidate in Search Console queries before setting it as the primary keyword.");

  return {
    url: page.url,
    currentTitle: page.title,
    targetKeyword: keyword,
    suggestedTitle: `${keyword} | ${domain}`.slice(0, 65),
    actions,
    evidence: {
      descriptionPresent: Boolean(page.description),
      wordCount: page.wordCount,
      h1Count: page.h1Count,
      hasProductSchema,
    },
  };
}

function contentPlan(
  keywords: KeywordOpportunity[],
  domain: string,
  locale: "ar" | "en",
): ContentOpportunity[] {
  const fallbackUrl = `https://${domain}/`;
  const seeds = keywords.length ? keywords : [{ keyword: domain, targetUrl: fallbackUrl }];
  const definitions = [
    {
      type: "buying-guide" as const,
      ar: "دليل شراء",
      en: "Buying guide",
      titleAr: (keyword: string) => `دليل اختيار ${keyword}: ما الذي يجب التحقق منه قبل الشراء؟`,
      titleEn: (keyword: string) => `How to choose ${keyword}: what to verify before buying`,
    },
    {
      type: "comparison" as const,
      ar: "مقارنة",
      en: "Comparison",
      titleAr: (keyword: string) => `${keyword}: مقارنة الخيارات حسب الاحتياج والاستخدام`,
      titleEn: (keyword: string) => `${keyword}: compare options by need and use case`,
    },
    {
      type: "how-to" as const,
      ar: "شرح عملي",
      en: "How-to",
      titleAr: (keyword: string) => `كيفية اختيار ${keyword} واستخدامه بناءً على حقائق المنتج`,
      titleEn: (keyword: string) => `How to choose and use ${keyword} from verified product facts`,
    },
    {
      type: "faq" as const,
      ar: "أسئلة شائعة",
      en: "FAQ",
      titleAr: (keyword: string) => `أسئلة شائعة عن ${keyword}: الاختيار والشحن والإرجاع`,
      titleEn: (keyword: string) => `Common questions about ${keyword}: choice, shipping, and returns`,
    },
  ];

  return definitions.map((definition, index) => {
    const seed = seeds[index % seeds.length];
    return {
      type: definition.type,
      label: locale === "ar" ? definition.ar : definition.en,
      targetKeyword: seed.keyword,
      workingTitle: locale === "ar" ? definition.titleAr(seed.keyword) : definition.titleEn(seed.keyword),
      sourceUrl: seed.targetUrl,
      reason: locale === "ar"
        ? "يبني على موضوع موجود في الموقع ويجب تحريره بمعلومات أصلية وتجربة أو أدلة حقيقية."
        : "Builds on an existing site topic and must be edited with original information, experience, or real evidence.",
    };
  });
}

function searchConsolePlan(domain: string, locale: "ar" | "en") {
  const property = `sc-domain:${domain}`;
  const consoleUrl = new URL("https://search.google.com/search-console");
  consoleUrl.searchParams.set("resource_id", property);
  const labels = locale === "ar"
    ? ["النقرات", "مرات الظهور", "نسبة النقر", "متوسط الموضع", "الاستعلامات", "الصفحات"]
    : ["Clicks", "Impressions", "CTR", "Average position", "Queries", "Pages"];
  const keys = ["clicks", "impressions", "ctr", "position", "queries", "pages"] as const;
  return {
    status: "not_connected" as const,
    property,
    links: {
      console: consoleUrl.toString(),
      setupGuide: "https://support.google.com/webmasters/answer/34592",
      performanceGuide: "https://support.google.com/webmasters/answer/7576553",
      urlInspectionGuide: "https://support.google.com/webmasters/answer/9012289",
      sitemapsGuide: "https://support.google.com/webmasters/answer/7451001",
    },
    metrics: keys.map((key, index) => ({
      key,
      label: labels[index],
      value: null,
      status: "not_connected" as const,
    })),
  };
}

export function buildOrganicGrowthPlan(
  crawl: CrawlResult,
  locale: "ar" | "en",
): OrganicGrowthPlan {
  const pageSnapshots = crawl.pages.map((page) => ({
    url: page.url,
    kind: pageKind(page),
    title: page.title,
    descriptionPresent: Boolean(page.description),
    wordCount: page.wordCount,
    h1Count: page.h1Count,
    questionHeadingCount: page.questionHeadingCount,
    structuredDataTypes: [...new Set(page.jsonLdTypes)].slice(0, 12),
  }));
  const seenKeywords = new Set<string>();
  const intentPriority: Record<SearchIntent, number> = {
    transactional: 0,
    commercial: 1,
    informational: 2,
    navigational: 3,
  };
  const keywordOpportunities = crawl.pages
    .map((page) => {
      const kind = pageKind(page);
      if (kind === "policy") return null;
      const candidate = keywordForPage(page, crawl.domain);
      if (!candidate) return null;
      const key = candidate.keyword.toLocaleLowerCase(locale === "ar" ? "ar" : "en");
      if (seenKeywords.has(key)) return null;
      seenKeywords.add(key);
      return {
        keyword: candidate.keyword,
        intent: intentForKind(kind),
        targetUrl: page.url,
        source: candidate.source,
        confidence: candidate.source === "title" ? "high" : "medium",
        rationale: keywordRationale(kind, locale),
      } satisfies KeywordOpportunity;
    })
    .filter((item): item is KeywordOpportunity => item !== null)
    .sort((left, right) => intentPriority[left.intent] - intentPriority[right.intent])
    .slice(0, 8);

  const keywordByUrl = new Map(keywordOpportunities.map((item) => [item.targetUrl, item.keyword]));
  const productEnhancements = crawl.pages
    .filter((page) => pageKind(page) === "product")
    .map((page) => {
      const candidate = keywordByUrl.get(page.url) ?? keywordForPage(page, crawl.domain)?.keyword;
      return candidate ? productEnhancement(page, candidate, crawl.domain, locale) : null;
    })
    .filter((item): item is ProductSeoEnhancement => item !== null)
    .slice(0, 5);

  return {
    source: "deterministic-public-pages",
    keywordMethod: locale === "ar"
      ? "مرشحات موضوعية من عناوين الصفحات والعنوان الرئيسي في العينة؛ لا تتضمن حجم البحث أو صعوبة الكلمة قبل ربط مشرفي بحث غوغل أو مصدر كلمات موثوق."
      : "Topic candidates from sampled page titles and H1s; search volume and keyword difficulty are unavailable until Search Console or a verified keyword source is connected.",
    pageSnapshots,
    keywordOpportunities,
    productEnhancements,
    contentOpportunities: contentPlan(keywordOpportunities, crawl.domain, locale),
    searchConsole: searchConsolePlan(crawl.domain, locale),
  };
}
