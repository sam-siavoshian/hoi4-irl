// Share-card checks in headless Chromium. Run: node tests/share.e2e.mjs
// Renders every variant on tools/share-demo.html, checks sizes, ink, text layout and the share fallback,
// and writes full-size PNGs to tests/shots/share-*.png.
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const PORT = 8152, URL_ = `http://localhost:${PORT}/tools/share-demo.html`;
const shots = new URL('./shots/', import.meta.url).pathname; fs.mkdirSync(shots, { recursive: true });
for (const f of fs.readdirSync(shots)) if (/^share-.*\.png$/.test(f)) fs.rmSync(shots + f);
const server = spawn('node', ['tools/serve.mjs'], { cwd: new URL('..', import.meta.url).pathname, env: { ...process.env, PORT }, stdio: 'ignore' });
await new Promise(r => setTimeout(r, 600));
const browser = await chromium.launch();
const errors = []; let passed = 0;
const step = async (name, fn) => { try { await fn(); passed++; console.log('  ✓', name); } catch (e) { errors.push(`${name}: ${e.message}`); console.log('  ✗', name, '\n    ', e.message.split('\n').slice(0, 4).join(' | ')); } };
const SIZE = { bulletin: [1080, 1350], frontpage: [1080, 1350], recap: [1080, 1920], rankup: [1080, 1080] };
const hit = (a, b, t = 1.5) => a.x + t < b.x + b.w && b.x + t < a.x + a.w && a.y + t < b.y + b.h && b.y + t < a.y + a.h;

