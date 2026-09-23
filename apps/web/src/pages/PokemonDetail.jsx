import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useResource } from '../hooks/useResource.js';
import { usePageTitle } from '../hooks/usePageTitle.js';
import { getPokemon } from '../api/endpoints.js';
import { groupSpawns } from '../lib/groupSpawns.js';
import { pokemonAlt } from '../lib/altText.js';
import { BUCKETS, bucketChipMeta, levelRange, EMPTY } from '../lib/labels.js';
import { Artwork } from '../components/common/Artwork.jsx';
import { PixelIcon } from '../components/common/PixelIcon.jsx';
import { Skeleton, SkeletonStatus } from '../components/common/Skeleton.jsx';
import { EmptyState } from '../components/common/EmptyState.jsx';
import { ErrorState } from '../components/common/ErrorState.jsx';
import { Breadcrumb } from '../components/wiki/Breadcrumb.jsx';
import { PageTitleBlock } from '../components/wiki/PageTitleBlock.jsx';
import { Infobox } from '../components/wiki/Infobox.jsx';
import { ContentsBox } from '../components/wiki/ContentsBox.jsx';
import { CalloutNote } from '../components/wiki/CalloutNote.jsx';
import { BucketChip } from '../components/wiki/BucketChip.jsx';
import { BucketDistributionBar } from '../components/wiki/BucketDistributionBar.jsx';
import { SpawnGroup } from '../components/wiki/SpawnGroup.jsx';
import { LegendaryPanel } from '../components/wiki/LegendaryPanel.jsx';
import { DefinitionList } from '../components/wiki/DefinitionList.jsx';

const READING_SPAWN_ROWS = [
  { term: 'Bucket', description: "How rare the spawn is. Ultra-rare is Bakumon's own tier above rare." },
  { term: 'Weight', description: 'Chance relative to other spawns in the same bucket and place. Higher is more often.' },
  { term: 'Level', description: 'Level range the Pokemon spawns at.' },
  { term: 'Context', description: 'Where it appears: on the ground, in water, from fishing.' },
  { term: 'Biomes', description: 'Where the row applies. The group icon marks a biome tag covering many biomes.' },
  { term: 'Conditions', description: 'Time, weather, moon, chunk and anything else the row needs.' },
];

const distinctBuckets = (rows) => {
  const present = new Set(rows.map((row) => row.bucket));
  return BUCKETS.map((bucket) => bucket.slug).filter((slug) => present.has(slug));
};

// null levelMin/levelMax (the legendary-event rows) are filtered out before this runs -
// groupSpawns already partitions those into `events`, so `natural` here always has real
// numbers or nothing at all.
function levelSpan(rows) {
  const withLevels = rows.filter((row) => row.levelMin !== null && row.levelMin !== undefined);
  if (!withLevels.length) return EMPTY;
  const min = Math.min(...withLevels.map((row) => row.levelMin));
  const max = Math.max(...withLevels.map((row) => row.levelMax ?? row.levelMin));
  return levelRange(min, max);
}

const groupId = (group) => `group-${group.key || 'base'}`;

function distinctBiomeCount(rows) {
  const tokens = new Set();
  for (const row of rows) for (const token of row.biomes ?? []) tokens.add(token);
  return tokens.size;
}

// A short, entirely-derived summary - no hand-written per-species prose (904 of them), and
// no invented "mostly found by fishing" line the data cannot back up generically. Returns
// the verb phrase only; the caller supplies the leading "<strong>{name}</strong> ".
function introSentence(natural, groupCount) {
  const rowCount = natural.length;
  const formsPhrase = groupCount <= 1
    ? `${rowCount} spawn row${rowCount === 1 ? '' : 's'}`
    : `${groupCount} forms and aspects, across ${rowCount} spawn row${rowCount === 1 ? '' : 's'}`;
  let sentence = `spawns on Bakumon in ${formsPhrase}.`;

  const counts = new Map();
  for (const row of natural) counts.set(row.bucket, (counts.get(row.bucket) ?? 0) + 1);
  for (const [bucket, count] of counts) {
    if (count / rowCount > 0.5) {
      sentence += ` Most rows are ${bucketChipMeta(bucket).label}.`;
      break;
    }
  }
  return sentence;
}

