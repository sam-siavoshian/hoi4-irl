// The general staff's providers: who can judge a report and who can turn speech into text, how each is called,
// and which one is in use. The choice and the keys are set in the app (Settings → General staff) and kept in
// ai.json in the data folder (mode 0600, next to state.json); what .env says is the fallback, so an install from
// before this file existed keeps working untouched.
//
// Nothing here logs or returns a key: responses carry `hasKey` and the last 4 characters of a key saved in the app,
// and a provider's error is summarised, with anything key-shaped cut out, before it leaves this file.
// No dependencies: Node 20 built-ins and fetch.
import { llmConfig, parseLoose, matches } from './llm.mjs';

const fail = (status, message, extra = {}) => Object.assign(new Error(message), { status, ...extra });
const clean = u => String(u || '').trim().replace(/\/+$/, '');
const hostOf = u => { try { return new URL(u).hostname; } catch { return null; } };
const obj = v => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});

// ---- the registry ----
// model: the default judge, always the provider's SMALL, cheap model (this job needs no frontier model).
// stt:   the default speech-to-text model, or null when the provider has none.
// api:   how the judge is called. responses = OpenAI Responses; chat = OpenAI-compatible Chat Completions;
//        anthropic = Anthropic Messages; gemini = Gemini Interactions.
// Each default was checked against the provider's own documentation on the date beside it. No call was made with a
// real key from this repository: README "Configuration" says which defaults were verified and which were not.
export const PROVIDERS = [
  { id: 'openai', name: 'OpenAI', keyUrl: 'https://platform.openai.com/api-keys', needsKey: true, api: 'responses', base: 'https://api.openai.com/v1',
    // The project's long-standing defaults, kept. gpt-6-luna is listed live in OpenRouter's model index as
    // openai/gpt-6-luna, with structured outputs (https://openrouter.ai/api/v1/models, checked 2026-11-16).
    // gpt-transcribe was NOT re-checked: OpenAI's own documentation refused the fetch. Unverified.
    model: 'gpt-6-luna', stt: 'gpt-transcribe', sttApi: 'openai', envKey: ['OPENAI_API_KEY'] },
  { id: 'anthropic', name: 'Anthropic', keyUrl: 'https://console.anthropic.com/settings/keys', needsKey: true, api: 'anthropic', base: 'https://api.anthropic.com/v1',
    // Claude Haiku 5.5, the current Haiku: its id, the headers (x-api-key, anthropic-version: 2026-10-21) and
    // structured outputs (output_config.format) are from Anthropic's API reference (model table dated 2026-11-03,
    // read 2026-11-16; https://platform.claude.com/docs/en/build-with-claude/structured-outputs).
    // Anthropic has no speech-to-text endpoint.
    model: 'claude-haiku-5-5', stt: null, envKey: ['ANTHROPIC_API_KEY'] },
  { id: 'gemini', name: 'Google Gemini', keyUrl: 'https://aistudio.google.com/apikey', needsKey: true, api: 'gemini', base: 'https://generativelanguage.googleapis.com/v1beta',
    // gemini-3.5-flash-lite: "fastest, most cost-effective 3.5 model", stable, takes audio, structured outputs
    // (https://aistudio.google.com/docs/models and /docs/models/gemini-3.5-flash-lite, checked 2026-11-16).
    // Interactions API: response_format with a JSON schema, x-goog-api-key, Api-Revision 2026-05-20, audio as an input part
    // (https://aistudio.google.com/docs/structured-output, /docs/audio and /api-reference/interactions-api, checked 2026-11-16).
    model: 'gemini-3.5-flash-lite', stt: 'gemini-3.5-flash-lite', sttApi: 'gemini', envKey: ['GEMINI_API_KEY', 'GOOGLE_API_KEY'] },
  { id: 'groq', name: 'Groq', keyUrl: 'https://console.groq.com/keys', needsKey: true, api: 'chat', base: 'https://api.groq.com/openai/v1',
    // openai/gpt-oss-20b: the cheapest production chat model, strict json_schema supported
    // (https://console.groq.com/docs/models and /docs/structured-outputs, checked 2026-11-16).
    // whisper-large-v3-turbo: the fastest and cheapest speech model (https://console.groq.com/docs/speech-to-text, checked 2026-11-16).
    model: 'openai/gpt-oss-20b', stt: 'whisper-large-v3-turbo', sttApi: 'openai', envKey: ['GROQ_API_KEY'] },
  { id: 'mistral', name: 'Mistral', keyUrl: 'https://console.mistral.ai/api-keys', needsKey: true, api: 'chat', base: 'https://api.mistral.ai/v1',
    // mistral-small-latest and voxtral-mini-latest are the ids Mistral's API reference uses in its examples
    // (https://docs.mistral.ai/api/ and /api/endpoint/audio/transcriptions, checked 2026-11-16). Which snapshot each
    // alias points to today could NOT be confirmed (the changelog's newest are mistral-small-2603 and
    // voxtral-mini-transcribe-3-0), nor the exact json_schema body: a 400 falls back to JSON mode, checked here.
    model: 'mistral-small-latest', stt: 'voxtral-mini-latest', sttApi: 'openai', envKey: ['MISTRAL_API_KEY'] },
  { id: 'openrouter', name: 'OpenRouter', keyUrl: 'https://openrouter.ai/settings/keys', needsKey: true, api: 'chat', base: 'https://openrouter.ai/api/v1',
    // openai/gpt-6-luna: listed with structured outputs at $0.10 in, $0.50 out per million tokens
    // (https://openrouter.ai/api/v1/models, checked 2026-11-16). json_schema with provider.require_parameters
    // (https://openrouter.ai/docs/features/structured-outputs, checked 2026-11-16). No transcription endpoint is documented.
    model: 'openai/gpt-6-luna', stt: null, envKey: ['OPENROUTER_API_KEY'], chatExtra: { provider: { require_parameters: true } } },
  { id: 'ollama', name: 'Ollama', keyUrl: 'https://ollama.com/download', needsKey: false, local: true, baseEditable: true, api: 'chat', base: 'http://localhost:11434/v1',
    // llama3.2 (3B) is the small model Ollama's guide pulls; the OpenAI-compatible API is at :11434/v1
    // (https://docs.ollama.com/api/openai-compatibility, checked 2026-11-16).
    model: 'llama3.2', stt: null },
  { id: 'lmstudio', name: 'LM Studio', keyUrl: 'https://lmstudio.ai/download', needsKey: false, local: true, baseEditable: true, api: 'chat', base: 'http://localhost:1234/v1',
    // The server is at :1234/v1 and takes json_schema (https://lmstudio.ai/docs/developer/openai-compat/structured-output, checked 2026-11-16).
    // LM Studio names a model after whatever is loaded, so this default is a guess at a small one. Unverified: type your own.
    model: 'openai/gpt-oss-20b', stt: null },
  // any other OpenAI-compatible Chat Completions server: no default address or model
  { id: 'custom', name: 'Other server', keyUrl: null, needsKey: false, keyOptional: true, local: true, baseEditable: true, api: 'chat', base: '', model: '', stt: null },
  { id: 'offline', name: 'Offline judge', keyUrl: null, needsKey: false, api: null, base: '', model: '', stt: null },
];
const DEF = Object.fromEntries(PROVIDERS.map(p => [p.id, p]));
const ENV_BASE = id => `${id.toUpperCase()}_BASE_URL`; // ANTHROPIC_BASE_URL, GROQ_BASE_URL, ... (a gateway or a proxy)

