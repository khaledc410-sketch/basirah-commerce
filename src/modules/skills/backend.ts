export const backendSkillKeys = [
  "content-strategy",
  "ai-seo",
  "blog",
  "docx",
  "canvas-design",
  "power-bi-report-design-consultation",
] as const;

export type BackendSkillKey = (typeof backendSkillKeys)[number];

export type BackendSkillCategory = "content" | "visibility" | "reporting";

export interface BackendSkillDefinition {
  key: BackendSkillKey;
  label: string;
  description: string;
  category: BackendSkillCategory;
  outputFormats: readonly string[];
  triggers: readonly RegExp[];
  instructions: readonly string[];
}

export interface PublicBackendSkill {
  key: BackendSkillKey;
  label: string;
  description: string;
  category: BackendSkillCategory;
  outputFormats: readonly string[];
}

export const backendSkillRegistry: readonly BackendSkillDefinition[] = [
  {
    key: "content-strategy",
    label: "Content strategy",
    description: "Plans content pillars, topic clusters, priorities, and editorial roadmaps.",
    category: "content",
    outputFormats: ["content-plan", "topic-cluster", "editorial-calendar"],
    triggers: [
      /content\s*(?:strategy|plan|calendar|pillar|cluster)/iu,
      /(?:استراتيجية|خطة|تقويم|أفكار|مواضيع)\s*(?:المحتوى|محتوى|المدونة)/u,
    ],
    instructions: [
      "Connect every recommendation to an audience need, business goal, and evidence of demand.",
      "Separate searchable content from shareable thought leadership and organize related topics into clusters.",
      "Prioritize ideas by expected customer impact, authority potential, and production effort.",
    ],
  },
  {
    key: "ai-seo",
    label: "AI visibility and AI SEO",
    description: "Applies people-first SEO foundations for Google and clearly labeled, platform-specific AI visibility guidance.",
    category: "visibility",
    outputFormats: ["visibility-audit", "optimization-brief", "citation-plan"],
    triggers: [
      /(?:ai|llm|chatgpt|perplexity|gemini|copilot)\s*(?:seo|search|visibility|citation|answer)/iu,
      /(?:ai\s*seo|geo|generative\s*engine\s*optimization)/iu,
      /(?:ظهور|استشهاد|محركات\s*الإجابة|البحث\s*بالذكاء\s*الاصطناعي|شات\s*جي\s*بي\s*تي)/u,
    ],
    instructions: [
      "For Google Search, prioritize original people-first value, crawlability, page experience, sourced facts, and clear entity and commerce information.",
      "Do not recommend AI-only rewrites, forced content chunking, mandatory FAQs, fixed ideal page lengths, llms.txt, or special AI schema as Google ranking requirements.",
      "Distinguish technical readiness from observed visibility; never imply rankings, mentions, or citations without measurement.",
      "Treat structured data as an ordinary SEO and rich-result tool, not a requirement for Google's generative Search features.",
      "Label advice for ChatGPT, Perplexity, Claude, or other engines separately from Google guidance, and recommend Merchant Center, Business Profile, or Search Console only when a verifiable first-party connection exists.",
    ],
  },
  {
    key: "blog",
    label: "Blog production",
    description: "Creates evidence-led blog briefs, outlines, drafts, reviews, and repurposing plans.",
    category: "content",
    outputFormats: ["article-brief", "outline", "article-draft", "editorial-review"],
    triggers: [
      /(?:blog|article|post)\s*(?:write|draft|outline|brief|rewrite|idea)?/iu,
      /(?:اكتب|كتابة|مسودة|مقال|مقالات|تدوينة|مدونة)/u,
    ],
    instructions: [
      "Start with a focused brief and outline before drafting, and keep one primary reader question per article.",
      "Use verified facts and concrete examples; mark missing evidence instead of inventing claims, statistics, or quotations.",
      "Review the draft for clarity, repetition, unsupported claims, generic AI phrasing, and a useful next action.",
    ],
  },
  {
    key: "docx",
    label: "Document report design",
    description: "Structures professional, accessible reports intended for Word-compatible delivery.",
    category: "reporting",
    outputFormats: ["docx", "document-outline", "report-specification"],
    triggers: [
      /(?:docx|word\s*document|microsoft\s*word|document\s*report)/iu,
      /(?:وورد|مستند|تقرير\s*تحريري|تصدير\s*التقرير)/u,
    ],
    instructions: [
      "Design a clear report hierarchy with an executive summary, evidence, recommendations, limitations, and appendices as needed.",
      "Specify semantic headings, tables, captions, page furniture, and accessible reading order before export.",
      "Keep the presentation consistent and ensure every metric includes its source, period, and definition.",
    ],
  },
  {
    key: "canvas-design",
    label: "Visual report design",
    description: "Defines visual direction for report covers, executive summaries, and infographic pages.",
    category: "reporting",
    outputFormats: ["visual-direction", "pdf-layout", "cover", "infographic"],
    triggers: [
      /(?:visual|editorial|canvas|infographic|cover)\s*(?:design|report|layout)?/iu,
      /(?:pdf\s*(?:report|layout)|report\s*(?:pdf|design|layout))/iu,
      /(?:تصميم|هوية|غلاف|إنفوجرافيك|تخطيط)\s*(?:بصري|التقرير|تقرير)?/u,
      /(?:تقرير\s*(?:مرئي|بصري|pdf)|تصميم\s*تقرير)/iu,
    ],
    instructions: [
      "Establish a restrained visual system for typography, spacing, color, grids, and information hierarchy.",
      "Use visual emphasis to clarify the evidence and decisions, not to decorate or exaggerate weak data.",
      "Preserve legibility in Arabic and English, including right-to-left layout and accessible color contrast.",
    ],
  },
  {
    key: "power-bi-report-design-consultation",
    label: "Power BI report design",
    description: "Plans decision-focused Power BI dashboards, pages, KPIs, filters, and drill paths.",
    category: "reporting",
    outputFormats: ["dashboard-specification", "page-plan", "kpi-dictionary"],
    triggers: [
      /(?:power\s*bi|dashboard|dax|business\s*intelligence|bi\s*report)/iu,
      /(?:باور\s*بي\s*آي|لوحة\s*معلومات|لوحة\s*بيانات|مؤشرات\s*الأداء)/u,
    ],
    instructions: [
      "Begin with the decisions and user roles the dashboard must support, then define KPIs and their exact calculations.",
      "Use a small number of purposeful visuals, consistent interactions, and clear drill-through paths.",
      "Call out data-model, refresh, security, and accessibility requirements separately from visual recommendations.",
    ],
  },
] as const;

