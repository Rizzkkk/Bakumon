import { Link } from 'react-router-dom';
import { PixelIcon } from '../common/PixelIcon.jsx';
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
