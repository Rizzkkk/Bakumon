import ExcelJS from 'exceljs';
import path from 'node:path';
import { ROOT } from './paths.js';

export const WORKBOOK_PATH = path.join(ROOT, 'Cobblemon_Full_Pokemon_Wiki_No_Legendary.xlsx');
// Re-exported because four scripts already import ROOT from here; the definition moved to
// paths.js so they stop pulling exceljs in behind it.
export { ROOT };

export const SHEETS = {
  pokemon: 'Pokemon Wiki',
  itemCategories: 'Item Categories',
  items: 'Item Wiki',
};

// The nine category sheets are filtered views of `Item Wiki`, not extra data. They exist
// so validate-import.js can prove nothing was dropped. `Held Items` is the one that
// carries rows Item Wiki lacks (minecraft:bone, minecraft:snowball).
export const SUBSET_SHEETS = [
  'Evolution Items', 'Held Items', 'Berries Wiki', 'Fossils Wiki', 'Poké Balls Wiki',
  'Consumables Wiki', 'Held Items Wiki', 'Evolution Items Wiki', 'Other Items Wiki',
];

// Explicit and auditable rather than inferred: the four canonical buckets are defined by
// the `Item Categories` sheet, and these twelve raw values collapse onto them exactly.
// Verified totals: consumable 217, held 43, evolution 74, other 598 = 932.
const CATEGORY_MAP = {
  'Consumable / Usable': 'consumable',
  'Held / Battle Items': 'held',
  'Evolution Items': 'evolution',
  'Evolution / Evolution Items': 'other',
  'Other Cobblemon Item': 'other',
  'Utility': 'other',
  'Poké Balls / Catching': 'other',
  'Materials / Crafting': 'other',
  'Fossils': 'other',
  'Food / Sweets': 'other',
  'Technical / Moves': 'other',
  'Training / Progression': 'other',
};


export function toCategory(wikiCategory) {
  const mapped = CATEGORY_MAP[(wikiCategory || '').trim()];
  if (!mapped) throw new Error(`unmapped Wiki Category: ${JSON.stringify(wikiCategory)}`);
  return mapped;
}

