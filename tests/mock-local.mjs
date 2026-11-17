// Stand-ins for model servers on the owner's own machine, spoken to through the OpenAI-compatible API. Each records
// what it was sent. They answer as ./mock-openai.mjs does (the same stand-in model), and differ in what they accept:
//   kind 'schema'  GET /v1/models (llama.cpp-shaped: owned_by "llamacpp", meta.size, meta.n_params), strict json_schema,
//                  timings.predicted_per_second in the answer
//   kind 'object'  /v1/models; refuses response_format json_schema with 400, does JSON mode (json_object)
//   kind 'prose'   /v1/models; refuses any response_format with 400, and answers in prose: a <think> block, a sentence
//                  and a fenced JSON block
//   kind 'ollama'  no /v1/models (404, as an older build); GET /api/tags with sizes and quantisation; POST /api/chat
//                  (format, options.num_ctx, keep_alive, eval_count/eval_duration) beside /v1/chat/completions
//   kind 'speech'  POST /v1/audio/transcriptions only, with a model list of its own
// A model that is not in `models` is answered as Ollama does: 404, "model "x" not found, try pulling it first".
// Magic words in the report, on top of mock-openai's: SLOPPY (an answer that needs mending: numbers as strings, out of
// range, a fixed choice in the wrong case, keys nobody asked for), FIXME (the first answer lacks "summary"; once told
// what was wrong, the model answers properly), HOPELESS (never JSON at all). `garbage: true` on the returned object makes
// every answer prose with no JSON in it, the connection test's included.
import http from 'node:http';
import { answer, reportOf, frontsOf } from './mock-openai.mjs';

export function mockLocal(port, { kind = 'schema', models = ['qwen3:4b', 'llama3.2:latest'], key = null } = {}) {
  const state = { seen: [], kind, models };
  const server = http.createServer((req, res) => {
    const chunks = []; req.on('data', c => chunks.push(c)); req.on('end', () => {
      const raw = Buffer.concat(chunks); const url = req.url.split('?')[0];
      res.setHeader('content-type', 'application/json');
      const json = (status, body) => { res.statusCode = status; res.end(JSON.stringify(body)); };
      let body = null; try { body = JSON.parse(raw.toString()); } catch { /* multipart or empty */ }
      state.seen.push({ method: req.method, path: url, auth: req.headers.authorization, body, raw });
      if (key && req.headers.authorization !== `Bearer ${key}`) return json(401, { error: { message: 'Invalid API key' } });
      const k = state.kind, list = state.models;
      if (req.method === 'GET' && url === '/v1/models') {
        if (k === 'ollama') return json(404, { error: '404 page not found' });
        return json(200, { object: 'list', data: list.map(id => k === 'schema' ? { id, object: 'model', owned_by: 'llamacpp', meta: { size: 2497280000, n_params: 4020000000 } } : { id, object: 'model', owned_by: 'organization_owner' }) });
      }
      if (req.method === 'GET' && url === '/api/tags' && k === 'ollama') return json(200, { models: list.map(name => ({ name, model: name, size: 2019393189, details: { format: 'gguf', family: 'llama', parameter_size: '3.2B', quantization_level: 'Q4_K_M' } })) });
      if (k === 'speech') {
        if (url === '/v1/audio/transcriptions' && req.method === 'POST') {
          const model = /name="model"\r\n\r\n([^\r]*)/.exec(raw.toString('latin1'))?.[1];
          if (!list.includes(model)) return json(404, { detail: `Model '${model}' is not installed locally.` });
          return json(200, { text: ' I failed my exam. ' });
        }
        return json(404, { detail: 'Not Found' });
      }
      const chat = url === '/v1/chat/completions' || (url === '/api/chat' && k === 'ollama');
      if (!chat || req.method !== 'POST' || !body) return json(404, { error: 'not found' });
      const known = list.some(m => m === body.model || m === `${body.model}:latest`);
      if (!known) return json(404, { error: { message: `model "${body.model}" not found, try pulling it first`, type: 'api_error' } });
      const rf = body.response_format;
      if (k === 'object' && rf?.type === 'json_schema') return json(400, { error: { message: 'invalid response_format: json_schema is not supported' } });
      if (k === 'prose' && rf) return json(400, { error: { message: "'response_format' is not supported by this server" } });
      const msgs = body.messages, sys = msgs[0].content, user = reportOf(msgs[1].content), told = msgs.length > 2;
      let out = answer(sys, user, frontsOf(raw));
      if (/SLOPPY/.test(user) && out?.items) out = { ...out, mood: 'grim', items: out.items.map((x, i) => ({ ...x, severity: i ? 9 : String(x.severity), outcome: x.outcome.toUpperCase(), confidence: 0.9 })) };
      if (/FIXME/.test(user) && !told) { const { summary, ...rest } = out; out = rest; }
      let text = /HOPELESS/.test(user) || state.garbage ? 'I am sorry, I cannot do that in JSON.' : JSON.stringify(out);
      if (k === 'prose' && !state.garbage) text = `<think>\nThe user wants JSON. Something like {"draft": true} maybe.\n</think>\nHere is the report you asked for:\n\n\`\`\`json\n${JSON.stringify(out, null, 2)}\n\`\`\`\nLet me know if you need anything else.`;
      if (url === '/api/chat') return json(200, { model: body.model, message: { role: 'assistant', content: text }, done: true, done_reason: 'stop', eval_count: 40, eval_duration: 2e9 });
      return json(200, { choices: [{ index: 0, finish_reason: 'stop', message: { role: 'assistant', content: text } }], usage: { completion_tokens: 40 }, ...(k === 'schema' ? { timings: { predicted_per_second: 31.25 } } : {}) });
    });
  });
  return new Promise(r => server.listen(port, '127.0.0.1', () => r(Object.assign(state, { port, close: () => { server.closeAllConnections?.(); server.close(); } }))));
}
