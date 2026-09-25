// Per-host politeness. The Cobblemon wiki is a small community MediaWiki that returned a
// live database error during the audit, so it gets a serial queue with a delay and
// retries; a CDN does not need either.
const queues = new Map();

/*
 * `allow` is the set of hosts a profile may actually reach, and it is enforced rather than
 * documented. Half the URLs this module fetches are not written by us: an image URL comes
 * back inside a MediaWiki `imageinfo` response and goes straight into fetch(), so a wiki
 * that is compromised, MITM'd or simply misconfigured can name any host it likes and this
 * script will request it from inside whatever network the build runs on.
 *
 * `cdn` carries two hosts because the mod textures live on GitLab and the PokeAPI sprites
 * on GitHub, and they share a politeness profile. The three listed are every host the
 * manifest has ever recorded a fetch from, checked 2026-09-24.
 */
export const HOSTS = {
  wiki: { host: 'wiki.cobblemon.com', allow: ['wiki.cobblemon.com'], delayMs: 400, concurrency: 2 },
  cdn: { host: 'raw.githubusercontent.com', allow: ['raw.githubusercontent.com', 'gitlab.com'], delayMs: 0, concurrency: 8 },
  pokeapi: { host: 'pokeapi.co', allow: ['pokeapi.co'], delayMs: 200, concurrency: 2 },
};

// Fails closed: an unparseable URL or an unknown profile is refused, not waved through.
export function assertAllowedHost(profile, url) {
  const allow = HOSTS[profile]?.allow;
  if (!allow) throw new Error(`unknown fetch profile '${profile}'`);
  let host;
  try {
    ({ host } = new URL(url));
  } catch {
    throw new Error(`refusing to fetch an unparseable URL: ${url}`);
  }
  if (!allow.includes(host)) {
    throw new Error(`refusing to fetch ${host} on the '${profile}' profile (allowed: ${allow.join(', ')})`);
  }
}

function queueFor(profile) {
  if (!queues.has(profile)) queues.set(profile, { active: 0, waiting: [], lastAt: 0 });
  return queues.get(profile);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function schedule(profile, fn) {
  const config = HOSTS[profile];
  const queue = queueFor(profile);

  while (queue.active >= config.concurrency) {
    await new Promise((resolve) => queue.waiting.push(resolve));
  }
  queue.active++;
  try {
    const since = Date.now() - queue.lastAt;
    if (config.delayMs && since < config.delayMs) await sleep(config.delayMs - since);
    queue.lastAt = Date.now();
    return await fn();
  } finally {
    queue.active--;
    queue.waiting.shift()?.();
  }
}

export async function request(profile, url, { retries = 3, binary = false } = {}) {
  // Before the retry loop: a refused host is a refusal, not a transient failure to retry.
  assertAllowedHost(profile, url);
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await schedule(profile, async () => {
        const response = await fetch(url, {
          headers: { 'User-Agent': 'bakumon-wiki-builder/0.1 (community Cobblemon server wiki)' },
          signal: AbortSignal.timeout(30_000),
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        if (binary) {
          const buffer = Buffer.from(await response.arrayBuffer());
          // The wiki serves an HTML error page with a 200 when its database is down.
          // Saved unchecked, that lands on disk as a .png that no decoder can open.
          if (buffer.subarray(0, 15).toString('latin1').trimStart().toLowerCase().startsWith('<!doctype')) {
            throw new Error('served HTML instead of an image');
          }
          return buffer;
        }
        return await response.json();
      });
    } catch (error) {
      lastError = error;
      if (attempt < retries) await sleep(500 * 2 ** attempt);
    }
  }
  throw lastError;
}

export function chunk(items, size) {
  const out = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

export async function mapLimit(items, limit, fn) {
  const results = new Array(items.length);
  let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await fn(items[index], index);
    }
  }));
  return results;
}
