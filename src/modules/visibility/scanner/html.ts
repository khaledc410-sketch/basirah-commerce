import "server-only";

import { createHash } from "node:crypto";

import type { PageInspection } from "./types";

function decodeHtml(value: string) {
  const codePoint = (raw: string, radix: number) => {
    const parsed = Number.parseInt(raw, radix);
    return Number.isInteger(parsed) && parsed >= 0 && parsed <= 0x10ffff
      ? String.fromCodePoint(parsed)
      : "�";
  };
  return value
    .replace(/&nbsp;/giu, " ")
    .replace(/&amp;/giu, "&")
    .replace(/&quot;/giu, '"')
    .replace(/&#39;|&apos;/giu, "'")
    .replace(/&lt;/giu, "<")
    .replace(/&gt;/giu, ">")
    .replace(/&#(\d+);/gu, (_, code: string) => codePoint(code, 10))
    .replace(/&#x([\da-f]+);/giu, (_, code: string) => codePoint(code, 16));
}

function boundedMatches(source: string, expression: RegExp, limit: number) {
  const matches: RegExpExecArray[] = [];
  for (const match of source.matchAll(expression)) {
    matches.push(match);
    if (matches.length >= limit) break;
  }
  return matches;
}

function compactText(value: string) {
  return decodeHtml(value.replace(/<[^>]*>/gu, " ")).replace(/\s+/gu, " ").trim();
}

function attribute(tag: string, name: string) {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "iu"));
  return match ? decodeHtml(match[1] ?? match[2] ?? match[3] ?? "").trim() : null;
}

function firstContent(html: string, expression: RegExp) {
  const match = expression.exec(html);
  return match ? compactText(match[1] ?? "") || null : null;
}

function extractJsonLdTypes(value: unknown, output: Set<string>) {
  const stack: Array<{ value: unknown; depth: number }> = [{ value, depth: 0 }];
  let visited = 0;
  while (stack.length && visited < 5_000) {
    const current = stack.pop();
    if (!current || current.depth > 32) continue;
    visited += 1;
    if (Array.isArray(current.value)) {
      current.value.slice(0, 500).forEach((entry) =>
        stack.push({ value: entry, depth: current.depth + 1 }),
      );
      continue;
    }
    if (!current.value || typeof current.value !== "object") continue;
    const record = current.value as Record<string, unknown>;
    const type = record["@type"];
    if (typeof type === "string") output.add(type);
    if (Array.isArray(type)) {
      type
        .slice(0, 50)
        .filter((entry): entry is string => typeof entry === "string")
        .forEach((entry) => output.add(entry));
    }
    Object.values(record)
      .slice(0, 500)
      .forEach((entry) => stack.push({ value: entry, depth: current.depth + 1 }));
  }
}

function safeInternalUrl(href: string, pageUrl: URL) {
  try {
    const url = new URL(href, pageUrl);
    if (!["http:", "https:"].includes(url.protocol) || url.hostname !== pageUrl.hostname) return null;
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

export function inspectHtml(html: string, urlValue: string, statusCode: number, contentType: string): PageInspection {
  const url = new URL(urlValue);
  const title = firstContent(html, /<title\b[^>]*>([\s\S]*?)<\/title>/iu);
  const metaTags = boundedMatches(html, /<meta\b[^>]*>/giu, 500);
  const linkTags = boundedMatches(html, /<link\b[^>]*>/giu, 1_000);
  const descriptionTag = metaTags.find((match) =>
    ["description", "og:description"].includes((attribute(match[0], "name") ?? attribute(match[0], "property") ?? "").toLowerCase()),
  );
  const canonicalTag = linkTags.find((match) =>
    (attribute(match[0], "rel") ?? "").toLowerCase().split(/\s+/u).includes("canonical"),
  );
  const hreflangLocales = linkTags
    .filter((match) =>
      (attribute(match[0], "rel") ?? "")
        .toLowerCase()
        .split(/\s+/u)
        .includes("alternate"),
    )
    .map((match) => attribute(match[0], "hreflang")?.toLowerCase())
    .filter((value): value is string => Boolean(value));
  const robotsDirectives = metaTags
    .filter((match) =>
      ["robots", "googlebot"].includes(
        (attribute(match[0], "name") ?? "").toLowerCase(),
      ),
    )
    .flatMap((match) =>
      (attribute(match[0], "content") ?? "")
        .toLowerCase()
        .split(/[,\s]+/u)
        .filter(Boolean),
    );
  const language = attribute(html.match(/<html\b[^>]*>/iu)?.[0] ?? "", "lang");
  const headings = boundedMatches(html, /<h[1-6]\b[^>]*>([\s\S]*?)<\/h[1-6]>/giu, 300)
    .map((match) => compactText(match[1] ?? ""))
    .filter(Boolean);
  const h1Count = boundedMatches(html, /<h1\b[^>]*>/giu, 100).length;
  const jsonLdTypes = new Set<string>();
  let jsonLdBlocks = 0;
  let invalidJsonLdBlocks = 0;
  for (const match of boundedMatches(html, /<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/giu, 50)) {
    jsonLdBlocks += 1;
    try {
      extractJsonLdTypes(JSON.parse(match[1] ?? ""), jsonLdTypes);
    } catch {
      invalidJsonLdBlocks += 1;
    }
  }

  const htmlWithoutNoise = html
    .replace(/<(script|style|template|noscript)\b[^>]*>[\s\S]*?<\/\1>/giu, " ")
    .replace(/<!--([\s\S]*?)-->/gu, " ");
  const visibleText = compactText(htmlWithoutNoise);
  const nonWhitespace = visibleText.replace(/\s/gu, "");
  const arabicCharacters = (nonWhitespace.match(/[\u0600-\u06ff]/gu) ?? []).length;
  const internalLinks = boundedMatches(html, /<a\b[^>]*>/giu, 1_000)
    .map((match) => attribute(match[0], "href"))
    .filter((href): href is string => Boolean(href))
    .map((href) => safeInternalUrl(href, url))
    .filter((href): href is string => Boolean(href));
  const lowerLinkText = `${internalLinks.join(" ")} ${visibleText}`.toLowerCase();
  const policyMatchers = {
    privacy: /privacy|خصوصي(?:ة|ات)/u,
    returns: /return|refund|استرجاع|استبدال/u,
    shipping: /shipping|delivery|شحن|توصيل/u,
    terms: /terms|شروط|أحكام/u,
  } as const;
  const policyKinds = Object.entries(policyMatchers)
    .filter(([, matcher]) => matcher.test(lowerLinkText))
    .map(([kind]) => kind as PageInspection["policyKinds"][number]);

  return {
    url: url.toString(),
    statusCode,
    contentType,
    checksum: createHash("sha256").update(html).digest("hex"),
    title,
    description: descriptionTag ? attribute(descriptionTag[0], "content") : null,
    canonical: canonicalTag ? attribute(canonicalTag[0], "href") : null,
    language,
    hreflangLocales: [...new Set(hreflangLocales)],
    robotsDirectives: [...new Set(robotsDirectives)],
    visibleText,
    wordCount: visibleText ? visibleText.split(/\s+/u).length : 0,
    arabicCharacterRatio: nonWhitespace.length ? arabicCharacters / nonWhitespace.length : 0,
    headings,
    h1Count,
    questionHeadingCount: headings.filter((heading) => /\?|؟|كيف|ما |ماذا|هل |why|how|what/iu.test(heading)).length,
    jsonLdTypes: [...jsonLdTypes].sort(),
    jsonLdBlocks,
    invalidJsonLdBlocks,
    internalLinks: [...new Set(internalLinks)],
    hasEmail: /[\w.+-]+@[\w.-]+\.[a-z]{2,}/iu.test(visibleText) || /mailto:/iu.test(html),
    hasPhone: /(?:\+?966|00966|05)\s*\d[\d\s-]{7,}/u.test(visibleText) || /tel:/iu.test(html),
    policyKinds,
  };
}

export function extractSitemapLocations(xml: string, limit = 1_000) {
  return boundedMatches(xml, /<loc\b[^>]*>([\s\S]*?)<\/loc>/giu, limit)
    .map((match) => compactText(match[1] ?? ""))
    .filter(Boolean);
}
