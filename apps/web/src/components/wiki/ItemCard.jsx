import { Link } from 'react-router-dom';
import { Artwork } from '../common/Artwork.jsx';
import { ItemName } from '../common/ItemName.jsx';
import { itemAlt } from '../../lib/altText.js';
import { sourceCategoryLabel } from '../../lib/labels.js';

// items-index-m-light.html's list row - one <li> per item, mobile only (the desktop
// ItemsIndex page renders the same fields into a <table> row instead).
export function ItemCard({ item }) {
  return (
    <li className="index-row">
      {/* imageUrl, not a thumbnail: item art is a 16x16 game texture averaging 1.4 KB, so a
          24-row page is 33 KB and a thumbnail would save nothing worth a migration. */}
      <Artwork src={item.imageUrl} alt={itemAlt(item.name)} size={44} pixel />
      <div className="index-row__body">
        <Link className="index-row__name" to={`/wiki/items/${encodeURIComponent(item.itemId)}`}>
          <ItemName name={item.name} />
        </Link>
        <span className="index-row__meta">{sourceCategoryLabel(item.sourceCategory)}</span>
      </div>
    </li>
  );
}
