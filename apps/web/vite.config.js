import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const ASSETS = path.join(ROOT, 'assets');

const TYPES = {
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
};

// The API returns image_url and thumb_url as root-relative /assets/... paths and ADR 0005
// is explicit that the API must not rewrite them at read time. They resolve because nginx
// serves the artwork and the SPA from one origin. In dev nothing serves /assets, so every
// image 404s and the grid renders as alt text - this mounts the same path locally.
//
// Note this is not the /api proxy that is deliberately absent below: the artwork really is
// same-origin in production, so serving it same-origin here is more faithful, not less.
function serveAssets() {
  const handler = (req, res, next) => {
    if (!req.url?.startsWith('/assets/')) return next();

    const relative = decodeURIComponent(req.url.split('?')[0].slice('/assets/'.length));
    const file = path.join(ASSETS, relative);

    // The artwork directory is outside the Vite root, so containment is checked here
    // rather than inherited from it.
    if (!file.startsWith(ASSETS + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
      return next();
    }

    res.setHeader('Content-Type', TYPES[path.extname(file).toLowerCase()] ?? 'application/octet-stream');
    fs.createReadStream(file).pipe(res);
  };

  return {
    name: 'bakumon-serve-assets',
    // Block bodies, not expression bodies: a value returned from configureServer is
    // treated by Vite as a post-hook to call, and `.use()` returns the connect app.
    configureServer(server) { server.middlewares.use(handler); },
    configurePreviewServer(server) { server.middlewares.use(handler); },
  };
}

// There is deliberately no /api dev proxy. A proxy makes dev requests same-origin, so CORS
// is never exercised until production - which is exactly when it fails closed and silently.
// Dev instead calls the API on its real origin, so the browser walks the same path the
// deployed site walks. Set VITE_API_BASE_URL in apps/web/.env and CORS_ORIGINS in the
// repository-root .env.
export default defineConfig({
  plugins: [react(), serveAssets()],
  build: { outDir: 'dist' },
});
