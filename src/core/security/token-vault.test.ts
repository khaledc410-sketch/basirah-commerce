import { describe, expect, it } from "vitest";

import { decryptSecret, encryptSecret } from "@/core/security/token-vault";

describe("token vault", () => {
  const key = "local-test-key-material-that-is-longer-than-32-characters";

  it("round-trips a token without retaining plaintext", () => {
    const encrypted = encryptSecret("sensitive-refresh-token", key);
    expect(encrypted.ciphertext).not.toContain("sensitive-refresh-token");
    expect(decryptSecret(encrypted, key)).toBe("sensitive-refresh-token");
  });

  it("rejects a different key or tampered authentication data", () => {
    const encrypted = encryptSecret("token", key);
    expect(() => decryptSecret(encrypted, `${key}-different`)).toThrow();
    expect(() => decryptSecret({ ...encrypted, authTag: "broken" }, key)).toThrow();
  });

  it("requires sufficiently long key material", () => {
    expect(() => encryptSecret("token", "short")).toThrow(/at least 32/);
  });

  it("binds ciphertext to the supplied record context", () => {
    const encrypted = encryptSecret("token", key, "salla:store-a:access");
    expect(decryptSecret(encrypted, key, "salla:store-a:access")).toBe("token");
    expect(() => decryptSecret(encrypted, key, "salla:store-b:access")).toThrow();
  });
});
