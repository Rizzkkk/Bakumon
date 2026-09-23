import { useEffect } from 'react';

// The only place this application touches `document`, and it does so inside an effect.
// ADR 0008 keeps prerendering available as a later addition, and that requires module
// scope to render without a DOM.
//
// Per-page titles are worth setting even though per-route og: tags are not: a social
// scraper does not run JavaScript, but a browser tab and Google both do.
export function usePageTitle(title) {
  useEffect(() => {
    const previous = document.title;
    document.title = title ? `${title} - Bakumon Wiki` : 'Bakumon Wiki';
    return () => { document.title = previous; };
  }, [title]);
}
