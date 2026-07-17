import { describe, expect, it } from "vitest";

import type { AuthIdentity } from "@/core/auth/session";
import type { StoreContext } from "@/core/data/tenant";
import { AcquisitionError } from "@/modules/acquisition/errors";
import type { VisibilityScanReport } from "@/modules/visibility/scanner/types";

import { assertTenantAccess } from "./route-access";
import { InMemoryTenantReportRepository } from "./tenant-reports";

function report(): VisibilityScanReport {
  return {
    domain: "example.sa",
    score: 72,
    coverage: 90,
    confidence: 86,
    components: [
      {
        key: "technical",
        label: "تقني",
        weight: 20,
        score: 72,
        coverage: 100,
      },
    ],
    findings: Array.from({ length: 4 }, (_, index) => ({
      id: `finding-${index + 1}`,
      component: "technical" as const,
      title: `نتيجة ${index + 1}`,
      description: "وصف موثق للنتيجة.",
      severity: index === 0 ? ("high" as const) : ("medium" as const),
      recommendation: "نفّذ الإصلاح ثم أعد الفحص.",
      evidenceIds: [`evidence-${index + 1}`],
    })),
    evidence: Array.from({ length: 4 }, (_, index) => ({
      id: `evidence-${index + 1}`,
      component: "technical" as const,
      checkKey: `check-${index + 1}`,
      status: "fail" as const,
      message: "دليل محفوظ.",
      urls: ["https://example.sa/"],
    })),
    limitations: ["Search Console غير متصل."],
    scannedAt: "2026-07-14T00:00:00.000Z",
    pagesScanned: 10,
  };
}

describe("tenant report access", () => {
  const identity: AuthIdentity = {
    userId: "00000000-0000-4000-8000-000000000001",
    mode: "production",
  };
  const store: StoreContext = {
    storeId: "store-a",
    organizationId: "org-a",
    name: "متجر أ",
    role: "owner",
    runtimeMode: "live",
  };

  it("rejects a path store that differs from the authenticated store", () => {
    expect(() =>
      assertTenantAccess({ requestedStoreId: "store-b", identity, store }),
    ).toThrowError(
      expect.objectContaining<Partial<AcquisitionError>>({ code: "FORBIDDEN", status: 403 }),
    );
  });

  it("enforces mutation roles independently from read access", () => {
    expect(() =>
      assertTenantAccess({
        requestedStoreId: "store-a",
        identity,
        store: { ...store, role: "viewer" },
        roles: ["owner", "admin"],
      }),
    ).toThrowError(
      expect.objectContaining<Partial<AcquisitionError>>({ code: "FORBIDDEN", status: 403 }),
    );
  });
});
describe("in-memory tenant report DAL", () => {
  function repository() {
    const repository = new InMemoryTenantReportRepository(
      undefined,
      () => new Date("2026-07-14T00:00:00.000Z"),
    );
    repository.register({
      id: "report-a",
      storeId: "store-a",
      report: report(),
      methodologyVersion: "site-readiness-v1",
      generatedAt: new Date("2026-07-14T00:00:00.000Z"),
      expiresAt: new Date("2027-07-14T00:00:00.000Z"),
      accessLevel: "preview",
    });
    return repository;
  }

  it("does not list, read, or share another tenant's report", async () => {
    const dal = repository();
    expect(await dal.list("store-b", 50)).toEqual([]);
    expect(await dal.get("store-b", "report-a")).toBeNull();
    await expect(dal.createShare("store-b", "report-a", "ar")).rejects.toMatchObject({
      code: "REPORT_NOT_FOUND",
      status: 404,
    });
  });

  it("keeps preview evidence gated and supports opaque share rotation/revocation", async () => {
    const dal = repository();
    const detail = await dal.get("store-a", "report-a");
    expect(detail).toMatchObject({
      id: "report-a",
      accessLevel: "preview",
      findingsCount: 4,
    });
    expect(detail?.findings).toHaveLength(3);
    expect(detail?.evidence).toEqual([]);

    const share = await dal.createShare("store-a", "report-a", "ar");
    expect(share.shareToken).toHaveLength(43);
    expect(share.sharePath).not.toContain("report-a");
    expect(dal.shared(share.shareToken)?.report.domain).toBe("example.sa");

    await expect(dal.revokeShare("store-a", "report-a")).resolves.toEqual({ revoked: true });
    expect(dal.shared(share.shareToken)).toBeNull();
    expect((await dal.get("store-a", "report-a"))?.shareActive).toBe(false);
  });
});
