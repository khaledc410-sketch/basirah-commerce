# بصيرة — MVP Delivery Backlog

**Status snapshot:** 2026-07-13

**Strategy:** Ship the Arabic ecommerce visibility checker and report first; content execution follows, then the Salla sales agent. Zid remains a separately gated later track.

## 1. Status vocabulary

| Status | Meaning |
| --- | --- |
| `DEMO DONE` | Works against explicitly labeled seeded/in-memory demo data only |
| `FOUNDATION` | Interface/domain helper exists; production dependencies or tests remain |
| `NOT STARTED` | No production implementation evidence |
| `BLOCKED` | Must wait for official platform/credential/legal/sandbox decision |
| `PRODUCTION DONE` | Reserved for an item that meets its Definition of Done and release gates; none are claimed in this snapshot |

## 2. Current slice versus target

### Current implemented foundation

- Checker-first Arabic/English public experience, recoverable progress route, free preview, pricing, methodology, and isolated `/demo` journey — `FOUNDATION`; final browser/E2E evidence is required before a public claim.
- Bounded deterministic crawler with URL normalization, DNS/IP revalidation, private-network blocking, robots/sitemap/HTML/JSON-LD analysis, evidence, coverage/confidence, and weighted scoring — `FOUNDATION`.
- Anonymous acquisition/report/order/consent/provider-capability schema with seven-day expiry, opaque hashed tokens, forced RLS, and service-role-only grants — `FOUNDATION`; live Supabase application and adversarial JWT verification remain required.
- Separate visibility worker/queue contract, correlation/redaction baseline, and production fail-closed modes — `FOUNDATION`; staging Redis restart/retry/DLQ evidence remains required.
- Arabic evidence-linked report narrative with deterministic fallback, print/PDF presentation, share/revoke model, and 30/60/90 workspace plan — `FOUNDATION`.
- Normalized commerce product/store/order/customer/cart types and connector contract — `FOUNDATION`.
- Seeded `mock-salla` beauty store, products, conversations, metrics, opportunities, and in-memory events — `DEMO DONE`.
- Arabic intent/constraint extraction, deterministic catalog eligibility/ranking, conservative safety classifier — `DEMO DONE` for narrow fixture set.
- Deterministic seeded product/store readiness examples — `DEMO DONE`; these remain isolated from the new public crawler and are not observed AI visibility.
- Arabic marketing, setup/onboarding, dashboard, advisor, widget, conversations, intelligence, products, opportunities, and visibility/readiness routes — `DEMO DONE` for presentation and seeded navigation; not authenticated or persistent.
- Demo advisor/event/conversation APIs and streamed merchant tool answers — `DEMO DONE` against process-local seeded data.
- Broad Drizzle PostgreSQL schema definitions and generated migrations — `FOUNDATION`; controlled staging application and live RLS/rollback rehearsal are not yet proven.
- Salla OAuth token exchange/refresh and webhook HMAC helper — `FOUNDATION`; marketplace mode/secret/fixtures unverified.
- Salla resource mappings — `BLOCKED` intentionally.
- Zid OAuth and dual-token model — `FOUNDATION`; resource/header/webhook mappings remain `BLOCKED` pending fixtures.
- Product, architecture, design, security, visibility, integration, and backlog documentation — baseline documented; update continuously.

### First production target

The first real loop does not depend on a commerce connector:

`public domain → durable safe scan → free evidence preview → saved lead or pending-payment report order → Arabic report → account claim → first documented fix → rescan`

Only after this loop passes its reliability, security, accessibility, and conversion gates does the content writer become the next product surface. The sales agent then launches on one verified Salla development/pilot store. Automated consumer-surface monitoring, content publication, self-service payment, and Zid remain outside the first target.

## 3. Delivery principles

1. Close the smallest real loop before adding another dashboard module.
2. A visible feature requires real data, defined action, system states, permissions, and tests.
3. External capabilities remain disabled until official docs plus a redacted development-store fixture and contract test exist.
4. Readiness scoring ships before observed provider monitoring, and the UI keeps them separate.
5. Read-only Salla scopes first; product write access comes only with the approval/publish milestone.
6. “AI-assisted revenue” waits for server/platform order reconciliation.
7. Each milestone includes Arabic/English, accessibility, privacy, observability, and failure behavior—not a cleanup phase later.