// ---- what a provider's error becomes ----
// The provider's own words are kept only where they help (a bad request), and never with anything key-shaped in them.
function scrub(text, secrets) {
  let s = String(text || '');
  for (const k of secrets) if (k && k.length >= 6) s = s.split(k).join('[key]');
  return s.replace(/\b(?:sk|gsk|pk|rk|xai|key)[-_][A-Za-z0-9_*.-]{6,}/g, '[key]').replace(/\bAIza[A-Za-z0-9_*-]{10,}/g, '[key]').replace(/[A-Za-z0-9_-]{32,}/g, '[…]').slice(0, 300);
}
function upstream(status, json, secrets) {
  if (status === 401 || status === 403) return fail(502, 'The provider rejected the key.', { upstream: status, reason: 'key_rejected' });
  if (status === 429) return fail(429, 'The provider is limiting requests, or the account is out of credit.', { upstream: status, reason: 'rate_limited' });
  if (status === 404) return fail(502, 'The provider does not know this model or address.', { upstream: status, reason: 'not_found' });
  const e = json?.error; const msg = typeof e === 'string' ? e : e?.message || json?.message || json?.errors?.[0]?.message;
  return fail(502, msg ? scrub(msg, secrets) : `Provider error ${status}`, { upstream: status, reason: status >= 500 ? 'provider_down' : 'refused' });
}

