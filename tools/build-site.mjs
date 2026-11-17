// Builds _site/ for static hosting (GitHub Pages): the landing page at the root, the app at /demo/.
// The landing page is a small React page on the design system (site/, vite.site.config.js). Vite builds it for the
// browser, then builds site/prerender.jsx as a server bundle and its HTML is written into _site/index.html, so the page
// reads before any script runs and the browser only hydrates it.
// The app is the built interface (dist/, made here with tools/ensure-build.mjs) plus the maps, icons and manifest; the
// landing page's hero reads its maps from there (demo/data/maps/).
// robots.txt, sitemap.xml and img/ come from site/ as they are.
// Every URL in the build is relative, so it runs under any sub-path.
//   node tools/build-site.mjs            build
//   node tools/build-site.mjs --serve    build, then preview on http://localhost:$PORT (default 8080)
// SITE_URL (optional, e.g. https://user.github.io/repo/) makes the social-card image URLs absolute.
// Needs the dev dependencies (npm install); nothing else.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import zlib from 'node:zlib';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, '_site');
const config = path.join(root, 'vite.site.config.js');
// what is copied from site/ beside the built page
const STATIC = ['robots.txt', 'sitemap.xml', 'img'];
// [from, to under demo/]: the built files first, then what the server would serve beside them
const APP = [['dist', ''], ['manifest.webmanifest', 'manifest.webmanifest'], ['data/maps', 'data/maps'], ['data/scenarios.json', 'data/scenarios.json'], ['icons', 'icons']];
{ const r = spawnSync(process.execPath, [path.join(root, 'tools', 'ensure-build.mjs')], { stdio: 'inherit' }); if (r.status !== 0) process.exit(r.status || 1); }

// ---- the landing page: the browser build, then its HTML ----
const { build } = await import('vite');
await build({ configFile: config, logLevel: 'warn' }); // empties _site/ first
const ssr = path.join(root, 'node_modules', '.homefront-site-prerender'); // under node_modules so the bundle finds react
await build({ configFile: config, logLevel: 'warn', build: { ssr: 'prerender.jsx', outDir: ssr, emptyOutDir: true } });
const { render } = await import(pathToFileURL(path.join(ssr, 'prerender.js')).href);
const page = path.join(out, 'index.html');
const MARK = '<!--prerender-->';
let html = fs.readFileSync(page, 'utf8');
if (!html.includes(MARK)) { console.error(`build-site: site/index.html has no ${MARK} marker`); process.exit(1); }
const body = render();
if (body.length < 2000) { console.error('build-site: the prerendered page is empty'); process.exit(1); }
html = html.replace(MARK, () => body);
fs.rmSync(ssr, { recursive: true, force: true });

// Social cards need absolute image URLs; the source keeps them relative so the page works anywhere.
const site = (process.env.SITE_URL || '').trim().replace(/\/*$/, '/');
if (site.length > 1) {
  html = html
    .replace(/(<meta (?:property="og:image"|name="twitter:image") content=")(?!https?:)/g, `$1${site}`)
    .replace(/(<meta property="og:url" content=")[^"]*/, `$1${site}`)
    .replace(/(<link rel="canonical" href=")[^"]*/, `$1${site}`);
}
fs.writeFileSync(page, html);

// ---- everything else is copied ----
function copy(from, to) {
  const st = fs.statSync(from);
  if (st.isDirectory()) { for (const n of fs.readdirSync(from).sort()) if (!n.startsWith('_') && !n.startsWith('.')) copy(path.join(from, n), path.join(to, n)); return; }
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
}
for (const p of STATIC) copy(path.join(root, 'site', p), path.join(out, p));
for (const [p, to] of APP) {
  const from = path.join(root, p);
  if (!fs.existsSync(from)) { console.error(`build-site: missing ${p}`); process.exit(1); }
  copy(from, path.join(out, 'demo', to));
}
fs.writeFileSync(path.join(out, '.nojekyll'), '');

// ---- what was written, and what a first visit to the landing page downloads ----
const written = [];
(function walk(dir) { for (const n of fs.readdirSync(dir).sort()) { const f = path.join(dir, n); const st = fs.statSync(f); if (st.isDirectory()) walk(f); else written.push([path.relative(out, f).split(path.sep).join('/'), st.size]); } })(out);
const kb = n => (n / 1024).toFixed(1).padStart(8) + ' kB';
const gz = f => zlib.gzipSync(fs.readFileSync(path.join(out, f))).length;
for (const [f, n] of written) console.log(`${kb(n)}  ${f}`);
const sum = pred => written.filter(([f]) => pred(f)).reduce((a, [, n]) => a + n, 0);
const own = written.filter(([f]) => !f.startsWith('demo/') && /\.(html|css|js)$/.test(f));
console.log(`\n_site/  ${written.length} files, ${kb(sum(() => true)).trim()}`);
console.log(`landing page (HTML + CSS + JS, without fonts, images and maps): ${kb(own.reduce((a, [, n]) => a + n, 0)).trim()}, ${kb(own.reduce((a, [f]) => a + gz(f), 0)).trim()} gzipped`);
console.log(`landing images: ${kb(sum(f => f.startsWith('img/'))).trim()}   demo app: ${kb(sum(f => f.startsWith('demo/'))).trim()}`);

if (process.argv.includes('--serve')) {
  const port = Number(process.env.PORT || 8080);
  const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml' };
  http.createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html';
    const file = path.join(out, p);
    if (!file.startsWith(out + path.sep) || !fs.existsSync(file)) { res.writeHead(404); res.end('Not found'); return; }
    if (fs.statSync(file).isDirectory()) { res.writeHead(302, { location: p + '/' }); res.end(); return; } // as GitHub Pages does
    res.writeHead(200, { 'content-type': types[path.extname(file)] || 'application/octet-stream', 'cache-control': 'no-cache' }); fs.createReadStream(file).pipe(res);
  }).listen(port, () => console.log(`\npreview: http://localhost:${port}/   demo: http://localhost:${port}/demo/?demo=1`));
}
