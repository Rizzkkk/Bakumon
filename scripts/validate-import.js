import fs from 'node:fs/promises';
import path from 'node:path';
import { loadWorkbook, parseSelector, expandSpawnRow, toCategory, ROOT } from './lib/workbook.js';
import { withClient } from './lib/db.js';

// Assertions are against real values, not types. A check that the row count is a number
// stays green while the query returns zero forever.
const results = [];
let failed = 0;

function check(name, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failed++;
  results.push({ name, ok, actual, expected });
  const label = ok ? '[pass]' : '[FAIL]';
  console.log(`${label} ${name}`);
  if (!ok) console.log(`        expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}

const wb = await loadWorkbook();
const expectedSpawns = wb.pokemonRows.flatMap(expandSpawnRow);
const expectedSpecies = new Set(wb.pokemonRows.map((r) => parseSelector(r.selector).species));
const expectedCategories = {};
for (const row of wb.itemRows) {
  const c = toCategory(row.wikiCategory);
  expectedCategories[c] = (expectedCategories[c] ?? 0) + 1;
}

await withClient(async (client) => {
  const one = async (sql, params = []) => (await client.query(sql, params)).rows[0];
  const all = async (sql, params = []) => (await client.query(sql, params)).rows;

  check('pokemon row count matches the workbook species count',
    Number((await one('SELECT count(*) FROM pokemon')).count), expectedSpecies.size);

  check('pokemon_spawns row count matches the expanded workbook rows',
    Number((await one('SELECT count(*) FROM pokemon_spawns')).count), expectedSpawns.length);

  // These four appear only as form rows. A species list built from plain rows alone
  // loses them silently, which is exactly the bug this asserts against.
  const formOnly = await all(
    `SELECT species_slug FROM pokemon
     WHERE species_slug = ANY($1) ORDER BY species_slug`,
    [['basculin', 'dudunsparce', 'sinistcha', 'unown']],
  );
  check('species that exist only as form rows were still imported',
    formOnly.map((r) => r.species_slug), ['basculin', 'dudunsparce', 'sinistcha', 'unown']);

  // Arbok has seven snake_pattern forms. Keyed on the selector rather than the species
  // this would be seven Pokemon; keyed correctly it is one with seven spawn rows.
  const arbok = await one(
    `SELECT p.display_name,
            (SELECT count(*) FROM pokemon_spawns s WHERE s.pokemon_id = p.id) AS spawns,
            (SELECT count(DISTINCT s.aspects->>'snake_pattern')
               FROM pokemon_spawns s WHERE s.pokemon_id = p.id) AS patterns
       FROM pokemon p WHERE p.species_slug = 'arbok'`);
  check('arbok is one pokemon carrying its form aspects, not seven pokemon',
    { name: arbok.display_name, patterns: Number(arbok.patterns) },
    { name: 'Arbok', patterns: 7 });

  const abra = await all(
    `SELECT bucket, weight::float, level_min, level_max, context
       FROM pokemon_spawns s JOIN pokemon p ON p.id = s.pokemon_id
      WHERE p.species_slug = 'abra' ORDER BY weight`);
  check('abra imported its three buckets with the right weights and levels',
    abra.map((r) => [r.bucket, r.weight, r.level_min, r.level_max, r.context]),
    [['common', 1.8, 6, 31, 'grounded'],
      ['uncommon', 7.5, 6, 31, 'grounded'],
      ['rare', 8.4, 6, 31, 'grounded']]);

  // Spawn Entries declares 1; the weight column carries two. Trusting the declared count
  // would drop the second entry entirely.
  const aerodactyl = await all(
    `SELECT weight::float FROM pokemon_spawns s JOIN pokemon p ON p.id = s.pokemon_id
      WHERE p.species_slug = 'aerodactyl' ORDER BY weight DESC`);
  check('aerodactyl kept both weights despite declaring one spawn entry',
    aerodactyl.map((r) => r.weight), [10, 0.1]);

  check('all five spawn buckets are present',
    (await all('SELECT DISTINCT bucket FROM pokemon_spawns WHERE bucket IS NOT NULL ORDER BY bucket'))
      .map((r) => r.bucket),
    ['common', 'legendary event', 'rare', 'ultra-rare', 'uncommon']);

  check('all six spawn contexts are present',
    (await all('SELECT DISTINCT context FROM pokemon_spawns WHERE context IS NOT NULL ORDER BY context'))
      .map((r) => r.context),
    ['fishing', 'grounded', 'random player', 'seafloor', 'submerged', 'surface']);

  // The workbook is named "No Legendary" but carries six event spawns, and their
  // conditions text contains a semicolon that a naive re-split would have shredded.
  const event = await one(
    `SELECT count(*) AS n, min(conditions) AS conditions
       FROM pokemon_spawns WHERE bucket = 'legendary event'`);
  check('the six legendary event spawns survived with their conditions text intact',
    { n: Number(event.n), hasSemicolon: event.conditions.includes(';') },
    { n: 6, hasSemicolon: true });

  // Those six rows carry an em dash in the Weight column, and Number('—') is NaN.
  // Postgres accepts NaN into a NUMERIC and pg serialises it back as the string "NaN", so
  // the API served {"weight":"NaN"} and the spawn table printed it. A missing weight is
  // null. Asserted rather than trusted because nothing else in the suite looks at the
  // difference between null and NaN, and both survive a row count.
  check('no weight was stored as NaN - a missing weight is null',
    Number((await one(`SELECT count(*) FROM pokemon_spawns WHERE weight = 'NaN'::numeric`)).count),
    0);

  check('the six event rows record no weight at all',
    Number((await one(
      `SELECT count(*) FROM pokemon_spawns WHERE bucket = 'legendary event' AND weight IS NULL`)).count),
    6);

  check('no spawn row lost its parent pokemon',
    Number((await one(
      'SELECT count(*) FROM pokemon_spawns s LEFT JOIN pokemon p ON p.id = s.pokemon_id WHERE p.id IS NULL')).count),
    0);

  check('no prose note row was imported as a pokemon',
    Number((await one(
      "SELECT count(*) FROM pokemon WHERE species_slug ~ '[A-Z. ]'")).count), 0);

  check('item row count matches the workbook plus the two backfilled held items',
    Number((await one('SELECT count(*) FROM items')).count), wb.itemRows.length + 2);

  const categories = Object.fromEntries(
    (await all(`SELECT category, count(*)::int FROM items
                 WHERE wiki_category NOT LIKE 'backfilled%' GROUP BY category ORDER BY category`))
      .map((r) => [r.category, r.count]));
  check('canonical item categories reconcile to the workbook totals',
    categories,
    Object.fromEntries(Object.entries(expectedCategories).sort()));

  check('canonical categories sum to the workbook item count',
    Object.values(categories).reduce((a, b) => a + b, 0), wb.itemRows.length);

  // berry, fossil and pokeball are not canonical categories - they live on the source
  // axis. Asserting they resolve there stops the two axes being collapsed back into one.
  const sourceAxis = Object.fromEntries(
    (await all(`SELECT source_category, count(*)::int FROM items
                 WHERE source_category IN ('berries-berry-items','fossils','poke-balls-catching')
                 GROUP BY source_category ORDER BY source_category`))
      .map((r) => [r.source_category, r.count]));
  check('berries, fossils and poke balls resolve on the source-category axis',
    sourceAxis,
    { 'berries-berry-items': 84, fossils: 16, 'poke-balls-catching': 99 });

  const masterIds = new Set(wb.itemRows.map((r) => r.itemId));
  const subsetIds = new Set(Object.values(wb.subsets).flat().map((r) => r.itemId));
  const dbIds = new Set((await all('SELECT item_id FROM items')).map((r) => r.item_id));
  check('every item ID on every subset sheet resolves in the database',
    [...subsetIds].filter((id) => !dbIds.has(id)), []);
  check('the two IDs missing from Item Wiki were backfilled',
    [...subsetIds].filter((id) => !masterIds.has(id)).sort(),
    ['minecraft:bone', 'minecraft:snowball']);

  check('evolution_use_count holds counts above one, so it was not coerced to a boolean',
    Number((await one('SELECT count(*) FROM items WHERE evolution_use_count > 1')).count) > 0,
    true);

  check('biome tokens were extracted',
    Number((await one('SELECT count(*) FROM biome_tokens')).count),
    new Set(expectedSpawns.flatMap((s) => s.biomes)).size);

  // Most spawns reference a tag, not a concrete biome. If this flips, a biome filter
  // built on concrete names would appear to work while missing most of the dex.
  check('biome tags outnumber concrete biomes, as the filter design assumes',
    (await one(`SELECT (SELECT count(*) FROM biome_tokens WHERE is_tag) >
                       (SELECT count(*) FROM biome_tokens WHERE NOT is_tag) AS v`)).v,
    true);

  check('search vectors were populated by trigger',
    Number((await one(
      'SELECT count(*) FROM pokemon WHERE search_vector IS NULL')).count), 0);

  // Migration 0002 created a login role with SELECT and nothing else. The negative check
  // is the one that carries the decision: asserting only that it can read stays green
  // against a role that is a superuser, which is exactly the state 0002 exists to leave.
  check('the api role can read pokemon',
    (await one(`SELECT has_table_privilege('bakumon_api','pokemon','SELECT') AS v`)).v, true);

  check('the api role cannot write to pokemon',
    (await one(`SELECT has_table_privilege('bakumon_api','pokemon','INSERT') AS v`)).v, false);

  // The deploy ledger is not the API's business, which is why 0002 grants table by table
  // rather than ON ALL TABLES.
  check('the api role cannot read the migration ledger',
    (await one(`SELECT has_table_privilege('bakumon_api','schema_migrations','SELECT') AS v`)).v,
    false);

  // Migration 0003 added image_source/image_variant. Probing the column (rather than just
  // trusting the migration ledger) is what proves it actually ran against this database.
  check('pokemon.image_source column exists',
    (await one(`SELECT EXISTS (
       SELECT 1 FROM information_schema.columns
        WHERE table_name = 'pokemon' AND column_name = 'image_source') AS v`)).v,
    true);

  check('every pokemon row has an image_source',
    Number((await one('SELECT count(*) FROM pokemon WHERE image_source IS NULL')).count), 0);

  // 66 of 904 species have a wiki (model) render - measured 2026-09-24 against
  // wiki.cobblemon.com/api.php?action=query&list=allimages, confirmed against the live
  // database after `npm run mine pokemon` (see ground-truth/02-assets/sourcing.md).
  check('the wiki-sourced pokemon count matches the measured coverage',
    Number((await one(`SELECT count(*) FROM pokemon WHERE image_source = 'wiki'`)).count), 66);

  check('image_variant is set only where the source is wiki',
    Number((await one(
      `SELECT count(*) FROM pokemon WHERE image_variant IS NOT NULL AND image_source != 'wiki'`)).count),
    0);

  // Bulbasaur is the one species with a plain `<Species>_(model).png` - every other wiki
  // render is a regional form or costume and carries a variant label.
  check('exactly one wiki pokemon has no variant label (Bulbasaur, the only plain portrait)',
    (await all(
      `SELECT species_slug FROM pokemon WHERE image_source = 'wiki' AND image_variant IS NULL`))
      .map((r) => r.species_slug),
    ['bulbasaur']);

  const report = [
    '# Import validation',
    '',
    `Generated by \`npm run validate\` (\`scripts/validate-import.js\`) on ${new Date().toISOString().slice(0, 10)}.`,
    '**Do not hand-edit.**',
    '',
    `${results.length - failed} of ${results.length} checks passed.`,
    '',
    '| Check | Result | Expected |',
    '|---|---|---|',
    ...results.map((r) => `| ${r.name} | ${r.ok ? 'pass' : 'FAIL'} | \`${JSON.stringify(r.expected)}\` |`),
  ].join('\n');
  await fs.writeFile(path.join(ROOT, 'ground-truth/reports/import-validation.md'), `${report}\n`, 'utf8');
});

console.log(`\n${results.length - failed} of ${results.length} checks passed.`);
if (failed) {
  console.error(`${failed} check(s) failed - the import does not match the audited workbook.`);
  process.exit(1);
}
