import { CtaButton } from '../common/CtaButton.jsx';

// landing-d-light.html / landing-m-dark.html's second CTA band: the server address, the
// version and how to join all live in Discord rather than on this page, so they can change
// without a site deploy going stale (ADR "one call to action site-wide").
export function DiscordCTA() {
  return (
    <section className="cta-band">
      <div className="cta-band__inner">
        <div className="cta-band__copy">
          <h2 className="cta-band__title">The server address lives in Discord</h2>
          <p className="cta-band__body">
            The version, the rules and the joining steps are all there too. Say hello and
            someone will help you get in.
          </p>
        </div>
        <CtaButton size={60} />
      </div>
    </section>
  );
}