try {
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 1000 }, deviceScaleFactor: 2, acceptDownloads: true, permissions: ['clipboard-read', 'clipboard-write'] });
  const page = await ctx.newPage(); const pageErrors = [];
  page.on('pageerror', e => pageErrors.push(e.message)); page.on('console', m => { if (m.type() === 'error') pageErrors.push(m.text()); });
  await page.goto(URL_); await page.waitForFunction(() => window.__share?.ready || window.__share?.error, null, { timeout: 30000 });

  await step('demo page loads with no errors', async () => {
    assert.equal(await page.evaluate(() => window.__share.error || null), null);
    assert.deepEqual(pageErrors, []);
  });

  const cards = await page.evaluate(() => Object.entries(window.__share.cards).map(([id, c]) => {
    const cv = c.canvas, x = cv.getContext('2d'), seen = new Set(); let lum = 0, n = 0;
    for (let i = 0; i < 40; i++) for (let j = 0; j < 40; j++) { const d = x.getImageData(Math.floor((i + 0.5) * cv.width / 40), Math.floor((j + 0.5) * cv.height / 40), 1, 1).data; seen.add((d[0] >> 3) + ',' + (d[1] >> 3) + ',' + (d[2] >> 3)); lum += d[0] + d[1] + d[2]; n++; if (d[3] !== 255) seen.add('transparent!'); }
    return { id, w: cv.width, h: cv.height, colours: seen.size, transparent: seen.has('transparent!'), lum: lum / n / 3, boxes: cv._textBoxes };
  }));

  await step('every variant is rendered', async () => {
    for (const kind of Object.keys(SIZE)) assert.ok(cards.filter(c => c.id.startsWith(kind + '-')).length >= 4, `${kind} variants`);
    for (const kind of Object.keys(SIZE)) assert.ok(cards.some(c => c.id === `${kind}-empty`), `${kind} renders with empty data`);
  });
  await step('exact pixel sizes regardless of devicePixelRatio (page runs at 2x)', async () => {
    for (const c of cards) assert.deepEqual([c.w, c.h], SIZE[c.id.split('-')[0]], c.id);
  });
  await step('no card is blank or transparent', async () => {
    for (const c of cards) { assert.ok(c.colours >= 24, `${c.id}: only ${c.colours} distinct sampled colours`); assert.ok(!c.transparent, `${c.id} has transparent pixels`); }
    for (const c of cards) { if (c.id.startsWith('frontpage')) assert.ok(c.lum > 120, `${c.id} should be light paper (${c.lum | 0})`); else assert.ok(c.lum < 90, `${c.id} should be dark (${c.lum | 0})`); }
  });
  await step('all text stays inside the canvas', async () => {
    for (const c of cards) {
      assert.ok(c.boxes.length >= 3, `${c.id}: text boxes recorded`);
      for (const b of c.boxes) assert.ok(b.x >= -1 && b.y >= -1 && b.x + b.w <= c.w + 1 && b.y + b.h <= c.h + 1 && b.w > 0, `${c.id}: "${b.text}" (${b.role}) at ${[b.x, b.y, b.w, b.h].map(Math.round)}`);
    }
  });
  await step('text respects the page margins', async () => {
    for (const c of cards) { const m = 48; for (const b of c.boxes) assert.ok(b.x >= m - 1 && b.x + b.w <= c.w - m + 1, `${c.id}: "${b.text}" (${b.role}) breaks the ${m}px margin: x ${Math.round(b.x)}..${Math.round(b.x + b.w)}`); }
  });
  await step('headlines never collide with stats, and no two pieces of text overlap', async () => {
    for (const c of cards) {
      const heads = c.boxes.filter(b => b.role === 'headline'), stats = c.boxes.filter(b => b.role.startsWith('stat'));
      assert.ok(heads.length >= 1 && heads.length <= 3, `${c.id}: ${heads.length} headline lines`);
      for (const h of heads) for (const s of stats) assert.ok(!hit(h, s, 0), `${c.id}: headline "${h.text}" hits stat "${s.text}"`);
      for (let i = 0; i < c.boxes.length; i++) for (let j = i + 1; j < c.boxes.length; j++) assert.ok(!hit(c.boxes[i], c.boxes[j]), `${c.id}: "${c.boxes[i].text}" (${c.boxes[i].role}) overlaps "${c.boxes[j].text}" (${c.boxes[j].role})`);
    }
  });
  await step('long text is cut with an ellipsis, ordinary text is not', async () => {
    const by = id => cards.find(c => c.id === id);
    for (const id of ['bulletin-long', 'frontpage-dense']) { const h = by(id).boxes.filter(b => b.role === 'headline'), last = h[h.length - 1]; assert.ok(h.length >= 2 && h.length <= 3, id); assert.ok(last.text.endsWith('…') && last.clipped, `${id}: "${last.text}"`); }
    for (const id of ['bulletin-bad', 'bulletin-good', 'bulletin-gold', 'frontpage-bad', 'frontpage-gold', 'frontpage-good', 'recap-typical', 'rankup-rank', 'rankup-medal']) for (const b of by(id).boxes) assert.ok(!b.clipped && !b.text.includes('…'), `${id}: "${b.text}" (${b.role}) was cut`);
    const long = by('bulletin-long').boxes; assert.ok(long.filter(b => b.role === 'front-label').some(b => b.text.endsWith('…')), 'long front labels truncate');
    assert.equal(long.filter(b => b.role === 'front-label').length, 7);
  });
  await step('the cards carry what they were given', async () => {
    const texts = id => cards.find(c => c.id === id).boxes.map(b => b.text).join(' | ');
    assert.match(texts('bulletin-bad'), /Zabol has fallen/); assert.match(texts('bulletin-bad'), /53%/); assert.match(texts('bulletin-bad'), /Sarvan/); assert.match(texts('bulletin-bad'), /Self/);
    assert.match(texts('frontpage-bad'), /ZABOL HAS \| FALLEN|ZABOL HAS FALLEN/); assert.match(texts('frontpage-bad'), /THE ARMY GAZETTE/); assert.match(texts('frontpage-bad'), /1405/); assert.match(texts('frontpage-bad'), /garrison/);
    assert.match(texts('recap-typical'), /9–15 November/); assert.match(texts('recap-typical'), /\+420/); assert.match(texts('recap-typical'), /Khanaqin/); assert.match(texts('recap-typical'), /Rakhsh/);
    assert.match(texts('rankup-rank'), /Sarhang/); assert.match(texts('rankup-rank'), /Colonel/); assert.match(texts('rankup-rank'), /104-day streak/);
  });
  await step('tones change the picture', async () => {
    const px = await page.evaluate(() => { const { api, map } = window.__share; return ['good', 'bad', 'gold'].map(tone => { const d = api.renderBulletin({ map, headline: 'Tone', tone }).getContext('2d').getImageData(540, 3, 1, 1).data; return [d[0], d[1], d[2]]; }); });
    assert.ok(px[0][1] > px[0][0], 'good is green'); assert.ok(px[1][0] > px[1][1] + 40, 'bad is red'); assert.ok(px[2][0] > 180 && px[2][1] > 140 && px[2][2] < 140, 'gold is gold');
  });
  await step('renderers are deterministic and do not need a map', async () => {
    const same = await page.evaluate(() => { const { api } = window.__share; const d = { headline: 'Same twice', tone: 'bad', body: ['One short paragraph.'], sidebar: ['A line'] }; return api.renderFrontPage(d).toDataURL() === api.renderFrontPage(d).toDataURL(); });
    assert.ok(same);
  });
  await step('fitText and wrapLines', async () => {
    const r = await page.evaluate(() => {
      const { fitText, wrapLines } = window.__share.api, x = document.createElement('canvas').getContext('2d'); x.font = '700 40px Georgia, serif';
      const big = fitText(x, 'Zabol', 600, 120, 20), wBig = x.measureText('Zabol').width, fontAfter = x.font;
      const small = fitText(x, 'An extremely long headline that cannot possibly fit on a single line', 600, 120, 20), wSmall = x.measureText('An extremely long headline that cannot possibly fit on a single line').width;
      const floor = fitText(x, 'x'.repeat(400), 100, 120, 20);
      x.font = '400 30px Georgia, serif';
      const text = 'The quick brown fox jumps over the lazy dog and keeps running east', lines = wrapLines(x, text, 300);
      const widths = lines.map(l => x.measureText(l).width), brk = wrapLines(x, 'Supercalifragilisticexpialidociousandthensome word', 200);
      return { big, wBig, fontAfter, small, wSmall, floor, lines, widths, joined: lines.join(' ') === text, brk, brkW: brk.map(l => x.measureText(l).width), empty: wrapLines(x, '', 300), one: wrapLines(x, 'Hi', 300), nl: wrapLines(x, 'a\nb', 300) };
    });
    assert.equal(r.big, 120); assert.ok(r.wBig <= 600); assert.match(r.fontAfter, /120px/);
    assert.ok(r.small < 120 && r.small >= 20 && (r.wSmall <= 600 || r.small === 20), `fitted ${r.small}px, ${r.wSmall}px wide`); // shrinks to fit, or stops at the floor (how wide the floor is depends on the system's fonts)
    assert.equal(r.floor, 20);
    assert.ok(r.lines.length >= 3 && r.joined, 'wraps without losing or hyphenating words'); assert.ok(r.widths.every(w => w <= 300));
    assert.ok(r.brk.length >= 3 && r.brkW.every(w => w <= 200) && r.brk.join('').replace(/\s/g, '') === 'Supercalifragilisticexpialidociousandthensomeword' && !r.brk.join('').includes('-'), 'over-long words split by character');
    assert.deepEqual(r.empty, []); assert.deepEqual(r.one, ['Hi']); assert.deepEqual(r.nl, ['a', 'b']);
  });
  await step('shareCanvas falls back to a download and copies the text', async () => {
    await page.evaluate(() => { Object.defineProperty(navigator, 'canShare', { value: undefined, configurable: true }); });
    const [download, result] = await Promise.all([page.waitForEvent('download', { timeout: 10000 }), page.evaluate(() => window.__share.api.shareCanvas(window.__share.cards['rankup-rank'].canvas, { filename: 'homefront-test.png', text: 'copied sitrep' }))]);
    assert.equal(result, 'downloaded'); assert.equal(download.suggestedFilename(), 'homefront-test.png');
    const file = await download.path(), buf = fs.readFileSync(file); assert.equal(buf.subarray(1, 4).toString(), 'PNG'); assert.equal(buf.readUInt32BE(16), 1080); assert.equal(buf.readUInt32BE(20), 1080);
    assert.equal(await page.evaluate(() => navigator.clipboard.readText()), 'copied sitrep');
  });
  await step('the Share button on the demo page works', async () => {
    const [download] = await Promise.all([page.waitForEvent('download', { timeout: 10000 }), page.click('button[data-share="bulletin-bad"]')]);
    assert.equal(download.suggestedFilename(), 'homefront-bulletin-bad.png');
  });
  await step('shareCanvas uses the share sheet when it can, reports a cancel, and never throws', async () => {
    const r = await page.evaluate(async () => {
      const { api, cards } = window.__share, cv = cards['rankup-rank'].canvas, calls = [];
      Object.defineProperty(navigator, 'canShare', { value: d => !!d.files?.length, configurable: true });
      Object.defineProperty(navigator, 'share', { value: async d => { calls.push({ n: d.files.length, type: d.files[0].type, name: d.files[0].name, text: d.text }); }, configurable: true });
      const shared = await api.shareCanvas(cv, { filename: 'a', text: 'hello' });
      Object.defineProperty(navigator, 'share', { value: async () => { throw new DOMException('no', 'AbortError'); }, configurable: true });
      const cancelled = await api.shareCanvas(cv, { filename: 'a.png' });
      const broken = await api.shareCanvas({ toBlob() { throw new Error('boom'); } }, {}), nothing = await api.shareCanvas(null);
      return { shared, calls, cancelled, broken, nothing };
    });
    assert.equal(r.shared, 'shared'); assert.deepEqual(r.calls, [{ n: 1, type: 'image/png', name: 'a.png', text: 'hello' }]);
    assert.equal(r.cancelled, 'cancelled'); assert.equal(r.broken, 'cancelled'); assert.equal(r.nothing, 'cancelled');
  });
  await step('full-size PNGs saved to tests/shots', async () => {
    for (const c of cards) { const url = await page.evaluate(id => window.__share.cards[id].canvas.toDataURL('image/png'), c.id); fs.writeFileSync(`${shots}share-${c.id}.png`, Buffer.from(url.split(',')[1], 'base64')); }
    await page.setViewportSize({ width: 1400, height: 1000 }); await page.screenshot({ path: `${shots}share-demo-page.png`, fullPage: true });
    assert.ok(fs.statSync(`${shots}share-bulletin-bad.png`).size > 50000);
  });
  await step('still no page errors', async () => assert.deepEqual(pageErrors, []));
} finally {
  await browser.close(); server.kill();
}
console.log(errors.length ? `\n${errors.length} failed, ${passed} passed` : `\nAll ${passed} share checks passed`);
if (errors.length) { console.log(errors.join('\n')); process.exit(1); }
