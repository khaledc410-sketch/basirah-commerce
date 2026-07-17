# بصيرة — Product Requirements

**Document status:** Working product contract

**Last updated:** 2026-07-16

**Product stage:** Checker-first implementation; production infrastructure and Salla marketplace approval remain gated

## 1. Product in one sentence

بصيرة is an Arabic-first ecommerce visibility platform that scans a store, explains with evidence why search and answer systems may struggle to understand it, and turns the report into approved content and sales actions.

Arabic positioning:

> افحص متجرك مجانًا، اكتشف أسباب ضعف ظهوره، واحصل على خطة عربية موثقة لإصلاحه.

English positioning:

> Arabic ecommerce visibility checks, evidence-backed reports, and implementation tools.

## 2. Release-state contract

These labels must appear in product copy, demos, tickets, and QA:

| Label | Meaning |
| --- | --- |
| **Working demo slice** | Runs only against the seeded demo store and in-memory demo repository. Data and AI-visibility observations are explicitly labeled demo data. |
| **Foundation implemented** | A typed boundary or deterministic domain service exists, but persistence, UI, external credentials, or production hardening may still be missing. |
| **Production target** | Intended behavior; it is not available until its acceptance tests pass against a platform development store. |
| **Unavailable / pending verification** | A provider capability or contract has not been confirmed through official documentation and a sandbox fixture. The UI must not imply otherwise. |

### Current working vertical slice

At the repository baseline, the executable demo slice is deliberately narrow:

1. Arabic marketing, sign-in/setup, sync/onboarding, overview, advisor, widget test, conversations, customer intelligence, products, opportunities, and readiness/visibility screens present a coherent seeded journey.
2. A seeded Arabic beauty store supplies normalized products, conversations, events, metrics, and opportunities.
3. The demo advisor API classifies safety and intent, extracts a small set of constraints, filters seeded catalog records, ranks eligible products, produces grounded recommendation text, and records the conversation/recommendation events in process memory.
4. The widget can submit idempotent click/cart/checkout events to the demo event API; conversation list/detail screens read the same process-local repository.
5. The merchant advisor streams tool status and evidence-based answers from seeded tools, with an optional model gateway used only to orchestrate those demo tools.
6. Merchant overview/product metrics and deterministic product/store AI-readiness views are derived from clearly labeled demo records; manual visibility observations are also seeded examples.
7. A 75-table Drizzle PostgreSQL schema and initial migration exist as a foundation, but no applied production migration, durable repository, session/RLS path, or queue worker is proven.
8. Salla and Zid connector interfaces exist. Salla supports an Easy Mode install URL, Custom Mode token helpers, signature verification, and an authorization-event parser. Zid supports authorization-code/token/refresh foundations and preserves its separate manager and authorization tokens. Live persistence/resource mapping remains disabled until platform fixtures pass. Demo connection routes validate platform-specific one-time cookie state and deliberately refuse production completion while persistence is missing.
9. The merchant can configure a demo advisor identity, logo, accessible colors, opening message, suggested prompts, corner treatment, and launcher side; an AI helper offers three grounded editable openings and never applies one without selection.
10. A demo Content Studio applies Google-aligned SEO, reader clarity, and trust principles, prepares an evidence-linked Arabic article draft and original visual, and exposes a shareable client-review preview. AEO and GEO remain third-party descriptive terms rather than separate Google ranking systems. The preview is `noindex`/`nofollow`; real discovery requires approved publication on the merchant-controlled domain.

This is **not** proof of live OAuth, catalog sync, attribution, storefront installation, database isolation, or AI-platform mention monitoring.

### Production vertical slice target

Visitor enters one public domain without an account → a separate worker completes a bounded, SSRF-safe scan → the visitor sees readiness, coverage, three evidence-backed problems, and explicit unavailable data → the visitor saves or orders the Arabic report → an authenticated merchant claims it → the first finding becomes an evidence-grounded content draft → a rescan records whether the deterministic condition improved.

Salla is the first production commerce connector and unlocks the sales agent only after its authorization, catalog, storefront, safety, and order-reconciliation contracts pass. Zid remains independently disabled and never blocks the checker or report launch.

