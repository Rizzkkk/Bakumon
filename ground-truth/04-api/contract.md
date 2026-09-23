# API contract

**Built.** The API lives in `apps/api/src/` and is verified by `npm run smoke`
(`scripts/smoke-api.js`, 58 assertions against real data - see
`ground-truth/reports/api-smoke.md`). This file remains the contract, and corrects
`00-project/architecture.md` section 5 where the audit invalidated it.

Run it with `npm run api`; it listens on `PORT`, default 3001.

## Corrections to the architecture doc

| Claim in architecture.md | Actual |
|---|---|
| `total: 1114` Pokemon | **904** |
| `total: 933` items | **934** (932 plus 2 backfilled) |
| `slug` identifies a Pokemon | `species_slug` does; the sheet's column B is a spawn selector |
| `biome?` filter matches biome names | Most spawns carry `#cobblemon:` **tags**; filter on the token |
| buckets are common/uncommon/rare | five values, including `ultra-rare` and `legendary event` |

## Endpoints

```
GET /api/pokemon
  query: search?, bucket?, biome?, page? (1), pageSize? (24)
  200 -> { data: [ { id, slug, displayName, imageUrl, thumbUrl,
                     spawnSummary: { buckets: [...], biomeCount: n, formCount: n } } ],
           page, pageSize, total }

GET /api/pokemon/:slug
  200 -> { id, slug, displayName, nationalDexId, imageUrl,
           spawns: [ { bucket, weight, levelMin, levelMax, context,
                       biomes: [...], conditions, aspects: {...}, formLabel } ] }
  404 -> { error: "Pokemon not found" }

GET /api/items
  query: search?, category?, sourceCategory?, page?, pageSize?
  200 -> { data: [ { id, itemId, name, category, sourceCategory,
                     description, descriptionSource, imageUrl } ],
           page, pageSize, total }

GET /api/items/:itemId
  200 -> { id, itemId, name, category, sourceCategory, description, descriptionSource,
           evolutionUseCount, evolutionUses, imageUrl }
  404 -> { error: "Item not found" }

GET /api/biomes
  200 -> { data: [ { token, namespace, isTag, spawnCount } ] }
```

## Design notes the data forces

### `biome` must filter on the token, not a biome name

112 distinct tokens, most of them `#cobblemon:` tags rather than concrete biomes. A
free-text biome filter matches almost nothing. `GET /api/biomes` exists so the UI can
offer the real closed list; the filter is then array containment:

```sql
WHERE biomes @> ARRAY[$1]
```

which is what `pokemon_spawns_biomes_idx` (GIN) serves.

### `descriptionSource` is part of the contract, not an implementation detail

`description` in the response is the workbook value if present, `wiki_description`
otherwise. `descriptionSource` is `'workbook'` or `'wiki'`. The UI needs it: wiki text is
CC BY 4.0 and has to be credited at the point of use. See `02-assets/attribution.md`.

### Filter chips come from `sourceCategory`

`category` has four values. Berries, fossils and Poke Balls - which users will expect to
filter by - are on `sourceCategory`. Both are exposed; the chips in architecture.md
section 6 should be built from the second. ADR 0002.

### Spawns should be grouped by form on the detail page

Magikarp has 32 spawn rows across its `magikarp_jump` aspects, Unown 28. A flat table is
unreadable. Group on `formLabel` / `aspects`; the data is there.

### Search

`search_vector @@ plainto_tsquery('english', $1)` with an `ILIKE '%term%'` OR clause in two
cases: queries under about 4 characters, since a tsvector match does not handle prefix
typing, **and any term that tokenises to an empty tsquery** regardless of length.

That second case is not hypothetical. `plainto_tsquery('english', 'over')` is empty, so
before the fallback existed `?search=over` returned nothing while 123 items - Clover Sweet,
Cover Fossil, Covert Cloak - contain the string. Every English stopword behaved that way.

The items vector already covers `wiki_description`, so wiki-only items are findable.

### Relevance ranking

**Only when a search term is present.** With no term the ordering is unchanged and the SQL
is byte-identical to what it was before ranking existed - `rankOrder([])` returns an empty
string, and two smoke assertions pin the first three rows of each browse listing precisely
so a rank tier leaking into the no-search path fails loudly.

With a term, results order by four keys, most specific first:

```sql
ORDER BY (lower(name) = lower($term)) DESC,   -- exact match
         (name ILIKE $prefix)         DESC,   -- prefix match
         ts_rank(vector, plainto_tsquery('english', $term)) DESC,
         name, id                             -- unchanged tie-break
```

