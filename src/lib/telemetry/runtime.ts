import "server-only";

import { randomUUID } from "node:crypto";

import { logEvent } from "@/lib/logger";

export const openTelemetryRegistrationSymbol = Symbol.for("basirah.opentelemetry.register");

export interface OpenTelemetryRegistrationOptions {
  serviceName: "basirah-web";
  serviceVersion?: string;
}

export type OpenTelemetryRegistrationHook = (
  options: OpenTelemetryRegistrationOptions,
) => void | Promise<void>;

type GlobalWithOpenTelemetryHook = typeof globalThis & Record<symbol, unknown>;

let initialization: Promise<void> | undefined;

function readOpenTelemetryHook() {
  const candidate = (globalThis as GlobalWithOpenTelemetryHook)[openTelemetryRegistrationSymbol];
  return typeof candidate === "function" ? (candidate as OpenTelemetryRegistrationHook) : undefined;
}

function safeIdentifier(value: unknown) {
  return typeof value === "string" && /^[A-Za-z0-9_-]{4,128}$/.test(value)
    ? value
    : undefined;
}

function safeRoutePattern(value: string) {
  const route = value.split("?", 1)[0];
  return route.length <= 240 && /^\/[A-Za-z0-9_./()[\]-]*$/.test(route) ? route : "unknown";
}

function safeErrorName(error: unknown) {
  const candidate = error instanceof Error ? error.name : "NonErrorThrown";
  return /^[A-Za-z][A-Za-z0-9_.-]{0,63}$/.test(candidate) ? candidate : "Error";
}

function headerValue(
  headers: Readonly<Record<string, string | string[] | undefined>>,
  requestedName: string,
) {
  const entry = Object.entries(headers).find(([name]) => name.toLowerCase() === requestedName);
  const value = entry?.[1];
  return Array.isArray(value) ? value[0] : value;
}

export function initializeTelemetry() {
  initialization ??= (async () => {
    const hook = readOpenTelemetryHook();
    if (!hook) {
      logEvent("info", "telemetry_initialized", { openTelemetryState: "not_configured" });
      return;
    }

    try {
      await hook({
        serviceName: "basirah-web",
        serviceVersion: safeIdentifier(process.env.VERCEL_GIT_COMMIT_SHA),
      });
      logEvent("info", "telemetry_initialized", { openTelemetryState: "registered" });
    } catch (error) {
      // Observability is optional and must not prevent the application from starting.
      logEvent("error", "telemetry_initialization_failed", { errorName: safeErrorName(error) });
    }
  })();
  return initialization;
}

export function reportNextRequestError(
  error: unknown,
  request: {
    method: string;
    headers: Readonly<Record<string, string | string[] | undefined>>;
  },
  context: {
    routerKind: string;
    routePath: string;
    routeType: string;
    renderSource?: string;
    revalidateReason?: string;
  },
) {
  const incomingRequestId = headerValue(request.headers, "x-request-id");
  const correlationId =
    incomingRequestId &&
    (/^[0-9a-f-]{36}$/i.test(incomingRequestId) || /^req_[A-Za-z0-9_-]{8,64}$/.test(incomingRequestId))
      ? incomingRequestId
      : randomUUID();
  const digest =
    error && typeof error === "object" && "digest" in error
      ? safeIdentifier((error as { digest?: unknown }).digest)
      : undefined;

  logEvent("error", "next_request_error", {
    correlationId,
    errorName: safeErrorName(error),
    errorDigest: digest,
    requestMethod: request.method.slice(0, 12).toUpperCase(),
    routePattern: safeRoutePattern(context.routePath),
    routerKind: context.routerKind,
    routeType: context.routeType,
    renderSource: context.renderSource,
    revalidateReason: context.revalidateReason,
  });
}
