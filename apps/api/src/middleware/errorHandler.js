import { randomUUID } from 'node:crypto';
import { ApiError } from '../lib/errors.js';
import { log } from '../lib/log.js';

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);

  if (error instanceof ApiError) {
    return res.status(error.status).json({ error: error.message });
  }

  // Express's router throws a URIError carrying status 400 for a malformed percent-escape
  // (GET /api/items/%). Without this, a bad URL is reported as a server fault: a 500, a
  // stack trace in the log, and a scanner able to mint unlimited fake 5xx.
  if (Number.isInteger(error.status) && error.status >= 400 && error.status < 500) {
    return res.status(error.status).json({ error: 'Bad request' });
  }

  // A pg error names the table, column or constraint it failed on, and its `detail` can
  // carry the offending row's values. Neither goes to the client. There is deliberately
  // no development branch that echoes the stack: a flag that changes what an error
  // response contains is a flag that will one day be set wrong in production. The id is
  // how a user's report is tied back to the server log.
  const id = randomUUID().slice(0, 8);
  log.error(`[${id}] ${req.method} ${req.originalUrl}`, error);
  res.status(500).json({ error: 'Internal server error' });
}
