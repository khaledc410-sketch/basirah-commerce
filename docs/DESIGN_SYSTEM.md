# بصيرة — Design System

**Direction:** Premium, calm, evidence-first Arabic commerce SaaS

**Status:** Token foundation exists; full component and accessibility verification is a production target

**Last updated:** 2026-07-11

## 1. Experience principles

1. **Arabic is the reference layout, not a translation afterthought.** RTL is tested first; English LTR uses the same semantic structure.
2. **A decision before a dashboard.** Each screen answers one business question and offers one clear next action.
3. **Evidence is visible.** Date range, freshness, source, confidence, and demo/unavailable state are part of the UI, not footnotes.
4. **Calm density.** Neutral surfaces, restrained violet brand color, clear grouping, and progressive disclosure replace decorative charts and gradients.
5. **Safe by design.** Risk, approval, missing facts, and provider limitations are understandable to non-technical merchants.
6. **Storefront performance is a feature.** The widget loads asynchronously, reserves space, and degrades without blocking the shop.

Avoid glass-heavy surfaces, excessive gradients, glowing AI motifs, emoji as structural icons, chart walls, tiny gray text, and controls that appear active but do nothing.

## 2. Release-state language

Product status is a design token as important as color.

| State | Arabic label | Treatment |
| --- | --- | --- |
| Demo | بيانات تجريبية | Persistent top banner plus local badge on metrics; never color alone |
| Live/verified data | بيانات المتجر | Source and last sync adjacent to the affected module |
| Pending external verification | بانتظار التحقق | Neutral outlined badge and explanation; action disabled |
| Unavailable | غير متاح حاليًا | Explicit reason and alternative/manual workflow |
| Inference | استنتاج مرجّح | Confidence plus evidence link, visually distinct from “ملاحظة” |
| Observation | ملاحظة من البيانات | Date range, sample size, and source |
| Stale | قد تكون البيانات قديمة | Warning with last success and retry/sync action |

Never use “connected,” “published,” “monitored,” or “verified” merely because a demo control was clicked.

## 3. Foundations

### 3.1 Color roles

The existing light token foundation in `src/app/globals.css` is the baseline. Components consume semantic names; they do not embed raw colors.

| Token | Current light value | Use |
| --- | --- | --- |
| `background` | `oklch(0.982 0.006 255)` | App canvas |
| `foreground` | `oklch(0.205 0.026 265)` | Primary text |
| `card` / `popover` | `oklch(1 0 0)` | Raised neutral surfaces |
| `primary` | `oklch(0.455 0.2 277)` | One primary action, active navigation, key emphasis |
| `primary-foreground` | `oklch(0.985 0.006 255)` | Text/icon on primary |
| `secondary` | `oklch(0.958 0.018 274)` | Low-emphasis controls |
| `muted` | `oklch(0.962 0.008 255)` | Quiet regions and skeletons |
| `muted-foreground` | `oklch(0.455 0.035 260)` | Supporting text after contrast verification |
| `border` / `input` | `oklch(0.875 0.018 255)` | Structure and control boundaries |
| `success` | `oklch(0.49 0.13 160)` | Completed, healthy, positive direction |
| `warning` | `oklch(0.56 0.14 75)` | Stale, partial, needs review |
| `destructive` | `oklch(0.5 0.19 25)` | Destructive/unsafe/error only |
| `ring` | `oklch(0.52 0.18 277)` | Visible focus |

Rules:

- Normal text/background combinations target WCAG AA contrast (4.5:1; 3:1 for large text and non-text UI boundaries). Verify values with tooling before release.
- Status never relies on red/green or color alone; pair with text and an icon.
- Primary violet is not a decorative wash. One dominant filled CTA per region.
- Chart colors map to stable semantic series and remain distinguishable in grayscale/color-vision testing.
- Dark mode tokens currently exist as a neutral foundation, but dark mode is not “complete” until every semantic/status/chart pair is independently contrast-tested.

### 3.2 Typography

| Role | Family | Size / line height | Weight | Use |
| --- | --- | --- | --- | --- |
| Display | IBM Plex Sans Arabic | 48/60 desktop, 36/48 mobile | 700 | Marketing hero only |
| Page title | IBM Plex Sans Arabic | 32/44 desktop, 28/40 mobile | 700 | One `h1` per screen |
| Section title | IBM Plex Sans Arabic | 24/36 | 600–700 | Major regions |
| Card title | IBM Plex Sans Arabic | 18/30 | 600 | Insight/card headings |
| Body large | IBM Plex Sans Arabic | 18/32 | 400 | Lead and important explanations |
| Body | IBM Plex Sans Arabic | 16/28 | 400 | Default UI copy; minimum mobile input text |
| Label | IBM Plex Sans Arabic | 14/22 | 500–600 | Controls, table headers, metadata |
| Caption | IBM Plex Sans Arabic | 12/20 | 500 | Secondary metadata only; never essential action text |
| Data/technical | Geist Mono fallback stack | 13/22 | 400–500 | IDs and code-like diagnostics, not normal Arabic prose |

