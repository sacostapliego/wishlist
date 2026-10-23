### TODO:
- Item display option: let users choose how to display their item — the current method, or a
  "cover" option (image fills the card)
- Collaboration wishlist: is there a way for multiple users to edit one wishlist (add, remove and
  edit items)?
----
### Desktop:
- Guest view of an item at 1080p: the claim bar spans the content column, not a chip in the corner

### Mobile (the narrow-viewport layout inside desktop/, not the mobile/ Expo app):
- Claim bar on iOS Safari, signed-in (the guest case was checked on iOS 27): rides just above the URL
  bar, and drops to the screen edge once that bar collapses on scroll. Settled: Safari anchors
  bottom-fixed elements to the visible viewport on its own, so the bar's offset must NOT include
  `--toolbar-overlap` — doing so counted the toolbar twice and left the button a toolbar's height up
  the screen. See the warning in App.css before touching that token again.
- Item page text sizes were stepped down for phones (`mdDown` only, desktop unchanged) — check on an
  iPhone that the name, price, link row and claim bar all fit above the nav without crowding.

### Mobile restyle — match the wishlist view
The wishlist page sets the look; the other mobile pages should follow it, without copying Apple Music outright. Its patterns: a header that fades the list colour into the page, centred artwork
with a soft shadow, centred title, owner name in slightly dimmed white, a small grey metadata line
with • separators, plain ruled rows instead of cards, ghost icon buttons, a 1rem side gutter.
Every change is phone-only (`mdDown` / `base`) — desktop stays as it is.

**0. Shared pieces first** (so every page uses the same ones)
- `MobilePageHeader` — back + action icons row, centred title, optional metadata line, optional
  fade colour
- `PlainRow` — thumbnail, 1rem title clamped to one line, 0.875rem grey subline, the wishlist rows'
  hairline dividers
- One phone type scale: page title 2xl (24px), item title xl (20px), row title 1rem, metadata xs

**1. Item page**
- Move off `h={{ base: 'calc(100vh + 80px)' }}` — the last page still on that old iOS workaround.
  It makes the whole layout scroll, so the sticky header ("Birthday") slides under the status bar.
- Re-check the claim bar on iOS Safari, signed in and as a guest (see the claim-bar note above).

**2. Lists** (`/wishlists/mine`, `/wishlists/friends`)
- Two-column grid of big tiles → `PlainRow`s: list thumbnail, title, "8 items • 12 days left"
  (existing DueBadge). Keep the Active / Past split with smaller headings.

**3. Claimed** (`/items/claimed`)
- Rows with the item image on its list's colour (as in the wishlist rows), item name,
  "For Steven • due in 5 days".

**4. Friends**
- Header "Friends" with "12 friends • 2 requests" under it.
- Add Friend becomes a ghost icon button instead of the red filled button.
- Friends as rows (avatar, name, @username, chevron); requests as rows with ✓ / ✕ buttons.

**5. Profile** (yours and a friend's) — the closest fit to the wishlist look
- Avatar in the artwork's place, centred, over a neutral grey fade (profiles have no colour),
  then name and "@username • 4 lists".
- A friend's lists as `PlainRow`s instead of a grid; clothing sizes as a compact two-column block.
- Remove or wire up the "⋮" button on someone else's profile — it only logs to the console.

**6. Settings**
- Centred title, grouped `PlainRow`s: Profile picture, Sizes, Log out (red text).

**7. Home** — light touch only
- Section headings and "Show all" links matched to the other pages; carousels stay as they are.

### Contributions (check by hand — migration 004 is applied):
- Contribution item with a goal shows a bar; without a goal shows a running total
- Pledge as a signed-in user, change the amount, withdraw it
- Pledge as a guest in a private window (name prompt keeps the amount you typed)
- Same item as the owner: blind list hides the figures, open list shows them
- Claiming a contribution item is refused with a readable message
- Turning contributions off after a pledge is refused with a readable message
- Contribution panel at 375px
