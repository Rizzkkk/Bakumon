import { useHead } from '../hooks/useHead.js';
import { SITE_URL } from '../lib/site.js';
import { Hero } from '../components/landing/Hero.jsx';
import { FeatureCards } from '../components/landing/FeatureCards.jsx';
import { DiscordCTA } from '../components/landing/DiscordCTA.jsx';
import { MobileCtaBar } from '../components/landing/MobileCtaBar.jsx';

export default function Landing() {
  /*
   * The landing page and /wiki used to emit the identical title, which is the one case
   * where two routes competing for the same query actively hurts. This one leads on what
   * someone searching would type - a Cobblemon server - and leaves "wiki" to /wiki.
   *
   * SearchAction is only declared when the origin is known, because the template has to be
   * an absolute URL. Declaring a search endpoint that resolves to nothing is worse than
   * declaring none.
   */
  useHead({
    title: 'Bakumon - Friendly Cobblemon Minecraft Server',
    description: 'A safe, friendly Cobblemon Minecraft server. Claim your land, keep what '
      + 'you build, and look up every Pokemon spawn and item on the community wiki.',
    jsonLd: SITE_URL ? {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Bakumon',
      url: `${SITE_URL}/`,
      potentialAction: {
        '@type': 'SearchAction',
        target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/wiki/pokemon?q={search_term_string}` },
        'query-input': 'required name=search_term_string',
      },
    } : undefined,
  });

  // No API call anywhere on this page - it must render completely with the API down.
  return (
    <>
      <Hero />
      <FeatureCards />
      <DiscordCTA />
      <MobileCtaBar />
    </>
  );
}
