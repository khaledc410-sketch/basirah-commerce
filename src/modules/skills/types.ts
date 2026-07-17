import type { LocalizedText, UnifiedProduct, UnifiedStore } from "@/core/commerce/types";

export type SkillKey = "seo" | "aeo" | "geo" | "structured-data";

export type SkillCheckStatus = "pass" | "warning" | "fail";

export interface SkillCheck {
  key: string;
  label: string;
  status: SkillCheckStatus;
  pointsAvailable: number;
  pointsAwarded: number;
  evidence: string;
  recommendation?: string;
}

export interface SkillInput {
  store: UnifiedStore;
  product: UnifiedProduct;
}

export interface SkillReport {
  skill: SkillKey;
  skillVersion: string;
  productId: string;
  score: number;
  checks: SkillCheck[];
  artifacts?: Record<string, unknown>;
  limitation: string;
}

export interface Skill {
  key: SkillKey;
  label: LocalizedText;
  description: string;
  version: string;
  run(input: SkillInput): SkillReport;
}

const statusAwardRatio: Record<SkillCheckStatus, number> = {
  pass: 1,
  warning: 0.55,
  fail: 0.1,
};

export function buildCheck(input: {
  key: string;
  label: string;
  status: SkillCheckStatus;
  evidence: string;
  recommendation?: string;
  pointsAvailable?: number;
}): SkillCheck {
  const pointsAvailable = input.pointsAvailable ?? 20;
  return {
    key: input.key,
    label: input.label,
    status: input.status,
    pointsAvailable,
    pointsAwarded: Math.round(pointsAvailable * statusAwardRatio[input.status]),
    evidence: input.evidence,
    recommendation: input.status === "pass" ? undefined : input.recommendation,
  };
}

export function scoreChecks(checks: SkillCheck[]): number {
  const available = checks.reduce((sum, check) => sum + check.pointsAvailable, 0);
  if (available === 0) return 0;
  const awarded = checks.reduce((sum, check) => sum + check.pointsAwarded, 0);
  return Math.round((awarded / available) * 100);
}