Postgres sorts false before true, so each boolean tier is `DESC`. Measured effect:
`?search=potion` returned `Hyper Potion, Max Potion, Potion, Super Potion` and now returns
`Potion, Hyper Potion, Max Potion, Super Potion`. `?search=lit` on pokemon led with
Blitzle and now leads with Litleo, Litten, Litwick.

**ADR 0006's `display_name, id` remains the terminal tie-break.** Relevance sorts above it,
never instead of it: three display names collide and without the `id` tie-break a row can
land on two pages or on neither. Ranking reorders a result set and must never filter one -
`?search=over` still totals 123 and `?search=abra` still returns exactly `['abra']`, both
asserted.

The prefix pattern is bound **after** every WHERE parameter, because it is referenced only
from the `ORDER BY` while the companion count query is run with the WHERE parameters alone.
Binding it into the shared list gave that query one parameter more than its own clause
references, and Postgres rejected the statement - so every searched page past the end
returned a 500. It reproduces only on an empty page, which is why the smoke suite now
asserts a searched page past the end explicitly. See `apps/api/src/lib/search.js`.

Ranking is lexical, not fuzzy: `charizrd` still returns nothing. Fixing that needs
`pg_trgm`, a migration and a measured plan.

## What the built API adds to the shapes above

The five endpoints return exactly the fields listed. These are the additions, and the
places where the data forced a decision the shapes alone do not express.

- `GET /api/health` exists and is not in the list above. Body is `{ "status": "ok" }` and
  nothing else - no version, no uptime, no pool statistics, no environment flags. It runs
  `SELECT 1 FROM pokemon LIMIT 1` (cached 5s) and returns `503 { "status": "degraded" }`
  when that fails. Deliberately a real relation and not `SELECT 1`: `SELECT 1` is answered
  without touching a table, so it stayed green through a table lock or a half-applied
  migration while every endpoint 500'd.
- **The item list row carries `description`, `descriptionSource` and `category`, which
  only the detail page reads.** Measured 2026-09-23 against the running API: the two
  description fields cost 1,705 B on a 24-row page 1 (27.5% of the response) and 2,350 B on
  a berries page (35%), on a screen that also loads ~33 KB of item art; `category` costs
  485 B. Trimming them means a second row-shaping function next to `toCard`, so they stay.
  The pokemon list row carries `imageUrl` (995 B, 19.5%) for the same reason.
- **`GET /api/pokemon/:slug` no longer returns `thumbUrl`.** It did until 2026-09-23, on
  the stated grounds that "the detail page needs both" - the detail page renders `imageUrl`
  only, and nothing ever read it. Unlike the fields above, this one was mapped by hand in
  `findPokemonBySlug` rather than by a shared helper, so removing it cost nothing. A smoke
  assertion now pins the exact key list.
- **`spawns` stays a flat array.** The design note below says to group by form, and the
  shape says an array. The array is ordered so the base form comes first and each form's
  rows are adjacent, and the UI groups by walking it once. Inventing a `forms` wrapper
  would have renamed the contract.
- **`descriptionSource` has a third value: `null`.** 516 of 934 items have text in
  neither column. Labelling an empty string `workbook` would be a false attribution claim,
  so `description` and `descriptionSource` are `null` together.
- **`levelMin`, `levelMax`, `weight` and `bucket` can be `null`.** The six
  `legendary event` rows carry `Level = Event`. `weight` is `NUMERIC` in the schema and is
  cast to `float8` in every query, so it arrives as a JSON number rather than a string.
- **`spawnSummary` describes the species, not the filtered subset.** A card in a
  `bucket=rare` grid still lists every bucket that Pokemon has, so the same card does not
  render differently depending on the filter that found it.
- `GET /api/biomes` sends `Cache-Control: public, max-age=3600`. The table only changes
  when `npm run import` runs. Every response also sends `Vary: Origin`, set explicitly
  rather than by `cors` - that library skips header configuration entirely when it
  rejects an origin, so a shared cache would otherwise key this public body on the URL
  alone and serve a header-less copy to the real site.

### Validation

- An **unknown query parameter is a 400** naming it, rather than being ignored. A mistyped
  `pagesize=100` that silently returns 24 rows is a bug that costs half an hour to find.
  The only client is our own SPA, shipped from this repo, so the strictness is affordable.
- A repeated parameter such as two `page` values is a 400. Express 5 parses those into an
  array, and coercing one would pick a value the client did not ask for.
- `bucket`, `category` and `biome` are **closed vocabularies, and a miss is a 400** rather
  than an empty grid. `GET /api/biomes` publishes the biome list and the other two are
  fixed by the schema. `category=berry` is therefore rejected: berry lives on the source
  axis (ADR 0002).
- `sourceCategory` is the exception and returns an **empty result** for an unknown value.
  Its 13 values are derived from the workbook and no endpoint publishes them, so rejecting
  one would punish the client for a gap on our side.
