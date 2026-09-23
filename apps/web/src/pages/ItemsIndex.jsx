import { Link } from 'react-router-dom';
import { Breadcrumb } from '../components/wiki/Breadcrumb.jsx';
import { PageTitleBlock } from '../components/wiki/PageTitleBlock.jsx';
import { ItemCard } from '../components/wiki/ItemCard.jsx';
import { Pagination, formatShowing } from '../components/wiki/Pagination.jsx';
import { EmptyState } from '../components/common/EmptyState.jsx';
import { ErrorState } from '../components/common/ErrorState.jsx';
import { SkeletonStatus, Skeleton } from '../components/common/Skeleton.jsx';
import { Artwork } from '../components/common/Artwork.jsx';
import { PixelIcon } from '../components/common/PixelIcon.jsx';
import { ItemName } from '../components/common/ItemName.jsx';
import { useItemsSearch, PAGE_SIZE } from '../hooks/useWikiSearch.js';
import { usePageTitle } from '../hooks/usePageTitle.js';
import { useResource } from '../hooks/useResource.js';
import { listItems } from '../api/endpoints.js';
import { SOURCE_CATEGORIES, sourceCategoryLabel, EMPTY } from '../lib/labels.js';
import { itemAlt } from '../lib/altText.js';

// Mirrors PokemonIndex's useOverallTotal: the intro line's "All 934 items" is the
// unfiltered count, not `data.total`, which changes with the source filter.
function useOverallTotal() {
  const { data } = useResource((signal) => listItems({ pageSize: 1 }, { signal }), []);
  return data?.total;
}

export default function ItemsIndex() {
  usePageTitle('Items');
  const { q, source, page, status, data, error, update, retry } = useItemsSearch();
  const overallTotal = useOverallTotal();

  const rows = data?.data ?? [];
  const showEmpty = status !== 'loading' && data && rows.length === 0;
  const showLoadingSkeleton = status === 'loading' && !data;

  return (
    <div className="stack">
      <Breadcrumb items={[{ to: '/wiki', label: 'Wiki' }]} current="Items" />
      <PageTitleBlock title="All items" subtitle="Bakumon Wiki - Items on this server" />

      <p className="index-intro">
        All {overallTotal ?? '…'} items on Bakumon. Pick a source to narrow the list.
      </p>

      <div className="items-filter-bar">
        <div className="filter-field">
          <label htmlFor="ii-q">Name</label>
          <div className="filter-search">
            <PixelIcon name="search" size={20} />
            <input
              id="ii-q"
              type="search"
              placeholder="e.g. Fire Stone"
              value={q}
              onChange={(event) => update({ q: event.target.value })}
            />
          </div>
        </div>

        <div role="group" aria-label="Item source" className="items-source">
          <span className="items-source__label">Source</span>
          <div className="items-source__chips">
            <button
              type="button"
              className="source-chip"
              aria-pressed={!source}
              onClick={() => update({ source: '' })}
            >
              {!source ? <PixelIcon name="check" size={14} /> : null}
              All
            </button>
            {SOURCE_CATEGORIES.map((entry) => (
              <button
                key={entry.slug}
                type="button"
                className="source-chip"
                aria-pressed={source === entry.slug}
                onClick={() => update({ source: source === entry.slug ? '' : entry.slug })}
              >
                {source === entry.slug ? <PixelIcon name="check" size={14} /> : null}
                {entry.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {status === 'error' ? <ErrorState error={error} onRetry={retry} /> : null}

      {showLoadingSkeleton ? (
        <SkeletonStatus label="Loading items">
          <div className="index-list-skeleton">
            {Array.from({ length: 8 }, (_, index) => (
              <div key={index} className="index-row">
                <Skeleton width={44} height={44} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <Skeleton width="40%" height={18} />
                  <Skeleton width="30%" height={14} />
                </div>
              </div>
            ))}
          </div>
        </SkeletonStatus>
      ) : null}

      {showEmpty ? <ItemsEmptyState q={q} source={source} update={update} /> : null}

      {status !== 'error' && data && rows.length > 0 ? (
        <div className="stack" style={{ opacity: status === 'loading' ? 0.6 : 1 }}>
          <p className="index-results-bar__count">{formatShowing(page, PAGE_SIZE, data.total)}</p>

          <div className="table-scroll index-table">
            <table>
              <thead>
                <tr>
                  <th scope="col"><span className="visually-hidden">Icon</span></th>
                  <th scope="col">Name</th>
                  <th scope="col">Source</th>
                  <th scope="col">Evolution uses</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((item) => (
                  <tr key={item.itemId}>
                    <td>
                      <Artwork src={item.imageUrl} alt={itemAlt(item.name)} size={96} pixel />
                    </td>
                    <td>
                      <Link className="index-table__name" to={`/wiki/items/${encodeURIComponent(item.itemId)}`}>
                        <ItemName name={item.name} />
                      </Link>
                    </td>
                    <td>{sourceCategoryLabel(item.sourceCategory)}</td>
                    {/* The list row carries no evolutionUseCount - only GET /api/items/:itemId
                        does (04-api/contract.md). null is real data here, not missing data,
                        so this reads the same em dash the rest of the site uses for it. */}
                    <td>{EMPTY}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="index-list">
            {rows.map((item) => <ItemCard key={item.itemId} item={item} />)}
          </ul>

          <Pagination page={page} pageSize={PAGE_SIZE} total={data.total} onPage={(value) => update({ page: value }, { keepPage: true })} />
        </div>
      ) : null}
    </div>
  );
}

// states-items-light.html shows two different empty states: a search that missed (with a
// way to widen it) and a plain "nothing here" for a source filter alone. Split on whether
// there is a search term, since that is what the copy itself is about.
function ItemsEmptyState({ q, source, update }) {
  if (q) {
    const scope = source ? sourceCategoryLabel(source).toLowerCase() : 'items';
    return (
      <EmptyState title={`No ${scope} match "${q}"`} detail="Try the search across all sources, or clear it.">
        {source ? (
          <button type="button" className="action-button action-button--outline" onClick={() => update({ source: '' })}>
            Search all sources
          </button>
        ) : null}
        <button type="button" className="action-button" onClick={() => update({ q: '' })}>
          Clear search
        </button>
      </EmptyState>
    );
  }

  return (
    <EmptyState title="Nothing matched" detail="Try a different source, or clear the filter.">
      <button type="button" className="action-button" onClick={() => update({ q: '', source: '' })}>
        Clear all filters
      </button>
    </EmptyState>
  );
}
