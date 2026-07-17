import type { UnifiedProduct, UnifiedStore } from "@/core/commerce/types";
import {
  buildArticleJsonLd,
  buildBrief,
  buildFaqJsonLd,
  buildOutline,
  composeDraft,
  type BriefRequest,
} from "@/modules/content/pipeline";
import { reviewArticle } from "@/modules/content/review";
import type {
  ArticleBrief,
  ArticleDraft,
  ArticleOutline,
  ArticleReview,
} from "@/modules/content/types";
import {
  resolveBackendSkills,
  type BackendSkillKey,
} from "@/modules/skills/backend";

export const articleBackendSkillKeys = [
  "content-strategy",
  "blog",
  "ai-seo",
] as const satisfies readonly BackendSkillKey[];

export interface EvidenceLedArticleArtifact {
  appliedSkills: BackendSkillKey[];
  brief: ArticleBrief;
  outline: ArticleOutline;
  draft: ArticleDraft;
  review: ArticleReview;
  structuredData: {
    blogPosting: ReturnType<typeof buildArticleJsonLd>;
    faqPage: ReturnType<typeof buildFaqJsonLd>;
  };
}

/**
 * Executes the complete article capability stack as one evidence boundary.
 * The explicit selection prevents unrelated reporting/dashboard skills from
 * leaking into blog production as the registry grows.
 */
export function buildEvidenceLedArticle(
  store: UnifiedStore,
  products: UnifiedProduct[],
  request: BriefRequest,
): EvidenceLedArticleArtifact {
  const appliedSkills = resolveBackendSkills(
    `${request.topic} ${request.targetQuery}`,
    articleBackendSkillKeys,
  ).map((skill) => skill.key);
  const brief = buildBrief(store, products, request);
  const outline = buildOutline(brief);
  const draft = composeDraft(brief, outline);

  return {
    appliedSkills,
    brief,
    outline,
    draft,
    review: reviewArticle(draft),
    structuredData: {
      blogPosting: buildArticleJsonLd(store, draft),
      faqPage: buildFaqJsonLd(draft),
    },
  };
}
