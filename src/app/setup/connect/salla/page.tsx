import { ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import { cookies } from "next/headers";

import { SallaBindForm } from "@/components/setup/salla-bind-form";
import { SetupPageShell } from "@/components/setup/setup-page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isValidSallaBindingClaim } from "@/core/commerce/salla-binding";
import { sallaBindingCookieName } from "@/core/commerce/salla-embedded";
import { requireStoreRole } from "@/core/data/tenant";

export const metadata: Metadata = { title: "تأكيد متجر سلة" };

export default async function SallaBindingPage() {
  await requireStoreRole(["owner", "admin"]);
  const claim = (await cookies()).get(sallaBindingCookieName)?.value;
  const hasBindingClaim = isValidSallaBindingClaim(claim);
  return <SetupPageShell currentStep={2} label="نطابق هوية التاجر من سلة مع مساحة متجرك قبل حفظ أي بيانات."><Card className="mx-auto max-w-xl"><CardHeader><span className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary"><ShieldCheck className="size-6" /></span><CardTitle className="mt-4">تأكيد ربط متجر سلة</CardTitle></CardHeader><CardContent>{hasBindingClaim ? <SallaBindForm /> : <p className="rounded-xl bg-warning-soft p-4 text-sm text-warning">لم يصل طلب ربط صالح. افتح بصيرة من لوحة متجر سلة ثم أعد المحاولة.</p>}</CardContent></Card></SetupPageShell>;
}
