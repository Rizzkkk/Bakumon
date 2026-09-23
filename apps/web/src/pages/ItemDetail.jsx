import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useResource } from '../hooks/useResource.js';
import { usePageTitle } from '../hooks/usePageTitle.js';
import { getItem } from '../api/endpoints.js';
import { hasPlaceholder } from '../lib/placeholderName.js';
import { itemAlt } from '../lib/altText.js';
import { CATEGORY_LABELS, sourceCategoryLabel } from '../lib/labels.js';
import { Artwork } from '../components/common/Artwork.jsx';
import { ItemName } from '../components/common/ItemName.jsx';
import { PixelIcon } from '../components/common/PixelIcon.jsx';
import { Skeleton, SkeletonStatus } from '../components/common/Skeleton.jsx';
import { EmptyState } from '../components/common/EmptyState.jsx';
import { ErrorState } from '../components/common/ErrorState.jsx';
import { Breadcrumb } from '../components/wiki/Breadcrumb.jsx';
import { PageTitleBlock } from '../components/wiki/PageTitleBlock.jsx';
import { Infobox } from '../components/wiki/Infobox.jsx';
import { ContentsBox } from '../components/wiki/ContentsBox.jsx';
import { DescriptionPanel } from '../components/wiki/DescriptionPanel.jsx';

// "Cobblemon Wiki, CC BY 4.0" / "Written by the Bakumon team" / "Not recorded" - the
// infobox's own compressed statement of what WikiCreditLine spells out in full under the
// Description heading. Kept in one place so the two cannot drift out of sync.
const PROVENANCE_LABEL = {
  wiki: 'Cobblemon Wiki, CC BY 4.0',
  workbook: 'Written by the Bakumon team',
};

const article = (word) => (/^[aeiou]/i.test(word) ? 'an' : 'a');

// evolutionUses is free text, not a list of structured Pokemon references (04-api/contract.md)
// - "Eevee → flareon | Growlithe → arcanine". Split on the same separators the
// workbook author used rather than inventing a delimiter. No artwork or link per row: the
// API gives names, not slugs, and guessing a slug from a display name ("Growlithe (Hisui)")
// risks linking to the wrong page.
function parseEvolutionUses(text) {
  if (!text) return [];
  return text.split(' | ').map((entry) => {
    const [from, into] = entry.split(' → ');
    return { from: (from ?? entry).trim(), into: (into ?? '').trim() };
  });
}

function contentsItems({ hasDescription, hasEvolutions }) {
  const items = [];
  if (hasDescription) items.push({ id: 'description', label: 'Description' });
  if (hasEvolutions) items.push({ id: 'evolution-uses', label: 'Evolution uses' });
  return items;
}

function NotFoundItem({ itemId }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  return (
    <EmptyState
      title={`No item called “${itemId}” exists on Bakumon`}
      detail="Check the spelling, or search for it."
    >
      <form
        className="detail-not-found__form"
        onSubmit={(event) => { event.preventDefault(); navigate(`/wiki/items?q=${encodeURIComponent(query)}`); }}
      >
        <label htmlFor="item-not-found-q" style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15 }}>
          Search items
        </label>
        <div className="detail-not-found__field">
          <span className="detail-not-found__icon"><PixelIcon name="search" size={20} /></span>
          <input
            id="item-not-found-q"
            className="detail-not-found__input"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Name, e.g. Fire Stone"
          />
        </div>
      </form>
      <Link to="/wiki/items" style={{ minHeight: 44, display: 'inline-flex', alignItems: 'center', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 16 }}>
        Browse all items
      </Link>
    </EmptyState>
  );
}

function ItemSkeleton() {
  return (
    <SkeletonStatus label="Loading item">
      <div className="stack">
        <Skeleton width={120} height={16} />
        <div className="article-layout">
          <div className="article-intro">
            <Skeleton height={60} />
          </div>
          <div style={{ width: '100%', maxWidth: 320 }}>
            <Skeleton height={220} />
          </div>
        </div>
        <Skeleton height={36} style={{ maxWidth: 240 }} />
        <Skeleton height={120} />
      </div>
    </SkeletonStatus>
  );
}

// See PokemonDetail.jsx for why this wraps in a remount-on-param component rather than an
// effect that resets state in sync with itemId.
export default function ItemDetail() {
  const { itemId } = useParams();
  return <ItemDetailPage key={itemId} itemId={itemId} />;
}

