# Known gaps

Real limitations of the current data and assets. Each one is either accepted with a reason
or waiting to be fixed - none of them are hidden.

## Seven species are spelled two ways

The workbook carries both spellings in adjacent rows, each with its own spawn
configuration:

| Row | Slug | Display name | Row | Slug | Display name |
|---|---|---|---|---|---|
| 410 | `hakamo_o` | Hakamo O | 411 | `hakamoo` | Hakamo-o |
| 452 | `jangmo_o` | Jangmo O | 453 | `jangmoo` | Jangmo-o |
| 481 | `kommo_o` | Kommo O | 482 | `kommoo` | Kommo-o |
| 609 | `mimejr` | Mime Jr. | 610 | `mime_jr` | Mime Jr. |
| 623 | `mrmime` | Mr. Mime | 624 | `mr_mime` | Mr. Mime |
| 626 | `mrrime` | Mr. Rime | 627 | `mr_rime` | Mr. Rime |
| 726 | `porygon_z` | Porygon Z | 727 | `porygonz` | Porygon-Z |

So **the 904 species count includes 7 duplicates**; the true number of distinct Pokemon is
**897**. Both spellings carry real spawn data and the two rows differ, so merging them
would destroy data.

Measured 2026-09-19, because an earlier version of this paragraph overstated it. All seven
underscore rows are `rare`. The joined rows are *not* uniformly something else - three of
them are also `rare`, and differ only in weights and entry counts:

| Pair | Underscore row | Joined row |
|---|---|---|
| `hakamo_o` / `hakamoo` | rare | **rare** |
| `jangmo_o` / `jangmoo` | rare | **rare** |
| `kommo_o` / `kommoo` | rare | **rare** |
| `mime_jr` / `mimejr` | rare | common, uncommon |
| `mr_mime` / `mrmime` | rare | common, uncommon |
| `mr_rime` / `mrrime` | rare | uncommon |
| `porygon_z` / `porygonz` | rare | uncommon |

They are imported as separate species deliberately. Both resolve to the same artwork via
the alias map in `scripts/mine-assets.js`.

**Status**: resolved, ADR 0006. Both rows are kept: the workbook says there are two
spawn rules, and the workbook is authoritative. The site shows seven pairs of
similarly-named Pokedex entries, which is the workbook rendered faithfully.

One consequence binds every list query: **three** display names collide - `Mime Jr.`,
`Mr. Mime` and `Mr. Rime` each appear twice - so ordering must be `display_name, id` and
never `display_name` alone, or the same row can land on two pages or on neither.

## Item artwork covers 78% of rows, 91% of real items

731 of 934 rows have an image. Of the 203 without one, most are not items:

| Kind | Count |
|---|---|
| `poke_puff_overlay_*` GUI sprites | 119 |
| Localisation fragments (dotted IDs) | 13 |
| Runtime-tinted Aprijuice variants | 14 |
| Pokedex model-state textures and similar | 57 |

Excluding the GUI sprites and lang fragments, coverage is 731 of 802.

**Status**: accepted. Chasing the remainder means hand-mapping textures for things no
player looks up. Live numbers in `ground-truth/reports/asset-manifest.md`.

## Item descriptions are 59% blank

548 of 932 items have no description in the workbook; 123 more have fewer than 40
characters. `npm run mine` fills some of this into `wiki_description` from the Cobblemon
wiki. See `02-assets/sourcing.md` for the recovered count.

**Status**: partially mitigated, and smaller than the recovered count suggests.

The 155 wiki descriptions mostly landed on items that already had workbook text, so the
wiki only *wins* 34 times. Measured on the imported 934 rows, the split the API actually
serves through `descriptionSource` is:

| `descriptionSource` | Items |
|---|---|
| `workbook` | 384 |
| `wiki` | 34 |
| `null` - neither column has text | 516 |

That reconciles with the paragraph above: 550 of 934 rows are blank in the workbook (548
plus the two backfilled held items), and 34 of those were rescued from the wiki.

