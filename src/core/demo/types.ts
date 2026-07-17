import type { UnifiedProduct } from "@/core/commerce/types";

export type ConversationOutcome = "purchased" | "added_to_cart" | "clicked" | "no_conversion";

export interface DemoMessage {
  id: string;
  role: "customer" | "assistant";
  text: string;
  createdAt: string;
}

export interface DemoConversation {
  id: string;
  storeId: string;
  visitorId: string;
  language: "ar" | "en";
  intent: string;
  need: string;
  objection?: string;
  sentiment: "positive" | "neutral" | "negative";
  messages: DemoMessage[];
  recommendedProductIds: string[];
  outcome: ConversationOutcome;
  createdAt: string;
}

export type DemoEventType =
  | "conversation_started"
  | "message_sent"
  | "intent_detected"
  | "recommendation_shown"
  | "product_clicked"
  | "product_added_to_cart"
  | "checkout_started"
  | "purchase_completed";

export interface DemoEvent {
  id: string;
  idempotencyKey: string;
  storeId: string;
  sessionId: string;
  conversationId?: string;
  productId?: string;
  type: DemoEventType;
  consentState: "analytics" | "essential";
  source: "widget" | "storefront" | "platform";
  createdAt: string;
}

export interface DemoOpportunity {
  id: string;
  priority: "high" | "medium" | "low";
  title: string;
  evidence: string;
  whyItMatters: string;
  confidence: "high" | "medium" | "low";
  proposedAction: string;
  affectedProductIds: string[];
  status: "open" | "drafted" | "approved" | "dismissed";
}

export interface RecommendationResult {
  conversationId: string;
  intent: string;
  constraints: Record<string, string | number | string[]>;
  assistantText: string;
  products: Array<UnifiedProduct & { reason: string; score: number }>;
  safety: { status: "allowed" | "restricted"; reason?: string };
}
