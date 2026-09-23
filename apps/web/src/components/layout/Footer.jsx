import { Link } from 'react-router-dom';
import { Attribution } from './Attribution.jsx';

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__notices">
          <div className="site-footer__brand-mark">
            <img
              className="site-footer__logo"
              src="/assets/brand/logo-transparent.png"
              alt=""
              width={28}
              height={28}
            />
            <span className="site-footer__wordmark">Bakumon</span>
          </div>
          <p>
            Bakumon is a fan-run Minecraft server. It is not affiliated with, endorsed by, or
            sponsored by Cobblemon, The Pokemon Company, Nintendo, or Mojang. Pokemon and
            Minecraft names and artwork belong to their owners.
          </p>
          {/* Licence-mandated, not decorative - see Attribution.jsx's own header comment. */}
          <Attribution />
        </div>

        <div className="site-footer__meta">
          <ul className="footer-nav">
            <li><Link to="/wiki">Wiki</Link></li>
            <li><Link to="/privacy-policy">Privacy</Link></li>
            <li><Link to="/terms-of-service">Terms</Link></li>
          </ul>
          <p>No accounts. No tracking.</p>
        </div>
      </div>
    </footer>
  );
}
