import type { VisibilityScanReport } from "@/modules/visibility/scanner";

export type ReportAccessLevel = "preview" | "full";

export interface SavedLeadDto {
  saved: true;
  shareToken: string;
  sharePath: string;
  marketingConsent: boolean;
}

export interface ReportOrderDto {
  id: string;
  status: "pending_payment";
  /** Human currency unit. The persisted amount uses minor units. */
  amount: 399;
  amountMinor: 39_900;
  currency: "SAR";
  taxIncluded: false;
  message: string;
}

export interface ScanClaimDto {
  claimed: true;
  alreadyClaimed: boolean;
  storeId: string;
  reportId: string;
  /** The prospect scan and its evidence were copied atomically into tenant audit tables. */
  claimMode: "copied";
  accessLevel: "full";
}

export interface PublicSharedReportDto {
  report: Pick<
    VisibilityScanReport,
    | "domain"
    | "score"
    | "coverage"
    | "confidence"
    | "components"
    | "findings"
    | "evidence"
    | "organicGrowthPlan"
    | "limitations"
    | "scannedAt"
    | "pagesScanned"
  >;
  accessLevel: ReportAccessLevel;
  expiresAt: string;
}

export interface SaveLeadInput {
  scanToken: string;
  email: string;
  marketingConsent: boolean;
  locale: "ar" | "en";
}

export interface CreateReportOrderInput {
  reportIdentifier: string;
  name: string;
  email: string;
  phone: string;
  marketingConsent: boolean;
  locale: "ar" | "en";
}

export interface ClaimScanInput {
  scanToken: string;
  userId: string;
  storeId: string;
}
