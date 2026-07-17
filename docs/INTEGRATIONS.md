# بصيرة — Salla and Zid Integration Checklist

**Documentation review date:** 2026-07-14

**Implementation status:** Read-only Salla implementation complete in code; no development-store end-to-end verification yet

**Launch strategy:** Salla and Zid are first-class targets with independent release gates. Shared infrastructure ships once; neither platform may borrow the other platform's verification evidence.

## 1. How to read this document

Two independent statuses are used:

### Documentation status

| Status | Meaning |
| --- | --- |
| **Official-doc confirmed** | The linked official page described the capability on the review date. This is not a successful integration test. |
| **Ambiguous / confirm with platform** | Official pages are incomplete, differ by endpoint/app type, or do not answer the production question. |
| **Not located** | No acceptable official contract was found during this review. Do not implement from guesses or third-party examples. |

### Implementation status

| Status | Meaning |
| --- | --- |
| **Foundation only** | Interface or partial code exists; no development-store end-to-end proof. |
| **Not implemented** | No production code/fixture/test exists. |
| **Blocked** | Must remain feature-disabled pending official/platform/sandbox evidence. |
| **Sandbox verified** | Reserved for a future result with redacted fixture, automated contract test, date, app type, and platform environment. No row currently has this status. |

Official documentation changes. Re-review links and platform changelogs before every connector release, scope change, webhook change, storefront script, billing change, or marketplace submission.

## 2. Current code reality

| Capability | Current repository state |
| --- | --- |
| Shared connector contract and normalized models | Implemented and unit-tested for the read-only catalog slice |
| Salla Easy Mode install URL plus Custom Mode token exchange/refresh | Implemented with encrypted persistence; real Partners/development-store proof still required |
| Salla embedded merchant session and account linking | Embedded token remains in browser memory. Same-origin introspection either issues a ten-minute, store/connection-bound read-only session whose live connection is rechecked on every request, or a hashed, expiring, one-time top-level claim for an unbound store. Owner/admin binding uses a ten-minute host-only cookie and re-verifies both merchant and original Salla authorizer user before an atomic bind. Real SDK/browser proof still required |
| Salla webhook HMAC comparison | Signed raw-body ingress, bounded body, durable/idempotent sanitized inbox, provider-time ordering, pending binding, compare-and-swap token rotation, credential destruction, outstanding-claim invalidation, and active-job cancellation on uninstall are implemented; real signed fixture still required |
| Salla store/product/category mapping | Implemented from current official schemas with synthetic contract fixtures; orders/customers/carts/subscription remain blocked |
| Salla catalog synchronization | Durable store/category/product runs, checkpoints, credential-generation-bound atomic page commits, reconciliation, retries, outbox, BullMQ worker, uninstall cancellation, status API/UI, and live tenant-scoped views implemented |
| Salla storefront script/add-to-cart/billing | Not implemented |
| Zid OAuth authorization/token/refresh with dual-token result | Foundation only; persistence and development-store fixture still required; resource methods remain blocked |
| Demo store | Local `mock-salla` seed only; never evidence of platform support |

`ConnectorCapabilities` now uses evidence states (`documented`, `sandbox_verified`, `degraded`, `blocked`, `unavailable`) instead of unsafe booleans. No live capability is currently marked `sandbox_verified`.

## 3. Salla official sources reviewed

