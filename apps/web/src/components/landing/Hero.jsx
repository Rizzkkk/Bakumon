import { CtaButton } from '../common/CtaButton.jsx';
import { GrassSkyline } from './GrassSkyline.jsx';

// landing-d-light.html's right slot holds the logo alone. This deliberately departs from
// that: the isometric character render is the server owner's own Minecraft skin and does
// not appear anywhere else on the site, so it earns the more prominent spot next to the
// logo rather than being left out. ADR 0010.
export function Hero() {
  return (
    <>
      <section className="hero">
        <div className="hero__inner">
          <div className="hero__copy">
            <img
              className="hero__wordmark"
              src="/assets/brand/wordmark.png"
              alt="Bakumon SMP"
              width={620}
              height={207}
            />
            <h1 className="hero__title">A safe, friendly Cobblemon server.</h1>
            <p className="hero__lede">
              Catch, trade and explore with people who look out for each other. Legendaries
              turn up at random, so any trip out could be the one.
            </p>
            <div className="hero__cta">
              <CtaButton size={60} />
            </div>
          </div>

          <div className="hero__figure">
            <picture>
              <source
                type="image/webp"
                srcSet="/assets/brand/character-320.webp 320w, /assets/brand/character-480.webp 420w"
                sizes="(max-width: 767px) 220px, 240px"
              />
              <img
                className="hero__character"
                src="/assets/brand/character.png"
                width={420}
                height={790}
                alt="An isometric render of the Bakumon server owner's Minecraft character"
              />
            </picture>
            {/* alt="": decorative next to the character here, and already named by the
                header and footer marks that appear on every page. */}
            <img className="hero__logo" src="/assets/brand/logo-1267.png" alt="" width={1267} height={1241} />
          </div>
        </div>
      </section>
      <GrassSkyline />
      <div className="skyline__moss" aria-hidden="true" />
    </>
  );
}
