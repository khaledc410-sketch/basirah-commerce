import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";

import { BrandMark } from "@/components/brand-mark";
import { SigninForm } from "@/components/setup/signin-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { safeInternalPath } from "@/core/security/request";

export const metadata: Metadata = { title: "تسجيل الدخول" };

export default async function SigninPage({ searchParams }: PageProps<"/signin">) {
  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : undefined;
  const nextPath = safeInternalPath(typeof params.next === "string" ? params.next : undefined) ?? undefined;
  return (
    <main id="main-content" className="grid min-h-dvh lg:grid-cols-2">
      <section className="flex items-center justify-center bg-card px-5 py-10">
        <div className="w-full max-w-md">
          <Link className="mb-12 inline-flex text-primary" href="/"><BrandMark /></Link>
          <Card className="border-0 shadow-none sm:border sm:shadow-sm">
            <CardHeader className="pb-4"><p className="text-sm font-semibold text-primary">مرحبًا بك</p><CardTitle className="text-3xl">ادخل إلى بيانات متجرك</CardTitle><p className="text-muted-foreground">سنبدأ ببيئة عرض آمنة ثم نوصلك بسلة عبر OAuth عند إضافة بيانات التطبيق.</p></CardHeader>
            <CardContent>
              {error && (
                <p className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive" role="alert">
                  {error === "auth_configuration"
                    ? "إعدادات الدخول الإنتاجية غير مكتملة. أضف مفاتيح Supabase العامة إلى بيئة النشر."
                    : "تعذر التحقق من رابط الدخول أو انتهت صلاحيته. اطلب رابطًا جديدًا."}
                </p>
              )}
              <SigninForm nextPath={nextPath} />
            </CardContent>
          </Card>
          <Link className="mt-6 flex min-h-11 items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground" href="/"><ArrowRight />العودة للرئيسية</Link>
        </div>
      </section>
      <aside className="relative hidden overflow-hidden bg-primary p-12 text-primary-foreground lg:flex lg:flex-col lg:justify-between">
        <div className="subtle-grid absolute inset-0 opacity-15" />
        <div className="relative max-w-xl"><ShieldCheck className="size-10" /><h1 className="mt-8 text-4xl font-semibold leading-tight">بيانات المتجر أولًا. الذكاء الاصطناعي يشرح ولا يخمّن.</h1><p className="mt-5 text-lg opacity-80">المنتجات والأسعار والمخزون تأتي من الفهرس الموحّد، وكل إجابة للتاجر ترتبط بفترة ومصدر ودليل.</p></div>
        <ul className="relative space-y-4 text-base">
          {["اتصال OAuth دون مشاركة كلمة المرور", "عزل بيانات كل متجر", "لا نشر لأي تعديل دون موافقة"].map((item) => <li className="flex items-center gap-3" key={item}><CheckCircle2 className="size-5" />{item}</li>)}
        </ul>
      </aside>
    </main>
  );
}
