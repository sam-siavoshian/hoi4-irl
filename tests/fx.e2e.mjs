// fx layer checks: a Node import with no DOM, then the demo page in headless Chromium at iPhone size.
// Run: node tests/fx.e2e.mjs   (uses port 8151 only)
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
const PORT = 8151, URL_ = `http://localhost:${PORT}/tools/fx-demo.html`;
const shots = new URL('./shots/', import.meta.url).pathname; fs.mkdirSync(shots, { recursive: true });
const errors = []; let passed = 0;
const step = async (name, fn) => { try { await fn(); passed++; console.log('  ✓', name); } catch (e) { errors.push(`${name}: ${e.message}`); console.log('  ✗', name, '\n    ', String(e.message).split('\n').slice(0, 12).join(' | ')); } };

// ── 1. Node: importable with no DOM, every method a safe no-op ──
await step('node: imports with no DOM and every method is a safe no-op', async () => {
  const { fx } = await import('../js/fx.js');
  const el = { textContent: '' };
  fx.init({ root: null }); fx.init(); fx.unlock(); assert.deepEqual(fx.configure({ sound: false }), { sound: false, motion: true, haptics: true }); fx.configure({ sound: true }); fx.configure();
  for (const n of [...fx.sounds, 'nope', undefined]) fx.sound(n, { volume: 2 });
  for (const k of [...fx.kinds, 'nope']) fx.burst(10, 10, { kind: k, count: 5 });
  fx.burst(); fx.rain(); fx.rain({ kind: 'embers' }); fx.shake(el); fx.shake(null); fx.flash(); fx.flash({ color: 'red', duration: 1 }); fx.pulse(el); fx.pulse();
  for (const h of ['light', 'medium', 'heavy', 'success', 'error', [10, 20], 'nope']) fx.haptic(h);
  await fx.countUp(el, 0, 42, { duration: 500 }); assert.equal(el.textContent, '42');
  await fx.typewriter(el, 'Dispatch', { cps: 10 }); assert.equal(el.textContent, 'Dispatch');
  await fx.countUp(null, 0, 1); await fx.typewriter(null, 'x'); await fx.typewriter(el);
  assert.equal(await fx.celebrate({ tone: 'good', magnitude: 5, kind: 'empire' }), undefined); await fx.celebrate(); await fx.celebrate({ kind: 'nope', at: { x: 'a' } });
  fx.stop(); assert.equal(fx._alive(), 0); assert.equal(fx._running(), false); assert.equal(fx._audio(), 'none'); assert.equal(await fx._render('win'), null);
  assert.equal(fx.sounds.length, 14);
});