// The mockup truncates a long form list to two named links plus a "N more" line rather than
// one link per form - Magikarp alone has 32.
function contentsItems(groups, isLegendary) {
  if (isLegendary) {
    return [
      { id: 'spawning', label: 'Spawning' },
      { id: 'other-legendaries', label: 'Other legendaries' },
    ];
  }

  const shown = groups.slice(0, 2).map((group) => ({ id: groupId(group), label: group.label }));
  const remaining = groups.length - shown.length;

  return [
    {
      id: 'spawning',
      label: 'Spawning',
      children: remaining > 0
        ? [...shown, { label: `${remaining} more form${remaining === 1 ? '' : 's'}` }]
        : shown,
    },
    { id: 'reading-spawn-rows', label: 'Reading spawn rows' },
  ];
}

function NotFoundPokemon({ slug }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState(slug);

  return (
    <EmptyState
      title={`No Pokemon called “${slug}” spawns on Bakumon`}
      detail="Only the Pokemon in our spawn config have pages. Check the spelling, or search for it."
    >
      <form
        className="detail-not-found__form"
        onSubmit={(event) => { event.preventDefault(); navigate(`/wiki/pokemon?q=${encodeURIComponent(query)}`); }}
      >
        <label htmlFor="pokemon-not-found-q" style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15 }}>
          Search Pokemon
        </label>
        <div className="detail-not-found__field">
          <span className="detail-not-found__icon"><PixelIcon name="search" size={20} /></span>
          <input
            id="pokemon-not-found-q"
            className="detail-not-found__input"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Name, e.g. Mewtwo"
          />
        </div>
      </form>
      <Link to="/wiki/pokemon" style={{ minHeight: 44, display: 'inline-flex', alignItems: 'center', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 16 }}>
        Browse all Pokemon
      </Link>
    </EmptyState>
  );
}

// The section-heading rule (bottom border, no bottom margin) repeats four times below -
// third copy, extract.
function SectionHeading({ children }) {
  return <h2 style={{ marginBottom: 0, paddingBottom: 8, borderBottom: '2px solid var(--line)' }}>{children}</h2>;
}

function PokemonSkeleton() {
  return (
    <SkeletonStatus label="Loading Pokemon">
      <div className="stack">
        <Skeleton width={120} height={16} />
        <div className="article-layout">
          <div className="article-intro">
            <Skeleton height={60} />
            <Skeleton height={140} />
          </div>
          <div style={{ width: '100%', maxWidth: 320 }}>
            <Skeleton height={240} />
          </div>
        </div>
        <Skeleton height={36} style={{ maxWidth: 240 }} />
        <Skeleton height={200} />
      </div>
    </SkeletonStatus>
  );
}

// react-router keeps this component mounted across a slug change (same route element), so
// state such as expandAllTick or the not-found search box would otherwise leak from one
// species page to the next. Remounting on slug is simpler and more honest than an effect
// that resets half a dozen pieces of state in sync with a prop.
export default function PokemonDetail() {
  const { slug } = useParams();
  return <PokemonDetailPage key={slug} slug={slug} />;
}

