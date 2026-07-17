import "server-only";

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

export interface EncryptedSecret {
  version: 1;
  algorithm: "aes-256-gcm";
  ciphertext: string;
  iv: string;
  authTag: string;
}

function normalizeKey(keyMaterial: string) {
  if (keyMaterial.length < 32) {
    throw new Error("Token encryption key must contain at least 32 characters.");
  }
  return createHash("sha256").update(keyMaterial, "utf8").digest();
}

export function encryptSecret(plaintext: string, keyMaterial: string, aad?: string): EncryptedSecret {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", normalizeKey(keyMaterial), iv);
  if (aad) cipher.setAAD(Buffer.from(aad, "utf8"));
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return {
    version: 1,
    algorithm: "aes-256-gcm",
    ciphertext: ciphertext.toString("base64url"),
    iv: iv.toString("base64url"),
    authTag: cipher.getAuthTag().toString("base64url"),
  };
}

export function decryptSecret(encrypted: EncryptedSecret, keyMaterial: string, aad?: string) {
  if (encrypted.version !== 1 || encrypted.algorithm !== "aes-256-gcm") {
    throw new Error("Unsupported encrypted-secret format.");
  }
  const decipher = createDecipheriv(
    "aes-256-gcm",
    normalizeKey(keyMaterial),
    Buffer.from(encrypted.iv, "base64url"),
  );
  if (aad) decipher.setAAD(Buffer.from(aad, "utf8"));
  decipher.setAuthTag(Buffer.from(encrypted.authTag, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(encrypted.ciphertext, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}
