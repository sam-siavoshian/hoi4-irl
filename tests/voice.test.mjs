import test from 'node:test';
import assert from 'node:assert/strict';
import { namesFrom, transcribe } from '../js/voice.js';

test('names the user mentioned before become spelling hints', () => {
  const n = namesFrom(['Went to the gym with Daniel. My cofounder Arya and I met Sequoia on Tuesday.', 'I told Arya the build shipped. Then Kian called.', null, undefined]);
  assert.deepEqual(n.slice(0, 1), ['Arya'], 'most mentioned first');
  for (const w of ['Daniel', 'Sequoia', 'Kian']) assert.ok(n.includes(w), w);
  for (const w of ['Went', 'My', 'Then', 'Tuesday']) assert.ok(!n.includes(w), `${w} is not a name`);
  assert.equal(namesFrom(Array.from({ length: 100 }, (_, i) => `I met Person${String.fromCharCode(97 + (i % 26))}x today.`), 5).length, 5);
});
test('transcribe sends the audio and the hints to the private server only', async () => {
  let seen; const fetchImpl = async (url, init) => { seen = { url, init }; return { ok: true, status: 200, json: async () => ({ text: 'hello' }) }; };
  const blob = new Blob([new Uint8Array(1000)], { type: 'audio/mp4' });
  assert.equal(await transcribe(blob, { prompt: 'Daily update', keywords: ['Arya', 'Gym & Health'] }, fetchImpl), 'hello');
  const u = new URL(seen.url, 'http://x/'); assert.equal(u.pathname, '/api/transcribe'); assert.equal(u.searchParams.get('prompt'), 'Daily update'); assert.deepEqual(u.searchParams.getAll('k'), ['Arya', 'Gym & Health']);
  assert.equal(seen.init.headers['content-type'], 'audio/mp4'); assert.equal(seen.init.body, blob);
  await transcribe(blob, {}, fetchImpl); assert.equal(seen.url, 'api/transcribe');
  await assert.rejects(transcribe(blob, {}, async () => ({ ok: false, status: 401, json: async () => ({}) })), /Signed out/);
  await assert.rejects(transcribe(blob, {}, async () => ({ ok: false, status: 502, json: async () => ({ error: 'Could not reach OpenAI. Try again.' }) })), /Could not reach OpenAI/);
});
