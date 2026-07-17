import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";
import { buildMessage, buildShortMessage, campaign, prospects } from "./campaign-data.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const outputRoot = path.resolve(here, "..");
const visualDir = path.join(outputRoot, "visuals");
const renderDir = path.join(outputRoot, "rendered");
const outputPath = path.join(outputRoot, "Basirah_50_Prospects_Arabic_Campaign_2026-07-15.xlsx");
await fs.mkdir(renderDir, { recursive: true });

if (prospects.length !== 50) throw new Error(`Expected 50 prospects, received ${prospects.length}`);

const wb = Workbook.create();
const dashboard = wb.worksheets.add("لوحة الحملة");
const leads = wb.worksheets.add("العملاء المحتملون");
const messages = wb.worksheets.add("الرسائل العربية");
const gallery = wb.worksheets.add("الصور المخصصة");
const settings = wb.worksheets.add("إعدادات وملاحظات");

const COLORS = {
  navy: "#172033",
  purple: "#4938D4",
  teal: "#0F9F8F",
  gold: "#D6A85B",
  light: "#F2F5FB",
  line: "#D5DDEA",
  white: "#FFFFFF",
  red: "#B42318",
  redLight: "#FEE4E2",
  green: "#067647",
  greenLight: "#ECFDF3",
  amber: "#B54708",
  amberLight: "#FFFAEB",
  muted: "#667085",
};

const titleStyle = {
  fill: COLORS.navy,
  font: { bold: true, color: COLORS.white, size: 20 },
  horizontalAlignment: "right",
  verticalAlignment: "center",
};
const sectionStyle = {
  fill: COLORS.purple,
  font: { bold: true, color: COLORS.white, size: 12 },
  horizontalAlignment: "right",
  verticalAlignment: "center",
};
const headerStyle = {
  fill: COLORS.purple,
  font: { bold: true, color: COLORS.white, size: 11 },
  horizontalAlignment: "right",
  verticalAlignment: "center",
  wrapText: true,
  borders: { preset: "all", style: "thin", color: COLORS.line },
};
const bodyStyle = {
  font: { color: COLORS.navy, size: 10 },
  horizontalAlignment: "right",
  verticalAlignment: "top",
  wrapText: true,
  borders: { preset: "all", style: "thin", color: COLORS.line },
};

function segmentFor(p) {
  if (p.category.includes("قهوة")) return "القهوة";
  if (p.category.includes("عبايات") || p.category.includes("فساتين")) return "الأزياء";
  if (p.category.includes("إلكترونيات")) return "الإلكترونيات";
  if (p.category.includes("عطر") || p.category.includes("عطور") || p.category.includes("عود")) return "العطور والعود";
  if (p.category.includes("عسل") || p.category.includes("زيوت") || p.category.includes("أعشاب")) return "العسل والمنتجات الطبيعية";
  if (p.category.includes("هدايا") || p.category.includes("حلويات") || p.category.includes("شوكولاتة") || p.category.includes("تمور")) return "الهدايا والأغذية";
  return "الجمال والعناية";
}

for (const sheet of [dashboard, leads, messages, gallery, settings]) {
  sheet.showGridLines = false;
}

// لوحة الحملة
dashboard.mergeCells("A1:J2");
dashboard.getRange("A1").values = [["حملة بصيرة — 50 عميلًا محتملاً برسائل وصور مخصصة"]];
dashboard.getRange("A1:J2").format = titleStyle;
dashboard.getRange("A3:J3").values = [["القائمة مبنية على متاجر سعودية نشطة وملائمة لربط الظهور في Google والذكاء الاصطناعي بالمحتوى ثم بمستشار المبيعات.", "", "", "", "", "", "", "", "", ""]];
dashboard.mergeCells("A3:J3");
dashboard.getRange("A3:J3").format = { fill: "#EDEBFF", font: { color: COLORS.navy, size: 11 }, horizontalAlignment: "right", verticalAlignment: "center", wrapText: true };