// ---- the calls ----
const JSON_ONLY = schema => `\n\nAnswer with one JSON object only: no prose, no code fence. It must validate against this JSON Schema:\n${JSON.stringify(schema)}`;
// every provider's answer is read and checked here, whether or not the provider enforced the schema
const read = (text, schema) => {
  if (!text || typeof text !== 'string') throw fail(502, 'Empty response from the model.', { reason: 'bad_answer' });
  const result = parseLoose(text);
  if (result === undefined || !matches(schema, result)) throw fail(502, 'The model did not return JSON in the expected shape.', { reason: 'bad_answer' });
  return result;
};
const TOO_LONG = () => fail(502, 'The report was too long to judge in one go.', { reason: 'bad_answer' });
const DECLINED = () => fail(422, 'The model declined this report.', { reason: 'declined' });
// a schema the provider will not take (400 or 422) is asked for again in plain words, and the answer checked here
const retriable = e => e.upstream === 400 || e.upstream === 422;

const JUDGES = {
  // OpenAI Responses API: text.format json_schema, strict
  async responses(c, { name, system, user, schema }) {
    const out = await c.post('/responses', { model: c.model, max_output_tokens: 2000, store: false, input: [{ role: 'system', content: system }, { role: 'user', content: user }], text: { format: { type: 'json_schema', name, strict: true, schema } } });
    if (out.status === 'incomplete') throw TOO_LONG();
    const parts = (out.output || []).filter(o => o.type === 'message').flatMap(o => o.content || []);
    if (parts.find(p => p.type === 'refusal')) throw DECLINED();
    return read(parts.find(p => p.type === 'output_text')?.text, schema);
  },
  // OpenAI-compatible Chat Completions (Groq, Mistral, OpenRouter, Ollama, LM Studio, ...): response_format json_schema, strict
  async chat(c, { name, system, user, schema }) {
    const body = (sys, response_format) => ({ model: c.model, messages: [{ role: 'system', content: sys }, { role: 'user', content: user }], response_format, ...(c.def?.chatExtra || {}) });
    let out;
    try { out = await c.post('/chat/completions', body(system, { type: 'json_schema', json_schema: { name, strict: true, schema } })); }
    catch (e) { if (!retriable(e)) throw e; out = await c.post('/chat/completions', body(system + JSON_ONLY(schema), { type: 'json_object' })); }
    const choice = out.choices?.[0], msg = choice?.message;
    if (msg?.refusal) throw DECLINED();
    if (choice?.finish_reason === 'length') throw TOO_LONG();
    return read(Array.isArray(msg?.content) ? msg.content.map(p => p?.text || '').join('') : msg?.content, schema);
  },
  // Anthropic Messages API: structured outputs (output_config.format) at low effort, a small job for a small model.
  // No sampling parameters and no prefill (current models refuse both). A model from before `effort` or structured
  // outputs gets the same request without them.
  async anthropic(c, { system, user, schema }) {
    const body = (sys, output_config) => ({ model: c.model, max_tokens: 4000, system: sys, messages: [{ role: 'user', content: user }], ...(output_config ? { output_config } : {}) });
    const format = { type: 'json_schema', schema };
    let out;
    try { out = await c.post('/messages', body(system, { effort: 'low', format })); }
    catch (e) {
      if (!retriable(e)) throw e;
      try { out = await c.post('/messages', body(system, { format })); }
      catch (e2) { if (!retriable(e2)) throw e2; out = await c.post('/messages', body(system + JSON_ONLY(schema))); }
    }
    if (out.stop_reason === 'refusal') throw DECLINED();
    if (out.stop_reason === 'max_tokens') throw TOO_LONG();
    // blocks are read by type: an answer may begin with thinking blocks
    return read((out.content || []).filter(b => b.type === 'text').map(b => b.text).join(''), schema);
  },
  // Gemini Interactions API: response_format carries the JSON schema; store: false keeps nothing at Google after the call
  async gemini(c, { system, user, schema }) {
    let out;
    try { out = await c.post('/interactions', { model: c.model, input: user, system_instruction: system, store: false, generation_config: { max_output_tokens: 4000 }, response_format: { type: 'text', mime_type: 'application/json', schema } }); }
    catch (e) { if (!retriable(e)) throw e; out = await c.post('/interactions', { model: c.model, input: user, system_instruction: system + JSON_ONLY(schema), store: false }); }
    if (out.status === 'incomplete') throw TOO_LONG();
    if (out.status === 'failed' || out.status === 'cancelled') throw fail(502, scrub(out.errors?.[0]?.message || 'The model could not answer.', c.secrets), { reason: 'provider_down' });
    return read(geminiText(out), schema);
  },
};
const geminiText = out => (out.steps || []).filter(s => s.type === 'model_output').flatMap(s => s.content || []).filter(p => p.type === 'text').map(p => p.text).join('') || (typeof out.output_text === 'string' ? out.output_text : '');

