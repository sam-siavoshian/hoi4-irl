// A stand-in for api.openai.com used by the tests. Records what it was sent.
import http from 'node:http';
export function mockOpenAI(port) {
  const seen = [];
  const server = http.createServer((req, res) => {
    const chunks = []; req.on('data', c => chunks.push(c)); req.on('end', () => {
      const raw = Buffer.concat(chunks); const rec = { path: req.url, auth: req.headers.authorization, type: req.headers['content-type'], raw };
      res.setHeader('content-type', 'application/json');
      if (req.headers.authorization !== 'Bearer sk-test-key') { res.statusCode = 401; return res.end(JSON.stringify({ error: { message: 'bad key' } })); }
      if (req.url === '/v1/responses') {
        rec.body = JSON.parse(raw.toString()); seen.push(rec);
        const sys = rec.body.input[0].content, user = rec.body.input[1].content;
        const it = (front, outcome, severity, action, headline, days_ago = 0) => ({ front, outcome, severity, reason: 'because of what was said', action, headline, days_ago });
        const out = /chief of staff in/.test(sys) ? { assessment: 'School is bleeding; the startup carries the war.', orders: [{ front: 'afg', order: 'Two hours on the problem set tonight.' }] }
          : /REFUSE/.test(user) ? null
          : /failing this class/.test(user) ? { summary: 'A hard day in the east.', items: [it('afg', 'loss', 4, 'enemy_breakthrough', 'Failing the class', 1), it('cau', 'loss', 2, 'enemy_cas', 'Fight with mother'), it('tur', 'win', 2, 'offensive', 'Guitar practice went great')] }
          : /dentist/.test(user) ? { summary: 'Nothing to report.', items: [] }
          : /failed my exam/.test(user) ? { summary: 'The line bends.', items: [it('afg', 'loss', 3, 'enemy_offensive', 'Exam failed')] }
          : { summary: 'The Mesopotamian Front has broken open.', items: [it('irq', 'win', 5, 'breakthrough', 'Seed round closed'), it('glf', 'loss', 4, 'port_strike', 'Missed the flight')] };
        return res.end(JSON.stringify({ status: 'completed', output: [{ type: 'reasoning', summary: [] }, { type: 'message', content: [out ? { type: 'output_text', text: JSON.stringify(out) } : { type: 'refusal', refusal: 'no' }] }] }));
      }
      if (req.url === '/v1/audio/transcriptions') { seen.push(rec); return res.end(JSON.stringify({ text: ' I failed my exam. ', languages: [{ code: 'en' }] })); }
      res.statusCode = 404; res.end('{}');
    });
  });
  return new Promise(r => server.listen(port, '127.0.0.1', () => r({ seen, close: () => server.close() })));
}
