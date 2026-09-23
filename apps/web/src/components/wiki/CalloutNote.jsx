// Icon glyph is local rather than added to PixelIcon's shared set - this is the only call
// site for it (ditto-detail-*'s info mark), lifted verbatim from the artboard's rects.
const ICON_RECTS = [
  [2, 0, 6, 1], [1, 1, 1, 1], [8, 1, 1, 1], [0, 2, 1, 1], [4, 2, 2, 1], [9, 2, 1, 1],
  [0, 3, 1, 1], [9, 3, 1, 1], [0, 4, 1, 1], [4, 4, 2, 1], [9, 4, 1, 1], [0, 5, 1, 1],
  [4, 5, 2, 1], [9, 5, 1, 1], [0, 6, 1, 1], [4, 6, 2, 1], [9, 6, 1, 1], [0, 7, 1, 1],
  [4, 7, 2, 1], [9, 7, 1, 1], [1, 8, 1, 1], [8, 8, 1, 1], [2, 9, 6, 1],
];

// borderColor lets a call site point the note at the thing it explains - the Ditto note
// borrows the ultra-rare token rather than the default line colour.
export function CalloutNote({ children, borderColor = 'var(--line-strong)' }) {
  return (
    <div className="callout-note" style={{ borderColor }}>
      <span className="callout-note__icon">
        <svg width={20} height={20} viewBox="0 0 10 10" fill="currentColor" shapeRendering="crispEdges" aria-hidden="true">
          {ICON_RECTS.map(([x, y, w, h]) => <rect key={`${x}-${y}`} x={x} y={y} width={w} height={h} />)}
        </svg>
      </span>
      <p>{children}</p>
    </div>
  );
}