function ItemDetailPage({ itemId }) {
  const [retryKey, setRetryKey] = useState(0);
  const { status, data, error } = useResource((signal) => getItem(itemId, { signal }), [itemId, retryKey]);

  // The raw stored name, not the rendered one: a tab reading "flavour Poke Puff" would be a
  // title this wiki invented.
  usePageTitle(data?.name);

  if (status === 'error' && error?.status === 404) {
    return (
      <div className="page stack">
        <Breadcrumb items={[{ label: 'Wiki', to: '/wiki' }, { label: 'Items', to: '/wiki/items' }]} current={itemId} />
        <NotFoundItem itemId={itemId} />
      </div>
    );
  }
  if (status === 'error') return <div className="page"><ErrorState error={error} onRetry={() => setRetryKey((key) => key + 1)} /></div>;
  if (!data) return <div className="page"><ItemSkeleton /></div>;

  const evolutionRows = parseEvolutionUses(data.evolutionUses);
  const hasEvolutions = Boolean(data.evolutionUseCount) && evolutionRows.length > 0;
  const provenance = PROVENANCE_LABEL[data.descriptionSource] ?? 'Not recorded';

  return (
    <div className="page stack">
      <Breadcrumb items={[{ label: 'Wiki', to: '/wiki' }, { label: 'Items', to: '/wiki/items' }]} current={data.name} />

      {/* PageTitleBlock just renders `title` as h1 children - safe to pass the ItemName
          element here (unlike Infobox's `title`, which also feeds an aria-label string). */}
      <PageTitleBlock title={<ItemName name={data.name} />} subtitle="Bakumon Wiki · Item" />

      <div className="article-layout">
        <div className="article-intro">
          <p className="article-lede">
            The <strong><ItemName name={data.name} /></strong> is {article(CATEGORY_LABELS[data.category] ?? data.category)}{' '}
            {(CATEGORY_LABELS[data.category] ?? data.category).toLowerCase()} item.
            {hasEvolutions ? ` ${data.evolutionUseCount} Pokemon on Bakumon evolve with it.` : ''}
          </p>

          {hasPlaceholder(data.name) ? (
            <div className="panel">
              <p style={{ margin: 0, color: 'var(--muted)' }}>
                The <code>%s</code> in this name is a placeholder. The game substitutes the
                flavour when the item is created, so the name the server's workbook stores is
                a template rather than a finished string. It is shown here exactly as recorded.
              </p>
            </div>
          ) : null}

          <ContentsBox items={contentsItems({ hasDescription: true, hasEvolutions })} />
        </div>

        <Infobox
          title={data.name}
          caption={<ItemName name={data.name} />}
          art={<Artwork src={data.imageUrl} alt={itemAlt(data.name)} size={128} pixel />}
          rows={[
            {
              label: 'Source',
              value: <Link to={`/wiki/items?source=${encodeURIComponent(data.sourceCategory ?? '')}`}>{sourceCategoryLabel(data.sourceCategory)}</Link>,
            },
            ...(hasEvolutions ? [{ label: 'Evolution uses', value: <span className="mono">{data.evolutionUseCount}</span> }] : []),
            { label: 'Description', value: provenance },
          ]}
        />
      </div>

      <section className="stack" id="description">
        <h2 style={{ marginBottom: 0, paddingBottom: 8, borderBottom: '2px solid var(--line)' }}>Description</h2>
        <DescriptionPanel description={data.description} descriptionSource={data.descriptionSource} itemName={data.name} />
      </section>

      {hasEvolutions ? (
        <section className="stack" id="evolution-uses">
          <h2 style={{ marginBottom: 0, paddingBottom: 8, borderBottom: '2px solid var(--line)' }}>Evolution uses</h2>
          <div className="table-scroll">
            <table className="evolution-table">
              <thead>
                <tr>
                  <th scope="col">From</th>
                  <th scope="col">Evolves into</th>
                  <th scope="col">How</th>
                </tr>
              </thead>
              <tbody>
                {evolutionRows.map((row, index) => (
                  <tr key={index}>
                    <td>{row.from}</td>
                    <td>{row.into}</td>
                    <td>Use {article(data.name)} {data.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}
