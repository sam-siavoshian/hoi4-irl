import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { mockOpenAI } from './mock-openai.mjs';

const PORT = 8141, MOCK = 8142, U = `http://127.0.0.1:${PORT}`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'artesh-'));
let mock, proc, cookie = '';
const env = { ...process.env, PORT, HOST: '127.0.0.1', ARTESH_PASSWORD: 'open sesame', OPENAI_API_KEY: 'sk-test-key', OPENAI_BASE_URL: `http://127.0.0.1:${MOCK}/v1`, ARTESH_DATA_DIR: dir };
const req = (p, init = {}) => fetch(U + p, { ...init, headers: { ...(init.headers || {}), ...(cookie ? { cookie } : {}) }, redirect: 'manual' });

test.before(async () => { mock = await mockOpenAI(MOCK); proc = spawn('node', ['server.mjs'], { env, stdio: 'ignore' }); for (let i = 0; i < 40; i++) { try { await fetch(U + '/robots.txt'); break; } catch { await new Promise(r => setTimeout(r, 100)); } } });
test.after(() => { proc.kill(); mock.close(); fs.rmSync(dir, { recursive: true, force: true }); });

test('nothing is served without the password', async () => {
  for (const p of ['/', '/js/app.js', '/data/map.json', '/css/style.css', '/sw.js']) { const r = await req(p); assert.equal(r.status, 401, p); }
  const home = await (await req('/')).text(); assert.match(home, /type="password"/); assert.doesNotMatch(home, /mapwrap/);
  for (const p of ['/api/state', '/api/config', '/api/llm', '/api/transcribe']) assert.equal((await req(p, { method: p === '/api/llm' ? 'POST' : 'GET' })).status, 401, p);
  assert.match(await (await req('/robots.txt')).text(), /Disallow: \//);
  assert.match((await req('/')).headers.get('x-robots-tag'), /noindex/);
  assert.equal((await req('/icons/apple-touch-icon.png')).status, 200, 'home-screen icon stays reachable');
});
test('secrets and private files are never served, even when signed in', async () => {
  assert.equal((await req('/api/login', { method: 'POST', body: JSON.stringify({ password: 'wrong' }) })).status, 401);
  const ok = await req('/api/login', { method: 'POST', body: JSON.stringify({ password: 'open sesame' }) }); assert.equal(ok.status, 200);
  const sc = ok.headers.get('set-cookie'); assert.match(sc, /HttpOnly/); assert.match(sc, /SameSite=Lax/); cookie = sc.split(';')[0];
  assert.equal((await req('/')).status, 200); assert.match(await (await req('/')).text(), /mapwrap/);
  for (const p of ['/.env', '/.env.example', '/server.mjs', '/private/state.json', '/private/sessions.json', '/package.json', '/js/../.env', '/tests/e2e.mjs', '/.git/config']) assert.equal((await req(p)).status, 404, p);
  const cfg = await (await req('/api/config')).json(); assert.deepEqual(cfg, { server: true, judge: 'gpt-6-luna', transcribe: 'gpt-transcribe', login: true }); assert.doesNotMatch(JSON.stringify(cfg), /sk-/);
});
test('judging is proxied to the OpenAI Responses API with a strict schema', async () => {
  const schema = { type: 'object', properties: { summary: { type: 'string' } }, required: ['summary'], additionalProperties: false };
  const r = await req('/api/llm', { method: 'POST', body: JSON.stringify({ name: 'battle_report', system: 'sys', user: 'we closed the round', schema }) }); assert.equal(r.status, 200);
  const j = await r.json(); assert.equal(j.result.items[0].front, 'irq');
  const sent = mock.seen.at(-1); assert.equal(sent.path, '/v1/responses'); assert.equal(sent.auth, 'Bearer sk-test-key'); assert.equal(sent.body.model, 'gpt-6-luna'); assert.equal(sent.body.store, false);
  assert.deepEqual(sent.body.text.format, { type: 'json_schema', name: 'battle_report', strict: true, schema }); assert.deepEqual(sent.body.input.map(m => m.role), ['system', 'user']);
  assert.equal((await req('/api/llm', { method: 'POST', body: JSON.stringify({ name: 'x', system: 's', user: 'REFUSE', schema }) })).status, 422);
  assert.equal((await req('/api/llm', { method: 'POST', body: '{"nope":1}' })).status, 400);
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
  const put = (rev, data) => req('/api/state', { method: 'PUT', body: JSON.stringify({ rev, data }) });
  assert.deepEqual(await (await put(0, { reports: [{ id: 'a', ts: 1, items: [] }] })).json(), { rev: 1 });
  const stale = await put(0, { reports: [] }); assert.equal(stale.status, 409); assert.equal((await stale.json()).data.reports[0].id, 'a');
  assert.equal((await put(1, { nope: true })).status, 400);
  assert.equal(JSON.parse(fs.readFileSync(path.join(dir, 'state.json'))).rev, 1);
  assert.equal(fs.statSync(path.join(dir, 'state.json')).mode & 0o077, 0, 'state file is private to the user');
});
test('logging out ends the session; the server will not start without a password', async () => {
  assert.equal((await req('/api/logout', { method: 'POST' })).status, 200); assert.equal((await req('/api/state')).status, 401);
  const code = await new Promise(r => spawn('node', ['server.mjs'], { env: { ...env, ARTESH_PASSWORD: '', PORT: 8143 }, stdio: 'ignore' }).on('exit', r)); assert.equal(code, 1);
});
