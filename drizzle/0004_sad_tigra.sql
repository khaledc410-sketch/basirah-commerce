-- Snapshot reconciliation for the identity changes applied by
-- 0003_auth_tenant_rls.sql. Keeping this migration non-mutating prevents
-- Drizzle from generating the hand-authored Supabase linkage a second time.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
      AND column_name = 'password_hash'
  ) THEN
    RAISE EXCEPTION '0003 identity migration did not remove users.password_hash';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'organization_members'
      AND column_name = 'disabled_at'
  ) THEN
    RAISE EXCEPTION '0003 identity migration did not add organization_members.disabled_at';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'organization_members'
      AND indexname = 'organization_members_user_active_idx'
  ) THEN
    RAISE EXCEPTION '0003 identity migration did not add the active organization-member index';
  END IF;
END
$$;
