-- =============================================================================
-- v3 migration 002: wishlist visibility mode
-- =============================================================================
-- Run after migrations_v3.sql. Additive only; no column dropped, no row
-- rewritten beyond the backfill below, which sets every existing list to the
-- behaviour it already had.
--
-- 'blind' - the owner never sees who claimed what on their own list. This is
--           what the app has always intended, though until now it was only
--           enforced in the frontend; the API handed the owner every claim.
-- 'open'  - the owner sees claims, and visitors are told so before they claim.
--
-- Existing lists all become 'blind', because that is the promise their
-- visitors claimed under. Nobody's list changes behaviour as a result of this
-- migration.
-- =============================================================================

ALTER TABLE public.wishlists
  ADD COLUMN IF NOT EXISTS visibility_mode character varying(10) NOT NULL DEFAULT 'blind';

-- Reject anything but the two known modes, so a bad write cannot quietly open
-- a blind list.
ALTER TABLE public.wishlists
  DROP CONSTRAINT IF EXISTS wishlists_visibility_mode_check;

ALTER TABLE public.wishlists
  ADD CONSTRAINT wishlists_visibility_mode_check
    CHECK (visibility_mode IN ('blind', 'open'));

-- =============================================================================
-- OPTIONAL - not part of the migration. Nothing below needs to run.
-- Everything above this line is the migration; run it top to bottom, once.
-- =============================================================================

-- AFTER migrating, confirm every list landed on a valid mode:
--
--   SELECT visibility_mode, count(*)
--     FROM public.wishlists
--    GROUP BY visibility_mode;
--
-- Expect every row under 'blind'.