## 3. Problem and product loop

Arabic ecommerce teams spend on acquisition but cannot see whether crawlers and answer systems can discover, identify, trust, and quote their public store content. Existing dashboards often collapse readiness, indexing, and sampled mentions into a misleading score, while audits stop at diagnosis instead of execution.

The core loop is:

`Free scan → free full report → repair plan → paid content or implementation action → rescan → measured improvement`

## 3.1 Initial customer and offer ladder

The first ideal customer is a Saudi or Gulf Arabic ecommerce store—initially beauty, perfume, or fashion—with at least 20 products, active marketing spend, and no internal SEO/GEO specialist. The scanner remains technically category-agnostic.

| Offer | Launch scope | Price before VAT |
| --- | --- | ---: |
| Free visibility check | One domain, 5–10 representative pages where available, readiness/coverage, top three issues | Free |
| Free full report | All findings and evidence in a private 30-day link, seven-page executive PDF, 30/60/90 plan | Free |
| Growth | Monthly report/history, content writer, up to eight grounded drafts | SAR 699/month |
| Commerce | Growth plus Salla sales agent, catalog sync, 2,000 customer messages, conversion analytics | SAR 1,499/month |

The report is the lead magnet, not the paid product. Visitors see the score and top three issues without an email, then enter one email field to unlock the full report and PDF; marketing consent remains separate and optional. Paid value begins with implementation, recurring content production, rescanning, and verified commerce capabilities. Paid activation remains separate from the report path, and the product must never render a simulated successful checkout.

## 4. Goals and non-goals

### Goals

- Increase confident product discovery and recommendation-to-cart conversion.
- Turn conversations into structured needs, objections, and content gaps.
- Give merchants evidence-based answers with a date range, sources, freshness, and confidence.
- Improve technical readiness, entity clarity, and answerability without promising rankings.
- Support Arabic RTL and English LTR from the first production release.
- Make every store mutation previewable, approval-gated, versioned, and auditable.

### Non-goals for the MVP

- A general-purpose chatbot or an autonomous store operator.
- Medical diagnosis, treatment, dosage, allergy guarantees, or unsupported compatibility advice.
- Guaranteed visibility in ChatGPT, Google AI Overviews, Gemini, Perplexity, or Copilot.
- Automated monitoring that violates provider terms or fabricates unavailable results.
- Price, discount, legal-policy, warranty, or high-risk claim changes.
- Claiming cross-platform parity when only one connector's contracts have passed.
- Multi-touch marketing attribution presented as causal truth.

## 5. Product principles

1. **Filter before language generation.** Catalog/database logic selects eligible products; a model may only explain the selected records.
2. **Facts have provenance.** Prices, stock, attributes, policies, metrics, and visibility observations retain source and freshness.
3. **Absence is a valid answer.** If a fact or provider result is unavailable, show that state and offer handoff or manual verification.
4. **Observation is not inference.** Merchant answers label measured facts, interpretations, confidence, and limitations separately.
5. **High-risk changes require approval.** Controlled autopilot is limited to explicitly allow-listed, reversible actions after production validation.
6. **Demo data never enters the production path.** `APP_MODE=demo` is visible and production startup fails closed when required infrastructure is absent.

## 6. Users and permissions

| Role | Primary need | Default access |
| --- | --- | --- |
| Owner | Connect stores, govern data, billing, publish actions | All stores and settings; transfer/delete workspace |
| Admin | Operate the workspace and team | All product features except ownership transfer and destructive billing actions |
| Analyst | Understand performance and visibility | Read analytics; save insights; draft opportunities; no publish |
| Support | Review and hand off customer conversations | Conversations, customer-safe context, handoff queue; restricted customer export |
| Viewer | Monitor results | Read-only dashboards and reports |
| Agency operator | Manage several client stores | Explicit membership per store; no implicit cross-store access |
| Shopper | Get product and policy assistance | Storefront widget only; consent-aware anonymous session |

Permissions are server-enforced per store. Hiding a control is not authorization.

