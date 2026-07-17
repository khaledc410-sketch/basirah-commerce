"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { DemoConversation } from "@/core/demo/types";
import { formatDate } from "@/lib/format";

interface ConversationsListProps {
  conversations: DemoConversation[];
}

const outcomeLabels: Record<DemoConversation["outcome"], string> = {
  purchased: "تم الشراء",
  added_to_cart: "أضيف للسلة",
  clicked: "نقر المنتج",
  no_conversion: "بلا تحويل",
};

export function ConversationsList({ conversations }: ConversationsListProps) {
  const [query, setQuery] = useState("");
  const [outcome, setOutcome] = useState("all");
  const filtered = useMemo(
    () => conversations.filter((conversation) => {
      const matchesQuery = `${conversation.need} ${conversation.intent} ${conversation.objection ?? ""}`.includes(query);
      return matchesQuery && (outcome === "all" || conversation.outcome === outcome);
    }),
    [conversations, outcome, query],
  );

  return (
    <div className="space-y-4">
      <Card className="flex flex-wrap gap-3 p-3"><div className="relative min-w-[220px] flex-1"><Search className="absolute start-3 top-3.5 size-4 text-muted-foreground" /><Input aria-label="بحث المحادثات" className="h-11 ps-10" onChange={(event) => setQuery(event.target.value)} placeholder="ابحث بالاحتياج أو الاعتراض…" value={query} /></div><Select onValueChange={setOutcome} value={outcome}><SelectTrigger className="h-11 w-full sm:w-44"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">كل النتائج</SelectItem><SelectItem value="purchased">تم الشراء</SelectItem><SelectItem value="added_to_cart">أضيف للسلة</SelectItem><SelectItem value="no_conversion">بلا تحويل</SelectItem></SelectContent></Select></Card>
      <Card className="overflow-hidden"><div className="hidden grid-cols-[1.3fr_.9fr_.8fr_.7fr_auto] gap-4 border-b bg-muted/40 px-5 py-3 text-xs font-semibold text-muted-foreground md:grid"><span>الاحتياج</span><span>النية</span><span>الاعتراض</span><span>النتيجة</span><span>التاريخ</span></div>{filtered.length > 0 ? filtered.map((conversation) => <Link className="grid gap-3 border-b px-5 py-4 transition-colors last:border-b-0 hover:bg-muted/35 md:grid-cols-[1.3fr_.9fr_.8fr_.7fr_auto] md:items-center" href={`/dashboard/conversations/${conversation.id}`} key={conversation.id}><div><p className="font-semibold">{conversation.need}</p><p className="mt-1 text-xs text-muted-foreground md:hidden">{conversation.intent}</p></div><span className="hidden text-sm md:block">{conversation.intent}</span><span className="text-sm text-muted-foreground">{conversation.objection ?? "لا يوجد اعتراض مسجّل"}</span><Badge className="w-fit" variant={conversation.outcome === "purchased" ? "default" : "secondary"}>{outcomeLabels[conversation.outcome]}</Badge><span className="text-xs text-muted-foreground">{formatDate(conversation.createdAt)}</span></Link>) : <div className="flex min-h-64 flex-col items-center justify-center p-8 text-center"><Search className="size-8 text-muted-foreground" /><p className="mt-4 font-semibold">لا توجد محادثات مطابقة</p><p className="mt-1 text-sm text-muted-foreground">غيّر البحث أو أزل أحد الفلاتر.</p></div>}</Card>
    </div>
  );
}
