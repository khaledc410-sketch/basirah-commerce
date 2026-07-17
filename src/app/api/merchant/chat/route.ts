import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  stepCountIs,
  streamText,
  tool,
  type UIMessage,
} from "ai";
import { z } from "zod";

import { getServerEnv, isDemoMode } from "@/config/env";
import { demoRepository } from "@/core/demo/store";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/format";
import { buildBackendSkillInstructions, resolveBackendSkills } from "@/modules/skills";

export const dynamic = "force-dynamic";

const requestSchema = z.object({
  messages: z.array(z.custom<UIMessage>()).min(1).max(40),
});

function messageText(message: UIMessage) {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join(" ");
}

function selectDemoTool(question: string) {
  if (/اعتراض|ما يشترون|ما يشتري|انسحاب|منتج/u.test(question)) {
    return "get_customer_objections" as const;
  }
  if (/ظهور|ChatGPT|Google|ذكاء اصطناعي/u.test(question)) {
    return "get_ai_visibility_summary" as const;
  }
  if (/فرص|تحسين|أسوي|الخطوة/u.test(question)) {
    return "get_content_gaps" as const;
  }
  return "get_store_summary" as const;
}

function demoAnswer(toolName: ReturnType<typeof selectDemoTool>) {
  const overview = demoRepository.getOverview();
  const opportunities = demoRepository.listOpportunities();

  if (toolName === "get_customer_objections") {
    return `## الخلاصة\nأكثر اعتراض متكرر هو **عدم وضوح طريقة الاستخدام**.\n\n### الدليل\n- ظهر في **34 محادثة** خلال الفترة من ${overview.period.from} إلى ${overview.period.to}.\n- تم ترشيح سيروم التوازن **438 مرة**، ثم نقر عليه **121** عميلًا، وأضيف للسلة **29** مرة، وسُجّلت **8** مشتريات.\n- الانتقال من الترشيح إلى السلة: **${formatPercent(29 / 438)}**.\n\n### التفسير\n**استنتاج مرجّح، وليس سببًا مؤكدًا:** تكرار السؤال مع ضعف مرحلة السلة يشيران إلى أن تعليمات الاستخدام تساهم في التردد. درجة الثقة: **مرتفعة** لأن الإشارة ظهرت في محادثات وفunnel المنتج معًا.\n\n### الإجراء المقترح\nراجع مسودة «طريقة الاستخدام» قبل نشرها. لن يتم تعديل صفحة المنتج دون موافقتك.`;
  }

  if (toolName === "get_ai_visibility_summary") {
    return `## حالة الظهور\nجاهزية المتجر للظهور هي **76/100**. هذا **تقييم للصفحات والبنية**، وليس وعدًا بالظهور.\n\n### الظهور الفعلي — بيانات تجريبية منفصلة\n- جرى التحقق يدويًا من **25** استعلامًا في العرض التجريبي.\n- ظهر اسم المتجر في **8** استعلامات.\n- طريقة القياس: **تحقق يدوي مسجّل**، وليست واجهة رسمية من ChatGPT أو Google.\n\n### أهم فجوة\nمعلومات الحمل والمكونات غير مكتملة، لذلك لا يمكن إنشاء إجابات آمنة أو قابلة للاستشهاد لبعض الأسئلة.\n\n**درجة الثقة:** متوسطة. النتائج التجريبية لا تمثل فحصًا مباشرًا لحسابك أو ضمانًا لأي منصة.`;
  }

  if (toolName === "get_content_gaps") {
    return `## الفرصة الأعلى أثرًا\n**${opportunities[0].title}**\n\n${opportunities[0].evidence}\n\n### لماذا تهم؟\n${opportunities[0].whyItMatters}\n\n### الإجراء\n${opportunities[0].proposedAction}\n\nدرجة الثقة: **مرتفعة**. يمكنك فتح الفرصة لمراجعة الدليل وإنشاء مسودة؛ زر الموافقة لا يظهر قبل عرض النص قبل/بعد.`;
  }

  return `## ملخص آخر 7 أيام\n- محادثات المستشار: **${formatNumber(overview.conversations)}**\n- مبيعات مباشرة بمساعدة المستشار: **${formatCurrency(overview.directRevenueMinor)}**\n- من الترشيح إلى السلة: **${formatPercent(overview.recommendationToCartRate)}**\n- من الترشيح إلى الشراء: **${formatPercent(overview.recommendationToPurchaseRate)}**\n\n### ما يستحق انتباهك\n${overview.topObjection}. الفرصة الأعلى أثرًا الآن: **${opportunities[0].title}**.\n\nالفترة: ${overview.period.from} — ${overview.period.to} (${overview.period.timezone}). المصدر: سجلات العرض التجريبي المجمّعة.`;
}

