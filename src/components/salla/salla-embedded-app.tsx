"use client";

import type { EmbeddedApp } from "@salla.sa/embedded-sdk";
import { CircleCheck, ExternalLink, LoaderCircle, RefreshCw, ShieldAlert, Store } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  EmbeddedRequestError,
  clearEmbeddedRefreshGuard,
  type EmbeddedLocale,
  type EmbeddedStoreOverview,
  normalizeEmbeddedLocale,
  requestEmbeddedOverview,
  requestEmbeddedAuthRefresh,
  requestEmbeddedSession,
  stripEmbeddedToken,
  trustedContinueUrl,
} from "@/core/commerce/salla-embedded-client";

const OPEN_BASIRAH_ACTION = "open-basirah";

type EmbeddedView =
  | { kind: "loading"; locale: EmbeddedLocale }
  | { kind: "refreshing"; locale: EmbeddedLocale }
  | { kind: "authorization_pending"; locale: EmbeddedLocale }
  | { kind: "link_required"; locale: EmbeddedLocale; continueSetup: () => void }
  | { kind: "connected"; locale: EmbeddedLocale; overview: EmbeddedStoreOverview; openBasirah: () => void }
  | { kind: "error"; locale: EmbeddedLocale; authentication: boolean };

export function SallaEmbeddedApp() {
  const [view, setView] = useState<EmbeddedView>({ kind: "loading", locale: "ar" });

  useEffect(() => {
    let active = true;
    let sdk: EmbeddedApp | null = null;
    let unsubscribeAction: (() => void) | null = null;
    let unsubscribeTheme: (() => void) | null = null;
    let redirectTimer: ReturnType<typeof setTimeout> | null = null;
    const abortController = new AbortController();

    const publish = (nextView: EmbeddedView) => {
      if (active) setView(nextView);
    };

    const bootstrap = async () => {
      let locale: EmbeddedLocale = "ar";
      try {
        const sdkModule = await import("@salla.sa/embedded-sdk");
        if (!active) return;
        sdk = sdkModule.embedded;

        const initialized = await sdk.init();
        if (!active) return;
        locale = normalizeEmbeddedLocale(initialized.layout.locale);
        const applyTheme = (theme: "light" | "dark") => {
          document.documentElement.classList.toggle("dark", theme === "dark");
          document.documentElement.dataset.theme = theme;
        };
        applyTheme(initialized.layout.theme);
        unsubscribeTheme = sdk.onThemeChange(applyTheme);
        publish({ kind: "loading", locale });
        sdk.page.setTitle(copy[locale].pageTitle);

        const token = sdk.auth.getToken();
        window.history.replaceState(window.history.state, "", stripEmbeddedToken(window.location.href));
        if (!token || token.length < 20 || token.length > 4_096) {
          throw new EmbeddedRequestError("The embedded authorization token is missing.", 401);
        }

        const session = await requestEmbeddedSession({ token, signal: abortController.signal });
        if (!active) return;
        clearEmbeddedRefreshGuard(window.sessionStorage);

        if (session.status === "authorization_pending") {
          publish({ kind: "authorization_pending", locale });
          sdk.ready();
          return;
        }

        if (session.status === "link_required") {
          const continueUrl = trustedContinueUrl(session.continueUrl, window.location.origin);
          if (!continueUrl) throw new EmbeddedRequestError("The continuation URL was rejected.");
          const continueSetup = () => sdk?.page.redirect(continueUrl);
          publish({ kind: "link_required", locale, continueSetup });
          sdk.ready();
          redirectTimer = setTimeout(continueSetup, 0);
          return;
        }

        const overview = await requestEmbeddedOverview({
          sessionToken: session.sessionToken,
          signal: abortController.signal,
        });
        if (!active) return;

        const dashboardUrl = new URL("/dashboard", window.location.origin).toString();
        const openBasirah = () => sdk?.page.redirect(dashboardUrl);
        sdk.nav.setAction({ title: copy[locale].openBasirah, value: OPEN_BASIRAH_ACTION });
        unsubscribeAction = sdk.nav.onActionClick((value) => {
          if (value === OPEN_BASIRAH_ACTION) openBasirah();
        });
        publish({ kind: "connected", locale, overview, openBasirah });
        sdk.ready();
      } catch (caught) {
        if (!active || abortController.signal.aborted) return;
        if (caught instanceof EmbeddedRequestError && caught.status === 401) {
          if (sdk && requestEmbeddedAuthRefresh(sdk.auth, window.sessionStorage)) {
            publish({ kind: "refreshing", locale });
            return;
          }
          publish({ kind: "error", locale, authentication: true });
          sdk?.destroy();
          return;
        }
        publish({ kind: "error", locale, authentication: false });
        sdk?.destroy();
      }
    };

    void bootstrap();

    return () => {
      active = false;
      abortController.abort();
      if (redirectTimer) clearTimeout(redirectTimer);
      unsubscribeAction?.();
      unsubscribeTheme?.();
      sdk?.nav.clearAction();
      sdk?.destroy();
    };
  }, []);

  return <EmbeddedSurface view={view} />;
}

