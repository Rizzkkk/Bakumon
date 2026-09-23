import { useEffect, useState } from 'react';
import { Drawer } from '../common/Drawer.jsx';
import { PixelIcon } from '../common/PixelIcon.jsx';
import { FilterFields } from './FilterRail.jsx';

// Mobile equivalent of FilterRail, reusing the same fieldsets rather than a second copy
// (filter-sheet-m-light.html). Changes are held locally until "Show results" commits them
// to the URL - the sticky footer's whole reason to exist is that a rail-style live-apply
// would refetch on every tap while the sheet is still open.
export function FilterSheet({ open, onClose, q, bucket, biome, onApply }) {
  const [pending, setPending] = useState({ q, bucket, biome });

  // Each open starts from whatever is live in the URL, not whatever was left over from the
  // last time the sheet was dismissed without applying.
  useEffect(() => {
    if (open) setPending({ q, bucket, biome });
  }, [open, q, bucket, biome]);

  if (!open) return null;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      titleId="filter-sheet-title"
      title="Filters"
      closeLabel="Close filters"
      icon={<PixelIcon name="search" size={20} />}
    >
      <div className="filter-sheet__body">
        <FilterFields
          idPrefix="sheet"
          q={pending.q}
          bucket={pending.bucket}
          biome={pending.biome}
          onQ={(value) => setPending((previous) => ({ ...previous, q: value }))}
          onBucket={(value) => setPending((previous) => ({ ...previous, bucket: value }))}
          onBiome={(value) => setPending((previous) => ({ ...previous, biome: value }))}
        />
      </div>
      <div className="filter-sheet__footer">
        <button type="button" className="action-button action-button--outline" onClick={() => setPending({ q: '', bucket: [], biome: [] })}>
          Clear all
        </button>
        <button
          type="button"
          className="filter-sheet__apply"
          onClick={() => { onApply(pending); onClose(); }}
        >
          Show results
        </button>
      </div>
    </Drawer>
  );
}
