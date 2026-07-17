import "server-only";

import { z } from "zod";

import type { TokenResult } from "@/core/commerce/connector";

const sallaAuthorizationEventSchema = z.object({
  event: z.literal("app.store.authorize"),
  merchant: z.union([z.string().min(1), z.number().int().positive()]),
  created_at: z.string().min(1),
  data: z.object({
    access_token: z.string().min(1),
    expires: z.coerce.number().int().positive(),
    refresh_token: z.string().min(1),
    scope: z.string().default(""),
    token_type: z.string().default("bearer"),
  }),
});

const sallaLifecycleEventSchema = z.object({
  event: z.enum(["app.updated", "app.uninstalled"]),
  merchant: z.union([z.string().min(1), z.number().int().positive()]),
  created_at: z.string().min(1).optional(),
});

const ignoredAutomaticAppEvents = [
  "app.installed",
  "app.trial.started",
  "app.trial.expired",
  "app.trial.canceled",
  "app.subscription.started",
  "app.subscription.expired",
  "app.subscription.canceled",
  "app.subscription.renewed",
  "app.feedback.created",
  "app.settings.updated",
] as const;

const ignoredAutomaticAppEventSchema = z.object({
  event: z.enum(ignoredAutomaticAppEvents),
  merchant: z.union([z.string().min(1), z.number().int().positive()]).optional(),
  created_at: z.string().min(1).optional(),
});

export interface SallaAuthorizationEvent {
  merchantId: string;
  createdAt: string;
  tokens: TokenResult;
}

export function parseSallaAuthorizationEvent(input: unknown): SallaAuthorizationEvent {
  const parsed = sallaAuthorizationEventSchema.parse(input);
  return {
    merchantId: String(parsed.merchant),
    createdAt: parsed.created_at,
    tokens: {
      accessToken: parsed.data.access_token,
      refreshToken: parsed.data.refresh_token,
      expiresAt: new Date(parsed.data.expires * 1000).toISOString(),
      scopes: parsed.data.scope.split(" ").filter(Boolean),
      tokenType: parsed.data.token_type,
    },
  };
}

export type SallaAppEvent =
  | ({ kind: "authorize" } & SallaAuthorizationEvent)
  | {
      kind: "updated" | "uninstalled";
      merchantId: string;
      createdAt?: string;
    }
  | {
      kind: "ignored";
      eventName: (typeof ignoredAutomaticAppEvents)[number];
      merchantId?: string;
      createdAt?: string;
    };

export function parseSallaAppEvent(input: unknown): SallaAppEvent {
  const eventName = z.object({ event: z.string() }).parse(input).event;
  if (eventName === "app.store.authorize") {
    return { kind: "authorize", ...parseSallaAuthorizationEvent(input) };
  }
  if ((ignoredAutomaticAppEvents as readonly string[]).includes(eventName)) {
    const event = ignoredAutomaticAppEventSchema.parse(input);
    return {
      kind: "ignored",
      eventName: event.event,
      merchantId: event.merchant === undefined ? undefined : String(event.merchant),
      createdAt: event.created_at,
    };
  }
  const event = sallaLifecycleEventSchema.parse(input);
  return {
    kind: event.event === "app.uninstalled" ? "uninstalled" : "updated",
    merchantId: String(event.merchant),
    createdAt: event.created_at,
  };
}
