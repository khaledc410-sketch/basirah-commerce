import "server-only";

import { generateText, Output } from "ai";
import { z } from "zod";

import { getServerEnv } from "@/config/env";
import {
  buildBackendSkillInstructions,
  resolveBackendSkills,
  type BackendSkillKey,
} from "@/modules/skills";

export const visibilityReportBackendSkillKeys = [
  "ai-seo",
  "canvas-design",
] as const satisfies readonly BackendSkillKey[];

const visibilityReportSkillInstructions = buildBackendSkillInstructions(
  resolveBackendSkills(
    "Create an evidence-led AI visibility PDF report with a visual report layout",
    visibilityReportBackendSkillKeys,
  ),
);

export const reportNarrativeSchema = z.object({
  executiveSummary: z.string().min(40).max(1_200),
  strengths: z.array(z.string().min(10).max(240)).max(4),
  priorities: z
    .array(
      z.object({
        findingId: z.string().min(1),
        title: z.string().min(5).max(160),
        reason: z.string().min(10).max(360),
        nextAction: z.string().min(10).max(360),
      }),
    )
    .max(8),
  plan30Days: z.array(z.string().min(10).max(280)).min(1).max(6),
  plan60Days: z.array(z.string().min(10).max(280)).min(1).max(6),
  plan90Days: z.array(z.string().min(10).max(280)).min(1).max(6),
  limitations: z.array(z.string().min(10).max(320)).min(1).max(6),
});

export type ArabicReportNarrative = z.infer<typeof reportNarrativeSchema>;

export interface NarrativeFindingInput {
  id: string;
  title: string;
  description: string;
  recommendation: string;
  severity: "high" | "medium" | "low";
  evidenceIds: string[];
}

export interface NarrativeReportInput {
  domain: string;
  score: number;
  coverage: number;
  confidence: number;
  findings: NarrativeFindingInput[];
  limitations: string[];
}

export interface GeneratedNarrative {
  narrative: ArabicReportNarrative;
  source: "ai" | "deterministic";
  modelId: string | null;
  promptVersion: "visibility-report-ar-v1";
  appliedSkills: BackendSkillKey[];
  durationMs: number;
}

function severityLabel(severity: NarrativeFindingInput["severity"]) {
  return severity === "high" ? "مرتفعة" : severity === "medium" ? "متوسطة" : "منخفضة";
}

export function buildDeterministicArabicNarrative(
  input: NarrativeReportInput,
): ArabicReportNarrative {
  const priorities = input.findings.slice(0, 5).map((finding) => ({
    findingId: finding.id,
    title: finding.title,
    reason: `أولوية ${severityLabel(finding.severity)} مدعومة بالدليل المسجل في الفحص: ${finding.description}`,
    nextAction: finding.recommendation,
  }));

  const first = priorities[0];
  return {
    executiveSummary:
      `سجل ${input.domain} جاهزية مقدارها ${input.score} من 100 بتغطية ${input.coverage}٪ وثقة ${input.confidence}٪. ` +
      (first
        ? `أقرب خطوة عملية هي «${first.title}». الدرجة تقيس قابلية الفهم والاستشهاد ولا تمثل ظهورًا فعليًا في أي منصة.`
        : "لم تظهر مشكلة مؤكدة ضمن التغطية الحالية؛ يلزم توسيع الفحص قبل استنتاج تحسن فعلي."),
    strengths: [
      `اكتمل ${input.coverage}٪ من نطاق الفحص المخطط دون تحويل القيم المجهولة إلى إخفاقات.`,
      "كل نتيجة مرتبطة بدليل وتاريخ ومنهجية قابلة للمراجعة.",
    ],
    priorities,
    plan30Days: priorities.slice(0, 2).map((item) => item.nextAction).length
      ? priorities.slice(0, 2).map((item) => item.nextAction)
      : ["وسّع التغطية إلى الصفحات الأساسية وصفحات المنتجات والسياسات."],
    plan60Days: [
      "حوّل الأسئلة الشرائية الأعلى قيمة إلى إجابات عربية مباشرة وموثقة داخل الصفحات المناسبة.",
      "راجع وضوح اسم العلامة وبياناتها والبيانات المنظمة عبر الصفحات الأساسية.",
    ],
    plan90Days: [
      "أعد الفحص بنفس المنهجية وقارن التغطية والمكونات قبل وصف أي تغير بأنه اتجاه.",
      "أضف قياس ظهور مرصود فقط عبر طريقة موثقة ومنفصلة عن درجة الجاهزية.",
    ],
    limitations: [
      ...input.limitations,
      "هذا التقرير لا يضمن ترتيبًا أو ذكرًا أو استشهادًا في Google أو ChatGPT أو Gemini.",
    ].slice(0, 6),
  };
}

export async function generateArabicReportNarrative(
  input: NarrativeReportInput,
): Promise<GeneratedNarrative> {
  const startedAt = Date.now();
  const env = getServerEnv();
  const fallback = buildDeterministicArabicNarrative(input);
  const canUseGateway = Boolean(env.VERCEL_OIDC_TOKEN || env.AI_GATEWAY_API_KEY);

  if (!canUseGateway) {
    return {
      narrative: fallback,
      source: "deterministic",
      modelId: null,
      promptVersion: "visibility-report-ar-v1",
      appliedSkills: [...visibilityReportBackendSkillKeys],
      durationMs: Date.now() - startedAt,
    };
  }

  try {
    const result = await generateText({
      model: env.AI_REPORT_MODEL,
      output: Output.object({
        name: "ArabicVisibilityReportNarrative",
        description: "Evidence-bound Arabic executive narrative for an ecommerce visibility audit.",
        schema: reportNarrativeSchema,
      }),
      system: [
        "أنت محرر تقرير بصيرة. اكتب عربية مهنية واضحة لصاحب متجر خليجي. استخدم الحقائق المرسلة فقط. لا تحسب أو تغيّر أي درجة، ولا تدّعِ ظهورًا فعليًا في Google أو ChatGPT أو Gemini. كل أولوية يجب أن تستخدم findingId موجودًا حرفيًا. فرّق بوضوح بين الجاهزية والظهور المرصود.",
        visibilityReportSkillInstructions,
      ].join("\n\n"),
      prompt: JSON.stringify(input),
      temperature: 0.2,
    });

    const validFindingIds = new Set(input.findings.map((finding) => finding.id));
    const narrative = {
      ...result.output,
      priorities: result.output.priorities.filter((item) => validFindingIds.has(item.findingId)),
      limitations: [...new Set([...result.output.limitations, ...fallback.limitations])].slice(0, 6),
    };
    const parsed = reportNarrativeSchema.safeParse(narrative);
    if (!parsed.success || (input.findings.length > 0 && parsed.data.priorities.length === 0)) {
      throw new Error("The generated narrative did not preserve evidence references.");
    }

    return {
      narrative: parsed.data,
      source: "ai",
      modelId: env.AI_REPORT_MODEL,
      promptVersion: "visibility-report-ar-v1",
      appliedSkills: [...visibilityReportBackendSkillKeys],
      durationMs: Date.now() - startedAt,
    };
  } catch {
    return {
      narrative: fallback,
      source: "deterministic",
      modelId: null,
      promptVersion: "visibility-report-ar-v1",
      appliedSkills: [...visibilityReportBackendSkillKeys],
      durationMs: Date.now() - startedAt,
    };
  }
}
