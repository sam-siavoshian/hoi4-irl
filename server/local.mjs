// Local models: a model server on this machine or on the owner's network, spoken to through the standard
// OpenAI-compatible HTTP API (GET /v1/models, POST /v1/chat/completions, POST /v1/audio/transcriptions).
// This file holds what is particular to them:
//   - the presets (which runtime answers where by default, and what to type to install a model in it),
//   - finding what is running (loopback and host.docker.internal only: never a scan of a network),
//   - listing a server's models,
//   - asking for structured output in the strongest way the server takes, and reading what a small model sends back,
//   - what a failed test says.
// Which server is in use, its key and its options are kept by ./providers.mjs. No dependencies.
import { parseLoose, repair, check } from './llm.mjs';

const fail = (status, message, extra = {}) => Object.assign(new Error(message), { status, ...extra });
const clean = u => String(u || '').trim().replace(/\/+$/, '');

// ---- the runtimes ----
// base:  the default address, up to /v1. Loopback is written 127.0.0.1, not "localhost": several of these servers
//        listen on IPv4 only, and "localhost" may resolve to ::1 first.
// ports: where discovery looks for it.
// get:   what to type so the server has the model (shown when a test finds the server but not the model).
// key:   'none' (ignored), 'optional' (the server can be started with one), as documented.
// Each line was read in the runtime's own documentation on the date beside it. Nothing here was run against a real
// server from this repository unless docs/LOCAL_MODELS.md says so. "Structured output" is what the documentation
// promises; what a server really takes is found out per address and model by judgeLocal() below.
export const RUNTIMES = [
  // Ollama. http://localhost:11434/v1; /v1/models and /v1/models/{model}; response_format and JSON mode listed as
  // supported (the page does not name json_schema, so it is negotiated); max_tokens, temperature; the key is ignored.
  // "The OpenAI API does not have a way of setting the context size", and keep_alive is not on that page: both go
  // through the native POST /api/chat (format: "json" or a JSON schema, options.num_ctx, options.num_predict,
  // keep_alive, think), which is what is used when either is set. GET /api/tags lists name, size,
  // details.parameter_size and details.quantization_level. /v1/audio/transcriptions takes WAV.
  // https://docs.ollama.com/api/openai-compatibility, /api/chat, /api/tags — checked 2026-11-17.
  { id: 'ollama', name: 'Ollama', base: 'http://127.0.0.1:11434/v1', ports: [11434], key: 'none', example: 'llama3.2', url: 'https://ollama.com/download',
    get: m => `ollama pull ${m}` },
  // LM Studio. Examples use http://localhost:1234/v1; GET /v1/models, POST /v1/chat/completions; response_format
  // json_schema (GGUF: llama.cpp grammars; MLX: Outlines; "not all models are capable of structured output,
  // particularly LLMs below 7B"); no /v1/audio/transcriptions is listed. `lms get <model>`, `lms load <model>`.
  // https://lmstudio.ai/docs/developer/openai-compat, /openai-compat/structured-output, /docs/cli, /docs/cli/get — checked 2026-11-17.
  { id: 'lmstudio', name: 'LM Studio', base: 'http://127.0.0.1:1234/v1', ports: [1234], key: 'optional', example: 'openai/gpt-oss-20b', url: 'https://lmstudio.ai/download',
    get: m => `lms get ${m}, then lms load ${m}` },
  // llama.cpp llama-server. "by default listens on 127.0.0.1:9931" (--port default 9931; its Docker examples publish
  // 8080, the port older builds used, so discovery looks at both). GET /v1/models: one element, owned_by "llamacpp",
  // meta.size and meta.n_params. response_format: json_object, json_schema (with or without the OpenAI wrapper),
  // enforced with a grammar. timings.predicted_per_second in the answer. --api-key. -m FILE.gguf or -hf user/repo[:quant].
  // No /v1/audio/transcriptions (transcription is the realtime WebSocket only).
  // https://github.com/ggml-org/llama.cpp/blob/master/tools/server/README.md — checked 2026-11-17.
  { id: 'llamacpp', name: 'llama.cpp', base: 'http://127.0.0.1:9931/v1', ports: [9931, 8080], key: 'optional', example: '', url: 'https://github.com/ggml-org/llama.cpp/blob/master/tools/server/README.md',
    get: m => `llama-server -hf ${/\//.test(m) && !/\.gguf$/i.test(m) ? m : '<user>/<repo>'} (or llama-server -m ${/\.gguf$/i.test(m) ? m : '<file>.gguf'})` },
  // vLLM. `vllm serve <model>`; the examples use http://localhost:8000/v1 (the page does not call it the default);
  // response_format json_schema (docs/features/structured_outputs); Transcriptions API for speech models;
  // --api-key. /v1/models is not in the page's list of APIs: unverified, so a missing list is not treated as an error.
  // https://github.com/vllm-project/vllm/blob/main/docs/serving/online_serving/openai_compatible_server.md and
  // docs/features/structured_outputs.md — checked 2026-11-17 (docs.vllm.ai itself refused the fetch).
  { id: 'vllm', name: 'vLLM', base: 'http://127.0.0.1:8000/v1', ports: [8000], key: 'optional', example: '', url: 'https://docs.vllm.ai/',
    get: m => `vllm serve ${m}` },
  // LocalAI. "listens on port 8080 on all interfaces, and authentication is off" (LOCALAI_API_KEY turns it on);
  // `local-ai run <model>`, `local-ai models install <name>`; /v1/chat/completions; /v1/audio/transcriptions with a
  // whisper model. How it does structured output was not confirmed (the page could not be read): negotiated.
  // https://localai.io/docs/start/quickstart/ and /docs/models/capabilities/audio/audio-to-text/ — checked 2026-11-17.
  { id: 'localai', name: 'LocalAI', base: 'http://127.0.0.1:8080/v1', ports: [8080], key: 'optional', example: 'qwen3-4b', url: 'https://localai.io/',
    get: m => `local-ai models install ${m}` },
  // Jan. The local API server is at http://127.0.0.1:1337/v1; a key is optional (empty turns authentication off).
  // Only /v1/chat/completions is documented: /v1/models and structured output are unverified, so both are negotiated.
  // https://docs.jan.ai/desktop/api-server — checked 2026-11-17.
  { id: 'jan', name: 'Jan', base: 'http://127.0.0.1:1337/v1', ports: [1337], key: 'optional', example: '', url: 'https://jan.ai/',
    get: () => 'In Jan, download the model in the Hub, then start the Local API Server' },
  // text-generation-webui. Started with --api, on port 5000 (--api-port); /v1/models (loaded model first),
  // /v1/chat/completions, /v1/audio/* "supported"; --api-key. Structured output is not documented: negotiated.
  // https://github.com/oobabooga/text-generation-webui/blob/main/docs/12%20-%20OpenAI%20API.md — checked 2026-11-17.
  { id: 'textgen', name: 'text-generation-webui', base: 'http://127.0.0.1:5000/v1', ports: [5000], key: 'optional', example: '', url: 'https://github.com/oobabooga/text-generation-webui',
    get: () => 'Load the model in the Model tab, and start the web UI with --api' },
  // KoboldCpp. Port 5001 (--port); /v1/chat/completions and /v1/completions; grammar (GBNF) sampling; --password is
  // the API key; --whispermodel serves /v1/audio/transcriptions, WAV only. /v1/models and json_schema are not in the
  // wiki: negotiated. https://github.com/LostRuins/koboldcpp/wiki — checked 2026-11-17.
  { id: 'koboldcpp', name: 'KoboldCpp', base: 'http://127.0.0.1:5001/v1', ports: [5001], key: 'optional', example: '', url: 'https://github.com/LostRuins/koboldcpp',
    get: m => `koboldcpp --model ${/\.gguf$/i.test(m) ? m : '<file>.gguf'}` },
  // MLX (Apple silicon). `mlx_lm.server --model <path or Hugging Face repo>` "on port 8080 of the localhost";
  // /v1/chat/completions, /v1/models, max_tokens. response_format is not documented: negotiated (expect plain text).
  // https://github.com/ml-explore/mlx-lm/blob/main/mlx_lm/SERVER.md — checked 2026-11-17.
  { id: 'mlx', name: 'MLX', base: 'http://127.0.0.1:8080/v1', ports: [8080], key: 'none', example: 'mlx-community/Mistral-7B-Instruct-v0.3-4bit', url: 'https://github.com/ml-explore/mlx-lm',
    get: m => `mlx_lm.server --model ${m}` },
  // llamafile. Server mode exposes llama-server's HTTP API (examples at http://127.0.0.1:8080/v1): /v1/models,
  // /v1/chat/completions, /v1/audio/transcriptions "with a compatible model". Fields follow the bundled llama.cpp.
  // https://docs.mozilla.ai/llamafile/using-llamafile/api.md — checked 2026-11-17.
  { id: 'llamafile', name: 'llamafile', base: 'http://127.0.0.1:8080/v1', ports: [8080], key: 'none', example: '', url: 'https://docs.mozilla.ai/llamafile/',
    get: () => 'Run the llamafile that holds the model, in server mode' },
  // anything else that speaks the same API, anywhere the owner says
  { id: 'other', name: 'Another server', base: '', ports: [], key: 'optional', example: '', url: null, get: () => 'Load the model in your server' },
];
export const RUNTIME = Object.fromEntries(RUNTIMES.map(r => [r.id, r]));

