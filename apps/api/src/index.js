import { createApp } from './app.js';
import { config } from './config.js';
import { pool } from './db/pool.js';
import { log } from './lib/log.js';

const server = createApp().listen(config.PORT, config.HOST, () => {
  log.info(`bakumon-api listening on ${config.HOST}:${config.PORT}`);
});

let shuttingDown = false;

// PM2 sends SIGTERM on restart. Without this, in-flight queries are dropped mid-deploy.
for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => {
    // A second signal would otherwise re-enter server.close and call pool.end twice, which
    // rejects; an unhandled rejection here exits non-zero and PM2 reads that as a crash
    // rather than a clean stop.
    if (shuttingDown) return;
    shuttingDown = true;
    log.info(`${signal} received, shutting down`);

    server.close(() => {
      pool.end().catch(() => {}).finally(() => process.exit(0));
    });

    // One request hung on a dead connection would otherwise hold the process open until
    // PM2 gives up and SIGKILLs it.
    setTimeout(() => process.exit(0), 5_000).unref();
  });
}
