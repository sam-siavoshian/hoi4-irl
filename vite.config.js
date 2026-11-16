// Builds the interface (src/, on the vendored design system) into dist/. The map renderer, the engine and the other
// modules in js/ are bundled with it. `base: './'` keeps every URL relative, so the build also runs under a sub-path
// (the GitHub Pages demo at /demo/).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const root = path.dirname(fileURLToPath(import.meta.url));
const BOOT = path.join(root, 'vendor/design-system/boot/theme-boot.js');

// Two files that must keep fixed names beside index.html: the design system's theme boot script (it runs before the
// first paint) and the service worker, which is sw.js with the names of the built files written in.
function shellFiles() {
  return {
    name: 'homefront-shell-files',
    configureServer(server) {
      server.middlewares.use('/theme-boot.js', (req, res) => { res.setHeader('content-type', 'text/javascript'); res.end(fs.readFileSync(BOOT)); });
    },
    generateBundle(_, bundle) {
      // The design system's optional sky backdrop and its intro sound are not used here, so their media is not shipped
      // (the stylesheet still names the pictures; nothing shows them, so nothing asks for them).
      for (const f of Object.keys(bundle)) if (/\.(avif|jpe?g|m4a)$/.test(f) || /\/frost-[\w-]+\.png$/.test(f)) delete bundle[f];
      const built = Object.keys(bundle).filter(f => /\.(js|css|woff2)$/.test(f)).sort();
      const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
      if (!sw.includes('/*BUILT*/')) this.error('sw.js has no /*BUILT*/ marker');
      this.emitFile({ type: 'asset', fileName: 'sw.js', source: sw.replace('/*BUILT*/', built.map(f => `${JSON.stringify(f)}, `).join('')) });
      this.emitFile({ type: 'asset', fileName: 'theme-boot.js', source: fs.readFileSync(BOOT) });
    },
  };
}

export default defineConfig({
  base: './',
  publicDir: false,
  plugins: [react(), tailwindcss(), shellFiles()],
  resolve: { dedupe: ['react', 'react-dom'] },
  build: { outDir: 'dist', emptyOutDir: true, chunkSizeWarningLimit: 1500 },
  server: { port: 5173, proxy: { '/api': `http://localhost:${process.env.PORT || 8080}` } },
});
