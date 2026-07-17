# Basirah product-wide UI/UX improvement plan

**Prepared:** 2026-07-16  
**Reviewed surfaces:** Arabic landing page, dashboard shell and overview, AI visibility, detailed report, content/report action flow, widget brand studio, conversations, customer intelligence, opportunities, advisor, onboarding routes, marketing screenshots, and the existing design-system specification.

## Honest assessment

Basirah does not need a new visual identity. The existing direction—off-white canvas, restrained violet, IBM Plex Sans Arabic, calm cards, strong RTL, explicit evidence states—is appropriate and more trustworthy than the dark neon style common in AI products.

The current strengths are:

- premium, credible Arabic-first presentation;
- unusually good status language for demo, unavailable, observed, inferred, and verified data;
- clear typography and comfortable spacing;
- a strong detailed report;
- good widget customization and live preview;
- strong accessibility intent in the component implementation;
- honest separation of readiness from observed visibility.

The main weaknesses are product hierarchy, journey continuity, actionability, and proof—not color or decoration.

## Target merchant experience

Every product surface should support one continuous journey:

```text
Discover → Scan → Understand → Choose a fix → Approve → Publish/install
         → Test the agent → Go live → Measure → Learn → Improve again
```

The merchant should always be able to answer five questions:

1. Is the data live, demo, stale, inferred, or unavailable?
2. What changed?
3. What is blocking a sale or AI understanding?
4. What should I do next?
5. Did the action improve anything?

## 1. Information architecture and navigation

### Current issue

The desktop navigation exposes Overview, Reports, Plan, Content, Sales Agent, and Settings. However, Conversations, Customer Intelligence, Opportunities, Advisor, Visibility, Automations, Products, and Billing also exist as routes. Important commercial workflows are therefore hidden while reporting/content receives several top-level destinations.

On mobile, the first five current navigation items become the bottom navigation. This emphasizes Reports, Plan, Content, and Widget but omits Conversations and Opportunities—the destinations a live merchant would use daily.

The shared dashboard header also renders a demo badge unconditionally. Production pages must never inherit a demo label.

### Target structure

Desktop navigation should use merchant jobs:

| Group | Destinations |
|---|---|
| Overview | Today / Overview |
| Sell | Sales Agent, Conversations, Handoffs, Customer Intelligence |
| Improve | Action Queue, Opportunities, Content |
| Visibility | Readiness, Observed Visibility, Reports |
| Catalog | Products, Knowledge, Sync |
| Settings | Brand, Connections, Team, Billing, Data & Privacy, Audit Log |

Mobile bottom navigation:

1. Overview
2. Agent
3. Conversations
4. Actions
5. More

### Requirements

- The store switcher must be a real interaction or visually read-only; do not show a control icon without a working action.
- Active navigation uses icon, label, weight, and indicator—not color alone.
- Badges represent real pending work, unread handoffs, or approvals—not demo decoration.
- Deep links preserve filters and scroll state.
- Every disabled destination explains the required setup or permission.
- Environment state comes from the actual store/mode and remains consistent across the shell, header, metrics, and exports.

## 2. Dashboard overview: redesign around decisions

### Current strengths

The overview communicates readiness, coverage, confidence, top findings, and plan progress honestly. It avoids claiming that a readiness score is actual visibility.

### Current problems

- It is still primarily a report summary rather than a daily operating screen.
- Readiness dominates even after the sales agent becomes live.
- Several cards compete for attention, and the page header can contain two high-emphasis actions.
- The same overview needs very different content for a newly scanned merchant and a live commerce merchant.

### Target layout

#### Row 1: context and one next action

- Store, mode, date range, timezone, and last successful sync.
- One primary action generated from state: complete setup, review a finding, handle a conversation, approve a change, or investigate a metric.
- Secondary actions go in an overflow menu.

#### Row 2: five commercial metrics

- Conversations
- Grounded recommendation rate
- Recommendation-to-product click rate
- Direct assisted orders/revenue
- Open high-priority actions

Readiness becomes one metric when the agent is live, not the permanent hero.

Every metric needs definition, comparison period, source, freshness, and an empty/partial state.

#### Row 3: three decision cards

1. **What changed?** One meaningful movement with comparison.
2. **What blocks purchase?** The highest-confidence objection or missing fact.
3. **What should I do?** One proposed action and expected evidence—not an unqualified impact promise.

#### Row 4: operational details