- [Merchant API — Get Started](https://docs.salla.dev/421117m0)
- [Authorization](https://docs.salla.dev/421118m0)
- [Webhooks and signature verification](https://docs.salla.dev/421119m0)
- [Application lifecycle events](https://docs.salla.dev/421413m0)
- [Merchant API changelog](https://docs.salla.dev/421127m0)
- [Store information](https://docs.salla.dev/5394261e0)
- [Authorizing user information](https://docs.salla.dev/9466620e0)
- [List Products](https://docs.salla.dev/5394168e0)
- [List Categories](https://docs.salla.dev/5394207e0)
- [List Orders](https://docs.salla.dev/5394146e0)
- [List Customers](https://docs.salla.dev/5394121e0)
- [Abandoned Carts](https://docs.salla.dev/841783f0)
- [Device Mode / App Snippet storefront tracking](https://docs.salla.dev/1724504m0)
- [Cart and Checkout events](https://docs.salla.dev/1804461m0)
- [Embedded App creation](https://docs.salla.dev/embedded-sdk/create-app)
- [Embedded SDK authentication](https://docs.salla.dev/embedded-sdk/authentication)
- [Embedded token introspection](https://docs.salla.dev/27474794e0)
- [Add-on subscription lifecycle](https://docs.salla.dev/2213496m0)

### 3.1 Salla checklist

| Item | Documentation finding | Doc status | Implementation | Required exit evidence |
| --- | --- | --- | --- | --- |
| Partner/public app type | Merchant apps are created in Salla Partners and published to the App Store; exact review/listing requirements vary by app type and portal configuration. | Ambiguous / confirm with platform | Not implemented | Record chosen app type, marketplace checklist, support/privacy URLs, review test account and approval notes. |
| Marketplace authorization mode | Authorization docs describe Easy and Custom modes and state Easy Mode is the allowed mode for published App Store apps; Easy Mode delivers `app.store.authorize` to the configured webhook. | Official-doc confirmed | Install, encrypted pending persistence, signed ingress, backend token introspection, existing-workspace binding, rotation, and uninstall are implemented | Prove the complete embedded flow and signed install/update/uninstall on a demo store; keep Custom Mode limited to documented development/private use. |
| Custom Mode OAuth | Official URL is `https://accounts.salla.sa/oauth2/auth`; token endpoint is documented in the same official flow. State and `offline_access` are described. | Official-doc confirmed | Authenticated role-gated start, hashed database state, cookie binding, code exchange, store-identity check, encrypted persistence, and initial sync are implemented | Capture denial/replay and exact token fixtures on a development/private app. |
| Token lifetime and refresh | Current authorization page describes expiring access and refresh tokens; Easy Mode event format differs from token response and includes an `expires` value. | Official-doc confirmed, response-mode details require fixtures | Separate schemas, proactive refresh, bounded token call, Redis lock, optimistic credential-generation update, provider-time lifecycle ordering, and uninstall destruction are implemented | Record a single-use rotating refresh fixture plus refresh-versus-uninstall and failure/recovery behavior. |
| Authorization headers/base API | Merchant API base is `https://api.salla.dev/admin/v2`; protected calls use `Authorization: Bearer …`. | Official-doc confirmed | Server-only client implements Bearer, language, 15-second timeout, no-store, defensive parsing, and typed rate-limit errors | Verify response/error headers with a development store. |
| Store and authorizer identity | `GET /store/info` binds the access token to the expected merchant; `/oauth2/user/info` identifies the authorizing user, who is not necessarily the store owner. | Official-doc confirmed | Both merchant surfaces and the original embedded user are required before initial binding; store identity is rechecked on every worker run | Save redacted development-store fixtures and mismatch tests. |
| Product list | `GET /products`; `products.read`; pagination and a light format are documented. | Official-doc confirmed | Full-format Arabic/English pagination, variants/options/images/status/price/stock/categories/provenance and exact minor-unit mapping implemented | Development-store contract and full-pagination reconciliation proof. |
| Product details/update | Product read/write endpoints exist in official collection, but the exact safe update fields and concurrency behavior for this product require review. | Ambiguous / confirm with platform | Mapping/write blocked | Read/update fixtures; field allow-list; platform edit conflict strategy; read-after-write; rollback proof. |
| Categories | `GET /categories`; `categories.read`; translations/items options are documented. | Official-doc confirmed | Arabic/English pagination, translations, parent resolution, and removed-category reconciliation implemented | Development-store parent/hidden/deleted fixtures. |
| Orders | `GET /orders`; `orders.read`. Current docs specify sequential pagination, maximum page-size guidance, a cache window, date filters, and deprecations. | Official-doc confirmed | Mapping blocked | Sequential-page fixtures; items/customer/status/currency mapping; incremental history and reconciliation tests; current deprecation review. |
| Customers | `GET /customers`; `customers.read`; current page documents a resource-specific rate limit. | Official-doc confirmed | Mapping blocked | PII minimization/redaction fixture; cursor/page behavior; delete/uninstall policy; avoid importing unused fields. |
| Abandoned carts | Official collection documents list/detail under `/carts/abandoned` and `carts.read`. | Official-doc confirmed | Mapping blocked | Availability by app/store plan, fields/PII, pagination, status/webhook reconciliation, and permitted product use confirmed. |
| Policies, FAQ, shipping/returns pages | Product requires public policies, but a complete supported API path for all page types was not established here. | Not located / ambiguous | Not implemented | Identify official endpoints or use a reviewed public-page ingestion method with merchant consent; never infer missing policy text. |
| Webhook registration/events | Official webhook docs describe registration, versions, event rules, and signature/token strategies. | Official-doc confirmed | Registration not implemented | Final event allow-list, version, registration fixture, lifecycle/product/order/inventory/cart payload fixtures, reconciliation plan. |
| Webhook signature | Current docs describe `X-Salla-Security-Strategy: Signature`, `X-Salla-Signature`, SHA-256 HMAC over the request body, and timing-safe comparison. | Official-doc confirmed | Uses dedicated `SALLA_WEBHOOK_SECRET`, raw bytes, timing-safe comparison, size limit, sanitized inbox payload, retryable inbox state, and hash idempotency | Verify exact header/signature with a real Partners fixture before accepting production traffic. |
| Webhook identity/replay | Event ID, timestamp tolerance, delivery retry behavior, and ordering must be captured per event contract. | Ambiguous / confirm with platform | Stable raw-payload digest idempotency, sanitized inbox retry/reclaim, and provider-time authorization/uninstall ordering are implemented; provider delivery semantics remain unverified | Capture real delivery IDs/retries, timestamp precision and duplicate/out-of-order fixtures; add a replay window only if the provider contract supports it. |
| Storefront event tracking | Device Mode documents an App Snippet injecting an async tracker and official storefront/cart/checkout event models. | Official-doc confirmed at architecture level | Not implemented | App Snippet approval/configuration, development-theme test, exact event payload fixtures, consent behavior, performance budget. |
| Customer widget installation | App Snippet supports script injection, but widget UI placement, checkout exclusions, CSP, update/removal behavior need confirmation. | Ambiguous / confirm with platform | Not implemented | Partner approval, allowed host/CSP, async loading, theme coverage, uninstall removal, mobile/checkout obstruction tests. |
| Add to cart | Storefront events are documented, but a supported third-party widget add-to-cart command and variant contract were not established in this review. | Not located | Not implemented | Official SDK/API link and development-store fixture; otherwise show “View product” only. |
| Embedded merchant app | Official Embedded SDK docs describe iframe loading and short-lived URL parameters including token/theme/lang, with backend introspection. | Official-doc confirmed | `/salla/embedded` initializes the SDK while keeping the provider token in browser memory. Backend introspection creates a hashed ten-minute, single-use claim; a fragment-only top-level bridge strips the secret, sets an `HttpOnly` host cookie, preserves sign-in/workspace creation, and permits only owner/admin binding after merchant/store conflict checks. | Verify SDK `init/ready/refresh`, third-party-cookie behavior, fragment stripping, claim expiry/replay, sign-in/workspace continuation, locale/theme, supported browsers, and marketplace UX in the official playground/development store. |
| Billing/subscriptions | Official docs cover app subscription events/APIs; add-ons may require prior approval and have different lifecycle semantics. | Official-doc confirmed at architecture level | Not implemented | Confirm base plan versus add-on model, event payload fixtures, entitlements, cancellation/renewal, tax/payout terms, duplicate protection. |
| Rate limits | Resource docs and changelog contain limits/changes; one global assumption is unsafe. | Official-doc confirmed per endpoint | Not implemented | Per-route limiter metadata, `Retry-After`/error fixtures, bounded retries, sync checkpoint persistence, alerts. |
| App review | Exact general-app review requirements were not fully captured through a single stable page in this review. | Ambiguous / confirm with platform | Not implemented | Obtain current Partner Portal checklist, Arabic/English listing, privacy/security/support materials, demo credentials, QA cases, scope justifications. |

### 3.2 Proposed minimum Salla scopes

Start read-only and request scopes only when their feature is implemented and reviewable:

| Capability | Candidate scope from reviewed docs/current code | Release rule |
| --- | --- | --- |
| Products | `products.read` | Phase 1 required |
| Categories | `categories.read` | Phase 1 required |
| Orders | `orders.read` | Add only when attribution/history ships |
| Customers | `customers.read` | Add only if customer-level journey/handoff needs it; minimize fields |
| Abandoned carts | `carts.read` | Optional; prove availability/privacy/value first |
| Webhooks | Current code proposes `webhooks.read_write` | Confirm exact official scope in Partner Portal/docs before request |
| Store/settings/branches | Current code proposes `store-settings.read`, `branches.read` | Justify with exact endpoint; remove if not needed |
| Product mutation | Expected read/write scope, exact name/fields must be rechecked | Do not request until approval-gated publishing passes sandbox review |

Easy Mode scope selection may be controlled in the Partners Portal rather than only the authorization URL. The final scope source and returned scope format must be fixture-tested.

## 4. Zid official sources reviewed

- [Developer start](https://docs.zid.sa/start-here)
- [App types and development/review cycle](https://docs.zid.sa/zid-apps-overview)
- [Create the first app, plans, and publish checklist](https://docs.zid.sa/create-first-app)
- [OAuth authorization and token/header model](https://docs.zid.sa/authorization)
- [List Products](https://docs.zid.sa/retrieve-a-list-of-products)
- [List Categories](https://docs.zid.sa/get-all-categories)
- [List Orders](https://docs.zid.sa/list-of-orders)
- [List Customers](https://docs.zid.sa/list-of-customers)
- [Abandoned cart details](https://docs.zid.sa/get-abandoned-cart-details)
- [Webhook event overview](https://docs.zid.sa/webhooks)
- [Create Webhook and Basic Authentication](https://docs.zid.sa/create-a-webhook?nav=1)
- [Storefront events and App Scripts](https://docs.zid.sa/app-scripts-649611m0)
- [Subscription details](https://docs.zid.sa/get-subscription-details-13896876e0)
- [Usage-based charge update](https://docs.zid.sa/update-usage-based-charges-13896680e0)

### 4.1 Zid checklist

| Item | Documentation finding | Doc status | Implementation | Required exit evidence |
| --- | --- | --- | --- | --- |
| App type/review | Public/private subscription app types, development stores, plans, and a review/testing step are documented. Public submission calls for partnership, test account, QA cases, activation steps, and FAQs. | Official-doc confirmed at process level | Not implemented | Choose public/private/embedded model; record current Partner Dashboard requirements and approval outcome. |
| OAuth flow | Authorization-code grant through `https://oauth.zid.sa`; server-side client secret; callback exchanges code at `/oauth/token`. | Official-doc confirmed | Blocked/not implemented | State/replay/denial tests; exact authorize URL/parameters/token fixture; uninstall event and revocation behavior. |
| Token/header model | Docs distinguish `Authorization` and `X-Manager-Token`; Product component endpoints may use `Access-Token`, plus `Store-Id` and `Role`. | Official-doc confirmed but endpoint-specific | Blocked | Build endpoint-family auth strategies from fixtures; never use one guessed header set globally. |
| Token lifetime/refresh | Authorization page currently describes long manager/refresh token lifetimes. Returned fields and lifecycle must remain authoritative. | Official-doc confirmed, sandbox confirmation required | Blocked | Parse actual expiry; refresh fixture; rotation/revocation/uninstall; alerting; no hard-coded one-year assumption. |
| Store profile | Exact production endpoint and header/response contract were not captured here. | Not located | Blocked | Official link plus fixture mapping store ID/UUID/domain/locale/currency. |
| Products | `GET https://api.zid.sa/v1/products/`; `products.read`; docs show `Access-Token`, `Store-Id`, `Role: Manager`, pagination and product classes. | Official-doc confirmed | Blocked | Fixtures for every supported class/variant/stock/image/category/translation; define MVP-supported classes and graceful exclusions. |
| Categories | `GET /v1/managers/store/categories`; `products.read`; docs show `Authorization` and `X-Manager-Token`. | Official-doc confirmed | Blocked | Fixture for numeric ID/UUID/parents/translations/metafields and pagination behavior. |
| Orders | `GET /v1/managers/store/orders`; `orders.read`; `payload_type` affects inclusion of items; marketplace customer data may be masked. | Official-doc confirmed | Blocked | Use correct payload type; masked/null PII handling; pagination/status/item fixtures; reconciliation tests. |
| Customers | `GET /v1/managers/store/customers`; current docs show `third_customers_read` and cursor-style fields. | Official-doc confirmed | Blocked | Exact scope from Partner Dashboard, pagination fixture, PII minimization and masked/nullable fields. |
| Abandoned carts | Detail endpoint and `abandoned_carts.read` are documented; overview also lists abandoned-cart webhook events. | Official-doc confirmed | Blocked | List endpoint/pagination, availability/plan, PII and retention, created/completed reconciliation fixtures. |
| Policies/FAQ/shipping/returns | Complete supported APIs for public policy/FAQ content were not established. | Not located / ambiguous | Blocked | Official endpoints or reviewed public-page ingestion with consent; distinguish missing from unsupported. |
| Webhook subscription/events | `POST /v1/managers/webhooks` with `third_webhook_write`; official overview lists order/product/category/customer/cart events and conditions. | Official-doc confirmed | Blocked | Event allow-list, header/body fixture, subscription list/delete/reconcile, retry behavior, unique-event/idempotency plan. |
| Webhook authentication | Create Webhook page documents optional `username`/`password` resulting in HTTP Basic Authentication. The reviewed page does **not** document a Salla-like platform HMAC. | Official-doc confirmed for Basic; HMAC ambiguous/not located | Blocked | Unique random credentials per connection, encrypted storage, constant-time compare, TLS, sandbox delivery fixture; ask Zid whether stronger signing/replay metadata exists. |
| Storefront App Scripts | Official App Scripts page describes Partner Dashboard script injection, exposed storefront events, development-store testing, and review/approval. | Official-doc confirmed at architecture level | Blocked | Script approval, load/remove lifecycle, CSP/theme compatibility, exact event fixtures, consent and performance checks. |
| Widget UI and add to cart | Script injection is documented; a supported widget add-to-cart/variant command was not established in this review. | Ambiguous / add-to-cart not located | Blocked | Official SDK/API contract and development-store fixture; otherwise widget links to product only. |
| Billing | App creation supports recurring/usage plans; subscription detail and usage-charge endpoint/events are documented. | Official-doc confirmed at architecture level | Blocked | Chosen plan model, exact entitlements/event fixtures, charge limits, failure/cancellation, payouts/tax and review approval. |
| Embedded app | App creation page describes an embedded option and redirect flow but detailed session/Hermes contract requires targeted review. | Ambiguous / confirm with platform | Blocked | Official detailed page, frame/session token fixture, CSP/locale/theme, review tests. |
| Rate limits | No complete per-endpoint contract was recorded in this pass. | Not located | Blocked | Obtain official limits/error headers; implement adaptive limiter and backoff from sandbox evidence. |

### 4.2 Candidate Zid scopes

Names below come from the linked endpoint pages and still require Partner Dashboard confirmation:

- `products.read`
- `orders.read`
- `third_customers_read`
- `abandoned_carts.read`
- `third_webhook_write`
- `Subscription.read_write` only if usage-based billing is approved and implemented

Product write, embed, scripts, and any additional store/settings scopes must remain absent until their feature, review justification, and exact official names are verified.

## 5. Capability matrix for product behavior

| Capability | Mock demo | Salla current | Salla production target | Zid current | Zid production target |
| --- | --- | --- | --- | --- | --- |
| Store/catalog read | Seeded | Implemented and unit-tested; development-store proof pending | Phase 1 after real contract and reconciliation evidence | Blocked | Phase 4 |
| Order attribution | Seed counters only | Unavailable | Phase 2 reconciled orders | Blocked | Phase 4 after Salla parity |
| Webhook ingestion | Demo event method | Signed durable lifecycle inbox implemented; real signed fixture pending | Phase 1 after development-store lifecycle evidence | Blocked | Phase 4 |
| Storefront widget | Local app/demo target | Not installed | Approved App Snippet | Blocked | Approved App Scripts |
| Add to cart | Local UI may simulate only when labeled | Not verified | Only with official supported contract | Not verified | Only with official supported contract |
| Product content write | No platform write | Method intentionally unavailable | Phase 5 approval-gated | Blocked | Later parity |
| Billing | None | Not implemented | After plan/event review | Blocked | After plan/event review |

The merchant UI reads this matrix from server feature flags/capability state. Unsupported actions are removed or disabled with a reason; they never silently pretend success.

## 6. Adapter verification protocol

For each external method/event:

1. Link the exact official page and record `reviewed_at`, app type, API version, scope, and known deprecations.
2. Exercise it against a platform development/demo store with test-only data.
3. Store a redacted request/response or event fixture, including headers relevant to auth/rate limits/pagination.
4. Define a strict Zod external schema and pure mapping into normalized models.
5. Test normal, empty, paginated, translated, deleted/hidden, null/masked, rate-limited, expired-token, forbidden-scope, and changed-schema cases.
6. Record source provenance and mapping version on normalized data.
7. Add reconciliation for missed/out-of-order webhooks.
8. Mark the capability `sandbox_verified` only after CI contract tests and a named reviewer pass.

Fixture path convention:

```text
src/test/fixtures/{platform}/{api-version}/{resource}/{scenario}.json
```

Fixtures must contain no live tokens, customer contact, order addresses, or unrelated personal data.

## 7. Release blockers

### Salla production blocker list

- Verify the implemented marketplace Easy Mode install, embedded SDK session, one-time top-level owner/admin binding, authorizer-user match, rotation, and uninstall-during-sync flow on a real development store and supported browsers.
- Confirm the configured webhook signing secret and verify a real raw-body signature fixture.
- Capture real store/catalog pagination and reconciliation fixtures for the implemented mappings.
- Validate App Snippet widget/event contract, consent, performance, uninstall, and review approval.
- Validate order/item mapping before showing attributed revenue.
- Establish supported add-to-cart or intentionally ship view-product only.
- Complete scopes, billing, marketplace review, security/privacy/legal checks.

### Zid enablement blocker list

- Complete the shared authentication, tenancy, encrypted-token, webhook-inbox, queue, and reconciliation gates.
- Verify OAuth and every endpoint family’s header/token contract.
- Confirm webhook Basic Auth/replay/idempotency and whether stronger signing is available.
- Contract-test supported product classes and masked customer/order fields.
- Obtain App Scripts approval and supported add-to-cart behavior.
- Verify plans/subscription entitlements and public/private/embedded review requirements.

Until the relevant list is closed, marketing and UI must say “Salla integration in development” or “Zid planned/pending verification” rather than “connected,” “official partner,” or “live.”
