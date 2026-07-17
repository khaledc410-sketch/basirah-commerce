import "server-only";

import { lookup } from "node:dns/promises";
import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import { Readable } from "node:stream";

import { ScannerError } from "./errors";
import { assertPublicHostname, isPublicIpAddress, normalizePublicUrl } from "./url";

export interface ResolvedAddress {
  address: string;
  family: number;
}

export type DnsResolver = (hostname: string) => Promise<readonly ResolvedAddress[]>;

export interface PublicResource {
  url: string;
  status: number;
  headers: Headers;
  body: string;
  bytesRead?: number;
  durationMs?: number;
}

export interface PublicFetchOptions {
  fetchImpl?: typeof fetch;
  resolver?: DnsResolver;
  maxRedirects?: number;
  maxBytes?: number;
  timeoutMs?: number;
  /** Absolute wall-clock deadline shared by every redirect hop. */
  deadlineAtMs?: number;
  headers?: HeadersInit;
  beforeRequest?: (url: URL) => void | Promise<void>;
}

export type PublicResourceFetcher = (
  url: string | URL,
  options?: Omit<PublicFetchOptions, "fetchImpl" | "resolver">,
) => Promise<PublicResource>;

export const resolvePublicAddresses: DnsResolver = async (hostname) =>
  lookup(hostname, { all: true, verbatim: true });

function scanDeadlineExceeded() {
  return new ScannerError(
    "SCAN_DEADLINE_EXCEEDED",
    "تجاوز الفحص المدة القصوى المسموحة.",
  );
}

function assertBeforeDeadline(deadlineAtMs: number) {
  if (Number.isFinite(deadlineAtMs) && Date.now() >= deadlineAtMs) {
    throw scanDeadlineExceeded();
  }
}

async function settleBefore<T>(
  operation: Promise<T>,
  deadlineAtMs: number,
  timeoutError: () => ScannerError,
): Promise<T> {
  if (!Number.isFinite(deadlineAtMs)) return operation;
  const remainingMs = deadlineAtMs - Date.now();
  if (remainingMs <= 0) throw timeoutError();

  let timeout: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_resolve, reject) => {
    timeout = setTimeout(() => reject(timeoutError()), remainingMs);
  });
  try {
    const result = await Promise.race([operation, timeoutPromise]);
    // A custom fetcher or resolver used in tests can ignore AbortSignal and
    // resolve after advancing the clock. Never return data past the deadline.
    if (Date.now() >= deadlineAtMs) throw timeoutError();
    return result;
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

async function assertPublicResolution(url: URL, resolver: DnsResolver) {
  assertPublicHostname(url.hostname);
  const addresses = await resolver(url.hostname.replace(/^\[|\]$/gu, "")).catch((error) => {
    throw new ScannerError("DNS_UNAVAILABLE", "تعذر العثور على نطاق المتجر.", { cause: error });
  });

  if (addresses.length === 0) {
    throw new ScannerError("DNS_UNAVAILABLE", "تعذر العثور على نطاق المتجر.");
  }
  if (addresses.some(({ address }) => !isPublicIpAddress(address))) {
    throw new ScannerError(
      "PRIVATE_ADDRESS",
      "أوقف الفحص لأن النطاق يشير إلى شبكة خاصة أو محلية.",
    );
  }
  return addresses;
}

function pinnedRequest(url: URL, addresses: readonly ResolvedAddress[], init: RequestInit) {
  return new Promise<Response>((resolve, reject) => {
    const selectedAddress = addresses[0];
    if (!selectedAddress) {
      reject(new ScannerError("DNS_UNAVAILABLE", "تعذر العثور على نطاق المتجر."));
      return;
    }
    const headers = new Headers(init.headers);
    headers.set("accept-encoding", "identity");
    headers.set("connection", "close");
    const request = (url.protocol === "https:" ? httpsRequest : httpRequest)(
      url,
      {
        method: init.method ?? "GET",
        headers: Object.fromEntries(headers.entries()),
        signal: init.signal ?? undefined,
        // Pin the socket to the already validated DNS answer. This closes the
        // DNS-rebinding gap between policy validation and the actual connect.
        lookup: (_hostname, lookupOptions, callback) => {
          const family = selectedAddress.family as 4 | 6;
          if (
            typeof lookupOptions === "object" &&
            lookupOptions !== null &&
            "all" in lookupOptions &&
            lookupOptions.all
          ) {
            (
              callback as unknown as (
                error: NodeJS.ErrnoException | null,
                addresses: Array<{ address: string; family: 4 | 6 }>,
              ) => void
            )(null, [{ address: selectedAddress.address, family }]);
            return;
          }
          (
            callback as unknown as (
              error: NodeJS.ErrnoException | null,
              address: string,
              family: 4 | 6,
            ) => void
          )(null, selectedAddress.address, family);
        },
      },
      (incoming) => {
        const responseHeaders = new Headers();
        Object.entries(incoming.headers).forEach(([name, value]) => {
          if (Array.isArray(value)) value.forEach((entry) => responseHeaders.append(name, entry));
          else if (value !== undefined) responseHeaders.set(name, value);
        });
        const status = incoming.statusCode ?? 500;
        resolve(
          new Response(Readable.toWeb(incoming) as ReadableStream<Uint8Array>, {
            status,
            statusText: incoming.statusMessage,
            headers: responseHeaders,
          }),
        );
      },
    );
    request.once("error", reject);
    request.end();
  });
}

async function readBoundedText(response: Response, maxBytes: number) {
  const declaredLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    await response.body?.cancel().catch(() => undefined);
    throw new ScannerError("RESPONSE_TOO_LARGE", "تجاوزت إحدى صفحات الموقع حد حجم الفحص.");
  }

  if (!response.body) return { body: "", bytesRead: 0 };
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let total = 0;
  let body = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel().catch(() => undefined);
        throw new ScannerError("RESPONSE_TOO_LARGE", "تجاوزت إحدى صفحات الموقع حد حجم الفحص.");
      }
      body += decoder.decode(value, { stream: true });
    }
    body += decoder.decode();
    return { body, bytesRead: total };
  } finally {
    reader.releaseLock();
  }
}

