# بصيرة — فاحص الظهور العربي للمتاجر

منصة عربية للتجارة الإلكترونية تبدأ بفحص حتمي وآمن يوضح هل يستطيع Google وChatGPT وGemini فهم المتجر والثقة بمحتواه، ثم تحوّل النتائج إلى تقرير عربي موثق وخطة إصلاح ومسودات محتوى ووكيل مبيعات. سلة هي أول تكامل مستهدف للإنتاج؛ يبقى زد معطّلًا حتى اكتمال عقوده واختباراته.

This repository contains a production-minded foundation and a complete seeded demo vertical slice. Demo records are always labeled and do not enter the production data path.

## ما يعمل الآن

- Checker-first Arabic/English marketing routes, domain-first scan journey, real progress states, free preview, methodology, and launch pricing
- Deterministic HTML/XML/JSON-LD scanner with URL normalization, SSRF/private-network blocking, robots handling, bounded crawling, coverage/confidence, evidence, and seven weighted readiness components
- Seven-day anonymous scan records, 30-day email-unlocked report links, opaque access tokens, keyed email lookup hashes, purpose-bound encrypted lead addresses, service-only report/consent tables, and a BullMQ boundary for production scans
- Free seven-page Arabic/English executive report with evidence-linked findings, platform readiness lenses, a 30/60/90 plan, page-specific keywords, confirmed-product SEO work, content opportunities, honest Search Console connection state, private sharing, and PDF download
- The public journey charges nothing for the report; the legacy manual `pending_payment` order foundation is not presented to customers
- Simplified merchant navigation: overview, reports, improvement plan, content, sales agent, and settings
- Isolated Arabic demo with product UI and original demo product photography
- Secure mock OAuth state round-trips for Salla and Zid
- Visible initial-sync progress and a resumable six-step onboarding flow
- Grounded customer advisor: safety classification → constraint extraction → database-style hard filtering → ranking → explanation
- Merchant Brand Studio with logo upload, accessible color controls, AI-assisted welcome options, prompt editing, local persistence, and a live shopper preview
- Verified product cards with price, stock, attributes, view, and idempotent click/add events
- Merchant dashboard, conversations, customer intelligence, products, opportunities, AI-readiness, settings, automations, and usage
- Google-aligned SEO and generative Search Content Studio with an evidence-backed Arabic draft, people-first review checklist, structured-data preview, and a shareable noindex client-review link
- Backend skill modules for SEO, buyer-answer clarity, generative Search readiness, and structured data, with deterministic evidence-based checks, verified-facts-only JSON-LD generation, and a demo `/api/skills` route
- Backend task-skill orchestration: articles execute the exact `content-strategy` + `blog` + `ai-seo` stack, while AI-visibility PDF reports use `ai-seo` + `canvas-design`; DOCX and Power BI capabilities remain scoped to matching output requests
- Content Studio backend pipeline (`src/modules/content`): brief → outline → evidence-grounded draft → 100-point editorial review with AI-pattern detection (banned phrases, burstiness, vocabulary diversity) and a blocking publish gate, plus BlogPosting/FAQPage JSON-LD and a demo `/api/content/studio` route
- Streaming merchant intelligence using AI SDK 6 and AI Elements; deterministic evidence-based fallback when no AI credential exists
- Drizzle/PostgreSQL schema covering acquisition scans, reports, consent, tenant commerce data, content, conversations, visibility, billing, events, and audit
- Unit tests for recommendation, safety, readiness, OAuth state, and token-vault invariants
- Supabase magic-link authentication with fresh-session checks for sensitive mutations
- Forced PostgreSQL RLS across the tenant schema, Auth profile synchronization, role-aware store policies, and encrypted operational tables
- Salla Custom OAuth persistence plus Easy Mode signed webhook intake, pending authorization storage, embedded SDK session bootstrap, one-time top-level owner/admin linking, authorizer-user verification, compare-and-swap token rotation, and uninstall revocation
- Read-only Salla Admin API transport for store, products, variants, media, categories, pagination, bilingual content, exact halala conversion, timeout and rate-limit errors
- Durable catalog sync runs with checkpoints, credential-generation-bound page commits, retry classification, source reconciliation/tombstones, Redis outbox dispatch, uninstall cancellation, and a standalone BullMQ worker
- Production sync-status UI and tenant-scoped live catalog dashboard/product views; all unfinished analytics, advisor, billing, publishing, and Zid screens fail closed instead of showing demo figures

## Local setup

