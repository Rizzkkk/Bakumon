/*
 * PM2 process definition for the API.
 *
 * `.cjs`, not `.js`: the root package is `"type": "module"` and PM2 requires this file in
 * CommonJS. Naming it `.js` here makes PM2 fail with a bare "Unexpected token 'export'".
 *
 * Two things in here are load-bearing rather than defaults:
 *
 * `instances: 1`, enforced in a file instead of remembered. The rate limiter keeps its
 * buckets in process memory (06-deployment/runbook.md), so a cluster would give each
 * worker its own budget and multiply every published limit by the worker count. Moving to
 * cluster mode means moving the limiter to a shared store first, not editing this line.
 *
 * DATABASE_URL is supplied here and not read from the root .env. Both halves of the repo
 * read that one file, and they need different roles: the ingest scripts write and must
 * connect as the owner, while the API only ever SELECTs and connects as `bakumon_api`,
 * which migration 0002 restricts at the database rather than trusting the code. An
 * environment variable beats the file (apps/api/src/config.js), so this is how the API
 * gets the read-only role without the scripts losing the owning one.
 */
module.exports = {
  apps: [{
    name: 'bakumon-api',
    script: 'apps/api/src/index.js',
    cwd: '/var/www/bakumon',
    instances: 1,
    exec_mode: 'fork',
    max_memory_restart: '300M',
    env: {
      NODE_ENV: 'production',
      PORT: 3001,
      // Read-only role. The password is set once per environment, out of band - migration
      // 0002 deliberately ships without one because it is committed and checksummed.
      DATABASE_URL: process.env.BAKUMON_API_DATABASE_URL,
      CORS_ORIGINS: 'https://bakumon.net',
    },
    error_file: '/var/log/bakumon/api.error.log',
    out_file: '/var/log/bakumon/api.out.log',
    time: true,
  }],
};
