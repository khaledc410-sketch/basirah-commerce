import type { ReactNode } from "react";

import { CalendarDays, CircleCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";

interface DashboardHeaderProps {
  title: string;
  description: string;
  actions?: ReactNode;
  showDateRange?: boolean;
}

export function DashboardHeader({ title, description, actions, showDateRange = true }: DashboardHeaderProps) {
  return (
    <header className="border-b bg-card">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-start justify-between gap-5 px-4 py-6 sm:px-6 lg:px-8">
        <div><div className="mb-2 flex flex-wrap items-center gap-2"><Badge className="gap-1.5 bg-warning-soft text-warning hover:bg-warning-soft" variant="secondary"><span className="size-1.5 rounded-full bg-current" />وضع تجريبي</Badge><Badge className="gap-1.5" variant="outline"><CircleCheck className="size-3" />البيانات الأساسية محدثة</Badge></div><h1 className="text-3xl font-semibold tracking-tight">{title}</h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p></div>
        <div className="flex flex-wrap gap-2">{showDateRange && <Badge className="h-11 gap-2 px-4 text-sm" variant="outline"><CalendarDays className="size-4" />آخر 7 أيام</Badge>}{actions}</div>
      </div>
    </header>
  );
}
