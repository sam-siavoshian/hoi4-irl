import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { mockOpenAI } from './mock-openai.mjs';

// main server: OpenAI Responses API, password, automation token
const PORT = 8141, MOCK = 8142, U = `http://127.0.0.1:${PORT}`;
// 8143: servers that must refuse to start
const CHAT = 8144, UC = `http://127.0.0.1:${CHAT}`;   // chat-completions provider with a key (same mock as the main server)
const MOCK2 = 8145;                                   // a keyless local provider (Ollama-like)
const LOCAL = 8146, UL = `http://127.0.0.1:${LOCAL}`; // keyless + HOMEFRONT_OPEN + tight rate limit + short provider timeout
const TOKEN = 'test-token-0123456789abcdef';
const DAY = 86400000;
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'homefront-'));
const dir = tmp(), dirChat = tmp(), dirLocal = tmp(), home = tmp();
let mock, mock2, cookie = ''; const procs = [];
// every variable the server reads is pinned, so neither the caller's environment nor a local .env leaks into the tests
const clean = Object.fromEntries(Object.entries(process.env).filter(([k]) => !/^(OPENAI_|HOMEFRONT_|LLM_)/.test(k)));
const base = { ...clean, HOST: '127.0.0.1', HOMEFRONT_OPEN: '', HOMEFRONT_TOKEN: '', HOMEFRONT_RATE_LIMIT: '', LLM_API: '', LLM_TIMEOUT_MS: '', OPENAI_MODEL: '', OPENAI_TRANSCRIBE_MODEL: '', OPENAI_TRANSCRIBE_BASE_URL: '' };
const env = { ...base, PORT, HOMEFRONT_PASSWORD: 'open sesame', HOMEFRONT_TOKEN: TOKEN, OPENAI_API_KEY: 'sk-test-key', OPENAI_BASE_URL: `http://127.0.0.1:${MOCK}/v1`, HOMEFRONT_DATA_DIR: dir };
const envChat = { ...base, PORT: CHAT, HOMEFRONT_PASSWORD: 'pw', LLM_API: 'chat', OPENAI_API_KEY: 'sk-test-key', OPENAI_BASE_URL: `http://127.0.0.1:${MOCK}/v1`, OPENAI_TRANSCRIBE_BASE_URL: `http://127.0.0.1:${MOCK2}/v1`, HOMEFRONT_DATA_DIR: dirChat };
const envLocal = { ...base, PORT: LOCAL, HOMEFRONT_PASSWORD: '', HOMEFRONT_OPEN: '1', LLM_API: 'chat', OPENAI_API_KEY: '', OPENAI_BASE_URL: `http://127.0.0.1:${MOCK2}/v1/`, OPENAI_MODEL: 'llama3.2', OPENAI_TRANSCRIBE_MODEL: 'off', HOMEFRONT_RATE_LIMIT: '6', LLM_TIMEOUT_MS: '400', HOMEFRONT_DATA_DIR: dirLocal };

const req = (p, init = {}) => fetch(U + p, { ...init, headers: { ...(init.headers || {}), ...(cookie ? { cookie } : {}) }, redirect: 'manual' });
const bearer = (p, init = {}, token = TOKEN) => fetch(U + p, { ...init, headers: { ...(init.headers || {}), authorization: `Bearer ${token}` }, redirect: 'manual' });
const report = (body, token = TOKEN) => bearer('/api/report', { method: 'POST', headers: { 'content-type': typeof body === 'string' ? 'text/plain' : 'application/json' }, body: typeof body === 'string' ? body : JSON.stringify(body) }, token);
const state = async () => (await req('/api/state')).json();
const put = (rev, data) => req('/api/state', { method: 'PUT', body: JSON.stringify({ rev, data }) });
const journalFile = () => fs.readFileSync(path.join(dir, 'journal.ndjson'), 'utf8');
const lines = () => journalFile().trim().split('\n').map(l => JSON.parse(l));
const pad = n => String(n).padStart(2, '0'); const today = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const schema = { type: 'object', properties: { summary: { type: 'string' }, items: { type: 'array', items: { type: 'object', properties: { front: { type: 'string' } }, required: ['front'], additionalProperties: false } } }, required: ['summary', 'items'], additionalProperties: false };
const llm = (u, user, headers = {}) => fetch(u + '/api/llm', { method: 'POST', headers, body: JSON.stringify({ name: 'battle_report', system: 'sys', user, schema }) });
const start = async (e, url) => { procs.push(spawn('node', ['server.mjs'], { env: e, stdio: 'ignore' })); for (let i = 0; i < 60; i++) { try { await fetch(url + '/healthz'); return; } catch { await new Promise(r => setTimeout(r, 100)); } } throw new Error('server did not start: ' + url); };
const exitCode = e => new Promise(r => spawn('node', ['server.mjs'], { env: { ...e, PORT: 8143 }, stdio: 'ignore' }).on('exit', r));
const cli = (args, e = {}, input) => new Promise(r => { const c = spawn('node', ['bin/homefront.mjs', ...args], { env: { ...clean, HOME: home, XDG_CONFIG_HOME: path.join(home, '.config'), ...e }, stdio: ['pipe', 'pipe', 'pipe'] }); let out = '', err = ''; c.stdout.on('data', d => out += d); c.stderr.on('data', d => err += d); c.on('exit', code => r({ code, out, err })); c.stdin.end(input || ''); });

