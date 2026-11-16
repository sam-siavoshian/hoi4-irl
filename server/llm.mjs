// The LLM provider: one structured-output call (the judge) and one transcription call.
// Speaks the OpenAI Responses API or any OpenAI-compatible Chat Completions API
// (Ollama, LM Studio, OpenRouter, Groq, ...). Nothing here logs prompts, answers or keys.

const fail = (status, message, extra = {}) => Object.assign(new Error(message), { status, ...extra });
const clean = u => String(u || '').trim().replace(/\/+$/, '');
const hostOf = u => { try { return new URL(u).hostname; } catch { return null; } };

export function llmConfig(env) {
  const key = (env.OPENAI_API_KEY || '').trim();
  const baseSet = !!clean(env.OPENAI_BASE_URL);
  const base = clean(env.OPENAI_BASE_URL) || 'https://api.openai.com/v1';
  const api = (env.LLM_API || 'responses').trim().toLowerCase();
  if (api !== 'responses' && api !== 'chat') throw new Error(`LLM_API must be "responses" or "chat" (got "${api}").`);
  const model = (env.OPENAI_MODEL || '').trim() || 'gpt-6-luna';
  // a key, or an explicitly chosen endpoint (a local server needs no key), turns the judge on
  const judge = !!key || baseSet;

  const sttBaseSet = !!clean(env.OPENAI_TRANSCRIBE_BASE_URL);
  const sttBase = clean(env.OPENAI_TRANSCRIBE_BASE_URL) || base;
  const sttKey = env.OPENAI_TRANSCRIBE_API_KEY !== undefined ? env.OPENAI_TRANSCRIBE_API_KEY.trim() : key;
  const sttModelSet = (env.OPENAI_TRANSCRIBE_MODEL || '').trim();
  const sttModel = sttModelSet || 'gpt-transcribe';
  const sttOff = /^(off|none|false|0)$/i.test(sttModelSet);
  // on with a key; without one only when a transcription endpoint or model was named on purpose
  const transcribe = !sttOff && (!!sttKey || sttBaseSet || (baseSet && !!sttModelSet));

  const timeout = Math.max(1, Number(env.LLM_TIMEOUT_MS) || 60000);
  return { key, base, api, model, judge, provider: judge ? hostOf(base) : null, sttBase, sttKey, sttModel, transcribe, timeout };
}

// tolerant JSON reading for models that wrap their answer in a code fence or a sentence
export function parseLoose(text) {
  const s = String(text).trim();
  try { return JSON.parse(s); } catch { /* try harder */ }
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) { try { return JSON.parse(fence[1].trim()); } catch { /* try harder */ } }
  const a = s.indexOf('{'), b = s.lastIndexOf('}');
  if (a >= 0 && b > a) { try { return JSON.parse(s.slice(a, b + 1)); } catch { /* give up */ } }
  return undefined;
}
// structural check only (types and required keys). Enums and ranges are left to the app's own sanitiser.
export function matches(schema, v) {
  if (!schema || typeof schema !== 'object') return true;
  const t = Array.isArray(schema.type) ? schema.type : schema.type ? [schema.type] : [];
  const is = k => k === 'object' ? !!v && typeof v === 'object' && !Array.isArray(v) : k === 'array' ? Array.isArray(v) : k === 'string' ? typeof v === 'string'
    : k === 'integer' || k === 'number' ? typeof v === 'number' && Number.isFinite(v) : k === 'boolean' ? typeof v === 'boolean' : k === 'null' ? v === null : true;
  if (t.length && !t.some(is)) return false;
  if (Array.isArray(v)) return !schema.items || v.every(x => matches(schema.items, x));
  if (v && typeof v === 'object') {
    for (const k of schema.required || []) if (!(k in v)) return false;
    for (const [k, sub] of Object.entries(schema.properties || {})) if (k in v && !matches(sub, v[k])) return false;
  }
  return true;
}

