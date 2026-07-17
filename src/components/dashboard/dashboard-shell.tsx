"use client";

import {
  Bot,
  FileChartColumn,
  FilePenLine,
  Gauge,
  ListChecks,
  Menu,
  Settings,
  SlidersHorizontal,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { BrandMark } from "@/components/brand-mark";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const navigationItems = [
  { href: "/dashboard", label: "الملخص", mobileLabel: "الملخص", icon: Gauge, exact: true },
  { href: "/dashboard/reports", label: "التقارير", mobileLabel: "التقارير", icon: FileChartColumn },
  { href: "/dashboard/plan", label: "خطة التحسين", mobileLabel: "الخطة", icon: ListChecks },
  { href: "/dashboard/visibility/content", label: "المحتوى", mobileLabel: "المحتوى", icon: FilePenLine },
  { href: "/dashboard/widget", label: "وكيل المبيعات", mobileLabel: "الوكيل", icon: Bot },
  { href: "/dashboard/settings", label: "الإعدادات", mobileLabel: "الإعدادات", icon: Settings },
] as const;

interface DashboardShellProps {
  children: ReactNode;
  storeName: string;
  mode: "demo" | "production";
}

function isActive(pathname: string, href: string, exact?: boolean) {
  return exact ? pathname === href : pathname.startsWith(href);
}

export function DashboardShell({ children, storeName, mode }: DashboardShellProps) {
  const pathname = usePathname();

  const navigation = (
    <nav aria-label="التنقل الرئيسي">
      <p className="mb-2 px-3 text-[11px] font-semibold text-muted-foreground">مساحة العمل</p>
      <div className="space-y-1">
        {navigationItems.map((item) => {
          const active = isActive(pathname, item.href, "exact" in item ? item.exact : false);
          return (
            <Link
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
              href={item.href}
              key={item.href}
            >
              <item.icon aria-hidden="true" className={cn("size-[18px]", active && "text-primary")} />
              <span>{item.label}</span>
              {mode === "demo" && item.href === "/dashboard/plan" ? (
                <span className="ms-auto rounded-full bg-primary px-2 py-0.5 text-[10px] text-primary-foreground">3</span>
              ) : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );

  return (
    <div className="min-h-dvh bg-background lg:ps-[272px]">
      <aside className="fixed inset-y-0 start-0 z-30 hidden w-[272px] border-e bg-sidebar lg:flex lg:flex-col">
        <div className="flex min-h-20 items-center border-b px-5"><Link className="text-primary" href="/dashboard"><BrandMark /></Link></div>
        <div className="p-4">
          <div className="flex min-h-14 w-full items-center gap-3 rounded-xl border bg-card px-3 text-start">
            <Avatar className="size-8"><AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">مـ</AvatarFallback></Avatar>
            <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{storeName}</span><span className="block text-[11px] text-muted-foreground">{mode === "demo" ? "بيانات عرض تجريبي" : "مساحة متجر محمية"}</span></span>
            <SlidersHorizontal aria-hidden="true" className="size-4 text-muted-foreground" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-4 pb-4">{navigation}</div>
        <div className="border-t p-4"><div className="rounded-xl bg-muted/60 p-3 text-xs"><div className="flex items-center justify-between"><span className="font-semibold">مصدر البيانات</span><span className={`size-2 rounded-full ${mode === "demo" ? "bg-warning" : "bg-success"}`} /></div><p className="mt-1 text-muted-foreground">{mode === "demo" ? "بيانات ثابتة للتجربة فقط" : "بيانات متجر حية مع عزل المستأجر"}</p></div></div>
      </aside>

      <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur lg:hidden">
        <div className="flex min-h-16 items-center justify-between px-4">
          <Link className="text-primary" href="/dashboard"><BrandMark compact /></Link>
          <div className="flex items-center gap-2">{mode === "demo" ? <Badge variant="outline">تجريبي</Badge> : null}<Sheet><SheetTrigger asChild><Button aria-label="فتح القائمة" className="size-11" size="icon" variant="outline"><Menu /></Button></SheetTrigger><SheetContent className="w-[88vw] max-w-sm overflow-y-auto" side="right"><SheetHeader className="border-b"><SheetTitle className="text-start"><BrandMark /></SheetTitle></SheetHeader><div className="p-4">{navigation}</div></SheetContent></Sheet></div>
        </div>
      </header>

      <main id="main-content" className="min-w-0 pb-24 lg:pb-0">{children}</main>

      <nav aria-label="التنقل السريع" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t bg-card px-1 pb-[max(0.25rem,env(safe-area-inset-bottom))] pt-1 lg:hidden">
        {navigationItems.slice(0, 5).map(({ href, mobileLabel, icon: Icon }) => {
          const active = isActive(pathname, href as string, href === "/dashboard");
          return <Link aria-current={active ? "page" : undefined} className={cn("flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg text-[10px]", active ? "text-primary" : "text-muted-foreground")} href={href} key={href}><Icon aria-hidden="true" className="size-5" /><span>{mobileLabel}</span></Link>;
        })}
      </nav>
    </div>
  );
}
