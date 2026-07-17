import { z } from "zod";

import { isDemoMode } from "@/config/env";
import { demoRepository } from "@/core/demo/store";
import {
  buildEvidenceLedArticle,
} from "@/modules/content";

export const dynamic = "force-dynamic";

const draftRequestSchema = z.object({
  topic: z.string().trim().min(8).max(160),
  targetQuery: z.string().trim().min(8).max(160),
  audience: z.string().trim().min(3).max(120).default("عملاء المتجر الباحثون عن إجابة موثوقة"),
  demandEvidence: z.string().trim().min(8).max(300),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/u)
    .max(60),
});

export async function POST(request: Request) {
  if (!isDemoMode()) {
    return Response.json(
      { error: "Production content generation requires authenticated, persisted store evidence." },
      { status: 503 },
    );
  }
  const parsed = draftRequestSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return Response.json(
      {
        error:
          "تعذر إنشاء المسودة. تأكد من الموضوع والسؤال المستهدف ودليل الطلب ورابط لاتيني قصير بشرطات.",
      },
      { status: 400 },
    );
  }

  const store = demoRepository.getStore();
  const products = demoRepository.listProducts();

  const article = buildEvidenceLedArticle(store, products, parsed.data);

  return Response.json({
    mode: "demo",
    ...article,
    limitation:
      "مسودة حتمية مولّدة من الحقائق الموثّقة في بيانات العرض التجريبي فقط؛ تتطلب مراجعة بشرية ولا تضمن ترتيبًا أو استشهادًا.",
  });
}
