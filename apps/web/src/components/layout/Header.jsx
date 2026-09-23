import { useId, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { ThemeToggle } from '../common/ThemeToggle.jsx';
import { CtaButton } from '../common/CtaButton.jsx';
import { PixelIcon } from '../common/PixelIcon.jsx';
import { Drawer } from '../common/Drawer.jsx';
import { WikiDrawer } from '../wiki/WikiDrawer.jsx';

// Shared by the desktop search field and the mobile sub-bar's compact one - two copies
// already, and the third (a future filter-sheet search) is exactly the trigger conventions.md
// names for extracting.
function WikiSearchField({ id, className, placeholder }) {
  const [params] = useSearchParams();
  const [value, setValue] = useState(params.get('q') ?? '');
  const navigate = useNavigate();

  const onSubmit = (event) => {
    event.preventDefault();
    const next = new URLSearchParams(params);
    if (value) next.set('q', value);
    else next.delete('q');
    navigate(`/wiki?${next.toString()}`);
  };

  return (
    <form role="search" className={className} onSubmit={onSubmit}>
      <label htmlFor={id} className="visually-hidden">Search the wiki</label>
      <span className="site-header__search-icon" aria-hidden="true">
        <PixelIcon name="search" size={20} />
      </span>
      <input
        id={id}
        type="search"
        className="site-header__search-input"
        placeholder={placeholder}
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
    </form>
  );
}

export function Header() {
  const location = useLocation();
  const onWikiRoute = location.pathname.startsWith('/wiki');
  const [siteMenuOpen, setSiteMenuOpen] = useState(false);
  const [wikiMenuOpen, setWikiMenuOpen] = useState(false);
  const desktopSearchId = useId();
  const mobileSearchId = useId();

  return (
    <header className="site-header">
      <div className="site-header__bar">
        <Link className="site-header__brand" to="/">
          {/* alt is empty: the adjacent wordmark already names the site, and announcing
              "Bakumon" twice is worse than not announcing the image at all. */}
          <img
            className="site-header__logo"
            src="/assets/brand/logo-transparent.png"
            alt=""
            width={44}
            height={44}
          />
          <span className="site-header__wordmark">Bakumon</span>
        </Link>

        <nav aria-label="Main" className="site-header__nav">
          {/* No `end`: any /wiki/* route should read as "on the Wiki tab", matching how
              wiki-home-d-light.html underlines Wiki from every wiki screen, not just the
              exact index. */}
          <NavLink to="/wiki" className="site-header__navlink">
            <PixelIcon name="wiki" size={20} />
            Wiki
          </NavLink>
        </nav>

        {onWikiRoute ? (
          <WikiSearchField
            id={desktopSearchId}
            className="site-header__search"
            placeholder="Search Pokemon and items"
          />
        ) : null}

        <div className="site-header__actions">
          <ThemeToggle />
          <span className="site-header__desktop-only">
            <CtaButton />
          </span>
          <button
            type="button"
            className="icon-button site-header__mobile-only"
            aria-label="Open site menu"
            onClick={() => setSiteMenuOpen(true)}
          >
            <PixelIcon name="menu" size={20} />
          </button>
        </div>
      </div>

      {onWikiRoute ? (
        <div className="site-header__subbar">
          <button
            type="button"
            className="site-header__wiki-menu"
            onClick={() => setWikiMenuOpen(true)}
          >
            <PixelIcon name="wiki" size={20} />
            Wiki menu
          </button>
          <WikiSearchField id={mobileSearchId} className="site-header__search-field" placeholder="Search" />
        </div>
      ) : null}

      <Drawer
        open={siteMenuOpen}
        onClose={() => setSiteMenuOpen(false)}
        titleId="site-menu-title"
        title="Bakumon"
        closeLabel="Close site menu"
        icon={<PixelIcon name="wiki" size={20} />}
      >
        {/* No artboard for this drawer - ADR 0010 records that it deliberately mirrors the
            wiki drawer's shell rather than inventing its own layout. */}
        <nav aria-label="Main" className="wiki-nav">
          <ul className="wiki-nav__list">
            <li>
              <NavLink to="/wiki" className="wiki-nav__item" onClick={() => setSiteMenuOpen(false)}>
                Wiki
              </NavLink>
            </li>
          </ul>
          <div style={{ padding: '16px 10px 0' }}>
            <CtaButton />
          </div>
        </nav>
      </Drawer>

      <WikiDrawer open={wikiMenuOpen} onClose={() => setWikiMenuOpen(false)} />
    </header>
  );
}
