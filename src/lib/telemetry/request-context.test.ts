import { describe, expect, it } from "vitest";

import {
  correlatedJsonResponse,
  createRequestTelemetryContext,
  currentRequestTelemetryContext,
  withRequestTelemetryContext,
} from "@/lib/telemetry/request-context";

describe("request telemetry context", () => {
  it("preserves a well-formed request id and W3C trace id", () => {
    const requestId = "5f0a504a-2494-4a49-970d-1f7c4f9c8f63";
    const traceId = "4bf92f3577b34da6a3ce929d0e0e4736";
    const context = createRequestTelemetryContext(
      new Request("https://basirah.example/api/events", {
        headers: {
          "x-request-id": requestId,
          traceparent: `00-${traceId}-00f067aa0ba902b7-01`,
        },
      }),
    );
    expect(context).toMatchObject({ correlationId: requestId, traceId });
  });

  it("replaces untrusted request ids and redacts secret-looking path segments", () => {
    const context = createRequestTelemetryContext(
      new Request(
        "https://basirah.example/ar/report/aVeryLongOpaqueShareToken1234567890?email=hidden",
        { headers: { "x-request-id": "merchant@example.com" } },
      ),
    );
    expect(context.correlationId).toMatch(/^[0-9a-f-]{36}$/i);
    expect(context.path).toBe("/ar/report/:id");
    expect(context.path).not.toContain("email");
  });

  it("makes the context available only inside the async request scope", async () => {
    const request = new Request("https://basirah.example/api/events");
    expect(currentRequestTelemetryContext()).toBeUndefined();

    await withRequestTelemetryContext(request, async (context) => {
      await Promise.resolve();
      expect(currentRequestTelemetryContext()).toEqual(context);
    });

    expect(currentRequestTelemetryContext()).toBeUndefined();
  });

  it("adds the correlation id to JSON responses", async () => {
    const context = { correlationId: "req_12345678" };
    const response = correlatedJsonResponse(context, { accepted: true }, { status: 202 });
    expect(response.status).toBe(202);
    expect(response.headers.get("x-request-id")).toBe(context.correlationId);
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({ accepted: true });
  });
});
