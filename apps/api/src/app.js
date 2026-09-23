import express from 'express';
import helmet from 'helmet';
import { corsMiddleware } from './middleware/cors.js';
import { limiter } from './middleware/rateLimit.js';
import { requestLog } from './middleware/requestLog.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';
import { apiRoutes } from './routes/index.js';

export function createApp() {
  const app = express();

  // Exactly one hop: nginx on the same box. Not `true`, which would let any client forge
  // X-Forwarded-For and mint itself a fresh rate-limit bucket per request.
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(helmet());
  // CORS first, so that a 429 from the limiter below still carries the headers the browser
  // needs to read its JSON body. The per-route budgets sum to 440/min against this 300, so
  // the global bucket is the one an active session actually trips.
  app.use(corsMiddleware);
  // Unmounted, not under /api: the point is that unrouted paths - /, /.env, /wp-admin -
  // cannot generate unlimited 404s and unlimited log lines.
  app.use(limiter('global', 300));
  app.use(requestLog);

  // No body parser is mounted. Every endpoint is a GET, so payload size limits and
  // content-type confusion are not concerns this API has to hold open.
  app.use('/api', apiRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
