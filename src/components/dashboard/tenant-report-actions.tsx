"use client";

import { CheckCircle2, FileDown, Link2, Loader2, Unlink } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export function TenantReportActions({
  storeId,
  reportId,
  canShare,
  canDownload,
}: {
  storeId: string;
  reportId: string;
  canShare: boolean;
  canDownload: boolean;
}) {
  const [busy, setBusy] = useState<"share" | "revoke" | "pdf">();
  const [sharedUrl, setSharedUrl] = useState<string>();
  const [message, setMessage] = useState<string>();

  async function share() {
    setBusy("share");
    setMessage(undefined);
    try {
      const response = await fetch(
        `/api/v1/stores/${encodeURIComponent(storeId)}/reports/${encodeURIComponent(reportId)}/share`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ action: "create", locale: "ar" }),
        },
      );
      const body = (await response.json().catch(() => ({}))) as {
        sharePath?: string;
        error?: { message?: string };
      };
      if (!response.ok || !body.sharePath) throw new Error(body.error?.message ?? "تعذر إنشاء الرابط.");
      const url = new URL(body.sharePath, window.location.origin).toString();
      await navigator.clipboard.writeText(url);
      setSharedUrl(url);
      setMessage("تم إنشاء الرابط ونسخه.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "تعذر إنشاء الرابط.");
    } finally {
      setBusy(undefined);
    }
  }

  async function revoke() {
    setBusy("revoke");
    setMessage(undefined);
    try {
      const response = await fetch(
        `/api/v1/stores/${encodeURIComponent(storeId)}/reports/${encodeURIComponent(reportId)}/share`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ action: "revoke" }),
        },
      );
      const body = (await response.json().catch(() => ({}))) as {
        error?: { message?: string };
      };
      if (!response.ok) throw new Error(body.error?.message ?? "تعذر إبطال الرابط.");
      setSharedUrl(undefined);
      setMessage("تم إبطال رابط المشاركة.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "تعذر إبطال الرابط.");
    } finally {
      setBusy(undefined);
    }
  }

  async function createPdf() {
    setBusy("pdf");
    setMessage(undefined);
    try {
      const response = await fetch(
        `/api/v1/stores/${encodeURIComponent(storeId)}/reports/${encodeURIComponent(reportId)}/pdf`,
        { method: "POST" },
      );
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: { message?: string } };
        throw new Error(body.error?.message ?? "تعذر إنشاء ملف PDF.");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `basirah-report-${reportId}.pdf`;
      anchor.click();
      URL.revokeObjectURL(url);
      setMessage("تم إنشاء ملف PDF من نسخة التقرير الثابتة.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "تعذر إنشاء ملف PDF.");
    } finally {
      setBusy(undefined);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {canDownload && (
        <Button className="min-h-11" disabled={Boolean(busy)} onClick={() => void createPdf()} variant="outline">
          {busy === "pdf" ? <Loader2 className="animate-spin" /> : <FileDown />}
          PDF
        </Button>
      )}
      {canShare && (
        <>
          <Button className="min-h-11" disabled={Boolean(busy)} onClick={() => void share()} variant="outline">
            {busy === "share" ? <Loader2 className="animate-spin" /> : sharedUrl ? <CheckCircle2 /> : <Link2 />}
            مشاركة
          </Button>
          <Button className="min-h-11" disabled={Boolean(busy)} onClick={() => void revoke()} variant="ghost">
            {busy === "revoke" ? <Loader2 className="animate-spin" /> : <Unlink />}
            إبطال الرابط
          </Button>
        </>
      )}
      {message && <p className="basis-full text-xs text-muted-foreground" role="status">{message}</p>}
    </div>
  );
}
