# بصيرة — AI Visibility Measurement Methodology

**Status:** Methodology contract; live provider monitoring is not implemented or verified

**Methodology version:** `visibility-method-v1-draft`

**Last updated:** 2026-07-11

## 1. The non-negotiable separation

“AI visibility” is not one directly measurable number. بصيرة reports two different families of evidence and never substitutes one for the other:

| Family | Question answered | What it does **not** prove |
| --- | --- | --- |
| **Readiness** | Can crawlers and answer systems access, identify, understand, and quote the store’s public content? | That a platform currently mentions, ranks, recommends, or cites the merchant |
| **Observed visibility** | In a recorded check for one provider, query, locale, market, context, method, and time, was the merchant/product mentioned or cited? | Universal visibility, causal ranking impact, stable position, or future results |

The UI must show “AI Visibility Readiness” and “Observed mentions/citations” as separate sections, axes, datasets, and trends. A missing/unsupported observed check is **unavailable**, not a zero or “not mentioned.”

## 2. Current repository behavior

The repository contains deterministic **demo readiness** logic only:

- a product audit over Arabic/English content, verified attributes, usage guidance, and source-backed safety/ingredient facts;
- a seeded store-readiness component set and weighted calculation;
- explicitly labeled demo observed-query counters in seed data.

It does not call ChatGPT, Google AI Overviews, Gemini, Perplexity, Copilot, or another provider. It does not prove a live mention or citation. Any UI using the seed counters must carry a persistent demo label.

## 3. Measurement model

### Layer 1 — Technical readiness

Measure deterministic page/site conditions:

- HTTP reachability and stable final URL;
- indexability signals, robots directives, sitemap, canonical consistency;
- server-rendered/accessible text and mobile usability indicators;
- page status, redirect chain, internal links, breadcrumbs;
- valid structured-data syntax and required/recommended fields;
- duplicate or conflicting locale/canonical signals;
- performance observations with named source/time where available.

Technical readiness is not a promise that a specific provider crawls or uses the page.

### Layer 2 — Content completeness and answerability

Measure whether public content can answer validated merchant/customer questions using explicit facts:

- clear title, description, category, brand/manufacturer;
- price/availability context where publicly appropriate;
- structured attributes, variants, specifications, size/compatibility/ingredients;
- use instructions, shipping/returns/warranty, factual FAQs;
- concise answer passages, headings, tables/lists, dates, and source-supported claims;
- Arabic/English completeness and consistency;
- repeated customer questions with no supported public answer.

An answerability check must retain the tested question, expected verified facts, extracted answer/evidence, and pass/warning/fail reason. Length or keyword count alone is not answerability.

### Layer 3 — Brand/entity clarity

Measure whether the store consistently identifies the organization, brand, products, and relationships:

- canonical brand/store name and aliases;
- business description and category;
- contact, location/market, About page, policies;
- product → brand/manufacturer/category relations;
- stable identifiers where available (SKU/GTIN/MPN, social/profile links);
- Organization/Product/Breadcrumb structured data consistency;
- Arabic/English transliteration and naming consistency.

### Layer 4 — Trust, authority, and external presence readiness

Measure source-backed signals such as transparent policies, reviews with provenance, contact/about completeness, claim sources, update dates, and a crawlable external footprint. External footprint is not the same as an AI-platform mention. Never reward purchased/spam citations or count self-created duplicate profiles as independent authority.

### Layer 5 — Actual observed mentions

A mention exists only when a stored provider response explicitly identifies the configured merchant entity or one of its reviewed aliases/products in answer content. Search-result snippets or the merchant’s appearance in a source page do not automatically count as an answer mention.

Entity resolution states:

- `exact`: canonical name/domain/product ID or unambiguous reviewed alias;
- `probable`: contextual match requiring reviewer confirmation;
- `ambiguous`: shared name or insufficient context; excluded from headline metrics;
- `false_positive`: reviewed non-match.

### Layer 6 — Actual observed citations

A citation exists only when the captured answer exposes a source/reference URL associated with a claim or answer section under the provider’s supported interface/method. Store:

- original URL and normalized URL/domain;
- linked answer segment or provider reference identifier where available;
- merchant/competitor/third-party ownership classification;
- fetch/check timestamp, provider, query, locale/market, method;
- evidence artifact checksum/reference and review status.

A mention without a citation and a citation without an explicit merchant mention are separate observations.

### Layer 7 — Competitor visibility

Competitor metrics use the same query set, provider, locale/market, time window, capability, entity-resolution rules, and missing-data rules as the merchant. Merchants explicitly configure competitors; بصيرة does not infer that similarly named businesses are competitors without review.

## 4. Readiness score

### Draft store score

New reports use `site-readiness-v2`, aligned with Google's July 2026 generative Search guidance. Historical `site-readiness-v1` reports remain immutable and comparable only within their stored methodology version:

