import { z } from "zod";

import { isDemoMode } from "@/config/env";
import { demoRepository } from "@/core/demo/store";
import { isSameOrigin } from "@/core/security/request";
import { logEvent } from "@/lib/logger";
import { safeParseProductEvent } from "@/lib/telemetry/events";
import { recordProductEvent } from "@/lib/telemetry/record";
import {
  correlatedJsonResponse,
  withRequestTelemetryContext,
} from "@/lib/telemetry/request-context";
import { AcquisitionError } from "@/modules/acquisition/errors";
import { readBoundedJson } from "@/modules/acquisition/http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const eventSchema = z.object({
  idempotencyKey: z.string().min(8).max(250),
  sessionId: z.string().min(3).max(200),
  conversationId: z.string().optional(),
  productId: z.string().optional(),
  type: z.enum([
    "product_clicked",
    "product_added_to_cart",
    "checkout_started",
  ]),
  consentState: z.enum(["analytics", "essential"]).default("analytics"),
}).strict();

export async function POST(request: Request) {
  return withRequestTelemetryContext(request, async (context) => {
    const demoMode = isDemoMode();
    // Reject untrusted production origins before consuming even one body byte.
    if (!demoMode && !isSameOrigin(request)) {
      logEvent("warn", "event_origin_rejected", {
        correlationId: context.correlationId,
        requestPath: context.path,
      });
      return correlatedJsonResponse(context, { error: "Forbidden." }, { status: 403 });
    }

    let input: unknown;
    try {
      input = await readBoundedJson(request, 8 * 1024);
    } catch (error) {
      const reason = error instanceof AcquisitionError ? error.code : "INVALID_REQUEST";
      const status = error instanceof AcquisitionError ? error.status : 400;
      logEvent("warn", "event_payload_rejected", {
        correlationId: context.correlationId,
        rejectionReason: reason,
      });
      return correlatedJsonResponse(
        context,
        {
          error:
            status === 413
              ? "Event payload is too large."
              : status === 415
                ? "An application/json payload is required."
                : "Invalid event payload.",
        },
        { status },
      );
    }

    const productEvent = safeParseProductEvent(input);
    if (productEvent.success) {
      recordProductEvent(productEvent.data, context);
      return correlatedJsonResponse(
        context,
        { accepted: true, correlationId: context.correlationId },
        { status: 202 },
      );
    }

    const commerceEvent = eventSchema.safeParse(input);
    if (!commerceEvent.success) {
      logEvent("warn", "event_payload_rejected", {
        correlationId: context.correlationId,
        rejectionReason: productEvent.reason,
      });
      return correlatedJsonResponse(
        context,
        { error: "Invalid event payload." },
        { status: 400 },
      );
    }

    if (!demoMode) {
      return correlatedJsonResponse(
        context,
        { error: "A signed storefront session is required in production." },
        { status: 503 },
      );
    }

    const result = demoRepository.recordEvent({
      ...commerceEvent.data,
      source: "widget",
    });
    return correlatedJsonResponse(context, result, {
      status: result.duplicate ? 200 : 201,
    });
  });
}
