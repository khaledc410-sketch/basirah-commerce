import { Clock3, ShieldCheck } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

export function ProductionFeatureState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-3xl items-center px-6 py-16">
      <Card className="w-full">
        <CardContent className="p-8 sm:p-10">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <ShieldCheck className="size-6" />
          </span>
          <h1 className="mt-6 text-2xl font-semibold">{title}</h1>
          <p className="mt-3 text-muted-foreground">{description}</p>
          <p className="mt-6 flex items-center gap-2 border-t pt-4 text-sm text-muted-foreground">
            <Clock3 className="size-4" />
            لن نعرض أرقام العرض التجريبي على أنها بيانات متجرك.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
