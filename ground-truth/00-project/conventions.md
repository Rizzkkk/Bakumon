# Conventions

`CLAUDE.md` at the repo root is the short version. This is the reasoning.

## Writing

- **No emojis anywhere** - code, UI strings, docs, commit messages. Status markers are
  `[done]` and `[todo]`.
- Prose in docs is plain and specific. "40% of rows need a padded field" beats "many rows
  have issues".

## Comments

Comments explain **why**, never what. `// loop through items` above a loop is noise; the
syntax already said it. Spend a comment on:

- a non-obvious design choice
- a business or server rule the code cannot express
- an edge case and the bug that caused it
- the measurement behind a magic number

Default to no comment. `scripts/lib/workbook.js` is the reference for the density this
codebase wants: the padding rule carries a comment because 40% of rows hitting it is
surprising and a future reader would otherwise assume it was an error path.

## Structure

- On the **third** copy of a block, extract it. Two similar blocks can be a coincidence;
  three is a helper waiting to be written.
- One shared reader for the workbook (`scripts/lib/workbook.js`). Every script imports it.
  Four scripts each parsing the spreadsheet their own way is how the counts drift apart.
- No abstraction ahead of its third caller.

## Data

- **The workbook is authoritative.** Scraped or derived text goes in a separate column
  prefixed `wiki_`, and a re-run of the miner must never overwrite a workbook value.
- Where the workbook is internally inconsistent, prefer the reading that **keeps data**.
  `Spawn Entries` says Aerodactyl has one spawn; the weight column carries two. Two wins,
  because the alternative silently deletes a real entry.
- Every parse that had to guess sets `parse_flag` on the row it produced. The scale of the
  guessing then stays measurable instead of becoming folklore.

## Documentation

- Docs ship in the **same pass** as the change. A schema change and its doc are one unit
  of work. Docs frozen at an old migration number are how a deploy ends up querying
  columns that do not exist.
- **Never describe a feature in the present tense without finding the file that implements
  it.** If the schema has a column and nothing populates it, write that sentence, not the
  one about the finished feature.
- Generated docs are regenerated, never edited. Anything under `ground-truth/reports/`
  carries a generated-by header.
- Numbers in hand-written docs must match the generated reports. The report is right.

## Migrations

- New change, **new numbered file**, every time. `scripts/apply-schema.js` checksums each
  applied migration and refuses to run if an already-applied file changed, because
  amending one desynchronises the ledger from what was actually run.
- Every migration gets a matching assertion in `scripts/validate-import.js`, so a skipped
  migration fails loudly rather than surfacing later as a missing column.

## Tests and validators

Assert **values**, not types. `typeof count === 'number'` stays green while a query
returns zero forever. The checks in `scripts/validate-import.js` are the pattern: create
or identify the specific fixture, then assert the specific number, and assert the negative
too - that no prose note row was imported as a Pokemon.

## Commits

- No AI co-author trailers unless asked.
- Subject line says what changed and why it matters, not which files moved.
