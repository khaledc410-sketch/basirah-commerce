import { describe, expect, it } from "vitest";

import { decryptSecret, type EncryptedSecret } from "@/core/security/token-vault";
import { getTenantReportRepository } from "@/modules/reports/tenant-reports";
import type { VisibilityScanRecord } from "@/modules/visibility/scanner/types";

import { AcquisitionError } from "./errors";
import { readBoundedJson } from "./http";
import { InMemoryAcquisitionRepository } from "./repository";
import { leadRequestSchema, reportOrderRequestSchema } from "./schemas";
import {
  deriveShareToken,
  encryptContactField,
  encryptLeadEmail,
  hashEmail,
  hashOpaqueToken,
  isAnonymousScanPurgeEligible,
  normalizeEmail,
  normalizePhone,
} from "./security";

const encryptionKey = "test-key-material-with-at-least-32-characters";

function completedScan(expiresAt = "2026-07-21T00:00:00.000Z"): VisibilityScanRecord {
  return {
    token: "scan_token_with_sufficient_entropy_12345",
    input: {
      domain: "example.sa",
      normalizedUrl: "https://example.sa/",
      locale: "ar",
      countryCode: "SA",
    },
    status: "completed",
    progress: 100,
    currentStep: "complete",
    createdAt: "2026-07-14T00:00:00.000Z",
    expiresAt,
    report: {
      domain: "example.sa",
      score: 61,
      coverage: 90,
      confidence: 84,
      components: [
        {
          key: "technical",
          label: "تقني",
          weight: 20,
          score: 61,
          coverage: 100,
        },
      ],
      findings: [
        {
          id: "finding_1",
          component: "technical",
          title: "عنوان مفقود",
          description: "لا يوجد عنوان واضح.",
          severity: "high",
          recommendation: "أضف عنوانًا واضحًا.",
          evidenceIds: ["evidence_1"],
        },
      ],
      evidence: [
        {
          id: "evidence_1",
          component: "technical",
          checkKey: "title",
          status: "fail",
          message: "Missing title",
          urls: ["https://example.sa/"],
        },
      ],
      limitations: ["Search Console غير متصل"],
      scannedAt: "2026-07-14T00:02:00.000Z",
      pagesScanned: 1,
    },
  };
}

describe("acquisition validation", () => {
  it("keeps optional marketing consent false and rejects unknown fields", () => {
    expect(leadRequestSchema.parse({ email: "Owner@Example.sa" }).marketingConsent).toBe(false);
    expect(
      leadRequestSchema.safeParse({
        email: "owner@example.sa",
        marketingConsent: false,
        implicitConsent: true,
      }).success,
    ).toBe(false);
  });

  it("validates order contact fields without accepting arbitrary phone text", () => {
    expect(
      reportOrderRequestSchema.safeParse({
        name: "نورة محمد",
        email: "noura@example.sa",
        phone: "+٩٦٦ ٥٠ ١٢٣ ٤٥٦٧",
      }).success,
    ).toBe(true);
    expect(
      reportOrderRequestSchema.safeParse({
        name: "نورة محمد",
        email: "noura@example.sa",
        phone: "call me tomorrow",
      }).success,
    ).toBe(false);
    expect(
      reportOrderRequestSchema.safeParse({
        name: "نورة محمد",
        email: "noura@example.sa",
        phone: ".......",
      }).success,
    ).toBe(false);
  });
});

describe("acquisition security helpers", () => {
  it("normalizes and hashes email addresses with a keyed digest", () => {
    expect(normalizeEmail("  Owner@EXAMPLE.sa ")).toBe("owner@example.sa");
    const first = hashEmail("Owner@EXAMPLE.sa", encryptionKey);
    const second = hashEmail(" owner@example.sa ", encryptionKey);
    expect(first).toBe(second);
    expect(first).not.toContain("owner");
    expect(first).not.toBe(hashOpaqueToken("owner@example.sa"));
  });

  it("normalizes Arabic phone digits and encrypts contact fields with scoped AAD", () => {
    expect(normalizePhone("+٩٦٦ (٥٠) ١٢٣-٤٥٦٧")).toBe("+966501234567");
    const encrypted = encryptContactField({
      value: "owner@example.sa",
      keyMaterial: encryptionKey,
      orderId: "order-1",
      field: "email",
    });
    expect(encrypted).not.toContain("owner@example.sa");
    expect(
      decryptSecret(
        JSON.parse(encrypted) as EncryptedSecret,
        encryptionKey,
        "basirah:report-order:v1:order-1:email",
      ),
    ).toBe("owner@example.sa");
    expect(() =>
      decryptSecret(
        JSON.parse(encrypted) as EncryptedSecret,
        encryptionKey,
        "basirah:report-order:v1:order-2:email",
      ),
    ).toThrow();
  });

  it("encrypts a usable lead email separately from its lookup hash", () => {
    const encrypted = encryptLeadEmail({
      value: " Owner@Example.sa ",
      keyMaterial: encryptionKey,
      consentId: "consent-1",
    });
    expect(encrypted).not.toContain("owner@example.sa");
    expect(
      decryptSecret(
        JSON.parse(encrypted) as EncryptedSecret,
        encryptionKey,
        "basirah:lead-consent:v1:consent-1:email",
      ),
    ).toBe("owner@example.sa");
  });

  it("derives a stable opaque share token without embedding the scan token", () => {
    const source = "scan_token_with_sufficient_entropy_12345";
    const token = deriveShareToken(source, encryptionKey);
    expect(token).toBe(deriveShareToken(source, encryptionKey));
    expect(token.length).toBeGreaterThanOrEqual(40);
    expect(token).not.toContain(source);
  });
});

