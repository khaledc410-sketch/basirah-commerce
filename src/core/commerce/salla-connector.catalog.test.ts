import { afterEach, describe, expect, it, vi } from "vitest";

import { SallaConnector } from "@/core/commerce/salla-connector";
import {
  syntheticArabicProduct,
  syntheticEnglishProduct,
  syntheticProductPageResponse,
} from "@/core/commerce/salla/fixtures/official-docs.synthetic";

describe("SallaConnector catalog facade", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("fetches the same page in Arabic and English and merges by external id", async () => {
    const fetchMock = vi.fn(async (_input: URL | RequestInfo, init?: RequestInit) => {
      const language = new Headers(init?.headers).get("accept-language");
      const payload = {
        ...syntheticProductPageResponse,
        data: [language === "en" ? syntheticEnglishProduct : syntheticArabicProduct],
      };
      return new Response(JSON.stringify(payload), { status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await new SallaConnector().listProducts(
      { storeId: "store-local-1", accessToken: "redacted-token" },
      { page: 1, perPage: 60 },
    );

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.pagination).toMatchObject({ currentPage: 1, nextPage: 2 });
    expect(result.items[0].name).toEqual({ ar: "قميص اختباري", en: "Test shirt" });
  });

  it("refuses catalog requests without a merchant access token", async () => {
    await expect(
      new SallaConnector().listProducts({ storeId: "store-local-1" }),
    ).rejects.toMatchObject({ reason: "missing_credentials" });
  });
});
