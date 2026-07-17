import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return <div aria-label="جارٍ تحميل الصفحة" className="mx-auto w-full max-w-7xl space-y-6 px-4 py-10" role="status"><Skeleton className="h-10 w-64" /><Skeleton className="h-24 w-full" /><div className="grid gap-4 md:grid-cols-3"><Skeleton className="h-48" /><Skeleton className="h-48" /><Skeleton className="h-48" /></div><span className="sr-only">جارٍ التحميل…</span></div>;
}