function PokemonDetailPage({ slug }) {
  const [retryKey, setRetryKey] = useState(0);
  const { status, data, error } = useResource((signal) => getPokemon(slug, { signal }), [slug, retryKey]);

  usePageTitle(data?.displayName);

  const { groups, events } = useMemo(() => groupSpawns(data?.spawns ?? []), [data]);
  const isLegendary = events.length > 0;
  const naturalBuckets = distinctBuckets(groups.flatMap((group) => group.rows));

  // Ditto's case: one form, more than one bucket, so nothing in the grouping already flags
  // the split. Derived from the data (group count and bucket set), not from the slug -
  // 904 species checked this way, not one hardcoded name.
  const singleFormMultiBucket = !isLegendary && groups.length === 1 && naturalBuckets.length > 1;

  // Each SpawnGroup's `open` is an initial value, not controlled - the browser owns
  // open/closed after mount. "Expand all" forces every group open by remounting them with a
  // new key; a plain click handler cannot reach into a native <details> a screen-reader or
  // keyboard user has already toggled without fighting it.
  const [expandAllTick, setExpandAllTick] = useState(0);

  if (status === 'error' && error?.status === 404) {
    return (
      <div className="page stack">
        <Breadcrumb items={[{ label: 'Wiki', to: '/wiki' }, { label: 'Pokemon', to: '/wiki/pokemon' }]} current={slug} />
        <NotFoundPokemon slug={slug} />
      </div>
    );
  }
  if (status === 'error') return <div className="page"><ErrorState error={error} onRetry={() => setRetryKey((key) => key + 1)} /></div>;
  if (!data) return <div className="page"><PokemonSkeleton /></div>;

  const allNaturalRows = groups.flatMap((group) => group.rows);

  const infoboxRows = isLegendary
    ? [
        { label: 'Spawns as', value: <span className="spawn-group__chips">{distinctBuckets(events).map((bucket) => <BucketChip key={bucket} slug={bucket} />)}</span> },
        { label: 'Timing', value: 'At random' },
        { label: 'Level', value: <span className="mono">{levelSpan(events)}</span> },
        { label: 'Forms', value: new Set(events.map((row) => JSON.stringify(row.aspects ?? {}))).size },
      ]
    : [
        { label: 'Spawns as', value: <span className="spawn-group__chips">{naturalBuckets.map((bucket) => <BucketChip key={bucket} slug={bucket} />)}</span> },
        { label: 'Spawn rows', value: allNaturalRows.length },
        { label: 'Forms / aspects', value: groups.length },
        { label: 'Biomes', value: distinctBiomeCount(allNaturalRows) },
        { label: 'Levels', value: <span className="mono">{levelSpan(allNaturalRows)}</span> },
      ];

  return (
    <div className="page stack">
      <Breadcrumb items={[{ label: 'Wiki', to: '/wiki' }, { label: 'Pokemon', to: '/wiki/pokemon' }]} current={data.displayName} />

      <PageTitleBlock title={data.displayName} subtitle="Bakumon Wiki · Spawn data from this server's own config" />

      <div className="article-layout">
        <div className="article-intro">
          <p className="article-lede">
            <strong>{data.displayName}</strong>{' '}
            {isLegendary
              ? 'is one of the legendary Pokemon on Bakumon. Like every legendary here, it does not appear in the biome spawn tables. It spawns at random instead.'
              : introSentence(allNaturalRows, groups.length)}
          </p>

          {singleFormMultiBucket ? (
            <CalloutNote borderColor="var(--t-ultra-bg)">
              {data.displayName} spawns in more than one bucket depending on conditions:{' '}
              {naturalBuckets.map((bucket, index) => (
                <span key={bucket}>
                  {index > 0 ? ' and ' : ''}<strong>{bucketChipMeta(bucket).label}</strong>
                </span>
              ))}
              . See the rows below for exactly where each applies.
            </CalloutNote>
          ) : null}

          <ContentsBox items={contentsItems(groups, isLegendary)} />
        </div>

        <Infobox
          title={data.displayName}
          art={<Artwork src={data.imageUrl} alt={pokemonAlt(data.displayName)} size={220} />}
          rows={infoboxRows}
        />
      </div>

      {isLegendary ? (
        <section className="stack" id="spawning">
          <SectionHeading>Spawning</SectionHeading>
          <LegendaryPanel displayName={data.displayName} rows={events} />
        </section>
      ) : null}

      {!isLegendary && groups.length ? (
        <section className="stack" id="spawning">
          <SectionHeading>Spawning</SectionHeading>
          <p style={{ margin: 0, color: 'var(--muted)' }}>Rows are grouped by form and aspect. Open a group to see every row in it.</p>

          <div className="spawn-toolbar">
            <BucketDistributionBar rows={allNaturalRows} label="Every spawn row, by bucket" />
            <button type="button" className="detail-button" onClick={() => setExpandAllTick((tick) => tick + 1)}>
              Expand all
            </button>
          </div>

          <div className="spawn-groups">
            {groups.map((group, index) => (
              <SpawnGroup
                key={`${group.key}-${expandAllTick}`}
                id={groupId(group)}
                group={group}
                open={expandAllTick > 0 || index === 0}
              />
            ))}
          </div>
        </section>
      ) : null}

      {!isLegendary && !groups.length ? (
        <EmptyState title="No spawn data" detail="The workbook records no spawn rules for this Pokemon." />
      ) : null}

      {isLegendary ? (
        <section className="stack" id="other-legendaries">
          <SectionHeading>Other legendaries</SectionHeading>
          <p style={{ margin: 0 }}>
            See the <Link to="/wiki/pokemon?bucket=legendary+event">full list of legendary Pokemon</Link> on Bakumon.
          </p>
        </section>
      ) : (
        <section className="stack" id="reading-spawn-rows">
          <SectionHeading>Reading spawn rows</SectionHeading>
          <DefinitionList items={READING_SPAWN_ROWS} />
        </section>
      )}
    </div>
  );
}
