ALTER TABLE "pending_platform_authorizations"
ALTER COLUMN "event_created_at" SET DATA TYPE timestamp with time zone
USING CASE
	WHEN "event_created_at" ~ '^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$'
		THEN (replace("event_created_at", ' ', 'T') || 'Z')::timestamp with time zone
	ELSE "event_created_at"::timestamp with time zone
END;--> statement-breakpoint
ALTER TABLE "platform_connections" ADD COLUMN "authorization_event_created_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "prospect_scan_runs" ADD COLUMN "attempt_id" uuid;--> statement-breakpoint
ALTER TABLE "prospect_scan_runs" ADD COLUMN "lease_expires_at" timestamp with time zone;
