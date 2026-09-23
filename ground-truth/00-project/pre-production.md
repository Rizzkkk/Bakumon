# Pre-production checklist

Audited against the repo on 2026-09-19 and re-audited 2026-09-23, not written from a
template. Current state: the data layer, the REST API and the website are all built and
verified. `apps/api/src/` holds routes, controllers, queries and middleware; `apps/web/src/`
holds 41 files across pages, components, hooks and lib, and `npm run web:build` is clean.

The 2026-09-19 header said "the website does not exist yet" and was left in place while
the state table below it was updated to say `done`, so this file contradicted itself for
four days. What remains is **deployment and version control**, not the site.

Blockers are marked **[blocker]**. Everything else can ship after launch without harm.

## State of play, 2026-09-23

| Layer | State |
|---|---|
| Workbook audit, import, validation | done - 26 of 26 checks |
| Asset mining | done - 1,635 files, 203 unresolved and explained |
| Database schema and migration ledger | done - two migrations, both applied |
| REST API | done - 58 of 58 smoke assertions, query plans measured; runs as a SELECT-only role |
| React frontend | **done** - landing, wiki, both legal pages, 404; builds and verified |
| Legal pages and attribution footer | **done** - `/privacy-policy`, `/terms-of-service`, footer on every page |
| Deployment | **not started, and no deployment artifact exists** |
| Version control | **done** - `git init` ran 2026-09-23, 147 files in the first commit |

The single largest remaining item is **deployment**, and behind it **version control**.
Items 13 to 23 were all facets of the frontend's absence and are now mostly closed; what
survives from that block is narrow and listed there - robots.txt and the sitemap (item 19),
per-page meta descriptions (item 16), and the absolute `og:image` URL that needs a domain
(item 23).

**Item 30 (`git init`) was the blocker to do first and is now done**, 2026-09-23, ahead of
the design-kit work that rewrites most of `apps/web`. 147 files in the first commit; the
three real `.env` files were correctly excluded and only the three `.env.example` files are
tracked, so the `.gitignore` is now in force rather than describing intentions to a tool
that was never started. No remote is configured yet - see item 31 and the runbook.


---

## Part 1 - Yours

Decisions and inputs that cannot be derived from the code or the workbook.

### Decisions

1. **[done] Duplicate species: 904.** Answered 2026-09-17, **ADR 0006**.
   Both spellings are kept. The workbook says there are two spawn rules and the workbook
   is authoritative, so the Pokedex shows seven pairs. Binds every list query to
   `ORDER BY display_name, id`.

2. **[done] Database host: Postgres on the Hostinger KVM2 VPS.** Answered 2026-09-17,
   **ADR 0005**. Artwork is served as static files from the same box, so the storage
   ceiling that would have bound a Supabase free tier is not a failure mode. The assets
   still need their own backup path - see item 26.

3. **[done] Analytics: no.** Answered 2026-09-17, **ADR 0007**.
   The site sets no cookies, so no consent banner is required and none is built. The
   privacy page says plainly that nothing is collected. Adding analytics later falsifies
   that page and needs a superseding ADR, not a script tag.

4. **Workbook re-export cadence.** Who updates
   `Cobblemon_Full_Pokemon_Wiki_No_Legendary.xlsx` when the server's spawn config changes,
   and how often? `npm run import && npm run validate` is the path; validation failing
   after a re-export is the intended signal that the sheet changed shape.

### Things only you have

5. **[done] Logo with an alpha channel.** Supplied 2026-09-23 as
   `assets/brand/logo-transparent.png` - verified 392x383, 4 channels, `hasAlpha=true`,
   corner pixels alpha 0. It is the source for the header mark and the favicon set, and
   `npm run brand` regenerates both. `Logo.png` (colour type 2, no alpha) is kept for
   reference and is referenced by no code.

   Carried forward, not closed: it is pixel art, so every render sets
   `image-rendering: pixelated`; and at 392px it is too small to upscale into a hero or a
   dedicated Open Graph image, so the banner serves both.


6. **[done] Server facts: everything routes through Discord.** Answered 2026-09-17.
   Invite: **https://discord.gg/MWGFKmw6pm**. The landing page does not publish a server
   address, versions, modpack link or join steps - joining the Discord is the instruction,
   and the details live there where they can change without a site deploy. The Discord
   CTA is therefore the landing page's single call to action, not one of several.

