# Guest sessions

**Status:** implemented (v3)
**Applies to:** claiming and contributions

## Why guests exist at all

Cardinal is shared with family. Most of the people who open a shared wishlist
link will never make an account, and asking them to is the fastest way to make
the list go unused. Claiming has to work for someone who taps a link, types
their name, and leaves.

So the constraint is fixed: **participation without an account is a feature, not
an oversight.** The question is only how to identify those people safely.

## The problem with using the name

The original design stored the guest's typed name in
`wishlist_items.claimed_by_name` and treated it as proof of identity - unclaim
sent the name back and the server compared it.

The name is not a secret. It is returned to every visitor as
`claimed_by_display_name` so the list can show "Claimed by Carol". Anyone who
can read the page can replay it. In practice:

- Any visitor could unclaim anyone else's item.
- The desktop and mobile clients actually *showed* the Unclaim button to every
  guest, because `canUserUnclaim` was `Boolean(item.claimed_by_name)` - "is this
  claimed by any guest at all".
- The signed-in path had the same shape of bug: `user_id` came from the request
  body, so a caller could claim as any user.

**Identity has to be proved with something the server issued, not something the
server published.**

## The design

A guest names themselves once per wishlist. The server creates a
`guest_sessions` row and returns a random token, once. The client keeps the
token; every later request that should act as that guest sends it in the
`X-Guest-Token` header.

```
guest_sessions
  id            uuid pk
  wishlist_id   uuid fk -> wishlists (cascade delete)
  display_name  varchar          -- public, shown on the list
  email         varchar null     -- optional, reserved for magic-link recovery
  token_hash    varchar unique   -- sha256 of the token; the token is never stored
  created_at    timestamptz
  last_seen_at  timestamptz
```

`wishlist_items.claimed_by_guest_session_id` replaces `claimed_by_name` for new
claims.

### Decisions and why

**Scoped to a wishlist, not to an item.** Grandma claims three things off one
list and is asked her name once. It also means a leaked token is contained to a
single list. This scoping is what makes guest contributions workable later - a
guest can come back and edit *their* pledge.

**Only the hash is stored.** A `token_hash` leak is useless. Storing raw tokens
would mean a database dump lets someone impersonate every guest who ever used
the app. Plain SHA-256 rather than bcrypt is fine here because the token is 32
bytes of `secrets.token_urlsafe` entropy, not a human-chosen password - there is
nothing to brute force.

**Identity is never read from the request body.** `claim`/`unclaim` take no body
at all now. The server resolves the caller from the JWT or the guest token, in
that order. This is why `get_current_user_optional` exists: these endpoints serve
both members and guests, so a missing JWT must fall through rather than 401.

**The server decides what the client may offer.** Responses carry
`claimed_by_viewer: bool`, computed per requester, instead of the raw
`claimed_by_user_id` / `claimed_by_name`. The client renders the Unclaim button
off that flag and does no identity reasoning of its own. This is also the hook
that per-wishlist claim visibility will use - see *Open threads*.

**Header token, not an HttpOnly cookie.** A cookie would be marginally more
secure, but the Expo app shares this API and React Native does not handle cookies
cleanly. Cross-origin cookies from Vercel to Render would also need
`SameSite=None; Secure` plus credential handling on every request. One mechanism
that works on both clients beats two mechanisms.

## The accepted tradeoff

**Clear your browser data and you lose control of your claims.** There is no way
around this without an account; it is the cost of the feature, and it is the
same deal Doodle and similar tools make.

It is a mild failure: you can no longer unclaim, but nothing is exposed and
nothing breaks for anyone else. The `email` column exists so magic-link recovery
can be added later without another migration.

**Do not add a "re-enter your name to recover" path.** That is exactly the
vulnerability this design removes.

## The client gate that undid this

The backend, the token storage and `useItemClaiming` were all finished in v3, but
the item page never rendered any of it. `ItemDetailContent` gated the claim
button on `isLoggedIn` and showed everyone else *"Create an account to claim this
item"* — the exact wall this design exists to remove. The guest branch of
`useItemClaiming` was unreachable code.

Fixed when contributions landed. A visitor who is not the owner gets the real
action, member or guest, and the account offer sits **below** it as a quiet
secondary button rather than in front of it. An account is worth having because
it remembers what you claimed across devices; it is not the price of taking part.

Worth remembering as a shape of bug: a feature can be complete in the model, the
API, the service layer and the hook, and still not exist. Nothing failed, no test
went red, and the endpoint worked perfectly when called by hand.

## Legacy claims

`claimed_by_name` is kept, not dropped - guest claims made before this change
still live there and still display correctly. They cannot be released by a
guest, because there was never anything to prove they made them. The wishlist
owner can clear one by hand; see the note at the bottom of
`backend/supabase/migrations_v3.sql`.

## API surface

| Endpoint | Auth | Notes |
| --- | --- | --- |
| `POST /guest-session/` | none | Body `{wishlist_id, display_name, email?}`. Wishlist must be public. Returns the token **once**. |
| `GET /guest-session/me?wishlist_id=` | `X-Guest-Token` | Returns `null`, not 401, for an unknown token so the client just re-prompts. |
| `POST /wishlist/{item_id}/claim` | JWT *or* `X-Guest-Token` | No body. Item must be on a public wishlist. |
| `DELETE /wishlist/{item_id}/claim` | JWT *or* `X-Guest-Token` | No body. Only the claimer succeeds. |

Abuse control: `MAX_SESSIONS_PER_WISHLIST = 500` in
`backend/services/guest_session.py`. This is a cheap stand-in for real rate
limiting on an unauthenticated write endpoint, not a replacement for it.

## Where the code lives

| Concern | File |
| --- | --- |
| Model | `backend/models/guest_session.py` |
| Token mint / resolve, header dependency | `backend/services/guest_session.py` |
| Session endpoints | `backend/routes/guest_sessions.py` |
| Optional auth dependency | `backend/middleware/auth.py` |
| Claim identity resolution | `backend/routes/items.py` |
| Response shaping (one place) | `backend/services/item_serializer.py` |
| Client storage + API (web) | `desktop/src/services/guestSession.ts` |
| Client storage + API (mobile) | `mobile/app/services/guestSession.ts` |
| Claim UX | `*/hooks/useItemClaiming.*` |
| Where guests are offered the action | `desktop/src/components/items/ItemDetailContent.tsx` |
| Contribution UX (members and guests) | `desktop/src/hooks/useItemContributions.ts` |
| Migration | `backend/supabase/migrations_v3.sql` |

## Open threads

**Contributions** reuse this directly, and are now built - see
[[../wishlist/contributions.md]]. A pledge row carries either
`contributor_user_id` or `guest_session_id` - two real foreign keys instead of a
free-text name - so "edit my pledge" is the same permission check as unclaim.
One wrinkle claiming does not have: a pledge carries an amount, so the amount a
guest typed is held and replayed after the name prompt rather than asked for
twice.

**Per-wishlist claim visibility** (the blind/open wishlist modes) belongs in
`serialize_item`. That function is deliberately the only place an item becomes a
response, so the rule is written once rather than in five routes. Note that
today the owner can see every claim on their own list through the authenticated
endpoints - the "owner cannot see" behaviour is currently frontend-only and is
not yet enforced server-side.

**Rate limiting** the guest-session endpoint. It is unauthenticated and writes
rows, which makes it the obvious abuse target. `slowapi` is a drop-in.
