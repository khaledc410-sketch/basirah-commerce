# Basirah deployment and launch checklist

**Status:** the repository is deployable, but a client launch is not approved until the external gates at the end of this document are completed with real staging evidence.

## Runtime topology

Deploy three processes from the same immutable commit:

1. Web: `npm run build` then `npm start`.
2. Visibility-scan worker: `npm run worker:visibility` as a continuously running Node process.
3. Catalog worker: `npm run worker:catalog` as a continuously running Node process.

Both require the same PostgreSQL, Redis, token-encryption, and Salla secrets. Only the web process receives public Supabase values. Never expose `DATABASE_URL`, `REDIS_URL`, Salla secrets, or `TOKEN_ENCRYPTION_KEY` to browser-prefixed variables.

The public web origin must be reached through Vercel's edge. Abuse controls trust only Vercel's overwritten `x-vercel-forwarded-for` value when the edge marker is present; direct/self-hosted traffic falls into one fail-closed rate-limit bucket. If the hosting boundary changes, add and test an equivalent trusted-proxy contract before accepting public traffic—do not restore generic `x-forwarded-for`, `x-real-ip`, or CDN-header fallbacks.

## Required production environment

```text
APP_MODE=production
APP_URL=https://your-production-domain.example
DATABASE_URL=postgresql://...
REDIS_URL=rediss://...
TOKEN_ENCRYPTION_KEY=<managed secret, at least 32 random characters>
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable key, never service_role>
SALLA_AUTH_MODE=easy
SALLA_APP_ID=...
SALLA_CLIENT_ID=...
SALLA_CLIENT_SECRET=...
SALLA_WEBHOOK_SECRET=...
```

Custom/private Salla testing additionally requires `SALLA_AUTH_MODE=custom` and the exact HTTPS `SALLA_REDIRECT_URI=https://.../api/oauth/salla/callback` registered in Partners.

`DATABASE_URL` is a privileged system/worker credential and may bypass RLS. It is used only by trusted jobs and narrowly authorized server mutations carrying explicit store IDs. Normal merchant reads use the request-scoped authenticated Supabase client so database RLS applies.

## Supabase setup

1. Create separate staging and production projects.
2. Add the production site URL and `https://<domain>/auth/callback` to Auth redirect allow-lists.
3. Keep the default confirmation-link email template for the PKCE callback, or deliberately configure the token-hash fallback at `/auth/confirm`; test the chosen template on a real inbox.
4. Configure email delivery, sender authentication, bounce handling, and abuse limits.
5. Run all migrations in order:

   ```bash
   npm run db:migrate
   ```

6. Confirm migrations `0000` through `0008` are recorded. Migration `0003` links profiles to `auth.users` and forces RLS; `0005` protects pending Easy Mode credentials; `0007` adds atomic authorization-event freshness guards; `0008` adds hashed, service-only Salla binding claims.
7. With real JWTs, prove an owner can read its own catalog, another tenant cannot, a disabled member cannot, and browser roles cannot read token, OAuth, webhook, outbox, pending-authorization, or binding-claim tables.

## Salla Partners setup

- Easy Mode install URL is derived from `SALLA_APP_ID`.
- Configure the webhook endpoint as `https://<domain>/api/webhooks/salla` with the Signature strategy and the exact webhook secret stored in `SALLA_WEBHOOK_SECRET`.
- Configure the Salla iframe/embedded page URL as `https://<domain>/salla/embedded`. The iframe keeps Salla's short-lived token in browser memory, verifies it through the same-origin backend, and opens a one-time top-level continuation at `/salla/continue#claim=...`.
- Redact query strings for `/salla/embedded` in CDN, load-balancer, hosting, APM, and error-monitoring access logs. Salla's initial iframe request can contain its short-lived token before client-side history replacement runs; do not treat browser stripping as edge-log redaction.
- The continuation page removes the fragment before any network call, exchanges the claim through a same-origin JSON `POST`, and stores only a ten-minute `HttpOnly`, `Secure`, host-only, `SameSite=Lax` cookie. The owner/admin bind endpoint rechecks the claimed merchant against the pending credentials, `/store/info`, and `/oauth2/user/info`; the authorizing Salla user must match the embedded user. Claim consumption, connection binding, and pending-authorization consumption share one transaction and refuse cross-workspace or different-store replacement.
- Request only the read scopes required for store, products, categories, and offline refresh. Do not request product writes, orders, or customer data for this release.
- Record redacted fixtures and delivery IDs from a Salla development store. The checked-in fixtures are synthetic documentation shapes and are not acceptance evidence.

The binding cookie uses the `__Host-` prefix and therefore remains `Secure` in every environment. Local browser verification must use a browser that treats `localhost` as a secure context (current mainstream browsers do), or a local HTTPS origin; do not weaken the cookie scope for development.

## Release sequence

1. Back up staging, apply migrations, and run `npm run verify`.
2. Deploy both workers and confirm the catalog worker's Redis heartbeat.
3. Deploy web from the same commit.
4. Check `/api/health`: core `status` and catalog `commerceStatus` must both be `ok` for a Salla client launch.
5. Open the app inside the Salla development store, verify Embedded SDK init/ready/refresh behavior, continue in the top-level window, sign in through the production email link, create a workspace if needed, and bind the same merchant as owner/admin.
6. Confirm the run moves through store → categories → products using real counts, then compare a sample of prices, stock, variants, media, bilingual titles, and deleted/hidden products against Salla.
7. Repeat a reconciliation, simulate a retryable rate limit, rotate a token, and uninstall while a multi-page sync is active. Confirm the credentials are destroyed, active jobs are cancelled, stale pages cannot commit, and no demo number appears in production.
8. Run accessibility, mobile, browser-console, CSP, security-header, cross-tenant, and backup/restore checks.

## Rollback and incident controls

- Roll web and worker back together to the previous immutable artifact. Do not roll application code behind an already incompatible database migration.
- Database migrations are forward-only. Restore a tested backup or ship a reviewed corrective migration; never run destructive ad-hoc rollback commands.
- On suspected credential exposure, stop the worker, disable the Salla app/webhook, rotate application and encryption secrets, disconnect affected connections, preserve restricted audit evidence, and reconcile before re-enabling.
- Queue payloads contain no tokens. Failed jobs and webhook inbox rows must be monitored without logging raw bodies or credentials.

## External approval gates

Before accepting a paying client, obtain and archive:

- successful real Supabase and Salla staging evidence for the complete flow above;
- recorded browser evidence for the embedded iframe and top-level continuation across supported browsers, locale/theme combinations, expired/replayed claims, sign-in, and first-workspace creation;
- Salla marketplace approval and current scope/review confirmation;
- managed PostgreSQL/Redis, continuously deployed worker, alerts, backups, and restore drill;
- production DNS/TLS, transactional email, privacy/support pages, and Saudi PDPL/legal review;
- dependency/secret scanning and an independent security assessment with material findings resolved.

Zid, storefront widget publishing, AI advisor, billing, customer/order imports, and automatic content publication remain disabled until each has its own contract fixtures, safety controls, and release approval.