The consequence is a frontend one: **55% of item detail pages have no description at
all**, so the item page needs a real empty state rather than a blank panel. Fixing it
needs either a richer workbook export or hand-written copy.

## Form variants share the base species image

Alolan Diglett shows Diglett's artwork. PokeAPI has separate artwork for many regional
forms, but matching a Cobblemon aspect selector (`diglett alolan`) to a PokeAPI form slug
(`diglett-alola`) is a naming problem that has not been solved yet.

**Status**: accepted for v1. ADR 0001.

## Seven of the thirteen dotted item IDs are localisation fragments, not items

The coverage table above counts **13** dotted IDs, and `reports/workbook-audit.md` counts
the same 13 as "Item IDs that look like localisation keys". Seven of those are genuine
fragments - listed next - and the other six are real items that merely have a dot in the
ID. The two numbers describe the same set at different levels of judgement; neither is
wrong.

`cobblemon:aprijuice.quality_format`, `cobblemon:aprijuice.prefix.delicious`,
`cobblemon:aprijuice.prefix.plain`, `cobblemon:aprijuice.prefix.tasty`,
`cobblemon:smithing_template.pokerod.base_slot_description`,
`cobblemon:smithing_template.pokerod.additions_slot_description`,
`cobblemon:smithing_template.pokerod.ingredients`.

One has the display name `%1$s %2$s`, which is a printf format string. They are in the
database because the workbook is authoritative and filtering them would mean hardcoding a
denylist that a future export could invalidate silently.

**Status**: accepted, with a measured correction. The API excludes items whose **name**
matches a printf placeholder from **every listing** - browse and search alike - rather
than the import dropping rows. It was originally scoped to search only, which left the row
sorting to the top of page one of the browse listing. `GET /api/items/:itemId` still
resolves it, so all 934 rows stay addressable. See `apps/api/src/queries/items.queries.js`
and the three-population table in `04-api/contract.md`.

That rule catches **one** of the seven, not all seven. Measured against the imported data
with `SELECT item_id, name FROM items WHERE name ~ '%[0-9]+[$][sdf]'`, the only match is
`cobblemon:aprijuice.quality_format`, whose name is `%1$s %2$s`. The other six have
ordinary display names - `Delicious`, `Plain`, `Tasty`, and three smithing-template
strings - so no name pattern will ever catch them.

This is accepted rather than fixed. Excluding the other six needs exactly the hardcoded
seven-ID denylist refused above, which a future workbook export would invalidate in
silence. Six rows with real display names sitting in search results is the cheaper
problem of the two.

Note that several other dotted IDs - `cobblemon:cream_puff.deluxe`,
`cobblemon:poke_puff.fancy` and similar - **are** real items. A blanket "drop IDs with a
dot" rule would delete them.

## Four real items have a `%s` placeholder in their display name

Separate from the localisation rows above, and found while building the API:

| Item ID | Name as stored |
|---|---|
| `cobblemon:poke_puff` | `%s Poke Puff` |
| `cobblemon:poke_puff.deluxe` | `Deluxe %s Poke Puff` |
| `cobblemon:poke_puff.fancy` | `Fancy %s Poke Puff` |
| `cobblemon:poke_puff.frosted` | `Frosted %s Poke Puff` |

These are **real items**. The `%s` is the flavour, substituted by the game at runtime, so
the workbook name is a template rather than a finished string. Measured with
`SELECT item_id, name FROM items WHERE name ~ '%[sdf]([^0-9]|$)'` - five rows across the
whole table carry a placeholder of any kind: these four plus the positional
`%1$s %2$s` above.

**Status**: accepted, and deliberately **not** excluded - they are items a player can
hold, unlike the localisation fragments.

