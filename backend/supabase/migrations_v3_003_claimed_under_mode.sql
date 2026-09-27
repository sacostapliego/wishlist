-- =============================================================================
-- v3 migration 003: pin the visibility mode a claim was made under
-- =============================================================================
-- Run after migrations_v3_002_visibility_mode.sql. Additive only.
--
-- Without this, an owner could flip a blind list to 'open' and retroactively
-- see every claim people had already made believing the owner could not. The
-- claimer acted on a promise; the owner does not get to withdraw it later.
--
-- The owner now sees a claim only when BOTH are open: the list is open now,
-- and it was open when the claim was made.
--
-- NULL means a claim made before this column existed. Those are treated as
-- 'blind' — every claim made back then was made on a list the app presented as
-- blind — so no existing claim becomes visible as a result of this migration.
-- =============================================================================

ALTER TABLE public.wishlist_items
  ADD COLUMN IF NOT EXISTS claimed_under_mode character varying(10);

ALTER TABLE public.wishlist_items
  DROP CONSTRAINT IF EXISTS wishlist_items_claimed_under_mode_check;

ALTER TABLE public.wishlist_items
  ADD CONSTRAINT wishlist_items_claimed_under_mode_check
    CHECK (claimed_under_mode IS NULL OR claimed_under_mode IN ('blind', 'open'));

-- Deliberately NOT backfilled to the list's current mode. Leaving these NULL is
-- what keeps existing claims hidden; backfilling from wishlists.visibility_mode
-- would reveal exactly the claims this migration exists to protect.

-- =============================================================================
-- OPTIONAL - not part of the migration. Nothing below needs to run.
-- Everything above this line is the migration; run it top to bottom, once.
-- =============================================================================

-- AFTER migrating, every pre-existing claim should still read NULL:
--
--   SELECT claimed_under_mode, count(*)
--     FROM public.wishlist_items
--    WHERE claimed_at IS NOT NULL
--    GROUP BY claimed_under_mode;
