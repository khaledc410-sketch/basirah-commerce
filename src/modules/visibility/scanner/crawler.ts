import "server-only";

import { ScannerError } from "./errors";
import { extractSitemapLocations, inspectHtml } from "./html";
import { createPublicResourceFetcher, type PublicResourceFetcher } from "./network";
import { parseRobotsTxt } from "./robots";
import type { CrawlResult } from "./types";
import { normalizePublicUrl } from "./url";

const blockedAssetExtension = /\.(?:avif|css|csv|docx?|gif|ico|jpe?g|js|json|mp4|pdf|png|svg|webp|xlsx?|xml)(?:$|\?)/iu;

export interface CrawlProgress {
  progress: number;
  currentStep: string;
}

export interface CrawlOptions {
  fetchResource?: PublicResourceFetcher;
  maxPages?: number;
  totalTimeoutMs?: number;
  onProgress?: (progress: CrawlProgress) => void | Promise<void>;
  now?: () => Date;
}

function isSameSite(url: URL, root: URL) {
  const siteHost = (hostname: string) => hostname.toLowerCase().replace(/^www\./u, "");
  return (
    siteHost(url.hostname) === siteHost(root.hostname) &&
    url.protocol === root.protocol &&
    url.port === root.port &&
    ["http:", "https:"].includes(url.protocol)
  );
}

function candidateUrl(value: string, root: URL) {
  try {
    const url = candidateResourceUrl(value, root);
    if (!isSameSite(url, root) || blockedAssetExtension.test(`${url.pathname}${url.search}`)) return null;
    // The public product accepts a domain, not private/sessionized URLs.
    // Dropping discovered query strings avoids retaining accidental PII and
    // prevents parameter-space crawl amplification.
    url.search = "";
    return url;
  } catch {
    return null;
  }
}

function candidateResourceUrl(value: string, root: URL) {
  const url = normalizePublicUrl(new URL(value, root).toString());
  if (!isSameSite(url, root)) {
    throw new ScannerError("CROSS_SITE_URL", "تجاهل الفاحص رابطًا خارج نطاق المتجر.");
  }
  url.hash = "";
  return url;
}