const kpis = [
  ["A5:B5", "إجمالي العملاء", "A6", "=COUNTA('العملاء المحتملون'!$C$2:$C$51)", COLORS.purple],
  ["C5:D5", "أولوية حارة", "C6", "=COUNTIF('العملاء المحتملون'!$B$2:$B$51,\"حار\")", COLORS.teal],
  ["E5:F5", "لم يبدأ التواصل", "E6", "=COUNTIF('العملاء المحتملون'!$J$2:$J$51,\"لم يبدأ\")", COLORS.gold],
  ["G5:H5", "تم الرد", "G6", "=COUNTIF('العملاء المحتملون'!$J$2:$J$51,\"تم الرد\")", "#7F56D9"],
  ["I5:J5", "موعد متابعة", "I6", "=COUNTIF('العملاء المحتملون'!$J$2:$J$51,\"متابعة\")", "#2E90FA"],
];
for (const [labelRange, label, valueCell, formula, color] of kpis) {
  dashboard.mergeCells(labelRange);
  dashboard.getRange(labelRange).values = [[label]];
  dashboard.getRange(labelRange).format = { fill: color, font: { bold: true, color: COLORS.white, size: 11 }, horizontalAlignment: "center", verticalAlignment: "center" };
  const [start, end] = labelRange.split(":");
  const valueRange = `${start[0]}6:${end[0]}7`;
  dashboard.mergeCells(valueRange);
  dashboard.getRange(valueCell).formulas = [[formula]];
  dashboard.getRange(valueRange).format = { fill: COLORS.white, font: { bold: true, color, size: 26 }, horizontalAlignment: "center", verticalAlignment: "center", borders: { preset: "outside", style: "thin", color } };
}

dashboard.mergeCells("A9:J9");
dashboard.getRange("A9").values = [["توزيع الفرص حسب الفئة"]];
dashboard.getRange("A9:J9").format = sectionStyle;

const categories = [...new Set(prospects.map(segmentFor))].sort((a, b) => a.localeCompare(b, "ar"));
dashboard.getRange(`A11:B${10 + categories.length}`).values = categories.map((category) => [category, null]);
dashboard.getRange("A10:B10").values = [["الفئة", "العدد"]];
dashboard.getRange("A10:B10").format = headerStyle;
dashboard.getRange(`A11:A${10 + categories.length}`).format = bodyStyle;
categories.forEach((_, index) => {
  const row = 11 + index;
  dashboard.getRange(`B${row}`).formulas = [[`=COUNTIF('العملاء المحتملون'!$P$2:$P$51,A${row})`]];
});
dashboard.getRange(`B11:B${10 + categories.length}`).format = { ...bodyStyle, horizontalAlignment: "center" };
dashboard.getRange("A:A").format.columnWidth = 26;
dashboard.getRange("B:B").format.columnWidth = 10;
dashboard.getRange("C:J").format.columnWidth = 13;
dashboard.getRange("1:3").format.rowHeight = 30;
dashboard.getRange("5:7").format.rowHeight = 27;

const chart = dashboard.charts.add("bar", dashboard.getRange(`A10:B${10 + categories.length}`));
chart.title = "عدد العملاء المحتملين حسب الفئة";
chart.hasLegend = false;
chart.setPosition("D10", "J26");
dashboard.freezePanes.freezeRows(3);

const warningHeaderRow = Math.max(25, 13 + categories.length);
const warningEndRow = warningHeaderRow + 3;
dashboard.mergeCells(`A${warningHeaderRow}:J${warningHeaderRow}`);
dashboard.getRange(`A${warningHeaderRow}`).values = [["تنبيه قبل الإرسال"]];
dashboard.getRange(`A${warningHeaderRow}:J${warningHeaderRow}`).format = { ...sectionStyle, fill: COLORS.red };
dashboard.mergeCells(`A${warningHeaderRow + 1}:J${warningEndRow}`);
dashboard.getRange(`A${warningHeaderRow + 1}`).values = [[campaign.dashboardStatus]];
dashboard.getRange(`A${warningHeaderRow + 1}:J${warningEndRow}`).format = { fill: COLORS.redLight, font: { bold: true, color: COLORS.red, size: 12 }, horizontalAlignment: "right", verticalAlignment: "center", wrapText: true, borders: { preset: "outside", style: "medium", color: COLORS.red } };