7. **[blocker] Screenshots of the server.** Six to eight good ones. Still none in the
   repo and there is no `assets/screenshots/`. **This is now the only thing missing from
   the landing page.** `apps/web/src/components/landing/ScreenshotGrid.jsx` is built and
   renders nothing at all while the list is empty, so the page is complete without them
   rather than showing placeholder tiles - drop the files in, list them in
   `apps/web/src/lib/screenshots.js` with alt text, and the gallery appears.

   This stays a **blocker**. The component existing does not produce the screenshots, and
   a landing page for a game server with no pictures of it is not finished. Two earlier
   revisions of this line argued with each other about whether `ScreenshotGrid` existed;
   it does, verified 2026-09-23, and that changes nothing about the blocker.

8. **[partial] A contact route for the privacy page.** Both legal pages now route
   contact to the Discord invite, which is real and reachable, so neither page ships a
   placeholder. An email address is still worth adding: someone who will not join a Discord
   to ask a privacy question currently has no way to reach anyone.

9. **[blocker] Domain and DNS access.** Plus the Hostinger VPS credentials, now that
   ADR 0005 has landed on the VPS.

10. **[answered 2026-09-23: 25 is current.]** Now published on every legendary-event
    Pokemon page, from the single constant `EVENT_PLAYER_THRESHOLD` in
    `apps/web/src/lib/serverFacts.js`. If the server config moves on, that is the one line
    to change.
    Original note: The workbook notes say Pebble
    Spawn Events need 25 players online. That number will be published on the site; if the
    server config has moved on, it is wrong the day we launch.
    Source: `ground-truth/01-data/server-notes.md`.

---

## Part 2 - Mine

In dependency order. Items 11 and 12 are done; nothing else below is started.

### Build

11. **[done] The REST API.** Built in `apps/api/src/`, all five endpoints plus
    `/api/health`. `npm run smoke` asserts 58 real values against it and exits non-zero on
    drift; `npm run explain` writes the query plans. Deviations from the contract shapes
    are recorded in `04-api/contract.md` under "What the built API adds".

12. **[done] API hardening, built in the same pass.** Every item below is in place and
    covered by a smoke assertion, except where noted.
    - Per-endpoint rate-limit buckets sized to real usage, not one shared bucket. A chatty
      search-as-you-type box will exhaust a shared one and surface as a mystery 429.
    - JSON `{error}` bodies, not the rate-limiter library's HTML default.
    - CORS fail-closed once configured, but allow no-Origin requests.
    - `app.set('trust proxy', 1)` behind nginx, or every visitor shares one rate bucket.
    - No internal config in any health endpoint.
    - Exclude localisation-fragment items from search results - names containing a
      `%1$s`-style placeholder. **Done, and it catches one row, not seven** - the other six
      have ordinary display names. Measured; see `01-data/known-gaps.md`.

13. **[done] The React frontend.** The **wiki** is built: `apps/web`, a Vite SPA with
    `/wiki`, `/wiki/pokemon/:slug` and `/wiki/items/:itemId`, search with relevance
    ranking, the 13 `sourceCategory` chips (not `category` - that is where berries,
    fossils and Poke Balls actually live), form-grouped spawn tables, and an event panel.
    `npm run web` runs it, `npm run verify:web` asserts its pure logic against the live
    API. Visual direction recorded in **ADR 0009**.

    **The landing page is built too**, verified 2026-09-23: `pages/Landing.jsx` is the
    `/` route in `App.jsx` - it does not redirect to `/wiki` - with `Hero`, `DiscordCTA`
    and `ScreenshotGrid`, plus `/privacy-policy`, `/terms-of-service` and a catch-all 404.
    It is complete except for the screenshots themselves (item 7).

14. **[done] The attribution footer.** Built as `components/layout/Attribution.jsx`, on
    every page, with the exact block from `02-assets/attribution.md`. Per-field wiki
    credit is rendered by `components/wiki/DescriptionPanel.jsx` when `descriptionSource`
    is `wiki`.
    Original note: Not decoration. 615 images and 155 descriptions
    are CC BY 4.0 and require attribution plus a licence link; removing it puts the site
    outside the terms. Wiki-sourced descriptions also need crediting at the point of use,
    which is why the API exposes `descriptionSource`.
    Exact block: `ground-truth/02-assets/attribution.md`.

