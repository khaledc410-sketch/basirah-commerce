import { NextResponse } from "next/server";
import { describe, expect, it } from "vitest";

import { clearSallaBindingCookie, setSallaBindingCookie } from "./salla-binding-cookie";
import { sallaBindingCookieName } from "./salla-embedded";

describe("Salla binding cookie", () => {
  it("sets a short-lived host-only bearer cookie", () => {
    const response = NextResponse.json({ ok: true });
    setSallaBindingCookie(response, "a".repeat(43));

    const header = response.headers.get("set-cookie");
    expect(header).toContain(`${sallaBindingCookieName}=`);
    expect(header).toContain("Max-Age=600");
    expect(header).toContain("Path=/");
    expect(header).toContain("HttpOnly");
    expect(header).toContain("Secure");
    expect(header).toContain("SameSite=lax");
    expect(header).not.toContain("Domain=");
  });

  it("clears the bearer cookie with identical scope", () => {
    const response = NextResponse.json({ ok: false });
    clearSallaBindingCookie(response);

    const header = response.headers.get("set-cookie");
    expect(header).toContain(`${sallaBindingCookieName}=`);
    expect(header).toContain("Max-Age=0");
    expect(header).toContain("Path=/");
    expect(header).toContain("HttpOnly");
    expect(header).toContain("Secure");
  });
});
