import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { ROOT } from './lib/paths.js';

const BRAND = path.join(ROOT, 'assets/brand');

// The banner is the landing page hero, so it is the largest thing on the page and it
// decides mobile load time. At 2.2 MB of PNG it is most of a phone's page budget on its
// own. Three widths rather than one: a 375px phone should not download 1672px of hero.
const BANNER_WIDTHS = [768, 1280, 1672];

// Derived from logo-transparent.png, which has a real alpha channel - the 1254x1254
// Logo.png beside it is colour type 2 and renders as a solid square. The transparent
// source is only 392px, which is ample for a header mark and a favicon and is why no
// derivative is larger than that: upscaling pixel art gains nothing but bytes.
const LOGO_SOURCE = 'logo-transparent.png';
const LOGO_WIDTH = 256;

// A favicon set rather than one file: 32 for the browser tab, 180 for an iOS home screen,
// 512 for Android and the manifest. pre-production.md item 17.
const FAVICON_SIZES = [32, 180, 512];

// Measured from the source rather than hardcoded, so replacing logo-transparent.png with
// a larger export changes which sizes are padded and which are resampled, automatically.
const { width: SOURCE_WIDTH, height: SOURCE_HEIGHT } =
  await sharp(path.join(BRAND, LOGO_SOURCE)).metadata();

/*
 * The wall-break character is generated art rather than a render, and it arrived with a
 * soft glow painted around its silhouette. Every pixel under half alpha is that glow, so
 * the mask is hardened to binary before anything else: composited on the cream page the
 * fringe reads as a yellow halo around the rubble. The trim only means anything once it
 * has gone, since the glow reaches most of the way to the canvas edge.
 */
const WALL_SOURCE = 'character-wall.png';
const WALL_WIDTHS = [320, 480];

async function hardEdges(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 3; i < data.length; i += 4) data[i] = data[i] >= 128 ? 255 : 0;
  return sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .trim({ threshold: 0 })
    .png({ compressionLevel: 9 })
    .toBuffer();
}

const kb = (bytes) => `${(bytes / 1024).toFixed(0)} KB`;

const PUBLIC = path.join(ROOT, 'apps/web/public');

const rows = [];
const icons = [];

async function encode(source, outputName, width) {
  const input = path.join(BRAND, source);
  const output = path.join(BRAND, outputName);

  const before = (await fs.stat(input)).size;
  await sharp(input).resize({ width, withoutEnlargement: true }).webp({ quality: 82 }).toFile(output);
  const after = (await fs.stat(output)).size;

  console.log(`  ${outputName.padEnd(22)} ${String(width).padStart(4)}px  ${kb(after).padStart(8)}`);
  rows.push({ source, outputName, width, before, after });
}

console.log('[brand] encoding WebP derivatives');
for (const width of BANNER_WIDTHS) await encode('Banner.png', `banner-${width}.webp`, width);
await encode(LOGO_SOURCE, 'logo.webp', LOGO_WIDTH);

// A smooth kernel here, unlike the favicon set below. The character is painted at roughly
// 20px blocks rather than on a 1:1 pixel grid, so nearest-neighbour does not preserve a
// grid that is not there - it just drops every other row of a block edge and aliases.
console.log('[brand] wall-break character');
{
  const source = path.join(BRAND, WALL_SOURCE);
  const before = (await fs.stat(source)).size;
  const hardened = await hardEdges(source);
  for (const width of WALL_WIDTHS) {
    const outputName = `character-wall-${width}.webp`;
    const output = path.join(BRAND, outputName);
    await sharp(hardened).resize({ width }).webp({ quality: 82 }).toFile(output);
    const after = (await fs.stat(output)).size;
    console.log(`  ${outputName.padEnd(22)} ${String(width).padStart(4)}px  ${kb(after).padStart(8)}`);
    rows.push({ source: WALL_SOURCE, outputName, width, before, after });
  }
}