15. **[done] Legal pages.** `/privacy-policy` and `/terms-of-service`, linked from the
    footer of every page, matching the paths `architecture.md` section 6 specifies. The
    copy is written and every claim on the privacy page is a fact about the deployed
    system rather than boilerplate - no cookies, no analytics, no accounts, no forms, and
    an honest paragraph about what the request log actually records. Contact routes to
    Discord, which `overview.md` records as the project's contact route.

    **If analytics are ever added, this page becomes false.** ADR 0007 requires a
    superseding ADR and a rewrite of this copy in the same change, not a script tag.

    Original note: **No cookie page**: item 3 is decided
    and ADR 0007 cancelled it, because the site sets no cookies and there is nothing to
    consent to. With no analytics and no accounts these are short and can say honestly
    that nothing is collected. The copy is not drafted yet either - that is a content
    task, not just a component.

### Launch checklist, audited against this repo

All of the following are **missing** - I checked, none of it exists yet:

16. **[partial] Per-page `<title>`.** Done - `usePageTitle`, set inside an effect so
    prerendering stays possible (ADR 0008). Per-page meta descriptions are not done and
    have the same client-rendered ceiling as `og:` tags; the site-wide one is in
    `index.html`.
17. **[done] Favicon set.** `icon-32`, `icon-180` and `icon-512`, generated by
    `npm run brand` from the transparent logo, nearest-neighbour because the mark is pixel
    art, and encoded as indexed PNG - truecolour put `icon-512` at 232 KB against 47 KB.
    `icon-512` exceeds the 392px source, so the art is padded onto a transparent canvas at
    1:1 rather than enlarged 1.306x, which would have blurred it.
18. **[done] Alt text on every image.** Generated at render time by
    `apps/web/src/lib/altText.js` - "Abra official artwork", "Ability Capsule item icon".
    The item variant deliberately uses the raw stored name, placeholder and all, because
    alt text is read aloud where the visual placeholder chip cannot exist.
    Original note: 1,635 of them, so this has to be *generated* from display
    names at render time - "Abra official artwork", "Ability Capsule item icon" - not
    hand-written. Worth designing in rather than retrofitting.
19. **robots.txt** and **sitemap.xml**. The sitemap should be generated from the database,
    not hand-maintained: 904 Pokemon plus 934 item pages.
20. **[done] Custom 404 page.** `apps/web/src/pages/NotFound.jsx` on the catch-all route.
    Note nginx still needs `try_files $uri $uri/ /index.html` or a deep link 404s before
    React sees it - `06-deployment/runbook.md`.
21. **[done] Loading, empty and error states.** One `StateBlock` component with four
    variants - loading, empty, error and rate-limited - used by the results grid, both
    detail pages and the description panel. A 429 renders its `Retry-After` with a manual
    retry button and is never retried automatically.
22. **[done] Mobile breakpoints and a CTA above the fold.** Verified at 375px: zero
    horizontal overflow on the landing page, the wiki and a detail page, and the "Join the
    Discord" button sits at 395px against a 700px fold.
23. **[done] Open Graph image.** The banner at 1280px (184 KB WebP) with explicit
    `og:image:width`/`height`, plus `og:type`, `og:site_name`, `og:title`, `og:description`
    and `twitter:card` - all site-wide in `index.html`. **One thing still to do at deploy:**
    `og:image` is root-relative. Discord and most scrapers resolve that, but the spec wants
    an absolute URL, so set it and `og:url` once the domain is known.

    Original note on the ceiling: a client-rendered SPA **cannot** do
    per-page OG tags, because social scrapers do not run JavaScript. Site-wide tags in
    `index.html` are as far as this goes without SSR or prerendering. Per-page `<title>`
    is different and does work client-side.

### Operations

24. **[done] Compress the brand images.** `npm run brand`
    (`scripts/compress-brand.js`), measured in `reports/brand-images.md`:

    | | Before | After |
    |---|---|---|
    | Banner, full width | 2,278 KB PNG | **258 KB** WebP |
    | Banner, 768px phone | 2,278 KB | **85 KB** |
    | Logo | 186 KB PNG | **16 KB** WebP |

    Served with `srcset` at 768 / 1280 / 1672. The PNG originals stay in the repository
    and are never served.
25. **[done] Serve thumbnails on grids, not originals.** The Pokemon grid consumes
    `thumbUrl`; the item grid uses `imageUrl` deliberately. Measured on disk, 2026-09-23:

    | Set | Files | Total | Mean |
    |---|---|---|---|
    | `assets/pokemon/` | 904 | 116,276,661 B | 128,624 B |
    | `assets/thumbs/pokemon/` | 904 | 10,904,808 B | 12,062 B |
    | `assets/items/` | **731** | 1,009,617 B | **1,381 B** |
    | `assets/thumbs/items/` | 731 | 467,268 B | 639 B |

    A 24-card Pokemon page is ~289 KB of thumbnails against ~3.0 MB of originals, which is
    what this item was really about. A 24-card item page is ~33 KB either way, because item
    art is 16x16 game texture - so item thumbnails would save around 18 KB per page.

    **An earlier revision of this line claimed "both the list and detail responses return
    `thumbUrl`". That was false for items**: migration `0001_initial_schema.sql` gives
    `thumb_url` to `pokemon` only, and the items shape in `04-api/contract.md` has never
    carried it. Adding `items.thumb_url` would cost a migration, a backfill, a contract
    change and two new assertions to save 18 KB per page, and was declined on that basis.
    `assets/thumbs/items/` is generated by `npm run mine` and is not served.
