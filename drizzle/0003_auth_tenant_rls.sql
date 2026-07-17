-- Supabase Auth identity linkage and tenant row-level security.
--
-- Normal merchant requests must use the authenticated Supabase role. Direct
-- database connections that use postgres, service_role, or another BYPASSRLS
-- role are not protected by these policies and are reserved for trusted jobs.

CREATE SCHEMA IF NOT EXISTS "private";
REVOKE ALL ON SCHEMA "private" FROM PUBLIC, "anon", "authenticated";
GRANT USAGE ON SCHEMA "private" TO "authenticated";

-- A public profile is identified by the immutable auth.users primary key.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "public"."users" AS profile
    LEFT JOIN "auth"."users" AS auth_user ON auth_user."id" = profile."id"
    WHERE auth_user."id" IS NULL
  ) THEN
    RAISE EXCEPTION
      'Cannot link public.users to auth.users: orphaned public user profiles exist';
  END IF;
END
$$;

ALTER TABLE "public"."users" ALTER COLUMN "id" DROP DEFAULT;
ALTER TABLE "public"."users" DROP COLUMN "password_hash";
ALTER TABLE "public"."users"
  ADD CONSTRAINT "users_auth_user_fk"
  FOREIGN KEY ("id") REFERENCES "auth"."users"("id")
  ON DELETE CASCADE
  NOT VALID;
ALTER TABLE "public"."users" VALIDATE CONSTRAINT "users_auth_user_fk";

ALTER TABLE "public"."organization_members"
  ADD COLUMN IF NOT EXISTS "disabled_at" timestamp with time zone;

CREATE INDEX IF NOT EXISTS "organization_members_user_active_idx"
  ON "public"."organization_members" ("user_id", "organization_id", "role")
  WHERE "disabled_at" IS NULL;
CREATE INDEX IF NOT EXISTS "store_members_user_active_idx"
  ON "public"."store_members" ("user_id", "store_id", "role")
  WHERE "disabled_at" IS NULL;

CREATE OR REPLACE FUNCTION "private"."handle_auth_user_profile"()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  requested_locale "public"."content_locale";
BEGIN
  -- Basirah currently provisions email identities only. Do not block another
  -- Auth method at the platform level; simply leave it without an app profile.
  IF NEW."email" IS NULL THEN
    RETURN NEW;
  END IF;

  requested_locale := CASE
    WHEN NEW."raw_user_meta_data" ->> 'preferred_locale' IN ('ar', 'en')
      THEN (NEW."raw_user_meta_data" ->> 'preferred_locale')::"public"."content_locale"
    ELSE NULL
  END;

  INSERT INTO "public"."users" AS profile (
    "id",
    "email",
    "email_verified_at",
    "display_name",
    "preferred_locale",
    "last_signed_in_at",
    "created_at",
    "updated_at"
  )
  VALUES (
    NEW."id",
    NEW."email",
    NEW."email_confirmed_at",
    COALESCE(
      NEW."raw_user_meta_data" ->> 'display_name',
      NEW."raw_user_meta_data" ->> 'full_name'
    ),
    COALESCE(requested_locale, 'ar'::"public"."content_locale"),
    NEW."last_sign_in_at",
    COALESCE(NEW."created_at", now()),
    now()
  )
  ON CONFLICT ("id") DO UPDATE SET
    "email" = EXCLUDED."email",
    "email_verified_at" = EXCLUDED."email_verified_at",
    "display_name" = COALESCE(EXCLUDED."display_name", profile."display_name"),
    "preferred_locale" = COALESCE(requested_locale, profile."preferred_locale"),
    "last_signed_in_at" = EXCLUDED."last_signed_in_at",
    "updated_at" = now();

  RETURN NEW;
END
$$;

REVOKE ALL ON FUNCTION "private"."handle_auth_user_profile"() FROM PUBLIC;

DROP TRIGGER IF EXISTS "on_auth_user_profile_changed" ON "auth"."users";
CREATE TRIGGER "on_auth_user_profile_changed"
  AFTER INSERT OR UPDATE OF
    "email", "email_confirmed_at", "last_sign_in_at", "raw_user_meta_data"
  ON "auth"."users"
  FOR EACH ROW
  EXECUTE FUNCTION "private"."handle_auth_user_profile"();

