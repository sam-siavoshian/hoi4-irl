// End-to-end checks in headless Chromium at iPhone size. Run: npm run test:e2e
import { createRequire } from 'node:module';
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { mockOpenAI } from './mock-openai.mjs';
import { mockAnthropic } from './mock-providers.mjs';
import { mockLocal } from './mock-local.mjs';
import { testland, FIXTURES } from './fixtures/build.mjs';
const require = createRequire(import.meta.url);
const { chromium, devices } = require('playwright');
const PORT = 8123, URL_ = `http://localhost:${PORT}/`;
const repo = new URL('..', import.meta.url).pathname;
// the server serves the built interface, so build it first (a no-op when dist/ is already up to date)
{ const r = spawnSync(process.execPath, ['tools/ensure-build.mjs'], { cwd: repo, stdio: 'inherit' }); if (r.status !== 0) process.exit(r.status || 1); }
const shots = new URL('./shots/', import.meta.url).pathname; fs.rmSync(shots, { recursive: true, force: true }); fs.mkdirSync(shots, { recursive: true });
const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'homefront-e2e-'));
const mock = await mockOpenAI(8124);
const STAFF_KEY = 'sk-ant-e2e-test-key-not-real-7c1d'; const anthropic = await mockAnthropic(8126, { key: STAFF_KEY }); // the provider a key is set for in Settings
const ollama = await mockLocal(8127, { kind: 'ollama', models: ['qwen3:4b', 'llama3.2:latest', 'gemma3:4b'] }); // a model server on this machine, found by discovery
const TL = (await testland()).fronts.map(f => f.id); // a second country, served through the test hook, to prove the app is scenario-driven
const server = spawn('node', ['server.mjs'], { cwd: repo, env: { ...process.env, PORT, HOST: '127.0.0.1', HOMEFRONT_PASSWORD: 'open sesame', OPENAI_API_KEY: 'sk-test-key', OPENAI_BASE_URL: 'http://127.0.0.1:8124/v1', ANTHROPIC_BASE_URL: 'http://127.0.0.1:8126/v1', HOMEFRONT_DATA_DIR: dataDir, HOMEFRONT_EXTRA_SCENARIOS: FIXTURES, HOMEFRONT_DISCOVER: 'http://127.0.0.1:8127/v1,http://127.0.0.1:9/v1' }, stdio: 'ignore' });
const login = async p => { await p.goto(URL_); if (await p.locator('#p').count()) { await p.fill('#p', 'open sesame'); await p.click('button'); } await p.waitForFunction(() => window.__homefront?.st); };
await new Promise(r => setTimeout(r, 700));
const browser = await chromium.launch();
const errors = []; let passed = 0;
const step = async (name, fn) => { try { await fn(); passed++; console.log('  ✓', name); } catch (e) { errors.push(`${name}: ${e.message}`); console.log('  ✗', name, '\n    ', e.message.split('\n').slice(0, 3).join(' | ')); } };
const st = p => p.evaluate(() => { const s = window.__homefront.live; return { fronts: s.fronts, log: s.log.length, occ: s.terr.occ.size, lib: s.terr.lib.size, ach: s.ach, streak: s.dayStreak, divs: s.divisions.length }; });
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
const sheetOpen = async p => (await p.evaluate(() => window.__homefront.ui.sheet)) != null;
const gone = p => p.waitForSelector(SHEET, { state: 'detached' });
// close whatever sheet is open (a phone's sheet covers the bar and may cover the top of the map)
const shut = async p => { for (let i = 0; i < 3 && await sheetOpen(p); i++) { await p.click(`${SHEET} [aria-label=Close]`); await p.waitForTimeout(120); } await gone(p); };
const nav = async (p, name) => { await shut(p); await p.click(T(`nav-${name}`)); await p.waitForSelector(SHEET); };
const overview = async p => { await shut(p); await p.click(T('identity')); await p.waitForSelector(SHEET); };
const settings = async p => { await overview(p); await p.click(T('open-settings')); await p.waitForFunction(() => window.__homefront.ui.sheet === 'settings'); };
const toasts = p => p.textContent('[data-slot=toast-viewport]');
// toasts pause while the pointer rests on them, and a headless pointer never leaves: move it off and let them go
const calm = async p => { await p.mouse.move(1, 1); await p.waitForFunction(() => !document.querySelector('[data-slot=toast-title]'), null, { timeout: 20000 }); };
const saved = p => p.waitForFunction(() => /Saved/.test(document.querySelector('[data-slot=toast-viewport]')?.textContent || ''));
const confirmYes = p => p.click(T('confirm-yes'));
// the country picker: a full screen over the map
const PICKER = T('picker');
const browse = async (p, id) => { await p.click(`${T('country')}[data-id=${id}]`); await p.waitForFunction(i => window.__homefront.view.map.id === i && !window.__homefront.ui.picker.busy && document.querySelector('[data-testid=briefing]')?.dataset.id === i, id); };
const pickCountry = async p => { await settings(p); await p.click(T('change-country')); await p.waitForSelector(PICKER); };
const send = async (p, text) => { await nav(p, 'report'); await p.fill('#report-text', text); await p.click(T('send')); };

