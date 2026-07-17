import type { UnifiedProduct, UnifiedStore } from "@/core/commerce/types";
import type { DemoConversation, DemoEvent, DemoOpportunity } from "@/core/demo/types";

const now = new Date("2026-07-11T12:00:00.000Z");

export const demoStore: UnifiedStore = {
  id: "store_mada_demo",
  externalId: "salla_demo_1001",
  platform: "mock-salla",
  name: { ar: "مَدى للعناية", en: "Mada Care" },
  domain: "mada-care.example",
  currency: "SAR",
  timezone: "Asia/Riyadh",
  category: "beauty",
  locale: "ar-SA",
};

export const demoProducts: UnifiedProduct[] = [
  {
    id: "prod_serum_balance",
    storeId: demoStore.id,
    externalId: "salla_prod_101",
    slug: "balance-niacinamide-serum",
    status: "active",
    name: { ar: "سيروم التوازن بالنياسيناميد", en: "Balance Niacinamide Serum" },
    description: {
      ar: "سيروم خفيف بتركيز موثّق 5٪ نياسيناميد، مصمم ضمن روتين العناية بالبشرة الدهنية والمختلطة.",
      en: "A lightweight serum with verified 5% niacinamide for oily and combination skincare routines.",
    },
    category: "serums",
    imageUrl: "/demo/products/serum.svg",
    productUrl: "/dashboard/products/prod_serum_balance",
    price: { amount: 12_900, currency: "SAR" },
    compareAtPrice: { amount: 14_900, currency: "SAR" },
    stock: 42,
    available: true,
    variants: [
      {
        id: "variant_serum_30",
        externalId: "salla_variant_101_30",
        sku: "MADA-SER-30",
        name: { ar: "30 مل", en: "30 ml" },
        price: { amount: 12_900, currency: "SAR" },
        compareAtPrice: { amount: 14_900, currency: "SAR" },
        stock: 42,
        available: true,
        options: { size: "30ml" },
      },
    ],
    attributes: [
      { key: "skin_type", label: { ar: "نوع البشرة" }, values: ["دهنية", "مختلطة"], verified: true, source: "merchant" },
      { key: "concern", label: { ar: "الاحتياج" }, values: ["المسام", "اللمعان"], verified: true, source: "merchant" },
      { key: "ingredient", label: { ar: "مكوّن موثّق" }, values: ["نياسيناميد 5٪"], verified: true, source: "document" },
      { key: "texture", label: { ar: "القوام" }, values: ["خفيف"], verified: true, source: "merchant" },
    ],
    exclusions: [],
    priority: 2,
    provenance: { platform: "mock-salla", externalId: "salla_prod_101", externalUpdatedAt: now.toISOString(), sourceVersion: "v4" },
  },
  {
    id: "prod_gentle_cleanser",
    storeId: demoStore.id,
    externalId: "salla_prod_102",
    slug: "gentle-cleanser",
    status: "active",
    name: { ar: "غسول يومي لطيف", en: "Gentle Daily Cleanser" },
    description: {
      ar: "غسول يومي بقوام كريمي ومعلومات استخدام واضحة. خالٍ من العطر بحسب ورقة المنتج المرفوعة من المتجر.",
      en: "A creamy daily cleanser. Fragrance-free according to the merchant-provided product sheet.",
    },
    category: "cleansers",
    imageUrl: "/demo/products/cleanser.svg",
    productUrl: "/dashboard/products/prod_gentle_cleanser",
    price: { amount: 8_900, currency: "SAR" },
    stock: 31,
    available: true,
    variants: [
      {
        id: "variant_cleanser_150",
        externalId: "salla_variant_102_150",
        sku: "MADA-CLN-150",
        name: { ar: "150 مل", en: "150 ml" },
        price: { amount: 8_900, currency: "SAR" },
        stock: 31,
        available: true,
        options: { size: "150ml" },
      },
    ],
    attributes: [
      { key: "skin_type", label: { ar: "نوع البشرة" }, values: ["حساسة", "جافة", "مختلطة"], verified: true, source: "merchant" },
      { key: "concern", label: { ar: "الاحتياج" }, values: ["تنظيف لطيف", "الجفاف"], verified: true, source: "merchant" },
      { key: "fragrance", label: { ar: "العطر" }, values: ["خالٍ من العطر"], verified: true, source: "document" },
    ],
    exclusions: [],
    priority: 1,
    provenance: { platform: "mock-salla", externalId: "salla_prod_102", externalUpdatedAt: now.toISOString(), sourceVersion: "v2" },
  },
  {
    id: "prod_barrier_moisturizer",
    storeId: demoStore.id,
    externalId: "salla_prod_103",
    slug: "barrier-ceramide-moisturizer",
    status: "active",
    name: { ar: "مرطب الحاجز بالسيراميد", en: "Ceramide Barrier Moisturizer" },
    description: {
      ar: "مرطب بقوام متوسط يحتوي على سيراميد موثّق ضمن قائمة المكونات. مناسب لروتين البشرة الجافة والحساسة وفق بيانات المتجر.",
      en: "A medium-weight moisturizer with verified ceramide in the ingredient sheet.",
    },
    category: "moisturizers",
    imageUrl: "/demo/products/moisturizer.svg",
    productUrl: "/dashboard/products/prod_barrier_moisturizer",
    price: { amount: 14_900, currency: "SAR" },
    stock: 18,
    available: true,
    variants: [
      {
        id: "variant_moisturizer_50",
        externalId: "salla_variant_103_50",
        sku: "MADA-MOI-50",
        name: { ar: "50 مل", en: "50 ml" },
        price: { amount: 14_900, currency: "SAR" },
        stock: 18,
        available: true,
        options: { size: "50ml" },
      },
    ],
    attributes: [
      { key: "skin_type", label: { ar: "نوع البشرة" }, values: ["جافة", "حساسة"], verified: true, source: "merchant" },
      { key: "concern", label: { ar: "الاحتياج" }, values: ["الجفاف", "دعم الحاجز"], verified: true, source: "merchant" },
      { key: "ingredient", label: { ar: "مكوّن موثّق" }, values: ["سيراميد"], verified: true, source: "document" },
      { key: "texture", label: { ar: "القوام" }, values: ["متوسط"], verified: true, source: "merchant" },
    ],
    exclusions: [],
    priority: 3,
    provenance: { platform: "mock-salla", externalId: "salla_prod_103", externalUpdatedAt: now.toISOString(), sourceVersion: "v3" },
  },
];

