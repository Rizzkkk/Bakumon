// The wiki's data changes only when `npm run import` runs, so every read is cacheable.
// Without a Cache-Control header a CDN treats these responses as uncacheable and forwards
// all of them to the single Node process and the single Postgres - which makes an edge
// layer, the only real defence a one-box deployment has against a traffic spike, nearly
// useless for the endpoints that cost the most.
//
// 60 seconds, not an hour: short enough that a re-import is visible almost immediately,
// long enough to collapse a link shared into a large Discord server. /api/biomes sets its
// own hour, because a closed vocabulary of 112 tokens changes with the schema, not the data.
const LIST_MAX_AGE_SECONDS = 60;

// Safe only because middleware/cors.js sets Vary: Origin on every response. A shared cache
// keying a public body on the URL alone would otherwise serve one origin's CORS headers to
// another.
export const cacheable = (res, seconds = LIST_MAX_AGE_SECONDS) =>
  res.set('Cache-Control', `public, max-age=${seconds}`);
