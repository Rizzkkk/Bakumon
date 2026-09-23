// Build-time substitution, not a runtime read of window or document. ADR 0008 requires
// module scope to stay renderable without a DOM so prerendering remains available later.
const BASE = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(status, message, retryAfterSeconds) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

// The API 400s on an unknown query parameter and on a repeated one, so parameters are
// built from an explicit object and an empty or undefined value is omitted rather than
// sent as an empty string.
function queryString(params) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value === undefined || value === null || value === '') continue;
    search.set(key, String(value));
  }
  const text = search.toString();
  return text ? `?${text}` : '';
}

// Keyed on the full path and query. A chip toggled off and on again, a back button, and a
// re-typed query all resolve to the same URL; the global rate bucket is 300/min and is the
// real constraint, so the cheapest request is the one never sent. Bounded because the key
// space is bounded: 934 items, 904 pokemon, 13 chips.
const cache = new Map();
const MAX_CACHE_ENTRIES = 200;

export async function apiGet(path, params, { signal } = {}) {
  const url = `${path}${queryString(params)}`;
  if (cache.has(url)) return cache.get(url);

  let response;
  try {
    response = await fetch(`${BASE}${url}`, { signal, headers: { Accept: 'application/json' } });
  } catch (error) {
    // An abort is the caller's own doing and must stay distinguishable from a real
    // network failure, or a superseded keystroke renders as an error state.
    if (error.name === 'AbortError') throw error;
    throw new ApiError(0, 'Could not reach the wiki. Check your connection and try again.');
  }

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    // A 429 is terminal here, never retried. An automatic retry against a 120/min bucket
    // is exactly how a search-as-you-type box becomes a retry storm; the UI surfaces the
    // Retry-After and lets a person decide.
    const retryAfter = Number(response.headers.get('retry-after'));
    throw new ApiError(
      response.status,
      body?.error ?? 'Something went wrong.',
      Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : undefined,
    );
  }

  if (cache.size >= MAX_CACHE_ENTRIES) cache.delete(cache.keys().next().value);
  cache.set(url, body);
  return body;
}
