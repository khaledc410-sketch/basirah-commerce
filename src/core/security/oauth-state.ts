import { createHash, timingSafeEqual } from "node:crypto";

export type OAuthPlatform = "salla" | "zid";

export function oauthStateCookieName(platform: OAuthPlatform) {
  return `basirah_oauth_state_${platform}`;
}

export function hashOAuthState(state: string) {
  return createHash("sha256").update(state, "utf8").digest("base64url");
}

export function verifyOAuthState(state: string, expectedHash: string) {
  const actual = Buffer.from(hashOAuthState(state), "utf8");
  const expected = Buffer.from(expectedHash, "utf8");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