function EmbeddedSurface({ view }: { view: EmbeddedView }) {
  const text = copy[view.locale];
  const direction = view.locale === "ar" ? "rtl" : "ltr";

  return (
    <main
      id="main-content"
      className="min-h-dvh bg-background"
      dir={direction}
      lang={view.locale}
    >
      <Card className="w-full rounded-none border-0 bg-transparent shadow-none">
        <CardHeader className="border-b">
          <div className="mb-3 flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Store aria-hidden="true" className="size-5" />
          </div>
          <CardTitle>{titleForView(view, text)}</CardTitle>
          <CardDescription>{descriptionForView(view, text)}</CardDescription>
        </CardHeader>
        <CardContent>
          {view.kind === "loading" ? <LoadingState label={text.loading} /> : null}
          {view.kind === "refreshing" ? <LoadingState label={text.refreshing} refresh /> : null}
          {view.kind === "authorization_pending" ? (
            <Notice icon={<RefreshCw />} text={text.pendingDetail} />
          ) : null}
          {view.kind === "link_required" ? (
            <div className="space-y-4">
              <Notice icon={<ShieldAlert />} text={text.linkDetail} />
              <Button className="w-full sm:w-auto" onClick={view.continueSetup} size="lg">
                {text.continueSetup}
                <ExternalLink aria-hidden="true" />
              </Button>
            </div>
          ) : null}
          {view.kind === "connected" ? <ConnectedOverview text={text} view={view} /> : null}
          {view.kind === "error" ? (
            <Notice icon={<ShieldAlert />} text={view.authentication ? text.authErrorDetail : text.errorDetail} destructive />
          ) : null}
        </CardContent>
      </Card>
    </main>
  );
}

function ConnectedOverview({
  view,
  text,
}: {
  view: Extract<EmbeddedView, { kind: "connected" }>;
  text: (typeof copy)[EmbeddedLocale];
}) {
  const { store, sync } = view.overview;
  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3 rounded-xl bg-primary/8 p-4 text-primary">
        <CircleCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
        <div>
          <p className="font-medium text-foreground">{store.name}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {[store.externalDomain, store.currency].filter(Boolean).join(" · ")}
          </p>
        </div>
      </div>

      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <SummaryItem label={text.storeStatus} value={displayStatus(store.status, view.locale)} />
        <SummaryItem label={text.storeLocale} value={store.defaultLocale} />
        <SummaryItem label={text.syncStatus} value={sync ? displayStatus(sync.status, view.locale) : text.notStarted} />
        <SummaryItem label={text.recordsProcessed} value={sync ? formatNumber(sync.recordsProcessed, view.locale) : "—"} />
      </dl>

      {sync ? (
        <div className="space-y-2" aria-label={text.syncProgress}>
          <div className="flex items-center justify-between gap-4 text-sm">
            <span className="text-muted-foreground">{text.syncProgress}</span>
            <span className="font-medium tabular-nums">{formatNumber(sync.progress, view.locale)}%</span>
          </div>
          <progress className="h-2 w-full accent-primary" max={100} value={sync.progress} />
          {sync.updatedAt ? (
            <p className="text-xs text-muted-foreground">
              {text.lastUpdated}: {formatDate(sync.updatedAt, view.locale)}
            </p>
          ) : null}
        </div>
      ) : null}

      <Button className="w-full sm:w-auto" onClick={view.openBasirah} size="lg">
        {text.openBasirah}
        <ExternalLink aria-hidden="true" />
      </Button>
    </div>
  );
}

function LoadingState({ label, refresh = false }: { label: string; refresh?: boolean }) {
  const Icon = refresh ? RefreshCw : LoaderCircle;
  return (
    <div className="flex items-center gap-3 py-4 text-sm text-muted-foreground" role="status">
      <Icon aria-hidden="true" className="size-5 animate-spin text-primary" />
      <span>{label}</span>
    </div>
  );
}

function Notice({ icon, text, destructive = false }: { icon: React.ReactNode; text: string; destructive?: boolean }) {
  return (
    <div
      className={destructive ? "flex gap-3 rounded-xl bg-destructive/10 p-4 text-destructive" : "flex gap-3 rounded-xl bg-muted p-4"}
      role={destructive ? "alert" : "status"}
    >
      <span className="mt-0.5 [&>svg]:size-5" aria-hidden="true">{icon}</span>
      <p className="text-sm leading-6">{text}</p>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-background p-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-medium">{value}</dd>
    </div>
  );
}

