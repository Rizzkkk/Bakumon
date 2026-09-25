# Deployment runbook

**Nothing is deployed yet**, but the target is now decided: Postgres 16 and the API both
on the Hostinger KVM2 VPS, nginx in front, artwork served as static files from the same
box (ADR 0005).

## Local development, which does work

```
npm install
npm run db:up        # Postgres 16 in Docker, mapped to localhost:55432
npm run db:schema
npm run import
npm run validate     # exits non-zero on drift
npm run mine
npm run api          # Express on :3001
npm run web          # Vite dev server on :5173
npm run web:build    # static build into apps/web/dist
npm run verify:web   # frontend logic against the running API
npm run smoke        # exits non-zero if the API drifts from the contract
npm run explain      # regenerates ground-truth/reports/query-plans.md
```

Port 55432 rather than 5432, deliberately - it does not collide with a Postgres already
installed on the machine.

## Running the API on the VPS

Install only what the API needs. The root package carries `sharp` and `exceljs` for
ingestion, and those are where all of this repo's current npm advisories live - the API
workspace itself audits clean:

```
npm ci --omit=dev --workspace @bakumon/api
pm2 start apps/api/src/index.js --name bakumon-api
```

**PM2 must stay at `instances: 1`.** The rate limiter keeps its buckets in process memory,
so a cluster would give each worker its own budget and multiply every limit by the worker
count. Moving to cluster mode means moving the limiter to a shared store first.

### Two database roles, not one

Migration `0002_api_read_only_role.sql` creates `bakumon_api`, a LOGIN role with `SELECT`
on the four data tables and nothing else - not `INSERT`, not `schema_migrations`. The
migration deliberately carries **no password**, because it is committed and checksummed.
Set one once per environment, out of band:

```sql
ALTER ROLE bakumon_api PASSWORD '<generated>';
```

Then the two halves of this repo connect as different roles:

| Who | Role | Why |
|---|---|---|
| The API (`pm2 start`) | `bakumon_api` | Every query is a `SELECT`; the database now enforces that rather than trusting it. |
| `npm run import`, `db:schema`, `mine` | the owning role | They write. Pointing these at `bakumon_api` makes `npm run import` fail with "permission denied for table pokemon". |

Both read the same root `.env`, so they cannot both take `DATABASE_URL` from it. An
environment variable wins over the file (`apps/api/src/config.js`), so the root `.env`
holds the **owner** URL for the scripts and PM2 supplies the read-only URL to the API - one
more reason the ecosystem file in `pre-production.md` item 31 is worth writing.

Proof the grant list is complete: start the API as `bakumon_api` and run `npm run smoke`.
All 58 must pass. Done locally on 2026-09-23; a missing grant shows up there and nowhere
else, because `npm run validate` connects as the owner.

The API reads the **repository root `.env`**, the same file the ingest scripts use. It
needs three variables:

| Variable | Notes |
|---|---|
| `DATABASE_URL` | The only host-specific coupling in the codebase. The API's should be the `bakumon_api` role - see above. |
| `PORT` | Default 3001, which is what the nginx block below proxies to. |
| `CORS_ORIGINS` | Comma-separated. **Empty means no browser origin is allowed** - CORS fails closed, so this must be set to the real site origin before the frontend goes live. |

### Firewall

Before anything listens on a public address. Postgres binds to loopback and the API binds
to 127.0.0.1:3001 behind nginx, so neither should ever be reachable from outside - but the
bind is the control and this is the backstop, and backstops are what catch the day someone
changes a bind while debugging.

```
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80,443/tcp
ufw enable
```

Do **not** open 5432 or 3001. If Postgres needs to be reached from a laptop, tunnel it over
SSH rather than exposing the port.

### nginx

`/api` proxies to the Node process; `/assets` is served straight off disk; everything else
is the SPA build, which needs a catch-all to `index.html` because routing is client-side
(ADR 0008).

The installable file is **`deploy/nginx.conf`** - this snippet is the shape of it, not the
thing to paste:

```
location /api/ { proxy_pass http://127.0.0.1:3001; proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; }
location /assets/ { alias /srv/bakumon/assets/; expires 30d; }
location / { try_files $uri $uri/ /index.html; }
```

