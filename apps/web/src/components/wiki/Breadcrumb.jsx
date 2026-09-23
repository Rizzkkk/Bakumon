import { Link } from 'react-router-dom';
import { PixelIcon } from '../common/PixelIcon.jsx';

// `items`: [{ label, to }] for every crumb but the last, which is passed as plain text and
// carries aria-current="page" rather than a link to itself.
export function Breadcrumb({ items = [], current }) {
  return (
    <nav aria-label="Breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15 }}>
      {items.map((item) => (
        <span key={item.to} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link to={item.to}>{item.label}</Link>
          <PixelIcon name="chevron-right" size={12} />
        </span>
      ))}
      <span aria-current="page" style={{ color: 'var(--text)' }}>{current}</span>
    </nav>
  );
}
