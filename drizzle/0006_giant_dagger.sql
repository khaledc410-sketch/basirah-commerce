CREATE TYPE "public"."prospect_scan_status" AS ENUM('queued', 'running', 'completed', 'failed', 'expired');--> statement-breakpoint
CREATE TYPE "public"."provider_capability_state" AS ENUM('manual', 'verified', 'unavailable', 'degraded', 'pending_verification');--> statement-breakpoint
CREATE TYPE "public"."report_access_level" AS ENUM('preview', 'full');--> statement-breakpoint
CREATE TYPE "public"."report_order_status" AS ENUM('pending_payment', 'paid', 'fulfilled', 'cancelled', 'refunded');--> statement-breakpoint
CREATE TABLE "lead_consents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid NOT NULL,
	"report_order_id" uuid,
	"email_hash" text NOT NULL,
	"marketing_granted" boolean DEFAULT false NOT NULL,
	"source" text NOT NULL,
	"captured_at" timestamp with time zone DEFAULT now() NOT NULL,
	"withdrawn_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prospect_report_access" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_id" uuid NOT NULL,
	"access_level" "report_access_level" NOT NULL,
	"grantee_email_hash" text,
	"user_id" uuid,
	"grantee_store_id" uuid,
	"granted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "prospect_report_access_has_grantee" CHECK (num_nonnulls("prospect_report_access"."grantee_email_hash", "prospect_report_access"."user_id", "prospect_report_access"."grantee_store_id") >= 1)
);
--> statement-breakpoint
CREATE TABLE "prospect_report_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid NOT NULL,
	"run_id" uuid NOT NULL,
	"share_token_hash" text NOT NULL,
	"access_level" "report_access_level" DEFAULT 'preview' NOT NULL,
	"overall_score" integer NOT NULL,
	"coverage_bps" integer NOT NULL,
	"confidence_bps" integer NOT NULL,
	"methodology_version" text NOT NULL,
	"components" jsonb NOT NULL,
	"executive_summary" jsonb NOT NULL,
	"narrative_markdown" text,
	"model_id" text,
	"prompt_version" text,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "prospect_report_snapshots_scores_range" CHECK ("prospect_report_snapshots"."overall_score" between 0 and 100 and "prospect_report_snapshots"."coverage_bps" between 0 and 10000 and "prospect_report_snapshots"."confidence_bps" between 0 and 10000),
	CONSTRAINT "prospect_report_snapshots_expiry_after_generation" CHECK ("prospect_report_snapshots"."expires_at" > "prospect_report_snapshots"."generated_at")
);
--> statement-breakpoint
CREATE TABLE "prospect_scan_evidence" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_id" uuid NOT NULL,
	"page_id" uuid,
	"category" text NOT NULL,
	"key" text NOT NULL,
	"status" text NOT NULL,
	"value" jsonb NOT NULL,
	"source_url" text,
	"checksum" text,
	"captured_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "prospect_scan_evidence_status_valid" CHECK ("prospect_scan_evidence"."status" in ('pass', 'warning', 'fail', 'unknown'))
);
--> statement-breakpoint
CREATE TABLE "prospect_scan_findings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_id" uuid NOT NULL,
	"page_id" uuid,
	"code" text NOT NULL,
	"category" text NOT NULL,
	"severity" "priority" NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"evidence" jsonb NOT NULL,
	"recommended_fix" text NOT NULL,
	"confidence_bps" integer NOT NULL,
	"effort" text NOT NULL,
	"suggested_owner" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "prospect_scan_findings_confidence_range" CHECK ("prospect_scan_findings"."confidence_bps" between 0 and 10000),
	CONSTRAINT "prospect_scan_findings_effort_valid" CHECK ("prospect_scan_findings"."effort" in ('low', 'medium', 'high'))
);
--> statement-breakpoint
CREATE TABLE "prospect_scan_pages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_id" uuid NOT NULL,
	"url" text NOT NULL,
	"canonical_url" text,
	"http_status" integer,
	"content_type" text,
	"title" text,
	"detected_locale" text,
	"content_hash" text,
	"bytes_read" integer DEFAULT 0 NOT NULL,
	"duration_ms" integer,
	"evidence" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"fetched_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "prospect_scan_pages_bytes_nonnegative" CHECK ("prospect_scan_pages"."bytes_read" >= 0),
	CONSTRAINT "prospect_scan_pages_duration_nonnegative" CHECK ("prospect_scan_pages"."duration_ms" is null or "prospect_scan_pages"."duration_ms" >= 0)
);
--> statement-breakpoint
CREATE TABLE "prospect_scan_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token_hash" text NOT NULL,
	"normalized_url" text NOT NULL,
	"domain" text NOT NULL,
	"locale" "content_locale" DEFAULT 'ar' NOT NULL,
	"country_code" text DEFAULT 'SA' NOT NULL,
	"max_pages" integer DEFAULT 10 NOT NULL,
	"requested_ip_hash" text,
	"status" "prospect_scan_status" DEFAULT 'queued' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"claimed_store_id" uuid,
	"claimed_by_user_id" uuid,
	"claimed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "prospect_scan_requests_country_length" CHECK (char_length("prospect_scan_requests"."country_code") = 2),
	CONSTRAINT "prospect_scan_requests_page_limit" CHECK ("prospect_scan_requests"."max_pages" between 1 and 100),
	CONSTRAINT "prospect_scan_requests_expiry_after_creation" CHECK ("prospect_scan_requests"."expires_at" > "prospect_scan_requests"."created_at"),
	CONSTRAINT "prospect_scan_requests_claim_consistent" CHECK (num_nonnulls("prospect_scan_requests"."claimed_store_id", "prospect_scan_requests"."claimed_by_user_id", "prospect_scan_requests"."claimed_at") in (0, 3))
);
--> statement-breakpoint
CREATE TABLE "prospect_scan_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid NOT NULL,
	"status" "prospect_scan_status" DEFAULT 'queued' NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"current_step" text DEFAULT 'queued' NOT NULL,
	"methodology_version" text NOT NULL,
	"pages_discovered" integer DEFAULT 0 NOT NULL,
	"pages_scanned" integer DEFAULT 0 NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"error_code" text,
	"error_message" text,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "prospect_scan_runs_progress_range" CHECK ("prospect_scan_runs"."progress" between 0 and 100),
	CONSTRAINT "prospect_scan_runs_page_counts" CHECK ("prospect_scan_runs"."pages_discovered" >= 0 and "prospect_scan_runs"."pages_scanned" >= 0 and "prospect_scan_runs"."pages_scanned" <= "prospect_scan_runs"."pages_discovered")
);
--> statement-breakpoint
CREATE TABLE "provider_capabilities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" text NOT NULL,
	"surface" text NOT NULL,
	"method" text NOT NULL,
	"state" "provider_capability_state" DEFAULT 'pending_verification' NOT NULL,
	"automated" boolean DEFAULT false NOT NULL,
	"supported_locales" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"supported_countries" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"evidence_url" text,
	"limitations" text NOT NULL,
	"reviewed_by" text,
	"verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "report_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_id" uuid NOT NULL,
	"status" "report_order_status" DEFAULT 'pending_payment' NOT NULL,
	"amount_minor" integer DEFAULT 39900 NOT NULL,
	"currency" text DEFAULT 'SAR' NOT NULL,
	"buyer_name_encrypted" text NOT NULL,
	"buyer_email_encrypted" text NOT NULL,
	"buyer_phone_encrypted" text NOT NULL,
	"payment_reference" text,
	"paid_at" timestamp with time zone,
	"fulfilled_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "report_orders_amount_positive" CHECK ("report_orders"."amount_minor" > 0),
	CONSTRAINT "report_orders_currency_length" CHECK (char_length("report_orders"."currency") = 3)
);
--> statement-breakpoint
ALTER TABLE "lead_consents" ADD CONSTRAINT "lead_consents_request_id_prospect_scan_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."prospect_scan_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_consents" ADD CONSTRAINT "lead_consents_report_order_id_report_orders_id_fk" FOREIGN KEY ("report_order_id") REFERENCES "public"."report_orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prospect_report_access" ADD CONSTRAINT "prospect_report_access_report_id_prospect_report_snapshots_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."prospect_report_snapshots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prospect_report_access" ADD CONSTRAINT "prospect_report_access_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prospect_report_access" ADD CONSTRAINT "prospect_report_access_grantee_store_id_stores_id_fk" FOREIGN KEY ("grantee_store_id") REFERENCES "public"."stores"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prospect_report_snapshots" ADD CONSTRAINT "prospect_report_snapshots_request_id_prospect_scan_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."prospect_scan_requests"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prospect_report_snapshots" ADD CONSTRAINT "prospect_report_snapshots_run_id_prospect_scan_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."prospect_scan_runs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prospect_scan_evidence" ADD CONSTRAINT "prospect_scan_evidence_run_id_prospect_scan_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."prospect_scan_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prospect_scan_evidence" ADD CONSTRAINT "prospect_scan_evidence_page_id_prospect_scan_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."prospect_scan_pages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prospect_scan_findings" ADD CONSTRAINT "prospect_scan_findings_run_id_prospect_scan_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."prospect_scan_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prospect_scan_findings" ADD CONSTRAINT "prospect_scan_findings_page_id_prospect_scan_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."prospect_scan_pages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prospect_scan_pages" ADD CONSTRAINT "prospect_scan_pages_run_id_prospect_scan_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."prospect_scan_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prospect_scan_requests" ADD CONSTRAINT "prospect_scan_requests_claimed_store_id_stores_id_fk" FOREIGN KEY ("claimed_store_id") REFERENCES "public"."stores"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prospect_scan_requests" ADD CONSTRAINT "prospect_scan_requests_claimed_by_user_id_users_id_fk" FOREIGN KEY ("claimed_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prospect_scan_runs" ADD CONSTRAINT "prospect_scan_runs_request_id_prospect_scan_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."prospect_scan_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_orders" ADD CONSTRAINT "report_orders_report_id_prospect_report_snapshots_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."prospect_report_snapshots"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "lead_consents_request_idx" ON "lead_consents" USING btree ("request_id","captured_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "lead_consents_email_idx" ON "lead_consents" USING btree ("email_hash");--> statement-breakpoint
CREATE INDEX "prospect_report_access_report_idx" ON "prospect_report_access" USING btree ("report_id","revoked_at");--> statement-breakpoint
CREATE INDEX "prospect_report_access_user_idx" ON "prospect_report_access" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "prospect_report_access_store_idx" ON "prospect_report_access" USING btree ("grantee_store_id");--> statement-breakpoint
CREATE UNIQUE INDEX "prospect_report_snapshots_share_token_unique" ON "prospect_report_snapshots" USING btree ("share_token_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "prospect_report_snapshots_run_unique" ON "prospect_report_snapshots" USING btree ("run_id");--> statement-breakpoint
CREATE INDEX "prospect_report_snapshots_request_idx" ON "prospect_report_snapshots" USING btree ("request_id","generated_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "prospect_scan_evidence_run_category_idx" ON "prospect_scan_evidence" USING btree ("run_id","category");--> statement-breakpoint
CREATE INDEX "prospect_scan_evidence_page_idx" ON "prospect_scan_evidence" USING btree ("page_id");--> statement-breakpoint
CREATE UNIQUE INDEX "prospect_scan_findings_run_code_page_unique" ON "prospect_scan_findings" USING btree ("run_id","code","page_id");--> statement-breakpoint
CREATE INDEX "prospect_scan_findings_run_severity_idx" ON "prospect_scan_findings" USING btree ("run_id","severity");--> statement-breakpoint
CREATE INDEX "prospect_scan_findings_page_idx" ON "prospect_scan_findings" USING btree ("page_id");--> statement-breakpoint
CREATE UNIQUE INDEX "prospect_scan_pages_run_url_unique" ON "prospect_scan_pages" USING btree ("run_id","url");--> statement-breakpoint
CREATE INDEX "prospect_scan_pages_run_status_idx" ON "prospect_scan_pages" USING btree ("run_id","http_status");--> statement-breakpoint
CREATE UNIQUE INDEX "prospect_scan_requests_token_hash_unique" ON "prospect_scan_requests" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "prospect_scan_requests_domain_created_idx" ON "prospect_scan_requests" USING btree ("domain","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "prospect_scan_requests_status_expiry_idx" ON "prospect_scan_requests" USING btree ("status","expires_at");--> statement-breakpoint
CREATE INDEX "prospect_scan_requests_claimed_store_idx" ON "prospect_scan_requests" USING btree ("claimed_store_id");--> statement-breakpoint
CREATE INDEX "prospect_scan_runs_request_created_idx" ON "prospect_scan_runs" USING btree ("request_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "prospect_scan_runs_status_created_idx" ON "prospect_scan_runs" USING btree ("status","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "provider_capabilities_provider_surface_method_unique" ON "provider_capabilities" USING btree ("provider","surface","method");--> statement-breakpoint
CREATE INDEX "provider_capabilities_state_idx" ON "provider_capabilities" USING btree ("state","provider");--> statement-breakpoint
CREATE INDEX "report_orders_report_status_idx" ON "report_orders" USING btree ("report_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "report_orders_payment_reference_unique" ON "report_orders" USING btree ("payment_reference") WHERE "report_orders"."payment_reference" is not null;
--> statement-breakpoint
-- Anonymous acquisition data is exposed only through rate-limited server DTOs.
DO $$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'prospect_scan_requests',
    'prospect_scan_runs',
    'prospect_scan_pages',
    'prospect_scan_evidence',
    'prospect_scan_findings',
    'prospect_report_snapshots',
    'prospect_report_access',
    'report_orders',
    'lead_consents',
    'provider_capabilities'
  ]
  LOOP
    EXECUTE format('REVOKE ALL PRIVILEGES ON TABLE public.%I FROM PUBLIC, anon, authenticated', table_name);
    EXECUTE format('GRANT ALL PRIVILEGES ON TABLE public.%I TO service_role', table_name);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', table_name);
  END LOOP;
END
$$;
