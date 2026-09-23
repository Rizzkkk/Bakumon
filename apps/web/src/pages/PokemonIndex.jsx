import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Breadcrumb } from '../components/wiki/Breadcrumb.jsx';
import { PageTitleBlock } from '../components/wiki/PageTitleBlock.jsx';
import { BucketChip } from '../components/wiki/BucketChip.jsx';
import { PokemonCard } from '../components/wiki/PokemonCard.jsx';
import { Pagination, formatShowing } from '../components/wiki/Pagination.jsx';
import { FilterSheet } from '../components/wiki/FilterSheet.jsx';
import { useBiomeList } from '../components/wiki/FilterRail.jsx';
import { RemovableFilterChip } from '../components/wiki/RemovableFilterChip.jsx';
import { EmptyState } from '../components/common/EmptyState.jsx';
import { ErrorState } from '../components/common/ErrorState.jsx';
import { SkeletonStatus, Skeleton } from '../components/common/Skeleton.jsx';
import { Artwork } from '../components/common/Artwork.jsx';
import { PixelIcon } from '../components/common/PixelIcon.jsx';
import { usePokemonSearch, PAGE_SIZE } from '../hooks/useWikiSearch.js';
import { usePageTitle } from '../hooks/usePageTitle.js';
import { useResource } from '../hooks/useResource.js';
import { listPokemon } from '../api/endpoints.js';
import { bucketChipMeta, biomeLabel } from '../lib/labels.js';
import { pokemonAlt } from '../lib/altText.js';

// The unfiltered species count for the intro line ("All 904 Pokemon..."). Separate from
// the search's own `data.total`, which is the *filtered* count and would make the intro
// line say something different every time a filter changes.
function useOverallTotal() {
  const { data } = useResource((signal) => listPokemon({ pageSize: 1 }, { signal }), []);
  return data?.total;
}

