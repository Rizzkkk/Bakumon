import pg from 'pg';
import { config } from '../config.js';
import { log } from '../lib/log.js';

export const pool = new pg.Pool({
  connectionString: config.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
  // Server-side ceiling: a pathological ILIKE cannot pin a connection indefinitely.
  statement_timeout: 5_000,
  // statement_timeout only fires while the server is still reachable. If the connection is
  // silently dropped - a NAT or firewall idle-reap - the server never learns to cancel and
  // the client waits forever holding one of the ten slots. These two are the client's side
  // of that bargain.
  query_timeout: 10_000,
  keepAlive: true,
  application_name: 'bakumon-api',
});

// An error on an idle client is emitted here, not on any query. Without this listener
// node exits the process when Postgres restarts instead of reconnecting.
pool.on('error', (error) => log.error('idle client error', error));

export const all = async (sql, params = []) => (await pool.query(sql, params)).rows;

export const one = async (sql, params = []) => (await pool.query(sql, params)).rows[0] ?? null;
