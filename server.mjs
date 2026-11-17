// ARTESH private server. No dependencies; Node 20+.
// - serves the built app (dist/, made by `npm run build`) only to someone who has logged in with ARTESH_PASSWORD
// - keeps the LLM key on this machine and proxies judging and transcription (OpenAI or any OpenAI-compatible API)
// - stores the campaign in ./private/state.json so every device sees the same war, journals every change
//   to ./private/journal.ndjson and keeps dated backups in ./private/backups/
// - offers a small automation API (POST /api/report, GET /api/sitrep, GET /api/journal) for Shortcuts and scripts
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { llmConfig, createLLM } from './server/llm.mjs';
import { createStore } from './server/storage.mjs';
import { createAutomation, scenarioDir } from './server/automation.mjs';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(ROOT, 'dist'); // the built interface: index.html, sw.js, theme-boot.js and assets/ with hashed names

// .env (KEY=value per line) — real environment variables win
try {
  for (const line of fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/); if (!m || line.trim().startsWith('#')) continue;
    if (process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
  }
} catch { /* no .env */ }

const PORT = Number(process.env.PORT || 8080);
const HOST = process.env.HOST || '0.0.0.0';
const PASSWORD = process.env.ARTESH_PASSWORD || '';
const TOKEN = (process.env.ARTESH_TOKEN || '').trim(); // optional bearer token for the automation API
const RATE = process.env.ARTESH_RATE_LIMIT === undefined || process.env.ARTESH_RATE_LIMIT === '' ? 60 : Math.max(0, Number(process.env.ARTESH_RATE_LIMIT) || 0); // requests per minute per address; 0 = no limit
const PRIVATE = path.resolve(process.env.ARTESH_DATA_DIR || path.join(ROOT, 'private'));
const COOKIE = 'artesh_session';
const die = msg => { console.error(msg); process.exit(1); };

if (!PASSWORD && process.env.ARTESH_OPEN !== '1') die('Refusing to start without ARTESH_PASSWORD. Set it in .env (see .env.example).\nTo run with no login on a trusted machine only, set ARTESH_OPEN=1.');
if (TOKEN && TOKEN.length < 16) die('ARTESH_TOKEN is too short: use at least 16 random characters (for example `openssl rand -hex 24`).');
let cfg; try { cfg = llmConfig(process.env); } catch (e) { die(e.message); }
const store = createStore(PRIVATE);
const stamp = () => new Date().toISOString();
try { const r = store.recover(); if (r) console.error(`${stamp()} state.json was unreadable (${r.why}). Restored the campaign from ${r.from} (rev ${r.rev}); the broken file is kept as ${r.aside}.`); }
catch (e) { die(`${stamp()} ${e.message}`); }
const { readJSON, writeJSON } = store;
const llm = createLLM(cfg);
const auto = createAutomation({ root: ROOT, store, llm, judgeOn: cfg.judge, extraScenarios: process.env.ARTESH_EXTRA_SCENARIOS || null });

// ---- sessions ----
const sessions = new Map(Object.entries(readJSON('sessions.json', {})));
const YEAR = 365 * 86400e3;
const hash = t => crypto.createHash('sha256').update(t).digest('hex');
function authed(req) {
  if (!PASSWORD) return true;
  const m = (req.headers.cookie || '').match(new RegExp(`(?:^|;\\s*)${COOKIE}=([a-f0-9]{64})`)); if (!m) return false;
  const exp = sessions.get(hash(m[1])); return !!exp && exp > Date.now();
}
const attempts = new Map(); // ip → [timestamps]
function throttled(ip) { const now = Date.now(); const a = (attempts.get(ip) || []).filter(t => now - t < 10 * 60e3); attempts.set(ip, a); return a.length >= 8; }
const safeEq = (a, b) => { const x = hash(a), y = hash(b); return crypto.timingSafeEqual(Buffer.from(x), Buffer.from(y)); };
// the automation token opens these three endpoints and nothing else
const TOKEN_PATHS = new Set(['/api/report', '/api/sitrep', '/api/journal']);
function bearer(req, p) { if (!TOKEN || !TOKEN_PATHS.has(p)) return false; const m = /^Bearer\s+(\S+)\s*$/i.exec(req.headers.authorization || ''); return !!m && safeEq(m[1], TOKEN); }
// per-address limit on the endpoints that cost money or write on someone's behalf
const LIMITED = new Set(['/api/llm', '/api/transcribe', '/api/report']); const hits = new Map(); // ip → [timestamps]
function limited(ip) { if (!RATE) return 0; const now = Date.now(); const a = (hits.get(ip) || []).filter(t => now - t < 60e3); hits.set(ip, a); if (a.length >= RATE) return Math.max(1, Math.ceil((a[0] + 60e3 - now) / 1000)); a.push(now); return 0; }
setInterval(() => { const now = Date.now(); for (const [k, a] of hits) if (!a.length || now - a.at(-1) > 60e3) hits.delete(k); for (const [k, a] of attempts) if (!a.length || now - a.at(-1) > 10 * 60e3) attempts.delete(k); }, 5 * 60e3).unref();

