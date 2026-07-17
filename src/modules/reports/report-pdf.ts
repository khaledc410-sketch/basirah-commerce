import "server-only";

import { readFileSync } from "node:fs";
import { join } from "node:path";

import PDFDocument from "pdfkit";

import { AcquisitionError } from "@/modules/acquisition/errors";
import type { TenantReportDetailDto } from "@/modules/reports/tenant-reports";

const fontPackageRoot = join(
  process.cwd(),
  "node_modules/@ibm/plex-sans-arabic",
);
const regularFont = readFileSync(
  join(fontPackageRoot, "fonts/complete/woff/IBMPlexSansArabic-Regular.woff"),
);
const semiboldFont = readFileSync(
  join(fontPackageRoot, "fonts/complete/woff/IBMPlexSansArabic-SemiBold.woff"),
);

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 48;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const CONTENT_BOTTOM = 777;

const palette = {
  canvas: "#F7F8FC",
  white: "#FFFFFF",
  ink: "#111827",
  muted: "#667085",
  subtle: "#98A2B3",
  primary: "#4F46D8",
  primaryDeep: "#3730A3",
  primarySoft: "#EEEDFF",
  success: "#087A5A",
  successSoft: "#EAF8F2",
  warning: "#A15C06",
  warningSoft: "#FFF5E6",
  danger: "#B42318",
  dangerSoft: "#FFF0EE",
  info: "#175CD3",
  infoSoft: "#EFF6FF",
  border: "#DCE1EA",
  track: "#343A4A",
};

const componentLabels: Record<string, string> = {
  technical: "الأساس التقني",
  content: "جودة المحتوى",
  entity: "وضوح الكيان",
  trust: "إشارات الثقة",
  answerability: "قابلية الإجابة",
  structuredData: "البيانات المنظمة",
  externalEvidence: "الأدلة الخارجية",
};

const rtl: PDFKit.Mixins.TextOptions = {
  align: "right",
  features: ["rtla", "rlig", "calt"],
  lineGap: 3,
};

function arabicizePlatformTerms(value: string) {
  return value
    .replace(/Product\s*(?:و|and|&)\s*Offer/giu, "بيانات المنتج والعرض المنظمة")
    .replace(/Product/giu, "بيانات المنتج المنظمة")
    .replace(/Offer/giu, "بيانات العرض المنظمة")
    .replace(/Search Console/giu, "أدوات مشرفي بحث غوغل")
    .replace(/ChatGPT/giu, "شات جي بي تي")
    .replace(/Gemini/giu, "جيمناي")
    .replace(/Google/giu, "غوغل");
}

function rtlSafeText(value: string) {
  return arabicizePlatformTerms(value).replace(/\d+/gu, (digits) =>
    [...digits].reverse().join(""),
  );
}

function formatDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Riyadh",
  }).format(parsed);
}

function card(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  width: number,
  height: number,
  fill = palette.white,
  radius = 14,
  border = palette.border,
) {
  doc.roundedRect(x, y, width, height, radius).fillAndStroke(fill, border);
}

function drawLogo(doc: PDFKit.PDFDocument, x: number, y: number) {
  doc.roundedRect(x, y, 34, 34, 10).fill(palette.primary);
  doc.save();
  doc.lineWidth(1.7).strokeColor(palette.white);
  doc.ellipse(x + 17, y + 17, 9.5, 5.5).stroke();
  doc.circle(x + 17, y + 17, 2.4).fill(palette.white);
  doc.restore();
  doc
    .font("BasirahSemibold")
    .fontSize(12)
    .fillColor(palette.ink)
    .text("بصيرة", x + 44, y + 2, { width: 80, height: 16, lineBreak: false });
  doc
    .font("BasirahRegular")
    .fontSize(7.5)
    .fillColor(palette.muted)
    .text("وضوح التجارة", x + 44, y + 19, {
      width: 90,
      height: 12,
      lineBreak: false,
    });
}

