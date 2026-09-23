import { Link } from 'react-router-dom';
import { Artwork } from '../common/Artwork.jsx';
import { BucketChip } from './BucketChip.jsx';
import { pokemonAlt } from '../../lib/altText.js';

// pokemon-index-m-light.html's list row - one <li> per species, mobile only (the desktop
// index-*.jsx pages render the same fields into a <table> row instead).
export function PokemonCard({ pokemon }) {
  const { buckets, biomeCount, formCount } = pokemon.spawnSummary;

  return (
    <li className="index-row">
      {/* thumbUrl, never imageUrl. A 24-row page is 315 KB of thumbnails against 3.0 MB of
          originals - measured, pre-production.md item 25. */}
      <Artwork src={pokemon.thumbUrl} alt={pokemonAlt(pokemon.displayName)} size={96} />
      <div className="index-row__body">
        <Link className="index-row__name" to={`/wiki/pokemon/${encodeURIComponent(pokemon.slug)}`}>
          {pokemon.displayName}
        </Link>
        {/* Seven species are spelled two ways and three pairs share a display name outright -
            Mime Jr., Mr. Mime, Mr. Rime. The slug is what tells the two rows apart. ADR 0006. */}
        <span className="mono index-row__slug">{pokemon.slug}</span>
        <span className="chips">
          {buckets.map((bucket) => <BucketChip key={bucket} slug={bucket} />)}
        </span>
        <span className="index-row__meta">
          {biomeCount} biome{biomeCount === 1 ? '' : 's'}
          {formCount > 1 ? ` – ${formCount} forms` : ''}
        </span>
      </div>
    </li>
  );
}
