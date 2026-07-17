import type { Metadata } from "next";

import { ConversationsList } from "@/components/conversations/conversations-list";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { ProductionFeatureState } from "@/components/dashboard/production-feature-state";
import { Badge } from "@/components/ui/badge";
import { isDemoMode } from "@/config/env";
import { demoRepository } from "@/core/demo/store";

export const metadata: Metadata = { title: "المحادثات" };
export const dynamic = "force-dynamic";

export default function ConversationsPage() {
  if (!isDemoMode()) {
    return <ProductionFeatureState title="لا توجد محادثات حية بعد" description="ستظهر المحادثات هنا بعد تثبيت واجهة المتجر الموقعة وتفعيل الموافقة والاحتفاظ الآمن." />;
  }
  const conversations = demoRepository.listConversations();
  return (
    <>
      <DashboardHeader actions={<Badge className="h-10 px-4" variant="outline">{conversations.length} سجلات ظاهرة</Badge>} description="راجع رسائل العميل والمنتجات الموصى بها والأحداث والنتيجة والإشارات المستخرجة." title="محادثات العملاء" />
      <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8"><ConversationsList conversations={conversations} /></div>
    </>
  );
}
