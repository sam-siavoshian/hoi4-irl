// What .env says about the model (the fallback when nothing is chosen in the app), and the two helpers every
// provider's answer goes through. The providers themselves, and the calls, are in ./providers.mjs.

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
