// Collects WHERE fragments and their bind values together, so a fragment can never be
// added without its parameter. Fragments are literals in code; values are always bound.
export function conditions() {
  const parts = [];
  const params = [];

  // Separate from `add` because a relevance ORDER BY has to bind the same term the WHERE
  // clause binds, and it is not a WHERE fragment. Binding it twice would work but would
  // leave the two copies free to drift apart.
  const bind = (value) => `$${params.push(value)}`;

  // The one door in this file that accepts a string without binding it. The argument must
  // be code literals and $n placeholders only - never an interpolated value. Anything
  // carrying data goes through `add` or `bind` so it cannot reach the query unbound.
  const push = (fragment) => {
    parts.push(fragment);
  };

  const add = (build, ...values) => push(build(...values.map(bind)));

  const where = () => (parts.length ? `WHERE ${parts.join(' AND ')}` : '');

  return { add, bind, push, where, params };
}

// Postgres treats % and _ as wildcards inside LIKE, so an unescaped "%" typed into the
// search box would match every row. A function replacer rather than a '$&' string: the
// escaping is the whole point of this helper and must not be lost to a quoting mistake.
const LIKE_WILDCARDS = /[\\%_]/g;

const escapeLike = (term) => term.replace(LIKE_WILDCARDS, (ch) => '\\' + ch);

export const likePattern = (term) => `%${escapeLike(term)}%`;

// Anchored at the start, for the relevance tier that puts Potion above Hyper Potion. Built
// here rather than inline at the call site so it cannot be assembled without the escaping.
export const prefixPattern = (term) => `${escapeLike(term)}%`;
