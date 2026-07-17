import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const workspaceRoot = process.cwd();
const migrationsDirectory = join(workspaceRoot, "drizzle");
const rlsMigrationPath = join(migrationsDirectory, "0003_auth_tenant_rls.sql");

function migrationSql() {
  return readdirSync(migrationsDirectory)
    .filter((name) => /^\d{4}_.+\.sql$/u.test(name))
    .sort()
    .map((name) => readFileSync(join(migrationsDirectory, name), "utf8"))
    .join("\n");
}

function publicTableDefinitions(sql: string) {
  const tables = new Map<string, string>();
  const pattern = /CREATE TABLE "([^".]+)" \(([\s\S]*?)\n\);/gu;

  for (const match of sql.matchAll(pattern)) {
    tables.set(match[1], match[2]);
  }

  return tables;
}

function policyGroups(sql: string) {
  const groups = new Map<string, string[]>();
  const pattern =
    /(viewer|support|analyst|admin|system)_tables CONSTANT text\[\] := ARRAY\[([\s\S]*?)\n  \];/gu;

  for (const match of sql.matchAll(pattern)) {
    groups.set(match[1], [...match[2].matchAll(/'([a-z_]+)'/gu)].map((item) => item[1]));
  }

  return groups;
}

function sorted(values: Iterable<string>) {
  return [...values].sort((left, right) => left.localeCompare(right));
}

describe("tenant RLS migration", () => {
  const allMigrations = migrationSql();
  const rlsMigration = readFileSync(rlsMigrationPath, "utf8");
  const tables = publicTableDefinitions(allMigrations);
  const groups = policyGroups(rlsMigration);

  it("accounts for every store-owned table exactly once", () => {
    const storeOwnedTables = sorted(
      [...tables.entries()]
        .filter(([, definition]) => definition.includes('"store_id"'))
        .map(([table]) => table),
    );
    const groupedTables = [
      ...(groups.get("viewer") ?? []),
      ...(groups.get("support") ?? []),
      ...(groups.get("analyst") ?? []),
      ...(groups.get("admin") ?? []),
      ...(groups.get("system") ?? []),
      "store_members",
    ];

    expect(groups.size).toBe(5);
    expect(new Set(groupedTables).size).toBe(groupedTables.length);
    expect(sorted(groupedTables)).toEqual(storeOwnedTables);
  });

  it("keeps the complete non-store table set under an explicit policy decision", () => {
    const nonStoreTables = sorted(
      [...tables.entries()]
        .filter(([, definition]) => !definition.includes('"store_id"'))
        .map(([table]) => table),
    );

    expect(nonStoreTables).toEqual(
      sorted([
        "accounts",
        "auth_sessions",
        "entitlements",
        "lead_consents",
        "organization_members",
        "organizations",
        "pending_platform_authorizations",
        "platform_binding_claims",
        "plans",
        "prospect_report_access",
        "prospect_report_snapshots",
        "prospect_scan_evidence",
        "prospect_scan_findings",
        "prospect_scan_pages",
        "prospect_scan_requests",
        "prospect_scan_runs",
        "provider_capabilities",
        "report_orders",
        "stores",
        "users",
      ]),
    );
    expect(rlsMigration).toContain('CREATE POLICY "users_self_select"');
    expect(rlsMigration).toContain('CREATE POLICY "organizations_member_select"');
    expect(rlsMigration).toContain('CREATE POLICY "organization_members_member_select"');
    expect(rlsMigration).toContain('CREATE POLICY "stores_member_select"');
    expect(rlsMigration).toContain('CREATE POLICY "plans_active_public_select"');
    expect(rlsMigration).toContain('CREATE POLICY "entitlements_active_plan_public_select"');
    expect(rlsMigration).not.toContain('CREATE POLICY "accounts_');
    expect(rlsMigration).not.toContain('CREATE POLICY "auth_sessions_');

    const serviceOnlyTables = [
      "lead_consents",
      "platform_binding_claims",
      "prospect_report_access",
      "prospect_report_snapshots",
      "prospect_scan_evidence",
      "prospect_scan_findings",
      "prospect_scan_pages",
      "prospect_scan_requests",
      "prospect_scan_runs",
      "provider_capabilities",
      "report_orders",
    ];
    for (const table of serviceOnlyTables) {
      const listedInServiceLoop = allMigrations.includes(`'${table}'`);
      const hasExplicitRevocation = allMigrations.includes(
        `REVOKE ALL PRIVILEGES ON TABLE "${table}" FROM PUBLIC, "anon", "authenticated"`,
      );
      expect(listedInServiceLoop || hasExplicitRevocation).toBe(true);
    }
    expect(allMigrations).toContain(
      "REVOKE ALL PRIVILEGES ON TABLE public.%I FROM PUBLIC, anon, authenticated",
    );
  });

  it("enables and forces RLS while failing closed for operational inbox tables", () => {
    expect(rlsMigration).toContain("ENABLE ROW LEVEL SECURITY");
    expect(rlsMigration).toContain("FORCE ROW LEVEL SECURITY");
    expect(rlsMigration).toContain(
      'REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA "public" FROM "anon", "authenticated"',
    );
    expect(sorted(groups.get("system") ?? [])).toEqual(
      sorted(["oauth_states", "outbox_events", "webhook_events"]),
    );

    for (const table of groups.get("system") ?? []) {
      expect(rlsMigration).not.toMatch(
        new RegExp(`GRANT\\s+SELECT(?:\\s*\\([^)]*\\))?\\s+ON\\s+"public"\\."${table}"`, "u"),
      );
    }
    expect(allMigrations).toContain(
      'ALTER TABLE "pending_platform_authorizations" ENABLE ROW LEVEL SECURITY',
    );
    expect(allMigrations).toContain(
      'ALTER TABLE "pending_platform_authorizations" FORCE ROW LEVEL SECURITY',
    );
    expect(allMigrations).toContain(
      'REVOKE ALL PRIVILEGES ON TABLE "platform_binding_claims" FROM PUBLIC, "anon", "authenticated"',
    );
    expect(allMigrations).toContain(
      'ALTER TABLE "platform_binding_claims" ENABLE ROW LEVEL SECURITY',
    );
    expect(allMigrations).toContain(
      'ALTER TABLE "platform_binding_claims" FORCE ROW LEVEL SECURITY',
    );
    expect(allMigrations).not.toMatch(
      /GRANT\s+SELECT[\s\S]{0,120}pending_platform_authorizations/iu,
    );
  });

  it("never grants sensitive columns to the authenticated role", () => {
    const sensitiveColumns = [
      "access_token_encrypted",
      "authorization_token_encrypted",
      "refresh_token_encrypted",
      "email_encrypted",
      "email_hash",
      "phone_encrypted",
      "phone_hash",
      "session_token_hash",
      "contact_encrypted",
    ];
    const columnGrantBlocks = [...rlsMigration.matchAll(/GRANT SELECT \(([\s\S]*?)\) ON/gu)]
      .map((match) => match[1])
      .join("\n");

    for (const column of sensitiveColumns) {
      expect(columnGrantBlocks).not.toContain(`"${column}"`);
    }
  });

  it("links profiles to auth users and never authorizes from user metadata", () => {
    expect(rlsMigration).toContain('REFERENCES "auth"."users"("id")');
    expect(rlsMigration).toContain('DROP COLUMN "password_hash"');
    expect(rlsMigration).toContain('SET search_path = \'\'');
    expect(rlsMigration).toContain('(SELECT "auth"."uid"())');
    expect(rlsMigration).not.toMatch(/raw_user_meta_data[\s\S]{0,120}(role|authorization)/iu);
  });
});
