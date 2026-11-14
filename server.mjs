// ARTESH private server. No dependencies; Node 20+.
// - serves the app only to someone who has logged in with ARTESH_PASSWORD
// - keeps the OpenAI key on this machine and proxies judging and transcription
// - stores the campaign in ./private/state.json so every device sees the same war
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));

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
const KEY = process.env.OPENAI_API_KEY || '';
const BASE = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '');
const MODEL = process.env.OPENAI_MODEL || 'gpt-6-luna';
const STT_MODEL = process.env.OPENAI_TRANSCRIBE_MODEL || 'gpt-transcribe';
const PRIVATE = path.resolve(process.env.ARTESH_DATA_DIR || path.join(ROOT, 'private'));
const COOKIE = 'artesh_session';

if (!PASSWORD && process.env.ARTESH_OPEN !== '1') {
  console.error('Refusing to start without ARTESH_PASSWORD. Set it in .env (see .env.example).\nTo run with no login on a trusted machine only, set ARTESH_OPEN=1.');
  process.exit(1);
}
fs.mkdirSync(PRIVATE, { recursive: true, mode: 0o700 });
const readJSON = (f, d) => { try { return JSON.parse(fs.readFileSync(path.join(PRIVATE, f), 'utf8')); } catch { return d; } };
const writeJSON = (f, v) => { const p = path.join(PRIVATE, f); fs.writeFileSync(p + '.tmp', JSON.stringify(v), { mode: 0o600 }); fs.renameSync(p + '.tmp', p); };

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

// ---- helpers ----
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png' };
const PUBLIC_FILES = new Set(['/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png', '/icons/apple-touch-icon.png']); // needed to install to the home screen
const APP_FILES = /^\/(index\.html|sw\.js|css\/[\w.-]+\.css|js\/[\w.-]+\.js|data\/map\.json)$/;
const SECURITY = { 'x-robots-tag': 'noindex, nofollow, noarchive', 'referrer-policy': 'no-referrer', 'x-content-type-options': 'nosniff', 'x-frame-options': 'DENY', 'cache-control': 'no-store' };
function send(res, status, body, headers = {}) { const b = typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body); res.writeHead(status, { 'content-type': typeof body === 'object' && !Buffer.isBuffer(body) ? 'application/json' : 'text/plain; charset=utf-8', ...SECURITY, ...headers }); res.end(b); }
function readBody(req, limit) { return new Promise((resolve, reject) => { const chunks = []; let n = 0; req.on('data', c => { n += c.length; if (n > limit) { reject(Object.assign(new Error('Too large'), { status: 413 })); req.destroy(); } else chunks.push(c); }); req.on('end', () => resolve(Buffer.concat(chunks))); req.on('error', reject); }); }
const secure = req => req.headers['x-forwarded-proto'] === 'https' || !!req.socket.encrypted;

