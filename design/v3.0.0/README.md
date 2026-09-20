# Design — v3.0.0

Design notes for the 3.0.0 release. Markdown and images only; no code.

## Contents

| Doc | What it covers |
|---|---|
| [homepage.md](homepage.md) | Desktop home page: section order, Up Next rules, badges, loading states |

## Release scope

1. **Home page, desktop** — this part. Replaces the three duplicate carousels with a deadline-led layout.
2. **Mobile pass** — next. Same information model, phone layout.

Not in 3.0.0: backend migration to Supabase Auth/RLS/Storage, global search, activity feed.

## Naming

One folder per released version (`design/v3.0.0`, `design/v3.1.0`, …). Subfolders per surface as they appear. Images live in `images/` next to the doc that uses them.
