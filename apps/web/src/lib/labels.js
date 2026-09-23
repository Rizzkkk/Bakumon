// The 13 source categories are derived from the workbook and no endpoint publishes them -
// 04-api/contract.md records that as deliberate. This is therefore a display copy, and
// scripts/validate-import.js asserts the exact 13 slugs against the database so the two
// cannot drift in silence. Counts are from `npm run validate`, 2026-09-23.
export const SOURCE_CATEGORIES = [
  { slug: 'berries-berry-items', label: 'Berries' },
  { slug: 'poke-balls-catching', label: 'Poke Balls' },
  { slug: 'evolution-evolution-items', label: 'Evolution' },
  { slug: 'held-battle-items', label: 'Held & Battle' },
  { slug: 'medicine-recovery', label: 'Medicine' },
  { slug: 'food-sweets', label: 'Food & Sweets' },
  { slug: 'mints-nature', label: 'Mints' },
  { slug: 'fossils', label: 'Fossils' },
  { slug: 'materials-crafting', label: 'Materials' },
  { slug: 'training-progression', label: 'Training' },
  { slug: 'technical-moves', label: 'Technical' },
  { slug: 'utility', label: 'Utility' },
  { slug: 'other-cobblemon-item', label: 'Other' },
];

const SOURCE_LABELS = new Map(SOURCE_CATEGORIES.map((entry) => [entry.slug, entry.label]));

// An unknown slug must not break the page. The API returns an empty result rather than a
// 400 for one (items.controller.js), so the UI degrades to a readable fallback too.
export const sourceCategoryLabel = (slug) =>
  SOURCE_LABELS.get(slug) ?? (slug ?? '').replace(/-/g, ' ');

export const CATEGORY_LABELS = {
  consumable: 'Consumable',
  held: 'Held',
  evolution: 'Evolution',
  other: 'Other',
};

// The five API bucket slugs in the order they are shown, which is ascending rarity rather
// than alphabetical. Colour lives in BUCKET_CHIP_META below, not here.
export const BUCKETS = [
  { slug: 'common', label: 'Common' },
  { slug: 'uncommon', label: 'Uncommon' },
  { slug: 'rare', label: 'Rare' },
  { slug: 'ultra-rare', label: 'Ultra-rare' },
  { slug: 'legendary event', label: 'Legendary event' },
];

// The kit's own vocabulary for the five buckets: a CSS-custom-property-safe slug (a bucket
// name with a space cannot be a --t-legendary-event-bg token), a PixelIcon glyph name, and
// the display label the kit uses ("Legendary", not the API's "legendary event").
export const BUCKET_CHIP_META = {
  common: { tokenSlug: 'common', icon: 'bucket-common', label: 'Common' },
  uncommon: { tokenSlug: 'uncommon', icon: 'bucket-uncommon', label: 'Uncommon' },
  rare: { tokenSlug: 'rare', icon: 'bucket-rare', label: 'Rare' },
  'ultra-rare': { tokenSlug: 'ultra', icon: 'bucket-ultra-rare', label: 'Ultra-rare' },
  'legendary event': { tokenSlug: 'legendary', icon: 'bucket-legendary', label: 'Legendary' },
};

export const bucketChipMeta = (slug) =>
  BUCKET_CHIP_META[slug] ?? { tokenSlug: 'common', icon: 'bucket-common', label: slug ?? 'Unknown' };

// null is a real value here, not missing data: the six legendary-event rows carry no
// bucket, weight or level range. An em dash says "the workbook has nothing" where 'null'
// or NaN would read as a defect.
export const EMPTY = '\u2014';

// Belt and braces against the shape rather than the value. A NUMERIC column reaches JSON
// as a string for NaN and Infinity, and `?? EMPTY` does not catch either - which is how a
// spawn table came to print the literal text NaN. Anything not a finite number is absent.
export const numberOrEmpty = (value) => (Number.isFinite(Number(value)) && value !== null ? value : EMPTY);

function capitalizeFirst(text) {
  return text.length ? text[0].toUpperCase() + text.slice(1) : text;
}

// #cobblemon:is_temperate -> "Temperate biomes"; minecraft:cherry_grove -> "Cherry grove".
// GET /api/biomes' `isTag` is what distinguishes the two shapes - a token this cannot
// parse (no colon, or a tag not shaped like is_x) falls back to the raw string rather than
// throwing, per the Phase 2 brief.
export function biomeLabel(token, isTag) {
  const colon = token?.indexOf(':') ?? -1;
  if (!token || colon === -1) return token ?? '';

  const name = token.slice(colon + 1);

  if (isTag) {
    const withoutIs = name.startsWith('is_') ? name.slice(3) : name;
    const words = withoutIs.replace(/_/g, ' ').trim();
    return words ? `${capitalizeFirst(words)} biomes` : token;
  }

  const words = name.replace(/_/g, ' ').trim();
  return words ? capitalizeFirst(words) : token;
}

export const levelRange = (min, max) => {
  if (min === null || min === undefined) return EMPTY;
  return min === max ? String(min) : `${min}-${max}`;
};
