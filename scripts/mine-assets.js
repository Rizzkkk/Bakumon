import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';
import { ROOT } from './lib/paths.js';
import { withClient } from './lib/db.js';
import { request, chunk, mapLimit } from './lib/fetch.js';

const ASSETS = path.join(ROOT, 'assets');
const MANIFEST_PATH = path.join(ASSETS, 'manifest.json');
const WIKI_API = 'https://wiki.cobblemon.com/api.php';
const SPRITES = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork';

const GITLAB_PROJECT = 'cable-mc%2Fcobblemon';
const GITLAB_RAW = 'https://gitlab.com/cable-mc/cobblemon/-/raw/main';
const TEXTURE_BASE = 'common/src/main/resources/assets/cobblemon/textures';
// Ores and placeable blocks are items in the workbook but their textures live under
// block/, not item/. Searching item/ alone left every Dawn Stone Ore without art.
const TEXTURE_ROOTS = ['item', 'block', 'berries', 'fossils', 'poke_balls'];

const LICENCES = {
  pokeapi: 'PokeAPI/sprites - https://github.com/PokeAPI/sprites',
  wiki: 'CC BY 4.0 - Cobblemon Wiki, https://wiki.cobblemon.com',
  mod: 'MPL-2.0 - Cobblemon, https://gitlab.com/cable-mc/cobblemon',
};

const only = process.argv[2]; // 'pokemon' | 'items' | undefined for both

// The workbook spells seven species two ways in adjacent rows - `hakamo_o` on row 410 and
// `hakamoo` on row 411, each with its own spawn config - and neither spelling is PokeAPI's
// `hakamo-o`. Underscore-to-hyphen recovers half of them; the rest have no derivable rule,
// so they are listed. See 01-data/known-gaps.md.
const POKEAPI_ALIASES = {
  hakamoo: 'hakamo-o',
  jangmoo: 'jangmo-o',
  kommoo: 'kommo-o',
  mimejr: 'mime-jr',
  mrmime: 'mr-mime',
  mrrime: 'mr-rime',
  porygonz: 'porygon-z',
  nidoranf: 'nidoran-f',
  nidoranm: 'nidoran-m',
};

const manifest = await fs.readFile(MANIFEST_PATH, 'utf8')
  .then(JSON.parse)
  .catch(() => ({ version: 1, generatedAt: null, entries: {} }));

