import { describe, expect, it } from "vitest";

import { InMemoryVisibilityScanRepository } from "./repository";

describe("in-memory visibility scan repository", () => {
  it("uses opaque tokens and expires anonymous scans after the TTL", () => {
    let now = new Date("2026-07-13T00:00:00.000Z");
    const repository = new InMemoryVisibilityScanRepository(() => now, 1_000);
    const record = repository.create({
      domain: "shop.example.com",
      normalizedUrl: "https://shop.example.com/",
      locale: "ar",
      countryCode: "SA",
    });

    expect(record.token).toMatch(/^[\w-]{32}$/u);
    expect(record.token).not.toContain("shop");
    expect(repository.get(record.token)).not.toBeNull();
    now = new Date("2026-07-13T00:00:01.001Z");
    expect(repository.get(record.token)).toBeNull();
  });

  it("reclaims only an expired worker lease and rejects stale progress", () => {
    let now = new Date("2026-07-13T00:00:00.000Z");
    const repository = new InMemoryVisibilityScanRepository(() => now);
    const record = repository.create({
      domain: "shop.example.com",
      normalizedUrl: "https://shop.example.com/",
      locale: "ar",
      countryCode: "SA",
    });
    const first = repository.tryStart(record.token);
    expect(first?.attemptId).toBeTruthy();
    expect(repository.tryStart(record.token)).toBeNull();

    now = new Date(now.getTime() + 151_000);
    const second = repository.tryStart(record.token);
    expect(second?.attemptId).toBeTruthy();
    expect(second?.attemptId).not.toBe(first?.attemptId);
    expect(
      repository.updateProgress(record.token, 50, "stale", first?.attemptId),
    ).toBeNull();
    expect(
      repository.updateProgress(record.token, 50, "active", second?.attemptId),
    ).toMatchObject({ currentStep: "active" });
  });
});
