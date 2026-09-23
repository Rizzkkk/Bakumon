# 0002 - Item category is two axes, not one

- **Status**: accepted
- **Date**: 2026-09-11

## Context

`architecture.md` section 2 declares a single `category` column with seven permitted
values: evolution, held, berry, fossil, pokeball, consumable, other. The workbook does not
support that shape.

Measured (see `reports/workbook-audit.md`):

- `Wiki Category` has **12** distinct raw values, not 7.
- Those 12 collapse onto exactly **4** buckets, and the totals reconcile to the row
  against the `Item Categories` sheet, which states them independently:
  consumable 217, held 43, evolution 74, other 598 = **932**.
- **berry, fossil and pokeball are not in that set.** They live on `Source Category`, a
  separate 13-value axis: berries 84, poke balls 99, fossils 16, plus mints, medicine,
  materials, and others.

Three of the seven proposed values were therefore on the wrong axis, and a single-column
model cannot express an item that is both a consumable and a berry - which most are.

## Decision

Two columns:

- `category` - the 4 canonical buckets, `CHECK`-constrained, mapped from `Wiki Category`
  by an explicit lookup table in `scripts/lib/workbook.js`. The map is a literal, not an
  inference, so it can be audited.
- `source_category` - the 13-value axis, slugified, unconstrained.

## Consequences

- The item filter chips in `architecture.md` section 6 draw from `source_category`, which
  is where berry / fossil / pokeball actually are. `category` is the coarse grouping.
- An unmapped `Wiki Category` value **throws** rather than silently becoming `other`, so a
  re-exported workbook with a new category fails the import instead of quietly
  misfiling rows.
- `validate-import.js` asserts both axes, including that berries, fossils and poke balls
  resolve on the source axis, so the two cannot be collapsed back into one unnoticed.
