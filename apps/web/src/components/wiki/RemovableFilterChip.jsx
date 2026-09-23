import { PixelIcon } from '../common/PixelIcon.jsx';

// states-pokemon-light.html's "3 filters on" row: a bucket chip, a biome name or a search
// term, each with a small close glyph. `children` carries the rendered chip (a BucketChip,
// say) when there is one; `label` alone is both the fallback content and the accessible
// name, so a bucket's chip and its plain-text screen-reader name never say two different
// things.
export function RemovableFilterChip({ label, onRemove, children }) {
  return (
    <button type="button" className="removable-chip" onClick={onRemove} aria-label={`Remove ${label} filter`}>
      <span aria-hidden="true" className="removable-chip__content">{children ?? label}</span>
      <PixelIcon name="close" size={16} />
    </button>
  );
}
