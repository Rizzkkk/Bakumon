#!/usr/bin/env bash
#
# Deploy Bakumon to the VPS. Run ON the box, from /srv/bakumon.
#
#   ./deploy/deploy.sh
#
# The whole reason this is a script and not a list in the runbook is ordering. Migrations
# must run BEFORE the code that reads the new columns starts (pre-production.md item 27),
# and the one time that ordering was left to a human on a comparable project, the SQL was
# never pasted and the API spent a day returning "column does not exist" as scattered
# unrelated 500s. A list can be half-followed. This cannot.
#
# Safe to re-run. The migration runner is idempotent and refuses to reapply a file whose
# contents changed, so running it every deploy is correct rather than risky.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

step() { printf '\n== %s\n' "$1"; }

# --- preconditions ------------------------------------------------------------------
# Checked up front rather than discovered halfway through, when half the deploy has landed.
step "checking preconditions"
: "${BAKUMON_API_DATABASE_URL:?set it to the bakumon_api (read-only) connection string}"
[ -f .env ] || { echo "no .env at $ROOT - the scripts read the OWNER DATABASE_URL from it"; exit 1; }
grep -q '^CORS_ORIGINS=.*bakumon\.net' .env || {
  echo "CORS_ORIGINS in .env does not mention bakumon.net."
  echo "CORS fails closed, so the site will load and every API call will be blocked."
  echo "APPEND the origin - never replace the line, that is how the dev origin gets lost."
  exit 1
}
command -v pm2 >/dev/null || { echo "pm2 not installed"; exit 1; }

step "pulling"
git pull --ff-only

step "installing (api workspace only)"
# The root package carries sharp and exceljs for ingestion, and that is where this repo's
# npm advisories live; the API workspace itself audits clean. The box does not ingest.
npm ci --omit=dev --workspace @bakumon/api

# --- schema BEFORE code -------------------------------------------------------------
# This ordering is the point of the script. db:schema connects as the OWNER from .env, not
# as the read-only role the API uses.
step "applying migrations (before any new code starts)"
npm run db:schema

step "building the frontend"
# VITE_SITE_URL is baked in at build time, so a missing value silently ships a site with no
# canonical tags rather than failing.
grep -q '^VITE_SITE_URL=' apps/web/.env || { echo "apps/web/.env has no VITE_SITE_URL - canonical tags would silently vanish"; exit 1; }
npm run web:build

step "restarting the API"
# --update-env so a changed ecosystem file or env var actually takes effect; without it
# PM2 reuses the environment captured at first start.
pm2 startOrReload deploy/ecosystem.config.cjs --update-env
pm2 save

# --- prove it -----------------------------------------------------------------------
# A deploy that "succeeded" and serves 500s is the failure this catches. smoke speaks HTTP
# only and takes API_URL, so the same assertions that run locally run against the box.
step "verifying"
sleep 2
API_URL="http://127.0.0.1:3001" npm run smoke

printf '\n[done] deployed. Check https://bakumon.net/ and https://bakumon.net/api/health\n'
