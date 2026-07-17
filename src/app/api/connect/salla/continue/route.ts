import { NextResponse } from "next/server";

import { parseSallaBindingClaimBody } from "@/core/commerce/salla-binding";
import {
  clearSallaBindingCookie,
  setSallaBindingCookie,
} from "@/core/commerce/salla-binding-cookie";
import { clientAddress, enforceRateLimit } from "@/core/security/rate-limit";
import { acceptsJson, isSameOrigin } from "@/core/security/request";
import { peekPlatformBindingClaim } from "@/db/repositories/platform-connection-repository";
import { logEvent, requestContext } from "@/lib/logger";

export async function POST(request: Request) {
  const context = requestContext(request);
  if (!isSameOrigin(request) || !acceptsJson(request, 1_024)) {
    return invalidClaimResponse();
  }

  const limit = await enforceRateLimit({
    namespace: "salla-binding-continue",
    identifier: clientAddress(request),
    limit: 20,
    windowSeconds: 15 * 60,
  });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "محاولات ربط كثيرة. انتظر قليلًا ثم افتح بصيرة من سلة مجددًا." },
      {
        status: 429,
        headers: {
          "cache-control": "private, no-store",
          "retry-after": String(limit.retryAfterSeconds),
        },
      },
    );
  }

  const rawBody = await request.text();
  if (new TextEncoder().encode(rawBody).byteLength > 1_024) return invalidClaimResponse();
  const claim = parseSallaBindingClaimBody(rawBody);
  if (!claim) return invalidClaimResponse();

  let activeClaim: Awaited<ReturnType<typeof peekPlatformBindingClaim>>;
  try {
    activeClaim = await peekPlatformBindingClaim(claim, "salla");
  } catch (error) {
    logEvent("error", "salla_binding_continue_failed", {
      ...context,
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return NextResponse.json(
      { error: "تعذر التحقق من طلب سلة مؤقتًا. أعد المحاولة." },
      {
        status: 503,
        headers: { "cache-control": "private, no-store", "retry-after": "3" },
      },
    );
  }
  if (!activeClaim) return invalidClaimResponse();

  const response = NextResponse.json(
    { ok: true },
    { headers: { "cache-control": "private, no-store" } },
  );
  setSallaBindingCookie(response, claim);
  return response;
}

function invalidClaimResponse() {
  const response = NextResponse.json(
    { error: "طلب ربط سلة غير صالح أو انتهت صلاحيته." },
    { status: 400, headers: { "cache-control": "private, no-store" } },
  );
  clearSallaBindingCookie(response);
  return response;
}
