import type { MetadataRoute } from "next";

import { getServerEnv } from "@/config/env";
import { normalizeAppOrigin } from "@/lib/site-url";

export const dynamic = "force-dynamic";

const lastModified = new Date("2026-07-14T00:00:00.000Z");
const localizedPaths = [
  "",
  "/pricing",
  "/methodology",
  "/privacy",
  "/terms",
  "/support",
] as const;

export function buildSitemap(appUrl: string): MetadataRoute.Sitemap {
  const origin = normalizeAppOrigin(appUrl);
  return localizedPaths.flatMap((path) =>
    (["ar", "en"] as const).map((locale) => ({
      url: `${origin}/${locale}${path}`,
      lastModified,
      changeFrequency: path === "" ? ("weekly" as const) : ("monthly" as const),
      priority: path === "" ? 1 : path === "/methodology" ? 0.8 : 0.7,
      alternates: {
        languages: {
          ar: `${origin}/ar${path}`,
          en: `${origin}/en${path}`,
        },
      },
    })),
  );
}

export default function sitemap(): MetadataRoute.Sitemap {
  return buildSitemap(getServerEnv().APP_URL);
}
