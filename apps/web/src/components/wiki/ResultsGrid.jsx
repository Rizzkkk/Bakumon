import { PokemonCard } from './PokemonCard.jsx';
import { ItemCard } from './ItemCard.jsx';
import { StateBlock, ErrorState } from '../common/StateBlock.jsx';

export function ResultsGrid({ tab, status, data, error, page, pageSize, onPage }) {
  if (status === 'error') return <ErrorState error={error} />;
  if (status === 'loading' && !data) return <StateBlock variant="loading" title="Loading" />;
  if (!data) return null;

  if (!data.data.length) {
    return (
      <StateBlock
        variant="empty"
        title="Nothing matched"
        detail="Try a shorter search, or clear the filters."
      />
    );
  }

  const lastPage = Math.max(1, Math.ceil(data.total / pageSize));

  return (
    <div className="stack">
      <div className="grid" style={{ opacity: status === 'loading' ? 0.55 : 1 }}>
        {tab === 'items'
          ? data.data.map((item) => <ItemCard key={item.itemId} item={item} />)
          : data.data.map((pokemon) => <PokemonCard key={pokemon.id} pokemon={pokemon} />)}
      </div>

      {lastPage > 1 ? (
        <div className="pager">
          <button type="button" onClick={() => onPage(page - 1)} disabled={page <= 1}>Previous</button>
          <span className="card__meta">Page {page} of {lastPage}</span>
          <button type="button" onClick={() => onPage(page + 1)} disabled={page >= lastPage}>Next</button>
        </div>
      ) : null}
    </div>
  );
}