// العملاء المحتملون
const leadHeaders = ["#", "الأولوية", "المتجر", "الفئة", "سبب الملاءمة", "دليل/إشارة عامة", "رابط المتجر", "قناة التواصل العامة", "الثقة", "حالة التواصل", "المسؤول", "تاريخ المتابعة", "تاريخ التحقق", "مصدر التحقق", "ملف الصورة", "المجموعة الرئيسية"];
leads.getRange("A1:P1").values = [leadHeaders];
leads.getRange("A1:P1").format = headerStyle;
leads.getRange("A2:P51").values = prospects.map((p) => [
  p.id,
  p.priority,
  p.name,
  p.category,
  p.fit,
  p.signal,
  p.url,
  campaign.defaultContact,
  p.confidence,
  "لم يبدأ",
  "",
  "",
  campaign.verifiedAt,
  p.url,
  path.join(visualDir, `${p.slug}-bot-preview.png`),
  segmentFor(p),
]);
leads.getRange("A2:P51").format = bodyStyle;
leads.getRange("A2:A51").format.horizontalAlignment = "center";
leads.getRange("B2:B51").format.horizontalAlignment = "center";
leads.getRange("I2:J51").format.horizontalAlignment = "center";
leads.getRange("J2:J51").dataValidation = { rule: { type: "list", values: ["لم يبدأ", "تم الإرسال", "متابعة", "تم الرد", "اجتماع", "غير مناسب"] } };
leads.getRange("B2:B51").conditionalFormats.add("containsText", { text: "حار", format: { fill: COLORS.greenLight, font: { color: COLORS.green, bold: true } } });
leads.getRange("J2:J51").conditionalFormats.add("containsText", { text: "تم الرد", format: { fill: COLORS.greenLight, font: { color: COLORS.green, bold: true } } });
leads.getRange("J2:J51").conditionalFormats.add("containsText", { text: "متابعة", format: { fill: COLORS.amberLight, font: { color: COLORS.amber, bold: true } } });
const leadTable = leads.tables.add("A1:P51", true, "BasirahProspectsTable");
leadTable.style = "TableStyleMedium2";
leadTable.showFilterButton = true;
leads.freezePanes.freezeRows(1);
leads.freezePanes.freezeColumns(3);
const leadWidths = [6, 11, 23, 22, 46, 46, 32, 26, 10, 14, 16, 15, 14, 32, 58, 25];
leadWidths.forEach((width, i) => leads.getRangeByIndexes(0, i, 51, 1).format.columnWidth = width);
leads.getRange("2:51").format.rowHeight = 64;

// الرسائل العربية
const messageHeaders = ["#", "المتجر", "اسم المستشار", "سؤال البوت الخاص بالمتجر", "الرسالة العربية الكاملة", "نسخة واتساب قصيرة", "CTA", "رابط اللوحة", "مسار الصورة", "فحص قبل الإرسال"];
messages.getRange("A1:J1").values = [messageHeaders];
messages.getRange("A1:J1").format = headerStyle;
messages.getRange("A2:J51").values = prospects.map((p) => [
  p.id,
  p.name,
  p.assistant,
  p.question,
  buildMessage(p),
  buildShortMessage(p),
  "احصلوا على تقرير ظهور متجركم بالذكاء الاصطناعي مجانًا الآن",
  campaign.dashboardUrl,
  path.join(visualDir, `${p.slug}-bot-preview.png`),
  "لا ترسل قبل تفعيل رابط اللوحة",
]);
messages.getRange("A2:J51").format = bodyStyle;
messages.getRange("A2:A51").format.horizontalAlignment = "center";
messages.getRange("J2:J51").format = { ...bodyStyle, fill: COLORS.redLight, font: { color: COLORS.red, bold: true, size: 10 }, horizontalAlignment: "center", verticalAlignment: "center" };
const msgTable = messages.tables.add("A1:J51", true, "BasirahMessagesTable");
msgTable.style = "TableStyleMedium4";
msgTable.showFilterButton = true;
messages.freezePanes.freezeRows(1);
messages.freezePanes.freezeColumns(2);
const messageWidths = [6, 22, 25, 48, 105, 80, 48, 32, 58, 30];
messageWidths.forEach((width, i) => messages.getRangeByIndexes(0, i, 51, 1).format.columnWidth = width);
messages.getRange("2:51").format.rowHeight = 190;

