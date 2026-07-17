import "server-only";

import { z } from "zod";

const identifierSchema = z.union([z.string().min(1), z.number().int().positive()]);

const sallaUserInfoSchema = z.object({
  status: z.literal(200),
  success: z.literal(true),
  data: z.object({
    id: identifierSchema,
    merchant: z.object({ id: identifierSchema }),
  }),
});

export function parseSallaUserInfo(input: unknown) {
  const data = sallaUserInfoSchema.parse(input).data;
  return {
    userId: String(data.id),
    merchantId: String(data.merchant.id),
  };
}

export async function getSallaAuthorizerIdentity(accessToken: string) {
  const response = await fetch("https://accounts.salla.sa/oauth2/user/info", {
    method: "GET",
    headers: {
      accept: "application/json",
      authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    throw new Error("Salla authorizer identity could not be verified.");
  }
  return parseSallaUserInfo(await response.json());
}
