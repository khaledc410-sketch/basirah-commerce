"use client";

import { CircleAlert, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="flex min-h-dvh items-center justify-center p-6"><div className="max-w-md text-center"><span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive"><CircleAlert /></span><h1 className="mt-5 text-2xl font-semibold">تعذر تحميل هذه الصفحة</h1><p className="mt-2 text-muted-foreground">لم تتغير أي بيانات. أعد المحاولة، وإذا استمر الخطأ راجع إعدادات البيئة والخدمات.</p><Button className="mt-6" onClick={reset}><RotateCcw />إعادة المحاولة</Button></div></main>;
}