// معرض الصور
gallery.mergeCells("A1:E1");
gallery.getRange("A1").values = [["50 صورة بوت مخصصة — اسم المتجر + سؤال من فئته"]];
gallery.getRange("A1:E1").format = titleStyle;
gallery.mergeCells("A2:E2");
gallery.getRange("A2").values = [["استخدم الصورة مع الرسالة المقابلة في ورقة «الرسائل العربية». كل التصورات غير منشورة وتعتمد على بيانات المتجر فقط."]];
gallery.getRange("A2:E2").format = { fill: "#EDEBFF", font: { color: COLORS.navy, size: 11 }, horizontalAlignment: "right", verticalAlignment: "center", wrapText: true };
gallery.getRange("A:E").format.columnWidthPx = 195;
gallery.getRange("1:2").format.rowHeight = 32;

for (let i = 0; i < prospects.length; i += 1) {
  const p = prospects[i];
  const group = Math.floor(i / 5);
  const col = i % 5;
  const labelRow = 4 + group * 2;
  const imageRow = 5 + group * 2;
  const colLetter = String.fromCharCode(65 + col);
  gallery.getRange(`${colLetter}${labelRow}`).values = [[`${p.id}. ${p.name}`]];
  gallery.getRange(`${colLetter}${labelRow}`).format = { fill: p.primary, font: { bold: true, color: COLORS.white, size: 10 }, horizontalAlignment: "center", verticalAlignment: "center", wrapText: true };
  gallery.getRange(`${labelRow}:${labelRow}`).format.rowHeight = 28;
  gallery.getRange(`${imageRow}:${imageRow}`).format.rowHeightPx = 245;
  const png = await fs.readFile(path.join(visualDir, `${p.slug}-bot-preview.png`));
  const dataUrl = `data:image/png;base64,${png.toString("base64")}`;
  gallery.images.add({ dataUrl, anchor: { from: { row: imageRow - 1, col }, extent: { widthPx: 180, heightPx: 240 } } });
}
gallery.freezePanes.freezeRows(2);

// إعدادات وملاحظات
settings.mergeCells("A1:F2");
settings.getRange("A1").values = [["إعدادات حملة بصيرة ودليل الاستخدام"]];
settings.getRange("A1:F2").format = titleStyle;
settings.getRange("A4:B10").values = [
  ["الحقل", "القيمة"],
  ["رابط لوحة بصيرة المقترح", campaign.dashboardUrl],
  ["حالة الرابط", campaign.dashboardStatus],
  ["CTA المعتمد", "احصلوا على تقرير ظهور متجركم بالذكاء الاصطناعي مجانًا الآن"],
  ["تاريخ التحقق", campaign.verifiedAt],
  ["نطاق البحث", "متاجر سعودية نشطة على سلة أو متاجر مستقلة عامة"],
  ["قناة التواصل", "استخدم بيانات الأعمال العامة فقط؛ لا تجمع بيانات شخصية خاصة"],
];
settings.getRange("A4:B4").format = headerStyle;
settings.getRange("A5:B10").format = bodyStyle;
settings.getRange("A:A").format.columnWidth = 30;
settings.getRange("B:B").format.columnWidth = 100;
settings.getRange("B6").format = { fill: COLORS.redLight, font: { bold: true, color: COLORS.red, size: 11 }, horizontalAlignment: "right", verticalAlignment: "center", wrapText: true, borders: { preset: "all", style: "medium", color: COLORS.red } };
settings.getRange("5:10").format.rowHeight = 48;

