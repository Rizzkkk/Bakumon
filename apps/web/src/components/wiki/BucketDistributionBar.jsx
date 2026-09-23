import { bucketChipMeta } from '../../lib/labels.js';

// One <span> per spawn row, coloured by bucket. The bar itself is aria-hidden - it repeats
// what the label above it already says in one glance for sighted users - so the counts are
// spelled out in a visually-hidden sentence for anyone using a screen reader.
export function BucketDistributionBar({ rows, label }) {
  const counts = new Map();
  for (const row of rows) counts.set(row.bucket, (counts.get(row.bucket) ?? 0) + 1);

  const summary = [...counts.entries()]
    .map(([bucket, count]) => `${count} ${bucketChipMeta(bucket).label.toLowerCase()}`)
    .join(', ');

  return (
    <div>
      <div className="spawn-toolbar__label">{label}</div>
      <div className="spawn-distribution" aria-hidden="true">
        {rows.map((row, index) => {
          const chip = bucketChipMeta(row.bucket);
          return (
            <span
              key={index}
              className="spawn-distribution__cell"
              style={{ background: `var(--t-${chip.tokenSlug}-bg)`, boxShadow: `inset 0 0 0 2px var(--t-${chip.tokenSlug}-edge)` }}
            />
          );
        })}
      </div>
      <p className="visually-hidden">{rows.length} spawn rows: {summary}.</p>
    </div>
  );
}
