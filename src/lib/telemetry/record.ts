import "server-only";

import { logEvent } from "@/lib/logger";
import {
  safeParseProductEvent,
  type ProductEvent,
} from "@/lib/telemetry/events";
import {
  currentRequestTelemetryContext,
  type RequestTelemetryContext,
} from "@/lib/telemetry/request-context";

export function recordProductEvent(
  event: ProductEvent,
  context: RequestTelemetryContext | undefined = currentRequestTelemetryContext(),
) {
  // Re-validate at the logging boundary. Internal callers must not be able to
  // bypass bearer-ID and sensitive-field protections with a type assertion.
  const parsed = safeParseProductEvent(event);
  if (!parsed.success) {
    logEvent("warn", "product_event_rejected", {
      correlationId: context?.correlationId,
      rejectionReason: parsed.reason,
    });
    return false;
  }

  const { type, ...dimensions } = parsed.data;
  logEvent("info", "product_event", {
    productEvent: type,
    correlationId: context?.correlationId,
    traceId: context?.traceId,
    providerRequestId: context?.providerRequestId,
    requestMethod: context?.method,
    requestPath: context?.path,
    ...dimensions,
  });
  return true;
}
