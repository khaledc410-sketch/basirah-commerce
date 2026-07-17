import type { UnifiedProduct, UnifiedStore } from "@/core/commerce/types";
import { aeoSkill } from "@/modules/skills/aeo";
import { geoSkill } from "@/modules/skills/geo";
import { seoSkill } from "@/modules/skills/seo";
import { structuredDataSkill } from "@/modules/skills/structured-data";
import type { Skill, SkillKey, SkillReport } from "@/modules/skills/types";

export const skillRegistry: Skill[] = [seoSkill, aeoSkill, geoSkill, structuredDataSkill];

export function getSkill(key: SkillKey): Skill {
  const skill = skillRegistry.find((candidate) => candidate.key === key);
  if (!skill) throw new Error(`Unknown skill: ${key}`);
  return skill;
}

export function runSkillsForProduct(
  store: UnifiedStore,
  product: UnifiedProduct,
  keys?: SkillKey[],
): SkillReport[] {
  const selected = keys ? keys.map(getSkill) : skillRegistry;
  return selected.map((skill) => skill.run({ store, product }));
}

export function summarizeReports(reports: SkillReport[]) {
  const bySkill = new Map<SkillKey, { total: number; count: number }>();
  for (const report of reports) {
    const entry = bySkill.get(report.skill) ?? { total: 0, count: 0 };
    entry.total += report.score;
    entry.count += 1;
    bySkill.set(report.skill, entry);
  }
  return [...bySkill.entries()].map(([skill, { total, count }]) => ({
    skill,
    averageScore: Math.round(total / count),
    productsAudited: count,
  }));
}

export {
  backendSkillKeys,
  backendSkillRegistry,
  buildBackendSkillInstructions,
  getBackendSkill,
  listPublicBackendSkills,
  resolveBackendSkills,
  type BackendSkillDefinition,
  type BackendSkillKey,
  type PublicBackendSkill,
} from "@/modules/skills/backend";
export type { Skill, SkillCheck, SkillInput, SkillKey, SkillReport } from "@/modules/skills/types";
