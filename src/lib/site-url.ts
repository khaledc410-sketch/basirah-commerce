export function normalizeAppOrigin(appUrl: string): string {
  return new URL(appUrl).origin;
}
