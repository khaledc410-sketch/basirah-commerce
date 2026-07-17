import { describe, expect, it } from "vitest";

import { clientAddress } from "./rate-limit";

describe("trusted client address boundary", () => {
  it("accepts only the edge-overwritten Vercel address", () => {
    const request = new Request("https://basirah.example", {
      headers: {
        "x-vercel-id": "dxb1::iad1::request-id",
        "x-vercel-forwarded-for": "203.0.113.20",
        "x-forwarded-for": "198.51.100.9",
        "x-real-ip": "198.51.100.8",
      },
    });
    expect(clientAddress(request)).toBe("203.0.113.20");
  });

  it("does not trust spoofable forwarding headers without the edge marker", () => {
    const request = new Request("https://basirah.example", {
      headers: {
        "x-forwarded-for": "203.0.113.20",
        "x-real-ip": "203.0.113.21",
        "cf-connecting-ip": "203.0.113.22",
      },
    });
    expect(clientAddress(request)).toBe("untrusted-proxy");
  });

  it("rejects lists and malformed edge address values", () => {
    const list = new Request("https://basirah.example", {
      headers: {
        "x-vercel-id": "dxb1::request-id",
        "x-vercel-forwarded-for": "203.0.113.20, 198.51.100.2",
      },
    });
    const malformed = new Request("https://basirah.example", {
      headers: {
        "x-vercel-id": "dxb1::request-id",
        "x-vercel-forwarded-for": "not-an-ip",
      },
    });
    expect(clientAddress(list)).toBe("untrusted-proxy");
    expect(clientAddress(malformed)).toBe("untrusted-proxy");
  });
});
