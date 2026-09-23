import { biomeLabel } from '../../lib/labels.js';
import { PixelIcon } from '../common/PixelIcon.jsx';

// Group icon + derived friendly name, with the raw token underneath in small mono and
// again in `title` - a visitor who already knows the Cobblemon tag names can still find
// the row by the string they recognise.
export function BiomeLabel({ token, isTag }) {
  const friendly = biomeLabel(token, isTag);

  return (
    <span title={token} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <PixelIcon name={isTag ? 'biome-group' : 'biome-single'} size={isTag ? 18 : 16} />
      <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.3 }}>
        <span>{friendly}</span>
        <span className="mono" style={{ fontSize: '0.78em', color: 'var(--faint)' }}>{token}</span>
      </span>
    </span>
  );
}
