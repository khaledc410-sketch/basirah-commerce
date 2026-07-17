import "server-only";

import type {
  CheckStatus,
  CrawlResult,
  ReadinessComponentKey,
  ScanComponent,
  ScanEvidence,
  ScanFinding,
  VisibilityScanReport,
} from "./types";
import { buildOrganicGrowthPlan } from "./opportunities";

const componentMetadata: Record<
  ReadinessComponentKey,
  { label: string; weight: number }
> = {
  technical: { label: "الجاهزية التقنية", weight: 25 },
  content: { label: "قيمة المحتوى واكتماله", weight: 30 },
  entity: { label: "وضوح العلامة والكيان", weight: 10 },
  trust: { label: "الثقة والسلطة", weight: 15 },
  answerability: { label: "الوضوح والفائدة للقارئ", weight: 10 },
  structuredData: { label: "البيانات المنظمة", weight: 5 },
  externalEvidence: { label: "الأدلة الخارجية", weight: 5 },
};

export interface DeterministicCheck {
  key: string;
  component: ReadinessComponentKey;
  status: CheckStatus;
  message: string;
  urls?: string[];
  /** Evidence-only checks are visible in the report but excluded from scoring and coverage. */
  scorable?: boolean;
  finding?: Omit<ScanFinding, "id" | "component" | "evidenceIds">;
}

function percentage(numerator: number, denominator: number) {
  return denominator > 0 ? Math.round((numerator / denominator) * 100) : 0;
}

function ratioPass(value: number, threshold: number) {
  return value >= threshold ? "pass" : "fail";
}

function evidenceId(check: DeterministicCheck) {
  return `ev-${check.component}-${check.key}`;
}

