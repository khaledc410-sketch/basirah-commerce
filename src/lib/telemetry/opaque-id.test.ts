import { describe, expect, it } from "vitest";

import { telemetryOpaqueId } from "./opaque-id";

describe("telemetry opaque identifiers", () => {
  it("is stable without retaining the bearer credential", () => {
    const bearer = "secret-scan-bearer-value-123456789";
    const first = telemetryOpaqueId("scan", bearer);
    expect(first).toBe(telemetryOpaqueId("scan", bearer));
    expect(first).toMatch(/^scan_[A-Za-z0-9_-]{32}$/u);
    expect(first).not.toContain(bearer);
    expect(telemetryOpaqueId("report", bearer)).not.toBe(first);
  });
});
