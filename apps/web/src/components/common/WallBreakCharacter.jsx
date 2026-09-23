/*
 * A single committed render of the server owner's Minecraft skin, waving, rendered by
 * `npm run skin -- --pose wave --scale 26`. Static: it was briefly two frames alternated
 * by CSS, and the motion was the wrong note for a figure the page wants standing there.
 */
export function WavingCharacter({ className = '' }) {
  return (
    <picture className={`waver ${className}`.trim()}>
      <source
        type="image/webp"
        srcSet="/assets/brand/character-wave-320.webp 320w, /assets/brand/character-wave-480.webp 480w"
        sizes="200px"
      />
      <img
        className="waver__img"
        src="/assets/brand/character-wave.png"
        width={488}
        height={887}
        alt="A render of the Bakumon server owner's Minecraft character, waving"
      />
    </picture>
  );
}
