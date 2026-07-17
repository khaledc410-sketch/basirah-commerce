import { z } from "zod";

const noControlCharacters = /^[^\u0000-\u001F\u007F]+$/u;

export const opaqueIdentifierSchema = z
  .string()
  .trim()
  .min(20)
  .max(512)
  .regex(/^[A-Za-z0-9._~:-]+$/u);

export const leadRequestSchema = z
  .object({
    email: z.string().trim().min(3).max(254).email(),
    marketingConsent: z.boolean().optional().default(false),
    locale: z.enum(["ar", "en"]).optional().default("ar"),
  })
  .strict();

export const reportOrderRequestSchema = z
  .object({
    name: z.string().trim().min(2).max(120).regex(noControlCharacters),
    email: z.string().trim().min(3).max(254).email(),
    phone: z
      .string()
      .trim()
      .min(7)
      .max(32)
      .regex(/^[+\d\u0660-\u0669\u06F0-\u06F9\s().-]+$/u)
      .refine((value) => {
        const digits = value.match(/[\d\u0660-\u0669\u06F0-\u06F9]/gu)?.length ?? 0;
        return digits >= 7 && digits <= 15;
      }),
    marketingConsent: z.boolean().optional().default(false),
    locale: z.enum(["ar", "en"]).optional().default("ar"),
  })
  .strict();

export const claimRequestSchema = z.object({}).strict();

const readinessComponentKeySchema = z.enum([
  "technical",
  "content",
  "entity",
  "trust",
  "answerability",
  "structuredData",
  "externalEvidence",
]);

export const storedVisibilityReportSchema = z
  .object({
    domain: z.string().min(1).max(253),
    score: z.number().int().min(0).max(100),
    coverage: z.number().int().min(0).max(100),
    confidence: z.number().int().min(0).max(100),
    components: z.array(
      z
        .object({
          key: readinessComponentKeySchema,
          label: z.string().min(1).max(120),
          weight: z.number().min(0).max(100),
          score: z.number().min(0).max(100).nullable(),
          coverage: z.number().min(0).max(100),
        })
        .strict(),
    ).max(20),
    findings: z.array(
      z
        .object({
          id: z.string().min(1).max(180),
          component: readinessComponentKeySchema,
          title: z.string().min(1).max(500),
          description: z.string().min(1).max(4_000),
          severity: z.enum(["high", "medium", "low"]),
          recommendation: z.string().min(1).max(4_000),
          evidenceIds: z.array(z.string().min(1).max(180)).max(100),
        })
        .strict(),
    ).max(2_000),
    evidence: z.array(
      z
        .object({
          id: z.string().min(1).max(180),
          component: readinessComponentKeySchema,
          checkKey: z.string().min(1).max(180),
          status: z.enum(["pass", "fail", "unknown"]),
          message: z.string().min(1).max(4_000),
          urls: z.array(z.string().url().max(2_048)).max(100),
        })
        .strict(),
    ).max(10_000),
    organicGrowthPlan: z
      .object({
        source: z.literal("deterministic-public-pages"),
        keywordMethod: z.string().min(1).max(2_000),
        pageSnapshots: z
          .array(
            z
              .object({
                url: z.string().url().max(2_048),
                kind: z.enum(["home", "product", "category", "article", "policy", "other"]),
                title: z.string().max(500).nullable(),
                descriptionPresent: z.boolean(),
                wordCount: z.number().int().min(0).max(10_000_000),
                h1Count: z.number().int().min(0).max(10_000),
                questionHeadingCount: z.number().int().min(0).max(10_000),
                structuredDataTypes: z.array(z.string().min(1).max(200)).max(100),
              })
              .strict(),
          )
          .max(100),
        keywordOpportunities: z
          .array(
            z
              .object({
                keyword: z.string().min(1).max(200),
                intent: z.enum(["transactional", "commercial", "informational", "navigational"]),
                targetUrl: z.string().url().max(2_048),
                source: z.enum(["title", "heading"]),
                confidence: z.enum(["high", "medium"]),
                rationale: z.string().min(1).max(2_000),
              })
              .strict(),
          )
          .max(100),
        productEnhancements: z
          .array(
            z
              .object({
                url: z.string().url().max(2_048),
                currentTitle: z.string().max(500).nullable(),
                targetKeyword: z.string().min(1).max(200),
                suggestedTitle: z.string().min(1).max(500),
                actions: z.array(z.string().min(1).max(2_000)).max(20),
                evidence: z
                  .object({
                    descriptionPresent: z.boolean(),
                    wordCount: z.number().int().min(0).max(10_000_000),
                    h1Count: z.number().int().min(0).max(10_000),
                    hasProductSchema: z.boolean(),
                  })
                  .strict(),
              })
              .strict(),
          )
          .max(100),
        contentOpportunities: z
          .array(
            z
              .object({
                type: z.enum(["buying-guide", "comparison", "how-to", "faq"]),
                label: z.string().min(1).max(200),
                targetKeyword: z.string().min(1).max(200),
                workingTitle: z.string().min(1).max(500),
                sourceUrl: z.string().url().max(2_048),
                reason: z.string().min(1).max(2_000),
              })
              .strict(),
          )
          .max(100),
        searchConsole: z
          .object({
            status: z.literal("not_connected"),
            property: z.string().min(1).max(500),
            links: z
              .object({
                console: z.string().url().max(2_048),
                setupGuide: z.string().url().max(2_048),
                performanceGuide: z.string().url().max(2_048),
                urlInspectionGuide: z.string().url().max(2_048),
                sitemapsGuide: z.string().url().max(2_048),
              })
              .strict(),
            metrics: z
              .array(
                z
                  .object({
                    key: z.enum(["clicks", "impressions", "ctr", "position", "queries", "pages"]),
                    label: z.string().min(1).max(200),
                    value: z.null(),
                    status: z.literal("not_connected"),
                  })
                  .strict(),
              )
              .max(20),
          })
          .strict(),
      })
      .strict()
      .optional(),
    limitations: z.array(z.string().min(1).max(2_000)).max(100),
    scannedAt: z.string().datetime({ offset: true }),
    pagesScanned: z.number().int().min(0).max(100),
  })
  .strict();
