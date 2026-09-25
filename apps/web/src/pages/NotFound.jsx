import { useId, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useHead } from '../hooks/useHead.js';
import { PixelIcon } from '../components/common/PixelIcon.jsx';

export default function NotFound() {
  // A 404 is the one page that should never be indexed, so it says so. The status code
  // itself is the server's job (06-deployment/runbook.md); this is the client half.
  useHead({
    title: 'Page Not Found - Bakumon Wiki',
    description: 'That page does not exist on the Bakumon wiki.',
    noindex: true,
  });

  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const searchId = useId();

  const onSubmit = (event) => {
    event.preventDefault();
    const params = query ? `?q=${encodeURIComponent(query)}` : '';
    navigate(`/wiki/pokemon${params}`);
  };

  return (
    <div className="page not-found">
      <img
        className="not-found__mark"
        src="/assets/brand/logo-1267.png"
        alt=""
        width={260}
        height={255}
      />
      <div className="not-found__body">
        <span className="not-found__label mono">404</span>
        <h1 className="not-found__title">Nothing spawns at this address.</h1>
        <p className="not-found__lede">
          The page may have moved, or the link has a typo. Search the wiki instead, or head
          back to the start.
        </p>

        <form role="search" className="not-found__search" onSubmit={onSubmit}>
          <label htmlFor={searchId} className="not-found__search-label">Search Pokemon</label>
          <div className="not-found__search-field">
            <span className="not-found__search-icon" aria-hidden="true">
              <PixelIcon name="search" size={20} />
            </span>
            <input
              id={searchId}
              type="search"
              className="not-found__search-input"
              placeholder="Name, e.g. Ditto"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        </form>

        <nav aria-label="Recovery links" className="not-found__links">
          <Link to="/">Home</Link>
          <Link to="/wiki/pokemon">All Pokemon</Link>
          <Link to="/wiki/items">All items</Link>
        </nav>
      </div>
    </div>
  );
}
