/*
 * Two rendered frames of the same character, alternated by CSS. The renderer emits both
 * from one run onto a shared canvas (`npm run skin -- --pose wave`), so the two images are
 * the same size and the body does not shift between them - only the arm moves.
 *
 * Both frames are in the markup rather than one <img> whose src is swapped: a src swap
 * decodes on every flip and the first flip of each frame lands late.
 */
export function WavingCharacter({ className = '' }) {
  return (
    <div className={`waver ${className}`.trim()}>
      <Frame frame="a" alt="An isometric render of the Bakumon server owner's Minecraft character, waving" />
      <Frame frame="b" alt="" />
    </div>
  );
}

function Frame({ frame, alt }) {
  return (
    <picture className={`waver__frame waver__frame--${frame}`}>
      <source
        type="image/webp"
        srcSet={`/assets/brand/character-wave-${frame}-320.webp 320w, /assets/brand/character-wave-${frame}-480.webp 480w`}
        sizes="(max-width: 767px) 132px, 200px"
      />
      <img
        className="waver__img"
        src={`/assets/brand/character-wave-${frame}.png`}
        width={493}
        height={790}
        alt={alt}
        aria-hidden={alt === '' ? 'true' : undefined}
      />
    </picture>
  );
}
