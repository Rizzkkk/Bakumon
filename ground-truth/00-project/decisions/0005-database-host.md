# 0005 - Database host

- **Status**: accepted
- **Date**: 2026-09-11, decided 2026-09-17

## Context

`architecture.md` leaves this open: Postgres on the Hostinger KVM2 VPS, or Supabase free
tier. Nothing built so far depends on the answer.

## What was weighed

- **Data is tiny**: 904 + 3,268 + 934 rows. Neither option is remotely stretched by it.
- **Artwork is not in the database.** Roughly 3,270 image files (1,635 originals plus a
  thumbnail each) live on disk. On Supabase the binding free-tier limit for this app
  would have been **storage**, not rows or connections - and when storage fills, uploads
  fail outright rather than degrading.
- **A database backup does not back up the image files.**
- Self-hosting means owning Postgres upgrades and backups on a box that also runs the app.

## Decision

**Postgres 16 on the Hostinger KVM2 VPS**, with the artwork served as static files from
the same box by nginx. Local development stays on `docker-compose.yml`; `DATABASE_URL` is
the only difference between the two.

## Consequences

- The storage ceiling stops being a failure mode. 129 MB of artwork on a VPS disk is
  ordinary disk usage, not a quota that breaks uploads when it fills.
- `image_url` and `thumb_url` stay root-relative (`/assets/...`), which resolves only
  because the SPA and the artwork are served from the same origin. Moving the artwork
  later is a data migration, not an API change - the API must not rewrite these at read
  time.
- **The assets still need their own backup path.** A `pg_dump` cron does not cover
  `assets/`. The documented fallback is re-running `npm run mine`, which is resumable and
  reproduces every file from `assets/manifest.json`; that is acceptable only while the
  upstream sources stay reachable. Recorded in `06-deployment/runbook.md`.
- Postgres upgrades and backups are now ours. The runbook owns both.
- Reversing this means changing one environment variable and moving the files. Nothing in
  the code is host-specific.
