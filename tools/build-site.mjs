// Builds _site/ for static hosting (GitHub Pages): the landing page at the root, the app at /demo/.
// The app is the built interface (dist/, made here with tools/ensure-build.mjs) plus the maps, icons and manifest.
// Every URL in the build is relative, so it runs under any sub-path.
//   node tools/build-site.mjs            build
//   node tools/build-site.mjs --serve    build, then preview on http://localhost:$PORT (default 8080)
// SITE_URL (optional, e.g. https://user.github.io/repo/) makes the social-card image URLs absolute.
// Needs the dev dependencies (npm install) for the interface build; nothing else.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, '_site');
// [from, to under demo/]: the built files first, then what the server would serve beside them
const APP = [['dist', ''], ['manifest.webmanifest', 'manifest.webmanifest'], ['data/maps', 'data/maps'], ['data/scenarios.json', 'data/scenarios.json'], ['icons', 'icons']];
{ const r = spawnSync(process.execPath, [path.join(root, 'tools', 'ensure-build.mjs')], { stdio: 'inherit' }); if (r.status !== 0) process.exit(r.status || 1); }
const skip = name => name.startsWith('_') || name.startsWith('.'); // site/_dev holds the screenshot tooling

const written = [];
function copy(from, to) {
  const st = fs.statSync(from);
  if (st.isDirectory()) { for (const n of fs.readdirSync(from).sort()) if (!skip(n)) copy(path.join(from, n), path.join(to, n)); return; }
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
  written.push([path.relative(out, to), st.size]);
}

fs.rmSync(out, { recursive: true, force: true });
copy(path.join(root, 'site'), out);
for (const [p, to] of APP) {
  const from = path.join(root, p);
  if (!fs.existsSync(from)) { console.error(`build-site: missing ${p}`); process.exit(1); }
  copy(from, path.join(out, 'demo', to));
}

// Social cards need absolute image URLs; the source keeps them relative so the page works anywhere.
const site = (process.env.SITE_URL || '').trim().replace(/\/*$/, '/');
if (site.length > 1) {
  const file = path.join(out, 'index.html');
  const html = fs.readFileSync(file, 'utf8')
    .replace(/(<meta (?:property="og:image"|name="twitter:image") content=")(?!https?:)/g, `$1${site}`)
    .replace(/(<meta property="og:url" content=")[^"]*/, `$1${site}`)
    .replace(/(<link rel="canonical" href=")[^"]*/, `$1${site}`);
  fs.writeFileSync(file, html);
}
fs.writeFileSync(path.join(out, '.nojekyll'), ''); written.push(['.nojekyll', 0]);

const kb = n => (n / 1024).toFixed(1).padStart(8) + ' kB';
for (const [f, n] of written) console.log(`${kb(n)}  ${f}`);
const sum = pred => written.filter(([f]) => pred(f)).reduce((a, [, n]) => a + n, 0);
const page = sum(f => !f.startsWith('demo/') && /\.(html|css|js)$/.test(f));
console.log(`\n_site/  ${written.length} files, ${kb(sum(() => true)).trim()}`);
console.log(`landing page (HTML + CSS + JS, without images): ${kb(page).trim()}`);
console.log(`landing images: ${kb(sum(f => f.startsWith('img/'))).trim()}   demo app: ${kb(sum(f => f.startsWith('demo/'))).trim()}`);

if (process.argv.includes('--serve')) {
  const port = Number(process.env.PORT || 8080);
  const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
  http.createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html';
    const file = path.join(out, p);
    if (!file.startsWith(out + path.sep) || !fs.existsSync(file)) { res.writeHead(404); res.end('Not found'); return; }
    if (fs.statSync(file).isDirectory()) { res.writeHead(302, { location: p + '/' }); res.end(); return; } // as GitHub Pages does
    res.writeHead(200, { 'content-type': types[path.extname(file)] || 'application/octet-stream', 'cache-control': 'no-cache' }); fs.createReadStream(file).pipe(res);
  }).listen(port, () => console.log(`\npreview: http://localhost:${port}/   demo: http://localhost:${port}/demo/?demo=1`));
}
