# 0001 - Pokemon artwork comes from PokeAPI, not the Cobblemon wiki

- **Status**: accepted. **Superseded in part by ADR 0012** (2026-09-24) - the wiki turned
  out to hold `(model)` renders for 66 species; PokeAPI remains the fallback for the other
  838. See 0012 for what changed and why the original probe was still right.
- **Date**: 2026-09-11

## Context

The site needs an image for each of the 904 species. The obvious source was the Cobblemon
wiki, since the item artwork comes from there. It does not work.

Probed during planning:

- `wiki.cobblemon.com` search for `Abomasnow` returns **0 hits**. There are no
  per-Pokemon pages.
- `list=allimages` with prefix `Absol` returns an **empty list**.
- Only scattered `(model)` render PNGs exist, for a minority of species.
- Cobblemon's own repository (GitLab `cable-mc/cobblemon`, MPL-2.0) stores Pokemon art
  under `textures/pokemon/0001_bulbasaur/...` as **UV texture atlases** - 3D model skins.
  Rendered flat they look like scrambled sheets, not portraits. Using them would mean
  running every species through Blockbench first.

PokeAPI's sprite repository resolves cleanly. `abomasnow`, `chi-yu`, `ho-oh` and
`type-null` all returned 200, including the awkward hyphenated slugs.

## Decision

Pokemon artwork comes from `PokeAPI/sprites`, official-artwork set, keyed on national dex
id. The species slug to dex id map is built from one PokeAPI request and cached.

## Consequences

- Art is consistent and complete, but it is **official Pokemon artwork, not Cobblemon's
  in-game look**. The site will not look like the mod.
- Form variants reuse the base species image. Alolan Diglett shows Diglett's artwork.
  Recorded in `01-data/known-gaps.md`.
- `pokemon.national_dex_id` exists solely to drive this lookup.
- Swapping later costs nothing structural: rendering Cobblemon models and repointing
  `image_url` is a miner change, not a schema or API change.
