import { z } from "zod";

import { isDemoMode } from "@/config/env";
import { demoRepository } from "@/core/demo/store";
import {
  listPublicBackendSkills,
  runSkillsForProduct,
  skillRegistry,
  summarizeReports,
} from "@/modules/skills";

export const dynamic = "force-dynamic";

const skillKeys = ["seo", "aeo", "geo", "structured-data"] as const;

const skillsRequestSchema = z.object({
  skills: z.array(z.enum(skillKeys)).min(1).optional(),
  productId: z.string().trim().min(1).max(200).optional(),
});

export async function GET() {
  if (!isDemoMode()) {
    return Response.json({ error: "Authenticated production access is not implemented." }, { status: 503 });
  }
  return Response.json({
    mode: "demo",
    skills: skillRegistry.map((skill) => ({
      key: skill.key,
      label: skill.label,
      description: skill.description,
      version: skill.version,
    })),
    backendSkills: listPublicBackendSkills(),
  });
}

export async function POST(request: Request) {
  if (!isDemoMode()) {
    return Response.json({ error: "Authenticated production access is not implemented." }, { status: 503 });
  }
  const parsed = skillsRequestSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return Response.json(
      { error: "تعذر فهم الطلب. حدّد مهارات صحيحة أو معرّف منتج موجودًا وأعد المحاولة." },
      { status: 400 },
    );
  }

  const store = demoRepository.getStore();
  const products = parsed.data.productId
    ? [demoRepository.getProduct(parsed.data.productId)].filter(
        (product): product is NonNullable<typeof product> => Boolean(product),
      )
    : demoRepository.listProducts();

  if (products.length === 0) {
    return Response.json({ error: "لا يوجد منتج بهذا المعرّف في بيانات العرض." }, { status: 404 });
  }

  const reports = products.flatMap((product) =>
    runSkillsForProduct(store, product, parsed.data.skills),
  );

  return Response.json({
    mode: "demo",
    store: { id: store.id, name: store.name, domain: store.domain },
    summary: summarizeReports(reports),
    reports,
    generatedAt: new Date().toISOString(),
    limitation:
      "نتائج المهارات فحوصات جاهزية حتمية على بيانات العرض التجريبي، وليست قياسًا لأي ترتيب أو ظهور فعلي.",
  });
}
