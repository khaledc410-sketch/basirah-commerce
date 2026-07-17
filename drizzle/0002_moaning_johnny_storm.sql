ALTER TABLE "product_attributes" RENAME COLUMN "value" TO "values";--> statement-breakpoint
ALTER TABLE "product_attributes" ALTER COLUMN "values" SET DATA TYPE jsonb USING jsonb_build_array("values");--> statement-breakpoint
ALTER TABLE "product_attributes" ALTER COLUMN "values" SET DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "sync_jobs" DROP CONSTRAINT "sync_jobs_processed_within_total";--> statement-breakpoint
ALTER TABLE "categories" DROP CONSTRAINT "categories_parent_id_categories_id_fk";
--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "parent_external_id" text;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "source_seen_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "source_seen_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "sync_jobs" ADD COLUMN "run_id" uuid DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "sync_jobs" ADD COLUMN "heartbeat_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_fk" FOREIGN KEY ("store_id","parent_id") REFERENCES "public"."categories"("store_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "categories_store_source_seen_idx" ON "categories" USING btree ("store_id","source_seen_at");--> statement-breakpoint
CREATE INDEX "products_store_source_seen_idx" ON "products" USING btree ("store_id","source_seen_at");--> statement-breakpoint
CREATE UNIQUE INDEX "sync_jobs_store_run_resource_unique" ON "sync_jobs" USING btree ("store_id","run_id","resource_type");--> statement-breakpoint
CREATE UNIQUE INDEX "sync_jobs_connection_active_resource_unique" ON "sync_jobs" USING btree ("connection_id","resource_type") WHERE "sync_jobs"."status" in ('queued', 'running');--> statement-breakpoint
CREATE INDEX "sync_jobs_store_run_idx" ON "sync_jobs" USING btree ("store_id","run_id");--> statement-breakpoint
ALTER TABLE "sync_jobs" ADD CONSTRAINT "sync_jobs_processed_within_total" CHECK ("sync_jobs"."records_total" is null or ("sync_jobs"."records_processed" + "sync_jobs"."records_failed") <= "sync_jobs"."records_total");
