import { describe, expect, it, vi } from "vitest";

import { crawlWebsite } from "./crawler";
import { ScannerError } from "./errors";
import type { PublicResourceFetcher } from "./network";

function pageHtml(index: number) {
  return `<!doctype html><html lang="ar"><head><title>منتج ${index}</title><meta name="description" content="وصف المنتج"><link rel="canonical" href="https://shop.example.com/p/${index}"></head><body><h1>منتج ${index}</h1><a href="/p/${index + 1}">التالي</a>${"محتوى عربي مفيد ".repeat(90)}</body></html>`;
}

describe("bounded site crawler", () => {
  it("honors robots, reads sitemap, and never exceeds ten HTML pages", async () => {
    const requested: string[] = [];
    const fetchResource = vi.fn(async (input: string | URL, options) => {
      const url = new URL(input.toString());
      await options?.beforeRequest?.(url);
      requested.push(url.pathname);
      if (url.pathname === "/robots.txt") {
        return {
          url: url.toString(),
          status: 200,
          headers: new Headers({ "content-type": "text/plain" }),
          body: "User-agent: *\nDisallow: /p/2\nSitemap: https://shop.example.com/sitemap.xml",
        };
      }
      if (url.pathname === "/sitemap.xml") {
        return {
          url: url.toString(),
          status: 200,
          headers: new Headers({ "content-type": "application/xml" }),
          body: `<urlset>${Array.from({ length: 15 }, (_, index) => `<url><loc>https://shop.example.com/p/${index + 1}</loc></url>`).join("")}</urlset>`,
        };
      }
      return {
        url: url.toString(),
        status: 200,
        headers: new Headers({ "content-type": "text/html" }),
        body: pageHtml(Number(url.pathname.split("/").at(-1) ?? 0)),
      };
    }) as unknown as PublicResourceFetcher;

    const result = await crawlWebsite("https://shop.example.com", { fetchResource });
    expect(result.pages).toHaveLength(10);
    expect(result.sitemap.status).toBe("available");
    expect(result.robots.access).toEqual({
      retrieval: { googlebot: true, oaiSearchBot: true },
      training: { gptBot: true, googleExtended: true },
    });
    expect(requested).not.toContain("/p/2");
  });

  it("separates search crawler access from model-training controls", async () => {
    const fetchResource = vi.fn(async (input: string | URL, options) => {
      const url = new URL(input.toString());
      await options?.beforeRequest?.(url);
      if (url.pathname === "/robots.txt") {
        return {
          url: url.toString(),
          status: 200,
          headers: new Headers({ "content-type": "text/plain" }),
          body: [
            "User-agent: OAI-SearchBot",
            "Disallow: /",
            "User-agent: GPTBot",
            "Disallow: /",
            "User-agent: Google-Extended",
            "Disallow: /",
            "User-agent: *",
            "Allow: /",
          ].join("\n"),
        };
      }
      if (url.pathname === "/sitemap.xml") {
        return { url: url.toString(), status: 404, headers: new Headers(), body: "" };
      }
      return {
        url: url.toString(),
        status: 200,
        headers: new Headers({ "content-type": "text/html" }),
        body: pageHtml(0),
      };
    }) as unknown as PublicResourceFetcher;

    const result = await crawlWebsite("https://shop.example.com", {
      fetchResource,
      maxPages: 1,
    });

    expect(result.robots.access).toEqual({
      retrieval: { googlebot: true, oaiSearchBot: false },
      training: { gptBot: false, googleExtended: false },
    });
  });

  it("stops before the absolute whole-scan deadline", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-13T00:00:00.000Z"));
    const fetchResource = vi.fn(async (input: string | URL) => {
      const url = new URL(input.toString());
      vi.setSystemTime(new Date(Date.now() + 1_100));
      return { url: url.toString(), status: 404, headers: new Headers(), body: "" };
    }) as unknown as PublicResourceFetcher;

    try {
      await expect(
        crawlWebsite("https://shop.example.com", {
          fetchResource,
          totalTimeoutMs: 1_000,
        }),
      ).rejects.toMatchObject({ code: "SCAN_DEADLINE_EXCEEDED" });
    } finally {
      vi.useRealTimers();
    }
  });

  it("marks a temporarily unreadable sitemap as unknown rather than missing", async () => {
    const fetchResource = vi.fn(async (input: string | URL, options) => {
      const url = new URL(input.toString());
      await options?.beforeRequest?.(url);
      if (url.pathname === "/robots.txt") {
        return { url: url.toString(), status: 404, headers: new Headers(), body: "" };
      }
      if (url.pathname === "/sitemap.xml") {
        throw new ScannerError("FETCH_FAILED", "تعذر الاتصال مؤقتًا.");
      }
      return {
        url: url.toString(),
        status: 200,
        headers: new Headers({ "content-type": "text/html" }),
        body: pageHtml(0),
      };
    }) as unknown as PublicResourceFetcher;

    const result = await crawlWebsite("https://shop.example.com", {
      fetchResource,
      maxPages: 1,
    });

    expect(result.sitemap.status).toBe("unavailable");
    expect(result.rootPageStatus).toBe("available");
  });

  it("continues when a discovered page exceeds the redirect limit", async () => {
    const fetchResource = vi.fn(async (input: string | URL, options) => {
      const url = new URL(input.toString());
      await options?.beforeRequest?.(url);
      if (url.pathname === "/robots.txt") {
        return { url: url.toString(), status: 404, headers: new Headers(), body: "" };
      }
      if (url.pathname === "/sitemap.xml") {
        return {
          url: url.toString(),
          status: 200,
          headers: new Headers({ "content-type": "application/xml" }),
          body: [
            "<urlset>",
            "<url><loc>https://shop.example.com/p/loop</loc></url>",
            "<url><loc>https://shop.example.com/p/healthy</loc></url>",
            "</urlset>",
          ].join(""),
        };
      }
      if (url.pathname === "/p/loop") {
        throw new ScannerError("TOO_MANY_REDIRECTS", "حلقة إعادة توجيه");
      }
      return {
        url: url.toString(),
        status: 200,
        headers: new Headers({ "content-type": "text/html" }),
        body: pageHtml(url.pathname === "/" ? 0 : 1),
      };
    }) as unknown as PublicResourceFetcher;

    const result = await crawlWebsite("https://shop.example.com", {
      fetchResource,
      maxPages: 2,
    });

    expect(result.pages.map((page) => new URL(page.url).pathname)).toEqual(["/", "/p/healthy"]);
    expect(result.unavailablePageUrls).toContain("https://shop.example.com/p/loop");
  });

  it("marks a redirect-looping sitemap unavailable and still scans the root", async () => {
    const fetchResource = vi.fn(async (input: string | URL, options) => {
      const url = new URL(input.toString());
      await options?.beforeRequest?.(url);
      if (url.pathname === "/robots.txt") {
        return { url: url.toString(), status: 404, headers: new Headers(), body: "" };
      }
      if (url.pathname === "/sitemap.xml") {
        throw new ScannerError("TOO_MANY_REDIRECTS", "حلقة إعادة توجيه");
      }
      return {
        url: url.toString(),
        status: 200,
        headers: new Headers({ "content-type": "text/html" }),
        body: pageHtml(0),
      };
    }) as unknown as PublicResourceFetcher;

    const result = await crawlWebsite("https://shop.example.com", {
      fetchResource,
      maxPages: 1,
    });

    expect(result.sitemap.status).toBe("unavailable");
    expect(result.rootPageStatus).toBe("available");
  });

  it("prioritizes product evidence and does not count redirect duplicates as pages", async () => {
    const fetchResource = vi.fn(async (input: string | URL, options) => {
      const url = new URL(input.toString());
      await options?.beforeRequest?.(url);
      if (url.pathname === "/robots.txt") {
        return { url: url.toString(), status: 404, headers: new Headers(), body: "" };
      }
      if (url.pathname === "/sitemap.xml") {
        const genericPages = Array.from(
          { length: 12 },
          (_, index) => `<url><loc>https://shop.example.com/page-${index}</loc></url>`,
        ).join("");
        return {
          url: url.toString(),
          status: 200,
          headers: new Headers({ "content-type": "application/xml" }),
          body: `<urlset>${genericPages}<url><loc>https://shop.example.com/ar/-/p123</loc></url></urlset>`,
        };
      }
      if (url.pathname === "/page-0") {
        return {
          url: "https://shop.example.com/",
          status: 200,
          headers: new Headers({ "content-type": "text/html" }),
          body: pageHtml(0),
        };
      }
      return {
        url: url.toString(),
        status: 200,
        headers: new Headers({ "content-type": "text/html" }),
        body: pageHtml(url.pathname.includes("p123") ? 123 : 1),
      };
    }) as unknown as PublicResourceFetcher;

    const result = await crawlWebsite("https://shop.example.com", {
      fetchResource,
      maxPages: 3,
    });

    expect(result.pages.some((page) => page.url.endsWith("/ar/-/p123"))).toBe(true);
    expect(new Set(result.pages.map((page) => page.url)).size).toBe(result.pages.length);
  });

  it("counts a non-HTML root as unavailable without treating another page as root", async () => {
    const fetchResource = vi.fn(async (input: string | URL, options) => {
      const url = new URL(input.toString());
      await options?.beforeRequest?.(url);
      if (url.pathname === "/robots.txt") {
        return { url: url.toString(), status: 404, headers: new Headers(), body: "" };
      }
      if (url.pathname === "/sitemap.xml") {
        return {
          url: url.toString(),
          status: 200,
          headers: new Headers({ "content-type": "application/xml" }),
          body: "<urlset><url><loc>https://shop.example.com/p/1</loc></url></urlset>",
        };
      }
      if (url.pathname === "/") {
        return {
          url: url.toString(),
          status: 200,
          headers: new Headers({ "content-type": "application/json" }),
          body: "{}",
        };
      }
      return {
        url: url.toString(),
        status: 200,
        headers: new Headers({ "content-type": "text/html" }),
        body: pageHtml(1),
      };
    }) as unknown as PublicResourceFetcher;

    const result = await crawlWebsite("https://shop.example.com", {
      fetchResource,
      maxPages: 1,
    });

    expect(result.pages.map((page) => page.url)).toEqual(["https://shop.example.com/p/1"]);
    expect(result.rootPageStatus).toBe("unavailable");
    expect(result.attemptedPages).toBe(2);
    expect(result.unavailablePageUrls).toContain("https://shop.example.com/");
  });
});
