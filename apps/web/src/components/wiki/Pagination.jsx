import { PixelIcon } from '../common/PixelIcon.jsx';

// Shared by the results bar above the list and the pagination nav below it, so the two
// never disagree about what "Showing 121-144 of 904" means for a given page.
export function formatShowing(page, pageSize, total) {
  if (!total) return 'Showing 0 of 0';
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  return `Showing ${start}–${end} of ${total.toLocaleString()}`;
}

// 1 ... 5 [6] 7 ... 38: always the first and last page, plus one on either side of the
// current one. A short list (few enough pages that the window already covers everything)
// needs no ellipsis at all - the gap check below is what removes it.
function pageWindow(current, last) {
  const kept = new Set([1, last, current - 1, current, current + 1].filter((p) => p >= 1 && p <= last));
  return [...kept].sort((a, b) => a - b);
}

export function Pagination({ page, pageSize, total, onPage }) {
  const lastPage = Math.max(1, Math.ceil(total / pageSize));
  if (lastPage <= 1) return null;

  const pages = pageWindow(page, lastPage);
  const summary = formatShowing(page, pageSize, total);

  return (
    <nav aria-label="Pagination" className="pagination">
      <p className="pagination__summary">{summary}</p>

      {/* Desktop: numbered, with ellipses. CSS toggles this against the mobile block below -
          two renderings of the same page state, not two independent controls. */}
      <div className="pagination__numbers">
        <button type="button" className="pagination__step" onClick={() => onPage(page - 1)} disabled={page <= 1}>
          <PixelIcon name="chevron-right" size={16} style={{ transform: 'rotate(180deg)' }} />
          Previous
        </button>
        {pages.map((pageNumber, index) => {
          const previous = pages[index - 1];
          const gap = previous !== undefined && pageNumber - previous > 1;
          return (
            <span key={pageNumber} style={{ display: 'flex', alignItems: 'center' }}>
              {gap ? <span className="pagination__ellipsis" aria-hidden="true">...</span> : null}
              <button
                type="button"
                className="pagination__num"
                aria-current={pageNumber === page ? 'page' : undefined}
                onClick={() => onPage(pageNumber)}
              >
                {pageNumber}
              </button>
            </span>
          );
        })}
        <button type="button" className="pagination__step" onClick={() => onPage(page + 1)} disabled={page >= lastPage}>
          Next
          <PixelIcon name="chevron-right" size={16} />
        </button>
      </div>

      {/* Mobile: `< / Page 6 of 38 / >`, per the filter-sheet-m artboards' compact pattern. */}
      <div className="pagination__mobile">
        <button type="button" className="pagination__step" aria-label="Previous page" onClick={() => onPage(page - 1)} disabled={page <= 1}>
          <PixelIcon name="chevron-right" size={16} style={{ transform: 'rotate(180deg)' }} />
        </button>
        <span className="pagination__mobile-label">Page {page} of {lastPage}</span>
        <button type="button" className="pagination__step" aria-label="Next page" onClick={() => onPage(page + 1)} disabled={page >= lastPage}>
          <PixelIcon name="chevron-right" size={16} />
        </button>
      </div>
    </nav>
  );
}
