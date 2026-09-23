import { PixelIcon } from './PixelIcon.jsx';

// states-pokemon-light.html's "No Pokemon match all three filters" panel. Actions
// (Clear all filters, a link back, and so on) are the caller's - every empty state on the
// site needs a different one, which is why this takes children rather than a fixed prop.
export function EmptyState({ icon = 'search', title, detail, children }) {
  return (
    <div
      role="status"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        padding: '24px 20px',
        background: 'var(--surface)',
        border: '2px dashed var(--line)',
      }}
    >
      <span style={{ color: 'var(--muted)', display: 'flex' }}>
        <PixelIcon name={icon} size={32} />
      </span>
      <h3 style={{ margin: 0, font: 'var(--type-h3)' }}>{title}</h3>
      {detail ? <p style={{ margin: 0, color: 'var(--muted)' }}>{detail}</p> : null}
      {children ? <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>{children}</div> : null}
    </div>
  );
}
