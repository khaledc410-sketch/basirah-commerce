CREATE EXTENSION IF NOT EXISTS vector;--> statement-breakpoint
CREATE TYPE "public"."approval_decision" AS ENUM('pending', 'approved', 'rejected', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."attribution_type" AS ENUM('direct_ai_assisted', 'influenced');--> statement-breakpoint
CREATE TYPE "public"."billing_interval" AS ENUM('month', 'year');--> statement-breakpoint
CREATE TYPE "public"."capability_access" AS ENUM('unknown', 'available', 'limited', 'unavailable', 'pending_verification');--> statement-breakpoint
CREATE TYPE "public"."cart_status" AS ENUM('active', 'converted', 'abandoned', 'expired');--> statement-breakpoint
CREATE TYPE "public"."commerce_platform" AS ENUM('salla', 'zid');--> statement-breakpoint
CREATE TYPE "public"."connection_status" AS ENUM('pending', 'connected', 'degraded', 'revoked', 'disconnected');--> statement-breakpoint
CREATE TYPE "public"."consent_state" AS ENUM('unknown', 'granted', 'denied', 'not_required');--> statement-breakpoint
CREATE TYPE "public"."content_type" AS ENUM('product_title', 'product_description', 'faq', 'comparison', 'collection_description', 'about_page', 'shipping_page', 'return_page', 'metadata', 'structured_data', 'other');--> statement-breakpoint
CREATE TYPE "public"."conversation_status" AS ENUM('active', 'completed', 'abandoned', 'handed_off');--> statement-breakpoint
CREATE TYPE "public"."delivery_status" AS ENUM('pending', 'processing', 'delivered', 'failed', 'dead_letter');--> statement-breakpoint
CREATE TYPE "public"."document_kind" AS ENUM('faq', 'policy', 'manual', 'ingredient_sheet', 'size_guide', 'brand_guide', 'product_guide', 'store_page', 'other');--> statement-breakpoint
CREATE TYPE "public"."document_status" AS ENUM('uploaded', 'processing', 'ready', 'failed', 'archived');--> statement-breakpoint
CREATE TYPE "public"."draft_status" AS ENUM('draft', 'pending_approval', 'approved', 'rejected', 'published', 'superseded');--> statement-breakpoint
CREATE TYPE "public"."event_name" AS ENUM('widget_loaded', 'chat_opened', 'conversation_started', 'message_sent', 'intent_detected', 'recommendation_shown', 'product_clicked', 'product_viewed', 'product_compared', 'product_added_to_cart', 'checkout_started', 'purchase_completed', 'conversation_abandoned', 'human_handoff_requested', 'ai_answer_failed', 'visibility_check_started', 'visibility_check_completed', 'content_draft_created', 'content_change_approved', 'content_change_published');--> statement-breakpoint
CREATE TYPE "public"."fulfillment_status" AS ENUM('unfulfilled', 'partial', 'fulfilled', 'returned');--> statement-breakpoint
CREATE TYPE "public"."handoff_status" AS ENUM('open', 'assigned', 'resolved', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."insight_kind" AS ENUM('observation', 'inference', 'trend', 'anomaly');--> statement-breakpoint
CREATE TYPE "public"."job_status" AS ENUM('queued', 'running', 'succeeded', 'failed', 'cancelled', 'dead_letter');--> statement-breakpoint
CREATE TYPE "public"."content_locale" AS ENUM('ar', 'en');--> statement-breakpoint
CREATE TYPE "public"."message_role" AS ENUM('customer', 'assistant', 'merchant', 'system', 'tool');--> statement-breakpoint
CREATE TYPE "public"."opportunity_status" AS ENUM('open', 'in_progress', 'approved', 'dismissed', 'completed');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('pending', 'confirmed', 'processing', 'completed', 'cancelled', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."organization_role" AS ENUM('owner', 'admin', 'member');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'paid', 'partially_refunded', 'refunded', 'failed');--> statement-breakpoint
CREATE TYPE "public"."policy_type" AS ENUM('shipping', 'returns', 'refunds', 'warranty', 'privacy', 'terms', 'payment', 'other');--> statement-breakpoint
CREATE TYPE "public"."priority" AS ENUM('low', 'medium', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."product_status" AS ENUM('draft', 'active', 'out_of_stock', 'archived');--> statement-breakpoint
CREATE TYPE "public"."publication_status" AS ENUM('queued', 'running', 'succeeded', 'failed', 'rolled_back');--> statement-breakpoint
CREATE TYPE "public"."recommendation_status" AS ENUM('generated', 'shown', 'accepted', 'rejected', 'failed');--> statement-breakpoint
CREATE TYPE "public"."runtime_mode" AS ENUM('live', 'demo');--> statement-breakpoint
CREATE TYPE "public"."sentiment" AS ENUM('positive', 'neutral', 'negative', 'mixed', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."store_member_role" AS ENUM('owner', 'admin', 'analyst', 'support', 'viewer');--> statement-breakpoint
CREATE TYPE "public"."store_status" AS ENUM('onboarding', 'active', 'suspended', 'disconnected', 'archived');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('trialing', 'active', 'past_due', 'paused', 'cancelled', 'expired');--> statement-breakpoint
CREATE TYPE "public"."sync_kind" AS ENUM('initial', 'incremental', 'historical', 'reconciliation');--> statement-breakpoint
CREATE TYPE "public"."visibility_check_status" AS ENUM('queued', 'running', 'succeeded', 'unavailable', 'failed');--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"account_type" text NOT NULL,
	"access_token_encrypted" text,
	"refresh_token_encrypted" text,
	"token_key_version" integer,
	"token_expires_at" timestamp with time zone,
	"scopes" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_visibility_checks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"query_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"status" "visibility_check_status" DEFAULT 'queued' NOT NULL,
	"idempotency_key" text NOT NULL,
	"scheduled_for" timestamp with time zone NOT NULL,
	"checked_at" timestamp with time zone,
	"brand_mentioned" boolean,
	"answer_summary" text,
	"sentiment" "sentiment",
	"confidence_bps" integer,
	"prominence_bps" integer,
	"provider_method" text NOT NULL,
	"source_reference" text,
	"response_hash" text,
	"unavailable_reason" text,
	"error_code" text,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "visibility_checks_store_id_unique" UNIQUE("store_id","id"),
	CONSTRAINT "visibility_checks_scores_range" CHECK (
      ("ai_visibility_checks"."confidence_bps" is null or "ai_visibility_checks"."confidence_bps" between 0 and 10000)
      and ("ai_visibility_checks"."prominence_bps" is null or "ai_visibility_checks"."prominence_bps" between 0 and 10000)
    )
);
--> statement-breakpoint
CREATE TABLE "ai_visibility_citations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"check_id" uuid NOT NULL,
	"url" text NOT NULL,
	"domain" text NOT NULL,
	"title" text,
	"position" integer,
	"merchant_owned" boolean DEFAULT false NOT NULL,
	"accessible_at_check" boolean,
	"confidence_bps" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "visibility_citations_position_positive" CHECK ("ai_visibility_citations"."position" is null or "ai_visibility_citations"."position" > 0),
	CONSTRAINT "visibility_citations_confidence_range" CHECK ("ai_visibility_citations"."confidence_bps" between 0 and 10000)
);
--> statement-breakpoint
CREATE TABLE "ai_visibility_competitors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"name" text NOT NULL,
	"domain" text NOT NULL,
	"aliases" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "visibility_competitors_store_id_unique" UNIQUE("store_id","id")
);
--> statement-breakpoint
CREATE TABLE "ai_visibility_mentions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"check_id" uuid NOT NULL,
	"competitor_id" uuid,
	"product_id" uuid,
	"entity_type" text NOT NULL,
	"entity_name" text NOT NULL,
	"merchant_owned" boolean DEFAULT false NOT NULL,
	"position" integer,
	"prominence_bps" integer,
	"sentiment" "sentiment" DEFAULT 'unknown' NOT NULL,
	"confidence_bps" integer NOT NULL,
	"evidence_excerpt" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "visibility_mentions_position_positive" CHECK ("ai_visibility_mentions"."position" is null or "ai_visibility_mentions"."position" > 0),
	CONSTRAINT "visibility_mentions_scores_range" CHECK (
      "ai_visibility_mentions"."confidence_bps" between 0 and 10000
      and ("ai_visibility_mentions"."prominence_bps" is null or "ai_visibility_mentions"."prominence_bps" between 0 and 10000)
    )
);
--> statement-breakpoint
CREATE TABLE "ai_visibility_queries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"query" text NOT NULL,
	"locale" "content_locale" NOT NULL,
	"country_code" text DEFAULT 'SA' NOT NULL,
	"city" text,
	"device_context" text,
	"provider" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"check_cadence_hours" integer DEFAULT 168 NOT NULL,
	"next_check_at" timestamp with time zone,
	"created_by_store_member_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "visibility_queries_store_id_unique" UNIQUE("store_id","id"),
	CONSTRAINT "visibility_queries_country_code_length" CHECK (char_length("ai_visibility_queries"."country_code") = 2),
	CONSTRAINT "visibility_queries_cadence_positive" CHECK ("ai_visibility_queries"."check_cadence_hours" > 0)
);
--> statement-breakpoint
CREATE TABLE "ai_visibility_score_components" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"score_id" uuid NOT NULL,
	"component" text NOT NULL,
	"score" integer NOT NULL,
	"weight_bps" integer NOT NULL,
	"evidence" jsonb NOT NULL,
	"recommended_fix" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "visibility_score_components_ranges" CHECK ("ai_visibility_score_components"."score" between 0 and 100 and "ai_visibility_score_components"."weight_bps" between 0 and 10000)
);
--> statement-breakpoint
CREATE TABLE "ai_visibility_scores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"score_type" text NOT NULL,
	"overall_score" integer NOT NULL,
	"methodology_version" text NOT NULL,
	"evidence_count" integer DEFAULT 0 NOT NULL,
	"confidence_bps" integer NOT NULL,
	"explanation" text NOT NULL,
	"captured_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "visibility_scores_store_id_unique" UNIQUE("store_id","id"),
	CONSTRAINT "visibility_scores_ranges" CHECK (
      "ai_visibility_scores"."overall_score" between 0 and 100
      and "ai_visibility_scores"."confidence_bps" between 0 and 10000
      and "ai_visibility_scores"."evidence_count" >= 0
    )
);
--> statement-breakpoint
CREATE TABLE "attribution_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"name" text NOT NULL,
	"direct_window_hours" integer DEFAULT 24 NOT NULL,
	"influenced_window_hours" integer DEFAULT 168 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"effective_from" timestamp with time zone DEFAULT now() NOT NULL,
	"effective_until" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "attribution_rules_store_id_unique" UNIQUE("store_id","id"),
	CONSTRAINT "attribution_rules_windows_positive" CHECK ("attribution_rules"."direct_window_hours" > 0 and "attribution_rules"."influenced_window_hours" >= "attribution_rules"."direct_window_hours")
);
--> statement-breakpoint
CREATE TABLE "audit_findings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"page_audit_id" uuid,
	"product_audit_id" uuid,
	"code" text NOT NULL,
	"category" text NOT NULL,
	"severity" "priority" NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"evidence" jsonb NOT NULL,
	"recommended_fix" text NOT NULL,
	"confidence_bps" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "audit_findings_exactly_one_parent" CHECK (num_nonnulls("audit_findings"."page_audit_id", "audit_findings"."product_audit_id") = 1),
	CONSTRAINT "audit_findings_confidence_range" CHECK ("audit_findings"."confidence_bps" between 0 and 10000)
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"actor_user_id" uuid,
	"actor_store_member_id" uuid,
	"actor_type" text NOT NULL,
	"action" text NOT NULL,
	"resource_type" text NOT NULL,
	"resource_id" text,
	"request_id" text,
	"idempotency_key" text,
	"ip_address_hash" text,
	"before" jsonb,
	"after" jsonb,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"session_token_hash" text NOT NULL,
	"ip_address_hash" text,
	"user_agent" text,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "auth_sessions_expiry_after_creation" CHECK ("auth_sessions"."expires_at" > "auth_sessions"."created_at")
);
--> statement-breakpoint
CREATE TABLE "cart_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"cart_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"variant_id" uuid,
	"quantity" integer NOT NULL,
	"currency" text DEFAULT 'SAR' NOT NULL,
	"unit_price_minor" bigint NOT NULL,
	"total_minor" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cart_items_cart_product_variant_unique" UNIQUE NULLS NOT DISTINCT("cart_id","product_id","variant_id"),
	CONSTRAINT "cart_items_quantity_positive" CHECK ("cart_items"."quantity" > 0),
	CONSTRAINT "cart_items_amounts_nonnegative" CHECK ("cart_items"."unit_price_minor" >= 0 and "cart_items"."total_minor" >= 0),
	CONSTRAINT "cart_items_currency_iso_length" CHECK (char_length("cart_items"."currency") = 3)
);
--> statement-breakpoint
CREATE TABLE "carts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"customer_id" uuid,
	"visitor_id" uuid,
	"external_id" text NOT NULL,
	"status" "cart_status" DEFAULT 'active' NOT NULL,
	"currency" text DEFAULT 'SAR' NOT NULL,
	"subtotal_minor" bigint DEFAULT 0 NOT NULL,
	"discount_minor" bigint DEFAULT 0 NOT NULL,
	"total_minor" bigint DEFAULT 0 NOT NULL,
	"checkout_url" text,
	"source_updated_at" timestamp with time zone,
	"converted_order_id" uuid,
	"abandoned_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "carts_store_id_unique" UNIQUE("store_id","id"),
	CONSTRAINT "carts_amounts_nonnegative" CHECK (
      "carts"."subtotal_minor" >= 0
      and "carts"."discount_minor" >= 0
      and "carts"."total_minor" >= 0
    ),
	CONSTRAINT "carts_currency_iso_length" CHECK (char_length("carts"."currency") = 3)
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"external_id" text NOT NULL,
	"parent_id" uuid,
	"name" text NOT NULL,
	"slug" text,
	"description" text,
	"position" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"source_updated_at" timestamp with time zone,
	"source_deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "categories_store_id_unique" UNIQUE("store_id","id"),
	CONSTRAINT "categories_position_nonnegative" CHECK ("categories"."position" >= 0)
);
--> statement-breakpoint
CREATE TABLE "commerce_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"event_name" "event_name" NOT NULL,
	"idempotency_key" text NOT NULL,
	"source" text NOT NULL,
	"widget_session_id" uuid,
	"conversation_id" uuid,
	"visitor_id" uuid,
	"customer_id" uuid,
	"product_id" uuid,
	"variant_id" uuid,
	"order_id" uuid,
	"cart_id" uuid,
	"consent_state" "consent_state" DEFAULT 'unknown' NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "connection_capabilities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"connection_id" uuid NOT NULL,
	"capability" text NOT NULL,
	"access" "capability_access" DEFAULT 'unknown' NOT NULL,
	"source_reference" text,
	"verified_at" timestamp with time zone,
	"details" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_approvals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"draft_id" uuid NOT NULL,
	"version_id" uuid NOT NULL,
	"decision" "approval_decision" DEFAULT 'pending' NOT NULL,
	"requested_by_store_member_id" uuid NOT NULL,
	"decided_by_store_member_id" uuid,
	"notes" text,
	"requested_at" timestamp with time zone DEFAULT now() NOT NULL,
	"decided_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "content_approvals_store_id_unique" UNIQUE("store_id","id"),
	CONSTRAINT "content_approvals_decision_timestamp_consistent" CHECK (("content_approvals"."decision" = 'pending' and "content_approvals"."decided_at" is null) or ("content_approvals"."decision" <> 'pending' and "content_approvals"."decided_at" is not null))
);
--> statement-breakpoint
CREATE TABLE "content_drafts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"opportunity_id" uuid,
	"product_id" uuid,
	"page_id" uuid,
	"type" "content_type" NOT NULL,
	"status" "draft_status" DEFAULT 'draft' NOT NULL,
	"title" text NOT NULL,
	"target_type" text NOT NULL,
	"target_reference" text,
	"high_risk" boolean DEFAULT false NOT NULL,
	"generated_by_model" text,
	"generated_from_evidence" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_by_store_member_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "content_drafts_store_id_unique" UNIQUE("store_id","id")
);
--> statement-breakpoint
CREATE TABLE "content_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"draft_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"content" jsonb NOT NULL,
	"checksum_sha256" text NOT NULL,
	"change_summary" text,
	"created_by_store_member_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "content_versions_store_id_unique" UNIQUE("store_id","id"),
	CONSTRAINT "content_versions_version_positive" CHECK ("content_versions"."version" > 0)
);
--> statement-breakpoint
CREATE TABLE "conversation_signals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"conversation_id" uuid NOT NULL,
	"message_id" uuid,
	"signal_type" text NOT NULL,
	"value" text NOT NULL,
	"normalized_value" text,
	"confidence_bps" integer,
	"extraction_model" text,
	"evidence" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "conversation_signals_confidence_range" CHECK ("conversation_signals"."confidence_bps" is null or "conversation_signals"."confidence_bps" between 0 and 10000)
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"widget_session_id" uuid,
	"visitor_id" uuid,
	"customer_id" uuid,
	"status" "conversation_status" DEFAULT 'active' NOT NULL,
	"locale" "content_locale" DEFAULT 'ar' NOT NULL,
	"channel" text DEFAULT 'widget' NOT NULL,
	"summary" text,
	"outcome" text,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone,
	"last_message_at" timestamp with time zone,
	"retention_expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "conversations_store_id_unique" UNIQUE("store_id","id")
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"external_id" text NOT NULL,
	"display_name" text,
	"email_encrypted" text,
	"email_hash" text,
	"phone_encrypted" text,
	"phone_hash" text,
	"preferred_locale" "content_locale",
	"consent_state" "consent_state" DEFAULT 'unknown' NOT NULL,
	"consent_updated_at" timestamp with time zone,
	"first_seen_at" timestamp with time zone,
	"last_seen_at" timestamp with time zone,
	"source_updated_at" timestamp with time zone,
	"source_deleted_at" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "customers_store_id_unique" UNIQUE("store_id","id")
);
--> statement-breakpoint
CREATE TABLE "daily_product_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"metric_date" date NOT NULL,
	"recommendation_impressions" bigint DEFAULT 0 NOT NULL,
	"recommendation_clicks" bigint DEFAULT 0 NOT NULL,
	"add_to_carts" bigint DEFAULT 0 NOT NULL,
	"purchases" bigint DEFAULT 0 NOT NULL,
	"units_sold" bigint DEFAULT 0 NOT NULL,
	"direct_revenue_minor" bigint DEFAULT 0 NOT NULL,
	"influenced_revenue_minor" bigint DEFAULT 0 NOT NULL,
	"currency" text DEFAULT 'SAR' NOT NULL,
	"computed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "daily_product_metrics_counts_nonnegative" CHECK (
      "daily_product_metrics"."recommendation_impressions" >= 0
      and "daily_product_metrics"."recommendation_clicks" >= 0
      and "daily_product_metrics"."add_to_carts" >= 0
      and "daily_product_metrics"."purchases" >= 0
      and "daily_product_metrics"."units_sold" >= 0
      and "daily_product_metrics"."direct_revenue_minor" >= 0
      and "daily_product_metrics"."influenced_revenue_minor" >= 0
    ),
	CONSTRAINT "daily_product_metrics_currency_length" CHECK (char_length("daily_product_metrics"."currency") = 3)
);
--> statement-breakpoint
CREATE TABLE "daily_store_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"metric_date" date NOT NULL,
	"timezone" text NOT NULL,
	"conversations" bigint DEFAULT 0 NOT NULL,
	"unique_visitors" bigint DEFAULT 0 NOT NULL,
	"recommendations" bigint DEFAULT 0 NOT NULL,
	"recommendation_clicks" bigint DEFAULT 0 NOT NULL,
	"add_to_carts" bigint DEFAULT 0 NOT NULL,
	"checkouts" bigint DEFAULT 0 NOT NULL,
	"purchases" bigint DEFAULT 0 NOT NULL,
	"direct_revenue_minor" bigint DEFAULT 0 NOT NULL,
	"influenced_revenue_minor" bigint DEFAULT 0 NOT NULL,
	"currency" text DEFAULT 'SAR' NOT NULL,
	"computed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"source_watermark" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "daily_store_metrics_counts_nonnegative" CHECK (
      "daily_store_metrics"."conversations" >= 0
      and "daily_store_metrics"."unique_visitors" >= 0
      and "daily_store_metrics"."recommendations" >= 0
      and "daily_store_metrics"."recommendation_clicks" >= 0
      and "daily_store_metrics"."add_to_carts" >= 0
      and "daily_store_metrics"."checkouts" >= 0
      and "daily_store_metrics"."purchases" >= 0
      and "daily_store_metrics"."direct_revenue_minor" >= 0
      and "daily_store_metrics"."influenced_revenue_minor" >= 0
    ),
	CONSTRAINT "daily_store_metrics_currency_length" CHECK (char_length("daily_store_metrics"."currency") = 3)
);
--> statement-breakpoint
CREATE TABLE "document_chunks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"document_id" uuid NOT NULL,
	"chunk_index" integer NOT NULL,
	"content" text NOT NULL,
	"locale" "content_locale",
	"token_count" integer,
	"embedding_model" text NOT NULL,
	"embedding" vector(1536) NOT NULL,
	"source_metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "document_chunks_index_nonnegative" CHECK ("document_chunks"."chunk_index" >= 0),
	CONSTRAINT "document_chunks_token_count_nonnegative" CHECK ("document_chunks"."token_count" is null or "document_chunks"."token_count" >= 0)
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"kind" "document_kind" NOT NULL,
	"status" "document_status" DEFAULT 'uploaded' NOT NULL,
	"title" text NOT NULL,
	"locale" "content_locale",
	"source_url" text,
	"storage_key" text,
	"mime_type" text,
	"checksum_sha256" text NOT NULL,
	"byte_size" bigint,
	"extracted_text" text,
	"source_updated_at" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "documents_store_id_unique" UNIQUE("store_id","id"),
	CONSTRAINT "documents_byte_size_nonnegative" CHECK ("documents"."byte_size" is null or "documents"."byte_size" >= 0)
);
--> statement-breakpoint
CREATE TABLE "entitlements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_id" uuid NOT NULL,
	"key" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"limit" bigint,
	"unit" text,
	"configuration" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "entitlements_limit_nonnegative" CHECK ("entitlements"."limit" is null or "entitlements"."limit" >= 0)
);
--> statement-breakpoint
CREATE TABLE "human_handoffs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"conversation_id" uuid NOT NULL,
	"assigned_store_member_id" uuid,
	"status" "handoff_status" DEFAULT 'open' NOT NULL,
	"priority" "priority" DEFAULT 'medium' NOT NULL,
	"reason" text NOT NULL,
	"summary" text NOT NULL,
	"suggested_response" text,
	"contact_encrypted" text,
	"contact_consent" boolean DEFAULT false NOT NULL,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "human_handoffs_store_id_unique" UNIQUE("store_id","id")
);
--> statement-breakpoint
CREATE TABLE "job_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"sync_job_id" uuid,
	"queue_name" text NOT NULL,
	"job_name" text NOT NULL,
	"external_job_id" text,
	"attempt_number" integer DEFAULT 1 NOT NULL,
	"status" "job_status" DEFAULT 'queued' NOT NULL,
	"idempotency_key" text NOT NULL,
	"input" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"output" jsonb,
	"error_code" text,
	"error_message" text,
	"scheduled_for" timestamp with time zone,
	"started_at" timestamp with time zone,
	"finished_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "job_runs_attempt_positive" CHECK ("job_runs"."attempt_number" > 0)
);
--> statement-breakpoint
CREATE TABLE "merchant_insights" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"thread_id" uuid,
	"merchant_message_id" uuid,
	"kind" "insight_kind" NOT NULL,
	"title" text NOT NULL,
	"summary" text NOT NULL,
	"date_range_start" timestamp with time zone,
	"date_range_end" timestamp with time zone,
	"confidence_bps" integer,
	"evidence" jsonb NOT NULL,
	"saved_by_store_member_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "merchant_insights_store_id_unique" UNIQUE("store_id","id"),
	CONSTRAINT "merchant_insights_confidence_range" CHECK ("merchant_insights"."confidence_bps" is null or "merchant_insights"."confidence_bps" between 0 and 10000),
	CONSTRAINT "merchant_insights_date_range_valid" CHECK ("merchant_insights"."date_range_start" is null or "merchant_insights"."date_range_end" is null or "merchant_insights"."date_range_end" >= "merchant_insights"."date_range_start")
);
--> statement-breakpoint
CREATE TABLE "merchant_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"thread_id" uuid NOT NULL,
	"author_store_member_id" uuid,
	"sequence" integer NOT NULL,
	"client_message_id" text,
	"role" "message_role" NOT NULL,
	"content" text NOT NULL,
	"observation_vs_inference" "insight_kind",
	"confidence_bps" integer,
	"evidence" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "merchant_messages_store_id_unique" UNIQUE("store_id","id"),
	CONSTRAINT "merchant_messages_sequence_positive" CHECK ("merchant_messages"."sequence" > 0),
	CONSTRAINT "merchant_messages_confidence_range" CHECK ("merchant_messages"."confidence_bps" is null or "merchant_messages"."confidence_bps" between 0 and 10000)
);
--> statement-breakpoint
CREATE TABLE "merchant_threads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"created_by_store_member_id" uuid NOT NULL,
	"title" text,
	"status" text DEFAULT 'active' NOT NULL,
	"date_range_start" timestamp with time zone,
	"date_range_end" timestamp with time zone,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "merchant_threads_store_id_unique" UNIQUE("store_id","id"),
	CONSTRAINT "merchant_threads_date_range_valid" CHECK ("merchant_threads"."date_range_start" is null or "merchant_threads"."date_range_end" is null or "merchant_threads"."date_range_end" >= "merchant_threads"."date_range_start")
);
--> statement-breakpoint
CREATE TABLE "merchant_tool_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"thread_id" uuid NOT NULL,
	"merchant_message_id" uuid,
	"tool_name" text NOT NULL,
	"status" "job_status" DEFAULT 'queued' NOT NULL,
	"idempotency_key" text NOT NULL,
	"input" jsonb NOT NULL,
	"output" jsonb,
	"source_links" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"error_code" text,
	"error_message" text,
	"started_at" timestamp with time zone,
	"finished_at" timestamp with time zone,
	"latency_ms" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "merchant_tool_runs_latency_nonnegative" CHECK ("merchant_tool_runs"."latency_ms" is null or "merchant_tool_runs"."latency_ms" >= 0)
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"conversation_id" uuid NOT NULL,
	"sequence" integer NOT NULL,
	"client_message_id" text,
	"role" "message_role" NOT NULL,
	"content" text NOT NULL,
	"locale" "content_locale",
	"model" text,
	"prompt_tokens" integer,
	"completion_tokens" integer,
	"latency_ms" integer,
	"grounded" boolean,
	"failed_reason" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "messages_store_id_unique" UNIQUE("store_id","id"),
	CONSTRAINT "messages_sequence_positive" CHECK ("messages"."sequence" > 0),
	CONSTRAINT "messages_tokens_nonnegative" CHECK (
      ("messages"."prompt_tokens" is null or "messages"."prompt_tokens" >= 0)
      and ("messages"."completion_tokens" is null or "messages"."completion_tokens" >= 0)
      and ("messages"."latency_ms" is null or "messages"."latency_ms" >= 0)
    )
);
--> statement-breakpoint
CREATE TABLE "oauth_states" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"store_id" uuid,
	"initiated_by_user_id" uuid NOT NULL,
	"platform" "commerce_platform" NOT NULL,
	"state_hash" text NOT NULL,
	"code_verifier_encrypted" text,
	"redirect_uri" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"consumed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "oauth_states_expiry_after_creation" CHECK ("oauth_states"."expires_at" > "oauth_states"."created_at")
);
--> statement-breakpoint
CREATE TABLE "opportunities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"insight_id" uuid,
	"type" text NOT NULL,
	"status" "opportunity_status" DEFAULT 'open' NOT NULL,
	"priority" "priority" DEFAULT 'medium' NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"proposed_action" text NOT NULL,
	"confidence_bps" integer NOT NULL,
	"estimated_impact" jsonb,
	"evidence" jsonb NOT NULL,
	"assigned_store_member_id" uuid,
	"due_at" timestamp with time zone,
	"dismissed_reason" text,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "opportunities_store_id_unique" UNIQUE("store_id","id"),
	CONSTRAINT "opportunities_confidence_range" CHECK ("opportunities"."confidence_bps" between 0 and 10000)
);
--> statement-breakpoint
CREATE TABLE "opportunity_actions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"opportunity_id" uuid NOT NULL,
	"content_draft_id" uuid,
	"actor_store_member_id" uuid,
	"action" text NOT NULL,
	"notes" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "opportunity_targets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"opportunity_id" uuid NOT NULL,
	"product_id" uuid,
	"page_id" uuid,
	"target_type" text NOT NULL,
	"target_reference" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "opportunity_targets_has_reference" CHECK ("opportunity_targets"."product_id" is not null or "opportunity_targets"."page_id" is not null or "opportunity_targets"."target_reference" is not null)
);
--> statement-breakpoint
CREATE TABLE "order_attributions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"order_id" uuid NOT NULL,
	"conversation_id" uuid NOT NULL,
	"attribution_rule_id" uuid NOT NULL,
	"type" "attribution_type" NOT NULL,
	"attributed_revenue_minor" bigint NOT NULL,
	"currency" text DEFAULT 'SAR' NOT NULL,
	"confidence_bps" integer NOT NULL,
	"evidence" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"attributed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "order_attributions_revenue_nonnegative" CHECK ("order_attributions"."attributed_revenue_minor" >= 0),
	CONSTRAINT "order_attributions_confidence_range" CHECK ("order_attributions"."confidence_bps" between 0 and 10000),
	CONSTRAINT "order_attributions_currency_iso_length" CHECK (char_length("order_attributions"."currency") = 3)
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"order_id" uuid NOT NULL,
	"product_id" uuid,
	"variant_id" uuid,
	"external_id" text NOT NULL,
	"title" text NOT NULL,
	"sku" text,
	"quantity" integer NOT NULL,
	"currency" text DEFAULT 'SAR' NOT NULL,
	"unit_price_minor" bigint NOT NULL,
	"discount_minor" bigint DEFAULT 0 NOT NULL,
	"tax_minor" bigint DEFAULT 0 NOT NULL,
	"total_minor" bigint NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "order_items_quantity_positive" CHECK ("order_items"."quantity" > 0),
	CONSTRAINT "order_items_amounts_nonnegative" CHECK (
      "order_items"."unit_price_minor" >= 0
      and "order_items"."discount_minor" >= 0
      and "order_items"."tax_minor" >= 0
      and "order_items"."total_minor" >= 0
    ),
	CONSTRAINT "order_items_currency_iso_length" CHECK (char_length("order_items"."currency") = 3)
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"customer_id" uuid,
	"external_id" text NOT NULL,
	"external_number" text,
	"status" "order_status" NOT NULL,
	"payment_status" "payment_status" NOT NULL,
	"fulfillment_status" "fulfillment_status" NOT NULL,
	"currency" text DEFAULT 'SAR' NOT NULL,
	"subtotal_minor" bigint NOT NULL,
	"discount_minor" bigint DEFAULT 0 NOT NULL,
	"shipping_minor" bigint DEFAULT 0 NOT NULL,
	"tax_minor" bigint DEFAULT 0 NOT NULL,
	"total_minor" bigint NOT NULL,
	"placed_at" timestamp with time zone NOT NULL,
	"cancelled_at" timestamp with time zone,
	"source_version" text,
	"source_updated_at" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orders_store_id_unique" UNIQUE("store_id","id"),
	CONSTRAINT "orders_amounts_nonnegative" CHECK (
      "orders"."subtotal_minor" >= 0
      and "orders"."discount_minor" >= 0
      and "orders"."shipping_minor" >= 0
      and "orders"."tax_minor" >= 0
      and "orders"."total_minor" >= 0
    ),
	CONSTRAINT "orders_currency_iso_length" CHECK (char_length("orders"."currency") = 3)
);
--> statement-breakpoint
CREATE TABLE "organization_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "organization_role" NOT NULL,
	"invited_by_user_id" uuid,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organizations_name_not_blank" CHECK (length(trim("organizations"."name")) > 0)
);
--> statement-breakpoint
CREATE TABLE "outbox_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"aggregate_type" text NOT NULL,
	"aggregate_id" text NOT NULL,
	"event_type" text NOT NULL,
	"idempotency_key" text NOT NULL,
	"payload" jsonb NOT NULL,
	"status" "delivery_status" DEFAULT 'pending' NOT NULL,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"available_at" timestamp with time zone DEFAULT now() NOT NULL,
	"locked_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "outbox_events_attempt_nonnegative" CHECK ("outbox_events"."attempt_count" >= 0)
);
--> statement-breakpoint
CREATE TABLE "page_audits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"page_id" uuid NOT NULL,
	"status" "job_status" DEFAULT 'queued' NOT NULL,
	"audit_version" text NOT NULL,
	"overall_score" integer,
	"technical_score" integer,
	"content_score" integer,
	"answerability_score" integer,
	"structured_data_score" integer,
	"evidence" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "page_audits_store_id_unique" UNIQUE("store_id","id"),
	CONSTRAINT "page_audits_score_ranges" CHECK (
      ("page_audits"."overall_score" is null or "page_audits"."overall_score" between 0 and 100)
      and ("page_audits"."technical_score" is null or "page_audits"."technical_score" between 0 and 100)
      and ("page_audits"."content_score" is null or "page_audits"."content_score" between 0 and 100)
      and ("page_audits"."answerability_score" is null or "page_audits"."answerability_score" between 0 and 100)
      and ("page_audits"."structured_data_score" is null or "page_audits"."structured_data_score" between 0 and 100)
    )
);
--> statement-breakpoint
CREATE TABLE "plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"billing_interval" "billing_interval" NOT NULL,
	"currency" text DEFAULT 'SAR' NOT NULL,
	"price_minor" bigint NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"trial_days" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "plans_price_nonnegative" CHECK ("plans"."price_minor" >= 0),
	CONSTRAINT "plans_trial_days_nonnegative" CHECK ("plans"."trial_days" >= 0),
	CONSTRAINT "plans_currency_iso_length" CHECK (char_length("plans"."currency") = 3)
);
--> statement-breakpoint
CREATE TABLE "platform_connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"platform" "commerce_platform" NOT NULL,
	"external_store_id" text NOT NULL,
	"status" "connection_status" DEFAULT 'pending' NOT NULL,
	"access_token_encrypted" text NOT NULL,
	"refresh_token_encrypted" text,
	"token_key_version" integer DEFAULT 1 NOT NULL,
	"token_version" integer DEFAULT 1 NOT NULL,
	"token_expires_at" timestamp with time zone,
	"scopes" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"last_verified_at" timestamp with time zone,
	"disconnected_at" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "platform_connections_store_id_unique" UNIQUE("store_id","id"),
	CONSTRAINT "platform_connections_key_version_positive" CHECK ("platform_connections"."token_key_version" > 0),
	CONSTRAINT "platform_connections_token_version_positive" CHECK ("platform_connections"."token_version" > 0)
);
--> statement-breakpoint
CREATE TABLE "product_attributes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"key" text NOT NULL,
	"value" text NOT NULL,
	"locale" "content_locale",
	"source" text DEFAULT 'platform' NOT NULL,
	"verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_attributes_product_key_locale_unique" UNIQUE NULLS NOT DISTINCT("product_id","key","locale")
);
--> statement-breakpoint
CREATE TABLE "product_audits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"status" "job_status" DEFAULT 'queued' NOT NULL,
	"audit_version" text NOT NULL,
	"overall_score" integer,
	"content_score" integer,
	"seo_score" integer,
	"ai_readiness_score" integer,
	"safety_score" integer,
	"evidence" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_audits_store_id_unique" UNIQUE("store_id","id"),
	CONSTRAINT "product_audits_score_ranges" CHECK (
      ("product_audits"."overall_score" is null or "product_audits"."overall_score" between 0 and 100)
      and ("product_audits"."content_score" is null or "product_audits"."content_score" between 0 and 100)
      and ("product_audits"."seo_score" is null or "product_audits"."seo_score" between 0 and 100)
      and ("product_audits"."ai_readiness_score" is null or "product_audits"."ai_readiness_score" between 0 and 100)
      and ("product_audits"."safety_score" is null or "product_audits"."safety_score" between 0 and 100)
    )
);
--> statement-breakpoint
CREATE TABLE "product_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"document_id" uuid NOT NULL,
	"relationship" text DEFAULT 'reference' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"external_id" text,
	"media_type" text DEFAULT 'image' NOT NULL,
	"url" text NOT NULL,
	"alt_text" text,
	"locale" "content_locale",
	"position" integer DEFAULT 0 NOT NULL,
	"width" integer,
	"height" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_media_position_nonnegative" CHECK ("product_media"."position" >= 0),
	CONSTRAINT "product_media_dimensions_positive" CHECK (("product_media"."width" is null or "product_media"."width" > 0) and ("product_media"."height" is null or "product_media"."height" > 0))
);
--> statement-breakpoint
CREATE TABLE "product_translations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"locale" "content_locale" NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"seo_title" text,
	"seo_description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_variants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"external_id" text NOT NULL,
	"sku" text,
	"title" text NOT NULL,
	"currency" text DEFAULT 'SAR' NOT NULL,
	"price_minor" bigint NOT NULL,
	"compare_at_price_minor" bigint,
	"stock_quantity" integer,
	"available_for_sale" boolean DEFAULT false NOT NULL,
	"attributes" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"source_version" text,
	"source_updated_at" timestamp with time zone,
	"source_deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_variants_store_id_unique" UNIQUE("store_id","id"),
	CONSTRAINT "product_variants_price_nonnegative" CHECK (
      "product_variants"."price_minor" >= 0
      and ("product_variants"."compare_at_price_minor" is null or "product_variants"."compare_at_price_minor" >= 0)
    ),
	CONSTRAINT "product_variants_stock_nonnegative" CHECK ("product_variants"."stock_quantity" is null or "product_variants"."stock_quantity" >= 0),
	CONSTRAINT "product_variants_currency_iso_length" CHECK (char_length("product_variants"."currency") = 3)
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"external_id" text NOT NULL,
	"sku" text,
	"slug" text,
	"status" "product_status" DEFAULT 'draft' NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"currency" text DEFAULT 'SAR' NOT NULL,
	"price_minor" bigint NOT NULL,
	"compare_at_price_minor" bigint,
	"cost_minor" bigint,
	"stock_quantity" integer,
	"track_inventory" boolean DEFAULT true NOT NULL,
	"available_for_sale" boolean DEFAULT false NOT NULL,
	"source_version" text,
	"source_updated_at" timestamp with time zone,
	"source_deleted_at" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "products_store_id_unique" UNIQUE("store_id","id"),
	CONSTRAINT "products_price_nonnegative" CHECK (
      "products"."price_minor" >= 0
      and ("products"."compare_at_price_minor" is null or "products"."compare_at_price_minor" >= 0)
      and ("products"."cost_minor" is null or "products"."cost_minor" >= 0)
    ),
	CONSTRAINT "products_stock_nonnegative" CHECK ("products"."stock_quantity" is null or "products"."stock_quantity" >= 0),
	CONSTRAINT "products_currency_iso_length" CHECK (char_length("products"."currency") = 3)
);
--> statement-breakpoint
CREATE TABLE "publication_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"draft_id" uuid NOT NULL,
	"version_id" uuid NOT NULL,
	"approval_id" uuid NOT NULL,
	"connection_id" uuid NOT NULL,
	"status" "publication_status" DEFAULT 'queued' NOT NULL,
	"idempotency_key" text NOT NULL,
	"expected_source_version" text,
	"published_source_version" text,
	"before_snapshot" jsonb,
	"after_snapshot" jsonb,
	"error_code" text,
	"error_message" text,
	"started_at" timestamp with time zone,
	"finished_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recommendation_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"recommendation_id" uuid NOT NULL,
	"recommendation_item_id" uuid,
	"conversation_id" uuid NOT NULL,
	"widget_session_id" uuid,
	"product_id" uuid,
	"event_name" "event_name" NOT NULL,
	"idempotency_key" text NOT NULL,
	"source" text DEFAULT 'widget' NOT NULL,
	"consent_state" "consent_state" DEFAULT 'unknown' NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recommendation_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"recommendation_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"variant_id" uuid,
	"rank" integer NOT NULL,
	"suitability_bps" integer NOT NULL,
	"relevance_bps" integer,
	"price_fit_bps" integer,
	"availability_verified_at" timestamp with time zone NOT NULL,
	"price_minor_snapshot" bigint NOT NULL,
	"currency" text DEFAULT 'SAR' NOT NULL,
	"explanation" text,
	"evidence" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "recommendation_items_store_id_unique" UNIQUE("store_id","id"),
	CONSTRAINT "recommendation_items_rank_positive" CHECK ("recommendation_items"."rank" > 0),
	CONSTRAINT "recommendation_items_scores_range" CHECK (
      "recommendation_items"."suitability_bps" between 0 and 10000
      and ("recommendation_items"."relevance_bps" is null or "recommendation_items"."relevance_bps" between 0 and 10000)
      and ("recommendation_items"."price_fit_bps" is null or "recommendation_items"."price_fit_bps" between 0 and 10000)
    ),
	CONSTRAINT "recommendation_items_price_nonnegative" CHECK ("recommendation_items"."price_minor_snapshot" >= 0),
	CONSTRAINT "recommendation_items_currency_iso_length" CHECK (char_length("recommendation_items"."currency") = 3)
);
--> statement-breakpoint
CREATE TABLE "recommendations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"conversation_id" uuid NOT NULL,
	"message_id" uuid,
	"status" "recommendation_status" DEFAULT 'generated' NOT NULL,
	"algorithm_version" text NOT NULL,
	"retrieval_query" text,
	"customer_constraints" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"explanation" text,
	"failure_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "recommendations_store_id_unique" UNIQUE("store_id","id")
);
--> statement-breakpoint
CREATE TABLE "safety_interventions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"conversation_id" uuid NOT NULL,
	"message_id" uuid,
	"stage" text NOT NULL,
	"category" text NOT NULL,
	"policy_code" text NOT NULL,
	"action" text NOT NULL,
	"confidence_bps" integer,
	"input_hash" text NOT NULL,
	"details" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "safety_interventions_confidence_range" CHECK ("safety_interventions"."confidence_bps" is null or "safety_interventions"."confidence_bps" between 0 and 10000)
);
--> statement-breakpoint
CREATE TABLE "store_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "store_member_role" NOT NULL,
	"invited_by_user_id" uuid,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"disabled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "store_members_store_id_unique" UNIQUE("store_id","id")
);
--> statement-breakpoint
CREATE TABLE "store_pages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"external_id" text,
	"page_type" text NOT NULL,
	"url" text NOT NULL,
	"canonical_url" text,
	"locale" "content_locale",
	"title" text,
	"content" text,
	"indexable" boolean,
	"source_version" text,
	"source_updated_at" timestamp with time zone,
	"source_deleted_at" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "store_pages_store_id_unique" UNIQUE("store_id","id")
);
--> statement-breakpoint
CREATE TABLE "store_policies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"document_id" uuid,
	"type" "policy_type" NOT NULL,
	"locale" "content_locale" NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"source_url" text,
	"verified_at" timestamp with time zone,
	"source_updated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"external_domain" text,
	"status" "store_status" DEFAULT 'onboarding' NOT NULL,
	"runtime_mode" "runtime_mode" DEFAULT 'live' NOT NULL,
	"category" text DEFAULT 'general_ecommerce' NOT NULL,
	"default_locale" "content_locale" DEFAULT 'ar' NOT NULL,
	"currency" text DEFAULT 'SAR' NOT NULL,
	"timezone" text DEFAULT 'Asia/Riyadh' NOT NULL,
	"brand_voice_instructions" text,
	"data_retention_days" integer DEFAULT 365 NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "stores_currency_iso_length" CHECK (char_length("stores"."currency") = 3),
	CONSTRAINT "stores_retention_positive" CHECK ("stores"."data_retention_days" > 0)
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"plan_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"external_customer_id" text,
	"external_subscription_id" text,
	"status" "subscription_status" NOT NULL,
	"currency" text DEFAULT 'SAR' NOT NULL,
	"amount_minor" bigint NOT NULL,
	"current_period_start" timestamp with time zone NOT NULL,
	"current_period_end" timestamp with time zone NOT NULL,
	"trial_ends_at" timestamp with time zone,
	"cancel_at_period_end" boolean DEFAULT false NOT NULL,
	"cancelled_at" timestamp with time zone,
	"ended_at" timestamp with time zone,
	"provider_data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "subscriptions_store_id_unique" UNIQUE("store_id","id"),
	CONSTRAINT "subscriptions_amount_nonnegative" CHECK ("subscriptions"."amount_minor" >= 0),
	CONSTRAINT "subscriptions_period_valid" CHECK ("subscriptions"."current_period_end" > "subscriptions"."current_period_start"),
	CONSTRAINT "subscriptions_currency_iso_length" CHECK (char_length("subscriptions"."currency") = 3)
);
--> statement-breakpoint
CREATE TABLE "sync_checkpoints" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"connection_id" uuid NOT NULL,
	"resource_type" text NOT NULL,
	"cursor" jsonb NOT NULL,
	"source_version" text,
	"last_external_updated_at" timestamp with time zone,
	"last_successful_sync_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sync_errors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"sync_job_id" uuid NOT NULL,
	"resource_type" text NOT NULL,
	"external_id" text,
	"error_code" text,
	"message" text NOT NULL,
	"retryable" boolean DEFAULT false NOT NULL,
	"details" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sync_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"connection_id" uuid NOT NULL,
	"kind" "sync_kind" NOT NULL,
	"resource_type" text NOT NULL,
	"status" "job_status" DEFAULT 'queued' NOT NULL,
	"idempotency_key" text NOT NULL,
	"requested_by_user_id" uuid,
	"records_total" integer,
	"records_processed" integer DEFAULT 0 NOT NULL,
	"records_failed" integer DEFAULT 0 NOT NULL,
	"cursor" jsonb,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sync_jobs_store_id_unique" UNIQUE("store_id","id"),
	CONSTRAINT "sync_jobs_counts_nonnegative" CHECK (
      "sync_jobs"."records_processed" >= 0
      and "sync_jobs"."records_failed" >= 0
      and ("sync_jobs"."records_total" is null or "sync_jobs"."records_total" >= 0)
    ),
	CONSTRAINT "sync_jobs_processed_within_total" CHECK ("sync_jobs"."records_total" is null or "sync_jobs"."records_processed" <= "sync_jobs"."records_total")
);
--> statement-breakpoint
CREATE TABLE "usage_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"subscription_id" uuid,
	"metric" text NOT NULL,
	"quantity" bigint NOT NULL,
	"source_event_id" text NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"billing_period_start" timestamp with time zone NOT NULL,
	"billing_period_end" timestamp with time zone NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "usage_records_quantity_positive" CHECK ("usage_records"."quantity" > 0),
	CONSTRAINT "usage_records_period_valid" CHECK ("usage_records"."billing_period_end" > "usage_records"."billing_period_start")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"email_verified_at" timestamp with time zone,
	"password_hash" text,
	"display_name" text,
	"preferred_locale" "content_locale" DEFAULT 'ar' NOT NULL,
	"disabled_at" timestamp with time zone,
	"last_signed_in_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_not_blank" CHECK (length(trim("users"."email")) > 3)
);
--> statement-breakpoint
CREATE TABLE "visitors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"anonymous_id_hash" text NOT NULL,
	"customer_id" uuid,
	"first_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"locale" "content_locale",
	"country_code" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "visitors_store_id_unique" UNIQUE("store_id","id"),
	CONSTRAINT "visitors_country_code_length" CHECK ("visitors"."country_code" is null or char_length("visitors"."country_code") = 2)
);
--> statement-breakpoint
CREATE TABLE "webhook_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"connection_id" uuid NOT NULL,
	"platform" "commerce_platform" NOT NULL,
	"event_type" text NOT NULL,
	"provider_delivery_id" text,
	"idempotency_key" text NOT NULL,
	"signature_verified" boolean DEFAULT false NOT NULL,
	"headers" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"payload" jsonb NOT NULL,
	"payload_hash" text NOT NULL,
	"status" "delivery_status" DEFAULT 'pending' NOT NULL,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone,
	"failed_at" timestamp with time zone,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "webhook_events_attempt_nonnegative" CHECK ("webhook_events"."attempt_count" >= 0)
);
--> statement-breakpoint
CREATE TABLE "webhook_registrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"connection_id" uuid NOT NULL,
	"event_type" text NOT NULL,
	"external_registration_id" text,
	"callback_url" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"last_verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "widget_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"visitor_id" uuid NOT NULL,
	"customer_id" uuid,
	"session_token_hash" text NOT NULL,
	"consent_state" "consent_state" DEFAULT 'unknown' NOT NULL,
	"entry_url" text,
	"referrer_url" text,
	"user_agent" text,
	"opened_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_activity_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone,
	"expires_at" timestamp with time zone NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "widget_sessions_store_id_unique" UNIQUE("store_id","id"),
	CONSTRAINT "widget_sessions_expiry_after_open" CHECK ("widget_sessions"."expires_at" > "widget_sessions"."opened_at")
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_visibility_checks" ADD CONSTRAINT "ai_visibility_checks_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_visibility_checks" ADD CONSTRAINT "visibility_checks_query_fk" FOREIGN KEY ("store_id","query_id") REFERENCES "public"."ai_visibility_queries"("store_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_visibility_citations" ADD CONSTRAINT "ai_visibility_citations_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_visibility_citations" ADD CONSTRAINT "visibility_citations_check_fk" FOREIGN KEY ("store_id","check_id") REFERENCES "public"."ai_visibility_checks"("store_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_visibility_competitors" ADD CONSTRAINT "ai_visibility_competitors_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_visibility_mentions" ADD CONSTRAINT "ai_visibility_mentions_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_visibility_mentions" ADD CONSTRAINT "visibility_mentions_check_fk" FOREIGN KEY ("store_id","check_id") REFERENCES "public"."ai_visibility_checks"("store_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_visibility_mentions" ADD CONSTRAINT "visibility_mentions_competitor_fk" FOREIGN KEY ("store_id","competitor_id") REFERENCES "public"."ai_visibility_competitors"("store_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_visibility_mentions" ADD CONSTRAINT "visibility_mentions_product_fk" FOREIGN KEY ("store_id","product_id") REFERENCES "public"."products"("store_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_visibility_queries" ADD CONSTRAINT "ai_visibility_queries_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_visibility_queries" ADD CONSTRAINT "visibility_queries_creator_fk" FOREIGN KEY ("store_id","created_by_store_member_id") REFERENCES "public"."store_members"("store_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_visibility_score_components" ADD CONSTRAINT "ai_visibility_score_components_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_visibility_score_components" ADD CONSTRAINT "visibility_score_components_score_fk" FOREIGN KEY ("store_id","score_id") REFERENCES "public"."ai_visibility_scores"("store_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_visibility_scores" ADD CONSTRAINT "ai_visibility_scores_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attribution_rules" ADD CONSTRAINT "attribution_rules_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_findings" ADD CONSTRAINT "audit_findings_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_findings" ADD CONSTRAINT "audit_findings_page_audit_fk" FOREIGN KEY ("store_id","page_audit_id") REFERENCES "public"."page_audits"("store_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_findings" ADD CONSTRAINT "audit_findings_product_audit_fk" FOREIGN KEY ("store_id","product_audit_id") REFERENCES "public"."product_audits"("store_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_store_member_fk" FOREIGN KEY ("store_id","actor_store_member_id") REFERENCES "public"."store_members"("store_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_cart_fk" FOREIGN KEY ("store_id","cart_id") REFERENCES "public"."carts"("store_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_product_fk" FOREIGN KEY ("store_id","product_id") REFERENCES "public"."products"("store_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_variant_fk" FOREIGN KEY ("store_id","variant_id") REFERENCES "public"."product_variants"("store_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "carts" ADD CONSTRAINT "carts_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "carts" ADD CONSTRAINT "carts_customer_fk" FOREIGN KEY ("store_id","customer_id") REFERENCES "public"."customers"("store_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "carts" ADD CONSTRAINT "carts_visitor_fk" FOREIGN KEY ("store_id","visitor_id") REFERENCES "public"."visitors"("store_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "carts" ADD CONSTRAINT "carts_converted_order_fk" FOREIGN KEY ("store_id","converted_order_id") REFERENCES "public"."orders"("store_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commerce_events" ADD CONSTRAINT "commerce_events_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commerce_events" ADD CONSTRAINT "commerce_events_session_fk" FOREIGN KEY ("store_id","widget_session_id") REFERENCES "public"."widget_sessions"("store_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commerce_events" ADD CONSTRAINT "commerce_events_conversation_fk" FOREIGN KEY ("store_id","conversation_id") REFERENCES "public"."conversations"("store_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commerce_events" ADD CONSTRAINT "commerce_events_visitor_fk" FOREIGN KEY ("store_id","visitor_id") REFERENCES "public"."visitors"("store_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commerce_events" ADD CONSTRAINT "commerce_events_customer_fk" FOREIGN KEY ("store_id","customer_id") REFERENCES "public"."customers"("store_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commerce_events" ADD CONSTRAINT "commerce_events_product_fk" FOREIGN KEY ("store_id","product_id") REFERENCES "public"."products"("store_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commerce_events" ADD CONSTRAINT "commerce_events_variant_fk" FOREIGN KEY ("store_id","variant_id") REFERENCES "public"."product_variants"("store_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commerce_events" ADD CONSTRAINT "commerce_events_order_fk" FOREIGN KEY ("store_id","order_id") REFERENCES "public"."orders"("store_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commerce_events" ADD CONSTRAINT "commerce_events_cart_fk" FOREIGN KEY ("store_id","cart_id") REFERENCES "public"."carts"("store_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "connection_capabilities" ADD CONSTRAINT "connection_capabilities_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "connection_capabilities" ADD CONSTRAINT "connection_capabilities_connection_fk" FOREIGN KEY ("store_id","connection_id") REFERENCES "public"."platform_connections"("store_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_approvals" ADD CONSTRAINT "content_approvals_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_approvals" ADD CONSTRAINT "content_approvals_draft_fk" FOREIGN KEY ("store_id","draft_id") REFERENCES "public"."content_drafts"("store_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_approvals" ADD CONSTRAINT "content_approvals_version_fk" FOREIGN KEY ("store_id","version_id") REFERENCES "public"."content_versions"("store_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_approvals" ADD CONSTRAINT "content_approvals_requester_fk" FOREIGN KEY ("store_id","requested_by_store_member_id") REFERENCES "public"."store_members"("store_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_approvals" ADD CONSTRAINT "content_approvals_decider_fk" FOREIGN KEY ("store_id","decided_by_store_member_id") REFERENCES "public"."store_members"("store_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_drafts" ADD CONSTRAINT "content_drafts_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_drafts" ADD CONSTRAINT "content_drafts_opportunity_fk" FOREIGN KEY ("store_id","opportunity_id") REFERENCES "public"."opportunities"("store_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_drafts" ADD CONSTRAINT "content_drafts_product_fk" FOREIGN KEY ("store_id","product_id") REFERENCES "public"."products"("store_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_drafts" ADD CONSTRAINT "content_drafts_page_fk" FOREIGN KEY ("store_id","page_id") REFERENCES "public"."store_pages"("store_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_drafts" ADD CONSTRAINT "content_drafts_creator_fk" FOREIGN KEY ("store_id","created_by_store_member_id") REFERENCES "public"."store_members"("store_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_versions" ADD CONSTRAINT "content_versions_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_versions" ADD CONSTRAINT "content_versions_draft_fk" FOREIGN KEY ("store_id","draft_id") REFERENCES "public"."content_drafts"("store_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_versions" ADD CONSTRAINT "content_versions_creator_fk" FOREIGN KEY ("store_id","created_by_store_member_id") REFERENCES "public"."store_members"("store_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_signals" ADD CONSTRAINT "conversation_signals_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_signals" ADD CONSTRAINT "conversation_signals_conversation_fk" FOREIGN KEY ("store_id","conversation_id") REFERENCES "public"."conversations"("store_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_signals" ADD CONSTRAINT "conversation_signals_message_fk" FOREIGN KEY ("store_id","message_id") REFERENCES "public"."messages"("store_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_widget_session_fk" FOREIGN KEY ("store_id","widget_session_id") REFERENCES "public"."widget_sessions"("store_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_visitor_fk" FOREIGN KEY ("store_id","visitor_id") REFERENCES "public"."visitors"("store_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_customer_fk" FOREIGN KEY ("store_id","customer_id") REFERENCES "public"."customers"("store_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_product_metrics" ADD CONSTRAINT "daily_product_metrics_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_product_metrics" ADD CONSTRAINT "daily_product_metrics_product_fk" FOREIGN KEY ("store_id","product_id") REFERENCES "public"."products"("store_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_store_metrics" ADD CONSTRAINT "daily_store_metrics_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_chunks" ADD CONSTRAINT "document_chunks_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_chunks" ADD CONSTRAINT "document_chunks_document_fk" FOREIGN KEY ("store_id","document_id") REFERENCES "public"."documents"("store_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entitlements" ADD CONSTRAINT "entitlements_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "human_handoffs" ADD CONSTRAINT "human_handoffs_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "human_handoffs" ADD CONSTRAINT "human_handoffs_conversation_fk" FOREIGN KEY ("store_id","conversation_id") REFERENCES "public"."conversations"("store_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "human_handoffs" ADD CONSTRAINT "human_handoffs_assignee_fk" FOREIGN KEY ("store_id","assigned_store_member_id") REFERENCES "public"."store_members"("store_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_runs" ADD CONSTRAINT "job_runs_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_runs" ADD CONSTRAINT "job_runs_sync_job_fk" FOREIGN KEY ("store_id","sync_job_id") REFERENCES "public"."sync_jobs"("store_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "merchant_insights" ADD CONSTRAINT "merchant_insights_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "merchant_insights" ADD CONSTRAINT "merchant_insights_thread_fk" FOREIGN KEY ("store_id","thread_id") REFERENCES "public"."merchant_threads"("store_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "merchant_insights" ADD CONSTRAINT "merchant_insights_message_fk" FOREIGN KEY ("store_id","merchant_message_id") REFERENCES "public"."merchant_messages"("store_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "merchant_insights" ADD CONSTRAINT "merchant_insights_saver_fk" FOREIGN KEY ("store_id","saved_by_store_member_id") REFERENCES "public"."store_members"("store_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "merchant_messages" ADD CONSTRAINT "merchant_messages_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "merchant_messages" ADD CONSTRAINT "merchant_messages_thread_fk" FOREIGN KEY ("store_id","thread_id") REFERENCES "public"."merchant_threads"("store_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "merchant_messages" ADD CONSTRAINT "merchant_messages_author_fk" FOREIGN KEY ("store_id","author_store_member_id") REFERENCES "public"."store_members"("store_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "merchant_threads" ADD CONSTRAINT "merchant_threads_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "merchant_threads" ADD CONSTRAINT "merchant_threads_creator_fk" FOREIGN KEY ("store_id","created_by_store_member_id") REFERENCES "public"."store_members"("store_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "merchant_tool_runs" ADD CONSTRAINT "merchant_tool_runs_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "merchant_tool_runs" ADD CONSTRAINT "merchant_tool_runs_thread_fk" FOREIGN KEY ("store_id","thread_id") REFERENCES "public"."merchant_threads"("store_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "merchant_tool_runs" ADD CONSTRAINT "merchant_tool_runs_message_fk" FOREIGN KEY ("store_id","merchant_message_id") REFERENCES "public"."merchant_messages"("store_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_fk" FOREIGN KEY ("store_id","conversation_id") REFERENCES "public"."conversations"("store_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oauth_states" ADD CONSTRAINT "oauth_states_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oauth_states" ADD CONSTRAINT "oauth_states_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oauth_states" ADD CONSTRAINT "oauth_states_initiated_by_user_id_users_id_fk" FOREIGN KEY ("initiated_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_insight_fk" FOREIGN KEY ("store_id","insight_id") REFERENCES "public"."merchant_insights"("store_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_assignee_fk" FOREIGN KEY ("store_id","assigned_store_member_id") REFERENCES "public"."store_members"("store_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunity_actions" ADD CONSTRAINT "opportunity_actions_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunity_actions" ADD CONSTRAINT "opportunity_actions_opportunity_fk" FOREIGN KEY ("store_id","opportunity_id") REFERENCES "public"."opportunities"("store_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunity_actions" ADD CONSTRAINT "opportunity_actions_draft_fk" FOREIGN KEY ("store_id","content_draft_id") REFERENCES "public"."content_drafts"("store_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunity_actions" ADD CONSTRAINT "opportunity_actions_actor_fk" FOREIGN KEY ("store_id","actor_store_member_id") REFERENCES "public"."store_members"("store_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunity_targets" ADD CONSTRAINT "opportunity_targets_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunity_targets" ADD CONSTRAINT "opportunity_targets_opportunity_fk" FOREIGN KEY ("store_id","opportunity_id") REFERENCES "public"."opportunities"("store_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunity_targets" ADD CONSTRAINT "opportunity_targets_product_fk" FOREIGN KEY ("store_id","product_id") REFERENCES "public"."products"("store_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunity_targets" ADD CONSTRAINT "opportunity_targets_page_fk" FOREIGN KEY ("store_id","page_id") REFERENCES "public"."store_pages"("store_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_attributions" ADD CONSTRAINT "order_attributions_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_attributions" ADD CONSTRAINT "order_attributions_order_fk" FOREIGN KEY ("store_id","order_id") REFERENCES "public"."orders"("store_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_attributions" ADD CONSTRAINT "order_attributions_conversation_fk" FOREIGN KEY ("store_id","conversation_id") REFERENCES "public"."conversations"("store_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_attributions" ADD CONSTRAINT "order_attributions_rule_fk" FOREIGN KEY ("store_id","attribution_rule_id") REFERENCES "public"."attribution_rules"("store_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_fk" FOREIGN KEY ("store_id","order_id") REFERENCES "public"."orders"("store_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_fk" FOREIGN KEY ("store_id","product_id") REFERENCES "public"."products"("store_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_variant_fk" FOREIGN KEY ("store_id","variant_id") REFERENCES "public"."product_variants"("store_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_fk" FOREIGN KEY ("store_id","customer_id") REFERENCES "public"."customers"("store_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_invited_by_user_id_users_id_fk" FOREIGN KEY ("invited_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outbox_events" ADD CONSTRAINT "outbox_events_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "page_audits" ADD CONSTRAINT "page_audits_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "page_audits" ADD CONSTRAINT "page_audits_page_fk" FOREIGN KEY ("store_id","page_id") REFERENCES "public"."store_pages"("store_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_connections" ADD CONSTRAINT "platform_connections_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_attributes" ADD CONSTRAINT "product_attributes_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_attributes" ADD CONSTRAINT "product_attributes_product_fk" FOREIGN KEY ("store_id","product_id") REFERENCES "public"."products"("store_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_audits" ADD CONSTRAINT "product_audits_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_audits" ADD CONSTRAINT "product_audits_product_fk" FOREIGN KEY ("store_id","product_id") REFERENCES "public"."products"("store_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_product_fk" FOREIGN KEY ("store_id","product_id") REFERENCES "public"."products"("store_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_category_fk" FOREIGN KEY ("store_id","category_id") REFERENCES "public"."categories"("store_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_documents" ADD CONSTRAINT "product_documents_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_documents" ADD CONSTRAINT "product_documents_product_fk" FOREIGN KEY ("store_id","product_id") REFERENCES "public"."products"("store_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_documents" ADD CONSTRAINT "product_documents_document_fk" FOREIGN KEY ("store_id","document_id") REFERENCES "public"."documents"("store_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_media" ADD CONSTRAINT "product_media_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_media" ADD CONSTRAINT "product_media_product_fk" FOREIGN KEY ("store_id","product_id") REFERENCES "public"."products"("store_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_translations" ADD CONSTRAINT "product_translations_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_translations" ADD CONSTRAINT "product_translations_product_fk" FOREIGN KEY ("store_id","product_id") REFERENCES "public"."products"("store_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_fk" FOREIGN KEY ("store_id","product_id") REFERENCES "public"."products"("store_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "publication_runs" ADD CONSTRAINT "publication_runs_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "publication_runs" ADD CONSTRAINT "publication_runs_draft_fk" FOREIGN KEY ("store_id","draft_id") REFERENCES "public"."content_drafts"("store_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "publication_runs" ADD CONSTRAINT "publication_runs_version_fk" FOREIGN KEY ("store_id","version_id") REFERENCES "public"."content_versions"("store_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "publication_runs" ADD CONSTRAINT "publication_runs_approval_fk" FOREIGN KEY ("store_id","approval_id") REFERENCES "public"."content_approvals"("store_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "publication_runs" ADD CONSTRAINT "publication_runs_connection_fk" FOREIGN KEY ("store_id","connection_id") REFERENCES "public"."platform_connections"("store_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendation_events" ADD CONSTRAINT "recommendation_events_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendation_events" ADD CONSTRAINT "recommendation_events_recommendation_fk" FOREIGN KEY ("store_id","recommendation_id") REFERENCES "public"."recommendations"("store_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendation_events" ADD CONSTRAINT "recommendation_events_item_fk" FOREIGN KEY ("store_id","recommendation_item_id") REFERENCES "public"."recommendation_items"("store_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendation_events" ADD CONSTRAINT "recommendation_events_conversation_fk" FOREIGN KEY ("store_id","conversation_id") REFERENCES "public"."conversations"("store_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendation_events" ADD CONSTRAINT "recommendation_events_session_fk" FOREIGN KEY ("store_id","widget_session_id") REFERENCES "public"."widget_sessions"("store_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendation_events" ADD CONSTRAINT "recommendation_events_product_fk" FOREIGN KEY ("store_id","product_id") REFERENCES "public"."products"("store_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendation_items" ADD CONSTRAINT "recommendation_items_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendation_items" ADD CONSTRAINT "recommendation_items_recommendation_fk" FOREIGN KEY ("store_id","recommendation_id") REFERENCES "public"."recommendations"("store_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendation_items" ADD CONSTRAINT "recommendation_items_product_fk" FOREIGN KEY ("store_id","product_id") REFERENCES "public"."products"("store_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendation_items" ADD CONSTRAINT "recommendation_items_variant_fk" FOREIGN KEY ("store_id","variant_id") REFERENCES "public"."product_variants"("store_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_conversation_fk" FOREIGN KEY ("store_id","conversation_id") REFERENCES "public"."conversations"("store_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_message_fk" FOREIGN KEY ("store_id","message_id") REFERENCES "public"."messages"("store_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "safety_interventions" ADD CONSTRAINT "safety_interventions_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "safety_interventions" ADD CONSTRAINT "safety_interventions_conversation_fk" FOREIGN KEY ("store_id","conversation_id") REFERENCES "public"."conversations"("store_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "safety_interventions" ADD CONSTRAINT "safety_interventions_message_fk" FOREIGN KEY ("store_id","message_id") REFERENCES "public"."messages"("store_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_members" ADD CONSTRAINT "store_members_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_members" ADD CONSTRAINT "store_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_members" ADD CONSTRAINT "store_members_invited_by_user_id_users_id_fk" FOREIGN KEY ("invited_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_pages" ADD CONSTRAINT "store_pages_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_policies" ADD CONSTRAINT "store_policies_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_policies" ADD CONSTRAINT "store_policies_document_fk" FOREIGN KEY ("store_id","document_id") REFERENCES "public"."documents"("store_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stores" ADD CONSTRAINT "stores_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_checkpoints" ADD CONSTRAINT "sync_checkpoints_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_checkpoints" ADD CONSTRAINT "sync_checkpoints_connection_fk" FOREIGN KEY ("store_id","connection_id") REFERENCES "public"."platform_connections"("store_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_errors" ADD CONSTRAINT "sync_errors_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_errors" ADD CONSTRAINT "sync_errors_job_fk" FOREIGN KEY ("store_id","sync_job_id") REFERENCES "public"."sync_jobs"("store_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_jobs" ADD CONSTRAINT "sync_jobs_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_jobs" ADD CONSTRAINT "sync_jobs_requested_by_user_id_users_id_fk" FOREIGN KEY ("requested_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_jobs" ADD CONSTRAINT "sync_jobs_connection_fk" FOREIGN KEY ("store_id","connection_id") REFERENCES "public"."platform_connections"("store_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_records" ADD CONSTRAINT "usage_records_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_records" ADD CONSTRAINT "usage_records_subscription_fk" FOREIGN KEY ("store_id","subscription_id") REFERENCES "public"."subscriptions"("store_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visitors" ADD CONSTRAINT "visitors_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visitors" ADD CONSTRAINT "visitors_customer_fk" FOREIGN KEY ("store_id","customer_id") REFERENCES "public"."customers"("store_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_events" ADD CONSTRAINT "webhook_events_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_events" ADD CONSTRAINT "webhook_events_connection_fk" FOREIGN KEY ("store_id","connection_id") REFERENCES "public"."platform_connections"("store_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_registrations" ADD CONSTRAINT "webhook_registrations_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_registrations" ADD CONSTRAINT "webhook_registrations_connection_fk" FOREIGN KEY ("store_id","connection_id") REFERENCES "public"."platform_connections"("store_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "widget_sessions" ADD CONSTRAINT "widget_sessions_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "widget_sessions" ADD CONSTRAINT "widget_sessions_visitor_fk" FOREIGN KEY ("store_id","visitor_id") REFERENCES "public"."visitors"("store_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "widget_sessions" ADD CONSTRAINT "widget_sessions_customer_fk" FOREIGN KEY ("store_id","customer_id") REFERENCES "public"."customers"("store_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "accounts_provider_account_unique" ON "accounts" USING btree ("provider","provider_account_id");--> statement-breakpoint
CREATE INDEX "accounts_user_id_idx" ON "accounts" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "visibility_checks_store_idempotency_unique" ON "ai_visibility_checks" USING btree ("store_id","idempotency_key");--> statement-breakpoint
CREATE UNIQUE INDEX "visibility_checks_query_schedule_unique" ON "ai_visibility_checks" USING btree ("query_id","provider","scheduled_for");--> statement-breakpoint
CREATE INDEX "visibility_checks_store_query_checked_idx" ON "ai_visibility_checks" USING btree ("store_id","query_id","checked_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "visibility_checks_store_status_scheduled_idx" ON "ai_visibility_checks" USING btree ("store_id","status","scheduled_for");--> statement-breakpoint
CREATE UNIQUE INDEX "visibility_citations_check_url_unique" ON "ai_visibility_citations" USING btree ("check_id","url");--> statement-breakpoint
CREATE INDEX "visibility_citations_store_domain_idx" ON "ai_visibility_citations" USING btree ("store_id","domain","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE UNIQUE INDEX "visibility_competitors_store_domain_unique" ON "ai_visibility_competitors" USING btree ("store_id",lower("domain"));--> statement-breakpoint
CREATE INDEX "visibility_competitors_store_active_idx" ON "ai_visibility_competitors" USING btree ("store_id","active");--> statement-breakpoint
CREATE INDEX "visibility_mentions_check_idx" ON "ai_visibility_mentions" USING btree ("check_id");--> statement-breakpoint
CREATE INDEX "visibility_mentions_competitor_idx" ON "ai_visibility_mentions" USING btree ("competitor_id");--> statement-breakpoint
CREATE INDEX "visibility_mentions_product_idx" ON "ai_visibility_mentions" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "visibility_mentions_store_entity_idx" ON "ai_visibility_mentions" USING btree ("store_id","entity_type","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE UNIQUE INDEX "visibility_queries_monitor_unique" ON "ai_visibility_queries" USING btree ("store_id","query","locale","country_code","provider");--> statement-breakpoint
CREATE INDEX "visibility_queries_store_active_next_idx" ON "ai_visibility_queries" USING btree ("store_id","active","next_check_at");--> statement-breakpoint
CREATE INDEX "visibility_queries_creator_idx" ON "ai_visibility_queries" USING btree ("created_by_store_member_id");--> statement-breakpoint
CREATE UNIQUE INDEX "visibility_score_components_score_name_unique" ON "ai_visibility_score_components" USING btree ("score_id","component");--> statement-breakpoint
CREATE INDEX "visibility_score_components_store_component_idx" ON "ai_visibility_score_components" USING btree ("store_id","component");--> statement-breakpoint
CREATE UNIQUE INDEX "visibility_scores_store_type_capture_unique" ON "ai_visibility_scores" USING btree ("store_id","score_type","captured_at");--> statement-breakpoint
CREATE INDEX "visibility_scores_store_type_capture_idx" ON "ai_visibility_scores" USING btree ("store_id","score_type","captured_at" DESC NULLS LAST);--> statement-breakpoint
CREATE UNIQUE INDEX "attribution_rules_store_name_unique" ON "attribution_rules" USING btree ("store_id","name");--> statement-breakpoint
CREATE INDEX "attribution_rules_store_active_idx" ON "attribution_rules" USING btree ("store_id","active");--> statement-breakpoint
CREATE INDEX "audit_findings_page_audit_idx" ON "audit_findings" USING btree ("page_audit_id");--> statement-breakpoint
CREATE INDEX "audit_findings_product_audit_idx" ON "audit_findings" USING btree ("product_audit_id");--> statement-breakpoint
CREATE INDEX "audit_findings_store_severity_idx" ON "audit_findings" USING btree ("store_id","severity","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE UNIQUE INDEX "audit_logs_store_idempotency_unique" ON "audit_logs" USING btree ("store_id","idempotency_key") WHERE "audit_logs"."idempotency_key" is not null;--> statement-breakpoint
CREATE INDEX "audit_logs_store_occurred_idx" ON "audit_logs" USING btree ("store_id","occurred_at" DESC NULLS LAST,"id" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "audit_logs_resource_idx" ON "audit_logs" USING btree ("store_id","resource_type","resource_id","occurred_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "audit_logs_actor_user_idx" ON "audit_logs" USING btree ("actor_user_id");--> statement-breakpoint
CREATE INDEX "audit_logs_actor_member_idx" ON "audit_logs" USING btree ("actor_store_member_id");--> statement-breakpoint
CREATE INDEX "audit_logs_request_idx" ON "audit_logs" USING btree ("request_id");--> statement-breakpoint
CREATE UNIQUE INDEX "auth_sessions_token_hash_unique" ON "auth_sessions" USING btree ("session_token_hash");--> statement-breakpoint
CREATE INDEX "auth_sessions_user_expiry_idx" ON "auth_sessions" USING btree ("user_id","expires_at");--> statement-breakpoint
CREATE INDEX "auth_sessions_active_expiry_idx" ON "auth_sessions" USING btree ("expires_at") WHERE "auth_sessions"."revoked_at" is null;--> statement-breakpoint
CREATE INDEX "cart_items_store_product_idx" ON "cart_items" USING btree ("store_id","product_id");--> statement-breakpoint
CREATE INDEX "cart_items_variant_idx" ON "cart_items" USING btree ("variant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "carts_store_external_unique" ON "carts" USING btree ("store_id","external_id");--> statement-breakpoint
CREATE INDEX "carts_store_status_updated_idx" ON "carts" USING btree ("store_id","status","updated_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "carts_customer_idx" ON "carts" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "carts_visitor_idx" ON "carts" USING btree ("visitor_id");--> statement-breakpoint
CREATE INDEX "carts_converted_order_idx" ON "carts" USING btree ("converted_order_id");--> statement-breakpoint
CREATE UNIQUE INDEX "categories_store_external_unique" ON "categories" USING btree ("store_id","external_id");--> statement-breakpoint
CREATE INDEX "categories_store_parent_idx" ON "categories" USING btree ("store_id","parent_id");--> statement-breakpoint
CREATE INDEX "categories_store_active_idx" ON "categories" USING btree ("store_id","active");--> statement-breakpoint
CREATE UNIQUE INDEX "commerce_events_store_idempotency_unique" ON "commerce_events" USING btree ("store_id","idempotency_key");--> statement-breakpoint
CREATE INDEX "commerce_events_store_name_occurred_idx" ON "commerce_events" USING btree ("store_id","event_name","occurred_at" DESC NULLS LAST,"id" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "commerce_events_session_idx" ON "commerce_events" USING btree ("widget_session_id");--> statement-breakpoint
CREATE INDEX "commerce_events_conversation_idx" ON "commerce_events" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "commerce_events_visitor_idx" ON "commerce_events" USING btree ("visitor_id");--> statement-breakpoint
CREATE INDEX "commerce_events_customer_idx" ON "commerce_events" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "commerce_events_product_idx" ON "commerce_events" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "commerce_events_variant_idx" ON "commerce_events" USING btree ("variant_id");--> statement-breakpoint
CREATE INDEX "commerce_events_order_idx" ON "commerce_events" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "commerce_events_cart_idx" ON "commerce_events" USING btree ("cart_id");--> statement-breakpoint
CREATE UNIQUE INDEX "connection_capabilities_connection_name_unique" ON "connection_capabilities" USING btree ("connection_id","capability");--> statement-breakpoint
CREATE INDEX "connection_capabilities_store_access_idx" ON "connection_capabilities" USING btree ("store_id","access");--> statement-breakpoint
CREATE UNIQUE INDEX "content_approvals_draft_version_unique" ON "content_approvals" USING btree ("draft_id","version_id");--> statement-breakpoint
CREATE INDEX "content_approvals_store_pending_idx" ON "content_approvals" USING btree ("store_id","requested_at" DESC NULLS LAST) WHERE "content_approvals"."decision" = 'pending';--> statement-breakpoint
CREATE INDEX "content_approvals_requester_idx" ON "content_approvals" USING btree ("requested_by_store_member_id");--> statement-breakpoint
CREATE INDEX "content_approvals_decider_idx" ON "content_approvals" USING btree ("decided_by_store_member_id");--> statement-breakpoint
CREATE INDEX "content_drafts_store_status_updated_idx" ON "content_drafts" USING btree ("store_id","status","updated_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "content_drafts_opportunity_idx" ON "content_drafts" USING btree ("opportunity_id");--> statement-breakpoint
CREATE INDEX "content_drafts_product_idx" ON "content_drafts" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "content_drafts_page_idx" ON "content_drafts" USING btree ("page_id");--> statement-breakpoint
CREATE INDEX "content_drafts_creator_idx" ON "content_drafts" USING btree ("created_by_store_member_id");--> statement-breakpoint
CREATE UNIQUE INDEX "content_versions_draft_version_unique" ON "content_versions" USING btree ("draft_id","version");--> statement-breakpoint
CREATE INDEX "content_versions_creator_idx" ON "content_versions" USING btree ("created_by_store_member_id");--> statement-breakpoint
CREATE INDEX "conversation_signals_store_type_created_idx" ON "conversation_signals" USING btree ("store_id","signal_type","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "conversation_signals_conversation_idx" ON "conversation_signals" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "conversation_signals_message_idx" ON "conversation_signals" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "conversations_store_started_idx" ON "conversations" USING btree ("store_id","started_at" DESC NULLS LAST,"id" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "conversations_store_status_activity_idx" ON "conversations" USING btree ("store_id","status","last_message_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "conversations_widget_session_idx" ON "conversations" USING btree ("widget_session_id");--> statement-breakpoint
CREATE INDEX "conversations_visitor_idx" ON "conversations" USING btree ("visitor_id");--> statement-breakpoint
CREATE INDEX "conversations_customer_idx" ON "conversations" USING btree ("customer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "customers_store_external_unique" ON "customers" USING btree ("store_id","external_id");--> statement-breakpoint
CREATE INDEX "customers_store_last_seen_idx" ON "customers" USING btree ("store_id","last_seen_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "customers_store_email_hash_idx" ON "customers" USING btree ("store_id","email_hash");--> statement-breakpoint
CREATE INDEX "customers_store_phone_hash_idx" ON "customers" USING btree ("store_id","phone_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "daily_product_metrics_product_date_unique" ON "daily_product_metrics" USING btree ("product_id","metric_date");--> statement-breakpoint
CREATE INDEX "daily_product_metrics_store_date_idx" ON "daily_product_metrics" USING btree ("store_id","metric_date" DESC NULLS LAST);--> statement-breakpoint
CREATE UNIQUE INDEX "daily_store_metrics_store_date_unique" ON "daily_store_metrics" USING btree ("store_id","metric_date");--> statement-breakpoint
CREATE INDEX "daily_store_metrics_store_date_idx" ON "daily_store_metrics" USING btree ("store_id","metric_date" DESC NULLS LAST);--> statement-breakpoint
CREATE UNIQUE INDEX "document_chunks_document_index_unique" ON "document_chunks" USING btree ("document_id","chunk_index");--> statement-breakpoint
CREATE INDEX "document_chunks_store_document_idx" ON "document_chunks" USING btree ("store_id","document_id");--> statement-breakpoint
CREATE INDEX "document_chunks_embedding_hnsw_idx" ON "document_chunks" USING hnsw ("embedding" vector_cosine_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "documents_store_checksum_unique" ON "documents" USING btree ("store_id","checksum_sha256");--> statement-breakpoint
CREATE INDEX "documents_store_status_kind_idx" ON "documents" USING btree ("store_id","status","kind");--> statement-breakpoint
CREATE UNIQUE INDEX "entitlements_plan_key_unique" ON "entitlements" USING btree ("plan_id","key");--> statement-breakpoint
CREATE INDEX "entitlements_key_idx" ON "entitlements" USING btree ("key");--> statement-breakpoint
CREATE INDEX "human_handoffs_store_open_priority_idx" ON "human_handoffs" USING btree ("store_id","priority","created_at" DESC NULLS LAST) WHERE "human_handoffs"."status" in ('open', 'assigned');--> statement-breakpoint
CREATE INDEX "human_handoffs_conversation_idx" ON "human_handoffs" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "human_handoffs_assignee_idx" ON "human_handoffs" USING btree ("assigned_store_member_id");--> statement-breakpoint
CREATE UNIQUE INDEX "job_runs_store_idempotency_attempt_unique" ON "job_runs" USING btree ("store_id","idempotency_key","attempt_number");--> statement-breakpoint
CREATE INDEX "job_runs_store_status_scheduled_idx" ON "job_runs" USING btree ("store_id","status","scheduled_for");--> statement-breakpoint
CREATE INDEX "job_runs_sync_job_idx" ON "job_runs" USING btree ("sync_job_id");--> statement-breakpoint
CREATE INDEX "merchant_insights_store_kind_created_idx" ON "merchant_insights" USING btree ("store_id","kind","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "merchant_insights_thread_idx" ON "merchant_insights" USING btree ("thread_id");--> statement-breakpoint
CREATE INDEX "merchant_insights_message_idx" ON "merchant_insights" USING btree ("merchant_message_id");--> statement-breakpoint
CREATE INDEX "merchant_insights_saver_idx" ON "merchant_insights" USING btree ("saved_by_store_member_id");--> statement-breakpoint
CREATE UNIQUE INDEX "merchant_messages_thread_sequence_unique" ON "merchant_messages" USING btree ("thread_id","sequence");--> statement-breakpoint
CREATE UNIQUE INDEX "merchant_messages_thread_client_id_unique" ON "merchant_messages" USING btree ("thread_id","client_message_id") WHERE "merchant_messages"."client_message_id" is not null;--> statement-breakpoint
CREATE INDEX "merchant_messages_author_idx" ON "merchant_messages" USING btree ("author_store_member_id");--> statement-breakpoint
CREATE INDEX "merchant_threads_store_updated_idx" ON "merchant_threads" USING btree ("store_id","updated_at" DESC NULLS LAST,"id" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "merchant_threads_creator_idx" ON "merchant_threads" USING btree ("created_by_store_member_id");--> statement-breakpoint
CREATE UNIQUE INDEX "merchant_tool_runs_store_idempotency_unique" ON "merchant_tool_runs" USING btree ("store_id","idempotency_key");--> statement-breakpoint
CREATE INDEX "merchant_tool_runs_thread_created_idx" ON "merchant_tool_runs" USING btree ("thread_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "merchant_tool_runs_message_idx" ON "merchant_tool_runs" USING btree ("merchant_message_id");--> statement-breakpoint
CREATE INDEX "merchant_tool_runs_store_tool_status_idx" ON "merchant_tool_runs" USING btree ("store_id","tool_name","status");--> statement-breakpoint
CREATE UNIQUE INDEX "messages_conversation_sequence_unique" ON "messages" USING btree ("conversation_id","sequence");--> statement-breakpoint
CREATE UNIQUE INDEX "messages_conversation_client_id_unique" ON "messages" USING btree ("conversation_id","client_message_id") WHERE "messages"."client_message_id" is not null;--> statement-breakpoint
CREATE INDEX "messages_store_created_idx" ON "messages" USING btree ("store_id","created_at" DESC NULLS LAST,"id" DESC NULLS LAST);--> statement-breakpoint
CREATE UNIQUE INDEX "oauth_states_hash_unique" ON "oauth_states" USING btree ("state_hash");--> statement-breakpoint
CREATE INDEX "oauth_states_org_expiry_idx" ON "oauth_states" USING btree ("organization_id","expires_at");--> statement-breakpoint
CREATE INDEX "oauth_states_store_id_idx" ON "oauth_states" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "oauth_states_user_id_idx" ON "oauth_states" USING btree ("initiated_by_user_id");--> statement-breakpoint
CREATE INDEX "opportunities_store_status_priority_idx" ON "opportunities" USING btree ("store_id","status","priority","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "opportunities_insight_idx" ON "opportunities" USING btree ("insight_id");--> statement-breakpoint
CREATE INDEX "opportunities_assignee_idx" ON "opportunities" USING btree ("assigned_store_member_id");--> statement-breakpoint
CREATE INDEX "opportunity_actions_opportunity_created_idx" ON "opportunity_actions" USING btree ("opportunity_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "opportunity_actions_draft_idx" ON "opportunity_actions" USING btree ("content_draft_id");--> statement-breakpoint
CREATE INDEX "opportunity_actions_actor_idx" ON "opportunity_actions" USING btree ("actor_store_member_id");--> statement-breakpoint
CREATE INDEX "opportunity_actions_store_id_idx" ON "opportunity_actions" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "opportunity_targets_opportunity_idx" ON "opportunity_targets" USING btree ("opportunity_id");--> statement-breakpoint
CREATE INDEX "opportunity_targets_product_idx" ON "opportunity_targets" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "opportunity_targets_page_idx" ON "opportunity_targets" USING btree ("page_id");--> statement-breakpoint
CREATE INDEX "opportunity_targets_store_id_idx" ON "opportunity_targets" USING btree ("store_id");--> statement-breakpoint
CREATE UNIQUE INDEX "order_attributions_order_conversation_type_unique" ON "order_attributions" USING btree ("order_id","conversation_id","type");--> statement-breakpoint
CREATE INDEX "order_attributions_store_type_date_idx" ON "order_attributions" USING btree ("store_id","type","attributed_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "order_attributions_conversation_idx" ON "order_attributions" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "order_attributions_rule_idx" ON "order_attributions" USING btree ("attribution_rule_id");--> statement-breakpoint
CREATE UNIQUE INDEX "order_items_order_external_unique" ON "order_items" USING btree ("order_id","external_id");--> statement-breakpoint
CREATE INDEX "order_items_store_order_idx" ON "order_items" USING btree ("store_id","order_id");--> statement-breakpoint
CREATE INDEX "order_items_store_product_idx" ON "order_items" USING btree ("store_id","product_id");--> statement-breakpoint
CREATE INDEX "order_items_store_variant_idx" ON "order_items" USING btree ("store_id","variant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "orders_store_external_unique" ON "orders" USING btree ("store_id","external_id");--> statement-breakpoint
CREATE INDEX "orders_store_placed_idx" ON "orders" USING btree ("store_id","placed_at" DESC NULLS LAST,"id" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "orders_store_customer_placed_idx" ON "orders" USING btree ("store_id","customer_id","placed_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "orders_store_status_placed_idx" ON "orders" USING btree ("store_id","status","placed_at" DESC NULLS LAST);--> statement-breakpoint
CREATE UNIQUE INDEX "organization_members_org_user_unique" ON "organization_members" USING btree ("organization_id","user_id");--> statement-breakpoint
CREATE INDEX "organization_members_user_id_idx" ON "organization_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "organization_members_invited_by_idx" ON "organization_members" USING btree ("invited_by_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "organizations_slug_unique" ON "organizations" USING btree (lower("slug"));--> statement-breakpoint
CREATE UNIQUE INDEX "outbox_events_store_idempotency_unique" ON "outbox_events" USING btree ("store_id","idempotency_key");--> statement-breakpoint
CREATE INDEX "outbox_events_dispatch_idx" ON "outbox_events" USING btree ("status","available_at","created_at") WHERE "outbox_events"."status" in ('pending', 'failed');--> statement-breakpoint
CREATE INDEX "outbox_events_store_aggregate_idx" ON "outbox_events" USING btree ("store_id","aggregate_type","aggregate_id");--> statement-breakpoint
CREATE INDEX "page_audits_page_created_idx" ON "page_audits" USING btree ("page_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "page_audits_store_status_idx" ON "page_audits" USING btree ("store_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "plans_code_unique" ON "plans" USING btree ("code");--> statement-breakpoint
CREATE INDEX "plans_active_idx" ON "plans" USING btree ("active");--> statement-breakpoint
CREATE UNIQUE INDEX "platform_connections_store_platform_unique" ON "platform_connections" USING btree ("store_id","platform");--> statement-breakpoint
CREATE UNIQUE INDEX "platform_connections_external_store_unique" ON "platform_connections" USING btree ("platform","external_store_id");--> statement-breakpoint
CREATE INDEX "platform_connections_status_idx" ON "platform_connections" USING btree ("store_id","status");--> statement-breakpoint
CREATE INDEX "product_attributes_store_key_idx" ON "product_attributes" USING btree ("store_id","key");--> statement-breakpoint
CREATE INDEX "product_audits_product_created_idx" ON "product_audits" USING btree ("product_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "product_audits_store_status_idx" ON "product_audits" USING btree ("store_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "product_categories_product_category_unique" ON "product_categories" USING btree ("product_id","category_id");--> statement-breakpoint
CREATE INDEX "product_categories_category_product_idx" ON "product_categories" USING btree ("category_id","product_id");--> statement-breakpoint
CREATE INDEX "product_categories_store_id_idx" ON "product_categories" USING btree ("store_id");--> statement-breakpoint
CREATE UNIQUE INDEX "product_documents_product_document_unique" ON "product_documents" USING btree ("product_id","document_id");--> statement-breakpoint
CREATE INDEX "product_documents_document_idx" ON "product_documents" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "product_documents_store_id_idx" ON "product_documents" USING btree ("store_id");--> statement-breakpoint
CREATE UNIQUE INDEX "product_media_product_url_unique" ON "product_media" USING btree ("product_id","url");--> statement-breakpoint
CREATE INDEX "product_media_product_position_idx" ON "product_media" USING btree ("product_id","position");--> statement-breakpoint
CREATE INDEX "product_media_store_id_idx" ON "product_media" USING btree ("store_id");--> statement-breakpoint
CREATE UNIQUE INDEX "product_translations_product_locale_unique" ON "product_translations" USING btree ("product_id","locale");--> statement-breakpoint
CREATE INDEX "product_translations_store_locale_idx" ON "product_translations" USING btree ("store_id","locale");--> statement-breakpoint
CREATE UNIQUE INDEX "product_variants_store_external_unique" ON "product_variants" USING btree ("store_id","external_id");--> statement-breakpoint
CREATE INDEX "product_variants_product_available_idx" ON "product_variants" USING btree ("product_id","available_for_sale");--> statement-breakpoint
CREATE INDEX "product_variants_store_sku_idx" ON "product_variants" USING btree ("store_id","sku");--> statement-breakpoint
CREATE UNIQUE INDEX "products_store_external_unique" ON "products" USING btree ("store_id","external_id");--> statement-breakpoint
CREATE UNIQUE INDEX "products_store_slug_unique" ON "products" USING btree ("store_id","slug") WHERE "products"."slug" is not null and "products"."source_deleted_at" is null;--> statement-breakpoint
CREATE INDEX "products_store_eligible_idx" ON "products" USING btree ("store_id","available_for_sale","updated_at" DESC NULLS LAST) WHERE "products"."status" = 'active' and "products"."source_deleted_at" is null;--> statement-breakpoint
CREATE INDEX "products_store_sku_idx" ON "products" USING btree ("store_id","sku");--> statement-breakpoint
CREATE UNIQUE INDEX "publication_runs_store_idempotency_unique" ON "publication_runs" USING btree ("store_id","idempotency_key");--> statement-breakpoint
CREATE INDEX "publication_runs_store_status_created_idx" ON "publication_runs" USING btree ("store_id","status","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "publication_runs_draft_idx" ON "publication_runs" USING btree ("draft_id");--> statement-breakpoint
CREATE INDEX "publication_runs_version_idx" ON "publication_runs" USING btree ("version_id");--> statement-breakpoint
CREATE INDEX "publication_runs_approval_idx" ON "publication_runs" USING btree ("approval_id");--> statement-breakpoint
CREATE INDEX "publication_runs_connection_idx" ON "publication_runs" USING btree ("connection_id");--> statement-breakpoint
CREATE UNIQUE INDEX "recommendation_events_store_idempotency_unique" ON "recommendation_events" USING btree ("store_id","idempotency_key");--> statement-breakpoint
CREATE INDEX "recommendation_events_store_name_occurred_idx" ON "recommendation_events" USING btree ("store_id","event_name","occurred_at" DESC NULLS LAST,"id" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "recommendation_events_recommendation_idx" ON "recommendation_events" USING btree ("recommendation_id");--> statement-breakpoint
CREATE INDEX "recommendation_events_item_idx" ON "recommendation_events" USING btree ("recommendation_item_id");--> statement-breakpoint
CREATE INDEX "recommendation_events_conversation_idx" ON "recommendation_events" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "recommendation_events_session_idx" ON "recommendation_events" USING btree ("widget_session_id");--> statement-breakpoint
CREATE INDEX "recommendation_events_product_idx" ON "recommendation_events" USING btree ("product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "recommendation_items_recommendation_rank_unique" ON "recommendation_items" USING btree ("recommendation_id","rank");--> statement-breakpoint
CREATE INDEX "recommendation_items_product_created_idx" ON "recommendation_items" USING btree ("product_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "recommendation_items_variant_idx" ON "recommendation_items" USING btree ("variant_id");--> statement-breakpoint
CREATE INDEX "recommendations_store_created_idx" ON "recommendations" USING btree ("store_id","created_at" DESC NULLS LAST,"id" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "recommendations_conversation_idx" ON "recommendations" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "recommendations_message_idx" ON "recommendations" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "safety_interventions_store_category_created_idx" ON "safety_interventions" USING btree ("store_id","category","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "safety_interventions_conversation_idx" ON "safety_interventions" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "safety_interventions_message_idx" ON "safety_interventions" USING btree ("message_id");--> statement-breakpoint
CREATE UNIQUE INDEX "store_members_store_user_unique" ON "store_members" USING btree ("store_id","user_id");--> statement-breakpoint
CREATE INDEX "store_members_user_id_idx" ON "store_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "store_members_invited_by_idx" ON "store_members" USING btree ("invited_by_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "store_pages_store_url_unique" ON "store_pages" USING btree ("store_id","url");--> statement-breakpoint
CREATE UNIQUE INDEX "store_pages_store_external_unique" ON "store_pages" USING btree ("store_id","external_id") WHERE "store_pages"."external_id" is not null;--> statement-breakpoint
CREATE INDEX "store_pages_store_type_idx" ON "store_pages" USING btree ("store_id","page_type");--> statement-breakpoint
CREATE UNIQUE INDEX "store_policies_store_type_locale_unique" ON "store_policies" USING btree ("store_id","type","locale");--> statement-breakpoint
CREATE INDEX "store_policies_document_idx" ON "store_policies" USING btree ("document_id");--> statement-breakpoint
CREATE UNIQUE INDEX "stores_org_id_unique" ON "stores" USING btree ("organization_id","id");--> statement-breakpoint
CREATE INDEX "stores_organization_status_idx" ON "stores" USING btree ("organization_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "stores_org_domain_unique" ON "stores" USING btree ("organization_id",lower("external_domain")) WHERE "stores"."external_domain" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "subscriptions_provider_external_unique" ON "subscriptions" USING btree ("provider","external_subscription_id") WHERE "subscriptions"."external_subscription_id" is not null;--> statement-breakpoint
CREATE INDEX "subscriptions_store_status_idx" ON "subscriptions" USING btree ("store_id","status");--> statement-breakpoint
CREATE INDEX "subscriptions_plan_idx" ON "subscriptions" USING btree ("plan_id");--> statement-breakpoint
CREATE UNIQUE INDEX "sync_checkpoints_connection_resource_unique" ON "sync_checkpoints" USING btree ("connection_id","resource_type");--> statement-breakpoint
CREATE INDEX "sync_checkpoints_store_id_idx" ON "sync_checkpoints" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "sync_errors_job_occurred_idx" ON "sync_errors" USING btree ("sync_job_id","occurred_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "sync_errors_store_unresolved_idx" ON "sync_errors" USING btree ("store_id","occurred_at" DESC NULLS LAST) WHERE "sync_errors"."resolved_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "sync_jobs_store_idempotency_unique" ON "sync_jobs" USING btree ("store_id","idempotency_key");--> statement-breakpoint
CREATE INDEX "sync_jobs_store_status_created_idx" ON "sync_jobs" USING btree ("store_id","status","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "sync_jobs_connection_idx" ON "sync_jobs" USING btree ("connection_id");--> statement-breakpoint
CREATE INDEX "sync_jobs_requested_by_idx" ON "sync_jobs" USING btree ("requested_by_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "usage_records_store_metric_source_unique" ON "usage_records" USING btree ("store_id","metric","source_event_id");--> statement-breakpoint
CREATE INDEX "usage_records_store_metric_occurred_idx" ON "usage_records" USING btree ("store_id","metric","occurred_at" DESC NULLS LAST,"id" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "usage_records_subscription_idx" ON "usage_records" USING btree ("subscription_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique" ON "users" USING btree (lower("email"));--> statement-breakpoint
CREATE UNIQUE INDEX "visitors_store_anonymous_unique" ON "visitors" USING btree ("store_id","anonymous_id_hash");--> statement-breakpoint
CREATE INDEX "visitors_customer_idx" ON "visitors" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "visitors_store_last_seen_idx" ON "visitors" USING btree ("store_id","last_seen_at" DESC NULLS LAST);--> statement-breakpoint
CREATE UNIQUE INDEX "webhook_events_store_idempotency_unique" ON "webhook_events" USING btree ("store_id","idempotency_key");--> statement-breakpoint
CREATE UNIQUE INDEX "webhook_events_provider_delivery_unique" ON "webhook_events" USING btree ("platform","store_id","provider_delivery_id") WHERE "webhook_events"."provider_delivery_id" is not null;--> statement-breakpoint
CREATE INDEX "webhook_events_store_status_received_idx" ON "webhook_events" USING btree ("store_id","status","received_at");--> statement-breakpoint
CREATE INDEX "webhook_events_connection_idx" ON "webhook_events" USING btree ("connection_id");--> statement-breakpoint
CREATE UNIQUE INDEX "webhook_registrations_connection_event_unique" ON "webhook_registrations" USING btree ("connection_id","event_type");--> statement-breakpoint
CREATE INDEX "webhook_registrations_store_active_idx" ON "webhook_registrations" USING btree ("store_id","active");--> statement-breakpoint
CREATE UNIQUE INDEX "widget_sessions_token_hash_unique" ON "widget_sessions" USING btree ("session_token_hash");--> statement-breakpoint
CREATE INDEX "widget_sessions_visitor_activity_idx" ON "widget_sessions" USING btree ("visitor_id","last_activity_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "widget_sessions_customer_idx" ON "widget_sessions" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "widget_sessions_store_expiry_idx" ON "widget_sessions" USING btree ("store_id","expires_at");
