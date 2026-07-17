# Changelog

All notable changes to بصيرة are documented here. This project is pre-release; version numbers do not imply a production-ready Salla/Zid application.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and intends to use semantic versioning after the first release boundary is defined.

## [Unreleased]

### Added

- Merchant Brand Studio for logo, store/advisor naming, welcome copy, AI-assisted first-message options, quick prompts, accessible brand colors, corner style, launcher position, local draft persistence, and live customer/launcher previews.
- SEO/AEO/GEO Content Studio with merchant-friendly explanations, editable metadata, an evidence-linked Arabic article draft, original generated hero image, review gates, structured-data status, and a shareable client-review link.
- Deterministic backend skill modules in `src/modules/skills` — SEO, AEO, GEO, and structured-data skills sharing one check/score contract with per-check evidence, recommendations, and explicit limitations; JSON-LD Product/Organization generation from verified facts only; a versioned registry; a demo `/api/skills` route (list and run); and unit tests.
- Content Studio backend pipeline in `src/modules/content`, porting the blog-writing methodology (answer-first sections, question-form headings, paragraph discipline, sourced-claims-only) into code: brief builder from verified store facts with explicit missing-fact surfacing, outline and deterministic draft composer, a 5-category/100-point editorial review with Arabic/English AI-pattern detection (banned phrases, sentence burstiness, type-token ratio) and a blocking gate below 80 or on critical issues, BlogPosting/FAQPage JSON-LD, a demo `/api/content/studio` route, and unit tests.
- A polished, semantic Arabic article preview at `/insights/dalil-albashra-alhasasa`, explicitly `noindex`/`nofollow` until exported to a merchant-controlled domain and approved for publication.
- Arabic-first marketing, setup/onboarding, dashboard, merchant-advisor, widget, conversations, intelligence, products, opportunities, and AI-readiness/visibility demo screens.
- Seed-backed advisor, event, conversation, merchant-tool streaming, and OAuth-state demo routes. Production connection intentionally stops before token persistence.
- Normalized commerce contracts, deterministic recommendation/safety/readiness modules, process-local demo repository, and Salla/Zid adapter foundations.
- A 75-table Drizzle PostgreSQL schema and initial migration for the target domains; applying it to production and adding durable repositories remain pending.
- Product requirements, roles, journeys, information architecture, full screen inventory, metric definitions, and acceptance criteria in `docs/PRODUCT.md`.
- Target modular-monolith/worker architecture, internal API surface, connector boundary, agent/tool design, event contract, database entity map, attribution flow, and operational gates in `docs/ARCHITECTURE.md`.
- Arabic-first design tokens, RTL/LTR rules, navigation/responsive behavior, core component contracts, system states, accessibility, and visual QA guidance in `docs/DESIGN_SYSTEM.md`.
- Security, privacy, tenant isolation, OAuth/token, webhook, AI safety, upload, store-action, incident, and launch-gate plan in `docs/SECURITY.md`.
- AI visibility methodology separating deterministic readiness from observed provider mentions/citations in `docs/AI_VISIBILITY.md`.
- Dated official Salla/Zid documentation links, documentation-versus-sandbox status, current code gaps, verification protocol, scopes, and release blockers in `docs/INTEGRATIONS.md`.
- Ordered phased backlog, Definition of Done, test workstreams, risk register, and release gates in `docs/MVP_BACKLOG.md`.

### Changed

- Rewrote all customer-facing advisor copy to a warmer, professional tone: welcome messages no longer describe mechanics ("حسب احتياجك وميزانيتك", "من بيانات المتجر"); the widget header, input placeholder, AI welcome proposals, recommendation/no-result responses, safety refusals, and seeded demo transcripts now lead with hospitality while keeping grounded-answer behavior unchanged.

### Clarified

- A Basirah/localhost review link is not a merchant-domain publication and does not create SEO authority. Draft, approved, exported/published, crawled, indexed, and observed AI mention/citation remain separate states.
- SEO, AEO, and GEO checks improve clarity and technical/editorial readiness; none guarantees ranking, rich results, excerpts, citations, or AI-platform visibility.
- The current working slice uses a seeded `mock-salla` store and in-memory demo repository; it is not a live platform integration.
- Salla authorization/token and webhook helpers are foundation code only. Live resource mapping is intentionally disabled until official development-store fixtures and contract tests exist.
- The current Salla code follows a Custom Mode-style callback/token flow, while the reviewed Salla marketplace documentation states published apps use Easy Mode. Marketplace authorization remains unresolved.
- The Zid connector remains feature-disabled pending OAuth/header, webhook, storefront, billing, and development-store verification.
- Readiness scores are not actual ChatGPT/Google/Gemini/Perplexity/Copilot visibility. Seeded observed-query values are demo data only.
- No claim of Saudi PDPL compliance, marketplace approval, verified attribution, guaranteed conversion uplift, or guaranteed AI ranking is made.

### Known limitations

- No production authentication, applied database/RLS tenancy path, queue worker, object storage, live sync, order reconciliation, widget installation, billing, or controlled store mutation has been verified in this documentation milestone.
- No AI visibility provider has been approved or integrated for unattended monitoring.
- External API and marketplace requirements can change; `docs/INTEGRATIONS.md` must be re-reviewed before each connector release.