const SCRIBES = {
  // POST <base>/audio/transcriptions, multipart (OpenAI, Groq's Whisper, Mistral's Voxtral)
  async openai(c, audio, type) {
    const ext = /mp4|m4a|aac/.test(type) ? 'm4a' : /ogg/.test(type) ? 'ogg' : /wav/.test(type) ? 'wav' : /mpeg|mp3/.test(type) ? 'mp3' : 'webm';
    const fd = new FormData(); fd.append('model', c.model); fd.append('file', new Blob([audio], { type }), `report.${ext}`);
    return String((await c.send('/audio/transcriptions', { method: 'POST', body: fd })).text || '').trim();
  },
  // Gemini has no transcription endpoint: the recording goes to the model with one instruction
  async gemini(c, audio, type) {
    const out = await c.post('/interactions', { model: c.model, store: false, input: [{ type: 'text', text: 'Write down exactly what is said in this recording, in the language spoken. Reply with the words only. If nobody speaks, reply with nothing.' }, { type: 'audio', data: Buffer.from(audio).toString('base64'), mime_type: type }] });
    if (out.status === 'failed' || out.status === 'cancelled') throw fail(502, 'The model could not turn that into text.', { reason: 'provider_down' });
    return geminiText(out).trim();
  },
};
const bearerAuth = k => (k ? { authorization: `Bearer ${k}` } : {});
const AUTH = {
  responses: bearerAuth, chat: bearerAuth, openai: bearerAuth,
  anthropic: k => ({ 'x-api-key': k, 'anthropic-version': '2026-10-21' }),
  gemini: k => ({ 'x-goog-api-key': k, 'api-revision': '2026-05-20' }),
};

// half a second of silence (16 kHz mono WAV): enough to prove a speech key and model work
function silence() {
  const n = 8000, b = Buffer.alloc(44 + n * 2);
  b.write('RIFF', 0); b.writeUInt32LE(36 + n * 2, 4); b.write('WAVEfmt ', 8); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22);
  b.writeUInt32LE(16000, 24); b.writeUInt32LE(32000, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(n * 2, 40);
  return b;
}
const TEST = { name: 'connection_test', system: 'This is a connection test. Answer with the JSON object {"ok": true} and nothing else.', user: 'Are you there?', schema: { type: 'object', properties: { ok: { type: 'boolean' } }, required: ['ok'], additionalProperties: false } };
// what a failed test says: what went wrong, then what to do
const TEST_WORDS = {
  key_rejected: 'The provider rejected the key. Check it, or replace it.', rate_limited: 'The provider is limiting requests, or the account is out of credit. Try again in a minute.',
  not_found: 'The provider doesn’t know this model or address. Check the model name.', unreachable: 'Couldn’t reach the provider. Check the address and the network.',
  timeout: 'The model took too long to answer. Try again.', bad_answer: 'The model answered, but not in the shape asked for. Try another model.',
  provider_down: 'The provider had a problem of its own. Try again in a minute.', off: 'There’s nothing to test yet. Add a key first.',
};

