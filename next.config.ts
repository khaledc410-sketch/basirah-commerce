import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const isDevelopment = process.env.NODE_ENV === "development";
const contentSecurityPolicyDirectives = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  `connect-src 'self' https://*.supabase.co${isDevelopment ? " ws: wss:" : ""}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "worker-src 'self' blob:",
  ...(isDevelopment ? [] : ["upgrade-insecure-requests"]),
];

function contentSecurityPolicy(frameAncestors: string) {
  return [...contentSecurityPolicyDirectives, `frame-ancestors ${frameAncestors}`].join("; ");
}

const nextConfig: NextConfig = {
  poweredByHeader: false,
  turbopack: {
    root: process.cwd(),
  },
  images: {
    formats: ["image/avif", "image/webp"],
  },
  outputFileTracingIncludes: {
    "/api/v1/stores/*/reports/*/pdf": [
      "./node_modules/@ibm/plex-sans-arabic/fonts/complete/woff/IBMPlexSansArabic-Regular.woff",
      "./node_modules/@ibm/plex-sans-arabic/fonts/complete/woff/IBMPlexSansArabic-SemiBold.woff",
    ],
    "/api/v1/public/reports/*/pdf": [
      "./node_modules/@ibm/plex-sans-arabic/fonts/complete/woff/IBMPlexSansArabic-Regular.woff",
      "./node_modules/@ibm/plex-sans-arabic/fonts/complete/woff/IBMPlexSansArabic-SemiBold.woff",
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Content-Security-Policy", value: contentSecurityPolicy("'none'") },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Resource-Policy", value: "same-site" },
          ...(isDevelopment
            ? []
            : [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]),
        ],
      },
      {
        source: "/salla/embedded",
        headers: [
          { key: "Cache-Control", value: "private, no-store, max-age=0" },
          { key: "Cross-Origin-Resource-Policy", value: "cross-origin" },
          {
            key: "Content-Security-Policy",
            value: contentSecurityPolicy(
              "'self' https://salla.sa https://*.salla.sa",
            ),
          },
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
        ],
      },
    ];
  },
};

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

export default withNextIntl(nextConfig);
