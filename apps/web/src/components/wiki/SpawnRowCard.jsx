import { BucketBadge } from './BucketBadge.jsx';
import { BiomeLabel } from './BiomeLabel.jsx';
import { EMPTY, levelRange, numberOrEmpty } from '../../lib/labels.js';

const isTagToken = (token) => token?.startsWith('#') ?? false;

// Mobile equivalent of one SpawnTable row: a header line (bucket chip + weight/level), then
// a Context/Biomes/Conditions <dl>. One card per spawn row inside a group's cards list.
export function SpawnRowCard({ row }) {
  return (
    <div className="spawn-row-card">
      <div className="spawn-row-card__head">
        {row.bucket ? <BucketBadge bucket={row.bucket} /> : EMPTY}
        <span className="spawn-row-card__meta">
          weight <strong>{numberOrEmpty(row.weight)}</strong> &middot; Lv <strong>{levelRange(row.levelMin, row.levelMax)}</strong>
        </span>
      </div>
      <dl className="spawn-row-card__dl">
        <dt>Context</dt>
        <dd>{row.context ?? EMPTY}</dd>
        <dt>Biomes</dt>
        <dd>
          {row.biomes?.length ? (
            <div className="biome-stack">
              {row.biomes.map((token, index) => (
                <span className="biome-pill" key={`${token}-${index}`}>
                  <BiomeLabel token={token} isTag={isTagToken(token)} />
                </span>
              ))}
            </div>
          ) : EMPTY}
        </dd>
        <dt>Conditions</dt>
        <dd>{row.conditions || EMPTY}</dd>
      </dl>
    </div>
  );
}
