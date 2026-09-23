# 0003 - Pokemon are keyed on species; form aspects live on the spawn row

- **Status**: accepted
- **Date**: 2026-09-11

## Context

`architecture.md` treats `Pokemon Wiki` column B as a slug and maps one sheet row to one
`pokemon` row. Column B is not a slug. It is a **Cobblemon spawn selector**: a species
followed by zero or more aspects.

```
abomasnow                            plain species
arbok snake_pattern=attack           species + keyed aspect
diglett alolan                       species + bare flag aspect
unown character=!                    aspect values include ! and ?
```

Consequences of the original model, measured:

- 1,107 spawn-definition rows but only **904 distinct species**. Keyed on column B the
  Pokedex would contain seven separate Arboks, 32 Magikarps and 28 Unowns.
- No Cobblemon form selector has a PokeAPI species, so **every form row would fail image
  resolution**.
- `Display Pokemon` is not unique either - Mr. Mime, Mime Jr. and Mr. Rime each appear
  twice - so it cannot be the key. (The cause is the duplicate *spellings* of ADR 0006,
  not base-versus-Galarian as this line first claimed: the imported rows are two identical
  display names per pair, and the Galar rows carry their own distinct names.)
- Four species - `basculin`, `dudunsparce`, `sinistcha`, `unown` - appear **only** as form
  rows. Building the species list from plain rows alone loses them entirely.

## Decision

- `pokemon` is keyed on `species_slug`, derived as the first whitespace-delimited token of
  column B for **every** row, not just plain ones.
- `pokemon_spawns` carries `aspects JSONB`, the original `selector` text, and a
  `form_label` taken from the parenthetical in the display name, which is the only
  human-readable form name the workbook has.

## Consequences

- The Pokedex has 904 entries. Arbok is one entry with seven aspect-bearing spawn rows.
- Form aspects are queryable through the JSONB column.
- Detail pages must group spawns by form, or a Pokemon with many cosmetic variants shows a
  long flat table. Not yet built.
- `validate-import.js` asserts Arbok is one Pokemon with seven distinct snake patterns,
  and that all four form-only species were imported.
