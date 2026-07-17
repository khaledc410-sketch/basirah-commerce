import { describe, expect, it } from "vitest";

import { buildRobots } from "./robots";
import { buildSitemap } from "./sitemap";

describe("public search metadata", () => {
  it("publishes only localized public routes in the sitemap", () => {
    const entries = buildSitemap("https://basirah.example/app-path");
    expect(entries.map((entry) => entry.url)).toEqual([
      "https://basirah.example/ar",
      "https://basirah.example/en",
      "https://basirah.example/ar/pricing",
      "https://basirah.example/en/pricing",
      "https://basirah.example/ar/methodology",
      "https://basirah.example/en/methodology",
      "https://basirah.example/ar/privacy",
      "https://basirah.example/en/privacy",
      "https://basirah.example/ar/terms",
      "https://basirah.example/en/terms",
      "https://basirah.example/ar/support",
      "https://basirah.example/en/support",
    ]);
    expect(entries.every((entry) => entry.alternates?.languages?.ar && entry.alternates.languages.en)).toBe(true);
  });

  it("allows public locales while excluding private and preview surfaces", () => {
    const metadata = buildRobots("https://basirah.example/ignored");
    expect(metadata.sitemap).toBe("https://basirah.example/sitemap.xml");
    expect(metadata.rules).toMatchObject({
      allow: ["/ar", "/en"],
      disallow: expect.arrayContaining(["/api/", "/dashboard/", "/ar/report/", "/en/check/"]),
    });
  });
});
