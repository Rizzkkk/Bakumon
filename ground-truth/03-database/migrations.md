# Migration ledger

## How migrations run

`npm run db:schema` runs `scripts/apply-schema.js`, which applies every `.sql` file in
`apps/api/src/db/migrations/` in filename order and records each in a `schema_migrations`
table with a sha256 checksum.

**An already-applied migration whose contents changed is a hard error, not a warning.**
Amending an applied file desynchronises the ledger from what was actually run against a
given database, and hands whoever applies it next a file that no longer matches their
state. New change, new numbered file, every time.

## Rules

1. New file, never an edit to an applied one. Even for a one-line index.
2. Every migration gets a matching assertion in `scripts/validate-import.js` - a probe for
   the column, index or constraint it created. A skipped migration then fails loudly at
   validation instead of surfacing later as a missing column in production.
3. Apply migrations to an environment **before** deploying code that reads the new
   columns. Never the other way round.
4. If a table ever has column-level grants revoked from a public role, a migration adding
   a column to it must re-grant explicitly. A new column on a restricted table is not
   automatically granted, and the migration will report success while the app cannot see
   the column.
5. Anything a later migration creates must be granted to `bakumon_api` (migration 0002).
   `ALTER DEFAULT PRIVILEGES` covers a new table created by the same owning role, and
   nothing else - not a table created by another role, and not a re-grant after a revoke.
   A missed grant reports a clean migration and then fails at request time, which is rule 4
   wearing a different hat.

## Applied

| File | Applied | What it created |
|---|---|---|
| `0001_initial_schema.sql` | 2026-09-16 | `pokemon`, `pokemon_spawns`, `items`, `biome_tokens`, their indexes, and the two search-vector triggers |
| `0002_api_read_only_role.sql` | 2026-09-23 | the `bakumon_api` LOGIN role, `SELECT` on the four data tables, and default privileges for future ones |

Check the live state with:

```sql
SELECT filename, applied_at FROM schema_migrations ORDER BY filename;
```

## Not yet needed

No migration has been superseded or reverted. When one is, add a new file that performs
the change forward - do not edit or delete the original.
