import { NextResponse, type NextRequest } from "next/server";

import { protectedNextTarget } from "@/core/commerce/salla-binding";
import { updateSupabaseSession } from "@/lib/supabase/proxy";

const protectedPrefixes = ["/dashboard", "/setup"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const locale = pathname.split("/")[1];
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-basirah-locale", locale === "en" ? "en" : "ar");

  if (pathname === "/") {
    return NextResponse.redirect(new URL("/ar", request.url));
  }

  if (
    pathname === "/setup/connect/salla" &&
    (request.nextUrl.searchParams.has("token") || request.nextUrl.searchParams.has("claim"))
  ) {
    const url = request.nextUrl.clone();
    url.searchParams.delete("token");
    url.searchParams.delete("claim");
    const response = NextResponse.redirect(url);
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  }

  const appMode = process.env.APP_MODE ??
    (process.env.NODE_ENV === "production" ? "production" : "demo");
  if (appMode === "demo") {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  const isProtected = protectedPrefixes.some((prefix) =>
    request.nextUrl.pathname.startsWith(prefix),
  );
  const signinMatch = pathname.match(/^\/(?:ar|en)\/signin$/u);
  const isSignin = pathname === "/signin" || Boolean(signinMatch);
  const signinPath = locale === "en" ? "/en/signin" : "/ar/signin";

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    if (!isProtected) return NextResponse.next({ request: { headers: requestHeaders } });
    const url = request.nextUrl.clone();
    url.pathname = signinPath;
    url.search = "?error=auth_configuration";
    return NextResponse.redirect(url);
  }

  const { response, claims } = await updateSupabaseSession(request, requestHeaders);

  if (isProtected && !claims?.sub) {
    const url = request.nextUrl.clone();
    url.pathname = signinPath;
    url.searchParams.set("next", protectedNextTarget(request.nextUrl));
    return redirectWithSession(url, response);
  }

  if (isSignin && claims?.sub) {
    return redirectWithSession(new URL("/dashboard", request.url), response);
  }

  if (isProtected || request.nextUrl.pathname.startsWith("/auth")) {
    response.headers.set("Cache-Control", "private, no-store");
  }
  return response;
}

function redirectWithSession(url: URL, sessionResponse: NextResponse) {
  const redirect = NextResponse.redirect(url);
  sessionResponse.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  ["cache-control", "expires", "pragma"].forEach((header) => {
    const value = sessionResponse.headers.get(header);
    if (value) redirect.headers.set(header, value);
  });
  redirect.headers.set("Cache-Control", "private, no-store");
  return redirect;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
