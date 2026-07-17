import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getServerEnv: vi.fn(),
}));

vi.mock("@/config/env", () => ({
  getServerEnv: mocks.getServerEnv,
}));

import { SallaConnector } from "@/core/commerce/salla-connector";

const tokenResponse = {
  access_token: "new-access-token",
  refresh_token: "rotated-refresh-token",
  expires_in: 3600,
  token_type: "Bearer",
  scope: "products.read offline_access",
};

function mockTokenResponse() {
  const fetchMock = vi.fn(
    async (_input: URL | RequestInfo, _init?: RequestInit) =>
      new Response(JSON.stringify(tokenResponse), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function submittedTokenBody(fetchMock: ReturnType<typeof mockTokenResponse>) {
  const requestInit = fetchMock.mock.calls[0]?.[1] as RequestInit | undefined;
  return new URLSearchParams(String(requestInit?.body));
}

describe("SallaConnector token grants", () => {
  beforeEach(() => {
    mocks.getServerEnv.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("refreshes an Easy Mode token without requiring or sending a redirect URI", async () => {
    mocks.getServerEnv.mockReturnValue({
      SALLA_AUTH_MODE: "easy",
      SALLA_CLIENT_ID: "easy-client-id",
      SALLA_CLIENT_SECRET: "easy-client-secret",
      SALLA_REDIRECT_URI: undefined,
    });
    const fetchMock = mockTokenResponse();

    const result = await new SallaConnector().refreshToken("current-refresh-token");

    expect(result).toMatchObject({
      accessToken: "new-access-token",
      refreshToken: "rotated-refresh-token",
    });
    const body = submittedTokenBody(fetchMock);
    expect(body.get("grant_type")).toBe("refresh_token");
    expect(body.get("refresh_token")).toBe("current-refresh-token");
    expect(body.get("client_id")).toBe("easy-client-id");
    expect(body.get("client_secret")).toBe("easy-client-secret");
    expect(body.has("redirect_uri")).toBe(false);
  });

  it("rejects a Custom Mode authorization-code exchange without its redirect URI", async () => {
    mocks.getServerEnv.mockReturnValue({
      SALLA_AUTH_MODE: "custom",
      SALLA_CLIENT_ID: "custom-client-id",
      SALLA_CLIENT_SECRET: "custom-client-secret",
      SALLA_REDIRECT_URI: undefined,
    });
    const fetchMock = mockTokenResponse();

    await expect(new SallaConnector().exchangeCode("authorization-code")).rejects.toMatchObject({
      reason: "missing_credentials",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends the validated redirect URI with a Custom Mode authorization-code exchange", async () => {
    mocks.getServerEnv.mockReturnValue({
      SALLA_AUTH_MODE: "custom",
      SALLA_CLIENT_ID: "custom-client-id",
      SALLA_CLIENT_SECRET: "custom-client-secret",
      SALLA_REDIRECT_URI: "https://app.example.com/api/oauth/salla/callback",
    });
    const fetchMock = mockTokenResponse();

    await new SallaConnector().exchangeCode("authorization-code");

    const body = submittedTokenBody(fetchMock);
    expect(body.get("grant_type")).toBe("authorization_code");
    expect(body.get("code")).toBe("authorization-code");
    expect(body.get("redirect_uri")).toBe(
      "https://app.example.com/api/oauth/salla/callback",
    );
  });
});
