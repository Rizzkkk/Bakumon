import { SCREENSHOTS } from '../../lib/screenshots.js';

// Renders nothing at all while there are no screenshots. Six grey placeholder tiles read
// as an unfinished site; an absent section reads as a site that simply does not have a
// gallery. pre-production.md item 7 records this as the intended design.
export function ScreenshotGrid() {
  if (!SCREENSHOTS.length) return null;

  return (
    <section className="stack">
      <h2 style={{ marginBottom: 0 }}>On the server</h2>
      <div className="grid grid--wide">
        {SCREENSHOTS.map((shot) => (
          <figure key={shot.src} className="shot">
            <img src={shot.src} alt={shot.alt} width={640} height={360} loading="lazy" decoding="async" />
            {shot.caption ? <figcaption className="card__meta">{shot.caption}</figcaption> : null}
          </figure>
        ))}
      </div>
    </section>
  );
}
