"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Store } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const schema = z.object({
  workspaceName: z.string().trim().min(2, "اكتب اسمًا واضحًا للمساحة.").max(80),
  teamSize: z.string().min(1),
});

type WorkspaceValues = z.infer<typeof schema>;

export function WorkspaceForm({
  continueTo = "/setup/connect",
}: {
  continueTo?: "/setup/connect" | "/setup/connect/salla";
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string>();
  const form = useForm<WorkspaceValues>({
    resolver: zodResolver(schema),
    defaultValues: { workspaceName: "مَدى للعناية", teamSize: "1-3" },
  });

  async function onSubmit(values: WorkspaceValues) {
    setServerError(undefined);
    try {
      const response = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(values),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        setServerError(result.error ?? "تعذر إنشاء مساحة المتجر.");
        return;
      }
      router.push(continueTo);
      router.refresh();
    } catch {
      setServerError("تعذر الاتصال بالخادم. تحقق من الشبكة وأعد المحاولة.");
    }
  }

  return (
    <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <div className="space-y-2">
        <Label htmlFor="workspaceName">اسم المتجر أو الفريق</Label>
        <div className="relative">
          <Store aria-hidden="true" className="pointer-events-none absolute start-3 top-3.5 size-5 text-muted-foreground" />
          <Input className="h-12 ps-11" id="workspaceName" {...form.register("workspaceName")} />
        </div>
        {form.formState.errors.workspaceName && (
          <p className="text-sm text-destructive" role="alert">{form.formState.errors.workspaceName.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="teamSize">حجم الفريق الآن</Label>
        <Select
          defaultValue={form.getValues("teamSize")}
          onValueChange={(value) => form.setValue("teamSize", value, { shouldValidate: true })}
        >
          <SelectTrigger className="h-12 w-full" id="teamSize"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="1-3">1–3 أشخاص</SelectItem>
            <SelectItem value="4-10">4–10 أشخاص</SelectItem>
            <SelectItem value="11+">أكثر من 10</SelectItem>
            <SelectItem value="agency">وكالة أو عدة متاجر</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {serverError && <p className="text-sm text-destructive" role="alert">{serverError}</p>}
      <Button className="h-12 w-full" disabled={form.formState.isSubmitting} type="submit"><ArrowLeft />{form.formState.isSubmitting ? "جارٍ الإنشاء…" : "إنشاء المساحة"}</Button>
    </form>
  );
}
