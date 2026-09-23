import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useResource } from '../hooks/useResource.js';
import { usePageTitle } from '../hooks/usePageTitle.js';
import { getPokemon } from '../api/endpoints.js';
import { groupSpawns } from '../lib/groupSpawns.js';
import { pokemonAlt } from '../lib/altText.js';
import { Artwork } from '../components/common/Artwork.jsx';
import { ErrorState } from '../components/common/ErrorState.jsx';
import { EmptyState } from '../components/common/EmptyState.jsx';
import { SpawnTable } from '../components/wiki/SpawnTable.jsx';
import { EventSpawnPanel } from '../components/wiki/EventSpawnPanel.jsx';

export default function PokemonDetail() {
  const { slug } = useParams();
  const { status, data, error } = useResource((signal) => getPokemon(slug, { signal }), [slug]);

  usePageTitle(data?.displayName);

  const { groups, events } = useMemo(() => groupSpawns(data?.spawns ?? []), [data]);

  if (status === 'error') return <div className="page"><ErrorState error={error} /></div>;
  if (!data) return <div className="page"><p role="status">Loading...</p></div>;

  return (
    <div className="page stack">
      <p className="card__meta"><Link to="/wiki">Back to the wiki</Link></p>

      <header className="stack">
        <div style={{ maxWidth: 280 }}>
          {/* The detail hero uses the full-size artwork rather than the thumbnail: one
              image on one page, where the grid's 24-at-a-time budget does not apply. */}
          <Artwork src={data.imageUrl} alt={pokemonAlt(data.displayName)} size={475} />
        </div>
        <h1 style={{ margin: 0 }}>{data.displayName}</h1>
        <p className="card__meta mono" style={{ margin: 0 }}>
          {data.slug}
          {data.nationalDexId ? ` - national dex #${data.nationalDexId}` : ''}
        </p>
      </header>

      {groups.length ? (
        <section className="stack">
          <h2 style={{ marginBottom: 0 }}>Spawns</h2>
          <SpawnTable groups={groups} />
        </section>
      ) : null}

      {events.length ? <EventSpawnPanel rows={events} /> : null}

      {!groups.length && !events.length ? (
        <EmptyState
          title="No spawn data"
          detail="The workbook records no spawn rules for this Pokemon."
        />
      ) : null}
    </div>
  );
}