// ---- helpers ----
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.woff2': 'font/woff2', '.svg': 'image/svg+xml' };
const PUBLIC_FILES = new Set(['/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png', '/icons/apple-touch-icon.png']); // needed to install to the home screen
// The whole whitelist. Built files come from dist/, the maps from data/; nothing else on disk is ever served.
const BUILT_FILES = /^\/(index\.html|sw\.js|theme-boot\.js|assets\/[\w-]+(\.[\w-]+)*\.(js|css|woff2|png|svg))$/;
const DATA_FILES = /^\/(data\/scenarios\.json|data\/maps\/[\w-]+\.json)$/;
const built = () => fs.existsSync(path.join(DIST, 'index.html'));
const NOT_BUILT = 'The interface has not been built yet. Run `npm run build` in the ARTESH folder (or start it with `npm start`, which builds first), then reload.';
// Test hook: a directory of extra built maps (<id>.json) offered next to the ones in data/maps/. Never set in normal use.
const EXTRA = process.env.ARTESH_EXTRA_SCENARIOS ? path.resolve(process.env.ARTESH_EXTRA_SCENARIOS) : null;
const extras = scenarioDir(EXTRA);
const SECURITY = { 'x-robots-tag': 'noindex, nofollow, noarchive', 'referrer-policy': 'no-referrer', 'x-content-type-options': 'nosniff', 'x-frame-options': 'DENY', 'cache-control': 'no-store' };
function send(res, status, body, headers = {}) { const b = typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body); res.writeHead(status, { 'content-type': typeof body === 'object' && !Buffer.isBuffer(body) ? 'application/json' : 'text/plain; charset=utf-8', ...SECURITY, ...headers }); res.end(b); }
// an oversized body is refused with 413 and the rest of it is thrown away as it arrives
function readBody(req, limit) { return new Promise((resolve, reject) => { let chunks = [], n = 0; req.on('data', c => { n += c.length; if (n > limit) { if (chunks) reject(Object.assign(new Error('Too large'), { status: 413 })); chunks = null; } else chunks?.push(c); }); req.on('end', () => chunks && resolve(Buffer.concat(chunks))); req.on('error', reject); }); }
const secure = req => req.headers['x-forwarded-proto'] === 'https' || !!req.socket.encrypted;

