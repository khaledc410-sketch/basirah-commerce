import { createHash, createHmac } from "node:crypto";

import { encryptSecret } from "@/core/security/token-vault";

const arabicDigits = "٠١٢٣٤٥٦٧٨٩";
const easternArabicDigits = "۰۱۲۳۴۵۶۷۸۹";

export function normalizeEmail(value: string) {
  return value.trim().normalize("NFKC").toLocaleLowerCase("en-US");
}
export function normalizePhone(value: string) {
  const latinDigits = Array.from(value.normalize("NFKC"), (character) => {
    const arabicIndex = arabicDigits.indexOf(character);
    if (arabicIndex >= 0) return String(arabicIndex);
    const easternIndex = easternArabicDigits.indexOf(character);
    if (easternIndex >= 0) return String(easternIndex);
    return character;
  }).join("");
  const hasLeadingPlus = latinDigits.trimStart().startsWith("+");
  const digits = latinDigits.replace(/\D/gu, "");
  return `${hasLeadingPlus ? "+" : ""}${digits}`;
}

/** Suitable for high-entropy, unguessable tokens. */
export function hashOpaqueToken(token: string) {
  return createHash("sha256").update(token, "utf8").digest("base64url");
}

/** Keyed so low-entropy email addresses cannot be recovered with a rainbow table. */
export function hashEmail(email: string, keyMaterial: string) {
  return createHmac("sha256", keyMaterial)
    .update(normalizeEmail(email), "utf8")
    .digest("base64url");
}

/** Stable, opaque share token; only its SHA-256 digest is persisted. */
export function deriveShareToken(scanToken: string, keyMaterial: string) {
  return createHmac("sha256", keyMaterial)
    .update(`basirah:report-share:v1:${scanToken}`, "utf8")
    .digest("base64url");
}

export function encryptContactField(input: {
  value: string;
  keyMaterial: string;
  orderId: string;
  field: "name" | "email" | "phone";
}) {
  return JSON.stringify(
    encryptSecret(
      input.value,
      input.keyMaterial,
      `basirah:report-order:v1:${input.orderId}:${input.field}`,
    ),
  );
}

export function encryptLeadEmail(input: {
  value: string;
  keyMaterial: string;
  consentId: string;
}) {
  return JSON.stringify(
    encryptSecret(
      normalizeEmail(input.value),
      input.keyMaterial,
      `basirah:lead-consent:v1:${input.consentId}:email`,
    ),
  );
}

export function isAnonymousScanPurgeEligible(
  input: {
    expiresAt: Date;
    claimedStoreId: string | null;
    claimedByUserId: string | null;
    orderCount: number;
  },
  now = new Date(),
) {
  return (
    input.expiresAt.getTime() <= now.getTime() &&
    input.claimedStoreId === null &&
    input.claimedByUserId === null &&
    input.orderCount === 0
  );
}
