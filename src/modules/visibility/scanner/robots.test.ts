import { describe, expect, it } from "vitest";

import { parseRobotsTxt } from "./robots";

describe("robots policy", () => {
  it("uses the most specific matching rule and collects sitemaps", () => {
    const policy = parseRobotsTxt(`
      User-agent: *
      Disallow: /private/
      Allow: /private/public$
      Sitemap: https://shop.example.com/sitemap.xml
    `);

    expect(policy.isAllowed(new URL("https://shop.example.com/private/item"))).toBe(false);
    expect(policy.isAllowed(new URL("https://shop.example.com/private/public"))).toBe(true);
    expect(policy.sitemaps).toEqual(["https://shop.example.com/sitemap.xml"]);
  });

  it("prefers a dedicated bot group over wildcard rules", () => {
    const policy = parseRobotsTxt(`
      User-agent: *
      Disallow: /
      User-agent: BasirahVisibilityBot
      Allow: /
    `);
    expect(policy.isAllowed(new URL("https://shop.example.com/product"))).toBe(true);
  });
});
