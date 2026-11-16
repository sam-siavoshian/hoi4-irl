// A stand-in for an OpenAI-compatible provider used by the tests. Records what it was sent.
// Serves the Responses API, Chat Completions and transcription.
//   key:  the bearer key it insists on; null = a keyless local server (Ollama, LM Studio) that accepts anything
//   chat: 'schema' answers response_format json_schema; 'object' rejects json_schema with 400 and only does json_object
// "river patrol" in the text is answered on the first and sixth of whatever fronts the request's schema offers (any scenario).
// Magic words in the user's text: REFUSE (the model declines), PROVIDER_DOWN (500), HANG (never answers), BADSHAPE (wrong JSON).
import http from 'node:http';
export function mockOpenAI(port, { key = 'sk-test-key', chat = 'schema' } = {}) {
  const seen = []; const state = { seen, chat };
  const it = (front, outcome, severity, action, headline, days_ago = 0) => ({ front, outcome, severity, reason: 'because of what was said', action, headline, days_ago });
  const answer = (sys, user, fronts = []) => /chief of staff in/.test(sys) ? { assessment: 'School is bleeding; the startup carries the war.', orders: [{ front: 'afg', order: 'Two hours on the problem set tonight.' }] }
    : /REFUSE/.test(user) ? null
    : /BADSHAPE/.test(user) ? { nope: 1 }
    : /failing this class/.test(user) ? { summary: 'A hard day in the east.', items: [it('afg', 'loss', 4, 'enemy_breakthrough', 'Failing the class', 1), it('cau', 'loss', 2, 'enemy_cas', 'Fight with mother'), it('tur', 'win', 2, 'offensive', 'Guitar practice went great')] }
    : /river patrol/.test(user) ? { summary: 'The river is ours; the squadron is not.', items: [it(fronts[0], 'win', 4, 'breakthrough', 'Thesis chapter finished'), it(fronts[5], 'loss', 3, 'naval_defeat', 'Friends cancelled again')] }
    : /dentist/.test(user) ? { summary: 'Nothing to report.', items: [] }
    : /failed my exam/.test(user) ? { summary: 'The line bends.', items: [it('afg', 'loss', 3, 'enemy_offensive', 'Exam failed')] }
    : { summary: 'The Mesopotamian Front has broken open.', items: [it('irq', 'win', 5, 'breakthrough', 'Seed round closed'), it('glf', 'loss', 4, 'port_strike', 'Missed the flight')] };
  const server = http.createServer((req, res) => {
    const chunks = []; req.on('data', c => chunks.push(c)); req.on('end', () => {
      const raw = Buffer.concat(chunks); const rec = { path: req.url, auth: req.headers.authorization, type: req.headers['content-type'], raw };
      res.setHeader('content-type', 'application/json');
      const json = (status, body) => { res.statusCode = status; res.end(JSON.stringify(body)); };
      if (key && req.headers.authorization !== `Bearer ${key}`) return json(401, { error: { message: 'bad key' } });
      if (req.url === '/v1/responses' || req.url === '/v1/chat/completions') {
        rec.body = JSON.parse(raw.toString()); seen.push(rec);
        const msgs = rec.body.input || rec.body.messages; const sys = msgs[0].content;
        const user = msgs[1].content.match(/"""\n([\s\S]*?)\n"""\s*$/)?.[1] ?? msgs[1].content; // the report itself, not the earlier dispatches quoted for continuity
        if (/HANG/.test(user)) return; // never answers
        if (/PROVIDER_DOWN/.test(user)) return json(500, { error: { message: 'upstream exploded' } });
        const out = answer(sys, user, JSON.parse(/"front":\{"type":"string","enum":(\[[^\]]*\])/.exec(raw.toString())?.[1] || '[]'));
        if (req.url === '/v1/responses') return json(200, { status: 'completed', output: [{ type: 'reasoning', summary: [] }, { type: 'message', content: [out ? { type: 'output_text', text: JSON.stringify(out) } : { type: 'refusal', refusal: 'no' }] }] });
        const rf = rec.body.response_format;
        if (state.chat === 'object' && rf?.type === 'json_schema') return json(400, { error: 'invalid response_format: json_schema is not supported by this model' }); // Ollama-style error body
        if (!out) return json(200, { choices: [{ index: 0, finish_reason: 'stop', message: { role: 'assistant', content: null, refusal: 'no' } }] });
        // a small local model in json_object mode likes to wrap its answer in a fence
        const content = rf?.type === 'json_object' ? 'Here you go:\n```json\n' + JSON.stringify(out, null, 1) + '\n```' : JSON.stringify(out);
        return json(200, { choices: [{ index: 0, finish_reason: 'stop', message: { role: 'assistant', content } }] });
      }
      if (req.url === '/v1/audio/transcriptions') { seen.push(rec); return json(200, { text: ' I failed my exam. ', languages: [{ code: 'en' }] }); }
      json(404, {});
    });
  });
  return new Promise(r => server.listen(port, '127.0.0.1', () => r(Object.assign(state, { close: () => { server.closeAllConnections?.(); server.close(); } }))));
}
