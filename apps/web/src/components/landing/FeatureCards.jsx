import { Link } from 'react-router-dom';
import { PixelIcon } from '../common/PixelIcon.jsx';
import { DISCORD_INVITE } from '../../lib/serverFacts.js';

// Shield glyph from landing-d-light.html's first feature card. Not one of PixelIcon's
// glyphs (common/PixelIcon.jsx is out of scope here), so it is inlined once rather than
// adding a name to a file this phase does not own.
function ShieldIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 10 10" fill="currentColor" shapeRendering="crispEdges" aria-hidden="true" style={{ flexShrink: 0, display: 'block' }}>
      <rect x="0" y="0" width="10" height="1" />
      <rect x="0" y="1" width="1" height="1" /><rect x="9" y="1" width="1" height="1" />
      <rect x="0" y="2" width="1" height="1" /><rect x="2" y="2" width="6" height="1" /><rect x="9" y="2" width="1" height="1" />
      <rect x="0" y="3" width="1" height="1" /><rect x="2" y="3" width="6" height="1" /><rect x="9" y="3" width="1" height="1" />
      <rect x="0" y="4" width="1" height="1" /><rect x="2" y="4" width="6" height="1" /><rect x="9" y="4" width="1" height="1" />
      <rect x="1" y="5" width="1" height="1" /><rect x="3" y="5" width="4" height="1" /><rect x="8" y="5" width="1" height="1" />
      <rect x="1" y="6" width="1" height="1" /><rect x="3" y="6" width="4" height="1" /><rect x="8" y="6" width="1" height="1" />
      <rect x="2" y="7" width="1" height="1" /><rect x="4" y="7" width="2" height="1" /><rect x="7" y="7" width="1" height="1" />
      <rect x="3" y="8" width="1" height="1" /><rect x="6" y="8" width="1" height="1" />
      <rect x="4" y="9" width="2" height="1" />
    </svg>
  );
}

const FEATURES = [
  {
    icon: <ShieldIcon />,
    badge: 'brand',
    title: 'A safe place to play',
    body: 'Bakumon is built to be friendly and welcoming. Everyone is welcome here, and the rules in our Discord keep it that way.',
    href: DISCORD_INVITE,
    external: true,
    linkText: 'Read the rules in Discord',
  },
  {
    icon: <PixelIcon name="bucket-legendary" size={27} width={27} height={21} />,
    badge: 'legendary',
    title: 'Legendaries spawn at random',
    body: 'No schedules and no player counts to wait for. A legendary can turn up at any time, so keep a few Poke Balls on you.',
    href: '/wiki/pokemon',
    linkText: 'See the legendaries',
  },
  {
    icon: <PixelIcon name="wiki" size={20} />,
    badge: 'muted',
    title: 'A wiki for everything here',
    body: 'Look up any Pokemon or item on the server before you head out: where they spawn, how rare they are, what they evolve with.',
    href: '/wiki',
    linkText: 'Open the wiki',
  },
];

export function FeatureCards() {
  return (
    <section className="page feature-section">
      <h2 className="feature-section__title">What to expect on Bakumon</h2>
      <div className="feature-grid">
        {FEATURES.map((feature) => (
          <article key={feature.title} className="feature-card">
            <span className={`feature-card__icon feature-card__icon--${feature.badge}`}>{feature.icon}</span>
            <h3 className="feature-card__title">{feature.title}</h3>
            <p className="feature-card__body">{feature.body}</p>
            {feature.external ? (
              <a className="feature-card__link" href={feature.href} rel="noreferrer noopener" target="_blank">
                {feature.linkText}
                <PixelIcon name="arrow-right" size={20} />
              </a>
            ) : (
              <Link className="feature-card__link" to={feature.href}>
                {feature.linkText}
                <PixelIcon name="arrow-right" size={20} />
              </Link>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
