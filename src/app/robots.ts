import type { MetadataRoute } from "next";

import { getServerEnv } from "@/config/env";
import { normalizeAppOrigin } from "@/lib/site-url";

export const dynamic = "force-dynamic";

export function buildRobots(appUrl: string): MetadataRoute.Robots {
  const origin = normalizeAppOrigin(appUrl);
  return {
    rules: {
      userAgent: "*",
      allow: ["/ar", "/en"],
      disallow: [
        "/api/",
        "/auth/",
        "/dashboard/",
        "/setup/",
        "/salla/",
        "/demo",
        "/signin",
        "/ar/signin",
        "/en/signin",
        "/ar/check/",
        "/en/check/",
        "/ar/report/",
        "/en/report/",
        "/insights/",
      ],
    },
    sitemap: `${origin}/sitemap.xml`,
    host: origin,
  };
}

export default function robots(): MetadataRoute.Robots {
  return buildRobots(getServerEnv().APP_URL);
}
