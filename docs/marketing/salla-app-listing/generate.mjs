/**
 * Generates branded, captioned Salla App Store listing images (1600×1200 PNG)
 * from the raw product screenshots in ../screenshots/.
 *
 * Run from the repository root:
 *   node docs/marketing/salla-app-listing/generate.mjs
 *
 * Text is rendered from SVG through sharp/librsvg with the complete
 * IBM Plex Sans Arabic faces embedded as data URIs, so Arabic shaping and
 * bidi (Latin acronyms, digits) come out correctly without a browser.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..", "..", "..");
const screenshotsDir = join(root, "docs", "marketing", "screenshots");

const WIDTH = 1600;
const HEIGHT = 1200;

const INK = "#141B33";
const MUTED = "#57617A";
const VIOLET = "#4A3ECF";
const VIOLET_SOFT = "#EDEBFB";
const GREEN = "#1E8A5E";
const GREEN_SOFT = "#E3F3EB";

const fontDir = join(root, "node_modules", "@ibm", "plex-sans-arabic", "fonts", "complete", "woff2");
const fontFace = (file, weight) =>
  `@font-face{font-family:'IBM Plex Sans Arabic';font-weight:${weight};src:url(data:font/woff2;base64,${readFileSync(join(fontDir, file)).toString("base64")}) format('woff2');}`;
const FONTS = [
  fontFace("IBMPlexSansArabic-Regular.woff2", 400),
  fontFace("IBMPlexSansArabic-SemiBold.woff2", 600),
  fontFace("IBMPlexSansArabic-Bold.woff2", 700),
].join("\n");

const imageData = (file) =>
  `data:image/png;base64,${readFileSync(join(screenshotsDir, file)).toString("base64")}`;

/** Right-aligned RTL text: librsvg treats text-anchor:start as the inline start (right edge). */
const rtlText = (x, y, size, weight, fill, content, opts = "") =>
  `<text x="${x}" y="${y}" direction="rtl" text-anchor="start" font-family="IBM Plex Sans Arabic" font-weight="${weight}" font-size="${size}" fill="${fill}" ${opts}>${content}</text>`;

/** Left-aligned RTL text (inline end sits on x). */
const rtlTextLeft = (x, y, size, weight, fill, content) =>
  `<text x="${x}" y="${y}" direction="rtl" text-anchor="end" font-family="IBM Plex Sans Arabic" font-weight="${weight}" font-size="${size}" fill="${fill}">${content}</text>`;

const defs = `
  <defs>
    <style>${FONTS}</style>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#F6F8FD"/>
      <stop offset="1" stop-color="#E9EEF8"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.78" cy="0.05" r="0.9">
      <stop offset="0" stop-color="${VIOLET}" stop-opacity="0.10"/>
      <stop offset="0.55" stop-color="${VIOLET}" stop-opacity="0"/>
    </radialGradient>
    <filter id="cardShadow" x="-20%" y="-20%" width="140%" height="150%">
      <feDropShadow dx="0" dy="20" stdDeviation="26" flood-color="#1A2440" flood-opacity="0.18"/>
    </filter>
  </defs>`;

const background = `
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#glow)"/>`;

const brandMark = (cx, cy) => `
  <circle cx="${cx}" cy="${cy}" r="17" fill="${VIOLET}"/>
  <circle cx="${cx}" cy="${cy}" r="7" fill="#FFFFFF"/>`;

const footer = `
  ${brandMark(1466, 1157)}
  ${rtlText(1436, 1167, 26, 700, INK, "بصيرة — الظهور والمبيعات بالذكاء الاصطناعي لمتاجر سلة")}
  ${rtlTextLeft(110, 1166, 21, 400, MUTED, "لقطات من متجر تجريبي موضَّح داخل المنتج · لا نضمن ترتيبًا أو ذكرًا في أي منصة")}`;

const kickerPill = (x, y, width, label) => `
  <rect x="${x - width}" y="${y}" width="${width}" height="52" rx="26" fill="${VIOLET_SOFT}"/>
  ${rtlText(x - 28, y + 36, 26, 700, VIOLET, label)}`;

const bullet = (y, text) => `
  <circle cx="1464" cy="${y - 10}" r="17" fill="${GREEN_SOFT}"/>
  <path d="M ${1471} ${y - 13} l -8 9 l -5 -5" stroke="${GREEN}" stroke-width="3.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  ${rtlText(1428, y, 28, 400, "#3B455C", text)}`;