// ---- speech-to-text servers: POST <base>/audio/transcriptions, multipart, answered {"text": "..."} ----
// wav: the server takes WAV only, so the app converts a recording before it is sent.
export const SPEECH_RUNTIMES = [
  // Speaches (was faster-whisper-server). Examples use http://localhost:8000; /v1/audio/transcriptions; models are
  // named like Systran/faster-distil-whisper-small.en and fetched with `uvx speaches-cli model download <id>`; no key.
  // https://speaches.ai/usage/speech-to-text/ — checked 2026-11-17.
  { id: 'speaches', name: 'Speaches', base: 'http://127.0.0.1:8000/v1', model: 'Systran/faster-distil-whisper-small.en', wav: false, url: 'https://speaches.ai/',
    get: m => `uvx speaches-cli model download ${m}` },
  // whisper.cpp's server. 127.0.0.1:8080; its endpoint is /inference unless started with
  // `--inference-path /v1/audio/transcriptions` (the address below assumes that); the model is the file given with
  // -m, so the name sent is ignored; WAV unless started with --convert (needs ffmpeg).
  // https://github.com/ggml-org/whisper.cpp/blob/master/examples/server/README.md — checked 2026-11-17.
  { id: 'whispercpp', name: 'whisper.cpp', base: 'http://127.0.0.1:8080/v1', model: 'whisper-1', wav: true, url: 'https://github.com/ggml-org/whisper.cpp/tree/master/examples/server',
    get: () => 'whisper-server -m models/ggml-base.en.bin --inference-path /v1/audio/transcriptions' },
  // LocalAI. http://localhost:8080/v1/audio/transcriptions, model "whisper-1" in its example (a YAML file names it);
  // "all audio formats supported by ffmpeg". https://localai.io/docs/models/capabilities/audio/audio-to-text/ — checked 2026-11-17.
  { id: 'localai', name: 'LocalAI', base: 'http://127.0.0.1:8080/v1', model: 'whisper-1', wav: false, url: 'https://localai.io/',
    get: m => `local-ai models install ${m}` },
  // Ollama. /v1/audio/transcriptions "with models that accept audio input"; file: WAV. The page names no model,
  // so none is filled in. https://docs.ollama.com/api/openai-compatibility — checked 2026-11-17.
  { id: 'ollama', name: 'Ollama', base: 'http://127.0.0.1:11434/v1', model: '', wav: true, url: 'https://ollama.com/download', get: m => `ollama pull ${m}` },
  // vLLM serving a speech model: Transcriptions API "only for Automatic Speech Recognition models".
  // https://github.com/vllm-project/vllm/blob/main/docs/serving/online_serving/openai_compatible_server.md — checked 2026-11-17.
  { id: 'vllm', name: 'vLLM', base: 'http://127.0.0.1:8000/v1', model: '', wav: false, url: 'https://docs.vllm.ai/', get: m => `vllm serve ${m}` },
  { id: 'other', name: 'Another server', base: '', model: '', wav: false, url: null, get: () => 'Load the speech model in your server' },
];
export const SPEECH_RUNTIME = Object.fromEntries(SPEECH_RUNTIMES.map(r => [r.id, r]));

