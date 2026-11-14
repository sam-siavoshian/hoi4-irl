// End-to-end checks in headless Chromium at iPhone size. Run: npm run test:e2e
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
const { chromium, devices } = require('playwright');
const PORT = 8123, URL_ = `http://localhost:${PORT}/`;
const shots = new URL('./shots/', import.meta.url).pathname; fs.mkdirSync(shots, { recursive: true });
const server = spawn('node', ['tools/serve.mjs'], { env: { ...process.env, PORT }, stdio: 'ignore' });
await new Promise(r => setTimeout(r, 700));
const browser = await chromium.launch();
const errors = [];
let passed = 0;
const step = async (name, fn) => { try { await fn(); passed++; console.log('  ✓', name); } catch (e) { errors.push(`${name}: ${e.message}`); console.log('  ✗', name, '\n    ', e.message.split('\n')[0]); } };
const st = p => p.evaluate(() => { const s = window.__artesh.st; return { fronts: s.fronts, log: s.log.length, occ: s.terr.occ.size, lib: s.terr.lib.size, divs: s.divisions.length, nation: s.nation }; });

async function open(opts = {}) {
  const ctx = await browser.newContext({ ...devices['iPhone 14 Pro'], permissions: ['clipboard-read', 'clipboard-write'], ...opts });
  const p = await ctx.newPage();
  p.on('pageerror', e => errors.push('pageerror: ' + e.message));
  p.on('console', m => { if (m.type() === 'error' && !/favicon|Failed to load resource/.test(m.text())) errors.push('console: ' + m.text()); });
  return { ctx, p };
}
const ready = p => p.waitForFunction(() => window.__artesh?.st);