## 7. Primary journeys

### A. Connect and activate a Salla store

1. Owner creates a workspace and chooses Salla.
2. The app starts the marketplace-approved authorization mode with signed, expiring state.
3. Callback/event handling binds the external store to the intended workspace and encrypts tokens.
4. A fast sync imports store profile, active catalog, variants, availability, categories, and public policies.
5. The UI shows actual steps, counts, errors, retries, and last success; historical orders continue in the background.
6. Owner completes the six onboarding steps and reviews missing knowledge.
7. Owner tests at least five representative questions, reviews safety failures, then publishes the widget.

### B. Shopper receives a grounded recommendation

1. Widget loads asynchronously and shows category-specific suggested prompts.
2. Safety and intent classifiers run before response generation.
3. The advisor extracts constraints and asks only information-changing follow-ups.
4. Retrieval applies hard filters: tenant, active, available, category, budget, required variant, exclusions, and safety.
5. A ranker orders eligible candidates; merchant priority is only a tie-breaker after suitability.
6. The response cites store facts and displays current product cards.
7. Click, add-to-cart, checkout, and purchase events are deduplicated and reconciled where supported.
8. Missing facts or sensitive requests trigger a safe response or human handoff.

### C. Merchant explains a conversion problem

1. Merchant asks a question and chooses a date range.
2. The intelligence agent calls permission-scoped analytics tools.
3. The answer states observed funnel counts and comparison baselines.
4. Conversation evidence is aggregated with minimum cohort/privacy thresholds.
5. Any interpretation is labeled as an inference with confidence and alternative explanations.
6. Merchant opens supporting conversations/products, saves the insight, or creates an opportunity.

### D. Approve a store improvement

1. An opportunity links repeated demand to affected pages and verified evidence.
2. The content service creates a draft without adding unsupported claims.
3. Merchant reviews source facts, diff, language versions, risk class, and preview.
4. An authorized role approves; a separate job performs an optimistic-concurrency check and mutation.
5. The platform stores before/after versions, actor, result, and rollback material.

### E. Measure AI visibility honestly

1. Merchant audits readiness or adds a localized monitored query.
2. The system records provider capability, country/language support, method, timestamp, and raw evidence reference.
3. Readiness remains separate from observed mention/citation results.
4. Unsupported automated checks use a manual verification workflow and are never backfilled with synthetic results.
5. Opportunities connect real customer demand to answerable, source-backed content.

## 8. Information architecture and complete screen inventory

Routes are conceptual until implemented. Every unavailable route must be hidden or clearly disabled with an explanation.

### Public and access

| # | Screen | Purpose |
| --- | --- | --- |
| 1 | Arabic landing page | Positioning, product UI, integrations, pricing, FAQ, connect/demo CTAs |
| 2 | English landing page | Localized equivalent with LTR content |
| 3 | Live demo | Isolated, unmistakably labeled seeded experience |
| 4 | Pricing | Configurable plan/usage comparison; no unverified marketplace billing claim |
| 5 | Sign in | Secure merchant authentication |
| 6 | Accept invitation | Validate invite and join an explicit store workspace |
| 7 | Create workspace | Workspace name, locale, region, terms acknowledgement |
| 8 | Access/error pages | Unauthorized, expired invite, unavailable integration, generic not found |

### Connection, sync, and onboarding

| # | Screen | Purpose |
| --- | --- | --- |
| 9 | Choose commerce platform | Salla active when verified; Zid status shown accurately |
| 10 | Connection handoff | Authorization preparation and redirect; never request platform password |
| 11 | Authorization result | Success, denied, state mismatch, expired, or retry |
| 12 | Sync progress | Fast/background steps, real counts, errors, retry, freshness |
| 13 | Goal | Onboarding step 1 |
| 14 | Store category | Onboarding step 2 and category safety policy |
| 15 | Brand voice | Onboarding step 3 and prohibited-language instructions |
| 16 | Recommendation rules | Onboarding step 4 and hard/soft constraints |
| 17 | Knowledge review | Onboarding step 5, gaps and source provenance |
| 18 | Knowledge upload | Secure PDF/DOCX/CSV upload and processing status |
| 19 | Widget configuration | Onboarding step 6, locale, targeting, behavior, branding |
| 20 | Widget test lab | Required five-question test, trace summary, safety outcome |
| 21 | Publish review | Checklist, consent settings, risk acknowledgement, publish result |

