import "server-only";

import { readFileSync } from "node:fs";
import { join } from "node:path";

import PDFDocument from "pdfkit";

import type { PublicSharedReportDto } from "@/modules/acquisition/types";

const fontRoot = join(process.cwd(), "node_modules/@ibm/plex-sans-arabic");
const regularFont = readFileSync(
  join(fontRoot, "fonts/complete/woff/IBMPlexSansArabic-Regular.woff"),
);
const semiboldFont = readFileSync(
  join(fontRoot, "fonts/complete/woff/IBMPlexSansArabic-SemiBold.woff"),
);

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 48;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

const colors = {
  canvas: "#F7F8FC",
  white: "#FFFFFF",
  ink: "#111827",
  muted: "#667085",
  subtle: "#98A2B3",
  primary: "#4F46D8",
  primaryDeep: "#3730A3",
  primarySoft: "#EEEDFF",
  primaryFaint: "#F7F6FF",
  success: "#087A5A",
  successSoft: "#EAF8F2",
  warning: "#A15C06",
  warningSoft: "#FFF5E6",
  danger: "#B42318",
  dangerSoft: "#FFF0EE",
  info: "#175CD3",
  infoSoft: "#EFF6FF",
  border: "#DCE1EA",
  track: "#E8EAF1",
};

type Locale = "ar" | "en";

export interface FreeReportPdfInput {
  result: PublicSharedReportDto;
  locale: Locale;
  reportUrl: string;
  pricingUrl: string;
}

function textOptions(locale: Locale): PDFKit.Mixins.TextOptions {
  return locale === "ar"
    ? { align: "right", features: ["rtla", "rlig", "calt"], lineGap: 3 }
    : { align: "left", lineGap: 3 };
}

function formatDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Riyadh",
  }).formatToParts(parsed);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function pdfText(value: string, locale: Locale) {
  if (locale !== "ar") return value;
  return value
    .replace(/Product\s*(?:و|and|&)\s*Offer/giu, "بيانات المنتج والعرض المنظمة")
    .replace(/Product/giu, "بيانات المنتج المنظمة")
    .replace(/Offer/giu, "بيانات العرض المنظمة")
    .replace(/sitemap\.xml/giu, "خريطة الموقع")
    .replace(/robots\.txt/giu, "ملف تعليمات الزحف")
    .replace(/Search Console/giu, "أدوات مشرفي بحث غوغل")
    .replace(/ChatGPT/giu, "شات جي بي تي")
    .replace(/Gemini/giu, "جيمناي")
    .replace(/Google/giu, "غوغل")
    .replace(/GA4/giu, "تحليلات غوغل")
    .replace(/\bH1\b/gu, "العنوان الرئيسي")
    .replace(/\bH2\b/gu, "العنوان الفرعي")
    .replace(/\bH3\b/gu, "العنوان التفصيلي");
}

function scoreDiagnosis(score: number, locale: Locale) {
  if (score < 40) {
    return locale === "ar"
      ? "الأساس يحتاج إصلاحًا قبل التوسع. أنظمة البحث والإجابة قد تجد صعوبة في فهم هوية المتجر والاعتماد على حقائقه بثبات."
      : "The foundation needs work before expansion. Search and answer systems may struggle to understand the store and rely on its facts.";
  }
  if (score < 70) {
    return locale === "ar"
      ? "لدى المتجر أساس قابل للبناء، لكن فجوات واضحة تضعف فهم العلامة والمنتجات والثقة بها. ابدأ بالأولويات الأعلى أثرًا."
      : "The store has a workable foundation, but clear gaps weaken brand, product, and trust signals. Start with the highest-impact priorities.";
  }
  return locale === "ar"
    ? "الأساس جيد. الفرصة الآن هي إغلاق الفجوات المتبقية، وتوحيد الحقائق، ثم إعادة الفحص لإثبات التحسن."
    : "The foundation is strong. Close the remaining gaps, make facts consistent, then rescan to prove improvement.";
}

function scoreBand(score: number, locale: Locale) {
  if (score < 40) {
    return {
      label: locale === "ar" ? "يحتاج تأسيسًا" : "Foundation needed",
      color: colors.danger,
      soft: colors.dangerSoft,
    };
  }
  if (score < 70) {
    return {
      label: locale === "ar" ? "قابل للبناء" : "Ready to build",
      color: colors.warning,
      soft: colors.warningSoft,
    };
  }
  return {
    label: locale === "ar" ? "أساس قوي" : "Strong foundation",
    color: colors.success,
    soft: colors.successSoft,
  };
}

function componentLabel(key: string, fallback: string, locale: Locale) {
  const labels: Record<string, { ar: string; en: string }> = {
    technical: { ar: "الأساس التقني", en: "Technical foundation" },
    content: { ar: "جودة المحتوى", en: "Content quality" },
    entity: { ar: "وضوح الكيان", en: "Entity clarity" },
    trust: { ar: "إشارات الثقة", en: "Trust signals" },
    answerability: { ar: "قابلية الإجابة", en: "Answerability" },
    structuredData: { ar: "البيانات المنظمة", en: "Structured data" },
    externalEvidence: { ar: "الأدلة الخارجية", en: "External evidence" },
  };
  return labels[key]?.[locale] ?? fallback;
}

function componentState(score: number | null, locale: Locale) {
  if (score === null) {
    return {
      label: locale === "ar" ? "غير متاح" : "Unavailable",
      color: colors.muted,
      soft: colors.track,
    };
  }
  if (score < 50) {
    return {
      label: locale === "ar" ? "أولوية" : "Priority",
      color: colors.danger,
      soft: colors.dangerSoft,
    };
  }
  if (score < 70) {
    return {
      label: locale === "ar" ? "يحتاج تحسينًا" : "Improve",
      color: colors.warning,
      soft: colors.warningSoft,
    };
  }
  return {
    label: locale === "ar" ? "جيد" : "Strong",
    color: colors.success,
    soft: colors.successSoft,
  };
}

function severityDetails(severity: "high" | "medium" | "low", locale: Locale) {
  if (severity === "high") {
    return {
      label: locale === "ar" ? "أثر عالٍ" : "High impact",
      color: colors.danger,
      soft: colors.dangerSoft,
    };
  }
  if (severity === "medium") {
    return {
      label: locale === "ar" ? "أثر متوسط" : "Medium impact",
      color: colors.warning,
      soft: colors.warningSoft,
    };
  }
  return {
    label: locale === "ar" ? "أثر منخفض" : "Low impact",
    color: colors.info,
    soft: colors.infoSoft,
  };
}

function card(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  width: number,
  height: number,
  fill = colors.white,
  radius = 14,
  border = colors.border,
) {
  doc.roundedRect(x, y, width, height, radius).fillAndStroke(fill, border);
}

function drawLogo(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  locale: Locale,
) {
  doc.roundedRect(x, y, 34, 34, 10).fill(colors.primary);
  doc.save();
  doc.lineWidth(1.7).strokeColor(colors.white);
  doc.ellipse(x + 17, y + 17, 9.5, 5.5).stroke();
  doc.circle(x + 17, y + 17, 2.4).fill(colors.white);
  doc.restore();
  doc
    .font("BasirahSemibold")
    .fontSize(12)
    .fillColor(colors.ink)
    .text(locale === "ar" ? "بصيرة" : "BASIRAH", x + 44, y + 3, {
      width: 120,
      height: 16,
      lineBreak: false,
    });
  doc
    .font("BasirahRegular")
    .fontSize(7.5)
    .fillColor(colors.muted)
    .text(
      locale === "ar" ? "وضوح التجارة" : "COMMERCE CLARITY",
      x + 44,
      y + 19,
      {
        width: 130,
        height: 12,
        lineBreak: false,
      },
    );
}

