# Cardinal Wishlist

Share a wishlist; friends and family claim what they're getting so nobody
doubles up — and so the owner stays surprised.

**Live:** https://cardinalwishlist.vercel.app/

## What's in this repo

| Directory | What it is | Status |
| --- | --- | --- |
| `backend/` | FastAPI + SQLAlchemy against Supabase Postgres | Active |
| `desktop/` | **The web app.** Next.js + Chakra UI. Responsive — serves both desktop and phone browsers. | Active, deployed |
| `landing/` | Marketing page | Active |
| `mobile/` | Expo / React Native app | **Dormant** — see below |

### `desktop/` vs `mobile/` — read this before you start

These names are misleading and they will trip you up.

**`desktop/` is not desktop-only.** It's the entire web app, and it is the only
frontend currently deployed. It is responsive: it has its own phone layout,
including a dedicated bottom nav (`src/components/layout/MobileNav.tsx`). When
the TODO or a commit message says "mobile view", it almost always means **the
narrow-viewport layout inside `desktop/`**, not the `mobile/` directory.

**`mobile/` is a dormant first draft.** It's the original Expo/React Native app
from when the project started, kept because a real standalone native app is
planned. It is not deployed, not actively developed, and its home screen still
reflects the 2.x information model. Changes land there only to keep shared
concepts (API shapes, auth, guest sessions) from drifting.

So: **work on the web app happens in `desktop/`.** Only touch `mobile/` when the
task names it explicitly, or when a backend change would otherwise leave the
native client inconsistent.

## Design notes

`design/` holds the reasoning behind non-obvious decisions — what was chosen,
what was rejected, and why. Read the relevant doc before changing the area it
covers.

| Doc | Covers |
| --- | --- |
| `design/v3.0.0/` | The v3 release: desktop home page layout, Up Next rules, due-date badges |
| `design/guest/` | Guest sessions — how people claim items without an account |

## Database

Schema lives in `backend/supabase/`. `schema.sql` is a reference snapshot of
current state (not runnable as-is); numbered `migrations_*.sql` files are the
ones you actually run, in order, against the live database.
