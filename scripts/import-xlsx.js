import {
  loadWorkbook, parseSelector, expandSpawnRow, splitDisplayName, toCategory, slugify,
} from './lib/workbook.js';
import { withClient } from './lib/db.js';

const wb = await loadWorkbook();

// Species display name: prefer the plain row's, since a form row's name carries a
// parenthetical. Four species (basculin, dudunsparce, sinistcha, unown) have no plain
// row at all, so the base name is stripped out of a form row's name instead.
const speciesNames = new Map();
for (const row of wb.pokemonRows) {
  const { species } = parseSelector(row.selector);
  const { base } = splitDisplayName(row.displayName);
  const isPlain = !row.selector.includes(' ');
  if (isPlain || !speciesNames.has(species)) speciesNames.set(species, base);
}

const spawns = wb.pokemonRows.flatMap(expandSpawnRow);

const biomes = new Map();
for (const spawn of spawns) {
  for (const token of spawn.biomes) {
    if (!biomes.has(token)) {
      biomes.set(token, {
        token,
        namespace: token.replace(/^#/, '').includes(':')
          ? token.replace(/^#/, '').split(':')[0]
          : 'unnamespaced',
        isTag: token.startsWith('#'),
        count: 0,
      });
    }
    biomes.get(token).count++;
  }
}

await withClient(async (client) => {
  await client.query('BEGIN');
  try {
    const idBySpecies = new Map();
    for (const [species, displayName] of speciesNames) {
      const { rows } = await client.query(
        `INSERT INTO pokemon (species_slug, display_name)
         VALUES ($1, $2)
         ON CONFLICT (species_slug) DO UPDATE SET display_name = EXCLUDED.display_name
         RETURNING id`,
        [species, displayName],
      );
      idBySpecies.set(species, rows[0].id);
    }

    // Spawns are wholly derived from the workbook, so replacing them is both simpler and
    // more correct than upserting - a row deleted from the sheet should disappear here.
    await client.query('DELETE FROM pokemon_spawns');
    for (const spawn of spawns) {
      await client.query(
        `INSERT INTO pokemon_spawns
           (pokemon_id, selector, aspects, form_label, bucket, weight, level_min,
            level_max, context, biomes, conditions, raw_row_index, parse_flag)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
        [
          idBySpecies.get(spawn.species),
          [spawn.species, ...Object.entries(spawn.aspects)
            .map(([k, v]) => (v === true ? k : `${k}=${v}`))].join(' '),
          JSON.stringify(spawn.aspects),
          spawn.formLabel,
          spawn.bucket,
          spawn.weight,
          spawn.levelMin,
          spawn.levelMax,
          spawn.context,
          spawn.biomes,
          spawn.conditions,
          spawn.rawRowIndex,
          spawn.parseFlag,
        ],
      );
    }

    for (const row of wb.itemRows) {
      const count = /^\d+$/.test(row.usedInEvolutions) ? Number(row.usedInEvolutions) : null;
      await client.query(
        `INSERT INTO items (item_id, name, category, source_category, wiki_category,
                            description, evolution_use_count, evolution_uses)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         ON CONFLICT (item_id) DO UPDATE SET
           name = EXCLUDED.name,
           category = EXCLUDED.category,
           source_category = EXCLUDED.source_category,
           wiki_category = EXCLUDED.wiki_category,
           description = EXCLUDED.description,
           evolution_use_count = EXCLUDED.evolution_use_count,
           evolution_uses = EXCLUDED.evolution_uses`,
        [
          row.itemId,
          row.name || row.itemId.split(':').pop().replace(/_/g, ' '),
          toCategory(row.wikiCategory),
          slugify(row.sourceCategory) || null,
          row.wikiCategory,
          row.description || null,
          count,
          row.evolutionUses || null,
        ],
      );
    }

    // The two minecraft: IDs live only on the `Held Items` sheet. Backfilling them here
    // keeps the subset-sheet reconciliation in validate-import.js honest.
    const masterIds = new Set(wb.itemRows.map((r) => r.itemId));
    for (const [sheet, rows] of Object.entries(wb.subsets)) {
      for (const row of rows) {
        if (masterIds.has(row.itemId)) continue;
        await client.query(
          `INSERT INTO items (item_id, name, category, source_category, wiki_category)
           VALUES ($1, $2, 'held', 'held-battle-items', $3)
           ON CONFLICT (item_id) DO NOTHING`,
          [row.itemId, row.name || row.itemId.split(':').pop().replace(/_/g, ' '), `backfilled from ${sheet}`],
        );
      }
    }

    await client.query('DELETE FROM biome_tokens');
    for (const b of biomes.values()) {
      await client.query(
        `INSERT INTO biome_tokens (token, namespace, is_tag, spawn_count)
         VALUES ($1,$2,$3,$4)`,
        [b.token, b.namespace, b.isTag, b.count],
      );
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }

  const counts = await client.query(`
    SELECT (SELECT count(*) FROM pokemon)        AS pokemon,
           (SELECT count(*) FROM pokemon_spawns) AS spawns,
           (SELECT count(*) FROM items)          AS items,
           (SELECT count(*) FROM biome_tokens)   AS biomes,
           (SELECT count(*) FROM pokemon_spawns WHERE parse_flag IS NOT NULL) AS flagged
  `);
  const { pokemon, spawns: s, items, biomes: b, flagged } = counts.rows[0];
  console.log('[done] import complete');
  console.log(`  pokemon      : ${pokemon}`);
  console.log(`  spawns       : ${s} (${flagged} carry a parse flag)`);
  console.log(`  items        : ${items}`);
  console.log(`  biome tokens : ${b}`);
});
