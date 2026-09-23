import cors from 'cors';
import { config } from '../config.js';

// cors skips header configuration entirely when the origin callback resolves falsy, so a
// rejected origin gets neither Allow-Origin nor Vary. On /api/biomes, which is
// Cache-Control: public, a shared cache would then key that body on the URL alone and
// serve the header-less copy to the real site for an hour. Set Vary ourselves, always.
function varyOrigin(req, res, next) {
  res.vary('Origin');
  next();
}

const corsHandler = cors({
  origin(origin, callback) {
    // No Origin header means there is no cross-origin browser context to protect: curl,
    // the smoke script and uptime probes all arrive this way, and native clients too.
    if (!origin) return callback(null, true);
    // Resolving false completes the response with no Access-Control-Allow-Origin header
    // and the browser blocks it. Passing an Error here would 500 instead.
    callback(null, config.CORS_ORIGINS.includes(origin));
  },
  methods: ['GET', 'OPTIONS'],
  credentials: false,
  maxAge: 86_400,
});

export const corsMiddleware = [varyOrigin, corsHandler];
