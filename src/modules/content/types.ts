import type { LocalizedText } from "@/core/commerce/types";

export interface ArticleFact {
  claim: string;
  source: string;
  verified: boolean;
  productId?: string;
}

export type ContentBuyerStage =
  | "awareness"
  | "consideration"
  | "decision"
  | "implementation";

export interface ArticleContentStrategy {
  mode: "searchable";
  contentType: "evidence-led-guide";
  buyerStage: ContentBuyerStage;
  primaryReaderQuestion: string;
  relatedQuestions: string[];
  relatedQuestionsBasis: "editorial-hypotheses";
  demandBasis: "merchant-provided";
}

export interface ArticleBrief {
  briefVersion: "content-brief-v1";
  topic: string;
  targetQuery: string;
  audience: string;
  demandEvidence: string;
  storeName: LocalizedText;
  facts: ArticleFact[];
  missingFacts: string[];
  suggestedSlug: string;
  strategy: ArticleContentStrategy;
}

export interface ArticleOutlineSection {
  heading: string;
  isQuestion: boolean;
  goal: string;
  factRefs: number[];
}

export interface ArticleOutline {
  outlineVersion: "content-outline-v1";
  title: string;
  directAnswerGoal: string;
  sections: ArticleOutlineSection[];
  faqCount: number;
}

export interface ArticleDraftSection {
  heading: string;
  paragraphs: string[];
}

export interface ArticleFaq {
  question: string;
  answer: string;
}

export interface ArticleDraft {
  draftVersion: "content-draft-v1";
  title: string;
  slug: string;
  metaTitle: string;
  metaDescription: string;
  directAnswer: string;
  keyTakeaways: string[];
  sections: ArticleDraftSection[];
  faqs: ArticleFaq[];
  sources: Array<{ name: string; detail: string }>;
  limitations: string[];
  author: string;
  heroAlt?: string;
}

export type ReviewSeverity = "critical" | "high" | "medium" | "low";

export interface ReviewIssue {
  severity: ReviewSeverity;
  category: ReviewCategoryKey;
  message: string;
}

export type ReviewCategoryKey =
  | "contentQuality"
  | "seo"
  | "evidence"
  | "technical"
  | "peopleFirst";

export interface ReviewCategoryScore {
  key: ReviewCategoryKey;
  label: string;
  score: number;
  max: number;
}

export interface AiPatternSignals {
  burstiness: number;
  burstinessBand: "natural" | "borderline" | "flagged";
  typeTokenRatio: number;
  ttrBand: "rich" | "normal" | "low";
  bannedPhrases: string[];
  questionHeadingRatio: number;
}

export interface ArticleReview {
  reviewVersion: "content-review-v2";
  score: number;
  rating: "exceptional" | "strong" | "acceptable" | "below-standard" | "rewrite";
  categories: ReviewCategoryScore[];
  issues: ReviewIssue[];
  aiSignals: AiPatternSignals;
  blocking: boolean;
  blockingReason: string;
  limitation: string;
}
