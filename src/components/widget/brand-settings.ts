export type AdvisorCornerStyle = "soft" | "rounded" | "extra-rounded";
export type AdvisorLauncherPosition = "right" | "left";

export interface AdvisorBrandSettings {
  storeName: string;
  advisorName: string;
  welcomeMessage: string;
  suggestedPrompts: string[];
  primaryColor: string;
  accentColor: string;
  cornerStyle: AdvisorCornerStyle;
  launcherPosition: AdvisorLauncherPosition;
  logoDataUrl?: string;
}

export const ADVISOR_BRAND_STORAGE_KEY = "basirah-demo-advisor-brand-v1";

export const defaultAdvisorBrandSettings: AdvisorBrandSettings = {
  storeName: "متجرك",
  advisorName: "مستشار المتجر",
  welcomeMessage: "أهلًا وسهلًا! يسعدنا خدمتك، كيف أقدر أساعدك اليوم؟",
  suggestedPrompts: [
    "ساعدني أختار",
    "بشرتي دهنية وميزانيتي 150",
    "قارن المنتجات",
    "الشحن والاسترجاع",
  ],
  primaryColor: "#4338CA",
  accentColor: "#0F9F8F",
  cornerStyle: "rounded",
  launcherPosition: "right",
};

export const demoAdvisorBrandSettings: AdvisorBrandSettings = {
  ...defaultAdvisorBrandSettings,
  storeName: "مَدى للعناية",
  advisorName: "مستشار مَدى",
  welcomeMessage: "أهلًا بك في مَدى للعناية! يسعدنا خدمتك، كيف أقدر أساعدك اليوم؟",
};

const HEX_COLOR_PATTERN = /^#[0-9A-F]{6}$/i;

export function isHexColor(value: string): boolean {
  return HEX_COLOR_PATTERN.test(value);
}

export function getReadableTextColor(background: string): "#FFFFFF" | "#111827" {
  if (!isHexColor(background)) return "#FFFFFF";

  const channels = [1, 3, 5].map((start) => {
    const value = Number.parseInt(background.slice(start, start + 2), 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  const luminance = 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
  const contrastWithWhite = 1.05 / (luminance + 0.05);
  const darkLuminance = 0.0097;
  const contrastWithDark = (luminance + 0.05) / (darkLuminance + 0.05);

  return contrastWithDark >= contrastWithWhite ? "#111827" : "#FFFFFF";
}

export function parseStoredBrandSettings(value: string): AdvisorBrandSettings | null {
  try {
    const candidate = JSON.parse(value) as Partial<AdvisorBrandSettings>;
    const prompts = Array.isArray(candidate.suggestedPrompts)
      ? candidate.suggestedPrompts.filter((prompt): prompt is string => typeof prompt === "string").slice(0, 4)
      : defaultAdvisorBrandSettings.suggestedPrompts;

    if (
      typeof candidate.storeName !== "string" ||
      typeof candidate.advisorName !== "string" ||
      typeof candidate.welcomeMessage !== "string" ||
      typeof candidate.primaryColor !== "string" ||
      typeof candidate.accentColor !== "string" ||
      !isHexColor(candidate.primaryColor) ||
      !isHexColor(candidate.accentColor) ||
      !["soft", "rounded", "extra-rounded"].includes(candidate.cornerStyle ?? "") ||
      !["right", "left"].includes(candidate.launcherPosition ?? "") ||
      prompts.length < 2
    ) {
      return null;
    }

    return {
      ...defaultAdvisorBrandSettings,
      ...candidate,
      suggestedPrompts: prompts,
      logoDataUrl:
        typeof candidate.logoDataUrl === "string" && candidate.logoDataUrl.startsWith("data:image/")
          ? candidate.logoDataUrl
          : undefined,
    } as AdvisorBrandSettings;
  } catch {
    return null;
  }
}
