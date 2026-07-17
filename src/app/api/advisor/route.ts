import { z } from "zod";

import { isDemoMode } from "@/config/env";
import { demoRepository } from "@/core/demo/store";
import { advise } from "@/modules/advisor/recommendation";

export const dynamic = "force-dynamic";

const advisorRequestSchema = z.object({
  message: z.string().trim().min(2).max(1_000),
  sessionId: z.string().trim().min(3).max(200),
});

export async function POST(request: Request) {
  if (!isDemoMode()) {
    return Response.json(
      { error: "A signed storefront session is required in production." },
      { status: 503 },
    );
  }
  const parsed = advisorRequestSchema.safeParse(await request.json());
  if (!parsed.success) {
    return Response.json(
      { error: "تعذر فهم الطلب. تأكد من كتابة سؤال واضح وأعد المحاولة." },
      { status: 400 },
    );
  }

  const products = demoRepository.listProducts();
  const result = advise(parsed.data.message, products);
  const need = [
    ...result.constraints.skinTypes,
    ...result.constraints.concerns,
  ].join("، ") || "استكشاف المنتجات";
  const conversation = demoRepository.createConversation({
    sessionId: parsed.data.sessionId,
    customerMessage: parsed.data.message,
    assistantMessage: result.assistantText,
    intent: result.intent,
    need,
    productIds: result.products.map((product) => product.id),
  });

  result.products.forEach((product) => {
    demoRepository.recordEvent({
      idempotencyKey: `${conversation.id}:shown:${product.id}`,
      sessionId: parsed.data.sessionId,
      conversationId: conversation.id,
      productId: product.id,
      type: "recommendation_shown",
      consentState: "analytics",
      source: "widget",
    });
  });

  return Response.json({
    ...result,
    conversationId: conversation.id,
    mode: "demo",
    source: "normalized_demo_catalog",
  });
}
