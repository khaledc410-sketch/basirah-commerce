"use client";

import { ArrowLeft, Loader2, ShieldCheck } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export function SallaBindForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bind = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/connect/salla/bind", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: "{}",
      });
      const body = (await response.json()) as { runId?: string; connected?: boolean; error?: string };
      if (!response.ok || !body.connected) throw new Error(body.error ?? "تعذر ربط متجر سلة.");
      window.location.assign(body.runId ? `/setup/sync?runId=${encodeURIComponent(body.runId)}` : "/dashboard");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "تعذر ربط متجر سلة.");
      setLoading(false);
    }
  };

  return <div><Button className="h-12 w-full" disabled={loading} onClick={bind}>{loading ? <Loader2 className="animate-spin" /> : <ShieldCheck />}تحقق واربط المتجر<ArrowLeft /></Button>{error ? <p className="mt-3 text-sm text-destructive" role="alert">{error}</p> : null}</div>;
}