function startPage(
  doc: PDFKit.PDFDocument,
  pageNumber: number,
  kicker: string,
  title: string,
  subtitle?: string,
) {
  doc.addPage();
  doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT).fill(palette.canvas);
  drawLogo(doc, MARGIN, 36);
  doc
    .font("BasirahSemibold")
    .fontSize(8.5)
    .fillColor(palette.primary)
    .text(String(pageNumber).padStart(2, "0"), PAGE_WIDTH - MARGIN - 80, 42, {
      width: 80,
      align: "right",
      lineBreak: false,
      features: [],
    });
  doc
    .font("BasirahSemibold")
    .fontSize(8.5)
    .fillColor(palette.primary)
    .text(kicker, MARGIN, 88, { ...rtl, width: CONTENT_WIDTH, height: 14 });
  doc
    .font("BasirahSemibold")
    .fontSize(24)
    .fillColor(palette.ink)
    .text(title, MARGIN, 108, {
      ...rtl,
      width: CONTENT_WIDTH,
      height: 40,
      ellipsis: true,
    });
  if (subtitle) {
    doc
      .font("BasirahRegular")
      .fontSize(9)
      .fillColor(palette.muted)
      .text(subtitle, MARGIN, 144, {
        ...rtl,
        width: CONTENT_WIDTH,
        height: 24,
        ellipsis: true,
      });
  }
  doc.y = 174;
}

function pill(
  doc: PDFKit.PDFDocument,
  value: string,
  x: number,
  y: number,
  width: number,
  color: string,
  soft: string,
) {
  doc.roundedRect(x, y, width, 24, 12).fill(soft);
  doc
    .font("BasirahSemibold")
    .fontSize(8)
    .fillColor(color)
    .text(value, x + 9, y + 7, {
      ...rtl,
      width: width - 18,
      height: 12,
      lineBreak: false,
    });
}

function scoreState(score: number) {
  if (score < 40)
    return {
      label: "يحتاج تأسيسًا",
      color: palette.danger,
      soft: palette.dangerSoft,
    };
  if (score < 70)
    return {
      label: "قابل للبناء",
      color: palette.warning,
      soft: palette.warningSoft,
    };
  return {
    label: "أساس قوي",
    color: palette.success,
    soft: palette.successSoft,
  };
}

function componentState(score: number | null) {
  if (score === null)
    return { label: "غير متاح", color: palette.muted, soft: "#EEF0F4" };
  if (score < 50)
    return { label: "أولوية", color: palette.danger, soft: palette.dangerSoft };
  if (score < 70)
    return {
      label: "يحتاج تحسينًا",
      color: palette.warning,
      soft: palette.warningSoft,
    };
  return { label: "جيد", color: palette.success, soft: palette.successSoft };
}

function severityState(severity: "high" | "medium" | "low") {
  if (severity === "high")
    return {
      label: "أثر عالٍ",
      color: palette.danger,
      soft: palette.dangerSoft,
    };
  if (severity === "medium")
    return {
      label: "أثر متوسط",
      color: palette.warning,
      soft: palette.warningSoft,
    };
  return { label: "أثر منخفض", color: palette.info, soft: palette.infoSoft };
}

function drawScoreRing(
  doc: PDFKit.PDFDocument,
  score: number,
  cx: number,
  cy: number,
  radius: number,
) {
  const point = (degrees: number) => {
    const angle = ((degrees - 90) * Math.PI) / 180;
    return {
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    };
  };
  doc.save();
  doc.lineWidth(10).strokeColor(palette.track).circle(cx, cy, radius).stroke();
  if (score >= 100) {
    doc.strokeColor(palette.primary).circle(cx, cy, radius).stroke();
  } else if (score > 0) {
    const end = Math.max(0.5, Math.min(359.5, score * 3.6));
    const startPoint = point(0);
    const endPoint = point(end);
    doc
      .path(
        `M ${startPoint.x} ${startPoint.y} A ${radius} ${radius} 0 ${end > 180 ? 1 : 0} 1 ${endPoint.x} ${endPoint.y}`,
      )
      .lineWidth(10)
      .lineCap("round")
      .strokeColor(palette.primary)
      .stroke();
  }
  doc.restore();
}

