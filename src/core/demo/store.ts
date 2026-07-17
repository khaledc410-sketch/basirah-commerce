import "server-only";

import { randomUUID } from "node:crypto";

import type { UnifiedProduct } from "@/core/commerce/types";
import {
  demoConversations,
  demoDailyMetrics,
  demoEvents,
  demoOpportunities,
  demoProducts,
  demoStore,
} from "@/core/demo/seed";
import type { DemoConversation, DemoEvent } from "@/core/demo/types";

interface DemoState {
  conversations: DemoConversation[];
  events: DemoEvent[];
}

declare global {
  var __basirahDemoState: DemoState | undefined;
}

function cloneSeedState(): DemoState {
  return {
    conversations: structuredClone(demoConversations),
    events: structuredClone(demoEvents),
  };
}

function state() {
  globalThis.__basirahDemoState ??= cloneSeedState();
  return globalThis.__basirahDemoState;
}

export const demoRepository = {
  getStore: () => structuredClone(demoStore),
  listProducts: () => structuredClone(demoProducts),
  getProduct: (productId: string) =>
    structuredClone(demoProducts.find((product) => product.id === productId)),
  listConversations: () =>
    structuredClone(state().conversations).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    ),
  getConversation: (conversationId: string) =>
    structuredClone(state().conversations.find((conversation) => conversation.id === conversationId)),
  listOpportunities: () => structuredClone(demoOpportunities),
  listDailyMetrics: () => structuredClone(demoDailyMetrics),

  createConversation(input: {
    sessionId: string;
    customerMessage: string;
    assistantMessage: string;
    intent: string;
    need: string;
    productIds: string[];
  }) {
    const createdAt = new Date().toISOString();
    const conversation: DemoConversation = {
      id: `conv_${randomUUID()}`,
      storeId: demoStore.id,
      visitorId: input.sessionId,
      language: "ar",
      intent: input.intent,
      need: input.need,
      sentiment: "neutral",
      messages: [
        { id: `msg_${randomUUID()}`, role: "customer", text: input.customerMessage, createdAt },
        { id: `msg_${randomUUID()}`, role: "assistant", text: input.assistantMessage, createdAt },
      ],
      recommendedProductIds: input.productIds,
      outcome: "no_conversion",
      createdAt,
    };
    state().conversations.push(conversation);
    return structuredClone(conversation);
  },

  recordEvent(input: Omit<DemoEvent, "id" | "createdAt" | "storeId">) {
    const existing = state().events.find(
      (event) => event.idempotencyKey === input.idempotencyKey,
    );
    if (existing) return { event: structuredClone(existing), duplicate: true };

    const event: DemoEvent = {
      ...input,
      id: `evt_${randomUUID()}`,
      storeId: demoStore.id,
      createdAt: new Date().toISOString(),
    };
    state().events.push(event);

    if (event.conversationId) {
      const conversation = state().conversations.find(
        (candidate) => candidate.id === event.conversationId,
      );
      if (conversation) {
        if (event.type === "product_clicked") conversation.outcome = "clicked";
        if (event.type === "product_added_to_cart") conversation.outcome = "added_to_cart";
        if (event.type === "purchase_completed") conversation.outcome = "purchased";
      }
    }
    return { event: structuredClone(event), duplicate: false };
  },

  getOverview() {
    const totals = demoDailyMetrics.reduce(
      (sum, item) => ({
        conversations: sum.conversations + item.conversations,
        shoppers: sum.shoppers + item.shoppers,
        recommendations: sum.recommendations + item.recommendations,
        clicks: sum.clicks + item.clicks,
        addToCarts: sum.addToCarts + item.addToCarts,
        checkouts: sum.checkouts + item.checkouts,
        purchases: sum.purchases + item.purchases,
        directRevenueMinor: sum.directRevenueMinor + item.directRevenueMinor,
        influencedRevenueMinor: sum.influencedRevenueMinor + item.influencedRevenueMinor,
      }),
      { conversations: 0, shoppers: 0, recommendations: 0, clicks: 0, addToCarts: 0, checkouts: 0, purchases: 0, directRevenueMinor: 0, influencedRevenueMinor: 0 },
    );

    return {
      ...totals,
      recommendationClickRate: totals.clicks / totals.recommendations,
      recommendationToCartRate: totals.addToCarts / totals.recommendations,
      recommendationToPurchaseRate: totals.purchases / totals.recommendations,
      topNeed: "منتجات مناسبة للبشرة الحساسة",
      topObjection: "عدم وضوح طريقة الاستخدام",
      period: { from: "2026-07-05", to: "2026-07-11", timezone: demoStore.timezone },
      freshness: "2026-07-11T11:52:00.000Z",
      source: "demo_daily_store_metrics_v1",
    };
  },

  getProductMetrics(product: UnifiedProduct) {
    const factors: Record<string, [number, number, number, number]> = {
      prod_serum_balance: [438, 121, 29, 8],
      prod_gentle_cleanser: [319, 96, 31, 11],
      prod_barrier_moisturizer: [276, 73, 18, 6],
    };
    const [impressions, clicks, addToCarts, purchases] = factors[product.id] ?? [0, 0, 0, 0];
    return {
      productId: product.id,
      impressions,
      clicks,
      addToCarts,
      purchases,
      conversionRate: impressions ? purchases / impressions : 0,
      mostCommonQuestion: product.id === "prod_serum_balance" ? "كيف أستخدمه مع المرطب؟" : "هل يناسب البشرة الحساسة؟",
      mostCommonObjection: product.id === "prod_serum_balance" ? "طريقة الاستخدام غير واضحة" : "المكونات غير مكتملة",
    };
  },

  reset() {
    globalThis.__basirahDemoState = cloneSeedState();
  },
};