### Merchant workspace

| # | Screen | Core content |
| --- | --- | --- |
| 22 | Overview | Five primary metrics, weekly changes, blockers, next actions, funnels/trends |
| 23 | AI Advisor | Suggested questions, date range, tool status, evidence, charts/tables, actions |
| 24 | Saved insights | Saved answers, owner, status, linked opportunities |
| 25 | Conversations | Filters for outcome, handoff, sentiment, unanswered, intent, product, language |
| 26 | Conversation detail | Messages, recommendations, events, signals, attribution, order, handoff |
| 27 | Customer Intelligence | Needs, objections, questions, comparisons, demand, gaps, conversion by intent |
| 28 | Products | Stock, price, funnel, content/readiness, common question/objection |
| 29 | Product detail | Performance, conversations, facts, audits, visibility, drafts, versions |
| 30 | Opportunities | Ranked evidence cards with preview, assign, dismiss, schedule, approve |
| 31 | Opportunity detail | Evidence cohort, impact method, confidence, proposed action and history |
| 32 | AI Visibility overview | Readiness plus separately displayed observed evidence summary |
| 33 | Visibility queries | Query CRUD, locale, provider capability, cadence, latest observation |
| 34 | Visibility platforms | Capability/degraded/unavailable status by provider |
| 35 | Visibility competitors | Mention share and gaps with sample-size/context disclosure |
| 36 | Visibility citations | Source URLs, captured time, provider/query, merchant/competitor entity match |
| 37 | Store readiness | Weighted components, checks, evidence, pages, recommended fixes |
| 38 | Visibility reports | Date-bounded export with methodology/version and unavailable-data notes |
| 39 | Store Optimizer | Page/product audit queue and content gaps |
| 40 | Draft detail | Source facts, bilingual draft, diff, risk, preview, validation |
| 41 | Approval queue | Role-gated review, conflict state, publish/rollback result |
| 42 | Automations | Allow-listed rules, dry runs, limits, pause switch, audit history |
| 43 | Handoff inbox | Priority, summary, consented contact, assignment, resolution |

### Settings and operations

| # | Screen | Purpose |
| --- | --- | --- |
| 44 | General settings | Store identity, locale, timezone, attribution windows |
| 45 | Widget settings | Draft/test/live status and storefront targeting |
| 46 | Knowledge sources | Documents, policies, freshness, processing and deletion |
| 47 | Recommendation & safety | Category policies, exclusions, escalation, restricted topics |
| 48 | Team and roles | Membership, invitations, least-privilege roles |
| 49 | Connections | Platform status, scopes, sync health, reconnect/disconnect |
| 50 | Data and privacy | Consent behavior, retention, export/delete requests, redaction |
| 51 | Notifications | Email and in-app handoff/health preferences |
| 52 | Usage | Meter definitions, current usage, limits, overage behavior |
| 53 | Billing | Plan and subscription state only after platform billing is verified |
| 54 | Audit log | Security, approvals, store actions, exports, role changes |
| 55 | Developer diagnostics | Correlation IDs, sync/webhook health; no raw secrets or unnecessary PII |

### Storefront surfaces

| # | Surface | Purpose |
| --- | --- | --- |
| 56 | Collapsed launcher | Branded, accessible, non-blocking entry point |
| 57 | Prompt home | Category prompts, AI disclosure, privacy/handoff links |
| 58 | Conversation | Messages, evidence wording, typing/loading/retry states |
| 59 | Recommendation results | Product cards, compare, view, supported add-to-cart |
| 60 | Product comparison | Verified attributes; explicit “not available” cells |
| 61 | Human handoff | Consent, contact, reason, expected channel—not a fake live-chat promise |
| 62 | Widget error/offline | Preserve storefront usability and offer merchant contact path |

