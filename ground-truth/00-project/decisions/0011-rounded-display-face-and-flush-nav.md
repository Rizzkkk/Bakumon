# ADR 0011 - Rounded display face, flush-left wiki nav, and a waving character

**Status**: accepted. **Date**: 2026-09-23. **Supersedes parts of ADR 0010.**

## Context

ADR 0010 made the design kit the source of truth for colour, type and layout. Three
requests from the owner depart from it, and ADR 0010's own precedent is that a kit
decision is reopened by a new ADR rather than by an edit to the stylesheet.

None of the three touches colour. `apps/web/src/styles/tokens.css` remains the only file
in the application that defines one, and every token in it is still the kit's.

## Decision

**The display face is Baloo 2, not Pixelify Sans.** The pixel face is what the owner
called "too edgey": it carries every heading, every nav item, every button and every chip,
so the site's whole voice was a blocky one. Baloo 2 is a rounded display face at the same
role and weights, OFL, and self-hosted on the same terms ADR 0010 set - one latin woff2
in `apps/web/public/fonts/`, never Google Fonts, because a CDN request on every page load
would contradict ADR 0007 and falsify the privacy page.

Only `--font-display` changes. Atkinson Hyperlegible keeps all prose and UI, and IBM Plex
Mono keeps the identifiers - ADR 0009's reason for a mono face is untouched, and Atkinson
was never the edgy one.

The font payload moves from 94,636 bytes across six files to 115,808 bytes across six:
Baloo 2's latin subset is 33,188 bytes against Pixelify Sans's 12,016, and it is a
variable face carrying 400-800 where the kit's carried 400-700. `pixelify-sans-latin-400-700.woff2`
is deleted rather than left in place, so nothing can quietly keep referencing it.

The 56 kit artboards still show the pixel face. They are the kit as delivered and are not
rewritten; this ADR is where the difference is recorded.

**The wiki nav is flush against the viewport's left edge**, not an inset bordered card.
The kit's artboards centre the whole wiki layout in a 1440px container, which at 1440px
leaves a dead gutter to the left of the nav and at wider viewports leaves more. The nav is
the primary control on every wiki page, so it takes the edge: full-bleed, sticky to the
top of the viewport at a full `100vh` so it reaches the bottom of the screen whether or not
its nav fills it, bordered only on its right. Its scrollbar is drawn thin in the panel's
own tokens rather than left as the platform's 17px slab. The content column keeps a centred
measure of its own, which is what the container was actually protecting.

It is also wider than the kit's 232px - 288px, and 332px from 1280px - and carries the
wiki search field above the nav. The kit put search only in the header, which on a wiki
page means the one control people reach for lives in a different region from the one they
are already pointing at. The nav rows grow with the panel: 16px on a 40px row against the
kit's 15px on 34px.

Below 768px nothing changes - the sidebar is still hidden, `WikiDrawer` is still the mobile
equivalent, and the search below 768px is still the header sub-bar's.

**The landing page's feature section carries a waving character.** ADR 0010 carried
forward ADR 0009's layout decisions and the kit has no character in this section; this
adds one. It is the same isometric render already justified by ADR 0010's hero note,
posed: `scripts/render-skin.js` gained a `--pose wave` mode that rotates the left arm at
the shoulder and emits two frames, which the page alternates with a CSS animation.

Two committed frames rather than motion in the browser, for the reason the renderer exists
at all: the landing page must render with the API down and must not pull a third-party
render at page load. The animation is a hard cut between two pixel-art frames, not a
cross-fade, and it is gated behind `prefers-reduced-motion: no-preference` - with reduced
motion the page holds frame a, in which the arm is already raised.

## Consequences

`render-skin.js` now draws all six faces of each box and selects the camera-facing ones by
the sign of the face normal against the view direction, where it previously hardcoded the
three faces an unposed box shows. A rotated limb exposes different faces, so the hardcoded
set was the thing in the way. The rewrite was checked against the committed render: at
`--scale 10` the unposed output differs from `assets/brand/character.png` in 2 pixels of
331,800, both at a seam where two faces tie for depth.

The frames of a pose are rendered onto one canvas and cropped to the union of their
content, because trimming each frame to its own bounds is what would make the body jump
between them.
