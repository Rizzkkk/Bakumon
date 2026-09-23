import { DISCORD_INVITE } from '../../lib/serverFacts.js';
import { PixelIcon } from './PixelIcon.jsx';

// The three sizes the kit actually uses: 44 in the header, 52 on the mobile sticky bar,
// 60 in the hero. Anything else is a new artboard, not a new prop value.
const SIZES = {
  44: { padding: '0 16px', fontSize: 16, icon: { width: 12, height: 10, viewBox: '0 0 12 10' } },
  52: { padding: '0 22px', fontSize: 19, icon: { width: 24, height: 20, viewBox: '0 0 12 10' } },
  60: { padding: '0 28px', fontSize: 22, icon: { width: 24, height: 20, viewBox: '0 0 12 10' } },
};

// The one call to action site-wide (DESIGN-HANDOFF.md). External by construction, so the
// rel is set here rather than trusted to every call site.
export function CtaButton({ size = 44, children = 'Join the Discord', style, ...rest }) {
  const scale = SIZES[size] ?? SIZES[44];

  return (
    <a
      className="cta"
      href={DISCORD_INVITE}
      rel="noopener noreferrer"
      target="_blank"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 12,
        height: size,
        padding: scale.padding,
        boxSizing: 'border-box',
        background: 'var(--cta)',
        color: 'var(--cta-text)',
        border: '2px solid var(--cta-edge)',
        boxShadow: '4px 4px 0 var(--cta-shadow)',
        fontFamily: 'var(--font-display)',
        fontWeight: 700,
        fontSize: scale.fontSize,
        lineHeight: 1,
        textDecoration: 'none',
        whiteSpace: 'nowrap',
        ...style,
      }}
      {...rest}
    >
      <PixelIcon name="discord" size={scale.icon.width} width={scale.icon.width} height={scale.icon.height} />
      <span>{children}</span>
    </a>
  );
}
