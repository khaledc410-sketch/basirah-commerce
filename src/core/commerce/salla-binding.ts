const sallaBindingClaimPattern = /^[A-Za-z0-9_-]{43,128}$/u;

export function isValidSallaBindingClaim(value: unknown): value is string {
  return typeof value === "string" && sallaBindingClaimPattern.test(value);
}

export function parseSallaBindingClaimBody(value: string) {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      Array.isArray(parsed) ||
      Object.keys(parsed).length !== 1 ||
      !("claim" in parsed) ||
      !isValidSallaBindingClaim(parsed.claim)
    ) {
      return null;
    }
    return parsed.claim;
  } catch {
    return null;
  }
}

export function protectedNextTarget(url: URL) {
  const target = new URL(url.pathname + url.search, "https://basirah.invalid");
  if (target.pathname === "/setup/connect/salla") {
    target.searchParams.delete("token");
    target.searchParams.delete("claim");
  }
  return `${target.pathname}${target.search}`;
}
