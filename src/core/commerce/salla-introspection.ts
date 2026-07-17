import "server-only";

import { z } from "zod";

import { getServerEnv } from "@/config/env";

export type SallaIntrospectionErrorKind =
  | "invalid_token"
  | "unavailable"
  | "configuration";

export class SallaIntrospectionError extends Error {
  constructor(
    readonly kind: SallaIntrospectionErrorKind,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "SallaIntrospectionError";
  }
}

const introspectionSchema = z.object({
  status: z.number().int(),
  success: z.literal(true),
  data: z.object({
    merchant_id: z.union([z.string().min(1), z.number().int().positive()]),
    user_id: z.union([z.string().min(1), z.number().int().positive()]).optional(),
    exp: z.union([z.string().min(1), z.number().positive()]),
  }),
});

function expiryDate(value: string | number) {
  if (typeof value === "number") {
    return new Date(value > 10_000_000_000 ? value : value * 1_000);
  }
  if (/^\d+(?:\.\d+)?$/u.test(value)) {
    const numeric = Number(value);
    return new Date(numeric > 10_000_000_000 ? numeric : numeric * 1_000);
  }
  return new Date(value);
}

export function parseSallaIntrospection(input: unknown) {
  const result = introspectionSchema.parse(input).data;
  const expiresAt = expiryDate(result.exp);
  if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() <= Date.now()) {
    throw new SallaIntrospectionError(
      "invalid_token",
      "The Salla embedded token has expired.",
    );
  }
  return {
    merchantId: String(result.merchant_id),
    userId: result.user_id === undefined ? undefined : String(result.user_id),
    expiresAt,
  };
}

export async function introspectSallaEmbeddedToken(token: string) {
  const appId = getServerEnv().SALLA_APP_ID;
  if (!appId) {
    throw new SallaIntrospectionError(
      "configuration",
      "Salla App ID is not configured.",
    );
  }

  let response: Response;
  try {
    response = await fetch("https://api.salla.dev/exchange-authority/v1/introspect", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "S-Source": appId,
      },
      body: JSON.stringify({ token }),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
  } catch (error) {
    throw new SallaIntrospectionError(
      "unavailable",
      "Salla embedded authorization is temporarily unavailable.",
      { cause: error },
    );
  }

  if (!response.ok) {
    const retryable = response.status >= 500 || response.status === 408 || response.status === 429;
    throw new SallaIntrospectionError(
      retryable ? "unavailable" : "invalid_token",
      retryable
        ? "Salla embedded authorization is temporarily unavailable."
        : "Salla embedded authorization could not be verified.",
    );
  }

  try {
    return parseSallaIntrospection(await response.json());
  } catch (error) {
    if (error instanceof SallaIntrospectionError) throw error;
    throw new SallaIntrospectionError(
      "unavailable",
      "Salla returned an invalid introspection response.",
      { cause: error },
    );
  }
}