## 4. Ordered backlog

Sequence is dependency order, not an estimate. `P0` blocks the first production merchant; `P1` completes product value; `P2` is later expansion.

### Phase 0 — Product and engineering foundation

| Order | ID | Priority | Item | Status | Exit evidence |
| ---: | --- | --- | --- | --- | --- |
| 1 | FND-01 | P0 | Product/architecture/design/security/integration/visibility contracts | FOUNDATION | Docs reviewed against implemented behavior; open decisions owned; changelog current |
| 2 | FND-02 | P0 | Environment modes and feature flags | FOUNDATION | `demo`, `staging`, `production`; production fails closed; mock connector cannot be selected implicitly |
| 3 | FND-03 | P0 | Authentication/session implementation | NOT STARTED | Secure cookies, invitation/recovery, session revocation, rate limits, integration tests |
| 4 | FND-04 | P0 | Workspace/store tenancy and RBAC | NOT STARTED | Owner/Admin/Analyst/Support/Viewer server policies and cross-tenant negative tests |
| 5 | FND-05 | P0 | PostgreSQL Drizzle schema/migrations | FOUNDATION | Schema definitions exist; add generated/reviewed migrations, runtime repositories, constraints/RLS tests, and migration/rollback rehearsal |
| 6 | FND-06 | P0 | Encrypted platform-token repository | NOT STARTED | KMS/envelope design, version/rotation, redaction, no plaintext browser/job/log exposure |
| 7 | FND-07 | P0 | Redis/BullMQ worker and outbox | NOT STARTED | Persistent worker, retry/dead-letter, restart/idempotency tests, operator job status |
| 8 | FND-08 | P0 | Observability and audit baseline | NOT STARTED | Correlation IDs, redacted logs, sync/webhook/AI metrics, append-only privileged-action audit |
| 9 | FND-09 | P0 | Arabic/English routing and design-system primitives | FOUNDATION | Arabic RTL and token/UI foundation exists; add runtime LTR route/switch plus focus/contrast/touch/system-state tests |
| 10 | FND-10 | P0 | Isolated demo mode | FOUNDATION | Persistent demo label; reset; no production fallback; demo metrics cannot enter live tables |

**Phase 0 exit:** An owner can securely create a tenant workspace in a real database; a worker/outbox can run a durable test job; another tenant cannot access it; demo mode is isolated.

### Checker Phase 1 — Free Arabic visibility check

| ID | Priority | Item | Status | Exit evidence |
| --- | --- | --- | --- | --- |
| CHK-01 | P0 | Public checker API and durable worker | FOUNDATION | P95 under 120s for ten-page cohort; retries/idempotency/DLQ/restart tested |
| CHK-02 | P0 | Crawl security and resource limits | FOUNDATION | SSRF/redirect/DNS rebinding/robots/type/size/time/concurrency tests pass |
| CHK-03 | P0 | Deterministic evidence and scoring | FOUNDATION | Seven components; unknown lowers coverage/confidence, never becomes zero |
| CHK-04 | P0 | Public RTL/LTR experience | FOUNDATION | Domain → progress → preview works on mobile, keyboard, screen reader, zoom, reduced motion |
| CHK-05 | P0 | Methodology and analytics | FOUNDATION | Readiness, Google discovery, and observed visibility never blend; no page/PII payload in analytics |

### Checker Phase 2 — Paid report and report-first workspace

