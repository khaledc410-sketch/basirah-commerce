import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

describe("platform binding claim migration", () => {
  const migration = readFileSync(
    join(process.cwd(), "drizzle", "0008_platform_binding_claims.sql"),
    "utf8",
  );

  it("stores only a one-time SHA-256 digest and provider boundaries", () => {
    expect(migration).toContain('CREATE TABLE "platform_binding_claims"');
    expect(migration).toContain('"external_store_id" text NOT NULL');
    expect(migration).toContain('"external_user_id" text NOT NULL');
    expect(migration).toContain('"claim_hash" text NOT NULL');
    expect(migration).toContain("char_length");
    expect(migration).not.toMatch(/"claim"\s+text/iu);
  });

  it("is service-only with forced RLS and no tenant policy", () => {
    expect(migration).toContain(
      'REVOKE ALL PRIVILEGES ON TABLE "platform_binding_claims" FROM PUBLIC, "anon", "authenticated"',
    );
    expect(migration).toContain(
      'GRANT ALL PRIVILEGES ON TABLE "platform_binding_claims" TO "service_role"',
    );
    expect(migration).toContain(
      'ALTER TABLE "platform_binding_claims" ENABLE ROW LEVEL SECURITY',
    );
    expect(migration).toContain(
      'ALTER TABLE "platform_binding_claims" FORCE ROW LEVEL SECURITY',
    );
    expect(migration).not.toContain("CREATE POLICY");
  });
});
