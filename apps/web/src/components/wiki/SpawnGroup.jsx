import { aspectsKey } from '../../lib/groupSpawns.js';
import { BUCKETS } from '../../lib/labels.js';
import { PixelIcon } from '../common/PixelIcon.jsx';
import { BucketChip } from './BucketChip.jsx';
import { SpawnTable } from './SpawnTable.jsx';
import { SpawnRowCard } from './SpawnRowCard.jsx';

// A <details> per form/aspect. Rendered as both a desktop SpawnTable and mobile
// SpawnRowCard list inside the same details body - article.css toggles which one shows.
//
// `open` is an *initial* value, not a controlled one: once mounted, the browser owns
// open/closed state natively (no onToggle handler fights it back). "Expand all" works by
// remounting every group with a new key rather than by tracking each group's state in
// React - simpler, and it does not fight the native toggle a keyboard or screen-reader user
// just performed.
export function SpawnGroup({ id, group, open }) {
  const aspectLine = aspectsKey(group.aspects) ? `aspect: ${aspectsKey(group.aspects)}` : 'no aspect';
  const present = new Set(group.rows.map((row) => row.bucket));
  const buckets = BUCKETS.map((bucket) => bucket.slug).filter((slug) => present.has(slug));

  return (
    <details id={id} className="spawn-group" open={open}>
      <summary className="spawn-group__summary">
        <span className="spawn-group__icon">
          <PixelIcon name="chevron-down" size={16} />
        </span>
        <span className="spawn-group__title">
          <span className="spawn-group__name">{group.label}</span>
          <span className="spawn-group__aspect">{aspectLine}</span>
        </span>
        <span className="spawn-group__chips">
          {buckets.map((bucket) => <BucketChip key={bucket} slug={bucket} />)}
        </span>
        <span className="spawn-group__count">{group.rows.length} row{group.rows.length === 1 ? '' : 's'}</span>
      </summary>

      <div className="spawn-group__table-wrap">
        <SpawnTable rows={group.rows} />
      </div>
      <div className="spawn-group__cards">
        {group.rows.map((row, index) => <SpawnRowCard row={row} key={index} />)}
      </div>
    </details>
  );
}
