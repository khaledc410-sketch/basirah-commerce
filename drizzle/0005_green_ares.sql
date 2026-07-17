CREATE TABLE "pending_platform_authorizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"platform" "commerce_platform" NOT NULL,
	"external_store_id" text NOT NULL,
	"access_token_encrypted" text NOT NULL,
	"authorization_token_encrypted" text,
	"refresh_token_encrypted" text,
	"token_expires_at" timestamp with time zone NOT NULL,
	"scopes" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"token_type" text DEFAULT 'bearer' NOT NULL,
	"event_created_at" text NOT NULL,
	"consumed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "pending_platform_authorizations_store_unique" ON "pending_platform_authorizations" USING btree ("platform","external_store_id");--> statement-breakpoint
CREATE INDEX "pending_platform_authorizations_expiry_idx" ON "pending_platform_authorizations" USING btree ("token_expires_at","consumed_at");--> statement-breakpoint
REVOKE ALL PRIVILEGES ON TABLE "pending_platform_authorizations" FROM PUBLIC, "anon", "authenticated";--> statement-breakpoint
ALTER TABLE "pending_platform_authorizations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "pending_platform_authorizations" FORCE ROW LEVEL SECURITY;
