import { isValidSallaBindingClaim } from "@/core/commerce/salla-binding";

const SESSION_RETRY_ATTEMPTS = 3;
const SESSION_RETRY_BUDGET_MS = 10_000;
const DEFAULT_RETRY_AFTER_MS = 3_000;
const REFRESH_GUARD_KEY = "basirah:salla:embedded:refresh-requested:v1";

type FetchImplementation = typeof fetch;

export type EmbeddedLocale = "ar" | "en";

export interface EmbeddedStoreOverview {
  store: {
    name: string;
    externalDomain: string | null;
    status: string;
    currency: string;
    defaultLocale: string;
  };
  sync: {
    status: string;
    progress: number;
    recordsProcessed: number;
    recordsFailed: number;
    updatedAt: string | null;
  } | null;
}

export type EmbeddedSessionOutcome =
  | { status: "connected"; sessionToken: string; expiresAt: string }
  | { status: "link_required"; continueUrl: string }
  | { status: "authorization_pending" };

export class EmbeddedRequestError extends Error {
  constructor(
    message: string,
    readonly status: number | null = null,
  ) {
    super(message);
    this.name = "EmbeddedRequestError";
  }
}

interface RetryClock {
  now: () => number;
  sleep: (milliseconds: number) => Promise<void>;
}

const systemClock: RetryClock = {
  now: () => Date.now(),
  sleep: (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)),
};

export async function requestEmbeddedSession({
  token,
  fetchImpl = fetch,
  signal,
  clock = systemClock,
}: {
  token: string;
  fetchImpl?: FetchImplementation;
  signal?: AbortSignal;
  clock?: RetryClock;
}): Promise<EmbeddedSessionOutcome> {
  const deadline = clock.now() + SESSION_RETRY_BUDGET_MS;

  for (let attempt = 1; attempt <= SESSION_RETRY_ATTEMPTS; attempt += 1) {
    const remaining = deadline - clock.now();
    if (remaining <= 0) return { status: "authorization_pending" };

    const { response, body } = await fetchJsonWithinDeadline(
      fetchImpl,
      "/api/connect/salla/embedded/session",
      {
        method: "POST",
        credentials: "omit",
        cache: "no-store",
        referrerPolicy: "no-referrer",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
        },
        body: JSON.stringify({ token }),
      },
      remaining,
      signal,
    );

    if (response.status === 401) {
      throw new EmbeddedRequestError("The embedded authorization expired.", 401);
    }

    const authorizationPending = response.status === 409 && isPendingResponse(body);
    const temporarilyUnavailable = response.status === 503;
    if (authorizationPending || temporarilyUnavailable) {
      if (attempt === SESSION_RETRY_ATTEMPTS) {
        if (authorizationPending) return { status: "authorization_pending" };
        throw new EmbeddedRequestError("The embedded session is temporarily unavailable.", 503);
      }
      const delay = retryAfterMilliseconds(response.headers.get("retry-after"), clock.now());
      if (delay >= deadline - clock.now()) {
        if (authorizationPending) return { status: "authorization_pending" };
        throw new EmbeddedRequestError("The embedded session is temporarily unavailable.", 503);
      }
      await sleepWithSignal(clock, delay, signal);
      continue;
    }

    if (!response.ok) {
      throw new EmbeddedRequestError("The embedded session could not be established.", response.status);
    }

    return parseSessionOutcome(body);
  }

  return { status: "authorization_pending" };
}