| ID | Priority | Item | Status | Exit evidence |
| --- | --- | --- | --- | --- |
| RPT-01 | P0 | Full report snapshots, evidence, and share access | FOUNDATION | Opaque hashed revocable token; method/date/limits; URL-level finding contract |
| RPT-02 | P0 | Arabic PDF and print | FOUNDATION | RTL fonts/layout render across representative long reports and page breaks |
| RPT-03 | P0 | Save, claim, and manual order | FOUNDATION | Separate optional marketing consent; `pending_payment`; server-only fulfillment; no fake checkout |
| RPT-04 | P0 | Simplified workspace | FOUNDATION | Overview, reports, plan, content, sales agent, settings; report is the home surface |
| RPT-05 | P1 | 30/60/90 opportunity plan | FOUNDATION | Findings ranked by impact/confidence/effort with owner and completion state |

### Checker Phase 3 — Evidence-grounded content writer

`finding → verified facts → brief → Arabic draft → claim check → diff/review → approval → copy/HTML/Markdown export → rescan`

Direct publication stays disabled until Salla conflict, read-back, and rollback contracts pass.

### Checker Phase 4 — Salla sales agent

Requires a verified Salla connection and persistent catalog. Selection remains deterministic before generation; signed widget sessions, origin allow-list, handoff, conversation persistence, and platform order matching are release gates. Repeated customer questions feed new report/content opportunities.

### Checker Phase 5 — Monitoring, billing, and publishing

Start with query/competitor management and manual observations. Automate only officially documented/licensed methods; add self-service payment/Salla billing after approval; enable publishing only after conflict/read-back/rollback tests.

### Commerce expansion track — Verified Salla connection and catalog

| Order | ID | Priority | Item | Status | Exit evidence |
| ---: | --- | --- | --- | --- | --- |
| 11 | SAL-01 | P0 | Salla Partner/demo-store contract review | FOUNDATION | Close every relevant Phase 1 row in `INTEGRATIONS.md`; record app type/mode/scopes/docs date |
| 12 | SAL-02 | P0 | Marketplace-approved authorization | FOUNDATION/MISMATCH | Easy Mode install/update/uninstall fixtures; state/store binding; encrypted token lifecycle; Custom Mode limited to documented dev use |
| 13 | SAL-03 | P0 | Salla server transport | NOT STARTED | Bearer client, timeouts, rate-limit classification, refresh lock, redacted request metrics |
| 14 | SAL-04 | P0 | Store and product mapping | BLOCKED | Redacted official fixtures; Zod schemas; normalized store/product/variant/image/price/stock/provenance contract tests |
| 15 | SAL-05 | P0 | Category and public knowledge mapping | BLOCKED | Category fixture; verified policy/page ingestion path; missing/unsupported states |
| 16 | SAL-06 | P0 | Fast sync job | NOT STARTED | Durable progress/checkpoint/counts/errors/retry; upsert and deletion/hidden handling; no onboarding block on history |
| 17 | SAL-07 | P0 | Webhook ingress and catalog events | FOUNDATION | Raw signature fixture with confirmed secret; idempotent inbox; product/inventory event consumer; reconciliation |
| 18 | SAL-08 | P0 | Connection/sync UI | NOT STARTED | Accurate steps/counts/freshness/retry/error/denied/disconnected states; no fake timing |

**Phase 1 exit:** A new Salla development store installs through the approved flow, persists a normalized active catalog, receives/repairs a product change, and shows accurate sync state after restart.

### Commerce expansion track — Onboarding and customer advisor

