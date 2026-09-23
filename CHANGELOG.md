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
- `assets/brand/character.png` (420x790) plus 320px and 480px WebPs, rendered from
  `assets/brand/skin.png` by `npm run skin`. Classic 4px arms, detected from the skin's
  back-arm columns rather than asked for. Committed as a static image, so the landing page
  gains a character without gaining a request or a dependency.

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

- **Phase 2: shell components.** `apps/web/src/styles/global.css` split into an entry point
  plus `shell.css` (header/drawer/sidebar/footer/wiki layout, this phase's), and empty
  `article.css`/`index.css`/`pages.css` placeholders for Phases 3-5, imported in that fixed
  order so later phases cannot collide on the same file. The pre-kit `.card`/`.chip`/
  `.panel`/`.hero__*`/table rules that PokemonCard, ItemCard, CategoryNav, SpawnTable, Hero
  and the legal pages still depend on were carried into their natural owner file rather
  than left in `global.css` (which the brief says must not keep component rules) or deleted
  outright - those pages are not rebuilt until Phase 4/5. Flagged here as a deliberate
  reading of "create these as EMPTY files", not a literal one.
- `components/layout/Header.jsx` rewritten to the kit: 76px desktop bar (logo, wordmark,
  `<nav aria-label="Main">`, a 380px `role="search"` on wiki routes only, then
  ThemeToggle + `CtaButton`), 64px mobile bar (36px logo, 44px theme button, 44px
  "Open site menu" button, Wiki link and the CTA leaving the bar), and a mobile wiki
  sub-bar ("Wiki menu" trigger plus a compact search input) on wiki routes.
- `components/common/Drawer.jsx` - one dialog shell (`role="dialog"`, focus trap, Escape,
  scroll lock, focus return) used by both the new site-menu drawer and
  `components/wiki/WikiDrawer.jsx`. The site-level drawer has no artboard (ADR 0010) and
  deliberately mirrors the wiki drawer's shell rather than inventing its own.
- `components/wiki/WikiNav.jsx` - one nav (Wiki / Pokemon / Items / Help, per
  `wiki-home-d-light.html`) rendered into both `WikiSidebar.jsx` (232px desktop `<aside>`)
  and `WikiDrawer.jsx`. The 904/934 counts are fetched from `listPokemon`/`listItems` with
  `pageSize=1` and shown as `...` until they arrive - never hardcoded, per the brief.
- `components/wiki/WikiLayout.jsx` - sidebar/drawer + `<main>` + an optional right-rail
  slot, wrapping every `/wiki*` route in `App.jsx`.
- `components/layout/Footer.jsx` rewritten to the kit's three-part layout (brand + legal
  disclaimer + `Attribution.jsx`, nav links, "No accounts. No tracking."). `Attribution.jsx`
  itself is unchanged - still licence-mandated, not decoration.
- `components/common/CtaButton.jsx` - the one site-wide call to action at its three kit
  sizes (44/52/60), importing `DISCORD_INVITE` from `lib/serverFacts.js` rather than
  retyping it.
- Shared primitives for Phases 4 and 5: `components/wiki/BucketChip.jsx` (five variants,
  ultra-rare's double frame from `tokens-board.html`), `components/wiki/BiomeLabel.jsx`
  (group icon + derived friendly name via the new `biomeLabel()` in `lib/labels.js`, raw
  token in mono and in `title`), `components/wiki/Breadcrumb.jsx`,
  `components/wiki/PageTitleBlock.jsx`, and `components/common/Skeleton.jsx` /
  `EmptyState.jsx` / `ErrorState.jsx` (loading is `role="status"` plus plain
  `var(--surface2)` rectangles - no shimmer, no `@keyframes`, matching the kit).
- `/wiki/pokemon` and `/wiki/items` routes in `App.jsx`, each a placeholder rendered inside
  `WikiLayout` until Phase 4 replaces the body.

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

- `scripts/render-skin.js` validates `--out` and `--scale`. `--out` is joined into a path,
  so a value of `../../elsewhere` wrote outside `assets/brand` entirely; it is now required
  to be a plain file name, the same containment reasoning as the dev asset middleware in
  `apps/web/vite.config.js`. `--scale` multiplies the render buffer in both dimensions, so
  an unbounded value asked for an enormous allocation - `--scale 9999` on a 400x790 figure
  is hundreds of gigabytes. Found independently by two review agents; verified by running
  both payloads and watching them exit 2.

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

- **The token compatibility shim.** It existed so the pre-kit components kept rendering
  while they were replaced phase by phase, and deleting it is the only real test of whether
  they actually moved: a grep for all fourteen old token names across `apps/web/src` now
  returns nothing outside the token file itself.
- `BucketBadge.jsx` and `bucketMeta()`. `BucketChip` does the same job from the kit's
  tokens, and the badge was the last thing keeping the five `--bucket-*` aliases alive. The
  `token` field is gone from `BUCKETS`, which is now the five slugs and labels and nothing
  else.
- `lib/screenshots.js` and `ScreenshotGrid.jsx`. No gameplay screenshot appears in any of
  the 56 artboards, which closes `pre-production.md` item 7 by design rather than by
  supplying the screenshots it asked for.
- `StateBlock.jsx`, replaced by `Skeleton`/`EmptyState`/`ErrorState`.
- `SearchBar.jsx`, `CategoryNav.jsx` and `ResultsGrid.jsx`. `WikiHome` stopped being the
  results page when the two index routes took that job.
- `EventSpawnPanel.jsx`, superseded by `LegendaryPanel`.

Each removal was checked for an importer first.
