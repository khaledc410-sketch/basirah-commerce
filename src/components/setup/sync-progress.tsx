"use client";

import {
  AlertCircle,
  ArrowLeft,
  Check,
  Database,
  Loader2,
  PackageSearch,
  RefreshCw,
  Store,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

type StageState = "queued" | "running" | "succeeded" | "failed" | "cancelled" | "dead_letter";

interface SyncStage {
  id: string;
  resourceType: string;
  status: StageState;
  recordsTotal: number | null;
  recordsProcessed: number;
  recordsFailed: number;
  percent: number | null;
  error?: { message: string; retryable: boolean };
}

interface SyncStatus {
  runId: string;
  overallStatus: StageState;
  stages: SyncStage[];
  summary: { products: number; variants: number; categories: number };
  canRetry: boolean;
  canContinue: boolean;
  freshness: string | null;
}

const productionSteps = [
  { resource: "store", label: "بيانات المتجر", icon: Store },
  { resource: "categories", label: "الفئات", icon: Database },
  { resource: "products", label: "المنتجات والمتغيرات", icon: PackageSearch },
] as const;

const demoSteps = [
  { label: "بيانات المتجر", count: 1, icon: Store },
  { label: "المنتجات والمتغيرات", count: 6, icon: PackageSearch },
  { label: "الفئات والسمات", count: 14, icon: Database },
] as const;

function stageProgress(stage: SyncStage | undefined) {
  if (!stage) return 0;
  if (stage.status === "succeeded") return 100;
  return stage.percent ?? (stage.status === "running" ? 5 : 0);
}

export function SyncProgress({
  mode,
  initialRunId,
}: {
  mode: "demo" | "production";
  initialRunId?: string;
}) {
  const [demoProgress, setDemoProgress] = useState(8);
  const [runId, setRunId] = useState(initialRunId);
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [loading, setLoading] = useState(mode === "production");
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mode !== "demo") return;
    const interval = window.setInterval(() => {
      setDemoProgress((value) => {
        if (value >= 100) {
          window.clearInterval(interval);
          return 100;
        }
        return Math.min(100, value + 7);
      });
    }, 260);
    return () => window.clearInterval(interval);
  }, [mode]);

  const loadStatus = useCallback(async () => {
    const query = runId ? `?runId=${encodeURIComponent(runId)}` : "";
    const response = await fetch(`/api/sync${query}`, { cache: "no-store" });
    if (response.status === 404) {
      setStatus(null);
      setLoading(false);
      return false;
    }
    const body = (await response.json()) as SyncStatus | { error?: string };
    if (!response.ok || !("runId" in body)) {
      throw new Error("error" in body && body.error ? body.error : "تعذر قراءة حالة المزامنة.");
    }
    setStatus(body);
    setRunId(body.runId);
    setError(null);
    setLoading(false);
    return !["succeeded", "failed", "cancelled", "dead_letter"].includes(body.overallStatus);
  }, [runId]);

  useEffect(() => {
    if (mode !== "production") return;
    let cancelled = false;
    let timeout: number | undefined;
    const poll = async () => {
      try {
        const shouldContinue = await loadStatus();
        if (!cancelled && shouldContinue) timeout = window.setTimeout(poll, 2_000);
      } catch (caught) {
        if (!cancelled) {
          setLoading(false);
          setError(caught instanceof Error ? caught.message : "تعذر قراءة حالة المزامنة.");
        }
      }
    };
    void poll();
    return () => {
      cancelled = true;
      if (timeout) window.clearTimeout(timeout);
    };
  }, [loadStatus, mode]);

  const requestSync = async () => {
    setRequesting(true);
    setError(null);
    try {
      const response = await fetch("/api/sync", {
        method: "POST",
        headers: { "idempotency-key": crypto.randomUUID() },
      });
      const body = (await response.json()) as { runId?: string; error?: string };
      if (!response.ok || !body.runId) throw new Error(body.error ?? "تعذر بدء المزامنة.");
      setStatus(null);
      setRunId(body.runId);
      setLoading(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "تعذر بدء المزامنة.");
    } finally {
      setRequesting(false);
    }
  };

  if (mode === "demo") return <DemoSyncProgress progress={demoProgress} />;

  const progress = status
    ? Math.round(
        productionSteps.reduce(
          (total, step) =>
            total + stageProgress(status.stages.find((stage) => stage.resourceType === step.resource)),
          0,
        ) / productionSteps.length,
      )
    : 0;
  const running = Boolean(status && ["queued", "running"].includes(status.overallStatus));
  const failed = Boolean(status && ["failed", "cancelled", "dead_letter"].includes(status.overallStatus));

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <Card>
        <CardHeader className="gap-4 border-b">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="text-2xl">مزامنة بيانات المتجر</CardTitle>
              <p className="mt-2 text-sm text-muted-foreground">
                الحالة المعروضة أدناه تأتي من مهام الاستيراد الفعلية، وليست مؤقتًا تقديريًا.
              </p>
            </div>
            <Badge className="gap-2" variant={failed ? "destructive" : "secondary"}>
              {running || loading ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
              {loading ? "جارٍ التحميل" : running ? "مزامنة جارية" : failed ? "تحتاج إلى تدخل" : status ? "اكتملت" : "لم تبدأ"}
            </Badge>
          </div>
          <Progress aria-label="تقدم مزامنة المتجر" className="h-2" value={progress} />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{progress}٪</span>
            <span>{status?.freshness ? `آخر اكتمال: ${new Date(status.freshness).toLocaleString("ar-SA")}` : "بانتظار أول مزامنة مكتملة"}</span>
          </div>
        </CardHeader>
        <CardContent className="divide-y p-0">
          {productionSteps.map((step) => {
            const stage = status?.stages.find((item) => item.resourceType === step.resource);
            const done = stage?.status === "succeeded";
            const active = stage?.status === "running";
            const stageFailed = stage && ["failed", "cancelled", "dead_letter"].includes(stage.status);
            return (
              <div className="flex min-h-20 items-center gap-4 px-5 py-4" key={step.resource}>
                <span className={`flex size-10 items-center justify-center rounded-full ${done ? "bg-success-soft text-success" : active ? "bg-primary/10 text-primary" : stageFailed ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"}`}>
                  {done ? <Check className="size-5" /> : active ? <Loader2 className="size-5 animate-spin" /> : <step.icon className="size-5" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{step.label}</p>
                  <p className="text-sm text-muted-foreground">
                    {stageFailed ? stage.error?.message ?? "فشلت هذه المرحلة." : done ? `${stage.recordsProcessed} سجل تمت معالجته` : active ? `${stage.recordsProcessed} من ${stage.recordsTotal ?? "—"}` : "بانتظار التنفيذ"}
                  </p>
                </div>
                <span className="text-sm font-medium text-muted-foreground">{done ? "تم" : active ? "يعمل" : stageFailed ? "فشل" : "—"}</span>
              </div>
            );
          })}
        </CardContent>
      </Card>
      <div className="space-y-4">
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="p-6">
            <p className="text-sm font-medium opacity-80">المنتجات المستوردة</p>
            <p className="metric-numbers mt-2 text-4xl font-semibold">{status?.summary.products ?? 0}</p>
            <p className="mt-1 text-sm opacity-80">{status ? `${status.summary.variants} متغير و${status.summary.categories} فئة محفوظة.` : "اربط سلة ثم ابدأ المزامنة."}</p>
          </CardContent>
        </Card>
        {error ? <SyncNotice message={error} /> : null}
        {status?.overallStatus === "succeeded" && status.summary.products === 0 ? <SyncNotice message="اكتملت القراءة لكن سلة لم تُرجع منتجات. تحقق من المتجر والصلاحيات ثم أعد المحاولة." /> : null}
        {status?.canContinue ? (
          <Button asChild className="h-12 w-full"><Link href="/setup/onboarding"><ArrowLeft />ابدأ تهيئة المستشار</Link></Button>
        ) : running || loading ? (
          <Button className="h-12 w-full" disabled><Loader2 className="animate-spin" />بانتظار البيانات الأساسية</Button>
        ) : (
          <Button className="h-12 w-full" disabled={requesting} onClick={requestSync}>
            {requesting ? <Loader2 className="animate-spin" /> : <RefreshCw />}
            {status ? "إعادة المزامنة" : "بدء المزامنة"}
          </Button>
        )}
      </div>
    </div>
  );
}

