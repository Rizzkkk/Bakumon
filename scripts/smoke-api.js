import fs from 'node:fs/promises';
import path from 'node:path';
import { ROOT } from './lib/paths.js';

// HTTP only, no pg import: the same script validates localhost and the deployed VPS.
const BASE = (process.env.API_URL ?? 'http://localhost:3001').replace(/\/$/, '');

// Assertions are against real values, not types. A check that the total is a number stays
// green while the query returns zero forever. Every expected value here comes from
// ground-truth/reports/workbook-audit.md or was measured against the imported data.
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

async function get(pathname, options = {}) {
  const response = await fetch(`${BASE}${pathname}`, options);
  const text = await response.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  return { status: response.status, headers: response.headers, body };
}

const slugs = (body) => body.data.map((row) => row.slug);

async function runChecks() {
  const health = await get('/api/health');
  check('health leaks no configuration beyond its status', Object.keys(health.body), ['status']);
  check('health reports ok against a reachable database', health.body.status, 'ok');

  const list = await get('/api/pokemon');
  check('pokemon total is the species count, duplicates included (ADR 0006)', list.body.total, 904);
  check('pokemon list defaults to page 1, pageSize 24, and fills the page',
    { page: list.body.page, pageSize: list.body.pageSize, rows: list.body.data.length },
    { page: 1, pageSize: 24, rows: 24 });

  // 904 = 37 full pages of 24, then 16.
  const lastPage = await get('/api/pokemon?page=38');
  check('the last pokemon page is partial, not padded or truncated',
    { rows: lastPage.body.data.length, total: lastPage.body.total }, { rows: 16, total: 904 });

  const pastEnd = await get('/api/pokemon?page=999');
  check('a page past the end returns no rows but still a truthful total',
    { rows: pastEnd.body.data.length, total: pastEnd.body.total }, { rows: 0, total: 904 });

  // The pokemon half of the browse-ordering guard. No search term, so ADR 0006's
  // display_name, id must be the whole sort key, with no rank tier above it.
  check('pokemon browse ordering is unchanged by relevance ranking',
    list.body.data.slice(0, 3).map((row) => row.slug), ['abomasnow', 'abra', 'absol']);

  const abraSearch = await get('/api/pokemon?search=abra');
  check('a four-character search uses the vector alone, without substring noise',
    slugs(abraSearch.body), ['abra']);

  // Alphabetically Blitzle, Flittle, Gigalith, Growlithe all precede Litleo. The prefix
  // tier is what a player typing a species name is actually asking for, and this asserts
  // the full nine-row order so a rank key that collapsed to a constant would be caught.
  const litSearch = await get('/api/pokemon?search=lit&pageSize=100');
  check('relevance ranking on pokemon promotes prefix matches without dropping rows',
    { total: litSearch.body.total, slugs: slugs(litSearch.body) },
    { total: 9,
      slugs: ['litleo', 'litten', 'litwick', 'blitzle', 'flittle', 'gigalith', 'growlithe',
        'politoed', 'vanillite'] });

  const shortSearch = await get('/api/pokemon?search=ab&pageSize=100');
  check('a two-character search falls back to substring matching',
    ['abomasnow', 'abra'].every((slug) => slugs(shortSearch.body).includes(slug)), true);

  // Regression guard: an unescaped % in the ILIKE branch matched all 904 rows.
  const wildcardSearch = await get('/api/pokemon?search=%25');
  check('a bare % is escaped rather than matching every row', wildcardSearch.body.total, 0);

  const abraCard = shortSearch.body.data.find((row) => row.slug === 'abra');
  check('the abra card carries a computed spawn summary, not a stub',
    abraCard.spawnSummary, { buckets: ['common', 'rare', 'uncommon'], biomeCount: 4, formCount: 1 });

  const abra = await get('/api/pokemon/abra');
  check('abra resolves with its identity fields intact',
    { slug: abra.body.slug, displayName: abra.body.displayName, nationalDexId: abra.body.nationalDexId },
    { slug: 'abra', displayName: 'Abra', nationalDexId: 63 });

  // The detail response carried thumbUrl that nothing read - PokemonDetail renders the
  // full-size imageUrl. Asserting the exact key list rather than that thumbUrl is undefined,
  // because a typo in the mapping also produces undefined and would pass.
  check('the detail response ships exactly the fields the contract lists',
    Object.keys(abra.body).sort(),
    ['displayName', 'id', 'imageUrl', 'nationalDexId', 'slug', 'spawns']);

  check('abra has three spawns with the right buckets, weights and levels',
    abra.body.spawns
      .slice()
      .sort((a, b) => a.weight - b.weight)
      .map((s) => [s.bucket, s.weight, s.levelMin, s.levelMax, s.context]),
    [['common', 1.8, 6, 31, 'grounded'],
      ['uncommon', 7.5, 6, 31, 'grounded'],
      ['rare', 8.4, 6, 31, 'grounded']]);

  // Spawn Entries declares 1; the weight column carries two. NUMERIC must also arrive as a
  // number rather than the string pg returns by default.
  const aerodactyl = await get('/api/pokemon/aerodactyl');
  check('aerodactyl kept both weights, and NUMERIC came back as numbers',
    aerodactyl.body.spawns.map((s) => s.weight).sort((a, b) => b - a), [10, 0.1]);

  const arbok = await get('/api/pokemon/arbok');
  check('arbok reaches the API as one pokemon carrying its form aspects, not seven',
    {
      rows: arbok.body.spawns.length,
      patterns: new Set(arbok.body.spawns.map((s) => s.aspects.snake_pattern).filter(Boolean)).size,
    },
    { rows: 8, patterns: 7 });

  check('arbok detail spawns lead with the base form',
    arbok.body.spawns[0].aspects, {});

  const missingPokemon = await get('/api/pokemon/notapokemon');
  check('a missing pokemon returns the 404 body the contract specifies',
    { status: missingPokemon.status, body: missingPokemon.body },
    { status: 404, body: { error: 'Pokemon not found' } });

  const bucketTotals = {};
  for (const bucket of ['common', 'legendary event', 'rare', 'ultra-rare', 'uncommon']) {
    const response = await get(`/api/pokemon?bucket=${encodeURIComponent(bucket)}`);
    bucketTotals[bucket] = response.body.total > 0;
  }
  check('every one of the five buckets filters to a non-empty result',
    bucketTotals,
    { common: true, 'legendary event': true, rare: true, 'ultra-rare': true, uncommon: true });

  const commonOnly = await get('/api/pokemon?bucket=common&pageSize=100');
  check('a bucket filter actually constrains the rows it returns',
    commonOnly.body.data.every((row) => row.spawnSummary.buckets.includes('common')), true);

  const badBucket = await get('/api/pokemon?bucket=mythic');
  check('an unknown bucket is rejected rather than silently returning nothing',
    { status: badBucket.status, body: badBucket.body },
    { status: 400, body: { error: 'Unknown bucket: mythic' } });

  const badBiome = await get('/api/pokemon?biome=minecraft:not_a_biome');
  check('an unknown biome token is rejected against the published closed list',
    { status: badBiome.status, body: badBiome.body },
    { status: 400, body: { error: 'Unknown biome: minecraft:not_a_biome' } });

  const biomes = await get('/api/biomes');
  check('the biome list is the closed set the filter is built from',
    {
      tokens: biomes.body.data.length,
      tags: biomes.body.data.filter((b) => b.isTag).length,
      concrete: biomes.body.data.filter((b) => !b.isTag).length,
      references: biomes.body.data.reduce((sum, b) => sum + b.spawnCount, 0),
    },
    { tokens: 112, tags: 68, concrete: 44, references: 16982 });

  // Cache-Control is public here, so a cache keying on URL alone would serve one origin's
  // response to another. Vary must be present even when the origin was rejected.
  // Without these an edge layer forwards every list and detail request to the one Node
  // process and the one Postgres, which is the whole of a single-VPS traffic defence.
  const cacheHeaders = {};
  for (const path of ['/api/pokemon', '/api/items', '/api/pokemon/abra', '/api/items/cobblemon:ability_capsule']) {
    cacheHeaders[path] = (await get(path)).headers.get('cache-control');
  }
  check('list and detail responses are cacheable by an edge layer',
    cacheHeaders,
    { '/api/pokemon': 'public, max-age=60',
      '/api/items': 'public, max-age=60',
      '/api/pokemon/abra': 'public, max-age=60',
      '/api/items/cobblemon:ability_capsule': 'public, max-age=60' });

  check('the biome vocabulary is cached for an hour, not a minute',
    biomes.headers.get('cache-control'), 'public, max-age=3600');

  check('the cacheable biomes response varies on Origin',
    biomes.headers.get('vary')?.toLowerCase().includes('origin'), true);

  const items = await get('/api/items');
  check('item total is the listable rows: 934 imported, less the printf-named row',
    items.body.total, 933);

  check('the items browse page does not lead with a printf format string',
    items.body.data.filter((row) => row.itemId === 'cobblemon:aprijuice.quality_format'), []);

  // The regression guard for relevance ranking: browse has no search term, so it must sort
  // by name alone exactly as it did before ranking existed. If a rank tier ever leaks into
  // the no-search path, this is the check that says so.
  check('browse ordering is unchanged by relevance ranking',
    items.body.data.slice(0, 3).map((row) => row.itemId),
    ['cobblemon:poke_puff', 'cobblemon:ability_capsule', 'cobblemon:ability_patch']);

  // Four real items carry a %s the game substitutes at runtime. They are not the excluded
  // localisation row and must stay listable, with the workbook string served verbatim -
  // rendering it is the item card's job, not the API's. ADR 0004, 01-data/known-gaps.md.
  check('the API serves a placeholder item name exactly as the workbook records it',
    items.body.data.find((row) => row.itemId === 'cobblemon:poke_puff')?.name, '%s Poke Puff');

  // Separate from the check above because this one is collation-dependent: '%' sorts before
  // every letter under the en_US.utf8 the dev container and the VPS both use, but a box
  // built with a different collation would place this row under S and fail here with
  // nothing actually wrong. Read the name before assuming a defect.
  check('and it leads page one, where the excluded row used to sort',
    items.body.data[0].name, '%s Poke Puff');

  const sourceAxis = {};
  for (const source of ['berries-berry-items', 'fossils', 'poke-balls-catching']) {
    sourceAxis[source] = (await get(`/api/items?sourceCategory=${source}`)).body.total;
  }
  check('berries, fossils and poke balls filter on the source axis (ADR 0002)',
    sourceAxis, { 'berries-berry-items': 84, fossils: 16, 'poke-balls-catching': 99 });

  const canonicalAxis = {};
  for (const category of ['consumable', 'evolution', 'held', 'other']) {
    canonicalAxis[category] = (await get(`/api/items?category=${category}`)).body.total;
  }
  // consumable is 217 in the database; the printf row is one of them.
  check('the four canonical categories reconcile to the listable item total',
    canonicalAxis, { consumable: 216, evolution: 74, held: 45, other: 598 });

  check('the canonical categories sum to 933',
    Object.values(canonicalAxis).reduce((a, b) => a + b, 0), 933);

  const berryAsCategory = await get('/api/items?category=berry');
  check('berry is rejected on the canonical axis, where it does not live',
    { status: berryAsCategory.status, body: berryAsCategory.body },
    { status: 400, body: { error: 'Unknown category: berry' } });

  // 'over' is an English stopword, so plainto_tsquery returns an empty query matching
  // nothing. Without the substring fallback the search box answered 0 for Clover Sweet,
  // Cover Fossil and 121 others.
  const stopword = await get('/api/items?search=over&pageSize=100');
  check('a stopword search falls back to substring instead of returning nothing',
    stopword.body.total, 123);

  // Alphabetically Hyper Potion and Max Potion precede Potion, so the exact tier visibly
  // reorders the page. Asserting the whole order, not just the first row, because a rank
  // key that collapsed to a constant would still put something plausible in front.
  const potion = await get('/api/items?search=potion');
  check('an exact name match outranks alphabetical order',
    potion.body.data.map((row) => row.name),
    ['Potion', 'Hyper Potion', 'Max Potion', 'Super Potion']);

  // Nothing is named exactly 'poke', so this exercises the prefix tier on its own: Poke
  // Cake beats the 'Deluxe %s Poke Puff' family that alphabetically preceded it.
  const pokePrefix = await get('/api/items?search=poke');
  check('a prefix match outranks a mid-string match', pokePrefix.body.data[0].name, 'Poke Cake');

  // Ranking reorders a result set; it must never filter one. Both totals are the values the
  // pre-ranking suite already asserted, restated here under a name that says why.
  check('ranking changes the order of results, never the count',
    { over: stopword.body.total, poke: pokePrefix.body.total, potion: potion.body.total },
    { over: 123, poke: 127, potion: 4 });

  // The count fallback is only reached when a page has no rows, so it is the one path a
  // browse-only test never touches. Ranking first shipped with the prefix pattern bound
  // into the shared parameter list, which left the count query one parameter wider than its
  // own WHERE clause: every searched page past the end 500'd. Both halves are asserted
  // because a total of 0 here would look like a pass.
  const searchPastEnd = await get('/api/items?search=potion&page=99');
  check('a searched page past the end still returns a truthful total, not a 500',
    { status: searchPastEnd.status, rows: searchPastEnd.body.data.length, total: searchPastEnd.body.total },
    { status: 200, rows: 0, total: 4 });

  const pokemonSearchPastEnd = await get('/api/pokemon?search=lit&page=99');
  check('and the same holds for the pokemon list',
    { status: pokemonSearchPastEnd.status, rows: pokemonSearchPastEnd.body.data.length, total: pokemonSearchPastEnd.body.total },
    { status: 200, rows: 0, total: 9 });

  // The items counterpart of the pokemon wildcard check. The prefix pattern is a second
  // place to lose the LIKE escaping, and losing it here would return all 933 rows. Four is
  // the honest answer: four item names genuinely contain a '%'.
  const itemWildcard = await get('/api/items?search=%25');
  check('a bare % is escaped in the prefix rank as well as the predicate',
    { total: itemWildcard.body.total, names: itemWildcard.body.data.map((row) => row.name) },
    { total: 4, names: ['%s Poke Puff', 'Deluxe %s Poke Puff', 'Fancy %s Poke Puff', 'Frosted %s Poke Puff'] });

  const aprijuice = await get('/api/items?search=aprijuice&pageSize=100');
  check('search hides the printf-named localisation row',
    aprijuice.body.data.filter((row) => row.itemId === 'cobblemon:aprijuice.quality_format'), []);

  const printfDetail = await get('/api/items/cobblemon:aprijuice.quality_format');
  check('but a direct link to that row still resolves',
    { status: printfDetail.status, itemId: printfDetail.body.itemId },
    { status: 200, itemId: 'cobblemon:aprijuice.quality_format' });

  const bone = await get('/api/items/minecraft:bone');
  check('an item with no description on either axis reports null, not a false credit',
    { category: bone.body.category, description: bone.body.description, descriptionSource: bone.body.descriptionSource },
    { category: 'held', description: null, descriptionSource: null });

  const workbookItem = await get('/api/items/cobblemon:ability_capsule');
  const wikiItem = await get('/api/items/cobblemon:apricorn');
  check('descriptionSource names the column the text actually came from',
    [workbookItem.body.descriptionSource, wikiItem.body.descriptionSource], ['workbook', 'wiki']);

  const missingItem = await get('/api/items/cobblemon:nope');
  check('a missing item returns the 404 body the contract specifies',
    { status: missingItem.status, body: missingItem.body },
    { status: 404, body: { error: 'Item not found' } });

  const unrouted = await get('/api/nonsense');
  check('an unrouted path under /api returns JSON, not an HTML error page',
    { status: unrouted.status, body: unrouted.body },
    { status: 404, body: { error: 'Not found' } });

  // The router throws a URIError carrying status 400 for this; it used to reach the 500
  // branch, letting a scanner mint unlimited fake server errors.
  const malformed = await get('/api/items/%');
  check('a malformed percent-escape is a client error, not a 500',
    { status: malformed.status, body: malformed.body },
    { status: 400, body: { error: 'Bad request' } });

  const typo = await get('/api/pokemon?pagesize=100');
  check('a mistyped parameter is named rather than silently ignored',
    { status: typo.status, body: typo.body },
    { status: 400, body: { error: 'Unknown query parameter: pagesize' } });

  const oversize = await get('/api/pokemon?pageSize=500');
  check('pageSize is bounded',
    { status: oversize.status, body: oversize.body },
    { status: 400, body: { error: 'pageSize must be an integer between 1 and 100' } });

  // (page - 1) * pageSize overflowed bigint and came back as a 500 from Postgres.
  const hugePage = await get('/api/pokemon?page=400000000000000000');
  check('an enormous page number is rejected rather than overflowing bigint',
    { status: hugePage.status, body: hugePage.body },
    { status: 400, body: { error: 'page must be an integer between 1 and 1000000' } });

  const hexPage = await get('/api/pokemon?page=0x10');
  check('a non-decimal page is rejected rather than silently serving page 16',
    hexPage.status, 400);

  const repeated = await get('/api/pokemon?page=1&page=2');
  check('a repeated parameter is rejected rather than coerced',
    { status: repeated.status, body: repeated.body },
    { status: 400, body: { error: 'page must be given once' } });

  const foreignOrigin = await get('/api/health', { headers: { Origin: 'https://evil.example' } });
  check('CORS fails closed for an unknown origin without erroring the request',
    { status: foreignOrigin.status, allowOrigin: foreignOrigin.headers.get('access-control-allow-origin') },
    { status: 200, allowOrigin: null });

  check('the server does not advertise what it runs',
    health.headers.get('x-powered-by'), null);

  // Last: this exhausts the reference bucket for the rest of the window.
  let limited = null;
  for (let i = 0; i < 25 && !limited; i += 1) {
    const response = await get('/api/biomes');
    if (response.status === 429) limited = response;
  }
  check('an exhausted rate limit returns JSON, not the library default HTML',
    {
      status: limited?.status,
      contentType: limited?.headers.get('content-type')?.split(';')[0],
      body: limited?.body,
    },
    { status: 429, contentType: 'application/json', body: { error: 'Too many requests' } });
}

