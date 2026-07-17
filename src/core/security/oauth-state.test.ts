import { describe, expect, it } from "vitest";

import { hashOAuthState, verifyOAuthState } from "@/core/security/oauth-state";

describe("OAuth state", () => {
  it("verifies the exact state and rejects replay input", () => {
    const state = "a-cryptographically-random-demo-state";
    const hash = hashOAuthState(state);
    expect(hash).not.toContain(state);
    expect(verifyOAuthState(state, hash)).toBe(true);
    expect(verifyOAuthState(`${state}-attacker`, hash)).toBe(false);
  });
});