- conversation funnel;
- top products/questions;
- visibility/readiness evidence;
- action queue preview.

### Personalization by lifecycle

| Merchant state | Overview emphasis |
|---|---|
| Not connected | Connect Salla and explain permissions |
| Syncing | Progress, processed/failed items, safe background behavior |
| Catalog ready | Run five agent tests and fix missing facts |
| Test mode | Recommendation quality and safety failures |
| Live | Conversations, revenue evidence, handoffs, and actions |
| Stale/degraded | Affected metrics, last success, retry, and what remains reliable |

## 3. AI visibility screen

### Keep

- Readiness and observed visibility remain separate.
- Manual/provider method and dates remain visible.
- Unavailable must never become “did not appear.”

### Improve

- Replace the current two-dashboard feeling with four merchant decisions:
  1. readiness and coverage;
  2. top losing buying questions;
  3. observed evidence, citations, and competitors;
  4. actions.
- Make the prompt/query table the primary evidence region, with filters for model/provider, language, country, category, state, and date.
- Each query row opens a detail drawer containing the exact response evidence, timestamp, source/citation, comparison cohort, limitations, and proposed fix.
- Replace internal disabled copy such as “phase 3” with a capability state: what is unavailable, why, and how the merchant can request or perform a manual check.
- Allow a merchant to save a query cohort and compare only like-for-like cohorts across rescans.
- Add export for evidence and a text summary for charts.

### Avoid

- A blended “AI visibility score.”
- Decorative platform scores derived from site readiness unless the derivation is prominent and useful. Platform lenses should be secondary methodology content, not a headline KPI.
- Red/green-only win/loss states.

## 4. Detailed report

### Current strengths

The report is the strongest product surface: executive summary, coverage/confidence, seven components, evidence, limitations, and a 30/60/90 plan.

### Current problems

- It is long and every section has similar card weight.
- The merchant must scroll before acting.
- Findings only lead to “create a draft”; they do not show the complete action lifecycle.
- Evidence identifiers are useful to the system but not sufficiently human-readable.
- Platform-lens cards risk looking like measured platform performance despite explanatory text.

### Target report experience

- Sticky report header with score, coverage, confidence, date, source state, share/export, and “Review next action.”
- Compact table of contents: Summary, Priorities, Components, Evidence, Methodology.
- “Top 3 decisions” directly after the executive summary.
- Filters for severity, component, owner, status, and confidence.
- Finding card anatomy:
  - issue;
  - merchant consequence;
  - evidence preview;
  - confidence and coverage;
  - proposed fix;
  - owner/status;
  - approve or open workspace.
- Human-readable evidence labels with raw technical details behind disclosure.
- The 30/60/90 plan should be generated from accepted findings and update when actions are completed, not remain a static report-only section.
- Mobile report uses an anchored section menu and stacked evidence/fix blocks; no wide tables.

## 5. Action queue and content workspace

This is the highest-impact product-design addition.

### Unified action object

Every readiness gap, lost query, missing product fact, repeated objection, unsafe answer, or merchant request becomes one action with:

- title and source;
- why it matters;
- evidence and confidence;
- affected products/pages/questions;
- proposed change;
- risk class;
- owner;
- state: Open, Drafting, Review, Approved, Published, Verified, Dismissed;
- version/checksum;
- activity history;
- re-test result.

### Workspace layout

- Desktop: evidence on one side, proposed change/diff on the other.
- Mobile: stacked Evidence → Before → After → Validation → Action.
- Sticky action bar: revise, approve, reject, export/publish.
- Publish is disabled with a plain-language reason when permission, validation, or source freshness is missing.
- Version history and rollback are visible before any bulk or automated action is introduced.
- Activity log answers who changed what, when, from which evidence, and with what result.

This is the part to learn from Vizby and Recomaze while keeping Basirah's stricter evidence model.

## 6. Sales-agent studio and widget

### Current strengths

The brand studio is polished and unusually complete for a demo: identity, welcome copy, prompts, appearance, safety, live preview, validation, and local save state.

### Improve the studio structure

Use five steps instead of one long editor:

1. Brand
2. Opening and suggested questions
3. Selling behavior
4. Safety and handoff
5. Test and publish

The persistent preview should support desktop PDP, mobile PDP, cart, and a neutral storefront view. Preview controls should change the context, not only the panel size.

Add:

