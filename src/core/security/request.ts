import "server-only";

import { getServerEnv, isDemoMode } from "@/config/env";

export function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    const submittedUrl = new URL(origin);
    const submittedOrigin = submittedUrl.origin;
    const isLocalDemoOrigin =
      isDemoMode() &&
      submittedUrl.protocol === "http:" &&
      ["localhost", "127.0.0.1", "::1"].includes(submittedUrl.hostname);
    return (
      submittedOrigin === new URL(getServerEnv().APP_URL).origin ||
      (isDemoMode() && submittedOrigin === new URL(request.url).origin) ||
      isLocalDemoOrigin
    );
  } catch {
    return false;
  }
}

export function acceptsJson(request: Request, maxBytes = 16 * 1024) {
  const contentType = request.headers.get("content-type")?.split(";", 1)[0]?.trim();
  const length = Number(request.headers.get("content-length") ?? 0);
  return contentType === "application/json" && length <= maxBytes;
}

export function safeInternalPath(value?: string) {
  if (!value?.startsWith("/") || value.startsWith("//") || value.includes("\\")) return null;
  return value;
}
