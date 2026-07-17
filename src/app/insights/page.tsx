import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, CalendarDays, CircleAlert, Clock3, FileText } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { sensitiveSkinArticle } from "@/components/visibility/demo-article";

export const metadata: Metadata = {
  title: "معاينات أدلة مَدى للعناية",
  description: "مسودات محتوى مَدى للعناية المتاحة لمراجعة العميل قبل النشر.",
  alternates: { canonical: null },
  robots: { index: false, follow: false },
};

export default function InsightsPreviewIndexPage() {
  return (
    <div className="min-h-dvh bg-[#fbfaf7] text-[#23211f]">
      <div className="border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-center text-xs font-medium text-amber-950 sm:text-sm">
        <span className="inline-flex flex-wrap items-center justify-center gap-2">
          <CircleAlert className="size-4 shrink-0" />
          مكتبة معاينات للعميل · غير مفهرسة · لا تمثل محتوى منشورًا
        </span>
      </div>

      <header className="border-b border-[#dedbd3] bg-[#fbfaf7]">
        <div className="mx-auto flex min-h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
          <span className="flex size-9 items-center justify-center rounded-full bg-[#173f38] text-sm font-bold text-white">م</span>
          <div>
            <p className="font-bold">مَدى للعناية</p>
            <p className="text-[10px] text-[#6e6a64]">معاينات أدلة العناية</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16" id="main-content">
        <div className="max-w-2xl">
          <Badge className="border-[#cddbd6] bg-[#edf4f1] text-[#173f38]" variant="outline">رابط مراجعة</Badge>
          <h1 className="mt-4 text-3xl font-bold leading-tight sm:text-4xl">أدلة تحتاج اعتمادك قبل النشر</h1>
          <p className="mt-4 leading-8 text-[#625f5a]">
            افتح المسودة وراجع الادعاءات والمصادر والصورة والروابط. لا تبدأ الفهرسة أو قياس الظهور إلا بعد التصدير إلى نطاق المتجر واعتماد الرابط الأساسي النهائي.
          </p>
        </div>

        <article className="mt-10 grid overflow-hidden rounded-[1.75rem] border border-[#dedbd3] bg-white shadow-[0_18px_60px_-42px_rgba(23,63,56,0.5)] md:grid-cols-[.9fr_1.1fr]">
          <div className="relative min-h-64 bg-[#e9e7e1] md:min-h-[360px]">
            <Image
              alt={sensitiveSkinArticle.heroAlt}
              className="object-cover"
              fill
              preload
              sizes="(max-width: 768px) 100vw, 45vw"
              src={sensitiveSkinArticle.heroImage}
            />
          </div>
          <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-10">
            <div className="flex flex-wrap gap-2">
              <Badge className="border-amber-200 bg-amber-50 text-amber-950" variant="outline">مسودة للمراجعة</Badge>
              <Badge variant="outline">SEO · وضوح · ثقة</Badge>
            </div>
            <h2 className="mt-5 text-2xl font-bold leading-snug">{sensitiveSkinArticle.title}</h2>
            <p className="mt-3 text-sm leading-7 text-[#625f5a]">{sensitiveSkinArticle.metaDescription}</p>
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-[#817d76]">
              <span className="inline-flex items-center gap-1.5"><FileText className="size-4" />{sensitiveSkinArticle.author}</span>
              <span className="inline-flex items-center gap-1.5"><CalendarDays className="size-4" />11 يوليو 2026</span>
              <span className="inline-flex items-center gap-1.5"><Clock3 className="size-4" />{sensitiveSkinArticle.readingTime}</span>
            </div>
            <Button asChild className="mt-7 min-h-11 w-fit bg-[#173f38] text-white hover:bg-[#21584e]">
              <Link href={sensitiveSkinArticle.previewPath}>فتح معاينة المقال<ArrowLeft /></Link>
            </Button>
          </div>
        </article>
      </main>
    </div>
  );
}