function startPage(doc: PDFKit.PDFDocument) {
  doc.addPage();
  doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT).fill(colors.canvas);
}

function pageHeader(
  doc: PDFKit.PDFDocument,
  locale: Locale,
  pageNumber: number,
  kicker: string,
  title: string,
  subtitle?: string,
) {
  drawLogo(doc, MARGIN, 36, locale);
  doc
    .font("BasirahSemibold")
    .fontSize(8.5)
    .fillColor(colors.primary)
    .text(String(pageNumber).padStart(2, "0"), PAGE_WIDTH - 128, 42, {
      width: 80,
      align: "right",
      features: [],
      lineBreak: false,
    });
  doc
    .font("BasirahSemibold")
    .fontSize(8.5)
    .fillColor(colors.primary)
    .text(kicker, MARGIN, 88, {
      ...textOptions(locale),
      width: CONTENT_WIDTH,
      height: 14,
      ellipsis: true,
    });
  doc
    .font("BasirahSemibold")
    .fontSize(24)
    .fillColor(colors.ink)
    .text(title, MARGIN, 108, {
      ...textOptions(locale),
      width: CONTENT_WIDTH,
      height: 40,
      ellipsis: true,
    });
  if (subtitle) {
    doc
      .font("BasirahRegular")
      .fontSize(9)
      .fillColor(colors.muted)
      .text(subtitle, MARGIN, 144, {
        ...textOptions(locale),
        width: CONTENT_WIDTH,
        height: 24,
        ellipsis: true,
      });
  }
}

function drawPill(
  doc: PDFKit.PDFDocument,
  value: string,
  x: number,
  y: number,
  width: number,
  color: string,
  soft: string,
  locale: Locale,
) {
  doc.roundedRect(x, y, width, 24, 12).fill(soft);
  doc
    .font("BasirahSemibold")
    .fontSize(8)
    .fillColor(color)
    .text(value, x + 10, y + 7, {
      ...textOptions(locale),
      width: width - 20,
      height: 12,
      lineBreak: false,
    });
}

function drawMetric(
  doc: PDFKit.PDFDocument,
  locale: Locale,
  x: number,
  y: number,
  width: number,
  value: string,
  label: string,
) {
  card(doc, x, y, width, 78);
  doc
    .font("BasirahSemibold")
    .fontSize(20)
    .fillColor(colors.ink)
    .text(value, x + 12, y + 14, {
      width: width - 24,
      height: 26,
      align: "center",
      features: [],
      lineBreak: false,
    });
  doc
    .font("BasirahRegular")
    .fontSize(8)
    .fillColor(colors.muted)
    .text(label, x + 12, y + 48, {
      ...textOptions(locale),
      width: width - 24,
      height: 16,
      ellipsis: true,
    });
}