try {
  let { ctx, p } = await open();
  await p.goto(URL_); await ready(p);

  await step('first run shows onboarding and lets you rename a front', async () => {
    assert.equal(await p.textContent('#sheet-title'), 'Welcome, Commander');
    await p.fill('input[data-id=tur]', 'Guitar');
    await p.click('[data-act=close]');
    assert.ok(await p.isHidden('#sheet'));
    assert.equal(await p.evaluate(() => window.__artesh.data.labels.tur), 'Guitar');
  });
  await p.screenshot({ path: shots + '01-fresh.png' });

  await step('report → offline classification → review → commit moves the fronts', async () => {
    await p.click('#nav .report');
    await p.fill('#rtext', "School is bad, I'm failing this class. I had a fight with my mother. Guitar practice went great today.");
    await p.click('[data-act=analyse]');
    await p.waitForSelector('[data-act=commit]');
    assert.equal(await p.locator('.item').count(), 3);
    await p.screenshot({ path: shots + '02-review.png' });
    await p.click('.item >> nth=0 >> [data-act=sev][data-n="5"]');
    await p.click('[data-act=commit]');
    await p.waitForTimeout(400);
    const s = await st(p);
    assert.ok(s.fronts.afg.pos > 4, 'afghan front pushed in'); assert.ok(s.fronts.cau.pos > 0); assert.ok(s.fronts.tur.pos < 0); assert.ok(s.occ > 0); assert.equal(s.log, 1);
    assert.ok(await p.isVisible('#banner'));
  });
  await p.waitForTimeout(1200); await p.screenshot({ path: shots + '03-after-report.png' });

  await step('state persists across reload', async () => {
    const a = await st(p); await p.reload(); await ready(p); const b = await st(p);
    assert.equal(b.log, 1); assert.equal(Math.round(a.fronts.afg.pos * 10), Math.round(b.fronts.afg.pos * 10)); assert.ok(await p.isHidden('#sheet'));
  });

  await step('fronts list, front detail and war log render', async () => {
    await p.click('#nav [data-sheet=fronts]'); assert.equal(await p.locator('#sheet .card').count(), 7);
    await p.click('.card[data-arg=afg]'); assert.match(await p.textContent('#sheet-body'), /Our forces/); assert.match(await p.textContent('#sheet-body'), /School/);
    await p.screenshot({ path: shots + '04-front.png' });
    await p.click('#nav [data-sheet=log]'); assert.equal(await p.locator('.entry').count(), 1);
    await p.click('[data-act=rawlog]'); assert.match(await p.textContent('.raw'), /failing this class/);
    await p.screenshot({ path: shots + '05-log.png' });
  });

  await step('forces tabs render', async () => {
    await p.click('#nav [data-sheet=forces]');
    for (const t of ['air', 'navy', 'industry', 'army']) { await p.click(`[data-tab=${t}]`); assert.ok((await p.textContent('#sheet-body')).length > 200); }
    assert.ok(await p.locator('.unit img').count() >= 20);
  });

  await step('tapping the map opens a province; map modes switch', async () => {
    await p.click('#sheet .x');
    await p.evaluate(() => { const a = window.__artesh; const t = a.map.provinces[a.map.tehran]; a.view.flyTo(t.c[0], t.c[1] + 40, 1.2, false); });
    await p.waitForTimeout(200);
    const pt = await p.evaluate(() => { const a = window.__artesh; const q = a.map.provinces.find(x => x.n === 'Qom'); const [x, y] = a.view.toScreen(q.c[0], q.c[1]); const r = document.querySelector('#over').getBoundingClientRect(); return [r.left + x, r.top + y]; });
    await p.mouse.click(pt[0], pt[1]);
    await p.waitForSelector('#sheet:not([hidden])'); assert.equal(await p.textContent('#sheet-title'), 'Qom');
    await p.click('#sheet .x');
    for (const m of ['life', 'infra', 'supply', 'air', 'terrain', 'political']) { await p.click(`[data-mode=${m}]`); await p.waitForTimeout(120); if (m !== 'political') await p.screenshot({ path: `${shots}06-mode-${m}.png` }); }
    await p.click('[data-mode=empire]'); await p.waitForTimeout(900); await p.screenshot({ path: shots + '07-empire.png' }); await p.click('[data-mode=empire]'); await p.click('[data-act=home]');
  });

  await step('deleting a dispatch rewinds the war', async () => {
    await p.click('#nav [data-sheet=log]'); p.once('dialog', d => d.accept()); await p.click('[data-act=delreport]'); await p.waitForTimeout(200);
    const s = await st(p); assert.equal(s.log, 0); assert.equal(s.fronts.afg.pos, 0); assert.equal(s.occ, 0);
    await p.click('#sheet .x');
  });

  await step('Claude path: key in settings → API called from the browser → items applied', async () => {
    let body;
    await p.route('https://api.anthropic.com/v1/messages', async route => {
      body = JSON.parse(route.request().postData()); const h = route.request().headers();
      assert.equal(h['x-api-key'], 'sk-ant-test'); assert.equal(h['anthropic-dangerous-direct-browser-access'], 'true');
      await route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ stop_reason: 'end_turn', content: [{ type: 'text', text: JSON.stringify({ summary: 'The Mesopotamian Front has broken open.', items: [{ front: 'irq', outcome: 'win', severity: 5, action: 'breakthrough', headline: 'Seed round closed — armour reaches Baghdad road' }, { front: 'glf', outcome: 'loss', severity: 4, action: 'port_strike', headline: 'Missed the flight — Bushehr bombed' }] }) }] }) });
    });
    await p.click('#nav [data-sheet=more]'); await p.click('[data-sheet=settings]'); await p.fill('[data-bind="set.apiKey"]', 'sk-ant-test'); await p.click('#sheet .x');
    await p.click('#nav .report'); await p.fill('#rtext', 'We closed the seed round! But I missed my flight home.'); await p.click('[data-act=analyse]');
    await p.waitForSelector('[data-act=commit]');
    assert.match(body.messages[0].content, /closed the seed round/); assert.match(body.system, /Guitar/); assert.equal(body.model, 'claude-opus-5-5');
    assert.match(await p.inputValue('[data-bind="result.summary"]'), /Mesopotamian/);
    await p.click('[data-act=commit]'); await p.waitForTimeout(400);
    const s = await st(p); assert.ok(s.fronts.irq.pos < -6); assert.ok(s.lib > 0); assert.ok(s.fronts.glf.pos > 0);
    await p.unroute('https://api.anthropic.com/v1/messages');
  });
  await p.waitForTimeout(1300); await p.screenshot({ path: shots + '08-breakthrough.png' });

  await step('situation report can be copied', async () => {
    await p.click('#nav [data-sheet=more]'); await p.click('[data-sheet=sitrep]');
    const t = await p.textContent('#sittext'); assert.match(t, /SITUATION REPORT/); assert.match(t, /Mesopotamian Front \(Startup\)/);
    await p.click('[data-act=copy]'); await p.waitForTimeout(150);
    assert.match(await p.evaluate(() => navigator.clipboard.readText()), /SITUATION REPORT/);
    await p.screenshot({ path: shots + '09-sitrep.png' });
  });

  await step('export → reset → import round-trips', async () => {
    await p.click('#nav [data-sheet=more]'); await p.waitForSelector('[data-act=export]');
    const [dl] = await Promise.all([p.waitForEvent('download'), p.click('[data-act=export]')]);
    const file = shots + 'backup.json'; await dl.saveAs(file);
    const j = JSON.parse(fs.readFileSync(file)); assert.equal(j.reports.length, 1); assert.equal(j.settings.apiKey, '', 'keys are not exported');
    p.once('dialog', d => d.accept()); await p.click('[data-act=reset]'); assert.equal((await st(p)).log, 0);
    await p.setInputFiles('#importfile', file); await p.waitForTimeout(300);
    const s = await st(p); assert.equal(s.log, 1); assert.ok(s.fronts.irq.pos < -6);
    assert.equal(await p.evaluate(() => window.__artesh.data.settings.apiKey), 'sk-ant-test', 'key kept on import');
  });
  await ctx.close();

  // voice: browser speech recognition (mocked engine)
  ({ ctx, p } = await open());
  await p.addInitScript(() => {
    localStorage.setItem('artesh.v1', JSON.stringify({ v: 1, reports: [], labels: {}, settings: {}, onboarded: true }));
    window.SpeechRecognition = window.webkitSpeechRecognition = class { start() { setTimeout(() => { this.onresult({ resultIndex: 0, results: [Object.assign([{ transcript: 'had a great workout at the gym' }], { isFinal: true })] }); }, 80); } stop() { setTimeout(() => this.onend(), 20); } };
  });
  await p.goto(URL_); await ready(p);
  await step('voice: live dictation fills the report box', async () => {
    await p.click('#nav .report'); await p.click('[data-act=mic]'); await p.waitForTimeout(250);
    assert.ok(await p.locator('.mic.live').count()); assert.equal(await p.inputValue('#rtext'), 'had a great workout at the gym');
    await p.screenshot({ path: shots + '10-listening.png' });
    await p.click('[data-act=mic]'); await p.waitForTimeout(150); assert.equal(await p.locator('.mic.live').count(), 0);
    await p.click('[data-act=analyse]'); await p.waitForSelector('[data-act=commit]'); await p.click('[data-act=commit]'); await p.waitForTimeout(300);
    assert.ok((await st(p)).fronts.raj.pos < 0);
  });
  await ctx.close();

  // voice: recorder + ElevenLabs Scribe (fake mic, mocked API)
  const b2 = await chromium.launch({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] });
  const c2 = await b2.newContext({ ...devices['iPhone 14 Pro'] }); p = await c2.newPage();
  p.on('pageerror', e => errors.push('pageerror: ' + e.message));
  await p.addInitScript(() => { localStorage.setItem('artesh.v1', JSON.stringify({ v: 1, reports: [], labels: {}, settings: { elevenKey: 'el-test', voice: 'eleven' }, onboarded: true })); });
  let sttCalled = false;
  await p.route('https://api.elevenlabs.io/v1/speech-to-text', async route => { sttCalled = route.request().headers()['xi-api-key'] === 'el-test' && /multipart\/form-data/.test(route.request().headers()['content-type']); await route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ text: 'I failed my exam.' }) }); });
  await p.goto(URL_); await ready(p);
  await step('voice: recording is transcribed by ElevenLabs Scribe', async () => {
    await p.click('#nav .report'); await p.click('[data-act=mic]'); await p.waitForSelector('.mic.live'); await p.waitForTimeout(1300);
    await p.click('[data-act=mic]'); await p.waitForFunction(() => document.querySelector('#rtext')?.value.includes('failed my exam'), null, { timeout: 8000 });
    assert.ok(sttCalled);
  });
  await b2.close();

  // desktop layout + long campaign
  const c3 = await browser.newContext({ viewport: { width: 1440, height: 860 } }); p = await c3.newPage();
  p.on('pageerror', e => errors.push('pageerror: ' + e.message));
  await p.addInitScript(() => localStorage.setItem('artesh.v1', JSON.stringify({ v: 1, reports: [], labels: {}, settings: {}, onboarded: true })));
  await p.goto(URL_); await ready(p);
  await step('desktop: demo campaign loads and renders', async () => {
    await p.click('#nav [data-sheet=more]'); await p.click('[data-act=demo]'); await p.waitForTimeout(900);
    const s = await st(p); assert.equal(s.log, 8); assert.ok(s.occ > 0 && s.lib > 0);
    await p.screenshot({ path: shots + '11-desktop.png' });
    await p.evaluate(() => { const a = window.__artesh; a.view.flyToFront('irq'); }); await p.waitForTimeout(1000); await p.screenshot({ path: shots + '12-desktop-front.png' });
  });
  await step('catastrophe: Tehran falls; triumph: the empire is restored', async () => {
    await p.evaluate(() => { const a = window.__artesh; a.data.reports = []; const now = Date.now(); for (let i = 0; i < 60; i++) a.commitReport({ id: 'x' + i, ts: now - (60 - i) * 3600e3, text: '', summary: '', items: [{ front: 'tks', outcome: 'loss', severity: 5, action: 'enemy_breakthrough', headline: 'Collapse' }] }); });
    await p.waitForTimeout(500);
    assert.ok(await p.evaluate(() => window.__artesh.st.tehranFallen)); assert.match(await p.textContent('#alerts'), /Tehran has fallen/);
    await p.evaluate(() => window.__artesh.view.home(false)); await p.waitForTimeout(400); await p.screenshot({ path: shots + '13-tehran-fallen.png' });
    await p.evaluate(() => { const a = window.__artesh; a.data.reports = []; const now = Date.now(); for (let i = 0; i < 120; i++) a.commitReport({ id: 'y' + i, ts: now - (120 - i) * 3600e3, text: '', summary: '', items: a.map.fronts.map(f => ({ front: f.id, outcome: 'win', severity: 5, action: 'breakthrough', headline: 'Victory' })) }); });
    await p.waitForTimeout(500);
    assert.equal(await p.textContent('#nation-name'), 'Achaemenid Empire');
    await p.evaluate(() => { const a = window.__artesh; const [x, y] = a.view.proj(50, 33); a.view.flyTo(x, y, a.view.minS, false); }); await p.waitForTimeout(1500); await p.evaluate(() => { const a = window.__artesh; const [x, y] = a.view.proj(50, 33); a.view.flyTo(x, y, a.view.minS, false); }); await p.waitForTimeout(4500); await p.screenshot({ path: shots + '14-empire.png' });
  });
  await c3.close();
} finally { await browser.close(); server.kill(); }
console.log(`\n${passed} passed, ${errors.length} problem(s)`);
if (errors.length) { console.log(errors.join('\n')); process.exit(1); }
