import { describe, expect, it } from "vitest";

import { getProductionReadiness, type ServerEnv } from "@/config/env";

const completeEnv: ServerEnv = {
  NODE_ENV: "production",
  APP_MODE: "production",
  APP_URL: "https://app.example.com",
  NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_example",
  DATABASE_URL: "postgresql://example",
  REDIS_URL: "redis://example",
  TOKEN_ENCRYPTION_KEY: "a".repeat(32),
  SALLA_AUTH_MODE: "easy",
  SALLA_APP_ID: "123",
  SALLA_CLIENT_ID: "salla-client",
  SALLA_CLIENT_SECRET: "salla-secret",
  SALLA_WEBHOOK_SECRET: "salla-webhook",
  ZID_CLIENT_ID: "zid-client",
  ZID_CLIENT_SECRET: "zid-secret",
  ZID_AUTHORIZATION_URL: "https://oauth.zid.sa/oauth/authorize",
  ZID_REDIRECT_URI: "https://app.example.com/api/oauth/zid/callback",
  AI_REPORT_MODEL: "openai/gpt-5.4",
  VISIBILITY_SCAN_MAX_PAGES: 10,
  VISIBILITY_SCAN_ENABLED: true,
  PUBLIC_SCAN_RATE_LIMIT_PER_HOUR: 5,
};

describe("getProductionReadiness", () => {
  it("lets the checker core be ready while integrations are capability-gated", () => {
    expect(getProductionReadiness(completeEnv).ready).toBe(true);
  });

  it("reports Zid as not ready without the Partner Dashboard authorization URL", () => {
    const readiness = getProductionReadiness({
      ...completeEnv,
      ZID_AUTHORIZATION_URL: undefined,
    });
    expect(readiness.ready).toBe(true);
    expect(readiness.zid.missing).toContain("ZID_AUTHORIZATION_URL");
  });

  it("requires Redis for the durable checker queue", () => {
    const readiness = getProductionReadiness({ ...completeEnv, REDIS_URL: undefined });
    expect(readiness.ready).toBe(false);
    expect(readiness.checker.missing).toContain("REDIS_URL");
  });

  it("requires a Salla redirect URI only for Custom Mode", () => {
    const readiness = getProductionReadiness({
      ...completeEnv,
      SALLA_AUTH_MODE: "custom",
      SALLA_REDIRECT_URI: undefined,
    });
    expect(readiness.salla.missing).toContain("SALLA_REDIRECT_URI");
  });

  it("requires HTTPS outside demo deployments", () => {
    const readiness = getProductionReadiness({ ...completeEnv, APP_URL: "http://app.example.com" });
    expect(readiness.ready).toBe(false);
    expect(readiness.common.missing).toContain("APP_URL_HTTPS");
  });
});
