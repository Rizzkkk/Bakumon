import { Link } from 'react-router-dom';
import { Attribution } from './Attribution.jsx';

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <ul className="footer-nav">
          <li><Link to="/wiki">Wiki</Link></li>
          <li><Link to="/privacy-policy">Privacy</Link></li>
          <li><Link to="/terms-of-service">Terms</Link></li>
        </ul>
        <Attribution />
      </div>
    </footer>
  );
}
