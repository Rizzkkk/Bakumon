import { useWikiSearch, PAGE_SIZE } from '../hooks/useWikiSearch.js';
import { usePageTitle } from '../hooks/usePageTitle.js';
import { SearchBar } from '../components/wiki/SearchBar.jsx';
import { CategoryNav } from '../components/wiki/CategoryNav.jsx';
import { ResultsGrid } from '../components/wiki/ResultsGrid.jsx';

export default function WikiHome() {
  const { tab, q, source, bucket, page, status, data, error, update } = useWikiSearch();
  usePageTitle(tab === 'items' ? 'Items' : 'Pokemon');

  return (
    <div className="page stack">
      <h1 style={{ marginBottom: 0 }}>Bakumon wiki</h1>

      <SearchBar
        label={tab === 'items' ? 'Search items' : 'Search Pokemon'}
        value={q}
        status={status}
        resultCount={data?.total}
        onChange={(value) => update({ q: value })}
      />

      <CategoryNav
        tab={tab}
        source={source}
        bucket={bucket}
        onTab={(value) => update({ tab: value === 'pokemon' ? '' : value, source: '', bucket: '' })}
        onSource={(value) => update({ source: value })}
        onBucket={(value) => update({ bucket: value })}
      />

      <ResultsGrid
        tab={tab}
        status={status}
        data={data}
        error={error}
        page={page}
        pageSize={PAGE_SIZE}
        onPage={(value) => update({ page: value }, { keepPage: true })}
      />
    </div>
  );
}