| Component | Weight | Examples of evidence |
| --- | ---: | --- |
| Technical readiness | 25% | indexability, Googlebot access, sitemap, canonical, accessible HTML |
| Product/content value and completeness | 30% | descriptions, verified attributes, original facts, bilingual completeness |
| Entity clarity | 10% | brand identity, About/contact, product-brand relations |
| Trust and authority | 15% | transparent policies, reviews/sources, update dates, claim quality |
| Reader clarity and usefulness | 10% | descriptive headings and verified buyer information; FAQ/question formats are optional |
| Structured data | 5% | valid and consistent Organization/Product data for ordinary SEO and rich-result eligibility |
| External presence evidence | 5% | reviewed crawlable external footprint; **not AI mention coverage** |

Formula:

`readiness = round(sum(component_score × component_weight))`

Each component is 0–100 and stores its own check results. The 5% external-presence component may be renamed or removed after validation; it must never consume live AI mention/citation results.

Fixed page length, mandatory FAQ counts, question-heading ratios, `llms.txt`, and special AI markup are not scored as Google generative Search requirements. Structured data remains useful for ordinary Search features but is not required for AI Overviews or AI Mode.

### Check scoring

Each check has:

`check_key`, `methodology_version`, `subject_url/entity`, `status`, `points_available`, `points_awarded`, `evidence`, `observed_at`, `source`, `freshness`, `affected_pages`, `recommendation`, `priority`, `expected_direction`, and `limitation`.

Rules:

- `not_applicable` is removed from the denominator and explained.
- `unavailable` never silently receives zero; the component displays coverage.
- A site score displays component scores and coverage, not just the total.
- A score change is comparable only when methodology/version and material site scope are compatible; otherwise show a re-baselined marker.
- Expected impact is directional (`likely improves clarity/crawlability`), never a promised mention/rank.

### Demo product audit

The current `product-readiness-v2` demo assigns five people-first completeness checks and maps pass/warning/fail to points without imposing a fixed description length. It is useful for the vertical slice but is not the final store methodology. Production must replace hard-coded timestamps/evidence with actual page/source observations and versioned check configuration.

## 5. Observed query protocol

### Query definition

Before scheduling a check, store:

- exact query text (no silent rewriting);
- query intent/topic and merchant-provided priority;
- language and script;
- country and city when relevant;
- provider and product surface;
- device/account/personalization context when relevant and supported;
- execution method and capability version;
- cadence, start/end, and active state;
- competitor set and merchant entity aliases used for matching.

Arabic variants should be separate queries when wording changes intent or likely behavior; do not average dialect, Modern Standard Arabic, and English without showing the breakdown.

### Provider capability states

Each adapter implements conceptually:

```text
checkQuery(input) -> result
supportsCountry(country)
supportsLanguage(language)
getCapabilities() -> {
  method, automation, citations, answerCapture,
  locationControl, personalizationControl,
  termsReviewedAt, status, limitations
}
```

Runtime status:

- `supported_verified`: official/licensed method tested and approved for this release;
- `manual_supported`: merchant/operator can record a guided observation with evidence;
- `assisted_pending_review`: technically possible but legal/terms/security approval is incomplete;
- `unavailable`: no acceptable method/capability;
- `degraded`: normally supported but failed/limited at check time.

Only `supported_verified` may run unattended. A generic model API response must not be labeled as the consumer product’s observed result unless official product documentation establishes equivalence.

### Check record

Every attempt, including failure, records:

```text
check_id, store_id, query_id, provider, surface,
query_text_hash + encrypted/authorized text reference,
language, country, city/context,
method, method_version, account/personalization state,
requested_at, started_at, observed_at, completed_at,
capability_status, result_status, failure_class,
answer_summary, evidence_artifact_ref/checksum,
mentions[], citations[], competitors[],
review_status, reviewer, confidence, limitations
```

If the full response cannot be stored due to terms/licensing, store the permitted evidence/summary and state the limitation. Do not reconstruct missing answers.

### Repetition and volatility

AI answers are non-deterministic and can vary by time, account, model, location, and experimentation. For validated automated providers, configure repeated samples per query/window and report:

- checks attempted/valid/failed/unavailable;
- mention frequency across valid checks;
- citation frequency and unique cited domains;
- first/last observed date and volatility;
- exact methodology/context.

One check is an observation, not a stable ranking. Cadence must respect provider limits, terms, cost, and statistical usefulness.

## 6. Observed metrics

Use valid checks only; always display numerator, denominator, window, and coverage.

### Merchant mention coverage

`queries with ≥1 reviewed merchant mention / queries with ≥1 valid check`

This is query coverage, not “share of voice.” Weighting by merchant priority may appear as a separate, explicitly weighted metric.

### Mention frequency

`valid checks containing reviewed merchant mention / all valid checks`

Useful when queries have repeated samples.

### Citation coverage

`valid checks citing a merchant-controlled URL / all valid checks`

Also show third-party citations about the merchant separately. A citation is not automatically positive or authoritative.

### Competitor share of observed mentions

For a fixed query/provider/context set:

`entity mention observations / total reviewed merchant + configured competitor mention observations`