// which runtime an address is, when its port belongs to one runtime only (8080 is shared by several: 'other')
export function runtimeOfAddress(base) {
  let port = 0; try { const u = new URL(base); port = Number(u.port || (u.protocol === 'https:' ? 443 : 80)); } catch { return 'other'; }
  const who = RUNTIMES.filter(r => r.ports.includes(port));
  return who.length === 1 ? who[0].id : 'other';
}

// ---- finding what is running ----
// Discovery only ever speaks to this machine: the loopback address, and host.docker.internal (the machine a Docker
// container runs on). It is a fixed list of well-known ports, tried once each; it is not a scan and it never leaves
// the host. A list handed in (a test, HOMEFRONT_DISCOVER) goes through the same gate.
export const DISCOVERY_HOSTS = ['127.0.0.1', 'host.docker.internal'];
const LOOPBACK = new Set(['127.0.0.1', 'localhost', '::1', '[::1]', 'host.docker.internal']);
export function probeAllowed(url) {
  try { const u = new URL(url); return (u.protocol === 'http:' || u.protocol === 'https:') && !u.username && !u.password && LOOPBACK.has(u.hostname.toLowerCase()); } catch { return false; }
}
// every address discovery may try: each runtime's default ports, on each allowed host
export function discoveryTargets({ skipPort = null } = {}) {
  const ports = [...new Set(RUNTIMES.flatMap(r => r.ports))];
  return DISCOVERY_HOSTS.flatMap(h => ports.filter(p => !(h === '127.0.0.1' && p === skipPort)).map(p => `http://${h}:${p}/v1`));
}