function metric(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  width: number,
  value: string,
  label: string,
) {
  card(doc, x, y, width, 70);
  doc
    .font("BasirahSemibold")
    .fontSize(18)
    .fillColor(palette.ink)
    .text(value, x + 10, y + 12, {
      width: width - 20,
      height: 24,
      align: "center",
      features: [],
      lineBreak: false,
    });
  doc
    .font("BasirahRegular")
    .fontSize(8)
    .fillColor(palette.muted)
    .text(label, x + 10, y + 44, {
      ...rtl,
      width: width - 20,
      height: 14,
      ellipsis: true,
    });
}

function findingHeight(
  doc: PDFKit.PDFDocument,
  description: string,
  recommendation: string,
) {
  doc.font("BasirahRegular").fontSize(9.2);
  const descriptionHeight = doc.heightOfString(description, {
    ...rtl,
    width: CONTENT_WIDTH - 48,
  });
  const recommendationHeight = doc.heightOfString(recommendation, {
    ...rtl,
    width: CONTENT_WIDTH - 48,
  });
  return Math.max(178, 112 + descriptionHeight + recommendationHeight);
}

function drawFinding(
  doc: PDFKit.PDFDocument,
  finding: TenantReportDetailDto["findings"][number],
  index: number,
  y: number,
) {
  const title = rtlSafeText(finding.title);
  const description = rtlSafeText(finding.description);
  const recommendation = rtlSafeText(finding.recommendation);
  const height = findingHeight(doc, description, recommendation);
  const severity = severityState(finding.severity);
  card(doc, MARGIN, y, CONTENT_WIDTH, height);
  doc.roundedRect(MARGIN, y, 7, height, 4).fill(severity.color);
  pill(
    doc,
    severity.label,
    MARGIN + 22,
    y + 18,
    88,
    severity.color,
    severity.soft,
  );
  doc
    .font("BasirahSemibold")
    .fontSize(9)
    .fillColor(severity.color)
    .text(String(index + 1).padStart(2, "0"), MARGIN + 120, y + 24, {
      width: 34,
      align: "left",
      features: [],
      lineBreak: false,
    });
  doc
    .font("BasirahSemibold")
    .fontSize(13)
    .fillColor(palette.ink)
    .text(title, MARGIN + 168, y + 18, {
      ...rtl,
      width: CONTENT_WIDTH - 192,
      height: 42,
      ellipsis: true,
    });
  let cursor = y + 69;
  doc
    .font("BasirahSemibold")
    .fontSize(8)
    .fillColor(palette.muted)
    .text("ما وجدناه", MARGIN + 24, cursor, {
      ...rtl,
      width: CONTENT_WIDTH - 48,
      height: 14,
    });
  cursor += 19;
  doc
    .font("BasirahRegular")
    .fontSize(9.2)
    .fillColor(palette.ink)
    .text(description, MARGIN + 24, cursor, {
      ...rtl,
      width: CONTENT_WIDTH - 48,
    });
  cursor = doc.y + 8;
  doc
    .font("BasirahSemibold")
    .fontSize(8)
    .fillColor(palette.primary)
    .text("الإجراء المقترح", MARGIN + 24, cursor, {
      ...rtl,
      width: CONTENT_WIDTH - 48,
      height: 14,
    });
  cursor += 19;
  doc
    .font("BasirahRegular")
    .fontSize(9.2)
    .fillColor(palette.ink)
    .text(recommendation, MARGIN + 24, cursor, {
      ...rtl,
      width: CONTENT_WIDTH - 48,
    });
  doc
    .font("BasirahRegular")
    .fontSize(7.4)
    .fillColor(palette.subtle)
    .text(
      finding.evidenceIds.join(" • ") || "لا يوجد مرجع مسجل",
      MARGIN + 24,
      y + height - 23,
      {
        width: CONTENT_WIDTH - 48,
        height: 11,
        align: "left",
        features: [],
        ellipsis: true,
      },
    );
  return height;
}

