// items: [{ term, description }]. The wrapper div is what pairs a term with its
// description in the grid - a bare dt/dd pair lands in two unrelated cells.
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
