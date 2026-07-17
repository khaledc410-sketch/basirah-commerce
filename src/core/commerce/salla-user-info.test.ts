import { afterEach, describe, expect, it, vi } from "vitest";

import {
  getSallaAuthorizerIdentity,
  parseSallaUserInfo,
} from "@/core/commerce/salla-user-info";

afterEach(() => vi.unstubAllGlobals());

describe("Salla authorizer identity", () => {
  it("strictly extracts the installer and merchant boundaries", () => {
    expect(
      parseSallaUserInfo({
        status: 200,
        success: true,
        data: {
          id: 1689171978,
          name: "Installer",
          merchant: { id: 847769313, name: "Store" },
        },
      }),
    ).toEqual({ userId: "1689171978", merchantId: "847769313" });
    expect(() =>
      parseSallaUserInfo({
        status: 200,
        success: true,
        data: { id: 1689171978, merchant: {} },
      }),
    ).toThrow();
  });

  it("uses the exact access token with a bounded, no-store request", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({
        status: 200,
        success: true,
        data: { id: "user-7", merchant: { id: "merchant-123" } },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(getSallaAuthorizerIdentity("pending-access-token")).resolves.toEqual({
      userId: "user-7",
      merchantId: "merchant-123",
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://accounts.salla.sa/oauth2/user/info",
      expect.objectContaining({
        method: "GET",
        cache: "no-store",
        headers: expect.objectContaining({
          authorization: "Bearer pending-access-token",
        }),
        signal: expect.any(AbortSignal),
      }),
    );
  });

  it("fails closed on non-success responses", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 401 })));
    await expect(getSallaAuthorizerIdentity("revoked-token")).rejects.toThrow(
      "could not be verified",
    );
  });
});