## 9. Key screen composition

- **Overview:** one freshness/date-range strip; five decision metrics; three narrative cards (“what changed,” “what blocks purchase,” “what next”); then funnel, visibility evidence, products, and opportunities.
- **Conversation detail:** transcript takes the main column; evidence rail shows product facts, events, outcome, safety interventions, and attribution state.
- **Readiness:** component score and limitation first; checks grouped by page; every failed check has evidence and a fix. Observed mentions never appear as part of this score.
- **Draft approval:** source facts → before/after diff → risk/validator result → preview → approval. Publish is unavailable on conflicts or missing verified facts.
- **Widget mobile:** bottom sheet within safe areas, never covers checkout controls, with persistent close/minimize and a short product-card carousel.

## 10. Metrics and definitions

### Activation

Connected store; fast sync complete; onboarding complete; five tests passed; widget live; first conversation; first recommendation click; first reconciled add-to-cart; first direct assisted order.

### Engagement and value

Weekly active merchants, merchant questions answered with evidence, conversations/store, unanswered rate, recommendation click rate, recommendation-to-cart rate, direct assisted revenue, opportunity/draft approval rate, content completeness, readiness improvement, and separately observed mention/citation coverage.

### Attribution

- **Direct AI-assisted order:** shopper interacted with the advisor and clicked or added a recommended product, then purchased the same product within the configured direct window.
- **Influenced order:** shopper interacted with the advisor and later purchased within a broader declared window.

Both values are reported separately with window, reconciliation state, and identity basis. Neither is described as incremental lift without an experiment.

## 11. MVP acceptance criteria

### Working demo slice

- Demo mode is visually labeled and cannot be mistaken for a connected store.
- Arabic product requests return only active, available, in-stock seeded products satisfying extracted hard constraints.
- Restricted pregnancy/medical/allergy/child/medication prompts return a conservative response and no product recommendation.
- Displayed price, stock, name, and reason originate from the same normalized product record.
- Repeated event submissions with one idempotency key do not double count in the demo repository.
- Product readiness displays its scoring version, evidence, recommendations, and “not actual AI visibility” limitation.
- No Salla/Zid control claims a completed live action.

### Salla production slice

- Authorization is validated against a Salla development store using the marketplace-approved mode; state/replay tests pass.
- Tokens are encrypted, never sent to the browser/logs, refreshed safely under a distributed lock, and revoked/disconnected correctly.
- Fast catalog sync persists normalized records with provenance, pagination fixtures, retry, and reconciliation tests.
- Webhook signatures are checked over the raw body; duplicate delivery is safe; processing is queued; failed jobs reach an observable dead-letter path.
- Tenant isolation and role tests prove cross-store reads/writes fail.
- The storefront script passes performance, RTL/mobile, consent, and checkout-obstruction checks on a development theme.
- A production conversation persists messages/signals/events and can be opened by an authorized merchant.
- Order attribution is reconciliation-backed, windowed, and labeled direct versus influenced.
- Store drafts require approval, source-version checks, audit logs, and rollback material.
- No production-readiness sign-off occurs until the checklist in `INTEGRATIONS.md`, security review, privacy/legal review, and end-to-end tests are complete.

### AI visibility

- Readiness and observed visibility are separate datasets and visual groups.
- Every check records query, locale, country, provider, method, timestamp, capability state, result, evidence reference, and confidence.
- Unsupported or terms-restricted providers show unavailable/manual workflow; no synthetic observation is stored as live.
- Entity matching and citation extraction retain review state and false-positive correction.
- Every report exposes sample size, missing checks, methodology version, and limitations.

## 12. Open product decisions

1. Final production attribution windows by category and platform cookie/identity constraints.
2. Minimum conversation cohort size for evidence display and merchant exports.
3. Provider-by-provider lawful monitoring method and query cadence.
4. Salla marketplace billing/plan constraints and the Zid equivalent.
5. Exact low-risk mutation allow-list after platform sandbox and legal review.
6. Handoff service-level language for dashboard/email-only MVP.
