# بصيرة — Security, Privacy, and AI Safety Plan

**Status:** Design target; not a compliance statement, certification, or legal opinion

**Last updated:** 2026-07-13

## 1. Important limitation

The repository is a demo/foundation and has not completed a production security assessment, penetration test, privacy impact assessment, Saudi PDPL legal review, Salla/Zid marketplace review, or independent compliance audit. “PDPL-ready” may describe planned engineering capabilities only; the product must not claim PDPL compliance without qualified legal review and operating evidence.

Current security-relevant foundations include Supabase SSR authentication, an unapplied Supabase Auth/profile and forced tenant-RLS migration, request-scoped tenant reads, encrypted and record-bound Salla token persistence, signed raw-body webhook intake, durable catalog jobs, browser-mutation origin checks, bounded rate limits, Zod environment parsing, deterministic recommendation filters, and a conservative safety classifier. Live migration and cross-tenant JWT verification, KMS-backed key rotation, secure uploads, retention workflows, independent testing, and incident operations are still launch gates.

## 2. Security objectives

1. A user, shopper, job, model, or connector can access only the intended store and minimum required data.
2. Commerce credentials and personal data remain protected in storage, transit, logs, models, exports, and support tooling.
3. External events and store actions are authenticated, idempotent, authorized, previewed, and auditable.
4. AI output cannot invent catalog/policy/metric/visibility facts or bypass business and safety rules.
5. Failure is visible and safe: stale/unavailable data is disclosed; mutations and high-risk advice fail closed.
6. Privacy choices, retention, export, correction, and deletion can be operated and evidenced.

## 3. Threat model

| Asset | Main threats | Required controls |
| --- | --- | --- |
| Platform OAuth tokens | Theft, browser/log exposure, refresh race, stale access after uninstall | Server-only use, envelope encryption, key rotation, redaction, distributed refresh lock, revocation/uninstall handling |
| Tenant commerce data | IDOR, missing store filter, cross-tenant vector/search association | Membership-derived tenant context, composite tenant keys, RLS defense in depth, negative isolation tests |
| Customer conversations/identity | Excess collection, prompt injection, staff overexposure, export leakage | Minimize/pseudonymize, consent state, redaction, role scopes, retention class, signed exports |
| Webhooks | Forgery, replay, duplicate/out-of-order delivery, payload abuse | Provider-supported verification, raw body, timestamp/replay controls where available, idempotent inbox, schema/size limits |
| Widget/API | Spam, scraping, origin spoofing, session fixation, event fraud | Origin-bound installation, short-lived session, rate/abuse limits, server timestamps, order reconciliation |
| Merchant actions | Unauthorized/unsafe publication, stale overwrite, prompt-driven action | RBAC, approval, allow-list, policy validation, source-version check, idempotency, before/after audit |
| AI/model boundary | Hallucination, data exfiltration, tool abuse, indirect prompt injection | Typed tools, server authorization, evidence-only prompts, output schema/claim validator, content isolation |
| Uploaded files | Malware, decompression bomb, unsafe parser, hidden PII | Quarantine, allow-list, size/page limits, malware scanning, sandboxed extraction, signed private access |
| Visibility checks | Terms violation, credential capture, fabricated/poisoned evidence | Provider capability registry, compliant adapters/manual review, isolated browser sessions, immutable evidence provenance |
| Billing/usage | Entitlement spoof, duplicate metering, wrong-store grant | Platform event verification, idempotency, entitlement reconciliation, immutable usage records |

## 4. Data classification and handling

| Class | Examples | Handling |
| --- | --- | --- |
| Restricted secret | OAuth access/refresh token, client secret, encryption key | Secret manager/KMS; envelope encrypted; never browser/model/analytics/log; tightly audited access |
| Sensitive personal | Customer contact, order linkage, conversation content, IP where retained | Purpose/consent-bound; field-level protection as needed; role-restricted; short retention; export/delete mapping |
| Confidential merchant | Catalog drafts, conversion analytics, unpublished policies, team data | Tenant isolation, encrypted transport/storage, role controls, access audit |
| Public store facts | Published product title/price/policy/page | Still tenant-bound for mutation; provenance/freshness retained |
| Operational metadata | Correlation ID, job status, latency, error code | Minimize; use pseudonymous store/user references; no payload/secrets by default |

