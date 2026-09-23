/*
 * Renders a Minecraft skin as a static isometric character. No browser and no WebGL: the
 * landing page must work with the API down and must not pull a third-party render at page
 * load (ADR 0007), so the pose is rasterised here once and committed as a flat image.
 *
 *   node scripts/render-skin.js <skin.png> [--out <name>] [--scale 8] [--slim]
 */

import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { ROOT } from './lib/paths.js';

const BRAND = path.join(ROOT, 'assets/brand');

/*
 * 2:1 dimetric, camera at front-right-above. The axis that projects to nothing is
 * (1, -1, 1), which is what puts the camera on the character's front-right rather than
 * behind them - flip the sign on y and the render is of their back, with the front and
 * side faces landing in the same screen band instead of meeting at the silhouette edge.
 */
const project = (x, y, z, s) => [(x + y) * 2 * s, (x - y) * s - z * 2 * s];

// Nearness to a camera sitting front-right-above, used as a z-buffer key so the parts can
// be drawn in any order and still occlude each other correctly.
const nearness = (x, y, z) => x - y + z;

/*
 * Skin UV rects, 64x64 layout. Only the three camera-facing planes are listed because only
 * those are ever drawn: +z (top), -y (front) and +x (the character's left side).
 *
 * Faces unwrap as a continuous band - right, front, left, back - so the +x face runs front
 * to back, the opposite direction to what looking at that face head-on would suggest.
 */
const face = (top, front, side) => ({ top, front, side });

const BASE = {
  head: face([8, 0, 8, 8], [8, 8, 8, 8], [16, 8, 8, 8]),
  body: face([20, 16, 8, 4], [20, 20, 8, 12], [28, 20, 4, 12]),
  rightArm: face([44, 16, 4, 4], [44, 20, 4, 12], [48, 20, 4, 12]),
  leftArm: face([36, 48, 4, 4], [36, 52, 4, 12], [40, 52, 4, 12]),
  rightLeg: face([4, 16, 4, 4], [4, 20, 4, 12], [8, 20, 4, 12]),
  leftLeg: face([20, 48, 4, 4], [20, 52, 4, 12], [24, 52, 4, 12]),
};

const OVERLAY = {
  head: face([40, 0, 8, 8], [40, 8, 8, 8], [48, 8, 8, 8]),
  body: face([20, 32, 8, 4], [20, 36, 8, 12], [28, 36, 4, 12]),
  rightArm: face([44, 32, 4, 4], [44, 36, 4, 12], [48, 36, 4, 12]),
  leftArm: face([52, 48, 4, 4], [52, 52, 4, 12], [56, 52, 4, 12]),
  rightLeg: face([4, 32, 4, 4], [4, 36, 4, 12], [8, 36, 4, 12]),
  leftLeg: face([4, 48, 4, 4], [4, 52, 4, 12], [8, 52, 4, 12]),
};

// The character faces -y. Their right is -x, so the camera sees their left side.
function boxes(slim) {
  const armW = slim ? 3 : 4;
  return [
    { name: 'head', x: [-4, 4], y: [-4, 4], z: [24, 32] },
    { name: 'body', x: [-4, 4], y: [-2, 2], z: [12, 24] },
    { name: 'rightArm', x: [-4 - armW, -4], y: [-2, 2], z: [12, 24] },
    { name: 'leftArm', x: [4, 4 + armW], y: [-2, 2], z: [12, 24] },
    { name: 'rightLeg', x: [-4, 0], y: [-2, 2], z: [0, 12] },
    { name: 'leftLeg', x: [0, 4], y: [-2, 2], z: [0, 12] },
  ];
}

function readTexel(skin, w, h, x, y) {
  if (x < 0 || y < 0 || x >= w || y >= h) return null;
  const i = (y * w + x) * 4;
  return skin[i + 3] === 0 ? null : [skin[i], skin[i + 1], skin[i + 2], skin[i + 3]];
}

/*
 * One skin texel becomes one screen parallelogram, filled by inverse-mapping every
 * candidate pixel. Rasterising rather than resampling is what keeps the edges hard; a
 * smooth kernel here produces exactly the mush nearest-neighbour exists to avoid.
 */