- `pageSize` is capped at **100** (`MAX_PAGE_SIZE` in `apps/api/src/constants.js`). Above
  that a request stops being a page and becomes an export, and the export is the workbook.
- `page` and `pageSize` must be **plain decimal digits**, and `page` is capped at
  1,000,000. `Number()` would otherwise accept `0x10` (silently serving page 16) and a
  huge value would overflow `bigint` in the `OFFSET`, turning a bad query string into a
  500.
- A **malformed percent-escape** in the path - `GET /api/items/%` - is a `400`
  `{ "error": "Bad request" }`. The router raises it as a `URIError` carrying status 400;
  without honouring that it reached the 500 branch, letting a scanner mint unlimited fake
  server errors.

### 934 rows exist, 933 are listable, all 934 are addressable

Every list response — browse, search and both category filters — excludes rows whose
**name** matches a printf placeholder. `GET /api/items/:itemId` does not, so a direct link
to one still resolves.

Measured: the rule matches exactly **one** row, `cobblemon:aprijuice.quality_format`, whose
name is `%1$s %2$s`. It was originally scoped to search only, which left it sorting to the
top of page one of the browse listing — a printf format string presented as the first item
in the wiki. See `01-data/known-gaps.md` for why the other six localisation rows are not
caught, and why a denylist was refused.

The counts this produces, and what asserts each one:

| Population | Count | Asserted by |
|---|---|---|
| Rows in `items` | 934 | `validate-import.js`, against the database |
| Listable through `GET /api/items` | **933** | `smoke-api.js`, against the running API |
| `category=consumable` in the database | 217 | — |
| `category=consumable` listable | **216** | `smoke-api.js` |

The other three canonical categories are unaffected: evolution 74, held 45, other 598.
933 = 216 + 74 + 45 + 598.

Note that `validate-import.js` asserts a *third* population: 217/74/**43**/598 = 932, over
the workbook rows only (`WHERE wiki_category NOT LIKE 'backfilled%'`), which excludes the
two backfilled held items. Three numbers, three populations, all correct — do not
reconcile them by changing one.

### Errors

The client sees only the 404 strings above, the 400 strings from validation,
`Too many requests`, `Not found`, and `Internal server error`. Never a stack trace, never
a pg message (which names the table and constraint it failed on), never a pg `detail`
(which can carry the offending row values). A short correlation id is logged server-side.

There is deliberately no development-mode branch that echoes stack traces. A flag that
changes what an error response contains is a flag that will one day be set wrong in
production.

### Rate limits

Per-endpoint buckets rather than one shared budget, so a chatty search box cannot spend
the detail-page allowance:

| Bucket | Routes | Budget |
|---|---|---|
| `search` | `GET /api/pokemon`, `GET /api/items` | 120 / min |
| `detail` | `GET /api/pokemon/:slug`, `GET /api/items/:itemId` | 60 / min |
| `reference` | `GET /api/biomes` | 20 / min |
| `health` | `GET /api/health` | 60 / min |
| `global` | everything under `/api` | 300 / min |

A 429 body is `{"error":"Too many requests"}` as JSON, never the library default HTML, and
it carries the CORS headers - the limiter is mounted **after** `cors` so the browser can
read that body. The `global` bucket is mounted unmounted (not under `/api`), so unrouted
paths cannot generate unlimited 404s and unlimited log lines.

Buckets are memoised by name: each `rateLimit()` call builds its own store, so calling
`limiter('search', 120)` in two route files would otherwise give each route its own 120
rather than the shared budget this table describes.

Note the per-route budgets sum to 440/min against a global 300, so `global` is the
constraint an active session actually meets. The store is in memory, so PM2 must stay at
`instances: 1` or the buckets fragment per worker.

## Before adding an index

Run `EXPLAIN ANALYZE` against the real query with real data and quote the plan. At 904 and
3,268 rows most theoretical improvements will not show up.

`npm run explain` (`scripts/explain-api.js`) does this for eight real API queries and
writes `ground-truth/reports/query-plans.md`. It builds each statement from the API's own
query builders in `apps/api/src/queries/`, so a plan there is a plan for the query the API
issues, not for a copy that can drift.

The two indexes from migration 0001 have now been measured, and they came out differently:
the GIN index on `biomes` is used, the btree on `bucket` is not. Both are kept, with the
reasoning in `03-database/schema.md`.

The number to watch when changing the pokemon list query is the summary lateral: it must
report `loops` equal to the page size. It currently reads `loops=24` against a 24-row
page. `loops=904` would mean the `MATERIALIZED` CTE stopped holding, and that is a bug in
the query, not a missing index.