Do not store raw payment card data, CVV, platform passwords, medical records, or special-category personal data as a product feature. The widget asks for contact only during explicit handoff with purpose/consent language.

## 5. Identity, sessions, and authorization

### Merchant authentication target

- Use a proven authentication provider/library with server-managed, secure, `HttpOnly`, `SameSite=Lax/Strict` cookies and HTTPS-only production transport.
- Rotate session ID after sign-in/privilege change; short idle and absolute lifetimes; revoke sessions after password/security changes.
- Require verified email and step-up authentication for token disconnect, customer export/delete, role elevation, billing change, and store publication/rollback.
- Protect state-changing browser requests with same-site cookies plus CSRF token/origin checks as appropriate.
- Login, invitation, recovery, and MFA endpoints receive per-IP and per-identity throttles without leaking account existence.

### Roles

`owner`, `admin`, `analyst`, `support`, and `viewer` permissions are centralized as server policies. Tool calls and background commands carry an actor and a signed/serialized authorization decision; a model never chooses its own permission.

High-risk defaults:

- Owner only: workspace deletion/transfer, token disconnect, billing owner actions, full customer export.
- Owner/Admin: invite/remove members, approve and publish allow-listed content.
- Analyst: read aggregate analytics and create drafts/opportunities.
- Support: conversation/handoff access with minimized customer fields.
- Viewer: read-only non-sensitive reports.

### Tenant isolation

- Tenant context is derived from authenticated membership or a validated widget installation, never trusted from an arbitrary body field.
- All tenant-owned tables include `store_id`; repositories require it as the first parameter.
- Composite foreign keys and uniqueness include `store_id` where practical.
- PostgreSQL RLS is enabled as defense in depth with separate migration/worker/application roles. A privileged service role is not used for normal web queries.
- Cache keys, queue job IDs, object paths, vector metadata, exports, and logs are tenant-prefixed.
- Automated tests attempt cross-store reads, updates, joins, search/vector retrieval, exports, actions, and job replay.

#### Committed database enforcement

`drizzle/0003_auth_tenant_rls.sql` links `public.users.id` to the `auth.users` primary key, creates the Auth-to-profile synchronization trigger, disables local password/session authority, and enables plus forces RLS on every current public table. Store policies derive accessible store IDs from active `store_members` rows in a non-exposed `private` helper schema. Roles are grouped into viewer, support, analyst, and admin read surfaces; OAuth state, binding-claim, outbox, and raw webhook inbox tables remain unavailable to end users. Sensitive token, contact, hash, and raw-payload columns are excluded with table/column privileges in addition to RLS. Migration `0008` explicitly revokes browser-role access and forces RLS on the service-only binding-claim table.

The migration has static completeness tests but has not been applied to a live database in this repository session. Apply it first to an empty or controlled staging project, run cross-tenant tests with real Supabase JWTs, and inspect database advisors before production. It intentionally aborts if a `public.users` row has no matching `auth.users` row.

RLS does not protect a connection using `postgres`, `service_role`, or another `BYPASSRLS` role. Normal merchant request paths must use the request-scoped authenticated Supabase client (or a dedicated non-bypass application role with verified request claims). Privileged direct database credentials are restricted to trusted workers and every such query still carries an explicit `store_id`.

## 6. OAuth and platform credentials

The authoritative provider checklist is `INTEGRATIONS.md`. No flow or scope moves to production based only on recalled documentation.

### Authorization request

- Merchant is redirected to the platform; the app never accepts a Salla/Zid username or password.
- Create at least 256 bits of random state; store a one-time hash with intended workspace/store, redirect target allow-list, issuer/platform, and ≤10-minute expiry.
- Validate issuer/platform, exact redirect, state, one-time use, and expected actor before binding tokens.
- Use only the authorization mode and PKCE behavior documented/supported for that provider/app type; do not invent parameters.

### Token lifecycle

- Encrypt each token with a per-record data key wrapped by KMS/managed key; associate ciphertext with platform, connection ID, and key version.
- Keep plaintext only in process memory for the outbound request lifetime.
- Refresh under a distributed lock with optimistic token-version update; rotating refresh tokens replace the old token atomically.
- Redact known tokens and authorization headers from logs, traces, errors, job payloads, support screens, and model prompts.
- Revoke/disconnect where the provider supports it, delete credentials, increment the credential generation, cancel active jobs, reject stale page commits, stop widget access, and preserve a minimal sanitized audit record.
- Alert on refresh loops, token reuse/conflict, unexpected scope change, and access after uninstall.