settings.mergeCells("A12:F12");
settings.getRange("A12").values = [["كيف ترتبط خدمات بصيرة بدون إرباك العميل؟"]];
settings.getRange("A12:F12").format = sectionStyle;
settings.getRange("A13:B16").values = [
  ["1 — التقرير المجاني", "يكشف ما الذي تفهمه Google وأنظمة الذكاء الاصطناعي عن المتجر، وأين توجد فجوات الظهور."],
  ["2 — محتوى بصيرة", "يعالج الفجوات عبر مقالات عربية مبنية على حقائق المتجر ومتوافقة مع إرشادات Google المنشورة."],
  ["3 — مستشار المبيعات", "يستخدم بيانات المنتجات نفسها ليجيب العميل ويرشّح من المتوفر فقط، فيحوّل الاهتمام إلى اختيار وشراء."],
  ["الجملة الجامعة", "التقرير يكشف الفجوات، والمحتوى يعالجها، والمستشار يحوّل الاهتمام إلى اختيار وشراء."],
];
settings.getRange("A13:B16").format = bodyStyle;
settings.getRange("13:16").format.rowHeight = 60;

settings.mergeCells("A18:F18");
settings.getRange("A18").values = [["ضوابط الإرسال"]];
settings.getRange("A18:F18").format = { ...sectionStyle, fill: COLORS.teal };
settings.getRange("A19:B23").values = [
  ["رابط واحد", "استخدم رابط لوحة واحدة تجمع التقرير والفرص والمحتوى ونموذج المستشار."],
  ["CTA واحد", "اطلب الحصول على التقرير المجاني؛ دع اللوحة تشرح بقية المسار."],
  ["الادعاءات", "لا تَعِد بترتيب أو نتيجة مضمونة في Google أو أنظمة الذكاء الاصطناعي."],
  ["الفئات الحساسة", "في العسل والأعشاب والجمال: معلومات المنتج فقط، بلا تشخيص أو وعود علاجية."],
  ["التخصيص", "راجع الإشارة العامة قبل الإرسال وتأكد أنها ما زالت ظاهرة في الموقع."],
];
settings.getRange("A19:B23").format = bodyStyle;
settings.getRange("19:23").format.rowHeight = 54;
settings.freezePanes.freezeRows(2);

// التحقق والرندر
const dashboardCheck = await wb.inspect({ kind: "table", range: `لوحة الحملة!A1:J${warningEndRow}`, include: "values,formulas", tableMaxRows: warningEndRow, tableMaxCols: 10, maxChars: 12000 });
const leadCheck = await wb.inspect({ kind: "table", range: "العملاء المحتملون!A1:P8", include: "values,formulas", tableMaxRows: 8, tableMaxCols: 16, maxChars: 12000 });
const errorCheck = await wb.inspect({ kind: "match", searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A", options: { useRegex: true, maxResults: 300 }, summary: "final formula error scan" });
await fs.writeFile(path.join(outputRoot, "verification.txt"), `DASHBOARD\n${dashboardCheck.ndjson}\n\nLEADS\n${leadCheck.ndjson}\n\nERRORS\n${errorCheck.ndjson}\n`);

const renderTargets = [
  ["لوحة الحملة", `A1:J${warningEndRow}`, "01-dashboard.png", 1],
  ["العملاء المحتملون", "A1:P14", "02-prospects.png", 0.75],
  ["الرسائل العربية", "A1:J7", "03-messages.png", 0.65],
  ["الصور المخصصة", "A1:E23", "04-gallery.png", 0.7],
  ["إعدادات وملاحظات", "A1:F23", "05-settings.png", 0.85],
];
for (const [sheetName, range, filename, scale] of renderTargets) {
  const preview = await wb.render({ sheetName, range, scale, format: "png" });
  await fs.writeFile(path.join(renderDir, filename), new Uint8Array(await preview.arrayBuffer()));
}

const xlsx = await SpreadsheetFile.exportXlsx(wb);
await xlsx.save(outputPath);
console.log(outputPath);
