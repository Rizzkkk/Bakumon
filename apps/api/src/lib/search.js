import { likePattern, prefixPattern } from './sql.js';
import { SUBSTRING_SEARCH_MAX_LENGTH } from '../constants.js';

// One definition of what the search box matches and how its results are ordered, shared by
// both list queries. It was two near-identical predicates; adding relevance tiers would
// have made it four, and every copy has to bind the same term the WHERE clause binds.
//
// The predicate is pushed into `c` here, but the prefix pattern is NOT bound here: it is
// referenced only from the ORDER BY, and `c.params` is what the companion count query is
// run with. Binding it into `c` gives that query a parameter its WHERE never mentions, and
// Postgres rejects the whole statement - "bind message supplies 3 parameters, but prepared
// statement requires 2". It surfaces only on a page past the end, where the count fallback
// is the path taken, so it is exactly the kind of bug a browse-only test never sees.
export function searchOn(c, { vector, name }, term) {
  const termAt = c.bind(term);
  const substringAt = c.bind(likePattern(term));

  // A tsvector cannot do prefix typing, so a short term needs a substring fallback. So
  // does a term that tokenises to nothing: plainto_tsquery('english','over') is empty and
  // matches no row, while 123 items contain the string.
  const alwaysSubstring = term.length <= SUBSTRING_SEARCH_MAX_LENGTH;

  c.push(`(${vector} @@ plainto_tsquery('english', ${termAt})
            OR (${name} ILIKE ${substringAt}
                AND ${alwaysSubstring ? 'TRUE' : `plainto_tsquery('english', ${termAt}) = ''::tsquery`}))`);

  return {
    prefixParam: prefixPattern(term),
    // Relevance, most specific tier first. Alphabetical order alone puts Hyper Potion and
    // Max Potion above Potion for the query "potion". Postgres sorts false before true, so
    // each boolean tier is DESC. The caller appends its own name,id tie-break: these sort
    // above it, never instead of it, because ADR 0006 still binds.
    tiers: (prefixAt) => [
      { alias: 'rank_exact', expr: `(lower(${name}) = lower(${termAt}))` },
      { alias: 'rank_prefix', expr: `(${name} ILIKE ${prefixAt})` },
      { alias: 'rank_ts', expr: `ts_rank(${vector}, plainto_tsquery('english', ${termAt}))` },
    ],
  };
}

// Resolves the tiers against the position the prefix pattern will occupy. It goes after
// every WHERE parameter - including the category filters bound after searchOn ran - so the
// count query, which is run with c.params alone, stays exactly as wide as its own WHERE.
export function rankFor(search, c) {
  if (!search) return { rank: [], rankParams: [] };
  return {
    rank: search.tiers(`$${c.params.length + 1}`),
    rankParams: [search.prefixParam],
  };
}

// Three formatters because the two call sites need different forms: the items query is
// single-level and orders by the expressions inline, while the pokemon query is a two-level
// CTE whose rank expressions reference `p.`, out of scope outside the CTE - so there they
// are aliased once and referenced by alias twice. Each returns '' for an empty rank array,
// which is what keeps the no-search SQL byte-identical to what it was before ranking.
export const rankOrder = (rank) => rank.map((r) => `${r.expr} DESC, `).join('');
export const rankSelect = (rank) => rank.map((r) => `${r.expr} AS ${r.alias}, `).join('');
export const rankOrderByAlias = (rank, prefix = '') =>
  rank.map((r) => `${prefix}${r.alias} DESC, `).join('');
