import "server-only";

import { createHash } from "node:crypto";

/**
 * Produces a stable analytics identifier without exposing the bearer value that
 * authorizes access to a scan or report. Inputs must already be high entropy.
 */
export function telemetryOpaqueId(
  namespace: "scan" | "report",
  bearerValue: string,
) {
  const digest = createHash("sha256")
    .update(`basirah:telemetry:${namespace}:v1:${bearerValue}`, "utf8")
    .digest("base64url")
    .slice(0, 32);
  return `${namespace}_${digest}`;
}
