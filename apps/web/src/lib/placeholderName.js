// Matches both the positional form (%1$s - the localisation row the API excludes from
// listings) and the bare form (%s - the four real Poke Puff items, which are listable and
// must stay that way). Not a /g regex: a shared global regex carries lastIndex between
// calls and would skip every other match.
const PLACEHOLDER = /%(?:\d+\$)?[sdf]/;
const PLACEHOLDER_GLOBAL = /%(?:\d+\$)?[sdf]/g;

export const hasPlaceholder = (name) => PLACEHOLDER.test(name ?? '');

// Returns the name split into literal and token parts, in source order. Pure and
// JSX-free, so the same split feeds the card, the detail heading and anything later
// without a second parser appearing beside it.
export function splitPlaceholders(name) {
  const parts = [];
  let last = 0;

  for (const match of (name ?? '').matchAll(PLACEHOLDER_GLOBAL)) {
    if (match.index > last) parts.push({ text: name.slice(last, match.index) });
    parts.push({ token: match[0] });
    last = match.index + match[0].length;
  }

  if (last < (name ?? '').length) parts.push({ text: name.slice(last) });
  return parts.length ? parts : [{ text: name ?? '' }];
}
