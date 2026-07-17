import { z } from "zod";

import { clientAddress, enforceRateLimit } from "@/core/security/rate-limit";
import { acceptsJson, isSameOrigin } from "@/core/security/request";
import { logEvent } from "@/lib/logger";
import {
  correlatedJsonResponse,
  withRequestTelemetryContext,
} from "@/lib/telemetry/request-context";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const metricSchema = z
  .object({
    name: z.enum(["CLS", "FCP", "INP", "LCP", "TTFB"]),
    value: z.number().finite().nonnegative().max(86_400_000),
    delta: z.number().finite().min(-86_400_000).max(86_400_000),
    rating: z.enum(["good", "needs-improvement", "poor"]),
    navigationType: z
      .enum(["navigate", "reload", "back-forward", "back-forward-cache", "prerender", "restore"])
      .optional(),
  })
  .strict();

export async function POST(request: Request) {
  return withRequestTelemetryContext(request, async (context) => {
    if (!isSameOrigin(request)) {
      return correlatedJsonResponse(context, { accepted: false }, { status: 403 });
    }
    if (!acceptsJson(request, 2_048)) {
      return correlatedJsonResponse(context, { accepted: false }, { status: 415 });
    }

    const rateLimit = await enforceRateLimit({
      namespace: "web-vitals",
      identifier: clientAddress(request),
      limit: 240,
      windowSeconds: 60 * 60,
    }).catch(() => null);
    if (!rateLimit?.allowed) {
      return correlatedJsonResponse(context, { accepted: false }, { status: 429 });
    }

    const parsed = metricSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return correlatedJsonResponse(context, { accepted: false }, { status: 400 });
    }

    logEvent("info", "web_vital_observed", {
      correlationId: context.correlationId,
      metricName: parsed.data.name,
      metricValue: parsed.data.value,
      metricDelta: parsed.data.delta,
      metricRating: parsed.data.rating,
      navigationType: parsed.data.navigationType,
    });
    return correlatedJsonResponse(context, { accepted: true }, { status: 202 });
  });
}
