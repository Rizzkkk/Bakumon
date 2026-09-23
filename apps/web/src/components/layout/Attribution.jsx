// Not decoration and not optional. 615 wiki images/descriptions and, since ADR 0012, 66
// Pokemon renders are CC BY 4.0 and require attribution plus a licence link; removing this
// block puts the site outside the terms it is using the assets under. Cobblemon's asset
// policy also asks that use does not imply endorsement, which is what the last line is for
// - it is not filler. Exact wording: ground-truth/02-assets/attribution.md.
export function Attribution() {
  return (
    <div className="stack">
      <p style={{ margin: 0 }}>
        Pokemon artwork from{' '}
        <a href="https://github.com/PokeAPI/sprites" rel="noreferrer noopener" target="_blank">PokeAPI</a>{' '}
        and, for some species, model renders from the{' '}
        <a href="https://wiki.cobblemon.com" rel="noreferrer noopener" target="_blank">Cobblemon Wiki</a>,
        licensed{' '}
        <a href="https://creativecommons.org/licenses/by/4.0/" rel="noreferrer noopener" target="_blank">CC BY 4.0</a>.
      </p>
      <p style={{ margin: 0 }}>
        Item artwork and descriptions from the{' '}
        <a href="https://wiki.cobblemon.com" rel="noreferrer noopener" target="_blank">Cobblemon Wiki</a>,
        licensed{' '}
        <a href="https://creativecommons.org/licenses/by/4.0/" rel="noreferrer noopener" target="_blank">CC BY 4.0</a>.
      </p>
      <p style={{ margin: 0 }}>
        Some item textures from{' '}
        <a href="https://gitlab.com/cable-mc/cobblemon" rel="noreferrer noopener" target="_blank">Cobblemon</a>,
        licensed MPL-2.0.
      </p>
      <p style={{ margin: 0 }}>
        Bakumon is a community fan project. It is not affiliated with Cobblemon,
        The Pokemon Company, Nintendo, or Mojang.
      </p>
    </div>
  );
}
