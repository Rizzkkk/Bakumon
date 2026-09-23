import { EVENT_PLAYER_THRESHOLD } from '../../lib/serverFacts.js';
import { SpawnTable } from './SpawnTable.jsx';

// The six 'legendary event' rows do not spawn naturally, so they get their own panel
// rather than sitting in the same table as rows that do. Putting them in the spawn table
// would tell a player to go look in a biome for something that will never appear there.
// Source: the workbook's prose notes, ground-truth/01-data/server-notes.md.
export function EventSpawnPanel({ rows }) {
  return (
    <section className="stack">
      <h2 style={{ marginBottom: 0 }}>Event spawns</h2>
      <div className="panel stack">
        <p style={{ margin: 0 }}>
          This Pokemon does not spawn naturally. It appears through Pebble Spawn Events,
          which currently require {EVENT_PLAYER_THRESHOLD} players online. Event timing is
          configured separately on the server.
        </p>
        <SpawnTable groups={[{ key: 'event', label: 'Event', rows }]} />
      </div>
    </section>
  );
}
