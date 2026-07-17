import Link from "next/link";
import type { ReactNode } from "react";

import { BrandMark } from "@/components/brand-mark";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { isDemoMode } from "@/config/env";

interface SetupPageShellProps {
  children: ReactNode;
  currentStep: number;
  totalSteps?: number;
  label: string;
}

export function SetupPageShell({
  children,
  currentStep,
  totalSteps = 4,
  label,
}: SetupPageShellProps) {
  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b bg-card/95">
        <div className="mx-auto flex min-h-18 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link aria-label="العودة إلى بصيرة" className="text-primary" href="/">
            <BrandMark />
          </Link>
          {isDemoMode() ? <Badge variant="outline">وضع تجريبي واضح</Badge> : null}
        </div>
      </header>
      <main id="main-content" className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-primary">إعداد مساحة المتجر</p>
            <p className="mt-1 text-sm text-muted-foreground">{label}</p>
          </div>
          <div className="w-full max-w-72 space-y-2 sm:w-72">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>الخطوة {currentStep} من {totalSteps}</span>
              <span>{Math.round((currentStep / totalSteps) * 100)}٪</span>
            </div>
            <Progress aria-label={`تقدم الإعداد: ${currentStep} من ${totalSteps}`} value={(currentStep / totalSteps) * 100} />
          </div>
        </div>
        {children}
      </main>
    </div>
  );
}
