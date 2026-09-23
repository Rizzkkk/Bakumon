# Source workbook inventory

`Cobblemon_Full_Pokemon_Wiki_No_Legendary.xlsx` at the repo root. **12 sheets**, not the
9 stated in `architecture.md`.

All counts here come from `ground-truth/reports/workbook-audit.md` (`npm run audit`). If
they disagree, the report wins.

## Sheets

| Sheet | Data rows | Role |
|---|---|---|
| `Pokemon Wiki` | 1,112 | Spawn definitions. 1,107 real, 5 prose note rows. |
| `Item Categories` | 4 | Category count summary. Reference only, never imported. |
| `Item Wiki` | 932 | **Primary item source.** Fullest column set. |
| `Evolution Items` | 52 | Subset view |
| `Held Items` | 126 | Subset view - the only one with rows `Item Wiki` lacks |
| `Berries Wiki` | 84 | Subset view |
| `Fossils Wiki` | 16 | Subset view |
| `Poké Balls Wiki` | 99 | Subset view |
| `Consumables Wiki` | 217 | Subset view |
| `Held Items Wiki` | 43 | Subset view |
| `Evolution Items Wiki` | 74 | Subset view |
| `Other Items Wiki` | 598 | Subset view |

The nine subset sheets are filtered views of `Item Wiki`, not additional data. They are
imported only in the sense that `validate-import.js` proves every ID in them resolves.
The last four - Consumables, Held Items, Evolution Items and Other Items Wiki - match the
four canonical categories exactly (217 / 43 / 74 / 598 = 932).

## `Pokemon Wiki` columns

| Column | Meaning |
|---|---|
| `Display Pokemon` | Human name, with a form parenthetical. **Not unique.** |
| `Pokemon` | Cobblemon **spawn selector**, not a slug. See ADR 0003. |
| `Bucket` | Rarity tier, `;`-delimited. Five values. |
| `Weight` | Spawn weight, `;`-delimited |
| `Level` | Range like `8-45`, `;`-delimited. `Event` on the six event rows. |
| `Context` | Where it spawns, `;`-delimited. Six values. |
| `Biome(s)` | `;`-delimited. Mostly tags, not concrete biomes. |
| `Conditions` | Free text. Delimited by `\|` on 383 rows, `;` on 97, both on 62. |
| `Spawn Entries` | Declared entry count. **Undercounts on 144 rows.** |

## `Item Wiki` columns

| Column | Meaning |
|---|---|
| `Item` | Display name. Drives the wiki image lookup. |
| `Item ID` | `cobblemon:` namespaced ID. Unique, 932 of 932. |
| `Wiki Category` | 12 raw values collapsing to 4 canonical. See ADR 0002. |
| `Source Category` | 13 values. Where berry / fossil / pokeball live. |
| `Description / Effect` | Blank for 548 of 932. |
| `Used in Evolutions` | A **count**, not a boolean. Blank for 762. |
| `Evolution Uses` | Free text |