const backendSkillMap = new Map(backendSkillRegistry.map((skill) => [skill.key, skill]));

export function getBackendSkill(key: BackendSkillKey): BackendSkillDefinition {
  const skill = backendSkillMap.get(key);
  if (!skill) throw new Error(`Unknown backend skill: ${key}`);
  return skill;
}

export function listPublicBackendSkills(): PublicBackendSkill[] {
  return backendSkillRegistry.map(({ key, label, description, category, outputFormats }) => ({
    key,
    label,
    description,
    category,
    outputFormats,
  }));
}

export function resolveBackendSkills(
  task: string,
  requested?: readonly BackendSkillKey[],
): BackendSkillDefinition[] {
  if (requested?.length) {
    return [...new Set(requested)].map(getBackendSkill);
  }

  const selected = backendSkillRegistry.filter((skill) =>
    skill.triggers.some((trigger) => trigger.test(task)),
  );

  const isBlogTask = /blog|article|post|مقال|تدوينة|مدونة/iu.test(task);
  if (isBlogTask) {
    for (const key of ["content-strategy", "blog", "ai-seo"] as const) {
      const skill = getBackendSkill(key);
      if (!selected.includes(skill)) selected.push(skill);
    }
  }

  return selected;
}

export function buildBackendSkillInstructions(skills: readonly BackendSkillDefinition[]): string {
  if (skills.length === 0) return "";
  const sections = skills.map(
    (skill) =>
      `### ${skill.label}\n${skill.instructions.map((instruction) => `- ${instruction}`).join("\n")}`,
  );
  return `Apply these task-specific backend capabilities:\n\n${sections.join("\n\n")}`;
}