26. **[blocker] An asset backup path.** A database backup does **not** cover the 3,270
    files and 129 MB in `assets/`. Either back that up separately or accept `npm run mine`
    as the documented recovery path - which means accepting a dependency on the Cobblemon
    wiki staying online.
27. **[blocker] Deploy order: migrations before code.** `npm run db:schema` must run
    against the target before any code reading the new columns starts. The runner is
    idempotent and refuses to reapply a changed file, so running it every deploy is safe.
28. **Static file serving** for `assets/` via nginx, with cache headers. The files are
    content-addressed by name and never change, so they can be cached hard.
29. **SSL via Certbot**, and an edge/CDN layer if this is expected to get traffic - app
    level rate limiting runs inside the process being attacked and does nothing against a
    volumetric attack.

---

### Repository and toolchain

Added 2026-09-19 after an audit found these missing entirely. None were on this list
before, which is why none of them had ever been actioned.

30. **[done] `git init`.** Ran 2026-09-23, before the design-kit work began, because that
    work rewrites roughly 30 of the 41 frontend files and there was nothing to roll back
    to. 147 files in the first commit. Verified at stage time that the three real `.env`
    files were excluded and only the `.env.example` files tracked, so the `.gitignore` is
    in force. A `.gitattributes` pinning `eol=lf` was added in the same commit: the deploy
    target is Linux (ADR 0005) and the authoring machine is Windows.

    Still open, and moved to item 31: no remote, so there is still no way to deploy by
    pulling.

31. **No deployment artifacts exist.** Everything about deployment lives as prose in
    `06-deployment/runbook.md`. Missing as files: a Dockerfile for the API, an nginx config
    (the runbook has a three-line snippet), a PM2 ecosystem file - so the `instances: 1`
    constraint the in-memory rate limiter depends on is enforced only by someone
    remembering it - and any deploy script that would enforce item 27's migrations-before-
    code ordering.

32. **No backup script for `assets/`.** Item 26 records the decision as open; nothing in
    `scripts/` matches `*backup*`. 3,270 files, all gitignored.

33. **[done] The root `.env.example` is incomplete.** `apps/api/src/config.js` reads the
    **repository root** `.env` and needs `DATABASE_URL`, `PORT` and `CORS_ORIGINS`. The
    root example lists only `DATABASE_URL`; the complete list is in `apps/api/.env.example`,
    which no code reads. A deployer copying the root example gets an API whose
    `CORS_ORIGINS` is empty - which fails closed and blocks every browser request, exactly
    as designed, but for a reason that will take an hour to find.

    Fixed 2026-09-23: the root `.env.example` now carries all three with the reason. The
    frontend needs its own `apps/web/.env` with `VITE_API_BASE_URL`, which is read at
    **build** time and baked into the bundle - changing it needs a rebuild, not a restart.

34. **No test runner, no linter, no CI.** `npm run validate` and `npm run smoke` are real
    assertion suites and cover the data and the HTTP contract well, but there is no harness
    for unit-testing API internals and nothing in the frontend beyond `npm run verify:web`,
    which exercises four pure logic modules and asserts nothing about rendering. Item 30 no
    longer blocks CI; nothing else does either, so this is now the honest top of the
    engineering-hygiene list.

    Sharpened by the design-kit work: a full visual redesign cannot fail any check in this
    repository. Every phase gate is a manual pass plus an agent review, which is weaker
    than a suite and should not be mistaken for one.

## Security and resilience review, 2026-09-23

Five independent agents swept the API, the scripts and the deployment plan
(`cybersecurity`, `code-reviewer-cwe`, `chaos-resilience`, `antipattern-auditor`,
`performance-engineer`). Each finding below was verified by reading the cited line before
it was acted on. Fixed in the same pass:

