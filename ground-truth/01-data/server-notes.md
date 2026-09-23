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