Because an answer can mention several entities, label this “share of observed mentions,” not position/rank. Provide the entity set and multi-mention rule.

### Gap count

A merchant gap exists when a valid check lacks the merchant while at least one reviewed competitor appears. Report query count and sample evidence. Do not treat unavailable/failed checks as gaps.

### Prominence/position

Record only where the provider surface exposes a stable, reproducible ordering. Possible values include first named entity, list ordinal, heading inclusion, or answer-body prominence. Provider-specific prominence is not compared across platforms as a universal rank.

### Sentiment/association

Classify the immediate context as positive/neutral/negative/mixed and extract associated topics/products using a versioned model plus review sampling. This is an inference with confidence, not a provider-provided fact.

## 7. Confidence and review

Confidence is attached to an individual extracted mention/citation/association, not used to imply platform predictability.

| Level | Criteria |
| --- | --- |
| High | Exact entity/domain match, preserved evidence, supported method, clear context, schema validation |
| Medium | Strong contextual alias/product match or partial evidence; review recommended |
| Low | Ambiguous name, incomplete capture, inferred association; excluded from headline metrics until reviewed |

Automated entity/citation extraction must be evaluated against a multilingual human-labeled set. Track precision/recall by Arabic/English, provider, entity type, and ambiguity class. Reviewer corrections feed evaluation data, not automatic truth changes without version/audit.

## 8. Reporting rules

Every dashboard/report shows:

- readiness methodology version and audit coverage;
- observed method/provider capability and terms-review date;
- date/time, locale, country/context, and sample sizes;
- valid, failed, unavailable, and manually verified counts;
- mention and citation numerators/denominators;
- entity match/review state and confidence;
- comparison compatibility and any re-baseline;
- limitations and no-guarantee statement.

Prohibited claims:

- “Your store ranks #1 in AI” without a stable provider-specific ordered result and exact context.
- “This optimization caused visibility growth” without an appropriate causal design.
- “Not visible” when checks were unavailable, failed, or covered only another locale/context.
- “AI visibility score” that secretly combines readiness and observed mentions into one unexplained value.

### Recommended summary UI

Use a two-axis summary:

1. **Readiness: 0–100** with seven visible components and audit coverage.
2. **Observed evidence:** `mentioned in X/Y valid queries`, `cited in A/B valid checks`, providers covered, and unavailable checks.

If stakeholders insist on an “overall” indicator, it may be a non-numeric maturity band (`Foundation`, `Discoverable`, `Observed`, `Consistent`) whose rules remain transparent. It must not replace either underlying family.

## 9. First-party conversations to visibility opportunity

This is the product differentiator, but it still requires evidence separation:

1. Aggregate recurring, consent-permitted customer questions above a privacy cohort threshold.
2. Link the question to verified product/store facts and relevant public pages.
3. Run answerability/readiness checks on those pages.
4. Create an opportunity only when demand and a factual content gap both have evidence.
5. Draft content from verified facts; cite missing facts instead of filling them.
6. Merchant approves and publishes through the controlled action workflow.
7. Record readiness changes after publication.
8. Observe later mention/citation results separately; describe correlation only unless an experiment/causal method supports more.

Example structure:

> Observation: 184 consented conversations asked about perfume longevity in 30 days. Four relevant product pages lack verified concentration, use, and storage guidance. Recommended action: add a source-backed FAQ and comparison guide. Expected direction: higher answerability. This does not guarantee a platform mention or citation.

## 10. Content and technical recommendations

Recommendations are prioritized using:

- severity and breadth of the readiness failure;
- verified first-party demand and affected revenue funnel;
- number/importance of affected pages/queries;
- implementation effort and reversibility;
- evidence confidence and freshness;
- safety/claim risk.

“Estimated impact” is a transparent directional or range-based heuristic with assumptions. It is not projected revenue or ranking unless a validated model supports that label.

## 11. Data quality and anti-gaming

- Detect duplicate/canonical-equivalent queries and URLs while preserving original input.
- Freeze the monitored query set for period comparisons or disclose additions/removals.
- Prevent cherry-picking by showing all configured queries and invalid/unavailable checks.
- Preserve immutable evidence references and checksums, subject to provider retention terms.
- Normalize URLs carefully (scheme/host case, safe tracking-parameter policy) without merging different pages incorrectly.
- Review alias/entity changes and backfill only through versioned recomputation.
- Do not encourage keyword stuffing, fake reviews, mass low-quality pages, fabricated citations, or unsupported schema.

## 12. Validation plan

Before any provider is labeled automated/verified:

1. Confirm official/licensed access method, terms, rate/cost, storage, and display constraints with dated links/approval.
2. Test country/language/context behavior and failure modes.
3. Capture a repeatable fixture without secrets/personalization leakage.
4. Validate mention/entity/citation extraction against bilingual human labels.
5. Prove unavailable/failed checks do not enter denominators as negative observations.
6. Verify repeated-check idempotency, scheduling limits, evidence retention, and provider shutdown.
7. Complete security/privacy/legal review.

Until then, provider status is manual or unavailable and the product must say so plainly.