function drawPlanCard(
  doc: PDFKit.PDFDocument,
  title: string,
  label: string,
  items: readonly string[],
  y: number,
) {
  const normalizedItems = items.length
    ? items
    : ["أعد الفحص بعد إكمال الأولويات الأعلى أثرًا."];
  doc.font("BasirahRegular").fontSize(9);
  const contentHeight = normalizedItems.reduce(
    (total, item) =>
      total +
      doc.heightOfString(`• ${rtlSafeText(item)}`, {
        ...rtl,
        width: CONTENT_WIDTH - 52,
      }) +
      7,
    0,
  );
  const height = Math.max(142, contentHeight + 66);
  card(doc, MARGIN, y, CONTENT_WIDTH, height);
  pill(
    doc,
    label,
    MARGIN + 20,
    y + 18,
    76,
    palette.primary,
    palette.primarySoft,
  );
  doc
    .font("BasirahSemibold")
    .fontSize(13)
    .fillColor(palette.ink)
    .text(title, MARGIN + 116, y + 21, {
      ...rtl,
      width: CONTENT_WIDTH - 140,
      height: 24,
      ellipsis: true,
    });
  let cursor = y + 61;
  for (const item of normalizedItems) {
    const text = `• ${rtlSafeText(item)}`;
    doc
      .font("BasirahRegular")
      .fontSize(9)
      .fillColor(palette.muted)
      .text(text, MARGIN + 26, cursor, { ...rtl, width: CONTENT_WIDTH - 52 });
    cursor = doc.y + 7;
  }
  return height;
}