export async function fetchPublicResource(
  input: string | URL,
  options: PublicFetchOptions = {},
): Promise<PublicResource> {
  const resolver = options.resolver ?? resolvePublicAddresses;
  const maxRedirects = options.maxRedirects ?? 5;
  const maxBytes = options.maxBytes ?? 1_000_000;
  const timeoutMs = Math.max(1, options.timeoutMs ?? 8_000);
  const deadlineAtMs = Number.isFinite(options.deadlineAtMs)
    ? options.deadlineAtMs!
    : Number.POSITIVE_INFINITY;
  const startedAt = Date.now();
  let current = normalizePublicUrl(input.toString());

  for (let redirectCount = 0; redirectCount <= maxRedirects; redirectCount += 1) {
    assertBeforeDeadline(deadlineAtMs);
    const addresses = await settleBefore(
      assertPublicResolution(current, resolver),
      deadlineAtMs,
      scanDeadlineExceeded,
    );
    await settleBefore(
      Promise.resolve(options.beforeRequest?.(new URL(current))),
      deadlineAtMs,
      scanDeadlineExceeded,
    );

    const controller = new AbortController();
    const hopDeadlineAtMs = Date.now() + timeoutMs;
    const requestDeadlineAtMs = Math.min(deadlineAtMs, hopDeadlineAtMs);
    const requestTimedOut = (message: string) => {
      controller.abort();
      return deadlineAtMs <= hopDeadlineAtMs
        ? scanDeadlineExceeded()
        : new ScannerError("FETCH_FAILED", message);
    };
    let response: Response;
    try {
      const requestInit: RequestInit = {
        method: "GET",
        redirect: "manual",
        signal: controller.signal,
        headers: {
          accept: "text/html,application/xhtml+xml,application/xml,text/xml,text/plain;q=0.8",
          "user-agent": "BasirahVisibilityBot/1.0 (+https://basirah.ai/methodology)",
          ...options.headers,
        },
      };
      const responsePromise = options.fetchImpl
        ? options.fetchImpl(current, requestInit)
        : pinnedRequest(current, addresses, requestInit);
      response = await settleBefore(
        Promise.resolve(responsePromise),
        requestDeadlineAtMs,
        () => requestTimedOut("تعذر الاتصال بالموقع ضمن مهلة الفحص."),
      );
    } catch (error) {
      if (Date.now() >= deadlineAtMs) throw scanDeadlineExceeded();
      if (error instanceof ScannerError) throw error;
      throw new ScannerError("FETCH_FAILED", "تعذر الاتصال بالموقع ضمن مهلة الفحص.", {
        cause: error,
      });
    }

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      const cancellation = response.body?.cancel().catch(() => undefined);
      if (cancellation) {
        await settleBefore(cancellation, deadlineAtMs, () => {
          controller.abort();
          return scanDeadlineExceeded();
        });
      }
      assertBeforeDeadline(deadlineAtMs);
      if (!location) {
        throw new ScannerError("INVALID_REDIRECT", "أعاد الموقع توجيهًا غير صالح.");
      }
      if (redirectCount === maxRedirects) {
        throw new ScannerError("TOO_MANY_REDIRECTS", "تجاوز الموقع حد عمليات إعادة التوجيه.");
      }
      current = normalizePublicUrl(new URL(location, current).toString());
      continue;
    }

    try {
      const body = await settleBefore(
        readBoundedText(response, maxBytes),
        requestDeadlineAtMs,
        () => requestTimedOut("تعذر قراءة الصفحة ضمن مهلة الفحص."),
      );
      assertBeforeDeadline(deadlineAtMs);
      return {
        url: current.toString(),
        status: response.status,
        headers: response.headers,
        body: body.body,
        bytesRead: body.bytesRead,
        durationMs: Date.now() - startedAt,
      };
    } catch (error) {
      if (Date.now() >= deadlineAtMs) throw scanDeadlineExceeded();
      if (error instanceof ScannerError) throw error;
      throw new ScannerError("FETCH_FAILED", "تعذر قراءة الصفحة ضمن مهلة الفحص.", {
        cause: error,
      });
    }
  }

  throw new ScannerError("TOO_MANY_REDIRECTS", "تجاوز الموقع حد عمليات إعادة التوجيه.");
}

export function createPublicResourceFetcher(
  defaults: Pick<PublicFetchOptions, "fetchImpl" | "resolver"> = {},
): PublicResourceFetcher {
  return (url, options) => fetchPublicResource(url, { ...defaults, ...options });
}
