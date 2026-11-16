// End-to-end checks in headless Chromium at iPhone size. Run: npm run test:e2e
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { mockOpenAI } from './mock-openai.mjs';
const require = createRequire(import.meta.url);
const { chromium, devices } = require('playwright');
const PORT = 8123, URL_ = `http://localhost:${PORT}/`;
const shots = new URL('./shots/', import.meta.url).pathname; fs.rmSync(shots, { recursive: true, force: true }); fs.mkdirSync(shots, { recursive: true });
const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'artesh-e2e-'));
const mock = await mockOpenAI(8124);
const server = spawn('node', ['server.mjs'], { env: { ...process.env, PORT, HOST: '127.0.0.1', ARTESH_PASSWORD: 'open sesame', OPENAI_API_KEY: 'sk-test-key', OPENAI_BASE_URL: 'http://127.0.0.1:8124/v1', ARTESH_DATA_DIR: dataDir }, stdio: 'ignore' });
const login = async p => { await p.goto(URL_); if (await p.locator('#p').count()) { await p.fill('#p', 'open sesame'); await p.click('button'); } await p.waitForFunction(() => window.__artesh?.st); };
await new Promise(r => setTimeout(r, 700));
const browser = await chromium.launch();
const errors = []; let passed = 0;
const step = async (name, fn) => { try { await fn(); passed++; console.log('  ✓', name); } catch (e) { errors.push(`${name}: ${e.message}`); console.log('  ✗', name, '\n    ', e.message.split('\n').slice(0, 3).join(' | ')); } };
const st = p => p.evaluate(() => { const s = window.__artesh.live; return { fronts: s.fronts, log: s.log.length, occ: s.terr.occ.size, lib: s.terr.lib.size, ach: s.ach, streak: s.dayStreak, divs: s.divisions.length }; });
const seed = (extra = {}) => `localStorage.setItem('artesh.v1', JSON.stringify(${JSON.stringify({ v: 2, reports: [], labels: {}, notes: {}, off: [], ops: [], settings: {}, onboarded: true, ...extra })}))`;
async function open(opts = {}, init) {
  const ctx = await browser.newContext({ ...devices['iPhone 14 Pro'], permissions: ['clipboard-read', 'clipboard-write'], ...opts });
  const p = await ctx.newPage(); if (init) await p.addInitScript(init);
  p.on('pageerror', e => errors.push('pageerror: ' + e.message));
  p.on('console', m => { if (m.type() === 'error' && !/favicon|Failed to load resource/.test(m.text())) errors.push('console: ' + m.text()); });
  await login(p);
  return { ctx, p };
}
const shot = async (p, n) => { await p.waitForTimeout(350); await p.screenshot({ path: `${shots}${n}.png` }); };
const body = p => p.textContent('#sheet-body');

