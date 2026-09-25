import { Link } from 'react-router-dom';
import { PixelIcon } from '../common/PixelIcon.jsx';
import { useJsonLd } from '../../hooks/useHead.js';
import { absoluteUrl } from '../../lib/site.js';

// `items`: [{ label, to }] for every crumb but the last, which is passed as plain text and
// carries aria-current="page" rather than a link to itself.
export function Breadcrumb({ items = [], current }) {
  /*
   * The BreadcrumbList is built from the same `items` the nav renders, so the trail a
   * crawler is told about and the trail a reader can see are one thing rather than two
   * that drift. The last crumb is included without an `item` URL, which is what schema.org
   * asks for on the page you are already on.
   *
   * Null until the origin is known - every position needs an absolute URL, and a trail of
   * relative ones is not valid structured data.
   */
  const crumbs = absoluteUrl('/') ? [...items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.label,
    item: absoluteUrl(item.to),
  })), { '@type': 'ListItem', position: items.length + 1, name: String(current ?? '') }] : null;

  useJsonLd(crumbs && { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: crumbs });

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
