/*
 * The server owner's Minecraft character bursting through the page, as one committed
 * image. Generated art rather than a render: `scripts/render-skin.js` knows the six boxes
 * of a skin and can pose them, but it has no way to draw a wall, a hole or rubble.
 *
 * No <picture>: WebP needs no fallback for anything that can run this site, and a second
 * source element for a PNG nobody would be served is markup for its own sake.
 */
export function WallBreakCharacter({ className = '' }) {
  return (
    <img
      className={`wallbreak ${className}`.trim()}
      src="/assets/brand/character-wall-480.webp"
      srcSet="/assets/brand/character-wall-320.webp 320w, /assets/brand/character-wall-480.webp 480w"
      sizes="240px"
      width={480}
      height={485}
      alt="The Bakumon server owner's Minecraft character smashing through a wall, waving"
    />
  );
}