test.before(async () => {
  mock = await mockOpenAI(MOCK); mock2 = await mockOpenAI(MOCK2, { key: null });
  // old backups already on disk: the server must keep the newest 30 only
  fs.mkdirSync(path.join(dir, 'backups'));
  for (let i = 1; i <= 28; i++) fs.writeFileSync(path.join(dir, 'backups', `state-2020-01-${pad(i)}.json`), '{}');
  for (let i = 1; i <= 7; i++) fs.writeFileSync(path.join(dir, 'backups', `state-2020-02-${pad(i)}.json`), '{}');
  fs.writeFileSync(path.join(dir, 'backups', 'notes.txt'), 'not a backup: left alone');
  await Promise.all([start(env, U), start(envChat, UC), start(envLocal, UL)]);
});
test.after(() => { for (const p of procs) p.kill(); mock.close(); mock2.close(); for (const d of [dir, dirChat, dirLocal, home]) fs.rmSync(d, { recursive: true, force: true }); });

test('nothing is served without the password', async () => {
  for (const p of ['/', '/index.html', '/assets/index.js', '/theme-boot.js', '/data/maps/iran.json', '/sw.js']) { const r = await req(p); assert.equal(r.status, 401, p); }
  const home = await (await req('/')).text(); assert.match(home, /type="password"/); assert.doesNotMatch(home, /id="root"|assets\//);
  for (const p of ['/api/state', '/api/config', '/api/llm', '/api/transcribe']) assert.equal((await req(p, { method: p === '/api/llm' ? 'POST' : 'GET' })).status, 401, p);
  for (const [p, method] of [['/api/report', 'POST'], ['/api/sitrep', 'GET'], ['/api/journal', 'GET'], ['/api/state', 'PUT'], ['/api/transcribe', 'POST']]) assert.equal((await req(p, { method })).status, 401, p);
  assert.match(await (await req('/robots.txt')).text(), /Disallow: \//);
  assert.match((await req('/')).headers.get('x-robots-tag'), /noindex/);
  assert.equal((await req('/icons/apple-touch-icon.png')).status, 200, 'home-screen icon stays reachable');
});
test('/healthz answers without a login and gives nothing away', async () => {
  const r = await fetch(U + '/healthz'); assert.equal(r.status, 200); assert.equal(await r.text(), 'ok');
  assert.match(r.headers.get('content-type'), /text\/plain/); assert.equal(r.headers.get('cache-control'), 'no-store');
  assert.equal((await fetch(U + '/%E0%A4%A')).status, 400, 'a malformed path is refused, not a crash');
  assert.equal((await fetch(U + '/healthz')).status, 200);
});
test('secrets and private files are never served, even when signed in', async () => {
  assert.equal((await req('/api/login', { method: 'POST', body: JSON.stringify({ password: 'wrong' }) })).status, 401);
  const ok = await req('/api/login', { method: 'POST', body: JSON.stringify({ password: 'open sesame' }) }); assert.equal(ok.status, 200);
  const sc = ok.headers.get('set-cookie'); assert.match(sc, /HttpOnly/); assert.match(sc, /SameSite=Lax/); cookie = sc.split(';')[0];
  assert.equal((await req('/')).status, 200); const app = await (await req('/')).text(); assert.match(app, /id="root"/);
  // the built interface: hashed files under assets/, the theme boot script and the service worker, and nothing beside them
  const assets = [...app.matchAll(/(?:src|href)="\.\/(assets\/[^"]+)"/g)].map(m => '/' + m[1]); assert.ok(assets.some(a => a.endsWith('.js')) && assets.some(a => a.endsWith('.css')), 'index.html names its script and stylesheet');
  for (const a of assets) { const r = await req(a); assert.equal(r.status, 200, a); assert.match(r.headers.get('cache-control'), /immutable/); assert.equal(r.headers.get('x-content-type-options'), 'nosniff'); }
  assert.equal((await req('/theme-boot.js')).status, 200); const sw = await req('/sw.js'); assert.equal(sw.status, 200); assert.match(await sw.text(), /assets\/index-[\w-]+\.js/);
  for (const p of ['/assets/', '/assets/%2e%2e/%2e%2e/.env', '/assets/..%2f..%2fserver.mjs', '/dist/index.html', '/src/main.jsx', '/src/core.js', '/js/engine.js', '/vendor/design-system/package.json', '/vite.config.js', '/node_modules/vite/package.json']) assert.equal((await req(p)).status, 404, p);
  for (const p of ['/.env', '/.env.example', '/server.mjs', '/server/llm.mjs', '/server/storage.mjs', '/bin/homefront.mjs', '/private/state.json', '/private/sessions.json', '/private/journal.ndjson', '/journal.ndjson', '/backups/state-2020-02-01.json', '/package.json', '/js/../.env', '/tests/e2e.mjs', '/.git/config']) assert.equal((await req(p)).status, 404, p);
  const cfg = await (await req('/api/config')).json();
  assert.deepEqual(cfg, { server: true, judge: 'gpt-6-luna', transcribe: 'gpt-transcribe', login: true, provider: '127.0.0.1', api: 'responses' });
  assert.doesNotMatch(JSON.stringify(cfg), /sk-|test-token/);
});
test('judging is proxied to the OpenAI Responses API with a strict schema', async () => {
  const schema = { type: 'object', properties: { summary: { type: 'string' } }, required: ['summary'], additionalProperties: false };
  const r = await req('/api/llm', { method: 'POST', body: JSON.stringify({ name: 'battle_report', system: 'sys', user: 'we closed the round', schema }) }); assert.equal(r.status, 200);
  const j = await r.json(); assert.equal(j.result.items[0].front, 'irq'); assert.equal(j.model, 'gpt-6-luna');
  const sent = mock.seen.at(-1); assert.equal(sent.path, '/v1/responses'); assert.equal(sent.auth, 'Bearer sk-test-key'); assert.equal(sent.body.model, 'gpt-6-luna'); assert.equal(sent.body.store, false);
  assert.deepEqual(sent.body.text.format, { type: 'json_schema', name: 'battle_report', strict: true, schema }); assert.deepEqual(sent.body.input.map(m => m.role), ['system', 'user']);
  assert.equal((await req('/api/llm', { method: 'POST', body: JSON.stringify({ name: 'x', system: 's', user: 'REFUSE', schema }) })).status, 422);
  assert.equal((await req('/api/llm', { method: 'POST', body: '{"nope":1}' })).status, 400);
  assert.equal((await req('/api/llm', { method: 'POST', body: 'null' })).status, 400);
  const down = await req('/api/llm', { method: 'POST', body: JSON.stringify({ name: 'x', system: 's', user: 'PROVIDER_DOWN', schema }) });
  assert.equal(down.status, 502); assert.doesNotMatch(JSON.stringify(await down.json()), /sk-test/);
});
test('audio is transcribed with gpt-transcribe', async () => {
  const r = await req('/api/transcribe', { method: 'POST', headers: { 'content-type': 'audio/mp4' }, body: Buffer.alloc(4000, 7) }); assert.equal(r.status, 200);
  assert.deepEqual(await r.json(), { text: 'I failed my exam.', model: 'gpt-transcribe' });
  const sent = mock.seen.at(-1); assert.equal(sent.path, '/v1/audio/transcriptions'); assert.match(sent.type, /multipart\/form-data/);
  const raw = sent.raw.toString('latin1'); assert.match(raw, /name="model"\r\n\r\ngpt-transcribe/); assert.match(raw, /filename="report\.m4a"/);
  assert.equal((await req('/api/transcribe', { method: 'POST', body: 'x' })).status, 400);
});
test('the campaign is stored on the server and guarded against overwrites', async () => {
  assert.deepEqual(await (await req('/api/state')).json(), { rev: 0, data: null });
  assert.deepEqual(await (await put(0, { reports: [{ id: 'a', ts: 1, items: [] }] })).json(), { rev: 1 });
  const stale = await put(0, { reports: [] }); assert.equal(stale.status, 409); assert.equal((await stale.json()).data.reports[0].id, 'a');
  assert.equal((await put(1, { nope: true })).status, 400);
  assert.equal(JSON.parse(fs.readFileSync(path.join(dir, 'state.json'))).rev, 1);
  assert.equal(fs.statSync(path.join(dir, 'state.json')).mode & 0o077, 0, 'state file is private to the user');
});

test('every change is journaled, and the journal only ever grows', async () => {
  const sizes = [fs.statSync(path.join(dir, 'journal.ndjson')).size]; const grew = () => { sizes.push(fs.statSync(path.join(dir, 'journal.ndjson')).size); assert.ok(sizes.at(-1) > sizes.at(-2), 'journal grew'); };
  let l = lines(); assert.equal(l.length, 1, 'refused saves (409, 400) write nothing');
  assert.equal(l[0].op, 'add'); assert.equal(l[0].id, 'a'); assert.deepEqual(l[0].report, { id: 'a', ts: 1, items: [] }); assert.ok(Number.isFinite(Date.parse(l[0].t)));
  assert.equal(fs.statSync(path.join(dir, 'journal.ndjson')).mode & 0o777, 0o600, 'journal is private to the user');
  const before = journalFile();

  const b = { id: 'b', ts: Date.now() - DAY, text: 'gym', summary: '', source: 'manual', items: [{ front: 'raj', outcome: 'win', severity: 2, action: 'offensive', headline: 'Good day at the gym' }] };
  assert.equal((await put(1, { reports: [{ id: 'a', ts: 1, text: 'fixed a typo', items: [] }, b], labels: { afg: 'Uni' }, notes: {}, off: [] })).status, 200); grew();
  l = lines(); assert.deepEqual(l.slice(1).map(x => x.op).sort(), ['add', 'edit', 'settings']);
  const edit = l.find(x => x.op === 'edit'); assert.equal(edit.id, 'a'); assert.deepEqual(edit.before, { id: 'a', ts: 1, items: [] }); assert.equal(edit.after.text, 'fixed a typo');
  assert.deepEqual(l.find(x => x.op === 'add' && x.id === 'b').report, b);
  assert.deepEqual(l.find(x => x.op === 'settings').changes, { labels: { afg: [null, 'Uni'] } });

  assert.equal((await put(2, { reports: [b], labels: { afg: 'Uni' }, notes: { afg: 'engineering degree' }, off: ['tks'] })).status, 200); grew();
  l = lines(); const del = l.at(-2); assert.equal(del.op, 'delete'); assert.equal(del.id, 'a'); assert.deepEqual(del.report, { id: 'a', ts: 1, text: 'fixed a typo', items: [] }, 'the whole deleted report is kept');
  assert.deepEqual(l.at(-1).changes, { notes: { afg: [null, 'engineering degree'] }, off: [[], ['tks']] });
  assert.equal((await put(3, { reports: [b], labels: { afg: 'Uni' }, notes: { afg: 'engineering degree' }, off: [] })).status, 200); grew();
  const n = lines().length; assert.equal((await put(4, { reports: [b], labels: { afg: 'Uni' }, notes: { afg: 'engineering degree' }, off: [], mode: 'terrain' })).status, 200);
  assert.equal(lines().length, n, 'a save that changes no report and no setting adds no line');
  assert.ok(journalFile().startsWith(before), 'earlier lines are never rewritten');

  const all = await (await req('/api/journal')).json(); assert.deepEqual(all, lines());
  assert.deepEqual(await (await req('/api/journal?since=' + encodeURIComponent(del.t))).json(), all.filter(x => x.t >= del.t));
  assert.deepEqual(await (await req('/api/journal?since=2999-01-01T00:00:00Z')).json(), []);
  assert.equal((await req('/api/journal?since=yesterday-ish')).status, 400);
  assert.equal((await req('/api/journal', { method: 'DELETE' })).status, 405);
});
test('the first save of the day keeps a dated backup; only the newest 30 are kept', async () => {
  const files = fs.readdirSync(path.join(dir, 'backups')).filter(f => f.startsWith('state-')).sort();
  assert.equal(files.length, 30); assert.equal(files.at(-1), `state-${today()}.json`); assert.equal(files[0], 'state-2020-01-07.json', 'the oldest were pruned');
  assert.ok(fs.existsSync(path.join(dir, 'backups', 'notes.txt')), 'other files are left alone');
  const snap = JSON.parse(fs.readFileSync(path.join(dir, 'backups', files.at(-1))));
  assert.equal(snap.rev, 1, 'it holds the state from before the first overwrite of the day'); assert.equal(snap.data.reports[0].id, 'a');
  assert.equal(fs.statSync(path.join(dir, 'backups', files.at(-1))).mode & 0o077, 0);
});

test('the automation token opens /api/report, /api/sitrep and /api/journal — and nothing else', async () => {
  assert.equal((await bearer('/api/sitrep')).status, 200); assert.equal((await bearer('/api/journal')).status, 200);
  for (const p of ['/', '/assets/index.js', '/api/state', '/api/config', '/data/maps/iran.json']) assert.equal((await bearer(p)).status, 401, p);
  assert.equal((await bearer('/api/llm', { method: 'POST', body: '{}' })).status, 401); assert.equal((await bearer('/api/transcribe', { method: 'POST', body: 'x' })).status, 401);
  assert.equal((await bearer('/api/state', { method: 'PUT', body: JSON.stringify({ rev: 5, data: { reports: [] } }) })).status, 401);
  for (const t of ['wrong-token-0123456789abcdef', TOKEN + 'x', TOKEN.slice(0, -1), 'open sesame']) { assert.equal((await bearer('/api/sitrep', {}, t)).status, 401); assert.equal((await report('I failed my exam', t)).status, 401); }
  assert.equal((await fetch(U + '/api/sitrep', { headers: { authorization: `Basic ${TOKEN}` } })).status, 401);
  assert.equal((await fetch(U + '/api/sitrep?token=' + TOKEN)).status, 401, 'the token is only read from the header');
  // with no HOMEFRONT_TOKEN on the server, bearer auth is off altogether
  assert.equal((await fetch(UC + '/api/sitrep', { headers: { authorization: `Bearer ${TOKEN}` } })).status, 401);
  assert.equal((await fetch(UC + '/api/sitrep', { headers: { authorization: 'Bearer ' } })).status, 401);
  assert.equal((await state()).rev, 5, 'nothing was written by any refused request');
});
test('POST /api/report judges a plain-text report, saves it and answers for Siri', async () => {
  const r = await report('we closed the round but I missed my flight'); assert.equal(r.status, 200); const j = await r.json();
  assert.equal(j.ok, true); assert.equal(j.source, 'llm'); assert.equal(j.summary, 'The Mesopotamian Front has broken open.'); assert.equal(j.warning, undefined);
  assert.deepEqual(j.items.map(({ front, label, outcome, severity, action, headline }) => ({ front, label, outcome, severity, action, headline })), [
    { front: 'irq', label: 'Startup', outcome: 'win', severity: 5, action: 'breakthrough', headline: 'Seed round closed' },
    { front: 'glf', label: 'Personal Life', outcome: 'loss', severity: 4, action: 'port_strike', headline: 'Missed the flight' }]);
  assert.equal(j.speech, 'Logged 1 win and 1 loss. Startup: Seed round closed; Personal Life: Missed the flight.');
  // the same prompt and schema the app sends, built from the user's own labels and the current map
  const sent = mock.seen.at(-1); assert.equal(sent.path, '/v1/responses'); assert.equal(sent.body.text.format.name, 'battle_report'); assert.equal(sent.body.text.format.strict, true);
  assert.match(sent.body.input[0].content, /afg: .*"Uni"/); assert.match(sent.body.input[0].content, /engineering degree/); assert.match(sent.body.input[1].content, /we closed the round/);
  assert.ok(sent.body.text.format.schema.properties.items.items.properties.front.enum.includes('irq'));
  const s = await state(); assert.equal(s.rev, 6); assert.equal(j.rev, 6); assert.equal(s.data.reports.length, 2); assert.deepEqual(s.data.labels, { afg: 'Uni' }, 'settings are untouched');
  const rep = s.data.reports.at(-1); assert.deepEqual(j.reports, [rep.id]); assert.equal(rep.text, 'we closed the round but I missed my flight'); assert.equal(rep.summary, j.summary); assert.equal(rep.source, 'llm');
  assert.ok(Math.abs(rep.ts - Date.now()) < 5000); assert.deepEqual(rep.items.map(i => i.front), ['irq', 'glf']); assert.equal(rep.items[0].days_ago, undefined); assert.equal(rep.items[0].reason, 'because of what was said');
  const last = lines().at(-1); assert.equal(last.op, 'add'); assert.equal(last.id, rep.id); assert.deepEqual(last.report, rep); assert.equal(last.src, 'api');
  // the app, still holding the old revision, is told to take the newer copy rather than overwrite it
  assert.equal((await put(5, { reports: [] })).status, 409);
});
test('/api/report dates events like the app does: one report per day mentioned', async () => {
  const j = await (await report({ text: "School is bad, I'm failing this class since yesterday. Fight with my mother. Guitar went great." })).json();
  assert.equal(j.ok, true); assert.deepEqual(j.items.map(i => [i.front, i.days_ago]), [['afg', 1], ['cau', 0], ['tur', 0]]); assert.equal(j.items[0].label, 'Uni'); assert.equal(j.reports.length, 2);
  const s = await state(); assert.equal(s.rev, 7, 'one save for the whole report'); const reps = j.reports.map(id => s.data.reports.find(r => r.id === id));
  const past = reps.find(r => r.items[0].front === 'afg'), now = reps.find(r => r.items[0].front === 'cau');
  const y = new Date(Date.now() - DAY); y.setHours(20, 0, 0, 0); assert.equal(past.ts, y.getTime(), 'yesterday lands at 20:00 local'); assert.equal(past.text, ''); assert.equal(past.summary, ''); assert.equal(past.items.length, 1);
  assert.ok(Math.abs(now.ts - Date.now()) < 5000); assert.match(now.text, /failing this class/); assert.equal(now.summary, 'A hard day in the east.'); assert.deepEqual(now.items.map(i => i.front), ['cau', 'tur']);
  assert.deepEqual(lines().slice(-2).map(l => [l.op, l.src]), [['add', 'api'], ['add', 'api']]);
  // "when" files the report as of an earlier moment
  const at = Date.now() - 3 * DAY; const w = await (await report({ text: 'I failed my exam', when: new Date(at).toISOString() })).json();
  assert.equal((await state()).data.reports.find(r => r.id === w.reports[0]).ts, at);
  for (const when of ['not a date', new Date(Date.now() + DAY).toISOString()]) { const r = await report({ text: 'I failed my exam', when }); assert.equal(r.status, 400); assert.equal((await r.json()).ok, false); }
});
test('/api/report: an unclear report logs nothing and can be retried by hand', async () => {
  const rev = (await state()).rev;
  const j = await (await report({ text: 'went to the dentist' })).json();
  assert.equal(j.ok, false); assert.equal(j.reason, 'unclear'); assert.equal(typeof j.speech, 'string');
  assert.deepEqual(j.fronts.find(f => f.id === 'afg'), { id: 'afg', label: 'Uni' }); assert.equal(j.fronts.length, 7); assert.equal((await state()).rev, rev);
  const calls = mock.seen.length;
  const m = await (await report({ text: 'went to the dentist', front: 'raj', outcome: 'loss' })).json();
  assert.equal(m.ok, true); assert.equal(m.source, 'manual'); assert.equal(mock.seen.length, calls, 'a manual entry is not judged');
  assert.deepEqual(m.items.map(({ days_ago, ...i }) => i), [{ front: 'raj', label: 'Gym & Health', outcome: 'loss', severity: 2, action: 'enemy_offensive', headline: 'went to the dentist' }]);
  const s = await state(); assert.equal(s.rev, rev + 1); assert.deepEqual(s.data.reports.at(-1).items, [{ front: 'raj', outcome: 'loss', severity: 2, action: 'enemy_offensive', headline: 'went to the dentist' }]); assert.equal(s.data.reports.at(-1).source, 'manual');
  const byLabel = await (await report({ text: 'Handed in the thesis', front: 'uni', outcome: 'win' })).json(); assert.equal(byLabel.items[0].front, 'afg'); assert.equal(byLabel.items[0].action, 'offensive');
  for (const body of [{ text: 'x y z', front: 'nowhere', outcome: 'win' }, { text: 'x y z', front: 'raj', outcome: 'meh' }, { text: 'x y z', front: 'raj' }]) { const r = await report(body); assert.equal(r.status, 400); const e = await r.json(); assert.equal(e.ok, false); assert.equal(e.fronts.length, 7); }
  assert.equal((await state()).rev, rev + 2);
});
test('/api/report falls back to the offline judge when the provider fails, and refuses bad input', async () => {
  const j = await (await report('I failed my exam at school PROVIDER_DOWN')).json();
  assert.equal(j.ok, true); assert.equal(j.source, 'local'); assert.match(j.warning, /offline/i); assert.doesNotMatch(JSON.stringify(j), /sk-test/);
  assert.equal(j.items[0].front, 'afg'); assert.equal(j.items[0].outcome, 'loss');
  const s = await state(); assert.equal(s.data.reports.at(-1).source, 'local'); assert.equal(s.data.reports.at(-1).id, j.reports[0]);
  const rev = s.rev;
  const empty = await report(''); assert.equal(empty.status, 400); assert.deepEqual((({ ok, reason }) => ({ ok, reason }))(await empty.json()), { ok: false, reason: 'empty' });
  assert.equal((await report({ nothing: true })).status, 400);
  assert.equal((await bearer('/api/report', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{"text": ' })).status, 400);
  assert.equal((await report('x'.repeat(9000))).status, 413, 'reports are capped at 8 KB');
  assert.equal((await bearer('/api/report')).status, 405);
  assert.equal((await state()).rev, rev);
  // cookie sessions work on the automation endpoints too
  assert.equal((await (await req('/api/report', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text: 'Skipped the gym', front: 'raj', outcome: 'loss' }) })).json()).ok, true);
});
test('saves from the app and reports from the API never interleave', async () => {
  const s0 = await state(); const n0 = lines().length;
  const texts = ['one', 'two', 'three', 'four', 'five', 'six'].map(t => `Gym session number ${t}`);
  const [app, ...rs] = await Promise.all([put(s0.rev, s0.data), ...texts.map(t => report({ text: t, front: 'raj', outcome: 'win' }))]);
  assert.ok(app.status === 200 || app.status === 409); for (const r of rs) assert.equal(r.status, 200);
  const js = await Promise.all(rs.map(r => r.json())); assert.equal(new Set(js.map(j => j.rev)).size, 6, 'every write got its own revision');
  const s1 = await state(); assert.equal(s1.rev, s0.rev + 6 + (app.status === 200 ? 1 : 0)); assert.equal(s1.data.reports.length, s0.data.reports.length + 6);
  for (const t of texts) assert.ok(s1.data.reports.some(r => r.text === t), t);
  assert.equal(lines().length, n0 + 6); assert.equal(JSON.parse(fs.readFileSync(path.join(dir, 'state.json'))).rev, s1.rev);
});
test('GET /api/sitrep is a plain-text situation report in the user\'s own labels', async () => {
  const r = await bearer('/api/sitrep'); assert.equal(r.status, 200); assert.match(r.headers.get('content-type'), /^text\/plain/);
  const t = await r.text(); assert.match(t, /Uni/); assert.match(t, /Startup/); assert.ok(t.split('\n').length >= 7);
  assert.equal((await bearer('/api/sitrep', { method: 'POST' })).status, 405);
  assert.equal(await (await req('/api/sitrep')).text(), t);
});
test('the homefront command line files reports and reads the situation', async () => {
  const e = { HOMEFRONT_URL: U + '/', HOMEFRONT_TOKEN: TOKEN };
  const help = await cli(['--help']); assert.equal(help.code, 0); assert.match(help.out, /homefront report/); assert.match(help.out, /HOMEFRONT_TOKEN/);
  const sit = await cli(['sitrep'], e); assert.equal(sit.code, 0, sit.err); assert.match(sit.out, /Uni/);
  const rep = await cli(['report', 'I failed my exam'], e); assert.equal(rep.code, 0, rep.err); assert.match(rep.out, /The line bends\./); assert.match(rep.out, /- Uni · loss 3 · Exam failed/);
  const piped = await cli(['report', '--json'], e, 'we closed the round\n'); assert.equal(piped.code, 0, piped.err); assert.equal(JSON.parse(piped.out).items[0].front, 'irq');
  const unclear = await cli(['report', 'went to the dentist'], e); assert.equal(unclear.code, 2); assert.match(unclear.err, /raj\s+Gym & Health/);
  const manual = await cli(['report', 'went to the dentist', '--front', 'raj', '--outcome=win'], e); assert.equal(manual.code, 0, manual.err); assert.match(manual.out, /\+ Gym & Health · win 2/);
  const since = new Date(Date.now() - 60e3).toISOString(); const jr = await cli(['journal', '--since', since], e); assert.equal(jr.code, 0, jr.err);
  const jl = jr.out.trim().split('\n').map(l => JSON.parse(l)); assert.ok(jl.length >= 10); assert.equal(jl.at(-1).op, 'add'); assert.deepEqual(jl, lines().filter(l => l.t >= since));
  // clear errors
  const none = await cli(['sitrep']); assert.equal(none.code, 1); assert.match(none.err, /HOMEFRONT_URL/);
  const noTok = await cli(['sitrep'], { HOMEFRONT_URL: U }); assert.equal(noTok.code, 1); assert.match(noTok.err, /HOMEFRONT_TOKEN/);
  const wrong = await cli(['sitrep'], { HOMEFRONT_URL: U, HOMEFRONT_TOKEN: 'nope-nope-nope-nope-nope' }); assert.equal(wrong.code, 1); assert.match(wrong.err, /refused the token/); assert.doesNotMatch(wrong.err, /at .*homefront\.mjs/);
  const dead = await cli(['sitrep'], { HOMEFRONT_URL: 'http://127.0.0.1:8149', HOMEFRONT_TOKEN: TOKEN }); assert.equal(dead.code, 1); assert.match(dead.err, /cannot reach/);
  const bad = await cli(['frobnicate'], e); assert.equal(bad.code, 1); assert.match(bad.err, /unknown command/);
  // the config file is used when the environment is silent
  fs.mkdirSync(path.join(home, '.config', 'homefront'), { recursive: true }); fs.writeFileSync(path.join(home, '.config', 'homefront', 'config.json'), JSON.stringify({ url: U, token: TOKEN }));
  const viaFile = await cli(['sitrep']); assert.equal(viaFile.code, 0, viaFile.err); assert.match(viaFile.out, /Uni/);
});

test('chat-completions providers: strict json_schema, end to end', async () => {
  const login = await fetch(UC + '/api/login', { method: 'POST', body: JSON.stringify({ password: 'pw' }) }); assert.equal(login.status, 200); const c = { cookie: login.headers.get('set-cookie').split(';')[0] };
  assert.deepEqual(await (await fetch(UC + '/api/config', { headers: c })).json(), { server: true, judge: 'gpt-6-luna', transcribe: 'gpt-transcribe', login: true, provider: '127.0.0.1', api: 'chat' });
  mock.chat = 'schema'; const n = mock.seen.length;
  const r = await llm(UC, 'we closed the round', c); assert.equal(r.status, 200); const j = await r.json(); assert.equal(j.result.items[0].front, 'irq'); assert.equal(j.model, 'gpt-6-luna');
  assert.equal(mock.seen.length, n + 1); const sent = mock.seen.at(-1); assert.equal(sent.path, '/v1/chat/completions'); assert.equal(sent.auth, 'Bearer sk-test-key'); assert.equal(sent.body.model, 'gpt-6-luna');
  assert.deepEqual(sent.body.messages, [{ role: 'system', content: 'sys' }, { role: 'user', content: 'we closed the round' }]);
  assert.deepEqual(sent.body.response_format, { type: 'json_schema', json_schema: { name: 'battle_report', strict: true, schema } });
  assert.equal((await llm(UC, 'REFUSE', c)).status, 422); assert.equal((await llm(UC, 'BADSHAPE', c)).status, 502); assert.equal((await llm(UC, 'PROVIDER_DOWN', c)).status, 502);
  assert.equal((await llm(UC, 'x')).status, 401);
  // transcription can live on a different endpoint from the judge
  const t = await fetch(UC + '/api/transcribe', { method: 'POST', headers: { ...c, 'content-type': 'audio/webm' }, body: Buffer.alloc(4000, 7) }); assert.equal(t.status, 200); assert.equal((await t.json()).text, 'I failed my exam.');
  assert.equal(mock2.seen.at(-1).path, '/v1/audio/transcriptions'); assert.match(mock2.seen.at(-1).raw.toString('latin1'), /filename="report\.webm"/);
  // and /api/report goes through the same provider
  const rep = await (await fetch(UC + '/api/report', { method: 'POST', headers: c, body: 'I failed my exam' })).json(); assert.equal(rep.ok, true); assert.equal(rep.source, 'llm'); assert.equal(rep.items[0].label, 'School');
  assert.equal(mock.seen.at(-1).path, '/v1/chat/completions'); assert.equal(mock.seen.at(-1).body.response_format.json_schema.name, 'battle_report');
  assert.equal(JSON.parse(fs.readFileSync(path.join(dirChat, 'state.json'))).data.reports.length, 1, 'a first report creates the campaign');
});
test('chat-completions providers without json_schema: one retry with json_object and the schema in the prompt', async () => {
  const login = await fetch(UC + '/api/login', { method: 'POST', body: JSON.stringify({ password: 'pw' }) }); const c = { cookie: login.headers.get('set-cookie').split(';')[0] };
  mock.chat = 'object'; const n = mock.seen.length;
  try {
    const r = await llm(UC, 'we closed the round', c); assert.equal(r.status, 200); assert.equal((await r.json()).result.items[1].front, 'glf', 'a fenced answer is still read');
    assert.equal(mock.seen.length, n + 2, 'exactly one retry'); const [first, second] = mock.seen.slice(-2);
    assert.equal(first.body.response_format.type, 'json_schema'); assert.deepEqual(second.body.response_format, { type: 'json_object' });
    assert.equal(second.body.messages.length, 2); assert.ok(second.body.messages[0].content.startsWith('sys\n')); assert.ok(second.body.messages[0].content.includes(JSON.stringify(schema)), 'the schema is given in the system prompt');
    assert.equal(second.body.messages[1].content, 'we closed the round');
    const bad = await llm(UC, 'BADSHAPE', c); assert.equal(bad.status, 502, 'JSON of the wrong shape is refused'); assert.equal(mock.seen.length, n + 4);
    assert.equal((await llm(UC, 'REFUSE', c)).status, 422);
  } finally { mock.chat = 'schema'; }
});
test('a keyless local endpoint (Ollama, LM Studio) turns the judge on; transcription can be off', async () => {
  assert.deepEqual(await (await fetch(UL + '/api/config')).json(), { server: true, judge: 'llama3.2', transcribe: null, login: false, provider: '127.0.0.1', api: 'chat' });
  const r = await llm(UL, 'we closed the round'); assert.equal(r.status, 200); assert.equal((await r.json()).model, 'llama3.2');
  const sent = mock2.seen.at(-1); assert.equal(sent.path, '/v1/chat/completions', 'a trailing slash on the base URL is fine'); assert.equal(sent.auth, undefined, 'no Authorization header is sent'); assert.equal(sent.body.model, 'llama3.2');
  const n = mock2.seen.length; const t = await fetch(UL + '/api/transcribe', { method: 'POST', body: Buffer.alloc(4000, 7) }); assert.equal(t.status, 503); assert.equal(mock2.seen.length, n);
});
test('a provider that never answers gives a clean 504', async () => {
  const t0 = Date.now(); const r = await llm(UL, 'HANG'); assert.equal(r.status, 504); assert.match((await r.json()).error, /too long/); assert.ok(Date.now() - t0 < 5000);
  // and a report falls back to the offline judge instead of failing
  const j = await (await fetch(UL + '/api/report', { method: 'POST', body: 'HANG. I failed my exam at school.' })).json(); assert.equal(j.ok, true); assert.equal(j.source, 'local'); assert.match(j.warning, /too long/);
});
test('the costly endpoints are rate limited per address', async () => {
  // 4 of this server's 6 requests a minute were used by the two tests above
  const codes = []; let last;
  for (let i = 0; i < 5; i++) { last = await fetch(UL + '/api/report', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text: 'Gym', front: 'raj', outcome: 'win' }) }); codes.push(last.status); }
  assert.deepEqual(codes, [200, 200, 429, 429, 429]); const wait = Number(last.headers.get('retry-after')); assert.ok(wait >= 1 && wait <= 60);
  assert.equal((await llm(UL, 'we closed the round')).status, 429); assert.equal((await fetch(UL + '/api/transcribe', { method: 'POST', body: 'x' })).status, 429);
  assert.equal((await fetch(UL + '/api/state')).status, 200, 'everything else is unaffected'); assert.equal((await fetch(UL + '/api/sitrep')).status, 200);
  assert.equal(JSON.parse(fs.readFileSync(path.join(dirLocal, 'state.json'))).data.reports.length, 3);
});

test('logging out ends the session; the server will not start without a password', async () => {
  assert.equal((await req('/api/logout', { method: 'POST' })).status, 200); assert.equal((await req('/api/state')).status, 401);
  assert.equal((await bearer('/api/sitrep')).status, 200, 'the automation token is separate from browser sessions');
  assert.equal(await exitCode({ ...env, HOMEFRONT_PASSWORD: '' }), 1);
  assert.equal(await exitCode({ ...env, HOMEFRONT_TOKEN: 'short' }), 1, 'a guessable token is refused');
  assert.equal(await exitCode({ ...env, LLM_API: 'telepathy' }), 1);
});