const framedImage = (file, x, y, w, h, rx = 22, extra = "") => `
  <g ${extra}>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="#FFFFFF" filter="url(#cardShadow)"/>
    <clipPath id="clip-${file.replace(/[^a-z0-9]/gi, "")}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}"/></clipPath>
    <image href="${imageData(file)}" x="${x}" y="${y}" width="${w}" height="${h}" clip-path="url(#clip-${file.replace(/[^a-z0-9]/gi, "")})" preserveAspectRatio="xMidYMid meet"/>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="none" stroke="#D6DCEA" stroke-width="2"/>
  </g>`;

/** Layout A: header text + full-width landscape screenshot (2880×1800 → 1360×850). */
function landscapeSlide({ kicker, kickerWidth, title, subtitle }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  ${defs}${background}
  ${kickerPill(1490, 62, kickerWidth, kicker)}
  ${rtlText(1490, 202, 58, 700, INK, title)}
  ${rtlText(1490, 258, 29, 400, MUTED, subtitle)}
  {{IMAGE}}
  ${footer}
</svg>`;
}

/** Layout B: portrait phone screenshot on the left, caption block on the right. */
function portraitSlide({ kicker, kickerWidth, titleLines, subtitle, bullets }) {
  const titleSvg = titleLines
    .map((line, i) => rtlText(1490, 340 + i * 84, 62, 700, typeof line === "string" ? INK : line.color, typeof line === "string" ? line : line.text))
    .join("\n");
  const bulletsStart = 340 + titleLines.length * 84 + 96;
  const bulletsSvg = bullets.map((b, i) => bullet(bulletsStart + i * 66, b)).join("\n");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  ${defs}${background}
  ${kickerPill(1490, 180, kickerWidth, kicker)}
  ${titleSvg}
  ${rtlText(1490, 340 + titleLines.length * 84 - 22, 30, 400, MUTED, subtitle)}
  ${bulletsSvg}
  {{IMAGE}}
  ${footer}
</svg>`;
}

const slides = [
  {
    out: "01-hero.png",
    build: () =>
      portraitSlide({
        kicker: "تطبيق بصيرة لمتاجر سلة",
        kickerWidth: 320,
        titleLines: [
          "عملاؤك يسألون الذكاء",
          "الاصطناعي قبل أن يشتروا.",
          { text: "هل متجرك ضمن الإجابة؟", color: VIOLET },
        ],
        subtitle: "وكيل مبيعات يبيع من بياناتك، وجاهزية ظهور موثّقة بالأدلة.",
        bullets: [
          "وكيل مبيعات عربي يرد على عملائك على مدار الساعة",
          "فحص جاهزية الظهور في Google وChatGPT وGemini",
          "كل رقم بمصدره — ولا وعود لا نملكها",
        ],
      }).replace(
        "{{IMAGE}}",
        framedImage("chat-conversation.png", 150, 130, 561, 950, 34, `transform="rotate(-3 430 605)"`),
      ),
  },
  {
    out: "02-sales-agent.png",
    build: () =>
      portraitSlide({
        kicker: "وكيل المبيعات",
        kickerWidth: 220,
        titleLines: ["وكيل مبيعات يبيع من", { text: "بيانات متجرك فقط", color: VIOLET }],
        subtitle: "يفهم الاحتياج والميزانية واللهجة، ويرشّح من كتالوجك المتزامن.",
        bullets: [
          "سعر ومخزون حقيقيان من سجل المنتج نفسه",
          "بطاقة منتج بشارة «الأنسب» مع سبب الترشيح",
          "لا يخترع معلومة — والحساس يتحوّل لفريقك بأدب",
        ],
      }).replace("{{IMAGE}}", framedImage("chat-conversation.png", 150, 130, 561, 950, 34)),
  },
  {
    out: "03-dashboard.png",
    build: () =>
      landscapeSlide({
        kicker: "لوحة القرارات",
        kickerWidth: 220,
        title: "لوحة تُدار بالقرارات، لا بالأرقام",
        subtitle: "ماذا تغيّر، ما الذي يمنع الشراء، وما خطوتك التالية — مع مصدر وفترة لكل رقم.",
      }).replace("{{IMAGE}}", framedImage("dashboard.png", 120, 292, 1360, 850)),
  },
  {
    out: "04-intelligence.png",
    build: () =>
      landscapeSlide({
        kicker: "ذكاء العملاء",
        kickerWidth: 200,
        title: "اعرف ماذا يريد عملاؤك فعلًا",
        subtitle: "كل محادثة تتحول إلى إشارة منظمة: احتياجات صاعدة، اعتراضات متكررة، وفجوات طلب.",
      }).replace("{{IMAGE}}", framedImage("intelligence.png", 120, 292, 1360, 850)),
  },
  {
    out: "05-visibility.png",
    build: () =>
      landscapeSlide({
        kicker: "جاهزية الظهور بالذكاء الاصطناعي",
        kickerWidth: 420,
        title: "هل متجرك جاهز لعصر البحث الذكي؟",
        subtitle: "درجة من 100 لكل مكوّن — SEO · AEO · GEO — وأهم الفجوات مع خطوة الإصلاح التالية.",
      }).replace("{{IMAGE}}", framedImage("visibility.png", 120, 292, 1360, 850)),
  },
  {
    out: "06-brand-studio.png",
    build: () =>
      landscapeSlide({
        kicker: "استوديو الهوية",
        kickerWidth: 220,
        title: "مستشارك بهوية متجرك أنت",
        subtitle: "شعارك وألوانك ورسالة ترحيبك واقتراحات البداية — مع معاينة حية واختبار قبل النشر.",
      }).replace("{{IMAGE}}", framedImage("widget.png", 120, 292, 1360, 850)),
  },
  {
    out: "07-conversations.png",
    build: () =>
      landscapeSlide({
        kicker: "المحادثات",
        kickerWidth: 190,
        title: "كل محادثة موثّقة حتى قرار الشراء",
        subtitle: "من السؤال الأول إلى التوصية والنقر والإضافة للسلة — بدليل لكل خطوة.",
      }).replace("{{IMAGE}}", framedImage("conversations.png", 120, 292, 1360, 850)),
  },
  {
    out: "08-opportunities.png",
    build: () =>
      landscapeSlide({
        kicker: "فرص النمو",
        kickerWidth: 190,
        title: "فرص مولّدة من طلب عملائك الحقيقي",
        subtitle: "أسئلة عملائك التي بلا إجابة تتحول إلى مقترحات محتوى وتشكيلة مرتبة بالأولوية.",
      }).replace("{{IMAGE}}", framedImage("opportunities.png", 120, 292, 1360, 850)),
  },
  {
    out: "09-content-studio.png",
    build: () =>
      landscapeSlide({
        kicker: "استوديو المحتوى",
        kickerWidth: 230,
        title: "محتوى عربي مسند بحقائق متجرك",
        subtitle: "مقالات تجيب أسئلة الشراء، بمراجعة تحريرية من 100 نقطة وبيانات منظمة قبل النشر.",
      }).replace("{{IMAGE}}", framedImage("content-studio.png", 120, 292, 1360, 850)),
  },
];

