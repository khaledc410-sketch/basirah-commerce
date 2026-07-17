import "server-only";

import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";

import { requestContext } from "@/lib/logger";

const requestTelemetryStorage = new AsyncLocalStorage<RequestTelemetryContext>();
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ulidPattern = /^[0-9A-HJKMNP-TV-Z]{26}$/;
const namedRequestIdPattern = /^req_[A-Za-z0-9_-]{8,64}$/;
const vercelRequestIdPattern = /^[A-Za-z0-9:_-]{8,128}$/;
const traceparentPattern = /^[0-9a-f]{2}-([0-9a-f]{32})-([0-9a-f]{16})-[0-9a-f]{2}$/i;

export interface RequestTelemetryContext {
  correlationId: string;
  method: string;
  path: string;
  traceId?: string;
  providerRequestId?: string;
}

function safeCorrelationId(value: string | null | undefined) {
  if (!value) return null;
  const candidate = value.trim();
  return uuidPattern.test(candidate) || ulidPattern.test(candidate) || namedRequestIdPattern.test(candidate)
    ? candidate
    : null;
}

function safeProviderRequestId(value: string | null) {
  if (!value) return undefined;
  const candidate = value.trim();
  return vercelRequestIdPattern.test(candidate) ? candidate : undefined;
}

function traceIdFromHeader(value: string | null) {
  const match = value?.trim().match(traceparentPattern);
  if (!match || /^0+$/.test(match[1]) || /^0+$/.test(match[2])) return undefined;
  return match[1].toLowerCase();
}

function redactSensitivePathSegments(path: string) {
  return path
    .split("/")
    .map((segment) => {
      if (!segment) return segment;
      let decoded = segment;
      try {
        decoded = decodeURIComponent(segment);
      } catch {
        return ":id";
      }
      if (
        decoded.length > 48 ||
        decoded.includes("@") ||
        /^\+?\d{8,}$/.test(decoded) ||
        uuidPattern.test(decoded) ||
        /^[A-Za-z0-9_-]{24,}$/.test(decoded)
      ) {
        return ":id";
      }
      return segment;
    })
    .join("/");
}

export function createRequestTelemetryContext(request: Request): RequestTelemetryContext {
  const base = requestContext(request);
  return {
    correlationId: safeCorrelationId(base.correlationId) ?? randomUUID(),
    method: base.method,
    path: redactSensitivePathSegments(base.path),
    traceId: traceIdFromHeader(request.headers.get("traceparent")),
    providerRequestId: safeProviderRequestId(request.headers.get("x-vercel-id")),
  };
}

export function withRequestTelemetryContext<T>(
  request: Request,
  callback: (context: RequestTelemetryContext) => T,
): T {
  const context = createRequestTelemetryContext(request);
  return requestTelemetryStorage.run(context, () => callback(context));
}

export function currentRequestTelemetryContext() {
  return requestTelemetryStorage.getStore();
}

export function correlatedJsonResponse(
  context: Pick<RequestTelemetryContext, "correlationId">,
  body: unknown,
  init?: ResponseInit,
) {
  const headers = new Headers(init?.headers);
  headers.set("cache-control", "no-store");
  headers.set("x-request-id", context.correlationId);
  return Response.json(body, { ...init, headers });
}
