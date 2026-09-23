// The five buckets and four categories are closed vocabularies that validate-import.js
// already asserts against the workbook. A sixth value appearing after a server rebalance
// fails that validator loudly, which is the signal to edit this file.
export const SPAWN_BUCKETS = ['common', 'legendary event', 'rare', 'ultra-rare', 'uncommon'];

export const ITEM_CATEGORIES = ['consumable', 'held', 'evolution', 'other'];

// There are only five buckets, so a list longer than that is already nonsense. 112 biome
// tokens exist; 20 is well past what the multi-select artboard shows selected at once and
// caps an otherwise-unbounded array literal in the query string.
export const MAX_BUCKET_FILTERS = SPAWN_BUCKETS.length;
export const MAX_BIOME_FILTERS = 20;

export const DEFAULT_PAGE_SIZE = 24;

// Above this a request stops being a page and becomes an export, and the export of this
// dataset is the workbook. Raising it means re-running npm run explain.
export const MAX_PAGE_SIZE = 100;

// A tsvector match cannot do prefix typing, so short queries fall back to a substring
// scan. At four characters the vector is precise enough that adding ILIKE '%abra%' would
// drag in Kadabra and Alakazam.
export const SUBSTRING_SEARCH_MAX_LENGTH = 3;
