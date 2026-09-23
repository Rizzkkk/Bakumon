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

**The wiki panels take the screen edges**, instead of sitting inset as bordered cards.
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

The Pokemon index's filter rail gets the opposite edge on the same terms: sticky, `100vh`,
bordered on its left only, 300px and 340px from 1280px. One CSS rule covers both panels,
because only the width and which side is bordered actually differ. `.filter-rail` keeps its
own padding and stack and stops drawing a box, since the slot around it is the box now.

Below 768px nothing changes - both panels are still hidden, `WikiDrawer` and `FilterSheet`
are still the mobile equivalents, and the search below 768px is still the header sub-bar's.

**The hero drops the kit's graph-paper grid.** `.gridbg` laid 32px rules across the whole
hero in `--grid`, and it is the one surface treatment on the site that is decoration rather
than structure. The hero keeps its flat `--hero` field and the grass skyline below it,
which is where the page's texture actually comes from. The class is deleted rather than
left unused; `--grid` stays defined, because `tokens.css` is the kit's file and nothing in
it is edited by hand.

**One character on the landing page, in the feature section's right margin.** ADR 0010
carried forward ADR 0009's layout decisions and the kit has no character in this section;
this adds one, and takes the other away. The hero's right slot goes back to the logo alone,
as `landing-d-light.html` always had it - the same render appearing twice on one page made
neither of them read as deliberate.

It is decoration, so it is placed as decoration: absolutely positioned into the page
margin beside the cards, at `left: calc(100% + 24px)` from the centred container. The card
grid keeps exactly the width it would have without it. The margin is also what gates it -
the container is 1100px, so `(100vw - 1100)/2` has to hold the character and its gap, which
happens at 1470px and not below. Below that there is no character rather than narrower
cards or a horizontal scrollbar.

**The render is front-on, not isometric.** The camera moved from the `(1, -1, 1)` dimetric
view the renderer was written around to `(0, -1, 0.34)`: the character faces -y, so a -y
camera is the one they are looking at. The dimetric view stood off their front-right and had
them looking past the reader, which is the wrong read for a figure whose whole job on the
page is to greet one. The `+z` term lifts the camera just above the eyeline, so the hat
brim, the shoulders and the boot tops stay in frame; at a flat `(0, -1, 0)` every face but
the front ones drops out and the render is a sheet of the skin file rather than a character.

`project()` and `nearness()` are now built from that vector through an orthonormal camera
frame rather than hardcoded, so the view is one constant to change. The wave also reads
better under it: the arm swings in the plane of the image instead of away from the viewer.
The waving arm is the character's left, which a front-on render mirrors onto the viewer's
right - away from the cards, rather than across the 24px gap into them.

**The image the page serves is generated art, not a render.** It shows the character
bursting through a smashed wall, which `render-skin.js` cannot draw: it knows the six boxes
of a Minecraft skin and can pose them, and has no concept of a wall, a hole or rubble. The
image was produced with Gemini's image model from the renderer's own front-on wave frame as
input, so the character in it is this skin rather than an invented one. `character-wave.png`
stays in `assets/brand/` as that input, which is the provenance of the generated file beside
it.

It arrived with a soft glow painted around the silhouette, which composited on the cream
page reads as a yellow halo. Every pixel of it is under half alpha, so `npm run brand`
hardens the mask to binary before trimming and encoding - a build step rather than a
one-off edit, so re-running the pipeline cannot quietly restore the halo.

**Static, not animated.** It was briefly two frames alternated by CSS. A figure holding a
pose at the edge of the page reads as a character; the same figure flapping reads as a
banner ad, and the motion was the first thing the eye went to on a page whose actual subject
is three cards. The renderer emits one frame per pose accordingly - the two-frame machinery
and its shared-canvas crop are gone rather than left dormant.

`render-skin.js` therefore no longer produces anything the site serves. It is kept, because
it made the input to what the site does serve and is the only way to make another.

The standing render is deleted with the placement it served - `character.png` and its two
WebPs. `npm run skin` still produces a standing pose by default, but under the new camera it
is a front-on one: the isometric render that file held is not reproducible without setting
`VIEW` back, and nothing on the site wants it.

## Consequences

`render-skin.js` now draws all six faces of each box and selects the camera-facing ones by
the sign of the face normal against the view direction, where it previously hardcoded the
three faces an unposed box shows. A rotated limb exposes different faces, so the hardcoded
set was the thing in the way. The rewrite was checked while the camera was still dimetric,
against the standing render committed at the time: at `--scale 10` the unposed output
differed from it in 2 pixels of 331,800, both at a seam where two faces tie for depth. That
check is what licensed the camera change that followed it, and it cannot be re-run now that
`VIEW` has moved.

The frames of a pose are rendered onto one canvas and cropped to the union of their
content, because trimming each frame to its own bounds is what would make the body jump
between them.