- Arabic line height is intentionally generous (1.6–1.75 for prose).
- Do not add negative letter spacing to Arabic.
- Text measure: 35–60 characters on phone; about 60–75 on desktop.
- Use tabular figures for metric cards, prices, axes, and tables. Wrap numeric strings in directional isolation so digits/currency remain legible in RTL.
- Format numbers, dates, currency, compact notation, and pluralization through the active locale. The merchant may choose Arabic or Latin digits independently of layout direction.

### 3.3 Spacing and sizing

Use a 4px base with an 8px dominant rhythm.

| Token | Value | Typical use |
| --- | ---: | --- |
| `space-1` | 4px | Icon/label micro gap |
| `space-2` | 8px | Closely related controls |
| `space-3` | 12px | Compact card content |
| `space-4` | 16px | Default component inset |
| `space-5` | 20px | Dense section inset |
| `space-6` | 24px | Card/page group gap |
| `space-8` | 32px | Section separation |
| `space-10` | 40px | Page title rhythm |
| `space-12` | 48px | Major region separation |
| `space-16` | 64px | Marketing section spacing |

- Touch/click target: minimum 44×44px; target 48px for mobile primary controls.
- Control heights: 40px compact desktop; 44px default; 48–52px mobile/primary.
- Page gutters: 16px phone, 24px tablet, 32px desktop, up to 48px wide desktop.
- Merchant content width: approximately 1440px maximum; reading/draft content approximately 760px.

### 3.4 Radius, border, elevation, and layer

The existing base radius is `0.75rem` (12px).

| Role | Radius | Elevation |
| --- | ---: | --- |
| Small control/badge | 7–8px | None |
| Input/button | 9–10px | None; focus ring is not a shadow |
| Card/panel | 12px | Border-first; subtle shadow only when spatially raised |
| Dialog/sheet | 16–18px | Medium shadow plus 40–60% scrim |
| Widget panel | 18px desktop; 18px top corners mobile sheet | Medium shadow, strong storefront separation |

Layer scale: content `0`, sticky `10`, dropdown `20`, overlay/sheet `40`, modal `100`, toast `200`, skip link/emergency `1000`. New arbitrary z-index values require a design-system change.

### 3.5 Icons and imagery

- Use one Lucide outline family with consistent 1.75–2px stroke.
- Sizes: 16px inline, 20px control, 24px primary navigation, 32px empty-state illustration accent.
- Icon-only controls require an accessible name, tooltip on desktop, and 44px hit area.
- Mirror directional arrows/chevrons for RTL. Do not mirror logos, clocks, media controls, product imagery, charts, or universally non-directional icons.
- Product imagery uses declared aspect ratio and responsive WebP/AVIF where possible to prevent layout shift.

## 4. RTL and localization contract

1. Set `lang` and `dir` at the locale root: Arabic `ar`/`rtl`, English `en`/`ltr`.
2. Use CSS logical properties (`margin-inline`, `padding-inline`, `inset-inline-start`, `border-start-start-radius`) or logical Tailwind utilities.
3. Navigation is on inline-start: right for Arabic, left for English.
4. Back/forward chevrons follow reading direction; chronological charts still flow earlier-to-later along a clearly labeled axis and must not be naively mirrored.
5. Tables align prose to inline-start. Numeric columns use isolated LTR number runs and a consistent numeric edge.
6. Mixed Arabic/English product names, URLs, SKUs, and IDs use `dir="auto"` or isolated spans; never force a whole transcript LTR for one token.
7. Punctuation and sentence templates are localized rather than concatenated from fragments.
8. Form field order follows the reading direction, but semantic sequences (phone country code, date, funnel order) stay understandable and explicitly labeled.
9. Truncation is a last resort. Prefer wrapping; when truncating, offer the full value through expansion or tooltip.
10. Validate at 200% zoom and with long Arabic labels; translation cannot be used as a reason for horizontal scrolling.

## 5. Navigation model

The merchant navigation is grouped to reduce the original eleven-item cognitive load.

### Primary groups