export function slugify(value) {
  return (value || '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '') // fold the accent rather than drop it: poke, not pok
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// A Cobblemon spawn selector: a species followed by zero or more aspects, either
// `key=value` or a bare flag such as `alolan`. Anything else in that column is prose
// from the notes block at the bottom of the sheet, not data.
// `!` and `?` are permitted in aspect values because Unown's letter forms include them.
const SELECTOR = /^[a-z0-9]+(?:[-_][a-z0-9]+)*(?: [a-z0-9_]+(?:=[a-z0-9_!?-]+)?)*$/;

export function isSpawnSelector(value) {
  return SELECTOR.test((value || '').trim());
}

export function parseSelector(value) {
  const tokens = value.trim().split(/\s+/);
  const aspects = {};
  for (const token of tokens.slice(1)) {
    const eq = token.indexOf('=');
    if (eq === -1) aspects[token] = true;
    else aspects[token.slice(0, eq)] = token.slice(eq + 1);
  }
  return { species: tokens[0], aspects };
}

// 'Corsola (Galarian)' -> base 'Corsola', label 'Galarian'. The parenthetical is the only
// human-readable form name in the workbook, and display names collide without it:
// Mr. Mime, Mime Jr. and Mr. Rime each appear twice.
export function splitDisplayName(displayName) {
  const match = (displayName || '').match(/^(.*?)\s*\((.+)\)\s*$/);
  if (!match) return { base: (displayName || '').trim(), formLabel: null };
  return { base: match[1].trim(), formLabel: match[2].trim() };
}

function splitList(value, delimiter) {
  return String(value ?? '')
    .split(delimiter)
    .map((part) => part.trim())
    .filter(Boolean);
}

// Conditions is delimited inconsistently: 383 rows use `|`, 97 use `;`, and 62 use both
// with `,` separating clauses inside one condition. Sub-splitting on `;` unconditionally
// would corrupt text that legitimately contains one, such as the event rows'
// "Requires 25+ players online; random event", so only sub-split when the pipe split has
// come up short of the number of spawn entries the other columns imply.
function splitConditions(value, expected) {
  const segments = splitList(value, '|');
  if (segments.length >= expected) return segments;
  const resplit = segments.flatMap((segment) => splitList(segment, ';'));
  return resplit.length > segments.length && resplit.length <= expected ? resplit : segments;
}

// The six Pebble Spawn Event rows carry an em dash in the Weight column - the workbook
// author's way of writing "not applicable", the same intent as 'Event' in the Level
// column. A bare Number() turns that into NaN, which Postgres stores as NUMERIC 'NaN' and
// pg then serialises as the *string* "NaN", so the API shipped {"weight":"NaN"} and a
// spawn table rendered the literal text NaN. Anything that is not a finite number is the
// absence of a weight, which is null - and that is what 04-api/contract.md already says.
function parseWeight(token) {
  if (token === null || token === undefined || token === '') return null;
  const value = Number(token);
  return Number.isFinite(value) ? value : null;
}

function parseLevel(token) {
  const range = token.match(/^(\d+)\s*-\s*(\d+)$/);
  if (range) return { levelMin: Number(range[1]), levelMax: Number(range[2]) };
  if (/^\d+$/.test(token)) return { levelMin: Number(token), levelMax: Number(token) };
  return { levelMin: null, levelMax: null }; // 'Event' - the six Pebble Spawn Event rows
}

// Field arrays do not align with Spawn Entries for 40% of rows, so padding is the normal
// path, not an error path. Every padded row is flagged so the scale of it stays visible.
export function expandSpawnRow(row) {
  const { species, aspects } = parseSelector(row.selector);
  const { formLabel } = splitDisplayName(row.displayName);

  const fields = {
    bucket: splitList(row.bucket, ';'),
    weight: splitList(row.weight, ';'),
    level: splitList(row.level, ';'),
    context: splitList(row.context, ';'),
  };
  const biomes = splitList(row.biomes, ';');

  // `Spawn Entries` undercounts for 144 rows - Aerodactyl declares 1 but carries two
  // weights (10 and 0.1), two genuinely different entries. Taking the max keeps them;
  // trusting the declared count would silently drop the second.
  const declared = /^\d+(\.\d+)?$/.test(String(row.spawnEntries ?? '').trim())
    ? Number(row.spawnEntries)
    : 1;
  const n = Math.max(declared, ...Object.values(fields).map((f) => f.length), 1);
  fields.conditions = splitConditions(row.conditions, n);

  const padded = [];
  const pick = (name) => {
    const values = fields[name];
    if (values.length === 0) return () => null;

    if (values.length === 1) return () => values[0];
    if (values.length !== n) padded.push(name);
    return (i) => values[Math.min(i, values.length - 1)];
  };
  const at = Object.fromEntries(Object.keys(fields).map((name) => [name, pick(name)]));
  const parseFlag = padded.length ? `padded:${[...new Set(padded)].join(',')}` : null;

  return Array.from({ length: n }, (_, i) => {
    return {
      species,
      aspects,
      formLabel,
      bucket: at.bucket(i),
      weight: parseWeight(at.weight(i)),
      ...parseLevel(at.level(i) ?? ''),
      context: at.context(i),
      biomes,
      conditions: at.conditions(i),
      rawRowIndex: row.rawRowIndex,
      parseFlag,
    };
  });
}

function cellText(cell) {
  const value = cell?.value;
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    if (value.richText) return value.richText.map((r) => r.text).join('');
    if (value.text) return String(value.text);
    if (value.result !== undefined) return String(value.result);
  }
  return String(value).trim();
}

function rowsOf(sheet, columns) {
  const out = [];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const record = { rawRowIndex: rowNumber };
    columns.forEach((name, i) => { record[name] = cellText(row.getCell(i + 1)); });
    out.push(record);
  });
  return out;
}

export async function loadWorkbook() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(WORKBOOK_PATH);

  const pokemonCols = ['displayName', 'selector', 'bucket', 'weight', 'level', 'context',
    'biomes', 'conditions', 'spawnEntries'];
  const allPokemonRows = rowsOf(wb.getWorksheet(SHEETS.pokemon), pokemonCols);

  const pokemonRows = allPokemonRows.filter((r) => isSpawnSelector(r.selector));
  const serverNotes = allPokemonRows
    .filter((r) => !isSpawnSelector(r.selector) && (r.displayName || r.selector))
    .map((r) => ({ heading: r.displayName, body: r.selector, rawRowIndex: r.rawRowIndex }));

  const itemRows = rowsOf(wb.getWorksheet(SHEETS.items),
    ['name', 'itemId', 'wikiCategory', 'sourceCategory', 'description', 'usedInEvolutions',
      'evolutionUses']).filter((r) => r.itemId);

  const itemCategories = rowsOf(wb.getWorksheet(SHEETS.itemCategories),
    ['category', 'count', 'includes']).filter((r) => r.category);

  const subsets = {};
  for (const name of SUBSET_SHEETS) {
    const sheet = wb.getWorksheet(name);
    if (!sheet) throw new Error(`missing expected sheet: ${name}`);
    subsets[name] = rowsOf(sheet, ['name', 'itemId']).filter((r) => r.itemId);
  }

  return { allPokemonRows, pokemonRows, serverNotes, itemRows, itemCategories, subsets };
}
