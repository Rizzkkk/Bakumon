export function SearchBar({ value, onChange, label, resultCount, status }) {
  return (
    <div>
      <label className="skip-link" htmlFor="wiki-search">{label}</label>
      <input
        id="wiki-search"
        className="search"
        type="search"
        placeholder={label}
        value={value}
        autoComplete="off"
        onChange={(event) => onChange(event.target.value)}
      />
      {/* The count is announced politely rather than assertively: it updates on every
          debounced keystroke and an assertive region would interrupt a screen reader
          mid-word each time. */}
      <p className="card__meta" role="status" aria-live="polite" style={{ marginTop: 8 }}>
        {status === 'ready' && resultCount !== undefined
          ? `${resultCount.toLocaleString()} result${resultCount === 1 ? '' : 's'}`
          : '\u00a0'}
      </p>
    </div>
  );
}
