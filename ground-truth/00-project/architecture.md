> **Audit note, 2026-09-11.** This document remains the build spec for the frontend
> (section 6), the legal pages (section 8) and deployment (section 9). Section 5 was also
> on that list until the API was built; it is now superseded in full - see the 2026-09-17
> note below. Its
> **data claims were measured against the workbook and several are wrong** - correcting
> them changed the schema. Before implementing sections 2, 3, 4 or 7, read:
>
> - `ground-truth/03-database/schema.md` - what the schema actually is, and why
> - `ground-truth/01-data/` - what the workbook actually contains
> - `ground-truth/00-project/decisions/` - ADRs 0001 to 0004
> - `ground-truth/reports/workbook-audit.md` - the generated counts
>
> Superseded in short: there are 904 species and 1,107 spawn rows, not 1,114 Pokemon;
> column B is a spawn selector, not a slug; item category is two axes, not one seven-value
> column; `used_in_evolutions` is a count, not a boolean; the Cobblemon wiki has no Pokemon
> sprites, so section 7's scraper design does not apply to them.
>
> Also: there is no `schema.sql`. Schema lives in numbered migrations under
> `apps/api/src/db/migrations/`, applied by `npm run db:schema` through a checksummed
> ledger - see `ground-truth/03-database/migrations.md`.

> **Decision note, 2026-09-17.** Four questions this doc left open in section 11 are now
> answered, and two of them cancel things it specifies:
>
> - **ADR 0005** - Postgres on the Hostinger KVM2 VPS, artwork served as static files
>   from the same box. Section 9 is the deployment path; Supabase is not.
> - **ADR 0006** - the seven double-spelled species are kept as separate rows. 904 rows,
>   897 distinct Pokemon.
> - **ADR 0007** - no analytics. `CookieBanner.jsx`, `CookiePreferences.jsx` and the
>   `/cookie-preferences` route in sections 1 and 6 are **cancelled** - the site sets no
>   cookies, so there is nothing to consent to.
> - **ADR 0008** - client-rendered SPA. Per-page Open Graph tags are impossible; per-page
>   `<title>` still works.
> - **ADR 0009** (2026-09-23) - visual direction. Closes section 11's "CS.RU>RIN" design
>   reference without it, records the palette extracted from the logo by `npm run palette`,
>   and chooses **not** to use Tailwind despite section 0's suggestion. Section 6's
>   `CategoryNav` line is corrected there too: it names a seven-value category axis that
>   ADR 0002 showed does not exist.
>
> Section 1's `apps/web/` tree is close to what was built, with three differences: the two
> cancelled cookie components are absent (ADR 0007), `usePokemonSearch.js` and
> `useItemSearch.js` were built as one `useWikiSearch.js` over a shared `useResource.js`
> rather than as two parallel hooks, and `SpawnFormGroup` was folded into `SpawnTable`
> because 32 separate tables for Magikarp repeated the column header 32 times.
>
> Section 6's routes are built at the paths it specifies - `/`, `/wiki`,
> `/wiki/pokemon/:slug`, `/wiki/items/:itemId`, `/privacy-policy`, `/terms-of-service` -
> plus a catch-all 404 the spec does not mention. `/cookie-preferences` is not built
> (ADR 0007). Section 6 is therefore **complete as of 2026-09-23**; it remains the
> reference for what each route contains.
>
> Section 5 is superseded in full by `ground-truth/04-api/contract.md`, which corrects its
> row counts and its biome filter. Section 1 named `db/client.js` and `db/schema.sql`;
> the built API uses `db/pool.js` and the migrations directory.

# Bakumon (Cobblemon Community Site) — Implementation Spec

This is a build-ready spec for an agent (Claude Code) to implement directly. It covers exact schema, file structure, API contracts, component breakdown, and an ordered task list. Source data: `Cobblemon_Full_Pokemon_Wiki_No_Legendary.xlsx` — 1,114 Pokémon spawn rows + ~2,150 item rows across 9 sheets, no legendaries.

## 0. Stack lock-in

