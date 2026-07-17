export type AcquisitionErrorCode =
  | "INVALID_CONTENT_TYPE"
  | "REQUEST_TOO_LARGE"
  | "INVALID_JSON"
  | "INVALID_REQUEST"
  | "INVALID_TOKEN"
  | "SCAN_NOT_FOUND"
  | "SCAN_NOT_READY"
  | "REPORT_NOT_FOUND"
  | "REPORT_EXPIRED"
  | "REPORT_REVOKED"
  | "REPORT_LOCKED"
  | "ORDER_NOT_FOUND"
  | "INVALID_ORDER_STATE"
  | "DUPLICATE_PAYMENT_REFERENCE"
  | "PAYMENT_REFERENCE_MISMATCH"
  | "SCAN_ALREADY_CLAIMED"
  | "AUTHENTICATION_REQUIRED"
  | "STORE_REQUIRED"
  | "FORBIDDEN"
  | "INVALID_ORIGIN"
  | "RATE_LIMITED"
  | "RATE_LIMIT_UNAVAILABLE"
  | "ACQUISITION_UNAVAILABLE";

export class AcquisitionError extends Error {
  constructor(
    readonly code: AcquisitionErrorCode,
    readonly status: number,
    readonly publicMessage: string,
  ) {
    super(publicMessage);
    this.name = "AcquisitionError";
  }
}