function polarPoint(cx: number, cy: number, radius: number, degrees: number) {
  const angle = ((degrees - 90) * Math.PI) / 180;
  return { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
}

function drawScoreRing(
  doc: PDFKit.PDFDocument,
  score: number,
  cx: number,
  cy: number,
  radius: number,
) {
  doc.save();
  doc.lineWidth(11).strokeColor("#343A4A").circle(cx, cy, radius).stroke();
  if (score >= 100) {
    doc.strokeColor(colors.primary).circle(cx, cy, radius).stroke();
  } else if (score > 0) {
    const end = Math.max(0.5, Math.min(359.5, score * 3.6));
    const startPoint = polarPoint(cx, cy, radius, 0);
    const endPoint = polarPoint(cx, cy, radius, end);
    const largeArc = end > 180 ? 1 : 0;
    doc
      .path(
        `M ${startPoint.x} ${startPoint.y} A ${radius} ${radius} 0 ${largeArc} 1 ${endPoint.x} ${endPoint.y}`,
      )
      .lineWidth(11)
      .lineCap("round")
      .strokeColor(colors.primary)
      .stroke();
  }
  doc.restore();
}

function drawFooter(doc: PDFKit.PDFDocument, domain: string) {
  const pages = doc.bufferedPageRange();
  for (let index = pages.start; index < pages.start + pages.count; index += 1) {
    doc.switchToPage(index);
    const pageNumber = index - pages.start + 1;
    doc
      .strokeColor(colors.border)
      .lineWidth(0.6)
      .moveTo(MARGIN, 789)
      .lineTo(PAGE_WIDTH - MARGIN, 789)
      .stroke();
    doc
      .font("BasirahRegular")
      .fontSize(7.5)
      .fillColor(colors.muted)
      .text(domain, MARGIN, 802, {
        width: 260,
        height: 12,
        align: "left",
        features: [],
        lineBreak: false,
      });
    doc.text(
      String(pageNumber).padStart(2, "0"),
      PAGE_WIDTH - 80 - MARGIN,
      802,
      {
        width: 80,
        height: 12,
        align: "right",
        features: [],
        lineBreak: false,
      },
    );
  }
}

function firstEvidenceUrl(
  report: PublicSharedReportDto["report"],
  evidenceIds: readonly string[],
) {
  return report.evidence.find((item) => evidenceIds.includes(item.id))?.urls[0];
}

function intentLabel(intent: string, locale: Locale) {
  if (locale === "en") return intent;
  return (
    (
      {
        transactional: "شراء",
        commercial: "مقارنة",
        informational: "معلومات",
        navigational: "علامة",
      } as Record<string, string>
    )[intent] ?? intent
  );
}

function pageKindLabel(kind: string, locale: Locale) {
  const labels: Record<string, { ar: string; en: string }> = {
    home: { ar: "رئيسية", en: "Home" },
    product: { ar: "منتج", en: "Product" },
    category: { ar: "فئة", en: "Category" },
    content: { ar: "محتوى", en: "Content" },
    policy: { ar: "سياسة", en: "Policy" },
  };
  return labels[kind]?.[locale] ?? (locale === "ar" ? "صفحة" : "Page");
}

type SharedFinding = PublicSharedReportDto["report"]["findings"][number];

function containsArabic(value: string) {
  return /[\u0600-\u06ff]/u.test(value);
}

function localizedFinding(
  finding: SharedFinding,
  locale: Locale,
): SharedFinding {
  if (
    locale === "ar" ||
    !containsArabic(
      `${finding.title} ${finding.description} ${finding.recommendation}`,
    )
  ) {
    return finding;
  }

  const copy: Record<
    string,
    Pick<SharedFinding, "title" | "description" | "recommendation">
  > = {
    technical: {
      title: "Technical accessibility needs attention",
      description:
        "The scan found a technical signal that can limit reliable crawling or interpretation.",
      recommendation:
        "Resolve the referenced technical check, then verify the affected URL again.",
    },
    content: {
      title: "Content does not answer enough buying questions",
      description:
        "The checked page does not provide enough direct, decision-useful information.",
      recommendation:
        "Add concise, evidence-backed answers about use, selection, specifications, and delivery.",
    },
    entity: {
      title: "Store and brand identity are not clear enough",
      description:
        "The checked page does not explain the brand, category, and market clearly enough.",
      recommendation:
        "Add a direct brand and category description to the home and about pages.",
    },
    trust: {
      title: "A key trust signal is difficult to find",
      description:
        "The checked page does not expose an important policy or trust reference clearly.",
      recommendation:
        "Link the relevant policy or trust information from product pages and the footer.",
    },
    answerability: {
      title: "Product pages do not answer buying questions",
      description:
        "The available information is fragmented instead of being written as direct answers.",
      recommendation:
        "Add concise answers about use, selection, specifications, shipping, and returns.",
    },
    structuredData: {
      title: "Structured product facts need improvement",
      description:
        "The scan found missing or incomplete structured facts on the referenced page.",
      recommendation:
        "Add valid structured data that matches visible product facts, then test it before release.",
    },
    externalEvidence: {
      title: "External evidence is not yet available",
      description:
        "The current scan does not include enough independent external evidence for this component.",
      recommendation:
        "Connect a documented external source before drawing conclusions from this component.",
    },
  };

  return { ...finding, ...(copy[finding.component] ?? copy.content) };
}

function localizedEvidenceMessage(
  evidence: PublicSharedReportDto["report"]["evidence"][number],
  locale: Locale,
) {
  if (locale === "ar" || !containsArabic(evidence.message))
    return evidence.message;
  const state =
    evidence.status === "pass"
      ? "passed"
      : evidence.status === "fail"
        ? "found a confirmed issue"
        : "could not be confirmed";
  return `The ${evidence.checkKey} check ${state}. Review the referenced page for the recorded evidence.`;
}

function localizedLimitation(value: string, locale: Locale) {
  if (locale === "ar" || !containsArabic(value)) return value;
  return "Search Console or analytics data is not connected, so observed search and conversion metrics remain unavailable.";
}

function contentOpportunityLabel(
  type: string,
  fallback: string,
  locale: Locale,
) {
  if (locale === "ar") return fallback;
  return (
    (
      {
        "buying-guide": "Buying guide",
        comparison: "Comparison",
        "how-to": "How-to",
        faq: "FAQ",
      } as Record<string, string>
    )[type] ?? fallback
  );
}

export function freeReportPdfFilename(domain: string) {
  const safeDomain =
    domain.replace(/[^A-Za-z0-9.-]+/gu, "-").slice(0, 80) || "store";
  return `basirah-free-visibility-report-${safeDomain}.pdf`;
}

export async function generateFreeReportPdf(
  input: FreeReportPdfInput,
): Promise<Buffer> {
  const { result, locale, reportUrl, pricingUrl } = input;
  const report = result.report;
  const isAr = locale === "ar";
  const rtl = textOptions(locale);
  const findings = report.findings
    .slice(0, 3)
    .map((finding) => localizedFinding(finding, locale));
  const topFinding = findings[0];
  const growthPlan = report.organicGrowthPlan;
  const readiness = scoreBand(report.score, locale);

  const doc = new PDFDocument({
    size: "A4",
    margins: { top: 0, right: 0, bottom: 0, left: 0 },
    font: regularFont as unknown as string,
    autoFirstPage: false,
    bufferPages: true,
    compress: true,
    info: {
      Title: isAr
        ? `تقرير بصيرة للظهور - ${report.domain}`
        : `Basirah visibility report - ${report.domain}`,
      Author: "Basirah",
      Subject: isAr
        ? "تشخيص جاهزية المتجر بالأدلة وخطة تنفيذ من 90 يومًا"
        : "Evidence-based store readiness diagnosis and 90-day action plan",
      Keywords: "Basirah, AI visibility, ecommerce, GEO, SEO, readiness",
      CreationDate: new Date(report.scannedAt),
    },
  });
  doc.registerFont("BasirahRegular", regularFont);
  doc.registerFont("BasirahSemibold", semiboldFont);

  const chunks: Buffer[] = [];
  const complete = new Promise<Buffer>((resolve, reject) => {
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  // Page 1: executive cover
  startPage(doc);
  doc.save();
  doc.fillColor(colors.primarySoft).opacity(0.7).circle(535, 60, 145).fill();
  doc.fillColor(colors.infoSoft).opacity(0.8).circle(30, 760, 120).fill();
  doc.restore();
  drawLogo(doc, MARGIN, 38, locale);
  drawPill(
    doc,
    isAr
      ? "تقرير جاهزية الظهور بالذكاء الاصطناعي"
      : "AI VISIBILITY READINESS REPORT",
    MARGIN,
    102,
    218,
    colors.primary,
    colors.primarySoft,
    locale,
  );
  doc
    .font("BasirahSemibold")
    .fontSize(isAr ? 31 : 28)
    .fillColor(colors.ink)
    .text(
      isAr
        ? "قرار أوضح بشأن ما يجب إصلاحه أولًا"
        : "A clearer decision on what to fix first",
      MARGIN,
      146,
      { ...rtl, width: CONTENT_WIDTH, height: 92, lineGap: 6 },
    );
  doc
    .font("BasirahRegular")
    .fontSize(10)
    .fillColor(colors.muted)
    .text(report.domain, MARGIN, 242, {
      width: CONTENT_WIDTH,
      height: 16,
      align: "left",
      features: [],
      lineBreak: false,
    });

  card(doc, MARGIN, 282, CONTENT_WIDTH, 205, colors.ink, 20, colors.ink);
  drawScoreRing(doc, report.score, 150, 374, 58);
  doc
    .font("BasirahSemibold")
    .fontSize(30)
    .fillColor(colors.white)
    .text(String(report.score), 104, 347, {
      width: 92,
      align: "center",
      features: [],
      lineBreak: false,
    });
  doc
    .font("BasirahRegular")
    .fontSize(8)
    .fillColor("#B8C0D0")
    .text("/ 100", 104, 384, {
      width: 92,
      align: "center",
      features: [],
      lineBreak: false,
    });
  doc
    .font("BasirahSemibold")
    .fontSize(9)
    .fillColor(readiness.color)
    .text(readiness.label, 80, 445, { ...rtl, width: 140, height: 16 });

  doc
    .font("BasirahSemibold")
    .fontSize(10)
    .fillColor("#AEB7C8")
    .text(isAr ? "الملخص التنفيذي" : "EXECUTIVE SUMMARY", 245, 316, {
      ...rtl,
      width: 264,
      height: 18,
    });
  doc
    .font("BasirahSemibold")
    .fontSize(isAr ? 16 : 14.5)
    .fillColor(colors.white)
    .text(scoreDiagnosis(report.score, locale), 245, 346, {
      ...rtl,
      width: 264,
      height: 104,
      ellipsis: true,
      lineGap: 5,
    });

  const metricWidth = (CONTENT_WIDTH - 24) / 3;
  drawMetric(
    doc,
    locale,
    MARGIN,
    511,
    metricWidth,
    `${report.coverage}%`,
    isAr ? "تغطية الفحص" : "Scan coverage",
  );
  drawMetric(
    doc,
    locale,
    MARGIN + metricWidth + 12,
    511,
    metricWidth,
    `${report.confidence}%`,
    isAr ? "الثقة بالنتيجة" : "Result confidence",
  );
  drawMetric(
    doc,
    locale,
    MARGIN + (metricWidth + 12) * 2,
    511,
    metricWidth,
    String(report.pagesScanned),
    isAr ? "صفحات مفحوصة" : "Pages checked",
  );

  card(
    doc,
    MARGIN,
    613,
    CONTENT_WIDTH,
    112,
    readiness.soft,
    16,
    readiness.soft,
  );
  doc
    .font("BasirahSemibold")
    .fontSize(9)
    .fillColor(readiness.color)
    .text(
      isAr ? "الخطوة الأولى الموصى بها" : "RECOMMENDED FIRST MOVE",
      MARGIN + 20,
      632,
      {
        ...rtl,
        width: CONTENT_WIDTH - 40,
        height: 16,
      },
    );
  doc
    .font("BasirahSemibold")
    .fontSize(15)
    .fillColor(colors.ink)
    .text(
      pdfText(
        topFinding?.title ??
          (isAr
            ? "وسّع التغطية إلى الصفحات الأساسية ثم أعد الفحص"
            : "Expand coverage to key pages, then rescan"),
        locale,
      ),
      MARGIN + 20,
      660,
      { ...rtl, width: CONTENT_WIDTH - 40, height: 42, ellipsis: true },
    );
  doc.font("BasirahRegular").fontSize(8).fillColor(colors.muted);
  if (isAr) {
    doc.text(
      "الدرجة تقيس جاهزية الموقع ولا تضمن ترتيبًا أو ذكرًا في أي منصة.",
      190,
      748,
      {
        ...rtl,
        width: 357,
        height: 26,
        ellipsis: true,
      },
    );
    doc.text(formatDate(report.scannedAt), MARGIN, 748, {
      width: 120,
      height: 14,
      align: "left",
      features: [],
      lineBreak: false,
    });
  } else {
    doc.text(
      `Checked ${formatDate(report.scannedAt)}. This score measures site readiness and does not guarantee ranking or mention on any platform.`,
      MARGIN,
      748,
      { ...rtl, width: CONTENT_WIDTH, height: 26, ellipsis: true },
    );
  }

  // Page 2: component scorecard
  startPage(doc);
  pageHeader(
    doc,
    locale,
    2,
    isAr ? "بطاقة الأداء" : "PERFORMANCE SCORECARD",
    isAr ? "أين تقف الجاهزية الآن؟" : "Where readiness stands today",
    isAr
      ? "سبعة مكونات موزونة. القيمة غير المتاحة تبقى غير متاحة ولا تتحول إلى فشل."
      : "Seven weighted components. Unavailable data stays unavailable and is never treated as failure.",
  );
  report.components.slice(0, 7).forEach((component, index) => {
    const y = 184 + index * 56;
    const state = componentState(component.score, locale);
    card(doc, MARGIN, y, CONTENT_WIDTH, 46, colors.white, 11);
    doc
      .font("BasirahSemibold")
      .fontSize(9.5)
      .fillColor(colors.ink)
      .text(
        componentLabel(component.key, component.label, locale),
        MARGIN + 15,
        y + 9,
        {
          ...rtl,
          width: 155,
          height: 16,
          ellipsis: true,
        },
      );
    if (isAr) {
      doc.font("BasirahRegular").fontSize(7).fillColor(colors.muted);
      doc.text("الوزن", MARGIN + 15, y + 27, { ...rtl, width: 34, height: 11 });
      doc.text(`${component.weight}%`, MARGIN + 52, y + 27, {
        width: 31,
        height: 11,
        align: "left",
        features: [],
        lineBreak: false,
      });
      doc.text("التغطية", MARGIN + 88, y + 27, {
        ...rtl,
        width: 40,
        height: 11,
      });
      doc.text(`${component.coverage}%`, MARGIN + 131, y + 27, {
        width: 39,
        height: 11,
        align: "left",
        features: [],
        lineBreak: false,
      });
    } else {
      doc
        .font("BasirahRegular")
        .fontSize(7)
        .fillColor(colors.muted)
        .text(
          `Weight ${component.weight}% | coverage ${component.coverage}%`,
          MARGIN + 15,
          y + 27,
          {
            ...rtl,
            width: 155,
            height: 11,
            ellipsis: true,
          },
        );
    }
    doc.roundedRect(MARGIN + 185, y + 19, 205, 8, 4).fill(colors.track);
    if (component.score !== null) {
      doc
        .roundedRect(
          MARGIN + 185,
          y + 19,
          Math.max(4, 205 * (component.score / 100)),
          8,
          4,
        )
        .fill(state.color);
    }
    drawPill(
      doc,
      state.label,
      MARGIN + 402,
      y + 11,
      62,
      state.color,
      state.soft,
      locale,
    );
    doc
      .font("BasirahSemibold")
      .fontSize(12)
      .fillColor(component.score === null ? colors.muted : colors.ink)
      .text(
        component.score === null ? "-" : String(component.score),
        MARGIN + 366,
        y + 14,
        {
          width: 32,
          align: "center",
          features: [],
          lineBreak: false,
        },
      );
  });

  const scoredComponents = report.components.filter(
    (component): component is typeof component & { score: number } =>
      component.score !== null,
  );
  const sortedComponents = [...scoredComponents].sort(
    (a, b) => b.score - a.score,
  );
  const strongest = sortedComponents.slice(0, 2);
  const weakest = [...sortedComponents].reverse().slice(0, 2);
  const insightCards = [
    {
      x: MARGIN,
      title: isAr ? "أقوى الإشارات" : "Strongest signals",
      color: colors.success,
      soft: colors.successSoft,
      items: strongest,
    },
    {
      x: MARGIN + 255,
      title: isAr ? "أكبر فرص التحسين" : "Biggest opportunities",
      color: colors.warning,
      soft: colors.warningSoft,
      items: weakest,
    },
  ];
  insightCards.forEach((insight) => {
    card(doc, insight.x, 596, 244, 142, insight.soft, 14, insight.soft);
    doc
      .font("BasirahSemibold")
      .fontSize(10)
      .fillColor(insight.color)
      .text(insight.title, insight.x + 16, 615, {
        ...rtl,
        width: 212,
        height: 18,
      });
    insight.items.forEach((component, index) => {
      const y = 649 + index * 38;
      doc
        .font("BasirahRegular")
        .fontSize(8.5)
        .fillColor(colors.ink)
        .text(
          componentLabel(component.key, component.label, locale),
          insight.x + 48,
          y,
          {
            ...rtl,
            width: 180,
            height: 22,
            ellipsis: true,
          },
        );
      doc
        .font("BasirahSemibold")
        .fontSize(9)
        .fillColor(insight.color)
        .text(String(component.score), insight.x + 16, y, {
          width: 26,
          height: 14,
          align: "center",
          features: [],
          lineBreak: false,
        });
    });
  });

  // Page 3: priority findings
  startPage(doc);
  pageHeader(
    doc,
    locale,
    3,
    isAr ? "الأولويات" : "PRIORITIES",
    isAr ? "المشاكل الأعلى أثرًا" : "The highest-impact issues",
    isAr
      ? "كل مشكلة مرتبطة بدليل من صفحة مفحوصة وخطوة إصلاح قابلة للتنفيذ."
      : "Every issue is tied to evidence from a checked page and an actionable fix.",
  );
  const findingSlots = findings.length
    ? findings
    : [
        {
          id: "coverage",
          component: "technical",
          title: isAr
            ? "لا توجد مشكلة مؤكدة ضمن العينة الحالية"
            : "No confirmed issue in the current sample",
          description: isAr
            ? "التغطية الحالية لا تكفي لتعميم النتيجة على المتجر كله."
            : "Current coverage is not enough to generalize across the whole store.",
          severity: "low" as const,
          recommendation: isAr
            ? "وسّع الفحص إلى صفحات المنتجات والفئات والسياسات."
            : "Expand the scan to product, category, and policy pages.",
          evidenceIds: [],
        },
      ];
  findingSlots.forEach((finding, index) => {
    const y = 184 + index * 184;
    const severity = severityDetails(finding.severity, locale);
    card(doc, MARGIN, y, CONTENT_WIDTH, 166, colors.white, 16);
    doc.roundedRect(MARGIN, y, 8, 166, 4).fill(severity.color);
    doc
      .font("BasirahSemibold")
      .fontSize(20)
      .fillColor(severity.color)
      .text(String(index + 1).padStart(2, "0"), MARGIN + 22, y + 19, {
        width: 42,
        align: "left",
        features: [],
        lineBreak: false,
      });
    drawPill(
      doc,
      severity.label,
      MARGIN + 76,
      y + 17,
      88,
      severity.color,
      severity.soft,
      locale,
    );
    doc
      .font("BasirahSemibold")
      .fontSize(12.5)
      .fillColor(colors.ink)
      .text(pdfText(finding.title, locale), MARGIN + 180, y + 19, {
        ...rtl,
        width: 345,
        height: 28,
        ellipsis: true,
      });
    doc
      .font("BasirahSemibold")
      .fontSize(7.5)
      .fillColor(colors.muted)
      .text(isAr ? "ما وجدناه" : "WHAT WE FOUND", MARGIN + 22, y + 59, {
        ...rtl,
        width: 82,
        height: 12,
      });
    doc
      .font("BasirahRegular")
      .fontSize(8.5)
      .fillColor(colors.ink)
      .text(pdfText(finding.description, locale), MARGIN + 116, y + 57, {
        ...rtl,
        width: 409,
        height: 32,
        ellipsis: true,
      });
    doc
      .font("BasirahSemibold")
      .fontSize(7.5)
      .fillColor(colors.primary)
      .text(isAr ? "الإصلاح" : "THE FIX", MARGIN + 22, y + 99, {
        ...rtl,
        width: 82,
        height: 12,
      });
    doc
      .font("BasirahRegular")
      .fontSize(8.5)
      .fillColor(colors.ink)
      .text(pdfText(finding.recommendation, locale), MARGIN + 116, y + 97, {
        ...rtl,
        width: 409,
        height: 34,
        ellipsis: true,
      });
    const evidenceUrl = firstEvidenceUrl(report, finding.evidenceIds);
    doc
      .font("BasirahRegular")
      .fontSize(7)
      .fillColor(colors.muted)
      .text(
        evidenceUrl ??
          (isAr
            ? `${finding.evidenceIds.length} مراجع دليل مسجلة`
            : `${finding.evidenceIds.length} evidence references recorded`),
        MARGIN + 22,
        y + 142,
        {
          width: CONTENT_WIDTH - 44,
          height: 12,
          align: "left",
          ellipsis: true,
          features: [],
        },
      );
  });
  doc
    .font("BasirahRegular")
    .fontSize(7.5)
    .fillColor(colors.muted)
    .text(
      isAr
        ? "رتّب التنفيذ حسب الأثر، ولا تحاول إصلاح كل شيء في أسبوع واحد."
        : "Sequence work by impact. Do not try to fix everything in a single week.",
      MARGIN,
      744,
      { ...rtl, width: CONTENT_WIDTH, height: 20 },
    );

  // Page 4: 30/60/90 day plan
  startPage(doc);
  pageHeader(
    doc,
    locale,
    4,
    isAr ? "خطة التنفيذ" : "EXECUTION PLAN",
    isAr ? "خطة التنفيذ لثلاثة أشهر" : "Your 30 / 60 / 90-day plan",
    isAr
      ? "ابدأ بما يمنع الفهم، ثم ثبّت الحقائق والمحتوى، وبعدها قِس التغيّر."
      : "Fix what blocks understanding, strengthen facts and content, then measure the change.",
  );
  const phases = [
    {
      range: isAr ? "الشهر الأول" : "Days 0 - 30",
      title: isAr ? "أزل العوائق" : "Remove blockers",
      color: colors.danger,
      soft: colors.dangerSoft,
      items: findings
        .slice(0, 2)
        .map((finding) => pdfText(finding.recommendation, locale)),
      fallback: isAr
        ? "وسّع الفحص إلى صفحات المنتجات والسياسات الأساسية."
        : "Expand the scan to key product and policy pages.",
    },
    {
      range: isAr ? "الشهر الثاني" : "Days 31 - 60",
      title: isAr ? "حوّل الحقائق إلى إجابات" : "Turn facts into answers",
      color: colors.warning,
      soft: colors.warningSoft,
      items: isAr
        ? [
            "اكتب إجابات مباشرة لأسئلة الشراء المهمة داخل الصفحات المناسبة.",
            "وحّد اسم العلامة والسياسات ومعلومات الكيان عبر الموقع.",
          ]
        : [
            "Add direct answers to high-value buying questions on the right pages.",
            "Make brand, policy, and entity facts consistent across the site.",
          ],
      fallback: "",
    },
    {
      range: isAr ? "الشهر الثالث" : "Days 61 - 90",
      title: isAr ? "أثبت التحسن" : "Prove improvement",
      color: colors.success,
      soft: colors.successSoft,
      items: isAr
        ? [
            "أعد الفحص بالمنهجية نفسها وقارن المكونات والأدلة.",
            "اربط بيانات البحث والتحليلات لقياس الاكتشاف ومصدر الزيارة كلًا على حدة.",
          ]
        : [
            "Rescan with the same method and compare components and evidence.",
            "Connect search and analytics data to measure discovery and visit source separately.",
          ],
      fallback: "",
    },
  ];
  phases.forEach((phase, index) => {
    const y = 188 + index * 154;
    card(doc, MARGIN, y, CONTENT_WIDTH, 136, phase.soft, 16, phase.soft);
    drawPill(
      doc,
      phase.range,
      MARGIN + 18,
      y + 17,
      112,
      phase.color,
      colors.white,
      locale,
    );
    doc
      .font("BasirahSemibold")
      .fontSize(14)
      .fillColor(colors.ink)
      .text(phase.title, MARGIN + 148, y + 20, {
        ...rtl,
        width: 333,
        height: 24,
      });
    const items = phase.items.length ? phase.items : [phase.fallback];
    items.slice(0, 2).forEach((item, itemIndex) => {
      const itemY = y + 60 + itemIndex * 34;
      doc.circle(MARGIN + (isAr ? 472 : 24), itemY + 7, 3).fill(phase.color);
      doc
        .font("BasirahRegular")
        .fontSize(9)
        .fillColor(colors.ink)
        .text(item, MARGIN + (isAr ? 18 : 42), itemY, {
          ...rtl,
          width: 430,
          height: 26,
          ellipsis: true,
        });
    });
  });
  card(
    doc,
    MARGIN,
    666,
    CONTENT_WIDTH,
    76,
    colors.infoSoft,
    14,
    colors.infoSoft,
  );
  doc
    .font("BasirahSemibold")
    .fontSize(9)
    .fillColor(colors.info)
    .text(
      isAr
        ? "تعريف النجاح بعد ثلاثة أشهر"
        : "WHAT SUCCESS LOOKS LIKE AT DAY 90",
      MARGIN + 18,
      682,
      {
        ...rtl,
        width: CONTENT_WIDTH - 36,
        height: 14,
      },
    );
  doc
    .font("BasirahRegular")
    .fontSize(9)
    .fillColor(colors.ink)
    .text(
      isAr
        ? "ارتفاع المكونات المستهدفة، أدلة أقل فشلًا، وتغطية أعلى - مع بيانات بحث وزيارات متصلة عند توفرها."
        : "Higher target component scores, fewer failed evidence checks, better coverage, and connected search and traffic data where available.",
      MARGIN + 18,
      708,
      { ...rtl, width: CONTENT_WIDTH - 36, height: 24, ellipsis: true },
    );

  // Page 5: organic growth plan
  startPage(doc);
  pageHeader(
    doc,
    locale,
    5,
    isAr ? "النمو العضوي" : "ORGANIC GROWTH",
    isAr ? "الكلمات والصفحات والمحتوى" : "Keywords, pages, and content",
    isAr
      ? "هذه مرشحات من الصفحات المفحوصة وليست بيانات حجم بحث. تحقّق منها عند ربط بيانات البحث."
      : "These are candidates from checked pages, not search-volume data. Validate them when search data is connected.",
  );
  doc
    .font("BasirahSemibold")
    .fontSize(10.5)
    .fillColor(colors.ink)
    .text(isAr ? "مرشحات الكلمات" : "Keyword candidates", MARGIN, 184, {
      ...rtl,
      width: CONTENT_WIDTH,
      height: 18,
    });
  const keywordItems = growthPlan?.keywordOpportunities.slice(0, 3) ?? [];
  if (keywordItems.length) {
    keywordItems.forEach((item, index) => {
      const y = 214 + index * 60;
      card(doc, MARGIN, y, CONTENT_WIDTH, 48, colors.white, 11);
      drawPill(
        doc,
        intentLabel(item.intent, locale),
        MARGIN + 14,
        y + 12,
        64,
        colors.primary,
        colors.primarySoft,
        locale,
      );
      doc
        .font("BasirahSemibold")
        .fontSize(9.5)
        .fillColor(colors.ink)
        .text(pdfText(item.keyword, locale), MARGIN + 92, y + 8, {
          ...rtl,
          width: 390,
          height: 17,
          ellipsis: true,
        });
      doc
        .font("BasirahRegular")
        .fontSize(7)
        .fillColor(colors.muted)
        .text(item.targetUrl, MARGIN + 92, y + 29, {
          width: 390,
          height: 10,
          align: "left",
          ellipsis: true,
          features: [],
        });
    });
  } else {
    card(doc, MARGIN, 214, CONTENT_WIDTH, 62, colors.white, 11);
    doc
      .font("BasirahRegular")
      .fontSize(9)
      .fillColor(colors.muted)
      .text(
        isAr
          ? "لم تكن عناوين العينة كافية لاستخراج مرشح موثوق."
          : "The sampled titles were insufficient for a reliable candidate.",
        MARGIN + 16,
        234,
        { ...rtl, width: CONTENT_WIDTH - 32, height: 22 },
      );
  }

  const product = growthPlan?.productEnhancements[0];
  doc
    .font("BasirahSemibold")
    .fontSize(10.5)
    .fillColor(colors.ink)
    .text(isAr ? "أولوية صفحة المنتج" : "Product page priority", MARGIN, 408, {
      ...rtl,
      width: CONTENT_WIDTH,
      height: 18,
    });
  card(
    doc,
    MARGIN,
    438,
    CONTENT_WIDTH,
    112,
    product ? colors.warningSoft : colors.primaryFaint,
    15,
    product ? colors.warningSoft : colors.primarySoft,
  );
  doc
    .font("BasirahSemibold")
    .fontSize(13)
    .fillColor(colors.ink)
    .text(
      pdfText(
        product?.targetKeyword ??
          (isAr
            ? "لم تظهر صفحة منتج مؤكدة في العينة"
            : "No confirmed product page appeared in the sample"),
        locale,
      ),
      MARGIN + 18,
      458,
      { ...rtl, width: CONTENT_WIDTH - 36, height: 24, ellipsis: true },
    );
  doc
    .font("BasirahRegular")
    .fontSize(8.5)
    .fillColor(colors.ink)
    .text(
      pdfText(
        product?.actions.slice(0, 3).join(" | ") ??
          (isAr
            ? "لا ننشئ توصية من دون صفحة ودليل."
            : "We do not create a recommendation without a page and evidence."),
        locale,
      ),
      MARGIN + 18,
      495,
      { ...rtl, width: CONTENT_WIDTH - 36, height: 36, ellipsis: true },
    );

  doc
    .font("BasirahSemibold")
    .fontSize(10.5)
    .fillColor(colors.ink)
    .text(
      isAr ? "أفكار محتوى مرتبطة بالطلب" : "Demand-linked content ideas",
      MARGIN,
      580,
      {
        ...rtl,
        width: CONTENT_WIDTH,
        height: 18,
      },
    );
  const contentItems = growthPlan?.contentOpportunities.slice(0, 3) ?? [];
  if (contentItems.length) {
    contentItems.forEach((item, index) => {
      const width = (CONTENT_WIDTH - 20) / 3;
      const x = MARGIN + index * (width + 10);
      card(doc, x, 610, width, 128, colors.white, 13);
      doc
        .font("BasirahSemibold")
        .fontSize(8)
        .fillColor(colors.primary)
        .text(
          contentOpportunityLabel(item.type, item.label, locale),
          x + 13,
          626,
          {
            ...rtl,
            width: width - 26,
            height: 14,
            ellipsis: true,
          },
        );
      doc
        .font("BasirahSemibold")
        .fontSize(9.5)
        .fillColor(colors.ink)
        .text(pdfText(item.workingTitle, locale), x + 13, 652, {
          ...rtl,
          width: width - 26,
          height: 50,
          ellipsis: true,
        });
      doc
        .font("BasirahRegular")
        .fontSize(7)
        .fillColor(colors.muted)
        .text(pdfText(item.reason, locale), x + 13, 708, {
          ...rtl,
          width: width - 26,
          height: 18,
          ellipsis: true,
        });
    });
  } else {
    card(doc, MARGIN, 610, CONTENT_WIDTH, 74, colors.white, 13);
    doc
      .font("BasirahRegular")
      .fontSize(9)
      .fillColor(colors.muted)
      .text(
        isAr
          ? "وسّع عينة الصفحات لاستخراج أفكار محتوى مرتبطة بمنتجات مؤكدة."
          : "Expand the page sample to generate ideas tied to confirmed products.",
        MARGIN + 16,
        634,
        { ...rtl, width: CONTENT_WIDTH - 32, height: 28 },
      );
  }

  // Page 6: evidence and scan scope
  startPage(doc);
  pageHeader(
    doc,
    locale,
    6,
    isAr ? "سجل الأدلة" : "EVIDENCE REGISTER",
    isAr ? "ما الذي فُحص فعلًا؟" : "What was actually checked",
    isAr
      ? "هذه اللقطة توضح نطاق الفحص ومراجع الدليل التي استندت إليها النتيجة."
      : "This snapshot shows scan scope and the evidence references behind the result.",
  );
  const scopeMetrics = [
    [String(report.pagesScanned), isAr ? "صفحات" : "Pages"],
    [String(report.evidence.length), isAr ? "أدلة" : "Evidence items"],
    [String(report.findings.length), isAr ? "نتائج" : "Findings"],
    [`${report.coverage}%`, isAr ? "تغطية" : "Coverage"],
  ];
  scopeMetrics.forEach(([value, label], index) => {
    const width = (CONTENT_WIDTH - 30) / 4;
    const x = MARGIN + index * (width + 10);
    card(doc, x, 184, width, 70, colors.white, 12);
    doc
      .font("BasirahSemibold")
      .fontSize(18)
      .fillColor(colors.ink)
      .text(value, x + 10, 199, {
        width: width - 20,
        height: 24,
        align: "center",
        features: [],
      });
    doc
      .font("BasirahRegular")
      .fontSize(7.5)
      .fillColor(colors.muted)
      .text(label, x + 10, 228, { ...rtl, width: width - 20, height: 14 });
  });

  doc
    .font("BasirahSemibold")
    .fontSize(10.5)
    .fillColor(colors.ink)
    .text(isAr ? "نماذج الصفحات" : "Sampled pages", MARGIN, 282, {
      ...rtl,
      width: CONTENT_WIDTH,
      height: 18,
    });
  const snapshots = growthPlan?.pageSnapshots.slice(0, 4) ?? [];
  if (snapshots.length) {
    snapshots.forEach((snapshot, index) => {
      const y = 312 + index * 46;
      card(doc, MARGIN, y, CONTENT_WIDTH, 36, colors.white, 9);
      drawPill(
        doc,
        pageKindLabel(snapshot.kind, locale),
        MARGIN + 10,
        y + 6,
        58,
        colors.info,
        colors.infoSoft,
        locale,
      );
      doc
        .font("BasirahRegular")
        .fontSize(7.5)
        .fillColor(colors.ink)
        .text(snapshot.title || snapshot.url, MARGIN + 82, y + 7, {
          ...rtl,
          width: 255,
          height: 13,
          ellipsis: true,
        });
      doc
        .font("BasirahRegular")
        .fontSize(6.5)
        .fillColor(colors.muted)
        .text(snapshot.url, MARGIN + 82, y + 22, {
          width: 365,
          height: 8,
          align: "left",
          ellipsis: true,
          features: [],
        });
      doc
        .font("BasirahSemibold")
        .fontSize(7)
        .fillColor(colors.muted)
        .text(`${snapshot.wordCount}w`, MARGIN + 448, y + 14, {
          width: 38,
          align: "right",
          features: [],
          lineBreak: false,
        });
    });
  } else {
    card(doc, MARGIN, 312, CONTENT_WIDTH, 52, colors.white, 9);
    doc
      .font("BasirahRegular")
      .fontSize(8.5)
      .fillColor(colors.muted)
      .text(
        isAr
          ? "لم تتوفر لقطات صفحات إضافية في هذه العينة."
          : "No additional page snapshots were available in this sample.",
        MARGIN + 14,
        329,
        {
          ...rtl,
          width: CONTENT_WIDTH - 28,
          height: 18,
        },
      );
  }

  const evidenceTitleY = snapshots.length
    ? 312 + snapshots.length * 46 + 22
    : 390;
  doc
    .font("BasirahSemibold")
    .fontSize(10.5)
    .fillColor(colors.ink)
    .text(
      isAr ? "أبرز مراجع الدليل" : "Key evidence references",
      MARGIN,
      evidenceTitleY,
      {
        ...rtl,
        width: CONTENT_WIDTH,
        height: 18,
      },
    );
  const evidenceItems = report.evidence.slice(0, 4);
  if (evidenceItems.length) {
    evidenceItems.forEach((evidence, index) => {
      const y = evidenceTitleY + 30 + index * 48;
      const state =
        evidence.status === "pass"
          ? {
              label: isAr ? "ناجح" : "Pass",
              color: colors.success,
              soft: colors.successSoft,
            }
          : evidence.status === "fail"
            ? {
                label: isAr ? "يحتاج إصلاحًا" : "Fix",
                color: colors.danger,
                soft: colors.dangerSoft,
              }
            : {
                label: isAr ? "غير متاح" : "Unavailable",
                color: colors.muted,
                soft: colors.track,
              };
      card(doc, MARGIN, y, CONTENT_WIDTH, 38, colors.white, 9);
      drawPill(
        doc,
        state.label,
        MARGIN + 10,
        y + 7,
        72,
        state.color,
        state.soft,
        locale,
      );
      doc
        .font("BasirahRegular")
        .fontSize(7.5)
        .fillColor(colors.ink)
        .text(
          pdfText(localizedEvidenceMessage(evidence, locale), locale),
          MARGIN + 96,
          y + 7,
          {
            ...rtl,
            width: 322,
            height: 22,
            ellipsis: true,
          },
        );
      doc
        .font("BasirahRegular")
        .fontSize(6.5)
        .fillColor(colors.muted)
        .text(evidence.checkKey, MARGIN + 426, y + 14, {
          width: 58,
          height: 10,
          align: "right",
          ellipsis: true,
          features: [],
        });
    });
  }
  const evidenceBottom = evidenceTitleY + 30 + evidenceItems.length * 48;
  if (evidenceBottom < 690) {
    card(
      doc,
      MARGIN,
      evidenceBottom + 18,
      CONTENT_WIDTH,
      58,
      colors.primaryFaint,
      11,
      colors.primarySoft,
    );
    doc
      .font("BasirahRegular")
      .fontSize(8)
      .fillColor(colors.muted)
      .text(
        isAr
          ? "يعكس التقرير الصفحات العامة المتاحة وقت الفحص. الروابط المحجوبة أو غير القابلة للزحف تخفّض التغطية بدل أن تُحسب فشلًا."
          : "The report reflects public pages available at scan time. Blocked or uncrawlable URLs lower coverage instead of being counted as failures.",
        MARGIN + 14,
        evidenceBottom + 34,
        { ...rtl, width: CONTENT_WIDTH - 28, height: 26, ellipsis: true },
      );
  }
  if (evidenceBottom < 720) {
    doc
      .font("BasirahRegular")
      .fontSize(7)
      .fillColor(colors.muted)
      .text(
        isAr
          ? "سجل التقرير الرقمي يحفظ روابط الأدلة الكاملة"
          : "The digital report keeps the complete evidence links",
        MARGIN,
        728,
        {
          ...rtl,
          width: CONTENT_WIDTH,
          height: 12,
        },
      );
    doc.text(reportUrl, MARGIN, 748, {
      width: CONTENT_WIDTH,
      height: 12,
      align: "left",
      ellipsis: true,
      features: [],
    });
  }

  // Page 7: measurement roadmap and handoff
  startPage(doc);
  pageHeader(
    doc,
    locale,
    7,
    isAr ? "القياس والخطوة التالية" : "MEASUREMENT AND NEXT STEP",
    isAr ? "كيف تثبت أثر العمل؟" : "How to prove the work had impact",
    isAr
      ? "افصل بين جاهزية الموقع، والاكتشاف في البحث، والظهور المرصود في منصات الإجابة."
      : "Keep site readiness, search discovery, and observed answer-engine visibility separate.",
  );
  const lenses = [
    {
      number: "01",
      title: isAr ? "الجاهزية" : "Readiness",
      body: isAr
        ? "أعد الفحص بالطريقة نفسها وقارن المكونات والأدلة."
        : "Rescan with the same method and compare components and evidence.",
      color: colors.primary,
      soft: colors.primarySoft,
    },
    {
      number: "02",
      title: isAr ? "الاكتشاف في البحث" : "Search discovery",
      body: isAr
        ? "اربط بيانات بحث غوغل لقياس الاستعلامات والصفحات والنقرات."
        : "Connect Google Search Console to measure queries, pages, and clicks.",
      color: colors.info,
      soft: colors.infoSoft,
    },
    {
      number: "03",
      title: isAr ? "الزيارة والتحويل" : "Visits and conversion",
      body: isAr
        ? "استخدم التحليلات وروابط التتبع ومطابقة الطلبات لإثبات المصدر."
        : "Use analytics, tagged links, and order reconciliation to prove source.",
      color: colors.success,
      soft: colors.successSoft,
    },
  ];
  lenses.forEach((lens, index) => {
    const width = (CONTENT_WIDTH - 20) / 3;
    const x = MARGIN + index * (width + 10);
    card(doc, x, 188, width, 168, colors.white, 15);
    doc
      .font("BasirahSemibold")
      .fontSize(9)
      .fillColor(lens.color)
      .text(lens.number, x + 15, 204, {
        width: 40,
        align: "left",
        features: [],
      });
    doc.roundedRect(x + width - 42, 202, 26, 26, 8).fill(lens.soft);
    doc.circle(x + width - 29, 215, 4).fill(lens.color);
    doc
      .font("BasirahSemibold")
      .fontSize(11.5)
      .fillColor(colors.ink)
      .text(lens.title, x + 15, 247, {
        ...rtl,
        width: width - 30,
        height: 30,
        ellipsis: true,
      });
    doc
      .font("BasirahRegular")
      .fontSize(8.5)
      .fillColor(colors.muted)
      .text(lens.body, x + 15, 291, {
        ...rtl,
        width: width - 30,
        height: 48,
        ellipsis: true,
      });
  });

  const searchConsoleStatus =
    growthPlan?.searchConsole.status ?? "not_connected";
  card(
    doc,
    MARGIN,
    386,
    CONTENT_WIDTH,
    106,
    searchConsoleStatus === "not_connected"
      ? colors.warningSoft
      : colors.successSoft,
    15,
    searchConsoleStatus === "not_connected"
      ? colors.warningSoft
      : colors.successSoft,
  );
  doc
    .font("BasirahSemibold")
    .fontSize(11)
    .fillColor(
      searchConsoleStatus === "not_connected" ? colors.warning : colors.success,
    )
    .text(
      searchConsoleStatus === "not_connected"
        ? isAr
          ? "بيانات بحث غوغل غير متصلة - وليست صفرًا"
          : "Search Console is not connected - this is not a zero"
        : isAr
          ? "بيانات البحث متصلة"
          : "Search data connected",
      MARGIN + 18,
      405,
      { ...rtl, width: CONTENT_WIDTH - 36, height: 20 },
    );
  doc
    .font("BasirahRegular")
    .fontSize(8.5)
    .fillColor(colors.ink)
    .text(
      isAr
        ? "لا نستنتج النقرات أو مرات الظهور أو الموضع من صفحات الموقع. تحتاج هذه القيم إلى مصدر مستقل."
        : "Clicks, impressions, and position cannot be inferred from site pages. These values require an independent data source.",
      MARGIN + 18,
      438,
      { ...rtl, width: CONTENT_WIDTH - 36, height: 30, ellipsis: true },
    );
  const consoleUrl = growthPlan?.searchConsole.links.console;
  if (consoleUrl) {
    doc
      .font("BasirahRegular")
      .fontSize(7)
      .fillColor(colors.info)
      .text(consoleUrl, MARGIN + 18, 472, {
        width: CONTENT_WIDTH - 36,
        height: 10,
        align: "left",
        ellipsis: true,
        underline: true,
        link: consoleUrl,
        features: [],
      });
  }

  doc
    .font("BasirahSemibold")
    .fontSize(10.5)
    .fillColor(colors.ink)
    .text(isAr ? "حدود القراءة" : "Important limitations", MARGIN, 526, {
      ...rtl,
      width: CONTENT_WIDTH,
      height: 18,
    });
  const limitations = [
    ...report.limitations
      .slice(0, 2)
      .map((item) => localizedLimitation(item, locale)),
    isAr
      ? "الدرجة لقطة زمنية لجاهزية الموقع ولا تضمن ترتيبًا أو ذكرًا أو استشهادًا."
      : "The score is a point-in-time readiness snapshot and does not guarantee ranking, mention, or citation.",
  ];
  limitations.slice(0, 3).forEach((item, index) => {
    const y = 558 + index * 34;
    doc
      .circle(MARGIN + (isAr ? CONTENT_WIDTH - 5 : 6), y + 7, 2.5)
      .fill(colors.muted);
    doc
      .font("BasirahRegular")
      .fontSize(8.5)
      .fillColor(colors.muted)
      .text(pdfText(item, locale), MARGIN + (isAr ? 0 : 22), y, {
        ...rtl,
        width: CONTENT_WIDTH - (isAr ? 16 : 22),
        height: 25,
        ellipsis: true,
      });
  });

  card(doc, MARGIN, 670, CONTENT_WIDTH, 96, colors.primary, 16, colors.primary);
  doc
    .font("BasirahSemibold")
    .fontSize(13)
    .fillColor(colors.white)
    .text(
      isAr
        ? "احتفظ بالتقرير. ثم حوّل الأولوية الأولى إلى تنفيذ."
        : "Keep the report. Then turn priority one into execution.",
      MARGIN + 20,
      688,
      {
        ...rtl,
        width: CONTENT_WIDTH - 40,
        height: 24,
        ellipsis: true,
      },
    );
  doc
    .font("BasirahRegular")
    .fontSize(7.5)
    .fillColor("#D9D7FF")
    .text(reportUrl, MARGIN + 20, 724, {
      width: CONTENT_WIDTH - 40,
      height: 10,
      align: "left",
      ellipsis: true,
      underline: true,
      link: reportUrl,
      features: [],
    });
  doc
    .font("BasirahRegular")
    .fontSize(7.5)
    .fillColor("#D9D7FF")
    .text(pricingUrl, MARGIN + 20, 744, {
      width: CONTENT_WIDTH - 40,
      height: 10,
      align: "left",
      ellipsis: true,
      underline: true,
      link: pricingUrl,
      features: [],
    });

  drawFooter(doc, report.domain);
  doc.end();
  return complete;
}
