# Changelog

All notable changes to this project are recorded here. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

This file is part of a change, not a follow-up to one: a phase is not done until its entry
is written. Every number quoted here names the command that produced it.

## [Unreleased]

Implementing the design kit from `assets/bakumon-design.zip`, phase by phase. ADR 0010
records what it supersedes.

### Added

- `CHANGELOG.md` - this file. The project had no change history of any kind.
- **Version control.** `git init`, 147 files in the first commit. Never run before;
  `pre-production.md` item 30 had been the stated first blocker since the project started.
  Done ahead of the design work because that work rewrites roughly 30 of the 41 frontend
  files and there was nothing to roll back to.
- `.gitattributes` pinning `eol=lf`. The deploy target is Linux (ADR 0005), the authoring
  machine is Windows, and `git add` reported 146 files it was about to convert to CRLF.
- `design/` - the design kit installed from the zip: `tokens.css`, `DESIGN-HANDOFF.md` and
  56 artboards covering every screen at 1440px and 390px in light and dark.
- `ADR 0010` (`ground-truth/00-project/decisions/0010-design-kit.md`) - the kit becomes the
  source of truth for colour, type and theme, superseding those parts of ADR 0009. ADR 0009
  set the bar for reopening itself ("it needs a new ADR"); this is that ADR. Its layout
  decisions are carried forward, not reversed - the kit independently arrived at the same
  `<table>`-per-species, `<tbody>`-per-form shape.
- `assets/brand/logo-1267.png` (1267x1241, RGBA, real alpha) and `assets/brand/wordmark.png`
  (2172x724, RGBA) from the kit. Measured with `sharp().metadata()`. The repo had no
  wordmark at all, and the logo is 3.2x the linear resolution of `logo-transparent.png`.
- `scripts/render-skin.js` / `npm run skin` - renders a Minecraft skin PNG as a static
  isometric character for the landing page. No browser and no WebGL: the landing page has
  to work with the API down, and a hosted render service would be a third-party request on
  every page load, which ADR 0007 rules out and the privacy page denies. Reads the 64x64
  (or legacy 64x32) skin directly, rasterises the three camera-facing planes of each body
  part with a per-pixel z-buffer, and writes a trimmed PNG plus 320px and 480px WebPs.
  Verified against a colour-coded fixture skin carrying three asymmetric markers, which is
  what caught the two defects worth recording: the camera was initially behind the
  character, because the projection's null axis was (1, 1, 1) rather than (1, -1, 1), which
  also made the front and side faces land in the same screen band instead of meeting at the
  silhouette edge; and depth was held per texel rather than per pixel, which made every arm
  and leg seam trade pixels and read as a zigzag.

- **Three self-hosted webfonts** in `apps/web/public/fonts/`: Pixelify Sans (display),
  Atkinson Hyperlegible (body) and IBM Plex Mono (identifiers). Latin subset only, all six
  files verified as real woff2 by their `wOF2` magic bytes, 94,636 bytes total. Served from
  the origin, never Google Fonts - a CDN request on every page load would contradict ADR
  0007 and falsify the privacy page. `grep -rn "fonts.googleapis\|fonts.gstatic"` over
  `apps/web/src`, `index.html` and the built `dist/` returns nothing.
- **Light and dark themes with a toggle.** `hooks/useTheme.js` follows
  `prefers-color-scheme` until an explicit choice is stored, and only then stops following
  system changes; every `localStorage` call is wrapped in try/catch so a private window
  renders rather than blanks. `components/common/ThemeToggle.jsx` is a 44x44 button whose
  `aria-label` names the destination theme, matching the artboards. An inline try/catch
  script in `index.html` sets `data-theme` before first paint, so there is no flash of the
  wrong theme.
- `components/common/PixelIcon.jsx` - one component with a rect-coordinate table, glyphs
  harvested from the artboards rather than invented. Returns nothing for an unknown name,
  so a missing glyph cannot blank a page.
- `apps/web/src/styles/fonts.css`, and the kit's `.gridbg` utility in `global.css`.

- `GET /api/pokemon` accepts comma-separated `bucket` and `biome`, OR'd within a dimension
  and AND'd across them, matching the design kit's five bucket checkboxes and multi-select
  biome list (ADR 0010). `readEnumList`/`readStringList` in `apps/api/src/lib/validate.js`
  cap the lists at 5 and 20 members respectively, trim and de-duplicate, and 400 on the
  first unknown member. `npm run smoke` measures `?bucket=common,rare` at total 733 (545 +
  220 - 32 species carrying both, `SELECT count(distinct pokemon_id) ... WHERE bucket IN
  ('common','rare')` and the two-set `INTERSECT`) and `?bucket=common&biome=%23cobblemon...`
  at 235, proving the two dimensions intersect rather than union.

