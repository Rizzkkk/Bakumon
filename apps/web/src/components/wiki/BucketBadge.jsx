import { bucketMeta } from '../../lib/labels.js';

export function BucketBadge({ bucket }) {
  const meta = bucketMeta(bucket);
  return <span className="badge" style={{ color: meta.token }}>{meta.label}</span>;
}
