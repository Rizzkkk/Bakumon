import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Breadcrumb } from '../components/wiki/Breadcrumb.jsx';
import { PageTitleBlock } from '../components/wiki/PageTitleBlock.jsx';
import { BucketChip } from '../components/wiki/BucketChip.jsx';
import { PixelIcon } from '../components/common/PixelIcon.jsx';
import { usePageTitle } from '../hooks/usePageTitle.js';
import { useResource } from '../hooks/useResource.js';
import { listPokemon, listItems } from '../api/endpoints.js';
import { BUCKETS, SOURCE_CATEGORIES } from '../lib/labels.js';

// pageSize=1 is the cheapest request that still returns `total` - the hub cards need the
// count, not a page of rows. Mirrors WikiNav's own useWikiTotals (Phase 2); kept as a
// second, small copy rather than an import because WikiNav does not export it.
function useHubTotals() {
  const pokemon = useResource((signal) => listPokemon({ pageSize: 1 }, { signal }), []);
  const items = useResource((signal) => listItems({ pageSize: 1 }, { signal }), []);
  return { pokemonTotal: pokemon.data?.total, itemsTotal: items.data?.total };
}

export default function WikiHome() {
  usePageTitle(undefined);
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const { pokemonTotal, itemsTotal } = useHubTotals();

  // No unified search endpoint exists (04-api/contract.md lists five, none of them
  // cross-resource), so this hands the term to the Pokemon index - the wiki's first and
  // larger list - rather than inventing a query the API cannot answer.
  const onSearch = (event) => {
    event.preventDefault();
    navigate(query ? `/wiki/pokemon?q=${encodeURIComponent(query)}` : '/wiki/pokemon');
  };

  return (
    <div className="stack">
      <Breadcrumb items={[]} current="Wiki" />
      <PageTitleBlock title="Bakumon Wiki" subtitle="Look up every Pokemon and item on the Bakumon server" />

      <p className="index-intro">
        Spawn data on this wiki comes from Bakumon&#39;s own server config, so it matches what
        you will find in game, not the Cobblemon defaults.
      </p>

      <form role="search" className="hub-search" onSubmit={onSearch}>
        <label htmlFor="wiki-hub-search">Search the wiki</label>
        <div className="filter-search filter-search--lg">
          <PixelIcon name="search" size={20} />
          <input
            id="wiki-hub-search"
            type="search"
            placeholder={`Search ${pokemonTotal ?? 904} Pokemon and ${itemsTotal ?? 934} items`}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
      </form>

      <div className="hub-cards">
        <section className="hub-card">
          <div className="hub-card__header">
            <span className="hub-card__badge" aria-hidden="true" />
            <h2>Pokemon</h2>
            <span className="mono hub-card__count">{pokemonTotal ?? '…'}</span>
          </div>
          <p>Every species that spawns on Bakumon, with its biomes, levels and spawn buckets.</p>
          <div className="hub-card__browse">
            <div className="hub-card__browse-label">Browse by bucket</div>
            <ul className="hub-card__chips">
              {BUCKETS.map((bucket) => (
                <li key={bucket.slug}>
                  <Link to={`/wiki/pokemon?bucket=${encodeURIComponent(bucket.slug)}`} className="hub-card__chip-link">
                    <BucketChip slug={bucket.slug} />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <Link to="/wiki/pokemon" className="hub-card__all">
            All Pokemon
            <PixelIcon name="arrow-right" size={20} />
          </Link>
        </section>

        <section className="hub-card">
          <div className="hub-card__header">
            <span className="hub-card__badge" aria-hidden="true"><PixelIcon name="item" size={20} width={20} height={16} /></span>
            <h2>Items</h2>
            <span className="mono hub-card__count">{itemsTotal ?? '…'}</span>
          </div>
          <p>Berries, fossils, Poke Balls and everything else you can find, with evolution uses.</p>
          <div className="hub-card__browse">
            <div className="hub-card__browse-label">Browse by source</div>
            <ul className="hub-card__source-list">
              {SOURCE_CATEGORIES.map((entry) => (
                <li key={entry.slug}>
                  <Link to={`/wiki/items?source=${encodeURIComponent(entry.slug)}`}>{entry.label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <Link to="/wiki/items" className="hub-card__all">
            All items
            <PixelIcon name="arrow-right" size={20} />
          </Link>
        </section>
      </div>

      <section className="hub-help">
        <h3>New to the wiki?</h3>
        <ul>
          <li><a href="#reading-spawn-rows">Reading spawn rows</a>: what bucket, weight, level and context mean.</li>
          <li><a href="#biome-groups-explained">Biome groups explained</a>: why you see names like <code className="mono">#cobblemon:is_temperate</code>.</li>
          <li>Legendaries spawn at random on Bakumon, so they have their own section on each page instead of a spawn table.</li>
        </ul>
      </section>
    </div>
  );
}
