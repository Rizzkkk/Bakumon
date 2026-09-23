import pg from 'pg';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './paths.js';

// Read .env without a dependency; the file holds one DATABASE_URL and nothing secret
// enough to justify dotenv.
const envPath = path.join(ROOT, '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const match = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2];
  }
}

export const MIGRATIONS_DIR = path.join(ROOT, 'apps/api/src/db/migrations');

export function pool() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set. Copy .env.example to .env.');
  }
  return new pg.Pool({ connectionString: process.env.DATABASE_URL });
}

export async function withClient(fn) {
  const p = pool();
  const client = await p.connect();
  try {
    return await fn(client);
  } finally {
    client.release();
    await p.end();
  }
}