for (const slide of slides) {
  const svg = slide.build();
  await sharp(Buffer.from(svg), { density: 72 })
    .png({ compressionLevel: 9 })
    .toFile(join(here, slide.out));
  console.log("✓", slide.out);
}

await sharp(readFileSync(join(root, "src", "app", "icon.svg")))
  .resize(512, 512)
  .png({ compressionLevel: 9 })
  .toFile(join(here, "app-icon-512.png"));
console.log("✓", "app-icon-512.png");

const renderPortalAsset = async (file, width, height, body) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>
      <style>${FONTS}</style>
      <linearGradient id="portal-bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#F7F8FD"/>
        <stop offset="1" stop-color="#E8ECFA"/>
      </linearGradient>
      <linearGradient id="portal-violet" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#5A4EE1"/>
        <stop offset="1" stop-color="#352AAE"/>
      </linearGradient>
      <filter id="portal-shadow" x="-30%" y="-30%" width="160%" height="170%">
        <feDropShadow dx="0" dy="18" stdDeviation="24" flood-color="#17203A" flood-opacity="0.16"/>
      </filter>
    </defs>
    <rect width="${width}" height="${height}" fill="url(#portal-bg)"/>
    <circle cx="${Math.round(width * 0.82)}" cy="${Math.round(height * 0.08)}" r="${Math.round(height * 0.7)}" fill="${VIOLET}" opacity="0.06"/>
    ${body}
  </svg>`;
  await sharp(Buffer.from(svg), { density: 72 })
    .png({ compressionLevel: 9 })
    .toFile(join(here, file));
  console.log("✓", file);
};

const portalEye = (cx, cy, scale = 1) => `
  <rect x="${cx - 70 * scale}" y="${cy - 70 * scale}" width="${140 * scale}" height="${140 * scale}" rx="${42 * scale}" fill="url(#portal-violet)"/>
  <path d="M ${cx - 40 * scale} ${cy} C ${cx - 14 * scale} ${cy - 34 * scale}, ${cx + 14 * scale} ${cy - 34 * scale}, ${cx + 40 * scale} ${cy} C ${cx + 14 * scale} ${cy + 34 * scale}, ${cx - 14 * scale} ${cy + 34 * scale}, ${cx - 40 * scale} ${cy} Z" fill="none" stroke="#fff" stroke-width="${8 * scale}" stroke-linejoin="round"/>
  <circle cx="${cx}" cy="${cy}" r="${13 * scale}" fill="#fff"/>`;

await renderPortalAsset(
  "gallery-01-sales-agent.png",
  1366,
  768,
  `
    <rect x="66" y="46" width="390" height="676" rx="34" fill="#fff" filter="url(#portal-shadow)"/>
    <clipPath id="gallery-chat"><rect x="66" y="46" width="390" height="676" rx="34"/></clipPath>
    <image href="${imageData("chat-conversation.png")}" x="66" y="46" width="390" height="676" preserveAspectRatio="xMidYMid slice" clip-path="url(#gallery-chat)"/>
    ${portalEye(1230, 104, 0.55)}
    ${rtlText(1290, 248, 52, 700, INK, "وكيل مبيعات من بيانات متجرك")}
    ${rtlText(1290, 304, 27, 400, MUTED, "يفهم الاحتياج والميزانية، ثم يرشّح من المنتجات المتاحة فقط.")}
    <rect x="734" y="374" width="556" height="84" rx="22" fill="#FFFFFF"/>
    ${rtlText(1252, 427, 25, 600, INK, "سعر ومخزون حقيقيان من سجل المنتج")}
    <circle cx="776" cy="416" r="19" fill="${GREEN_SOFT}"/><path d="M767 416l7 7 13-16" fill="none" stroke="${GREEN}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="734" y="480" width="556" height="84" rx="22" fill="#FFFFFF"/>
    ${rtlText(1252, 533, 25, 600, INK, "لا يختلق منتجًا أو معلومة ناقصة")}
    <circle cx="776" cy="522" r="19" fill="${GREEN_SOFT}"/><path d="M767 522l7 7 13-16" fill="none" stroke="${GREEN}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    ${rtlText(1290, 674, 22, 600, VIOLET, "بصيرة — وكيل مبيعات ذكي لمتاجر سلة")}
  `,
);

await renderPortalAsset(
  "gallery-02-customer-insights.png",
  1366,
  768,
  `
    ${portalEye(1248, 90, 0.48)}
    ${rtlText(1290, 118, 42, 700, INK, "اعرف ما يريده عملاؤك فعلًا")}
    ${rtlText(1290, 166, 24, 400, MUTED, "احتياجات واعتراضات وفجوات طلب منظمة من المحادثات.")}
    <rect x="54" y="206" width="1258" height="514" rx="28" fill="#FFFFFF" filter="url(#portal-shadow)"/>
    <clipPath id="gallery-intelligence"><rect x="54" y="206" width="1258" height="514" rx="28"/></clipPath>
    <image href="${imageData("intelligence.png")}" x="54" y="206" width="1258" height="514" preserveAspectRatio="xMidYMid slice" clip-path="url(#gallery-intelligence)"/>
  `,
);

await renderPortalAsset(
  "gallery-03-free-report.png",
  1366,
  768,
  `
    ${portalEye(1248, 90, 0.48)}
    ${rtlText(1290, 118, 42, 700, INK, "ابدأ بتقرير موقعك المجاني")}
    ${rtlText(1290, 166, 24, 400, MUTED, "أدلة مرتبطة بالصفحات وخطة 30/60/90 يومًا — بلا وعد ترتيب.")}
    <rect x="54" y="206" width="1258" height="514" rx="28" fill="#FFFFFF" filter="url(#portal-shadow)"/>
    <clipPath id="gallery-visibility"><rect x="54" y="206" width="1258" height="514" rx="28"/></clipPath>
    <image href="${imageData("visibility.png")}" x="54" y="206" width="1258" height="514" preserveAspectRatio="xMidYMid slice" clip-path="url(#gallery-visibility)"/>
  `,
);

await renderPortalAsset(
  "benefit-01-grounded-sales.png",
  1600,
  1600,
  `
    ${portalEye(800, 260, 1.15)}
    ${rtlText(1420, 550, 72, 700, INK, "يرشّح من كتالوجك فقط")}
    ${rtlText(1420, 625, 34, 400, MUTED, "فلترة الاحتياج والميزانية والتوفر تسبق أي شرح.")}
    <rect x="180" y="760" width="1240" height="500" rx="54" fill="#FFFFFF" filter="url(#portal-shadow)"/>
    <rect x="1040" y="840" width="270" height="270" rx="42" fill="${GREEN_SOFT}"/>
    <rect x="1122" y="900" width="106" height="136" rx="20" fill="#FFFFFF" stroke="${GREEN}" stroke-width="7"/>
    <circle cx="1175" cy="968" r="23" fill="${GREEN}"/>
    ${rtlText(960, 900, 42, 700, INK, "المنتج الأنسب")}
    ${rtlText(960, 964, 30, 400, MUTED, "السعر · المخزون · سبب الترشيح")}
    <rect x="300" y="1040" width="660" height="82" rx="30" fill="${VIOLET_SOFT}"/>
    ${rtlText(910, 1094, 27, 600, VIOLET, "حقائق متزامنة — لا سعر متوقع ولا منتج مخترع")}
    ${rtlText(1420, 1448, 28, 600, VIOLET, "بصيرة — وكيل مبيعات ذكي")}
  `,
);

await renderPortalAsset(
  "benefit-02-customer-insights.png",
  1600,
  1600,
  `
    ${portalEye(800, 260, 1.15)}
    ${rtlText(1420, 550, 72, 700, INK, "اعرف ما يريده العملاء")}
    ${rtlText(1420, 625, 34, 400, MUTED, "حوّل الأسئلة المتكررة إلى قرارات واضحة.")}
    <rect x="180" y="760" width="1240" height="500" rx="54" fill="#FFFFFF" filter="url(#portal-shadow)"/>
    <rect x="260" y="850" width="390" height="120" rx="38" fill="${VIOLET_SOFT}"/>
    ${rtlText(610, 925, 28, 600, VIOLET, "احتياج صاعد")}
    <rect x="260" y="1000" width="540" height="120" rx="38" fill="#EEF2F8"/>
    ${rtlText(760, 1075, 28, 600, INK, "اعتراض متكرر قبل الشراء")}
    <rect x="900" y="1060" width="86" height="110" rx="20" fill="#C9C4F5"/>
    <rect x="1018" y="990" width="86" height="180" rx="20" fill="#8C82E9"/>
    <rect x="1136" y="880" width="86" height="290" rx="20" fill="${VIOLET}"/>
    <path d="M900 900 C1000 850 1100 900 1240 790" fill="none" stroke="${GREEN}" stroke-width="12" stroke-linecap="round"/>
    ${rtlText(1420, 1448, 28, 600, VIOLET, "كل إشارة مرتبطة بالمحادثة ومصدرها")}
  `,
);

await renderPortalAsset(
  "benefit-03-free-report.png",
  1600,
  1600,
  `
    ${portalEye(800, 260, 1.15)}
    ${rtlText(1420, 550, 72, 700, INK, "ابدأ بتقرير مجاني")}
    ${rtlText(1420, 625, 34, 400, MUTED, "حتى 10 صفحات وأدلة وخطة إصلاح مرتبة بالأثر.")}
    <rect x="330" y="750" width="940" height="570" rx="48" fill="#FFFFFF" filter="url(#portal-shadow)"/>
    <circle cx="1080" cy="940" r="118" fill="${VIOLET_SOFT}"/>
    ${rtlText(1168, 972, 70, 700, VIOLET, "82")}
    ${rtlText(1148, 1022, 24, 600, MUTED, "من 100")}
    <rect x="450" y="870" width="420" height="40" rx="20" fill="#E8ECF5"/>
    <rect x="450" y="870" width="344" height="40" rx="20" fill="${VIOLET}"/>
    <rect x="450" y="970" width="470" height="24" rx="12" fill="#DDE3EE"/>
    <rect x="450" y="1030" width="390" height="24" rx="12" fill="#DDE3EE"/>
    <rect x="450" y="1090" width="440" height="24" rx="12" fill="#DDE3EE"/>
    <rect x="450" y="1170" width="500" height="70" rx="24" fill="${GREEN_SOFT}"/>
    ${rtlText(910, 1216, 26, 600, GREEN, "خطة 30 / 60 / 90 يومًا")}
    ${rtlText(1420, 1448, 28, 600, VIOLET, "جاهزية موثّقة — لا ضمان ترتيب أو ذكر")}
  `,
);

await renderPortalAsset(
  "embedded-banner.png",
  1420,
  520,
  `
    ${portalEye(180, 260, 1.15)}
    ${rtlText(1330, 210, 60, 700, INK, "بصيرة — وكيل مبيعات ذكي")}
    ${rtlText(1330, 280, 31, 400, MUTED, "من كتالوجك إلى توصية موثّقة، ومن السؤال إلى قرار أوضح.")}
    <rect x="770" y="340" width="560" height="68" rx="26" fill="${VIOLET_SOFT}"/>
    ${rtlText(1288, 384, 25, 600, VIOLET, "تقرير مجاني · ذكاء العملاء · جاهزية الظهور")}
  `,
);
