# Bakumon

Community wiki and landing page for the Bakumon Minecraft server, a Cobblemon server.
Browse Pokémon spawn data and items as they are configured on the server — not as they
are in the base mod.

## Layout

```
ground-truth/   verified project facts, decisions, and generated reports
assets/         brand images and mined artwork (the artwork is gitignored)
scripts/        workbook audit, import, validation, asset mining
apps/api/       Express API
apps/web/       React app - landing, wiki, legal pages, 404
```

## Status

| Area | State |
|---|---|
| Workbook audit | [done] |
| Ground-truth docs and conventions | [done] |
| Database schema | [done] |
| Workbook import + validation | [done] |
| Asset mining | [done] |
| REST API | [done] |
| React frontend | [done] — needs server screenshots, pre-production.md item 7 |
| Deployment | [todo] — Postgres on the Hostinger VPS, ADR 0005 |

## Getting started

```
npm install
npm run audit      # regenerates ground-truth/reports/workbook-audit.md
npm run db:up
npm run db:schema
npm run import
npm run validate
npm run mine
npm run api       # start the API on :3001
npm run smoke     # assert the running API against the real data
npm run explain   # regenerate the query plans report
```

`npm run validate` exits non-zero if the imported data drifts from the audited numbers,
and `npm run smoke` exits non-zero if the running API drifts from the contract.

## Attribution

Item artwork and descriptions come from the [Cobblemon Wiki](https://wiki.cobblemon.com)
under CC BY 4.0. Pokémon artwork comes from [PokeAPI](https://github.com/PokeAPI/sprites).
Bakumon is not affiliated with Cobblemon, Pokémon, or Mojang.
See `ground-truth/02-assets/attribution.md` for the full credit block.