// The login page stands alone (nothing from the app is served before login), so it carries the design system's
// neutral paints by hand: light or dark with the device, no accent colour.
const LOGIN = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="robots" content="noindex,nofollow"><meta name="color-scheme" content="light dark"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"><link rel="apple-touch-icon" href="icons/apple-touch-icon.png"><link rel="manifest" href="manifest.webmanifest"><title>ARTESH</title>
<style>:root{--bg:#fbfbfb;--ink:#1b1b1f;--dim:#6b6b73;--field:#fff;--line:rgba(0,0,0,.14);--lit:#1b1b1f;--on:#fff;--bad:#b3261e}@media (prefers-color-scheme:dark){:root{--bg:#141416;--ink:#f1f1f3;--dim:#9a9aa2;--field:#1e1e21;--line:rgba(255,255,255,.14);--lit:#f1f1f3;--on:#141416;--bad:#f2a199}}
html,body{height:100%;margin:0;background:var(--bg);color:var(--ink);font:16px/1.4 system-ui,-apple-system,"Segoe UI",sans-serif;-webkit-font-smoothing:antialiased}form{height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:24px;box-sizing:border-box}h1{margin:0 0 6px;font-size:20px;font-weight:600;letter-spacing:-.01em}label{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}input,button{width:min(100%,300px);height:44px;box-sizing:border-box;padding:0 14px;border-radius:10px;border:1px solid var(--line);background:var(--field);color:inherit;font:inherit}input:focus-visible,button:focus-visible{outline:2px solid var(--ink);outline-offset:2px}button{background:var(--lit);color:var(--on);font-weight:500;border-color:transparent;cursor:pointer}p{margin:0;min-height:20px;color:var(--bad);font-size:14px}</style></head>
<body><form id="f"><h1>ARTESH</h1><label for="p">Password</label><input id="p" type="password" placeholder="Password" autocomplete="current-password" autofocus><button>Sign in</button><p id="e" role="alert"></p></form>
<script>f.onsubmit=async e=>{e.preventDefault();const r=await fetch('api/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({password:p.value})});if(r.ok)location.replace('./');else{document.getElementById('e').textContent=r.status===429?'Too many tries. Wait a few minutes, then try again.':'Wrong password. Try again.';p.value=''}}</script></body></html>`;

const server = http.createServer(async (req, res) => {
  const ip = req.socket.remoteAddress || '?';
  try {
    const url = new URL(req.url, 'http://x'); let p = decodeURIComponent(url.pathname); if (p === '/') p = '/index.html';
    // real health, for the watchdog: the campaign can be read and the data folder written. Says nothing else.
    if (p === '/healthz') { try { store.read(); fs.accessSync(PRIVATE, fs.constants.W_OK); return send(res, 200, 'ok'); } catch (e) { console.error(`${stamp()} health check failed: ${e.message}`); return send(res, 503, 'unhealthy'); } }
    if (p === '/robots.txt') return send(res, 200, 'User-agent: *\nDisallow: /\n');
    if (PUBLIC_FILES.has(p) && req.method === 'GET') return fs.createReadStream(path.join(ROOT, p)).on('error', () => send(res, 404, 'Not found')).pipe(res.writeHead(200, { 'content-type': TYPES[path.extname(p)], ...SECURITY, 'cache-control': 'public, max-age=86400' }) && res);

    if (p === '/api/login' && req.method === 'POST') {
      if (throttled(ip)) return send(res, 429, { error: 'Too many attempts' });
      const body = JSON.parse((await readBody(req, 4096)).toString() || '{}');
      if (!PASSWORD || !safeEq(String(body.password || ''), PASSWORD)) { attempts.get(ip).push(Date.now()); await new Promise(r => setTimeout(r, 600)); return send(res, 401, { error: 'Wrong password' }); }
      const token = crypto.randomBytes(32).toString('hex'); sessions.set(hash(token), Date.now() + YEAR);
      for (const [k, exp] of sessions) if (exp < Date.now()) sessions.delete(k);
      writeJSON('sessions.json', Object.fromEntries(sessions));
      return send(res, 200, { ok: true }, { 'set-cookie': `${COOKIE}=${token}; Path=/; Max-Age=${YEAR / 1000}; HttpOnly; SameSite=Lax${secure(req) ? '; Secure' : ''}` });
    }

    if (!authed(req) && !bearer(req, p)) {
      if (p.startsWith('/api/')) return send(res, 401, { error: 'Not signed in' });
      // 401 (not a redirect) so the offline cache never stores the login page in place of the app
      return send(res, 401, p === '/index.html' ? LOGIN : 'Not signed in', p === '/index.html' ? { 'content-type': TYPES['.html'] } : {});
    }

    if (p === '/api/logout' && req.method === 'POST') { const m = (req.headers.cookie || '').match(new RegExp(`${COOKIE}=([a-f0-9]{64})`)); if (m) { sessions.delete(hash(m[1])); writeJSON('sessions.json', Object.fromEntries(sessions)); } return send(res, 200, { ok: true }, { 'set-cookie': `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax` }); }
    if (p === '/api/config') return send(res, 200, { server: true, judge: cfg.judge ? cfg.model : null, transcribe: cfg.transcribe ? cfg.sttModel : null, login: !!PASSWORD, provider: cfg.provider, api: cfg.api });
    if (LIMITED.has(p) && req.method === 'POST') { const wait = limited(ip); if (wait) return send(res, 429, { error: 'Too many requests. Try again shortly.' }, { 'retry-after': String(wait) }); }

    if (p === '/api/state') {
      if (req.method === 'GET') return send(res, 200, store.read());
      if (req.method === 'PUT') {
        const body = JSON.parse((await readBody(req, 20e6)).toString());
        if (!body || !body.data || !Array.isArray(body.data.reports)) return send(res, 400, { error: 'Bad state' });
        const r = await store.put(body.rev, body.data);
        if (r.conflict) return send(res, 409, r.conflict); // someone else saved first: hand back the newer copy
        return send(res, 200, { rev: r.next.rev });
      }
    }
    // every change ever saved, oldest first (the newest 5000 lines at most)
    if (p === '/api/journal') {
      if (req.method !== 'GET') return send(res, 405, { error: 'Use GET' }, { allow: 'GET' });
      const q = url.searchParams.get('since'); const since = q ? Date.parse(q) : null;
      if (q && !Number.isFinite(since)) return send(res, 400, { error: '"since" must be an ISO time' });
      return send(res, 200, store.journalSince(since));
    }

    // judge: a structured-output call. The app builds the prompt and schema; the model and key stay here.
    if (p === '/api/llm' && req.method === 'POST') {
      const b = JSON.parse((await readBody(req, 200e3)).toString());
      if (!b || typeof b.system !== 'string' || typeof b.user !== 'string' || !b.schema || typeof b.schema !== 'object') return send(res, 400, { error: 'Bad request' });
      return send(res, 200, { result: await llm.judge(b), model: cfg.model });
    }

    if (p === '/api/transcribe' && req.method === 'POST') {
      const audio = await readBody(req, 25e6); if (audio.length < 500) return send(res, 400, { error: 'No audio' });
      const type = (req.headers['content-type'] || 'audio/webm').split(';')[0]; const t0 = Date.now();
      const out = await llm.transcribe(audio, type, { prompt: url.searchParams.get('prompt'), keywords: url.searchParams.getAll('k') }); // hints: see llm.transcribe
      console.log(`${stamp()} transcribed ${(audio.length / 1024).toFixed(0)} KB ${type}, ${out.seconds ?? '?'} s of audio -> ${out.text.length} chars in ${Date.now() - t0} ms${out.plain ? ' (hints dropped)' : ''}`); // sizes only, never the words
      return send(res, 200, { text: out.text, model: cfg.sttModel });
    }

    // automation: file a report in one request (iOS Shortcuts, Siri, scripts)
    if (p === '/api/report') {
      if (req.method !== 'POST') return send(res, 405, { error: 'Use POST' }, { allow: 'POST' });
      try { const out = await auto.report(await readBody(req, 8192), req.headers['content-type']); return send(res, out.status, out.body); }
      catch (e) { if (e.status !== 400) throw e; return send(res, 400, { ok: false, reason: e.reason, error: e.message, ...(e.extra || {}) }); }
    }
    if (p === '/api/sitrep') {
      if (req.method !== 'GET') return send(res, 405, { error: 'Use GET' }, { allow: 'GET' });
      return send(res, 200, await auto.sitrep());
    }
    if (p.startsWith('/api/')) return send(res, 404, { error: 'Not found' });

    if (req.method === 'GET' && BUILT_FILES.test(p)) {
      if (!built()) return send(res, 503, NOT_BUILT);
      const file = path.join(DIST, p);
      if (!fs.existsSync(file)) return send(res, 404, 'Not found');
      // files under assets/ carry a hash of their content in their name, so a browser may keep them
      res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream', ...SECURITY, 'cache-control': p.startsWith('/assets/') ? 'private, max-age=31536000, immutable' : 'no-cache' }); return fs.createReadStream(file).pipe(res);
    }
    if (req.method === 'GET' && DATA_FILES.test(p)) {
      if (extras && p === '/data/scenarios.json') return send(res, 200, JSON.stringify(extras.index(JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8')))), { 'content-type': TYPES['.json'], 'cache-control': 'no-cache' });
      let file = path.join(ROOT, p); if (!fs.existsSync(file) && extras) file = extras.file(p) || file;
      if (!fs.existsSync(file)) return send(res, 404, 'Not found');
      res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream', ...SECURITY, 'cache-control': 'no-cache' }); return fs.createReadStream(file).pipe(res);
    }
    send(res, 404, 'Not found');
  } catch (e) {
    const badInput = e instanceof SyntaxError || e instanceof URIError;
    if (!res.headersSent) send(res, e.status || (badInput ? 400 : 500), { error: e.status ? e.message : e instanceof SyntaxError ? 'Bad JSON' : badInput ? 'Bad request' : 'Server error' });
    if (!e.status && !badInput) console.error(e?.stack || String(e)); // the error only: never the request body or a key
  }
});
// launchd, Docker and Ctrl-C stop the server with a signal: finish open requests, then exit (at most 5 s later)
for (const sig of ['SIGTERM', 'SIGINT']) process.on(sig, () => { console.log(`${stamp()} ${sig}: stopping`); server.close(() => process.exit(0)); server.closeIdleConnections(); setTimeout(() => process.exit(0), 5000).unref(); });
server.listen(PORT, HOST, () => { if (!built()) console.warn(`\n${NOT_BUILT}\n`); console.log(`${stamp()} ARTESH on http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT} — login ${PASSWORD ? 'on' : 'OFF'}, judge ${cfg.judge ? `${cfg.model} via ${cfg.provider} (${cfg.api})` : 'offline (no provider)'}, transcription ${cfg.transcribe ? cfg.sttModel : 'off'}, automation token ${TOKEN ? 'on' : 'off'}`); });
