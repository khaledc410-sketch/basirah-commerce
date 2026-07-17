import "server-only";

export { AcquisitionError } from "./errors";
export {
  acquisitionErrorResponse,
  acquisitionJson,
  readBoundedJson,
} from "./http";
export {
  InMemoryAcquisitionRepository,
  PostgresAcquisitionRepository,
  getAcquisitionRepository,
} from "./repository";
export type { AcquisitionRepository } from "./repository";
export {
  claimRequestSchema,
  leadRequestSchema,
  opaqueIdentifierSchema,
  reportOrderRequestSchema,
} from "./schemas";
export {
  deriveShareToken,
  hashEmail,
  hashOpaqueToken,
  isAnonymousScanPurgeEligible,
  normalizeEmail,
  normalizePhone,
} from "./security";
export type {
  PublicSharedReportDto,
  ReportOrderDto,
  SavedLeadDto,
  ScanClaimDto,
} from "./types";

/**
 * Retention hook for a worker/cron. It deletes expired, unclaimed scans while
 * preserving paid financial records. Abandoned unpaid requests expire after
 * the repository's bounded contact-data retention window.
 */
export async function purgeExpiredAnonymousScans(limit = 100) {
  const { getAcquisitionRepository } = await import("./repository");
  const boundedLimit = Math.max(1, Math.min(500, Math.trunc(limit)));
  return getAcquisitionRepository().purgeExpiredAnonymousScans(boundedLimit);
}
