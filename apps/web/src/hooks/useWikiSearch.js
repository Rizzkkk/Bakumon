import { useCallback, useState } from 'react';
import { useWikiParams } from './useWikiParams.js';
import { useDebouncedValue } from './useDebouncedValue.js';
import { useResource } from './useResource.js';
import { listItems, listPokemon } from '../api/endpoints.js';

export const PAGE_SIZE = 24;

// A rate-limited 429 is never auto-retried (ErrorState's own reasoning), so the only way
// back is a person pressing "Try again". useResource re-runs on its deps array, which
// carries no signal for "the same request, again" - this counter is that signal.
function useRetry() {
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => setAttempt((value) => value + 1), []);
  return { attempt, retry };
}

export function usePokemonSearch() {
  const params = useWikiParams();
  const search = useDebouncedValue(params.q);
  const { bucket, biome, page } = params;
  const { attempt, retry } = useRetry();

  const bucketKey = bucket.join(',');
  const biomeKey = biome.join(',');

  const { status, data, error } = useResource(
    (signal) => listPokemon({ search, bucket: bucketKey, biome: biomeKey, page, pageSize: PAGE_SIZE }, { signal }),
    [search, bucketKey, biomeKey, page, attempt],
  );

  return { ...params, search, status, data, error, retry };
}

export function useItemsSearch() {
  const params = useWikiParams();
  const search = useDebouncedValue(params.q);
  const { source, page } = params;
  const { attempt, retry } = useRetry();

  const { status, data, error } = useResource(
    (signal) => listItems({ search, sourceCategory: source, page, pageSize: PAGE_SIZE }, { signal }),
    [search, source, page, attempt],
  );

  return { ...params, search, status, data, error, retry };
}
