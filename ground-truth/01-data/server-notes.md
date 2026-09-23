# Server spawn notes

Transcribed verbatim from the bottom of the `Pokemon Wiki` sheet (rows 1111-1115), where
they sit below the data as a prose block. `scripts/lib/workbook.js` excludes them from
import - four of the five have text in the species column and would otherwise be imported
as Pokemon.

This is the clearest statement of how Bakumon differs from stock Cobblemon, and it is the
reason the site is worth building.

## WIKI SPAWN SYSTEM NOTES

> **Legendary/Event Pokemon** - Spawn through Pebble Spawn Events rather than normal
> natural spawning.

> **Ultra-Rare** - Includes selected starter lines, selected base starters,
> pseudo-legendary final evolutions, Ditto (except slime chunks), and other rebalanced
> desirable Pokemon.

> **Rare** - Regular rare-tier Pokemon and special exceptions such as Ditto in slime
> chunks.

> **Event requirement** - Current setup requires 25 players online; event timing is
> configured separately in Pebble Spawn Events.

## What this implies for the site

- `ultra-rare` is a **Bakumon-specific tier**. It is not a Cobblemon concept, and no
  external wiki will explain it. The UI should surface it as prominently as `rare`.
- The six `legendary event` spawn rows are not natural spawns at all. Presenting them in
  the same spawn table as a normal biome spawn would mislead - they need their own
  treatment, explaining the Pebble Spawn Event and the 25-player threshold.
- Ditto appears in two tiers depending on whether the chunk is a slime chunk. Anything
  that assumes one bucket per species is wrong.
- The 25-player figure is **current configuration**, not a fixed rule. If the site states
  it, it should be sourced from here so there is one place to change it.

## Correction, 2026-09-24: the player gate is off

The server owner confirmed the 25-player requirement has since been turned off. Legendaries
now spawn genuinely at random, with no player count to reach.

The quoted block above is left exactly as it is, because it is a verbatim transcription of
what the workbook says and ADR 0004 makes the workbook authoritative. This section records
that the workbook is now describing a configuration the server no longer runs.

**What changed in the code**: `EVENT_PLAYER_THRESHOLD` is deleted from
`apps/web/src/lib/serverFacts.js`, and `LegendaryPanel` no longer tells a reader that
legendaries are "tied to 25+ players being online". It says they turn up at random, which
is now true and was the only thing on the site asserting the gate.

**What has not changed, and is the real fix**: all six `legendary event` spawn rows still
carry the workbook's own `conditions` text, `Requires 25+ players online; random event;
10-minute despawn`. That string is imported data, not copy, and ADR 0004 forbids the API or
the site rewriting a workbook value - so it is still wrong in the database and will stay
wrong until the workbook is re-exported and `npm run import` re-run. It is not currently
rendered anywhere: `LegendaryPanel` replaces the spawn table for these species and shows
Timing, Level and Where it can appear, none of which read `conditions`. So the stale text
is invisible today, which is exactly the condition under which it will be forgotten.

`pre-production.md` item 4 already owns the re-export question; this is the first concrete
reason to answer it.
