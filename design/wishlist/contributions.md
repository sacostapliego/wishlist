# Contribution items

**Status:** implemented (v3), unverified against a running app
**Depends on:** [[visibility-modes.md]], [[../guest/guest-sessions.md]]

## What it is

Some things are too big for one person to buy. A contribution item is one
several people chip in toward instead of one person claiming outright.

**No money moves through the app.** A pledge is a statement of intent on the
honor system, and the item's `url` is where the buying actually happens. This is
not a payments feature and must never look like one — no "pay now", no fees, no
balance.

## The goal is the item's price

There is no separate goal column. `wishlist_items.price` is the target, and its
existing nullability is the feature:

| `price` | The item shows |
| --- | --- |
| set | a progress bar toward the goal |
| NULL | a running total, no bar |

"Help me pay for my car" has no number attached, and that has to be a first-class
case rather than a goal of zero. A second column would also let a price and a
goal disagree on screen, and nothing would say which one was right.

## The owner's seed amount

An owner can declare their own head start — "$2,000 down on a $5,000 car" —
which visitors see. It lives in `wishlist_items.owner_seed_amount`, a column on
the item, and **deliberately not as a row in `item_contributions`**.

If it were a row, then every query that hides contributions from a blind owner
would need an exception carved out for the owner's own row. That exception is a
privacy bug waiting to be written by whoever next touches the query and does not
know why it is there. A column needs no exception, so there is none to forget.

The seed counts toward `contribution_total` but never toward
`contribution_count`: the count answers "how many other people have chipped in",
which is zero when only the owner has.

The API refuses an owner pledging to their own item, pointing them at the seed
amount instead — otherwise the row we just avoided appears anyway.

## Mutually exclusive with claiming

An item is claimed *or* contributed to, never both. Otherwise it can end up 60%
funded and also claimed by one person, and neither number means anything.

This is enforced in three places, on purpose:

| Where | What it refuses |
| --- | --- |
| `claim_item` | claiming a contribution item |
| the contribution routes | pledging to a non-contribution or claimed item |
| a `CHECK` constraint on `wishlist_items` | the combination existing at all |

The routes are where a future code path will forget; the constraint is what
catches it when they do.

Switching an existing item between modes is allowed but conditional. Turning
contributions **on** requires the claim to be released first. Turning them
**off** is refused while pledges exist — deleting them silently is the wrong
default, because somebody said they would put money in and the owner should have
to see that before it is thrown away.

## One pledge per person

A unique index per item per identity, so "my pledge" is addressable without an
id:

```
POST   /wishlist/{item_id}/contributions        pledge
GET    /wishlist/{item_id}/contributions        list them
PUT    /wishlist/{item_id}/contributions/mine   change amount or note
DELETE /wishlist/{item_id}/contributions/mine   withdraw
```

Raising your pledge is an edit, not a second row. That makes editing it the same
permission check as unclaiming: you can only touch your own.

The write endpoints return the **item**, not the pledge, so the client gets the
new total in the same round trip and can redraw the bar without a second
request.

## Identity

```
item_contributions
  id, item_id
  contributor_user_id  (nullable, FK users)
  guest_session_id     (nullable, FK guest_sessions)
  amount, note, contributed_under_mode, created_at, updated_at
```

Exactly one identity column is set — a `CHECK` constraint, not a convention.
Same shape as a claim, but with two real foreign keys instead of the claims
table's free-text `claimed_by_name`, so there is no legacy category here that
cannot prove who it belongs to.

Guest contributors need nothing new: they reuse the guest sessions built for
claiming, and the token in `X-Guest-Token` is what authorises editing their own
pledge. Identity always comes from the JWT or that header, never from the request
body.

Both foreign keys cascade on delete rather than nulling. A NULLed identity column
would leave a row belonging to nobody, which satisfies neither half of the
one-identity check, so a pledge goes when the person it belonged to goes.

## Visibility

The rule from [[visibility-modes.md]] extends unchanged: **to the owner of a
blind list, an item with pledges must serialize identically to one without.** Not
just without names — no total beyond their own seed, no contributor count,
nothing a progress bar could be drawn from.