**Resolved on the frontend, 2026-09-23, by ADR 0009.** The item card and the item page
render the stored name with each `%s` replaced by a muted inline chip reading *flavour*,
so a visitor reads it as a placeholder rather than as a broken string. Nothing is stripped
and nothing is invented: the raw workbook string is preserved in the `title` attribute, in
the generated `alt` text - where a visual chip cannot exist - and in `document.title`. The
item page carries one explanatory line, conditional on the name actually containing a
placeholder. The API still returns `"%s Poke Puff"` verbatim, so the rewrite ADR 0004
forbids never happens. See `apps/web/src/lib/placeholderName.js` and
`apps/web/src/components/common/ItemName.jsx`; `npm run verify:web` asserts the split.

## Six event rows stored a weight of NaN, not null

Found 2026-09-23 while building the spawn table, which rendered the literal text `NaN`.

The six Pebble Spawn Event rows carry an em dash in the workbook's Weight column - the
author's way of writing "not applicable", the same intent as `Event` in the Level column.
The import ran `Number('—')`, which is `NaN`; Postgres accepts NaN into a `NUMERIC`,
and `pg` serialises it back as the **string** `"NaN"`, so the API served
`{"weight":"NaN"}`.

`04-api/contract.md` already said weight was null for these rows, so the contract was
right and the import was wrong. Nothing in the suite compared null against NaN, and both
survive a row count, which is why it went unnoticed until something rendered it.

**Status**: fixed. `parseWeight` in `scripts/lib/workbook.js` treats any non-finite value
as absent, and `validate-import.js` now asserts both that no weight is NaN and that the
six event rows record none. `apps/web/src/lib/labels.js` also guards the display, because
a NUMERIC reaching JSON as a string is a shape `?? EMPTY` does not catch.

## 40% of spawn rows needed a padded field

445 of 1,107 source rows have field arrays that do not align with each other or with
`Spawn Entries`. The padding rule is deterministic and every affected row carries
`parse_flag`, so the affected rows can be listed:

```sql
SELECT DISTINCT p.display_name, s.parse_flag
  FROM pokemon_spawns s JOIN pokemon p ON p.id = s.pokemon_id
 WHERE s.parse_flag IS NOT NULL;
```

**Status**: accepted. The alternative - dropping unaligned data - loses real spawn entries.

## `Spawn Entries` undercounts on 144 rows

Documented in `pokemon-spawns.md`. The import takes the widest field array instead, which
is why the spawn total is 3,268 rather than the column sum of 2,995.

**Status**: accepted, and the reason is asserted in `validate-import.js` via Aerodactyl.

## Six spawn rows carry the literal token `Any biome`

Corrected 2026-09-19. This section previously said "four spawn rows have no biome … they
import with an empty `biomes` array". That was wrong, and measurably so:

```sql
SELECT count(*) FROM pokemon_spawns WHERE coalesce(array_length(biomes, 1), 0) = 0;  -- 0
```

**Zero** rows have an empty `biomes` array. What does exist is a token spelled
`Any biome` - six references, no namespace, listed in `reports/workbook-audit.md` beside
the real namespaces. It is a phrase the workbook author typed, not a biome ID the game
would recognise.

**Status**: accepted. The six rows match a biome filter only if the user picks `Any biome`
from the list, which `GET /api/biomes` does return because the table holds it. The filter
UI will therefore show one entry that is not a token. Real data, not a bug.

## The logo had no alpha channel

`assets/brand/Logo.png` is 1254x1254 RGB with no transparency. Placed on any background
other than its own it shows a solid rectangle. See `05-frontend/brand.md`.

**Status**: **resolved 2026-09-23.** A transparent re-export was supplied as
`assets/brand/logo-transparent.png` - verified 392x383, 4 channels, `hasAlpha=true`, and
all four corner pixels read alpha 0. It is the source for the header mark and the favicon
set. `Logo.png` is kept for reference and is no longer referenced by any code.

Two properties carried forward rather than closed: the replacement is **pixel art**, so
every render sets `image-rendering: pixelated` and `npm run brand` resamples it
nearest-neighbour; and at 392px it is too small to upscale into a hero or a dedicated
Open Graph image, so the banner fills both of those roles.
