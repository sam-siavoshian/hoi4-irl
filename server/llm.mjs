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

// ---- reading an answer that is not clean JSON (small local models) ----
// A reasoning model thinks out loud first: <think>…</think> (also <thinking>, <reasoning>). The thinking is dropped:
// a closed block anywhere, everything up to a lone closing tag (a chat template that swallowed the opening one),
// and everything after a lone opening tag (the model ran out of room while thinking).
export function stripThinking(text) {
  let s = String(text).replace(/<(think|thinking|reasoning)>[\s\S]*?<\/\1>/gi, '');
  const close = /<\/(?:think|thinking|reasoning)>/i.exec(s); if (close) s = s.slice(close.index + close[0].length);
  const open = /<(?:think|thinking|reasoning)>/i.exec(s); if (open) s = s.slice(0, open.index); // still thinking when it stopped: no answer after it
  return s.trim();
}
// The first balanced {...} in the text that parses, read with strings and escapes in mind. → the object, or undefined.
export function firstObject(text) {
  const s = String(text);
  for (let a = s.indexOf('{'); a >= 0; a = s.indexOf('{', a + 1)) {
    let depth = 0, str = false;
    for (let i = a; i < s.length; i++) {
      const ch = s[i];
      if (str) { if (ch === '\\') i++; else if (ch === '"') str = false; continue; }
      if (ch === '"') str = true; else if (ch === '{') depth++;
      else if (ch === '}' && --depth === 0) { try { const v = JSON.parse(s.slice(a, i + 1)); if (v && typeof v === 'object') return v; } catch { /* not this one */ } break; }
    }
  }
  return undefined;
}
// tolerant JSON reading: clean JSON, or JSON after a thinking block, inside a code fence, or in the middle of a sentence
export function parseLoose(text) {
  const raw = String(text).trim();
  try { return JSON.parse(raw); } catch { /* try harder */ }
  const s = stripThinking(raw);
  try { return JSON.parse(s); } catch { /* try harder */ }
  for (const m of s.matchAll(/```[\w-]*\s*([\s\S]*?)```/g)) { try { return JSON.parse(m[1].trim()); } catch { /* try harder */ } const v = firstObject(m[1]); if (v !== undefined) return v; }
  return firstObject(s);
}

// ---- mending and checking an answer against the schema that was asked for ----
// What can be mended safely is mended: a number sent as a string, a number outside its range (clamped), a decimal
// where a whole number was asked for, the wrong letter case in a fixed choice, keys nobody asked for, one object
// where a list of them was asked for. Anything else is left for check() to name. A value that is in no fixed choice
// (an unknown front or battle type) is left as it is: the app's own normaliser drops or replaces those, as it
// always has (js/classify.js sanitize).
export function repair(schema, v) {
  if (!schema || typeof schema !== 'object') return v;
  const types = Array.isArray(schema.type) ? schema.type : schema.type ? [schema.type] : [];
  const wants = t => types.includes(t);
  if ((wants('integer') || wants('number')) && !wants('string')) {
    let n = typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v)) ? Number(v) : v;
    if (typeof n !== 'number' || !Number.isFinite(n)) return v;
    if (!wants('number')) n = Math.round(n);
    if (typeof schema.minimum === 'number') n = Math.max(schema.minimum, n);
    if (typeof schema.maximum === 'number') n = Math.min(schema.maximum, n);
    return n;
  }
  if (wants('boolean') && typeof v === 'string' && /^(true|false)$/i.test(v.trim())) return /^true$/i.test(v.trim());
  if (wants('string')) {
    let s = typeof v === 'number' || typeof v === 'boolean' ? String(v) : v;
    if (typeof s === 'string' && Array.isArray(schema.enum) && !schema.enum.includes(s)) { const k = s.trim().toLowerCase().replace(/[\s-]+/g, '_'); s = schema.enum.find(e => String(e).toLowerCase() === k) ?? s; }
    return s;
  }
  if (wants('array')) { const list = Array.isArray(v) ? v : v && typeof v === 'object' ? [v] : v; return Array.isArray(list) && schema.items ? list.map(x => repair(schema.items, x)) : list; }
  if (wants('object') && v && typeof v === 'object' && !Array.isArray(v)) {
    const props = schema.properties || {}, out = {};
    for (const [k, x] of Object.entries(v)) {
      if (!(k in props)) { if (schema.additionalProperties !== false) out[k] = x; continue; }
      if (x === null && !(schema.required || []).includes(k) && !(Array.isArray(props[k].type) && props[k].type.includes('null'))) continue;
      out[k] = repair(props[k], x);
    }
    return out;
  }
  return v;
}
// The first thing wrong with an answer, in words a model can act on, or null. Structure only, as matches() below.
export function check(schema, v, at = 'the answer') {
  if (!schema || typeof schema !== 'object') return null;
  const t = Array.isArray(schema.type) ? schema.type : schema.type ? [schema.type] : [];
  const kind = Array.isArray(v) ? 'an array' : v === null ? 'null' : typeof v === 'object' ? 'an object' : `a ${typeof v}`;
  if (t.length && !matches({ type: t }, v)) return `${at} must be ${t.map(k => (/^[aeio]/.test(k) ? 'an ' : 'a ') + k).join(' or ')}, but it is ${kind}.`;
  if (Array.isArray(v)) { for (let i = 0; i < v.length; i++) { const e = check(schema.items, v[i], `item ${i + 1}${at === 'the answer' ? '' : ` of ${at}`}`); if (e) return e; } return null; }
  if (v && typeof v === 'object') {
    for (const k of schema.required || []) if (!(k in v)) return `"${k}" is missing from ${at}.`;
    for (const [k, sub] of Object.entries(schema.properties || {})) if (k in v) { const e = check(sub, v[k], `"${k}"${at === 'the answer' ? '' : ` of ${at}`}`); if (e) return e; }
  }
  return null;
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