- test scenarios with pass/fail and transcript evidence;
- unsupported-fact and unavailable-stock tests;
- proactive-trigger settings with frequency caps and page exclusions;
- handoff hours and WhatsApp destination;
- draft, saved, test, approved, live, degraded, and paused states;
- version history and publish confirmation;
- real install status rather than a generic save state.

### Storefront widget improvements

- Open with three to five category-specific buying questions, not an empty input.
- Show why a product was recommended and which constraints were matched.
- Make price, stock freshness, and product source clear without adding technical clutter.
- Keep View Product as the safe first commercial action; enable Add to Cart only after the Salla contract is verified.
- Human/WhatsApp handoff should preserve the question, constraints, recommended products, and transcript.
- Mobile uses a bottom sheet with safe-area padding and a permanent close/minimize route.
- The widget must fail closed and never cover checkout/navigation controls.

## 7. Conversations, customer intelligence, and opportunities

These pages should feel like one loop rather than three disconnected analytics areas.

### Conversations

- Operational inbox with Needs reply, AI handled, Human handoff, Safety intervention, and Closed states.
- Filters for status, topic, product, outcome, channel, and date.
- Conversation detail keeps transcript, matched constraints, recommendations, sources, cart/order evidence, safety events, and handoff context together.
- AI confidence is not shown as a decorative percentage; display the concrete missing/verified facts that affected the answer.

### Customer intelligence

- Lead with one sentence: what customers want, what prevents purchase, and what changed.
- Needs, objections, and unanswered questions drill into the supporting conversations.
- Sample size, time range, and source always accompany an inference.
- Small datasets show a table/list rather than a decorative chart.

### Opportunities

- Opportunity cards become action-queue entries instead of a separate terminal destination.
- “Review evidence and draft” should open the same evidence/diff workspace used by report findings.
- Dismissal requires a reason and remains reversible.
- Accepted opportunities can become catalog fixes, content, bundles, FAQs, or merchant tasks.

## 8. Onboarding and activation

Use a six-step activation journey:

1. Create workspace
2. Connect Salla
3. Review requested permissions
4. Synchronize catalog
5. Resolve critical missing facts
6. Run five tests and publish

Requirements:

- Progress indicator with back navigation and saved state.
- Explain why each permission is needed before OAuth.
- Sync shows real processed, successful, skipped, and failed counts; no fake completion time.
- Critical missing facts are fixed before visual customization.
- Test checklist covers recommendation, price/stock, missing fact, safety, and handoff.
- Success ends at a live state plus the next measurement milestone—not merely “setup complete.”

## 9. Landing page and public funnel

### Current strengths

The current landing page has an excellent checker-led hero, thoughtful examples, product visuals, honest methodology, and strong Arabic copy.

### Current problem

It is long and explains the readiness engine, sales agent, content studio, process, honesty, pricing, FAQ, and final CTA in one page. A new visitor must understand too much before seeing customer proof.

### Recommended page order

1. Hero: problem, free domain check, and immediate product preview.
2. Proof strip: Salla status, real merchant logos/reviews only when available, method transparency.
3. Public sample result: one real-style finding, evidence, fix, and rescan.
4. Five-step loop: Diagnose, Prove, Fix, Sell, Measure.
5. Vertical interactive demo: perfume first, then beauty and gifts.
6. One case study with baseline, action, elapsed time, and verified outcome.
7. Trust and safety.
8. Pricing and package clarity.
9. FAQ and final checker CTA.

Move deep explanations of the agent, visibility method, and content studio to dedicated pages linked from the main story.

### Landing visual improvements

- Retain the calm violet/off-white identity; do not imitate competitors' dark neon gradients.
- Use fewer nested cards and more full-width narrative sections.
- Keep one dominant CTA per section.
- Replace generic feature illustrations with real product states and annotated evidence.
- Add a sticky mobile checker CTA only after it does not cover content or browser controls.
- Reserve image dimensions, optimize WebP/AVIF, and lazy-load below-fold product scenes.

## 10. Shared design system improvements

The existing `docs/DESIGN_SYSTEM.md` is directionally excellent. Implementation should now enforce it.

### Visual hierarchy

- Reduce “card wall” density: not every text group needs a bordered card.
- Use surface, spacing, and typography before adding another border or color.
- One filled primary action per region.
- Use a consistent elevation scale and one Lucide stroke style.

### Status design

- Central component for Demo, Live, Stale, Unavailable, Inference, Observation, Pending, and Verified.
- Status always includes text/icon and a method/source tooltip or detail.
- Demo state is persistent but not repeated on every individual card when the page context already makes it clear.