// Nearest-neighbour, not the default Lanczos. The mark is pixel art: any smooth
// resampling kernel turns crisp square pixels into mush, which is the same reason
// 02-assets/sourcing.md resizes the 16x16 item textures that way.
console.log('[brand] favicon set');
for (const size of FAVICON_SIZES) {
  const output = path.join(PUBLIC, `icon-${size}.png`);

  // Never upscale. The source is 392px, so a 512 icon would be a 1.306x non-integer
  // enlargement - and on pixel art that is the exact mush nearest-neighbour exists to
  // avoid. Above the source size the art is left at 1:1 and the canvas is padded out
  // around it with transparency instead, which is what an app icon wants anyway.
  // Below it, a nearest-neighbour downscale; shrinking is far more forgiving.
  const base = sharp(path.join(BRAND, LOGO_SOURCE));
  const pipeline = size > SOURCE_WIDTH
    ? base.extend({
        top: Math.floor((size - SOURCE_HEIGHT) / 2),
        bottom: Math.ceil((size - SOURCE_HEIGHT) / 2),
        left: Math.floor((size - SOURCE_WIDTH) / 2),
        right: Math.ceil((size - SOURCE_WIDTH) / 2),
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
    : base.resize({ width: size, height: size, fit: 'contain', kernel: 'nearest',
                    background: { r: 0, g: 0, b: 0, alpha: 0 } });

  await pipeline
    // Palette PNG, not truecolour. The mark is pixel art with a small colour count, and
    // an indexed encode took icon-512 from 232 KB to a fraction of it - a favicon that
    // weighs more than the page is not a favicon.
    .png({ palette: true, compressionLevel: 9 })
    .toFile(output);
  const bytes = (await fs.stat(output)).size;
  console.log(`  apps/web/public/icon-${size}.png`.padEnd(38) + kb(bytes).padStart(8));
  icons.push({ size, bytes });
}

const bannerBefore = rows.find((r) => r.source === 'Banner.png').before;
const bannerLargest = Math.max(...rows.filter((r) => r.source === 'Banner.png').map((r) => r.after));
const logo = rows.find((r) => r.source === LOGO_SOURCE);

const report = [
  '# Brand image derivatives',
  '',
  `Generated by \`npm run brand\` (\`scripts/compress-brand.js\`) on ${new Date().toISOString().slice(0, 10)}.`,
  '**Do not hand-edit.**',
  '',
  'The originals stay in the repository untouched. These are the files the site serves.',
  '',
  '| File | Width | Size |',
  '|---|---|---|',
  ...rows.map((r) => `| \`assets/brand/${r.outputName}\` | ${r.width}px | ${kb(r.after)} |`),
  '',
  `Banner: **${kb(bannerBefore)} PNG to ${kb(bannerLargest)} WebP** at full width`,
  `(${(100 * bannerLargest / bannerBefore).toFixed(1)}% of the original), and a 768px phone`,
  `downloads ${kb(rows[0].after)} rather than all of it.`,
  '',
  `Logo: ${kb(logo.before)} to ${kb(logo.after)} (${(100 * logo.after / logo.before).toFixed(1)}%),`,
  `from \`assets/brand/${LOGO_SOURCE}\` - which has a real alpha channel, unlike the`,
  '1254x1254 `Logo.png` beside it. The mark can therefore sit on any surface.',
  '',
  '## Favicon set',
  '',
  '| File | Size |',
  '|---|---|',
  ...icons.map((i) => `| \`apps/web/public/icon-${i.size}.png\` | ${i.size}x${i.size}, ${kb(i.bytes)} |`),
  '',
  'Resampled nearest-neighbour: the mark is pixel art and a smooth kernel blurs it.',
  '',
].join('\n');

await fs.writeFile(path.join(ROOT, 'ground-truth/reports/brand-images.md'), `${report}\n`, 'utf8');
console.log('\nWrote ground-truth/reports/brand-images.md');