export function createLLM(cfg, fetchImpl = (...a) => fetch(...a)) {
  async function call(base, key, pathname, init) {
    const ac = new AbortController(); const timer = setTimeout(() => ac.abort(), cfg.timeout);
    try {
      let r, text;
      try {
        r = await fetchImpl(base + pathname, { ...init, signal: ac.signal, headers: { ...(key ? { authorization: `Bearer ${key}` } : {}), ...(init.headers || {}) } });
        text = await r.text();
      } catch {
        if (ac.signal.aborted) throw fail(504, 'The model took too long to answer.');
        throw fail(502, 'Could not reach the model provider.');
      }
      let json = null; try { json = JSON.parse(text); } catch { /* not json */ }
      if (!r.ok) {
        const msg = typeof json?.error === 'string' ? json.error : json?.error?.message;
        throw fail(r.status === 429 ? 429 : 502, String(msg || `Provider error ${r.status}`).slice(0, 300), { upstream: r.status });
      }
      if (!json) throw fail(502, 'The provider did not answer with JSON.');
      return json;
    } finally { clearTimeout(timer); }
  }
  const post = (pathname, body) => call(cfg.base, cfg.key, pathname, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });

  async function viaResponses({ name, system, user, schema }) {
    const out = await post('/responses', {
      model: cfg.model, max_output_tokens: 2000, store: false,
      input: [{ role: 'system', content: system }, { role: 'user', content: user }],
      text: { format: { type: 'json_schema', name, strict: true, schema } },
    });
    if (out.status === 'incomplete') throw fail(502, 'The report was too long to judge in one go.');
    const parts = (out.output || []).filter(o => o.type === 'message').flatMap(o => o.content || []);
    if (parts.find(c => c.type === 'refusal')) throw fail(422, 'The model declined this report.');
    const text = parts.find(c => c.type === 'output_text')?.text; if (!text) throw fail(502, 'Empty response from the model.');
    const result = parseLoose(text); if (result === undefined) throw fail(502, 'The model did not return valid JSON.');
    return result;
  }

  async function viaChat({ name, system, user, schema }) {
    const body = (sys, response_format) => ({ model: cfg.model, messages: [{ role: 'system', content: sys }, { role: 'user', content: user }], response_format });
    let out;
    try { out = await post('/chat/completions', body(system, { type: 'json_schema', json_schema: { name, strict: true, schema } })); }
    catch (e) {
      // servers without structured outputs reject the schema: ask for plain JSON once and check it here
      if (e.upstream !== 400 && e.upstream !== 422) throw e;
      out = await post('/chat/completions', body(`${system}\n\nAnswer with one JSON object only: no prose, no code fence. It must validate against this JSON Schema:\n${JSON.stringify(schema)}`, { type: 'json_object' }));
    }
    const choice = out.choices?.[0], msg = choice?.message;
    if (msg?.refusal) throw fail(422, 'The model declined this report.');
    if (choice?.finish_reason === 'length') throw fail(502, 'The report was too long to judge in one go.');
    const text = Array.isArray(msg?.content) ? msg.content.map(c => c?.text || '').join('') : msg?.content;
    if (!text || typeof text !== 'string') throw fail(502, 'Empty response from the model.');
    const result = parseLoose(text);
    if (result === undefined || !matches(schema, result)) throw fail(502, 'The model did not return JSON in the expected shape.');
    return result;
  }

  return {
    // → the parsed object the schema describes; throws an Error with .status (422 declined, 429, 502, 503, 504)
    async judge({ name, system, user, schema }) {
      if (!cfg.judge) throw fail(503, 'No LLM provider is configured on the server.');
      if (typeof system !== 'string' || typeof user !== 'string' || !schema || typeof schema !== 'object') throw fail(400, 'Bad request');
      const req = { name: String(name || 'result').replace(/\W/g, '_').slice(0, 40), system, user, schema };
      return cfg.api === 'chat' ? viaChat(req) : viaResponses(req);
    },
    async transcribe(audio, type) {
      if (!cfg.transcribe) throw fail(503, 'Transcription is not configured on the server.');
      const ext = /mp4|m4a|aac/.test(type) ? 'm4a' : /ogg/.test(type) ? 'ogg' : /wav/.test(type) ? 'wav' : /mpeg|mp3/.test(type) ? 'mp3' : 'webm';
      const fd = new FormData(); fd.append('model', cfg.sttModel); fd.append('file', new Blob([audio], { type }), `report.${ext}`);
      const out = await call(cfg.sttBase, cfg.sttKey, '/audio/transcriptions', { method: 'POST', body: fd });
      return String(out.text || '').trim();
    },
  };
}
