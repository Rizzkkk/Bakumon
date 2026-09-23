import { groupSpawns } from '../apps/web/src/lib/groupSpawns.js';
import { splitPlaceholders, hasPlaceholder } from '../apps/web/src/lib/placeholderName.js';
import { SOURCE_CATEGORIES, levelRange, EMPTY } from '../apps/web/src/lib/labels.js';

// The frontend's pure logic, run against the real API rather than against fixtures. The
// pieces checked here are the ones where a plausible-looking change silently breaks a
// recorded decision: groupSpawns must preserve the base-form-first ordering the API pays a
// CTE to produce (ADR 0003), the placeholder split must not rewrite a workbook name
// (ADR 0004), and labels.js hardcodes the 13 source-category slugs that no endpoint
// publishes, so drift against the database has to be caught here or nowhere.
const BASE = (process.env.API_URL ?? 'http://localhost:3001').replace(/\/$/, '');
const api = async (p) => (await fetch(BASE + p)).json();
let fails = 0;
const check = (name, actual, expected) => {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) fails++;
  console.log(`${ok ? '[pass]' : '[FAIL]'} ${name}`);
  if (!ok) console.log(`        expected ${JSON.stringify(expected)}\n        got      ${JSON.stringify(actual)}`);
};

// ADR 0003: the UI groups by walking the flat array once, preserving base-form-first.
// rows are the expanded spawn rows the API returns; forms are the distinct aspect sets,
// which is what ground-truth quotes as "magikarp 32, unown 28". Both measured against the
// database on 2026-09-23.
for (const [slug, rows, forms] of [['magikarp', 46, 32], ['unown', 84, 28], ['arbok', 8, 8]]) {
  const p = await api('/api/pokemon/' + slug);
  check(`${slug}: the API returns the expanded spawn rows`, p.spawns.length, rows);
  const { groups, events } = groupSpawns(p.spawns);
  const total = groups.reduce((n, g) => n + g.rows.length, 0) + events.length;
  check(`${slug}: grouping conserves every row, dropping none`, total, p.spawns.length);
  check(`${slug}: one group per distinct form`, groups.length + events.length, forms);
  const keys = groups.map((g) => g.key);
  check(`${slug}: no form group appears twice, so adjacency held`, keys.length, new Set(keys).size);
}

const arbok = await api('/api/pokemon/arbok');
const ag = groupSpawns(arbok.spawns);
check('arbok leads with the base form', ag.groups[0].label, 'Base form');
check('arbok has one base group plus seven snake patterns', ag.groups.length, 8);

// server-notes.md: the six legendary-event rows must not sit in a natural spawn table.
const hooh = await api('/api/pokemon/ho-oh');
const hg = groupSpawns(hooh.spawns);
check('ho-oh event rows are partitioned out of the natural tables',
  { natural: hg.groups.length, events: hg.events.length }, { natural: 0, events: 1 });

// The four placeholder items render a token, and an ordinary item does not.
const puff = await api('/api/items/cobblemon:poke_puff');
check('the API still serves the raw workbook name', puff.name, '%s Poke Puff');
check('the name splits into a token plus literal text',
  splitPlaceholders(puff.name), [{ token: '%s' }, { text: ' Poke Puff' }]);
check('an ordinary item has no placeholder', hasPlaceholder((await api('/api/items/cobblemon:ability_capsule')).name), false);

// labels.js hardcodes the 13 source slugs; drift against the database must be caught.
const live = [];
for (const c of SOURCE_CATEGORIES) {
  const r = await api('/api/items?sourceCategory=' + encodeURIComponent(c.slug) + '&pageSize=1');
  live.push([c.slug, r.total]);
}
check('all 13 chip slugs match a non-empty source category',
  live.filter(([, n]) => n === 0), []);
check('the 13 chips cover every listable item',
  live.reduce((n, [, t]) => n + t, 0), 933);

// null bucket/level must render as an em dash, never 'null' or NaN.
check('a null level range renders as an em dash', levelRange(null, null), EMPTY);
check('an equal min and max renders as one number', levelRange(6, 6), '6');
check('a real range renders as a range', levelRange(6, 31), '6-31');

console.log(fails ? `\n${fails} FAILED` : '\nAll frontend-logic checks passed.');
process.exit(fails ? 1 : 0);