const LOGIN = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="robots" content="noindex,nofollow"><meta name="theme-color" content="#0b0e10"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"><link rel="apple-touch-icon" href="icons/apple-touch-icon.png"><link rel="manifest" href="manifest.webmanifest"><title>ARTESH</title>
<style>html,body{height:100%;margin:0;background:#0b0e10;color:#eceae5;font:16px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}form{height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:24px;box-sizing:border-box}input,button{width:min(100%,300px);box-sizing:border-box;padding:14px 16px;border-radius:12px;border:1px solid rgba(255,255,255,.12);background:#14181b;color:inherit;font:inherit;outline:none}button{background:#e3b85c;color:#1c1505;font-weight:600;border:0}p{margin:0;height:20px;color:#e5604d;font-size:14px}</style></head>
<body><form id="f"><input id="p" type="password" placeholder="Password" autocomplete="current-password" autofocus><button>Enter</button><p id="e"></p></form>
<script>f.onsubmit=async e=>{e.preventDefault();const r=await fetch('api/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({password:p.value})});if(r.ok)location.replace('./');else{document.getElementById('e').textContent=r.status===429?'Too many tries. Wait a few minutes.':'Wrong password.';p.value=''}}</script></body></html>`;

async function openai(pathname, init) {
  if (!KEY) throw Object.assign(new Error('OPENAI_API_KEY is not set on the server.'), { status: 503 });
  const r = await fetch(BASE + pathname, { ...init, headers: { authorization: `Bearer ${KEY}`, ...(init.headers || {}) } });
  const text = await r.text(); let json = null; try { json = JSON.parse(text); } catch { /* not json */ }
  if (!r.ok) throw Object.assign(new Error(json?.error?.message || `OpenAI error ${r.status}`), { status: r.status === 401 ? 502 : r.status === 429 ? 429 : 502 });
  return json;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x'); let p = decodeURIComponent(url.pathname); if (p === '/') p = '/index.html';
  const ip = req.socket.remoteAddress || '?';
  try {
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

    if (!authed(req)) {
      if (p.startsWith('/api/')) return send(res, 401, { error: 'Not signed in' });
      // 401 (not a redirect) so the offline cache never stores the login page in place of the app
      return send(res, 401, p === '/index.html' ? LOGIN : 'Not signed in', p === '/index.html' ? { 'content-type': TYPES['.html'] } : {});
    }

    if (p === '/api/logout' && req.method === 'POST') { const m = (req.headers.cookie || '').match(new RegExp(`${COOKIE}=([a-f0-9]{64})`)); if (m) { sessions.delete(hash(m[1])); writeJSON('sessions.json', Object.fromEntries(sessions)); } return send(res, 200, { ok: true }, { 'set-cookie': `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax` }); }
    if (p === '/api/config') return send(res, 200, { server: true, judge: KEY ? MODEL : null, transcribe: KEY ? STT_MODEL : null, login: !!PASSWORD });

    if (p === '/api/state') {
      if (req.method === 'GET') return send(res, 200, readJSON('state.json', { rev: 0, data: null }));
      if (req.method === 'PUT') {
        const body = JSON.parse((await readBody(req, 20e6)).toString()); const cur = readJSON('state.json', { rev: 0, data: null });
        if (!body.data || !Array.isArray(body.data.reports)) return send(res, 400, { error: 'Bad state' });
        if (body.rev !== cur.rev) return send(res, 409, cur); // someone else saved first: hand back the newer copy
        const next = { rev: cur.rev + 1, saved: Date.now(), data: body.data }; writeJSON('state.json', next);
        return send(res, 200, { rev: next.rev });
      }
    }

    // judge: a structured-output call. The app builds the prompt and schema; the model and key stay here.
    if (p === '/api/llm' && req.method === 'POST') {
      const b = JSON.parse((await readBody(req, 200e3)).toString());
      if (typeof b.system !== 'string' || typeof b.user !== 'string' || typeof b.schema !== 'object') return send(res, 400, { error: 'Bad request' });
      const out = await openai('/responses', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({
        model: MODEL, max_output_tokens: 2000, store: false,
        input: [{ role: 'system', content: b.system }, { role: 'user', content: b.user }],
        text: { format: { type: 'json_schema', name: String(b.name || 'result').replace(/\W/g, '_').slice(0, 40), strict: true, schema: b.schema } },
      }) });
      if (out.status === 'incomplete') return send(res, 502, { error: 'The report was too long to judge in one go.' });
      const parts = (out.output || []).filter(o => o.type === 'message').flatMap(o => o.content || []);
      const refusal = parts.find(c => c.type === 'refusal'); if (refusal) return send(res, 422, { error: 'The model declined this report.' });
      const text = parts.find(c => c.type === 'output_text')?.text; if (!text) return send(res, 502, { error: 'Empty response from the model.' });
      return send(res, 200, { result: JSON.parse(text), model: MODEL });
    }

    if (p === '/api/transcribe' && req.method === 'POST') {
      const audio = await readBody(req, 25e6); if (audio.length < 500) return send(res, 400, { error: 'No audio' });
      const type = (req.headers['content-type'] || 'audio/webm').split(';')[0]; const ext = /mp4|m4a|aac/.test(type) ? 'm4a' : /ogg/.test(type) ? 'ogg' : /wav/.test(type) ? 'wav' : /mpeg|mp3/.test(type) ? 'mp3' : 'webm';
      const fd = new FormData(); fd.append('model', STT_MODEL); fd.append('file', new Blob([audio], { type }), `report.${ext}`);
      const out = await openai('/audio/transcriptions', { method: 'POST', body: fd });
      return send(res, 200, { text: String(out.text || '').trim(), model: STT_MODEL });
    }
    if (p.startsWith('/api/')) return send(res, 404, { error: 'Not found' });

    if (req.method === 'GET' && APP_FILES.test(p)) {
      const file = path.join(ROOT, p); if (!fs.existsSync(file)) return send(res, 404, 'Not found');
      res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream', ...SECURITY, 'cache-control': 'no-cache' }); return fs.createReadStream(file).pipe(res);
    }
    send(res, 404, 'Not found');
  } catch (e) {
    if (!res.headersSent) send(res, e.status || (e instanceof SyntaxError ? 400 : 500), { error: e.status ? e.message : e instanceof SyntaxError ? 'Bad JSON' : 'Server error' });
    if (!e.status && !(e instanceof SyntaxError)) console.error(e);
  }
});
server.listen(PORT, HOST, () => console.log(`ARTESH on http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT} — login ${PASSWORD ? 'on' : 'OFF'}, judge ${KEY ? MODEL : 'offline (no key)'}, transcription ${KEY ? STT_MODEL : 'off'}`));
