# ADR 0009 - Visual direction, and closing the design-reference question

**Status**: accepted. **Date**: 2026-09-23.

## Context

`architecture.md` section 11 has carried an open question since the spec was written: a
wiki design reference recorded only as the string "CS.RU>RIN". It was never resolved into
a URL or a screenshot, and section 6 defers the layout of `WikiHome` and `PokemonDetail`
to it. Separately, `05-frontend/brand.md` recorded that no palette or typography had been
chosen and asked whoever built the site to extract one from the logo.

The frontend is the single largest remaining item (`pre-production.md`), and both of those
blocked it. A reference that has not been produced in two weeks is not a reference.

## Decision

Close the question without it.

**Palette.** Derived from `assets/brand/Logo.png` by `scripts/extract-palette.js`
(`npm run palette`), recorded in `reports/brand-palette.md`, and transcribed into
`05-frontend/brand.md`. Every colour in the application comes from
`apps/web/src/styles/tokens.css`, which mirrors that table. No component defines a hex.

Clustering is done in CIE Lab, not RGB. The logo is 85.4% near-black field, and euclidean
distance in RGB collapses every dark pixel into one cluster - the first run returned five
indistinguishable charcoals and no accent at all.

**Dark-first.** Three reasons, in order of how load-bearing they are. The logo's own field
is `#141414`. All 1,635 mined images are transparent-background art already composited
against dark. And - the honest one - `Logo.png` is PNG colour type 2 with no alpha
channel, so it renders as a solid rectangle on any surface but its own field. A light
theme needs the transparent re-export first (`pre-production.md` item 5) and is not built.

**Layout.** A card grid for results, image-led for Pokemon and icon-led for items. A real
`<table>` for spawn rows, because spawn data is genuinely tabular - a card per spawn row
would be 46 cards for Magikarp. One table per species with a `<tbody>` per form rather
than a table per form: Magikarp has 32 distinct forms, and a table each produced 32
repeated column headers and a 5,684px page against 4,473px for the grouped version.

**No webfonts and no CSS framework in this pass.** System sans for UI, system mono for the
strings that are literally identifiers - `cobblemon:ability_capsule`,
`#cobblemon:is_overworld`, `snake_pattern=attack`. Rendering those proportionally is how
they get misread as prose. Reasons recorded in `brand.md`.

**Not Tailwind**, despite `architecture.md` section 0 saying "pick Tailwind for speed
unless you object". This is roughly twenty components with one recorded palette. A token
file plus plain CSS delivers that with no build plugin, no config migration surface, and
no utility-class drift away from the recorded palette. Tailwind's advantage arrives at a
scale this application does not reach.

**A `%s` in a stored item name is rendered as a muted inline placeholder chip.** Four real
items - the Poke Puffs - carry a `%s` the game substitutes with a flavour at runtime, so
the workbook stores a template rather than a finished string. The token is shown, not
stripped: hiding it would hide real content a player can hold, and the API must not
rewrite a workbook value (ADR 0004). The raw string is preserved in the `title` attribute,
in the generated `alt` text, and in `document.title`. An explanatory line appears on the
item page, conditional on the name actually containing a placeholder.

This is a display decision at the point of use, which is where `known-gaps.md` always said
it belonged.

## Consequences

`architecture.md` section 11's first open item is closed, and its section 6 "pending on
your reply" paragraph is superseded. A design reference arriving later does not reopen
this by itself; it needs a new ADR.

Adding Tailwind or a webfont later is a change to this ADR, not a quiet dependency.
Re-eyedropping a colour inside a component is a defect, not a style preference.

The landing page and the legal pages are explicitly **not** in this pass. They are blocked
on inputs the repository does not have: a transparent logo, six to eight screenshots, and
a real contact address (`pre-production.md` items 5, 7 and 8).

## Update, 2026-09-23

Two of those three inputs arrived and the decision above is unchanged; this records what
is no longer true of its context.

`logo-transparent.png` was supplied, so the "no alpha channel" reason for dark-first no
longer holds - the other two do, and dark-first stands. **A light theme is still not
built**, and building one now needs no new ADR: the precondition this file named has been
met.

Contact routes to the Discord invite on both legal pages, so they shipped without the
email address item 8 asks for. The landing page shipped too, and renders no gallery at all
while `lib/screenshots.js` is empty - the screenshots remain a real blocker (item 7).
