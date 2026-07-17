"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, isToolUIPart, type UIMessage } from "ai";
import { CalendarDays, Database, FilePlus2, Lightbulb, RotateCcw, Save, Sparkles } from "lucide-react";

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Tool, ToolHeader } from "@/components/ai-elements/tool";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const initialMessages: UIMessage[] = [
  {
    id: "welcome",
    role: "assistant",
    parts: [
      {
        type: "text",
        text: "## اسأل بيانات متجرك\nأحلّل المقاييس والمحادثات والمنتجات بأدوات محددة. سأذكر **الفترة والمصدر والدليل**، وأفصل الملاحظة عن الاستنتاج.",
      },
    ],
  },
];

const suggestions = [
  "ما أهم تغير هذا الأسبوع؟",
  "ليه العملاء ما يشترون سيروم التوازن؟",
  "وش الفرصة الأعلى أثرًا الآن؟",
  "كيف جاهزية متجري للظهور؟",
];

const toolLabels: Record<string, string> = {
  "tool-get_store_summary": "قراءة ملخص المتجر",
  "tool-get_customer_objections": "تحليل اعتراضات العملاء",
  "tool-get_content_gaps": "مراجعة فجوات المحتوى",
  "tool-get_ai_visibility_summary": "فصل الجاهزية عن الظهور الفعلي",
};

export function MerchantAdvisor() {
  const { messages, sendMessage, status, stop, regenerate, error } = useChat({
    transport: new DefaultChatTransport({ api: "/api/merchant/chat" }),
    messages: initialMessages,
  });
  const isBusy = status === "submitted" || status === "streaming";

  return (
    <div className="grid min-h-[calc(100dvh-190px)] gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
      <Card className="flex min-h-[690px] flex-col overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2"><Badge className="gap-1.5" variant="secondary"><Database className="size-3" />بيانات العرض</Badge><Badge className="gap-1.5" variant="outline"><CalendarDays className="size-3" />5–11 يوليو</Badge></div>
          <div className="flex gap-1"><Button aria-label="حفظ كفكرة" size="icon" variant="ghost"><Save /></Button><Button aria-label="إعادة آخر تحليل" disabled={isBusy || messages.length < 2} onClick={() => regenerate()} size="icon" variant="ghost"><RotateCcw /></Button></div>
        </div>
        <Conversation className="min-h-0 flex-1"><ConversationContent className="mx-auto w-full max-w-4xl gap-6 p-4 sm:p-6">{messages.map((message) => <Message className={message.role === "assistant" ? "max-w-full" : "max-w-[88%]"} from={message.role} key={message.id}><MessageContent className={message.role === "assistant" ? "w-full" : undefined}>{message.parts.map((part, index) => {
          if (part.type === "text") return <MessageResponse key={`${message.id}-text-${index}`}>{part.text}</MessageResponse>;
          if (isToolUIPart(part)) return <Tool className="bg-muted/30" key={`${message.id}-tool-${index}`}>{part.type === "dynamic-tool" ? <ToolHeader state={part.state} title="تحليل بيانات المتجر" toolName={part.toolName} type={part.type} /> : <ToolHeader state={part.state} title={toolLabels[part.type] ?? "تحليل بيانات المتجر"} type={part.type} />}</Tool>;
          return null;
        })}</MessageContent>{message.role === "assistant" && message.id !== "welcome" && <div className="mt-3 flex flex-wrap gap-2"><Button size="sm" variant="outline"><Save />حفظ الفكرة</Button><Button size="sm" variant="outline"><Lightbulb />إنشاء فرصة</Button><Button size="sm" variant="outline"><FilePlus2 />إنشاء مسودة</Button></div>}</Message>)}{isBusy && <div aria-live="polite" className="flex items-center gap-2 text-sm text-muted-foreground"><Sparkles className="size-4 animate-pulse text-primary" />أراجع الأدلة والمقاييس…</div>}{error && <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive" role="alert">تعذر إكمال التحليل. أعد المحاولة أو جرّب سؤالًا أقصر.</div>}</ConversationContent><ConversationScrollButton /></Conversation>
        <div className="border-t bg-card p-3 sm:p-4"><div className="mx-auto max-w-4xl"><PromptInput onSubmit={async ({ text }) => { const trimmed = text.trim(); if (!trimmed) return; await sendMessage({ text: trimmed }); }}><PromptInputBody><PromptInputTextarea disabled={isBusy} placeholder="اسأل عن التحويل أو الاعتراضات أو المنتجات أو الظهور…" /></PromptInputBody><PromptInputFooter className="justify-between px-2 pb-2"><span className="text-[11px] text-muted-foreground">الإجابة تربط كل رقم بفترة ومصدر</span><PromptInputSubmit onStop={stop} status={status} /></PromptInputFooter></PromptInput></div></div>
      </Card>
      <aside className="space-y-4"><Card className="p-5"><p className="text-sm font-semibold">أسئلة مناسبة الآن</p><div className="mt-4 space-y-2">{suggestions.map((suggestion) => <button className="min-h-12 w-full rounded-xl border px-3 text-start text-sm transition-colors hover:border-primary hover:bg-primary/5 disabled:opacity-50" disabled={isBusy} key={suggestion} onClick={() => sendMessage({ text: suggestion })} type="button">{suggestion}</button>)}</div></Card><Card className="p-5"><p className="text-sm font-semibold">منهج الإجابة</p><ol className="mt-4 space-y-3 text-sm text-muted-foreground"><li>1. إجابة مباشرة</li><li>2. حقائق موثّقة</li><li>3. تفسير معنّون بوضوح</li><li>4. إجراء قابل للمراجعة</li><li>5. مصادر وفترة وحدود</li></ol></Card></aside>
    </div>
  );
}
