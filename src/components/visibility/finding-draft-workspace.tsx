"use client";

import { CheckCircle2, Clipboard, FileCode2, FileText, Loader2, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DraftArtifact {
  appliedSkills: string[];
  brief: {
    objective: string;
    factualBoundary: string;
    strategy: {
      contentType: string;
      buyerStage: string;
      relatedQuestions: string[];
    };
  };
  draft: {
    title: string;
    metaTitle: string;
    metaDescription: string;
    directAnswer: string;
    sections: Array<{
      heading: string;
      paragraphs: Array<{ text: string; evidenceIds: string[] }>;
    }>;
    faq: Array<{ question: string; answer: string; evidenceIds: string[] }>;
    structuredData: { status: string; reason: string };
  };
  claimCheck: {
    status: string;
    unsupportedClaims: number;
    allFactualParagraphsHaveEvidence: boolean;
  };
  limitations: string[];
}

interface FindingDraftResponse {
  draft?: {
    id: string;
    status: "draft";
    version: number;
    created: boolean;
    artifact: DraftArtifact;
    exports: { markdown: string; html: string };
    publication: { enabled: false; reason: string };
  };
  error?: { message?: string };
}

export function FindingDraftWorkspace({
  storeId,
  findingId,
}: {
  storeId: string;
  findingId: string;
}) {
  const [result, setResult] = useState<FindingDraftResponse["draft"]>();
  const [error, setError] = useState<string>();
  const [copied, setCopied] = useState<"markdown" | "html">();

  useEffect(() => {
    const controller = new AbortController();

    async function loadDraft() {
      const response = await fetch(
        `/api/v1/stores/${encodeURIComponent(storeId)}/findings/${encodeURIComponent(findingId)}/drafts`,
        { method: "POST", signal: controller.signal },
      );
      const body = (await response.json().catch(() => ({}))) as FindingDraftResponse;
      if (!response.ok || !body.draft) {
        throw new Error(body.error?.message ?? "تعذر إنشاء المسودة من النتيجة.");
      }
      setResult(body.draft);
    }

    void loadDraft().catch((caught: unknown) => {
      if (controller.signal.aborted) return;
      setError(caught instanceof Error ? caught.message : "تعذر إنشاء المسودة من النتيجة.");
    });
    return () => controller.abort();
  }, [findingId, storeId]);

  async function copyExport(format: "markdown" | "html") {
    if (!result) return;
    await navigator.clipboard.writeText(result.exports[format]);
    setCopied(format);
    void fetch("/api/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        type: "content_exported",
        source: "content_writer",
        draftId: result.id,
        exportFormat: format,
        revision: result.version,
      }),
      keepalive: true,
    });
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-destructive" role="alert">
          {error}
        </CardContent>
      </Card>
    );
  }
  if (!result) {
    return (
      <Card>
        <CardContent className="flex min-h-48 items-center justify-center gap-3 p-6 text-muted-foreground" role="status">
          <Loader2 className="size-5 animate-spin text-primary" aria-hidden="true" />
          نبني موجزًا ومسودة من دليل النتيجة فقط…
        </CardContent>
      </Card>
    );
  }

  const { artifact } = result;
  return (
    <div className="space-y-5">
      <Card className="border-primary/20 bg-primary/[0.025]">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Badge className="bg-success-soft text-success hover:bg-success-soft">
              <ShieldCheck /> فحص الادعاءات ناجح
            </Badge>
            <span className="text-xs text-muted-foreground">الإصدار {result.version}</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2" aria-label="قدرات الإنشاء المطبقة">
            {artifact.appliedSkills.map((skill) => (
              <Badge key={skill} variant="outline">{skill}</Badge>
            ))}
          </div>
          <CardTitle className="mt-3 text-2xl">{artifact.draft.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl border bg-background p-4">
            <p className="text-xs font-semibold text-muted-foreground">الإجابة المباشرة</p>
            <p className="mt-2 leading-8">{artifact.draft.directAnswer}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-muted/60 p-4">
              <p className="text-xs text-muted-foreground">Meta title</p>
              <p className="mt-1 text-sm font-medium">{artifact.draft.metaTitle}</p>
            </div>
            <div className="rounded-xl bg-muted/60 p-4">
              <p className="text-xs text-muted-foreground">Meta description</p>
              <p className="mt-1 text-sm">{artifact.draft.metaDescription}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>استراتيجية التحسين</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-7 text-muted-foreground">{artifact.brief.factualBoundary}</p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">محتوى قابل للبحث</Badge>
            <Badge variant="secondary">مرحلة التنفيذ</Badge>
            <Badge variant="secondary">تحسين صفحة قائمة</Badge>
          </div>
          <div>
            <p className="text-sm font-semibold">أسئلة مرتبطة مشتقة من النتيجة</p>
            <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
              {artifact.brief.strategy.relatedQuestions.map((question) => (
                <li key={question}>• {question}</li>
              ))}
            </ul>
          </div>
          <p className="text-xs text-muted-foreground">
            هذه فرضيات تحريرية مبنية على النتيجة وليست بيانات حجم بحث أو ظهور مرصود.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>المسودة المرتبطة بالدليل</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          {artifact.draft.sections.map((section) => (
            <section key={section.heading}>
              <h3 className="font-semibold">{section.heading}</h3>
              {section.paragraphs.map((paragraph) => (
                <div className="mt-3 rounded-xl border p-4" key={paragraph.text}>
                  <p className="leading-7">{paragraph.text}</p>
                  <p className="mt-3 text-xs text-muted-foreground">
                    الأدلة: {paragraph.evidenceIds.join(" · ")}
                  </p>
                </div>
              ))}
            </section>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>المراجعة والتصدير</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3 rounded-xl bg-success-soft p-4 text-sm text-success">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
            <p>
              جميع الفقرات الواقعية مرتبطة بدليل، وعدد الادعاءات غير المدعومة: {artifact.claimCheck.unsupportedClaims}.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button className="min-h-11" onClick={() => void copyExport("markdown")} variant="outline">
              {copied === "markdown" ? <CheckCircle2 /> : <FileText />}
              {copied === "markdown" ? "تم نسخ Markdown" : "نسخ Markdown"}
            </Button>
            <Button className="min-h-11" onClick={() => void copyExport("html")} variant="outline">
              {copied === "html" ? <CheckCircle2 /> : <FileCode2 />}
              {copied === "html" ? "تم نسخ HTML" : "نسخ HTML"}
            </Button>
          </div>
          <p className="flex gap-2 text-xs text-muted-foreground">
            <Clipboard className="size-4 shrink-0" aria-hidden="true" />
            {result.publication.reason}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