| Order | ID | Priority | Item | Status | Exit evidence |
| ---: | --- | --- | --- | --- | --- |
| 19 | ADV-01 | P0 | Six-step onboarding persistence | NOT STARTED | Goals/category/voice/rules/knowledge/widget settings; autosave; RBAC; RTL/LTR; missing knowledge flags |
| 20 | ADV-02 | P0 | Category policy registry | FOUNDATION | Beauty MVP policy plus extensible perfume/fashion/electronics/home/food/supplement/general policies; reviewed test matrix |
| 21 | ADV-03 | P0 | Production product retrieval | FOUNDATION | SQL store/status/stock/budget/category/variant/exclusion/safety filters; vector retrieval cannot bypass filters |
| 22 | ADV-04 | P0 | Intent/constraint/follow-up orchestration | FOUNDATION | Structured bilingual outputs; stop rule; unknown/missing fact behavior; prompt-injection evaluation |
| 23 | ADV-05 | P0 | Grounded explanation and post-validator | NOT STARTED | Only candidate/evidence IDs; numeric/fact consistency; unsupported claim rejection; latency/cost logs |
| 24 | ADV-06 | P0 | Widget bootstrap and UI | DEMO DONE / production NOT STARTED | Seed-backed widget exists; add signed bootstrap, async storefront loader, privacy/handoff, performance and safe-area tests |
| 25 | ADV-07 | P0 | Widget install through Salla App Snippet | BLOCKED | Salla approval/dev-theme fixture, origin/CSP/event contract, uninstall behavior, checkout obstruction tests |
| 26 | ADV-08 | P0 | Test lab and publish gate | NOT STARTED | Five required merchant tests; trace summary; safety results; draft/test/live state; no fake publish |
| 27 | ADV-09 | P1 | Product cards/compare/view | FOUNDATION in domain data | Current price/stock/provenance, missing-value cells, view link; add-to-cart hidden unless separately verified |
| 28 | ADV-10 | P1 | Human handoff dashboard/email | NOT STARTED | Consent/contact minimization, summary/reason/priority/assignment, delivery failure/retry; no live-chat SLA claim |

**Phase 2 exit:** On a Salla development storefront, a merchant-tested widget answers Arabic and English questions using persisted synchronized products, rejects unsafe/unsupported requests, and stores a durable conversation without harming storefront performance.

### Commerce expansion track — Events, intelligence, and attribution

| Order | ID | Priority | Item | Status | Exit evidence |
| ---: | --- | --- | --- | --- | --- |
| 29 | INT-01 | P0 | Canonical event API/outbox | DEMO DONE / production FOUNDATION | Demo event API is idempotent in process; add versioned durable envelope/outbox, consent, batch limits, server receipt time, analytics consumer |
| 30 | INT-02 | P0 | Conversations/messages/signals persistence | DEMO DONE / production NOT STARTED | Demo list/detail exists; add database persistence, retention/redaction, structured signals, evidence links and cohort privacy |
| 31 | INT-03 | P0 | Salla order/history sync | BLOCKED | Current order pagination/item fixtures, checkpoints/reconciliation, masked/null customer handling |
| 32 | INT-04 | P0 | Attribution engine | NOT STARTED | Direct/influenced rule versions, identity basis, windows, provisional/reconciled states, fixture tests |
| 33 | INT-05 | P0 | Overview and product funnel | FOUNDATION in demo | Real date-bound aggregates, timezone/freshness/source, zero/partial/stale handling, reconciled revenue only |
| 34 | INT-06 | P1 | Customer Intelligence aggregates | FOUNDATION in demo | Needs/questions/objections/comparisons/gaps, sample size and cohort privacy, trend tests |
| 35 | INT-07 | P1 | Merchant tool gateway | DEMO DONE / production NOT STARTED | Typed seeded tools stream today; add tenant/RBAC/freshness/query version, real aggregates, cost/timeout and audit |
| 36 | INT-08 | P1 | Merchant AI answer UI | DEMO DONE / production FOUNDATION | Seeded UI labels evidence/inference; add authenticated history, selected date range, accessible live tables/charts, save/create actions |
| 37 | INT-09 | P1 | Opportunity engine | FOUNDATION in demo | Versioned ranking, evidence/impact method/confidence, assign/dismiss history, no unsupported causal estimate |

**Phase 3 exit:** A reconciled Salla test order can be traced to valid recommendation evidence under a versioned window; an authorized merchant sees the same counts in conversation, product, overview, and tool answer.

### Commerce expansion track — Content drafts and approval

