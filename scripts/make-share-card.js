/*
 * Builds the 1200x630 Open Graph image from design/artboards/share-card.html.
 *
 * Composited with sharp rather than screenshotted: there is no headless browser in this
 * toolchain, and adding one to render a single static image that changes about never is a
 * dependency the project would carry forever for one build step.
 *
 * ADR 0008: a client-rendered SPA cannot do per-route og:image, because scrapers do not run
 * JS. This one card is the whole Open Graph story for every route on the site.
 */

import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { ROOT } from './lib/paths.js';

const BRAND = path.join(ROOT, 'assets/brand');

const W = 1200;
const H = 630;

// Dark theme values from apps/web/src/styles/tokens.css. A social scraper gets one image
// with no prefers-color-scheme to consult, and the mark's own field is near-black.
const HERO = '#0C0E14';
const TEXT = '#EFE8DA';
const MUTED = '#B3AD9F';
const GRID = 'rgba(239,232,218,0.05)';
const GRID_STEP = 32;

const TAGLINE = 'A safe, friendly Cobblemon server. Legendaries spawn at random.';

const escapeXml = (s) => s.replace(/[<>&'"]/g, (c) => (
  { '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]
));

async function fit(file, width) {
  const buf = await sharp(path.join(BRAND, file))
    .resize({ width, kernel: 'nearest', withoutEnlargement: true })
    .png()
    .toBuffer();
  const meta = await sharp(buf).metadata();
  return { buf, width: meta.width, height: meta.height };
}

async function main() {
  const background = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">` +
    `<rect width="${W}" height="${H}" fill="${HERO}"/>` +
    `<defs><pattern id="g" width="${GRID_STEP}" height="${GRID_STEP}" patternUnits="userSpaceOnUse">` +
    `<path d="M ${GRID_STEP} 0 L 0 0 0 ${GRID_STEP}" fill="none" stroke="${GRID}" stroke-width="1"/>` +
    `</pattern></defs>` +
    `<rect width="${W}" height="${H}" fill="url(#g)"/></svg>`
  );

  const logo = await fit('logo-1267.png', 230);
  const wordmark = await fit('wordmark.png', 520);

  const TAGLINE_GAP = 52;
  const TAGLINE_SIZE = 28;
  const stack = logo.height + 24 + wordmark.height + TAGLINE_GAP + TAGLINE_SIZE;
  const logoTop = Math.round((H - stack) / 2);
  const wordmarkTop = logoTop + logo.height + 24;
  const taglineBaseline = wordmarkTop + wordmark.height + TAGLINE_GAP;

  // The first cut sized the stack to 689px on a 630px canvas and the tagline rendered off
  // the bottom edge, which a composite reports as success. Centring it makes that harder
  // to hit; asserting it makes it impossible to ship.
  if (taglineBaseline > H - 8) {
    console.error(`[fail] the tagline baseline lands at ${taglineBaseline} on a ${H}px card`);
    process.exit(1);
  }

  /*
   * The three kit faces are self-hosted woff2 and are not installed on this machine, and
   * sharp resolves SVG fonts through the system's font stack. The wordmark image already
   * carries the display face as artwork, so only this one line falls back - recorded in
   * 05-frontend/brand.md rather than left as a silent substitution.
   */
  const text = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">` +
    `<text x="${W / 2}" y="${taglineBaseline}" text-anchor="middle" ` +
    `font-family="Segoe UI, DejaVu Sans, sans-serif" font-size="${TAGLINE_SIZE}" fill="${MUTED}">` +
    `${escapeXml(TAGLINE)}</text></svg>`
  );

  const out = path.join(BRAND, 'share-card.png');
  await sharp(background)
    .composite([
      { input: logo.buf, left: Math.round((W - logo.width) / 2), top: logoTop },
      { input: wordmark.buf, left: Math.round((W - wordmark.width) / 2), top: wordmarkTop },
      { input: text, left: 0, top: 0 },
    ])
    .png({ compressionLevel: 9 })
    .toFile(out);

  const meta = await sharp(out).metadata();
  if (meta.width !== W || meta.height !== H) {
    console.error(`[fail] expected ${W}x${H}, produced ${meta.width}x${meta.height}`);
    process.exit(1);
  }

  const webp = path.join(BRAND, 'share-card.webp');
  await sharp(out).webp({ quality: 88 }).toFile(webp);

  console.log(`[ok] ${path.relative(ROOT, out)}  ${meta.width}x${meta.height}  ${fs.statSync(out).size} bytes`);
  console.log(`[ok] ${path.relative(ROOT, webp)}  ${fs.statSync(webp).size} bytes`);
  console.log('[note] the tagline falls back to a system sans; the kit faces are woff2 and not installed');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
