/*
 * The site's own origin, which it does not know yet.
 *
 * `VITE_SITE_URL` is unset until a domain exists (pre-production.md item 9). Everything
 * that needs an absolute URL - the canonical link, every `@id` in the structured data -
 * returns null instead of guessing, and the caller renders nothing. A canonical tag
 * pointing at the wrong origin is worse than no canonical tag: it tells Google the real
 * page lives somewhere else. Same discipline as scripts/make-sitemap.js, which refuses to
 * run at all without it.
 */
export const SITE_URL = (import.meta.env.VITE_SITE_URL ?? '').trim().replace(/\/+$/, '');

export const absoluteUrl = (pathname) => (SITE_URL ? `${SITE_URL}${pathname}` : null);

/*
 * The canonical URL for a route, which is the highest-value thing on this list.
 *
 * The indexes accept `q`, `bucket`, `biome`, `source` and `page`, so the same markup is
 * reachable at an unbounded number of URLs and a crawler has no way to know which is the
 * real one. Every parameter collapses to the bare path except `page`: page 2 is different
 * content, not a filtered view of page 1, so pointing it at page 1 would ask Google to
 * drop it. A page value that is not a plain positive integer is ignored rather than echoed
 * back, so a junk query string cannot mint a canonical URL of its own.
 */
export function canonicalFor(pathname, search) {
  const page = new URLSearchParams(search).get('page');
  const suffix = page && /^[1-9]\d*$/.test(page) && page !== '1' ? `?page=${page}` : '';
  return absoluteUrl(`${pathname}${suffix}`);
}

// Titles are budgeted at 60 characters, which is roughly where Google truncates. The
// suffix is what gets dropped when a species name is long, never the species name.
export const SITE_NAME = 'Bakumon';
export const TITLE_BUDGET = 60;

export function withSuffix(title, suffix) {
  if (!title) return suffix;
  const full = `${title} - ${suffix}`;
  return full.length <= TITLE_BUDGET ? full : title;
}
