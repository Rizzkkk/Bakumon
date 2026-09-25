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
      {/* imageUrl, not a thumbnail, and not for the reason this comment used to give. The
          thumbnails do save: 639 B against 1364 B, so 15 KB a page against 33 KB. They are
          not served because they are 128px upscales, and 739 of the 744 source textures are
          16x16 or 32x32 - exactly 6x or 3x at this size, which is what makes `pixelated`
          render clean blocks. Coming from 128px instead is a 0.75x downscale of
          already-blocked pixels and the block widths go uneven. Measured 2026-09-24. */}
      <Artwork src={item.imageUrl} alt={itemAlt(item.name)} size={96} pixel />
      <div className="index-row__body">
        <Link className="index-row__name" to={`/wiki/items/${encodeURIComponent(item.itemId)}`}>
          <ItemName name={item.name} />
        </Link>
        <span className="index-row__meta">{sourceCategoryLabel(item.sourceCategory)}</span>
      </div>
    </li>
  );
}