### Typography and data

- Maintain 16px body copy and generous Arabic line height.
- Tabular figures and directional isolation for prices, percentages, IDs, and mixed-language names.
- Shorten labels before reducing font size below the system.

### Motion

- 150–300ms transitions using opacity/transform.
- Animation only for cause and effect: save, publish, drawer, status change.
- Support reduced motion and avoid decorative dashboard entrances.

### Accessibility

- Verify all normal text at 4.5:1 and non-text boundaries at 3:1.
- Minimum 44×44px targets.
- Keyboard operation and visible focus across RTL navigation, tabs, menus, charts, dialogs, and widget.
- Arabic screen-reader review, 200% zoom, reduced motion, 320/375px mobile, and tablet landscape.
- Charts require an accessible text summary and table/export alternative.

## 11. Responsive rules

### Mobile

- Bottom navigation limited to five task-based destinations.
- One sticky bar maximum; content reserves safe-area space.
- Tables become prioritized row cards.
- Report sections use an anchor sheet.
- Action reviews stack evidence/before/after and keep the primary action reachable.
- Widget opens as a bottom sheet and never covers platform navigation or checkout.

### Tablet

- Navigation rail plus grouped drawer.
- Preview/editor becomes a resizable split or switches to preview sheet.
- Filters move to a side sheet with an active-count badge.

### Desktop

- 264px grouped sidebar, 64px contextual header, 12-column content grid.
- Sticky preview only where it supports the active editing decision.
- Reading content such as reports remains around 760px per prose column even inside a wide shell.

## 12. Delivery roadmap

### P0 — clarity and navigation, week 1–2

- Fix environment status so demo/live is derived correctly everywhere.
- Replace current navigation with the task-based structure.
- Change mobile tabs to Overview, Agent, Conversations, Actions, More.
- Redesign the overview around lifecycle state and one next action.
- Replace internal phase-number/disabled UI with real capability explanations.
- Define the shared status component and audit contrast, focus, and 44px targets.
- Simplify the landing-page information hierarchy and specify the public sample report/vertical demo.

**Acceptance:** every production screen identifies its real state; all core routes are discoverable; one primary next action exists per screen; mobile navigation supports daily operations.

### P1 — actionability, week 3–6

- Build the unified action queue and action lifecycle.
- Convert report findings and opportunities to the same evidence/diff workspace.
- Add activity history, versioning, approval, rejection, and rollback design.
- Restructure the report with sticky summary, table of contents, filters, and top decisions.
- Redesign onboarding as connection → facts → tests → publish.

**Acceptance:** a merchant can move from evidence to one traceable approved change and see its status without leaving the workflow.

### P2 — sales operations, week 6–10

- Make Conversations, Intelligence, and Opportunities one connected loop.
- Add handoff states and WhatsApp context transfer.
- Reorganize the brand studio into five steps.
- Add PDP/mobile/cart preview modes and scenario-based tests.
- Design proactive triggers, frequency caps, exclusions, pause, and degraded states.

**Acceptance:** a merchant can configure, test, publish, monitor, and safely hand off the agent with clear state at every step.

### P3 — measurement and proof, week 10–16

- Implement query evidence drawer, cohort comparison, and export.
- Add direct/influenced attribution views with definitions.
- Publish the real-store sample report, vertical demos, and first case study.
- Replace demo marketing screenshots with permissioned live product evidence.
- Run responsive, Arabic screen-reader, keyboard, 200% zoom, slow-network, stale-data, and large-data QA.

**Acceptance:** the product can demonstrate a reproducible scan → fix → sell → measure story using live merchant evidence.

## 13. What not to do

- Do not redesign the brand before fixing navigation and state accuracy.
- Do not add more dashboard cards merely because data exists.
- Do not imitate dark neon “AI” visual trends.
- Do not place Conversations, Opportunities, or Handoffs behind hidden routes.
- Do not introduce automation before approval, versioning, and rollback.
- Do not show an impact estimate without method and assumptions.
- Do not make demo numbers visually indistinguishable from merchant data.
- Do not build every omnichannel integration before the Salla widget and WhatsApp handoff work reliably.

## Final design principle

Basirah should feel less like a collection of AI features and more like a trusted merchant operating loop. The interface earns trust when every number has a source, every finding has an action, every change has approval and history, and every commercial claim can be reconciled to real store evidence.