export const demoConversations: DemoConversation[] = [
  {
    id: "conv_201",
    storeId: demoStore.id,
    visitorId: "visitor_201",
    language: "ar",
    intent: "اختيار منتج",
    need: "روتين للبشرة الدهنية",
    objection: "غير متأكد من طريقة الاستخدام",
    sentiment: "positive",
    messages: [
      { id: "msg_201_1", role: "customer", text: "بشرتي دهنية وأبي شيء خفيف للمسام", createdAt: "2026-07-11T08:35:00.000Z" },
      { id: "msg_201_2", role: "assistant", text: "رشحت لك سيروم التوازن؛ فهو مناسب للبشرة الدهنية ويستهدف العناية بالمسام.", createdAt: "2026-07-11T08:35:03.000Z" },
    ],
    recommendedProductIds: ["prod_serum_balance"],
    outcome: "purchased",
    createdAt: "2026-07-11T08:35:00.000Z",
  },
  {
    id: "conv_202",
    storeId: demoStore.id,
    visitorId: "visitor_202",
    language: "ar",
    intent: "مقارنة منتجات",
    need: "تنظيف وترطيب للبشرة الحساسة",
    objection: "هل المنتج خالٍ من العطر؟",
    sentiment: "neutral",
    messages: [
      { id: "msg_202_1", role: "customer", text: "وش الأنسب للبشرة الحساسة؟ وهل فيه عطر؟", createdAt: "2026-07-10T17:12:00.000Z" },
      { id: "msg_202_2", role: "assistant", text: "الغسول خالٍ من العطر وفق ورقة المنتج الرسمية. أما المرطب فلا نملك معلومة مؤكدة بخصوص العطر.", createdAt: "2026-07-10T17:12:04.000Z" },
    ],
    recommendedProductIds: ["prod_gentle_cleanser", "prod_barrier_moisturizer"],
    outcome: "added_to_cart",
    createdAt: "2026-07-10T17:12:00.000Z",
  },
  {
    id: "conv_203",
    storeId: demoStore.id,
    visitorId: "visitor_203",
    language: "ar",
    intent: "معلومات منتج",
    need: "توضيح المكونات",
    objection: "المكونات غير مكتملة",
    sentiment: "negative",
    messages: [
      { id: "msg_203_1", role: "customer", text: "هل المرطب مناسب للحامل؟", createdAt: "2026-07-09T20:41:00.000Z" },
      { id: "msg_203_2", role: "assistant", text: "حرصًا على سلامتك، لا أستطيع تأكيد ملاءمة المنتج أثناء الحمل. الأفضل مراجعة المختص مع قائمة المكونات الكاملة.", createdAt: "2026-07-09T20:41:04.000Z" },
    ],
    recommendedProductIds: [],
    outcome: "no_conversion",
    createdAt: "2026-07-09T20:41:00.000Z",
  },
];

