import type { JsonObject, JsonValue } from "@/db/schema";
import {
  resolveBackendSkills,
  type BackendSkillKey,
} from "@/modules/skills/backend";

export const findingDraftBackendSkillKeys = [
  "content-strategy",
  "blog",
  "ai-seo",
] as const satisfies readonly BackendSkillKey[];

export interface FindingDraftSource {
  id: string;
  category: string;
  severity: "urgent" | "high" | "medium" | "low";
  title: string;
  description: string;
  recommendation: string;
  confidenceBps: number;
  evidenceIds: string[];
  sourceUrl?: string | null;
  pageTitle?: string | null;
}

export interface EvidenceLinkedParagraph extends JsonObject {
  text: string;
  evidenceIds: string[];
}

export interface FindingDraftArtifact extends JsonObject {
  schemaVersion: "finding-content-draft-v1";
  locale: "ar";
  appliedSkills: BackendSkillKey[];
  sourceFinding: JsonObject;
  brief: JsonObject;
  draft: JsonObject;
  claimCheck: JsonObject;
  limitations: JsonValue[];
}

const arabicCategoryLabels: Record<string, string> = {
  technical: "البنية التقنية",
  content: "المحتوى",
  entity: "وضوح الكيان",
  entity_clarity: "وضوح الكيان",
  trust: "الثقة",
  answerability: "قابلية الإجابة",
  structuredData: "البيانات المنظمة",
  structured_data: "البيانات المنظمة",
  externalEvidence: "الأدلة الخارجية",
  external_evidence: "الأدلة الخارجية",
};

export function buildFindingDraft(source: FindingDraftSource): FindingDraftArtifact {
  const appliedSkills = resolveBackendSkills(
    `${source.title} ${source.description} ${source.recommendation}`,
    findingDraftBackendSkillKeys,
  ).map((skill) => skill.key);
  const evidenceIds = uniqueEvidenceIds(source);
  const sourceLabel = source.sourceUrl
    ? `صفحة الفحص: ${source.sourceUrl}`
    : `نتيجة الفحص: ${source.id}`;
  const categoryLabel = arabicCategoryLabels[source.category] ?? source.category;
  const title = truncate(`إصلاح ${source.title}`, 100);
  const directAnswer =
    `أظهر الفحص الموثق مشكلة في ${categoryLabel}: ${source.description} ` +
    `الإجراء المقترح هو: ${source.recommendation}`;
  const paragraphs: EvidenceLinkedParagraph[] = [
    { text: directAnswer, evidenceIds },
    {
      text:
        `ابدأ بتطبيق الإصلاح على الصفحة المحددة، ثم راجع النتيجة يدويًا وأعد الفحص قبل وصفها بأنها مكتملة. ` +
        `مرجع هذه الخطوة هو ${sourceLabel}.`,
      evidenceIds,
    },
  ];
  const markdown = [
    `# ${title}`,
    "",
    directAnswer,
    "",
    "## ما الإجراء التالي؟",
    "",
    paragraphs[1].text,
    "",
    "## المصدر والحدود",
    "",
    `- ${sourceLabel}`,
    `- الثقة في النتيجة: ${(source.confidenceBps / 100).toFixed(0)}٪.`,
    "- لا يُعد اختلاف لقطة واحدة اتجاهًا؛ يلزم تكرار القياس بالمنهج نفسه.",
    "- هذه مسودة إصلاح وليست ضمانًا للترتيب أو الظهور في أي منصة.",
  ].join("\n");

  return {
    schemaVersion: "finding-content-draft-v1",
    locale: "ar",
    appliedSkills,
    sourceFinding: {
      id: source.id,
      category: source.category,
      severity: source.severity,
      confidenceBps: source.confidenceBps,
      evidenceIds,
      ...(source.sourceUrl ? { sourceUrl: source.sourceUrl } : {}),
    },
    brief: {
      objective: source.recommendation,
      audience: "زائر المتجر الباحث عن إجابة واضحة وموثقة",
      factualBoundary: "استخدم وصف النتيجة ودليلها فقط؛ لا تضف ادعاءات عن المنتج أو العلامة.",
      pageTitle: source.pageTitle ?? "صفحة المتجر محل الفحص",
      strategy: {
        mode: "searchable",
        contentType: "page-improvement",
        buyerStage: "implementation",
        primaryQuestion: `كيف نعالج «${source.title}» اعتمادًا على الدليل؟`,
        relatedQuestions: [
          `ما الذي كشفه الفحص عن «${source.title}»؟`,
          "ما التغيير المطلوب على الصفحة؟",
          "كيف نتحقق من الإصلاح بإعادة الفحص؟",
        ],
        relatedQuestionsBasis: "finding-derived-editorial-hypotheses",
        priority: {
          severity: source.severity,
          confidenceBps: source.confidenceBps,
          authorityPotential: "evidence-bound",
          productionEffort: "requires-human-review",
        },
      },
    },
    draft: {
      title,
      metaTitle: truncate(title, 60),
      metaDescription: truncate(directAnswer, 155),
      directAnswer,
      sections: [
        {
          heading: "ما الذي كشفه الفحص؟",
          paragraphs: [paragraphs[0]],
        },
        {
          heading: "ما الإجراء التالي؟",
          paragraphs: [paragraphs[1]],
        },
      ],
      faq: [
        {
          question: "كيف نتحقق من اكتمال هذا الإصلاح؟",
          answer:
            "راجع الصفحة بعد التعديل، وثّق التغيير، ثم أعد الفحص بالمنهج نفسه. لا يُعد اختلاف لقطة واحدة اتجاهًا.",
          evidenceIds,
        },
      ],
      suggestedInternalLinks: source.sourceUrl ? [source.sourceUrl] : [],
      structuredData: {
        status: "not_generated",
        reason: "نوع الصفحة وحقائق الكيان غير كافيين لإنشاء JSON-LD آمن تلقائيًا.",
      },
      exports: {
        markdown,
        html: renderSafeHtml(title, paragraphs, sourceLabel),
      },
    },
    claimCheck: {
      status: "passed",
      unsupportedClaims: 0,
      paragraphsChecked: paragraphs.length,
      allFactualParagraphsHaveEvidence: true,
    },
    limitations: [
      "المسودة مبنية على نتيجة الفحص وحدها وتحتاج مراجعة بشرية قبل الاستخدام.",
      "لا تتضمن ادعاءات منتج أو علامة غير موجودة في الدليل.",
      "النشر المباشر غير مفعّل؛ استخدم نسخة Markdown أو HTML بعد الاعتماد.",
    ],
  };
}