// ── 2. Browser ──
const { chromium, devices } = require('playwright');
const server = spawn('node', ['tools/serve.mjs'], { cwd: new URL('..', import.meta.url).pathname, env: { ...process.env, PORT }, stdio: 'ignore' });
await new Promise(r => setTimeout(r, 600));
const browser = await chromium.launch();
const watch = p => { p.on('pageerror', e => errors.push('pageerror: ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/favicon|Failed to load resource/.test(m.text())) errors.push('console: ' + m.text()); }); };
const alive = p => p.evaluate(() => fx._alive());
const running = p => p.evaluate(() => fx._running());
const idle = (p, ms = 9000) => p.waitForFunction(() => !fx._running() && fx._alive() === 0, null, { timeout: ms });

try {
  const ctx = await browser.newContext({ ...devices['iPhone 14 Pro'] });
  const p = await ctx.newPage(); watch(p);
  await p.goto(URL_); await p.waitForFunction(() => window.fx && document.querySelector('.fx-canvas'));

  await step('init: one overlay canvas that cannot take taps, idempotent, silent before unlock', async () => {
    const r = await p.evaluate(() => {
      fx.init({ root: document.body }); fx.init();
      if (document.querySelector('.fx-canvas').parentElement !== document.body) throw new Error('overlay must sit on <body>');
      const c = document.querySelectorAll('.fx-canvas'), cs = getComputedStyle(c[0]);
      fx.sound('bigwin');                                   // before any gesture: must not create an AudioContext
      return { n: c.length, pe: cs.pointerEvents, pos: cs.position, disp: cs.display, flash: document.querySelectorAll('.fx-flash').length, audio: fx._audio(), running: fx._running() };
    });
    assert.deepEqual(r, { n: 1, pe: 'none', pos: 'fixed', disp: 'none', flash: 1, audio: 'none', running: false });
  });

  await step('sounds: every button plays without error, audio unlocked by the first tap', async () => {
    const bs = p.locator('#sounds button'); assert.equal(await bs.count(), 14);
    for (let i = 0; i < 14; i++) { await bs.nth(i).click(); await p.waitForTimeout(60); }
    assert.equal(await p.evaluate(() => fx._audio()), 'running');
  });

  await step('sounds: offline render of each is audible, unclipped and within its length', async () => {
    const res = await p.evaluate(async () => { const o = {}; for (const n of fx.sounds) o[n] = await fx._render(n); return o; });
    for (const [n, r] of Object.entries(res)) console.log(`      ${n.padEnd(8)} peak ${r.peak.toFixed(2)}  rms ${r.rms.toFixed(3)}  ${r.duration.toFixed(2)} s`);
    for (const [n, r] of Object.entries(res)) {
      assert.ok(r.peak > 0.03, `${n} is nearly silent (${r.peak})`); assert.ok(r.peak < 0.9, `${n} is too hot (${r.peak})`);
      assert.ok(r.duration <= (n === 'fallen' ? 3.05 : n === 'empire' ? 4.05 : 1.5), `${n} runs ${r.duration}s`);
    }
  });

  await step('bursts: particles are alive after a burst and the loop stops by itself', async () => {
    const bs = p.locator('#bursts button'); assert.equal(await bs.count(), 5);
    for (let i = 0; i < 5; i++) {
      await idle(p); await bs.nth(i).click(); await p.waitForTimeout(140);
      assert.ok(await alive(p) > 0, `burst ${i} spawned nothing`); assert.equal(await running(p), true);
      assert.equal(await p.evaluate(() => getComputedStyle(document.querySelector('.fx-canvas')).display), 'block');
      await idle(p); assert.equal(await p.evaluate(() => getComputedStyle(document.querySelector('.fx-canvas')).display), 'none');
    }
  });

  await step('screenshots: confetti, sparks, stars, smoke and embers mid-burst', async () => {
    await p.evaluate(() => scrollTo(0, 0));
    const snap = async (name, ms, fn) => { await idle(p); await p.evaluate(fn); await p.waitForTimeout(ms); assert.ok(await alive(p) > 0); await p.screenshot({ path: `${shots}fx-${name}.png` }); };
    await snap('confetti', 420, () => fx.burst(innerWidth / 2, innerHeight * 0.45, { kind: 'confetti', count: 70, power: 1.1 }));
    await snap('sparks', 150, () => fx.burst(innerWidth / 2, innerHeight * 0.45, { kind: 'sparks', count: 40, power: 1.1 }));
    await snap('stars', 300, () => fx.burst(innerWidth / 2, innerHeight * 0.45, { kind: 'stars', count: 18, power: 1.2 }));
    await snap('smoke-embers', 500, () => { fx.burst(innerWidth / 2, innerHeight * 0.45, { kind: 'smoke', count: 12, power: 1.2 }); fx.burst(innerWidth / 2, innerHeight * 0.45, { kind: 'embers', count: 30, power: 1.2 }); });
    await snap('rain', 1500, () => fx.rain({ kind: 'confetti', duration: 1800 }));
  });

  await step('pool is capped', async () => {
    await p.evaluate(() => { for (let i = 0; i < 30; i++) fx.burst(200, 300, { kind: 'confetti', count: 140 }); });
    const n = await alive(p); assert.ok(n > 200 && n <= 320, `alive ${n}`); await p.evaluate(() => fx.stop());
    assert.equal(await alive(p), 0); assert.equal(await running(p), false);
  });

  await step('frame time with ~250 particles (informational)', async () => {
    const ms = await p.evaluate(() => new Promise(res => { fx.burst(200, 300, { kind: 'confetti', count: 140, power: 1.2 }); fx.burst(200, 300, { kind: 'sparks', count: 60 }); fx.burst(200, 300, { kind: 'stars', count: 50 }); const n0 = fx._alive(); let n = 0, t0 = performance.now(); const f = () => { if (++n < 30) requestAnimationFrame(f); else res({ start: n0, avg: (performance.now() - t0) / n }); }; requestAnimationFrame(f); }));
    console.log(`      ${ms.start} particles, ${ms.avg.toFixed(1)} ms/frame in headless Chromium`); await p.evaluate(() => fx.stop());
  });

  await step('rain, flash, shake: run and clean up', async () => {
    await p.click('[data-rain=confetti]'); await p.click('[data-rain=embers]'); await p.waitForTimeout(300); assert.ok(await alive(p) > 5);
    await p.click('[data-do=flash-red]'); assert.equal(await p.evaluate(() => document.querySelector('.fx-flash').classList.contains('fx-on')), true);
    await p.click('[data-do=flash-gold]');
    const before = await p.evaluate(() => getComputedStyle(document.querySelector('#app')).transform);
    await p.click('[data-do=shake]'); await p.waitForTimeout(120);
    const mid = await p.evaluate(() => ({ cls: document.querySelector('#app').classList.contains('fx-shake'), tr: getComputedStyle(document.querySelector('#app')).translate }));
    assert.equal(mid.cls, true); assert.notEqual(mid.tr, 'none'); assert.notEqual(mid.tr, '0px');
    await p.waitForTimeout(500);
    const after = await p.evaluate(() => ({ cls: document.querySelector('#app').className, tr: getComputedStyle(document.querySelector('#app')).translate, tf: getComputedStyle(document.querySelector('#app')).transform, amp: document.querySelector('#app').style.getPropertyValue('--fx-amp'), flash: document.querySelector('.fx-flash').classList.contains('fx-on') }));
    assert.deepEqual(after, { cls: '', tr: 'none', tf: before, amp: '', flash: false });
    await idle(p);
  });

  await step('pulse, countUp, typewriter', async () => {
    await p.click('[data-do=pulse]'); await p.waitForTimeout(80);
    assert.notEqual(await p.evaluate(() => getComputedStyle(document.querySelector('#flame')).scale), 'none');
    await p.click('[data-do=count]'); await p.waitForTimeout(200);
    const midCount = await p.textContent('#count'); assert.ok(midCount !== '0' && midCount !== '1,250', `mid count ${midCount}`);
    await p.waitForFunction(() => document.querySelector('#count').textContent === '1,250');
    await p.click('[data-do=type]'); await p.waitForTimeout(250);
    const part = await p.textContent('#type'); assert.ok(part.length > 2 && part.length < 40, `typed "${part}"`);
    await p.waitForFunction(() => document.querySelector('#type').textContent.endsWith('ours again.'));
    const r = await p.evaluate(async () => { const el = document.querySelector('#type'); let first = false; const a = fx.typewriter(el, 'A long first dispatch that will be cut short by the next one.', { cps: 20 }).then(() => { first = true; }); await new Promise(r => setTimeout(r, 150)); const b = fx.typewriter(el, 'Second.', { cps: 200 }); await a; const cut = first && el.textContent !== 'Second.'; await b; return { cut, text: el.textContent }; });
    assert.deepEqual(r, { cut: true, text: 'Second.' });
    assert.equal(await p.evaluate(() => document.querySelector('#flame').className), '');
  });

  await step('celebrate: every kind × magnitude runs and every promise resolves', async () => {
    const bs = p.locator('#celebrate button'), n = await bs.count(); assert.equal(n, 75);
    await p.evaluate(() => { window.celebrateDone = 0; });
    for (let i = 0; i < n; i++) {
      await bs.nth(i).click(); await p.waitForTimeout(45);
      const d = await bs.nth(i).evaluate(b => b.dataset.kind + b.dataset.mag);
      if (d === 'satrapy5') { await p.waitForTimeout(900); await p.screenshot({ path: `${shots}fx-celebrate-satrapy.png` }); }
      if (i % 5 === 4) { await p.waitForTimeout(440); assert.ok(await alive(p) > 0, `row ${d} drew nothing`); await p.evaluate(() => fx.stop()); }
    }
    await p.waitForFunction(k => window.celebrateDone === k, n, { timeout: 8000 });
    await idle(p);
  });

  await step('celebrate: resolves on its own, at once on stop(), and reaches the big moments', async () => {
    await p.evaluate(() => scrollTo(0, 0));
    const t = await p.evaluate(async () => { const t0 = performance.now(); await fx.celebrate({ tone: 'good', magnitude: 3, kind: 'normal', at: null }); return performance.now() - t0; });
    assert.ok(t > 500 && t < 2000, `took ${t}`);
    const early = await p.evaluate(async () => { const t0 = performance.now(); const pr = fx.celebrate({ kind: 'empire', tone: 'gold', magnitude: 5 }); setTimeout(() => fx.stop(), 100); await pr; return { ms: performance.now() - t0, alive: fx._alive(), running: fx._running() }; });
    assert.ok(early.ms < 600, `stop took ${early.ms}`); assert.equal(early.alive, 0); assert.equal(early.running, false);
    await p.evaluate(() => { window.done = false; fx.celebrate({ kind: 'empire', tone: 'gold', magnitude: 5 }).then(() => { window.done = true; }); });
    await p.waitForTimeout(2550); assert.ok(await alive(p) > 60); await p.screenshot({ path: `${shots}fx-celebrate-empire.png` });
    await p.waitForFunction(() => window.done, null, { timeout: 4000 }); await idle(p);
    await p.evaluate(() => { fx.celebrate({ kind: 'tehran_fallen', tone: 'bad', magnitude: 5 }); });
    await p.waitForTimeout(260); await p.screenshot({ path: `${shots}fx-celebrate-fallen.png` });
    assert.deepEqual(await p.evaluate(() => { const r = document.querySelector('.fx-canvas').getBoundingClientRect(); return [r.left, r.top, r.width, r.height]; }), [0, 0, 393, await p.evaluate(() => innerHeight)]);
    assert.equal(await p.evaluate(() => document.querySelector('#app').classList.contains('fx-shake')), true);
    await p.evaluate(() => fx.stop());
    assert.equal(await p.evaluate(() => document.querySelector('#app').className), '');
  });

  await step('toggles: motion off draws nothing but celebrate still resolves; sound off; back on', async () => {
    await p.click('[data-toggle=motion]');
    await p.locator('#bursts button').first().click(); await p.click('[data-rain=confetti]'); await p.click('[data-do=shake]'); await p.click('[data-do=flash-red]'); await p.waitForTimeout(80);
    const r = await p.evaluate(async () => { await fx.celebrate({ kind: 'satrapy', magnitude: 5 }); const el = document.querySelector('#type'); const pr = fx.typewriter(el, 'All at once.', { cps: 5 }); const now = el.textContent; await pr; return { alive: fx._alive(), running: fx._running(), now, shake: document.querySelector('#app').className, flash: document.querySelector('.fx-flash').classList.contains('fx-on') }; });
    assert.deepEqual(r, { alive: 0, running: false, now: 'All at once.', shake: '', flash: false });
    await p.click('[data-toggle=motion]'); await p.click('[data-toggle=sound]');
    assert.deepEqual(await p.evaluate(() => fx.configure({})), { sound: false, motion: true, haptics: true });
    await p.locator('#sounds button').nth(3).click(); await p.click('[data-toggle=haptics]'); await p.click('[data-toggle=haptics]'); await p.click('[data-toggle=sound]');
    await p.locator('#bursts button').first().click(); await p.waitForTimeout(80); assert.ok(await alive(p) > 0);
    await p.click('[data-do=stop]'); assert.equal(await alive(p), 0);
  });

  await step('hidden tab: nothing spawns', async () => {
    const r = await p.evaluate(async () => { Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' }); fx.burst(100, 100); fx.rain(); fx.sound('win'); await fx.celebrate({ kind: 'empire', magnitude: 5 }); const o = { alive: fx._alive(), running: fx._running() }; delete document.visibilityState; return o; });
    assert.deepEqual(r, { alive: 0, running: false });
  });

  await step('reduced motion: no particles, no shake or flash, sound path and promises intact', async () => {
    await p.emulateMedia({ reducedMotion: 'reduce' });
    await p.locator('#bursts button').nth(1).click(); await p.locator('#celebrate button').nth(4).click(); await p.click('[data-rain=embers]'); await p.click('[data-do=shake]'); await p.waitForTimeout(120);
    const r = await p.evaluate(async () => { for (const k of fx.kinds) fx.burst(100, 100, { kind: k }); const t0 = performance.now(); await fx.celebrate({ kind: 'city_lost', tone: 'bad', magnitude: 5 }); const el = document.querySelector('#count'); const pr = fx.countUp(el, 0, 77, { duration: 800 }); const now = el.textContent; await pr; return { alive: fx._alive(), running: fx._running(), now, waited: performance.now() - t0 > 1000, shake: document.querySelector('#app').className, flash: document.querySelector('.fx-flash').classList.contains('fx-on'), audio: fx._audio() }; });
    assert.deepEqual(r, { alive: 0, running: false, now: '77', waited: true, shake: '', flash: false, audio: 'running' });
    await p.emulateMedia({ reducedMotion: 'no-preference' });
    await p.evaluate(() => fx.burst(100, 100)); assert.ok(await alive(p) > 0); await idle(p);
  });

  await step('a page that starts with reduced motion never draws', async () => {
    const c2 = await browser.newContext({ ...devices['iPhone 14 Pro'], reducedMotion: 'reduce' }); const q = await c2.newPage(); watch(q);
    await q.goto(URL_); await q.waitForFunction(() => window.fx);
    await q.locator('#bursts button').first().click(); await q.locator('#celebrate button').nth(74).click(); await q.waitForTimeout(150);
    assert.deepEqual(await q.evaluate(() => ({ alive: fx._alive(), running: fx._running(), audio: fx._audio() })), { alive: 0, running: false, audio: 'running' });
    await c2.close();
  });

  await step('desktop size: overlay covers the viewport at dpr ≤ 2', async () => {
    const c3 = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 3 }); const q = await c3.newPage(); watch(q);
    await q.goto(URL_); await q.waitForFunction(() => window.fx);
    await q.evaluate(() => { fx.burst(640, 360, { kind: 'confetti', count: 90, power: 1.3 }); fx.burst(640, 360, { kind: 'stars', count: 14, power: 1.3 }); }); await q.waitForTimeout(380);
    assert.deepEqual(await q.evaluate(() => { const c = document.querySelector('.fx-canvas'); return [c.width, c.height]; }), [2560, 1600]);
    await q.screenshot({ path: `${shots}fx-desktop.png` }); await c3.close();
  });

  await step('no idle loop at the end', async () => { await idle(p); assert.equal(await running(p), false); });
  await ctx.close();
} finally {
  await browser.close(); server.kill();
}
console.log(`\n${passed} passed, ${errors.length} failed`);
if (errors.length) { for (const e of errors) console.log('  -', e); process.exit(1); }
