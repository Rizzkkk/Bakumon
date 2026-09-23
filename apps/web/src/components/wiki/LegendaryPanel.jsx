import { EVENT_PLAYER_THRESHOLD } from '../../lib/serverFacts.js';
import { EMPTY, levelRange } from '../../lib/labels.js';
import { PixelIcon } from '../common/PixelIcon.jsx';

// Replaces the spawn table entirely for a legendary species - there is no bucket flag, so
// "legendary" is derived at the call site from groupSpawns' events partition. All six real
// legendary-event rows (ho-oh among them, verify-web.js) carry the same shape: no level
// range (Level = Event in the workbook, null over the wire) and biomes = ["Any biome"], the
// literal phrase the workbook stores rather than a real biome list. Rendered as recorded
// rather than inventing a range or a biome tag the data does not have.
export function LegendaryPanel({ displayName, rows }) {
  const row = rows[0];
  const level = levelRange(row?.levelMin, row?.levelMax);
  const where = row?.biomes?.length ? row.biomes.join(', ') : EMPTY;

  return (
    <div className="legendary-panel">
      <div className="legendary-panel__label">
        <PixelIcon name="bucket-legendary" size={27} />
        <span>Legendary spawn</span>
      </div>
      <p className="legendary-panel__headline">{displayName} spawns at random.</p>
      <p className="legendary-panel__body">
        Legendaries are not part of Bakumon&rsquo;s regular spawn tables. They turn up at
        random, tied to {EVENT_PLAYER_THRESHOLD}+ players being online rather than a biome or
        a schedule, so keep a few Poke Balls on you.
      </p>
      <dl className="legendary-dl">
        <div className="legendary-dl__row">
          <dt>Timing</dt>
          <dd>At random</dd>
        </div>
        <div className="legendary-dl__row">
          <dt>Level</dt>
          <dd>{level === EMPTY ? 'Not recorded' : <span className="mono">{level}</span>}</dd>
        </div>
        <div className="legendary-dl__row">
          <dt>Where it can appear</dt>
          <dd>{where}</dd>
        </div>
      </dl>
    </div>
  );
}
