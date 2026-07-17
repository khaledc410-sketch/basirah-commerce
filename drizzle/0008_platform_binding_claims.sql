CREATE TABLE "platform_binding_claims" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"platform" "commerce_platform" NOT NULL,
	"external_store_id" text NOT NULL,
	"external_user_id" text NOT NULL,
	"claim_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"consumed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "platform_binding_claims_hash_length" CHECK (char_length("platform_binding_claims"."claim_hash") = 64),
	CONSTRAINT "platform_binding_claims_expiry_after_creation" CHECK ("platform_binding_claims"."expires_at" > "platform_binding_claims"."created_at")
);
--> statement-breakpoint
CREATE UNIQUE INDEX "platform_binding_claims_hash_unique" ON "platform_binding_claims" USING btree ("claim_hash");--> statement-breakpoint
CREATE INDEX "platform_binding_claims_store_idx" ON "platform_binding_claims" USING btree ("platform","external_store_id","consumed_at");--> statement-breakpoint
CREATE INDEX "platform_binding_claims_expiry_idx" ON "platform_binding_claims" USING btree ("expires_at","consumed_at");--> statement-breakpoint
REVOKE ALL PRIVILEGES ON TABLE "platform_binding_claims" FROM PUBLIC, "anon", "authenticated";--> statement-breakpoint
GRANT ALL PRIVILEGES ON TABLE "platform_binding_claims" TO "service_role";--> statement-breakpoint
ALTER TABLE "platform_binding_claims" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "platform_binding_claims" FORCE ROW LEVEL SECURITY;