const tools = {
  get_store_summary: tool({
    description: "Return evidence-backed store metrics for the selected demo date range.",
    inputSchema: z.object({}),
    execute: async () => demoRepository.getOverview(),
  }),
  get_customer_objections: tool({
    description: "Return aggregated customer objections and related product funnel evidence.",
    inputSchema: z.object({}),
    execute: async () => ({
      topObjection: "عدم وضوح طريقة الاستخدام",
      conversations: 34,
      productId: "prod_serum_balance",
      productMetrics: demoRepository.getProductMetrics(demoRepository.listProducts()[0]),
    }),
  }),
  get_content_gaps: tool({
    description: "Return ranked evidence-backed content opportunities.",
    inputSchema: z.object({}),
    execute: async () => demoRepository.listOpportunities(),
  }),
  get_ai_visibility_summary: tool({
    description: "Return readiness and observed visibility as strictly separate measurements.",
    inputSchema: z.object({}),
    execute: async () => ({ readiness: 76, trackedQueries: 25, mentions: 8, method: "manual_demo" }),
  }),
};

export async function POST(request: Request) {
  if (!isDemoMode()) {
    return Response.json(
      { error: "Merchant chat requires an authenticated store session in production." },
      { status: 503 },
    );
  }
  const parsed = requestSchema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Invalid messages." }, { status: 400 });

  const question = messageText(parsed.data.messages.at(-1) ?? { id: "empty", role: "user", parts: [] });
  const activeSkills = resolveBackendSkills(question);
  const env = getServerEnv();
  if (env.NODE_ENV !== "production" && (env.VERCEL_OIDC_TOKEN || env.AI_GATEWAY_API_KEY)) {
    const modelMessages = await convertToModelMessages(parsed.data.messages);
    const result = streamText({
      model: "openai/gpt-5.4",
      system: [
        "You are Basirah merchant intelligence. Use tools for every metric. State date range, source, observations versus inference, confidence, and limitations. Respond in concise Saudi-friendly Arabic. Never invent performance or AI visibility results.",
        buildBackendSkillInstructions(activeSkills),
      ]
        .filter(Boolean)
        .join("\n\n"),
      messages: modelMessages,
      tools,
      stopWhen: stepCountIs(4),
    });
    return result.toUIMessageStreamResponse();
  }

  const toolName = selectDemoTool(question);
  const answer = demoAnswer(toolName);
  const toolCallId = `demo-${toolName}`;
  const textId = "demo-answer";
  const stream = createUIMessageStream({
    originalMessages: parsed.data.messages,
    execute: ({ writer }) => {
      writer.write({ type: "start" });
      writer.write({ type: "start-step" });
      writer.write({ type: "tool-input-available", toolCallId, toolName, input: {}, title: "تحليل بيانات المتجر" });
      writer.write({ type: "tool-output-available", toolCallId, output: { source: "demo_metrics", status: "completed" } });
      writer.write({ type: "text-start", id: textId });
      answer.match(/.{1,90}(?:\s|$)/gu)?.forEach((delta) => {
        writer.write({ type: "text-delta", id: textId, delta });
      });
      writer.write({ type: "text-end", id: textId });
      writer.write({ type: "finish-step" });
      writer.write({ type: "finish", finishReason: "stop" });
    },
  });
  return createUIMessageStreamResponse({ stream });
}