`deploy/nginx.conf` adds what this snippet leaves out and what item 36 asked for: an
explicit `root` (at `/srv/bakumon/apps/web/dist` - `npm run web:build` writes inside the
workspace, so the `/srv/bakumon/dist` item 36 named does not exist), `location ~ /\. { deny
all; }` so a misconfigured root still cannot serve `.env`, the five security headers, gzip
for `application/json`, and two separate `limit_req` zones so a crawler walking the 1,844
sitemap URLs cannot exhaust the budget real API calls need.

The API sets `trust proxy` to **1**, meaning exactly one hop. If another proxy or a CDN is
ever put in front, that number has to change or every visitor behind it shares one
rate-limit bucket. Setting it to `true` instead would let any client forge
`X-Forwarded-For` and mint itself a fresh bucket per request.

### Verifying a deploy

`npm run smoke` speaks HTTP only and takes `API_URL`, so the same 55 assertions that run
against localhost run against the box:

```
API_URL=https://<domain> npm run smoke
```

## What deployment will have to handle


### The images are not in the database

About 3,270 files totalling 129 MB - 1,635 originals plus a thumbnail each - live in
`assets/` and are **gitignored**. A fresh
deploy has no artwork until `npm run mine` runs, which takes a few minutes and depends on
two external hosts being up.

`assets/manifest.json` is **not** gitignored, so provenance survives even when the files
do not - once the repo is actually under version control.

**A database backup does not back these up.** Either back up `assets/` separately or treat
`npm run mine` as the recovery path and accept the dependency on the Cobblemon wiki
staying online.

### Schema before code

`npm run db:schema` must run against the target environment **before** any code that reads
the new columns is started. The runner is idempotent and refuses to reapply a changed
file, so running it on every deploy is safe and is the intended usage.

### The workbook is the input, and it is not in the database

`Cobblemon_Full_Pokemon_Wiki_No_Legendary.xlsx` at the repo root is the source of truth.
When the server's spawn config changes, the workbook is re-exported and
`npm run import && npm run validate` re-runs. Validation failing after a re-export is the
expected signal that the new workbook changed shape - read
`ground-truth/reports/workbook-audit.md` before touching the parser.

## The frontend

`npm run web:build` writes `apps/web/dist`; nginx serves that as the site root. The
`try_files` line above is what makes a deep link such as `/wiki/pokemon/magikarp` resolve
instead of 404ing before React ever loads.

**`VITE_API_BASE_URL` is a build-time variable, not a runtime one.** Vite substitutes it
into the bundle at build, so changing it requires a rebuild and a redeploy - restarting
anything achieves nothing. It lives in `apps/web/.env`. This is the one genuinely
surprising property of deploying this frontend.

**`CORS_ORIGINS` must list the real site origin before the frontend goes live.** It fails
closed by design, so an empty or wrong value blocks every browser request while curl and
`npm run smoke` keep working - the failure is invisible from the server side. In local
development it is `http://localhost:5173`, because there is deliberately no Vite dev proxy
for `/api`: a proxy would make dev same-origin and CORS would first be exercised in
production, which is exactly the wrong place to discover it.

The artwork must be served from the same origin as the SPA. `image_url` and `thumb_url`
are root-relative `/assets/...` paths and ADR 0005 forbids the API rewriting them, so the
`location /assets/` block is not optional - without it every image on the site 404s. The
Vite config mounts the same path locally for the same reason.

## A collation note

`ORDER BY name` on the items listing puts `%s Poke Puff` first, because `%` sorts before
letters under the `en_US.utf8` collation the dev container uses. A Postgres built with a
different collation may sort it under S instead. One smoke assertion pins it at position
one and says so in its name, so if that check ever fails on a new box, read the name
before assuming a defect.

## Still to decide

- Whether `npm run mine` runs on a schedule or by hand.
- The backup path for `assets/`: a real copy, or accepting `npm run mine` as recovery.
- Domain, DNS and TLS (Certbot), once the domain exists.

ADR 0005 answered the first two items that used to be here: Postgres on the VPS, and
`assets/` served directly by nginx rather than from object storage.
