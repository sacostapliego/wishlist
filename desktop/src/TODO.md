### TODO:
- Allow 2 new fields per item:
    - Users can now make the item a "contribution" item, where multiple users can put how much they are going to send/give to reach the items $, in a bar 
    - Users can now choose how to display their item, using the current method or by selecting cover option
- Wishlist changes
    - There are two different types of wishlists, one being the current where the owner cannot see who gets what from the wishlist, and another version where the owner can see who gets what from the wishlist but both the owner and vistors will be aware that the owner can see how gets what in each item and a pop up when a vistor loads up the wishlist page
    - Is there a way to create a collobration wishlist, where multiple users can edit a wishlist such as adding, removing, and editing items in a wishlist? 
----
### Desktop:
- [x] Wide-screen layout (2xl and up); single column below that
    - 1st section: Up Next hero, full width
    - 2nd section: Items claimed | Upcoming calendar
    - 3rd section: My wishlists | Finish Setting Up (own lists with no items or no date;
      the rail is dropped and the carousel spans full width when there is nothing to fix)
### Mobile (the narrow-viewport layout inside desktop/, not the mobile/ Expo app):
- [x] Page gutters made responsive; 32px side padding left 311px of content on a 375px phone
- [x] Item page: clamped the claimed-by name and the scraped url
- [x] Friends added to the mobile header (ProfileHeader)
- [x] Scrolling: views were fixed-height scroll containers nested inside the layout's own