// states-pokemon-light.html's loading state: role="status" once, plain --surface2
// rectangles underneath with no shimmer and no @keyframes - the kit has neither, so
// adding a pulse here would be inventing a state the design does not have.
export function Skeleton({ width = '100%', height = 16, style }) {
  return <div aria-hidden="true" style={{ width, height, background: 'var(--surface2)', ...style }} />;
}

// Wraps a group of Skeleton rectangles with the one live region a screen reader needs -
// four separate loading blocks each announcing themselves is how "Loading" gets read out
// four times for one page.
export function SkeletonStatus({ label = 'Loading', children }) {
  return (
    <div role="status" aria-live="polite">
      <span className="visually-hidden">{label}</span>
      {children}
    </div>
  );
}