try {
  {
    const c0 = await browser.newContext({ ...devices['iPhone 14 Pro'] }); const q = await c0.newPage();
    await step('private: a password wall, then the app', async () => {
      const r = await q.goto(URL_); assert.equal(r.status(), 401); assert.ok(await q.locator('#p').count()); assert.equal(await q.locator('#mapwrap').count(), 0);
      await q.screenshot({ path: shots + '00-login.png' });
      await q.fill('#p', 'nope'); await q.click('button'); await q.waitForFunction(() => /Wrong/.test(document.querySelector('#e').textContent));
      await q.fill('#p', 'open sesame'); await q.click('button'); await q.waitForFunction(() => window.__homefront?.st);
      const cfg = await q.evaluate(() => window.__homefront.cfg); assert.equal(cfg.judge, 'gpt-6-luna'); assert.equal(cfg.transcribe, 'gpt-transcribe'); assert.equal(cfg.login, true); assert.doesNotMatch(JSON.stringify(cfg), /sk-/);
      assert.equal(await q.evaluate(() => JSON.stringify(localStorage).includes('sk-')), false);
      assert.equal(await q.locator('#mapwrap canvas').count(), 2, 'the map has its two canvases');
    });
    await c0.close();
  }
  let { ctx, p } = await open();
  await step('first run: choose your country on a full screen, the map behind it', async () => {
    await p.waitForSelector(PICKER); assert.equal(await p.textContent(T('picker-title')), 'Choose your country'); assert.equal(await sheetOpen(p), false);
    assert.equal(await p.locator(T('picker-close')).count(), 0, 'a first run has to choose'); assert.equal(await p.locator('nav[aria-label=Main]').count(), 0);
    assert.deepEqual(await p.evaluate(() => window.__homefront.scenarios.map(s => s.id).filter(id => id === 'iran' || id === 'testland')), ['iran', 'testland']);
    assert.equal(await p.locator(T('country')).count(), await p.evaluate(() => window.__homefront.scenarios.length)); assert.equal(await p.locator(`${T('country')} [data-flag]`).count(), await p.locator(T('country')).count());
    // the shipped countries wear their real flag, a picture that loads; the test country keeps its stripes
    assert.equal(await p.locator(`${T('country')}[data-id=iran] img`).evaluate(i => i.complete && i.naturalWidth > 0), true); assert.equal(await p.locator(`${T('country')}[data-id=testland] [data-flag-kind=stripes]`).count(), 1);
    assert.deepEqual(await p.evaluate(() => window.__homefront.scenarios.filter(s => s.id !== 'testland').map(s => s.name)), ['Ethiopia', 'France', 'Greece', 'Iran', 'Mexico', 'Peru', 'Siam', 'Turkey'], 'in alphabetical order');
    // a new visitor starts on a country picked at random, not on any one country
    const first = await p.evaluate(() => window.__homefront.ui.picker.id); assert.equal(await p.evaluate(() => window.__homefront.data.scenario), first);
    assert.equal(await p.getAttribute(`${T('country')}[data-id=${first}]`, 'aria-checked'), 'true'); await browse(p, 'iran');
    assert.equal(await p.getAttribute(`${T('country')}[data-id=iran]`, 'aria-checked'), 'true'); assert.match(await p.textContent(`${T('country')}[data-id=testland]`), /Testland/);
    // the briefing: who it is, what it restores, and its real numbers on the first day
    const brief = () => p.textContent(T('briefing'));
    assert.match(await brief(), /Iran.*Imperial State of Iran · 1936.*Achaemenid Empire.*Restore the empire of Cyrus/s);
    const n = await p.evaluate(() => { const s = window.__homefront.view.st; return [s.divisions.length, s.fleets.reduce((a, f) => a + f.ships.length, 0), s.wings.length]; });
    assert.deepEqual(await p.locator(`${T('brief-stats')} [data-slot=stat-value]`).evaluateAll(els => els.map(e => Number(e.textContent))), n);
    assert.equal(await p.locator(T('brief-front')).count(), 7); assert.match(await p.textContent(`${T('brief-front')}[data-front=glf]`), /Persian Gulf Theatre.*Royal Navy · Naval.*Self/s); assert.match(await p.textContent(`${T('brief-front')}[data-front=afg]`), /Afghan Front.*Afghanistan · Land.*School/s);
    assert.equal(await p.textContent(T('play')), 'Play as Iran');
    // a phone: the map keeps the top of the screen, the button is in reach without scrolling
    const box = await p.evaluate(() => { const r = e => document.querySelector(e).getBoundingClientRect(); const m = r('#mapwrap'), b = r('[data-testid=play]'); return { map: m.height / innerHeight, top: m.top, play: b.bottom, h: innerHeight, w: innerWidth, right: b.right, scroll: document.documentElement.scrollWidth }; });
    assert.ok(box.map > 0.4 && box.map < 0.55 && box.top === 0, `the map has the top of the screen: ${box.map}`); assert.ok(box.play <= box.h && box.right <= box.w && box.scroll <= box.w, 'nothing is clipped');
    await shot(p, '00-country');
    // browsing another country puts its map behind the picker and chooses nothing
    await browse(p, 'testland');
    assert.equal(await p.getAttribute(`${T('country')}[data-id=testland]`, 'aria-checked'), 'true'); assert.match(await brief(), /Testland.*Platine Confederation/s); assert.equal(await p.textContent(T('play')), 'Play as Testland'); assert.equal(await p.locator(T('brief-front')).count(), 7);
    const b = await p.evaluate(() => { const a = window.__homefront; return { view: a.view.map.id, home: a.view.homeTag, scenario: a.data.scenario, map: a.map.id, fronts: Object.keys(a.view.st.fronts), log: a.view.st.log.length }; });
    assert.equal(b.view, 'testland'); assert.equal(b.home, 'URU'); assert.equal(b.scenario, first); assert.equal(b.map, first); assert.deepEqual(b.fronts, TL); assert.equal(b.log, 0);
    assert.equal(await p.locator('#mapwrap canvas').count(), 2, 'the same two canvases'); await shot(p, '00-country-browse');
    await browse(p, 'iran'); await p.click(T('play')); await p.waitForFunction(() => document.querySelector('[data-testid=sheet-title]')?.textContent === 'Your fronts');
    assert.equal(await p.locator(PICKER).count(), 0); assert.equal(await p.evaluate(() => window.__homefront.view.map.id), 'iran'); assert.equal(await p.evaluate(() => document.querySelector('#mapwrap').getBoundingClientRect().height === innerHeight), true);
    assert.equal(await p.evaluate(() => window.__homefront.data.scenario), 'iran'); assert.equal(await p.textContent(T('nation-name')), 'Iran'); assert.equal(await p.locator(`${T('identity')} [data-flag]`).count(), 1);
  });
  await step('first run: name your fronts', async () => {
    assert.equal(await title(p), 'Your fronts'); assert.match(await body(p), /Each border of Iran/);
    assert.ok(await p.locator(`${SHEET} [role=radio]`).count() >= 7); await p.click('[data-choice=founder]');
    await p.waitForFunction(() => document.querySelector('input[data-front=afg]')?.value !== 'School', null, { timeout: 3000 }); // the preset fills the names on the next render await shot(p, '00-welcome');
    await p.evaluate(() => { const a = window.__homefront; a.data.labels = {}; a.data.notes = {}; a.data.off = []; a.save(); a.refresh(); });
    await p.fill('input[data-front=tur]', 'Guitar'); await p.click(T('begin')); await gone(p);
    assert.equal(await p.evaluate(() => window.__homefront.data.labels.tur), 'Guitar'); assert.equal(await p.evaluate(() => window.__homefront.data.onboarded), true);
    assert.equal(await p.locator('nav[aria-label=Main] button').count(), 3);
  });
  await shot(p, '01-map');

  await step('every division has its own icon on the map', async () => {
    const n = await p.evaluate(() => window.__homefront.view.hits.filter(h => h.data.kind === 'division').length);
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
    assert.ok(await p.evaluate(() => window.__homefront.live.commander.xp > 0 && window.__homefront.live.orders.length === 3)); assert.equal(mock.seen.at(-1).body.model, 'gpt-6-luna');
  });
  await p.waitForTimeout(1200); await shot(p, '03-after');

  await step('undo', async () => { await p.click('[data-slot=toast-viewport] button:has-text("Undo")'); assert.equal((await st(p)).log, 0); });

  await step('unclear report asks one question: which front, win or loss', async () => {
    await send(p, 'Went to the dentist.');
    await p.waitForSelector(T('pick')); await shot(p, '04-pick');
    await p.click(`${T('pick')} >> nth=4 >> text=Win`); await p.waitForTimeout(200);
    const s = await st(p); assert.equal(s.log, 1); assert.equal(s.fronts.raj.wins, 1);
    assert.equal(await p.evaluate(() => window.__homefront.live.log[0].items[0].headline), 'Went to the dentist.');
  });

  await step('fronts list → front: objective, one-tap win/loss, division icons', async () => {
    await nav(p, 'fronts'); assert.equal(await p.locator(`${SHEET} ${T('front')}`).count(), 7); await shot(p, '05-fronts');
    await p.click(`${T('front')}[data-front=afg]`); await p.waitForSelector(T('sheet-back')); assert.equal(await title(p), 'School');
    assert.match(await body(p), /Next objective/); assert.match(await body(p), /Capture /);
    assert.equal(await p.locator(`${T('division')} [data-unit-icon] svg`).count(), 4, 'every division in the list wears its icon'); await shot(p, '06-front');
    await calm(p); await p.click(T('quick-loss')); await p.waitForTimeout(200);
    assert.equal((await st(p)).fronts.afg.losses, 1);
    await nav(p, 'fronts'); await p.click(`${T('front')}[data-front=afg]`); await p.click(`${T('division')} >> nth=0`); await p.waitForFunction(() => window.__homefront.ui.sheet === 'division');
    assert.match(await title(p), /Khorasan Infantry|Mashhad Infantry/); assert.match(await body(p), /Brig\. Gen\./); assert.match(await body(p), /Battle honours/); assert.equal(await p.locator(`${SHEET} [data-unit-icon] svg`).count(), 1); await shot(p, '07-division');
    assert.match(await p.evaluate(() => window.__homefront.live.log.at(-1).fx[0].text), /gives ground/);
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
    assert.equal(await p.evaluate(() => window.__homefront.st.log.length), 0); assert.equal((await st(p)).log, 1);
    await shot(p, '10-replay'); await p.click(T('replay-exit')); await p.waitForSelector(T('replay-bar'), { state: 'detached' });
  });

  await step('map: tap a province, tap a division, layers', async () => {
    await p.waitForTimeout(900); // the replay re-centred the map with an animation: let it finish before placing the view
    await p.evaluate(() => { const a = window.__homefront; const t = a.map.provinces[a.map.tehran]; a.view.flyTo(t.c[0], t.c[1] + 40, 1.2, false); }); await p.waitForTimeout(200);
    const pt = await p.evaluate(() => { const a = window.__homefront; const q = a.map.provinces.find(x => x.n === 'Qom'); const [x, y] = a.view.toScreen(q.c[0], q.c[1]); const r = document.querySelector('#over').getBoundingClientRect(); return [r.left + x, r.top + y]; });
    await p.mouse.click(pt[0], pt[1]); await p.waitForSelector(SHEET); assert.equal(await title(p), 'Qom'); await shut(p);
    await p.click(T('home')); await p.waitForTimeout(800);
    const h = await p.evaluate(() => { const a = window.__homefront; const h = a.view.hits.filter(h => h.data.kind === 'front' && h.data.id === 'irq').at(-1); const r = document.querySelector('#over').getBoundingClientRect(); return [r.left + h.x + h.w / 2, r.top + h.y + h.h / 2]; });
    await p.mouse.click(h[0], h[1]); await p.waitForSelector(SHEET); assert.equal(await title(p), 'Work'); await shut(p);
    const dv = await p.evaluate(() => { const a = window.__homefront; const h = a.view.hits.find(h => h.data.kind === 'division'); const r = document.querySelector('#over').getBoundingClientRect(); return [r.left + h.x + h.w / 2, r.top + h.y + h.h / 2]; });
    await p.mouse.click(dv[0], dv[1]); await p.waitForSelector(SHEET); assert.match(await body(p), /Battle honours/); await shut(p);
    for (const m of ['life', 'infra', 'political']) {
      await p.click(T('layers')); await p.waitForSelector(`[data-mode=${m}]`); if (m === 'life') await shot(p, '11-layers');
      await p.click(`[data-mode=${m}]`); await p.waitForFunction(mode => window.__homefront.view.mode === mode, m);
      if (m === 'life') { await p.waitForSelector(T('legend')); assert.match(await p.textContent(T('legend')), /Guitar/); await shot(p, '12-life'); }
      if (m === 'political') assert.equal(await p.locator(T('legend')).count(), 0);
      await p.waitForSelector('[data-slot=menu-popup]', { state: 'detached' });
    }
  });

  await step('judged by gpt-6-luna through the server; paused fronts are left out', async () => {
    await settings(p);
    await p.waitForSelector(`${T('open-staff')}[data-provider=openai]`); assert.match(await body(p), /General staff.*OpenAI.*gpt-6-luna\. Voice by gpt-transcribe\./s); assert.equal(await p.locator('input[type=password]').count(), 0);
    await p.click(`${T('front-switch')}[data-front=raj]`); assert.deepEqual(await p.evaluate(() => window.__homefront.data.off), ['raj']); await shot(p, '13-settings');
    await send(p, 'We closed the seed round! But I missed my flight home.'); await saved(p);
    const req = mock.seen.filter(x => x.path === '/v1/responses').at(-1).body;
    assert.match(req.input[1].content, /closed the seed round/); assert.match(req.input[0].content, /Guitar/); assert.doesNotMatch(req.input[0].content, /raj: Baluchistan/); assert.equal(req.model, 'gpt-6-luna');
    assert.ok(!req.text.format.schema.properties.items.items.properties.front.enum.includes('raj'));
    const s = await st(p); assert.ok(s.fronts.irq.pos < -6); assert.ok(s.lib > 0); assert.ok(s.fronts.glf.pos > 0); assert.ok(s.ach.decisive);
    await p.waitForTimeout(1300); await shot(p, '14-breakthrough');
    await overview(p); await p.waitForFunction(() => /bleeding/.test(document.querySelector('[data-testid=sheet-body]')?.textContent || ''));
    assert.equal(await p.evaluate(() => { const a = window.__homefront; const i = a.live.log.at(-1).items.find(x => x.action === 'port_strike'); return a.map.provinces[i.at].f.includes('P'); }), true, 'the port strike landed on a real port');
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
    await p.waitForTimeout(200); assert.match(await p.evaluate(() => navigator.clipboard.readText()), /Mesopotamian Front \(Work\)/);
  });

  await step('ask the staff answers from history; sound can be switched off', async () => {
    await nav(p, 'history'); await p.fill('[aria-label="Ask about your history"]', 'when did I last report on the startup?'); await p.press('[aria-label="Ask about your history"]', 'Enter');
    await p.waitForSelector(T('answer')); assert.ok((await p.textContent(T('answer'))).length > 20); await shot(p, '15c-ask');
    await p.click(`${T('answer')} >> text=Clear`); await p.waitForSelector(T('answer'), { state: 'detached' });
    await settings(p); await p.click(T('sound'));
    assert.equal(await p.evaluate(() => window.__homefront.data.settings.sound), false); await p.click(T('sound')); assert.equal(await p.evaluate(() => window.__homefront.data.settings.sound), true);
    // appearance is the design system's: light, dark, or Auto
    await p.click(`${SHEET} [role=radio]:has-text("Dark")`); await p.waitForFunction(() => document.documentElement.dataset.theme === 'dark');
    await p.click(`${SHEET} [role=radio]:has-text("Light")`); await p.waitForFunction(() => document.documentElement.dataset.theme === 'light'); await shot(p, '13b-settings-light');
    await p.click(`${SHEET} [role=radio]:has-text("Auto")`); await p.waitForFunction(() => document.documentElement.dataset.appearance === 'system');
    // motion off quiets the celebrations and the interface alike
    await p.click(T('motion')); assert.equal(await p.evaluate(() => document.documentElement.dataset.motion), 'reduce'); await p.click(T('motion')); assert.equal(await p.evaluate(() => window.__homefront.data.settings.motion), true);
  });

  await step('general staff: set your own key in Settings, test it, judge through it, remove it', async () => {
    const cfg = () => p.evaluate(() => window.__homefront.cfg); const status = s => p.waitForSelector(`${T('staff-provider')} ${T('staff-status')}[data-status=${s}]`);
    const undo = async () => { await p.click('[data-slot=toast-viewport] button:has-text("Undo")'); await p.waitForFunction(() => /Undone/.test(document.querySelector('[data-slot=toast-viewport]')?.textContent || '')); };
    const before = (await st(p)).log;
    // through the status card: the flag counts its presses (every seventh says the motto), and this step must not shift that count
    const toSettings = async () => { await shut(p); await p.click(T('status')); await p.waitForSelector(SHEET); await p.click(T('open-settings')); await p.waitForFunction(() => window.__homefront.ui.sheet === 'settings'); };
    // Settings names who judges now: the key in .env, which the app can use but not read or remove
    await toSettings(); await p.waitForSelector(`${T('open-staff')}[data-provider=openai]`); assert.match(await p.textContent(T('open-staff')), /OpenAI.*gpt-6-luna.*Voice by gpt-transcribe.*Ready/s);
    await p.click(T('open-staff')); await p.waitForSelector(T('provider')); assert.equal(await title(p), 'General staff');
    assert.deepEqual(await p.locator(T('provider')).evaluateAll(els => els.map(e => e.dataset.id)), ['openai', 'anthropic', 'gemini', 'groq', 'mistral', 'openrouter', 'local', 'offline']);
    assert.deepEqual(await p.locator(`${T('provider')} svg[data-mark=brand]`).evaluateAll(els => els.map(e => e.dataset.providerLogo)), ['anthropic', 'gemini', 'mistral', 'openrouter'], 'real marks, in the ink of the tile');
    assert.equal(await p.locator(`${T('provider')} svg`).evaluateAll(els => els.every(e => getComputedStyle(e).fill !== '' && !e.querySelector('[fill^="#"]'))), true);
    assert.equal(await p.getAttribute(`${T('provider')}[data-id=openai]`, 'aria-checked'), 'true'); await status('ready');
    assert.match(await p.textContent(T('key-saved')), /Set on the server/); assert.equal(await p.locator(T('key-remove')).count(), 0); assert.equal(await p.locator(T('key-tail')).count(), 0);
    // another provider: no key yet, so the offline judge is in force until there is one
    await p.click(`${T('provider')}[data-id=anthropic]`); await status('no_key'); assert.match(await p.textContent(T('staff-provider')), /Anthropic.*No key/s);
    assert.equal(await p.inputValue(T('staff-model')), 'claude-haiku-5-5', 'the small model is filled in'); assert.match(await p.textContent(T('staff-provider')), /A small model is enough/);
    assert.equal(await p.getAttribute(T('key-input'), 'type'), 'password'); assert.equal(await p.getAttribute(T('key-link'), 'href'), 'https://console.anthropic.com/settings/keys');
    assert.equal(await p.isDisabled(T('staff-test')), true); assert.equal((await cfg()).judge, null); await shot(p, '13c-staff-no-key');
    // a wrong key is saved, tried, and refused in plain words
    await p.fill(T('key-input'), 'sk-ant-wrong-key-0000'); await p.click(T('key-save')); await p.waitForSelector(T('key-saved')); assert.equal(await p.textContent(T('key-tail')), '•••• 0000'); await status('ready');
    await p.click(T('staff-test')); await p.waitForSelector(`${T('test-result')}[data-ok=no]`); assert.match(await p.textContent(T('test-result')), /The provider rejected the key\. Check it, or replace it\./);
    await status('rejected'); assert.match(await p.textContent(T('staff-provider')), /Key rejected/);
    // the right one, pasted over it: Ready, and the test passes against the stand-in
    await p.click(T('key-replace')); await p.fill(T('key-input'), STAFF_KEY); await p.press(T('key-input'), 'Enter'); await status('ready'); assert.equal(await p.textContent(T('key-tail')), `•••• ${STAFF_KEY.slice(-4)}`);
    await p.click(T('staff-test')); await p.waitForSelector(`${T('test-result')}[data-ok=yes]`); assert.match(await p.textContent(T('test-result')), /Works\. claude-haiku-5-5 answered/); await shot(p, '13d-staff-ready');
    assert.equal(anthropic.seen.at(-1).key, STAFF_KEY); assert.match(anthropic.seen.at(-1).body.system, /connection test/);
    // the key went to the server and did not come back: not in the page, not in storage, not in what the app holds
    const held = await p.evaluate(() => document.documentElement.outerHTML + JSON.stringify(localStorage) + JSON.stringify(sessionStorage) + JSON.stringify(window.__homefront.ai) + JSON.stringify(window.__homefront.cfg) + JSON.stringify(window.__homefront.data));
    assert.equal(held.includes(STAFF_KEY), false); assert.equal(held.includes('wrong-key'), false); assert.equal((await cfg()).judge, 'claude-haiku-5-5');
    // the model can be changed, and put back
    await p.fill(T('staff-model'), 'claude-some-other-model'); await p.press(T('staff-model'), 'Enter'); await p.waitForSelector(T('model-default')); assert.equal((await cfg()).judge, 'claude-some-other-model');
    await p.click(T('model-default')); await p.waitForSelector(T('model-default'), { state: 'detached' }); assert.equal(await p.inputValue(T('staff-model')), 'claude-haiku-5-5');
    // Anthropic cannot turn speech into text: voice is chosen apart, and stays on this device
    assert.match(await p.textContent(T('staff-voice')), /Anthropic can’t turn speech into text.*On this device/s); assert.equal((await cfg()).transcribe, null); assert.equal(await p.locator(T('voice-test')).count(), 0);
    // a report is judged through the chosen provider
    let n = anthropic.seen.length; const m = mock.seen.length;
    await send(p, 'I failed my exam'); await gone(p); await p.waitForFunction(b => window.__homefront.live.log.length === b + 1, before);
    assert.equal(anthropic.seen.length, n + 1); assert.equal(mock.seen.length, m, 'not through the provider in .env');
    const sent = anthropic.seen.at(-1); assert.equal(sent.body.model, 'claude-haiku-5-5'); assert.equal(sent.version, '2026-10-21'); assert.equal(sent.body.output_config.format.type, 'json_schema'); assert.deepEqual(sent.body.output_config.format.schema.required, ['summary', 'items']);
    assert.deepEqual(await p.evaluate(() => { const r = window.__homefront.data.reports.at(-1); return [r.source, r.items[0].front, r.items[0].headline]; }), ['llm', 'afg', 'Exam failed']); await undo();
    await toSettings(); await p.waitForSelector(`${T('open-staff')}[data-provider=anthropic]`); assert.match(await p.textContent(T('open-staff')), /Anthropic.*claude-haiku-5-5.*Voice on this device.*Ready/s);
    assert.equal(await p.locator(`${T('open-staff')} svg[data-provider-logo=anthropic][data-mark=brand]`).count(), 1); await shot(p, '13e-settings-staff');
    // remove the key: a question first, then the offline judge takes over
    await p.click(T('open-staff')); await p.waitForSelector(T('key-remove')); await p.click(T('key-remove')); await p.waitForSelector(T('confirm')); assert.match(await p.textContent(T('confirm')), /Remove the Anthropic key\?.*judged offline/s);
    await confirmYes(p); await status('no_key'); assert.equal(await p.locator(T('key-input')).count(), 1); assert.equal((await cfg()).judge, null);
    n = anthropic.seen.length;
    await send(p, 'Great day at school, I aced the exam.'); await gone(p); await p.waitForFunction(b => window.__homefront.live.log.length === b + 1, before);
    assert.equal(anthropic.seen.length, n); assert.equal(mock.seen.length, m, 'nothing left the server');
    assert.deepEqual(await p.evaluate(() => { const r = window.__homefront.data.reports.at(-1); return [r.source, r.items[0].outcome]; }), ['local', 'win']); await undo();
    // back to the provider in .env, as the rest of this run expects
    await toSettings(); await p.click(T('open-staff')); await p.waitForSelector(T('provider')); await p.click(`${T('provider')}[data-id=openai]`);
    // the previous provider's status was already "ready": wait for the switch itself, then for its status
    await p.waitForFunction(() => window.__homefront.cfg.judge === 'gpt-6-luna', null, { timeout: 15000 }); await status('ready');
    assert.deepEqual(await cfg().then(c => [c.judge, c.transcribe]), ['gpt-6-luna', 'gpt-transcribe']); assert.equal((await st(p)).log, before);
  });

  await step('local model: find what is running, pick a model from its list, test it, judge a report through it', async () => {
    const cfg = () => p.evaluate(() => window.__homefront.cfg); const status = s => p.waitForSelector(`${T('staff-provider')} ${T('staff-status')}[data-status=${s}]`);
    const before = (await st(p)).log;
    const toSettings = async () => { await shut(p); await p.click(T('status')); await p.waitForSelector(SHEET); await p.click(T('open-settings')); await p.waitForFunction(() => window.__homefront.ui.sheet === 'settings'); };
    await toSettings(); await p.click(T('open-staff')); await p.waitForSelector(T('provider'));
    await p.click(`${T('provider')}[data-id=local]`); await p.waitForSelector(`${T('staff-provider')}[data-provider=local]`);
    assert.match(await p.textContent(T('staff-provider')), /Local model.*Nothing leaves your network.*Find local models/s); assert.equal(await p.locator(T('local-key')).count(), 0, 'the key is under Advanced, closed');
    // find: the one server that answered is used, with the first of its models
    await p.click(T('local-find')); await p.waitForSelector(`${T('local-found')}[data-count="1"]`); assert.equal(await p.textContent(T('local-found')), 'Found Ollama with 3 models.');
    await p.waitForSelector(`${T('local-models-state')}[data-reason=listed]`); assert.equal(await p.inputValue(T('local-address')), 'http://127.0.0.1:8127/v1'); await status('ready');
    assert.equal((await cfg()).judge, 'qwen3:4b');
    // pick another from the list: sizes and quantisation as the server reports them
    await p.click('[aria-label="Installed models"]'); await p.click('[role=option]:has-text("gemma3:4b")');
    await p.waitForFunction(() => window.__homefront.cfg.judge === 'gemma3:4b' && document.querySelector('[data-testid=staff-model]').value === 'gemma3:4b');
    assert.match(await p.textContent('[aria-label="Installed models"]'), /gemma3:4b · 3\.2B Q4_K_M · 2\.0 GB/);
    await p.click(T('staff-test')); await p.waitForSelector(`${T('test-result')}[data-ok=yes]`); assert.match(await p.textContent(T('test-result')), /^Works\. gemma3:4b answered in .*, held to the schema\.$/);
    await shot(p, '13f-local-model');
    // "this very specific model": any name can be typed; one the server lacks is named, with the command that gets it
    await p.fill(T('staff-model'), 'mistral-small3.2:24b'); await p.press(T('staff-model'), 'Enter');
    await p.waitForSelector(`${T('local-models-state')}[data-reason=not_installed]`); assert.match(await p.textContent(T('local-models-state')), /mistral-small3\.2:24b isn’t in this server’s list\. To install it: ollama pull mistral-small3\.2:24b\./);
    await p.click(T('staff-test')); await p.waitForSelector(`${T('test-result')}[data-reason=model_missing]`); assert.match(await p.textContent(T('test-result')), /has no model called mistral-small3\.2:24b\. Run ollama pull mistral-small3\.2:24b/);
    await p.fill(T('staff-model'), 'gemma3:4b'); await p.press(T('staff-model'), 'Enter'); await p.waitForSelector(`${T('local-models-state')}[data-reason=listed]`);
    // Advanced: the rest, closed until asked for
    await p.click(`${T('local-advanced')} [data-slot=collapsible-trigger]`); await p.waitForSelector(T('local-key')); await p.waitForSelector(T('local-keepAlive'));
    // a report is judged by the local model, and nothing goes to the provider in .env
    const n = ollama.seen.length, m = mock.seen.length;
    await send(p, 'I failed my exam'); await gone(p); await p.waitForFunction(b => window.__homefront.live.log.length === b + 1, before);
    const sent = ollama.seen.slice(n).filter(x => /chat/.test(x.path)); assert.equal(sent.length, 1); assert.equal(sent[0].body.model, 'gemma3:4b', `judged by ${sent[0].body.model}; app says ${JSON.stringify(await cfg())}`); assert.equal(sent[0].body.response_format.type, 'json_schema'); assert.equal(mock.seen.length, m);
    assert.deepEqual(await p.evaluate(() => { const r = window.__homefront.data.reports.at(-1); return [r.source, r.items[0].front]; }), ['llm', 'afg']);
    await p.click('[data-slot=toast-viewport] button:has-text("Undo")'); await p.waitForFunction(() => /Undone/.test(document.querySelector('[data-slot=toast-viewport]')?.textContent || ''));
    // Settings says which model and where
    await toSettings(); await p.waitForSelector(`${T('open-staff')}[data-provider=local]`); assert.match(await p.textContent(T('open-staff')), /Local model.*gemma3:4b.*Ready/s);
    // back to the provider in .env, as the rest of this run expects
    await p.click(T('open-staff')); await p.waitForSelector(T('provider')); await p.click(`${T('provider')}[data-id=openai]`);
    // the previous provider's status was already "ready": wait for the switch itself, then for its status
    await p.waitForFunction(() => window.__homefront.cfg.judge === 'gpt-6-luna', null, { timeout: 15000 }); await status('ready');
    assert.deepEqual(await cfg().then(c => [c.judge, c.transcribe]), ['gpt-6-luna', 'gpt-transcribe']); assert.equal((await st(p)).log, before);
  });

  await step('backup: export → reset → import', async () => {
    await settings(p);
    const [dl] = await Promise.all([p.waitForEvent('download'), p.click(T('export'))]); const file = shots + 'backup.json'; await dl.saveAs(file);
    const j = JSON.parse(fs.readFileSync(file)); assert.equal(j.reports.length, 2); assert.doesNotMatch(JSON.stringify(j), /sk-/); assert.deepEqual(j.off, ['raj']);
    await p.click(T('reset')); assert.match(await p.textContent(T('confirm')), /Erase everything\?/); await confirmYes(p); await p.waitForFunction(() => window.__homefront.live.log.length === 0);
    await p.setInputFiles('#importfile', file); await p.waitForTimeout(300);
    assert.equal((await st(p)).log, 2);
  });

  await step('another device signs in and sees the same war', async () => {
    await p.waitForTimeout(900);
    const o = await open(); const s2 = await o.p.evaluate(() => ({ n: window.__homefront.data.reports.length, off: window.__homefront.data.off, tur: window.__homefront.data.labels.tur }));
    assert.equal(s2.n, 2); assert.deepEqual(s2.off, ['raj']); assert.equal(s2.tur, 'Guitar'); await o.ctx.close();
    assert.equal(JSON.parse(fs.readFileSync(path.join(dataDir, 'state.json'))).data.reports.length, 2);
  });
  await ctx.close();

  // ---- another country: its own map, its own campaign, and the way back ----
  ({ ctx, p } = await open());
  await step('settings → country: Testland has its own map and an empty campaign', async () => {
    await settings(p); assert.match(await body(p), /Change country/);
    const snap = () => p.evaluate(() => { const a = window.__homefront; return JSON.stringify({ scenario: a.data.scenario, map: a.map.id, view: a.view.map.id, n: a.data.reports.length, labels: a.data.labels, off: a.data.off, campaigns: Object.keys(a.data.campaigns || {}), fronts: Object.entries(a.live.fronts).map(([k, f]) => [k, f.pos, f.wins, f.losses]), shown: Object.entries(a.view.st.fronts).map(([k, f]) => [k, f.pos, f.wins, f.losses]), log: a.view.st.log.length, occ: a.view.st.terr.occ.size, lib: a.view.st.terr.lib.size, sheet: a.ui.sheet, full: document.querySelector('#mapwrap').getBoundingClientRect().height === innerHeight }); });
    const before = await snap();
    await p.click(T('change-country')); await p.waitForSelector(PICKER); assert.equal(await p.textContent(T('picker-title')), 'Change country'); assert.match(await p.textContent(T('briefing')), /Iran.*Playing/s);
    assert.equal(await p.textContent(T('play')), 'Continue as Iran', 'Iran has a campaign'); assert.equal(await p.locator(T('picker-close')).count(), 1); await p.waitForSelector(SHEET, { state: 'detached' }); await shot(p, '21-country');
    // cancelling after a look at another country leaves the country, the campaign and the map as they were
    await browse(p, 'testland'); assert.equal(await p.textContent(T('play')), 'Play as Testland'); assert.doesNotMatch(await p.textContent(T('briefing')), /Playing/);
    assert.equal(await p.evaluate(() => window.__homefront.view.map.id + ' ' + window.__homefront.data.scenario + ' ' + window.__homefront.map.id), 'testland iran iran');
    await p.click(T('picker-close')); await p.waitForSelector(PICKER, { state: 'detached' }); await p.waitForSelector(SHEET);
    assert.equal(await snap(), before, 'nothing changed'); assert.equal(await title(p), 'Settings'); assert.doesNotMatch(await toasts(p), /Now playing/);
    assert.equal(JSON.parse(before).view, 'iran'); assert.equal(JSON.parse(before).n, 2);
    // "Play as" on a new country starts an empty campaign there
    await p.click(T('change-country')); await p.waitForSelector(PICKER); await browse(p, 'testland');
    await p.click(T('play')); await p.waitForFunction(() => window.__homefront.map.id === 'testland' && window.__homefront.st?.fronts.lit && window.__homefront.ui.sheet === 'settings' && !window.__homefront.ui.picker);
    await p.waitForSelector(SHEET);
    assert.equal(await title(p), 'Settings'); assert.equal(await p.textContent(T('nation-name')), 'Testland'); assert.match(await toasts(p), /Now playing Testland/);
    const d = await p.evaluate(() => { const a = window.__homefront; return { scenario: a.data.scenario, n: a.data.reports.length, iran: a.data.campaigns.iran, labels: a.data.labels, off: a.data.off, fronts: Object.keys(a.live.fronts), log: a.live.log.length, view: a.view.map.id, home: a.view.homeTag }; });
    assert.equal(d.scenario, 'testland'); assert.equal(d.n, 0); assert.equal(d.log, 0); assert.deepEqual(d.fronts, TL); assert.equal(d.view, 'testland'); assert.equal(d.home, 'URU');
    assert.equal(d.iran.reports.length, 2, 'the Iranian campaign is put away whole'); assert.equal(d.iran.labels.tur, 'Guitar'); assert.deepEqual(d.iran.off, ['raj']);
    assert.equal(d.labels[TL[5]], 'Guitar', 'life areas carry over slot by slot'); assert.deepEqual(d.off, [TL[4]]);
    assert.equal(await p.inputValue(`input[data-front=${TL[5]}]`), 'Guitar'); assert.equal(await p.locator(T('front-name')).count(), 7);
    await shut(p); await p.evaluate(() => window.__homefront.view.home(false)); await shot(p, '22-testland-map');
    const n = await p.evaluate(() => { const a = window.__homefront; return { tokens: a.view.hits.filter(h => h.data.kind === 'division').length, divs: a.live.divisions.length, fleets: a.view.hits.filter(h => h.data.kind === 'fleet').length, squadrons: a.view.hits.filter(h => h.data.kind === 'front' && !h.data.battle).length }; });
    assert.equal(n.fleets, 1); assert.ok(n.tokens > 10 && n.tokens <= n.divs); assert.ok(n.squadrons >= 1);
  });
  await step('a report on Testland moves Testland\'s fronts and nobody else\'s', async () => {
    await send(p, 'Finished the thesis chapter after the river patrol. Friends cancelled again.'); await saved(p);
    const req = mock.seen.filter(x => x.path === '/v1/responses').at(-1).body;
    assert.match(req.input[0].content, /war map of Testland/); assert.match(req.input[0].content, /- lit: Littoral Front \(vs Argentina\)/); assert.match(req.input[0].content, /Only these have a fleet: pla, atl/); assert.doesNotMatch(req.input[0].content, /Iran|Afghan|Tehran/);
    assert.deepEqual(req.text.format.schema.properties.items.items.properties.front.enum, TL.filter(id => id !== TL[4]));
    const s = await st(p); assert.equal(s.log, 1); assert.ok(s.fronts[TL[0]].pos < -3); assert.ok(s.fronts[TL[6]].pos > 0, 'the sixth front on offer, the paused one left out, is the Atlantic'); assert.ok(s.lib > 0);
    assert.equal(await p.evaluate(() => window.__homefront.live.log[0].items[1].action), 'naval_defeat'); assert.ok(await p.evaluate(() => window.__homefront.live.fleets[0].ships.some(x => x.hp < 100)));
    await p.waitForTimeout(1300); await shot(p, '23-testland-after');
    await nav(p, 'fronts'); assert.equal(await p.locator(`${SHEET} ${T('front')}`).count(), 7); assert.match(await body(p), /inside Testland/);
    await p.click(`${T('front')}[data-front=${TL[0]}]`); await p.waitForSelector(T('sheet-back')); assert.match(await body(p), /Littoral Front/); assert.match(await body(p), /Durazno/); assert.match(await body(p), /the Mesopotamian Littoral/); await shot(p, '24-testland-front');
    await p.click(`${T('division')} >> nth=0`); await p.waitForFunction(() => window.__homefront.ui.sheet === 'division'); assert.match(await title(p), /Salto|Daymán|Arapey/);
    await overview(p); assert.equal(await title(p), 'Oriental Republic of Testland'); assert.match(await body(p), /Soldado/); assert.doesNotMatch(await body(p), /Sarbaz|\d{4} AP/); await shot(p, '25-testland-overview');
    await p.evaluate(() => { navigator.canShare = undefined; }); await p.click(T('open-share')); await p.waitForSelector(`${T('share-card')}[data-kind=rank] canvas`); assert.equal(await p.locator(`${T('share-card')} canvas`).count(), 4); await shot(p, '26-testland-share');
    await shut(p);
    const pt = await p.evaluate(() => { const a = window.__homefront; const q = a.map.provinces[a.map.capital]; a.view.flyTo(q.c[0], q.c[1], 1.4, false); a.view._clamp(); a.view.draw(); const [x, y] = a.view.toScreen(q.c[0] + 6, q.c[1] + 14); const r = document.querySelector('#over').getBoundingClientRect(); return [r.left + x, r.top + y]; });
    await p.mouse.click(pt[0], pt[1]); await p.waitForSelector(SHEET); assert.match(await body(p), /held by Testland/); assert.match(await body(p), /Durazno garrison/);
    await p.click(`${SHEET} button:has-text("Durazno garrison")`); await p.waitForFunction(() => window.__homefront.ui.sheet === 'units'); assert.ok(await p.locator(`${T('division')} [data-unit-icon] svg`).count() >= 1, 'the garrison is listed with its icons'); await shut(p);
  });
  await step('demo data plays on whichever map is loaded', async () => {
    const d = await p.evaluate(() => window.__homefront.data.reports.length);
    await settings(p); await p.click(T('demo')); assert.match(await p.textContent(T('confirm')), /Replace your reports with the demo\?/); await confirmYes(p); await p.waitForTimeout(600);
    const s = await st(p); assert.equal(s.log, 8); assert.ok(s.occ > 0 && s.lib > 0); assert.equal(d, 1);
    assert.ok(await p.evaluate(() => { const a = window.__homefront; const ids = a.map.fronts.map(f => f.id); return a.data.reports.every(r => r.items.every(i => ids.includes(i.front))); }));
    await p.evaluate(() => window.__homefront.view.home(false)); await shot(p, '27-testland-demo');
  });
  await step('back to Iran: the old campaign is exactly as it was left', async () => {
    await pickCountry(p); assert.equal(await p.textContent(T('play')), 'Continue as Testland'); assert.match(await p.textContent(T('briefing')), /Testland.*Playing/s);
    await browse(p, 'iran'); assert.equal(await p.textContent(T('play')), 'Continue as Iran', 'the campaign put away is still there');
    assert.ok(await p.evaluate(() => window.__homefront.view.st.log.length === 2 && window.__homefront.data.scenario === 'testland'), 'the map behind shows Iran as it was left, and nothing is chosen yet');
    await p.click(T('play')); await p.waitForFunction(() => window.__homefront.map.id === 'iran' && window.__homefront.st?.fronts.afg && !window.__homefront.ui.picker);
    assert.match(await toasts(p), /Now playing Iran/); assert.equal(await p.evaluate(() => window.__homefront.view.map.id), 'iran');
    const d = await p.evaluate(() => { const a = window.__homefront; return { scenario: a.data.scenario, n: a.data.reports.length, tur: a.data.labels.tur, off: a.data.off, tl: a.data.campaigns.testland.reports.length, iran: a.data.campaigns.iran, name: document.querySelector('[data-testid=nation-name]').textContent }; });
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
  await step('voice: a running clock, and Send while recording waits for the words', async () => {
    const before = (await st(p)).fronts.afg.losses;
    await nav(p, 'report'); await p.fill('#report-text', 'Typed first.'); await p.click(T('mic')); await p.waitForSelector(`${T('mic')}[data-state=live]`);
    await p.waitForFunction(() => /Listening 0:0[1-9]\. Press the square to stop\./.test(document.querySelector('[data-testid=mic-clock]')?.textContent), null, { timeout: 4000 });
    await p.click(T('send')); // still recording: the words must not be lost
    await p.waitForFunction(() => window.__homefront.data.reports.some(r => /Typed first\. I failed my exam\./.test(r.text)), null, { timeout: 8000 });
    assert.equal((await st(p)).fronts.afg.losses, before + 1);
    const sent = mock.seen.filter(x => x.path === '/v1/audio/transcriptions').at(-1).raw.toString('latin1');
    assert.match(sent, /name="chunking_strategy"\r\n\r\nauto/); assert.match(sent, /name="prompt"\r\n\r\nOne person's spoken update/); assert.match(sent, /name="keywords\[\]"\r\n\r\nSchool/);
  });
  await step('voice: a failed transcription keeps the recording; Retry gets the words', async () => {
    await nav(p, 'report'); mock.ctl.failTranscribe = 1;
    await p.click(T('mic')); await p.waitForSelector(`${T('mic')}[data-state=live]`); await p.waitForTimeout(1300); await p.click(T('mic'));
    await p.waitForSelector(T('retry-mic'), { timeout: 8000 }); assert.match(await body(p), /Your recording is kept/); await p.screenshot({ path: shots + '16b-retry.png' });
    await p.click(T('send')); await p.waitForFunction(() => /not been turned into text/.test(document.querySelector('[data-slot=toast-viewport]')?.textContent || ''));
    await p.click(T('retry-mic')); await p.waitForFunction(() => document.querySelector('#report-text')?.value.includes('failed my exam'), null, { timeout: 8000 });
    assert.equal(await p.locator(T('retry-mic')).count(), 0); await p.fill('#report-text', ''); await shut(p);
  });
  await step('history keeps every detail and the report as you said it', async () => {
    await send(p, "Yesterday school was bad, I'm failing this class. I had a fight with my mother. Guitar practice went great today."); await saved(p);
    await nav(p, 'history');
    const yest = p.locator(T('entry'), { hasText: 'Failing the class' }).first(), today = p.locator(T('entry'), { hasText: 'Guitar practice' }).first();
    assert.match(await yest.textContent(), /Got a 41 on the midterm on Monday; Mr\. Patel says a retake is possible/, 'details shown under the event');
    const said = today.locator(T('said')); assert.equal(await said.count(), 1);
    await said.locator('button').click(); await p.waitForTimeout(250); assert.match(await said.textContent(), /I had a fight with my mother/);
    await today.locator('[aria-label=Edit]').click(); await p.waitForSelector(T('edit-item'));
    await p.fill(`${T('edit-details')} >> nth=0`, 'Practised the Hotel California solo for 45 minutes, finally clean at full speed.'); await p.click(T('save-edit')); await saved(p);
    const kept = await p.evaluate(() => window.__homefront.data.reports.flatMap(r => r.items).filter(i => i.details).map(i => `${i.front}:${i.details}`).join('|')); assert.match(kept, /cau:Practised the Hotel California solo for 45 minutes/);
    assert.match(await body(p), /Hotel California/); await shot(p, '21-details');
    await nav(p, 'fronts'); await p.click(`${T('front')}[data-front=cau]`); await p.waitForSelector(T('sheet-back'));
    const prev = p.locator(T('event-details'), { hasText: 'Hotel California solo' }).first();
    assert.match(await prev.getAttribute('class'), /line-clamp-3/, 'the front previews the details in three lines'); await shot(p, '22-front-details');
  });
  await b2.close();

  const c3 = await browser.newContext({ viewport: { width: 1440, height: 860 } }); p = await c3.newPage(); p.on('pageerror', e => errors.push('pageerror: ' + e.message));
  await login(p);
  await step('desktop: demo', async () => {
    // the picker on a wide screen: nations in a column on the left, the map in the middle, the briefing on the right
    await pickCountry(p);
    const lay = await p.evaluate(() => { const r = e => document.querySelector(e).getBoundingClientRect(); const n = r('[data-testid=nations]'), m = r('#mapwrap'), b = r('[data-testid=briefing]'), k = r('[data-testid=play]'); return { n: n.right, m0: m.left, m1: m.right, b: b.left, play: k.bottom, h: innerHeight }; });
    assert.ok(lay.n <= lay.m0 && lay.m1 <= lay.b && lay.m1 - lay.m0 > 600 && lay.play <= lay.h, JSON.stringify(lay)); await shot(p, '17a-desktop-country');
    await p.keyboard.press('Escape'); await p.waitForSelector(PICKER, { state: 'detached' }); assert.equal(await p.evaluate(() => window.__homefront.data.scenario), 'iran');
    await settings(p); await p.click(T('demo')); await confirmYes(p); await p.waitForTimeout(900);
    const s = await st(p); assert.equal(s.log, 8); assert.ok(s.occ > 0 && s.lib > 0); await shot(p, '17-desktop');
    // on a wide screen the sheet is a panel beside the map and the bar stays in reach
    await p.click(T('nav-fronts')); await p.click(`${T('front')}[data-front=irq]`); await p.waitForSelector(T('sheet-back'));
    const box = await p.locator(SHEET).boundingBox(); assert.ok(box.x > 800 && box.width < 520, 'a side panel, not a stretched sheet');
    assert.ok(await p.isVisible('[aria-label="Zoom in"]')); await shot(p, '18-desktop-front');
    await p.click(T('nav-history')); await p.waitForFunction(() => window.__homefront.ui.sheet === 'history');
  });
  await step('Tehran falls; the empire is restored', async () => {
    await p.evaluate(() => { const a = window.__homefront; a.data.reports = []; const now = Date.now(); a.commitReports(Array.from({ length: 60 }, (_, i) => ({ id: 'x' + i, ts: now - (60 - i) * 3600e3, text: '', summary: '', items: [{ front: 'tks', outcome: 'loss', severity: 5, action: 'enemy_breakthrough', headline: 'Collapse' }] })), { quiet: true }); });
    assert.ok(await p.evaluate(() => window.__homefront.live.tehranFallen)); await shut(p); assert.match(await p.textContent(T('alert')), /Tehran has fallen/);
    await p.evaluate(() => window.__homefront.view.home(false)); await shot(p, '19-tehran-fallen');
    await p.evaluate(() => { const a = window.__homefront; a.data.reports = []; const now = Date.now(); a.commitReports(Array.from({ length: 120 }, (_, i) => ({ id: 'y' + i, ts: now - (120 - i) * 3600e3, text: '', summary: '', items: a.map.fronts.map(f => ({ front: f.id, outcome: 'win', severity: 5, action: 'breakthrough', headline: 'Victory' })) })), { quiet: true }); });
    assert.equal(await p.textContent(T('nation-name')), 'Achaemenid Empire'); assert.ok(await p.evaluate(() => window.__homefront.live.ach.empire && window.__homefront.live.satrapies.length > 20));
    await p.evaluate(() => { const a = window.__homefront; const [x, y] = a.view.proj(50, 33); a.view.flyTo(x, y, a.view.minS, false); }); await shot(p, '20-empire');
  });
  await c3.close();
} finally { await browser.close(); server.kill(); mock.close(); anthropic.close(); ollama.close(); fs.rmSync(dataDir, { recursive: true, force: true }); }
console.log(`\n${passed} passed, ${errors.length} problem(s)`);
if (errors.length) { console.log(errors.join('\n')); process.exit(1); }
