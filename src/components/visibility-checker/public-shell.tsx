import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";

import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";
import {
  publicMessages,
  publicPath,
  type PublicLocale,
} from "@/i18n/public";

interface PublicShellProps {
  children: React.ReactNode;
  locale: PublicLocale;
}

export function PublicShell({ children, locale }: PublicShellProps) {
  const messages = publicMessages[locale].common;
  const alternateLocale = locale === "ar" ? "en" : "ar";
  const Arrow = locale === "ar" ? ArrowLeft : ArrowRight;

  return (
    <div className="flex min-h-dvh flex-col overflow-x-clip bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex min-h-18 w-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link
            aria-label={messages.home}
            className="shrink-0 text-primary"
            href={publicPath(locale)}
          >
            <BrandMark />
          </Link>
          <nav
            aria-label={locale === "ar" ? "التنقل الرئيسي" : "Main navigation"}
            className="hidden items-center gap-6 lg:flex"
          >
            <Link
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              href={publicPath(locale, "/#report")}
            >
              {locale === "ar" ? "التقرير" : "Report"}
            </Link>
            <Link
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              href={publicPath(locale, "/#agent")}
            >
              {locale === "ar" ? "وكيل المبيعات" : "Sales agent"}
            </Link>
            <Link
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              href={publicPath(locale, "/#content")}
            >
              {locale === "ar" ? "المحتوى" : "Content"}
            </Link>
            <Link
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              href={publicPath(locale, "/pricing")}
            >
              {messages.pricing}
            </Link>
          </nav>
          <div className="flex items-center gap-1 sm:gap-2">
            <Button asChild className="min-h-11 px-3" variant="ghost">
              <Link href={publicPath(alternateLocale)} lang={alternateLocale}>
                {messages.switchLanguage}
              </Link>
            </Button>
            <Button asChild className="hidden min-h-11 sm:inline-flex" variant="ghost">
              <Link href={publicPath(locale, "/signin")}>{messages.signin}</Link>
            </Button>
            <Button asChild className="min-h-11 px-3 sm:px-4">
              <Link href={publicPath(locale, "/#checker")}>
                <span className="hidden sm:inline">{messages.startCheck}</span>
                <span className="sm:hidden">{locale === "ar" ? "افحص" : "Check"}</span>
                <Arrow />
              </Link>
            </Button>
          </div>
        </div>
      </header>
      {children}
      <footer className="mt-auto border-t bg-card">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between">
          <BrandMark className="text-primary" />
          <p className="max-w-xl text-sm text-muted-foreground">{messages.footer}</p>
          <div className="flex flex-wrap gap-5 text-sm text-muted-foreground">
            <Link className="inline-flex min-h-11 items-center hover:text-foreground" href={publicPath(locale, "/methodology")}>
              {messages.methodology}
            </Link>
            <Link className="inline-flex min-h-11 items-center hover:text-foreground" href={publicPath(locale, "/pricing")}>
              {messages.pricing}
            </Link>
            <Link className="inline-flex min-h-11 items-center hover:text-foreground" href={publicPath(locale, "/privacy")}>
              {locale === "ar" ? "الخصوصية" : "Privacy"}
            </Link>
            <Link className="inline-flex min-h-11 items-center hover:text-foreground" href={publicPath(locale, "/terms")}>
              {locale === "ar" ? "الشروط" : "Terms"}
            </Link>
            <Link className="inline-flex min-h-11 items-center hover:text-foreground" href={publicPath(locale, "/support")}>
              {locale === "ar" ? "الدعم" : "Support"}
            </Link>
            <Link className="inline-flex min-h-11 items-center hover:text-foreground" href={publicPath(locale, "/signin")}>
              {messages.signin}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
