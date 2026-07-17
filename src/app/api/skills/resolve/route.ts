import { z } from "zod";

import {
  backendSkillKeys,
  resolveBackendSkills,
  type BackendSkillKey,
} from "@/modules/skills";

export const dynamic = "force-dynamic";

const requestSchema = z.object({
  task: z.string().trim().min(3).max(2_000),
  skills: z.array(z.enum(backendSkillKeys)).min(1).max(backendSkillKeys.length).optional(),
});

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return Response.json({ error: "Invalid task or backend skill selection." }, { status: 400 });
  }

  const selected = resolveBackendSkills(
    parsed.data.task,
    parsed.data.skills as BackendSkillKey[] | undefined,
  );

  return Response.json({
    skills: selected.map(({ key, label, description, category, outputFormats }) => ({
      key,
      label,
      description,
      category,
      outputFormats,
    })),
    selectionMode: parsed.data.skills ? "explicit" : "automatic",
  });
}