export default function PokemonIndex() {
  usePageTitle('Pokemon');
  const { q, bucket, biome, page, status, data, error, update, retry } = usePokemonSearch();
  const overallTotal = useOverallTotal();
  const { biomes } = useBiomeList();
  const [sheetOpen, setSheetOpen] = useState(false);

  const biomeIsTag = new Map(biomes.map((entry) => [entry.token, entry.isTag]));
  const activeFilterCount = bucket.length + biome.length + (q ? 1 : 0);
  const rows = data?.data ?? [];
  const showEmpty = status !== 'loading' && data && rows.length === 0;
  const showLoadingSkeleton = status === 'loading' && !data;

  return (
    <div className="stack">
      <Breadcrumb items={[{ to: '/wiki', label: 'Wiki' }]} current="Pokemon" />
      <PageTitleBlock title="All Pokemon" subtitle="Bakumon Wiki - Spawn data from this server's own config" />

      <p className="index-intro">
        All {overallTotal ?? '…'} Pokemon that spawn on Bakumon. Buckets and biomes come
        from this server&#39;s config. Legendaries spawn at random, so they are listed with the{' '}
        <span style={{ whiteSpace: 'nowrap' }}><BucketChip slug="legendary event" /></span> tag
        instead of a bucket.
      </p>

      {/* Mobile-only toolbar: the rail's own Name field is hidden with it below 768px, so
          the same search needs a visible field here, plus the button that opens FilterSheet. */}
      <div className="index-toolbar">
        <div className="filter-field">
          <label htmlFor="pi-mobile-q" className="visually-hidden">Search Pokemon by name</label>
          <div className="filter-search">
            <PixelIcon name="search" size={20} />
            <input
              id="pi-mobile-q"
              type="search"
              placeholder="e.g. Magikarp"
              value={q}
              onChange={(event) => update({ q: event.target.value })}
            />
          </div>
        </div>
        <button type="button" className="index-toolbar__filters" onClick={() => setSheetOpen(true)}>
          <PixelIcon name="menu" size={20} />
          Filters{activeFilterCount ? ` (${activeFilterCount})` : ''}
        </button>
      </div>

      {status === 'error' ? <ErrorState error={error} onRetry={retry} /> : null}

      {showLoadingSkeleton ? (
        <SkeletonStatus label="Loading Pokemon">
          <div className="index-list-skeleton">
            {Array.from({ length: 8 }, (_, index) => (
              <div key={index} className="index-row">
                <Skeleton width={56} height={56} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <Skeleton width="40%" height={18} />
                  <Skeleton width="70%" height={14} />
                </div>
              </div>
            ))}
          </div>
        </SkeletonStatus>
      ) : null}

      {showEmpty ? (
        <div className="stack">
          {activeFilterCount ? (
            <div className="active-filters">
              <div className="active-filters__label">
                {activeFilterCount} filter{activeFilterCount === 1 ? '' : 's'} on
              </div>
              <div className="active-filters__chips">
                {bucket.map((slug) => (
                  <RemovableFilterChip
                    key={`bucket-${slug}`}
                    label={bucketChipMeta(slug).label}
                    onRemove={() => update({ bucket: bucket.filter((value) => value !== slug) }, { keepPage: true })}
                  >
                    <BucketChip slug={slug} />
                  </RemovableFilterChip>
                ))}
                {biome.map((token) => (
                  <RemovableFilterChip
                    key={`biome-${token}`}
                    label={biomeLabel(token, biomeIsTag.get(token) ?? false)}
                    onRemove={() => update({ biome: biome.filter((value) => value !== token) }, { keepPage: true })}
                  />
                ))}
                {q ? (
                  <RemovableFilterChip
                    label={`Search: "${q}"`}
                    onRemove={() => update({ q: '' })}
                  />
                ) : null}
              </div>
            </div>
          ) : null}
          <EmptyState
            title={activeFilterCount > 1 ? `No Pokemon match all ${activeFilterCount} filters` : 'No Pokemon match this filter'}
            detail="Every filter narrows the list further. Remove one to widen it again."
          >
            <button type="button" className="action-button" onClick={() => update({ q: '', bucket: [], biome: [] })}>
              Clear all filters
            </button>
          </EmptyState>
        </div>
      ) : null}

      {status !== 'error' && data && rows.length > 0 ? (
        <div className="stack" style={{ opacity: status === 'loading' ? 0.6 : 1 }}>
          <div className="index-results-bar">
            <p className="index-results-bar__count">{formatShowing(page, PAGE_SIZE, data.total)}</p>
            <span className="index-results-bar__sort">Sorted by name</span>
          </div>

          <div className="table-scroll index-table">
            <table>
              <thead>
                <tr>
                  <th scope="col"><span className="visually-hidden">Artwork</span></th>
                  <th scope="col">Name</th>
                  <th scope="col">Spawn buckets</th>
                  <th scope="col">Biomes</th>
                  <th scope="col">Forms</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((pokemon) => (
                  <tr key={pokemon.id}>
                    <td>
                      <Artwork src={pokemon.thumbUrl} alt={pokemonAlt(pokemon.displayName)} size={48} />
                    </td>
                    <td>
                      <Link className="index-table__name" to={`/wiki/pokemon/${encodeURIComponent(pokemon.slug)}`}>
                        {pokemon.displayName}
                      </Link>
                      <span className="mono index-row__slug">{pokemon.slug}</span>
                    </td>
                    <td>
                      <span className="chips">
                        {pokemon.spawnSummary.buckets.map((bucketSlug) => <BucketChip key={bucketSlug} slug={bucketSlug} />)}
                      </span>
                    </td>
                    <td>{pokemon.spawnSummary.biomeCount}</td>
                    <td>{pokemon.spawnSummary.formCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="index-list">
            {rows.map((pokemon) => <PokemonCard key={pokemon.id} pokemon={pokemon} />)}
          </ul>

          <Pagination page={page} pageSize={PAGE_SIZE} total={data.total} onPage={(value) => update({ page: value }, { keepPage: true })} />
        </div>
      ) : null}

      <FilterSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        q={q}
        bucket={bucket}
        biome={biome}
        onApply={(patch) => update(patch)}
      />
    </div>
  );
}