| Group | Destinations |
| --- | --- |
| Home | Overview |
| Sell | AI Advisor, Conversations, Customer Intelligence, Handoffs |
| Catalog | Products, Store Optimizer, Knowledge |
| Grow | Opportunities, AI Visibility, Reports |
| Operate | Automations, Approval queue |
| Admin | Settings, Connections, Team, Data & privacy, Billing, Audit log |

### Desktop (≥1280px)

- 264px sidebar on inline-start with store switcher, grouped navigation, sync/connection status, help, and user menu.
- Sticky 64px page header holds breadcrumb/title, date range/freshness, and at most one primary action.
- Content uses a 12-column grid; metrics never shrink below readable widths.
- Sidebar can collapse to an 80px labeled-on-focus/tooltip rail; collapse preference persists per user.

### Tablet (768–1279px)

- 72–80px navigation rail for top destinations; grouped drawer for the rest.
- Filters move into a reviewable side sheet; active filter count remains visible.
- Two-column cards become one column before content is squeezed.

### Mobile (<768px)

- Compact header: store/context, screen title, overflow/menu. Avoid two stacked sticky bars.
- Bottom navigation has at most five labeled destinations: Overview, Advisor, Conversations, Opportunities, More.
- Tables become prioritized card rows or horizontally scroll only inside a clearly bounded data region with pinned identity column; the page itself never scrolls sideways.
- Persistent CTAs reserve bottom safe-area padding; content is never obscured.
- Browser/system back behavior closes a sheet first, then returns to the previous route with filters retained.

## 6. Layout patterns

### Overview

1. **Context strip:** demo/live, date range, timezone, last data success.
2. **Five metric cards:** conversations, direct assisted revenue, recommendation conversion, top need, readiness. Each includes definition/help.
3. **Three decision cards:** what changed, what blocks purchase, what to do next.
4. **Details:** one conversation funnel, one visibility evidence/readiness region, top products, ranked opportunities.

Do not render a chart when a sentence or three-row table answers the question more clearly.

### Insight card

Required anatomy:

`Observation/inference label → short claim → evidence + sample/date → why it matters → confidence/limitation → one recommended action → details`

Estimated impact is a range with method/assumptions, not a decorative number.

### Merchant AI answer

- User question and active date range remain visible.
- Execution status exposes useful stages only: “analyzing conversations,” “comparing conversion,” “reviewing content.” Never show hidden reasoning.
- Answer begins with the finding, then evidence table/chart, inference and confidence, limitations, and actions.
- Sources are keyboard-accessible and identify type, timestamp, and freshness.
- Draft/action buttons appear only when the required tool and permission exist.

### Draft approval

- Two-column diff desktop; stacked before/after mobile.
- Verified source facts precede generated copy.
- Risk class, validator result, missing facts, and external source version are visible near approval.
- Publish button stays disabled with a plain-language reason if capability, approval, or version checks fail.

### Storefront widget

- Launcher target 48×48px or larger; respect bottom/inline safe areas and merchant-configured checkout exclusions.
- Load a tiny launcher/bootstrap first; lazy-load conversation UI only on intent/open/idle policy.
- Initial state shows 3–5 category prompts, AI disclosure, human handoff, and privacy link—not an empty input.
- Product cards reserve image dimensions and show current source freshness when stock/add-to-cart confidence is degraded.
- Mobile opens as a bottom sheet below browser chrome; desktop uses a 380–420px panel. Preserve close/minimize at all times.
- The widget must fail closed without changing storefront layout or blocking navigation/checkout.

## 7. Core component contracts

### Buttons

- Variants: primary, secondary, quiet/ghost, destructive, link.
- One primary filled action per card/dialog header region.
- Async buttons keep their width, disable duplicate submission, show progress, and announce completion/error.
- Disabled controls include native semantics and a nearby explanation when the missing capability is important.

### Forms

- Visible labels; placeholders are examples, not labels.
- Helper text precedes errors. Validate on blur or submit, not aggressively on every keystroke.
- Error appears next to the field and in a linked summary for multi-error forms; focus moves to the first error.
- Long onboarding/draft forms autosave and warn before discarding unsaved changes.
- Destructive actions are separated and require a confirmation that names the affected store/resource.

### Filters

- Essential filters remain inline; advanced filters use popover/sheet.
- Active filters render as removable chips and survive navigation/back.
- “Clear all” is available when two or more filters are active.
- Date range always includes store timezone and comparison basis.

### Tables

- Sticky, sortable headers use `aria-sort`; row action menus are keyboard accessible.
- First column contains the resource identity and remains visible where horizontal data scrolling is unavoidable.
- Numbers use tabular figures; units appear in header or cell.
- Provide responsive card alternative and CSV export for data-heavy views.
- Empty/loading/error states replace the table body without shifting headers unpredictably.

