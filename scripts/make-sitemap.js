/*
 * Writes apps/web/public/sitemap.xml, and the Sitemap line in robots.txt, from the routes
 * the database can actually serve.
 *
 * Needs SITE_URL, because a sitemap entry has to be an absolute URL. There is no domain
 * yet (pre-production.md item 23), so this fails loudly rather than shipping a guess - a
 * sitemap full of the wrong origin is worse than no sitemap.
 *
 *   SITE_URL=https://example.com npm run sitemap
 */

import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './lib/paths.js';
import { withClient } from './lib/db.js';

const PUBLIC_DIR = path.join(ROOT, 'apps/web/public');

const STATIC_ROUTES = [
  ['/', '1.0'],
  ['/wiki', '0.9'],
  ['/wiki/pokemon', '0.9'],
  ['/wiki/items', '0.9'],
  ['/privacy-policy', '0.3'],
  ['/terms-of-service', '0.3'],
];

const esc = (s) => s.replace(/[<>&'"]/g, (c) => (
  { '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]
));

async function main() {
  const base = (process.env.SITE_URL || '').replace(/\/$/, '');
  if (!base) {
    console.error('[fail] SITE_URL is not set. A sitemap entry must be an absolute URL.');
    process.exit(1);
  }
  if (!/^https?:\/\//.test(base)) {
    console.error(`[fail] SITE_URL must include a scheme, got ${base}`);
    process.exit(1);
  }

  const { pokemon, items } = await withClient(async (client) => ({
    pokemon: (await client.query('SELECT species_slug FROM pokemon ORDER BY display_name, id')).rows,
    items: (await client.query('SELECT item_id FROM items ORDER BY name, item_id')).rows,
  }));

  const urls = [
    ...STATIC_ROUTES.map(([loc, priority]) => ({ loc, priority })),
    ...pokemon.map((r) => ({ loc: `/wiki/pokemon/${encodeURIComponent(r.species_slug)}`, priority: '0.7' })),
    ...items.map((r) => ({ loc: `/wiki/items/${encodeURIComponent(r.item_id)}`, priority: '0.6' })),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map((u) => `  <url><loc>${esc(base + u.loc)}</loc><priority>${u.priority}</priority></url>`).join('\n') +
    `\n</urlset>\n`;

  fs.writeFileSync(path.join(PUBLIC_DIR, 'sitemap.xml'), xml, 'utf8');

  const robotsPath = path.join(PUBLIC_DIR, 'robots.txt');
  const robots = fs.readFileSync(robotsPath, 'utf8')
    .replace(/\n# No Sitemap line yet[\s\S]*$/, '\n')
    .replace(/\nSitemap: .*\n?$/, '\n');
  fs.writeFileSync(robotsPath, `${robots.trimEnd()}\n\nSitemap: ${base}/sitemap.xml\n`, 'utf8');

  console.log(`[ok] sitemap.xml  ${urls.length} urls  (${STATIC_ROUTES.length} static, ${pokemon.length} pokemon, ${items.length} items)`);
  console.log(`[ok] robots.txt   Sitemap: ${base}/sitemap.xml`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
