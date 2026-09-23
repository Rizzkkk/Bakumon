# Bakumon — project conventions

A community wiki and landing page for the Bakumon Minecraft server (Cobblemon).
Source data is `Cobblemon_Full_Pokemon_Wiki_No_Legendary.xlsx`.

## Read this first

`ground-truth/` holds every verified fact about this project. Before changing data
handling, schema, or any documented number, read the relevant file there:

- `ground-truth/00-project/architecture.md` — the build spec. Parts of its §2/§3/§4 were
  superseded by a workbook audit; the header says which.
- `ground-truth/01-data/` — what the workbook actually contains, measured.
- `ground-truth/00-project/decisions/` — ADRs. Do not reverse one without adding a new ADR.
- `ground-truth/reports/` — generated. Never hand-edit.

## Rules

- No emojis anywhere — code, UI strings, docs, commits. Use `[done]` / `[todo]`.
- Comments explain **why**, never what. Default to no comment; add one when a future
  reader would ask "why is it done this way" and the code cannot answer.
- On the third copy of a block, extract it.
- The workbook is authoritative for data. Scraped text lands in separate `wiki_*` columns
  and never overwrites a workbook value.
- Every number written into a doc cites the script that produced it. If you cannot
  regenerate it, do not write it.
- Docs are part of the change, not a follow-up. Schema change and doc change ship together.
- Migrations are never amended once applied. New change, new numbered file, and extend
  `validate-import.js` with an assertion that proves it ran.
- Tests and validators assert real values, not types. `expect(count).toBe(904)`, never
  `typeof count === 'number'`.

## Commands

```
npm run audit      # regenerate ground-truth/reports/workbook-audit.md
npm run db:up      # local Postgres 16 via docker compose
npm run db:schema  # apply pending migrations from apps/api/src/db/migrations/
npm run import     # workbook -> Postgres
npm run validate   # assert the imported data matches the audit; exits non-zero on drift
npm run mine       # download artwork + item descriptions; resumable
npm run db:down    # stop the local Postgres container
npm run api        # start the Express API on :3001
npm run smoke      # assert the running API against real data; exits non-zero on drift
npm run web        # start the Vite dev server on :5173
npm run web:build  # static build into apps/web/dist
npm run verify:web # assert the frontend's pure logic against the running API
npm run palette    # regenerate ground-truth/reports/brand-palette.md from the logo
npm run brand      # WebP banner/logo derivatives + the favicon set
npm run skin       # isometric character render from a Minecraft skin PNG
npm run explain    # regenerate ground-truth/reports/query-plans.md from EXPLAIN ANALYZE
```
