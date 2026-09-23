import { NavLink } from 'react-router-dom';
import { useResource } from '../../hooks/useResource.js';
import { listPokemon, listItems } from '../../api/endpoints.js';
import { BUCKETS, SOURCE_CATEGORIES, bucketChipMeta } from '../../lib/labels.js';
import { PixelIcon } from '../common/PixelIcon.jsx';

// pageSize=1 is the cheapest request that still returns `total` - the sidebar needs the
// count, not the row.
function useWikiTotals() {
  const pokemon = useResource((signal) => listPokemon({ pageSize: 1 }, { signal }), []);
  const items = useResource((signal) => listItems({ pageSize: 1 }, { signal }), []);
  return { pokemonTotal: pokemon.data?.total, itemsTotal: items.data?.total };
}

const HELP_LINKS = [
  // Absolute, not bare fragments: these render in the sidebar on every wiki page, and a
  // bare "#reading-spawn-rows" on an item page scrolls to nothing.
  { label: 'Reading spawn rows', href: '/wiki#reading-spawn-rows' },
  { label: 'Biome groups explained', href: '/wiki#biome-groups-explained' },
];

// Rendered into both WikiSidebar (desktop) and WikiDrawer (mobile) - one nav, two shells,
// per the Phase 2 brief. The 904/934 counts shown in the artboards are illustrative; this
// fetches the real ones and shows a neutral placeholder until they arrive.
export function WikiNav() {
  const { pokemonTotal, itemsTotal } = useWikiTotals();

  return (
    <nav aria-label="Wiki" className="wiki-nav">
      <div className="wiki-nav__group">
        <h2 className="wiki-nav__heading">Wiki</h2>
        <ul className="wiki-nav__list">
          <li>
            <NavLink to="/wiki" end className="wiki-nav__item">
              <span>Main page</span>
            </NavLink>
          </li>
        </ul>
      </div>

      <div className="wiki-nav__group">
        <h2 className="wiki-nav__heading">Pokemon</h2>
        <ul className="wiki-nav__list">
          <li>
            <NavLink to="/wiki/pokemon" end className="wiki-nav__item">
              <span>All Pokemon</span>
              <span className="wiki-nav__count">{pokemonTotal ?? '…'}</span>
            </NavLink>
          </li>
          {BUCKETS.map((bucket) => {
            const chip = bucketChipMeta(bucket.slug);
            return (
              <li key={bucket.slug}>
                <NavLink to={`/wiki/pokemon?bucket=${encodeURIComponent(bucket.slug)}`} className="wiki-nav__item">
                  <span
                    aria-hidden="true"
                    className="wiki-nav__swatch"
                    style={{
                      background: `var(--t-${chip.tokenSlug}-bg)`,
                      boxShadow: `inset 0 0 0 2px var(--t-${chip.tokenSlug}-edge)`,
                    }}
                  />
                  <span>{chip.label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="wiki-nav__group">
        <h2 className="wiki-nav__heading">Items</h2>
        <ul className="wiki-nav__list">
          <li>
            <NavLink to="/wiki/items" end className="wiki-nav__item">
              <span>All items</span>
              <span className="wiki-nav__count">{itemsTotal ?? '…'}</span>
            </NavLink>
          </li>
          {SOURCE_CATEGORIES.map((entry) => (
            <li key={entry.slug}>
              <NavLink to={`/wiki/items?source=${encodeURIComponent(entry.slug)}`} className="wiki-nav__item">
                <span>{entry.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </div>

      <div className="wiki-nav__group">
        <h2 className="wiki-nav__heading">Help</h2>
        <ul className="wiki-nav__list">
          {HELP_LINKS.map((entry) => (
            <li key={entry.href}>
              <a href={entry.href} className="wiki-nav__item">
                <span>{entry.label}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}

export const WIKI_NAV_TITLE = 'Bakumon Wiki';

export function WikiNavIcon() {
  return <PixelIcon name="wiki" size={20} />;
}