try {
  {
    const c0 = await browser.newContext({ ...devices['iPhone 14 Pro'] }); const q = await c0.newPage();
    await step('private: a password wall, then the app', async () => {
      const r = await q.goto(URL_); assert.equal(r.status(), 401); assert.ok(await q.locator('#p').count()); assert.equal(await q.locator('#mapwrap').count(), 0);
      await q.screenshot({ path: shots + '00-login.png' });
      await q.fill('#p', 'nope'); await q.click('button'); await q.waitForFunction(() => /Wrong/.test(document.querySelector('#e').textContent));
      await q.fill('#p', 'open sesame'); await q.click('button'); await q.waitForFunction(() => window.__artesh?.st);
      const cfg = await q.evaluate(() => window.__artesh.cfg); assert.equal(cfg.judge, 'gpt-6-luna'); assert.equal(cfg.transcribe, 'gpt-transcribe'); assert.equal(cfg.login, true); assert.doesNotMatch(JSON.stringify(cfg), /sk-/);
      assert.equal(await q.evaluate(() => JSON.stringify(localStorage).includes('sk-')), false);
    });
    await c0.close();
  }
  let { ctx, p } = await open();
  await step('first run: name your fronts', async () => {
    assert.equal(await p.textContent('#sheet-title'), 'Your fronts');
    assert.ok(await p.locator('[data-act=preset]').count() >= 7); await p.click('[data-act=preset][data-id=founder]');
    assert.notEqual(await p.inputValue('input[data-id=afg]'), 'School'); await shot(p, '00-welcome');
    await p.evaluate(() => { const a = window.__artesh; a.data.labels = {}; a.data.notes = {}; a.data.off = []; a.save(); a.refresh(); });
    await p.fill('input[data-id=tur]', 'Guitar'); await p.click('[data-act=close]');
    assert.ok(await p.isHidden('#sheet')); assert.equal(await p.evaluate(() => window.__artesh.data.labels.tur), 'Guitar');
    assert.equal(await p.locator('#nav button').count(), 3);
  });
  await shot(p, '01-map');

  await step('every division has its own icon on the map', async () => {
    const n = await p.evaluate(() => window.__artesh.view.hits.filter(h => h.data.kind === 'division').length);
    const s = await st(p); assert.equal(n, s.divs, `one token per division: ${n}`);
  });

  await step('say it, send it: fronts move with no extra steps', async () => {
    await p.click('#nav .report'); assert.equal(await p.textContent('#sheet-title'), 'What happened?');
    await p.fill('#rtext', "Yesterday school was bad, I'm failing this class. I had a fight with my mother. Guitar practice went great today.");
    await shot(p, '02-report');
    await p.click('[data-act=send]'); await p.waitForSelector('#banner:not([hidden])');
    assert.ok(await p.isHidden('#sheet'));
    const s = await st(p); assert.ok(s.fronts.afg.pos > 2); assert.ok(s.fronts.cau.pos > 0); assert.ok(s.fronts.tur.pos < 0);
    assert.equal(s.log, 2, 'yesterday and today are filed on their own days'); assert.equal(s.streak, 2);
    assert.match(await p.textContent('#toast'), /Saved · 1 win, 2 losses · \+\d+ XP/); assert.ok(s.streak === 2);
    assert.ok(await p.evaluate(() => window.__artesh.live.commander.xp > 0 && window.__artesh.live.orders.length === 3)); assert.equal(mock.seen.at(-1).body.model, 'gpt-6-luna');
  });
  await p.waitForTimeout(1200); await shot(p, '03-after');

  await step('undo', async () => { await p.click('#toast [data-act=undo]'); assert.equal((await st(p)).log, 0); });

  await step('unclear report asks one question: which front, win or loss', async () => {
    await p.click('#nav .report'); await p.fill('#rtext', 'Went to the dentist.'); await p.click('[data-act=send]');
    await p.waitForSelector('.pick'); await shot(p, '04-pick');
    await p.click('.pk >> nth=4 >> [data-o=win]'); await p.waitForTimeout(200);
    const s = await st(p); assert.equal(s.log, 1); assert.equal(s.fronts.raj.wins, 1);
    assert.equal(await p.evaluate(() => window.__artesh.live.log[0].items[0].headline), 'Went to the dentist.');
  });

  await step('fronts list → front: objective, one-tap win/loss, division icons', async () => {
    await p.click('#nav [data-sheet=fronts]'); assert.equal(await p.locator('#sheet .front').count(), 7); await shot(p, '05-fronts');
    await p.click('.front[data-arg=afg]'); assert.equal(await p.textContent('#sheet-title'), 'School');
    assert.match(await body(p), /Next objective/); assert.match(await body(p), /Capture /);
    assert.equal(await p.locator('.units .unit img').count(), 4); await shot(p, '06-front');
    await p.click('[data-act=quick][data-o=loss]'); await p.waitForTimeout(200);
    assert.equal((await st(p)).fronts.afg.losses, 1);
    await p.click('#nav [data-sheet=fronts]'); await p.click('.front[data-arg=afg]'); await p.click('.units .unit >> nth=0');
    assert.match(await p.textContent('#sheet-title'), /Khorasan Infantry|Mashhad Infantry/); assert.match(await body(p), /Brig\. Gen\./); assert.match(await body(p), /Battle honours/); await shot(p, '07-division');
    assert.match(await p.evaluate(() => window.__artesh.live.log.at(-1).fx[0].text), /gives ground/);
  });

  await step('history: calendar, edit, delete, replay', async () => {
    await p.click('#nav [data-sheet=history]'); assert.equal(await p.locator('.entry').count(), 2); assert.equal(await p.locator('.heat i').count(), 140); await shot(p, '08-history');
    const before = (await st(p)).fronts.afg.pos;
    await p.click('.entry >> nth=0 >> [data-act=editreport]'); assert.equal(await p.textContent('#sheet-title'), 'Edit'); await shot(p, '09-edit');
    await p.click('[data-act=sev][data-n="5"]'); await p.click('[data-act=saveedit]'); await p.waitForTimeout(200);
    assert.ok((await st(p)).fronts.afg.pos > before);
    p.once('dialog', d => d.accept()); await p.click('.entry >> nth=1 >> [data-act=delreport]'); await p.waitForTimeout(200); assert.equal(await p.locator('.entry').count(), 1);
    await p.click('[data-act=replay]'); await p.waitForSelector('#replay:not([hidden])'); await p.click('[data-act=replay-play]');
    await p.evaluate(() => { const r = document.querySelector('#replay input'); r.value = 0; r.dispatchEvent(new Event('input', { bubbles: true })); });
    assert.equal(await p.evaluate(() => window.__artesh.st.log.length), 0); assert.equal((await st(p)).log, 1);
    await shot(p, '10-replay'); await p.click('[data-act=replay-exit]'); assert.ok(await p.isHidden('#replay'));
  });

  await step('map: tap a province, tap a division, layers', async () => {
    await p.evaluate(() => { const a = window.__artesh; const t = a.map.provinces[a.map.tehran]; a.view.flyTo(t.c[0], t.c[1] + 40, 1.2, false); }); await p.waitForTimeout(200);
    const pt = await p.evaluate(() => { const a = window.__artesh; const q = a.map.provinces.find(x => x.n === 'Qom'); const [x, y] = a.view.toScreen(q.c[0], q.c[1]); const r = document.querySelector('#over').getBoundingClientRect(); return [r.left + x, r.top + y]; });
    await p.mouse.click(pt[0], pt[1]); await p.waitForSelector('#sheet:not([hidden])'); assert.equal(await p.textContent('#sheet-title'), 'Qom'); await p.click('#sheet .x');
    await p.click('[data-act=home]'); await p.waitForTimeout(800);
    const h = await p.evaluate(() => { const a = window.__artesh; const h = a.view.hits.filter(h => h.data.kind === 'front' && h.data.id === 'irq').at(-1); const r = document.querySelector('#over').getBoundingClientRect(); return [r.left + h.x + h.w / 2, r.top + h.y + h.h / 2]; });
    await p.mouse.click(h[0], h[1]); await p.waitForSelector('#sheet:not([hidden])'); assert.equal(await p.textContent('#sheet-title'), 'Startup'); await p.click('#sheet .x');
    const dv = await p.evaluate(() => { const a = window.__artesh; const h = a.view.hits.find(h => h.data.kind === 'division'); const r = document.querySelector('#over').getBoundingClientRect(); return [r.left + h.x + h.w / 2, r.top + h.y + h.h / 2]; });
    await p.mouse.click(dv[0], dv[1]); await p.waitForSelector('#sheet:not([hidden])'); assert.match(await body(p), /Battle honours/); await p.click('#sheet .x');
    for (const m of ['life', 'infra', 'political']) { await p.click('[data-act=modes]'); if (m === 'life') await shot(p, '11-layers'); await p.click(`[data-mode=${m}]`); if (m === 'life') await shot(p, '12-life'); }
  });

  await step('judged by gpt-6-luna through the server; paused fronts are left out', async () => {
    await p.click('[data-act=emblem]'); await p.click('[data-sheet=settings]');
    assert.match(await body(p), /Judged by gpt-6-luna/); assert.match(await body(p), /gpt-transcribe/); assert.equal(await p.locator('input[type=password]').count(), 0);
    await p.click('[data-act=togglefront][data-id=raj]'); assert.deepEqual(await p.evaluate(() => window.__artesh.data.off), ['raj']); await shot(p, '13-settings');
    await p.click('#nav .report'); await p.fill('#rtext', 'We closed the seed round! But I missed my flight home.'); await p.click('[data-act=send]'); await p.waitForSelector('#banner:not([hidden])');
    const req = mock.seen.filter(x => x.path === '/v1/responses').at(-1).body;
    assert.match(req.input[1].content, /closed the seed round/); assert.match(req.input[0].content, /Guitar/); assert.doesNotMatch(req.input[0].content, /raj: Baluchistan/); assert.equal(req.model, 'gpt-6-luna');
    assert.ok(!req.text.format.schema.properties.items.items.properties.front.enum.includes('raj'));
    const s = await st(p); assert.ok(s.fronts.irq.pos < -6); assert.ok(s.lib > 0); assert.ok(s.fronts.glf.pos > 0); assert.ok(s.ach.decisive);
    await p.waitForTimeout(1300); await shot(p, '14-breakthrough');
    await p.click('[data-act=emblem]'); await p.waitForFunction(() => /bleeding/.test(document.querySelector('#sheet-body').textContent));
    assert.equal(await p.evaluate(() => { const a = window.__artesh; const i = a.live.log.at(-1).items.find(x => x.action === 'port_strike'); return a.map.provinces[i.at].f.includes('P'); }), true, 'the port strike landed on a real port');
    assert.match(await body(p), /Two hours on the problem set/); assert.match(await body(p), /Order of Zolfaghar/); await shot(p, '15-overview');
  });

  await step('overview shows rank and orders; share cards render and save', async () => {
    assert.match(await body(p), /XP to/); assert.equal(await p.locator('.orders .ord').count(), 3);
    await p.evaluate(() => { navigator.canShare = undefined; });
    await p.click('[data-sheet=share]'); await p.waitForSelector('#th-rank canvas');
    assert.equal(await p.locator('.cards canvas').count(), 4); await shot(p, '15b-share');
    const [dl] = await Promise.all([p.waitForEvent('download'), p.click('[data-kind=frontpage]')]); const f = shots + 'share-frontpage.png'; await dl.saveAs(f); assert.ok(fs.statSync(f).size > 80000);
    const [d2] = await Promise.all([p.waitForEvent('download'), p.click('[data-kind=bulletin]')]); await d2.saveAs(shots + 'share-bulletin.png');
    const [d3] = await Promise.all([p.waitForEvent('download'), p.click('[data-kind=recap]')]); await d3.saveAs(shots + 'share-recap.png');
    await p.waitForTimeout(200); assert.match(await p.evaluate(() => navigator.clipboard.readText()), /Mesopotamian Front \(Startup\)/);
  });

  await step('ask the staff answers from history; sound can be switched off', async () => {
    await p.click('#nav [data-sheet=history]'); await p.fill('#askq', 'when did I last report on the startup?'); await p.press('#askq', 'Enter');
    await p.waitForSelector('.answer'); assert.ok((await p.textContent('.answer')).length > 20); await shot(p, '15c-ask');
    await p.click('[data-act=askclear]'); assert.equal(await p.locator('.answer').count(), 0);
    await p.click('[data-act=emblem]'); await p.click('[data-sheet=settings]'); await p.click('[data-act=togglefx][data-k=sound]');
    assert.equal(await p.evaluate(() => window.__artesh.data.settings.sound), false); await p.click('[data-act=togglefx][data-k=sound]');
  });

  await step('backup: export → reset → import', async () => {
    await p.click('[data-act=emblem]'); await p.click('[data-sheet=settings]'); await p.click('summary');
    const [dl] = await Promise.all([p.waitForEvent('download'), p.click('[data-act=export]')]); const file = shots + 'backup.json'; await dl.saveAs(file);
    const j = JSON.parse(fs.readFileSync(file)); assert.equal(j.reports.length, 2); assert.doesNotMatch(JSON.stringify(j), /sk-/); assert.deepEqual(j.off, ['raj']);
    p.once('dialog', d => d.accept()); await p.click('[data-act=reset]'); assert.equal((await st(p)).log, 0);
    await p.setInputFiles('#importfile', file); await p.waitForTimeout(300);
    assert.equal((await st(p)).log, 2);
  });

  await step('another device signs in and sees the same war', async () => {
    await p.waitForTimeout(900);
    const o = await open(); const s2 = await o.p.evaluate(() => ({ n: window.__artesh.data.reports.length, off: window.__artesh.data.off, tur: window.__artesh.data.labels.tur }));
    assert.equal(s2.n, 2); assert.deepEqual(s2.off, ['raj']); assert.equal(s2.tur, 'Guitar'); await o.ctx.close();
    assert.equal(JSON.parse(fs.readFileSync(path.join(dataDir, 'state.json'))).data.reports.length, 2);
  });
  await ctx.close();

  const b2 = await chromium.launch({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] });
  const c2 = await b2.newContext({ ...devices['iPhone 14 Pro'] }); p = await c2.newPage(); p.on('pageerror', e => errors.push('pageerror: ' + e.message));
  await login(p);
  await step('voice: record → gpt-transcribe → send', async () => {
    const before = (await st(p)).fronts.afg.losses;
    await p.click('#nav .report'); await p.click('[data-act=mic]'); await p.waitForSelector('.mic.live'); await p.screenshot({ path: shots + '16-listening.png' }); await p.waitForTimeout(1300);
    await p.click('[data-act=mic]'); await p.waitForFunction(() => document.querySelector('#rtext')?.value.includes('failed my exam'), null, { timeout: 8000 });
    const sent = mock.seen.filter(x => x.path === '/v1/audio/transcriptions').at(-1); assert.match(sent.type, /multipart/); assert.ok(sent.raw.length > 2000);
    await p.click('[data-act=send]'); await p.waitForTimeout(400); assert.equal((await st(p)).fronts.afg.losses, before + 1);
  });
  await b2.close();

  const c3 = await browser.newContext({ viewport: { width: 1440, height: 860 } }); p = await c3.newPage(); p.on('pageerror', e => errors.push('pageerror: ' + e.message));
  await login(p);
  await step('desktop: demo', async () => {
    await p.click('[data-act=emblem]'); await p.click('[data-sheet=settings]'); await p.click('summary'); p.once('dialog', d => d.accept()); await p.click('[data-act=demo]'); await p.waitForTimeout(900);
    const s = await st(p); assert.equal(s.log, 8); assert.ok(s.occ > 0 && s.lib > 0); await shot(p, '17-desktop');
    await p.click('#nav [data-sheet=fronts]'); await p.click('.front[data-arg=irq]'); await shot(p, '18-desktop-front');
  });
  await step('Tehran falls; the empire is restored', async () => {
    await p.evaluate(() => { const a = window.__artesh; a.data.reports = []; const now = Date.now(); a.commitReports(Array.from({ length: 60 }, (_, i) => ({ id: 'x' + i, ts: now - (60 - i) * 3600e3, text: '', summary: '', items: [{ front: 'tks', outcome: 'loss', severity: 5, action: 'enemy_breakthrough', headline: 'Collapse' }] })), { quiet: true }); });
    assert.ok(await p.evaluate(() => window.__artesh.live.tehranFallen)); await p.click('#sheet .x'); assert.match(await p.textContent('#alerts'), /Tehran has fallen/);
    await p.evaluate(() => window.__artesh.view.home(false)); await shot(p, '19-tehran-fallen');
    await p.evaluate(() => { const a = window.__artesh; a.data.reports = []; const now = Date.now(); a.commitReports(Array.from({ length: 120 }, (_, i) => ({ id: 'y' + i, ts: now - (120 - i) * 3600e3, text: '', summary: '', items: a.map.fronts.map(f => ({ front: f.id, outcome: 'win', severity: 5, action: 'breakthrough', headline: 'Victory' })) })), { quiet: true }); });
    assert.equal(await p.textContent('#nation-name'), 'Achaemenid Empire'); assert.ok(await p.evaluate(() => window.__artesh.live.ach.empire && window.__artesh.live.satrapies.length > 20));
    await p.evaluate(() => { const a = window.__artesh; const [x, y] = a.view.proj(50, 33); a.view.flyTo(x, y, a.view.minS, false); }); await shot(p, '20-empire');
  });
  await c3.close();
} finally { await browser.close(); server.kill(); mock.close(); fs.rmSync(dataDir, { recursive: true, force: true }); }
console.log(`\n${passed} passed, ${errors.length} problem(s)`);
if (errors.length) { console.log(errors.join('\n')); process.exit(1); }