async function save() {
  manifest.generatedAt = new Date().toISOString();
  await fs.writeFile(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
}

async function exists(file) {
  return fs.access(file).then(() => true).catch(() => false);
}

// Resumable by design: a run that dies partway leaves a manifest the next run trusts, so
// only the missing and the failed are refetched.
async function download(key, url, relativePath, licence, { upscale = false } = {}) {
  const absolute = path.join(ASSETS, relativePath);
  const entry = manifest.entries[key];
  // A cached entry only satisfies resumability for the source it was fetched from. The
  // wiki-first switch reuses the same pokemon/<slug>.png path for both sources, so a
  // stale PokeAPI entry must not shadow a species that now resolves to a wiki render.
  if (entry?.status === 'ok' && entry.licence === licence && await exists(absolute)) return entry;

  try {
    const buffer = await request(url.includes('raw.githubusercontent') ? 'cdn' : 'wiki', url, { binary: true });
    await fs.mkdir(path.dirname(absolute), { recursive: true });
    await fs.writeFile(absolute, buffer);

    const thumbRelative = path.join('thumbs', `${relativePath.replace(/\.[^.]+$/, '')}.webp`);
    const thumbAbsolute = path.join(ASSETS, thumbRelative);
    await fs.mkdir(path.dirname(thumbAbsolute), { recursive: true });
    // Item textures are 16x16 game art. Upscaling them with anything but nearest
    // neighbour turns crisp pixel art into mush.
    await sharp(buffer)
      .resize(upscale ? 128 : 256, upscale ? 128 : 256, {
        fit: 'inside',
        kernel: upscale ? sharp.kernel.nearest : sharp.kernel.lanczos3,
        withoutEnlargement: !upscale,
      })
      .webp({ quality: 82 })
      .toFile(thumbAbsolute);

    manifest.entries[key] = {
      status: 'ok',
      sourceUrl: url,
      file: relativePath.replace(/\\/g, '/'),
      thumb: thumbRelative.replace(/\\/g, '/'),
      licence,
      bytes: buffer.length,
      sha256: crypto.createHash('sha256').update(buffer).digest('hex'),
      fetchedAt: new Date().toISOString(),
    };
  } catch (error) {
    manifest.entries[key] = {
      status: 'failed', sourceUrl: url, licence, error: String(error.message),
      fetchedAt: new Date().toISOString(),
    };
  }
  return manifest.entries[key];
}

// Species slug to wiki title-case: `ho-oh` -> `Ho-Oh`, `type-null` -> `Type-Null`.
const wikiSpeciesName = (slug) => slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join('-');

// The wiki stores almost no plain portraits - exactly one, Bulbasaur - so 65 of the 66 are
// a regional form or a costume. "Least decorated" is the closest thing to a neutral pick:
// fewest words added to the species name, then alphabetical so a re-run is stable rather
// than dependent on API ordering.
function pickRender(species, names) {
  const usable = names.filter((n) => /\(model[,)]/i.test(n) && !/shiny/i.test(n) && !/wireframe/i.test(n));
  if (!usable.length) return null;
  const plain = usable.find((n) => new RegExp(`^${species}_\\(model\\)\\.png$`, 'i').test(n));
  if (plain) return { file: plain, variant: null };
  const decoration = (n) => n
    .replace(/\.png$/i, '')
    .replace(new RegExp(`^${species}_?`, 'i'), '')
    .replace(/\(model,?\s*/i, '')
    .replace(/\)$/, '')
    .replace(/_/g, ' ')
    .trim();
  const sorted = [...usable].sort((a, b) => {
    const da = decoration(a); const db = decoration(b);
    return da.length - db.length || da.localeCompare(db);
  });
  return { file: sorted[0], variant: decoration(sorted[0]) || null };
}

// list=allimages with a species prefix is the only way to find a wiki render - there are
// no per-Pokemon pages to query titles against, unlike items.
async function findWikiRender(slug) {
  const prefix = wikiSpeciesName(slug);
  const url = `${WIKI_API}?${new URLSearchParams({
    action: 'query', format: 'json', list: 'allimages', aiprefix: prefix, ailimit: '50',
  })}`;
  let data;
  try {
    data = await request('wiki', url);
  } catch (error) {
    console.log(`   [warn] allimages ${prefix}: ${error.message}`);
    return null;
  }
  const names = (data?.query?.allimages ?? []).map((i) => i.name);
  return pickRender(prefix, names);
}

async function minePokemon(client) {
  const { rows } = await client.query('SELECT id, species_slug, display_name FROM pokemon ORDER BY species_slug');
  console.log(`\n== pokemon (${rows.length})`);

  // One request builds the whole slug -> national dex id map. Cobblemon and PokeAPI
  // agree on species naming closely enough that this resolves almost everything.
  const species = await request('pokeapi', 'https://pokeapi.co/api/v2/pokemon-species?limit=20000');
  const dexBySlug = new Map(species.results.map((s) => [s.name, Number(s.url.match(/\/(\d+)\/$/)[1])]));
  console.log(`   PokeAPI species index: ${dexBySlug.size}`);

  const unresolved = [];
  let done = 0;
  let fromWiki = 0;

  // Downloads run concurrently, database writes do not. A single pg client cannot serve
  // overlapping queries, so the updates are collected here and applied in one pass below.
  const updates = await mapLimit(rows, 8, async (row) => {
    const slug = row.species_slug;
    const dexId = dexBySlug.get(slug)
      ?? dexBySlug.get(slug.replace(/_/g, '-'))
      ?? dexBySlug.get(POKEAPI_ALIASES[slug]);

    const render = await findWikiRender(slug);
    if (render) {
      // MediaWiki normalises the title it hands back - every underscore becomes a space -
      // so the map must be read back with the same normalisation queryWikiTitles's callers
      // for items already rely on, or the lookup silently misses everything.
      const wikiUrls = await queryWikiTitles([`File:${render.file}`], { prop: 'imageinfo', iiprop: 'url' });
      const wikiUrl = wikiUrls.get(`File:${render.file.replace(/_/g, ' ')}`)?.imageinfo?.[0]?.url;
      if (wikiUrl) {
        const entry = await download(
          `pokemon/${slug}`,
          wikiUrl,
          `pokemon/${slug}.png`,
          LICENCES.wiki,
        );
        if (entry.status === 'ok') {
          fromWiki++;
          if (++done % 200 === 0) console.log(`   ${done}/${rows.length}`);
          return [row.id, dexId ?? null, `/assets/${entry.file}`, `/assets/${entry.thumb}`, 'wiki', render.variant];
        }
      }
    }

    if (!dexId) {
      unresolved.push(slug);
      manifest.entries[`pokemon/${slug}`] = {
        status: 'unresolved', licence: LICENCES.pokeapi,
        error: 'no PokeAPI species matches this Cobblemon slug',
        fetchedAt: new Date().toISOString(),
      };
      if (++done % 200 === 0) console.log(`   ${done}/${rows.length}`);
      return null;
    }
    const entry = await download(
      `pokemon/${slug}`,
      `${SPRITES}/${dexId}.png`,
      `pokemon/${slug}.png`,
      LICENCES.pokeapi,
    );
    if (++done % 200 === 0) console.log(`   ${done}/${rows.length}`);
    // A prior wiki entry left on disk from an earlier run must not survive a species that
    // no longer resolves to the wiki - the source/variant columns are the record of truth.
    return entry.status === 'ok'
      ? [row.id, dexId, `/assets/${entry.file}`, `/assets/${entry.thumb}`, 'pokeapi', null]
      : null;
  });

  for (const update of updates) {
    if (!update) continue;
    await client.query(
      `UPDATE pokemon SET national_dex_id = $2, image_url = $3, thumb_url = $4,
              image_source = $5, image_variant = $6 WHERE id = $1`,
      update,
    );
  }

  console.log(`   from wiki: ${fromWiki}`);
  console.log(`   unresolved: ${unresolved.length}${unresolved.length ? ` (${unresolved.slice(0, 12).join(', ')}${unresolved.length > 12 ? ', ...' : ''})` : ''}`);
  await save();
}

// MediaWiki takes 50 titles per query, so 932 items costs about 19 requests rather than
// 932. The wiki is flaky and small; this matters more than it would elsewhere.
async function queryWikiTitles(titles, params) {
  const out = new Map();
  for (const batch of chunk(titles, 50)) {
    const url = `${WIKI_API}?${new URLSearchParams({
      action: 'query', format: 'json', titles: batch.join('|'), ...params,
    })}`;
    let data;
    try {
      data = await request('wiki', url);
    } catch (error) {
      console.log(`   [warn] batch failed: ${error.message}`);
      continue;
    }
    for (const page of Object.values(data?.query?.pages ?? {})) {
      if (!('missing' in page)) out.set(page.title, page);
    }
  }
  return out;
}

const wikiTitle = (name) => name.replace(/ /g, '_');

// Many real items have no wiki File: page at all - every Aprijuice variant and every
// ancient fishing rod, among others. The mod ships their textures, so the fallback is the
// mod's own asset tree, indexed once by filename and matched on the item ID.
async function loadModTextureIndex() {
  const index = new Map();
  for (const root of TEXTURE_ROOTS) {
    for (let page = 1; page <= 30; page++) {
      const url = `https://gitlab.com/api/v4/projects/${GITLAB_PROJECT}/repository/tree`
        + `?path=${TEXTURE_BASE}/${root}&recursive=true&per_page=100&page=${page}`;
      let entries;
      try {
        entries = await request('cdn', url);
      } catch (error) {
        console.log(`   [warn] texture index ${root} page ${page}: ${error.message}`);
        break;
      }
      if (!Array.isArray(entries) || entries.length === 0) break;
      for (const entry of entries) {
        if (entry.type !== 'blob' || !entry.path.endsWith('.png')) continue;
        const base = entry.path.split('/').pop().replace(/\.png$/, '');
        // item/ is searched first and wins: a block's inventory icon is the better
        // choice than its world texture where both exist.
        if (!index.has(base)) index.set(base, entry.path);
      }
      if (entries.length < 100) break;
    }
  }
  return index;
}

async function mineItems(client) {
  const { rows } = await client.query('SELECT id, item_id, name FROM items ORDER BY item_id');
  console.log(`\n== items (${rows.length})`);

  const fileTitles = rows.map((r) => `File:${wikiTitle(r.name)}.png`);
  const files = await queryWikiTitles(fileTitles, { prop: 'imageinfo', iiprop: 'url|size' });
  console.log(`   wiki files matched: ${files.size}/${rows.length}`);

  const pageTitles = rows.map((r) => r.name);
  const extracts = await queryWikiTitles(pageTitles, {
    prop: 'extracts', explaintext: '1', exintro: '1',
  });
  const described = [...extracts.values()].filter((p) => (p.extract ?? '').trim()).length;
  console.log(`   wiki descriptions matched: ${described}/${rows.length}`);

  const modTextures = await loadModTextureIndex();
  console.log(`   mod texture index: ${modTextures.size}`);

  let done = 0;
  let fromWiki = 0;
  let fromMod = 0;

  for (const row of rows) {
    const wikiUrl = files.get(`File:${row.name}.png`)?.imageinfo?.[0]?.url;
    // IDs like `cobblemon:wearable/black_glasses` carry a path segment; the texture is
    // indexed under the last one.
    const modPath = modTextures.get(row.item_id.split(/[:/]/).pop());
    const [url, licence] = wikiUrl
      ? [wikiUrl, LICENCES.wiki]
      : [modPath && `${GITLAB_RAW}/${modPath}`, LICENCES.mod];

    if (url) {
      const entry = await download(
        `items/${row.item_id}`,
        url,
        `items/${row.item_id.replace(/[:/\\]/g, '_')}.png`,
        licence,
        { upscale: true },
      );
      if (entry.status === 'ok') {
        if (wikiUrl) fromWiki++; else fromMod++;
        await client.query('UPDATE items SET image_url = $2 WHERE id = $1',
          [row.id, `/assets/${entry.file}`]);
      }
    } else {
      manifest.entries[`items/${row.item_id}`] = {
        status: 'unresolved', licence: LICENCES.wiki,
        error: 'no File: page on the wiki and no texture in the mod asset tree',
        fetchedAt: new Date().toISOString(),
      };
    }

    const extract = (extracts.get(row.name)?.extract ?? '').trim();
    if (extract) {
      // Never touches `description`; the workbook stays authoritative.
      await client.query('UPDATE items SET wiki_description = $2 WHERE id = $1',
        [row.id, extract]);
    }
    if (++done % 200 === 0) { console.log(`   ${done}/${rows.length}`); await save(); }
  }
  console.log(`   images: ${fromWiki} from the wiki, ${fromMod} from the mod asset tree`);
  await save();
}

await withClient(async (client) => {
  if (only !== 'pokemon') await mineItems(client);
  if (only !== 'items') await minePokemon(client);

  const summary = Object.values(manifest.entries).reduce((acc, e) => {
    acc[e.status] = (acc[e.status] ?? 0) + 1;
    return acc;
  }, {});
  const db = (await client.query(`
    SELECT (SELECT count(*) FROM pokemon WHERE image_url IS NOT NULL)::int      AS pokemon_images,
           (SELECT count(*) FROM pokemon)::int                                  AS pokemon_total,
           (SELECT count(*) FROM items WHERE image_url IS NOT NULL)::int        AS item_images,
           (SELECT count(*) FROM items)::int                                    AS item_images_total,
           (SELECT count(*) FROM items WHERE wiki_description IS NOT NULL)::int AS item_descriptions
  `)).rows[0];

  await writeReport(client, summary, db);

  console.log('\n[done] mining complete');
  console.log(`  manifest          : ${JSON.stringify(summary)}`);
  console.log(`  pokemon images    : ${db.pokemon_images}`);
  console.log(`  item images       : ${db.item_images}`);
  console.log(`  item descriptions : ${db.item_descriptions}`);
});

async function writeReport(client, summary, db) {
  const entries = Object.entries(manifest.entries);
  const byLicence = {};
  let bytes = 0;
  for (const [, e] of entries) {
    if (e.status !== 'ok') continue;
    byLicence[e.licence] = (byLicence[e.licence] ?? 0) + 1;
    bytes += e.bytes ?? 0;
  }

  // Most unresolved item IDs are not items: GUI overlay sprites, localisation fragments
  // and runtime-tinted variants. Quoting raw coverage against all 934 rows understates
  // how complete the artwork actually is, so both figures are reported.
  const notItems = (await client.query(`
    SELECT count(*)::int AS n FROM items
     WHERE item_id LIKE '%poke_puff_overlay%'
        OR split_part(item_id, ':', 2) LIKE '%.%'`)).rows[0].n;
  const realItems = Number(db.item_images_total) - notItems;

  const report = `# Asset manifest

Generated by \`npm run mine\` (\`scripts/mine-assets.js\`) on ${new Date().toISOString().slice(0, 10)}.
**Do not hand-edit.** The machine-readable source is \`assets/manifest.json\`.

## Coverage

| | Have artwork | Of | Coverage |
|---|---|---|---|
| Pokemon species | ${db.pokemon_images} | ${db.pokemon_total} | ${Math.round(db.pokemon_images / db.pokemon_total * 100)}% |
| Items (all rows) | ${db.item_images} | ${db.item_images_total} | ${Math.round(db.item_images / db.item_images_total * 100)}% |
| Items (excluding non-items) | ${db.item_images} | ${realItems} | ${Math.round(db.item_images / realItems * 100)}% |

${notItems} of the ${db.item_images_total} item rows are not really items - ${'`'}poke_puff_overlay_*${'`'} GUI
sprites and localisation fragments such as ${'`'}cobblemon:aprijuice.quality_format${'`'}. They are
in the database because the workbook is authoritative; see \`01-data/known-gaps.md\`.

Item descriptions recovered from the wiki: **${db.item_descriptions}**, written to
\`wiki_description\`. The workbook's own \`description\` is never overwritten (ADR 0004).

## Files

| Status | Entries |
|---|---|
${Object.entries(summary).map(([k, v]) => `| ${k} | ${v} |`).join('\n')}

Total downloaded: **${(bytes / 1048576).toFixed(1)} MB** across ${entries.filter(([, e]) => e.status === 'ok').length} files,
plus a 256px (Pokemon) or 128px nearest-neighbour (items) WebP thumbnail for each.

## Sources and licences

| Licence | Files |
|---|---|
${Object.entries(byLicence).map(([k, v]) => `| ${k} | ${v} |`).join('\n')}

Every file carries its source URL and a sha256 in \`assets/manifest.json\`. The obligations
these licences create are in \`ground-truth/02-assets/attribution.md\`.
`;

  await fs.writeFile(path.join(ROOT, 'ground-truth/reports/asset-manifest.md'), report, 'utf8');
}
