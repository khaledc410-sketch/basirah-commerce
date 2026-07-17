import { describe, expect, it, vi } from "vitest";

import { ScannerError } from "./errors";
import type { PublicResourceFetcher } from "./network";
import { InMemoryVisibilityScanRepository } from "./repository";
import { createVisibilityScan, runScan } from "./service";

const html = `<!doctype html><html lang="ar"><head><title>متجر</title><meta name="description" content="وصف"><link rel="canonical" href="https://shop.example.com/"></head><body><h1>متجر</h1>${"محتوى عربي ".repeat(100)}</body></html>`;

function successfulFetcher() {
  return vi.fn(async (input: string | URL, options) => {
    const url = new URL(input.toString());
    await options?.beforeRequest?.(url);
    if (url.pathname === "/robots.txt") {
      return { url: url.toString(), status: 404, headers: new Headers(), body: "" };
    }
    if (url.pathname === "/sitemap.xml") {
      return { url: url.toString(), status: 404, headers: new Headers(), body: "" };
    }
    return {
      url: url.toString(),
      status: 200,
      headers: new Headers({ "content-type": "text/html" }),
      body: html,
    };
  }) as unknown as PublicResourceFetcher;
}

describe("visibility scan processor", () => {
  it("completes one concurrent delivery and exposes the other lease contention", async () => {
    const repository = new InMemoryVisibilityScanRepository();
    const fetchResource = successfulFetcher();
    const record = await createVisibilityScan(
      { domain: "shop.example.com", locale: "ar", countryCode: "SA" },
      { repository },
    );

    const results = await Promise.allSettled([
      runScan(record.token, { repository, crawlOptions: { fetchResource } }),
      runScan(record.token, { repository, crawlOptions: { fetchResource } }),
    ]);

    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((result) => result.status === "rejected")).toEqual([
      expect.objectContaining({
        reason: expect.objectContaining({ code: "SCAN_LEASE_BUSY" }),
      }),
    ]);
    expect(fetchResource).toHaveBeenCalledTimes(3);
    expect(repository.get(record.token)?.status).toBe("completed");
  });

  it("defers a stalled redelivery until the renewed database lease expires", async () => {
    vi.useFakeTimers();
    const startedAtMs = Date.now();
    vi.setSystemTime(startedAtMs);
    const repository = new InMemoryVisibilityScanRepository(() => new Date(Date.now()));

    try {
      const record = await createVisibilityScan(
        { domain: "shop.example.com", locale: "ar", countryCode: "SA" },
        { repository },
      );
      const crashedAttempt = await repository.tryStart(record.token);
      expect(crashedAttempt?.attemptId).toBeTruthy();

      // The first worker renews its DB lease shortly before it crashes. BullMQ
      // later redelivers at its 180s lock boundary, while that DB lease remains
      // valid until t=239s.
      vi.setSystemTime(startedAtMs + 89_000);
      const renewed = await repository.updateProgress(
        record.token,
        40,
        "قراءة الصفحات",
        crashedAttempt?.attemptId,
      );
      expect(renewed?.leaseExpiresAt).toBeTruthy();

      vi.setSystemTime(startedAtMs + 180_000);
      await expect(
        runScan(record.token, {
          repository,
          crawlOptions: { fetchResource: successfulFetcher() },
        }),
      ).rejects.toMatchObject({
        code: "SCAN_LEASE_BUSY",
        retryAt: new Date(renewed!.leaseExpiresAt!),
      });
      expect(repository.get(record.token)?.status).toBe("running");

      vi.setSystemTime(new Date(renewed!.leaseExpiresAt!).getTime() + 1);
      await runScan(record.token, {
        repository,
        crawlOptions: { fetchResource: successfulFetcher() },
      });
      expect(repository.get(record.token)?.status).toBe("completed");
    } finally {
      vi.useRealTimers();
    }
  });

  it("requeues and rethrows transient failures for worker retries", async () => {
    const repository = new InMemoryVisibilityScanRepository();
    const record = await createVisibilityScan(
      { domain: "shop.example.com", locale: "ar", countryCode: "SA" },
      { repository },
    );
    const failedFetcher = (async () => {
      throw new ScannerError("FETCH_FAILED", "تعذر الاتصال مؤقتًا.");
    }) as PublicResourceFetcher;

    await expect(
      runScan(record.token, {
        repository,
        crawlOptions: { fetchResource: failedFetcher },
        rethrowRetryable: true,
      }),
    ).rejects.toMatchObject({ code: "FETCH_FAILED" });
    expect(repository.get(record.token)).toMatchObject({ status: "queued" });

    await runScan(record.token, {
      repository,
      crawlOptions: { fetchResource: successfulFetcher() },
    });
    expect(repository.get(record.token)?.status).toBe("completed");
  });
});
