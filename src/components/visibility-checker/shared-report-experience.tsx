"use client";

import { AlertCircle, FileSearch, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import { Card, CardContent } from "@/components/ui/card";
import type { PublicLocale } from "@/i18n/public";

import { CheckerReport } from "./checker-report";
import { apiErrorMessage, type ApiError, type ScanReport } from "./types";

interface SharedReportExperienceProps {
  locale: PublicLocale;
  shareToken: string;
}

export function SharedReportExperience({ locale, shareToken }: SharedReportExperienceProps) {
  const [report, setReport] = useState<ScanReport>();
  const [accessLevel, setAccessLevel] = useState<"preview" | "full">("preview");
  const [error, setError] = useState<string>();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const shareResponse = await fetch(`/api/v1/public/reports/${encodeURIComponent(shareToken)}`, {
          cache: "no-store",
        });
        let response = shareResponse;
        if (shareResponse.status === 404) {
          response = await fetch(`/api/v1/public/scans/${encodeURIComponent(shareToken)}/preview`, {
            cache: "no-store",
          });
        }
        const body = (await response.json().catch(() => ({}))) as {
          report?: ScanReport;
          accessLevel?: "preview" | "full";
          error?: string | ApiError;
        };
        if (cancelled) return;
        if (!response.ok || !body.report) {
          throw new Error(
            apiErrorMessage(
              body.error,
              locale === "ar"
                ? "هذا الرابط غير صالح أو انتهت صلاحيته."
                : "This share link is invalid or has expired.",
            ),
          );
        }
        setReport(body.report);
        setAccessLevel(body.accessLevel ?? "preview");
      } catch (caught) {
        if (cancelled) return;
        setError(
          caught instanceof Error
            ? caught.message
            : locale === "ar"
              ? "تعذر تحميل التقرير."
              : "Could not load the report.",
        );
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [locale, shareToken]);

  if (report) {
    return (
      <CheckerReport
        accessLevel={accessLevel}
        locale={locale}
        report={report}
        reportId={shareToken}
        shared
      />
    );
  }

  return (
    <Card className="mx-auto max-w-xl">
      <CardContent className="p-8 text-center" aria-live="polite">
        {error ? (
          <>
            <AlertCircle className="mx-auto size-10 text-destructive" />
            <h1 className="mt-4 text-2xl font-semibold">
              {locale === "ar" ? "تعذر فتح التقرير" : "Could not open the report"}
            </h1>
            <p className="mt-3 text-muted-foreground" role="alert">{error}</p>
          </>
        ) : (
          <>
            <span className="relative mx-auto block size-12">
              <FileSearch className="absolute inset-0 size-12 text-primary" />
              <Loader2 className="absolute -end-2 -top-2 size-5 animate-spin text-primary" />
            </span>
            <h1 className="mt-5 text-2xl font-semibold">
              {locale === "ar" ? "نفتح التقرير الموثّق" : "Opening the evidence-led report"}
            </h1>
          </>
        )}
      </CardContent>
    </Card>
  );
}
