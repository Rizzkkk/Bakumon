// landing-d-light.html hardcodes ~30 individual columns of hand-picked heights to fake a
// jagged grass skyline. The exact count and heights are not a meaningful contract - the
// silhouette just needs to read as uneven grass - so this cycles a short height pattern
// across however many columns fit, instead of carrying the artboard's full literal list.
const COLUMN_HEIGHTS = [32, 24, 32, 40, 24, 32, 16, 24];

export function GrassSkyline() {
  return (
    <div className="skyline" aria-hidden="true">
      {COLUMN_HEIGHTS.map((height, index) => (
        <div key={index} className="skyline__column" style={{ height }}>
          <div className="skyline__lime" />
          <div className="skyline__leaf" />
        </div>
      ))}
    </div>
  );
}
