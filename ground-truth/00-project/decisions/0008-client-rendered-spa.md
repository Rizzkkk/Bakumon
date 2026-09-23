# 0008 - The frontend is a client-rendered SPA

- **Status**: accepted
- **Date**: 2026-09-17

## Context

Social scrapers - Discord's link unfurler among them - fetch a URL and read `og:` meta
tags without running JavaScript. A client-rendered SPA serves one near-empty HTML shell
for every route, so every Bakumon link would unfurl to the same card regardless of which
Pokemon it points at.

The three ways out are: accept it, prerender every route to static HTML at build time, or
render on the server per request.

## Decision

Client-rendered SPA, built by Vite and served as static files by nginx. Site-wide `og:`
tags in `index.html`. The API serves JSON under `/api` only and never HTML.

## Consequences

- Per-Pokemon link previews do not work. A link to any page unfurls to the site-wide
  Bakumon card. This is the honest ceiling and the frontend must not ship per-route `og:`
  tags that no scraper will ever read.
- Per-page `<title>` is a different matter and **does** work client-side, for the browser
  tab and for Google, which does execute JavaScript. Titles are still per-page.
- Prerendering stays available as a later addition: it is a build step over the same
  components and routes, with no rewrite. To keep that true the frontend must not touch
  `window`, `document` or `localStorage` at module scope - only inside effects and event
  handlers.
- SSR was rejected because it makes the Node process serve the whole site. An API failure
  would take the site down with it, rather than degrading the wiki while the landing page
  and the Discord link stay up.
