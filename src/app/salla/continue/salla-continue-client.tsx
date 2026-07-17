"use client";

import { AlertTriangle, Loader2, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { BrandMark } from "@/components/brand-mark";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isValidSallaBindingClaim } from "@/core/commerce/salla-binding";

export function SallaContinueClient() {
  const [error, setError] = useState<string>();
  const claimRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const controller = new AbortController();

    async function continueSallaConnection() {
      if (claimRef.current === undefined) {
        const fragment = new URLSearchParams(window.location.hash.slice(1));
        claimRef.current = fragment.get("claim");
        window.history.replaceState(
          null,
          "",
          `${window.location.pathname}${window.location.search}`,
        );
      }
      const claim = claimRef.current;

      if (!isValidSallaBindingClaim(claim)) {
        throw new Error("طلب الربط غير صالح أو انتهت صلاحيته. افتح بصيرة مجددًا من متجر سلة.");
      }

      const response = await fetch("/api/connect/salla/continue", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ claim }),
        signal: controller.signal,
      });

      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) throw new Error(body?.error);
      if (window.location.pathname === "/salla/continue") {
        window.location.replace("/setup/connect/salla");
      }
    }

    void continueSallaConnection().catch((caught: unknown) => {
      if (controller.signal.aborted) return;
      setError(
        caught instanceof Error && caught.message
          ? caught.message
          : "تعذر بدء الربط. افتح بصيرة مجددًا من متجر سلة.",
      );
    });

    return () => controller.abort();
  }, []);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-muted/30 px-5 py-12" id="main-content">
      <div className="w-full max-w-md">
        <Link className="mb-8 inline-flex text-primary" href="/" aria-label="بصيرة">
          <BrandMark />
        </Link>
        <Card>
          <CardHeader>
            <span className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              {error ? <AlertTriangle className="size-6" /> : <ShieldCheck className="size-6" />}
            </span>
            <CardTitle className="mt-4">متابعة ربط متجر سلة</CardTitle>
          </CardHeader>
          <CardContent>
            {error ? (
              <p className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : (
              <p className="flex items-center gap-3 text-sm text-muted-foreground" role="status">
                <Loader2 className="size-5 animate-spin text-primary" aria-hidden="true" />
                نتحقق من طلب سلة وننقلك بأمان إلى مساحة متجرك…
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
