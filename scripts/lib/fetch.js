// Per-host politeness. The Cobblemon wiki is a small community MediaWiki that returned a
// live database error during the audit, so it gets a serial queue with a delay and
// retries; a CDN does not need either.
const queues = new Map();

export const HOSTS = {
  wiki: { host: 'wiki.cobblemon.com', delayMs: 400, concurrency: 2 },
  cdn: { host: 'raw.githubusercontent.com', delayMs: 0, concurrency: 8 },
  pokeapi: { host: 'pokeapi.co', delayMs: 200, concurrency: 2 },
};

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