// one GET that never throws and never follows a redirect (a local server must not be able to send the probe elsewhere)
async function get(fetchImpl, url, { key = '', timeout = 4000 } = {}) {
  const ac = new AbortController(); const timer = setTimeout(() => ac.abort(), timeout);
  try {
    const r = await fetchImpl(url, { method: 'GET', redirect: 'error', signal: ac.signal, headers: key ? { authorization: `Bearer ${key}` } : {} });
    const text = await r.text(); let json = null; try { json = JSON.parse(text); } catch { /* not json */ }
    return { reached: true, ok: r.ok, status: r.status, json, text };
  } catch { return { reached: false, timedOut: ac.signal.aborted }; }
  finally { clearTimeout(timer); }
}
const gb = n => (typeof n === 'number' && n > 0 ? n : null);
const billions = n => (typeof n === 'number' && n > 0 ? `${(n / 1e9).toFixed(n >= 1e10 ? 0 : 1)}B` : null);
const word = v => (typeof v === 'string' && v.length <= 40 ? v : null);
const rootOf = base => clean(base).replace(/\/v1$/i, '');

// The models a server has. → { reached, listed, models: [{ id, size (bytes), params ("8.0B"), quant ("Q4_K_M") }], ollama }
// /v1/models first; Ollama's own /api/tags when that is absent, or beside it for the sizes it reports.
export async function listModels({ base, key = '', runtime = 'other', fetchImpl, timeout = 4000 }) {
  const r = await get(fetchImpl, clean(base) + '/models', { key, timeout });
  if (!r.reached) return { reached: false, timedOut: !!r.timedOut, listed: false, models: [] };
  if (r.status === 401 || r.status === 403) return { reached: true, keyRejected: true, listed: false, models: [] };
  let models = null, owners = [];
  if (r.ok && Array.isArray(r.json?.data)) {
    owners = r.json.data.map(m => m?.owned_by);
    models = r.json.data.filter(m => m && typeof m.id === 'string' && m.id).map(m => ({ id: m.id, size: gb(m.meta?.size ?? m.size), params: billions(m.meta?.n_params) || word(m.parameter_size), quant: word(m.quantization) || word(m.quantization_level) }));
  }
  let ollama = false;
  if (!models || runtime === 'ollama' || owners.includes('library')) {
    const t = await get(fetchImpl, rootOf(base) + '/api/tags', { key, timeout });
    if (t.reached && t.ok && Array.isArray(t.json?.models)) {
      ollama = true;
      const tags = t.json.models.filter(m => m && typeof (m.name || m.model) === 'string').map(m => ({ id: m.name || m.model, size: gb(m.size), params: word(m.details?.parameter_size), quant: word(m.details?.quantization_level) }));
      const by = new Map(tags.map(m => [m.id, m]));
      models = models ? models.map(m => ({ ...m, ...(by.get(m.id) || by.get(`${m.id}:latest`) || {}), id: m.id })) : tags;
    }
  }
  return { reached: true, listed: !!models, models: (models || []).slice(0, 500), ollama, owners };
}
// a model name as the server lists it: Ollama lists "llama3.2:latest" for "llama3.2"
export const hasModel = (models, name) => !!name && models.some(m => m.id === name || m.id === `${name}:latest` || `${m.id}:latest` === name);

