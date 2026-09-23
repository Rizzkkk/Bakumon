import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

function parseList(raw) {
  if (!raw) return [];
  return raw.split(',').map((value) => value.trim()).filter(Boolean);
}

// The URL is the state. 04-api/contract.md requires ?bucket=common,rare to be shareable,
// and a second copy of this in useState is precisely how the two drift apart the first
// time someone presses the back button. bucket and biome are comma-separated lists - ADR
// 0010 extended the API to accept them, so the URL carries the same shape the API reads.
export function useWikiParams() {
  const [params, setParams] = useSearchParams();

  const current = useMemo(() => ({
    q: params.get('q') ?? '',
    source: params.get('source') ?? '',
    bucket: parseList(params.get('bucket')),
    biome: parseList(params.get('biome')),
    page: Math.max(1, Number(params.get('page')) || 1),
  }), [params]);

  const update = useCallback((changes, { keepPage = false } = {}) => {
    setParams((previous) => {
      const next = new URLSearchParams(previous);
      for (const [key, value] of Object.entries(changes)) {
        const serialized = Array.isArray(value) ? value.join(',') : value;
        // An empty parameter is dropped rather than written. `?q=` is tolerated by the API
        // but a URL full of empty keys is not shareable, it is noise.
        if (serialized === '' || serialized === undefined || serialized === null) next.delete(key);
        else next.set(key, String(serialized));
      }
      // Changing a filter resets paging: otherwise someone on page 30 of a wide result who
      // narrows it lands past the end of a much shorter one and sees an empty grid above a
      // total that says there are results.
      if (!keepPage) next.delete('page');
      return next;
    }, { replace: true });
  }, [setParams]);

  return { ...current, update };
}
