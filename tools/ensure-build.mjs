// Builds the interface into dist/ when it is missing or older than its sources. Run by `npm start` and `npm test`,
// so a fresh clone works after `npm install` with no extra step. `node tools/ensure-build.mjs --force` always builds.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'dist', 'index.html');
const SOURCES = ['src', 'js', 'css', 'vendor/design-system/src', 'vendor/design-system/boot', 'index.html', 'sw.js', 'vite.config.js', 'package.json', 'icons/flags'];

function newest(p) {
  if (!fs.existsSync(p)) return 0;
  const st = fs.statSync(p);
  if (!st.isDirectory()) return st.mtimeMs;
  return Math.max(0, ...fs.readdirSync(p).map(n => newest(path.join(p, n))));
}
const builtAt = fs.existsSync(out) ? fs.statSync(out).mtimeMs : 0;
const stale = process.argv.includes('--force') || !builtAt || SOURCES.some(s => newest(path.join(root, s)) > builtAt);
if (stale) {
  const vite = path.join(root, 'node_modules', 'vite', 'bin', 'vite.js');
  if (!fs.existsSync(vite)) {
    if (builtAt) { console.warn('ensure-build: dist/ is older than its sources and the build tools are not installed. Run `npm install`, then `npm run build`.'); process.exit(0); }
    console.error('ensure-build: the interface is not built and the build tools are not installed. Run `npm install`, then `npm run build`.'); process.exit(1);
  }
  console.log(builtAt ? 'ensure-build: sources changed, rebuilding dist/' : 'ensure-build: building dist/');
  const r = spawnSync(process.execPath, [vite, 'build', '--logLevel', 'warn'], { cwd: root, stdio: 'inherit' });
  if (r.status !== 0) process.exit(r.status || 1);
}
