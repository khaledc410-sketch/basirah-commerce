import { describe, expect, it, vi } from "vitest";

import { ScannerError } from "./errors";
import { fetchPublicResource, type DnsResolver } from "./network";

const publicResolver: DnsResolver = async () => [{ address: "93.184.216.34", family: 4 }];

describe("visibility scanner network boundary", () => {
  it("rejects a private DNS answer before making a request", async () => {
    const fetchImpl = vi.fn();
    await expect(
      fetchPublicResource("https://shop.example.com", {
        resolver: async () => [{ address: "10.0.0.8", family: 4 }],
        fetchImpl: fetchImpl as unknown as typeof fetch,
      }),
    ).rejects.toMatchObject({ code: "PRIVATE_ADDRESS" });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("revalidates and blocks every redirect target", async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(null, { status: 302, headers: { location: "http://127.0.0.1/admin" } }),
    );
    await expect(
      fetchPublicResource("https://shop.example.com", {
        resolver: publicResolver,
        fetchImpl: fetchImpl as unknown as typeof fetch,
      }),
    ).rejects.toMatchObject({ code: "PRIVATE_ADDRESS" });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("enforces one absolute deadline across redirect hops", async () => {
    vi.useFakeTimers();
    const startedAtMs = new Date("2026-07-13T00:00:00.000Z").getTime();
    vi.setSystemTime(startedAtMs);
    let calls = 0;
    const fetchImpl = vi.fn(async () => {
      calls += 1;
      vi.setSystemTime(Date.now() + 600);
      return calls === 1
        ? new Response(null, { status: 302, headers: { location: "/second-hop" } })
        : new Response("<html>too late</html>", {
            headers: { "content-type": "text/html" },
          });
    });

    try {
      await expect(
        fetchPublicResource("https://shop.example.com", {
          resolver: publicResolver,
          fetchImpl: fetchImpl as unknown as typeof fetch,
          timeoutMs: 8_000,
          deadlineAtMs: startedAtMs + 1_000,
        }),
      ).rejects.toMatchObject({ code: "SCAN_DEADLINE_EXCEEDED" });
      expect(fetchImpl).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it("returns a bounded public response", async () => {
    const resource = await fetchPublicResource("https://shop.example.com", {
      resolver: publicResolver,
      fetchImpl: (async () =>
        new Response("<html>ok</html>", {
          headers: { "content-type": "text/html" },
        })) as typeof fetch,
      maxBytes: 100,
    });
    expect(resource.body).toContain("ok");
    expect(resource.url).toBe("https://shop.example.com/");
  });

  it("stops an oversized streaming response", async () => {
    await expect(
      fetchPublicResource("https://shop.example.com", {
        resolver: publicResolver,
        fetchImpl: (async () => new Response("x".repeat(101))) as typeof fetch,
        maxBytes: 100,
      }),
    ).rejects.toBeInstanceOf(ScannerError);
  });

  it("cancels an oversized response body before releasing the socket", async () => {
    const cancelled = vi.fn();
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode("too large"));
      },
      cancel: cancelled,
    });
    await expect(
      fetchPublicResource("https://shop.example.com", {
        resolver: publicResolver,
        fetchImpl: (async () =>
          new Response(stream, { headers: { "content-length": "1000" } })) as typeof fetch,
        maxBytes: 100,
      }),
    ).rejects.toMatchObject({ code: "RESPONSE_TOO_LARGE" });
    expect(cancelled).toHaveBeenCalledOnce();
  });
});
