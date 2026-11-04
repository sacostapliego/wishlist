-- =============================================================================
-- v3 migration 006: saved_wishlists cascades
-- =============================================================================
-- Run after migrations_v3_005_security_advisor.sql.
--
-- saved_wishlists was created without ON DELETE CASCADE, so deleting a list that
-- someone else had saved failed on the foreign key, and so did deleting an
-- account that had saved anything. The delete route now removes the saves
-- itself, which works with or without this; this makes the database agree, so
-- the next code path that deletes a list or a user does not have to know.
--
-- Rows are not changed. Only the two constraints are replaced.
-- =============================================================================

BEGIN;

ALTER TABLE public.saved_wishlists
    DROP CONSTRAINT IF EXISTS saved_wishlists_wishlist_id_fkey,
    ADD CONSTRAINT saved_wishlists_wishlist_id_fkey
        FOREIGN KEY (wishlist_id) REFERENCES public.wishlists(id) ON DELETE CASCADE;

ALTER TABLE public.saved_wishlists
    DROP CONSTRAINT IF EXISTS saved_wishlists_user_id_fkey,
    ADD CONSTRAINT saved_wishlists_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

COMMIT;