function sitemapSampleOrder(urls: URL[]) {
  const pathKind = (url: URL) => {
    const path = decodeURIComponent(url.pathname).toLowerCase();
    if (/\/(?:products?\/|p\d+(?:\/|$))/u.test(path)) return "product";
    if (/\/(?:categories?\/|collections?\/|c\d+(?:\/|$))/u.test(path)) return "category";
    if (/\/(?:blog|articles?|insights?)\//u.test(path)) return "article";
    return "other";
  };
  const groups = {
    product: urls.filter((url) => pathKind(url) === "product"),
    category: urls.filter((url) => pathKind(url) === "category"),
    article: urls.filter((url) => pathKind(url) === "article"),
  };
  const preferred = [
    ...groups.product.slice(0, 4),
    ...groups.category.slice(0, 3),
    ...groups.article.slice(0, 2),
  ];
  const preferredUrls = new Set(preferred.map((url) => url.toString()));
  return [...preferred, ...urls.filter((url) => !preferredUrls.has(url.toString()))];
}

const recoverableResourceErrorCodes = new Set([
  "FETCH_FAILED",
  "DNS_UNAVAILABLE",
  "RESPONSE_TOO_LARGE",
  "TOO_MANY_REDIRECTS",
  "INVALID_REDIRECT",
  "CROSS_SITE_REDIRECT",
  "ROBOTS_DISALLOWED",
]);

function isRecoverableResourceError(error: unknown) {
  return error instanceof ScannerError && recoverableResourceErrorCodes.has(error.code);
}

export async function crawlWebsite(input: string, options: CrawlOptions = {}): Promise<CrawlResult> {
  const root = normalizePublicUrl(input);
  const fetchResource = options.fetchResource ?? createPublicResourceFetcher();
  const maxPages = Math.min(10, Math.max(1, options.maxPages ?? 10));
  const totalTimeoutMs = Math.min(115_000, Math.max(1_000, options.totalTimeoutMs ?? 110_000));
  const deadline = Date.now() + totalTimeoutMs;
  const onProgress = options.onProgress ?? (() => undefined);
  const now = options.now ?? (() => new Date());
  const robotsUrl = new URL("/robots.txt", root);
  const fetchWithinDeadline: PublicResourceFetcher = async (url, requestOptions = {}) => {
    const requestedDeadline = Number.isFinite(requestOptions.deadlineAtMs)
      ? requestOptions.deadlineAtMs!
      : deadline;
    const requestDeadline = Math.min(deadline, requestedDeadline);
    const remainingMs = requestDeadline - Date.now();
    if (remainingMs <= 0) {
      throw new ScannerError(
        "SCAN_DEADLINE_EXCEEDED",
        "تجاوز الفحص المدة القصوى المسموحة.",
      );
    }
    const response = await fetchResource(url, {
      ...requestOptions,
      timeoutMs: Math.max(
        1,
        Math.min(requestOptions.timeoutMs ?? 8_000, remainingMs),
      ),
      deadlineAtMs: requestDeadline,
    });
    if (Date.now() >= requestDeadline) {
      throw new ScannerError(
        "SCAN_DEADLINE_EXCEEDED",
        "تجاوز الفحص المدة القصوى المسموحة.",
      );
    }
    return response;
  };

  await onProgress({ progress: 8, currentStep: "التحقق من إمكانية الوصول الآمن" });
  const robotsResponse = await fetchWithinDeadline(robotsUrl, {
    maxBytes: 250_000,
    beforeRequest: (url) => {
      if (!isSameSite(url, root)) {
        throw new ScannerError("CROSS_SITE_REDIRECT", "أوقف الفحص عند إعادة توجيه خارج نطاق المتجر.");
      }
    },
  });
  if (robotsResponse.status >= 500 || robotsResponse.status === 429) {
    throw new ScannerError(
      "ROBOTS_UNAVAILABLE",
      "تعذر قراءة robots.txt مؤقتًا، لذلك لم نتجاوز تعليمات الزحف.",
    );
  }
  const robotsStatus = robotsResponse.status >= 200 && robotsResponse.status < 300 ? "available" : "not_found";
  const robotsSource = robotsStatus === "available" ? robotsResponse.body : "";
  const robots = parseRobotsTxt(robotsSource);
  const robotsAccess: NonNullable<CrawlResult["robots"]["access"]> = {
    retrieval: {
      googlebot: parseRobotsTxt(robotsSource, "Googlebot").isAllowed(root),
      oaiSearchBot: parseRobotsTxt(robotsSource, "OAI-SearchBot").isAllowed(root),
    },
    training: {
      gptBot: parseRobotsTxt(robotsSource, "GPTBot").isAllowed(root),
      googleExtended: parseRobotsTxt(robotsSource, "Google-Extended").isAllowed(root),
    },
  };
  if (!robots.isAllowed(root)) {
    throw new ScannerError("ROBOTS_DISALLOWED", "يمنع robots.txt فحص الصفحة المدخلة.");
  }

  await onProgress({ progress: 16, currentStep: "اكتشاف خريطة الموقع والصفحات" });
  const sitemapQueue = [
    ...robots.sitemaps,
    new URL("/sitemap.xml", root).toString(),
  ];
  const visitedSitemaps = new Set<string>();
  const sitemapPageUrls: string[] = [];
  let availableSitemaps = 0;
  let sitemapUnavailable = false;

  while (sitemapQueue.length && visitedSitemaps.size < 3) {
    const rawSitemapUrl = sitemapQueue.shift();
    if (!rawSitemapUrl) break;
    let sitemapUrl: URL;
    try {
      sitemapUrl = candidateResourceUrl(rawSitemapUrl, root);
    } catch {
      continue;
    }
    if (!sitemapUrl || visitedSitemaps.has(sitemapUrl.toString())) continue;
    visitedSitemaps.add(sitemapUrl.toString());
    let response;
    try {
      response = await fetchWithinDeadline(sitemapUrl, {
        maxBytes: 1_000_000,
        beforeRequest: (url) => {
          if (!isSameSite(url, root)) {
            throw new ScannerError("CROSS_SITE_REDIRECT", "أوقف الفحص عند إعادة توجيه خارج نطاق المتجر.");
          }
        },
      });
    } catch (error) {
      if (isRecoverableResourceError(error)) {
        sitemapUnavailable = true;
        continue;
      }
      throw error;
    }
    if (response.status < 200 || response.status >= 300) {
      if (![404, 410].includes(response.status)) sitemapUnavailable = true;
      continue;
    }
    availableSitemaps += 1;
    const locations = extractSitemapLocations(response.body).slice(0, 500);
    const looksLikeIndex = /<sitemapindex\b/iu.test(response.body);
    if (looksLikeIndex) {
      sitemapQueue.push(...locations.slice(0, 2));
    } else {
      sitemapPageUrls.push(...locations);
    }
  }

  const candidateQueue: URL[] = [root];
  const queued = new Set([root.toString()]);
  const sitemapCandidates: URL[] = [];
  for (const rawUrl of sitemapPageUrls) {
    const url = candidateUrl(rawUrl, root);
    if (url && robots.isAllowed(url) && !queued.has(url.toString())) {
      sitemapCandidates.push(url);
      queued.add(url.toString());
    }
  }
  candidateQueue.push(...sitemapSampleOrder(sitemapCandidates));

  const pages: CrawlResult["pages"] = [];
  const visitedPageUrls = new Set<string>();
  const unavailablePageUrls = new Set<string>();
  let rootPageStatus: "available" | "unavailable" = "unavailable";
  let attemptedPages = 0;
  while (candidateQueue.length && pages.length < maxPages && attemptedPages < 30) {
    const url = candidateQueue.shift();
    if (!url || !robots.isAllowed(url)) continue;
    attemptedPages += 1;
    let response;
    try {
      response = await fetchWithinDeadline(url, {
        maxBytes: 1_000_000,
        beforeRequest: (redirectUrl) => {
          if (!isSameSite(redirectUrl, root)) {
            throw new ScannerError("CROSS_SITE_REDIRECT", "أوقف الفحص عند إعادة توجيه خارج نطاق المتجر.");
          }
          if (!robots.isAllowed(redirectUrl)) {
            throw new ScannerError("ROBOTS_DISALLOWED", "منع robots.txt إحدى صفحات الفحص.");
          }
        },
      });
    } catch (error) {
      if (isRecoverableResourceError(error)) {
        unavailablePageUrls.add(url.toString());
        continue;
      }
      throw error;
    }
    if (response.status < 200 || response.status >= 300) {
      unavailablePageUrls.add(url.toString());
      continue;
    }
    const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
    const looksLikeHtml = /text\/html|application\/xhtml\+xml/u.test(contentType) || (!contentType && /<(?:!doctype\s+html|html)\b/iu.test(response.body));
    if (!looksLikeHtml) {
      unavailablePageUrls.add(url.toString());
      continue;
    }
    const finalUrl = candidateUrl(response.url, root);
    if (!finalUrl) {
      unavailablePageUrls.add(url.toString());
      continue;
    }
    const finalUrlString = finalUrl.toString();
    if (visitedPageUrls.has(finalUrlString)) continue;
    const page = {
      ...inspectHtml(response.body, finalUrlString, response.status, contentType || "text/html"),
      bytesRead: response.bytesRead,
      durationMs: response.durationMs,
    };
    visitedPageUrls.add(finalUrlString);
    pages.push(page);
    if (finalUrlString === root.toString()) rootPageStatus = "available";
    for (const link of page.internalLinks) {
      const discovered = candidateUrl(link, root);
      if (discovered && robots.isAllowed(discovered) && !queued.has(discovered.toString())) {
        candidateQueue.push(discovered);
        queued.add(discovered.toString());
      }
    }
    await onProgress({
      progress: Math.min(82, 24 + Math.round((pages.length / maxPages) * 58)),
      currentStep: `قراءة الصفحات (${pages.length}/${maxPages})`,
    });
  }

  if (pages.length === 0) {
    throw new ScannerError("NO_HTML_PAGES", "لم نعثر على صفحة HTML عامة قابلة للفحص.");
  }

  return {
    requestedUrl: root.toString(),
    domain: root.hostname,
    robots: {
      status: robotsStatus,
      url: robotsUrl.toString(),
      access: robotsAccess,
    },
    sitemap: {
      status:
        availableSitemaps > 0
          ? "available"
          : sitemapUnavailable
            ? "unavailable"
            : "not_found",
      urlsDiscovered: new Set(sitemapPageUrls).size,
    },
    pages,
    attemptedPages,
    rootPageStatus,
    unavailablePageUrls: [...unavailablePageUrls],
    scannedAt: now().toISOString(),
  };
}
