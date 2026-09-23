import { all, one } from '../db/pool.js';
import { conditions } from '../lib/sql.js';
import { searchOn, rankFor, rankOrder } from '../lib/search.js';

// Workbook wins, wiki fills the gap, and descriptionSource says which - wiki text is
// CC BY 4.0 and has to be credited at the point of use (02-assets/attribution.md).
// nullif(btrim(...)) rather than a bare coalesce, so an all-whitespace workbook cell does
// not beat real wiki text. When both are empty both fields are null: 516 of 934 items are
// in that state, and labelling an empty string 'workbook' would be a false credit.
const DESCRIPTION_SQL = `
       coalesce(nullif(btrim(i.description), ''), nullif(btrim(i.wiki_description), ''))
         AS description,
       CASE WHEN nullif(btrim(i.description), '')      IS NOT NULL THEN 'workbook'
            WHEN nullif(btrim(i.wiki_description), '') IS NOT NULL THEN 'wiki'
       END AS description_source`;

// Matches a printf format string in a display name. Exactly one row matches today -
// cobblemon:aprijuice.quality_format, named '%1$s %2$s'. Deliberately a pattern rather
// than a denylist of the seven localisation IDs, which a re-export would invalidate in
// silence; see 01-data/known-gaps.md.
const PRINTF_NAME_PATTERN = '%[0-9]+[$][sdf]';

function itemConditions({ search, category, sourceCategory }) {
  const c = conditions();

  const matchedSearch = search ? searchOn(c, { vector: 'i.search_vector', name: 'i.name' }, search) : null;

  // Applied to every listing, not just search. A name that is a printf template is not an
  // item a player can look up, and browsing sorted it to the very top of page one.
  // GET /api/items/:itemId still resolves it - see 01-data/known-gaps.md.
  c.add((pattern) => `i.name !~ ${pattern}`, PRINTF_NAME_PATTERN);

  if (category) c.add((value) => `i.category = ${value}`, category);
  if (sourceCategory) c.add((value) => `i.source_category = ${value}`, sourceCategory);

  return { c, search: matchedSearch };
}

// Returns the statement rather than running it, so scripts/explain-api.js plans exactly
// the query the API issues instead of a second copy that can drift away from it.
export function listItemsSql({ search, category, sourceCategory, limit, offset }) {
  const { c, search: matched } = itemConditions({ search, category, sourceCategory });
  const { rank, rankParams } = rankFor(matched, c);
  // countText is run with c.params alone, so anything bound only for the ORDER BY has to
  // sit after them - see the note in lib/search.js.
  const params = [...c.params, ...rankParams, limit, offset];
  const limitAt = `$${params.length - 1}`;
  const offsetAt = `$${params.length}`;

  const text = `SELECT i.id, i.item_id, i.name, i.category, i.source_category,
            ${DESCRIPTION_SQL},
            i.evolution_use_count,
            i.image_url,
            count(*) OVER () AS total_count
       FROM items i
      ${c.where()}
      ORDER BY ${rankOrder(rank)}i.name, i.item_id
      LIMIT ${limitAt} OFFSET ${offsetAt}`;

  return { text, params, countText: `SELECT count(*)::int AS total FROM items i ${c.where()}`, countParams: c.params };
}

// The printf-name exclusion is deliberately absent here. It applies to every listing -
// browse and search alike, see itemConditions - so the one row it catches is unreachable by
// browsing while a direct link to it still resolves. 934 rows exist, 933 are listable, all
// 934 are addressable: 04-api/contract.md.
export const ITEM_DETAIL_SQL = `SELECT i.id, i.item_id, i.name, i.category, i.source_category,
            ${DESCRIPTION_SQL},
            i.evolution_use_count, i.evolution_uses, i.image_url
       FROM items i
      WHERE i.item_id = $1`;

// description, descriptionSource and category are read only by the detail page, but this
// helper shapes both a list row and a detail row. Measured 2026-09-23 against the running
// API: description + descriptionSource cost 1,705 B on a 24-row page 1 (27.5%) and 2,350 B
// on a berries page (35%), against ~33 KB of item art on the same screen; category costs
// 485 B. Splitting this into list and detail variants to save that is a second copy of the
// same mapping, so all three stay. Re-measure before reopening it.
const toCard = (row) => ({
  id: row.id,
  itemId: row.item_id,
  name: row.name,
  category: row.category,
  sourceCategory: row.source_category,
  description: row.description,
  descriptionSource: row.description_source ?? null,
  // The items index has an "Evolution uses" column, so the count is a list field. The free
  // text beside it is not: evolution_uses runs to a sentence per item and is only ever read
  // on the detail page, which is why findItemById adds it rather than this mapper.
  evolutionUseCount: row.evolution_use_count ?? 0,
  imageUrl: row.image_url,
});

export async function listItems(options) {
  const { text, params, countText, countParams } = listItemsSql(options);
  const rows = await all(text, params);

  const total = rows.length
    ? Number(rows[0].total_count)
    : Number((await one(countText, countParams)).total);

  return { data: rows.map(toCard), total };
}

export async function findItemById(itemId) {
  const row = await one(ITEM_DETAIL_SQL, [itemId]);
  if (!row) return null;

  return {
    ...toCard(row),
    evolutionUses: row.evolution_uses,
  };
}