-- Backfill Auth identities created before the trigger was installed.
INSERT INTO "public"."users" (
  "id",
  "email",
  "email_verified_at",
  "display_name",
  "preferred_locale",
  "last_signed_in_at",
  "created_at",
  "updated_at"
)
SELECT
  auth_user."id",
  auth_user."email",
  auth_user."email_confirmed_at",
  COALESCE(
    auth_user."raw_user_meta_data" ->> 'display_name',
    auth_user."raw_user_meta_data" ->> 'full_name'
  ),
  CASE
    WHEN auth_user."raw_user_meta_data" ->> 'preferred_locale' IN ('ar', 'en')
      THEN (auth_user."raw_user_meta_data" ->> 'preferred_locale')::"public"."content_locale"
    ELSE 'ar'::"public"."content_locale"
  END,
  auth_user."last_sign_in_at",
  auth_user."created_at",
  now()
FROM "auth"."users" AS auth_user
WHERE auth_user."email" IS NOT NULL
ON CONFLICT ("id") DO UPDATE SET
  "email" = EXCLUDED."email",
  "email_verified_at" = EXCLUDED."email_verified_at",
  "last_signed_in_at" = EXCLUDED."last_signed_in_at",
  "updated_at" = now();

-- SECURITY DEFINER prevents recursive membership-table RLS. Both functions are
-- kept outside exposed schemas, use an empty search_path, and derive identity
-- only from auth.uid(); raw user metadata and JWT role claims are not authority.
CREATE OR REPLACE FUNCTION "private"."authorized_store_ids"(
  allowed_roles "public"."store_member_role"[]
)
RETURNS uuid[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE(array_agg(member."store_id"), '{}'::uuid[])
  FROM "public"."store_members" AS member
  INNER JOIN "public"."users" AS profile ON profile."id" = member."user_id"
  WHERE (SELECT "auth"."uid"()) IS NOT NULL
    AND member."user_id" = (SELECT "auth"."uid"())
    AND member."disabled_at" IS NULL
    AND profile."disabled_at" IS NULL
    AND (allowed_roles IS NULL OR member."role" = ANY(allowed_roles));
$$;

CREATE OR REPLACE FUNCTION "private"."authorized_organization_ids"(
  allowed_roles "public"."organization_role"[]
)
RETURNS uuid[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE(array_agg(member."organization_id"), '{}'::uuid[])
  FROM "public"."organization_members" AS member
  INNER JOIN "public"."users" AS profile ON profile."id" = member."user_id"
  WHERE (SELECT "auth"."uid"()) IS NOT NULL
    AND member."user_id" = (SELECT "auth"."uid"())
    AND member."disabled_at" IS NULL
    AND profile."disabled_at" IS NULL
    AND (allowed_roles IS NULL OR member."role" = ANY(allowed_roles));
$$;

REVOKE ALL ON FUNCTION "private"."authorized_store_ids"("public"."store_member_role"[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION "private"."authorized_organization_ids"("public"."organization_role"[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION "private"."authorized_store_ids"("public"."store_member_role"[]) TO "authenticated";
GRANT EXECUTE ON FUNCTION "private"."authorized_organization_ids"("public"."organization_role"[]) TO "authenticated";

-- Fail closed at both the table privilege and RLS layers. UUID primary keys do
-- not currently use sequences, but revoke sequences as a future-safe default.
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA "public" FROM "anon", "authenticated";
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA "public" FROM "anon", "authenticated";
ALTER DEFAULT PRIVILEGES IN SCHEMA "public"
  REVOKE ALL PRIVILEGES ON TABLES FROM "anon", "authenticated";
ALTER DEFAULT PRIVILEGES IN SCHEMA "public"
  REVOKE ALL PRIVILEGES ON SEQUENCES FROM "anon", "authenticated";

-- Every current public table is protected, including tables deliberately given
-- no end-user policies such as OAuth state, session, outbox, and webhook inbox.
DO $$
DECLARE
  table_name text;
BEGIN
  FOR table_name IN
    SELECT tables."tablename"
    FROM "pg_catalog"."pg_tables" AS tables
    WHERE tables."schemaname" = 'public'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', table_name);
  END LOOP;
END
$$;

-- Identity, organization, and explicit store membership policies.
CREATE POLICY "users_self_select"
  ON "public"."users"
  FOR SELECT TO "authenticated"
  USING ("id" = (SELECT "auth"."uid"()));
CREATE POLICY "users_self_update"
  ON "public"."users"
  FOR UPDATE TO "authenticated"
  USING ("id" = (SELECT "auth"."uid"()))
  WITH CHECK ("id" = (SELECT "auth"."uid"()));

CREATE POLICY "organizations_member_select"
  ON "public"."organizations"
  FOR SELECT TO "authenticated"
  USING (
    "id" = ANY("private"."authorized_organization_ids"(
      NULL::"public"."organization_role"[]
    ))
  );
CREATE POLICY "organization_members_member_select"
  ON "public"."organization_members"
  FOR SELECT TO "authenticated"
  USING (
    "organization_id" = ANY("private"."authorized_organization_ids"(
      NULL::"public"."organization_role"[]
    ))
  );
CREATE POLICY "stores_member_select"
  ON "public"."stores"
  FOR SELECT TO "authenticated"
  USING (
    "id" = ANY("private"."authorized_store_ids"(
      NULL::"public"."store_member_role"[]
    ))
  );
CREATE POLICY "store_members_member_select"
  ON "public"."store_members"
  FOR SELECT TO "authenticated"
  USING (
    "store_id" = ANY("private"."authorized_store_ids"(
      NULL::"public"."store_member_role"[]
    ))
  );

-- Public pricing is the only anonymous-readable database surface.
CREATE POLICY "plans_active_public_select"
  ON "public"."plans"
  FOR SELECT TO "anon", "authenticated"
  USING ("active" = true);
CREATE POLICY "entitlements_active_plan_public_select"
  ON "public"."entitlements"
  FOR SELECT TO "anon", "authenticated"
  USING (
    EXISTS (
      SELECT 1
      FROM "public"."plans" AS plan
      WHERE plan."id" = "entitlements"."plan_id"
        AND plan."active" = true
    )
  );

GRANT SELECT ON "public"."users" TO "authenticated";
GRANT UPDATE ("display_name", "preferred_locale") ON "public"."users" TO "authenticated";
GRANT SELECT ON
  "public"."organizations",
  "public"."organization_members",
  "public"."stores",
  "public"."store_members"
TO "authenticated";
GRANT SELECT ON "public"."plans", "public"."entitlements" TO "anon", "authenticated";

-- Store tables are intentionally partitioned into disjoint read groups. Tests
-- compare these constants against every store_id table in the schema.
DO $$
DECLARE
  viewer_tables CONSTANT text[] := ARRAY[
    'ai_visibility_checks',
    'ai_visibility_citations',
    'ai_visibility_competitors',
    'ai_visibility_mentions',
    'ai_visibility_queries',
    'ai_visibility_score_components',
    'ai_visibility_scores',
    'audit_findings',
    'categories',
    'connection_capabilities',
    'daily_product_metrics',
    'daily_store_metrics',
    'page_audits',
    'product_attributes',
    'product_audits',
    'product_categories',
    'product_media',
    'product_translations',
    'product_variants',
    'products',
    'store_pages',
    'store_policies'
  ];
  support_tables CONSTANT text[] := ARRAY[
    'conversation_signals',
    'conversations',
    'human_handoffs',
    'messages',
    'recommendation_events',
    'recommendation_items',
    'recommendations',
    'safety_interventions'
  ];
  analyst_tables CONSTANT text[] := ARRAY[
    'attribution_rules',
    'cart_items',
    'carts',
    'commerce_events',
    'content_approvals',
    'content_drafts',
    'content_versions',
    'customers',
    'document_chunks',
    'documents',
    'merchant_insights',
    'merchant_messages',
    'merchant_threads',
    'merchant_tool_runs',
    'opportunities',
    'opportunity_actions',
    'opportunity_targets',
    'order_attributions',
    'order_items',
    'orders',
    'product_documents',
    'publication_runs',
    'visitors',
    'widget_sessions'
  ];
  admin_tables CONSTANT text[] := ARRAY[
    'audit_logs',
    'job_runs',
    'platform_connections',
    'subscriptions',
    'sync_checkpoints',
    'sync_errors',
    'sync_jobs',
    'usage_records',
    'webhook_registrations'
  ];
  system_tables CONSTANT text[] := ARRAY[
    'oauth_states',
    'outbox_events',
    'webhook_events'
  ];
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY viewer_tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', table_name || '_viewer_select', table_name);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (store_id = ANY(private.authorized_store_ids(NULL::public.store_member_role[])))',
      table_name || '_viewer_select',
      table_name
    );
    EXECUTE format('GRANT SELECT ON public.%I TO authenticated', table_name);
  END LOOP;

  FOREACH table_name IN ARRAY support_tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', table_name || '_support_select', table_name);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (store_id = ANY(private.authorized_store_ids(ARRAY[''owner'',''admin'',''analyst'',''support'']::public.store_member_role[])))',
      table_name || '_support_select',
      table_name
    );
    IF table_name <> 'human_handoffs' THEN
      EXECUTE format('GRANT SELECT ON public.%I TO authenticated', table_name);
    END IF;
  END LOOP;

  FOREACH table_name IN ARRAY analyst_tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', table_name || '_analyst_select', table_name);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (store_id = ANY(private.authorized_store_ids(ARRAY[''owner'',''admin'',''analyst'']::public.store_member_role[])))',
      table_name || '_analyst_select',
      table_name
    );
    IF table_name <> ALL(ARRAY[
      'customers',
      'document_chunks',
      'documents',
      'merchant_tool_runs',
      'widget_sessions'
    ]) THEN
      EXECUTE format('GRANT SELECT ON public.%I TO authenticated', table_name);
    END IF;
  END LOOP;

  FOREACH table_name IN ARRAY admin_tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', table_name || '_admin_select', table_name);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (store_id = ANY(private.authorized_store_ids(ARRAY[''owner'',''admin'']::public.store_member_role[])))',
      table_name || '_admin_select',
      table_name
    );
    IF table_name <> ALL(ARRAY['audit_logs', 'job_runs', 'platform_connections']) THEN
      EXECUTE format('GRANT SELECT ON public.%I TO authenticated', table_name);
    END IF;
  END LOOP;

  -- These are deliberately policy-free and privilege-free for end users. The
  -- loop asserts the names remain valid migration targets.
  FOREACH table_name IN ARRAY system_tables LOOP
    IF to_regclass(format('public.%I', table_name)) IS NULL THEN
      RAISE EXCEPTION 'Missing system-only RLS table: %', table_name;
    END IF;
  END LOOP;
END
$$;

-- Column-level grants keep encrypted, hashed, raw-payload, and provider-secret
-- fields inaccessible even to an otherwise authorized store member.
GRANT SELECT (
  "id", "store_id", "conversation_id", "assigned_store_member_id", "status",
  "priority", "reason", "summary", "suggested_response", "contact_consent",
  "resolved_at", "created_at", "updated_at"
) ON "public"."human_handoffs" TO "authenticated";

GRANT SELECT (
  "id", "store_id", "external_id", "display_name", "preferred_locale",
  "consent_state", "consent_updated_at", "first_seen_at", "last_seen_at",
  "source_updated_at", "source_deleted_at", "created_at", "updated_at"
) ON "public"."customers" TO "authenticated";

GRANT SELECT (
  "id", "store_id", "kind", "status", "title", "locale", "source_url",
  "mime_type", "checksum_sha256", "byte_size", "source_updated_at",
  "archived_at", "created_at", "updated_at"
) ON "public"."documents" TO "authenticated";

GRANT SELECT (
  "id", "store_id", "thread_id", "merchant_message_id", "tool_name", "status",
  "idempotency_key", "error_code", "started_at", "finished_at", "latency_ms",
  "created_at"
) ON "public"."merchant_tool_runs" TO "authenticated";

GRANT SELECT (
  "id", "store_id", "visitor_id", "customer_id", "consent_state", "opened_at",
  "last_activity_at", "ended_at", "expires_at", "created_at"
) ON "public"."widget_sessions" TO "authenticated";

GRANT SELECT (
  "id", "store_id", "actor_user_id", "actor_store_member_id", "actor_type",
  "action", "resource_type", "resource_id", "request_id", "idempotency_key",
  "occurred_at", "created_at"
) ON "public"."audit_logs" TO "authenticated";

GRANT SELECT (
  "id", "store_id", "sync_job_id", "queue_name", "job_name", "external_job_id",
  "attempt_number", "status", "idempotency_key", "error_code", "scheduled_for",
  "started_at", "finished_at", "created_at"
) ON "public"."job_runs" TO "authenticated";

GRANT SELECT (
  "id", "store_id", "platform", "external_store_id", "status", "token_version",
  "token_expires_at", "scopes", "last_verified_at", "disconnected_at",
  "created_at", "updated_at"
) ON "public"."platform_connections" TO "authenticated";

-- There is intentionally no authenticated grant for document_chunks,
-- oauth_states, outbox_events, or webhook_events. Server DTOs may expose
-- narrowly selected derived information after repeating authorization.