function titleForView(view: EmbeddedView, text: (typeof copy)[EmbeddedLocale]) {
  if (view.kind === "connected") return text.connectedTitle;
  if (view.kind === "link_required") return text.linkTitle;
  if (view.kind === "authorization_pending") return text.pendingTitle;
  if (view.kind === "error") return text.errorTitle;
  return text.pageTitle;
}

function descriptionForView(view: EmbeddedView, text: (typeof copy)[EmbeddedLocale]) {
  if (view.kind === "connected") return text.connectedDescription;
  if (view.kind === "link_required") return text.linkDescription;
  if (view.kind === "authorization_pending") return text.pendingDescription;
  if (view.kind === "error") return text.errorDescription;
  return text.loadingDescription;
}

function displayStatus(status: string, locale: EmbeddedLocale) {
  const statuses: Record<string, { ar: string; en: string }> = {
    active: { ar: "نشط", en: "Active" },
    completed: { ar: "مكتمل", en: "Completed" },
    failed: { ar: "متعذر", en: "Failed" },
    pending: { ar: "قيد الانتظار", en: "Pending" },
    queued: { ar: "في قائمة الانتظار", en: "Queued" },
    running: { ar: "جارٍ", en: "Running" },
  };
  return statuses[status.toLowerCase()]?.[locale] ?? (locale === "ar" ? "غير معروف" : "Unknown");
}

function formatNumber(value: number, locale: EmbeddedLocale) {
  return new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-US").format(value);
}

function formatDate(value: string, locale: EmbeddedLocale) {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

const copy = {
  ar: {
    pageTitle: "بصيرة لمتجر سلة",
    loading: "جارٍ التحقق من اتصال متجر سلة…",
    loadingDescription: "نتحقق من التفويض ونحمّل ملخصًا آمنًا لمتجرك.",
    refreshing: "انتهت صلاحية التفويض. نطلب رمزًا جديدًا من سلة…",
    connectedTitle: "متجرك متصل ببصيرة",
    connectedDescription: "هذا ملخص الاتصال وآخر مزامنة للكتالوج.",
    pendingTitle: "تفويض سلة قيد التجهيز",
    pendingDescription: "وصل التفويض، لكن بيانات الاتصال لم تكتمل بعد.",
    pendingDetail: "انتظر بضع ثوانٍ ثم أعد فتح بصيرة من لوحة تطبيقات سلة.",
    linkTitle: "أكمل ربط حساب بصيرة",
    linkDescription: "سنفتح بصيرة خارج الإطار لإكمال الربط بأمان.",
    linkDetail: "إذا لم تنتقل الصفحة تلقائيًا، استخدم زر المتابعة.",
    continueSetup: "متابعة الربط",
    errorTitle: "تعذر فتح بصيرة",
    errorDescription: "لم نتمكن من إكمال جلسة التطبيق المضمّن.",
    authErrorDetail: "تعذر تجديد تفويض سلة. أغلق التطبيق ثم افتحه مجددًا من لوحة سلة.",
    errorDetail: "حدث خطأ آمن أثناء تحميل بيانات المتجر. أغلق التطبيق وحاول مجددًا.",
    openBasirah: "فتح بصيرة",
    storeStatus: "حالة المتجر",
    storeLocale: "لغة المتجر",
    syncStatus: "حالة المزامنة",
    recordsProcessed: "السجلات المعالجة",
    syncProgress: "تقدم المزامنة",
    lastUpdated: "آخر تحديث",
    notStarted: "لم تبدأ",
  },
  en: {
    pageTitle: "Basirah for Salla",
    loading: "Verifying the Salla connection…",
    loadingDescription: "We are verifying authorization and loading a safe store summary.",
    refreshing: "Authorization expired. Requesting a fresh token from Salla…",
    connectedTitle: "Your store is connected to Basirah",
    connectedDescription: "Here is the connection and latest catalog sync summary.",
    pendingTitle: "Salla authorization is being prepared",
    pendingDescription: "Authorization arrived, but the connection is not ready yet.",
    pendingDetail: "Wait a few seconds, then reopen Basirah from your Salla apps dashboard.",
    linkTitle: "Finish linking your Basirah account",
    linkDescription: "We will open Basirah outside the frame to complete the link securely.",
    linkDetail: "If the page does not move automatically, use the continue button.",
    continueSetup: "Continue linking",
    errorTitle: "Basirah could not open",
    errorDescription: "We could not complete the embedded app session.",
    authErrorDetail: "Salla authorization could not be renewed. Close the app and reopen it from Salla.",
    errorDetail: "A safe error occurred while loading store data. Close the app and try again.",
    openBasirah: "Open Basirah",
    storeStatus: "Store status",
    storeLocale: "Store language",
    syncStatus: "Sync status",
    recordsProcessed: "Records processed",
    syncProgress: "Sync progress",
    lastUpdated: "Last updated",
    notStarted: "Not started",
  },
} as const;