export const demoEvents: DemoEvent[] = [
  { id: "evt_1", idempotencyKey: "seed-1", storeId: demoStore.id, sessionId: "visitor_201", conversationId: "conv_201", productId: "prod_serum_balance", type: "recommendation_shown", consentState: "analytics", source: "widget", createdAt: "2026-07-11T08:35:03.000Z" },
  { id: "evt_2", idempotencyKey: "seed-2", storeId: demoStore.id, sessionId: "visitor_201", conversationId: "conv_201", productId: "prod_serum_balance", type: "product_clicked", consentState: "analytics", source: "widget", createdAt: "2026-07-11T08:35:20.000Z" },
  { id: "evt_3", idempotencyKey: "seed-3", storeId: demoStore.id, sessionId: "visitor_201", conversationId: "conv_201", productId: "prod_serum_balance", type: "product_added_to_cart", consentState: "analytics", source: "widget", createdAt: "2026-07-11T08:36:01.000Z" },
  { id: "evt_4", idempotencyKey: "seed-4", storeId: demoStore.id, sessionId: "visitor_201", conversationId: "conv_201", productId: "prod_serum_balance", type: "purchase_completed", consentState: "analytics", source: "platform", createdAt: "2026-07-11T08:44:00.000Z" },
  { id: "evt_5", idempotencyKey: "seed-5", storeId: demoStore.id, sessionId: "visitor_202", conversationId: "conv_202", productId: "prod_gentle_cleanser", type: "recommendation_shown", consentState: "analytics", source: "widget", createdAt: "2026-07-10T17:12:04.000Z" },
  { id: "evt_6", idempotencyKey: "seed-6", storeId: demoStore.id, sessionId: "visitor_202", conversationId: "conv_202", productId: "prod_gentle_cleanser", type: "product_added_to_cart", consentState: "analytics", source: "widget", createdAt: "2026-07-10T17:13:10.000Z" },
];

export interface DemoDailyMetric {
  date: string;
  conversations: number;
  shoppers: number;
  recommendations: number;
  clicks: number;
  addToCarts: number;
  checkouts: number;
  purchases: number;
  directRevenueMinor: number;
  influencedRevenueMinor: number;
  visibilityReadiness: number;
  observedQueries: number;
  mentionedQueries: number;
}

