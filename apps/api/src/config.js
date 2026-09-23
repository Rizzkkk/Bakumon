import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

// Second copy of the reader in scripts/lib/db.js. Not shared: importing that module pulls
// in lib/workbook.js and therefore exceljs, which has no business in a request handler.
// The third copy is the trigger to extract packages/shared/env.js.
const envPath = path.join(ROOT, '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const match = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2];
  }
}

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set. Copy .env.example to .env.');
}

export const config = Object.freeze({
  DATABASE_URL: process.env.DATABASE_URL,
  PORT: Number(process.env.PORT ?? 3001),

  // Loopback by default. nginx reverse-proxies to 127.0.0.1:3001, so binding every
  // interface publishes the Node process directly on the VPS - and a request that reaches
  // it without passing through nginx makes the client the single trusted proxy hop that
  // `trust proxy: 1` assumes, which makes X-Forwarded-For attacker-controlled and every
  // rate-limit bucket forgeable. Overridable because a container needs 0.0.0.0.
  HOST: process.env.HOST ?? '127.0.0.1',
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  // Empty means no browser origin is allowed. Failing closed on an unset variable is the
  // point - a missing value must not read as "allow everything".
  CORS_ORIGINS: (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
});
