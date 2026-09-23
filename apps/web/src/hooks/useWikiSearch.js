import { useWikiParams } from './useWikiParams.js';
import { useDebouncedValue } from './useDebouncedValue.js';
import { useResource } from './useResource.js';
import { listItems, listPokemon } from '../api/endpoints.js';

export const PAGE_SIZE = 24;

export function useWikiSearch() {
  const params = useWikiParams();
  const search = useDebouncedValue(params.q);

  const { tab, source, bucket, page } = params;

  const { status, data, error } = useResource(
    (signal) => (tab === 'items'
      ? listItems({ search, sourceCategory: source, page, pageSize: PAGE_SIZE }, { signal })
      : listPokemon({ search, bucket, page, pageSize: PAGE_SIZE }, { signal })),
    [tab, search, source, bucket, page],
  );

  return { ...params, search, status, data, error };
}
