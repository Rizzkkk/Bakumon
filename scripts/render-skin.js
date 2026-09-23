/*
 * Renders a Minecraft skin as a static isometric character. No browser and no WebGL: the
 * landing page must work with the API down and must not pull a third-party render at page
 * load (ADR 0007), so the pose is rasterised here once and committed as a flat image.
 *
 *   node scripts/render-skin.js <skin.png> [--out <name>] [--scale 8] [--slim] [--pose wave]
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
 *
 * Linear in x, y and z with no translation term, so the same call projects a direction
 * vector as well as a point - which is what lets a rotated limb's edges be projected
 * rather than assumed.
 */
const project = (x, y, z, s) => [(x + y) * 2 * s, (x - y) * s - z * 2 * s];

// Nearness to a camera sitting front-right-above, used as a z-buffer key so the parts can
// be drawn in any order and still occlude each other correctly. Applied to a face normal
// it is the dot product with the view direction, so positive means the face is turned
// towards the camera.
const nearness = (x, y, z) => x - y + z;

/*
 * Where each part's 6-face net starts in the 64x64 skin, as [u, v] of the net's top-left.
 * The rects themselves are derived in faces(), because a slim arm is 3 texels wide and a
 * hardcoded table would carry the classic 4 into the slim render.
 */
const BASE = {
  head: [0, 0], body: [16, 16],
  rightArm: [40, 16], leftArm: [32, 48],
  rightLeg: [0, 16], leftLeg: [16, 48],
};

