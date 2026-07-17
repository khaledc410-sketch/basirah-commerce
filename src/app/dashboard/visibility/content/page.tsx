import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Button } from "@/components/ui/button";
import { ContentStudio } from "@/components/visibility/content-studio";
import { sensitiveSkinArticle } from "@/components/visibility/demo-article";
import { FindingDraftWorkspace } from "@/components/visibility/finding-draft-workspace";
import { ProductionFeatureState } from "@/components/dashboard/production-feature-state";
import { isDemoMode } from "@/config/env";
import { getCurrentStoreContext } from "@/core/data/tenant";

export const metadata: Metadata = { title: "استوديو محتوى الظهور" };

export default async function VisibilityContentPage({
  searchParams,
}: {
  searchParams: Promise<{ finding?: string }>;
}) {
  const findingId = (await searchParams).finding;
  const store = await getCurrentStoreContext();
  if (findingId && store) {
    return (
      <>
        <DashboardHeader
          actions={<Button asChild variant="outline"><Link href="/dashboard/reports/latest"><ArrowRight />العودة إلى التقرير</Link></Button>}
          description="المشكلة والدليل والموجز والمسودة وفحص الادعاءات في مسار واحد. النشر المباشر غير مفعّل."
          title="مسودة من نتيجة موثقة"
        />
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
          <FindingDraftWorkspace findingId={findingId} storeId={store.storeId} />
        </div>
      </>
    );
  }
  if (!isDemoMode()) return <ProductionFeatureState title="اختر نتيجة من تقريرك" description="يبدأ الكاتب من نتيجة موثقة في التقرير، وليس من استوديو فارغ. افتح تقريرًا واختر «إنشاء مسودة»." />;
  return (
    <>
      <DashboardHeader
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/dashboard/visibility">
                <ArrowRight />
                الظهور
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link
                href={sensitiveSkinArticle.previewPath}
                rel="noreferrer"
                target="_blank"
              >
                رابط العميل
                <ExternalLink />
              </Link>
            </Button>
          </div>
        }
        description="أنشئ محتوى مفيدًا للعميل، ثم راجع المصادر والادعاءات قبل التصدير إلى نطاق متجرك. لا توجد ضمانات ترتيب أو استشهاد."
        title="استوديو محتوى SEO · وضوح · ثقة"
      />
      <ContentStudio />
    </>
  );
}