- **Frontend**: React 18 + Vite, React Router, plain CSS or Tailwind (pick Tailwind for speed unless you object)
- **Backend**: Node.js + Express (or Fastify — Express is fine at this scale)
- **DB**: PostgreSQL — either Hostinger KVM2 (self-hosted) or Supabase free tier (see §7 in prior doc for trade-offs; this spec's SQL works on either)
- **ORM**: plain `pg` (node-postgres) with hand-written SQL is fine at this scale — no ORM needed for either the API or the ingestion scripts, keeps things simpler without TypeScript's type-safety net
- **Process manager on VPS**: PM2
- **Web server**: nginx as reverse proxy + static file server for the React build

No auth in v1 — skip user tables, sessions, JWT entirely.

## 1. Monorepo structure

```
bakumon/
├── apps/
│   ├── web/                      # React app
│   │   ├── src/
│   │   │   ├── pages/
│   │   │   │   ├── Landing.jsx
│   │   │   │   ├── WikiHome.jsx
│   │   │   │   ├── PokemonDetail.jsx
│   │   │   │   ├── ItemDetail.jsx
│   │   │   │   ├── PrivacyPolicy.jsx
│   │   │   │   ├── CookiePreferences.jsx   # CANCELLED - ADR 0007
│   │   │   │   └── TermsOfService.jsx
│   │   │   ├── components/
│   │   │   │   ├── layout/
│   │   │   │   │   ├── Header.jsx
│   │   │   │   │   ├── Footer.jsx
│   │   │   │   │   └── CookieBanner.jsx        # CANCELLED - ADR 0007
│   │   │   │   ├── landing/
│   │   │   │   │   ├── Hero.jsx
│   │   │   │   │   ├── ScreenshotGrid.jsx
│   │   │   │   │   └── DiscordCTA.jsx
│   │   │   │   └── wiki/
│   │   │   │       ├── SearchBar.jsx
│   │   │   │       ├── CategoryNav.jsx
│   │   │   │       ├── PokemonCard.jsx
│   │   │   │       ├── ItemCard.jsx
│   │   │   │       ├── SpawnTable.jsx
│   │   │   │       └── ResultsGrid.jsx
│   │   │   ├── api/
│   │   │   │   └── client.js        # fetch wrapper, base URL from env
│   │   │   ├── hooks/
│   │   │   │   ├── usePokemonSearch.js
│   │   │   │   └── useItemSearch.js
│   │   │   ├── App.jsx              # router
│   │   │   └── main.jsx
│   │   ├── .env.example
│   │   ├── vite.config.js
│   │   └── package.json
│   └── api/                      # Node/Express app
│       ├── src/
│       │   ├── routes/
│       │   │   ├── pokemon.routes.js
│       │   │   └── items.routes.js
│       │   ├── controllers/
│       │   │   ├── pokemon.controller.js
│       │   │   └── items.controller.js
│       │   ├── db/
│       │   │   ├── client.js        # SUPERSEDED - built as db/pool.js
│       │   │   └── schema.sql        # SUPERSEDED - see db/migrations/
│       │   ├── middleware/
│       │   │   └── errorHandler.js
│       │   └── index.js
│       ├── .env.example
│       └── package.json
├── scripts/
│   ├── import-xlsx.js             # one-off: spreadsheet → DB
│   ├── scrape-images.js           # SUPERSEDED - built as mine-assets.js, ADR 0001
│   └── validate-import.js         # sanity-check row counts & parsing mismatches
├── packages/
│   └── shared-shapes/            # NOT BUILT - the env reader is only on its 2nd copy
│       └── shapes.js              # plain JS factory/shape helpers for Pokemon, PokemonSpawn, Item objects, shared by web + api (JSDoc comments instead of TS types)
├── docker-compose.yml             # optional: local Postgres for dev
├── .gitignore
└── README.md
```

## 2. Database schema (Postgres — works on Hostinger or Supabase)

```sql
-- apps/api/src/db/schema.sql

CREATE TABLE pokemon (
  id            SERIAL PRIMARY KEY,
  slug          TEXT UNIQUE NOT NULL,          -- e.g. 'abomasnow'
  display_name  TEXT NOT NULL,                 -- e.g. 'Abomasnow'
  image_url     TEXT,                          -- filled in by mine-assets.js
  search_vector TSVECTOR,                      -- generated below
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE pokemon_spawns (
  id            SERIAL PRIMARY KEY,
  pokemon_id    INTEGER NOT NULL REFERENCES pokemon(id) ON DELETE CASCADE,
  bucket        TEXT,             -- 'common' | 'uncommon' | 'rare'
  weight        NUMERIC,
  level_min     INTEGER,
  level_max     INTEGER,
  context       TEXT,             -- 'grounded' | 'submerged' | etc
  biomes        TEXT[],           -- parsed from ';'-delimited column
  conditions    TEXT,             -- kept as free text, too varied to fully normalize (see §4)
  raw_row_index INTEGER           -- original spreadsheet row, for debugging bad parses
);

CREATE TABLE items (
  id                  SERIAL PRIMARY KEY,
  item_id             TEXT UNIQUE NOT NULL,     -- e.g. 'cobblemon:ability_capsule'
  name                TEXT NOT NULL,
  category            TEXT NOT NULL CHECK (category IN
                        ('evolution','held','berry','fossil','pokeball','consumable','other')),
  wiki_category       TEXT,                     -- original 'Wiki Category' column, kept for reference
  description         TEXT,
  used_in_evolutions  BOOLEAN DEFAULT false,
  evolution_uses      TEXT,
  image_url           TEXT,
  search_vector       TSVECTOR,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

-- Full-text search
CREATE INDEX pokemon_search_idx ON pokemon USING GIN (search_vector);
CREATE INDEX items_search_idx ON items USING GIN (search_vector);
CREATE INDEX pokemon_spawns_pokemon_id_idx ON pokemon_spawns (pokemon_id);
CREATE INDEX items_category_idx ON items (category);

-- Keep search_vector in sync automatically
CREATE FUNCTION pokemon_search_trigger() RETURNS trigger AS $$
begin
  new.search_vector := to_tsvector('english', coalesce(new.display_name,''));
  return new;
end
$$ LANGUAGE plpgsql;
CREATE TRIGGER pokemon_search_update BEFORE INSERT OR UPDATE ON pokemon
  FOR EACH ROW EXECUTE FUNCTION pokemon_search_trigger();

CREATE FUNCTION items_search_trigger() RETURNS trigger AS $$
begin
  new.search_vector := to_tsvector('english', coalesce(new.name,'') || ' ' || coalesce(new.description,''));
  return new;
end
$$ LANGUAGE plpgsql;
CREATE TRIGGER items_search_update BEFORE INSERT OR UPDATE ON items
  FOR EACH ROW EXECUTE FUNCTION items_search_trigger();
```

## 3. Sheet → table mapping (exact, from the uploaded file)

| Source sheet | Target table | Notes |
|---|---|---|
| `Pokemon Wiki` | `pokemon` + `pokemon_spawns` | 1 sheet row → 1 `pokemon` row + N `pokemon_spawns` rows (N = `Spawn Entries` column) |
| `Item Wiki` | `items` | **primary source of truth** — has the fullest column set (`Item`, `Item ID`, `Wiki Category`, `Source Category`, `Description / Effect`, `Used in Evolutions`, `Evolution Uses`) |
| `Evolution Items`, `Held Items`, `Berries Wiki`, `Fossils Wiki`, `Poké Balls Wiki`, `Consumables Wiki`, `Held Items Wiki`, `Evolution Items Wiki`, `Other Items Wiki` | *(cross-check only, do not insert)* | These are filtered subsets/views of `Item Wiki` by category. Import `Item Wiki` first, then run each of these sheets through `validate-import.js` to confirm every `Item ID` in them already exists in `items` — log any that don't (those are gaps to backfill from the specialty sheet) |
| `Item Categories` | *(reference only, not imported)* | Just a category count summary — use it to sanity-check your category totals after import, don't insert it as data |

`category` enum mapping from `Wiki Category` / `Source Category` values seen in the data: `Held / Battle Items`→`held`, `Consumable / Usable`→`consumable`, `Other Cobblemon Item`→`other`, plus `evolution`, `berry`, `fossil`, `pokeball` from the dedicated sheets. Build this as an explicit lookup table in `import-xlsx.js` (not inferred at runtime) so it's auditable.

## 4. Parsing rules for `Pokemon Wiki` (the tricky part)

Columns `Bucket`, `Weight`, `Level`, `Context`, `Biome(s)` use `;`-delimited parallel arrays; `Conditions` uses `|`-delimited segments. **These do not always align 1:1 in count** — e.g. Aegislash has `Spawn Entries = 4` but `Bucket` has only 1 value (applies to all 4) while `Weight`/`Biome(s)` have their own counts and `Conditions` splits into 3 via `|`.

Handle this defensively, not by guessing silently:

1. Split each of `Bucket`, `Weight`, `Level`, `Context`, `Biome(s)` on `;`, and `Conditions` on `|`.
2. For each field, if it has exactly 1 value, treat it as constant across all `Spawn Entries` rows for that Pokémon. If it has exactly `Spawn Entries` values, zip them 1:1. If it has some other count, **do not silently drop data** — insert one `pokemon_spawns` row per available `Conditions` segment (that's the most granular real signal), repeat the shorter arrays' last-known value to fill, and write the row's original spreadsheet line number to `raw_row_index` plus a line to a `import-warnings.log` file so it can be manually reviewed later.
3. `Level` values like `"6-31"` split into `level_min`/`level_max` integers; a single number (no dash) sets both to the same value.
4. Run `validate-import.js` after import: it should report (a) total pokemon rows vs sheet rows (should match, no dupes), (b) total spawn rows inserted, (c) count of rows that hit the mismatched-array-length fallback in step 2, so you know how much needs manual review.

## 5. API contract

Base URL: `/api`

```
GET /api/pokemon
  query: search?, bucket?, biome?, page? (default 1), pageSize? (default 24)
  200 → {
    "data": [
      { "id": 1, "slug": "abomasnow", "displayName": "Abomasnow", "imageUrl": "...",
        "spawnSummary": { "buckets": ["rare"], "biomeCount": 3 } }
    ],
    "page": 1, "pageSize": 24, "total": 1114
  }

GET /api/pokemon/:slug
  200 → {
    "id": 1, "slug": "abomasnow", "displayName": "Abomasnow", "imageUrl": "...",
    "spawns": [
      { "bucket": "rare", "weight": 0.4, "levelMin": 8, "levelMax": 45,
        "context": "grounded", "biomes": ["minecraft:snowy_taiga","minecraft:grove","minecraft:snowy_slopes"],
        "conditions": "Time: day" }
    ]
  }
  404 → { "error": "Pokemon not found" }

GET /api/items
  query: search?, category?, page?, pageSize?
  200 → { "data": [ { "id": 1, "itemId": "cobblemon:ability_capsule", "name": "Ability Capsule",
                       "category": "consumable", "description": "...", "imageUrl": "..." } ],
          "page": 1, "pageSize": 24, "total": 933 }

GET /api/items/:itemId
  200 → { "id": 1, "itemId": "cobblemon:ability_capsule", "name": "Ability Capsule",
           "category": "consumable", "description": "...", "usedInEvolutions": false,
           "evolutionUses": null, "imageUrl": "..." }
  404 → { "error": "Item not found" }
```

Search implementation: `WHERE search_vector @@ plainto_tsquery('english', $1)` combined with `ILIKE` fallback on `display_name`/`name` for partial/prefix matches (tsvector alone won't catch prefix typing well — add a simple `ILIKE '%term%'` OR clause for short queries under ~4 chars).

## 6. Frontend routing & component notes

```
/                       → Landing.jsx (Hero, ScreenshotGrid, DiscordCTA, Footer)
/wiki                   → WikiHome.jsx (SearchBar + CategoryNav + ResultsGrid, tabs: Pokémon / Items)
/wiki/pokemon/:slug     → PokemonDetail.jsx (image, spawn table via SpawnTable.jsx)
/wiki/items/:itemId     → ItemDetail.jsx
/privacy-policy         → PrivacyPolicy.jsx
/cookie-preferences     → CANCELLED, ADR 0007 (no cookies, so nothing to consent to)
/terms-of-service       → TermsOfService.jsx
```

- `SearchBar` debounces input (~300ms) and calls `/api/pokemon` or `/api/items` depending on active tab; lift active tab + query into URL search params (`?tab=pokemon&q=char`) so results are shareable/bookmarkable.
- `CategoryNav`: **CORRECTED by ADR 0002.** There is no seven-value category axis -
  berry, fossil and pokeball are not on `category` at all. The chips are built from the
  13-value `sourceCategory`, plus bucket chips on the Pokemon tab. As built:
  `apps/web/src/components/wiki/CategoryNav.jsx`.
- `CookieBanner`: **cancelled by ADR 0007.** There is no analytics and the site sets no cookies, so no consent is required and no banner is built.
- **SUPERSEDED by ADR 0009.** This paragraph asked for a design reference before the
  visual layout could be specified. The reference was never produced, so ADR 0009 closes
  the question: the palette is extracted from the logo by `npm run palette`, the site is
  dark-first, results are a card grid and spawns are a real table. The wiki is built.

## 7. Ingestion scripts — implementation notes

**`scripts/import-xlsx.js`**
- Use `exceljs` (better streaming support than `xlsx` for large sheets, though either works at this row count).
- Read `Pokemon Wiki` and `Item Wiki` sheets; apply §3 mapping and §4 parsing rules.
- Upsert on `slug` (pokemon) / `item_id` (items) so re-running the script after a spreadsheet update doesn't duplicate rows — `ON CONFLICT (slug) DO UPDATE SET ...`.
- Log a summary to stdout: rows read per sheet, rows inserted/updated, warnings count.

**`scripts/mine-assets.js` (specified here as `scrape-images.js`)**
- Config-driven: base URL of the target wiki is a constant at the top of the file, not hardcoded inline — the exact official Cobblemon wiki URL structure wasn't confirmed during planning, so verify the page-naming pattern (likely `/wiki/<PokemonName>`) manually first and adjust the selector before running at scale.
- Rate-limit requests (e.g. 1 req/sec with a small delay) to avoid hammering the source site.
- Download images to `apps/api/public/images/pokemon/<slug>.png` and `.../items/<item_id>.png` if serving from the VPS directly, or upload to Supabase Storage and save the returned public URL — pick based on the hosting decision.
- Skip + log (don't crash) any Pokémon/item where no matching page/image is found; re-run should retry only the missing ones.
- Check the source wiki's license/attribution terms before scraping at scale, and add a credit line in the site footer if required.

## 8. Legal pages

`PrivacyPolicy.jsx`, `TermsOfService.jsx`, `CookiePreferences.jsx` can start as static content components (no CMS needed at this size). Keep them factually accurate to what the site actually does — no accounts, no personal data collected beyond basic analytics/cookies if you add any, third-party embed being the Discord link. Flag this back to me if you want drafted copy for these three pages — that's a separate, contained task from the architecture itself.

## 9. Deployment (Hostinger KVM2 path)

1. Provision Postgres on the VPS (or point `DATABASE_URL` at Supabase instead — no code changes needed either way, just env var).
2. `pm2 start apps/api/dist/index.js --name bakumon-api`
3. Build the React app (`vite build`) and serve `apps/web/dist` via nginx as static files.
4. nginx reverse-proxies `/api/*` to the Node process (e.g. `localhost:3001`), serves everything else as static.
5. SSL via Certbot/Let's Encrypt.
6. Set up a cron job or manual trigger for re-running `import-xlsx.js` when the spreadsheet changes.

## 10. Ordered build checklist (for the implementing agent)

1. Scaffold monorepo structure (§1)
2. Create DB, run `schema.sql` (§2)
3. Write and run `import-xlsx.js` against the real spreadsheet, then `validate-import.js` — fix parsing warnings before moving on
4. Write and run `mine-assets.js` (PokeAPI for pokemon, Cobblemon wiki for items - ADR 0001)
5. Build API routes + controllers (§5), test each endpoint with curl/Postman against real imported data
6. Scaffold React app + routing (§6), wire `api/client.js` to the running API
7. Build `WikiHome` search/browse flow end-to-end before styling
8. Build `PokemonDetail` / `ItemDetail` pages
9. Build Landing page (Hero, ScreenshotGrid, DiscordCTA)
10. Add the two legal pages - privacy and terms. No cookie banner (ADR 0007)
11. Deploy per §9, point DNS, verify SSL

## 11. Still open
- ~~The "CS.RU>RIN" wiki design reference~~ - **closed by ADR 0009, 2026-09-23**, without
  the reference. A design reference arriving later needs a new ADR; it does not reopen
  this by itself.
- Postgres-on-VPS vs. Supabase final call
- Legal page copy (privacy/cookies/ToS) — want these drafted as a follow-up?
- Confirm Cobblemon wiki's actual URL pattern/attribution terms before running the scraper at scale
