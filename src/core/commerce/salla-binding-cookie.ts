import "server-only";

import type { NextResponse } from "next/server";

import { sallaBindingCookieName } from "@/core/commerce/salla-embedded";

const bindingCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: true,
  path: "/",
  priority: "high" as const,
};

export function setSallaBindingCookie(response: NextResponse, claim: string) {
  response.cookies.set(sallaBindingCookieName, claim, {
    ...bindingCookieOptions,
    maxAge: 10 * 60,
  });
}

export function clearSallaBindingCookie(response: NextResponse) {
  response.cookies.set(sallaBindingCookieName, "", {
    ...bindingCookieOptions,
    expires: new Date(0),
    maxAge: 0,
  });
}
