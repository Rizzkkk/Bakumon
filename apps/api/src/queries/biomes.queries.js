import { all, one } from '../db/pool.js';

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

export async function biomeTokenExists(token) {
  return Boolean(await one('SELECT 1 FROM biome_tokens WHERE token = $1', [token]));
}
