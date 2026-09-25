import { Link } from 'react-router-dom';
import { PixelIcon } from '../common/PixelIcon.jsx';
import { WallBreakCharacter } from '../common/WallBreakCharacter.jsx';
import { DISCORD_INVITE } from '../../lib/serverFacts.js';

const FEATURES = [
  {
    icon: <PixelIcon name="shield" size={20} />,
    badge: 'brand',
    title: 'A safe place to play',
    body: 'Bakumon is built to be friendly and welcoming. Everyone is welcome here, and the rules in our Discord keep it that way.',
    href: DISCORD_INVITE,
    external: true,
    linkText: 'Read the rules in Discord',
  },
  {
    icon: <PixelIcon name="check" size={20} />,
    badge: 'legendary',
    title: 'Your build and your team stay yours',
    body: 'Claim your land and nobody else can touch it. No stealing, no griefing, and no PvP unless both players agree. The admins play here too, and they enforce it.',
    href: DISCORD_INVITE,
    external: true,
    linkText: 'Ask an admin in Discord',
  },
  {
    icon: <PixelIcon name="wiki" size={20} />,
    badge: 'muted',
    title: 'A wiki for everything here',
    body: 'Look up any Pokemon or item before you head out. Where they spawn, how rare they are, what they evolve with.',
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
      {/* Last child, and absolutely positioned into the page margin beside the cards, so
          the grid keeps the width it would have without it. */}
      <WallBreakCharacter className="feature-section__aside" />
    </section>
  );
}
