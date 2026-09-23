# Items

932 items in `Item Wiki`, plus 2 backfilled from `Held Items` = **934 rows** in the
database. Counts from `ground-truth/reports/workbook-audit.md`.

## Two category axes

ADR 0002 has the reasoning. The shape:

**`category`** - 4 canonical buckets, `CHECK`-constrained. Mapped from `Wiki Category` by
an explicit literal table in `scripts/lib/workbook.js`, not inferred. An unmapped value
throws.

| Category | Items |
|---|---|
| `other` | 598 |
| `consumable` | 217 |
| `evolution` | 74 |
| `held` | 43 |

These reconcile exactly against the `Item Categories` sheet, which states the same four
totals independently, and sum to 932. This is the workbook-only population; the API's
listable population is two wider (the backfilled held items) and `held` is 45 there -
see `04-api/contract.md`'s "934 rows exist, 933 are listable" section for that
reconciliation. Both 43 and 45 are correct, over different populations.

**`source_category`** - 13 slugified values. This is the only axis on which berries,
fossils and Poke Balls are distinguishable: `berries-berry-items` 84,
`poke-balls-catching` 99, `fossils` 16, plus mints, medicine, materials, food, utility and
others.

The filter chips in `architecture.md` section 6 should draw from **this** axis.
`validate-import.js` asserts all three resolve here, so the two axes cannot quietly be
collapsed back into one.

## `Used in Evolutions` is a count

Observed values: 0, 1, 2, 4, 6, 8, 9, 10, and blank for 762 of 932. `architecture.md`
declares it `BOOLEAN`, which would flatten 10 evolution uses to `true`. The column is
`evolution_use_count INTEGER`, null where blank.

## Description coverage

| | Items |
|---|---|
| Blank description | 548 (59%) |
| Description under 40 characters | 123 |
| Usable description | 261 |

This is the largest content gap in the project. `npm run mine` scrapes the Cobblemon wiki
into `wiki_description` to fill part of it; see `02-assets/sourcing.md` for what it
actually recovered, and ADR 0004 for why the two columns never merge.

## Backfilled rows

`minecraft:bone` and `minecraft:snowball` appear on the `Held Items` sheet but not in
`Item Wiki`. The import inserts them as `category = 'held'` with `wiki_category` recording
which sheet they came from. They have no description.

Every other subset sheet resolves fully against `Item Wiki` - zero orphans.
