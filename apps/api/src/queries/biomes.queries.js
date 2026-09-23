import { all } from '../db/pool.js';

// 112 rows, and the contract gives this response no page fields - it is the closed list
// the biome filter is built from, so it is returned whole.
export async function listBiomes() {
  const rows = await all(
    `SELECT token, namespace, is_tag, spawn_count
       FROM biome_tokens
      ORDER BY spawn_count DESC, token`,
  );
  return rows.map((row) => ({
    token: row.token,
    namespace: row.namespace,
    isTag: row.is_tag,
    spawnCount: row.spawn_count,
  }));
}

// One round trip for the whole list rather than one query per member, returning a Set so
// the caller can find which specific member is missing for the 400 message.
export async function biomeTokensExist(tokens) {
  const rows = await all('SELECT token FROM biome_tokens WHERE token = ANY($1::text[])', [tokens]);
  return new Set(rows.map((row) => row.token));
}