| Order | ID | Priority | Item | Status | Exit evidence |
| ---: | --- | --- | --- | --- | --- |
| 38 | VIS-01 | P0 | Production page/product readiness crawler/auditor | FOUNDATION demo only | Deterministic checks, evidence URLs/time, coverage, methodology version, robots/safe fetch, no mention claim |
| 39 | VIS-02 | P0 | Readiness UI and product detail | FOUNDATION demo only | Seven components, affected pages, evidence/fix/priority/direction/limitation, demo/live separation |
| 40 | CNT-01 | P1 | Content-gap opportunity linkage | FOUNDATION demo only | Cohort-protected conversation evidence + page gap + verified source facts |
| 41 | CNT-02 | P1 | Bilingual draft generation | NOT STARTED | Brand voice, source snapshot, structured output, claim/safety validation, missing facts preserved |
| 42 | CNT-03 | P1 | Approval/version workflow | NOT STARTED | Diff/preview, role/step-up, state machine, audit, expected source version, conflict UI |
| 43 | CNT-04 | P1 | Export/copy-only delivery | NOT STARTED | Safe interim value before connector writes; clear manual-publish state and version |

**Phase 4 exit:** A repeated customer question generates an evidence-linked, source-grounded bilingual draft that a merchant can approve/export, while readiness remains explicitly separate from observed AI mentions.

### Later track — Observed AI visibility tracking

| Order | ID | Priority | Item | Status | Exit evidence |
| ---: | --- | --- | --- | --- | --- |
| 44 | MON-01 | P1 | Query/competitor management | NOT STARTED | Query text/intent/language/country/city/provider/context/cadence and reviewed entity aliases |
| 45 | MON-02 | P1 | Provider capability registry/manual checks | NOT STARTED | Terms/legal/security record, supported/manual/unavailable/degraded states, immutable evidence |
| 46 | MON-03 | P1 | Mention/entity/citation extraction | NOT STARTED | Bilingual labeled evaluation, reviewed ambiguity/false positives, URL normalization, confidence |
| 47 | MON-04 | P1 | Observed dashboards/reports | DEMO counters only | Numerators/denominators, failed/unavailable coverage, method/context/version, no readiness blending |
| 48 | MON-05 | P2 | First compliant automated provider | BLOCKED | Official/licensed access, provider equivalence proof, repeat sampling, storage/display approval, shutdown switch |
| 49 | MON-06 | P2 | Competitor/topic/citation trends | NOT STARTED | Fixed comparable cohort, multi-mention rule, volatility and re-baseline disclosures |

**Phase 5 exit:** At least manual checks produce reviewable, methodology-complete observations; automated checks remain absent unless one provider passes all gates in `AI_VISIBILITY.md`.

### Later track — Controlled publishing, billing, and Zid

| Order | ID | Priority | Item | Status | Exit evidence |
| ---: | --- | --- | --- | --- | --- |
| 50 | ACT-01 | P2 | Salla read/write scope and field verification | BLOCKED | Official scope/fields, development-store update/conflict/read-back/rollback fixtures, marketplace approval |
| 51 | ACT-02 | P2 | Approval-gated product content publication | BLOCKED | Allow-list, idempotency, expected version, before/after audit, validator, rollback, emergency stop |
| 52 | ACT-03 | P2 | Low-risk controlled autopilot | BLOCKED | Off by default, dry runs, limits, periodic authorization; no prohibited fields/claims |
| 53 | BIL-01 | P1 | Usage/entitlement ledger | NOT STARTED | Immutable meters, plan limits, overage behavior, reconciliation, no client-trusted usage |
| 54 | BIL-02 | P2 | Salla marketplace billing | BLOCKED | Exact plan/add-on approval, event/API fixtures, cancellation/renewal/entitlement tests |
| 55 | ZID-01 | P2 | Zid OAuth and endpoint-family auth | BLOCKED | Official/sandbox fixtures for OAuth, Authorization/X-Manager/Access-Token/Store-Id/Role |
| 56 | ZID-02 | P2 | Zid catalog/order/webhooks/App Scripts | BLOCKED | Contract suite, Basic Auth confirmation, reconciliation, development-store widget approval |
| 57 | ZID-03 | P2 | Zid billing/review and parity launch | BLOCKED | Plan events/entitlements, public/private/embedded review, security/privacy/e2e parity gates |

## 5. Definition of Done

An item is not `PRODUCTION DONE` until applicable criteria pass:

