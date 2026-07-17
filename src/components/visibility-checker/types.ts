export type ScanStatus = "queued" | "running" | "completed" | "failed";

export interface ApiError {
  code?: string;
  message?: string;
}

export function apiErrorMessage(
  error: string | ApiError | undefined,
  fallback: string,
) {
  if (typeof error === "string") return error.trim() ? error : fallback;
  if (error && typeof error.message === "string" && error.message.trim()) {
    return error.message;
  }
  return fallback;
}

export interface ScanState {
  token: string;
  status: ScanStatus;
  progress: number;
  currentStep?: string;
  error?: string | ApiError;
}

export interface ReportComponent {
  key: string;
  label: string;
  weight: number;
  score: number | null;
  coverage: number;
}

export interface ReportFinding {
  id: string;
  component: string;
  title: string;
  description: string;
  severity: "high" | "medium" | "low";
  recommendation: string;
  evidenceIds: string[];
}

export interface ReportEvidence {
  id: string;
  component: string;
  checkKey: string;
  status: "pass" | "fail" | "unknown";
  message: string;
  urls: string[];
}

export interface OrganicGrowthPlan {
  source: "deterministic-public-pages";
  keywordMethod: string;
  pageSnapshots: Array<{
    url: string;
    kind: "home" | "product" | "category" | "article" | "policy" | "other";
    title: string | null;
    descriptionPresent: boolean;
    wordCount: number;
    h1Count: number;
    questionHeadingCount: number;
    structuredDataTypes: string[];
  }>;
  keywordOpportunities: Array<{
    keyword: string;
    intent: "transactional" | "commercial" | "informational" | "navigational";
    targetUrl: string;
    source: "title" | "heading";
    confidence: "high" | "medium";
    rationale: string;
  }>;
  productEnhancements: Array<{
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
  }>;
  contentOpportunities: Array<{
    type: "buying-guide" | "comparison" | "how-to" | "faq";
    label: string;
    targetKeyword: string;
    workingTitle: string;
    sourceUrl: string;
    reason: string;
  }>;
  searchConsole: {
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
  };
}

export interface ScanReport {
  domain: string;
  score: number;
  coverage: number;
  confidence: number;
  components: ReportComponent[];
  findings: ReportFinding[];
  evidence?: ReportEvidence[];
  organicGrowthPlan?: OrganicGrowthPlan;
  limitations: string[];
  scannedAt: string;
  pagesScanned?: number;
}

export interface CreateScanResponse {
  scan: ScanState;
  links?: {
    status?: string;
    preview?: string;
  };
}
