import "server-only";

import { isIP } from "node:net";

import { ScannerError } from "./errors";

const blockedHostnameSuffixes = [
  ".localhost",
  ".local",
  ".internal",
  ".home.arpa",
  ".test",
  ".invalid",
  ".example",
];

function ipv4ToNumber(address: string) {
  return address
    .split(".")
    .map(Number)
    .reduce((value, octet) => value * 256 + octet, 0);
}

function isInIpv4Range(address: string, base: string, prefix: number) {
  const value = ipv4ToNumber(address);
  const baseValue = ipv4ToNumber(base);
  const blockSize = 2 ** (32 - prefix);
  return Math.floor(value / blockSize) === Math.floor(baseValue / blockSize);
}

const blockedIpv4Ranges: Array<[string, number]> = [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.88.99.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
];

function expandIpv6(address: string): number[] | null {
  const withoutZone = address.toLowerCase().split("%")[0];
  const doubleColonParts = withoutZone.split("::");
  if (doubleColonParts.length > 2) {
    return null;
  }

  const parseSide = (side: string) => {
    if (!side) return [];
    const output: number[] = [];
    for (const part of side.split(":")) {
      if (part.includes(".")) {
        if (isIP(part) !== 4) return null;
        const value = ipv4ToNumber(part);
        output.push(Math.floor(value / 65536), value % 65536);
      } else if (/^[\da-f]{1,4}$/u.test(part)) {
        output.push(Number.parseInt(part, 16));
      } else {
        return null;
      }
    }
    return output;
  };

  const left = parseSide(doubleColonParts[0]);
  const right = parseSide(doubleColonParts[1] ?? "");
  if (!left || !right) return null;
  const missing = 8 - left.length - right.length;
  if ((doubleColonParts.length === 1 && missing !== 0) || missing < 0) return null;
  return [...left, ...Array.from({ length: missing }, () => 0), ...right];
}

export function isPublicIpAddress(address: string) {
  const version = isIP(address);
  if (version === 4) {
    return !blockedIpv4Ranges.some(([base, prefix]) => isInIpv4Range(address, base, prefix));
  }
  if (version !== 6) return false;

  const words = expandIpv6(address.replace(/^\[|\]$/gu, ""));
  if (!words) return false;
  const allZero = words.every((word) => word === 0);
  const loopback = words.slice(0, 7).every((word) => word === 0) && words[7] === 1;
  const uniqueLocal = (words[0] & 0xfe00) === 0xfc00;
  const linkLocal = (words[0] & 0xffc0) === 0xfe80;
  const siteLocal = (words[0] & 0xffc0) === 0xfec0;
  const multicast = (words[0] & 0xff00) === 0xff00;
  const documentation = words[0] === 0x2001 && words[1] === 0x0db8;
  const ipv4Mapped = words.slice(0, 5).every((word) => word === 0) && words[5] === 0xffff;
  const ipv4Compatible = words.slice(0, 6).every((word) => word === 0);
  const translationPrefix = words[0] === 0x0064 && words[1] === 0xff9b;
  const discardPrefix = words[0] === 0x0100 && words.slice(1, 4).every((word) => word === 0);
  return !(
    allZero ||
    loopback ||
    uniqueLocal ||
    linkLocal ||
    siteLocal ||
    multicast ||
    documentation ||
    ipv4Mapped ||
    ipv4Compatible ||
    translationPrefix ||
    discardPrefix
  );
}

export function assertPublicHostname(hostname: string) {
  const normalized = hostname.toLowerCase().replace(/^\[|\]$/gu, "").replace(/\.$/u, "");
  const blockedName =
    normalized === "localhost" ||
    normalized === "instance-data" ||
    normalized === "metadata.google.internal" ||
    !normalized.includes(".") ||
    blockedHostnameSuffixes.some((suffix) => normalized.endsWith(suffix));

  if (blockedName || (isIP(normalized) > 0 && !isPublicIpAddress(normalized))) {
    throw new ScannerError(
      "PRIVATE_ADDRESS",
      "لا يمكن فحص عناوين الشبكات الخاصة أو المحلية.",
    );
  }
}

export function normalizePublicUrl(input: string) {
  const trimmed = input.trim();
  if (!trimmed || trimmed.length > 2048) {
    throw new ScannerError("INVALID_URL", "أدخل نطاق متجر صالحًا بطول معقول.");
  }

  const withScheme = /^[a-z][a-z\d+.-]*:\/\//iu.test(trimmed) ? trimmed : `https://${trimmed}`;
  let url: URL;
  try {
    url = new URL(withScheme);
  } catch (error) {
    throw new ScannerError("INVALID_URL", "أدخل نطاق متجر صالحًا مثل example.com.", {
      cause: error,
    });
  }

  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
    throw new ScannerError(
      "INVALID_URL",
      "يجب أن يكون العنوان عامًا ويستخدم HTTP أو HTTPS دون بيانات دخول.",
    );
  }

  const allowedPorts = url.protocol === "https:" ? ["", "443", "8443"] : ["", "80", "8080"];
  if (!allowedPorts.includes(url.port)) {
    throw new ScannerError(
      "INVALID_PORT",
      "يستخدم العنوان منفذًا غير مسموح للفحص العام.",
    );
  }

  assertPublicHostname(url.hostname);
  url.hash = "";
  url.hostname = url.hostname.toLowerCase().replace(/\.$/u, "");
  return url;
}

export function normalizedUrlString(input: string) {
  return normalizePublicUrl(input).toString();
}
