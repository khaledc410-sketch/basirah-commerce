import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Check, LockKeyhole, ShoppingBag, Store } from "lucide-react";

import { SetupPageShell } from "@/components/setup/setup-page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getServerEnv, isDemoMode } from "@/config/env";
import { requireStoreContext } from "@/core/data/tenant";

export const metadata: Metadata = { title: "ربط المتجر" };

export default async function ConnectPage({ searchParams }: PageProps<"/setup/connect">) {
  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : undefined;
  const demo = isDemoMode();
  if (!demo) await requireStoreContext();
  const sallaMode = getServerEnv().SALLA_AUTH_MODE;
  return (
    <SetupPageShell currentStep={2} label="اختر منصة المتجر. مسارا سلة وزد متاحان للاختبار، ويظلان منفصلين عن الربط الإنتاجي حتى اجتياز اختبارات المنصة.">
      <div className="mx-auto max-w-4xl">
        {error && <div className="mb-5 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive" role="alert">تعذر إكمال الاتصال: {error === "invalid_oauth_state" ? "حالة التفويض غير صالحة أو انتهت. ابدأ المحاولة من جديد." : error === "zid_not_available" ? "ربط زد غير متاح في هذا الإصدار الإنتاجي." : error === "salla_configuration" ? "إعدادات تطبيق سلة غير مكتملة." : "فشل التحقق من اتصال سلة. راجع الإعدادات والصلاحيات ثم أعد المحاولة."}</div>}
        <div className="grid gap-5 md:grid-cols-2">
          <Card className="relative overflow-hidden border-primary/35 shadow-sm"><div className="absolute inset-x-0 top-0 h-1 bg-primary" /><CardHeader><div className="flex items-center justify-between"><span className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary"><ShoppingBag className="size-6" /></span><Badge>{demo ? "محاكاة" : sallaMode === "easy" ? "Easy Mode" : "OAuth خاص"}</Badge></div><CardTitle className="mt-4 text-2xl">متجر سلة</CardTitle><p className="text-sm text-muted-foreground">{demo ? "يشغّل العرض مسارًا محاكى بلا بيانات متجر حقيقية." : sallaMode === "easy" ? "يفتح تثبيت تطبيق سلة، ثم يحفظ التفويض الموقّع ويطابق هوية التاجر قبل المزامنة." : "يفتح OAuth الخاص، ويتحقق من الحالة وهوية المتجر ثم يبدأ المزامنة."}</p></CardHeader><CardContent className="space-y-5"><ul className="space-y-3 text-sm">{["لا نطلب كلمة مرور سلة", "رموز الاتصال مشفرة ولا تصل للمتصفح", "هوية التاجر تُفحص قبل كتابة الكتالوج"].map((item) => <li className="flex gap-2" key={item}><Check className="mt-0.5 size-4 text-success" />{item}</li>)}</ul><form action="/api/connect/salla/start" method="post"><Button className="h-12 w-full" type="submit"><ArrowLeft />{demo ? "تجربة مسار سلة" : "ربط متجر سلة"}</Button></form></CardContent></Card>
          <Card className="relative overflow-hidden border-muted shadow-sm"><CardHeader><div className="flex items-center justify-between"><span className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground"><Store className="size-6" /></span><Badge variant="secondary">{demo ? "محاكاة" : "قريبًا"}</Badge></div><CardTitle className="mt-4 text-2xl">متجر زد</CardTitle><p className="text-sm text-muted-foreground">ربط زد الحي معطّل حتى يكتمل تحقق العقود والرموز المزدوجة في متجر تطوير.</p></CardHeader><CardContent><Button asChild={demo} className="h-12 w-full" disabled={!demo} variant="outline">{demo ? <Link href="/api/connect/zid/start"><ArrowLeft />تجربة المحاكاة</Link> : <span>غير متاح للإنتاج</span>}</Button></CardContent></Card>
        </div>
        <div className="mt-6 flex items-start gap-3 rounded-xl border bg-card p-5 text-sm text-muted-foreground"><LockKeyhole className="mt-0.5 size-5 shrink-0 text-primary" /><p><span className="font-semibold text-foreground">ماذا سيحدث؟</span> تُفتح صفحة التفويض، ثم نتحقق من حالة OAuth، ونحفظ الرموز مشفرة في الإنتاج، ونبدأ مزامنة البيانات الأساسية.</p></div>
      </div>
    </SetupPageShell>
  );
}