// which runtime answered, from what it says of itself, then from its port
function runtimeOf(base, found) {
  const owners = found.owners || [];
  if (found.ollama || owners.includes('library')) return 'ollama';
  if (owners.includes('llamacpp')) return 'llamacpp';
  if (owners.includes('vllm')) return 'vllm';
  if (owners.includes('koboldcpp')) return 'koboldcpp';
  return runtimeOfAddress(base);
}
// → { found: [{ runtime, name, base, models }], tried } — the servers that answered with a list of models
export async function discover({ fetchImpl, targets = discoveryTargets(), timeout = 1500 }) {
  const allowed = [...new Set(targets.map(clean))].filter(probeAllowed);
  const answers = await Promise.all(allowed.map(async base => ({ base, found: await listModels({ base, fetchImpl, timeout }) })));
  const found = answers.filter(a => a.found.reached && a.found.listed).map(({ base, found: f }) => {
    const runtime = runtimeOf(base, f); let port = ''; try { port = new URL(base).port; } catch { /* checked above */ }
    return { runtime, name: runtime === 'other' ? `A model server on port ${port}` : RUNTIME[runtime].name, base, models: f.models };
  });
  return { found, tried: allowed.length };
}

// ---- structured output from a local model ----
// Tried in this order, strongest first; what worked for an address and model is remembered by the caller:
//   json_schema  response_format json_schema, strict: the server holds the model to the schema (a grammar)
//   json_object  JSON mode, with the schema written into the prompt
//   text         no response_format at all: the schema in the prompt, and the answer dug out of whatever comes back
export const MODES = ['json_schema', 'json_object', 'text'];
const SCHEMA_IN_PROMPT = schema => `\n\nAnswer with one JSON object only: no prose, no code fence. It must validate against this JSON Schema:\n${JSON.stringify(schema)}`;
// a server that will not take the request as it was shaped: ask again in a plainer way
const refusesShape = e => e.upstream === 400 || e.upstream === 422 || e.upstream === 501 || (e.upstream === 500 && /response_format|json_schema|grammar|schema|format/i.test(e.message || ''));