export async function requestEmbeddedOverview({
  sessionToken,
  fetchImpl = fetch,
  signal,
}: {
  sessionToken: string;
  fetchImpl?: FetchImplementation;
  signal?: AbortSignal;
}): Promise<EmbeddedStoreOverview> {
  const { response, body } = await fetchJsonWithinDeadline(
    fetchImpl,
    "/api/embedded/salla/overview",
    {
      method: "GET",
      credentials: "omit",
      cache: "no-store",
      referrerPolicy: "no-referrer",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${sessionToken}`,
      },
    },
    SESSION_RETRY_BUDGET_MS,
    signal,
  );

  if (response.status === 401) {
    throw new EmbeddedRequestError("The embedded session expired.", 401);
  }
  if (!response.ok) {
    throw new EmbeddedRequestError("The store overview could not be loaded.", response.status);
  }
  return parseOverview(body);
}

export function stripEmbeddedToken(currentHref: string): string {
  const url = new URL(currentHref);
  url.searchParams.delete("token");
  return `${url.pathname}${url.search}${url.hash}`;
}

export function trustedContinueUrl(candidate: string, currentOrigin: string): string | null {
  try {
    const url = new URL(candidate, currentOrigin);
    if (
      url.origin !== currentOrigin ||
      url.username !== "" ||
      url.password !== "" ||
      url.pathname !== "/salla/continue" ||
      url.search !== ""
    ) {
      return null;
    }
    const fragment = new URLSearchParams(url.hash.slice(1));
    const entries = [...fragment.entries()];
    const claim = entries[0]?.[1];
    if (entries.length !== 1 || entries[0]?.[0] !== "claim" || !isValidSallaBindingClaim(claim)) {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

export function normalizeEmbeddedLocale(locale: string | undefined): EmbeddedLocale {
  return locale?.toLowerCase().startsWith("en") ? "en" : "ar";
}

export function requestEmbeddedAuthRefresh(
  auth: { refresh: () => void },
  storage: Pick<Storage, "getItem" | "setItem">,
) {
  try {
    if (storage.getItem(REFRESH_GUARD_KEY) === "1") return false;
    storage.setItem(REFRESH_GUARD_KEY, "1");
    auth.refresh();
    return true;
  } catch {
    return false;
  }
}

export function clearEmbeddedRefreshGuard(storage: Pick<Storage, "removeItem">) {
  try {
    storage.removeItem(REFRESH_GUARD_KEY);
  } catch {
    // A disabled storage API does not affect an already verified session.
  }
}

export function retryAfterMilliseconds(value: string | null, now = Date.now()): number {
  if (!value) return DEFAULT_RETRY_AFTER_MS;
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) return Math.min(seconds * 1_000, SESSION_RETRY_BUDGET_MS);
  const date = Date.parse(value);
  if (!Number.isNaN(date)) return Math.min(Math.max(0, date - now), SESSION_RETRY_BUDGET_MS);
  return DEFAULT_RETRY_AFTER_MS;
}

async function fetchJsonWithinDeadline(
  fetchImpl: FetchImplementation,
  input: RequestInfo | URL,
  init: RequestInit,
  timeoutMilliseconds: number,
  outerSignal?: AbortSignal,
) {
  const controller = new AbortController();
  const abort = () => controller.abort(outerSignal?.reason);
  if (outerSignal?.aborted) abort();
  else outerSignal?.addEventListener("abort", abort, { once: true });
  const timeout = setTimeout(() => controller.abort(new DOMException("Request timed out.", "TimeoutError")), timeoutMilliseconds);

  try {
    const response = await fetchImpl(input, { ...init, signal: controller.signal });
    const body = (await response.json().catch(() => null)) as unknown;
    return { response, body };
  } finally {
    clearTimeout(timeout);
    outerSignal?.removeEventListener("abort", abort);
  }
}

async function sleepWithSignal(clock: RetryClock, milliseconds: number, signal?: AbortSignal) {
  if (!signal) return clock.sleep(milliseconds);
  if (signal.aborted) throw signal.reason;
  await Promise.race([
    clock.sleep(milliseconds),
    new Promise<never>((_, reject) => {
      signal.addEventListener("abort", () => reject(signal.reason), { once: true });
    }),
  ]);
}

function parseSessionOutcome(body: unknown): Exclude<EmbeddedSessionOutcome, { status: "authorization_pending" }> {
  if (!isRecord(body)) throw new EmbeddedRequestError("The embedded session response was invalid.");
  if (
    body.status === "connected" &&
    isBoundedString(body.sessionToken, 20, 8_192) &&
    isIsoDate(body.expiresAt)
  ) {
    return { status: "connected", sessionToken: body.sessionToken, expiresAt: body.expiresAt };
  }
  if (body.status === "link_required" && isBoundedString(body.continueUrl, 1, 8_192)) {
    return { status: "link_required", continueUrl: body.continueUrl };
  }
  throw new EmbeddedRequestError("The embedded session response was invalid.");
}

function parseOverview(body: unknown): EmbeddedStoreOverview {
  if (!isRecord(body) || !isRecord(body.store)) {
    throw new EmbeddedRequestError("The store overview response was invalid.");
  }
  const store = body.store;
  if (
    !isBoundedString(store.name, 1, 240) ||
    !(store.externalDomain === null || isBoundedString(store.externalDomain, 1, 255)) ||
    !isBoundedString(store.status, 1, 64) ||
    !isBoundedString(store.currency, 1, 16) ||
    !isBoundedString(store.defaultLocale, 1, 32)
  ) {
    throw new EmbeddedRequestError("The store overview response was invalid.");
  }

  let sync: EmbeddedStoreOverview["sync"] = null;
  if (body.sync !== null && body.sync !== undefined) {
    if (
      !isRecord(body.sync) ||
      !isBoundedString(body.sync.status, 1, 64) ||
      !isProgress(body.sync.progress) ||
      !isCount(body.sync.recordsProcessed) ||
      !isCount(body.sync.recordsFailed) ||
      !(body.sync.updatedAt === null || isIsoDate(body.sync.updatedAt))
    ) {
      throw new EmbeddedRequestError("The store overview response was invalid.");
    }
    sync = {
      status: body.sync.status,
      progress: body.sync.progress,
      recordsProcessed: body.sync.recordsProcessed,
      recordsFailed: body.sync.recordsFailed,
      updatedAt: body.sync.updatedAt,
    };
  }

  return {
    store: {
      name: store.name,
      externalDomain: store.externalDomain,
      status: store.status,
      currency: store.currency,
      defaultLocale: store.defaultLocale,
    },
    sync,
  };
}

function isPendingResponse(body: unknown) {
  return isRecord(body) && body.status === "authorization_pending";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isBoundedString(value: unknown, minimum: number, maximum: number): value is string {
  return typeof value === "string" && value.length >= minimum && value.length <= maximum;
}

function isIsoDate(value: unknown): value is string {
  return isBoundedString(value, 1, 64) && !Number.isNaN(Date.parse(value));
}

function isProgress(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100;
}

function isCount(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) >= 0;
}
