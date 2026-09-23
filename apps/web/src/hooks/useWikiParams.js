import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

// The URL is the state. 04-api/contract.md requires ?tab=pokemon&q=char to be shareable,
// and a second copy of this in useState is precisely how the two drift apart the first
// time someone presses the back button.
export function useWikiParams() {
  const [params, setParams] = useSearchParams();

  const current = useMemo(() => ({
    tab: params.get('tab') === 'items' ? 'items' : 'pokemon',
    q: params.get('q') ?? '',
    source: params.get('source') ?? '',
    bucket: params.get('bucket') ?? '',
    page: Math.max(1, Number(params.get('page')) || 1),
  }), [params]);

  const update = useCallback((changes, { keepPage = false } = {}) => {
    setParams((previous) => {
      const next = new URLSearchParams(previous);
      for (const [key, value] of Object.entries(changes)) {
        // An empty parameter is dropped rather than written. `?q=` is tolerated by the API
        // but a URL full of empty keys is not shareable, it is noise.
        if (value === '' || value === undefined || value === null) next.delete(key);
        else next.set(key, String(value));
      }
      // Changing the tab, the query or a chip resets paging: otherwise someone on page 30
      // of 904 pokemon who switches to Items lands past the end of a 933-row set and sees
      // an empty grid above a total that says there are results.
      if (!keepPage) next.delete('page');
      return next;
    }, { replace: true });
  }, [setParams]);

  return { ...current, update };
}
