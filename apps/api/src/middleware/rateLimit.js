import { rateLimit, ipKeyGenerator } from 'express-rate-limit';

// Memoised by name. Each rateLimit() call builds its own MemoryStore, so calling
// limiter('search', 120) in two route files would give each route its own 120/min rather
// than the shared bucket the contract documents. One name means one store.
const buckets = new Map();

export const limiter = (name, max, windowMs = 60_000) => {
  if (!buckets.has(name)) {
    buckets.set(
      name,
      rateLimit({
        windowMs,
        max,
        standardHeaders: 'draft-7',
        legacyHeaders: false,
        keyGenerator: (req) => `${name}:${ipKeyGenerator(req.ip)}`,
        // handler, not message - the library's default body is HTML, and a JSON client
        // parsing an HTML 429 fails in a way that looks like a network error.
        handler: (req, res) => res.status(429).json({ error: 'Too many requests' }),
      }),
    );
  }
  return buckets.get(name);
};
