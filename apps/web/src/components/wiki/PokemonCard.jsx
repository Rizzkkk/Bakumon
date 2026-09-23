import { Link } from 'react-router-dom';
import { Artwork } from '../common/Artwork.jsx';
import { BucketBadge } from './BucketBadge.jsx';
import { pokemonAlt } from '../../lib/altText.js';

export function PokemonCard({ pokemon }) {
  const { buckets, biomeCount, formCount } = pokemon.spawnSummary;

  return (
    <Link className="card" to={`/wiki/pokemon/${encodeURIComponent(pokemon.slug)}`}>
      {/* thumbUrl, never imageUrl. A 24-card page is 315 KB of thumbnails against 3.0 MB
          of originals - measured, pre-production.md item 25. */}
      <Artwork src={pokemon.thumbUrl} alt={pokemonAlt(pokemon.displayName)} />
      <span className="card__name">{pokemon.displayName}</span>
      {/* Seven species are spelled two ways and three pairs share a display name outright -
          Mime Jr., Mr. Mime, Mr. Rime. The slug is what tells the two cards apart, so it is
          shown rather than left to look like a duplicate. ADR 0006. */}
      <span className="card__meta mono">{pokemon.slug}</span>
      <span className="chips">
        {buckets.map((bucket) => <BucketBadge key={bucket} bucket={bucket} />)}
      </span>
      <span className="card__meta">
        {biomeCount} biome{biomeCount === 1 ? '' : 's'}
        {formCount > 1 ? ` - ${formCount} forms` : ''}
      </span>
    </Link>
  );
}