async function writeReport() {
  const report = [
    '# API smoke test',
    '',
    `Generated by \`npm run smoke\` (\`scripts/smoke-api.js\`) on ${new Date().toISOString().slice(0, 10)}.`,
    '**Do not hand-edit.**',
    '',
    `${results.length - failed} of ${results.length} checks passed against \`${BASE}\`.`,
    '',
    'The rate-limit check runs last because it spends the reference bucket for the',
    'remainder of the window. Re-running inside the same minute needs the window to roll',
    'over, or an API restart.',
    '',
    '| Check | Result | Expected |',
    '|---|---|---|',
    ...results.map((r) => `| ${r.name} | ${r.ok ? 'pass' : 'FAIL'} | \`${JSON.stringify(r.expected)}\` |`),
  ].join('\n');
  await fs.writeFile(path.join(ROOT, 'ground-truth/reports/api-smoke.md'), `${report}\n`, 'utf8');
}

try {
  await fetch(`${BASE}/api/health`);
} catch {
  console.error(`Cannot reach ${BASE}. Start the API first: npm run api`);
  process.exit(1);
}

// The reference bucket is 20/minute and the last check deliberately exhausts it. Starting
// while it is still spent would fail the biome checks for the wrong reason.
const preflight = await get('/api/biomes');
if (preflight.status === 429) {
  console.error('The reference rate-limit bucket is still spent from a previous run.');
  console.error('Wait for the window to roll over (60s) or restart the API, then re-run.');
  process.exit(1);
}

try {
  await runChecks();
} catch (error) {
  // A throw used to abort the run: the remaining checks never ran and the report was never
  // written, so the previous green report stayed on disk looking authoritative. A harness
  // that fails silently is worse than no harness.
  failed++;
  results.push({
    name: 'the harness ran to completion without throwing',
    ok: false,
    actual: String(error),
    expected: 'no throw',
  });
  console.log('[FAIL] the harness ran to completion without throwing');
  console.log(`        ${error.stack}`);
} finally {
  await writeReport();
}

console.log(`\n${results.length - failed} of ${results.length} checks passed.`);
if (failed) {
  console.error(`${failed} check(s) failed - the API does not match the contract.`);
  process.exit(1);
}
