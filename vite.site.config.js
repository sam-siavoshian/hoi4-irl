// Builds the landing page (site/, on the vendored design system) for tools/build-site.mjs, which runs it twice:
// once for the browser (into _site/) and once as a server bundle of site/prerender.jsx, whose HTML it writes into
// _site/index.html. `base: './'` keeps every URL relative, so the page works under any sub-path (GitHub Pages).
//   npm run dev:site    the page alone on :5174 (the hero map reads ./demo/data/maps/, served here from data/maps/)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { siteData } from './tools/site-data.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
const BOOT = path.join(root, 'vendor/design-system/boot/theme-boot.js');

// `virtual:site-data`: every country's briefing and its worked example, computed from the scenarios and the engine.
function data() {
  const ID = 'virtual:site-data';
  return {
    name: 'homefront-site-data',
    resolveId(id) { return id === ID ? '\0' + ID : null; },
    async load(id) {
      if (id !== '\0' + ID) return null;
      const d = await siteData(root);
      return `export const countries = ${JSON.stringify(d.countries)};\nexport const examples = ${JSON.stringify(d.examples)};\nexport const start = ${d.start};\nexport const example = ${JSON.stringify(d.example)};\n`;
    },
  };
}

// The theme boot script keeps its fixed name beside index.html; the dev server also serves the maps where the built
// site has them.
function shellFiles() {
  return {
    name: 'homefront-site-shell',
    configureServer(server) {
      server.middlewares.use('/theme-boot.js', (req, res) => { res.setHeader('content-type', 'text/javascript'); res.end(fs.readFileSync(BOOT)); });
      server.middlewares.use('/demo/icons/flags', (req, res, next) => {
        const file = path.join(root, 'icons', 'flags', path.basename(req.url.split('?')[0]));
        if (!/\.(png|webp)$/.test(file) || !fs.existsSync(file)) return next();
        res.setHeader('content-type', file.endsWith('.png') ? 'image/png' : 'image/webp'); fs.createReadStream(file).pipe(res);
      });
      server.middlewares.use('/demo/data/maps', (req, res, next) => {
        const file = path.join(root, 'data', 'maps', path.basename(req.url.split('?')[0]));
        if (!fs.existsSync(file)) return next();
        res.setHeader('content-type', 'application/json'); fs.createReadStream(file).pipe(res);
      });
    },
    generateBundle(_, bundle) {
      // The design system's optional sky backdrop and its intro sound are not used, so their media is not shipped.
      for (const f of Object.keys(bundle)) if (/\.(avif|jpe?g|m4a)$/.test(f) || /\/frost-[\w-]+\.png$/.test(f)) delete bundle[f];
      this.emitFile({ type: 'asset', fileName: 'theme-boot.js', source: fs.readFileSync(BOOT) });
    },
  };
}

export default defineConfig({
  root: path.join(root, 'site'),
  base: './',
  publicDir: false,
  plugins: [react(), tailwindcss(), data(), shellFiles()],
  resolve: { dedupe: ['react', 'react-dom'] },
  ssr: { noExternal: ['@sam/design-system'] },
  build: { outDir: path.join(root, '_site'), emptyOutDir: true, chunkSizeWarningLimit: 800 },
  server: { port: 5174 },
});
