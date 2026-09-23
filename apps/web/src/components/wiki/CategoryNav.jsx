import { SOURCE_CATEGORIES, BUCKETS } from '../../lib/labels.js';

// Item chips are built from sourceCategory, not category. architecture.md section 6 said
// seven categories including berry, fossil and pokeball - that axis does not exist. Those
// three live on the source axis; `category` has exactly four values and none of them are
// berry. ADR 0002, and pre-production.md item 13 repeats it.
export function CategoryNav({ tab, source, bucket, onTab, onSource, onBucket }) {
  return (
    <nav aria-label="Filters" className="stack">
      <ul className="chips" role="list">
        {['pokemon', 'items'].map((value) => (
          <li key={value}>
            <button
              type="button"
              className="chip"
              aria-pressed={tab === value}
              onClick={() => onTab(value)}
            >
              {value === 'pokemon' ? 'Pokemon' : 'Items'}
            </button>
          </li>
        ))}
      </ul>

      {tab === 'items' ? (
        <ul className="chips" role="list">
          {SOURCE_CATEGORIES.map((entry) => (
            <li key={entry.slug}>
              <button
                type="button"
                className="chip"
                aria-pressed={source === entry.slug}
                onClick={() => onSource(source === entry.slug ? '' : entry.slug)}
              >
                {entry.label}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="chips" role="list">
          {BUCKETS.map((entry) => (
            <li key={entry.slug}>
              <button
                type="button"
                className="chip"
                aria-pressed={bucket === entry.slug}
                onClick={() => onBucket(bucket === entry.slug ? '' : entry.slug)}
              >
                {entry.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </nav>
  );
}
