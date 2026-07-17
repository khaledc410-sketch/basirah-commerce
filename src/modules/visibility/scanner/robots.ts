import "server-only";

interface RobotsRule {
  directive: "allow" | "disallow";
  pattern: string;
}
interface RobotsGroup {
  agents: string[];
  rules: RobotsRule[];
}

export interface RobotsPolicy {
  sitemaps: string[];
  isAllowed(url: URL): boolean;
}

function patternMatches(path: string, pattern: string) {
  if (!pattern) return false;
  const anchored = pattern.endsWith("$");
  const raw = anchored ? pattern.slice(0, -1) : pattern;
  const regexSource = raw
    .split("*")
    .map((part) => part.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&"))
    .join(".*");
  return new RegExp(`^${regexSource}${anchored ? "$" : ""}`, "u").test(path);
}

export function parseRobotsTxt(source: string, userAgent = "BasirahVisibilityBot"): RobotsPolicy {
  const groups: RobotsGroup[] = [];
  const sitemaps: string[] = [];
  let current: RobotsGroup | null = null;
  let hasRules = false;

  for (const rawLine of source.split(/\r?\n/u)) {
    const line = rawLine.replace(/#.*$/u, "").trim();
    if (!line) continue;
    const separator = line.indexOf(":");
    if (separator < 0) continue;
    const directive = line.slice(0, separator).trim().toLowerCase();
    const value = line.slice(separator + 1).trim();

    if (directive === "sitemap") {
      if (value) sitemaps.push(value);
      continue;
    }
    if (directive === "user-agent") {
      if (!current || hasRules) {
        current = { agents: [], rules: [] };
        groups.push(current);
        hasRules = false;
      }
      current.agents.push(value.toLowerCase());
      continue;
    }
    if ((directive === "allow" || directive === "disallow") && current) {
      current.rules.push({ directive, pattern: value });
      hasRules = true;
    }
  }

  const normalizedAgent = userAgent.toLowerCase();
  const explicitGroups = groups.filter((group) =>
    group.agents.some((agent) => agent !== "*" && normalizedAgent.includes(agent)),
  );
  const selected = explicitGroups.length
    ? explicitGroups
    : groups.filter((group) => group.agents.includes("*"));
  const rules = selected.flatMap((group) => group.rules);

  return {
    sitemaps: [...new Set(sitemaps)],
    isAllowed(url) {
      const path = `${url.pathname}${url.search}`;
      const matching = rules
        .filter((rule) => patternMatches(path, rule.pattern))
        .sort((left, right) => {
          const lengthDifference = right.pattern.length - left.pattern.length;
          if (lengthDifference !== 0) return lengthDifference;
          return left.directive === "allow" ? -1 : 1;
        });
      return matching[0]?.directive !== "disallow";
    },
  };
}
