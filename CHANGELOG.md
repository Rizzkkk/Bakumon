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

### Changed

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

### Removed

Nothing yet.
