import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import path from 'node:path';
import { MIGRATIONS_DIR, withClient } from './lib/db.js';

// A migration runner rather than SQL pasted into a console. Schema and code drifting
// apart silently is the failure mode this exists to prevent, so an already-applied file
// whose contents changed is a hard error, not a warning.
await withClient(async (client) => {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename    TEXT PRIMARY KEY,
      checksum    TEXT NOT NULL,
      applied_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  const applied = new Map(
    (await client.query('SELECT filename, checksum FROM schema_migrations')).rows
      .map((r) => [r.filename, r.checksum]),
  );

  const files = (await fs.readdir(MIGRATIONS_DIR)).filter((f) => f.endsWith('.sql')).sort();
  let ran = 0;

  for (const filename of files) {
    const sql = await fs.readFile(path.join(MIGRATIONS_DIR, filename), 'utf8');
    const checksum = crypto.createHash('sha256').update(sql).digest('hex').slice(0, 16);

    if (applied.has(filename)) {
      if (applied.get(filename) !== checksum) {
        throw new Error(
          `${filename} was already applied but its contents changed. Never amend an `
          + 'applied migration - add a new numbered file instead.',
        );
      }
      console.log(`  [skip] ${filename}`);
      continue;
    }

    await client.query('BEGIN');
    try {
      await client.query(sql);
      await client.query(
        'INSERT INTO schema_migrations (filename, checksum) VALUES ($1, $2)',
        [filename, checksum],
      );
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw new Error(`${filename} failed: ${error.message}`);
    }
    console.log(`  [done] ${filename}`);
    ran++;
  }

  console.log(`[done] ${ran} migration(s) applied, ${files.length - ran} already current`);
});
