-- =============================================================================
-- v3 migration 004: contribution items
-- =============================================================================
-- Run after migrations_v3_003_claimed_under_mode.sql. Additive only; no column
-- dropped, no existing row rewritten.
--
-- A contribution item is one several people chip in toward instead of one
-- person buying outright. Honor system only - no money moves through the app,
-- which links out to the real store. A pledge is a statement of intent.
--
-- The goal is the item's existing `price`. It is already nullable, and that
-- nullability is the feature: "help me pay for my car" has no target, so the
-- item shows a running total instead of a progress bar. No second goal column,
-- so a price and a goal can never disagree.
-- =============================================================================

-- Contribution mode, and the owner's own declared head start.
--
-- owner_seed_amount is a column on the item and deliberately NOT a row in
-- item_contributions. Otherwise the query that hides contributions from a blind
-- owner needs an exception carved out for the owner's own row, and that
-- exception is a privacy bug waiting to be written by someone who forgets it.
ALTER TABLE public.wishlist_items
  ADD COLUMN IF NOT EXISTS is_contribution boolean NOT NULL DEFAULT false;

ALTER TABLE public.wishlist_items
  ADD COLUMN IF NOT EXISTS owner_seed_amount double precision;

ALTER TABLE public.wishlist_items
  DROP CONSTRAINT IF EXISTS wishlist_items_owner_seed_amount_check;

ALTER TABLE public.wishlist_items
  ADD CONSTRAINT wishlist_items_owner_seed_amount_check
    CHECK (owner_seed_amount IS NULL OR owner_seed_amount >= 0);

-- Contributing and claiming are mutually exclusive: an item must never be both
-- 60% funded and claimed by one person. The routes reject this, and so does the
-- database, because the routes are where a future code path will forget.
ALTER TABLE public.wishlist_items
  DROP CONSTRAINT IF EXISTS wishlist_items_contribution_not_claimed_check;

ALTER TABLE public.wishlist_items
  ADD CONSTRAINT wishlist_items_contribution_not_claimed_check
    CHECK (
      is_contribution = false
      OR (
        claimed_by_user_id IS NULL
        AND claimed_by_guest_session_id IS NULL
        AND claimed_by_name IS NULL
      )
    );

-- One row per pledge. Same identity shape as a claim - a member or a guest,
-- never both - but with two real foreign keys instead of the claims table's
-- free-text legacy name, so "edit my pledge" is the same permission check as
-- unclaiming.
CREATE TABLE IF NOT EXISTS public.item_contributions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL,

  -- Exactly one of these is set. See the check constraint below.
  contributor_user_id uuid,
  guest_session_id uuid,

  amount double precision NOT NULL,
  note character varying(280),

  -- The wishlist's visibility_mode when the pledge was made, for exactly the
  -- reason wishlist_items.claimed_under_mode exists (migration 003): flipping a
  -- blind list to open must not retroactively show the owner pledges people
  -- made believing they were hidden. The owner sees a pledge only when the list
  -- is open now AND was open then. No NULL case to worry about - the table is
  -- new, so every row is written by code that sets this.
  contributed_under_mode character varying(10),

  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone,

  CONSTRAINT item_contributions_pkey PRIMARY KEY (id),

  CONSTRAINT item_contributions_item_id_fkey
    FOREIGN KEY (item_id) REFERENCES public.wishlist_items(id) ON DELETE CASCADE,

  -- Both cascade rather than SET NULL: a NULLed identity column would leave a
  -- row that satisfies neither half of the one-identity check below, so the
  -- pledge goes when the person it belonged to goes.
  CONSTRAINT item_contributions_contributor_user_id_fkey
    FOREIGN KEY (contributor_user_id) REFERENCES public.users(id) ON DELETE CASCADE,

  CONSTRAINT item_contributions_guest_session_id_fkey
    FOREIGN KEY (guest_session_id) REFERENCES public.guest_sessions(id) ON DELETE CASCADE,

  -- A pledge belongs to a member or a guest, never to both and never to nobody.
  CONSTRAINT item_contributions_one_identity_check
    CHECK ((contributor_user_id IS NOT NULL) <> (guest_session_id IS NOT NULL)),

  CONSTRAINT item_contributions_amount_check CHECK (amount > 0),

  CONSTRAINT item_contributions_contributed_under_mode_check
    CHECK (contributed_under_mode IS NULL OR contributed_under_mode IN ('blind', 'open'))
);

-- Every read is "the pledges on this item".
CREATE INDEX IF NOT EXISTS item_contributions_item_id_idx
  ON public.item_contributions (item_id);

-- One pledge per person per item. Raising your pledge is an edit, not a second
-- row, which is what lets the API expose a single /contributions/mine.
-- Partial indexes because only one identity column is ever set.
CREATE UNIQUE INDEX IF NOT EXISTS item_contributions_one_per_user_idx
  ON public.item_contributions (item_id, contributor_user_id)
  WHERE contributor_user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS item_contributions_one_per_guest_idx
  ON public.item_contributions (item_id, guest_session_id)
  WHERE guest_session_id IS NOT NULL;

-- =============================================================================
-- OPTIONAL - not part of the migration. Nothing below needs to run.
-- Everything above this line is the migration; run it top to bottom, once.
-- =============================================================================

-- AFTER migrating, every existing item should be a normal, non-contribution
-- item, and the new table should be empty:
--
--   SELECT is_contribution, count(*)
--     FROM public.wishlist_items
--    GROUP BY is_contribution;
--
--   SELECT count(*) FROM public.item_contributions;
--
-- Expect every item under `false`, and zero contributions.

-- To confirm the mutual-exclusion constraint is live, this should fail:
--
--   UPDATE public.wishlist_items
--      SET is_contribution = true
--    WHERE claimed_at IS NOT NULL
--    LIMIT 1;
