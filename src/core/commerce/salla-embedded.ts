import "server-only";

import { createHash, randomUUID } from "node:crypto";

import { SignJWT, jwtVerify } from "jose";
import { z } from "zod";

import { getServerEnv } from "@/config/env";
import { findActivePlatformConnectionByExternalStoreId } from "@/db/repositories/platform-connection-repository";

export const sallaBindingCookieName = "__Host-basirah-salla-binding";
export const sallaEmbeddedSessionAudience = "basirah:salla:embedded";

const sessionLifetimeSeconds = 10 * 60;
const purposeSeparationLabel = "basirah:salla-embedded-session:hs256:v1\0";

const embeddedSessionClaimsSchema = z
  .object({
    iss: z.string().url(),
    aud: z.literal(sallaEmbeddedSessionAudience),
    sub: z.string().min(1),
    jti: z.string().uuid(),
    iat: z.number().int().nonnegative(),
    exp: z.number().int().positive(),
    type: z.literal("salla_embedded_session"),
    app: z.string().min(1),
    merchant: z.string().min(1),
    user: z.string().min(1),
    store: z.string().uuid(),
    connection: z.string().uuid(),
  })
  .strict();

export type SallaEmbeddedSessionClaims = z.infer<typeof embeddedSessionClaimsSchema>;

export async function issueSallaEmbeddedSession(input: {
  merchantId: string;
  userId: string;
  storeId: string;
  connectionId: string;
  authorityExpiresAt: Date;
  now?: Date;
}) {
  const connection = await findActivePlatformConnectionByExternalStoreId(
    "salla",
    input.merchantId,
  );
  if (
    !connection ||
    connection.id !== input.connectionId ||
    connection.storeId !== input.storeId
  ) {
    throw new Error("The Salla embedded connection is no longer active.");
  }
  const env = embeddedEnvironment();
  const now = input.now ?? new Date();
  const issuedAt = Math.floor(now.getTime() / 1_000);
  const expiresAt = Math.min(
    issuedAt + sessionLifetimeSeconds,
    Math.floor(input.authorityExpiresAt.getTime() / 1_000),
  );
  if (expiresAt <= issuedAt) {
    throw new Error("The Salla embedded authority expires too soon.");
  }

  const sessionToken = await new SignJWT({
    type: "salla_embedded_session",
    app: env.appId,
    merchant: input.merchantId,
    user: input.userId,
    store: input.storeId,
    connection: input.connectionId,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuer(env.issuer)
    .setAudience(sallaEmbeddedSessionAudience)
    .setSubject(`salla:${input.merchantId}:${input.userId}`)
    .setJti(randomUUID())
    .setIssuedAt(issuedAt)
    .setExpirationTime(expiresAt)
    .sign(env.signingKey);

  return {
    sessionToken,
    expiresAt: new Date(expiresAt * 1_000),
  };
}

/**
 * Verifies the self-contained session and then re-checks the live connection
 * boundary. A valid JWT cannot outlive an uninstall or connection replacement.
 */
export async function verifySallaEmbeddedSession(token: string) {
  const env = embeddedEnvironment();
  const result = await jwtVerify(token, env.signingKey, {
    algorithms: ["HS256"],
    issuer: env.issuer,
    audience: sallaEmbeddedSessionAudience,
    clockTolerance: 5,
  });
  if (result.protectedHeader.alg !== "HS256" || result.protectedHeader.typ !== "JWT") {
    throw new Error("Invalid Salla embedded session header.");
  }
  const claims = embeddedSessionClaimsSchema.parse(result.payload);
  const now = Math.floor(Date.now() / 1_000);
  if (
    claims.app !== env.appId ||
    claims.exp - claims.iat > sessionLifetimeSeconds ||
    claims.iat > now + 5
  ) {
    throw new Error("Invalid Salla embedded session claims.");
  }

  const connection = await findActivePlatformConnectionByExternalStoreId(
    "salla",
    claims.merchant,
  );
  if (
    !connection ||
    connection.id !== claims.connection ||
    connection.storeId !== claims.store
  ) {
    throw new Error("The Salla embedded connection is no longer active.");
  }
  return claims;
}

function embeddedEnvironment() {
  const env = getServerEnv();
  if (!env.TOKEN_ENCRYPTION_KEY || !env.SALLA_APP_ID) {
    throw new Error("Salla embedded sessions are not configured.");
  }
  const appOrigin = new URL(env.APP_URL).origin;
  return {
    appId: env.SALLA_APP_ID,
    issuer: `${appOrigin}/salla/embedded`,
    // Domain separation prevents the AES-GCM credential key from being used
    // directly as an HMAC key while retaining a single deploy-time root secret.
    signingKey: createHash("sha256")
      .update(purposeSeparationLabel, "utf8")
      .update(env.TOKEN_ENCRYPTION_KEY, "utf8")
      .digest(),
  };
}
