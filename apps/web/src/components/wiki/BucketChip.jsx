import { bucketChipMeta } from '../../lib/labels.js';
import { PixelIcon } from '../common/PixelIcon.jsx';

// Ultra-rare gets the double frame from tokens-board.html so it reads at least as
// prominent as rare without relying on size or colour alone (ADR 0010). Every other
// bucket gets a single inset ring.
export function BucketChip({ slug }) {
  const chip = bucketChipMeta(slug);
  const t = chip.tokenSlug;

  const boxShadow = t === 'ultra'
    ? `inset 0 0 0 2px var(--t-${t}-bg), inset 0 0 0 3px var(--t-${t}-edge), 0 0 0 2px var(--t-${t}-bg)`
    : `inset 0 0 0 2px var(--t-${t}-edge)`;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        height: 24,
        padding: '0 9px 0 7px',
        boxSizing: 'border-box',
        background: `var(--t-${t}-bg)`,
        color: `var(--t-${t}-fg)`,
        boxShadow,
        margin: t === 'ultra' ? 2 : 0,
        fontFamily: 'var(--font-display)',
        fontWeight: 600,
        fontSize: 13,
        lineHeight: 1,
        letterSpacing: '0.02em',
        whiteSpace: 'nowrap',
      }}
    >
      <PixelIcon name={chip.icon} size={14} />
      {chip.label}
    </span>
  );
}
