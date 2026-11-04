# TODO

Fix the two lint warnings in `desktop/` (they don't fail the build, but a
future plugin version could promote them to errors the way
`react-hooks/set-state-in-effect` just was):

- [ ] `src/components/layout/SideBar.tsx:93` — unused `eslint-disable` directive
- [ ] `src/components/profile/ProfileImageCropper.tsx:144` — raw `<img>` instead of `next/image`

Fix soon, from the backend security review:

- [ ] `routes/auth.py:76` — register still says "Email already registered"; hiding it needs email verification (send a link instead of answering)
- [ ] `routes/users.py:85` — the new email is still not verified; needs an email provider
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
- [ ] `services/scraper.py:93` — the address check and the fetch resolve DNS separately, so a rebinding domain could still reach a private address; pin the checked IP if this matters
- [ ] `routes/items.py:222` — `limit` has no maximum (same at `routes/items.py:422`, `routes/wishlists.py:110` and `routes/wishlists.py:269`)
- [ ] `main.py:32` — localhost origins are still allowed in production
- [ ] `routes/items.py:467` — route always returns a 500 (`owner_id` does not exist) and nothing calls it, delete it and `removeItemBackground` in `desktop/src/services/wishlist.ts:273`
- [ ] `routes/auth.py:47` — `datetime.utcnow()` is deprecated
- [ ] `routes/items.py:79` — `Image.getdata` is removed in Pillow 14 (October 2027)

Background removal:

- [ ] `routes/items.py:74` — replace the white threshold with a flood-fill from the image edges, so white parts of a product survive
- [ ] `desktop/src/components/items/ItemForm.tsx:154` — use Cloudflare Images `segment=foreground` for regular photos, test on a free account first (free for 5,000 unique images a month, then fails with no charge)
