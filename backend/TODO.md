# TODO

Fix the three lint warnings in `desktop/` (they don't fail the build, but a
future plugin version could promote them to errors the way
`react-hooks/set-state-in-effect` just was):

- [ ] `src/components/layout/nav/MobileCreateMenu.tsx:22` — `useEffect` missing dependency `anchorRef`
- [ ] `src/components/layout/SideBar.tsx:93` — unused `eslint-disable` directive
- [ ] `src/components/profile/ProfileImageCropper.tsx:144` — raw `<img>` instead of `next/image`

Fix soon, from the backend security review:

- [ ] `routes/items.py:618` — "already claimed" error tells the owner of a blind list that an item is claimed
- [ ] `routes/items.py:359` — turning on contributions reveals a hidden claim to the owner of a blind list
- [ ] `routes/items.py:373` — turning off contributions reveals hidden pledges to the owner of a blind list
- [ ] `routes/items.py:37` — scraper runs on the event loop, so its network call and sleep stall every request (change to `def`)
- [ ] `services/scraper.py:44` — every URL is rewritten to amazon.com, so non-Amazon links cannot work
- [ ] `routes/auth.py:135` — raw exception text returned to the client, can include SQL (same at `routes/items.py:216` and the upload error paths)
- [ ] `routes/auth.py:36` — passwords over 72 bytes crash bcrypt 5 and return a 500 on login
- [ ] `routes/auth.py:61` — no minimum password length
- [ ] `routes/auth.py:71` — register reveals which emails have accounts, and login timing does too
- [ ] `routes/users.py:85` — email can be changed with no password check and no verification
- [ ] `routes/wishlists.py:253` — S3 images are deleted before the commit, so a failed delete loses them (saved_wishlists has no cascade)
- [ ] `routes/users.py:149` — profile picture is deleted before the commit, and the user's item images are left in S3
- [ ] `services/guest_session.py:14` — anyone can use up a list's 500 guest sessions and lock real guests out
- [ ] `routes/items.py:518` — item image route has no auth, so private list images load for anyone with the ID
- [ ] `routes/wishlists.py:308` — thumbnail route has no auth, same as above
- [ ] `src/services/api.ts:14` (desktop) — no global 401 handling, so an open tab fails quietly once the 90-day token expires
- [ ] `src/views/SettingsPage.tsx:211` (desktop) — Reset Password is a stub, and changing a password is the only way to revoke a stolen 90-day token
- [ ] `src/utils/storage.ts:23` (desktop) — Safari can clear localStorage and script-set cookies after 7 days, so iPhone users may sign in more often than 90 days

Low priority:

- [ ] `requirements.txt:2` — versions are unpinned, so a deploy can pull a breaking release
- [ ] `requirements.txt:20` — remove unused `python-jose` and `passlib`, and declare `PyJWT` and `bcrypt` directly
- [ ] `Dockerfile:1` — container runs as root
- [ ] `Dockerfile:10` — add a `.dockerignore`, a local build copies `.env` into the image
- [ ] `routes/relationships.py:125` — compares a UUID to a string, so a user can friend themselves
- [ ] `models/item_contribution.py:75` — pledge amount accepts infinity
- [ ] `routes/items.py:222` — `limit` has no maximum (same at `routes/items.py:422`, `routes/wishlists.py:110` and `routes/wishlists.py:269`)
- [ ] `main.py:32` — localhost origins are still allowed in production
- [ ] `routes/items.py:467` — route always returns a 500 (`owner_id` does not exist) and nothing calls it, delete it and `removeItemBackground` in `desktop/src/services/wishlist.ts:273`
- [ ] `routes/auth.py:47` — `datetime.utcnow()` is deprecated
- [ ] `routes/items.py:79` — `Image.getdata` is removed in Pillow 14 (October 2027)

Background removal:

- [ ] `routes/items.py:74` — replace the white threshold with a flood-fill from the image edges, so white parts of a product survive
- [ ] `desktop/src/components/items/ItemForm.tsx:154` — use Cloudflare Images `segment=foreground` for regular photos, test on a free account first (free for 5,000 unique images a month, then fails with no charge)
