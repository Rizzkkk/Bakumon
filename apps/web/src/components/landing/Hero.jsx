import { CtaButton } from '../common/CtaButton.jsx';
import { GrassSkyline } from './GrassSkyline.jsx';

// The right slot holds the logo alone, as landing-d-light.html always had it. The
// character render that briefly sat here moved to the feature section (ADR 0011) - one
// render of it on the page, not two.
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
            {/* A real alt rather than the empty one it carried beside the character: this
                is now the only image in the slot, and it is the kit's own description. */}
            <img
              className="hero__logo"
              src="/assets/brand/logo-1267.png"
              alt="Bakumon logo: a pixel-art black dragon coiled around a red and white Poke Ball"
              width={1267}
              height={1241}
            />
          </div>
        </div>
      </section>
      <GrassSkyline />
      <div className="skyline__moss" aria-hidden="true" />
    </>
  );
}