describe("bounded JSON", () => {
  it("rejects non-JSON and payloads larger than the streaming limit", async () => {
    await expect(
      readBoundedJson(
        new Request("https://example.test", {
          method: "POST",
          headers: { "content-type": "text/plain" },
          body: "{}",
        }),
      ),
    ).rejects.toMatchObject({ code: "INVALID_CONTENT_TYPE", status: 415 });

    await expect(
      readBoundedJson(
        new Request("https://example.test", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ value: "x".repeat(200) }),
        }),
        64,
      ),
    ).rejects.toMatchObject({ code: "REQUEST_TOO_LARGE", status: 413 });
  });
});

describe("demo acquisition repository", () => {
  it("saves a lead, resolves a hashed share link, and respects revocation", async () => {
    const repository = new InMemoryAcquisitionRepository(
      async () => completedScan(),
      () => new Date("2026-07-14T00:00:00.000Z"),
      encryptionKey,
    );
    const saved = await repository.saveLead({
      scanToken: "scan_token_with_sufficient_entropy_12345",
      email: "owner@example.sa",
      marketingConsent: false,
      locale: "ar",
    });
    expect(saved).toMatchObject({ saved: true, marketingConsent: false });
    expect(await repository.getSharedReport(saved.shareToken)).toMatchObject({
      report: {
        domain: "example.sa",
        score: 61,
        evidence: [{ id: "evidence_1" }],
      },
      accessLevel: "full",
    });

    repository.revokeShare(saved.shareToken);
    await expect(repository.getSharedReport(saved.shareToken)).rejects.toMatchObject({
      code: "REPORT_REVOKED",
      status: 410,
    });
  });

  it("creates only a pending-payment order and makes claims idempotent", async () => {
    const repository = new InMemoryAcquisitionRepository(
      async () => completedScan(),
      () => new Date("2026-07-14T00:00:00.000Z"),
      encryptionKey,
    );
    const order = await repository.createReportOrder({
      reportIdentifier: "scan_token_with_sufficient_entropy_12345",
      name: "نورة محمد",
      email: "noura@example.sa",
      phone: "+966501234567",
      marketingConsent: false,
      locale: "ar",
    });
    expect(order).toMatchObject({
      status: "pending_payment",
      amount: 399,
      amountMinor: 39_900,
      currency: "SAR",
      taxIncluded: false,
    });
    expect(order).not.toHaveProperty("paidAt");
    expect(order).not.toHaveProperty("entitlement");

    const input = {
      scanToken: "scan_token_with_sufficient_entropy_12345",
      userId: "user-1",
      storeId: "store-1",
    };
    const firstClaim = await repository.claimScan(input);
    expect(firstClaim).toMatchObject({
      claimed: true,
      alreadyClaimed: false,
      claimMode: "copied",
    });
    await expect(
      getTenantReportRepository().get("store-1", firstClaim.reportId),
    ).resolves.toMatchObject({
      id: firstClaim.reportId,
      expiresAt: "2027-07-14T00:00:00.000Z",
      accessLevel: "full",
    });
    expect(await repository.claimScan(input)).toMatchObject({
      claimed: true,
      alreadyClaimed: true,
      claimMode: "copied",
    });
    await expect(
      repository.claimScan({ ...input, storeId: "store-2" }),
    ).rejects.toBeInstanceOf(AcquisitionError);
  });
});

describe("anonymous retention eligibility", () => {
  const expired = new Date("2026-07-13T00:00:00.000Z");
  const now = new Date("2026-07-14T00:00:00.000Z");

  it("allows only expired, unclaimed scans with no order", () => {
    expect(
      isAnonymousScanPurgeEligible(
        { expiresAt: expired, claimedStoreId: null, claimedByUserId: null, orderCount: 0 },
        now,
      ),
    ).toBe(true);
    expect(
      isAnonymousScanPurgeEligible(
        { expiresAt: expired, claimedStoreId: "store-1", claimedByUserId: "user-1", orderCount: 0 },
        now,
      ),
    ).toBe(false);
    expect(
      isAnonymousScanPurgeEligible(
        { expiresAt: expired, claimedStoreId: null, claimedByUserId: null, orderCount: 1 },
        now,
      ),
    ).toBe(false);
  });
});
