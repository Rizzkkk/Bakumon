import { Link, NavLink } from 'react-router-dom';
import { DISCORD_INVITE } from '../../lib/serverFacts.js';

export function Header() {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link className="wordmark" to="/">
          {/* The mark now has a real alpha channel, so it can sit on the header rather
              than on a rectangle of its own background. It is pixel art, hence the
              pixelated rendering - a smooth downscale turns the dragon to mush.
              alt is empty because the adjacent text already names the site; announcing
              "Bakumon" twice is worse than not announcing the image at all. */}
          <img className="wordmark__mark" src="/assets/brand/logo.webp" alt="" width={32} height={32} />
          <span>Bakumon</span>
        </Link>
        <nav aria-label="Main" className="chips" style={{ marginLeft: 'auto' }}>
          <NavLink className="chip" to="/wiki">Wiki</NavLink>
          <a className="chip" href={DISCORD_INVITE} rel="noreferrer noopener" target="_blank">Discord</a>
        </nav>
      </div>
    </header>
  );
}
