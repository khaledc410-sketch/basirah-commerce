import { NextResponse } from "next/server";
import { z } from "zod";

import { getServerEnv } from "@/config/env";
import {
  issueSallaEmbeddedSession,
} from "@/core/commerce/salla-embedded";
import {
  SallaIntrospectionError,
  introspectSallaEmbeddedToken,
} from "@/core/commerce/salla-introspection";
import { clientAddress, enforceRateLimit } from "@/core/security/rate-limit";
import { acceptsJson, isSameOrigin } from "@/core/security/request";
import {
  findActivePlatformConnectionByExternalStoreId,
  hasPendingPlatformAuthorization,
  issuePlatformBindingClaim,
} from "@/db/repositories/platform-connection-repository";
import { logEvent, requestContext } from "@/lib/logger";

export const dynamic = "force-dynamic";

const bodySchema = z.object({ token: z.string().min(20).max(4_096) }).strict();
const noStoreHeaders = { "cache-control": "no-store", pragma: "no-cache" };

export async function POST(request: Request) {
  const context = requestContext(request);
  if (!isSameOrigin(request) || !acceptsJson(request, 8 * 1024)) {
    return NextResponse.json(
      { error: "Invalid request." },
      { status: 400, headers: noStoreHeaders },
    );
  }

  let limit: Awaited<ReturnType<typeof enforceRateLimit>>;
  try {
    limit = await enforceRateLimit({
      namespace: "salla-embedded-session",
      identifier: clientAddress(request),
      limit: 20,
      windowSeconds: 5 * 60,
    });
  } catch (error) {
    logEvent("error", "salla_embedded_session_rate_limit_failed", {
      ...context,
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return NextResponse.json(
      { error: "The Salla embedded session is temporarily unavailable." },
      { status: 503, headers: { ...noStoreHeaders, "retry-after": "3" } },
    );
  }
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many embedded session attempts. Please retry shortly." },
      {
        status: 429,
        headers: { ...noStoreHeaders, "retry-after": String(limit.retryAfterSeconds) },
      },
    );
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid Salla token." },
      { status: 400, headers: noStoreHeaders },
    );
  }

  let authority: Awaited<ReturnType<typeof introspectSallaEmbeddedToken>>;
  try {
    authority = await introspectSallaEmbeddedToken(parsed.data.token);
  } catch (error) {
    const invalid =
      error instanceof SallaIntrospectionError && error.kind === "invalid_token";
    logEvent(invalid ? "warn" : "error", "salla_embedded_authority_rejected", {
      ...context,
      errorName: error instanceof Error ? error.name : "UnknownError",
      retryable: !invalid,
    });
    return NextResponse.json(
      {
        error: invalid
          ? "Salla embedded identity could not be verified."
          : "Salla embedded identity is temporarily unavailable.",
      },
      invalid
        ? { status: 401, headers: noStoreHeaders }
        : { status: 503, headers: { ...noStoreHeaders, "retry-after": "3" } },
    );
  }

  if (!authority.userId) {
    logEvent("warn", "salla_embedded_user_missing", {
      ...context,
      merchantId: authority.merchantId,
    });
    return NextResponse.json(
      { error: "Salla embedded user identity is required." },
      { status: 401, headers: noStoreHeaders },
    );
  }

  try {
    const connection = await findActivePlatformConnectionByExternalStoreId(
      "salla",
      authority.merchantId,
    );
    if (connection) {
      const session = await issueSallaEmbeddedSession({
        merchantId: authority.merchantId,
        userId: authority.userId,
        storeId: connection.storeId,
        connectionId: connection.id,
        authorityExpiresAt: authority.expiresAt,
      });
      return NextResponse.json(
        {
          status: "connected",
          sessionToken: session.sessionToken,
          expiresAt: session.expiresAt.toISOString(),
        },
        { headers: noStoreHeaders },
      );
    }

    if (await hasPendingPlatformAuthorization("salla", authority.merchantId)) {
      const remainingAuthoritySeconds = Math.floor(
        (authority.expiresAt.getTime() - Date.now()) / 1_000,
      );
      if (remainingAuthoritySeconds <= 0) {
        return NextResponse.json(
          { error: "Salla embedded identity has expired." },
          { status: 401, headers: noStoreHeaders },
        );
      }
      const claim = await issuePlatformBindingClaim({
        platform: "salla",
        externalStoreId: authority.merchantId,
        externalUserId: authority.userId,
        ttlSeconds: Math.min(10 * 60, remainingAuthoritySeconds),
      });
      if (claim) {
        const continueUrl = new URL("/salla/continue", getServerEnv().APP_URL);
        continueUrl.hash = `claim=${encodeURIComponent(claim.secret)}`;
        return NextResponse.json(
          { status: "link_required", continueUrl: continueUrl.toString() },
          { headers: noStoreHeaders },
        );
      }
    }

    return NextResponse.json(
      {
        status: "authorization_pending",
        error: "Salla authorization is still pending. Retry in a few seconds.",
      },
      { status: 409, headers: { ...noStoreHeaders, "retry-after": "3" } },
    );
  } catch (error) {
    logEvent("error", "salla_embedded_session_failed", {
      ...context,
      merchantId: authority.merchantId,
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return NextResponse.json(
      { error: "The Salla embedded session is temporarily unavailable." },
      { status: 503, headers: { ...noStoreHeaders, "retry-after": "3" } },
    );
  }
}
