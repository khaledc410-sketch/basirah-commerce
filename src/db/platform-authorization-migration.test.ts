import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

describe("platform authorization freshness migration", () => {
  const migration = readFileSync(
    join(process.cwd(), "drizzle", "0007_milky_baron_zemo.sql"),
    "utf8",
  );

  it("stores provider event time as timestamps on pending and bound credentials", () => {
    expect(migration).toContain(
      'ALTER COLUMN "event_created_at" SET DATA TYPE timestamp with time zone',
    );
    expect(migration).toContain('USING CASE');
    expect(migration).toContain(
      'ADD COLUMN "authorization_event_created_at" timestamp with time zone',
    );
  });
});
