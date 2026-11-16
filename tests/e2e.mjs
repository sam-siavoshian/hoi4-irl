// End-to-end checks in headless Chromium at iPhone size. Run: npm run test:e2e
import { createRequire } from 'node:module';
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { mockOpenAI } from './mock-openai.mjs';
import { testland, FIXTURES } from './fixtures/build.mjs';
const require = createRequire(import.meta.url);
const { chromium, devices } = require('playwright');
const PORT = 8123, URL_ = `http://localhost:${PORT}/`;
const repo = new URL('..', import.meta.url).pathname;
// the server serves the built interface, so build it first (a no-op when dist/ is already up to date)
{ const r = spawnSync(process.execPath, ['tools/ensure-build.mjs'], { cwd: repo, stdio: 'inherit' }); if (r.status !== 0) process.exit(r.status || 1); }
const shots = new URL('./shots/', import.meta.url).pathname; fs.rmSync(shots, { recursive: true, force: true }); fs.mkdirSync(shots, { recursive: true });
const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'artesh-e2e-'));
const mock = await mockOpenAI(8124);
const TL = (await testland()).fronts.map(f => f.id); // a second country, served through the test hook, to prove the app is scenario-driven
const server = spawn('node', ['server.mjs'], { cwd: repo, env: { ...process.env, PORT, HOST: '127.0.0.1', ARTESH_PASSWORD: 'open sesame', OPENAI_API_KEY: 'sk-test-key', OPENAI_BASE_URL: 'http://127.0.0.1:8124/v1', ARTESH_DATA_DIR: dataDir, ARTESH_EXTRA_SCENARIOS: FIXTURES }, stdio: 'ignore' });
const login = async p => { await p.goto(URL_); if (await p.locator('#p').count()) { await p.fill('#p', 'open sesame'); await p.click('button'); } await p.waitForFunction(() => window.__artesh?.st); };
await new Promise(r => setTimeout(r, 700));
const browser = await chromium.launch();
const errors = []; let passed = 0;
const step = async (name, fn) => { try { await fn(); passed++; console.log('  ✓', name); } catch (e) { errors.push(`${name}: ${e.message}`); console.log('  ✗', name, '\n    ', e.message.split('\n').slice(0, 3).join(' | ')); } };
const st = p => p.evaluate(() => { const s = window.__artesh.live; return { fronts: s.fronts, log: s.log.length, occ: s.terr.occ.size, lib: s.terr.lib.size, ach: s.ach, streak: s.dayStreak, divs: s.divisions.length }; });
async function open(opts = {}, init) {
  const ctx = await browser.newContext({ ...devices['iPhone 14 Pro'], permissions: ['clipboard-read', 'clipboard-write'], ...opts });
  const p = await ctx.newPage(); if (init) await p.addInitScript(init);
  p.on('pageerror', e => errors.push('pageerror: ' + e.message));
  p.on('console', m => { if (m.type() === 'error' && !/favicon|Failed to load resource/.test(m.text())) errors.push('console: ' + m.text()); });
  await login(p);
  return { ctx, p };
}
const shot = async (p, n) => { await p.waitForTimeout(450); await p.screenshot({ path: `${shots}${n}.png` }); };

