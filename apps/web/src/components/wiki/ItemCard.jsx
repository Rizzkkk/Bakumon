import { Link } from 'react-router-dom';
import { Artwork } from '../common/Artwork.jsx';
import { ItemName } from '../common/ItemName.jsx';
import { itemAlt } from '../../lib/altText.js';
import { sourceCategoryLabel } from '../../lib/labels.js';

export function ItemCard({ item }) {
  return (
    <Link className="card" to={`/wiki/items/${encodeURIComponent(item.itemId)}`}>
      {/* imageUrl, not a thumbnail: item art is 16x16 game texture averaging 1.4 KB, so a
          24-card page is 33 KB and a thumbnail would save nothing worth a migration. */}
      <Artwork src={item.imageUrl} alt={itemAlt(item.name)} size={128} pixel />
      <span className="card__name"><ItemName name={item.name} /></span>
      <span className="card__meta">{sourceCategoryLabel(item.sourceCategory)}</span>
    </Link>
  );
}
