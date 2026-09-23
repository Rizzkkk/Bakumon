import { log } from '../lib/log.js';

export function requestLog(req, res, next) {
  const startedAt = process.hrtime.bigint();

  res.on('finish', () => {
    const ms = Number(process.hrtime.bigint() - startedAt) / 1e6;
    // The query string is kept only on a failure, so the log does not accumulate what
    // every visitor searched for. The client IP is kept on every request: it is the only
    // way to tell a rate-limited abuser from a broken client, and ADR 0007 rules out
    // analytics and cookies, not operational logging.
    const path = res.statusCode >= 400 ? req.originalUrl : req.path;
    log.info(`${req.method} ${path} ${res.statusCode} ${ms.toFixed(1)}ms ${req.ip}`);
  });

  next();
}
