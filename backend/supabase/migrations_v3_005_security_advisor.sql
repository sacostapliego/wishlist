-- =============================================================================
-- v3 migration 005: Supabase Security Advisor warnings
-- =============================================================================
-- Run after migrations_v3_004_contributions.sql. Clears 16 of the 17 warnings.
-- The last one, the Postgres version, is an upgrade in the Supabase dashboard.
-- No table, column or row is changed.
--
-- Check two things before running this:
--
-- 1. DATABASE_URL must log in as `postgres`, shown as `postgres` or
--    `postgres.<project-ref>` in the URL. If it uses `anon` or `authenticated`,
--    step 1 below locks the API out of every table.
--
-- 2. Look at the body of the trigger function:
--
--      select pg_get_functiondef('public.trigger_set_timestamp'::regproc);
--
--    Expected is something like `NEW.updated_at = NOW()`, which is fine. If it
--    names a table, view or custom function without `public.` in front, step 3
--    would make every update to a table using this trigger fail. The function is
--    not in this repo, so this cannot be checked here.
-- =============================================================================

BEGIN;

-- 1. Public access. 14 warnings, 7 tables for each of 2 roles.
--
-- The API connects as the table owner, so nothing it does goes through `anon` or
-- `authenticated`. Those roles only exist for browsers talking to Supabase
-- directly, which this app never does. RLS already keeps rows out of reach; this
-- also hides the table and column names, and covers tables added later.
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;

-- Nothing in the app uses GraphQL. It can be turned back on under
-- Database > Extensions.
DROP EXTENSION IF EXISTS pg_graphql;

-- 2. Extension in public. 1 warning.
--
-- wishlist_items.embedding keeps working, because a column points at its type
-- rather than at the schema name. Any future vector query needs `extensions` on
-- its search_path.
CREATE SCHEMA IF NOT EXISTS extensions;
ALTER EXTENSION vector SET SCHEMA extensions;

-- 3. Function search path. 1 warning.
--
-- Stops a caller changing what the names in this function resolve to. NOW() still
-- works with an empty path, because pg_catalog is always searched.
ALTER FUNCTION public.trigger_set_timestamp() SET search_path = '';

-- 4. Blocks the Postgres upgrade, which does not support this extension.
--
-- The API signs its tokens with PyJWT, so nothing here uses it. No CASCADE, so if
-- anything in the database does depend on it, this fails and the whole migration
-- rolls back rather than removing that too.
DROP EXTENSION IF EXISTS pgjwt;

COMMIT;
