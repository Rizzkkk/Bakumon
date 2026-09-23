import { DISCORD_INVITE } from '../../lib/serverFacts.js';

// The banner already carries the BAKUMON wordmark, so the page does not repeat it as
// heading text beside the image. The h1 is still present and still says the name, for the
// search engine and the screen reader; it is visually hidden because rendering it would be
// the same word twice, once enormous.
export function Hero() {
  return (
    <section className="hero">
      <h1 className="visually-hidden">Bakumon</h1>

      {/* srcset because this is the largest thing on the page and decides mobile load
          time. A 375px phone takes the 768px encode, 85 KB rather than 258 KB. The PNG
          original is 2.2 MB and is deliberately not served. */}
      <img
        className="hero__image"
        src="/assets/brand/banner-1280.webp"
        srcSet="/assets/brand/banner-768.webp 768w, /assets/brand/banner-1280.webp 1280w, /assets/brand/banner-1672.webp 1672w"
        sizes="100vw"
        width={1672}
        height={941}
        alt="Bakumon - Pokemon gathered around a campfire in a Minecraft landscape"
        fetchPriority="high"
      />

      <div className="hero__body">
        <p className="hero__tagline">
          A Cobblemon server with a rebalanced spawn table, and a wiki that documents
          every bit of it.
        </p>

        {/* The single call to action, not one of several. Everything else about the
            server - address, versions, modpack, how to join - lives in Discord, where it
            can change without a site deploy going stale. Decided 2026-09-17. */}
        <p className="hero__actions">
          <a className="button button--primary" href={DISCORD_INVITE} rel="noreferrer noopener" target="_blank">
            Join the Discord
          </a>
          <a className="button" href="/wiki">Browse the wiki</a>
        </p>
      </div>
    </section>
  );
}
