# Pokemon spawn data

How `Pokemon Wiki` is read. Counts from `ground-truth/reports/workbook-audit.md`.

## Shape

1,107 spawn-definition rows describe **904 species**. 207 rows carry form aspects.
Expanded, they produce **3,268 `pokemon_spawns` rows**.

The species / form split is ADR 0003. The short version: column B is a Cobblemon spawn
selector (`arbok snake_pattern=attack`), so the species is its first token and everything
after it is an aspect stored on the spawn row.

## Why 3,268 and not 2,995

2,995 is the sum of the `Spawn Entries` column. That column **undercounts for 144 rows**.

Aerodactyl declares `Spawn Entries = 1` but its weight column reads `10; 0.1` - two
genuinely different spawn entries sharing everything else. Trusting the declared count
drops the second silently.

So the expanded row count is `max(Spawn Entries, longest field array)`. Only `weight`,
`level` and `context` ever overflow, and always together.

## Parsing rules

Implemented in `expandSpawnRow` in `scripts/lib/workbook.js`.

1. Split `Bucket`, `Weight`, `Level`, `Context` on `;` and **trim every token** - the real
   delimiter is `"; "` and leaves leading spaces that become part of the value otherwise.
2. `N = max(Spawn Entries, longest of those arrays, 1)`.
3. Per field: 0 values means null throughout; 1 value is constant across all N; N values
   zip 1:1; anything else pads with the last value and sets `parse_flag`.
4. `Level` `"8-45"` becomes min and max. `"Event"` becomes null and null.
5. Non-numeric `Spawn Entries` means one row.
6. Biomes are **not** zipped. They are the set of biomes for the whole row and go into a
   `TEXT[]` unchanged.

**445 of 1,107 rows (40%) need padding.** That is the normal case, not an error path - it
is why the rule is deterministic rather than a warning log. Every row it touches carries
`parse_flag = 'padded:<fields>'` so the scale stays measurable.

## Conditions is delimited inconsistently

383 rows use `|`. 97 use `;`. 62 use both, with `,` separating clauses inside a single
condition.

Splitting on `;` unconditionally corrupts text that legitimately contains one - the event
rows read `Requires 25+ players online; random event; 10-minute despawn`, which is one
condition, not three. So `splitConditions` splits on `|` first and only sub-splits on `;`
when the pipe split came up short of N. `validate-import.js` asserts the event rows kept
their semicolons.

## Buckets

Five values: `common`, `uncommon`, `rare`, `ultra-rare`, `legendary event`.
`architecture.md` lists three. `ultra-rare` and `legendary event` are Bakumon-specific -
see `server-notes.md`.

## Contexts

Six values: `grounded`, `fishing`, `submerged`, `surface`, `seafloor`, `random player`.
`architecture.md` mentions two. `random player` belongs solely to the six event rows.

## Biomes are mostly tags

112 distinct tokens. The large majority are `#`-prefixed **tags** - sets of biomes - not
concrete biome IDs. Namespaces present: `cobblemon`, `minecraft`, `aether`,
`the_bumblezone`, `biomesoplenty`, `byg`.

A filter matching concrete `minecraft:` biome names would miss most of the dex. The
`biome_tokens` table exists so the filter can offer the 112 tokens as they actually
appear. `validate-import.js` asserts tags still outnumber concrete biomes, so if a future
workbook flips that the assumption fails loudly.