Scopes are least-privilege and reviewed at each release. Read/write product access is not requested until an approved mutation feature is ready.

### Salla embedded-to-account binding

- Salla may supply its short-lived token on the initial iframe URL. The bootstrap reads it through the Embedded SDK and immediately removes the query value with `history.replaceState`; application code never propagates it into another URL, cookie, local/session storage, React state, analytics event, or application log. The bearer is then kept only in the bootstrap function's lexical memory and sent with browser credentials omitted to a same-origin backend endpoint for official introspection. Because the initial HTTP request necessarily reaches the edge before hydration can strip the query, production CDN, load-balancer, hosting, and error-monitoring access logs must redact the query string for `/salla/embedded`; proving that redaction is a launch gate.
- A verified embedded merchant may create a random, ten-minute binding claim. PostgreSQL stores only its SHA-256 hash, merchant/user identifiers, expiry, and consumption state; uninstall invalidates outstanding claims.
- The top-level continuation carries the claim in a URL fragment, removes that fragment with `history.replaceState` before the first network request, and exchanges it through a same-origin JSON `POST` for a `__Host-` prefixed, host-only, `HttpOnly`, `Secure`, `SameSite=Lax` cookie. The cookie is cleared after successful or invalid binding.
- The final endpoint requires a fresh Basirah session and owner/admin membership. It rejects a merchant already owned by another workspace, refuses to replace a different active Salla connector, loads current pending credentials server-side, verifies `/store/info`, and verifies `/oauth2/user/info` so the authorizing Salla user matches the embedded user. Under a per-merchant transaction lock, it atomically binds the connection and consumes both the one-time claim and pending authorization before initial sync scheduling.
- Claim secrets, embedded tokens, and binding cookies are bearer credentials. They are never propagated through sign-in `next` parameters. Expired, replayed, malformed, uninstalled, merchant-mismatched, and cross-workspace cases fail closed and are covered by focused tests plus required real-browser development-store verification.

Because the binding cookie uses the `__Host-` prefix, it remains `Secure` during local development. Test on a localhost secure context supported by current browsers or local HTTPS; never remove `Secure`, add `Domain`, or broaden the cookie path as a workaround.

## 7. Webhook security

1. Enforce HTTPS, method/content type, conservative body size, and short request timeout.
2. Read raw bytes once. Verify the provider-supported signature/authentication before JSON parsing or queueing.
3. Bind the event’s external store/application identity to an existing platform connection.
4. Insert a unique webhook inbox record and return success quickly; process asynchronously.
5. Validate event name/version and payload schema; ignore unrequested/unknown events safely.
6. Make consumers idempotent and order-tolerant; reconcile platform state instead of trusting event order.
7. Retry with bounds and dead-letter visibility; replay requires an authorized operator and produces an audit entry.

Salla’s reviewed documentation describes `X-Salla-Security-Strategy: Signature` and `X-Salla-Signature` HMAC verification. Zid’s reviewed webhook page documents per-subscription Basic Authentication, but no equivalent platform HMAC on that page; treat the exact production strategy as pending sandbox and partner confirmation. Basic auth values must be unique, randomly generated, encrypted, rotated, and never reused across stores. Do not infer authenticity from an event-shaped JSON body.

## 8. API and storefront security

- All input uses explicit Zod schemas, unknown-key policy, length/count limits, normalized Unicode, and output encoding.
- Security headers use a restrictive CSP with `frame-ancestors 'none'` globally and a route-specific Salla allow-list only on `/salla/embedded`, plus HSTS, `nosniff`, referrer policy, and permissions policy. The Salla allow-list still requires real iframe verification before launch.
- Widget bootstrap accepts only registered store domains/origins and issues a short-lived, audience-bound token with no merchant privileges.
- Widget session IDs are random; anonymous visitor IDs rotate and follow consent. Never embed platform credentials in storefront JS.
- Rate limits combine store, install, session, IP risk signal, endpoint, and cost. Provide stricter limits for model calls, exports, uploads, and handoff contact submissions.
- Commerce events from the browser are untrusted. A client “purchase” cannot create revenue; platform order reconciliation is authoritative.
- Prevent stored/reflected XSS through React escaping, safe markdown rendering, URL allow-lists, sanitized uploaded HTML, and no arbitrary merchant script execution.
- CORS is explicit per public endpoint. Merchant APIs do not use wildcard origins.

