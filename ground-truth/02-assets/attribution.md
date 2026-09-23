# Attribution

Three licences apply to the mined artwork, and two of them create obligations the site
must actually discharge. Per-file licence and source URL are in `assets/manifest.json`;
counts are in `ground-truth/reports/asset-manifest.md`.

## What the site must display

This block, or something carrying the same facts, belongs in the footer of every page:

> Pokemon artwork from [PokeAPI](https://github.com/PokeAPI/sprites).
> Item artwork and descriptions from the [Cobblemon Wiki](https://wiki.cobblemon.com),
> licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
> Some item textures from [Cobblemon](https://gitlab.com/cable-mc/cobblemon), licensed
> MPL-2.0.
> Bakumon is a community fan project. It is not affiliated with Cobblemon, The Pokemon
> Company, Nintendo, or Mojang.

**Implemented 2026-09-23.** `apps/web/src/components/layout/Attribution.jsx` renders the
block above verbatim inside `Footer.jsx`, which is on every page. Per-field credit for
wiki-sourced descriptions is rendered by `components/wiki/DescriptionPanel.jsx` whenever
`descriptionSource` is `wiki`, which is the point-of-use attribution CC BY actually
requires - 34 items take that branch.

Original note: This is a requirement on the
frontend work, recorded here so it is not discovered late.

## The obligations, specifically

### Cobblemon Wiki content - CC BY 4.0

615 images and 155 descriptions. CC BY requires **attribution and a link to the licence**.
A single footer credit satisfies it for images.

Descriptions are the harder case: a scraped description is CC BY text rendered as body
copy. Where an item page shows `wiki_description` rather than the workbook's own
`description`, it should say so at the point of use, not only in the footer. The two
columns are kept separate partly so the UI can tell which it is displaying.

### Cobblemon mod textures - MPL-2.0

116 item textures. MPL-2.0 is file-level copyleft: it governs modification and
distribution of the covered files, and does not reach the site's own code. Using the
textures unmodified with attribution is within it.

Separately, Cobblemon's own asset policy asks that assets be attributed and **not used in
a way that implies endorsement or affiliation**. The disclaimer line above is doing that
work; it should not be dropped as visual clutter.

### PokeAPI sprites

904 images. The sprite repository aggregates artwork whose underlying rights sit with The
Pokemon Company; PokeAPI itself asks for attribution. This is the same footing every fan
Pokedex site operates on, and the disclaimer matters more here than the credit line.

## Practical consequences

- **The footer credit is not optional decoration.** Removing it puts the site outside the
  CC BY terms for 615 images and 155 blocks of text.
- **Do not add advertising or paid features without revisiting this.** Fan-project
  tolerance is not a licence, and the Cobblemon asset policy's endorsement clause gets
  sharper the moment money is involved.
- **Keep `assets/manifest.json` out of `.gitignore`.** It is the evidence of where each file
  came from and under what terms. The images themselves are gitignored; the provenance
  record is not.