### Charts

| Question | Preferred visual |
| --- | --- |
| Change over time | Line chart with previous-period comparison |
| Funnel loss | Horizontal funnel or ordered bars with counts/rates |
| Rank comparison | Horizontal bar chart |
| Distribution of ≤5 groups | Bar first; donut only when part-to-whole matters |
| Exact repeated fields | Table |

Every chart includes title framed as a question, units, date range, legend, exact interactive values, text summary, table/export alternative, responsive ticks, and a meaningful empty/error state. Do not use 3D, dual axes without a strong justification, or red/green alone.

## 8. System states

| State | Pattern | Required content/action |
| --- | --- | --- |
| Initial loading <300ms | Keep stable shell | No flashing spinner |
| Loading >300ms | Shape-matched skeleton | Accessible loading label; preserve dimensions |
| Determinate job | Progress + completed/current counts | Current step, processed count, failures, pause/cancel only if real |
| Indeterminate job | Step/status pulse, no fake percentage/time | “Continuing in background,” last update, safe navigation |
| Empty/new | Illustration/icon + explanation | One realistic first action; no sample metric presented as live |
| No result after filters | Explain active filters | Clear/adjust filters |
| Partial/degraded | Warning strip scoped to affected data | What is stale/missing, last success, retry/alternative |
| Error/retryable | Plain-language cause | Retry, correlation ID in details, preserve user input |
| Error/permission | Name required role | Request access/back; never leak resource existence |
| Error/validation | Inline + summary | Specific fix and focused first invalid field |
| Success | Inline confirmation or polite toast | Result and next step; 3–5s toast for noncritical feedback |
| Conflict | Side-by-side versions | Refresh/rebase/review; never overwrite silently |
| Unsafe/restricted | Calm boundary message | What can be answered, safe alternative, handoff/professional referral |
| Provider unavailable | Capability status | Last observation retained with timestamp; manual workflow if valid |
| Offline/widget failure | Small nonblocking fallback | Retry/contact; storefront remains fully usable |

Toasts do not carry critical information alone and do not steal focus. Errors persist until resolved or dismissed.

## 9. Motion

- Micro-interactions: 150–200ms; panels/dialogs: 200–300ms; complex route transitions are generally unnecessary.
- Enter uses ease-out; exit is shorter. Animate opacity/transform, not width/height/position properties that cause layout shifts.
- Motion communicates cause: sheet from its edge, card expansion from its source, publish progress from button to status.
- Input remains interruptible; never block interaction for animation.
- `prefers-reduced-motion` removes nonessential movement and shimmer while preserving state change.

## 10. Accessibility acceptance

- Semantic landmarks, one `h1`, ordered headings, and an early skip link.
- Full keyboard operation and a logical focus order in both directions.
- Visible 2–4px focus treatment; focus is trapped/restored for modal surfaces.
- Controls have accessible name, role, state, error relationship, and 44px minimum target.
- Contrast is measured in light/dark and all interaction/status states.
- Color, position, sound, or motion is never the sole carrier of meaning.
- Images have appropriate alt behavior; decorative imagery is hidden from assistive technology.
- Live updates use restrained `aria-live`; charts provide text summary/table.
- Tested at 200% zoom, keyboard-only, screen reader in Arabic and English, reduced motion, and 320/375px width plus tablet landscape.

## 11. Responsive and visual QA matrix

At minimum, verify:

- 320×568 and 375×812 phone; portrait and landscape where meaningful.
- 768px tablet portrait and 1024px tablet landscape.
- 1280px laptop and 1440px desktop.
- Arabic RTL and English LTR with short/long strings.
- 100%, 200%, and browser text scaling.
- Light and dark tokens independently.
- Slow network, failed API, empty store, large catalog, 50+ conversations, stale sync, disabled integration, and demo mode.
- Widget on product, cart, and checkout-adjacent pages without covering platform controls.

## 12. Design sign-off checklist

- The screen’s decision question and one primary action are obvious within ten seconds.
- Demo/live, date range, freshness, source, inference, and confidence are not ambiguous.
- RTL mirroring has not reversed semantic time/data direction.
- No control is broken, decorative-only, or enabled without a real action.
- Focus, touch targets, contrast, errors, loading, empty, partial, and mobile safe areas pass review.
- UI terminology matches `PRODUCT.md`, visibility separation matches `AI_VISIBILITY.md`, and integration status matches `INTEGRATIONS.md`.
