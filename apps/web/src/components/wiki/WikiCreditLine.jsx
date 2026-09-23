const ICON_RECTS = [
  [0, 0, 6, 1], [0, 1, 1, 1], [5, 1, 2, 1], [0, 2, 1, 1], [6, 2, 1, 1], [0, 3, 1, 1],
  [2, 3, 3, 1], [6, 3, 1, 1], [0, 4, 1, 1], [6, 4, 1, 1], [0, 5, 1, 1], [2, 5, 3, 1],
  [6, 5, 1, 1], [0, 6, 1, 1], [6, 6, 1, 1], [0, 7, 7, 1],
];

// A licence requirement, not decoration: wiki text is CC BY 4.0 and has to be credited at
// the point of use (02-assets/attribution.md). null renders nothing - DescriptionPanel's own
// copy covers the no-description case, which is not a wiki/workbook attribution question.
export function WikiCreditLine({ source, itemName }) {
  if (source !== 'wiki' && source !== 'workbook') return null;

  return (
    <p className="wiki-credit">
      <span className="wiki-credit__icon">
        <svg width={8} height={8} viewBox="0 0 8 8" fill="currentColor" shapeRendering="crispEdges" aria-hidden="true">
          {ICON_RECTS.map(([x, y, w, h]) => <rect key={`${x}-${y}`} x={x} y={y} width={w} height={h} />)}
        </svg>
      </span>
      {source === 'wiki' ? (
        <span>
          Text from the <a href="https://wiki.cobblemon.com" rel="noreferrer noopener" target="_blank">Cobblemon Wiki</a> page
          &#8220;{itemName}&#8221; by its contributors, under{' '}
          <a href="https://creativecommons.org/licenses/by/4.0/" rel="noreferrer noopener" target="_blank">CC BY 4.0</a>. Unchanged.
        </span>
      ) : (
        <span>Written by the Bakumon team.</span>
      )}
    </p>
  );
}
