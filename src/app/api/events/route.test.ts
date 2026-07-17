import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

function chunkedRequest(input: {
  chunks: string[];
  origin?: string;
  contentType?: string;
}) {
  const encoder = new TextEncoder();
  let index = 0;
  const body = new ReadableStream<Uint8Array>({
    pull(controller) {
      const chunk = input.chunks[index];
      index += 1;
      if (chunk === undefined) {
        controller.close();
        return;
      }
      controller.enqueue(encoder.encode(chunk));
    },
  });
  const headers = new Headers();
  if (input.origin) headers.set("origin", input.origin);
  if (input.contentType) headers.set("content-type", input.contentType);

  return new Request("https://basirah.example/api/events", {
    method: "POST",
    headers,
    body,
    duplex: "half",
  } as RequestInit & { duplex: "half" });
}

describe("POST /api/events", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("APP_MODE", "production");
    vi.stubEnv("APP_URL", "https://basirah.example");
    vi.stubEnv("TOKEN_ENCRYPTION_KEY", "x".repeat(32));
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("rejects an untrusted origin before reading a chunked body", async () => {
    const request = chunkedRequest({
      chunks: ["not-json", "x".repeat(12_000)],
      origin: "https://attacker.example",
      // Deliberately omit content-type: origin must win before body validation.
    });
    const { POST } = await import("@/app/api/events/route");

    const response = await POST(request);

    expect(response.status).toBe(403);
    expect(request.bodyUsed).toBe(false);
    expect(await response.json()).toEqual({ error: "Forbidden." });
  });

  it("returns 413 for an oversized chunked JSON body without content-length", async () => {
    const request = chunkedRequest({
      chunks: [
        '{"type":"visibility_check_submitted","padding":"',
        "x".repeat(9_000),
        '"}',
      ],
      origin: "https://basirah.example",
      contentType: "application/json",
    });
    expect(request.headers.has("content-length")).toBe(false);
    const { POST } = await import("@/app/api/events/route");

    const response = await POST(request);

    expect(response.status).toBe(413);
    expect(request.bodyUsed).toBe(true);
    expect(await response.json()).toEqual({ error: "Event payload is too large." });
  });
});