export const demoDailyMetrics: DemoDailyMetric[] = [
  { date: "2026-07-05", conversations: 151, shoppers: 112, recommendations: 116, clicks: 39, addToCarts: 20, checkouts: 10, purchases: 7, directRevenueMinor: 199_000, influencedRevenueMinor: 302_000, visibilityReadiness: 68, observedQueries: 25, mentionedQueries: 5 },
  { date: "2026-07-06", conversations: 164, shoppers: 121, recommendations: 129, clicks: 44, addToCarts: 24, checkouts: 11, purchases: 8, directRevenueMinor: 221_000, influencedRevenueMinor: 341_000, visibilityReadiness: 69, observedQueries: 25, mentionedQueries: 5 },
  { date: "2026-07-07", conversations: 169, shoppers: 126, recommendations: 132, clicks: 48, addToCarts: 24, checkouts: 12, purchases: 8, directRevenueMinor: 238_000, influencedRevenueMinor: 355_000, visibilityReadiness: 71, observedQueries: 25, mentionedQueries: 6 },
  { date: "2026-07-08", conversations: 181, shoppers: 132, recommendations: 140, clicks: 52, addToCarts: 26, checkouts: 13, purchases: 9, directRevenueMinor: 256_000, influencedRevenueMinor: 384_000, visibilityReadiness: 72, observedQueries: 25, mentionedQueries: 6 },
  { date: "2026-07-09", conversations: 187, shoppers: 138, recommendations: 145, clicks: 55, addToCarts: 29, checkouts: 14, purchases: 10, directRevenueMinor: 281_000, influencedRevenueMinor: 418_000, visibilityReadiness: 73, observedQueries: 25, mentionedQueries: 7 },
  { date: "2026-07-10", conversations: 194, shoppers: 143, recommendations: 151, clicks: 59, addToCarts: 31, checkouts: 15, purchases: 10, directRevenueMinor: 309_000, influencedRevenueMinor: 447_000, visibilityReadiness: 75, observedQueries: 25, mentionedQueries: 7 },
  { date: "2026-07-11", conversations: 202, shoppers: 148, recommendations: 159, clicks: 64, addToCarts: 33, checkouts: 17, purchases: 12, directRevenueMinor: 338_000, influencedRevenueMinor: 491_000, visibilityReadiness: 76, observedQueries: 25, mentionedQueries: 8 },
];

export const demoOpportunities: DemoOpportunity[] = [
  {
    id: "opp_size_faq",
    priority: "high",
    title: "وضّح طريقة استخدام سيروم التوازن",
    evidence: "34 سؤالًا عن ترتيب الاستخدام خلال آخر 30 يومًا، ومعدل الإضافة للسلة أقل من متوسط فئة السيروم بـ 18٪.",
    whyItMatters: "الإجابة موجودة في دليل داخلي لكنها غير ظاهرة في صفحة المنتج.",
    confidence: "high",
    proposedAction: "إنشاء قسم استخدام مختصر وسؤال شائع موثّق.",
    affectedProductIds: ["prod_serum_balance"],
    status: "open",
  },
  {
    id: "opp_pregnancy_info",
    priority: "high",
    title: "أكمل معلومات السلامة لمنتجات العناية",
    evidence: "19 سؤالًا متعلقًا بالحمل أو الحساسية لم يتمكن المستشار من حسمها بسبب نقص مصدر موثّق.",
    whyItMatters: "النقص يمنع الإجابة الآمنة ويزيد التحويل للبشر.",
    confidence: "high",
    proposedAction: "رفع أوراق مكونات كاملة ومراجعتها قبل إتاحة أي إجابة.",
    affectedProductIds: ["prod_barrier_moisturizer", "prod_serum_balance"],
    status: "open",
  },
  {
    id: "opp_ai_answerability",
    priority: "medium",
    title: "حوّل أسئلة البشرة الحساسة إلى محتوى قابل للإجابة",
    evidence: "51 محادثة استخدمت عبارة «بشرة حساسة»، بينما صفحتان فقط تذكران هذا الاحتياج بشكل منظم.",
    whyItMatters: "الوضوح يخدم توصيات المستشار وقابلية فهم الصفحات لمحركات البحث.",
    confidence: "medium",
    proposedAction: "إنشاء دليل موثّق وروابط داخلية للمنتجات المناسبة.",
    affectedProductIds: ["prod_gentle_cleanser", "prod_barrier_moisturizer"],
    status: "open",
  },
];
