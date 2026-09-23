# 0012 - Wiki-first Pokemon artwork, PokeAPI fallback

**Status**: accepted. **Date**: 2026-09-24. **Supersedes part of ADR 0001.**

## Context

ADR 0001 probed `wiki.cobblemon.com` for per-species pages and found none: a name search
returned 0 hits and `list=allimages` with a `Absol` prefix returned an empty list. That
probe was run against a handful of species during planning, not all 904, and it was right
about what it tested - there are still no per-species wiki pages. It went stale on a
narrower question: whether *any* `(model)` render images exist on the wiki at all.

Re-probed 2026-09-24 with `list=allimages` per species, all 904, rather than a name search
(the images are not linked from a page the name search would find). Measured against the
imported database:

- **66 of 904 species** have at least one `(model)` image on the wiki.
- **838 of 904** have none - ADR 0001's fallback to PokeAPI still covers the majority, and
  covers it completely (PokeAPI resolves for all 904, including hyphenated slugs like
  `chi-yu` and `type-null`).
- Of the 66, **65 are a regional form or a costume render**, not a plain portrait -
  `Cyndaquil_Hisuian_(Model).png`, `Arbok_Ink_(Model).png`,
  `Magikarp_Pink_Orca_(Model).png`, `Dragonite_(model,_messenger).png`. Exactly **one**,
  Bulbasaur, is a plain portrait.

ADR 0001 was not wrong about the wiki lacking per-species pages, and it was right to pick
PokeAPI as the resolvable, complete source. It was incomplete about scattered `(model)`
files existing outside that page structure - it says so ("only scattered `(model)` render
PNGs exist, for a minority of species") but did not probe how many, because the planning
pass judged a minority not worth building a picker for. This ADR is that build.

## Decision

Pokemon artwork is now **wiki-first, PokeAPI fallback**: a species with a wiki `(model)`
render uses it; every other species keeps using PokeAPI exactly as ADR 0001 set up. The
national-dex-id lookup ADR 0001 built is unchanged and still runs for the 838.

### The least-decorated picker rule

66 species is not zero, so a per-species choice has to exist, and most of those species
have more than one wiki image once regional forms, costumes and shiny variants are all
counted. The wiki has exactly one plain portrait in the whole set (Bulbasaur); everything
else is decorated in some way, so "prefer the undecorated one" resolves one case and leaves
65 needing a real rule. The rule applied: sort each species' candidate images by the length
of their decoration suffix (the parenthetical/underscore text after the base name) and take
the shortest, tie-broken by filename. This is not "the right" render by any Pokemon
authority - there isn't one on this wiki - it is a **deterministic** rule, so the same input
produces the same pick on every re-run of the miner rather than a pick that drifts with
MediaWiki's listing order.

## Consequences

- **65 of 66 pages now show a regional form or a costume as the species portrait.** A
  reader on Cyndaquil's page sees Hisuian Cyndaquil; a reader on Dragonite's page sees a
  Dragonite wearing a messenger bag. This is a real misrepresentation of "what the base
  species looks like" if left silent, which is why `pokemon.image_variant` exists
  (migration `0003_artwork_provenance.sql`) and why the detail page names the variant next
  to the artwork rather than only in a tooltip. The owner was told this plainly, twice, and
  chose the wiki renders anyway - this ADR records the decision, not a case for reversing
  it.
- **Attribution is now per-image, not site-wide.** A wiki render is CC BY 4.0 and requires
  credit and a licence link; a PokeAPI image is not under that licence. `image_source`
  drives which credit applies to which of the 904 - see `02-assets/attribution.md`.
- **`image_variant` is `NULL` for all 838 PokeAPI rows and for Bulbasaur**, the one plain
  wiki portrait. It is non-null only where a real decoration string exists to show, which
  the schema enforces: `image_variant` requires `image_source = 'wiki'`
  (`pokemon_image_variant_requires_wiki` in migration 0003).
- ADR 0001's consequence "form variants reuse the base species image" is now false for the
  66 - the wiki renders often *are* the form variant. `01-data/known-gaps.md` should be
  read alongside this ADR rather than trusted as still describing every species.
- Swapping the picker rule later (e.g. curating a plain-portrait allowlist by hand) is a
  miner change plus a re-import, not a schema or API change - `image_source` and
  `image_variant` already carry whatever the miner decides.