### Changed

- `apps/web/src/styles/tokens.css` replaced wholesale with `design/tokens.css` (ADR 0010),
  plus `--radius`/`--gutter`/`--measure` which the kit omits and `global.css` uses, and
  `color-scheme` so native controls and scrollbars follow the theme. A clearly-marked
  compatibility shim at the foot of the file aliases the old dark-only token names to their
  kit equivalents; it exists so the site keeps rendering while the components are replaced
  phase by phase, and is deleted once nothing references a name on its left-hand side.
- `apps/web/src/styles/global.css` - the sole breakpoint moves from `max-width: 560px` to
  `767px`, which is the kit's only breakpoint and the one the type scale already used, so
  type and layout now change at the same width instead of 207px apart.

- `apps/api/src/queries/pokemon.queries.js` - the bucket predicate is now
  `s.bucket = ANY($n::text[])` and the biome predicate `s.biomes && $n::text[]` (array
  overlap, replacing `@> ARRAY[$1]`), kept as two separate `EXISTS` subqueries so a species
  needs a row in an allowed bucket AND a row in an allowed biome, not one row that is both.
  `npm run explain` re-plans both: a single-member biome list still reaches
  `Bitmap Index Scan on pokemon_spawns_biomes_idx` (0.3 ms, measured with a direct
  `EXPLAIN ANALYZE`), a two-member list that overlaps roughly half the 3,268 spawn rows
  seq-scans instead (1.7 ms) - the planner's correct call at this table size, not a
  regression; no index added.
- `GET /api/biomes`, `GET /api/pokemon/:slug` and `GET /api/items/:itemId` now call
  `assertKnownParams`, matching the two list endpoints instead of silently ignoring an
  unknown query parameter. `contract.md`'s "always a 400" claim was previously false for
  these three; the code was widened to match the doc rather than the doc narrowed.
- `ground-truth/05-frontend/brand.md` - asset inventory rebuilt around the two new files.
  `logo-transparent.png` is now described as the favicon source specifically, not as the
  general source of truth: `npm run brand` downsamples the favicons nearest-neighbour from
  its pixel grid, so it keeps that job while the 1267px file takes the hero and share card.

### Fixed

- Three documentation claims that went stale the moment `git init` ran:
  `ground-truth/README.md` ("`git init` has still never been run"),
  `05-frontend/brand.md` ("Nothing is literally tracked yet"), and
  `pre-production.md` item 34 ("CI is moot until item 30 is done"). Item 30 and the version
  control row in the state-of-play table are marked done with the file count.
- `pre-production.md` item 5 carried forward that `logo-transparent.png` at 392x383 was
  "too small to upscale into a hero or a dedicated Open Graph image, so the banner serves
  both". The kit's 1267px logo and its 1200x630 `share-card.html` remove that constraint.
  Recorded in ADR 0010; the share card itself is not built yet.
- Two CSS class-name collisions introduced by lifting the kit's utility classes into a
  stylesheet that already had rules of its own. `.art` meant "the image element" pre-kit and
  "the artwork slot" in the kit, and because the pre-kit `background` shorthand resets
  `background-image`, the kit's later rule won and put a checkerboard behind every artwork
  image. In the artboards that checkerboard is filler standing in for an image the mockup
  cannot show; in the running app a real image fills that slot, so it now sits on
  `.art--missing`, where a checkerboard means what it looks like. `.cta` meant a landing
  panel's flex layout pre-kit and the Discord button in the kit; the panel rule is renamed
  `.panel--cta`, which also removed the `!important` that had been papering over the clash.

- `ground-truth/04-api/contract.md` corrected against the code it describes: the biome
  filter SQL now quotes the real `&&`/`::text[]` shape instead of an `@> ARRAY[$1]` line
  that omitted the cast the code actually uses; the `Cache-Control` section now names the
  `max-age=60` every non-biomes endpoint sends via `apps/api/src/lib/cache.js`, not only
  the biomes `max-age=3600`; and the "held 45" line now cross-references the reconciliation
  a few lines below it, since `01-data/items.md` separately records "held 43" over a
  different population (backfilled items excluded) - both numbers stand, unreconciled by
  design, per the existing note not to fix that by changing either one.

### Removed

Nothing yet.
