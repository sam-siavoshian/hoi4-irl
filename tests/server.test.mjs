import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { mockOpenAI } from './mock-openai.mjs';
import { mockAnthropic, mockGemini } from './mock-providers.mjs';
import { mockLocal } from './mock-local.mjs';
import { createAI } from '../server/providers.mjs';
import { parseLoose, repair, check } from '../server/llm.mjs';
import { discover, discoveryTargets, probeAllowed, RUNTIMES } from '../server/local.mjs';

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
    { front: 'irq', label: 'Work', outcome: 'win', severity: 5, action: 'breakthrough', headline: 'Seed round closed' },
    { front: 'glf', label: 'Self', outcome: 'loss', severity: 4, action: 'port_strike', headline: 'Missed the flight' }]);
  assert.equal(j.speech, 'Logged 1 win and 1 loss. Work: Seed round closed; Self: Missed the flight.');
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
  assert.deepEqual(m.items.map(({ days_ago, ...i }) => i), [{ front: 'raj', label: 'Health', outcome: 'loss', severity: 2, action: 'enemy_offensive', headline: 'went to the dentist' }]);
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
  const t = await r.text(); assert.match(t, /Uni/); assert.match(t, /Work/); assert.ok(t.split('\n').length >= 7);
  assert.equal((await bearer('/api/sitrep', { method: 'POST' })).status, 405);
  assert.equal(await (await req('/api/sitrep')).text(), t);
});
test('the homefront command line files reports and reads the situation', async () => {
  const e = { HOMEFRONT_URL: U + '/', HOMEFRONT_TOKEN: TOKEN };
  const help = await cli(['--help']); assert.equal(help.code, 0); assert.match(help.out, /homefront report/); assert.match(help.out, /HOMEFRONT_TOKEN/);
  const sit = await cli(['sitrep'], e); assert.equal(sit.code, 0, sit.err); assert.match(sit.out, /Uni/);
  const rep = await cli(['report', 'I failed my exam'], e); assert.equal(rep.code, 0, rep.err); assert.match(rep.out, /The line bends\./); assert.match(rep.out, /- Uni · loss 3 · Exam failed/);
  const piped = await cli(['report', '--json'], e, 'we closed the round\n'); assert.equal(piped.code, 0, piped.err); assert.equal(JSON.parse(piped.out).items[0].front, 'irq');
  const unclear = await cli(['report', 'went to the dentist'], e); assert.equal(unclear.code, 2); assert.match(unclear.err, /raj\s+Health/);
  const manual = await cli(['report', 'went to the dentist', '--front', 'raj', '--outcome=win'], e); assert.equal(manual.code, 0, manual.err); assert.match(manual.out, /\+ Health · win 2/);
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

// ---------- the general staff: providers and keys set in the app (/api/ai) ----------
// One more server. Its .env has an OpenAI key and model (the fallback); every provider's address points at a stand-in.
// Everything this server ever says, and everything it writes outside ai.json, is kept for the last test: none of it
// may contain a key.
const AI = 8161, UA = `http://127.0.0.1:${AI}`, M_OPENAI = 8162, M_ANTHROPIC = 8163, M_GEMINI = 8164, M_CHAT = 8165;
const K = { env: 'sk-env-key-zz11-ENVFALLBACK', openai: 'sk-app-OPENAI-key-0a1b2c3d4e5f', anthropic: 'sk-ant-api03-ANTHROPIC-test-key-9f8e', wrong: 'sk-ant-api03-WRONG-key-7777', gemini: 'AIzaSyTEST-GEMINI-key-000111222', groq: 'gsk_GROQ_test_key_abcdef012345', mistral: 'MISTRALtestKEY0123456789abcd', openrouter: 'sk-or-v1-OPENROUTER-test-key-4242' };
const dirAI = tmp(); let aiCookie = '', aiLog = ''; const said = []; // every response body and header this server gave
const mocks = {};
const envAI = { ...base, PORT: AI, HOMEFRONT_RATE_LIMIT: '0', /* this session makes well over 60 costly calls a minute; the limit is tested on its own server */ HOMEFRONT_PASSWORD: 'staff pw', HOMEFRONT_TOKEN: TOKEN, HOMEFRONT_DATA_DIR: dirAI, OPENAI_API_KEY: K.env, OPENAI_BASE_URL: `http://127.0.0.1:${M_OPENAI}/v1`, OPENAI_MODEL: 'gpt-env-model',
  ANTHROPIC_BASE_URL: `http://127.0.0.1:${M_ANTHROPIC}/v1`, GEMINI_BASE_URL: `http://127.0.0.1:${M_GEMINI}/v1beta`, GROQ_BASE_URL: `http://127.0.0.1:${M_CHAT}/v1`, MISTRAL_BASE_URL: `http://127.0.0.1:${M_CHAT}/v1`, OPENROUTER_BASE_URL: `http://127.0.0.1:${M_CHAT}/v1` };
const ai = async (p, init = {}, cookie = aiCookie) => {
  const r = await fetch(UA + p, { ...init, headers: { ...(init.body && typeof init.body === 'string' ? { 'content-type': 'application/json' } : {}), ...(init.headers || {}), ...(cookie ? { cookie } : {}) }, redirect: 'manual' });
  const text = await r.text(); said.push(`${init.method || 'GET'} ${p} → ${r.status} ${JSON.stringify([...r.headers])} ${text}`);
  let json = null; try { json = JSON.parse(text); } catch { /* not json */ }
  return { status: r.status, json, text, headers: r.headers };
};
const setAI = body => ai('/api/ai', { method: 'PUT', body: JSON.stringify(body) });
const judgeAI = (user, s = schema) => ai('/api/llm', { method: 'POST', body: JSON.stringify({ name: 'battle_report', system: 'sys', user, schema: s }) });
const testAI = (what = 'judge') => ai('/api/ai/test', { method: 'POST', body: JSON.stringify({ what }) });
const of = (view, id) => view.providers.find(p => p.id === id);
const aiFile = () => path.join(dirAI, 'ai.json');
const reportAI = text => ai('/api/report', { method: 'POST', body: JSON.stringify({ text }), headers: { authorization: `Bearer ${TOKEN}` } }, '');

test('the general staff: /api/ai needs the session, and the automation token does not open it', async () => {
  mocks.openai = await mockOpenAI(M_OPENAI, { key: null }); mocks.anthropic = await mockAnthropic(M_ANTHROPIC, { key: K.anthropic });
  mocks.gemini = await mockGemini(M_GEMINI, { key: K.gemini }); mocks.chat = await mockOpenAI(M_CHAT, { key: null });
  const proc = spawn('node', ['server.mjs'], { env: envAI, stdio: ['ignore', 'pipe', 'pipe'] }); procs.push(proc);
  proc.stdout.on('data', d => aiLog += d); proc.stderr.on('data', d => aiLog += d);
  for (let i = 0; i < 60; i++) { try { await fetch(UA + '/healthz'); break; } catch { await new Promise(r => setTimeout(r, 100)); } }
  for (const [p, method] of [['/api/ai', 'GET'], ['/api/ai', 'PUT'], ['/api/ai/key/openai', 'DELETE'], ['/api/ai/test', 'POST']]) {
    assert.equal((await ai(p, { method, body: method === 'GET' || method === 'DELETE' ? undefined : '{}' }, '')).status, 401, `${method} ${p}`);
    assert.equal((await ai(p, { method, headers: { authorization: `Bearer ${TOKEN}` } }, '')).status, 401, `${method} ${p} with the automation token`);
  }
  const login = await fetch(UA + '/api/login', { method: 'POST', body: JSON.stringify({ password: 'staff pw' }) }); aiCookie = login.headers.get('set-cookie').split(';')[0];
  assert.equal(fs.existsSync(aiFile()), false, 'nothing is written until something is chosen');
});
test.after(() => { for (const m of Object.values(mocks)) m.close(); fs.rmSync(dirAI, { recursive: true, force: true }); });

test('the general staff: with nothing chosen in the app, .env is in force and its key is only "set on the server"', async () => {
  const v = (await ai('/api/ai')).json;
  assert.equal(v.provider, 'openai'); assert.equal(v.source, 'env'); assert.equal(v.status, 'ready'); assert.equal(v.model, 'gpt-env-model');
  assert.deepEqual(v.providers.map(p => p.id), ['openai', 'anthropic', 'gemini', 'groq', 'mistral', 'openrouter', 'local', 'speech', 'offline']);
  const o = of(v, 'openai'); assert.equal(o.hasKey, true); assert.equal(o.keySource, 'server'); assert.equal(o.last4, '', 'not even the tail of a key from .env is shown');
  for (const p of v.providers) { assert.ok(!('key' in p)); if (p.id !== 'openai') assert.equal(p.hasKey, false, p.id); }
  // the small, cheap defaults, and who can turn speech into text
  assert.deepEqual(Object.fromEntries(v.providers.map(p => [p.id, [p.defaultModel, p.defaultStt]])), { openai: ['gpt-6-luna', 'gpt-transcribe'], anthropic: ['claude-haiku-5-5', null], gemini: ['gemini-3.5-flash-lite', 'gemini-3.5-flash-lite'],
    groq: ['openai/gpt-oss-20b', 'whisper-large-v3-turbo'], mistral: ['mistral-small-latest', 'voxtral-mini-latest'], openrouter: ['openai/gpt-6-luna', null], local: ['', null], speech: ['', 'Systran/faster-distil-whisper-small.en'], offline: ['', null] });
  assert.equal((await judgeAI('we closed the round')).status, 200); const sent = mocks.openai.seen.at(-1);
  assert.equal(sent.path, '/v1/responses'); assert.equal(sent.auth, `Bearer ${K.env}`); assert.equal(sent.body.model, 'gpt-env-model');
  // a key from .env cannot be removed from the app
  const d = await ai('/api/ai/key/openai', { method: 'DELETE' }); assert.equal(d.status, 200); assert.equal(of(d.json, 'openai').hasKey, true); assert.equal(of(d.json, 'openai').keySource, 'server');
  assert.equal((await ai('/api/ai/key/nobody', { method: 'DELETE' })).status, 404); assert.equal((await ai('/api/ai', { method: 'POST', body: '{}' })).status, 405);
});

test('the general staff: writes from another site are refused, and bad input is refused without being repeated', async () => {
  const body = JSON.stringify({ provider: 'offline' });
  for (const headers of [{ origin: 'https://evil.example' }, { 'sec-fetch-site': 'cross-site' }, { 'sec-fetch-site': 'same-site' }, { origin: 'null' }]) {
    assert.equal((await ai('/api/ai', { method: 'PUT', body, headers })).status, 403, JSON.stringify(headers));
    assert.equal((await ai('/api/ai/key/openai', { method: 'DELETE', headers })).status, 403); assert.equal((await ai('/api/ai/test', { method: 'POST', body: '{}', headers })).status, 403);
    assert.equal((await ai('/api/ai/discover', { method: 'POST', body: '{}', headers })).status, 403); assert.equal((await ai('/api/ai/models?provider=local', { headers })).status, 403);
  }
  assert.equal((await ai('/api/ai')).json.provider, 'openai', 'nothing changed');
  for (const headers of [{ origin: UA, 'sec-fetch-site': 'same-origin' }, { origin: UA }, { 'sec-fetch-site': 'none' }]) assert.equal((await ai('/api/ai', { method: 'PUT', body: '{}', headers })).status, 200, JSON.stringify(headers));
  const refused = async (b, re) => { const r = await setAI(b); assert.equal(r.status, 400, JSON.stringify(b)); assert.match(r.json.error, re); return r.json.error; };
  await refused({ provider: 'skynet' }, /Unknown provider/);
  for (const u of ['ftp://files.example/v1', 'javascript:alert(1)', 'file:///etc/passwd', 'localhost:11434', 'not a url']) assert.doesNotMatch(await refused({ bases: { ollama: u } }, /must start with http/), /files\.example|alert|passwd/);
  await refused({ bases: { ollama: 'http://user:hunter2@localhost:11434/v1' } }, /user name and password/);
  await refused({ bases: { anthropic: 'http://127.0.0.1:1/v1' } }, /fixed address/);
  assert.doesNotMatch(await refused({ keys: { anthropic: 'sk-ant with a space in it' } }, /look like a key/), /sk-ant/);
  await refused({ keys: { anthropic: 'short' } }, /look like a key/); await refused({ keys: { offline: 'sk-not-needed-here' } }, /takes no key/);
  await refused({ models: { openai: 'gpt 6; drop table' } }, /model name/); await refused({ transcribe: { mode: 'anthropic' } }, /speech into text/);
  // all or nothing: a good choice beside a bad key saves neither
  await refused({ provider: 'anthropic', keys: { anthropic: 'x' } }, /look like a key/); assert.equal((await ai('/api/ai')).json.provider, 'openai');
  assert.equal((await ai('/api/ai', { method: 'PUT', body: '{nope' })).status, 400);
  assert.equal(JSON.parse(fs.readFileSync(aiFile())).provider, null); assert.deepEqual(JSON.parse(fs.readFileSync(aiFile())).keys, {});
});

test('the general staff: a key set in the app wins over .env, is stored 0600, and never comes back', async () => {
  const r = await setAI({ provider: 'openai', keys: { openai: K.openai }, models: { openai: 'gpt-6-luna' } }); assert.equal(r.status, 200);
  const o = of(r.json, 'openai'); assert.equal(r.json.source, 'app'); assert.equal(o.keySource, 'app'); assert.equal(o.last4, K.openai.slice(-4)); assert.equal(o.model, 'gpt-6-luna'); assert.doesNotMatch(r.text, /sk-app|sk-env/);
  assert.equal(fs.statSync(aiFile()).mode & 0o777, 0o600); assert.equal(fs.existsSync(aiFile() + '.tmp'), false, 'written to a temporary file, then moved into place');
  assert.equal(JSON.parse(fs.readFileSync(aiFile())).keys.openai, K.openai, 'the one place a key is kept');
  assert.equal((await judgeAI('we closed the round')).json.model, 'gpt-6-luna'); let sent = mocks.openai.seen.at(-1);
  assert.equal(sent.auth, `Bearer ${K.openai}`, 'the app key, not the one in .env'); assert.equal(sent.body.model, 'gpt-6-luna', 'the app model, not OPENAI_MODEL');
  assert.deepEqual((await ai('/api/config')).json, { server: true, judge: 'gpt-6-luna', transcribe: 'gpt-transcribe', login: true, provider: '127.0.0.1', api: 'responses' });
  assert.deepEqual(await testAI().then(t => [t.status, t.json.ok, t.json.model]), [200, true, 'gpt-6-luna']); assert.match(mocks.openai.seen.at(-1).body.input[0].content, /connection test/);
  // speech goes to the same provider with the same key; its test sends half a second of silence
  const t = await ai('/api/transcribe', { method: 'POST', body: Buffer.alloc(4000, 7), headers: { 'content-type': 'audio/mp4' } }); assert.equal(t.json.text, 'I failed my exam.'); assert.equal(t.json.model, 'gpt-transcribe');
  sent = mocks.openai.seen.at(-1); assert.equal(sent.path, '/v1/audio/transcriptions'); assert.equal(sent.auth, `Bearer ${K.openai}`);
  assert.deepEqual(await testAI('transcribe').then(x => [x.json.ok, x.json.model]), [true, 'gpt-transcribe']); assert.match(mocks.openai.seen.at(-1).raw.toString('latin1'), /RIFF[\s\S]*WAVE/);
  // "Use default" clears the model; removing the key puts the one in .env back in force
  assert.equal(of((await setAI({ models: { openai: null } })).json, 'openai').model, 'gpt-env-model');
  const d = await ai('/api/ai/key/openai', { method: 'DELETE' }); assert.equal(of(d.json, 'openai').keySource, 'server'); assert.equal('openai' in JSON.parse(fs.readFileSync(aiFile())).keys, false);
  await judgeAI('we closed the round'); assert.equal(mocks.openai.seen.at(-1).auth, `Bearer ${K.env}`);
});

test('Anthropic: the Messages API with structured outputs, the current Haiku by default', async () => {
  let v = (await setAI({ provider: 'anthropic' })).json; assert.equal(v.status, 'no_key'); assert.equal(v.model, null);
  assert.deepEqual((await ai('/api/config')).json, { server: true, judge: null, transcribe: null, login: true, provider: null, api: 'responses' }, 'no key yet: the offline judge');
  assert.equal((await judgeAI('we closed the round')).status, 503); assert.deepEqual(await testAI().then(t => [t.json.ok, t.json.reason]), [false, 'off']);
  v = (await setAI({ keys: { anthropic: K.anthropic } })).json; assert.equal(v.status, 'ready'); assert.equal(v.model, 'claude-haiku-5-5'); assert.equal(of(v, 'anthropic').last4, K.anthropic.slice(-4));
  assert.equal(v.transcribe.mode, 'device', 'Anthropic has no speech-to-text'); assert.equal((await ai('/api/config')).json.transcribe, null);
  const r = await judgeAI('we closed the round'); assert.equal(r.status, 200); assert.equal(r.json.result.items[0].front, 'irq'); assert.equal(r.json.model, 'claude-haiku-5-5');
  const sent = mocks.anthropic.seen.at(-1);
  assert.equal(sent.path, '/v1/messages'); assert.equal(sent.key, K.anthropic); assert.equal(sent.version, '2026-10-21'); assert.equal(sent.auth, undefined, 'x-api-key, not a bearer token');
  assert.equal(sent.body.model, 'claude-haiku-5-5'); assert.equal(sent.body.system, 'sys'); assert.deepEqual(sent.body.messages.map(m => m.role), ['user']);
  assert.deepEqual(sent.body.output_config, { effort: 'low', format: { type: 'json_schema', schema } }, 'the schema goes with the request'); assert.ok(sent.body.max_tokens >= 1000);
  assert.deepEqual(await testAI().then(t => [t.json.ok, t.json.model]), [true, 'claude-haiku-5-5']);
  assert.equal((await judgeAI('REFUSE')).status, 422);
  for (const word of ['BADSHAPE', 'MALFORMED']) { const b = await judgeAI(word); assert.equal(b.status, 502, word); assert.match(b.json.error, /expected shape/); }
  assert.equal((await judgeAI('PROVIDER_DOWN')).status, 502);
  assert.equal((await ai('/api/transcribe', { method: 'POST', body: Buffer.alloc(4000, 7) })).status, 503);
  // an older model: no `effort`, then no structured outputs at all. The schema goes in the prompt and the answer is checked here.
  try {
    mocks.anthropic.effort = false; let n = mocks.anthropic.seen.length; assert.equal((await judgeAI('we closed the round')).status, 200); assert.equal(mocks.anthropic.seen.length, n + 2);
    assert.deepEqual(mocks.anthropic.seen.at(-1).body.output_config, { format: { type: 'json_schema', schema } });
    mocks.anthropic.structured = false; n = mocks.anthropic.seen.length; assert.equal((await judgeAI('we closed the round')).json.result.items.length, 2); assert.equal(mocks.anthropic.seen.length, n + 3);
    const last = mocks.anthropic.seen.at(-1).body; assert.equal('output_config' in last, false); assert.match(last.system, /JSON Schema/); assert.ok(last.system.includes(JSON.stringify(schema)));
    assert.equal((await judgeAI('BADSHAPE')).status, 502, 'JSON of the wrong shape is still refused');
  } finally { mocks.anthropic.effort = true; mocks.anthropic.structured = true; }
});

test('a rejected key: a plain result, "Key rejected" in Settings, and the key is never repeated', async () => {
  let v = (await setAI({ keys: { anthropic: K.wrong } })).json; assert.equal(v.status, 'ready', 'not known to be wrong until it is tried');
  const t = await testAI(); assert.equal(t.status, 200); assert.equal(t.json.ok, false); assert.equal(t.json.reason, 'key_rejected'); assert.match(t.json.message, /rejected the key\. Check it/);
  assert.doesNotMatch(t.text, /sk-ant|WRONG|7777/, 'the provider quoted the key back; the server does not');
  v = (await ai('/api/ai')).json; assert.equal(v.status, 'rejected'); assert.equal(of(v, 'anthropic').status, 'rejected');
  const r = await judgeAI('we closed the round'); assert.equal(r.status, 502); assert.equal(r.json.error, 'The provider rejected the key.');
  // the automation API uses the same provider, and falls back to the offline judge as it always did
  const rep = await reportAI('I failed my exam at school.');
  assert.equal(rep.json.ok, true); assert.equal(rep.json.source, 'local'); assert.match(rep.json.warning, /rejected the key/); assert.doesNotMatch(rep.text, /sk-ant|WRONG/);
  v = (await setAI({ keys: { anthropic: K.anthropic } })).json; assert.equal(v.status, 'ready', 'a new key starts clean');
  const n = mocks.anthropic.seen.length; const ok = await reportAI('I failed my exam at school.');
  assert.equal(ok.json.source, 'llm'); assert.equal(ok.json.items[0].front, 'afg'); assert.equal(mocks.anthropic.seen.length, n + 1); assert.equal(mocks.anthropic.seen.at(-1).body.model, 'claude-haiku-5-5');
});

test('Gemini: the Interactions API with a response schema, and speech through the same model', async () => {
  const v = (await setAI({ provider: 'gemini', keys: { gemini: K.gemini } })).json; assert.equal(v.status, 'ready'); assert.equal(v.model, 'gemini-3.5-flash-lite'); assert.deepEqual(v.transcribe, { mode: 'same', provider: 'gemini', model: 'gemini-3.5-flash-lite', status: 'ready' });
  const r = await judgeAI('we closed the round'); assert.equal(r.status, 200); assert.equal(r.json.result.items[1].front, 'glf');
  let sent = mocks.gemini.seen.at(-1);
  assert.equal(sent.path, '/v1beta/interactions'); assert.equal(sent.key, K.gemini); assert.equal(sent.revision, '2026-05-20'); assert.equal(sent.auth, undefined);
  assert.equal(sent.body.model, 'gemini-3.5-flash-lite'); assert.equal(sent.body.system_instruction, 'sys'); assert.equal(sent.body.store, false, 'nothing is kept at Google after the call');
  assert.deepEqual(sent.body.response_format, { type: 'text', mime_type: 'application/json', schema });
  assert.equal((await testAI()).json.ok, true);
  for (const word of ['BADSHAPE', 'MALFORMED', 'REFUSE', 'PROVIDER_DOWN']) assert.equal((await judgeAI(word)).status, 502, word);
  try { mocks.gemini.schema = false; const n = mocks.gemini.seen.length; assert.equal((await judgeAI('we closed the round')).status, 200); assert.equal(mocks.gemini.seen.length, n + 2); assert.match(mocks.gemini.seen.at(-1).body.system_instruction, /JSON Schema/); }
  finally { mocks.gemini.schema = true; }
  const t = await ai('/api/transcribe', { method: 'POST', body: Buffer.alloc(4000, 7), headers: { 'content-type': 'audio/webm' } }); assert.equal(t.status, 200); assert.equal(t.json.text, 'I failed my exam.'); assert.equal(t.json.model, 'gemini-3.5-flash-lite');
  sent = mocks.gemini.seen.at(-1); const audio = sent.body.input.find(p => p.type === 'audio'); assert.equal(audio.mime_type, 'audio/webm'); assert.equal(Buffer.from(audio.data, 'base64').length, 4000); assert.equal(sent.body.store, false);
  assert.equal((await testAI('transcribe')).json.ok, true);
  // a wrong key: Google answers 403 and quotes it
  await setAI({ keys: { gemini: 'AIzaSyWRONG-GEMINI-key-999888' } }); const bad = await testAI(); assert.equal(bad.json.reason, 'key_rejected'); assert.doesNotMatch(bad.text, /AIza/);
  await setAI({ keys: { gemini: K.gemini } });
});

test('Groq, Mistral and OpenRouter: Chat Completions with a strict schema, each with its own small model and key', async () => {
  for (const [id, model, stt, extra] of [['groq', 'openai/gpt-oss-20b', 'whisper-large-v3-turbo', undefined], ['mistral', 'mistral-small-latest', 'voxtral-mini-latest', undefined], ['openrouter', 'openai/gpt-6-luna', null, { require_parameters: true }]]) {
    const v = (await setAI({ provider: id, keys: { [id]: K[id] } })).json; assert.equal(v.status, 'ready', id); assert.equal(v.model, model);
    const r = await judgeAI('we closed the round'); assert.equal(r.status, 200, id); assert.equal(r.json.model, model);
    let sent = mocks.chat.seen.at(-1); assert.equal(sent.path, '/v1/chat/completions'); assert.equal(sent.auth, `Bearer ${K[id]}`); assert.equal(sent.body.model, model);
    assert.deepEqual(sent.body.response_format, { type: 'json_schema', json_schema: { name: 'battle_report', strict: true, schema } }); assert.deepEqual(sent.body.provider, extra, id);
    assert.equal((await judgeAI('BADSHAPE')).status, 502); assert.equal((await judgeAI('MALFORMED')).status, 502); assert.equal((await judgeAI('REFUSE')).status, 422);
    const t = await ai('/api/transcribe', { method: 'POST', body: Buffer.alloc(4000, 7), headers: { 'content-type': 'audio/webm' } });
    if (!stt) { assert.equal(t.status, 503, `${id} cannot turn speech into text`); assert.equal(v.transcribe.mode, 'device'); continue; }
    assert.equal(t.json.model, stt); sent = mocks.chat.seen.at(-1); assert.equal(sent.path, '/v1/audio/transcriptions'); assert.equal(sent.auth, `Bearer ${K[id]}`); assert.match(sent.raw.toString('latin1'), new RegExp(`name="model"\\s+${stt}`));
  }
  // a provider without structured outputs: one retry in JSON mode, the schema in the prompt
  try { mocks.chat.chat = 'object'; const n = mocks.chat.seen.length; assert.equal((await judgeAI('we closed the round')).status, 200); assert.equal(mocks.chat.seen.length, n + 2); assert.equal(mocks.chat.seen.at(-1).body.response_format.type, 'json_object'); }
  finally { mocks.chat.chat = 'schema'; }
});

test('speech is chosen apart from the staff: another provider with its own key, or this device', async () => {
  // the staff is OpenRouter (no speech-to-text); Groq writes down what is said
  let v = (await setAI({ transcribe: { mode: 'groq' } })).json; assert.deepEqual(v.transcribe, { mode: 'groq', provider: 'groq', model: 'whisper-large-v3-turbo', status: 'ready' }); assert.equal(v.provider, 'openrouter');
  const t = await ai('/api/transcribe', { method: 'POST', body: Buffer.alloc(4000, 7), headers: { 'content-type': 'audio/webm' } }); assert.equal(t.json.model, 'whisper-large-v3-turbo'); assert.equal(mocks.chat.seen.at(-1).auth, `Bearer ${K.groq}`, 'its own key');
  await judgeAI('we closed the round'); assert.equal(mocks.chat.seen.at(-1).auth, `Bearer ${K.openrouter}`);
  v = (await ai('/api/ai/key/groq', { method: 'DELETE' })).json; assert.equal(v.transcribe.status, 'no_key'); assert.equal(v.transcribe.provider, null); assert.equal((await ai('/api/config')).json.transcribe, null);
  v = (await setAI({ keys: { groq: K.groq }, transcribe: { mode: 'device' } })).json; assert.deepEqual(v.transcribe, { mode: 'device', provider: null, model: null, status: 'device' });
  assert.equal((await ai('/api/transcribe', { method: 'POST', body: Buffer.alloc(4000, 7) })).status, 503);
  v = (await setAI({ provider: 'groq', transcribe: { mode: 'same' } })).json; assert.equal(v.transcribe.model, 'whisper-large-v3-turbo');
});

test('a local model needs no key; Ollama, LM Studio and "Other server" are read as the Local model; "offline" turns the model off', async () => {
  let v = (await setAI({ provider: 'ollama' })).json; assert.equal(v.provider, 'local'); assert.equal(v.status, 'ready'); assert.equal(v.model, 'llama3.2');
  const l = of(v, 'local'); assert.equal(l.base, 'http://127.0.0.1:11434/v1'); assert.equal(l.runtime, 'ollama'); assert.equal(l.needsKey, false); assert.equal(l.keyOptional, true);
  v = (await setAI({ bases: { local: `http://127.0.0.1:${M_CHAT}/v1/` }, models: { local: 'qwen3:8b' } })).json; assert.equal(of(v, 'local').base, `http://127.0.0.1:${M_CHAT}/v1`);
  assert.equal((await judgeAI('we closed the round')).json.model, 'qwen3:8b'); const sent = mocks.chat.seen.at(-1);
  assert.equal(sent.auth, undefined, 'no Authorization header'); assert.equal(sent.body.model, 'qwen3:8b'); assert.equal(sent.body.temperature, 0); assert.equal(sent.body.response_format.type, 'json_schema');
  // a server that is not running: said plainly, in Settings too
  v = (await setAI({ bases: { local: 'http://127.0.0.1:9/v1' } })).json; assert.equal(v.status, 'ready');
  const down = await testAI(); assert.equal(down.json.ok, false, JSON.stringify(down)); assert.equal(down.json.reason, 'unreachable');
  assert.equal(down.json.message, 'Nothing answered at 127.0.0.1:9. Check that Ollama is running. If Home Front runs in Docker, use http://host.docker.internal:9/v1 instead.');
  assert.equal((await ai('/api/ai')).json.status, 'server_down', '"Model server not running", not "No key"');
  v = (await setAI({ models: { local: null } })).json; assert.equal(v.status, 'no_model'); assert.equal(v.model, null);
  // "Other server" with a key it needs
  v = (await setAI({ provider: 'custom', bases: { custom: `http://127.0.0.1:${M_CHAT}/v1` }, models: { custom: 'any-model' }, keys: { custom: 'optional-key-123456' } })).json;
  assert.equal(v.provider, 'local'); assert.equal(v.status, 'ready'); assert.equal(of(v, 'local').runtime, 'other'); assert.equal(of(v, 'local').hasKey, true);
  await judgeAI('we closed the round'); assert.equal(mocks.chat.seen.at(-1).auth, 'Bearer optional-key-123456');
  const saved = JSON.parse(fs.readFileSync(aiFile())); assert.equal(saved.provider, 'local'); assert.equal(saved.keys.local, 'optional-key-123456'); assert.equal(saved.keys.custom, undefined);
  v = (await setAI({ provider: 'offline' })).json; assert.equal(v.status, 'offline'); assert.equal(v.model, null);
  assert.deepEqual((await ai('/api/config')).json, { server: true, judge: null, transcribe: null, login: true, provider: null, api: 'responses' });
  const n = Object.values(mocks).reduce((a, m) => a + m.seen.length, 0);
  assert.equal((await judgeAI('we closed the round')).status, 503);
  const rep = await reportAI('I failed my exam at school.'); assert.equal(rep.json.source, 'local'); assert.equal(rep.json.warning, undefined);
  assert.equal(Object.values(mocks).reduce((a, m) => a + m.seen.length, 0), n, 'nothing leaves the machine');
  // provider null: back to what .env says
  v = (await setAI({ provider: null })).json; assert.equal(v.source, 'env'); assert.equal(v.provider, 'openai'); assert.equal(v.model, 'gpt-env-model');
});

test('no key ever leaves the server: not in a response, the journal, a backup, the export, the log or an error', async () => {
  // a full session has run above. Add what the app itself does: save a campaign, read it back, read the journal.
  const s0 = (await ai('/api/state')).json; const put = await ai('/api/state', { method: 'PUT', body: JSON.stringify({ rev: s0.rev, data: { ...(s0.data || {}), reports: [...(s0.data?.reports || []), { id: 'leak1', ts: Date.now(), text: 'x', summary: '', source: 'manual', items: [] }] } }) }); assert.equal(put.status, 200);
  await setAI({ provider: 'anthropic' }); await judgeAI('we closed the round'); await testAI();
  for (const p of ['/api/state', '/api/journal', '/api/config', '/api/ai', '/api/sitrep', '/', '/sw.js', '/private/ai.json']) await ai(p);
  assert.equal((await ai('/ai.json')).status, 404); assert.equal((await ai('/api/ai.json')).status, 404);
  const keys = [...Object.values(K), 'optional-key-123456', 'AIzaSyWRONG-GEMINI-key-999888'];
  const leak = (where, text) => { for (const k of keys) assert.equal(text.includes(k), false, `${where} contains a key (${k.slice(0, 6)}…)`); };
  assert.ok(said.length > 120, `every response of the session was kept (${said.length})`); said.forEach((line, i) => leak(`response ${i}: ${line.slice(0, 60)}`, line));
  leak('the server log', aiLog); assert.match(aiLog, /Home Front on/);
  // on disk: ai.json is the only file with a key in it, and it is the owner's alone
  const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
  const files = walk(dirAI); assert.ok(files.some(f => f.endsWith('journal.ndjson')) && files.some(f => f.endsWith('state.json')));
  for (const f of files) { if (f === aiFile()) continue; leak(path.relative(dirAI, f), fs.readFileSync(f, 'latin1')); }
  assert.equal(fs.statSync(aiFile()).mode & 0o777, 0o600); assert.ok(fs.readFileSync(aiFile(), 'utf8').includes(K.anthropic));
  // the app's export is the campaign the server hands it: no provider settings in it
  assert.doesNotMatch((await ai('/api/state')).text, /"keys"|ai\.json|anthropic/);
  // the built interface, which the service worker caches, has no key in it either
  for (const f of walk(new URL('../dist', import.meta.url).pathname)) if (/\.(js|html|css)$/.test(f)) leak(f, fs.readFileSync(f, 'latin1'));
  assert.equal(JSON.parse(fs.readFileSync(aiFile())).provider, 'anthropic');
});

test('SKILL.md at the root is the same file agents get from .claude/skills', () => {
  const a = fs.readFileSync(new URL('../SKILL.md', import.meta.url), 'utf8'), b = fs.readFileSync(new URL('../.claude/skills/setup-home-front/SKILL.md', import.meta.url), 'utf8');
  assert.equal(a, b); assert.match(a, /^---\nname: setup-home-front\n/);
});

// ---- local models: any server that speaks the OpenAI-compatible API, on this machine or the owner's network ----
test('reading a small model\'s answer: thinking dropped, the first balanced object taken, what can be mended mended', () => {
  assert.deepEqual(parseLoose('<think>\nmaybe {"draft": true}\n</think>\nHere:\n```json\n{"ok": true, "s": "a } b"}\n```\nBye {"no": 1}'), { ok: true, s: 'a } b' });
  assert.deepEqual(parseLoose('it was hard</think> Result: {"a": {"b": "{"}} and } more'), { a: { b: '{' } }, 'a lone closing tag: the thinking before it is dropped');
  assert.deepEqual(parseLoose('Sure! {"x": [1, 2]} hope that helps'), { x: [1, 2] });
  assert.equal(parseLoose('<think>I will answer {"a": 1} later'), undefined, 'a model that never stopped thinking gave no answer');
  assert.equal(parseLoose('no json here'), undefined);
  const s = { type: 'object', properties: { summary: { type: 'string' }, items: { type: 'array', items: { type: 'object', properties: { front: { type: 'string', enum: ['afg', 'irq'] }, outcome: { type: 'string', enum: ['win', 'loss'] }, severity: { type: 'integer', minimum: 1, maximum: 5 } }, required: ['front', 'severity'], additionalProperties: false } } }, required: ['summary', 'items'], additionalProperties: false };
  const fixed = repair(s, { summary: 'x', mood: 'grim', items: { front: 'nowhere', outcome: 'Win', severity: '9.4', confidence: 1 } });
  assert.deepEqual(fixed, { summary: 'x', items: [{ front: 'nowhere', outcome: 'win', severity: 5 }] }, 'clamped, cased, unknown keys dropped; an unknown front is left for the app to drop');
  assert.equal(check(s, fixed), null);
  assert.equal(check(s, { items: [] }), '"summary" is missing from the answer.');
  assert.equal(check(s, { summary: 'x', items: [{ front: 'afg', severity: 'high' }] }), '"severity" of item 1 of "items" must be an integer, but it is a string.');
});

test('discovery only ever speaks to this machine: loopback and host.docker.internal, the runtimes\' own ports', async () => {
  const targets = discoveryTargets();
  assert.deepEqual([...new Set(targets.map(t => new URL(t).hostname))], ['127.0.0.1', 'host.docker.internal']);
  assert.deepEqual([...new Set(targets.map(t => Number(new URL(t).port)))].sort((a, b) => a - b), [1234, 1337, 5000, 5001, 8000, 8080, 9931, 11434]);
  assert.ok(!discoveryTargets({ skipPort: 8080 }).includes('http://127.0.0.1:8080/v1'), 'never this server itself');
  for (const u of ['http://192.168.1.5:11434/v1', 'http://10.0.0.2:1234/v1', 'http://example.com/v1', 'http://100.64.0.1:11434/v1', 'http://u:p@127.0.0.1:11434/v1', 'file:///etc/passwd', 'http://127.0.0.1.example.com/v1']) assert.equal(probeAllowed(u), false, u);
  for (const u of ['http://127.0.0.1:11434/v1', 'http://localhost:1234/v1', 'http://[::1]:8080/v1', 'http://host.docker.internal:11434/v1']) assert.equal(probeAllowed(u), true, u);
  const asked = []; const fetchImpl = async url => { asked.push(url); throw new Error('nothing there'); };
  const r = await discover({ fetchImpl, targets: [...targets, 'http://192.168.1.5:11434/v1', 'http://example.com/v1'] });
  assert.deepEqual(r.found, []); assert.equal(r.tried, targets.length);
  assert.ok(asked.length === targets.length && asked.every(u => probeAllowed(u)), `only loopback was contacted: ${asked.filter(u => !probeAllowed(u))}`);
  // every preset names where its documentation was read
  for (const rt of RUNTIMES.filter(x => x.id !== 'other')) assert.match(rt.base, /^http:\/\/127\.0\.0\.1:\d+\/v1$/, rt.id);
});

const LP = 8170, UP = `http://127.0.0.1:${LP}`, dirLM = tmp();
const lm = {}; let lmCookie = '';
const big = { type: 'object', properties: { summary: { type: 'string' }, items: { type: 'array', items: { type: 'object', properties: { front: { type: 'string' }, outcome: { type: 'string', enum: ['win', 'loss', 'neutral'] }, severity: { type: 'integer', minimum: 1, maximum: 5 }, action: { type: 'string' }, headline: { type: 'string' } }, required: ['front', 'outcome', 'severity'], additionalProperties: false } } }, required: ['summary', 'items'], additionalProperties: false };
const la = async (p, init = {}) => {
  const r = await fetch(UP + p, { ...init, headers: { ...(init.body && typeof init.body === 'string' ? { 'content-type': 'application/json' } : {}), ...(init.headers || {}), cookie: lmCookie } });
  const text = await r.text(); let json = null; try { json = JSON.parse(text); } catch { /* not json */ } return { status: r.status, json };
};
const lset = body => la('/api/ai', { method: 'PUT', body: JSON.stringify(body) });
const ljudge = (user, s = big) => la('/api/llm', { method: 'POST', body: JSON.stringify({ name: 'battle_report', system: 'sys', user, schema: s }) });
const ltest = (what = 'judge') => la('/api/ai/test', { method: 'POST', body: JSON.stringify({ what }) });
const point = (m, extra = {}) => lset({ provider: 'local', bases: { local: `http://127.0.0.1:${m.port}/v1` }, local: { runtime: null, ...extra }, models: { local: 'qwen3:4b' } });
const chats = m => m.seen.filter(x => x.method === 'POST' && /chat/.test(x.path));

test('local models: discover what is running, list its models, say when one is missing', async () => {
  lm.schema = await mockLocal(8171, { kind: 'schema' }); lm.object = await mockLocal(8172, { kind: 'object' }); lm.prose = await mockLocal(8173, { kind: 'prose' });
  lm.ollama = await mockLocal(8174, { kind: 'ollama' }); lm.speech = await mockLocal(8175, { kind: 'speech', models: ['Systran/faster-distil-whisper-small.en'] });
  // the probe list is injectable (HOMEFRONT_DISCOVER); what is not loopback is still never contacted
  await start({ ...base, PORT: LP, HOMEFRONT_PASSWORD: 'local pw', HOMEFRONT_DATA_DIR: dirLM, OPENAI_API_KEY: '', OPENAI_BASE_URL: '', HOMEFRONT_RATE_LIMIT: '0',
    HOMEFRONT_DISCOVER: 'http://127.0.0.1:8174/v1,http://127.0.0.1:8171/v1,http://127.0.0.1:9/v1,http://192.168.1.77:11434/v1,http://example.com/v1' }, UP);
  const login = await fetch(UP + '/api/login', { method: 'POST', body: JSON.stringify({ password: 'local pw' }) }); lmCookie = login.headers.get('set-cookie').split(';')[0];
  assert.equal((await fetch(UP + '/api/ai/discover', { method: 'POST' })).status, 401, 'signed in only');
  const d = await la('/api/ai/discover', { method: 'POST', body: '{}' }); assert.equal(d.status, 200); assert.equal(d.json.tried, 3, 'the two addresses off this machine were dropped');
  assert.deepEqual(d.json.found.map(f => [f.runtime, f.name, f.base, f.models.length]), [['ollama', 'Ollama', 'http://127.0.0.1:8174/v1', 2], ['llamacpp', 'llama.cpp', 'http://127.0.0.1:8171/v1', 2]]);
  assert.deepEqual(d.json.found[0].models[0], { id: 'qwen3:4b', size: 2019393189, params: '3.2B', quant: 'Q4_K_M' }, 'Ollama\'s /api/tags when /v1/models is absent');
  assert.deepEqual(d.json.found[1].models[0], { id: 'qwen3:4b', size: 2497280000, params: '4.0B', quant: null }, 'llama.cpp\'s meta');
  // pick the Ollama server and a model from its list
  let v = (await lset({ provider: 'local', bases: { local: d.json.found[0].base }, local: { runtime: 'ollama' }, models: { local: 'llama3.2' } })).json; assert.equal(v.status, 'ready');
  let m = (await la('/api/ai/models?provider=local')).json; assert.equal(m.ok, true); assert.equal(m.installed, true, '"llama3.2" is "llama3.2:latest"'); assert.equal(m.models.length, 2);
  // a model that is not installed: the list says so, and the test gives the exact command
  v = (await lset({ models: { local: 'mistral-small3.2:24b' } })).json;
  m = (await la('/api/ai/models?provider=local')).json; assert.equal(m.installed, false); assert.equal(m.get, 'ollama pull mistral-small3.2:24b');
  let t = (await ltest()).json; assert.equal(t.ok, false); assert.equal(t.reason, 'model_missing');
  assert.equal(t.message, 'The server answered, but it has no model called mistral-small3.2:24b. Run ollama pull mistral-small3.2:24b, or pick one from the list.');
  // any name the server takes can be typed, a file path included
  v = (await lset({ models: { local: '/models/My Model-Q4_K_M.gguf' } })).json; assert.equal(v.model, '/models/My Model-Q4_K_M.gguf');
  assert.equal((await lset({ models: { local: 'bad"name<' } })).status, 400);
  // nothing running at the address
  v = (await lset({ bases: { local: 'http://127.0.0.1:9/v1' }, local: { runtime: 'lmstudio' } })).json;
  m = (await la('/api/ai/models?provider=local')).json; assert.equal(m.ok, false); assert.equal(m.reason, 'unreachable');
  assert.equal((await la('/api/ai')).json.status, 'server_down');
  t = (await ltest()).json; assert.equal(t.message, 'Nothing answered at 127.0.0.1:9. Check that LM Studio is running. If Home Front runs in Docker, use http://host.docker.internal:9/v1 instead.');
  v = (await lset({ bases: { local: 'http://192.0.2.10:11434/v1' } })).json; assert.equal(v.status, 'ready', 'a new address is tried afresh');
});

test('local models: json_schema, then JSON mode, then plain text; what worked is remembered per address and model', async () => {
  // a server that does json_schema: one call, strict
  await point(lm.schema); let n = chats(lm.schema).length;
  let r = await ljudge('we closed the round'); assert.equal(r.status, 200); assert.equal(r.json.result.items[0].front, 'irq');
  let sent = chats(lm.schema).slice(n); assert.equal(sent.length, 1); assert.deepEqual(sent[0].body.response_format, { type: 'json_schema', json_schema: { name: 'battle_report', strict: true, schema: big } });
  assert.equal(sent[0].body.temperature, 0); assert.equal(sent[0].body.stream, false);
  // one that refuses json_schema (400) but does JSON mode: the schema goes into the prompt
  await point(lm.object); n = chats(lm.object).length;
  r = await ljudge('we closed the round'); assert.equal(r.status, 200);
  sent = chats(lm.object).slice(n); assert.deepEqual(sent.map(x => x.body.response_format?.type), ['json_schema', 'json_object']);
  assert.ok(sent[1].body.messages[0].content.startsWith('sys\n') && sent[1].body.messages[0].content.includes(JSON.stringify(big)));
  n = chats(lm.object).length; await ljudge('we closed the round');
  assert.deepEqual(chats(lm.object).slice(n).map(x => x.body.response_format?.type), ['json_object'], 'remembered: no json_schema attempt the second time');
  assert.equal(JSON.parse(fs.readFileSync(path.join(dirLM, 'ai.json'))).local.learned[`http://127.0.0.1:${lm.object.port}/v1|qwen3:4b`], 'json_object', 'kept across restarts');
  assert.equal((await la('/api/ai')).json.providers.find(p => p.id === 'local').learned, 'json_object');
  // one that refuses any response_format and answers in prose, with a <think> block and a fenced JSON block
  await point(lm.prose); n = chats(lm.prose).length;
  r = await ljudge('we closed the round'); assert.equal(r.status, 200); assert.equal(r.json.result.items[1].front, 'glf');
  sent = chats(lm.prose).slice(n); assert.deepEqual(sent.map(x => x.body.response_format?.type ?? 'text'), ['json_schema', 'json_object', 'text']);
  let t = (await ltest()).json; assert.equal(t.ok, true); assert.equal(t.mode, 'text');
  // the owner can fix the way
  await lset({ local: { mode: 'json_object' } }); n = chats(lm.prose).length; assert.equal((await ljudge('we closed the round')).status, 502);
  assert.deepEqual(chats(lm.prose).slice(n).map(x => x.body.response_format?.type), ['json_object'], 'a fixed mode is the only one tried');
  await lset({ local: { mode: 'auto' } });
});

test('local models: an answer is mended where that is safe, and asked for again once with what was wrong', async () => {
  await point(lm.schema);
  // mended: a severity as a string and one out of range, an outcome in capitals, keys nobody asked for
  let r = await ljudge('SLOPPY we closed the round'); assert.equal(r.status, 200);
  assert.deepEqual(r.json.result.items.map(i => [i.outcome, i.severity, 'confidence' in i]), [['win', 5, false], ['loss', 5, false]]); assert.ok(!('mood' in r.json.result));
  // a missing field: one more try, with the error said back to the model
  let n = chats(lm.schema).length; r = await ljudge('FIXME we closed the round'); assert.equal(r.status, 200); assert.equal(typeof r.json.result.summary, 'string');
  const sent = chats(lm.schema).slice(n); assert.equal(sent.length, 2); assert.equal(sent[1].body.messages.length, 4);
  assert.equal(sent[1].body.messages[2].role, 'assistant'); assert.match(sent[1].body.messages[3].content, /"summary" is missing from the answer\./);
  // never JSON: one retry, then the 502 that sends the app to its offline judge
  n = chats(lm.schema).length; r = await ljudge('HOPELESS'); assert.equal(r.status, 502); assert.equal(chats(lm.schema).length - n, 2);
  const rep = (await la('/api/report', { method: 'POST', body: JSON.stringify({ text: 'HOPELESS. I failed my exam at school.' }) })).json; assert.equal(rep.ok, true); assert.equal(rep.source, 'local');
});

test('local models: the test says what works and what to do', async () => {
  await point(lm.schema);
  let t = (await ltest()).json; assert.equal(t.ok, true); assert.equal(t.model, 'qwen3:4b'); assert.equal(t.mode, 'json_schema'); assert.equal(t.tps, 31.3, 'llama.cpp reports tokens a second'); assert.equal(typeof t.ms, 'number');
  lm.schema.garbage = true;
  try { t = (await ltest()).json; assert.equal(t.ok, false); assert.equal(t.reason, 'bad_answer'); assert.equal(t.message, 'qwen3:4b answered, but not with JSON that could be used. Try a larger model, or another mode under Advanced.'); }
  finally { lm.schema.garbage = false; }
  // a server with a key
  const keyed = await mockLocal(8176, { kind: 'schema', key: 'local-server-key-1234' });
  try {
    await point(keyed); t = (await ltest()).json; assert.equal(t.ok, false); assert.equal(t.reason, 'key_rejected'); assert.match(t.message, /Add its key under Advanced/);
    await lset({ keys: { local: 'local-server-key-1234' } }); t = (await ltest()).json; assert.equal(t.ok, true); assert.equal(keyed.seen.at(-1).auth, 'Bearer local-server-key-1234');
    assert.doesNotMatch(JSON.stringify((await la('/api/ai')).json), /local-server-key/);
    await la('/api/ai/key/local', { method: 'DELETE' });
  } finally { keyed.close(); }
  // Ollama's own API carries the context length and keep_alive, which its OpenAI-compatible one cannot
  await point(lm.ollama, { runtime: 'ollama', keepAlive: '10m', context: 8192, maxTokens: 600 });
  t = (await ltest()).json; assert.equal(t.ok, true); assert.equal(t.tps, 20, 'eval_count over eval_duration');
  const sent = lm.ollama.seen.at(-1); assert.equal(sent.path, '/api/chat'); assert.equal(sent.body.keep_alive, '10m'); assert.deepEqual(sent.body.options, { temperature: 0, num_ctx: 8192, num_predict: 600 }); assert.equal(sent.body.stream, false);
  assert.equal(typeof sent.body.format, 'object', 'the schema itself as the format');
  for (const bad of [{ keepAlive: 'forever' }, { timeout: 1 }, { context: 'big' }, { temperature: 3 }, { mode: 'yaml' }, { runtime: 'skynet' }]) assert.equal((await lset({ local: bad })).status, 400, JSON.stringify(bad));
  await lset({ local: { keepAlive: '', context: null, maxTokens: null, timeout: 300 } });
  const o = (await la('/api/ai')).json.providers.find(p => p.id === 'local').options; assert.equal(o.timeout, 300); assert.equal(o.keepAlive, ''); assert.equal(o.context, null);
});

test('local speech-to-text: any /v1/audio/transcriptions server, its own address and model; cloud speech models are editable too', async () => {
  let v = (await lset({ transcribe: { mode: 'speech' }, bases: { speech: `http://127.0.0.1:${lm.speech.port}/v1` }, speech: { runtime: 'speaches' } })).json;
  assert.deepEqual(v.transcribe, { mode: 'speech', provider: 'speech', model: 'Systran/faster-distil-whisper-small.en', status: 'ready' });
  const tr = await la('/api/transcribe', { method: 'POST', body: Buffer.alloc(4000, 7), headers: { 'content-type': 'audio/webm' } }); assert.equal(tr.json.text, 'I failed my exam.');
  assert.match(lm.speech.seen.at(-1).raw.toString('latin1'), /name="model"\r\n\r\nSystran\/faster-distil-whisper-small\.en/);
  assert.equal((await ltest('transcribe')).json.ok, true);
  const list = (await la('/api/ai/models?provider=speech')).json; assert.equal(list.ok, true); assert.equal(list.installed, true);
  v = (await lset({ transcribe: { models: { speech: 'Systran/faster-whisper-large-v3' } } })).json; assert.equal(v.transcribe.model, 'Systran/faster-whisper-large-v3');
  let t = (await ltest('transcribe')).json; assert.equal(t.ok, false); assert.match(t.message, /uvx speaches-cli model download Systran\/faster-whisper-large-v3/);
  // whisper.cpp's server takes WAV only: the app is told to convert
  assert.equal((await la('/api/config')).json.wav, undefined);
  v = (await lset({ speech: { runtime: 'whispercpp' }, transcribe: { models: { speech: null } } })).json; assert.equal(v.transcribe.wav, true); assert.equal((await la('/api/config')).json.wav, true);
  v = (await lset({ bases: { speech: 'http://127.0.0.1:9/v1' } })).json; t = (await ltest('transcribe')).json; assert.equal(t.reason, 'unreachable'); assert.match(t.message, /Check that whisper\.cpp is running/);
  // a cloud provider's speech model can be changed, and put back
  v = (await lset({ transcribe: { mode: 'groq', models: { groq: 'whisper-large-v3' } } })).json; assert.equal(v.providers.find(p => p.id === 'groq').sttModel, 'whisper-large-v3');
  v = (await lset({ transcribe: { models: { groq: null } } })).json; assert.equal(v.providers.find(p => p.id === 'groq').sttModel, 'whisper-large-v3-turbo');
  assert.equal((await lset({ provider: 'speech' })).status, 400, 'a speech server judges nothing');
});
test('.env alone can name a local model and a local speech server (LOCAL_BASE_URL, LOCAL_MODEL, LOCAL_STT_BASE_URL)', async () => {
  const mem = {}; const store = { readJSON: (n, d) => mem[n] ?? d, writeJSON: (n, v) => { mem[n] = v; } };
  const a = createAI({ env: { LOCAL_BASE_URL: `http://127.0.0.1:${lm.schema.port}/v1`, LOCAL_MODEL: 'qwen3:4b', LOCAL_STT_BASE_URL: `http://127.0.0.1:${lm.speech.port}/v1`, LOCAL_TIMEOUT_MS: '30000' }, store });
  const v = a.view(); assert.equal(v.provider, 'local'); assert.equal(v.source, 'env'); assert.equal(v.status, 'ready'); assert.equal(v.model, 'qwen3:4b');
  assert.deepEqual(v.transcribe, { mode: 'speech', provider: 'speech', model: 'Systran/faster-distil-whisper-small.en', status: 'ready' });
  assert.equal((await a.judge({ name: 'x', system: 'sys', user: 'we closed the round', schema: big })).items[0].front, 'irq');
  assert.equal(await a.transcribe(Buffer.alloc(4000, 7), 'audio/webm'), 'I failed my exam.');
  assert.deepEqual(mem, {}, 'nothing is written while nothing is chosen in the app');
  assert.equal(createAI({ env: { LOCAL_BASE_URL: 'http://127.0.0.1:1/v1' }, store }).view().provider, 'offline', 'an address with no model turns nothing on');
});
test.after(() => { for (const m of Object.values(lm)) m.close(); fs.rmSync(dirLM, { recursive: true, force: true }); });
