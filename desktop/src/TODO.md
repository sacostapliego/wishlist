### TODO:
- Allow 2 new fields per item:
    - Users can now make the item a "contribution" item, where multiple users can put how much they are going to send/give to reach the items $, in a bar 
    - Users can now choose how to display their item, using the current method or by selecting cover option
- Wishlist changes
    - There are two different types of wishlists, one being the current where the owner cannot see who gets what from the wishlist, and another version where the owner can see who gets what from the wishlist but both the owner and vistors will be aware that the owner can see how gets what in each item and a pop up when a vistor loads up the wishlist page
    - Is there a way to create a collobration wishlist, where multiple users can edit a wishlist such as adding, removing, and editing items in a wishlist? 
----
### Desktop:
- Guest view of an item at 1080p: the claim bar spans the content column, not a chip in the corner

### Mobile (the narrow-viewport layout inside desktop/, not the mobile/ Expo app):
- Claim bar on iOS Safari, guest and signed-in: sits above the URL bar on first load, no scrolling needed.
  The app scrolls in a container, so Safari's toolbar never collapses. `--toolbar-overlap` (App.css) is
  `calc(100vh - 100dvh)` and gets added to the bar's offset — if Safari already clamps fixed elements to
  the visual viewport this double-counts and the bar will sit ~60px too high, so drop the term from
  ItemDetailContent if that's what shows up.
- `h={{ base: 'calc(100vh + 80px)' }}` in ItemPage, FriendsPage and AllWishlistsPage is an older
  workaround for the same iOS viewport problem, from before the layout shells were sized to `100dvh`.
  Check whether it now over-compensates; HomePage already moved off the pattern.

### Contributions (check by hand — migration 004 is applied):
- Contribution item with a goal shows a bar; without a goal shows a running total
- Pledge as a signed-in user, change the amount, withdraw it
- Pledge as a guest in a private window (name prompt keeps the amount you typed)
- Same item as the owner: blind list hides the figures, open list shows them
- Claiming a contribution item is refused with a readable message
- Turning contributions off after a pledge is refused with a readable message
- Contribution panel at 375px
