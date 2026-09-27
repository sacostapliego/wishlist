-- =============================================================================
-- v3 migration 001: guest sessions
-- =============================================================================
-- Run this against the existing database. It is additive only: no column is
-- dropped and no row is rewritten, so current data is untouched.
--
-- Background: guest claims used to be identified by the typed-in display name,
-- which is returned to every visitor in the API response. Anyone could unclaim
-- anyone else's item by sending that name back. A guest now gets a random token
-- at claim time, and only its hash is stored here.
--
-- Run order: 1) create table, 2) add column, 3) add indexes.
-- =============================================================================

-- 1. Account-less identities, scoped to a single wishlist ---------------------
CREATE TABLE IF NOT EXISTS public.guest_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  wishlist_id uuid NOT NULL,
  display_name character varying NOT NULL,
  email character varying,              -- optional; reserved for magic-link recovery
  token_hash character varying NOT NULL,-- sha256 of the token, never the token itself
  created_at timestamp with time zone DEFAULT now(),
  last_seen_at timestamp with time zone,
  CONSTRAINT guest_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT guest_sessions_token_hash_key UNIQUE (token_hash),
  CONSTRAINT guest_sessions_wishlist_id_fkey
    FOREIGN KEY (wishlist_id) REFERENCES public.wishlists(id) ON DELETE CASCADE
);

-- 2. Point claims at a session instead of a free-text name --------------------
-- claimed_by_name is intentionally kept: existing guest claims still live there
-- and are still displayed. New claims never write to it.
ALTER TABLE public.wishlist_items
  ADD COLUMN IF NOT EXISTS claimed_by_guest_session_id uuid;

ALTER TABLE public.wishlist_items
  DROP CONSTRAINT IF EXISTS wishlist_items_claimed_by_guest_session_id_fkey;

ALTER TABLE public.wishlist_items
  ADD CONSTRAINT wishlist_items_claimed_by_guest_session_id_fkey
    FOREIGN KEY (claimed_by_guest_session_id)
    REFERENCES public.guest_sessions(id) ON DELETE SET NULL;

-- 3. Indexes ------------------------------------------------------------------
-- token_hash is looked up on every guest request, so it needs to be fast.
CREATE INDEX IF NOT EXISTS guest_sessions_wishlist_id_idx
  ON public.guest_sessions (wishlist_id);

CREATE INDEX IF NOT EXISTS wishlist_items_claimed_by_guest_session_id_idx
  ON public.wishlist_items (claimed_by_guest_session_id);

-- =============================================================================
-- OPTIONAL - not part of the migration. Nothing below needs to run.
-- Everything above this line is the migration; run it top to bottom, once.
-- =============================================================================

-- AFTER migrating, this counts guest claims made before guest sessions existed.
-- They still display correctly, but the guest who made them can no longer
-- release them - there was never anything proving they made them.
--
--   SELECT count(*) AS legacy_guest_claims
--     FROM public.wishlist_items
--    WHERE claimed_by_name IS NOT NULL;
--
-- If someone asks you to release one of those, clear it by hand:
--
--   UPDATE public.wishlist_items
--      SET claimed_by_name = NULL, claimed_at = NULL
--    WHERE id = '<item id>';
