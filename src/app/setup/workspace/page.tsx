import type { Metadata } from "next";
import { cookies } from "next/headers";

import { requireIdentity } from "@/core/auth/session";
import { SetupPageShell } from "@/components/setup/setup-page-shell";
import { WorkspaceForm } from "@/components/setup/workspace-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isValidSallaBindingClaim } from "@/core/commerce/salla-binding";
import { sallaBindingCookieName } from "@/core/commerce/salla-embedded";

export const metadata: Metadata = { title: "إنشاء مساحة المتجر" };

export default async function WorkspacePage() {
  await requireIdentity();
  const claim = (await cookies()).get(sallaBindingCookieName)?.value;
  const continueTo = isValidSallaBindingClaim(claim) ? "/setup/connect/salla" : undefined;
  return (
    <SetupPageShell currentStep={1} label="أنشئ مساحة منفصلة وآمنة لفريقك ومتجرك.">
      <div className="mx-auto grid max-w-4xl gap-6 lg:grid-cols-[1fr_300px]">
        <Card><CardHeader><CardTitle className="text-2xl">ما اسم مساحة العمل؟</CardTitle><p className="text-muted-foreground">يمكنك إضافة أعضاء ومتاجر أخرى لاحقًا. كل متجر يبقى معزول البيانات.</p></CardHeader><CardContent><WorkspaceForm continueTo={continueTo} /></CardContent></Card>
        <Card className="h-fit bg-muted/50"><CardContent className="space-y-5 p-6"><p className="font-semibold">ما الذي سننشئه؟</p><div className="space-y-4 text-sm text-muted-foreground"><p><span className="font-semibold text-foreground">منظمة</span><br />حد الفوترة والفرق متعددة المتاجر.</p><p><span className="font-semibold text-foreground">مساحة متجر</span><br />حد بيانات المنتجات والمحادثات والتحليلات.</p><p><span className="font-semibold text-foreground">عضوية مالك</span><br />يمكنك دعوة مسؤول أو محلل أو دعم أو مشاهد.</p></div></CardContent></Card>
      </div>
    </SetupPageShell>
  );
}
