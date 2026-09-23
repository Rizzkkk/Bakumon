import { Link, useParams } from 'react-router-dom';
import { useResource } from '../hooks/useResource.js';
import { usePageTitle } from '../hooks/usePageTitle.js';
import { getItem } from '../api/endpoints.js';
import { hasPlaceholder } from '../lib/placeholderName.js';
import { itemAlt } from '../lib/altText.js';
import { CATEGORY_LABELS, sourceCategoryLabel } from '../lib/labels.js';
import { Artwork } from '../components/common/Artwork.jsx';
import { ItemName } from '../components/common/ItemName.jsx';
import { ErrorState } from '../components/common/ErrorState.jsx';
import { DescriptionPanel } from '../components/wiki/DescriptionPanel.jsx';

export default function ItemDetail() {
  const { itemId } = useParams();
  const { status, data, error } = useResource((signal) => getItem(itemId, { signal }), [itemId]);

  // The raw stored name, not the rendered one: a tab reading "flavour Poke Puff" would be
  // a title this wiki invented.
  usePageTitle(data?.name);

  if (status === 'error') return <div className="page"><ErrorState error={error} /></div>;
  if (!data) return <div className="page"><p role="status">Loading...</p></div>;

  return (
    <div className="page stack">
      <p className="card__meta"><Link to="/wiki?tab=items">Back to items</Link></p>

      <header className="stack">
        <div style={{ maxWidth: 128 }}>
          <Artwork src={data.imageUrl} alt={itemAlt(data.name)} size={128} pixel />
        </div>
        <h1 style={{ margin: 0 }}><ItemName name={data.name} /></h1>
        <p className="card__meta mono" style={{ margin: 0 }}>{data.itemId}</p>
        {/* The two axes often agree - category 'other' and source 'other-cobblemon-item'
            both read as Other - and printing "Other - Other" looks like a rendering fault
            rather than two facts. ADR 0002 keeps them separate in the data regardless. */}
        <p className="card__meta" style={{ margin: 0 }}>
          {[CATEGORY_LABELS[data.category] ?? data.category, sourceCategoryLabel(data.sourceCategory)]
            .filter((label, index, all) => all.indexOf(label) === index)
            .join(' - ')}
        </p>
      </header>

      {/* Conditional, not always rendered: an ordinary item must not carry an explanation
          of a placeholder it does not have. */}
      {hasPlaceholder(data.name) ? (
        <div className="panel">
          <p style={{ margin: 0, color: 'var(--text-muted)' }}>
            The <code>%s</code> in this name is a placeholder. The game substitutes the
            flavour when the item is created, so the name the server's workbook stores is a
            template rather than a finished string. It is shown here exactly as recorded.
          </p>
        </div>
      ) : null}

      <DescriptionPanel description={data.description} descriptionSource={data.descriptionSource} />

      {data.evolutionUseCount ? (
        <section className="stack">
          <h2 style={{ marginBottom: 0 }}>Evolutions</h2>
          <div className="panel">
            <p style={{ margin: 0 }}>
              Used in {data.evolutionUseCount} evolution{data.evolutionUseCount === 1 ? '' : 's'}.
              {data.evolutionUses ? ` ${data.evolutionUses}` : ''}
            </p>
          </div>
        </section>
      ) : null}
    </div>
  );
}
