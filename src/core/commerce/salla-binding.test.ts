import { describe, expect, it } from "vitest";

import {
  isValidSallaBindingClaim,
  parseSallaBindingClaimBody,
  protectedNextTarget,
} from "./salla-binding";

describe("Salla top-level binding", () => {
  it("accepts only bounded base64url claim secrets", () => {
    expect(isValidSallaBindingClaim("a".repeat(43))).toBe(true);
    expect(isValidSallaBindingClaim(`${"a".repeat(42)}+`)).toBe(false);
    expect(isValidSallaBindingClaim("a".repeat(129))).toBe(false);
    expect(isValidSallaBindingClaim(undefined)).toBe(false);
  });

  it("accepts only a strict one-field continuation body", () => {
    const claim = "a".repeat(43);
    expect(parseSallaBindingClaimBody(JSON.stringify({ claim }))).toBe(claim);
    expect(parseSallaBindingClaimBody(JSON.stringify({ claim, next: "/dashboard" }))).toBeNull();
    expect(parseSallaBindingClaimBody(JSON.stringify([claim]))).toBeNull();
    expect(parseSallaBindingClaimBody("not-json")).toBeNull();
  });

  it("never carries a legacy token or claim into the sign-in continuation", () => {
    expect(
      protectedNextTarget(
        new URL("https://app.example/setup/connect/salla?token=secret&claim=secret-2&from=salla"),
      ),
    ).toBe("/setup/connect/salla?from=salla");
    expect(protectedNextTarget(new URL("https://app.example/dashboard?view=products"))).toBe(
      "/dashboard?view=products",
    );
  });
});
