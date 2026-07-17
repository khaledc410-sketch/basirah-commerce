import "server-only";

import { randomUUID } from "node:crypto";

type LogLevel = "info" | "warn" | "error";

const forbiddenKeys = /token|authorization|cookie|secret|password|email|phone|payload|body/i;

export function requestContext(request: Request) {
  return {
    correlationId: request.headers.get("x-request-id") ?? randomUUID(),
    method: request.method,
    path: new URL(request.url).pathname,
  };
}

export function logEvent(
  level: LogLevel,
  event: string,
  fields: Record<string, unknown> = {},
) {
  const safeFields = Object.fromEntries(
    Object.entries(fields).filter(([key]) => !forbiddenKeys.test(key)),
  );
  const record = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    service: "basirah-web",
    event,
    ...safeFields,
  });
  if (level === "error") console.error(record);
  else if (level === "warn") console.warn(record);
  else console.info(record);
}