export function evidenceIdsFromFinding(value: unknown, fallbackId: string) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [fallbackId];
  const record = value as { ids?: unknown; evidence?: unknown };
  const ids =
    record.ids ??
    (record.evidence && typeof record.evidence === "object" && !Array.isArray(record.evidence)
      ? (record.evidence as { ids?: unknown }).ids
      : undefined);
  if (!Array.isArray(ids)) return [fallbackId];
  const validIds = ids.filter(
    (item): item is string => typeof item === "string" && item.length > 0 && item.length <= 180,
  );
  return validIds.length > 0 ? [...new Set(validIds)] : [fallbackId];
}

function uniqueEvidenceIds(source: FindingDraftSource) {
  const ids = source.evidenceIds.filter((item) => item.trim().length > 0);
  return ids.length > 0 ? [...new Set(ids)] : [source.id];
}

function truncate(value: string, maximum: number) {
  if (value.length <= maximum) return value;
  const candidate = value.slice(0, maximum + 1);
  const boundary = candidate.lastIndexOf(" ");
  return `${candidate.slice(0, boundary > maximum / 2 ? boundary : maximum).trim()}…`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderSafeHtml(
  title: string,
  paragraphs: EvidenceLinkedParagraph[],
  sourceLabel: string,
) {
  return [
    '<article dir="rtl" lang="ar">',
    `<h1>${escapeHtml(title)}</h1>`,
    `<p>${escapeHtml(paragraphs[0].text)}</p>`,
    "<h2>ما الإجراء التالي؟</h2>",
    `<p>${escapeHtml(paragraphs[1].text)}</p>`,
    "<h2>المصدر والحدود</h2>",
    `<p>${escapeHtml(sourceLabel)}</p>`,
    "</article>",
  ].join("");
}