Requirements: Node.js 22.12+ and npm.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000/ar`. The default `APP_MODE=demo` requires no database, Redis, commerce-platform, or model credentials. Staging and production fail closed when core infrastructure is missing.

Useful paths:

- `/ar` and `/en` — checker-first public landing pages
- `/ar/check/[token]` — recoverable progress and free preview
- `/ar/pricing` — free report and paid implementation/subscription offers
- `/ar/methodology` — measurement boundaries and methodology
- `/ar/signin` — account access
- `/demo` — isolated legacy seeded experience
- `/setup/connect` — Salla connection (live outside demo); Zid remains explicitly disabled
- `/salla/embedded` — Salla iframe entry; keeps the short-lived embedded token in browser memory and creates a one-time top-level link
- `/salla/continue` — public top-level bridge that removes the claim fragment before creating a short-lived `HttpOnly` binding cookie
- `/setup/sync` — real catalog run status, counts, failure, and retry states outside demo
- `/dashboard` — live catalog overview outside demo
- `/dashboard/products` — paginated tenant-scoped catalog
- `/dashboard/widget` — live advisor vertical slice
- `/dashboard/advisor` — merchant intelligence
- `/dashboard/visibility` — readiness vs observed visibility
- `/dashboard/visibility/content` — Google-aligned SEO, reader clarity, and trust draft/review studio
- `/insights/dalil-albashra-alhasasa` — client-facing article review preview (`noindex`)

## Verification

```bash
npm run lint
npm run typecheck
npm test
npm run db:check
APP_MODE=demo npm run build
```

Or run all checks with `npm run verify`.

The 2026-07-17 code gate passes lint, generated-route and TypeScript checks, 262 tests in 55 files, Drizzle migration validation, and the demo-mode Next.js production build. Five live public-store scans, customer PDFs, and browser evidence are recorded in [`docs/launch-verification-2026-07-17.md`](docs/launch-verification-2026-07-17.md). This is repository evidence, not a substitute for the real Supabase/Salla launch evidence below.

## Database

Set `DATABASE_URL`, then:

```bash
npm run db:generate
npm run db:migrate
npm run db:studio
```

PostgreSQL requires the `vector` extension for document embeddings. Store-owned records retain non-null `store_id` tenant keys and RLS policies. Anonymous scan/report tables are service-only, have forced RLS, and are not exposed directly to browser roles.

Catalog jobs run in a separate continuously available process:

```bash
npm run worker:catalog
```

Production visibility scans use their own process: `npm run worker:visibility`.

The worker receives only store/connection/run identifiers; platform tokens remain encrypted in PostgreSQL and are loaded server-side after tenant and merchant identity checks.

## External launch gates still required

- Apply and verify migrations against a controlled Supabase staging project, including live cross-tenant JWT tests and database-advisor review
- PostgreSQL, Redis/BullMQ workers, and S3-compatible object storage
- Team invitation and account-recovery product flows
- KMS-backed token envelope encryption and rotation
- A real Salla development-store run covering install, signed authorize/update/uninstall, token refresh, introspection, pagination, zero-product stores, rate limiting, and reconciliation; synthetic fixtures are not platform proof
- Salla marketplace review/approval, listing/support/privacy assets, and real development-store verification of the Embedded SDK, top-level browser handoff, locale/theme behavior, and install/uninstall lifecycle
- Zid dual-token OAuth persistence, endpoint-family fixtures, and webhook delivery proof; Zid stays disabled until these pass
- Managed worker deployment, queue/dead-letter alerting, traces, backups, restore drill, and on-call runbook
- Signed widget sessions, verified storefront origin allowlist, and separately bundled lightweight widget
- Merchant-domain content export/publishing, final canonical URLs, crawl/index checks, and measured visibility separated from draft readiness
- Legal/security review for Saudi PDPL, retention, residency, subprocessors, and consent
- Verified visibility providers or manual verification workflows; never fabricated monitoring

See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for the exact environment, migration, worker, Supabase, Salla, smoke-test, and rollback checklist.

## Documentation

- [`docs/PRODUCT.md`](docs/PRODUCT.md)
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md)
- [`docs/SECURITY.md`](docs/SECURITY.md)
- [`docs/AI_VISIBILITY.md`](docs/AI_VISIBILITY.md)
- [`docs/launch-verification-2026-07-17.md`](docs/launch-verification-2026-07-17.md)
- [`docs/INTEGRATIONS.md`](docs/INTEGRATIONS.md)
- [`docs/MVP_BACKLOG.md`](docs/MVP_BACKLOG.md)

No ranking/mention outcome, legal compliance, platform approval, live consumer-surface access, or payment success is claimed. Readiness, Google discovery, and observed visibility remain separate measurements.