## 9. AI and recommendation safety

### Grounding boundary

- SQL/catalog logic enforces tenant, active, availability, stock, category, budget, variants, exclusions, and safety.
- Only eligible candidate snapshots are supplied to the explanation model.
- Prices, availability, ingredients, specifications, compatibility, policies, and metrics carry source and freshness.
- Output schema references allowed product IDs/evidence IDs; a post-validator rejects unknown IDs, changed numeric facts, unsupported claims, and missing limitations.
- If facts are incomplete or stale beyond the configured threshold, ask a useful question, disclose uncertainty, or hand off.

### Prompt/tool security

- Treat merchant content, product descriptions, documents, conversations, webpages, and provider answers as untrusted data, never instructions.
- Separate system instructions from quoted evidence; strip/flag embedded prompt-injection patterns but do not rely on pattern matching alone.
- Tools use fixed parameter schemas and server-side permission/tenant context. No arbitrary SQL, URL fetch, filesystem, or connector method is exposed to a model.
- URL retrieval uses allow-lists, DNS/IP revalidation, size/type limits, timeouts, redirect bounds, and private-network blocking to prevent SSRF.
- Write tools create drafts only. Publication is a normal authorized command outside the model loop.
- Model providers receive the minimum data; provider retention/training settings and regional transfer terms require vendor/legal review.

### Category policies

Pre-classification and post-validation cover medical/diagnostic claims, pregnancy/lactation, supplements/medication interactions, children, allergies, food safety, electronics compatibility, voltage/certification, warranty, and other configured categories.

Responses must not diagnose, promise treatment/results, invent dosage/ingredients/interactions, guarantee allergen safety, or assert compatibility without a verified specification. Severe/persistent symptoms and sensitive cases receive conservative professional referral language and/or handoff. Safety interventions are audited without retaining more sensitive text than needed.

## 10. Store actions and automation

- State machine: `proposed → drafted → validated → approved → queued → publishing → published | failed | conflicted → rolled_back`.
- Every transition validates actor role, store, current state, and immutable evidence/source snapshot.
- A connector capability must be sandbox-verified and feature-enabled before publication is offered.
- Optimistic concurrency (`expectedSourceVersion`) prevents overwriting merchant/platform edits.
- Idempotency prevents double publication; result verification reads the resource back where supported.
- Store before/after content, adapter response reference, actor, timestamp, validator/policy version, and rollback material.
- Price, discount, legal/return/warranty policy, medical claims, unsupported performance/compatibility claims are permanently excluded from automatic publication in the initial product.
- Controlled autopilot defaults off, has per-store/action limits, dry-run history, emergency pause, and periodic re-authorization.

## 11. Secure file and knowledge ingestion

1. Request an upload intent with store membership and allowed type/size.
2. Upload to a private quarantine prefix using a short-lived signed URL.
3. Validate magic bytes, extension, MIME, size, page/row count, archive expansion, and filename normalization.
4. Malware scan and extract in an isolated, resource-limited worker with no cloud credentials or outbound network.
5. Sanitize extracted text; detect sensitive fields; bind every chunk/embedding to store, document, version, and visibility policy.
6. Promote clean objects to a private prefix; keep originals inaccessible through public URLs.
7. Deletion removes object, extracted text, embeddings, caches, and future retrieval while preserving only the required audit tombstone.

Office/PDF parser libraries and malware signatures are patched and monitored. CSV formulas are escaped in any export to prevent spreadsheet injection.

## 12. Privacy and PDPL preparation

Engineering capabilities required before launch:

- documented purposes and data inventory/flow map;
- lawful-basis/consent decisions reviewed by counsel;
- Arabic and English privacy notices with version/acceptance record;
- consent-aware analytics and marketing separation;
- data minimization and configurable retention by data class;
- customer/merchant access, correction, export, and deletion workflows;
- processor/subprocessor inventory and data transfer review;
- breach assessment/notification procedure defined with counsel;
- deletion/revocation on uninstall and contract end;
- privacy-safe support/observability and access reviews;
- a privacy impact assessment for AI analysis, visibility monitoring, and conversation signals.