function SyncNotice({ message }: { message: string }) {
  return <div className="flex gap-3 rounded-xl border bg-card p-4 text-sm"><AlertCircle className="mt-0.5 size-5 shrink-0 text-warning" /><p>{message}</p></div>;
}

function DemoSyncProgress({ progress }: { progress: number }) {
  const completed = Math.min(demoSteps.length, Math.floor((progress / 100) * (demoSteps.length + 0.7)));
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <Card><CardHeader className="gap-4 border-b"><CardTitle className="text-2xl">محاكاة مزامنة العرض</CardTitle><Progress aria-label="تقدم مزامنة العرض" className="h-2" value={progress} /></CardHeader><CardContent className="divide-y p-0">
        {demoSteps.map((step, index) => <div className="flex min-h-20 items-center gap-4 px-5 py-4" key={step.label}><step.icon className="size-5" /><div className="flex-1"><p className="font-medium">{step.label}</p><p className="text-sm text-muted-foreground">{index < completed ? `${step.count} سجل تجريبي` : "بانتظار المحاكاة"}</p></div>{index < completed ? <Check className="size-5 text-success" /> : <Loader2 className="size-5 animate-spin text-muted-foreground" />}</div>)}
      </CardContent></Card>
      <div className="space-y-4"><Card className="bg-primary text-primary-foreground"><CardContent className="p-6"><p className="text-sm opacity-80">بيانات العرض</p><p className="metric-numbers mt-2 text-4xl font-semibold">3</p><p className="mt-1 text-sm opacity-80">منتجات تجريبية؛ لا تمثل متجرًا حقيقيًا.</p></CardContent></Card>{progress < 100 ? <Button className="h-12 w-full" disabled><Loader2 className="animate-spin" />جارٍ تشغيل المحاكاة</Button> : <Button asChild className="h-12 w-full"><Link href="/setup/onboarding"><ArrowLeft />متابعة العرض</Link></Button>}</div>
    </div>
  );
}
