# Launch verification — 2026-07-17

This document records the launch evidence for the public Basirah website checker and free-report journey. It separates results that were verified against live public websites from integrations that still require external accounts or production infrastructure.

## Launch decision

The public lead-generation journey is ready for a controlled launch in demo or staging mode:

1. A visitor enters a public store domain without creating an account.
2. Basirah scans up to 10 public pages with bounded, SSRF-protected crawling.
3. The visitor receives a free readiness preview with score, coverage, confidence, findings, and measurement limitations.
4. An email unlocks the full private report. Marketing consent remains optional and unchecked by default.
5. The full report shows page evidence, fixes, a 30/60/90 plan, keyword opportunities, product-page SEO work, four content formats, and Search Console connection guidance.
6. The visitor can download the same evidence as a seven-page executive PDF.

The merchant-connected product is not yet externally launchable because no Salla developer account, development store, or production credentials are available. Search Console metrics also remain explicitly `not_connected` until a merchant authorizes a property. Paid checkout is not claimed as working. These are account and infrastructure gates, not fabricated demo results.

## Real-site results

All scans below were performed against live public pages. The scanner does not invent search volume, keyword difficulty, product pages, Search Console clicks, or observed ChatGPT/Gemini visibility.

| Website | Score | Coverage / confidence | Unique pages | Confirmed products | Findings | PDF |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| zahraa-sa.com | 82 | 79% / 79% | 10 | 2 | 2 | 200, 42,361 bytes |
| perfumesdreams.com | 85 | 41% / 41% | 10 | 5 prioritized from 8 product pages | 2 | 200, 41,163 bytes |
| freesiabloom.com | 80 | 95% / 95% | 10 | 0 in the sampled pages | 3 | 200, 41,814 bytes |
| casa.com.sa/ar | 82 | 95% / 95% | 10 | 4 | 2 | 200, 41,253 bytes |
| rawbeauty.shop | 61 | 7% / 4% | 2 | 0 in the unique-page sample | 5 | 200, 42,345 bytes |

The low Raw Beauty coverage is a real result: multiple discovered URLs redirected to the same home page, so the crawler counted two unique final pages instead of inflating the report to ten. Freesia Bloom and Raw Beauty correctly show that no product-specific recommendation can be made from the sampled pages.

Machine-readable evidence:

- [`run-summary.json`](../output/reports/real-sites/run-summary.json)
- [`zahraa-sa-com.json`](../output/reports/real-sites/zahraa-sa-com.json)
- [`perfumesdreams-com.json`](../output/reports/real-sites/perfumesdreams-com.json)
- [`freesiabloom-com.json`](../output/reports/real-sites/freesiabloom-com.json)
- [`casa-com-sa.json`](../output/reports/real-sites/casa-com-sa.json)
- [`rawbeauty-shop.json`](../output/reports/real-sites/rawbeauty-shop.json)

Rendered customer PDFs:

- [`zahraa-sa-com.pdf`](../output/pdf/real-sites/zahraa-sa-com.pdf)
- [`perfumesdreams-com.pdf`](../output/pdf/real-sites/perfumesdreams-com.pdf)
- [`freesiabloom-com.pdf`](../output/pdf/real-sites/freesiabloom-com.pdf)
- [`casa-com-sa.pdf`](../output/pdf/real-sites/casa-com-sa.pdf)
- [`rawbeauty-shop.pdf`](../output/pdf/real-sites/rawbeauty-shop.pdf)

## What every free full report contains

### Evidence and fixes

- The actual sampled page URL, page type, title, H1, meta-description state, word count, and detected structured-data types.
- Deterministic findings with severity, source evidence, affected URL, and a concrete remediation.
- Coverage and confidence separate from the readiness score.
- Google discovery and observed AI visibility shown as unverified or unmeasured when the necessary provider data is unavailable.

### 30/60/90 execution plan

- First 30 days: repair critical technical, metadata, entity, and product-evidence gaps identified in the scan.
- Days 31–60: publish evidence-grounded product/category improvements and supporting content.
- Days 61–90: connect measurement, validate indexed pages and queries, and iterate from real Search Console data.

### Keyword and product SEO plan

