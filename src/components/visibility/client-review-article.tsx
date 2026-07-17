import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpLeft,
  BookOpen,
  Bot,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  CircleAlert,
  Clock3,
  ExternalLink,
  FileText,
  MessageCircleMore,
  ShieldCheck,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { sensitiveSkinArticle } from "@/components/visibility/demo-article";

export function ClientReviewArticle() {
  return (
    <div className="min-h-screen bg-[#fbfaf7] text-[#23211f]">
      <div className="border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-center text-xs font-medium text-amber-950 sm:text-sm">
        <span className="inline-flex flex-wrap items-center justify-center gap-2">
          <CircleAlert className="size-4 shrink-0" />
          معاينة للعميل · غير مفهرسة · مسودة تحتاج اعتماد التاجر قبل النشر
        </span>
      </div>

      <header className="border-b border-[#dedbd3] bg-[#fbfaf7]/95">
        <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link className="group inline-flex items-center gap-3" href="/insights">
            <span className="flex size-9 items-center justify-center rounded-full bg-[#173f38] text-sm font-bold text-white">
              م
            </span>
            <span>
              <span className="block text-base font-bold tracking-tight">
                {sensitiveSkinArticle.brand.name}
              </span>
              <span className="block text-[10px] text-[#6e6a64]">
                عناية أوضح، واختيار أهدأ
              </span>
            </span>
          </Link>
          <Button asChild className="min-h-11 bg-[#173f38] text-white hover:bg-[#21584e]">
            <Link href="/dashboard/widget">
              <MessageCircleMore />
              اسألي مستشار مَدى
            </Link>
          </Button>
        </div>
      </header>

      <main id="main-content">
        <article>
          <div className="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-6 sm:pt-10">
            <nav aria-label="مسار الصفحة" className="mb-8">
              <ol className="flex flex-wrap items-center gap-1.5 text-xs text-[#6e6a64]">
                <li>
                  <Link className="hover:text-[#173f38] hover:underline" href="/insights">
                    أدلة العناية
                  </Link>
                </li>
                <li aria-hidden="true">
                  <ChevronLeft className="size-3.5" />
                </li>
                <li aria-current="page" className="font-medium text-[#23211f]">
                  البشرة الحساسة
                </li>
              </ol>
            </nav>

            <header className="mx-auto max-w-4xl text-center">
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Badge className="border-[#cddbd6] bg-[#edf4f1] text-[#173f38]" variant="outline">
                  دليل مبسّط
                </Badge>
                <Badge className="border-[#ddd7cc] bg-transparent text-[#6e6a64]" variant="outline">
                  مسودة تجريبية
                </Badge>
              </div>
              <h1 className="mt-5 text-3xl font-bold leading-[1.35] tracking-tight sm:text-4xl lg:text-5xl">
                {sensitiveSkinArticle.title}
              </h1>
              <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-[#625f5a] sm:text-lg">
                خطوات قليلة ومعلومات واضحة تساعدك على قراءة خيارات العناية بهدوء،
                مع إظهار ما نعرفه وما يحتاج سؤالًا إضافيًا.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-[#6e6a64] sm:text-sm">
                <span className="inline-flex items-center gap-1.5">
                  <FileText className="size-4" />
                  {sensitiveSkinArticle.author}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="size-4" />
                  <time dateTime={sensitiveSkinArticle.updatedAt}>11 يوليو 2026</time>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock3 className="size-4" />
                  {sensitiveSkinArticle.readingTime}
                </span>
              </div>
              <p className="mt-3 text-xs text-[#817d76]">
                {sensitiveSkinArticle.authorNote}
              </p>
            </header>

            <figure className="mt-10">
              <div className="relative aspect-[16/9] overflow-hidden rounded-[1.75rem] bg-[#e9e7e1] shadow-[0_16px_55px_-32px_rgba(23,63,56,0.45)]">
                <Image
                  alt={sensitiveSkinArticle.heroAlt}
                  className="object-cover"
                  fill
                  preload
                  sizes="(max-width: 1200px) 100vw, 1152px"
                  src={sensitiveSkinArticle.heroImage}
                />
              </div>
              <figcaption className="mt-3 text-center text-xs text-[#817d76]">
                {sensitiveSkinArticle.heroProvenance}
              </figcaption>
            </figure>

            <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
              <div className="min-w-0 space-y-12">
                <section aria-labelledby="quick-answer-heading" className="rounded-2xl border border-[#bfd2cb] bg-[#edf4f1] p-6 sm:p-8">
                  <div className="flex items-center gap-2 text-[#173f38]">
                    <Bot className="size-5" />
                    <h2 className="text-lg font-bold" id="quick-answer-heading">
                      الإجابة المختصرة
                    </h2>
                  </div>
                  <p className="mt-4 text-base leading-8 sm:text-lg">
                    {sensitiveSkinArticle.directAnswer}
                  </p>
                </section>

                <section aria-labelledby="why-simple-heading" id="why-simple">
                  <p className="text-xs font-bold tracking-wide text-[#287261]">قبل أن تبدئي</p>
                  <h2 className="mt-2 text-2xl font-bold" id="why-simple-heading">
                    لماذا يبدأ الروتين الجيد بالوضوح؟
                  </h2>
                  <div className="mt-5 space-y-4 text-[1.02rem] leading-8 text-[#4f4c48]">
                    {sensitiveSkinArticle.introduction.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>
                </section>

                <section aria-labelledby="steps-heading" id="routine-steps">
                  <p className="text-xs font-bold tracking-wide text-[#287261]">روتين من ثلاث مراحل</p>
                  <h2 className="mt-2 text-2xl font-bold" id="steps-heading">
                    كيف تبنين روتينًا بسيطًا للبشرة الحساسة؟
                  </h2>
                  <ol className="mt-6 space-y-4">
                    {sensitiveSkinArticle.steps.map((step) => (
                      <li className="grid gap-4 rounded-2xl border border-[#dedbd3] bg-white p-5 sm:grid-cols-[64px_1fr] sm:p-6" key={step.number}>
                        <span className="metric-numbers flex size-12 items-center justify-center rounded-full bg-[#173f38] text-sm font-bold text-white">
                          {step.number}
                        </span>
                        <div>
                          <h3 className="text-lg font-bold">{step.title}</h3>
                          <p className="mt-2 leading-8 text-[#5f5b56]">{step.body}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </section>

                <section aria-labelledby="products-heading" id="products">
                  <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold tracking-wide text-[#287261]">من بيانات مَدى</p>
                      <h2 className="mt-2 text-2xl font-bold" id="products-heading">
                        خياران لروتين بسيط
                      </h2>
                    </div>
                    <span className="text-xs text-[#817d76]">روابط منتجات العرض التجريبي</span>
                  </div>
                  <div className="mt-6 grid gap-5 sm:grid-cols-2">
                    {sensitiveSkinArticle.products.map((product) => (
                      <article className="overflow-hidden rounded-2xl border border-[#dedbd3] bg-white" key={product.id}>
                        <div className="relative aspect-[4/3] bg-[#efede7]">
                          <Image
                            alt={product.alt}
                            className="object-cover"
                            fill
                            sizes="(max-width: 640px) 100vw, 360px"
                            src={product.image}
                          />
                        </div>
                        <div className="p-5">
                          <div className="flex items-start justify-between gap-3">
                            <h3 className="font-bold">{product.name}</h3>
                            <span className="shrink-0 text-sm font-bold text-[#173f38]">{product.price}</span>
                          </div>
                          <p className="mt-3 text-sm leading-7 text-[#5f5b56]">
                            {product.description}
                          </p>
                          <p className="mt-3 flex gap-2 text-xs leading-6 text-[#817d76]">
                            <ShieldCheck className="mt-1 size-3.5 shrink-0 text-[#287261]" />
                            {product.evidence}
                          </p>
                          <Button asChild className="mt-5 min-h-11 w-full border-[#b9c9c4] text-[#173f38] hover:bg-[#edf4f1]" variant="outline">
                            <Link href={product.href}>
                              عرض معلومات المنتج
                              <ArrowUpLeft />
                            </Link>
                          </Button>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>

                <section aria-labelledby="checklist-heading" id="selection-checklist">
                  <div className="rounded-2xl bg-[#242e2b] p-6 text-white sm:p-8">
                    <BookOpen className="size-6 text-[#9fd0c1]" />
                    <h2 className="mt-4 text-2xl font-bold" id="checklist-heading">
                      أربع أسئلة قبل اختيار أي منتج
                    </h2>
                    <ul className="mt-6 grid gap-4 sm:grid-cols-2">
                      {sensitiveSkinArticle.selectionChecks.map((check) => (
                        <li className="flex gap-3 text-sm leading-7 text-[#eef6f3]" key={check}>
                          <CheckCircle2 className="mt-1 size-4 shrink-0 text-[#9fd0c1]" />
                          {check}
                        </li>
                      ))}
                    </ul>
                  </div>
                </section>

                <section aria-labelledby="faq-heading" id="faq">
                  <p className="text-xs font-bold tracking-wide text-[#287261]">أسئلة شائعة</p>
                  <h2 className="mt-2 text-2xl font-bold" id="faq-heading">
                    إجابات سريعة قبل الشراء
                  </h2>
                  <div className="mt-5 divide-y divide-[#dedbd3] border-y border-[#dedbd3]">
                    {sensitiveSkinArticle.faqs.map((faq, index) => (
                      <details className="group py-5" key={faq.question} open={index === 0}>
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold marker:hidden">
                          {faq.question}
                          <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-[#c9c5bc] text-[#173f38] transition-transform group-open:rotate-90">
                            <ChevronLeft className="size-4" />
                          </span>
                        </summary>
                        <p className="max-w-2xl pt-3 text-sm leading-7 text-[#5f5b56]">
                          {faq.answer}
                        </p>
                      </details>
                    ))}
                  </div>
                  <p className="mt-3 text-xs leading-6 text-[#817d76]">
                    هذه الأسئلة لخدمة القارئ وقابلية فهم المحتوى. لا تعني أهلية
                    الصفحة لنتيجة FAQ منسقة في Google.
                  </p>
                </section>

                <section aria-labelledby="sources-heading" id="sources">
                  <div className="rounded-2xl border border-[#dedbd3] bg-white p-6 sm:p-8">
                    <h2 className="text-xl font-bold" id="sources-heading">
                      المصادر وحدود المعلومات
                    </h2>
                    <p className="mt-2 text-sm leading-7 text-[#6e6a64]">
                      نوضح مصدر كل ادعاء منتج حتى يستطيع القارئ والتاجر مراجعته.
                    </p>
                    <ol className="mt-5 space-y-4">
                      {sensitiveSkinArticle.sources.map((source, index) => (
                        <li className="grid gap-2 sm:grid-cols-[28px_1fr]" key={source.name}>
                          <span className="metric-numbers flex size-6 items-center justify-center rounded-full bg-[#edf4f1] text-xs font-bold text-[#173f38]">
                            {index + 1}
                          </span>
                          <div>
                            <p className="text-sm font-bold">{source.name}</p>
                            <p className="mt-1 text-xs leading-6 text-[#817d76]">{source.detail}</p>
                          </div>
                        </li>
                      ))}
                    </ol>
                    <div className="mt-6 border-t border-[#dedbd3] pt-5">
                      <h3 className="text-sm font-bold">حدود هذه المسودة</h3>
                      <ul className="mt-3 space-y-2">
                        {sensitiveSkinArticle.limitations.map((limitation) => (
                          <li className="flex gap-2 text-xs leading-6 text-[#6e6a64]" key={limitation}>
                            <CircleAlert className="mt-1 size-3.5 shrink-0 text-amber-700" />
                            {limitation}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </section>

                <section aria-labelledby="advisor-heading">
                  <div className="relative overflow-hidden rounded-[1.75rem] bg-[#e4ede9] p-6 sm:p-9">
                    <div className="relative z-10 max-w-xl">
                      <Badge className="border-[#a9c7bd] bg-white/70 text-[#173f38]" variant="outline">
                        مستشار مَدى التجريبي
                      </Badge>
                      <h2 className="mt-4 text-2xl font-bold" id="advisor-heading">
                        هل تريدين مساعدة في تضييق الخيارات؟
                      </h2>
                      <p className="mt-3 leading-8 text-[#4f5d58]">
                        أخبري المستشار بنوع بشرتك وميزانيتك وما الذي تفضلينه، وسيشرح
                        سبب كل اقتراح اعتمادًا على بيانات المنتجات المتاحة.
                      </p>
                      <Button asChild className="mt-6 min-h-11 bg-[#173f38] text-white hover:bg-[#21584e]">
                        <Link href="/dashboard/widget">
                          ابدئي سؤالًا
                          <ArrowLeft />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </section>
              </div>

              <aside className="space-y-4 lg:sticky lg:top-6">
                <nav aria-label="محتويات المقال" className="rounded-2xl border border-[#dedbd3] bg-white p-5">
                  <p className="text-sm font-bold">في هذا الدليل</p>
                  <ol className="mt-4 space-y-3 text-sm text-[#625f5a]">
                    {[
                      ["#why-simple", "لماذا الوضوح؟"],
                      ["#routine-steps", "خطوات الروتين"],
                      ["#products", "المنتجات المقترحة"],
                      ["#selection-checklist", "قائمة الاختيار"],
                      ["#faq", "الأسئلة الشائعة"],
                      ["#sources", "المصادر والحدود"],
                    ].map(([href, label]) => (
                      <li key={href}>
                        <a className="inline-flex items-center gap-2 hover:text-[#173f38] hover:underline" href={href}>
                          <span className="size-1.5 rounded-full bg-[#8fb4a8]" />
                          {label}
                        </a>
                      </li>
                    ))}
                  </ol>
                </nav>
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-xs leading-6 text-amber-950">
                  <p className="font-bold">مهم قبل النشر</p>
                  <p className="mt-2">
                    هذا الرابط للمراجعة فقط. بناء الظهور يتطلب نشر النسخة المعتمدة
                    على نطاق التاجر، وتحديد canonical نهائي، وإتاحة الفهرسة، ثم قياس
                    النتائج من دون وعود مسبقة.
                  </p>
                </div>
              </aside>
            </div>
          </div>
        </article>
      </main>

      <footer className="border-t border-[#dedbd3] bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-xs text-[#6e6a64] sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>© 2026 مَدى للعناية · تجربة محتوى غير منشورة</p>
          <Link className="inline-flex min-h-11 items-center gap-1 font-medium text-[#173f38] hover:underline" href="/dashboard/visibility/content">
            العودة إلى استوديو المحتوى
            <ExternalLink className="size-3" />
          </Link>
        </div>
      </footer>
    </div>
  );
}
