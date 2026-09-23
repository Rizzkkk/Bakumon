import { all, one } from '../db/pool.js';
import { conditions } from '../lib/sql.js';
import { searchOn, rankFor, rankSelect, rankOrderByAlias } from '../lib/search.js';

function pokemonConditions({ search, bucket, biome }) {
  const c = conditions();

  const matchedSearch = search
    ? searchOn(c, { vector: 'p.search_vector', name: 'p.display_name' }, search)
    : null;

  if (bucket) {
    c.add(
      (value) =>
        `EXISTS (SELECT 1 FROM pokemon_spawns s WHERE s.pokemon_id = p.id AND s.bucket = ${value})`,
      bucket,
    );
  }

  if (biome) {
    // Array containment, which is what the GIN index on biomes serves. Most spawns carry
    // a #cobblemon: tag rather than a concrete biome name.
    c.add(
      (value) =>
        `EXISTS (SELECT 1 FROM pokemon_spawns s WHERE s.pokemon_id = p.id AND s.biomes @> ARRAY[${value}::text])`,
      biome,
    );
  }

  return { c, search: matchedSearch };
}

// Returns the statement rather than running it, so scripts/explain-api.js plans exactly
// the query the API issues instead of a second copy that can drift away from it.
export function listPokemonSql({ search, bucket, biome, limit, offset }) {
  const { c, search: matched } = pokemonConditions({ search, bucket, biome });
  const { rank, rankParams } = rankFor(matched, c);
  // countText is run with c.params alone, so anything bound only for the ORDER BY has to
  // sit after them - see the note in lib/search.js.
  const params = [...c.params, ...rankParams, limit, offset];
  const limitAt = `$${params.length - 1}`;
  const offsetAt = `$${params.length}`;

  // MATERIALIZED is load-bearing. Without it the planner inlines this CTE and evaluates
  // the lateral below for every match rather than for the page, which is the N+1 the API
  // contract warns about.
  const text = `WITH matched AS MATERIALIZED (
       SELECT p.id, p.species_slug, p.display_name, p.image_url, p.thumb_url,
              ${rankSelect(rank)}count(*) OVER () AS total_count
         FROM pokemon p
        ${c.where()}
        -- id is not decoration: seven species are spelled two ways and three pairs share an
        -- identical display_name - Mime Jr., Mr. Mime and Mr. Rime - so without it a row
        -- can land on two pages or on neither. ADR 0006. Relevance tiers sort above it,
        -- never instead of it.
        ORDER BY ${rankOrderByAlias(rank)}p.display_name, p.id
        LIMIT ${limitAt} OFFSET ${offsetAt}
     )
     SELECT m.id, m.species_slug, m.display_name, m.image_url, m.thumb_url, m.total_count,
            summary.buckets,
            coalesce(summary.biome_count, 0) AS biome_count,
            coalesce(summary.form_count, 0)  AS form_count
       FROM matched m
       -- One lateral, three aggregates, bounded by the page. unnest fans each spawn row
       -- out per biome token, which is only safe because every aggregate here is DISTINCT.
       LEFT JOIN LATERAL (
         SELECT array_agg(DISTINCT s.bucket ORDER BY s.bucket)
                  FILTER (WHERE s.bucket IS NOT NULL) AS buckets,
                count(DISTINCT b.token)               AS biome_count,
                count(DISTINCT s.aspects)             AS form_count
           FROM pokemon_spawns s
           LEFT JOIN LATERAL unnest(s.biomes) AS b(token) ON TRUE
          WHERE s.pokemon_id = m.id
       ) summary ON TRUE
      ORDER BY ${rankOrderByAlias(rank, 'm.')}m.display_name, m.id`;

  return { text, params, countText: `SELECT count(*)::int AS total FROM pokemon p ${c.where()}`, countParams: c.params };
}

export const POKEMON_DETAIL_SQL = `SELECT p.id, p.species_slug, p.display_name, p.national_dex_id,
            p.image_url,
            coalesce(spawns.rows, '[]'::json) AS spawns
       FROM pokemon p
       LEFT JOIN LATERAL (
         SELECT json_agg(
                  json_build_object(
                    'bucket',     s.bucket,
                    'weight',     s.weight::float8,
                    'levelMin',   s.level_min,
                    'levelMax',   s.level_max,
                    'context',    s.context,
                    'biomes',     s.biomes,
                    'conditions', s.conditions,
                    'aspects',    s.aspects,
                    'formLabel',  s.form_label
                  )
                  -- Base form first, then each form's rows adjacent, so the detail page can
                  -- group by walking the array once. Magikarp has 32 rows, Unown 28.
                  ORDER BY (s.aspects <> '{}'::jsonb), coalesce(s.form_label, ''),
                           s.aspects::text, s.raw_row_index
                ) AS rows
           FROM pokemon_spawns s
          WHERE s.pokemon_id = p.id
       ) spawns ON TRUE
      WHERE p.species_slug = $1`;

const toCard = (row) => ({
  id: row.id,
  slug: row.species_slug,
  displayName: row.display_name,
  // The card renders thumbUrl; imageUrl rides along at 995 B per 24-row page (19.5%)
  // and is kept deliberately. Dropping it means a second row-shaping function for the
  // sake of one path, which is the duplication this helper exists to avoid. Measured
  // 2026-09-23 against the running API.
  imageUrl: row.image_url,
  thumbUrl: row.thumb_url,
  spawnSummary: {
    buckets: row.buckets ?? [],
    biomeCount: Number(row.biome_count),
    formCount: Number(row.form_count),
  },
});

export async function listPokemon(options) {
  const { text, params, countText, countParams } = listPokemonSql(options);
  const rows = await all(text, params);

  // A page past the end has no rows and therefore no window value, but the total is still
  // a real number the UI needs to render pagination.
  const total = rows.length
    ? Number(rows[0].total_count)
    : Number((await one(countText, countParams)).total);

  return { data: rows.map(toCard), total };
}

export async function findPokemonBySlug(slug) {
  const row = await one(POKEMON_DETAIL_SQL, [slug]);
  if (!row) return null;

  return {
    id: row.id,
    slug: row.species_slug,
    displayName: row.display_name,
    nationalDexId: row.national_dex_id,
    imageUrl: row.image_url,
    spawns: row.spawns,
  };
}
