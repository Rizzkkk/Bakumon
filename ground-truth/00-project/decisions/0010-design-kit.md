# ADR 0010 - The design kit is the source of truth for colour, type and layout

**Status**: accepted. **Date**: 2026-09-23. **Supersedes parts of ADR 0009.**

## Context

ADR 0009 closed the open design-reference question by deciding to proceed without one. Its
own first sentence records why: "A reference that has not been produced in two weeks is not
a reference." The palette was derived from `Logo.png` by `npm run palette`, dark-first was
chosen, webfonts and Tailwind were declined, and the layout decisions were made from the
shape of the data.

A design kit has now been produced: `assets/bakumon-design.zip`, installed at `design/`. It
contains `tokens.css`, 56 HTML artboards covering every screen at 1440px and 390px in both
light and dark, a handoff document, and two transparent brand images.

ADR 0009 anticipated exactly this case and set the bar for reopening it: "A design reference
arriving later does not reopen this by itself; it needs a new ADR." This is that ADR.

## Decision

**The kit supersedes ADR 0009 on colour, typography and theme.** `design/tokens.css` is
copied to `apps/web/src/styles/tokens.css` and remains the only file in the application that
defines a colour. The `npm run palette` report stays in `reports/` as the record of how the
previous palette was derived; it is no longer what the site renders.

**Light and dark, with a toggle.** ADR 0009's dark-first decision rested on three reasons
and its own 2026-09-23 update already retired one of them - `logo-transparent.png` has a
real alpha channel, so the "renders as a solid rectangle" constraint is gone. That update
states plainly that building a light theme "needs no new ADR: the precondition this file
named has been met." The kit supplies both themes with measured contrast pairs, so the
remaining two reasons are now preferences rather than constraints. The theme follows
`prefers-color-scheme`, the toggle writes `data-theme` on `<html>`, and the choice persists
in `localStorage`.

That last clause is the one with a consequence outside the stylesheet: ADR 0007 says the
site collects nothing, and the privacy page says so. A stored theme preference is the first
thing the site keeps in a visitor's browser. It is strictly-necessary and not a cookie, so
no consent banner is required, **but it must be disclosed** - the privacy page gains a
"Stored in your browser" section. Shipping the toggle without that section would falsify a
published page.

**Three self-hosted webfonts**, reversing ADR 0009's "no webfonts in this pass": Pixelify
Sans for display, Atkinson Hyperlegible for body, IBM Plex Mono for the strings that are
literally identifiers. All three are OFL. They are served from `apps/web/public/fonts/` and
never from Google Fonts - a CDN request on every page load would contradict ADR 0007 and
falsify the same privacy page. The handoff document requires self-hosting independently.

ADR 0009's reason for a mono face is unchanged and the kit agrees with it: `%s Poke Puff`,
`#cobblemon:is_overworld` and `snake_pattern=attack` are identifiers, and rendering them
proportionally is how they get misread as prose.

**Not Tailwind still.** The kit's artboards are inline-styled mockups using three CSS
classes in total; there is no utility convention to port. ADR 0009's reasoning survives the
kit intact.

**ADR 0009's layout decisions are carried forward, not reversed.** A real `<table>` for
spawn rows, one table per species with a `<tbody>` per form rather than a table per form,
image-led Pokemon and icon-led items. The kit independently arrived at the same shapes,
including the `<details>` grouping per form that ADR 0009's 5,684px-vs-4,473px measurement
argued for.

**The `%s` placeholder chip from ADR 0009 is unchanged**, and so is its reasoning.

## Corrections the kit forced

**"Sorted by Pokedex number" is wrong.** `pokemon-index-d-light.html` prints it as a static
label with no control behind it. Every list query is bound to `ORDER BY display_name, id` by
ADR 0006, deliberately, so the seven duplicate-name pairs stay adjacent. The label is
rendered as **"Sorted by name"**. The API's ordering is not touched.

**The bucket and biome filters are multi-select in the kit and single-value in the API.**
The artboards show five bucket checkboxes, a multi-select biome list, and an empty state
reading "No Pokemon match all three filters" - copy that only means something if three
filters can be active at once. The API is extended to accept comma-separated `bucket` and
`biome`, OR'd within a dimension and AND'd across them, with a capped list length. This is
a query change; it reverses nothing.

**The landing page renders no screenshot gallery.** There is no gameplay screenshot in any
of the 56 artboards. `pre-production.md` item 7 - "six to eight server screenshots" - is
closed by the design rather than by supplying them, and `lib/screenshots.js` and
`ScreenshotGrid.jsx` are deleted rather than left waiting.

**A dedicated Open Graph image is now possible.** `pre-production.md` item 5 carried forward
that `logo-transparent.png` at 392x383 was "too small to upscale into a hero or a dedicated
Open Graph image, so the banner serves both." The kit's `logo.png` is 1267x1241 with a real
alpha channel, 3.2x the linear resolution, and it ships a `share-card.html` at 1200x630. The
constraint is gone.

## Consequences

`05-frontend/brand.md`'s palette and typography tables are superseded and are rewritten to
the kit's values. The contrast ratios recorded against the old tokens do not carry over and
are not reused; the kit's own measured pairs replace them.

Re-eyedropping a colour inside a component remains a defect rather than a style preference -
ADR 0009's rule, unchanged, now pointing at a different token file.

Adding a fourth font, a CDN font request, or any third-party script is a change to this ADR.

The two brand images the kit ships are installed as `assets/brand/logo-1267.png` and
`assets/brand/wordmark.png`. `logo-transparent.png` remains the favicon source because
`npm run brand` downsamples it with nearest-neighbour from a pixel grid that matches; the
1267px logo is the source for the hero and the share card.

## What this ADR does not decide

The legal routes stay at `/privacy-policy` and `/terms-of-service`. The artboards use
`/privacy` and `/terms`; renaming two live pages and every link to them buys nothing.

The mobile site-level drawer has no artboard - every mobile header shows an "Open site menu"
button and the kit designs only the wiki drawer. It is built to mirror the wiki drawer's
shell. If a later artboard disagrees, that is a defect to fix, not a decision to reverse.

## Update, on the spawn table shape

ADR 0009 measured a real choice and this ADR said the kit agreed with it. On implementation
that turned out to be half true, and the difference is worth stating rather than leaving as
a silent divergence.

ADR 0009 rejected "a table per form" because Magikarp's 32 forms produced 32 repeated
column headers and a 5,684px page against 4,473px for one table with a `<tbody>` per form.
The kit's `pokemon-detail-d-light.html` does give each form its own `<table>` with its own
`<thead>` - but inside a `<details>` that is closed by default.

The measurement ADR 0009 took was of a page where every form was always rendered. Collapsed,
the repeated headers are not on the page at all until a reader opens the group they belong
to, and the header is then adjacent to the rows it labels rather than scrolled far above
them. The implementation follows the kit.

What ADR 0009 was actually protecting - that a 32-form species must not become a wall of
repeated headers - holds. The mechanism is different. If `<details>` is ever changed to
render open by default, this reverses and ADR 0009's measurement applies again unchanged.