function fillTexel(buf, zbuf, W, H, p0, e1, e2, rgba, near0, dn1, dn2) {
  const det = e1[0] * e2[1] - e1[1] * e2[0];
  if (det === 0) return;
  const xs = [p0[0], p0[0] + e1[0], p0[0] + e2[0], p0[0] + e1[0] + e2[0]];
  const ys = [p0[1], p0[1] + e1[1], p0[1] + e2[1], p0[1] + e1[1] + e2[1]];
  const x0 = Math.max(0, Math.floor(Math.min.apply(null, xs)));
  const x1 = Math.min(W - 1, Math.ceil(Math.max.apply(null, xs)));
  const y0 = Math.max(0, Math.floor(Math.min.apply(null, ys)));
  const y1 = Math.min(H - 1, Math.ceil(Math.max.apply(null, ys)));
  for (let py = y0; py <= y1; py++) {
    for (let px = x0; px <= x1; px++) {
      const qx = px + 0.5 - p0[0];
      const qy = py + 0.5 - p0[1];
      const a = (qx * e2[1] - qy * e2[0]) / det;
      const b = (e1[0] * qy - e1[1] * qx) / det;
      if (a < 0 || a >= 1 || b < 0 || b >= 1) continue;
      const idx = py * W + px;
      // Depth varies across a texel, so interpolating it is what keeps two faces meeting
      // at a seam from trading pixels. One value per texel produces a zigzag at every
      // arm and leg join, which reads as a rendering fault rather than as geometry.
      const near = near0 + a * dn1 + b * dn2;
      if (near <= zbuf[idx]) continue;
      zbuf[idx] = near;
      const o = idx * 4;
      buf[o] = rgba[0];
      buf[o + 1] = rgba[1];
      buf[o + 2] = rgba[2];
      buf[o + 3] = rgba[3];
    }
  }
}

