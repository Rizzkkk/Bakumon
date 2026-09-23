// Every glyph is hand-authored rects on the artboards - there is no sprite sheet and no
// icon font (design/DESIGN-HANDOFF.md). Coordinates below are lifted from the artboards
// verbatim (mainly design/artboards/tokens-board.html, wiki-home-d-light.html,
// items-index-d-light.html, filter-sheet-m-light.html and states-detail-light.html), not
// invented. [r, [x, y, w, h][]] per icon: viewBox is always 0 0 r r unless noted.
const ICONS = {
  'chevron-right': {
    viewBox: '0 0 8 8',
    rects: [[2,0,1,1],[2,1,2,1],[3,2,2,1],[4,3,2,1],[4,4,2,1],[3,5,2,1],[2,6,2,1],[2,7,1,1]],
  },
  'chevron-down': {
    viewBox: '0 0 8 8',
    rects: [[0,2,1,1],[7,2,1,1],[0,3,2,1],[6,3,2,1],[1,4,2,1],[5,4,2,1],[2,5,4,1],[3,6,2,1]],
  },
  search: {
    viewBox: '0 0 10 10',
    rects: [[2,0,4,1],[1,1,1,1],[6,1,1,1],[0,2,1,1],[7,2,1,1],[0,3,1,1],[7,3,1,1],[0,4,1,1],[7,4,1,1],[0,5,1,1],[7,5,1,1],[1,6,1,1],[6,6,1,1],[2,7,4,1],[7,7,1,1],[7,8,2,1],[8,9,2,1]],
  },
  close: {
    viewBox: '0 0 8 8',
    rects: [[0,0,2,1],[6,0,2,1],[0,1,3,1],[5,1,3,1],[1,2,6,1],[2,3,4,1],[2,4,4,1],[1,5,6,1],[0,6,3,1],[5,6,3,1],[0,7,2,1],[6,7,2,1]],
  },
  menu: {
    viewBox: '0 0 10 10',
    rects: [[0,0,10,1],[0,1,10,1],[0,4,10,1],[0,5,10,1],[0,8,10,1],[0,9,10,1]],
  },
  theme: {
    viewBox: '0 0 10 10',
    rects: [[0,0,10,1],[0,1,1,1],[5,1,5,1],[0,2,1,1],[5,2,5,1],[0,3,1,1],[5,3,5,1],[0,4,1,1],[5,4,5,1],[0,5,1,1],[5,5,5,1],[0,6,1,1],[5,6,5,1],[0,7,1,1],[5,7,5,1],[0,8,1,1],[5,8,5,1],[0,9,10,1]],
  },
  wiki: {
    viewBox: '0 0 10 10',
    rects: [[0,0,4,1],[6,0,4,1],[0,1,1,1],[3,1,2,1],[6,1,1,1],[9,1,1,1],[0,2,1,1],[4,2,2,1],[9,2,1,1],[0,3,1,1],[4,3,2,1],[9,3,1,1],[0,4,1,1],[4,4,2,1],[9,4,1,1],[0,5,1,1],[4,5,2,1],[9,5,1,1],[0,6,1,1],[4,6,2,1],[9,6,1,1],[0,7,4,1],[6,7,4,1]],
  },
  // Not present in any of the 56 artboards: Pokemon panels reuse the generic image-frame
  // placeholder glyph instead of a dedicated pokeball. Renders nothing rather than a
  // guess - see PHASE1-REPORT for the search that established this.
  pokeball: null,
  item: {
    viewBox: '0 0 10 8',
    rects: [[2,0,6,1],[1,1,1,1],[4,1,2,1],[8,1,1,1],[0,2,10,1],[1,3,1,1],[4,3,2,1],[8,3,1,1],[2,4,1,1],[4,4,2,1],[7,4,1,1],[3,5,4,1],[4,6,2,1]],
  },
  'biome-group': {
    viewBox: '0 0 10 10',
    rects: [[0,0,6,1],[0,1,1,1],[6,1,1,1],[0,2,1,1],[2,2,2,1],[7,2,1,1],[0,3,1,1],[2,3,2,1],[8,3,1,1],[0,4,1,1],[9,4,1,1],[1,5,1,1],[9,5,1,1],[2,6,1,1],[8,6,1,1],[3,7,1,1],[7,7,1,1],[4,8,1,1],[6,8,1,1],[5,9,1,1]],
  },
  'biome-single': {
    viewBox: '0 0 8 8',
    rects: [[3,0,2,1],[2,1,4,1],[1,2,6,1],[0,3,8,1],[1,4,6,1],[3,5,2,1],[3,6,2,1],[2,7,4,1]],
  },
  'arrow-right': {
    viewBox: '0 0 10 10',
    rects: [[6,1,1,1],[7,2,1,1],[8,3,1,1],[0,4,10,1],[0,5,10,1],[8,6,1,1],[7,7,1,1],[6,8,1,1]],
  },
  check: {
    viewBox: '0 0 10 8',
    rects: [[9,0,1,1],[8,1,2,1],[7,2,2,1],[0,3,1,1],[6,3,2,1],[0,4,2,1],[5,4,2,1],[1,5,2,1],[4,5,2,1],[2,6,3,1],[3,7,1,1]],
  },
  warning: {
    viewBox: '0 0 10 9',
    rects: [[4,0,2,1],[3,1,4,1],[3,2,1,1],[6,2,1,1],[2,3,1,1],[4,3,2,1],[7,3,1,1],[2,4,1,1],[4,4,2,1],[7,4,1,1],[1,5,1,1],[4,5,2,1],[8,5,1,1],[1,6,1,1],[8,6,1,1],[0,7,1,1],[4,7,2,1],[9,7,1,1],[0,8,10,1]],
  },
  // Bucket glyphs. ultra-rare is a four-point star, not a bigger rare diamond - ADR 0010
  // requires it to read at least as prominent as rare without relying on size alone.
  'bucket-common': {
    viewBox: '0 0 7 7',
    rects: [[1,1,5,1],[1,2,1,1],[5,2,1,1],[1,3,1,1],[5,3,1,1],[1,4,1,1],[5,4,1,1],[1,5,5,1]],
  },
  'bucket-uncommon': {
    viewBox: '0 0 7 7',
    rects: [[1,1,5,1],[1,2,5,1],[1,3,5,1],[1,4,5,1],[1,5,5,1]],
  },
  'bucket-rare': {
    viewBox: '0 0 7 7',
    rects: [[3,0,1,1],[2,1,3,1],[1,2,5,1],[0,3,7,1],[1,4,5,1],[2,5,3,1],[3,6,1,1]],
  },
  'bucket-ultra-rare': {
    viewBox: '0 0 7 7',
    rects: [[3,0,1,1],[3,1,1,1],[2,2,3,1],[0,3,7,1],[2,4,3,1],[3,5,1,1],[3,6,1,1]],
  },
  'bucket-legendary': {
    viewBox: '0 0 9 7',
    rects: [[0,0,1,1],[4,0,1,1],[8,0,1,1],[0,1,2,1],[3,1,3,1],[7,1,2,1],[0,2,9,1],[0,3,9,1],[0,4,9,1],[0,6,9,1]],
  },
};

// name is looked up rather than trusted: a typo or a not-yet-harvested glyph must not
// blank the page it appears on.
export function PixelIcon({ name, size = 14, title, ...rest }) {
  const icon = ICONS[name];
  if (!icon) return null;

  const a11yProps = title ? { role: 'img', 'aria-label': title } : { 'aria-hidden': true };

  return (
    <svg
      width={size}
      height={size}
      viewBox={icon.viewBox}
      fill="currentColor"
      shapeRendering="crispEdges"
      style={{ flexShrink: 0, display: 'block' }}
      {...a11yProps}
      {...rest}
    >
      {icon.rects.map(([x, y, w, h]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width={w} height={h} />
      ))}
    </svg>
  );
}
