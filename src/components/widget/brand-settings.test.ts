import { describe, expect, it } from "vitest";

import {
  demoAdvisorBrandSettings,
  getReadableTextColor,
  parseStoredBrandSettings,
} from "@/components/widget/brand-settings";

describe("advisor brand settings", () => {
  it("selects a readable foreground for light and dark merchant colors", () => {
    expect(getReadableTextColor("#000000")).toBe("#FFFFFF");
    expect(getReadableTextColor("#FFFFFF")).toBe("#111827");
  });

  it("restores a valid saved brand configuration", () => {
    expect(parseStoredBrandSettings(JSON.stringify(demoAdvisorBrandSettings))).toEqual(
      demoAdvisorBrandSettings,
    );
  });

  it("rejects malformed saved colors", () => {
    expect(
      parseStoredBrandSettings(
        JSON.stringify({ ...demoAdvisorBrandSettings, primaryColor: "indigo" }),
      ),
    ).toBeNull();
  });
});
