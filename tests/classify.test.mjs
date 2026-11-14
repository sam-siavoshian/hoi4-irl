import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { simulate } from '../js/engine.js';
import { classifyLocal, classifyLLM, classify, buildSystem, assess } from '../js/classify.js';

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
test('judge path: goes through the private server, result is sanitised', async () => {
  let seen;
  const fetchImpl = async (url, init) => { seen = { url, init, body: JSON.parse(init.body) }; return { ok: true, status: 200, json: async () => ({ result: { summary: 'S', items: [{ front: 'afg', outcome: 'loss', severity: 9, action: 'breakthrough', headline: 'H', days_ago: 0 }, { front: 'zzz', outcome: 'win', severity: 1, action: 'offensive', headline: 'x', days_ago: 0 }] } }) }; };
  const r = await classifyLLM({ map, st, labels, text: 'failed exam', fetchImpl });
  assert.equal(seen.url, 'api/llm'); assert.ok(!JSON.stringify(seen.init.headers).match(/authorization|api-key/i), 'no key in the browser');
  assert.match(seen.body.user, /failed exam/); assert.match(seen.body.system, /afg: Afghan Front .* = "School"/);
  const sch = seen.body.schema; assert.equal(sch.additionalProperties, false); assert.deepEqual(sch.required, ['summary', 'items']);
  const item = sch.properties.items.items; assert.equal(item.additionalProperties, false); assert.deepEqual(item.required.slice().sort(), Object.keys(item.properties).sort(), 'strict mode needs every field required');
  assert.deepEqual(r.items, [{ front: 'afg', outcome: 'loss', severity: 5, action: 'enemy_offensive', headline: 'H', days_ago: 0 }]);
});
test('judge failure falls back to offline with a warning', async () => {
  const r = await classify({ map, st, labels, text: 'failed my exam', remote: true, fetchImpl: async () => ({ ok: false, status: 503, json: async () => ({ error: 'OPENAI_API_KEY is not set on the server.' }) }) });
  assert.equal(r.source, 'local'); assert.match(r.warning, /OPENAI_API_KEY/); assert.equal(r.items[0].front, 'afg');
  assert.equal((await classify({ map, st, labels, text: 'failed my exam' })).source, 'local');
});
test('days ago, switched-off fronts, notes and the staff assessment', async () => {
  const r = classifyLocal({ map, labels, text: 'Yesterday I failed my exam. Today the gym went great.' });
  assert.equal(r.items.find(i => i.front === 'afg').days_ago, 1); assert.equal(r.items.find(i => i.front === 'raj').days_ago, 0);
  const off = classifyLocal({ map, labels, off: ['afg'], text: 'I failed my exam.' }); assert.ok(off.items.every(i => i.front !== 'afg'));
  const sys = buildSystem(map, labels, { irq: 'my SaaS company' }, ['tur']); assert.match(sys, /my SaaS company/); assert.doesNotMatch(sys, /tur: Anatolian/);
  const a = await assess({ map, st, labels }); assert.match(a.assessment, /No dispatches/);
  const st2 = simulate(map, [{ id: 'a', ts: Date.now() - 1000, items: [{ front: 'afg', outcome: 'loss', severity: 4, action: 'enemy_offensive', headline: 'x' }] }], Date.now());
  const b = await assess({ map, st: st2, labels }); assert.match(b.assessment, /School is the weakest/); assert.equal(b.orders[0].front, 'afg');
});