- Requirement, non-goals, permissions, system states, and metric semantics are documented.
- Strict types/Zod validation; no unreviewed platform payload reaches the domain.
- Persistent data uses migrations, tenant keys, constraints, idempotency, and provenance.
- Arabic RTL and English LTR work at phone/tablet/desktop, keyboard, screen reader, zoom, and reduced motion.
- Loading, empty, partial, stale, permission, failure, retry, conflict, and success states are implemented.
- Unit tests plus relevant DB/queue/connector/e2e tests; negative/security cases included.
- Logs/metrics/audit are redacted and sufficient to diagnose failure.
- Privacy data map, retention/deletion behavior, and consent effect are defined.
- Feature flag, rollback/disable path, support/runbook, and changelog exist.
- External features have dated official link, redacted development-store fixture, contract test, and reviewer.
- UI/product copy accurately says demo, live, inference, unavailable, and pending verification.

## 6. Quality and test workstreams

These run inside each phase:

### Domain/unit

- recommendation hard filters, tie-breaks, unavailable/stale stock;
- Arabic/English intent and constraint fixtures;
- medical/pregnancy/allergy/child/supplement/electronics safety;
- readiness scoring/coverage/versioning;
- attribution windows/deduplication;
- entity/citation matching and ambiguity.

### Integration

- tenant isolation/RLS/RBAC;
- migrations and rollback;
- OAuth state/token refresh/revocation;
- connector pagination/mapping/rate limits;
- webhook raw verification/idempotency/order/retry/DLQ;
- queue restart/outbox dispatch;
- approval/conflict/audit/rollback;
- privacy export/delete across objects, embeddings, caches, logs policy.

### End to end

- Salla install → sync → onboarding → test → widget → recommendation → event → conversation → order attribution;
- Arabic RTL and English LTR;
- slow/failed platform, model, queue, and stale catalog;
- membership downgrade and cross-store navigation;
- no data/demo/provider-unavailable states;
- widget product/cart pages, mobile safe areas, checkout control clearance.

## 7. Risk register

Probability/impact are initial qualitative assessments and must be revisited at each phase gate.

