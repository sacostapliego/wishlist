# Home page — desktop (v3.0.0)

## The problem being fixed

The 2.x home page rendered three carousels: Items Claimed, Friends Lists, My Lists. Two of those three were a second rendering of the sidebar, which already lists My Wishlists and Friends' Wishlists permanently — and both surfaces fetched the same two endpoints independently, so every visit to `/` made four requests for two datasets.

Nothing on the page showed a date, even though every wishlist can carry a `due_date` and the whole app is organised around occasions. A birthday three days away and one eight months away looked identical.

## Principle

**The sidebar is the library. Home answers "what needs my attention."**

Home never becomes the primary navigation path to a list you own — that is the sidebar's job.

## Section order

1. Header — greeting, notification bell, avatar
2. **Up Next** — the nearest upcoming date
3. **Items Claimed** — gifts you owe other people
4. **Your Lists** — your own lists, dense cards

Dropped from the 2.x page: the Friends Lists carousel (superseded by Up Next and the sidebar).
Considered and dropped for this release: a "Needs You" section (folded into the bell), a Recent Activity feed (no events table exists), global search.

## Up Next

### It is keyed on the date, not the list

A user does not think "Bluejay's Christmas list is next." They think "Christmas is next, and three people need gifts." So: take every **friend's** wishlist with a `due_date` that is today or later and within the horizon, group by date, and take the nearest group.

### Horizon: 60 days

Beyond 60 days there is no Up Next and the page opens on Items Claimed. A hero reading "in 243 days" is worse than no hero. Sixty days is deliberately generous — for an expensive gift, two months of warning is useful, and a Christmas list surfacing in May would be absurd.

### Own lists are excluded

Up Next is about gifts you owe other people. Your own list falling on the same date is a different verb — there is nothing to claim, you would only be editing it. When one of your own lists shares the date, it is mentioned as a single muted line beneath the rows rather than given a row of its own.

Your own dated lists still appear in Your Lists, with their countdown badge.

### Rendering by group size

**One list on the date** — full hero: thumbnail, list name, owner, countdown, claim progress, "View list".

**Two to four** — same frame and height, different contents. The date becomes the headline and each list gets its own row with the owner, claim progress and a chevron:

```
UP NEXT · IN 12 DAYS
December 25
3 lists due this day

  [B] Bluejay     Birthday          you've claimed 2 of 9   >
  [M] Marcus      Christmas 2026    9 items, none yet       >
  [A] Alex        Xmas              you've claimed 3 of 4   >
```

Rows are sorted **least-claimed first**, so the person nobody has shopped for is at the top. There is no primary CTA on the hero — each row is its own target, which avoids picking an arbitrary "main" list.

Progress is **the viewer's own claims**, not total claims by everyone. `/friends/wishlists` returns `item_count` but no claim count, and the viewer's claims are already derivable by grouping `/wishlist/claimed/my-items` by `wishlist_id` — so this needs no new endpoint. It is also the more useful number: "you haven't claimed any yet" is the actionable state.

**Five or more** — same as above, capped at four rows, with a final row reading "+N more due December 25".

### Naming the occasion

The headline is the **date**, never a guessed occasion name. There is no occasion field on a wishlist, and deriving one from titles breaks immediately — "Xmas 2026" does not match "Christmas", and two unrelated birthdays on the same day are not one occasion. The list names live in the rows where they are unambiguous.

A real `occasion` label on the wishlist is a possible 3.1 schema addition.

### Overdue

`isWishlistActive` already treats a date as active up to and including the day itself, then drops it. Kept as is.

## Due-date badge

One shared component; three states.

| Condition | Treatment |
|---|---|
| 0–14 days | Accent red text on a 16%-alpha accent ground |
| 15+ days | Muted grey on a 6%-white ground |
| No date | Badge omitted entirely — never a "no date" chip in a card |

Copy is `today`, `tomorrow`, then `in N days`.

## Items Claimed

Unchanged in purpose — this section was always the one earning its place, since the data appears nowhere else. Two changes:

- A countdown chip next to the price, so you can see which gift is urgent without opening it.
- Card height fixed at 96px with the title clamped to two lines. Long scraped titles ("Accmor Car Trash Can with Lid, Mini Auto Dustbin Garbage Organizer with…") previously pushed their card taller than its neighbours and broke row alignment.
- Sorted soonest-first, and capped at a **90-day horizon** (`CLAIMED_HORIZON_DAYS`). A gift for an occasion six months out is a commitment, not something to act on today.

Nothing disappears: `/items/claimed` lists Active and Inactive in full with no horizon. When items fall outside the window, home says so — "N more claimed for later dates" under the row, or in place of the empty-state copy when everything claimed is far off, so the section never reads as "you have claimed nothing" when you have.

## Your Lists

Same carousel, denser card: thumbnail, title, item count, due badge. Four facts instead of one.

The 2.x card also silently dropped the owner name on friends' lists — `HomePage` mapped an `ownerName` the carousel's props interface did not declare — which is why three cards could all read "Birthday" with no way to tell them apart. The carousel now takes and renders a subtitle.

## Loading

Skeletons for all three sections. The 2.x page returned an empty box with a `{/* Add loading spinner here */}` comment, so a slow fetch showed a blank panel. Perceived speed here matters more than any backend change.

## Notification bell

Replaces the "Needs You" section. Version 1 is derived **entirely client-side from data the page already fetches** — no notifications table, no new endpoint:

- Pending friend requests (`/friends/requests`)
- Lists crossing the 7-day mark

Unread state is a last-seen timestamp in `localStorage`.

It deliberately does **not** cover "someone added an item to a list you follow" — that needs a real events table, and is out of scope for 3.0.0.

## Known issues this release touches

`isWishlistActive` parsed `YYYY-MM-DD` with `new Date(str)`, which is UTC midnight, then applied `setHours(0,0,0,0)` in local time. West of UTC that lands a day early — harmless while nothing displayed a date, wrong the moment a countdown is on screen ("in 5 days" for something 6 days out). Dates are now parsed as local.

## Consequence to watch

A friend's list that is undated, or dated more than 60 days out, no longer appears anywhere on home. It is still in the sidebar and under Show all → `/wishlists/friends`. If that turns out to be too aggressive, the fix is a "Friends' Lists" shelf below Your Lists — not widening the horizon.
