export const readinessComponentKeys = [
  "technical",
  "content",
  "entity",
  "trust",
  "answerability",
  "structuredData",
  "externalEvidence",
] as const;

export const SITE_READINESS_METHODOLOGY_VERSION = "site-readiness-v2" as const;

export type ReadinessComponentKey = (typeof readinessComponentKeys)[number];
export type ScanStatus = "queued" | "running" | "completed" | "failed";
export type CheckStatus = "pass" | "fail" | "unknown";

export interface ScanInput {
  domain: string;
  locale: "ar" | "en";
  countryCode: string;
}

export interface NormalizedScanInput extends ScanInput {
  normalizedUrl: string;
}

export interface PageInspection {
  url: string;
  statusCode: number;
  contentType: string;
  checksum: string;
  title: string | null;
  description: string | null;
  canonical: string | null;
  language: string | null;
  hreflangLocales?: string[];
  robotsDirectives?: string[];
  visibleText: string;
  wordCount: number;
  arabicCharacterRatio: number;
  headings: string[];
  h1Count: number;
  questionHeadingCount: number;
  jsonLdTypes: string[];
  jsonLdBlocks: number;
  invalidJsonLdBlocks: number;
  internalLinks: string[];
  hasEmail: boolean;
  hasPhone: boolean;
  policyKinds: Array<"privacy" | "returns" | "shipping" | "terms">;
  bytesRead?: number;
  durationMs?: number;
}

export interface CrawlResult {
  requestedUrl: string;
  domain: string;
  robots: {
    status: "available" | "not_found";
    url: string;
    /**
     * Root-URL access is intentionally split between retrieval/search crawlers
     * and model-training controls. Training choices are evidence only and must
     * never affect the readiness score.
     */
    access?: {
      retrieval: {
        googlebot: boolean;
        oaiSearchBot: boolean;
      };
      training: {
        gptBot: boolean;
        googleExtended: boolean;
      };
    };
  };
  sitemap: {
    status: "available" | "not_found" | "unavailable";
    urlsDiscovered: number;
  };
  pages: PageInspection[];
  attemptedPages: number;
  /** Whether the submitted root URL itself produced inspectable HTML. */
  rootPageStatus?: "available" | "unavailable";
  unavailablePageUrls?: string[];
  scannedAt: string;
}

export interface ScanEvidence {
  id: string;
  component: ReadinessComponentKey;
  checkKey: string;
  status: CheckStatus;
  message: string;
  urls: string[];
}

export interface ScanFinding {
  id: string;
  component: ReadinessComponentKey;
  title: string;
  description: string;
  severity: "high" | "medium" | "low";
  recommendation: string;
  evidenceIds: string[];
}

export interface ScanComponent {
  key: ReadinessComponentKey;
  label: string;
  weight: number;
  score: number | null;
  coverage: number;
}

export type PageSeoKind =
  | "home"
  | "product"
  | "category"
  | "article"
  | "policy"
  | "other";

export type SearchIntent =
  | "transactional"
  | "commercial"
  | "informational"
  | "navigational";

export interface PageSeoSnapshot {
  url: string;
  kind: PageSeoKind;
  title: string | null;
  descriptionPresent: boolean;
  wordCount: number;
  h1Count: number;
  questionHeadingCount: number;
  structuredDataTypes: string[];
}

export interface KeywordOpportunity {
  keyword: string;
  intent: SearchIntent;
  targetUrl: string;
  source: "title" | "heading";
  confidence: "high" | "medium";
  rationale: string;
}

export interface ProductSeoEnhancement {
  url: string;
  currentTitle: string | null;
  targetKeyword: string;
  suggestedTitle: string;
  actions: string[];
  evidence: {
    descriptionPresent: boolean;
    wordCount: number;
    h1Count: number;
    hasProductSchema: boolean;
  };
}

export interface ContentOpportunity {
  type: "buying-guide" | "comparison" | "how-to" | "faq";
  label: string;
  targetKeyword: string;
  workingTitle: string;
  sourceUrl: string;
  reason: string;
}

export interface SearchConsoleReadiness {
  status: "not_connected";
  property: string;
  links: {
    console: string;
    setupGuide: string;
    performanceGuide: string;
    urlInspectionGuide: string;
    sitemapsGuide: string;
  };
  metrics: Array<{
    key: "clicks" | "impressions" | "ctr" | "position" | "queries" | "pages";
    label: string;
    value: null;
    status: "not_connected";
  }>;
}

export interface OrganicGrowthPlan {
  source: "deterministic-public-pages";
  keywordMethod: string;
  pageSnapshots: PageSeoSnapshot[];
  keywordOpportunities: KeywordOpportunity[];
  productEnhancements: ProductSeoEnhancement[];
  contentOpportunities: ContentOpportunity[];
  searchConsole: SearchConsoleReadiness;
}

export interface VisibilityScanReport {
  domain: string;
  score: number;
  coverage: number;
  confidence: number;
  components: ScanComponent[];
  findings: ScanFinding[];
  evidence: ScanEvidence[];
  organicGrowthPlan?: OrganicGrowthPlan;
  limitations: string[];
  scannedAt: string;
  pagesScanned: number;
}

export interface ScanErrorDto {
  code: string;
  message: string;
}

export interface VisibilityScanRecord {
  token: string;
  input: NormalizedScanInput;
  status: ScanStatus;
  progress: number;
  currentStep: string;
  /** Internal worker lease; never serialized by public route handlers. */
  attemptId?: string;
  /** Internal worker lease; never serialized by public route handlers. */
  leaseExpiresAt?: string;
  error?: ScanErrorDto;
  report?: VisibilityScanReport;
  createdAt: string;
  expiresAt: string;
}