// ---- the interface, by role, label and data-testid ----
const T = id => `[data-testid=${id}]`;
const SHEET = T('sheet');
const title = p => p.textContent(T('sheet-title'));
const body = p => p.textContent(T('sheet-body'));
const sheetOpen = async p => (await p.evaluate(() => window.__artesh.ui.sheet)) != null;
const gone = p => p.waitForSelector(SHEET, { state: 'detached' });
// close whatever sheet is open (a phone's sheet covers the bar and may cover the top of the map)
const shut = async p => { for (let i = 0; i < 3 && await sheetOpen(p); i++) { await p.click(`${SHEET} [aria-label=Close]`); await p.waitForTimeout(120); } await gone(p); };
const nav = async (p, name) => { await shut(p); await p.click(T(`nav-${name}`)); await p.waitForSelector(SHEET); };
const overview = async p => { await shut(p); await p.click(T('identity')); await p.waitForSelector(SHEET); };
const settings = async p => { await overview(p); await p.click(T('open-settings')); await p.waitForFunction(() => window.__artesh.ui.sheet === 'settings'); };
const toasts = p => p.textContent('[data-slot=toast-viewport]');
const saved = p => p.waitForFunction(() => /Saved/.test(document.querySelector('[data-slot=toast-viewport]')?.textContent || ''));
const confirmYes = p => p.click(T('confirm-yes'));
const send = async (p, text) => { await nav(p, 'report'); await p.fill('#report-text', text); await p.click(T('send')); };

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
      assert.equal(await q.locator('#mapwrap canvas').count(), 2, 'the map has its two canvases');
    });
    await c0.close();
  }
  let { ctx, p } = await open();
  await step('first run: choose your country', async () => {
    assert.equal(await title(p), 'Choose your country');
    assert.deepEqual(await p.evaluate(() => window.__artesh.scenarios.map(s => s.id).filter(id => id === 'iran' || id === 'testland')), ['iran', 'testland']);
    assert.equal(await p.locator(T('country')).count(), await p.evaluate(() => window.__artesh.scenarios.length)); assert.equal(await p.locator(`${T('country')} svg[data-flag]`).count(), await p.locator(T('country')).count());
    assert.match(await p.textContent(`${T('country')}[data-id=iran]`), /Iran.*Achaemenid Empire.*Restore the empire of Cyrus/s); assert.match(await p.textContent(`${T('country')}[data-id=testland]`), /Testland.*Platine Confederation/s);
    await shot(p, '00-country');
    await p.click(`${T('country')}[data-id=iran]`); await p.waitForFunction(() => document.querySelector('[data-testid=sheet-title]')?.textContent === 'Your fronts');
    assert.equal(await p.evaluate(() => window.__artesh.data.scenario), 'iran'); assert.equal(await p.textContent(T('nation-name')), 'Iran'); assert.equal(await p.locator(`${T('identity')} svg[data-flag]`).count(), 1);
  });
  await step('first run: name your fronts', async () => {
    assert.equal(await title(p), 'Your fronts'); assert.match(await body(p), /Each border of Iran/);
    assert.ok(await p.locator(`${SHEET} [role=radio]`).count() >= 7); await p.click('[data-choice=founder]');
    assert.notEqual(await p.inputValue('input[data-front=afg]'), 'School'); await shot(p, '00-welcome');
    await p.evaluate(() => { const a = window.__artesh; a.data.labels = {}; a.data.notes = {}; a.data.off = []; a.save(); a.refresh(); });
    await p.fill('input[data-front=tur]', 'Guitar'); await p.click(T('begin')); await gone(p);
    assert.equal(await p.evaluate(() => window.__artesh.data.labels.tur), 'Guitar'); assert.equal(await p.evaluate(() => window.__artesh.data.onboarded), true);
    assert.equal(await p.locator('nav[aria-label=Main] button').count(), 3);
  });
  await shot(p, '01-map');

  await step('every division has its own icon on the map', async () => {
    const n = await p.evaluate(() => window.__artesh.view.hits.filter(h => h.data.kind === 'division').length);
    const s = await st(p); assert.equal(n, s.divs, `one token per division: ${n}`);
  });

  await step('say it, send it: fronts move with no extra steps', async () => {
    await nav(p, 'report'); assert.equal(await title(p), 'Report'); assert.match(await body(p), /What happened\?/);
    await p.fill('#report-text', "Yesterday school was bad, I'm failing this class. I had a fight with my mother. Guitar practice went great today.");
    await shot(p, '02-report');
    await p.click(T('send')); await saved(p); await gone(p);
    const s = await st(p); assert.ok(s.fronts.afg.pos > 2); assert.ok(s.fronts.cau.pos > 0); assert.ok(s.fronts.tur.pos < 0);
    assert.equal(s.log, 2, 'yesterday and today are filed on their own days'); assert.equal(s.streak, 2);
    assert.match(await toasts(p), /Saved · 1 win, 2 losses · \+\d+ XP/); assert.ok(s.streak === 2);
    assert.ok(await p.evaluate(() => window.__artesh.live.commander.xp > 0 && window.__artesh.live.orders.length === 3)); assert.equal(mock.seen.at(-1).body.model, 'gpt-6-luna');
  });
  await p.waitForTimeout(1200); await shot(p, '03-after');

  await step('undo', async () => { await p.click('[data-slot=toast-viewport] button:has-text("Undo")'); assert.equal((await st(p)).log, 0); });

  await step('unclear report asks one question: which front, win or loss', async () => {
    await send(p, 'Went to the dentist.');
    await p.waitForSelector(T('pick')); await shot(p, '04-pick');
    await p.click(`${T('pick')} >> nth=4 >> text=Win`); await p.waitForTimeout(200);
    const s = await st(p); assert.equal(s.log, 1); assert.equal(s.fronts.raj.wins, 1);
    assert.equal(await p.evaluate(() => window.__artesh.live.log[0].items[0].headline), 'Went to the dentist.');
  });

  await step('fronts list → front: objective, one-tap win/loss, division icons', async () => {
    await nav(p, 'fronts'); assert.equal(await p.locator(`${SHEET} ${T('front')}`).count(), 7); await shot(p, '05-fronts');
    await p.click(`${T('front')}[data-front=afg]`); await p.waitForSelector(T('sheet-back')); assert.equal(await title(p), 'School');
    assert.match(await body(p), /Next objective/); assert.match(await body(p), /Capture /);
    assert.equal(await p.locator(`${T('division')} [data-unit-icon] svg`).count(), 4, 'every division in the list wears its icon'); await shot(p, '06-front');
    await p.click(T('quick-loss')); await p.waitForTimeout(200);
    assert.equal((await st(p)).fronts.afg.losses, 1);
    await nav(p, 'fronts'); await p.click(`${T('front')}[data-front=afg]`); await p.click(`${T('division')} >> nth=0`); await p.waitForFunction(() => window.__artesh.ui.sheet === 'division');
    assert.match(await title(p), /Khorasan Infantry|Mashhad Infantry/); assert.match(await body(p), /Brig\. Gen\./); assert.match(await body(p), /Battle honours/); assert.equal(await p.locator(`${SHEET} [data-unit-icon] svg`).count(), 1); await shot(p, '07-division');
    assert.match(await p.evaluate(() => window.__artesh.live.log.at(-1).fx[0].text), /gives ground/);
  });

  await step('history: calendar, edit, delete, replay', async () => {
    await nav(p, 'history'); assert.equal(await p.locator(T('entry')).count(), 2); assert.equal(await p.locator('[data-slot=day-grid-cell]').count(), 140); await shot(p, '08-history');
    const before = (await st(p)).fronts.afg.pos;
    await p.click(`${T('entry')} >> nth=0 >> [aria-label=Edit]`); await p.waitForSelector(T('edit-item')); assert.equal(await title(p), 'Edit entry'); await shot(p, '09-edit');
    for (let i = 0; i < 4 && await p.isEnabled(`${T('edit-item')} [aria-label=More]`); i++) await p.click(`${T('edit-item')} [aria-label=More]`);
    await p.click(T('save-edit')); await p.waitForTimeout(200);
    assert.ok((await st(p)).fronts.afg.pos > before);
    await p.click(`${T('entry')} >> nth=1 >> [aria-label=Delete]`); assert.match(await p.textContent(T('confirm')), /Delete this entry\?/); await confirmYes(p); await p.waitForTimeout(300); assert.equal(await p.locator(T('entry')).count(), 1);
    await p.click(T('replay')); await p.waitForSelector(T('replay-bar')); await p.click(T('replay-play'));
    await p.focus(`${T('replay-bar')} input[type=range]`); await p.keyboard.press('Home'); await p.waitForTimeout(150);
    assert.equal(await p.evaluate(() => window.__artesh.st.log.length), 0); assert.equal((await st(p)).log, 1);
    await shot(p, '10-replay'); await p.click(T('replay-exit')); await p.waitForSelector(T('replay-bar'), { state: 'detached' });
  });

  await step('map: tap a province, tap a division, layers', async () => {
    await p.evaluate(() => { const a = window.__artesh; const t = a.map.provinces[a.map.tehran]; a.view.flyTo(t.c[0], t.c[1] + 40, 1.2, false); }); await p.waitForTimeout(200);
    const pt = await p.evaluate(() => { const a = window.__artesh; const q = a.map.provinces.find(x => x.n === 'Qom'); const [x, y] = a.view.toScreen(q.c[0], q.c[1]); const r = document.querySelector('#over').getBoundingClientRect(); return [r.left + x, r.top + y]; });
    await p.mouse.click(pt[0], pt[1]); await p.waitForSelector(SHEET); assert.equal(await title(p), 'Qom'); await shut(p);
    await p.click(T('home')); await p.waitForTimeout(800);
    const h = await p.evaluate(() => { const a = window.__artesh; const h = a.view.hits.filter(h => h.data.kind === 'front' && h.data.id === 'irq').at(-1); const r = document.querySelector('#over').getBoundingClientRect(); return [r.left + h.x + h.w / 2, r.top + h.y + h.h / 2]; });
    await p.mouse.click(h[0], h[1]); await p.waitForSelector(SHEET); assert.equal(await title(p), 'Startup'); await shut(p);
    const dv = await p.evaluate(() => { const a = window.__artesh; const h = a.view.hits.find(h => h.data.kind === 'division'); const r = document.querySelector('#over').getBoundingClientRect(); return [r.left + h.x + h.w / 2, r.top + h.y + h.h / 2]; });
    await p.mouse.click(dv[0], dv[1]); await p.waitForSelector(SHEET); assert.match(await body(p), /Battle honours/); await shut(p);
    for (const m of ['life', 'infra', 'political']) {
      await p.click(T('layers')); await p.waitForSelector(`[data-mode=${m}]`); if (m === 'life') await shot(p, '11-layers');
      await p.click(`[data-mode=${m}]`); await p.waitForFunction(mode => window.__artesh.view.mode === mode, m);
      if (m === 'life') { await p.waitForSelector(T('legend')); assert.match(await p.textContent(T('legend')), /Guitar/); await shot(p, '12-life'); }
      if (m === 'political') assert.equal(await p.locator(T('legend')).count(), 0);
      await p.waitForSelector('[data-slot=menu-popup]', { state: 'detached' });
    }
  });

  await step('judged by gpt-6-luna through the server; paused fronts are left out', async () => {
    await settings(p);
    assert.match(await body(p), /Judged by gpt-6-luna/); assert.match(await body(p), /gpt-transcribe/); assert.equal(await p.locator('input[type=password]').count(), 0);
    await p.click(`${T('front-switch')}[data-front=raj]`); assert.deepEqual(await p.evaluate(() => window.__artesh.data.off), ['raj']); await shot(p, '13-settings');
    await send(p, 'We closed the seed round! But I missed my flight home.'); await saved(p);
    const req = mock.seen.filter(x => x.path === '/v1/responses').at(-1).body;
    assert.match(req.input[1].content, /closed the seed round/); assert.match(req.input[0].content, /Guitar/); assert.doesNotMatch(req.input[0].content, /raj: Baluchistan/); assert.equal(req.model, 'gpt-6-luna');
    assert.ok(!req.text.format.schema.properties.items.items.properties.front.enum.includes('raj'));
    const s = await st(p); assert.ok(s.fronts.irq.pos < -6); assert.ok(s.lib > 0); assert.ok(s.fronts.glf.pos > 0); assert.ok(s.ach.decisive);
    await p.waitForTimeout(1300); await shot(p, '14-breakthrough');
    await overview(p); await p.waitForFunction(() => /bleeding/.test(document.querySelector('[data-testid=sheet-body]')?.textContent || ''));
    assert.equal(await p.evaluate(() => { const a = window.__artesh; const i = a.live.log.at(-1).items.find(x => x.action === 'port_strike'); return a.map.provinces[i.at].f.includes('P'); }), true, 'the port strike landed on a real port');
    assert.match(await body(p), /Two hours on the problem set/); assert.match(await body(p), /Order of Zolfaghar/); await shot(p, '15-overview');
  });

  await step('overview shows rank and orders; share cards render and save', async () => {
    assert.match(await body(p), /XP to/); assert.equal(await p.locator(T('order')).count(), 3);
    await p.evaluate(() => { navigator.canShare = undefined; });
    await p.click(T('open-share')); await p.waitForSelector(`${T('share-card')}[data-kind=rank] canvas`);
    assert.equal(await p.locator(`${T('share-card')} canvas`).count(), 4); await shot(p, '15b-share');
    const [dl] = await Promise.all([p.waitForEvent('download'), p.click('[data-kind=frontpage]')]); const f = shots + 'share-frontpage.png'; await dl.saveAs(f); assert.ok(fs.statSync(f).size > 80000);
    const [d2] = await Promise.all([p.waitForEvent('download'), p.click('[data-kind=bulletin]')]); await d2.saveAs(shots + 'share-bulletin.png');
    const [d3] = await Promise.all([p.waitForEvent('download'), p.click('[data-kind=recap]')]); await d3.saveAs(shots + 'share-recap.png');
    await p.waitForTimeout(200); assert.match(await p.evaluate(() => navigator.clipboard.readText()), /Mesopotamian Front \(Startup\)/);
  });

  await step('ask the staff answers from history; sound can be switched off', async () => {
    await nav(p, 'history'); await p.fill('[aria-label="Ask about your history"]', 'when did I last report on the startup?'); await p.press('[aria-label="Ask about your history"]', 'Enter');
    await p.waitForSelector(T('answer')); assert.ok((await p.textContent(T('answer'))).length > 20); await shot(p, '15c-ask');
    await p.click(`${T('answer')} >> text=Clear`); await p.waitForSelector(T('answer'), { state: 'detached' });
    await settings(p); await p.click(T('sound'));
    assert.equal(await p.evaluate(() => window.__artesh.data.settings.sound), false); await p.click(T('sound')); assert.equal(await p.evaluate(() => window.__artesh.data.settings.sound), true);
    // appearance is the design system's: light, dark, or Auto
    await p.click(`${SHEET} [role=radio]:has-text("Dark")`); await p.waitForFunction(() => document.documentElement.dataset.theme === 'dark');
    await p.click(`${SHEET} [role=radio]:has-text("Light")`); await p.waitForFunction(() => document.documentElement.dataset.theme === 'light'); await shot(p, '13b-settings-light');
    await p.click(`${SHEET} [role=radio]:has-text("Auto")`); await p.waitForFunction(() => document.documentElement.dataset.appearance === 'system');
    // motion off quiets the celebrations and the interface alike
    await p.click(T('motion')); assert.equal(await p.evaluate(() => document.documentElement.dataset.motion), 'reduce'); await p.click(T('motion')); assert.equal(await p.evaluate(() => window.__artesh.data.settings.motion), true);
  });

  await step('backup: export → reset → import', async () => {
    await settings(p);
    const [dl] = await Promise.all([p.waitForEvent('download'), p.click(T('export'))]); const file = shots + 'backup.json'; await dl.saveAs(file);
    const j = JSON.parse(fs.readFileSync(file)); assert.equal(j.reports.length, 2); assert.doesNotMatch(JSON.stringify(j), /sk-/); assert.deepEqual(j.off, ['raj']);
    await p.click(T('reset')); assert.match(await p.textContent(T('confirm')), /Erase everything\?/); await confirmYes(p); await p.waitForFunction(() => window.__artesh.live.log.length === 0);
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

  // ---- another country: its own map, its own campaign, and the way back ----
  ({ ctx, p } = await open());
  await step('settings → country: Testland has its own map and an empty campaign', async () => {
    await settings(p); assert.match(await body(p), /Change country/);
    await p.click(T('change-country')); await p.waitForSelector(T('country')); assert.equal(await title(p), 'Country'); assert.match(await p.textContent(`${T('country')}[data-id=iran]`), /Playing/); await shot(p, '21-country');
    await p.click(`${T('country')}[data-id=testland]`); await p.waitForFunction(() => window.__artesh.map.id === 'testland' && window.__artesh.st?.fronts.lit && window.__artesh.ui.sheet === 'settings');
    assert.equal(await title(p), 'Settings'); assert.equal(await p.textContent(T('nation-name')), 'Testland'); assert.match(await toasts(p), /Now playing Testland/);
    const d = await p.evaluate(() => { const a = window.__artesh; return { scenario: a.data.scenario, n: a.data.reports.length, iran: a.data.campaigns.iran, labels: a.data.labels, off: a.data.off, fronts: Object.keys(a.live.fronts), log: a.live.log.length, view: a.view.map.id, home: a.view.homeTag }; });
    assert.equal(d.scenario, 'testland'); assert.equal(d.n, 0); assert.equal(d.log, 0); assert.deepEqual(d.fronts, TL); assert.equal(d.view, 'testland'); assert.equal(d.home, 'URU');
    assert.equal(d.iran.reports.length, 2, 'the Iranian campaign is put away whole'); assert.equal(d.iran.labels.tur, 'Guitar'); assert.deepEqual(d.iran.off, ['raj']);
    assert.equal(d.labels[TL[5]], 'Guitar', 'life areas carry over slot by slot'); assert.deepEqual(d.off, [TL[4]]);
    assert.equal(await p.inputValue(`input[data-front=${TL[5]}]`), 'Guitar'); assert.equal(await p.locator(T('front-name')).count(), 7);
    await shut(p); await p.evaluate(() => window.__artesh.view.home(false)); await shot(p, '22-testland-map');
    const n = await p.evaluate(() => { const a = window.__artesh; return { tokens: a.view.hits.filter(h => h.data.kind === 'division').length, divs: a.live.divisions.length, fleets: a.view.hits.filter(h => h.data.kind === 'fleet').length, squadrons: a.view.hits.filter(h => h.data.kind === 'front' && !h.data.battle).length }; });
    assert.equal(n.fleets, 1); assert.ok(n.tokens > 10 && n.tokens <= n.divs); assert.ok(n.squadrons >= 1);
  });
  await step('a report on Testland moves Testland\'s fronts and nobody else\'s', async () => {
    await send(p, 'Finished the thesis chapter after the river patrol. Friends cancelled again.'); await saved(p);
    const req = mock.seen.filter(x => x.path === '/v1/responses').at(-1).body;
    assert.match(req.input[0].content, /war map of Testland/); assert.match(req.input[0].content, /- lit: Littoral Front \(vs Argentina\)/); assert.match(req.input[0].content, /Only these have a fleet: pla, atl/); assert.doesNotMatch(req.input[0].content, /Iran|Afghan|Tehran/);
    assert.deepEqual(req.text.format.schema.properties.items.items.properties.front.enum, TL.filter(id => id !== TL[4]));
    const s = await st(p); assert.equal(s.log, 1); assert.ok(s.fronts[TL[0]].pos < -3); assert.ok(s.fronts[TL[6]].pos > 0, 'the sixth front on offer, the paused one left out, is the Atlantic'); assert.ok(s.lib > 0);
    assert.equal(await p.evaluate(() => window.__artesh.live.log[0].items[1].action), 'naval_defeat'); assert.ok(await p.evaluate(() => window.__artesh.live.fleets[0].ships.some(x => x.hp < 100)));
    await p.waitForTimeout(1300); await shot(p, '23-testland-after');
    await nav(p, 'fronts'); assert.equal(await p.locator(`${SHEET} ${T('front')}`).count(), 7); assert.match(await body(p), /inside Testland/);
    await p.click(`${T('front')}[data-front=${TL[0]}]`); await p.waitForSelector(T('sheet-back')); assert.match(await body(p), /Littoral Front/); assert.match(await body(p), /Durazno/); assert.match(await body(p), /the Mesopotamian Littoral/); await shot(p, '24-testland-front');
    await p.click(`${T('division')} >> nth=0`); await p.waitForFunction(() => window.__artesh.ui.sheet === 'division'); assert.match(await title(p), /Salto|Daymán|Arapey/);
    await overview(p); assert.equal(await title(p), 'Oriental Republic of Testland'); assert.match(await body(p), /Soldado/); assert.doesNotMatch(await body(p), /Sarbaz|\d{4} AP/); await shot(p, '25-testland-overview');
    await p.evaluate(() => { navigator.canShare = undefined; }); await p.click(T('open-share')); await p.waitForSelector(`${T('share-card')}[data-kind=rank] canvas`); assert.equal(await p.locator(`${T('share-card')} canvas`).count(), 4); await shot(p, '26-testland-share');
    await shut(p);
    const pt = await p.evaluate(() => { const a = window.__artesh; const q = a.map.provinces[a.map.capital]; a.view.flyTo(q.c[0], q.c[1], 1.4, false); a.view._clamp(); a.view.draw(); const [x, y] = a.view.toScreen(q.c[0] + 6, q.c[1] + 14); const r = document.querySelector('#over').getBoundingClientRect(); return [r.left + x, r.top + y]; });
    await p.mouse.click(pt[0], pt[1]); await p.waitForSelector(SHEET); assert.match(await body(p), /held by Testland/); assert.match(await body(p), /Durazno garrison/);
    await p.click(`${SHEET} button:has-text("Durazno garrison")`); await p.waitForFunction(() => window.__artesh.ui.sheet === 'units'); assert.ok(await p.locator(`${T('division')} [data-unit-icon] svg`).count() >= 1, 'the garrison is listed with its icons'); await shut(p);
  });
  await step('demo data plays on whichever map is loaded', async () => {
    const d = await p.evaluate(() => window.__artesh.data.reports.length);
    await settings(p); await p.click(T('demo')); assert.match(await p.textContent(T('confirm')), /Replace your reports with the demo\?/); await confirmYes(p); await p.waitForTimeout(600);
    const s = await st(p); assert.equal(s.log, 8); assert.ok(s.occ > 0 && s.lib > 0); assert.equal(d, 1);
    assert.ok(await p.evaluate(() => { const a = window.__artesh; const ids = a.map.fronts.map(f => f.id); return a.data.reports.every(r => r.items.every(i => ids.includes(i.front))); }));
    await p.evaluate(() => window.__artesh.view.home(false)); await shot(p, '27-testland-demo');
  });
  await step('back to Iran: the old campaign is exactly as it was left', async () => {
    await settings(p); await p.click(T('change-country')); await p.click(`${T('country')}[data-id=iran]`); await p.waitForFunction(() => window.__artesh.map.id === 'iran' && window.__artesh.st?.fronts.afg);
    const d = await p.evaluate(() => { const a = window.__artesh; return { scenario: a.data.scenario, n: a.data.reports.length, tur: a.data.labels.tur, off: a.data.off, tl: a.data.campaigns.testland.reports.length, iran: a.data.campaigns.iran, name: document.querySelector('[data-testid=nation-name]').textContent }; });
    assert.equal(d.scenario, 'iran'); assert.equal(d.n, 2); assert.equal(d.tur, 'Guitar'); assert.deepEqual(d.off, ['raj']); assert.equal(d.tl, 8); assert.equal(d.iran, undefined); assert.equal(d.name, 'Iran');
    const s = await st(p); assert.equal(s.log, 2); assert.ok(s.fronts.irq.pos < -6); await shut(p); await shot(p, '28-iran-again');
    await p.waitForTimeout(900); const stored = JSON.parse(fs.readFileSync(path.join(dataDir, 'state.json'))).data;
    assert.equal(stored.scenario, 'iran'); assert.equal(stored.reports.length, 2); assert.equal(stored.campaigns.testland.reports.length, 8); assert.equal(stored.v, 3);
  });
  await ctx.close();

  const b2 = await chromium.launch({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] });
  const c2 = await b2.newContext({ ...devices['iPhone 14 Pro'] }); p = await c2.newPage(); p.on('pageerror', e => errors.push('pageerror: ' + e.message));
  await login(p);
  await step('voice: record → gpt-transcribe → send', async () => {
    const before = (await st(p)).fronts.afg.losses;
    await nav(p, 'report'); await p.click(T('mic')); await p.waitForSelector(`${T('mic')}[data-state=live]`); await p.screenshot({ path: shots + '16-listening.png' }); await p.waitForTimeout(1300);
    await p.click(T('mic')); await p.waitForFunction(() => document.querySelector('#report-text')?.value.includes('failed my exam'), null, { timeout: 8000 });
    const sent = mock.seen.filter(x => x.path === '/v1/audio/transcriptions').at(-1); assert.match(sent.type, /multipart/); assert.ok(sent.raw.length > 2000);
    await p.click(T('send')); await saved(p); assert.equal((await st(p)).fronts.afg.losses, before + 1);
  });
  await b2.close();

  const c3 = await browser.newContext({ viewport: { width: 1440, height: 860 } }); p = await c3.newPage(); p.on('pageerror', e => errors.push('pageerror: ' + e.message));
  await login(p);
  await step('desktop: demo', async () => {
    await settings(p); await p.click(T('demo')); await confirmYes(p); await p.waitForTimeout(900);
    const s = await st(p); assert.equal(s.log, 8); assert.ok(s.occ > 0 && s.lib > 0); await shot(p, '17-desktop');
    // on a wide screen the sheet is a panel beside the map and the bar stays in reach
    await p.click(T('nav-fronts')); await p.click(`${T('front')}[data-front=irq]`); await p.waitForSelector(T('sheet-back'));
    const box = await p.locator(SHEET).boundingBox(); assert.ok(box.x > 800 && box.width < 520, 'a side panel, not a stretched sheet');
    assert.ok(await p.isVisible('[aria-label="Zoom in"]')); await shot(p, '18-desktop-front');
    await p.click(T('nav-history')); await p.waitForFunction(() => window.__artesh.ui.sheet === 'history');
  });
  await step('Tehran falls; the empire is restored', async () => {
    await p.evaluate(() => { const a = window.__artesh; a.data.reports = []; const now = Date.now(); a.commitReports(Array.from({ length: 60 }, (_, i) => ({ id: 'x' + i, ts: now - (60 - i) * 3600e3, text: '', summary: '', items: [{ front: 'tks', outcome: 'loss', severity: 5, action: 'enemy_breakthrough', headline: 'Collapse' }] })), { quiet: true }); });
    assert.ok(await p.evaluate(() => window.__artesh.live.tehranFallen)); await shut(p); assert.match(await p.textContent(T('alert')), /Tehran has fallen/);
    await p.evaluate(() => window.__artesh.view.home(false)); await shot(p, '19-tehran-fallen');
    await p.evaluate(() => { const a = window.__artesh; a.data.reports = []; const now = Date.now(); a.commitReports(Array.from({ length: 120 }, (_, i) => ({ id: 'y' + i, ts: now - (120 - i) * 3600e3, text: '', summary: '', items: a.map.fronts.map(f => ({ front: f.id, outcome: 'win', severity: 5, action: 'breakthrough', headline: 'Victory' })) })), { quiet: true }); });
    assert.equal(await p.textContent(T('nation-name')), 'Achaemenid Empire'); assert.ok(await p.evaluate(() => window.__artesh.live.ach.empire && window.__artesh.live.satrapies.length > 20));
    await p.evaluate(() => { const a = window.__artesh; const [x, y] = a.view.proj(50, 33); a.view.flyTo(x, y, a.view.minS, false); }); await shot(p, '20-empire');
  });
  await c3.close();
} finally { await browser.close(); server.kill(); mock.close(); fs.rmSync(dataDir, { recursive: true, force: true }); }
console.log(`\n${passed} passed, ${errors.length} problem(s)`);
if (errors.length) { console.log(errors.join('\n')); process.exit(1); }