| Viewer | Sees |
| --- | --- |
| visitor or contributor | everything, on either mode |
| owner, blind list | their own seed amount and nothing else |
| owner, open list | every pledge made while the list was open |

Pledges pin the list's mode at the moment they are made, in
`contributed_under_mode`, for exactly the reason `claimed_under_mode` exists:
flipping a blind list to open must not retroactively reveal pledges made
believing the owner could not see them.

Filtering happens **per pledge**, not all-or-nothing, so a blind-era pledge stays
hidden even after the list is opened. An owner's total can therefore be lower
than a visitor's. That is correct: it is the honest figure for what the owner is
entitled to know, and — the part that matters — it does not vary with what they
are not.

Editing a pledge deliberately does **not** re-pin `contributed_under_mode`. The
field records the promise the pledge was made under, and changing an amount does
not renegotiate it. Re-pinning would hand an owner the whole reveal back: open
the list, ask everyone to adjust their amount, see everything.

`contributions_hidden` on the item response tells a blind owner that figures were
withheld. This is safe to expose because it is true whether or not anyone has
pledged — it says "you cannot see this", not "there is something to see". The
client needs it to explain the blank instead of rendering "$0 of $5,000" as
though nobody had contributed.

## Where the code lives

| Concern | File |
| --- | --- |
| Table and pydantic models | `backend/models/item_contribution.py` |
| Item columns (`is_contribution`, `owner_seed_amount`) | `backend/models/item.py` |
| Pledge endpoints | `backend/routes/contributions.py` |
| Mode toggling and its conditions | `backend/routes/items.py` |
| The visibility rule, enforced | `backend/services/item_serializer.py` |
| Tests for that rule | `backend/tests/test_item_serializer.py` |
| Migration | `backend/supabase/migrations_v3_004_contributions.sql` |
| Client API calls | `desktop/src/services/wishlist.ts` |
| Pledge flow, incl. guests | `desktop/src/hooks/useItemContributions.ts` |
| Progress bar, pledge form, contributor list | `desktop/src/components/items/ItemContributionSection.tsx` |
| Where those are rendered | `desktop/src/components/items/ItemDetailContent.tsx` |
| Owner's toggle and seed input | `desktop/src/components/items/ItemForm.tsx` |

## The UI

The item page carries it, in two places, split along the line between doing
something and knowing something:

- **A fixed bottom bar** holds the visitor's action — the figures, and *Chip in*
  or *You're in for $50* with *Change* and *Withdraw*. The amount and note are
  collected in a dialog rather than inline, because a form in a fixed bar covers
  half a phone screen. The owner gets no bar; the API refuses their pledge.
- **A panel in the page body** lists who has chipped in, and is where a blind
  owner is told the figures are withheld. Information rather than action, and the
  owner sees it too.

Nothing about contributions appears on wishlist cards or grids, because claim
state does not either — the item page is the only surface that discusses either.

Two details worth keeping:

**The pledge amount survives the guest name prompt.** A claim is one tap, but a
pledge carries a number. A guest who types $50, gets asked their name, and has to
type $50 again is being asked twice for the same thing, so the amount is held in
`pendingPledge` and replayed after the session exists.

**A total above the goal is not an error.** The bar caps at full and the numbers
stay honest — the honor system does not enforce arithmetic, and "$5,500 of
$5,000" with *Fully funded* is the truth.

The owner's form puts the toggle **above** the price field, because turning it on
changes what the price means: the label becomes *Goal*, and blank now means
"running total, no bar" rather than "no price". The API's refusals — turning
contributions off while pledges exist, on while the item is claimed — are
surfaced verbatim, since each one is a sentence worth reading.

## Decided against

**Showing a blind owner the total "just as a number".** Any aggregate leaks; it
is the same argument as a claimed-item count in
[[visibility-modes.md]].

**Storing running totals on the item.** Denormalised columns would avoid summing
pledges on read, but they can drift out of step with the rows, and a total that
disagrees with the list of pledges under it is worse than a slower query. The
routes eager-load pledges with `selectinload`, which is one extra query per
request regardless of how many items are on the page.

**Deleting pledges when contributions are switched off.** See above — the owner
has to see what they are discarding.
