import { describe, expect, it } from "vitest";

import { ScannerError } from "./errors";
import { isPublicIpAddress, normalizedUrlString } from "./url";

describe("visibility scanner URL policy", () => {
  it("normalizes a bare public domain", () => {
    expect(normalizedUrlString("  SHOP.Example.com/catalog#top  ")).toBe(
      "https://shop.example.com/catalog",
    );
  });

  it.each([
    "http://127.0.0.1",
    "http://10.1.2.3",
    "http://[::1]",
    "http://metadata.google.internal",
    "file:///etc/passwd",
    "https://user:password@shop.example.com",
    "https://shop.example.com:9443",
  ])("rejects unsafe input %s", (input) => {
    expect(() => normalizedUrlString(input)).toThrow(ScannerError);
  });

  it("classifies public and non-public DNS answers", () => {
    expect(isPublicIpAddress("93.184.216.34")).toBe(true);
    expect(isPublicIpAddress("192.168.1.1")).toBe(false);
    expect(isPublicIpAddress("169.254.169.254")).toBe(false);
    expect(isPublicIpAddress("2001:4860:4860::8888")).toBe(true);
    expect(isPublicIpAddress("fc00::1")).toBe(false);
    expect(isPublicIpAddress("240.0.0.1")).toBe(false);
    expect(isPublicIpAddress("fec0::1")).toBe(false);
  });
});
