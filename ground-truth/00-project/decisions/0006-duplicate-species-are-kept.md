# 0006 - Duplicate species spellings are kept, not merged

- **Status**: accepted
- **Date**: 2026-09-17

## Context

Seven Pokemon appear twice in `Pokemon Wiki`, under two spellings, in adjacent rows:
`hakamo_o`/`hakamoo`, `jangmo_o`/`jangmoo`, `kommo_o`/`kommoo`, `mimejr`/`mime_jr`,
`mrmime`/`mr_mime`, `mrrime`/`mr_rime`, `porygon_z`/`porygonz`. The full table with row
numbers is in `01-data/known-gaps.md`.

Both spellings carry real spawn configuration and the two rows differ. All seven
underscore rows are `rare`; four of the joined rows carry other buckets and three
(`hakamoo`, `jangmoo`, `kommoo`) are also `rare`, differing only in weights and entry
counts. Either way this is not a pair of identical rows where one can be dropped without
loss. Per-pair table in `01-data/known-gaps.md`.

The distinct-species count is therefore 904, and the number of distinct Pokemon is 897.

## Decision

Keep both rows. The workbook is authoritative (ADR 0004) and it says there are two spawn
rules, so the database holds two species rows and the API does not deduplicate.

## Consequences

- `pokemon` stays at 904 rows. Every count in `ground-truth/` and every assertion in
  `validate-import.js` that says 904 remains correct.
- The Pokedex renders seven pairs of similarly-named cards. That is the workbook being
  shown faithfully, not a display bug.
- List queries must order by `display_name, id`, never `display_name` alone. **Three**
  display names collide - `Mime Jr.`, `Mr. Mime` and `Mr. Rime` each appear twice - and
  without the `id` tie-break Postgres may place the same row on two pages or on neither.
- Merging later is still possible and is a data decision, not an API one: it would mean a
  new workbook export, not a change to any query.