- Keyword candidates are derived from the page title, H1, URL, and confirmed page type.
- Intent is labelled as transactional, commercial, informational, or navigational.
- Every candidate includes its target URL and the evidence used to choose it.
- Confirmed product pages receive product-specific title, H1, description, Product/Offer schema, price, availability, brand, SKU, image, canonical, and internal-link recommendations.
- When no product page is confirmed, the report says so instead of inventing a product recommendation.
- Search volume and difficulty are deliberately absent until a real keyword-data provider is connected.

### Content plan

Every report proposes four formats tied to the store's detected topics:

1. Buying guide — helps a shopper choose a product or category using verified attributes.
2. Comparison — compares decision criteria without unsupported superiority claims.
3. How-to — explains usage, selection, care, or setup from known facts.
4. FAQ — answers recurring pre-purchase questions and can support valid FAQ markup where appropriate.

Draft production remains evidence-gated: missing price, stock, benefit, or policy facts must be supplied or connected before publication.

### Search Console connection and data state

Each report creates the expected domain property, for example `sc-domain:casa.com.sa`, and includes direct links to Search Console and official setup guidance:

- [Open Google Search Console](https://search.google.com/search-console)
- [Add or verify a property](https://support.google.com/webmasters/answer/34592)
- [Understand the Performance report](https://support.google.com/webmasters/answer/7576553)
- [Submit a sitemap](https://support.google.com/webmasters/answer/7451001)

Until authorization exists, clicks, impressions, CTR, position, queries, and pages remain `null` with status `not_connected`. The interface explicitly says that unconnected data is not zero.

## End-to-end browser verification

A fresh Casa scan was run through the visible Arabic journey on 2026-07-17:

- Domain submission reached the queued/progress view and completed with score 82, coverage 95%, confidence 95%, 10 pages, and two findings.
- The free preview correctly distinguished readiness, Google discovery, and measured visibility.
- A new email unlocked the private full report while marketing consent remained unchecked.
- The full report rendered the 10-page evidence table, product SEO section, four content types, Search Console state, fixes, and 30/60/90 plan.
- At a 390 × 844 viewport, the document width stayed within the viewport and the evidence table remained horizontally scrollable inside its container.
- Browser console result: zero warnings and zero errors.
- The report PDF endpoint returned HTTP 200, `application/pdf`, 41,565 bytes, and `%PDF-` file magic.

All five saved real-site PDFs were rendered into page images and visually inspected. Each has four pages and includes the growth plan and Search Console state. The final PDFs contain no reversed `Product`, `Offer`, `robots.txt`, or `sitemap.xml` technical labels in mixed Arabic text.

## Reliability fixes verified during live testing

- A bad sitemap, redirect loop, oversized resource, DNS failure, or disallowed public page is handled as a recoverable per-resource failure when safe; one bad URL no longer aborts the whole scan.
- Private-address and SSRF protections still fail closed.
- Redirected pages are deduplicated by their sanitized final URL.
- Sitemap sampling prioritizes a useful mix of product, category, and article pages before generic pages.
- Salla `/p...` and `/c...` patterns, page-local titles, Product schema, and policy paths are classified separately.
- Product pages are not misclassified because their footer contains policy links.
- PDF routes embed an Arabic-capable default font and no longer depend on PDFKit's unavailable virtual Helvetica AFM path.

## External gates before a connected production launch

The following require accounts, credentials, infrastructure, or review that are outside this repository:

1. Create the Salla developer account and development store; obtain OAuth, webhook, Embedded SDK, and marketplace credentials.
2. Run the documented real-store lifecycle: install, authorize, signed webhook intake, token refresh, product pagination, reconciliation, uninstall, and re-install.
3. Provision PostgreSQL/Supabase, Redis and workers, object storage, production secrets, HTTPS `APP_URL`, monitoring, backups, and alerting.
4. Connect a verified Google Search Console property and validate queries, pages, clicks, impressions, CTR, and average position with real data.
5. Choose and connect a payment provider before presenting paid checkout as available.
6. Complete privacy, terms, Saudi PDPL, retention, subprocessors, support, and marketplace reviews.

Until those gates pass, launch the free checker/report as a controlled lead-generation product and keep merchant sync, measured Search Console performance, and paid activation explicitly unavailable or waitlisted.
