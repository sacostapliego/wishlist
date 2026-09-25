# Wishlist visibility modes

**Status:** implemented (v3)
**Applies to:** claims now; contributions when those land

## The two modes

| Mode | The owner sees | Visitors see |
| --- | --- | --- |
| `blind` (default) | nothing about claims | who claimed what |
| `open` | every claim, with names and times | who claimed what, plus a notice that the owner can see it too |

`blind` is the default and the backfill value for every list that existed
before this change. A list must never open itself by omission.

## What was actually broken

"The owner cannot see who claimed what" was **frontend-only**. Every
owner-facing endpoint returned `claimed_by_user_id`, `claimed_by_name` and
`claimed_at`, and the owner-facing list endpoints went out of their way to
resolve a `claimed_by_display_name` for them. An owner with devtools open, or
hitting the API directly, saw every claim.

So this release is not only "add a second mode" — it is the first time the
first mode is enforced at all.

## The rule

To the owner of a blind list, **a claimed item must be indistinguishable from
an unclaimed one.**

Not merely missing the claimer's name. Nothing may vary with claim state:
not `is_claimed`, not `claimed_at`, not a claimed-item count, not a "recently
active" ordering, not a badge. Any field that differs between zero claims and
one is a leak, because an owner who can tell *that* something was claimed has
lost the surprise even without knowing who.

This is enforced in one function — `serialize_item` in
`backend/services/item_serializer.py`. That function is deliberately the only
place an item becomes an API response, so the rule is written once instead of
in the five routes that previously each had their own copy of the display-name
logic.

A missing wishlist relationship is treated as blind. An item with no list
cannot be claimed through a shared page anyway, and defaulting to hidden means
a future code path that forgets to eager-load the relationship leaks nothing.

## Why visitors are told

Most lists are blind, and a visitor reasonably assumes it. Claiming on an open
list without being told would mean giving away your own surprise without
agreeing to it — the owner made a choice, and the visitor pays for it.

`OpenListNotice` shows once per list per browser, before any claim. Not on
every visit: a dialog people see repeatedly gets dismissed unread, which is
worse than not showing it. Seen ids live in `localStorage`; if storage is
unavailable the notice shows again, which is the safe direction to fail.

## Switching modes, and why a claim remembers

Flipping a blind list to open must not reveal claims people already made. They
claimed believing the owner could not see; the owner does not get to withdraw
that promise after the fact.

So each claim pins the list's mode at the moment it was made, in
`wishlist_items.claimed_under_mode`. **The owner sees a claim only when both are
open** — the list is open now, and it was open when the claim happened.

| List now | Claim made under | Owner sees it |
| --- | --- | --- |
| blind | anything | no |
| open | open | yes |
| open | blind | no |
| open | NULL (pre-migration) | no |

Unclaiming clears the field along with the rest of the claim.

The column is deliberately **not** backfilled. Leaving old rows NULL is what
keeps existing claims hidden; backfilling from `wishlists.visibility_mode`
would reveal exactly the claims this exists to protect.

Blocking the switch outright was considered and rejected — an owner who changes
their mind before anyone has claimed would be locked out for no reason.

## Decided against

**Making claim state visible "just as a count".** Any aggregate leaks; see the
rule above.

## Where the code lives

| Concern | File |
| --- | --- |
| Column + validation | `backend/models/wishlist.py`, `backend/routes/wishlists.py` |
| Mode pinned at claim time | `backend/models/item.py`, `backend/routes/items.py` |
| The rule, enforced | `backend/services/item_serializer.py` |
| Tests for the rule | `backend/tests/test_item_serializer.py` |
| Migrations | `backend/supabase/migrations_v3_002_visibility_mode.sql`, `..._003_claimed_under_mode.sql`, `..._004_contributions.sql` |
| Owner's control | `desktop/src/components/wishlists/WishlistForm.tsx` |
| Visitor notice | `desktop/src/components/wishlists/OpenListNotice.tsx` |

## For contributions

The rule extends unchanged, and is now implemented: a blind owner sees nothing
about contributions - not the total, not the bar, not the contributor count. A
pledge pins its mode in `item_contributions.contributed_under_mode` for the same
reason a claim does, and the owner's own seed amount is a column on the item
rather than a row in the contributions table, specifically so the blind rule
needs no exception carved out for it.

Filtering there happens per pledge rather than per item, so an owner's total can
be lower than a visitor's - the honest figure for what the owner may know.

See [[contributions.md]] for the whole design, and
[[../guest/guest-sessions.md]] for how guest contributors are identified.