| ID | Risk | Probability | Impact | Mitigation / release guard | Trigger / contingency |
| --- | --- | --- | --- | --- | --- |
| R-01 | Salla marketplace Easy Mode differs from current Custom Mode foundation | High | Critical | Implement from Easy Mode fixture; keep Custom Mode dev-only; close integration checklist | If event/token binding cannot be proven, connection remains demo-only |
| R-02 | Wrong Salla webhook secret or payload hashing assumptions | Medium | Critical | Confirm secret source; preserve raw bytes; signed fixture and replay/duplicate tests | Reject all unverifiable events; rely on reconciliation while disabled |
| R-03 | Salla/Zid schemas, pagination, scopes, or limits change | High | High | Strict external schemas, mapping versions, fixtures, changelog review, adaptive limiter | Circuit-break affected resource; retain stale label; update adapter/fixture |
| R-04 | Cross-tenant data exposure through query, queue, vector, cache, or export | Medium | Critical | Store key everywhere, composite keys/RLS, scoped repositories, adversarial isolation suite | Disable affected feature; incident response, revoke access, assess notification |
| R-05 | AI invents product/health/metric/visibility claims | High | Critical | Hard-filter retrieval, evidence IDs, structured output, post-validator, safety suite, handoff | Block response/action; show unavailable; expand evaluation before re-enable |
| R-06 | Stock/price becomes stale between recommendation and cart | High | High | Freshness threshold, webhook + reconciliation, current product link, read-before-cart where supported | Disable add-to-cart/recommendation for stale item; trigger sync |
| R-07 | Storefront widget slows or obstructs checkout | Medium | High | Tiny async loader, lazy UI, budgets, safe areas/page targeting, development-theme tests | Kill switch/uninstall snippet; fall back to no widget |
| R-08 | Browser events overstate conversion/revenue | High | High | Client events untrusted; platform order/item reconciliation; direct/influenced separation | Hide revenue or label provisional until reconciliation recovers |
| R-09 | Visibility monitoring violates provider terms or implies unsupported equivalence | High | Critical | Capability/terms/legal gate, manual/unavailable state, no anti-bot bypass, shutdown switch | Stop provider checks; preserve last dated evidence with limitation |
| R-10 | Readiness score is misunderstood as actual AI ranking | High | High | Separate UI/datasets, component/coverage display, limitation on every score/report | Rename/hide overall score; require education before launch |
| R-11 | Arabic intent/entity extraction performs worse than demos | High | High | Saudi/GCC dialect evaluation, human-labeled sets, confidence/handoff, category rollout | Limit supported categories/intents; route ambiguous cases to follow-up/handoff |
| R-12 | Health/safety question causes harmful advice | Medium | Critical | Pre/post safety, verified facts only, conservative referrals, restricted category policy, audits | Disable affected category recommendations; review incident/evaluation |
| R-13 | Sensitive conversation/customer data is over-collected or retained | Medium | Critical | Data minimization, consent, redaction, cohort thresholds, retention/export/delete, legal review | Pause collection/export; run deletion; privacy incident process |
| R-14 | Queue backlog or webhook loss makes dashboard stale | Medium | High | Outbox, checkpoints, per-store limits, alerts, DLQ, reconciliation | Display stale/degraded; prioritize fast sync; replay safely |
| R-15 | Refresh-token race disconnects stores | Medium | High | Distributed lock, atomic rotating token version, single retry, alerts | Pause sync, reconnect flow, preserve data/read-only access |
| R-16 | Merchant-approved draft overwrites a newer platform edit | Medium | High | Expected source version, conflict UI, read-before/write/read-after, rollback material | Stop publish; require rebase/reapproval |
| R-17 | Platform add-to-cart is unsupported across themes/variants | High | Medium | Ship “View product” until official contract and theme matrix pass | Keep capability false; never simulate success in live mode |
| R-18 | Billing events grant/revoke wrong entitlements | Medium | High | Idempotent event ledger, item/plan identity, API reconciliation, grace state | Freeze entitlements safely, manual review, disable charge mutation |
| R-19 | Model/provider cost or latency harms margins/UX | High | Medium | Task-specific models, caching, budgets, token limits, async jobs, cost metrics | Degrade to deterministic paths, queue analyses, plan limits |
| R-20 | Platform breadth hides connector-specific failures | High | High | Shared normalized core plus independent Salla/Zid capability flags, fixtures, owners, and release gates | Disable only the affected platform/capability; do not claim cross-platform parity |

## 8. Release gates

### Demo release

- Persistent demo label, deterministic reset, no external action claim.
- Recommendation/safety/readiness tests pass for the seed.
- No production environment can fall back to seed/in-memory storage.

### Private Salla pilot

- Phase 0–3 exits pass on approved development/pilot stores.
- Salla app/scope/widget review status permits the intended use.
- Security/privacy/legal and storefront performance review complete.
- Support, incident, kill-switch, reconciliation, data deletion, and rollback runbooks rehearsed.
- Pilot categories are explicitly limited and safety evaluation passes.

### Public marketplace

- Pilot reliability, attribution correctness, tenant isolation, and safety thresholds meet written SLOs.
- Billing/entitlement behavior and marketplace listing/review are approved.
- No P0/P1 security/privacy finding lacks a signed risk decision.
- Product copy and sales material do not claim compliance, guaranteed uplift, or guaranteed AI visibility.

## 9. Decisions that block specific work, not the whole program

| Decision | Blocks | Work that can continue |
| --- | --- | --- |
| Salla production credentials/app mode | Live install and fixtures | DB, tenant, queue, mock contract, UI/system states, evaluation |
| Salla widget/add-to-cart approval | Live widget publication/add-to-cart | External widget shell, view-product flow, performance/a11y tests |
| Provider monitoring method/legal approval | Automated checks | Readiness audit, manual workflow, query data model, reports with unavailable state |
| Billing plan choice | Marketplace charges | Usage ledger, entitlements abstraction, pricing configuration |
| Final retention/legal basis | Production data retention | Configurable policy engine, deletion/export plumbing, data inventory |
