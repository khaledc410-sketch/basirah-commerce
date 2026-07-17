import "server-only";

import { createHmac } from "node:crypto";
import { isIP } from "node:net";

import { getServerEnv, isDemoMode } from "@/config/env";
import { getRedis } from "@/lib/redis";

const fixedWindowScript = `
local count = redis.call('INCR', KEYS[1])
if count == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end
local ttl = redis.call('TTL', KEYS[1])
return {count, ttl}
`;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export async function enforceRateLimit(input: {
  namespace: string;
  identifier: string;
  limit: number;
  windowSeconds: number;
}): Promise<RateLimitResult> {
  if (isDemoMode()) {
    return { allowed: true, remaining: input.limit, retryAfterSeconds: 0 };
  }

  const key = `basirah:rate:${input.namespace}:${hashIdentifier(input.identifier)}`;
  const result = (await getRedis().eval(
    fixedWindowScript,
    1,
    key,
    input.windowSeconds,
  )) as [number, number];
  const [count, ttl] = result.map(Number) as [number, number];
  return {
    allowed: count <= input.limit,
    remaining: Math.max(0, input.limit - count),
    retryAfterSeconds: count <= input.limit ? 0 : Math.max(1, ttl),
  };
}

export function clientAddress(request: Request) {
  // Vercel overwrites this header at its edge. Never fall back to arbitrary
  // forwarding headers supplied by a direct client; an unverified deployment
  // intentionally collapses into one fail-closed rate-limit bucket.
  if (!request.headers.get("x-vercel-id")) return "untrusted-proxy";
  const candidate = request.headers.get("x-vercel-forwarded-for")?.trim();
  return candidate && !candidate.includes(",") && isIP(candidate) > 0
    ? candidate
    : "untrusted-proxy";
}

function hashIdentifier(identifier: string) {
  const key = getServerEnv().TOKEN_ENCRYPTION_KEY;
  if (!key) throw new Error("TOKEN_ENCRYPTION_KEY is required for rate-limit identifiers.");
  return createHmac("sha256", key).update(identifier.normalize("NFKC")).digest("base64url");
}
