// width and height are not optional. Twenty-four lazy images with no intrinsic size is a
// results grid that reflows twice while it loads.
export function Artwork({ src, alt, size = 256, pixel = false, missingLabel = 'No image' }) {
  // 203 of 934 items have no artwork at all (known-gaps.md entry 2), so roughly a fifth of
  // item cards take this branch. It is a designed state, not an error - and aria-hidden
  // because the card's own name already says which item this is.
  if (!src) {
    return (
      <div className="art art--missing" style={{ width: size }} aria-hidden="true">
        {missingLabel}
      </div>
    );
  }

  return (
    <img
      className={pixel ? 'art art--pixel' : 'art'}
      src={src}
      alt={alt}
      width={size}
      height={size}
      style={{ width: size }}
      loading="lazy"
      decoding="async"
    />
  );
}