function drawFooter(doc: PDFKit.PDFDocument, domain: string) {
  const pages = doc.bufferedPageRange();
  for (let index = pages.start; index < pages.start + pages.count; index += 1) {
    doc.switchToPage(index);
    const pageNumber = index - pages.start + 1;
    doc
      .strokeColor(palette.border)
      .lineWidth(0.6)
      .moveTo(MARGIN, 789)
      .lineTo(PAGE_WIDTH - MARGIN, 789)
      .stroke();
    doc
      .font("BasirahRegular")
      .fontSize(7.5)
      .fillColor(palette.muted)
      .text(domain, MARGIN, 802, {
        width: 250,
        height: 12,
        align: "left",
        features: [],
        lineBreak: false,
      });
    doc.text(
      String(pageNumber).padStart(2, "0"),
      PAGE_WIDTH - MARGIN - 80,
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

export function assertPaidReportPdfAccess(report: TenantReportDetailDto) {
  if (report.accessLevel !== "full") {
    throw new AcquisitionError(
      "REPORT_LOCKED",
      403,
      "يتوفر ملف PDF بعد فتح التقرير العربي الكامل.",
    );
  }
}

export function paidReportPdfFilename(
  report: Pick<TenantReportDetailDto, "domain" | "id">,
) {
  const domain =
    report.domain.replace(/[^A-Za-z0-9.-]+/gu, "-").slice(0, 80) || "store";
  const id =
    report.id.replace(/[^A-Za-z0-9_-]+/gu, "").slice(0, 12) || "report";
  return `basirah-visibility-${domain}-${id}.pdf`;
}

export async function generatePaidReportPdf(
  report: TenantReportDetailDto,
): Promise<Buffer> {
  assertPaidReportPdfAccess(report);

  const doc = new PDFDocument({
    size: "A4",
    margins: { top: 0, right: 0, bottom: 0, left: 0 },
    font: regularFont as unknown as string,
    bufferPages: true,
    compress: true,
    autoFirstPage: false,
    info: {
      Title: `تقرير بصيرة للظهور - ${report.domain}`,
      Author: "بصيرة",
      Subject: "تقرير الجاهزية للظهور في البحث ومحركات الإجابة",
      Keywords: "بصيرة, الظهور, التجارة الإلكترونية, GEO, SEO",
      CreationDate: new Date(report.generatedAt),
    },
  });
  doc.registerFont("BasirahRegular", regularFont);
  doc.registerFont("BasirahSemibold", semiboldFont);

  const chunks: Buffer[] = [];
  const completed = new Promise<Buffer>((resolve, reject) => {
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  let pageNumber = 1;
  startPage(
    doc,
    pageNumber,
    "تقرير خاص • نسخة مدفوعة",
    "تقرير الظهور وجاهزية الإجابة",
    "نسخة تنفيذية موثقة لمتجر التجارة الإلكترونية",
  );
  doc
    .font("BasirahRegular")
    .fontSize(7.8)
    .fillColor(palette.muted)
    .text(
      `${report.domain}  •  ${formatDate(report.generatedAt)}`,
      MARGIN,
      152,
      {
        width: 240,
        height: 12,
        align: "left",
        features: [],
        lineBreak: false,
      },
    );

  card(doc, MARGIN, 174, CONTENT_WIDTH, 183, palette.ink, 18, palette.ink);
  drawScoreRing(doc, report.score, MARGIN + 79, 264, 47);
  doc
    .font("BasirahSemibold")
    .fontSize(25)
    .fillColor(palette.white)
    .text(String(report.score), MARGIN + 42, 247, {
      width: 74,
      height: 34,
      align: "center",
      features: [],
      lineBreak: false,
    });
  doc
    .font("BasirahRegular")
    .fontSize(8)
    .fillColor("#C9CBD4")
    .text("100", MARGIN + 42, 283, {
      width: 74,
      height: 12,
      align: "center",
      features: [],
      lineBreak: false,
    });
  const state = scoreState(report.score);
  pill(doc, state.label, MARGIN + 28, 315, 102, state.color, state.soft);
  doc
    .font("BasirahSemibold")
    .fontSize(11)
    .fillColor("#A5B4FC")
    .text("الملخص التنفيذي", MARGIN + 160, 198, {
      ...rtl,
      width: CONTENT_WIDTH - 188,
      height: 18,
    });
  doc
    .font("BasirahRegular")
    .fontSize(10)
    .fillColor(palette.white)
    .text(
      rtlSafeText(
        report.narrative?.executiveSummary ??
          `سجل المتجر درجة جاهزية ${report.score} من 100. تقيس الدرجة قابلية فهم الموقع والاستشهاد بحقائقه، ولا تمثل ظهورًا فعليًا في أي منصة. ابدأ بالأولويات المدعومة بالأدلة ثم أعد الفحص بالطريقة نفسها.`,
      ),
      MARGIN + 160,
      225,
      { ...rtl, width: CONTENT_WIDTH - 188, height: 104, ellipsis: true },
    );

  const metricGap = 12;
  const metricWidth = (CONTENT_WIDTH - metricGap * 2) / 3;
  metric(doc, MARGIN, 375, metricWidth, `${report.coverage}%`, "تغطية الفحص");
  metric(
    doc,
    MARGIN + metricWidth + metricGap,
    375,
    metricWidth,
    `${report.confidence}%`,
    "ثقة النتيجة",
  );
  metric(
    doc,
    MARGIN + (metricWidth + metricGap) * 2,
    375,
    metricWidth,
    String(report.pagesScanned),
    "صفحات مفحوصة",
  );

  doc
    .font("BasirahSemibold")
    .fontSize(15)
    .fillColor(palette.ink)
    .text("لوحة الجاهزية", MARGIN, 478, {
      ...rtl,
      width: CONTENT_WIDTH,
      height: 24,
    });
  doc
    .font("BasirahRegular")
    .fontSize(8.5)
    .fillColor(palette.muted)
    .text("سبعة محاور موزونة؛ القيم غير المتاحة لا تُعامل كصفر.", MARGIN, 505, {
      ...rtl,
      width: CONTENT_WIDTH,
      height: 18,
    });

  const componentGap = 12;
  const componentWidth = (CONTENT_WIDTH - componentGap) / 2;
  report.components.slice(0, 8).forEach((component, index) => {
    const column = index % 2;
    const row = Math.floor(index / 2);
    const x = MARGIN + column * (componentWidth + componentGap);
    const y = 535 + row * 58;
    const componentStatus = componentState(component.score);
    card(doc, x, y, componentWidth, 48);
    doc
      .font("BasirahSemibold")
      .fontSize(9)
      .fillColor(palette.ink)
      .text(componentLabels[component.key] ?? component.label, x + 82, y + 10, {
        ...rtl,
        width: componentWidth - 96,
        height: 16,
        ellipsis: true,
      });
    doc
      .font("BasirahRegular")
      .fontSize(7.5)
      .fillColor(palette.muted)
      .text(
        rtlSafeText(
          `الوزن ${component.weight}  •  التغطية ${component.coverage}`,
        ),
        x + 82,
        y + 29,
        {
          ...rtl,
          width: componentWidth - 96,
          height: 12,
          ellipsis: true,
        },
      );
    pill(
      doc,
      component.score === null
        ? componentStatus.label
        : String(component.score),
      x + 12,
      y + 12,
      58,
      componentStatus.color,
      componentStatus.soft,
    );
  });

  pageNumber += 1;
  startPage(
    doc,
    pageNumber,
    "الأولويات",
    "النتائج والإصلاحات الأعلى أثرًا",
    "كل نتيجة مرتبطة بمشكلة واضحة وإجراء تنفيذي ومراجع أدلة مسجلة.",
  );
  let cursor = 174;
  if (!report.findings.length) {
    card(
      doc,
      MARGIN,
      cursor,
      CONTENT_WIDTH,
      150,
      palette.successSoft,
      16,
      palette.successSoft,
    );
    doc
      .font("BasirahSemibold")
      .fontSize(15)
      .fillColor(palette.success)
      .text(
        "لا توجد مشكلة مؤكدة ضمن نطاق الفحص الحالي",
        MARGIN + 28,
        cursor + 32,
        { ...rtl, width: CONTENT_WIDTH - 56 },
      );
    doc
      .font("BasirahRegular")
      .fontSize(9.5)
      .fillColor(palette.ink)
      .text(
        "وسّع عينة الصفحات وأعد الفحص قبل استنتاج أن الموقع خالٍ من الفجوات.",
        MARGIN + 28,
        cursor + 77,
        { ...rtl, width: CONTENT_WIDTH - 56 },
      );
  } else {
    report.findings.forEach((finding, index) => {
      const height = findingHeight(
        doc,
        rtlSafeText(finding.description),
        rtlSafeText(finding.recommendation),
      );
      if (cursor + height > CONTENT_BOTTOM) {
        pageNumber += 1;
        startPage(
          doc,
          pageNumber,
          "الأولويات",
          "النتائج والإصلاحات — تابع",
          "أكمل الأولويات بحسب الأثر، ثم أعد الفحص لإثبات التحسن.",
        );
        cursor = 174;
      }
      cursor += drawFinding(doc, finding, index, cursor) + 14;
    });
  }

  if (report.narrative) {
    pageNumber += 1;
    startPage(
      doc,
      pageNumber,
      "خارطة التنفيذ",
      "خطة عمل لثلاثة أشهر",
      "رتّب المسؤوليات والموعد المستهدف لكل بند؛ لا تحاول تنفيذ كل شيء في أسبوع واحد.",
    );
    cursor = 174;
    const stages = [
      {
        title: "ثبّت الأساس",
        label: "الشهر الأول",
        items: report.narrative.plan30Days,
      },
      {
        title: "وسّع الإجابات",
        label: "الشهر الثاني",
        items: report.narrative.plan60Days,
      },
      {
        title: "قِس وثبّت",
        label: "الشهر الثالث",
        items: report.narrative.plan90Days,
      },
    ];
    for (const stage of stages) {
      doc.font("BasirahRegular").fontSize(9);
      const estimate = Math.max(
        142,
        66 +
          stage.items.reduce(
            (total, item) =>
              total +
              doc.heightOfString(`• ${rtlSafeText(item)}`, {
                ...rtl,
                width: CONTENT_WIDTH - 52,
              }) +
              7,
            0,
          ),
      );
      if (cursor + estimate > CONTENT_BOTTOM) {
        pageNumber += 1;
        startPage(
          doc,
          pageNumber,
          "خارطة التنفيذ",
          "خطة عمل لثلاثة أشهر — تابع",
        );
        cursor = 174;
      }
      cursor +=
        drawPlanCard(doc, stage.title, stage.label, stage.items, cursor) + 14;
    }
  }

  pageNumber += 1;
  startPage(
    doc,
    pageNumber,
    "الأدلة والقياس",
    "سجل الأدلة وحدود القراءة",
    "هذه الصفحة تفصل بين ما أثبته الفحص وما يحتاج إلى مصدر قياس مستقل.",
  );
  cursor = 174;
  doc
    .font("BasirahSemibold")
    .fontSize(13)
    .fillColor(palette.ink)
    .text("الأدلة المسجلة", MARGIN, cursor, {
      ...rtl,
      width: CONTENT_WIDTH,
      height: 22,
    });
  cursor += 34;
  for (const evidence of report.evidence) {
    const evidenceState =
      evidence.status === "pass"
        ? { label: "ناجح", color: palette.success, soft: palette.successSoft }
        : evidence.status === "fail"
          ? {
              label: "يحتاج إصلاحًا",
              color: palette.danger,
              soft: palette.dangerSoft,
            }
          : { label: "غير متاح", color: palette.muted, soft: "#EEF0F4" };
    doc.font("BasirahRegular").fontSize(8.8);
    const message = rtlSafeText(evidence.message);
    const height = Math.max(
      80,
      58 + doc.heightOfString(message, { ...rtl, width: CONTENT_WIDTH - 154 }),
    );
    if (cursor + height > CONTENT_BOTTOM) {
      pageNumber += 1;
      startPage(doc, pageNumber, "الأدلة والقياس", "سجل الأدلة — تابع");
      cursor = 174;
    }
    card(doc, MARGIN, cursor, CONTENT_WIDTH, height);
    pill(
      doc,
      evidenceState.label,
      MARGIN + 18,
      cursor + 17,
      92,
      evidenceState.color,
      evidenceState.soft,
    );
    doc
      .font("BasirahSemibold")
      .fontSize(8)
      .fillColor(palette.primary)
      .text(evidence.checkKey, MARGIN + 128, cursor + 18, {
        width: CONTENT_WIDTH - 150,
        height: 13,
        align: "left",
        features: [],
        ellipsis: true,
      });
    doc
      .font("BasirahRegular")
      .fontSize(8.8)
      .fillColor(palette.ink)
      .text(message, MARGIN + 128, cursor + 39, {
        ...rtl,
        width: CONTENT_WIDTH - 150,
      });
    if (evidence.urls[0]) {
      doc
        .font("BasirahRegular")
        .fontSize(7)
        .fillColor(palette.subtle)
        .text(evidence.urls[0], MARGIN + 18, cursor + height - 18, {
          width: CONTENT_WIDTH - 36,
          height: 10,
          align: "left",
          features: [],
          ellipsis: true,
        });
    }
    cursor += height + 10;
  }

  const finalBlockHeight = 245;
  if (cursor + finalBlockHeight > CONTENT_BOTTOM) {
    pageNumber += 1;
    startPage(doc, pageNumber, "الأدلة والقياس", "النطاق والمنهجية");
    cursor = 174;
  } else {
    cursor += 14;
  }
  doc
    .font("BasirahSemibold")
    .fontSize(13)
    .fillColor(palette.ink)
    .text("الصفحات المفحوصة", MARGIN, cursor, {
      ...rtl,
      width: CONTENT_WIDTH,
      height: 22,
    });
  cursor += 31;
  const pagesToShow = report.pages.slice(0, 8);
  for (const page of pagesToShow) {
    doc
      .font("BasirahRegular")
      .fontSize(7.4)
      .fillColor(palette.muted)
      .text(`${page.httpStatus ?? "-"}  ${page.url}`, MARGIN, cursor, {
        width: CONTENT_WIDTH,
        height: 12,
        align: "left",
        features: [],
        ellipsis: true,
      });
    cursor += 15;
  }
  if (report.pages.length > pagesToShow.length) {
    doc
      .font("BasirahRegular")
      .fontSize(7.4)
      .fillColor(palette.subtle)
      .text(
        `+ ${report.pages.length - pagesToShow.length} صفحات إضافية محفوظة في التقرير الرقمي`,
        MARGIN,
        cursor,
        { ...rtl, width: CONTENT_WIDTH, height: 12 },
      );
    cursor += 17;
  }
  cursor += 12;
  card(
    doc,
    MARGIN,
    cursor,
    CONTENT_WIDTH,
    132,
    palette.warningSoft,
    16,
    palette.warningSoft,
  );
  doc
    .font("BasirahSemibold")
    .fontSize(12)
    .fillColor(palette.warning)
    .text("ما الذي لا تقوله هذه الدرجة؟", MARGIN + 24, cursor + 19, {
      ...rtl,
      width: CONTENT_WIDTH - 48,
      height: 22,
    });
  const limitations = [
    ...report.limitations,
    ...(report.narrative?.limitations ?? []),
    "لا تضمن الدرجة ترتيبًا أو ذكرًا أو استشهادًا في غوغل أو شات جي بي تي أو جيمناي.",
    "يحتاج إثبات التحسن إلى إعادة الفحص بالطريقة نفسها ومصدر مستقل لبيانات البحث والتحويل.",
  ]
    .filter((item, index, values) => values.indexOf(item) === index)
    .slice(0, 3);
  doc
    .font("BasirahRegular")
    .fontSize(8.5)
    .fillColor(palette.ink)
    .text(
      limitations.map((item) => `• ${rtlSafeText(item)}`).join("\n"),
      MARGIN + 24,
      cursor + 50,
      {
        ...rtl,
        width: CONTENT_WIDTH - 48,
        height: 68,
        ellipsis: true,
      },
    );

  cursor += 150;
  if (cursor + 138 <= CONTENT_BOTTOM) {
    card(
      doc,
      MARGIN,
      cursor,
      CONTENT_WIDTH,
      138,
      palette.primary,
      16,
      palette.primary,
    );
    doc
      .font("BasirahSemibold")
      .fontSize(13)
      .fillColor(palette.white)
      .text(
        "حوّل التقرير إلى دورة تحسين قابلة للقياس",
        MARGIN + 24,
        cursor + 20,
        {
          ...rtl,
          width: CONTENT_WIDTH - 48,
          height: 24,
        },
      );
    doc
      .font("BasirahRegular")
      .fontSize(8.8)
      .fillColor("#E0E7FF")
      .text(
        "01  نفّذ الأولوية الأعلى أثرًا واحتفظ بالدليل قبل التعديل.\n02  أعد الفحص بالطريقة نفسها وقارن المحاور والتغطية.\n03  اربط بيانات البحث والتحويل بمصدر مستقل لإثبات الأثر التجاري.",
        MARGIN + 24,
        cursor + 54,
        { ...rtl, width: CONTENT_WIDTH - 48, height: 70 },
      );
  }

  drawFooter(doc, report.domain);
  doc.end();
  return completed;
}
