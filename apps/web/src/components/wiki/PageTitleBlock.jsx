// <h1> + a faint sub-line + a bottom rule, shared by every wiki page's title (wiki-home-*,
// pokemon-index-*, item-detail-*, and so on).
export function PageTitleBlock({ title, subtitle }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        paddingBottom: 12,
        borderBottom: '2px solid var(--line-strong)',
      }}
    >
      <h1 style={{ margin: 0, font: 'var(--type-h1)' }}>{title}</h1>
      {subtitle ? <span style={{ fontSize: 14, lineHeight: '20px', color: 'var(--faint)' }}>{subtitle}</span> : null}
    </div>
  );
}