const OVERLAY = {
  head: [32, 0], body: [16, 32],
  rightArm: [40, 32], leftArm: [48, 48],
  rightLeg: [0, 32], leftLeg: [0, 48],
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

/*
 * A wave is two frames the page alternates, not motion the renderer produces. Degrees turn
 * the left arm about the y axis at its shoulder: 180 is straight up, and more than that
 * swings the hand outward, away from the head. The waving arm is the left one because the
 * camera sits on that side - waving the right arm hides the hand behind the body.
 */
const WAVE_FRAMES = { a: 214, b: 238 };

const pose = (model, deg) => model.map((box) => (
  box.name === 'leftArm' ? { ...box, rot: { pivot: [box.x[0], 0, 23], deg } } : box
));

// Rotation about the y axis through a pivot. Points move with the pivot, directions and
// normals without it.
function rotator(rot) {
  if (!rot) return { point: (p) => p, vector: (v) => v };
  const r = (rot.deg * Math.PI) / 180;
  const c = Math.cos(r);
  const sn = Math.sin(r);
  const vector = ([x, y, z]) => [x * c + z * sn, y, -x * sn + z * c];
  const point = ([x, y, z]) => {
    const [dx, dy, dz] = vector([x - rot.pivot[0], y - rot.pivot[1], z - rot.pivot[2]]);
    return [dx + rot.pivot[0], dy + rot.pivot[1], dz + rot.pivot[2]];
  };
  return { point, vector };
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

/*
 * The six faces of one box: where each sits in the skin, which way it points, and the
 * world-space corner and per-texel step vectors that walk its rect.
 *
 * Faces unwrap as a continuous band - right, front, left, back - so u runs the same way
 * around the box throughout, which is why the +x face runs front to back and the +y face
 * runs left to right, both the opposite of what looking at them head-on suggests.
 */
function faces(box, [U, V], inflate) {
  const w = box.x[1] - box.x[0];
  const d = box.y[1] - box.y[0];
  const h = box.z[1] - box.z[0];

  const [x0, x1] = [box.x[0] - inflate, box.x[1] + inflate];
  const [y0, y1] = [box.y[0] - inflate, box.y[1] + inflate];
  const [z0, z1] = [box.z[0] - inflate, box.z[1] + inflate];

  // An inflated overlay box covers the same texel count over a larger volume, so the step
  // is measured from the inflated extent rather than from the texel grid.
  const sx = (x1 - x0) / w;
  const sy = (y1 - y0) / d;
  const sz = (z1 - z0) / h;

  return [
    { rect: [U + d, V, w, d], n: [0, 0, 1], o: [x0, y1, z1], du: [sx, 0, 0], dv: [0, -sy, 0] },
    { rect: [U + d + w, V, w, d], n: [0, 0, -1], o: [x0, y0, z0], du: [sx, 0, 0], dv: [0, sy, 0] },
    { rect: [U, V + d, d, h], n: [-1, 0, 0], o: [x0, y1, z1], du: [0, -sy, 0], dv: [0, 0, -sz] },
    { rect: [U + d, V + d, w, h], n: [0, -1, 0], o: [x0, y0, z1], du: [sx, 0, 0], dv: [0, 0, -sz] },
    { rect: [U + d + w, V + d, d, h], n: [1, 0, 0], o: [x1, y0, z1], du: [0, sy, 0], dv: [0, 0, -sz] },
    { rect: [U + 2 * d + w, V + d, w, h], n: [0, 1, 0], o: [x1, y1, z1], du: [-sx, 0, 0], dv: [0, 0, -sz] },
  ];
}

function drawBox(ctx, box, uvOrigin, inflate) {
  const { skin, w, h, s, buf, zbuf, W, H, ox, oy } = ctx;
  const xf = rotator(box.rot);

  for (const f of faces(box, uvOrigin, inflate)) {
    const n = xf.vector(f.n);
    // Three of the six always face away. Drawing them costs nothing visually - the z
    // buffer would reject every pixel - but it doubles the raster work per part.
    if (nearness(n[0], n[1], n[2]) <= 0) continue;

    const du = xf.vector(f.du);
    const dv = xf.vector(f.dv);
    const e1 = project(du[0], du[1], du[2], s);
    const e2 = project(dv[0], dv[1], dv[2], s);
    const dn1 = nearness(du[0], du[1], du[2]);
    const dn2 = nearness(dv[0], dv[1], dv[2]);

    const [u0, v0, nu, nv] = f.rect;
    for (let v = 0; v < nv; v++) {
      for (let u = 0; u < nu; u++) {
        const c = readTexel(skin, w, h, u0 + u, v0 + v);
        if (!c) continue;
        const p = xf.point([
          f.o[0] + u * f.du[0] + v * f.dv[0],
          f.o[1] + u * f.du[1] + v * f.dv[1],
          f.o[2] + u * f.du[2] + v * f.dv[2],
        ]);
        const screen = project(p[0], p[1], p[2], s);
        fillTexel(buf, zbuf, W, H, [screen[0] + ox, screen[1] + oy], e1, e2, c,
          nearness(p[0], p[1], p[2]), dn1, dn2);
      }
    }
  }
}

// Bounds from the projected corners of the posed model rather than a guess, and returned
// so every frame of a pose can share one canvas - trimming each frame to its own content
// is what would make an alternating pair jump.
function bounds(model, s) {
  const pts = [];
  for (const box of model) {
    const xf = rotator(box.rot);
    for (const x of box.x) {
      for (const y of box.y) {
        for (const z of box.z) {
          for (const kx of [-1, 1]) {
            for (const ky of [-1, 1]) {
              for (const kz of [-1, 1]) {
                // A rotated limb's extreme corner is not the same corner as an
                // axis-aligned one's, so all eight are projected rather than two.
                const p = xf.point([x + kx * 0.5, y + ky * 0.5, z + kz * 0.5]);
                pts.push(project(p[0], p[1], p[2], s));
              }
            }
          }
        }
      }
    }
  }
  return {
    minX: Math.floor(Math.min(...pts.map((p) => p[0]))) - 8,
    maxX: Math.ceil(Math.max(...pts.map((p) => p[0]))) + 8,
    minY: Math.floor(Math.min(...pts.map((p) => p[1]))) - 8,
    maxY: Math.ceil(Math.max(...pts.map((p) => p[1]))) + 8,
  };
}

function render(model, skin, w, h, s, legacy, box3d) {
  const W = box3d.maxX - box3d.minX;
  const H = box3d.maxY - box3d.minY;
  const ctx = {
    skin, w, h, s, W, H,
    ox: -box3d.minX,
    oy: -box3d.minY,
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
  return { buf: ctx.buf, W, H };
}

// The union of every frame's opaque bounds, so one extract crops them all identically.
function contentBox(frames) {
  let minX = Infinity; let minY = Infinity; let maxX = -Infinity; let maxY = -Infinity;
  for (const { buf, W, H } of frames) {
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        if (buf[(y * W + x) * 4 + 3] === 0) continue;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  return { left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
}

async function write(frame, crop, name) {
  const png = path.join(BRAND, `${name}.png`);
  await sharp(frame.buf, { raw: { width: frame.W, height: frame.H, channels: 4 } })
    .extract(crop)
    .png({ compressionLevel: 9 })
    .toFile(png);
  console.log(`[ok] ${path.relative(process.cwd(), png)}  ${crop.width}x${crop.height}  ${fs.statSync(png).size} bytes`);

  for (const width of [320, 480]) {
    const f = path.join(BRAND, `${name}-${width}.webp`);
    await sharp(png).resize({ width, kernel: 'nearest', withoutEnlargement: true })
      .webp({ quality: 90 }).toFile(f);
    console.log(`[ok] ${path.relative(process.cwd(), f)}  ${fs.statSync(f).size} bytes`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const input = args.find((a) => !a.startsWith('--'));
  if (!input) {
    console.error('usage: node scripts/render-skin.js <skin.png> [--out name] [--scale 8] [--slim] [--pose wave]');
    process.exit(2);
  }
  const arg = (flag, dflt) => {
    const i = args.indexOf(flag);
    return i === -1 ? dflt : args[i + 1];
  };
  const s = Number(arg('--scale', 8));
  const slim = args.includes('--slim');
  const poseName = arg('--pose', 'stand');
  const outName = arg('--out', poseName === 'wave' ? 'character-wave' : 'character');
  if (poseName !== 'stand' && poseName !== 'wave') {
    console.error(`[fail] unknown pose "${poseName}" - expected stand or wave`);
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

  const model = boxes(slim);
  const models = poseName === 'wave'
    ? Object.entries(WAVE_FRAMES).map(([frame, deg]) => [`${outName}-${frame}`, pose(model, deg)])
    : [[outName, model]];

  // One canvas for every frame, sized from the widest pose, so the shared crop below is
  // a crop of the same coordinate space in each.
  const all = models.flatMap(([, m]) => m);
  const box3d = bounds(all, s);

  fs.mkdirSync(BRAND, { recursive: true });
  const frames = models.map(([, m]) => render(m, skin, w, h, s, legacy, box3d));
  const crop = contentBox(frames);
  for (let i = 0; i < frames.length; i++) await write(frames[i], crop, models[i][0]);

  console.log(`[ok] source ${w}x${h}${legacy ? ' (legacy, left limbs mirrored)' : ''}, scale ${s}, ${slim ? 'slim' : 'classic'} arms, pose ${poseName}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
