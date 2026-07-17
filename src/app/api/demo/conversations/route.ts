import { isDemoMode } from "@/config/env";
import { demoRepository } from "@/core/demo/store";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isDemoMode()) {
    return Response.json({ error: "Demo data is disabled in production mode." }, { status: 404 });
  }
  return Response.json({
    conversations: demoRepository.listConversations(),
    source: "demo_conversation_store",
    freshness: new Date().toISOString(),
  });
}
