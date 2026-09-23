// items: [{ term, description }]. Used by PokemonDetail's "Reading spawn rows" glossary.
export function DefinitionList({ items }) {
  return (
    <dl className="definition-list">
      {items.map((item) => (
        <div className="definition-list__item" key={item.term}>
          <dt>{item.term}</dt>
          <dd>{item.description}</dd>
        </div>
      ))}
    </dl>
  );
}
