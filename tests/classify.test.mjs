import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { simulate } from '../js/engine.js';
import { classifyLocal, classifyLLM, classify, buildSystem } from '../js/classify.js';

const map = JSON.parse(fs.readFileSync(new URL('../data/map.json', import.meta.url)));
const labels = Object.fromEntries(map.fronts.map(f => [f.id, f.defaultLabel]));
const st = simulate(map, [], Date.now());

test('offline classifier: horrible week', () => {
  const r = classifyLocal({ map, labels, text: "School is bad, I'm failing this class. I had a fight with my mother. I had a fight with my girlfriend." });
  const by = Object.fromEntries(r.items.map(i => [i.front, i]));
  assert.equal(by.afg?.outcome, 'loss'); assert.equal(by.cau?.outcome, 'loss'); assert.equal(by.tks?.outcome, 'loss');
  assert.equal(by.afg.action, 'enemy_breakthrough');
});
test('offline classifier: good news', () => {
  const r = classifyLocal({ map, labels, text: 'Hit a new PR on bench at the gym today. We launched the product and got our first 10 customers, huge. Aced my chemistry exam.' });
  const by = Object.fromEntries(r.items.map(i => [i.front, i]));
  assert.equal(by.raj?.outcome, 'win'); assert.equal(by.irq?.outcome, 'win'); assert.equal(by.afg?.outcome, 'win');
  assert.ok(by.irq.severity >= 3);
});
test('offline classifier: negation and nothing', () => {
  assert.equal(classifyLocal({ map, labels, text: 'The gym session was not good.' }).items[0].outcome, 'loss');
  assert.equal(classifyLocal({ map, labels, text: 'Hello there.' }).items.length, 0);
});
test('custom labels route to their front', () => {
  const r = classifyLocal({ map, labels: { ...labels, tur: 'Guitar' }, text: 'Guitar practice went great.' });
  assert.equal(r.items[0].front, 'tur');
});
test('LLM path: request shape and sanitising', async () => {
  let seen;
  const fetchImpl = async (url, init) => { seen = { url, init, body: JSON.parse(init.body) }; return { ok: true, status: 200, json: async () => ({ stop_reason: 'end_turn', content: [{ type: 'thinking', thinking: '' }, { type: 'text', text: JSON.stringify({ summary: 'S', items: [{ front: 'afg', outcome: 'loss', severity: 9, action: 'breakthrough', headline: 'H' }, { front: 'zzz', outcome: 'win', severity: 1, action: 'offensive', headline: 'x' }] }) }] }) }; };
  const r = await classifyLLM({ map, st, labels, text: 'failed exam', apiKey: 'sk-test', fetchImpl });
  assert.equal(seen.url, 'https://api.anthropic.com/v1/messages');
  assert.equal(seen.init.headers['x-api-key'], 'sk-test');
  assert.equal(seen.init.headers['anthropic-dangerous-direct-browser-access'], 'true');
  assert.equal(seen.body.model, 'claude-opus-5-5');
  assert.equal(seen.body.output_config.format.type, 'json_schema');
  assert.ok(!('temperature' in seen.body) && !('thinking' in seen.body));
  assert.match(seen.body.messages[0].content, /failed exam/);
  assert.deepEqual(r.items, [{ front: 'afg', outcome: 'loss', severity: 5, action: 'enemy_offensive', headline: 'H' }]);
  assert.match(buildSystem(map, labels), /afg: Afghan Front .* = "School"/);
});
test('LLM failure falls back to offline with a warning; 400 retries without fallbacks', async () => {
  const r = await classify({ map, st, labels, text: 'failed my exam', apiKey: 'k', fetchImpl: async () => ({ ok: false, status: 401, json: async () => ({}) }) });
  assert.equal(r.source, 'local'); assert.match(r.warning, /API key rejected/); assert.equal(r.items[0].front, 'afg');
  let n = 0;
  const r2 = await classifyLLM({ map, st, labels, text: 'x', apiKey: 'k', fetchImpl: async (u, init) => { n++; const b = JSON.parse(init.body); if (b.fallbacks) return { ok: false, status: 400, json: async () => ({}) }; return { ok: true, status: 200, json: async () => ({ content: [{ type: 'text', text: '{"summary":"ok","items":[]}' }] }) }; } });
  assert.equal(n, 2); assert.equal(r2.summary, 'ok');
});
