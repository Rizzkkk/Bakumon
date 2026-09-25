import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { canonicalFor } from '../lib/site.js';

/*
 * The only place this application touches `document`, and it does so inside an effect.
 * ADR 0008 keeps prerendering available as a later addition, and that requires module
 * scope to render without a DOM.
 *
 * Which of these a crawler actually reads is not uniform, and the difference is the whole
 * reason this hook exists rather than a block of tags in index.html:
 *
 *   - `title`, `canonical` and the JSON-LD are read by Google, which renders JavaScript.
 *     Setting them here works.
 *   - `description` is read by Google too, so it is set here - but a social scraper does
 *     NOT run JavaScript, so the unfurl text stays whatever index.html says on every route.
 *     That is a ceiling, not a bug. og:* tags are deliberately not managed here for the
 *     same reason: they would be markup nothing ever reads.
 *
 * Everything is restored on unmount so a route change cannot leave the previous page's
 * canonical or structured data attached to the new one.
 */
export function useHead({ title, description, jsonLd, noindex = false } = {}) {
  // Derived here rather than passed in, so no page can get its own canonical wrong and
  // the rule for which query parameters survive lives in exactly one place.
  const { pathname, search } = useLocation();
  // A noindex page gets no canonical. The two together are contradictory - one asks for the
  // URL to be dropped, the other nominates it as the authoritative copy of itself - and on
  // the 404 route, which matches every unknown path, a self-canonical would invite exactly
  // the indexing the noindex is there to prevent.
  const canonical = noindex ? null : canonicalFor(pathname, search);

  useEffect(() => {
    if (!noindex) return undefined;
    const tag = document.createElement('meta');
    tag.setAttribute('name', 'robots');
    tag.setAttribute('content', 'noindex');
    document.head.appendChild(tag);
    return () => { tag.remove(); };
  }, [noindex]);

  useEffect(() => {
    const previous = document.title;
    document.title = title || 'Bakumon Wiki';
    return () => { document.title = previous; };
  }, [title]);

  useEffect(() => {
    if (!description) return undefined;
    const tag = document.querySelector('meta[name="description"]');
    if (!tag) return undefined;
    const previous = tag.getAttribute('content');
    tag.setAttribute('content', description);
    return () => { tag.setAttribute('content', previous); };
  }, [description]);

  useEffect(() => {
    // Null when VITE_SITE_URL is unset, which is the normal state before launch.
    if (!canonical) return undefined;
    const link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    link.setAttribute('href', canonical);
    document.head.appendChild(link);
    return () => { link.remove(); };
  }, [canonical]);

  useJsonLd(jsonLd);
}

/*
 * One structured-data block, attached for as long as its caller is mounted.
 *
 * Separate from useHead because the breadcrumb trail is a component, not a page: the
 * crumbs live in <Breadcrumb>, so the BreadcrumbList is emitted from there and cannot
 * drift from the trail a reader can see. Several blocks on one page is valid - a page may
 * carry both an ItemList and a BreadcrumbList.
 *
 * Serialised here rather than by the caller, so a page builds the object from the data it
 * is already rendering and the two cannot disagree.
 */
export function useJsonLd(data) {
  const serialised = data ? JSON.stringify(data) : null;
  useEffect(() => {
    if (!serialised) return undefined;
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = serialised;
    document.head.appendChild(script);
    return () => { script.remove(); };
  }, [serialised]);
}
