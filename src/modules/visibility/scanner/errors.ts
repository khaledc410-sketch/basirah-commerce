export interface ScannerErrorOptions extends ErrorOptions {
  /** Internal scheduling hint; never serialized in a public scanner DTO. */
  retryAt?: Date;
}

export class ScannerError extends Error {
  readonly retryAt?: Date;

  constructor(
    readonly code: string,
    readonly publicMessage: string,
    options?: ScannerErrorOptions,
  ) {
    super(publicMessage, options);
    this.name = "ScannerError";
    this.retryAt = options?.retryAt;
  }
}

export function toScannerError(error: unknown): ScannerError {
  if (error instanceof ScannerError) {
    return error;
  }

  return new ScannerError(
    "SCAN_FAILED",
    "تعذر إكمال الفحص الآن. تحقق من أن الموقع متاح للعامة ثم أعد المحاولة.",
    error instanceof Error ? { cause: error } : undefined,
  );
}