// c: { model, runtime, base, post(pathOrUrl, body), opts: { maxTokens, context, keepAlive } }
// → { result, mode, tokens, tps, calls }   Throws as the other providers do (422 declined, 502 bad_answer, ...).
export async function judgeLocal(c, { name, system, user, schema }, { remembered = null, forced = null } = {}) {
  const o = c.opts || {};
  // Ollama's own API carries what its OpenAI-compatible one cannot: the context length and keep_alive
  const native = c.runtime === 'ollama' && (o.context || o.keepAlive);
  let calls = 0;
  async function ask(mode, messages) {
    calls++; const t = Date.now();
    if (native) {
      const out = await c.post(rootOf(c.base) + '/api/chat', { model: c.model, messages, stream: false, ...(mode === 'json_schema' ? { format: schema } : mode === 'json_object' ? { format: 'json' } : {}),
        options: { temperature: o.temperature ?? 0, ...(o.context ? { num_ctx: o.context } : {}), ...(o.maxTokens ? { num_predict: o.maxTokens } : {}) }, ...(o.keepAlive ? { keep_alive: o.keepAlive } : {}) });
      const tps = out.eval_count > 0 && out.eval_duration > 0 ? out.eval_count / (out.eval_duration / 1e9) : null;
      return { text: out.message?.content, cut: out.done_reason === 'length', tokens: out.eval_count ?? null, tps, ms: Date.now() - t };
    }
    const response_format = mode === 'json_schema' ? { type: 'json_schema', json_schema: { name, strict: true, schema } } : mode === 'json_object' ? { type: 'json_object' } : undefined;
    const out = await c.post('/chat/completions', { model: c.model, messages, ...(response_format ? { response_format } : {}), temperature: o.temperature ?? 0, stream: false, ...(o.maxTokens ? { max_tokens: o.maxTokens } : {}) });
    const choice = out.choices?.[0], msg = choice?.message;
    if (msg?.refusal) throw fail(422, 'The model declined this report.', { reason: 'declined' });
    const text = Array.isArray(msg?.content) ? msg.content.map(p => p?.text || '').join('') : msg?.content;
    const tps = typeof out.timings?.predicted_per_second === 'number' ? out.timings.predicted_per_second : null; // llama.cpp reports it
    return { text, cut: choice?.finish_reason === 'length', tokens: out.usage?.completion_tokens ?? null, tps, ms: Date.now() - t };
  }
  // → { value } or { error: what is wrong, in words the model can act on }
  const read = out => {
    if (!out.text || typeof out.text !== 'string') return { error: 'The answer was empty.' };
    const found = parseLoose(out.text); if (found === undefined || found === null || typeof found !== 'object') return { error: 'The answer was not a JSON object.' };
    const value = repair(schema, found), wrong = check(schema, value);
    return wrong ? { error: wrong[0].toUpperCase() + wrong.slice(1) } : { value };
  };
  const bad = (why, out) => (out?.cut ? fail(502, 'The model ran out of room before it finished its answer.', { reason: 'cut_short' }) : fail(502, 'The model did not return JSON in the expected shape.', { reason: 'bad_answer', detail: why }));

  const order = forced ? [forced] : MODES.slice(Math.max(0, MODES.indexOf(remembered)));
  let last = null;
  for (let i = 0; i < order.length; i++) {
    const mode = order[i], final = i === order.length - 1;
    const messages = [{ role: 'system', content: mode === 'json_schema' ? system : system + SCHEMA_IN_PROMPT(schema) }, { role: 'user', content: user }];
    let out;
    try { out = await ask(mode, messages); }
    catch (e) { last = e; if (!final && refusesShape(e)) continue; throw e; }
    let got = read(out);
    // A mode that is the last resort, or that has worked for this model before, gets one more try with what was
    // wrong said back to the model. An unproven mode with a weaker one behind it simply gives way to that one.
    if (got.error && (final || mode === remembered)) {
      if (out.cut) throw bad(got.error, out);
      out = await ask(mode, [...messages, { role: 'assistant', content: String(out.text || '').slice(0, 4000) || '(nothing)' },
        { role: 'user', content: `That answer could not be used. ${got.error} Answer again with one JSON object only, matching the schema, and nothing else.` }]);
      got = read(out);
      if (got.error) throw bad(got.error, out);
    }
    if (got.error) { last = bad(got.error, out); continue; }
    return { result: got.value, mode, tokens: out.tokens, tps: out.tps, ms: out.ms, calls };
  }
  throw last || fail(502, 'The model did not return JSON in the expected shape.', { reason: 'bad_answer' });
}

// ---- what a test of a local server says: what went wrong, then what to do ----
const hostPort = base => { try { const u = new URL(base); return { host: u.hostname, port: u.port || (u.protocol === 'https:' ? '443' : '80'), where: u.host }; } catch { return { host: '', port: '', where: String(base) }; } };
export function unreachableWords(base, name = 'the model server') {
  const { host, port, where } = hostPort(base); const here = LOOPBACK.has(host) && host !== 'host.docker.internal';
  return here
    ? `Nothing answered at ${where}. Check that ${name} is running. If Home Front runs in Docker, use http://host.docker.internal:${port}/v1 instead.`
    : `Couldn’t reach ${where}. Check that ${name} is running there, that it listens on that address and not only on its own loopback, and that a firewall isn’t in the way.`;
}
export const missingWords = (model, runtime, list = RUNTIME) => `The server answered, but it has no model called ${model}. ${/^[A-Z]/.test((list[runtime] || list.other).get(model)) ? '' : 'Run '}${(list[runtime] || list.other).get(model)}, or pick one from the list.`;
export const LOCAL_WORDS = {
  bad_answer: m => `${m} answered, but not with JSON that could be used. Try a larger model, or another mode under Advanced.`,
  cut_short: m => `${m} ran out of room before it finished. Raise the most tokens to write, or the context length, under Advanced.`,
  timeout: (m, secs) => `${m} took longer than ${secs} seconds. The first answer after a model loads is the slowest: try again, or raise the timeout under Advanced.`,
  key_rejected: () => 'The server wants a key, or refused the one it was given. Add its key under Advanced.',
  provider_down: () => 'The server reported an error of its own. Look at its log, then try again.',
};
// a failed call that means "this server has no such model"
export const saysNoModel = e => e.reason === 'not_found' || /model.{0,80}(not found|does not exist|not loaded|no such|unknown)|no model|(not found|unknown|invalid).{0,40}model|try pulling/i.test(e.message || '');