function buildChecks(crawl: CrawlResult, locale: "ar" | "en"): DeterministicCheck[] {
  const { pages } = crawl;
  const pageCount = pages.length;
  const canonicalPages = pages.filter((page) => Boolean(page.canonical));
  const titledPages = pages.filter((page) => Boolean(page.title && page.description));
  const arabicPages = pages.filter((page) => page.arabicCharacterRatio >= 0.25);
  const pagesWithH1 = pages.filter((page) => page.h1Count === 1);
  const jsonLdPages = pages.filter((page) => page.jsonLdBlocks > 0 && page.invalidJsonLdBlocks === 0);
  const allTypes = new Set(pages.flatMap((page) => page.jsonLdTypes.map((type) => type.toLowerCase())));
  const policyKinds = new Set(pages.flatMap((page) => page.policyKinds));
  const internalPaths = pages.flatMap((page) => page.internalLinks.map((link) => new URL(link).pathname.toLowerCase()));
  const hasIdentityPage = internalPaths.some((path) => /about|contact|من-نحن|اتصل|تواصل/u.test(path));
  const hasContact = pages.some((page) => page.hasEmail || page.hasPhone);
  const hasQuestions = pages.some(
    (page) => page.questionHeadingCount > 0 || page.jsonLdTypes.some((type) => type.toLowerCase() === "faqpage"),
  );
  // Older persisted fixtures predate rootPageStatus and always stored the
  // submitted root first. An explicit unavailable value prevents a product or
  // category page at pages[0] from being mistaken for the home page.
  const rootPage = crawl.rootPageStatus === "unavailable" ? undefined : pages[0];
  const rootNoindex = rootPage?.robotsDirectives?.includes("noindex") ?? false;
  const platformAccessChecks: DeterministicCheck[] = crawl.robots.access
    ? [
        {
          key: "googlebot-root-access",
          component: "technical",
          status: crawl.robots.access.retrieval.googlebot ? "pass" : "fail",
          message: crawl.robots.access.retrieval.googlebot
            ? "يسمح robots.txt لـ Googlebot بقراءة الصفحة الرئيسية."
            : "يمنع robots.txt روبوت Googlebot من قراءة الصفحة الرئيسية.",
          urls: [crawl.requestedUrl],
          finding: {
            title: "Googlebot محظور عن الصفحة الرئيسية",
            description:
              "يمنع robots.txt روبوت Google Search من قراءة الصفحة الرئيسية، وهذا يعيق أهلية الصفحة للفهرسة وميزات البحث المدعومة بالذكاء الاصطناعي.",
            severity: "high",
            recommendation:
              "اسمح لـ Googlebot بقراءة الصفحات العامة المقصودة للفهرسة بعد مراجعة الخصوصية والبيئات غير الإنتاجية؛ السماح لا يضمن الفهرسة أو الظهور.",
          },
        },
        {
          key: "oai-searchbot-root-access",
          component: "technical",
          status: crawl.robots.access.retrieval.oaiSearchBot ? "pass" : "fail",
          message: crawl.robots.access.retrieval.oaiSearchBot
            ? "يسمح robots.txt لـ OAI-SearchBot بقراءة الصفحة الرئيسية."
            : "يمنع robots.txt روبوت OAI-SearchBot من قراءة الصفحة الرئيسية.",
          urls: [crawl.requestedUrl],
          finding: {
            title: "روبوت بحث ChatGPT محظور",
            description:
              "يمنع robots.txt روبوت OAI-SearchBot المستخدم في بحث ChatGPT من قراءة الصفحة الرئيسية.",
            severity: "medium",
            recommendation:
              "إذا كان الظهور في بحث ChatGPT هدفًا للمتجر، اسمح لـ OAI-SearchBot بقراءة الصفحات العامة المقصودة بعد مراجعة سياسة الخصوصية؛ السماح لا يضمن الذكر أو الاستشهاد.",
          },
        },
        {
          key: "gptbot-training-control",
          component: "externalEvidence",
          status: "unknown",
          scorable: false,
          message: crawl.robots.access.training.gptBot
            ? "GPTBot مسموح على الصفحة الرئيسية؛ هذا إعداد تدريب محتمل ولا يقيس ظهور بحث ChatGPT."
            : "GPTBot محظور على الصفحة الرئيسية؛ هذا خيار تدريب ولا يُخصم من درجة الظهور.",
          urls: [crawl.requestedUrl],
        },
        {
          key: "google-extended-training-control",
          component: "externalEvidence",
          status: "unknown",
          scorable: false,
          message: crawl.robots.access.training.googleExtended
            ? "Google-Extended مسموح على الصفحة الرئيسية؛ هذا تحكم في استخدامات Gemini وليس شرطًا لميزات Google Search."
            : "Google-Extended محظور على الصفحة الرئيسية؛ هذا خيار استخدام/تدريب ولا يُخصم من درجة الظهور في Google Search.",
          urls: [crawl.requestedUrl],
        },
      ]
    : [];

  return [
    {
      key: "crawlable-pages",
      component: "technical",
      status: pageCount > 0 ? "pass" : "fail",
      message: `تمكنت بصيرة من قراءة ${pageCount} صفحة HTML عامة.`,
    },
    ...platformAccessChecks,
    {
      key: "root-indexability",
      component: "technical",
      status: !rootPage ? "unknown" : rootNoindex ? "fail" : "pass",
      message: !rootPage
        ? "تعذر التحقق من قابلية فهرسة الصفحة الرئيسية."
        : rootNoindex
          ? "تعلن الصفحة الرئيسية توجيه noindex."
          : "لم تعلن الصفحة الرئيسية توجيه noindex.",
      urls: rootNoindex && rootPage ? [rootPage.url] : [],
      finding: {
        title: "الصفحة الرئيسية تطلب عدم الفهرسة",
        description: "تتضمن الصفحة الرئيسية توجيه noindex يمنع فهرستها في محركات البحث.",
        severity: "high",
        recommendation: "أزل noindex فقط إذا كانت الصفحة مقصودة للفهرسة وبعد مراجعة إعدادات البيئة والمنصة.",
      },
    },
    {
      key: "sitemap",
      component: "technical",
      status:
        crawl.sitemap.status === "available"
          ? "pass"
          : crawl.sitemap.status === "unavailable"
            ? "unknown"
            : "fail",
      message:
        crawl.sitemap.status === "available"
          ? `عُثر على خريطة موقع تضم ${crawl.sitemap.urlsDiscovered} رابطًا.`
          : crawl.sitemap.status === "unavailable"
            ? "تعذر التحقق من خريطة الموقع مؤقتًا، لذلك لم تُحسب كفشل."
            : "لم نعثر على خريطة موقع XML قابلة للقراءة.",
      finding: {
        title: "خريطة الموقع غير متاحة",
        description: "لم يتمكن الفاحص من اكتشاف sitemap صالحة ضمن النطاق.",
        severity: "medium",
        recommendation: "أنشئ sitemap.xml، أدرج الصفحات الأساسية فيها، واربطها من robots.txt.",
      },
    },
    {
      key: "canonical-coverage",
      component: "technical",
      status: ratioPass(canonicalPages.length / pageCount, 0.7),
      message: `${percentage(canonicalPages.length, pageCount)}٪ من الصفحات المفحوصة تعلن canonical.`,
      urls: pages.filter((page) => !page.canonical).map((page) => page.url),
      finding: {
        title: "تغطية canonical منخفضة",
        description: "بعض الصفحات لا تعلن النسخة الأساسية منها بوضوح.",
        severity: "medium",
        recommendation: "أضف canonical ذاتية صحيحة لكل صفحة قابلة للفهرسة.",
      },
    },
    {
      key: "metadata-coverage",
      component: "content",
      status: ratioPass(titledPages.length / pageCount, 0.7),
      message: `${percentage(titledPages.length, pageCount)}٪ من الصفحات لديها عنوان ووصف تعريفيان.`,
      urls: pages.filter((page) => !page.title || !page.description).map((page) => page.url),
      finding: {
        title: "عناوين أو أوصاف ناقصة",
        description: "يصعب فهم غرض بعض الصفحات من بياناتها التعريفية.",
        severity: "high",
        recommendation: "اكتب عنوانًا ووصفًا عربيين فريدين يصفان الصفحة دون حشو.",
      },
    },
    {
      key: "language-coverage",
      component: "content",
      status: locale === "ar" ? ratioPass(arabicPages.length / pageCount, 0.6) : "unknown",
      message: locale === "ar" ? `${percentage(arabicPages.length, pageCount)}٪ من الصفحات تحتوي محتوى عربيًا جوهريًا.` : "لم يُطلب تقييم تغطية المحتوى العربي في هذا الفحص.",
      urls: locale === "ar" ? pages.filter((page) => page.arabicCharacterRatio < 0.25).map((page) => page.url) : [],
      finding: {
        title: "التغطية العربية محدودة",
        description: "لا تقدم غالبية الصفحات المفحوصة نصًا عربيًا كافيًا لفهم المتجر.",
        severity: "high",
        recommendation: "أضف محتوى عربيًا أصليًا يشرح المنتج والاستخدام والسياسات بوضوح.",
      },
    },
    {
      key: "content-depth",
      component: "content",
      status: "unknown",
      scorable: false,
      message:
        "سُجل حجم النص المرئي كدليل سياقي فقط؛ لا يوجد طول مثالي ثابت للصفحة، ولا يمكن للفاحص الحتمي وحده الحكم على أصالة المحتوى أو فائدته.",
      urls: pages.map((page) => page.url),
    },
    {
      key: "organization-schema",
      component: "structuredData",
      status: allTypes.has("organization") || allTypes.has("localbusiness") ? "pass" : "fail",
      message: allTypes.has("organization") || allTypes.has("localbusiness") ? "عُثر على كيان Organization أو LocalBusiness منظم." : "لم نعثر على تعريف منظم للعلامة التجارية.",
      finding: {
        title: "هوية العلامة غير منظمة",
        description: "لا تعلن الصفحات المفحوصة كيان العلامة عبر Organization أو LocalBusiness ضمن البيانات المنظمة.",
        severity: "low",
        recommendation: "أضف Organization JSON-LD متسقًا مع الحقائق الظاهرة إذا كان مناسبًا لأهلية نتائج Google الغنية؛ ليس شرطًا للظهور في البحث التوليدي.",
      },
    },
    {
      key: "identity-page",
      component: "entity",
      status: hasIdentityPage ? "pass" : "fail",
      message: hasIdentityPage ? "عُثر على رابط تعريفي أو وسيلة تواصل داخلية." : "لم يظهر رابط واضح لصفحة من نحن أو التواصل.",
      finding: {
        title: "سياق العلامة محدود",
        description: "لا تظهر صفحة تعريف أو تواصل واضحة في الروابط التي اكتشفناها.",
        severity: "low",
        recommendation: "أنشئ صفحة من نحن موثقة وصفحة تواصل واربطهما من التنقل الرئيسي أو التذييل.",
      },
    },
    {
      key: "policy-coverage",
      component: "trust",
      status: policyKinds.size >= 2 ? "pass" : "fail",
      message: `عُثر على ${policyKinds.size} من أنواع صفحات السياسات الأساسية.`,
      finding: {
        title: "سياسات الثقة غير مكتملة",
        description: "لا تظهر سياسات الشحن والاسترجاع والخصوصية والشروط بما يكفي.",
        severity: "high",
        recommendation: "انشر السياسات الفعلية بوضوح واربطها من جميع الصفحات.",
      },
    },
    {
      key: "contact-details",
      component: "trust",
      status: hasContact ? "pass" : "fail",
      message: hasContact ? "عُثر على وسيلة اتصال قابلة للاستخراج." : "لم نعثر على بريد أو هاتف واضح في الصفحات المفحوصة.",
      finding: {
        title: "بيانات التواصل غير واضحة",
        description: "لا يستطيع الزائر أو محرك الإجابة استخراج وسيلة اتصال مباشرة.",
        severity: "medium",
        recommendation: "أضف بيانات تواصل صحيحة ومتسقة في صفحة التواصل والتذييل.",
      },
    },
    {
      key: "heading-structure",
      component: "answerability",
      status: ratioPass(pagesWithH1.length / pageCount, 0.7),
      message: `${percentage(pagesWithH1.length, pageCount)}٪ من الصفحات تستخدم عنوان H1 واحدًا.`,
      urls: pages.filter((page) => page.h1Count !== 1).map((page) => page.url),
      finding: {
        title: "بنية العناوين غير واضحة",
        description: "بعض الصفحات لا تستخدم H1 واحدًا يوضح موضوع الصفحة.",
        severity: "medium",
        recommendation: "استخدم H1 واحدًا دقيقًا ثم نظّم الأقسام بعناوين H2 وH3 وصفية.",
      },
    },
    {
      key: "question-content",
      component: "answerability",
      status: "unknown",
      scorable: false,
      message: hasQuestions
        ? "عُثر على أسئلة أو FAQ؛ سُجلت كدليل سياقي لأنها مفيدة فقط عندما تخدم حاجة حقيقية للقارئ."
        : "لم نعثر على أسئلة أو FAQ؛ لا يُعد غيابها فشلًا لأن Google لا يشترط صيغة سؤال وجواب للبحث التوليدي.",
    },
    {
      key: "jsonld-validity",
      component: "structuredData",
      status: ratioPass(jsonLdPages.length / pageCount, 0.5),
      message: `${percentage(jsonLdPages.length, pageCount)}٪ من الصفحات تحتوي JSON-LD صالحًا.`,
      urls: pages.filter((page) => page.jsonLdBlocks === 0 || page.invalidJsonLdBlocks > 0).map((page) => page.url),
      finding: {
        title: "البيانات المنظمة ناقصة أو غير صالحة",
        description: "لا تقدم غالبية العينة JSON-LD صالحًا ومتطابقًا مع المحتوى الظاهر.",
        severity: "medium",
        recommendation: "أضف JSON-LD صالحًا عند ملاءمته لنتائج Google الغنية واختبره مقابل الحقائق الظاهرة؛ ليس مطلوبًا للبحث التوليدي.",
      },
    },
    {
      key: "product-schema",
      component: "structuredData",
      status: allTypes.has("product") ? "pass" : "fail",
      message: allTypes.has("product") ? "عُثر على Product schema ضمن العينة." : "لم نعثر على Product schema ضمن العينة.",
      finding: {
        title: "بيانات المنتجات غير منظمة",
        description: "لم يظهر Product JSON-LD في الصفحات التي تمكن الفاحص من قراءتها.",
        severity: "medium",
        recommendation: "أضف Product وOffer بالقيم الحقيقية المتطابقة مع الصفحة والمخزون لدعم أهلية نتائج التسوق والغنية؛ ليسا شرطًا لميزات Google التوليدية.",
      },
    },
    {
      key: "external-mentions",
      component: "externalEvidence",
      status: "unknown",
      message: "لا يقيس فحص الموقع وحده الإشارات أو الاستشهادات الخارجية.",
    },
  ];
}

