// The API guarantees base form first with each form's rows adjacent (04-api/contract.md,
// and the ORDER BY in pokemon.queries.js). One pass is therefore correct, and a sort here
// would be actively wrong: it would discard the base-form-first ordering the API paid a
// CTE to produce. Magikarp has 32 spawn rows and Unown 28, so a flat table is unreadable.
export function groupSpawns(spawns = []) {
  // The six 'legendary event' rows do not spawn naturally and must not sit in the same
  // table as rows that do (01-data/server-notes.md). Partitioned before grouping, so
  // lifting them out cannot split a form group in half.
  const natural = spawns.filter((row) => row.bucket !== 'legendary event');
  const events = spawns.filter((row) => row.bucket === 'legendary event');

  const groups = [];
  for (const row of natural) {
    const key = formKey(row);
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.rows.push(row);
    else groups.push({ key, label: formLabel(row), aspects: row.aspects ?? {}, rows: [row] });
  }

  return { groups, events };
}

// Rendered the way the game writes a spawn selector, in mono. form_label is the only
// human-readable form name the workbook has (ADR 0003); where it is absent the aspects
// object IS the name. Prettifying character=! into prose would be inventing data.
export const aspectsKey = (aspects = {}) =>
  Object.entries(aspects)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => (value === true ? key : `${key}=${value}`))
    .join(' ');

const formKey = (row) => row.formLabel ?? aspectsKey(row.aspects) ?? '';

const formLabel = (row) => row.formLabel ?? (aspectsKey(row.aspects) || 'Base form');