function drawBox(ctx, box, uv, inflate) {
  const { skin, w, h, s, buf, zbuf, W, H, ox, oy } = ctx;
  const X = [box.x[0] - inflate, box.x[1] + inflate];
  const Y = [box.y[0] - inflate, box.y[1] + inflate];
  const Z = [box.z[0] - inflate, box.z[1] + inflate];

  const put = (wx, wy, wz, e1, e2, rgba, dn1, dn2) => {
    const p = project(wx, wy, wz, s);
    fillTexel(buf, zbuf, W, H, [p[0] + ox, p[1] + oy], e1, e2, rgba,
      nearness(wx, wy, wz), dn1, dn2);
  };

  const ex = [2 * s, s];
  const ey = [2 * s, -s];
  const ez = [0, -2 * s];
  const scaleVec = (v, k) => [v[0] * k, v[1] * k];

  if (uv.top) {
    const [u0, v0, uw, vh] = uv.top;
    const dx = (X[1] - X[0]) / uw;
    const dy = (Y[1] - Y[0]) / vh;
    for (let v = 0; v < vh; v++) {
      for (let u = 0; u < uw; u++) {
        const c = readTexel(skin, w, h, u0 + u, v0 + v);
        if (!c) continue;
        put(X[0] + u * dx, Y[1] - (v + 1) * dy, Z[1], scaleVec(ex, dx), scaleVec(ey, dy), c, dx, -dy);
      }
    }
  }

  if (uv.front) {
    const [u0, v0, uw, vh] = uv.front;
    const dx = (X[1] - X[0]) / uw;
    const dz = (Z[1] - Z[0]) / vh;
    for (let v = 0; v < vh; v++) {
      for (let u = 0; u < uw; u++) {
        const c = readTexel(skin, w, h, u0 + u, v0 + v);
        if (!c) continue;
        put(X[0] + u * dx, Y[0], Z[1] - (v + 1) * dz, scaleVec(ex, dx), scaleVec(ez, dz), c, dx, dz);
      }
    }
  }

  if (uv.side) {
    const [u0, v0, uw, vh] = uv.side;
    const dy = (Y[1] - Y[0]) / uw;
    const dz = (Z[1] - Z[0]) / vh;
    for (let v = 0; v < vh; v++) {
      for (let u = 0; u < uw; u++) {
        const c = readTexel(skin, w, h, u0 + u, v0 + v);
        if (!c) continue;
        put(X[1], Y[0] + u * dy, Z[1] - (v + 1) * dz, scaleVec(ey, dy), scaleVec(ez, dz), c, -dy, dz);
      }
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  const input = args.find((a) => !a.startsWith('--'));
  if (!input) {
    console.error('usage: node scripts/render-skin.js <skin.png> [--out name] [--scale 8] [--slim]');
    process.exit(2);
  }
  const arg = (flag, dflt) => {
    const i = args.indexOf(flag);
    return i === -1 ? dflt : args[i + 1];
  };
  const s = Number(arg('--scale', 8));
  const slim = args.includes('--slim');

  // --out is joined into a path, so it is a name and not a path. Without this a --out of
  // ../../elsewhere writes outside assets/brand entirely. Same containment reasoning as
  // the dev asset middleware in apps/web/vite.config.js, which checks the resolved path.
  const outName = arg('--out', 'character');
  if (!/^[A-Za-z0-9_-]+$/.test(outName)) {
    console.error(`[fail] --out must be a plain file name, got ${JSON.stringify(outName)}`);
    process.exit(2);
  }

  if (!Number.isFinite(s) || s < 1 || s > 64) {
    console.error(`[fail] --scale must be between 1 and 64, got ${JSON.stringify(arg('--scale', 8))}`);
    process.exit(2);
  }

  const img = sharp(input).ensureAlpha();
  const raw = await img.raw().toBuffer({ resolveWithObject: true });
  const skin = raw.data;
  const w = raw.info.width;
  const h = raw.info.height;
  if (w !== 64 || (h !== 64 && h !== 32)) {
    console.error(`[fail] expected a 64x64 skin (or a legacy 64x32), got ${w}x${h}`);
    process.exit(1);
  }
  const legacy = h === 32;

  // Size the buffer from the projected corners rather than guessing at it.
  const model = boxes(slim);
  const pts = [];
  for (const b of model) {
    for (const x of b.x) {
      for (const y of b.y) {
        for (const z of b.z) {
          pts.push(project(x - 0.5, y - 0.5, z + 0.5, s));
          pts.push(project(x + 0.5, y + 0.5, z - 0.5, s));
        }
      }
    }
  }
  const minX = Math.floor(Math.min.apply(null, pts.map((p) => p[0]))) - 2;
  const maxX = Math.ceil(Math.max.apply(null, pts.map((p) => p[0]))) + 2;
  const minY = Math.floor(Math.min.apply(null, pts.map((p) => p[1]))) - 2;
  const maxY = Math.ceil(Math.max.apply(null, pts.map((p) => p[1]))) + 2;
  const W = maxX - minX;
  const H = maxY - minY;

  const ctx = {
    skin, w, h, s, W, H,
    ox: -minX,
    oy: -minY,
    buf: Buffer.alloc(W * H * 4, 0),
    zbuf: new Float64Array(W * H).fill(-Infinity),
  };

  for (const box of model) {
    // A legacy 64x32 skin carries no left-limb textures; Minecraft mirrors the right ones.
    const key = legacy ? box.name.replace(/^left/, 'right') : box.name;
    drawBox(ctx, box, BASE[key], 0);
  }
  for (const box of model) {
    if (legacy && box.name !== 'head') continue; // legacy skins only carry the hat layer
    const key = legacy ? box.name.replace(/^left/, 'right') : box.name;
    // Minecraft inflates the hat layer by 0.5 and the jacket, sleeves and trousers by 0.25.
    // Using 0.5 throughout detaches a sleeve from its arm and reads as a floating box.
    drawBox(ctx, box, OVERLAY[key], box.name === 'head' ? 0.5 : 0.25);
  }

  fs.mkdirSync(BRAND, { recursive: true });
  const png = path.join(BRAND, `${outName}.png`);

  const trimmed = await sharp(ctx.buf, { raw: { width: W, height: H, channels: 4 } })
    .trim()
    .toBuffer({ resolveWithObject: true });
  await sharp(trimmed.data, {
    raw: { width: trimmed.info.width, height: trimmed.info.height, channels: 4 },
  }).png({ compressionLevel: 9 }).toFile(png);

  console.log(`[ok] ${path.relative(process.cwd(), png)}  ${trimmed.info.width}x${trimmed.info.height}  ${fs.statSync(png).size} bytes`);
  console.log(`[ok] source ${w}x${h}${legacy ? ' (legacy, left limbs mirrored)' : ''}, scale ${s}, ${slim ? 'slim' : 'classic'} arms`);

  for (const width of [320, 480]) {
    const f = path.join(BRAND, `${outName}-${width}.webp`);
    await sharp(png).resize({ width, kernel: 'nearest', withoutEnlargement: true })
      .webp({ quality: 90 }).toFile(f);
    console.log(`[ok] ${path.relative(process.cwd(), f)}  ${fs.statSync(f).size} bytes`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
