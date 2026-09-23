# Bakumon website: design handoff

Build target: client-rendered SPA, Vite + React, static files behind nginx.

## What's in this folder

- `tokens.css`: every color (light and dark), font family and type size. Components use `var(--token)` only, never raw hex values.
- `artboards/`: one HTML mockup per screen. The file names follow `<screen>-<d|m>-<light|dark>.html`, where `d` = desktop (1440 px) and `m` = mobile (390 px). Open them in a browser to see each screen. Treat them as visual reference, not production code: the markup is inline-styled mockup HTML.
- `assets/`: `logo.png` (1267×1241, transparent) and `wordmark.png` (2172×724, transparent).

## Screens

| Route | Artboards |
|---|---|
| `/` landing | `landing-*` |
| `/wiki` wiki main page | `wiki-home-*`, `wiki-menu-m-*` (mobile drawer) |
| `/wiki/pokemon` list, 24 per page | `pokemon-index-*`, `filter-sheet-m-*` |
| `/wiki/pokemon/:id` article | `pokemon-detail-*` (Magikarp, aspect groups), `ditto-detail-*` (two buckets), `legendary-detail-*` (legendary) |
| `/wiki/items` list, 24 per page | `items-index-*` |
| `/wiki/items/:id` article | `item-detail-*` |
| 404, `/privacy`, `/terms` | `not-found-*`, `privacy-*`, `terms-*` |
| Loading / empty / error states | `states-pokemon-*`, `states-detail-*`, `states-items-*` |
| Tokens and share card | `tokens-board.html`, `share-card.html` |

## Shared components to build first

1. **Site header**: logo + "Bakumon", Wiki link, wiki search (on wiki pages), theme toggle, Join the Discord button. On mobile, wiki pages add a "Wiki menu" button and a search bar.
2. **Wiki layout**: left sidebar nav (desktop) or drawer (mobile), then the article. Some pages add a right rail (the Pokemon list filters).
3. **Article parts**: title block with breadcrumb, contents box, infobox (summary box on the right; on mobile it sits above the text), section headings with a bottom rule, and a table style for lists.
4. **Bucket chip**: common, uncommon, rare, ultra-rare, legendary. Each has its own glyph, so the buckets are distinguishable without color. Ultra-rare must look at least as prominent as rare (double frame). A species can have several chips; never assume one bucket per species.
5. **Biome label**: a biome tag like `#cobblemon:is_temperate` shows as "Temperate biomes" with a group icon, with the raw token in small mono text underneath. A single biome shows its name with a tree icon.
6. **Spawn-row group**: a collapsible group per form/aspect. Desktop shows a table (Bucket, Weight, Level, Context, Biomes, Conditions); mobile shows stacked cards.
7. **Legendary block**: its own panel saying the Pokemon spawns at random. Legendaries never appear inside a normal spawn table.
8. **Wiki credit line**: small, muted, directly under any description whose `descriptionSource` is `wiki`. It names the Cobblemon Wiki page and CC BY 4.0, with links. Workbook descriptions show "Written by the Bakumon team."
9. **Footer**: disclaimer (not affiliated with Cobblemon, The Pokemon Company, Nintendo or Mojang), Privacy and Terms links.
10. **States**: skeleton loading, empty result (active filters shown as removable chips, plus "Clear all filters"), and error ("Try again" and a Discord link). The landing page must keep working when the API is down.

## Rules

- One call to action site-wide: Join the Discord (https://discord.gg/MWGFKmw6pm). No server IP, version numbers or join steps on the site.
- No third-party analytics, ever. Self-host the three fonts (Pixelify Sans, Atkinson Hyperlegible, IBM Plex Mono) instead of loading them from Google Fonts.
- No accounts, logins, comments or user-generated content.
- No emojis in UI copy. Icons are small pixel-art SVGs (see the artboards).
- One site-wide og:image (`share-card.html`, 1200×630). Per-route `<title>` values: "Magikarp · Bakumon Wiki" and so on.
- Alt text on every image. Keep touch targets at least 44 px and text contrast at WCAG AA or better (the token pairs already pass).
- Theme follows the system setting by default; the toggle sets `data-theme` on `<html>` and remembers the choice in localStorage.

## Placeholders still to fill

- Legal pages: `[DATE]`, `[RETENTION PERIOD]` (web server access logs), `[CONTACT ADDRESS]`.
- Sample data in the mockups (buckets, weights, levels, biome and form counts, item list) is illustrative. Use the real API data.
- Legendary spawns: confirm whether random spawns still have a level range and biomes. The mockup shows both as placeholders.