// env: process.env. store: the data folder (server/storage.mjs). Throws when .env is wrong (LLM_API).
export function createAI({ env, store, fetchImpl = (...a) => fetch(...a) }) {
  const legacy = llmConfig(env);
  // which provider .env describes: OpenAI, unless its address is another provider's or a Chat Completions server's
  const legacyId = !legacy.judge ? null : (() => {
    if (!clean(env.OPENAI_BASE_URL)) return 'openai';
    const h = hostOf(legacy.base), known = PROVIDERS.find(p => p.base && !p.local && hostOf(p.base) === h); if (known) return known.id;
    if (legacy.api !== 'chat') return 'openai';
    let port = ''; try { port = new URL(legacy.base).port; } catch { /* not a url */ }
    return port === '11434' ? 'ollama' : port === '1234' ? 'lmstudio' : 'custom';
  })();

  const shape = j => {
    const x = obj(j), t = obj(x.transcribe);
    return { v: 1, provider: DEF[x.provider] ? x.provider : null, models: { ...obj(x.models) }, bases: { ...obj(x.bases) }, keys: { ...obj(x.keys) },
      transcribe: { mode: t.mode === 'same' || t.mode === 'device' || DEF[t.mode]?.stt ? t.mode : null, models: { ...obj(t.models) } } };
  };
  let saved = shape(store.readJSON('ai.json', null));
  const save = () => store.writeJSON('ai.json', saved); // atomic, mode 0600
  const rejected = new Set(); // providers whose key was refused, until the key changes or a call works

  const envKey = id => {
    for (const n of DEF[id]?.envKey || []) { if (n === 'OPENAI_API_KEY' && legacyId && legacyId !== 'openai') continue; const v = (env[n] || '').trim(); if (v) return v; }
    return legacyId === id ? legacy.key : '';
  };
  const keyOf = id => saved.keys[id] || envKey(id) || '';
  const baseOf = id => (DEF[id].baseEditable && saved.bases[id]) || clean(id === 'openai' ? '' : env[ENV_BASE(id)]) || (legacyId === id ? legacy.base : '') || DEF[id].base;
  const modelOf = id => saved.models[id] || (legacyId === id ? legacy.model : '') || DEF[id].model;
  const secrets = () => [...Object.values(saved.keys), ...PROVIDERS.map(p => envKey(p.id)), legacy.key, legacy.sttKey].filter(Boolean);

  const chosen = () => saved.provider || legacyId || 'offline';
  // 'ready' | 'no_key' | 'no_address' | 'no_model' | 'rejected' | 'offline'
  function statusOf(id) {
    const d = DEF[id]; if (!d || !d.api) return 'offline';
    if (!saved.provider && id === legacyId) return rejected.has(id) ? 'rejected' : 'ready'; // .env as it always worked
    if (d.needsKey && !keyOf(id)) return 'no_key';
    if (!baseOf(id)) return 'no_address';
    if (!modelOf(id)) return 'no_model';
    return rejected.has(id) ? 'rejected' : 'ready';
  }
  // the judge in force, or null (the app then uses its offline keyword judge)
  function judgeNow() {
    if (!saved.provider) return legacy.judge ? { id: legacyId, def: DEF[legacyId], api: legacy.api, base: legacy.base, key: legacy.key, model: legacy.model } : null;
    const id = saved.provider, st = statusOf(id); if (st !== 'ready' && st !== 'rejected') return null;
    return { id, def: DEF[id], api: legacyId === id ? legacy.api : DEF[id].api, base: baseOf(id), key: keyOf(id), model: modelOf(id) };
  }
  // 'env' (nothing chosen in the app), 'same' (the staff's provider), 'device' (the browser or the keyboard), or a provider id
  const sttMode = () => saved.transcribe.mode || (saved.provider ? 'same' : 'env');
  function sttNow() {
    const mode = sttMode();
    if (mode === 'env' || (mode === 'same' && !saved.provider)) return legacy.transcribe ? { id: legacyId || 'openai', api: 'openai', base: legacy.sttBase, key: legacy.sttKey, model: legacy.sttModel } : null;
    if (mode === 'device') return null;
    const id = mode === 'same' ? saved.provider : mode, d = DEF[id]; if (!d?.stt) return null;
    if (d.needsKey && !keyOf(id)) return null;
    return { id, def: d, api: d.sttApi, base: baseOf(id), key: keyOf(id), model: saved.transcribe.models[id] || d.stt };
  }

  function caller(c) {
    const known = secrets();
    async function send(pathname, init) {
      const ac = new AbortController(); const timer = setTimeout(() => ac.abort(), legacy.timeout);
      try {
        let r, text;
        try { r = await fetchImpl(c.base + pathname, { ...init, signal: ac.signal, headers: { ...AUTH[c.api](c.key), ...(init.headers || {}) } }); text = await r.text(); }
        catch { throw ac.signal.aborted ? fail(504, 'The model took too long to answer.', { reason: 'timeout' }) : fail(502, 'Could not reach the model provider.', { reason: 'unreachable' }); }
        let json = null; try { json = JSON.parse(text); } catch { /* not json */ }
        if (!r.ok) throw upstream(r.status, json, known);
        if (!json) throw fail(502, 'The provider did not answer with JSON.', { reason: 'bad_answer' });
        return json;
      } finally { clearTimeout(timer); }
    }
    return { ...c, secrets: known, send, post: (pathname, body) => send(pathname, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }) };
  }
  // remember a refused key so Settings can say so, and forget it once a call works
  async function tracked(id, run) {
    try { const out = await run(); rejected.delete(id); return out; }
    catch (e) { if (e.reason === 'key_rejected') rejected.add(id); throw e; }
  }

  // → the parsed object the schema describes; throws an Error with .status (422 declined, 429, 502, 503, 504)
  async function judge({ name, system, user, schema }) {
    const j = judgeNow(); if (!j) throw fail(503, 'No LLM provider is configured on the server.', { reason: 'off' });
    if (typeof system !== 'string' || typeof user !== 'string' || !schema || typeof schema !== 'object') throw fail(400, 'Bad request');
    return tracked(j.id, () => JUDGES[j.api](caller(j), { name: String(name || 'result').replace(/\W/g, '_').slice(0, 40), system, user, schema }));
  }
  async function transcribe(audio, type) {
    const s = sttNow(); if (!s) throw fail(503, 'Transcription is not configured on the server.', { reason: 'off' });
    return tracked(s.id, () => SCRIBES[s.api](caller(s), audio, type));
  }

  // what the app is told: the choice, and for each provider whether it has a key. Never a key.
  const last4 = k => (k.length >= 12 ? k.slice(-4) : '');
  function view() {
    const j = judgeNow(), s = sttNow(), id = chosen(), mode = sttMode();
    const shown = mode === 'env' ? (s ? 'same' : 'device') : mode === 'same' && !s && !DEF[id].stt ? 'device' : mode;
    return {
      provider: id, source: saved.provider ? 'app' : legacyId ? 'env' : 'none', status: statusOf(id), model: j ? j.model : null,
      transcribe: { mode: shown, provider: s ? s.id : null, model: s ? s.model : null, status: s ? (rejected.has(s.id) ? 'rejected' : 'ready') : DEF[shown === 'same' ? id : shown]?.stt ? 'no_key' : 'device' },
      providers: PROVIDERS.map(p => {
        const own = saved.keys[p.id] || '', server = !own && !!envKey(p.id);
        return { id: p.id, name: p.name, keyUrl: p.keyUrl, needsKey: !!p.needsKey, keyOptional: !!p.keyOptional, local: !!p.local, baseEditable: !!p.baseEditable, judges: !!p.api,
          defaultModel: p.model, defaultStt: p.stt, defaultBase: p.base, model: p.api ? modelOf(p.id) : '', base: p.baseEditable ? baseOf(p.id) : '', sttModel: p.stt ? saved.transcribe.models[p.id] || p.stt : null,
          hasKey: !!own || server, keySource: own ? 'app' : server ? 'server' : null, last4: own ? last4(own) : '', status: statusOf(p.id) };
      }),
    };
  }

  // ---- changes from the app: all of a request is checked before any of it is saved ----
  const bad = message => fail(400, message);
  const MODEL = /^[\w.:/@~+-]{1,120}$/;
  const modelIn = v => { const m = typeof v === 'string' ? v.trim() : ''; if (!MODEL.test(m)) throw bad('That model name has characters a model name can’t have. Check it and try again.'); return m; };
  const empty = v => v == null || (typeof v === 'string' && v.trim() === '');
  function update(body) {
    const b = obj(body), next = shape(saved); const newKeys = [];
    if ('provider' in b) { if (b.provider !== null && !DEF[b.provider]) throw bad('Unknown provider.'); next.provider = b.provider; }
    for (const [id, v] of Object.entries(obj(b.models))) {
      if (!DEF[id]?.api) throw bad('Unknown provider.');
      if (empty(v)) delete next.models[id]; else next.models[id] = modelIn(v);
    }
    for (const [id, v] of Object.entries(obj(b.bases))) {
      if (!DEF[id]?.baseEditable) throw bad('This provider has a fixed address.');
      if (empty(v)) { delete next.bases[id]; continue; }
      let u = null; try { u = new URL(String(v).trim()); } catch { /* not a url */ }
      if (typeof v !== 'string' || v.length > 300 || !u || (u.protocol !== 'http:' && u.protocol !== 'https:')) throw bad('The address must start with http:// or https://.');
      if (u.username || u.password) throw bad('Leave the user name and password out of the address.');
      next.bases[id] = clean(u.href);
    }
    for (const [id, v] of Object.entries(obj(b.keys))) {
      const d = DEF[id]; if (!d || !(d.needsKey || d.keyOptional)) throw bad('This provider takes no key.');
      const k = typeof v === 'string' ? v.trim() : '';
      if (k.length < 8 || k.length > 512 || /[\s\u0000-\u001f\u007f]/.test(k)) throw bad('That doesn’t look like a key. Paste the whole key, with no spaces.');
      next.keys[id] = k; newKeys.push(id);
    }
    if ('transcribe' in b) {
      const t = obj(b.transcribe);
      if ('mode' in t) { if (t.mode !== null && t.mode !== 'same' && t.mode !== 'device' && !DEF[t.mode]?.stt) throw bad('That provider can’t turn speech into text.'); next.transcribe.mode = t.mode; }
      for (const [id, v] of Object.entries(obj(t.models))) {
        if (!DEF[id]?.stt) throw bad('That provider can’t turn speech into text.');
        if (empty(v)) delete next.transcribe.models[id]; else next.transcribe.models[id] = modelIn(v);
      }
    }
    saved = next; save(); for (const id of newKeys) rejected.delete(id);
    return view();
  }
  function removeKey(id) {
    if (!DEF[id]) throw fail(404, 'Unknown provider.');
    if (saved.keys[id]) { const next = shape(saved); delete next.keys[id]; saved = next; save(); }
    rejected.delete(id);
    return view();
  }

  // one tiny call that proves the key and the model work. → { ok: true, model, ms } or { ok: false, reason, message }
  async function test(what) {
    const speech = what === 'transcribe', now = speech ? sttNow() : judgeNow(), t = Date.now();
    if (!now) return { ok: false, reason: 'off', message: TEST_WORDS.off };
    try { if (speech) await transcribe(silence(), 'audio/wav'); else await judge(TEST); return { ok: true, model: now.model, ms: Date.now() - t }; }
    catch (e) { if (!e.status) throw e; return { ok: false, reason: e.reason || 'refused', message: TEST_WORDS[e.reason] || `The provider refused the request: ${e.message.replace(/[.\s]+$/, '')}. Check the model name.` }; }
  }

  return {
    view, update, removeKey, judge, transcribe, test,
    judgeOn: () => !!judgeNow(),
    // what /api/config says: model names and the provider's host, never a key
    config() { const j = judgeNow(), s = sttNow(); return { judge: j ? j.model : null, transcribe: s ? s.model : null, provider: j ? hostOf(j.base) : null, api: j ? j.api : legacy.api }; },
    // one line for the start-up log
    describe() { const j = judgeNow(), s = sttNow(); return `judge ${j ? `${j.model} via ${hostOf(j.base)} (${j.api})` : 'offline (no provider)'}, transcription ${s ? s.model : 'off'}`; },
  };
}
