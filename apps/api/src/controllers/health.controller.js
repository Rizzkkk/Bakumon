import { one } from '../db/pool.js';
import { log } from '../lib/log.js';

const CACHE_MS = 5_000;
let cached = { at: 0, ok: false };
let inFlight = null;

// Concurrent callers share one probe. Stamping the cache only after the query settled let
// every request arriving in the gap start its own SELECT 1 - worst exactly when the
// database is down, since each then waits the full connect timeout holding a pool slot.
function probe() {
  if (inFlight) return inFlight;
  // Reads a real table rather than SELECT 1. SELECT 1 is answered without touching a
  // relation, so it stays green through exactly the partial failures that matter: an
  // ACCESS EXCLUSIVE lock on pokemon, or code deployed ahead of its migration. Both make
  // every endpoint 500 while a SELECT 1 probe reports ok - an uptime checker seeing a
  // healthy site through a total outage. Still one index-only row, still leaks nothing.
  inFlight = one('SELECT 1 FROM pokemon LIMIT 1')
    .then(() => { cached = { at: Date.now(), ok: true }; })
    .catch((error) => {
      log.error('health check failed', error);
      cached = { at: Date.now(), ok: false };
    })
    .finally(() => { inFlight = null; });
  return inFlight;
}

export async function getHealth(req, res) {
  // Cached so an uptime checker cannot amplify into the database, but it does query: a
  // liveness check that never touches Postgres reports "ok" while every request 500s.
  if (Date.now() - cached.at > CACHE_MS) await probe();

  // One key, deliberately. No version, no uptime, no pool stats, no env flags - an
  // unauthenticated endpoint that reports configuration is a free inventory.
  if (!cached.ok) return res.status(503).json({ status: 'degraded' });
  res.json({ status: 'ok' });
}
