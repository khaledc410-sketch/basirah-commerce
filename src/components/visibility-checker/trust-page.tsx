import { CalendarDays, CheckCircle2, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { PublicLocale } from "@/i18n/public";

interface TrustSection {
  bullets?: string[];
  paragraphs?: string[];
  title: string;
}

interface TrustPageProps {
  intro: string;
  locale: PublicLocale;
  sections: TrustSection[];
  title: string;
}

export function TrustPage({ intro, locale, sections, title }: TrustPageProps) {
  const isAr = locale === "ar";

  return (
    <main id="main-content">
      <section className="hero-wash border-b">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24">
          <Badge className="gap-2 bg-primary/10 text-primary hover:bg-primary/10">
            <ShieldCheck />
            {isAr ? "الثقة والشفافية" : "Trust and transparency"}
          </Badge>
          <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl">{title}</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-muted-foreground">{intro}</p>
          <p className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarDays className="size-4 text-primary" />
            {isAr ? "آخر تحديث: 17 يوليو 2026" : "Last updated: July 17, 2026"}
          </p>
        </div>
      </section>

      <section className="py-14 sm:py-20">
        <div className="mx-auto grid max-w-5xl gap-5 px-4 sm:px-6">
          {sections.map((section) => (
            <Card key={section.title}>
              <CardContent className="p-6 sm:p-8">
                <h2 className="text-xl font-semibold sm:text-2xl">{section.title}</h2>
                {section.paragraphs?.map((paragraph) => (
                  <p className="mt-4 leading-8 text-muted-foreground" key={paragraph}>
                    {paragraph}
                  </p>
                ))}
                {section.bullets ? (
                  <ul className="mt-5 grid gap-3">
                    {section.bullets.map((bullet) => (
                      <li className="flex gap-3 leading-7 text-muted-foreground" key={bullet}>
                        <CheckCircle2 className="mt-1 size-5 shrink-0 text-success" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