Suggested starting retention proposals are product decisions, not legal defaults: raw anonymous conversations 90 days, derived aggregate signals 13 months, short-lived raw webhook payloads 7–30 days, and audit/security records according to counsel/business requirements. Make retention configurable and document exceptions/holds.

## 13. Visibility-monitoring security

- Each provider has a capability/terms review record, approved method, credential owner, rate/cost limits, geography/language support, and shutdown switch.
- Manual evidence uploads are private, checksum-addressed, malware-scanned, and reviewer-attributed.
- Assisted browser checks, if approved, use isolated sessions with no merchant dashboard tokens and no CAPTCHA/anti-bot bypass.
- Stored answers are untrusted content. Citation URLs pass safe URL parsing and do not auto-open privileged schemes.
- Reports disclose missing checks and do not convert unavailable provider data into “not mentioned.”

## 14. Secrets, environments, and supply chain

- Production secrets come from a managed secret store, not `.env` files committed to source or browser-prefixed variables.
- Separate development, staging/development-store, and production platform apps/databases/queues/buckets/keys.
- Production readiness, protected routes, integration routes, and health checks fail closed when their required database, Redis, encryption, public URL, auth, or selected-integration credentials are absent.
- Protect default branches; require review and passing lint/type/test/build/security checks.
- Pin lockfile, run dependency/license/secret scanning, produce an artifact/SBOM where the deployment platform supports it, and patch critical issues on a documented SLA.
- CI receives short-lived least-privilege credentials; deployment identity cannot read all production data by default.

### Current dependency exception — 2026-07-14

`npm audit --omit=dev` reports three moderate findings from one transitive chain: Next.js 16.2.10 pins PostCSS 8.4.31, which is covered by [GHSA-qx2v-qp2m-jg93](https://github.com/advisories/GHSA-qx2v-qp2m-jg93). The suggested forced remediation would downgrade Next.js to 9.3.3 and must not be used. The application builds only trusted repository CSS; it does not accept or compile tenant-supplied CSS.

This is a time-bounded accepted risk, not a clean-audit claim. Monitor the [merged upstream Next.js fix](https://github.com/vercel/next.js/pull/93288) and upgrade to the first stable Next.js release that includes the complete fix and regenerated CSS bundles. A local PostCSS override is intentionally avoided because it would replace the package without reproducing all upstream vendored-bundle changes.

## 15. Logging, audit, and incident response

### Logging

Structured logs include timestamp, environment, service, operation, correlation ID, safe store/user reference, outcome, latency, and error class. They exclude tokens, cookies, authorization headers, raw webhook bodies, full conversations, customer contact, and unredacted model prompts/outputs by default.

### Audit log

Append-only entries cover sign-in/security changes, invitation/role updates, connection/scope/token events, exports/deletions, document access, opportunity approval, store publication/rollback, automation changes, billing entitlements, and privileged support access. Each records actor, store, action, resource, result, correlation, and safe before/after summary.

### Incident runbook minimum

1. Detect and assign severity/commander.
2. Contain: pause affected integration/widget/actions, revoke credentials, isolate jobs.
3. Preserve access-controlled evidence and timeline.
4. Determine affected stores/data/actions and eradicate cause.
5. Rotate keys/tokens, reconcile data, restore gradually, and monitor.
6. Coordinate legal/customer/platform notification requirements with counsel/contracts.
7. Complete a blameless review, owner/date remediation, and control test.

Maintain tested kill switches for model provider, visibility provider, storefront widget, connector writes, webhook consumer, and automation per store/platform.

## 16. Production security gates

- Threat model and privacy impact assessment reviewed and dated.
- Authentication/session and RBAC tests, including step-up paths.
- Cross-tenant negative tests for every repository/API/tool/job/search/export.
- OAuth state/replay/refresh/revocation tests against a development store.
- Token encryption/key rotation/redaction verification.
- Provider-supported webhook authentication, replay/duplicate/out-of-order tests.
- Rate-limit, abuse, CORS, CSP, CSRF, XSS, SSRF, upload, and export tests.
- AI injection, hallucinated product/fact, unsafe category, tool escalation, and data-exfiltration evaluation sets.
- Store action approval/conflict/idempotency/read-back/rollback tests.
- Dependency/secret scanning and independent penetration test findings resolved by risk owner.
- Legal review of Saudi PDPL, notices/consent/retention/transfers, provider terms, and marketplace requirements.

Passing these gates supports a launch decision; it is not itself a claim of legal compliance.