- **API bound every interface.** `listen(config.PORT)` with no host published Node
  directly on the VPS. A request reaching it without passing through nginx makes the
  client the single trusted hop `trust proxy: 1` assumes, so `X-Forwarded-For` becomes
  attacker-controlled and every rate-limit bucket forgeable. Now `config.HOST`, default
  `127.0.0.1`.
- **`docker-compose.yml` published Postgres on `0.0.0.0:55432`** with the example
  credentials. Docker writes its own iptables rules and bypasses `ufw`, so `npm run db:up`
  on a server would have exposed it. Now loopback-bound.
- **The health probe was `SELECT 1`**, which is answered without touching a relation - so
  it stayed green through a table lock or a half-applied migration while every endpoint
  500'd. Now reads a real row from `pokemon`.
- **No `Cache-Control` on the four hot endpoints**, which made an edge layer nearly
  useless for the requests that cost the most. Now 60s on lists and details, asserted.
- **Six spawn rows stored NaN instead of null** - see `01-data/known-gaps.md`.

### Open, with the reason

35. **`sharp` 0.33.5 has two High advisories** (GHSA-f88m-g3jw-g9cj, GHSA-rgj7-g3m4-5g8c,
    inherited from libvips and libheif), confirmed by a real `npm audit` lookup rather
    than version pattern-matching. `scripts/mine-assets.js` pipes remote image bytes
    straight into `sharp(buffer)`, so a crafted image on the community wiki would be
    decoded by a vulnerable decoder. The trigger is a developer running `npm run mine`,
    not a request path, which is why this is not a launch blocker - but it is a one-line
    fix (`sharp@^0.35.4`) plus a `npm run mine` run to confirm thumbnails regenerate.
36. **nginx has no security headers, no `gzip` for `application/json`, no `limit_req` and
    no explicit `root`.** All four belong in the nginx config file that item 31 already
    says does not exist. The `root` one matters most: if it points at the checkout rather
    than at `apps/web/dist`, `GET /.env` returns `DATABASE_URL` in plaintext. Write
    `root /srv/bakumon/dist;` explicitly and add `location ~ /\. { deny all; }`.
37. **No firewall step in the runbook.** The loopback bind above is the control; `ufw
    default deny incoming` plus `allow 22,80,443` is the backstop.
38. **No PM2 ecosystem file**, so `instances: 1` - which the in-memory rate limiter
    depends on - is enforced by someone remembering it. It is also where `kill_timeout`
    belongs: PM2 SIGKILLs 1.6s after the signal by default, so the 5s graceful shutdown in
    `index.js` never actually completes. And `pm2 install pm2-logrotate`: nothing rotates
    the request log today, and it shares a disk with the Postgres data directory.
39. **No Postgres backup.** ADR 0005 says "the runbook owns both"; it does not. Rebuilding
    from the workbook is possible but loses `wiki_description` and the mined artwork until
    `npm run mine` re-runs, and that path has never been timed.
40. **[done 2026-09-23] The API connects as a SELECT-only role.** Migration
    `0002_api_read_only_role.sql` creates `bakumon_api` with `SELECT` on the four data
    tables and nothing else - not `INSERT`, not `schema_migrations`. Three assertions in
    `npm run validate` pin it, and the negative one carries the decision: a check that only
    asserts it can read stays green against a superuser. Proven by running the API as that
    role and passing all 58 smoke assertions, which is the only way a missing grant
    surfaces - `npm run validate` connects as the owner. The password is a runbook step,
    deliberately not in the checksummed migration file.
41. **`scripts/lib/db.js` sets no timeouts**, unlike the API pool. `npm run mine` holds one
    client for a multi-hour run; if that connection is silently reaped the next query hangs
    with no timer to fire.

Explicitly **not** acted on, because each is a recorded decision the reviewer lacked
context for: the printf-name exclusion, the 934/933/932 three-population split, the
absence of auth, and the in-memory rate limiter (correct on a single persistent process).
Every index suggestion against `pokemon` and `pokemon_spawns` was also declined: the whole
database is 11 MB and entirely resident in shared buffers, the unfiltered list is a 19-page
sequential scan in 0.089 ms, and `bucket=common` selects 43% of rows, which no btree would
serve. Measured, not assumed - `reports/query-plans.md`.

## What is already done

Not repeated above, but worth knowing so nobody redoes it:

- Workbook audited, 26 of 26 import assertions passing, full clean rebuild reproduces
- Schema with a checksummed migration ledger; the tamper guard is tested and fires
- 904 of 904 Pokemon images, 731 item images, 155 recovered descriptions
- Provenance and licence recorded per file in `assets/manifest.json`
- `.gitignore` verified against 14 cases; no Claude state can enter the repo