export function calculateComponentScores(checks: DeterministicCheck[]): {
  score: number;
  coverage: number;
  components: ScanComponent[];
} {
  const components = Object.entries(componentMetadata).map(([key, metadata]) => {
    const componentChecks = checks.filter(
      (check) => check.component === key && check.scorable !== false,
    );
    const knownChecks = componentChecks.filter((check) => check.status !== "unknown");
    const passedChecks = knownChecks.filter((check) => check.status === "pass");
    return {
      key: key as ReadinessComponentKey,
      label: metadata.label,
      weight: metadata.weight,
      score: knownChecks.length ? percentage(passedChecks.length, knownChecks.length) : null,
      coverage: percentage(knownChecks.length, componentChecks.length),
    };
  });

  const knownWeight = components.reduce(
    (total, component) => total + component.weight * (component.coverage / 100),
    0,
  );
  const weightedScore = components.reduce(
    (total, component) =>
      total + (component.score ?? 0) * component.weight * (component.coverage / 100),
    0,
  );
  return {
    score: knownWeight > 0 ? Math.round(weightedScore / knownWeight) : 0,
    coverage: Math.round(knownWeight),
    components,
  };
}

export function evaluateCrawl(crawl: CrawlResult, locale: "ar" | "en"): VisibilityScanReport {
  const checks = buildChecks(crawl, locale);
  const calculated = calculateComponentScores(checks);
  const unavailablePageUrls = crawl.unavailablePageUrls ?? [];
  const sampleDenominator = Math.max(crawl.pages.length, crawl.attemptedPages);
  const unavailablePageCount = Math.max(
    unavailablePageUrls.length,
    sampleDenominator - crawl.pages.length,
  );
  const sampleCoverage = percentage(crawl.pages.length, sampleDenominator);
  const components = calculated.components.map((component) => ({
    ...component,
    coverage: Math.round((component.coverage * sampleCoverage) / 100),
  }));
  const coverage = Math.round(
    components.reduce(
      (total, component) => total + component.weight * (component.coverage / 100),
      0,
    ),
  );
  const score = calculated.score;
  const evidence: ScanEvidence[] = checks.map((check) => ({
    id: evidenceId(check),
    component: check.component,
    checkKey: check.key,
    status: check.status,
    message: check.message,
    urls: check.urls ?? [],
  }));
  if (unavailablePageCount > 0) {
    evidence.push({
      id: "ev-technical-page-fetch-coverage",
      component: "technical",
      checkKey: "page-fetch-coverage",
      status: "unknown",
      message: `تعذر التحقق من ${unavailablePageCount} رابطًا مرشحًا، لذلك خُفضت التغطية دون احتسابها كفشل.`,
      urls: unavailablePageUrls,
    });
  }
  const severityOrder = { high: 0, medium: 1, low: 2 } as const;
  const findings = checks
    .filter((check) => check.status === "fail" && check.finding)
    .map((check) => ({
      id: `finding-${check.component}-${check.key}`,
      component: check.component,
      ...check.finding!,
      evidenceIds: [evidenceId(check)],
    }))
    .sort((left, right) => severityOrder[left.severity] - severityOrder[right.severity] || left.id.localeCompare(right.id));
  const pageBreadth = Math.min(1, 0.5 + crawl.pages.length / 20);

  return {
    domain: crawl.domain,
    score,
    coverage,
    confidence: Math.round(coverage * pageBreadth),
    components,
    findings,
    evidence,
    organicGrowthPlan: buildOrganicGrowthPlan(crawl, locale),
    limitations: [
      "هذه نتيجة جاهزية حتمية للموقع وليست قياسًا لترتيب أو ظهور فعلي في Google أو ChatGPT أو Gemini.",
      "الأدلة الخارجية وبيانات Search Console، بما فيها تقرير أداء الذكاء الاصطناعي التوليدي، غير متاحة في الفحص المجاني ولم تُحسب كفشل.",
      `حلل الفاحص HTML وXML فقط دون تشغيل JavaScript، وبحد أقصى 10 صفحات؛ تمت قراءة ${crawl.pages.length} صفحة.`,
      "لا يستطيع هذا الفحص وحده التحقق من أصالة المحتوى أو تجربة الصفحة أو Merchant Center أو Google Business Profile؛ تحتاج هذه العناصر إلى مصادر أو مراجعة إضافية.",
      ...(crawl.sitemap.status === "unavailable"
        ? ["تعذر التحقق من خريطة الموقع مؤقتًا، فخُفضت التغطية دون تسجيل مشكلة مؤكدة."]
        : []),
      ...(unavailablePageCount
        ? [`تعذر التحقق من ${unavailablePageCount} رابطًا مرشحًا، وانعكس ذلك على التغطية والثقة.`]
        : []),
    ],
    scannedAt: crawl.scannedAt,
    pagesScanned: crawl.pages.length,
  };
}
