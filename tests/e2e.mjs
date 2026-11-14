// End-to-end checks in headless Chromium at iPhone size. Run: npm run test:e2e
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
const { chromium, devices } = require('playwright');
const PORT = 8123, URL_ = `http://localhost:${PORT}/`;
const shots = new URL('./shots/', import.meta.url).pathname; fs.rmSync(shots, { recursive: true, force: true }); fs.mkdirSync(shots, { recursive: true });
const server = spawn('node', ['tools/serve.mjs'], { env: { ...process.env, PORT }, stdio: 'ignore' });
await new Promise(r => setTimeout(r, 700));
const browser = await chromium.launch();
const errors = []; let passed = 0;
const step = async (name, fn) => { try { await fn(); passed++; console.log('  ✓', name); } catch (e) { errors.push(`${name}: ${e.message}`); console.log('  ✗', name, '\n    ', e.message.split('\n').slice(0, 3).join(' | ')); } };
const st = p => p.evaluate(() => { const s = window.__artesh.live; return { fronts: s.fronts, log: s.log.length, occ: s.terr.occ.size, lib: s.terr.lib.size, focus: s.focus, ach: s.ach, streak: s.dayStreak }; });
const seed = (extra = {}) => `localStorage.setItem('artesh.v1', JSON.stringify(${JSON.stringify({ v: 2, reports: [], labels: {}, notes: {}, off: [], ops: [], settings: {}, onboarded: true, ...extra })}))`;
async function open(opts = {}, init) {
  const ctx = await browser.newContext({ ...devices['iPhone 14 Pro'], permissions: ['clipboard-read', 'clipboard-write'], ...opts });
  const p = await ctx.newPage(); if (init) await p.addInitScript(init);
  p.on('pageerror', e => errors.push('pageerror: ' + e.message));
  p.on('console', m => { if (m.type() === 'error' && !/favicon|Failed to load resource/.test(m.text())) errors.push('console: ' + m.text()); });
  await p.goto(URL_); await p.waitForFunction(() => window.__artesh?.st);
  return { ctx, p };
}
const shot = (p, n) => p.screenshot({ path: `${shots}${n}.png` });
const body = p => p.textContent('#sheet-body');

