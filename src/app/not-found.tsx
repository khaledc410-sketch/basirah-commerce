import Link from "next/link";
import { ArrowRight, SearchX } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return <main className="flex min-h-dvh items-center justify-center p-6"><div className="max-w-md text-center"><span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground"><SearchX /></span><h1 className="mt-5 text-2xl font-semibold">الصفحة غير موجودة</h1><p className="mt-2 text-muted-foreground">ربما تغير الرابط أو لا تملك الصفحة سجلًا مطابقًا في وضع العرض.</p><Button asChild className="mt-6"><Link href="/dashboard"><ArrowRight />العودة للرئيسية</Link></Button></div></main>;
}
