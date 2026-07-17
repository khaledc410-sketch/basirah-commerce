import { z } from "zod";

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_MODE: z.enum(["demo", "staging", "production"]),
  APP_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1).optional(),
  DATABASE_URL: z.string().min(1).optional(),
  REDIS_URL: z.string().min(1).optional(),
  TOKEN_ENCRYPTION_KEY: z.string().min(32).optional(),
  SALLA_AUTH_MODE: z.enum(["easy", "custom"]).default("easy"),
  SALLA_APP_ID: z.string().min(1).optional(),
  SALLA_CLIENT_ID: z.string().min(1).optional(),
  SALLA_CLIENT_SECRET: z.string().min(1).optional(),
  SALLA_WEBHOOK_SECRET: z.string().min(1).optional(),
  SALLA_REDIRECT_URI: z.string().url().optional(),
  ZID_CLIENT_ID: z.string().min(1).optional(),
  ZID_CLIENT_SECRET: z.string().min(1).optional(),
  ZID_AUTHORIZATION_URL: z.string().url().optional(),
  ZID_REDIRECT_URI: z.string().url().optional(),
  VERCEL_OIDC_TOKEN: z.string().min(1).optional(),
  AI_GATEWAY_API_KEY: z.string().min(1).optional(),
  AI_REPORT_MODEL: z.string().min(1).default("openai/gpt-5.4"),
  VISIBILITY_SCAN_MAX_PAGES: z.coerce.number().int().min(1).max(100).default(10),
  VISIBILITY_SCAN_ENABLED: z
    .enum(["true", "false"])
    .default("true")
    .transform((value) => value === "true"),
  PUBLIC_SCAN_RATE_LIMIT_PER_HOUR: z.coerce.number().int().min(1).max(100).default(5),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cachedEnv: ServerEnv | undefined;

export function getServerEnv(): ServerEnv {
  if (!cachedEnv) {
    const appMode = process.env.APP_MODE ??
      (process.env.NODE_ENV === "production" ? "production" : "demo");
    const appUrl = process.env.APP_URL ??
      (appMode === "demo" ? "http://localhost:3000" : undefined);
    cachedEnv = serverEnvSchema.parse({ ...process.env, APP_MODE: appMode, APP_URL: appUrl });
  }
  return cachedEnv;
}

export function isDemoMode() {
  return getServerEnv().APP_MODE === "demo";
}

type ReadinessCheck = {
  ready: boolean;
  missing: string[];
};

export interface ProductionReadiness {
  ready: boolean;
  common: ReadinessCheck;
  checker: ReadinessCheck;
  auth: ReadinessCheck;
  salla: ReadinessCheck;
  zid: ReadinessCheck;
}

function checkRequired(env: ServerEnv, keys: (keyof ServerEnv)[]): ReadinessCheck {
  const missing = keys.filter((key) => !env[key]).map(String);
  return { ready: missing.length === 0, missing };
}

export function getProductionReadiness(env = getServerEnv()): ProductionReadiness {
  const common = checkRequired(env, ["DATABASE_URL", "TOKEN_ENCRYPTION_KEY"]);
  if (env.APP_MODE === "demo") common.missing.push("APP_MODE_NON_DEMO");
  if (new URL(env.APP_URL).protocol !== "https:") common.missing.push("APP_URL_HTTPS");
  common.ready = common.missing.length === 0;
  const checker = checkRequired(env, ["REDIS_URL"]);
  const auth = checkRequired(env, [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  ]);
  const sallaKeys: (keyof ServerEnv)[] = [
    "SALLA_APP_ID",
    "SALLA_CLIENT_ID",
    "SALLA_CLIENT_SECRET",
    "SALLA_WEBHOOK_SECRET",
  ];
  if (env.SALLA_AUTH_MODE === "custom") sallaKeys.push("SALLA_REDIRECT_URI");
  const salla = checkRequired(env, sallaKeys);
  const zid = checkRequired(env, [
    "ZID_CLIENT_ID",
    "ZID_CLIENT_SECRET",
    "ZID_AUTHORIZATION_URL",
    "ZID_REDIRECT_URI",
  ]);

  return {
    // The public checker is deployable without optional commerce connectors.
    ready: common.ready && checker.ready,
    common,
    checker,
    auth,
    salla,
    zid,
  };
}

export function getSupabasePublicConfig(env = getServerEnv()) {
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    throw new Error("Supabase Auth is not configured for this environment.");
  }

  return {
    url: env.NEXT_PUBLIC_SUPABASE_URL,
    publishableKey: env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  } as const;
}
