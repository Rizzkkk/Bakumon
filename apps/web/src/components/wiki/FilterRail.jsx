import { useMemo, useState } from 'react';
import { BUCKETS, biomeLabel } from '../../lib/labels.js';
import { BucketChip } from './BucketChip.jsx';
import { BiomeLabel } from './BiomeLabel.jsx';
import { PixelIcon } from '../common/PixelIcon.jsx';
import { useResource } from '../../hooks/useResource.js';
import { useWikiParams } from '../../hooks/useWikiParams.js';
import { listBiomes } from '../../api/endpoints.js';

// 04-api/contract.md: bucket is capped at 5 (every bucket that exists, so it never binds)
// and biome at 20. Exceeding either 400s, so the UI disables further biome checkboxes at
// the cap rather than letting a click reach the API.
export const BIOME_CAP = 20;

const BUCKET_HELP = {
  'ultra-rare': 'Bakumon only: selected starter lines, pseudo-legendary finals, Ditto outside slime chunks',
  'legendary event': 'Spawn at random, outside the regular spawn tables',
};

export function useBiomeList() {
  const { status, data } = useResource((signal) => listBiomes({ signal }), []);
  return { status, biomes: data?.data ?? [] };
}

// The fieldsets pokemon-index-d-light.html and filter-sheet-m-light.html share byte for
// byte - one definition, rendered into the desktop rail and the mobile sheet, per the
// Phase 4 brief. idPrefix keeps the two shells' input ids from colliding when both are
// mounted at once (the sheet stays in the DOM only while open, but the rail never unmounts).
export function FilterFields({ idPrefix, q, bucket, biome, onQ, onBucket, onBiome }) {
  const { status, biomes } = useBiomeList();
  const [biomeQuery, setBiomeQuery] = useState('');

  const filtered = useMemo(() => {
    const needle = biomeQuery.trim().toLowerCase();
    if (!needle) return biomes;
    return biomes.filter((entry) => entry.token.toLowerCase().includes(needle)
      || biomeLabel(entry.token, entry.isTag).toLowerCase().includes(needle));
  }, [biomes, biomeQuery]);

  const groups = filtered.filter((entry) => entry.isTag);
  const singles = filtered.filter((entry) => !entry.isTag);
  const capReached = biome.length >= BIOME_CAP;

  const toggleBucket = (slug) => {
    onBucket(bucket.includes(slug) ? bucket.filter((value) => value !== slug) : [...bucket, slug]);
  };
  const toggleBiome = (token) => {
    if (biome.includes(token)) { onBiome(biome.filter((value) => value !== token)); return; }
    if (capReached) return;
    onBiome([...biome, token]);
  };

  return (
    <>
      <div className="filter-field">
        <label htmlFor={`${idPrefix}-q`}>Name</label>
        <div className="filter-search">
          <PixelIcon name="search" size={20} />
          <input
            id={`${idPrefix}-q`}
            type="search"
            placeholder="e.g. Magikarp"
            value={q}
            onChange={(event) => onQ(event.target.value)}
          />
        </div>
      </div>

      <fieldset className="filter-fieldset">
        <legend>Spawn bucket</legend>
        {BUCKETS.map((entry) => (
          <label key={entry.slug} htmlFor={`${idPrefix}-bucket-${entry.slug}`} className="filter-checkbox">
            <input
              id={`${idPrefix}-bucket-${entry.slug}`}
              type="checkbox"
              checked={bucket.includes(entry.slug)}
              onChange={() => toggleBucket(entry.slug)}
            />
            <span className="filter-checkbox__body">
              <BucketChip slug={entry.slug} />
              {BUCKET_HELP[entry.slug] ? (
                <span className="filter-checkbox__help">{BUCKET_HELP[entry.slug]}</span>
              ) : null}
            </span>
          </label>
        ))}
      </fieldset>

      <fieldset className="filter-fieldset">
        <legend>Biome</legend>
        <p className="filter-fieldset__intro">
          Most entries are biome groups, shown with the group icon. A group like{' '}
          <code>#cobblemon:is_temperate</code> covers every biome that carries that trait.
          Entries without it are one specific biome.
        </p>

        <div className="filter-search">
          <label htmlFor={`${idPrefix}-biome-q`} className="visually-hidden">Filter biome list</label>
          <PixelIcon name="search" size={20} />
          <input
            id={`${idPrefix}-biome-q`}
            type="search"
            placeholder={`Filter ${biomes.length || 112} biomes`}
            value={biomeQuery}
            onChange={(event) => setBiomeQuery(event.target.value)}
          />
        </div>

        {capReached ? (
          <p role="status" className="filter-fieldset__cap">
            20 biomes selected, the limit for one search. Remove one to add another.
          </p>
        ) : null}

        <div className="filter-biome-list">
          {status === 'loading' && !biomes.length ? (
            <p className="filter-fieldset__intro">Loading biomes...</p>
          ) : null}

          {groups.length ? (
            <>
              <div className="filter-biome-list__caption">
                <span>Biome groups</span>
                <span className="mono">{groups.length}</span>
              </div>
              {groups.map((entry) => (
                <BiomeCheckbox
                  key={entry.token}
                  idPrefix={idPrefix}
                  entry={entry}
                  checked={biome.includes(entry.token)}
                  disabled={capReached && !biome.includes(entry.token)}
                  onToggle={() => toggleBiome(entry.token)}
                />
              ))}
            </>
          ) : null}

          {singles.length ? (
            <>
              <div className="filter-biome-list__caption">
                <span>Single biomes</span>
                <span className="mono">{singles.length}</span>
              </div>
              {singles.map((entry) => (
                <BiomeCheckbox
                  key={entry.token}
                  idPrefix={idPrefix}
                  entry={entry}
                  checked={biome.includes(entry.token)}
                  disabled={capReached && !biome.includes(entry.token)}
                  onToggle={() => toggleBiome(entry.token)}
                />
              ))}
            </>
          ) : null}

          {status === 'ready' && !groups.length && !singles.length ? (
            <p className="filter-fieldset__intro">No biome matches &#8220;{biomeQuery}&#8221;.</p>
          ) : null}
        </div>
      </fieldset>
    </>
  );
}

function BiomeCheckbox({ idPrefix, entry, checked, disabled, onToggle }) {
  const id = `${idPrefix}-biome-${entry.token}`;
  return (
    <label htmlFor={id} className="filter-biome-row">
      <input id={id} type="checkbox" checked={checked} disabled={disabled} onChange={onToggle} />
      <BiomeLabel token={entry.token} isTag={entry.isTag} />
    </label>
  );
}

// Desktop only - WikiLayout's `rail` slot (shell.css hides it below 768px), FilterSheet is
// the mobile equivalent. Reads and writes the URL directly via useWikiParams rather than
// taking props, so it stays in sync with the page's own list query without App.jsx having
// to thread filter state through a prop it does not otherwise touch.
export function FilterRail() {
  const { q, bucket, biome, update } = useWikiParams();

  return (
    <aside aria-label="Filter this list" className="filter-rail">
      <span className="filter-rail__title">Filter this list</span>
      <FilterFields
        idPrefix="rail"
        q={q}
        bucket={bucket}
        biome={biome}
        onQ={(value) => update({ q: value })}
        onBucket={(value) => update({ bucket: value })}
        onBiome={(value) => update({ biome: value })}
      />
    </aside>
  );
}
