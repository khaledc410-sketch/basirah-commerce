"use client";

import {
  AlertCircle,
  CheckCircle2,
  FileSearch,
  Loader2,
  Network,
  RefreshCw,
  SearchCheck,
  Shapes,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { publicPath, type PublicLocale } from "@/i18n/public";

import { CheckerReport } from "./checker-report";
import { apiErrorMessage, type ApiError, type ScanReport, type ScanState } from "./types";

interface CheckerExperienceProps {
  locale: PublicLocale;
  token: string;
}

function clampProgress(progress: unknown) {
  return typeof progress === "number" && Number.isFinite(progress)
    ? Math.max(0, Math.min(100, Math.round(progress)))
    : 0;
}

export function CheckerExperience({ locale, token }: CheckerExperienceProps) {
  const [scan, setScan] = useState<ScanState>({ token, status: "queued", progress: 0 });
  const [report, setReport] = useState<ScanReport>();
  const [requestError, setRequestError] = useState<string>();

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function poll() {
      try {
        const response = await fetch(`/api/v1/public/scans/${encodeURIComponent(token)}/status`, {
          cache: "no-store",
        });
        const body = (await response.json().catch(() => ({}))) as {
          scan?: Partial<ScanState>;
          error?: string | ApiError;
        } & Partial<ScanState>;
        if (!response.ok) {
          throw new Error(
            apiErrorMessage(
              body.error,
              locale === "ar" ? "تعذر قراءة حالة الفحص." : "Could not read check status.",
            ),
          );
        }
        if (cancelled) return;
        const incoming = body.scan ?? body;
        const nextScan: ScanState = {
          token: incoming.token ?? token,
          status: incoming.status ?? "running",
          progress: clampProgress(incoming.progress),
          currentStep: incoming.currentStep,
          error: incoming.error,
        };
        setScan(nextScan);
        setRequestError(undefined);

        if (nextScan.status === "completed") {
          const previewResponse = await fetch(
            `/api/v1/public/scans/${encodeURIComponent(token)}/preview`,
            { cache: "no-store" },
          );
          const previewBody = (await previewResponse.json().catch(() => ({}))) as {
            report?: ScanReport;
            error?: string | ApiError;
          };
          if (cancelled) return;
          if (previewResponse.status === 202) {
            timer = setTimeout(poll, 1200);
            return;
          }
          if (!previewResponse.ok || !previewBody.report) {
            throw new Error(
              apiErrorMessage(
                previewBody.error,
                locale === "ar"
                  ? "اكتمل الفحص لكن تعذر بناء المعاينة."
                  : "The check finished, but its preview is not available.",
              ),
            );
          }
          setReport(previewBody.report);
          return;
        }

        if (nextScan.status !== "failed") timer = setTimeout(poll, 1600);
      } catch (caught) {
        if (cancelled) return;
        setRequestError(
          caught instanceof Error
            ? caught.message
            : locale === "ar"
              ? "تعذر الاتصال بالخادم."
              : "Could not connect to the server.",
        );
      }
    }

    void poll();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [locale, token]);

  if (report) return <CheckerReport locale={locale} report={report} reportId={token} />;

  const isAr = locale === "ar";
  const stages = [
    { icon: Network, threshold: 10, ar: "اكتشاف الموقع", en: "Discovering the site" },
    { icon: FileSearch, threshold: 30, ar: "قراءة الصفحات العامة", en: "Reading public pages" },
    { icon: Shapes, threshold: 60, ar: "فحص الكيان والمحتوى والبنية", en: "Checking entity, content, and structure" },
    { icon: SearchCheck, threshold: 90, ar: "بناء النتيجة الموثّقة", en: "Building the evidence-led result" },
  ];
  const statusMessage = isAr
    ? scan.currentStep || (scan.status === "queued" ? "الفحص في قائمة الانتظار…" : "نجمع الأدلة من صفحات متجرك…")
    : scan.status === "queued"
      ? "Your check is queued…"
      : stages.findLast((stage) => scan.progress >= stage.threshold)?.en || "Starting the check…";
  const fatalError =
    scan.status === "failed"
      ? apiErrorMessage(scan.error, isAr ? "فشل الفحص." : "The check failed.")
      : requestError;

  return (
    <div className="mx-auto max-w-3xl">
      <Card>
        <CardContent className="p-6 sm:p-9">
          {fatalError ? (
            <div className="text-center" role="alert">
              <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-destructive/10 text-destructive">
                <AlertCircle className="size-7" />
              </span>
              <h1 className="mt-5 text-2xl font-semibold">
                {isAr ? "لم نتمكن من إكمال الفحص" : "We could not complete the check"}
              </h1>
              <p className="mx-auto mt-3 max-w-xl text-muted-foreground">{fatalError}</p>
              <Button asChild className="mt-6 h-11">
                <Link href={publicPath(locale, "/#checker")}>
                  <RefreshCw />
                  {isAr ? "ابدأ فحصًا جديدًا" : "Start a new check"}
                </Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="text-center" aria-live="polite">
                <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <Loader2 className="size-7 animate-spin" />
                </span>
                <p className="mt-5 text-sm font-semibold text-primary">
                  {scan.status === "queued"
                    ? isAr
                      ? "في قائمة الانتظار"
                      : "Queued"
                    : isAr
                      ? "الفحص يعمل الآن"
                      : "Check in progress"}
                </p>
                <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">
                  {isAr ? "نبني نتيجة متجرك من أدلة فعلية" : "Building your result from real evidence"}
                </h1>
                <p className="mt-3 text-muted-foreground">{statusMessage}</p>
              </div>
              <div className="mt-8">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span>{isAr ? "تقدم الفحص" : "Check progress"}</span>
                  <span className="metric-numbers font-semibold">{scan.progress}%</span>
                </div>
                <Progress aria-label={isAr ? "تقدم الفحص" : "Check progress"} className="h-2" value={scan.progress} />
              </div>
              <ol className="mt-8 grid gap-3 sm:grid-cols-2">
                {stages.map((stage) => {
                  const complete = scan.progress >= stage.threshold;
                  return (
                    <li className="flex min-h-16 items-center gap-3 rounded-xl bg-muted p-4" key={stage.threshold}>
                      <span
                        className={
                          complete
                            ? "grid size-9 shrink-0 place-items-center rounded-lg bg-success-soft text-success"
                            : "grid size-9 shrink-0 place-items-center rounded-lg bg-background text-muted-foreground"
                        }
                      >
                        {complete ? <CheckCircle2 className="size-5" /> : <stage.icon className="size-5" />}
                      </span>
                      <span className={complete ? "text-sm font-medium" : "text-sm text-muted-foreground"}>
                        {stage[locale]}
                      </span>
                    </li>
                  );
                })}
              </ol>
              <p className="mt-7 text-center text-xs text-muted-foreground">
                {isAr
                  ? "يمكنك إبقاء هذه الصفحة مفتوحة. لا نحوّل البيانات غير المتاحة إلى نتائج سلبية."
                  : "Keep this page open. We never turn unavailable data into a negative result."}
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
