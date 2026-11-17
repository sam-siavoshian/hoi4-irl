// Stand-ins for the providers that do not speak OpenAI's API: Anthropic (Messages) and Google Gemini (Interactions).
// Each records what it was sent and insists on its own way of carrying the key, so the tests can assert the URL,
// the auth header, the model and that the schema went with the request. They answer as ./mock-openai.mjs does, with
// the same magic words (REFUSE, BADSHAPE, MALFORMED, PROVIDER_DOWN). No network is involved.
import http from 'node:http';
import { answer, reportOf, frontsOf, written, MALFORMED } from './mock-openai.mjs';

function serve(port, state, handle) {
  const server = http.createServer((req, res) => {
    const chunks = []; req.on('data', c => chunks.push(c)); req.on('end', () => {
      const raw = Buffer.concat(chunks).toString();
      res.setHeader('content-type', 'application/json');
      const json = (status, body) => { res.statusCode = status; res.end(JSON.stringify(body)); };
      let body = null; try { body = JSON.parse(raw); } catch { /* not json */ }
      handle({ req, raw, body, json });
    });
  });
  return new Promise(r => server.listen(port, '127.0.0.1', () => r(Object.assign(state, { close: () => { server.closeAllConnections?.(); server.close(); } }))));
}

// POST /v1/messages. Options (also changeable on the returned object while it runs):
//   effort: false      refuses output_config.effort with 400, as a model from before it does
//   structured: false  refuses output_config altogether with 400
export function mockAnthropic(port, { key = 'sk-ant-test-key', effort = true, structured = true } = {}) {
  const state = { seen: [], effort, structured };
  return serve(port, state, ({ req, raw, body, json }) => {
    if (req.url !== '/v1/messages' || req.method !== 'POST') return json(404, { type: 'error', error: { type: 'not_found_error', message: 'Not found' } });
    if (req.headers['x-api-key'] !== key) return json(401, { type: 'error', error: { type: 'authentication_error', message: `invalid x-api-key: ${req.headers['x-api-key']}` } });
    if (!req.headers['anthropic-version']) return json(400, { type: 'error', error: { type: 'invalid_request_error', message: 'anthropic-version: header is required' } });
    state.seen.push({ path: req.url, key: req.headers['x-api-key'], version: req.headers['anthropic-version'], auth: req.headers.authorization, body });
    const bad = message => json(400, { type: 'error', error: { type: 'invalid_request_error', message } });
    for (const k of ['temperature', 'top_p', 'top_k']) if (k in body) return bad(`${k}: this model does not accept sampling parameters`);
    if (body.messages.at(-1).role !== 'user') return bad('This model does not support assistant message prefill.');
    if (!body.max_tokens) return bad('max_tokens: field required');
    if (body.output_config && !state.structured) return bad('output_config: Extra inputs are not permitted');
    if (body.output_config?.effort && !state.effort) return bad('output_config.effort: this model does not support the effort parameter');
    const user = reportOf(body.messages[0].content);
    if (/PROVIDER_DOWN/.test(user)) return json(529, { type: 'error', error: { type: 'overloaded_error', message: 'Overloaded' } });
    const out = answer(body.system, user, frontsOf(raw));
    const reply = (stop_reason, content) => json(200, { id: 'msg_test', type: 'message', role: 'assistant', model: body.model, stop_reason, content, usage: { input_tokens: 1, output_tokens: 1 } });
    if (!out) return reply('refusal', []);
    // thinking is on by default: the answer comes after a thinking block with no text in it
    reply('end_turn', [{ type: 'thinking', thinking: '', signature: 'sig' }, { type: 'text', text: /MALFORMED/.test(user) ? MALFORMED : written(out) }]);
  });
}

// POST /v1beta/interactions: a judge call (response_format with a schema) or a recording to write down (an audio part).
//   schema: false  refuses response_format with 400
export function mockGemini(port, { key = 'gemini-test-key-0001', schema = true } = {}) {
  const state = { seen: [], schema };
  return serve(port, state, ({ req, raw, body, json }) => {
    if (req.url !== '/v1beta/interactions' || req.method !== 'POST') return json(404, { error: { code: 404, message: 'Not found', status: 'NOT_FOUND' } });
    if (req.headers['x-goog-api-key'] !== key) return json(403, { error: { code: 403, message: `API key not valid: ${req.headers['x-goog-api-key']}. Please pass a valid API key.`, status: 'PERMISSION_DENIED' } });
    state.seen.push({ path: req.url, key: req.headers['x-goog-api-key'], revision: req.headers['api-revision'], auth: req.headers.authorization, body });
    const done = text => json(200, { id: 'v1_test', object: 'interaction', model: body.model, status: 'completed', steps: [{ type: 'thought', summary: [] }, { type: 'model_output', content: [{ type: 'text', text }] }], usage: { total_tokens: 2 } });
    if (Array.isArray(body.input)) return body.input.some(p => p.type === 'audio' && p.data && p.mime_type) ? done(' I failed my exam. ') : json(400, { error: { code: 400, message: 'no audio part' } });
    if (body.response_format && !state.schema) return json(400, { error: { code: 400, message: 'response_format is not supported by this model', status: 'INVALID_ARGUMENT' } });
    const user = reportOf(body.input);
    if (/PROVIDER_DOWN/.test(user)) return json(503, { error: { code: 503, message: 'The model is overloaded.' } });
    const out = answer(body.system_instruction, user, frontsOf(raw));
    if (!out) return json(200, { id: 'v1_test', model: body.model, status: 'failed', steps: [], errors: [{ code: 'blocked', message: 'The request was blocked.' }] });
    done(/MALFORMED/.test(user) ? MALFORMED : written(out));
  });
}