try {
  let { ctx, p } = await open();
  await step('onboarding lets you rename a front', async () => {
    assert.equal(await p.textContent('#sheet-title'), 'Take command');
    await p.fill('input[data-id=tur]', 'Guitar'); await p.click('[data-act=close]');
    assert.ok(await p.isHidden('#sheet')); assert.equal(await p.evaluate(() => window.__artesh.data.labels.tur), 'Guitar');
  });
  await shot(p, '01-fresh');

  await step('report → judge → confirm → fronts move; events can be dated back', async () => {
    await p.click('#nav .report');
    await p.fill('#rtext', "Yesterday school was bad, I'm failing this class. I had a fight with my mother. Guitar practice went great today.");
    await shot(p, '02-report');
    await p.click('[data-act=analyse]'); await p.waitForSelector('[data-act=commit]');
    assert.equal(await p.locator('.item').count(), 3);
    assert.equal(await p.inputValue('.item >> nth=0 >> [data-bind="item.days_ago"]'), '1');
    await shot(p, '03-confirm');
    await p.click('.item >> nth=0 >> [data-act=sev][data-n="5"]'); await p.click('[data-act=commit]'); await p.waitForTimeout(400);
    const s = await st(p);
    assert.ok(s.fronts.afg.pos > 4); assert.ok(s.fronts.cau.pos > 0); assert.ok(s.fronts.tur.pos < 0); assert.ok(s.occ > 0);
    assert.equal(s.log, 2, 'yesterday and today become two dispatches'); assert.ok(await p.isVisible('#banner')); assert.equal(s.streak, 2);
  });
  await p.waitForTimeout(1300); await shot(p, '04-after-report');

  await step('undo from the toast removes what was just filed', async () => {
    await p.click('#toast [data-act=undo]'); assert.equal((await st(p)).log, 0);
    await p.evaluate(() => { const a = window.__artesh; a.commitReports([{ id: 'k1', ts: Date.now() - 1000, text: 'failing this class', summary: 'S', items: [{ front: 'afg', outcome: 'loss', severity: 4, action: 'enemy_breakthrough', headline: 'Failing the class' }, { front: 'tur', outcome: 'win', severity: 2, action: 'offensive', headline: 'Guitar' }] }], { quiet: true }); });
  });

  await step('persists across reload', async () => { const a = await st(p); await p.reload(); await p.waitForFunction(() => window.__artesh?.st); const b = await st(p); assert.equal(b.log, 1); assert.equal(a.fronts.afg.pos.toFixed(2), b.fronts.afg.pos.toFixed(2)); });

  await step('fronts, front detail, main effort and quick log', async () => {
    await p.click('#nav [data-sheet=fronts]'); assert.equal(await p.locator('#sheet .front').count(), 7); await p.waitForTimeout(350); await shot(p, '05-fronts');
    await p.click('.front[data-arg=afg]'); assert.equal(await p.textContent('#sheet-title'), 'School'); assert.match(await body(p), /Gen\. Dariush Khorasani/); assert.match(await body(p), /Battle of/);
    await shot(p, '06-front');
    await p.waitForTimeout(350); await shot(p, '06-front'); await p.click('[data-act=focus]'); assert.equal((await st(p)).focus, 'afg'); assert.match(await body(p), /Stand down/);
    await p.click('[data-act=quick]'); assert.equal(await p.textContent('#sheet-title'), 'Confirm'); assert.equal(await p.inputValue('[data-bind="item.front"]'), 'afg');
    await p.fill('.item input.hl', 'Handed in the essay'); await p.click('[data-act=commit]'); await p.waitForTimeout(300);
    const s = await st(p); assert.equal(s.fronts.afg.wins, 1); assert.ok(s.ach.first);
  });

  await step('chronicle: calendar, filters, edit and delete', async () => {
    await p.click('#nav [data-sheet=chronicle]'); assert.equal(await p.locator('.entry').count(), 3); assert.ok(await p.locator('.heat button').count() >= 100);
    await shot(p, '07-chronicle');
    await p.click('[data-act=filter][data-f=tur]'); assert.equal(await p.locator('.entry').count(), 1); await p.click('[data-act=filter][data-f=all]');
    await p.click('[data-act=rawlog]'); assert.match(await p.textContent('.raw'), /failing this class/);
    const before = (await st(p)).fronts.afg.pos;
    await p.click('.entry >> nth=2 >> [data-act=editreport]'); assert.equal(await p.textContent('#sheet-title'), 'Edit dispatch');
    await p.click('.item >> nth=0 >> [data-act=sev][data-n="1"]'); await p.click('[data-act=commit]'); await p.waitForTimeout(200);
    assert.ok((await st(p)).fronts.afg.pos < before, 'editing severity down rewinds part of the damage');
    p.once('dialog', d => d.accept()); await p.click('.entry >> nth=0 >> [data-act=delreport]'); await p.waitForTimeout(200); assert.equal(await p.locator('.entry').count(), 2);
  });

  await step('forces tabs', async () => {
    await p.click('#nav [data-sheet=forces]');
    for (const t of ['air', 'navy', 'industry', 'army']) { await p.click(`[data-tab=${t}]`); assert.ok((await body(p)).length > 150); }
    assert.ok(await p.locator('img.cnt').count() >= 20); await shot(p, '08-forces');
  });

  await step('map: province tap, layers menu, replay', async () => {
    await p.click('#sheet .x');
    await p.evaluate(() => { const a = window.__artesh; const t = a.map.provinces[a.map.tehran]; a.view.flyTo(t.c[0], t.c[1] + 40, 1.2, false); }); await p.waitForTimeout(200);
    const pt = await p.evaluate(() => { const a = window.__artesh; const q = a.map.provinces.find(x => x.n === 'Qom'); const [x, y] = a.view.toScreen(q.c[0], q.c[1]); const r = document.querySelector('#over').getBoundingClientRect(); return [r.left + x, r.top + y]; });
    await p.mouse.click(pt[0], pt[1]); await p.waitForSelector('#sheet:not([hidden])'); assert.equal(await p.textContent('#sheet-title'), 'Qom'); await shot(p, '09-province'); await p.click('#sheet .x');
    await p.click('[data-act=home]'); await p.waitForTimeout(700);
    for (const m of ['life', 'infra', 'supply', 'air', 'terrain', 'political']) { await p.click('[data-act=modes]'); if (m === 'life') await shot(p, '10-layers'); await p.click(`[data-mode=${m}]`); await p.waitForTimeout(150); if (m === 'life' || m === 'infra') await shot(p, `11-${m}`); }
    await p.click('#nav [data-sheet=chronicle]'); await p.click('[data-act=replay]'); await p.waitForSelector('#replay:not([hidden])');
    await p.click('[data-act=replay-play]'); // pause
    await p.evaluate(() => { const r = document.querySelector('#replay input'); r.value = 0; r.dispatchEvent(new Event('input', { bubbles: true })); });
    assert.equal(await p.evaluate(() => window.__artesh.st.log.length), 0, 'scrubbed to before the first dispatch'); assert.ok((await st(p)).log >= 2, 'live state untouched');
    await shot(p, '12-replay'); await p.click('[data-act=replay-exit]'); assert.ok(await p.isHidden('#replay'));
  });

  await step('Claude: key → browser call → items applied; notes and armistice reach the prompt', async () => {
    let req;
    await p.route('https://api.anthropic.com/v1/messages', async route => {
      req = JSON.parse(route.request().postData()); const h = route.request().headers(); assert.equal(h['x-api-key'], 'sk-ant-test'); assert.equal(h['anthropic-dangerous-direct-browser-access'], 'true');
      const text = /chief of staff/.test(req.system) ? JSON.stringify({ assessment: 'School is bleeding; the startup carries the war.', orders: [{ front: 'afg', order: 'Two hours on the problem set tonight.' }] })
        : JSON.stringify({ summary: 'The Mesopotamian Front has broken open.', items: [{ front: 'irq', outcome: 'win', severity: 5, action: 'breakthrough', headline: 'Seed round closed — armour on the Baghdad road', days_ago: 0 }, { front: 'glf', outcome: 'loss', severity: 4, action: 'port_strike', headline: 'Missed the flight — Bushehr bombed', days_ago: 0 }] });
      await route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ stop_reason: 'end_turn', content: [{ type: 'text', text }] }) });
    });
    await p.click('#nav [data-sheet=staff]'); await shot(p, '13-staff'); await p.click('[data-sheet=settings]');
    await p.fill('[data-bind="set.apiKey"]', 'sk-ant-test'); await p.fill('[data-bind=note][data-id=irq]', 'my SaaS company'); await p.click('[data-act=togglefront][data-id=raj]');
    assert.deepEqual(await p.evaluate(() => window.__artesh.data.off), ['raj']); await shot(p, '14-settings');
    await p.click('#nav .report'); await p.fill('#rtext', 'We closed the seed round! But I missed my flight home.'); await p.click('[data-act=analyse]'); await p.waitForSelector('[data-act=commit]');
    assert.match(req.messages[0].content, /closed the seed round/); assert.match(req.system, /Guitar/); assert.match(req.system, /my SaaS company/); assert.doesNotMatch(req.system, /raj: Baluchistan/);
    assert.ok(!req.output_config.format.schema.properties.items.items.properties.front.enum.includes('raj')); assert.equal(req.model, 'claude-opus-5-5');
    await p.click('[data-act=commit]'); await p.waitForTimeout(400);
    const s = await st(p); assert.ok(s.fronts.irq.pos < -6); assert.ok(s.lib > 0); assert.ok(s.fronts.glf.pos > 0); assert.ok(s.ach.decisive);
    await p.waitForTimeout(1300); await shot(p, '15-breakthrough');
    await p.click('#nav [data-sheet=staff]'); await p.click('[data-sheet=briefing]'); await p.click('[data-act=assess]'); await p.waitForFunction(() => /bleeding/.test(document.querySelector('#sheet-body').textContent));
    assert.match(await body(p), /Two hours on the problem set/); assert.match(await body(p), /SITUATION REPORT/); await shot(p, '16-briefing');
    await p.click('[data-act=copy]'); await p.waitForTimeout(150); assert.match(await p.evaluate(() => navigator.clipboard.readText()), /Mesopotamian Front \(Startup\)/);
    await p.unroute('https://api.anthropic.com/v1/messages');
  });

  await step('share the map as an image', async () => {
    await p.evaluate(() => { navigator.canShare = undefined; });
    const [dl] = await Promise.all([p.waitForEvent('download'), p.click('[data-act=sharemap]')]); const f = shots + 'share.png'; await dl.saveAs(f); assert.ok(fs.statSync(f).size > 50000);
  });

  await step('operations: plan, pin on map, accomplish', async () => {
    await p.click('#nav [data-sheet=staff]'); await p.click('[data-sheet=ops]'); await p.click('[data-sheet=opnew]');
    await p.selectOption('[data-bind="op.front"]', 'irq'); const goal = await p.textContent('[data-bind="op.target"] option:checked'); assert.match(goal, /^Capture /);
    await p.fill('[data-bind="op.name"]', 'Derafsh'); await shot(p, '17-opnew'); await p.click('[data-act=opsave]');
    assert.match(await body(p), /Operation Derafsh/); assert.equal(await p.evaluate(() => window.__artesh.view.pins.length), 1); await shot(p, '18-ops');
    await p.evaluate(() => { const a = window.__artesh; const reps = []; for (let i = 0; i < 8; i++) reps.push({ id: 'op' + i, ts: Date.now() - 500 + i, text: '', summary: '', items: [{ front: 'irq', outcome: 'win', severity: 5, action: 'breakthrough', headline: 'Push' }] }); a.commitReports(reps, { quiet: true }); });
    await p.waitForTimeout(300); assert.ok(await p.evaluate(() => !!window.__artesh.data.ops[0].doneTs)); assert.match(await body(p), /Accomplished/);
  });

  await step('decorations and nation', async () => {
    await p.click('#sheet .back'); await p.click('[data-sheet=medals]'); assert.ok(await p.locator('.medal.on').count() >= 3); await shot(p, '19-medals');
    await p.click('#sheet .back'); await p.click('[data-sheet=nation]'); assert.match(await body(p), /Road to empire/); assert.match(await body(p), /14\d\d/); await shot(p, '20-nation');
  });

  await step('export → reset → import', async () => {
    await p.click('#nav [data-sheet=staff]'); await p.click('[data-sheet=backup]');
    const [dl] = await Promise.all([p.waitForEvent('download'), p.click('[data-act=export]')]); const file = shots + 'backup.json'; await dl.saveAs(file);
    const j = JSON.parse(fs.readFileSync(file)); assert.ok(j.reports.length >= 10); assert.equal(j.settings.apiKey, ''); assert.deepEqual(j.off, ['raj']); assert.equal(j.ops.length, 1);
    p.once('dialog', d => d.accept()); await p.click('[data-act=reset]'); assert.equal((await st(p)).log, 0);
    await p.setInputFiles('#importfile', file); await p.waitForTimeout(300);
    const s = await st(p); assert.ok(s.log >= 10); assert.equal(await p.evaluate(() => window.__artesh.data.settings.apiKey), 'sk-ant-test'); assert.equal(await p.evaluate(() => window.__artesh.data.notes.irq), 'my SaaS company');
  });
  await ctx.close();

  ({ ctx, p } = await open({}, `${seed()}; window.SpeechRecognition = window.webkitSpeechRecognition = class { start() { setTimeout(() => this.onresult({ resultIndex: 0, results: [Object.assign([{ transcript: 'had a great workout at the gym' }], { isFinal: true })] }), 80); } stop() { setTimeout(() => this.onend(), 20); } };`));
  await step('voice: live dictation', async () => {
    await p.click('#nav .report'); await p.click('[data-act=mic]'); await p.waitForTimeout(250);
    assert.ok(await p.locator('.mic.live').count()); assert.equal(await p.inputValue('#rtext'), 'had a great workout at the gym'); await shot(p, '21-listening');
    await p.click('[data-act=mic]'); await p.waitForTimeout(150); assert.equal(await p.locator('.mic.live').count(), 0);
    await p.click('[data-act=analyse]'); await p.waitForSelector('[data-act=commit]'); await p.click('[data-act=commit]'); await p.waitForTimeout(300); assert.ok((await st(p)).fronts.raj.pos < 0);
  });
  await ctx.close();

  const b2 = await chromium.launch({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] });
  const c2 = await b2.newContext({ ...devices['iPhone 14 Pro'] }); p = await c2.newPage(); p.on('pageerror', e => errors.push('pageerror: ' + e.message));
  await p.addInitScript(seed({ settings: { elevenKey: 'el-test', voice: 'eleven' } }));
  let stt = false;
  await p.route('https://api.elevenlabs.io/v1/speech-to-text', async route => { stt = route.request().headers()['xi-api-key'] === 'el-test'; await route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ text: 'I failed my exam.' }) }); });
  await p.goto(URL_); await p.waitForFunction(() => window.__artesh?.st);
  await step('voice: recording transcribed by ElevenLabs Scribe', async () => {
    await p.click('#nav .report'); await p.click('[data-act=mic]'); await p.waitForSelector('.mic.live'); await p.waitForTimeout(1300);
    await p.click('[data-act=mic]'); await p.waitForFunction(() => document.querySelector('#rtext')?.value.includes('failed my exam'), null, { timeout: 8000 }); assert.ok(stt);
  });
  await b2.close();

  const c3 = await browser.newContext({ viewport: { width: 1440, height: 860 } }); p = await c3.newPage(); p.on('pageerror', e => errors.push('pageerror: ' + e.message));
  await p.addInitScript(seed()); await p.goto(URL_); await p.waitForFunction(() => window.__artesh?.st);
  await step('desktop: demo campaign', async () => {
    await p.click('#nav [data-sheet=staff]'); await p.click('[data-sheet=backup]'); await p.click('[data-act=demo]'); await p.waitForTimeout(900);
    const s = await st(p); assert.equal(s.log, 8); assert.ok(s.occ > 0 && s.lib > 0); await shot(p, '22-desktop');
    await p.click('#nav [data-sheet=fronts]'); await p.click('.front[data-arg=irq]'); await p.waitForTimeout(300); await shot(p, '23-desktop-front');
  });
  await step('Tehran falls; the empire is restored', async () => {
    await p.evaluate(() => { const a = window.__artesh; a.data.reports = []; const now = Date.now(); a.commitReports(Array.from({ length: 60 }, (_, i) => ({ id: 'x' + i, ts: now - (60 - i) * 3600e3, text: '', summary: '', items: [{ front: 'tks', outcome: 'loss', severity: 5, action: 'enemy_breakthrough', headline: 'Collapse' }] })), { quiet: true }); });
    assert.ok(await p.evaluate(() => window.__artesh.live.tehranFallen)); await p.click('#sheet .x'); assert.match(await p.textContent('#alerts'), /Tehran has fallen/);
    await p.evaluate(() => window.__artesh.view.home(false)); await p.waitForTimeout(400); await shot(p, '24-tehran-fallen');
    await p.evaluate(() => { const a = window.__artesh; a.data.reports = []; const now = Date.now(); a.commitReports(Array.from({ length: 120 }, (_, i) => ({ id: 'y' + i, ts: now - (120 - i) * 3600e3, text: '', summary: '', items: a.map.fronts.map(f => ({ front: f.id, outcome: 'win', severity: 5, action: 'breakthrough', headline: 'Victory' })) })), { quiet: true }); });
    assert.equal(await p.textContent('#nation-name'), 'Achaemenid Empire'); assert.ok(await p.evaluate(() => window.__artesh.live.ach.empire && window.__artesh.live.satrapies.length > 20));
    await p.evaluate(() => { const a = window.__artesh; const [x, y] = a.view.proj(50, 33); a.view.flyTo(x, y, a.view.minS, false); }); await p.waitForTimeout(500); await shot(p, '25-empire');
  });
  await c3.close();
} finally { await browser.close(); server.kill(); }
console.log(`\n${passed} passed, ${errors.length} problem(s)`);
if (errors.length) { console.log(errors.join('\n')); process.exit(1); }
