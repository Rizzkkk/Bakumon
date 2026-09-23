# Ground truth

Everything in this folder is either a **verified fact** about the project or a **decision**
that was deliberately made. It exists so that nobody has to re-derive the same answers,
and so that a claim can always be traced to the thing that proves it.

## What lives where

| Folder | Contents |
|---|---|
| `00-project/` | What Bakumon is, the conventions, the build spec, the ADRs, and the pre-production checklist |
| `01-data/` | What the source workbook actually contains, measured |
| `02-assets/` | Where artwork comes from, and the attribution it obliges |
| `03-database/` | Schema rationale and the migration ledger |
| `04-api/` | The API contract |
| `05-frontend/` | Brand assets and frontend-facing facts |
| `06-deployment/` | Runbook |
| `reports/` | **Generated.** Never hand-edit. |

## The rule that makes this folder worth keeping

**Hand-written docs may not state a number that a generated report does not confirm.**

Counts about the workbook come from `ground-truth/reports/workbook-audit.md`, produced by
`npm run audit`. Counts about the imported database come from
`ground-truth/reports/import-validation.md`, produced by `npm run validate`. If a number
here disagrees with those, the number here is the bug.

A doc that describes a feature in the present tense must be able to name the file that
implements it. Where only half a thing is built, say so in those terms — "the schema has
the column, nothing populates it yet" — rather than describing the finished version.

## Dev cycle

The folders are numbered in the order the work happens.

1. **`01-data`** — understand the source before modelling it. `npm run audit`.
2. **`03-database`** — schema follows the measured data, not the other way round.
   `npm run db:up && npm run db:schema && npm run import && npm run validate`.
3. **`02-assets`** — mine artwork against imported rows. `npm run mine`.
4. **`04-api`** — build endpoints against a populated database.
5. **`05-frontend`** — build screens against a working API.
6. **`06-deployment`** — ship.

Steps 1 to 5 are done. `apps/web` is a Vite SPA with a landing page, browse, search,
Pokemon and item pages, both legal pages and a 404, verified by `npm run verify:web` and
built by `npm run web:build`. The one thing still missing from it is six to eight server
screenshots - the gallery hides itself until they exist. Step 6, deployment, is not
started, and `git init` has still never been run.

`00-project/architecture.md` remains the spec, with the corrections in
`03-database/schema.md` applied and the cancellations recorded in ADRs 0005 to 0009.

**`00-project/pre-production.md` is the checklist for everything still standing between
here and a live site**, split into what needs a decision or an asset from the project
owner and what is implementation work.
