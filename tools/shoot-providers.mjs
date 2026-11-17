// Screenshots of the General staff screens against stand-in providers (no network, no real key).
// Writes docs/img/providers.png (phone, dark, 390 × 844 at 2×: the README's picture) and, with a directory as the
// first argument, the full set there: phone and desktop, light and dark, the Settings row, the first-run offer.
// Run: node tools/shoot-providers.mjs [out-dir]     (needs the built interface: npm run build)
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { mockAnthropic } from '../tests/mock-providers.mjs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const repo = new URL('..', import.meta.url).pathname;
const out = process.argv[2] ? path.resolve(process.argv[2]) : null; if (out) fs.mkdirSync(out, { recursive: true });
const PORT = 8171, MOCK = 8172, URL_ = `http://localhost:${PORT}/`, KEY = 'sk-ant-example-key-for-pictures-4f2a';
const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'homefront-shots-'));
const mock = await mockAnthropic(MOCK, { key: KEY });
const env = Object.fromEntries(Object.entries(process.env).filter(([k]) => !/^(OPENAI_|HOMEFRONT_|LLM_|ANTHROPIC_|GEMINI_|GROQ_|MISTRAL_|OPENROUTER_)/.test(k)));
const server = spawn('node', ['server.mjs'], { cwd: repo, env: { ...env, PORT, HOST: '127.0.0.1', HOMEFRONT_OPEN: '1', HOMEFRONT_DATA_DIR: dataDir, ANTHROPIC_BASE_URL: `http://127.0.0.1:${MOCK}/v1` }, stdio: 'ignore' });
for (let i = 0; i < 60; i++) { try { await fetch(URL_ + 'healthz'); break; } catch { await new Promise(r => setTimeout(r, 100)); } }
const browser = await chromium.launch();
const T = id => `[data-testid=${id}]`;
const api = (p, method, body) => fetch(URL_ + p, { method, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
async function page(theme, size, scale = 2) {
  const ctx = await browser.newContext({ viewport: size, deviceScaleFactor: scale, hasTouch: size.width < 700, isMobile: size.width < 700, colorScheme: theme });
  await ctx.addInitScript(t => { try { localStorage.setItem('lanes:appearance', t); } catch { /* fine */ } }, theme);
  const p = await ctx.newPage(); await p.goto(URL_); await p.waitForFunction(() => window.__homefront?.st);
  return { ctx, p };
}
const dark = async (p, theme) => { await p.click(`${T('sheet')} [role=radio]:has-text("${theme === 'dark' ? 'Dark' : 'Light'}")`); await p.waitForFunction(t => document.documentElement.dataset.theme === t, theme); };
// a browser that has not played yet is walked past the country and the welcome
// the pictures show Peru: a new visitor starts on a country picked at random, so one is chosen here
const COUNTRY = 'peru';
const choose = async p => { await p.click(`${T('country')}[data-id=${COUNTRY}]`); await p.waitForFunction(id => window.__homefront.view.map.id === id && !window.__homefront.ui.picker.busy, COUNTRY); };
const enter = async p => { if (await p.evaluate(() => !window.__homefront.data.onboarded)) { await choose(p); await p.click(T('play')); await p.click(T('begin')); await p.waitForSelector(T('sheet'), { state: 'detached' }); } };
const settings = async p => { await enter(p); await p.click(T('identity')); await p.click(T('open-settings')); await p.waitForFunction(() => window.__homefront.ui.sheet === 'settings' && window.__homefront.ai); };
const shot = async (p, name) => { await p.waitForTimeout(700); if (out) await p.screenshot({ path: path.join(out, `${name}.png`) }); };
const PHONE = { width: 390, height: 844 }, DESK = { width: 1280, height: 800 };

try {
  // first run: the offer after choosing a country, before anything is set up
  { const { ctx, p } = await page('dark', PHONE);
    await choose(p); await p.click(T('play')); await p.waitForSelector(T('welcome-staff')); await p.locator(T('welcome-staff')).scrollIntoViewIfNeeded(); await shot(p, 'welcome-offer-phone-dark');
    await p.click(T('welcome-staff')); await p.waitForSelector(T('provider')); await shot(p, 'welcome-staff-phone-dark');
    await p.click(T('sheet-back')); await p.click(T('begin')); await ctx.close(); }
  await api('api/ai', 'PUT', { provider: 'anthropic', keys: { anthropic: KEY } });
  for (const theme of ['dark', 'light']) for (const [size, kind] of [[PHONE, 'phone'], [DESK, 'desktop']]) {
    const { ctx, p } = await page(theme, size);
    await settings(p); await dark(p, theme);
    await p.locator(T('staff-section')).scrollIntoViewIfNeeded(); await shot(p, `settings-${kind}-${theme}`);
    await p.click(T('open-staff')); await p.waitForSelector(T('key-saved')); await p.click(T('staff-test')); await p.waitForSelector(`${T('test-result')}[data-ok=yes]`);
    await p.evaluate(() => document.querySelector('[data-testid=sheet-body]').scrollTo(0, 0)); await shot(p, `staff-${kind}-${theme}`);
    if (kind === 'phone' && theme === 'dark') { await p.waitForTimeout(300); await p.screenshot({ path: path.join(repo, 'docs/img/providers.png') }); }
    await p.locator(T('staff-voice')).scrollIntoViewIfNeeded(); await shot(p, `staff-voice-${kind}-${theme}`);
    if (kind === 'phone') {
      // a provider with no key yet: the field, and the link to get one
      await p.evaluate(() => document.querySelector('[data-testid=sheet-body]').scrollTo(0, 0)); await p.click(`${T('provider')}[data-id=gemini]`); await p.waitForSelector(T('key-input')); await shot(p, `staff-nokey-${kind}-${theme}`);
      await p.click(`${T('provider')}[data-id=ollama]`); await p.waitForSelector(T('staff-address')); await shot(p, `staff-local-${kind}-${theme}`);
      await p.click(`${T('provider')}[data-id=anthropic]`); await p.waitForSelector(T('key-saved'));
    }
    await ctx.close();
  }
  console.log('wrote docs/img/providers.png' + (out ? ` and the set in ${out}` : ''));
} finally { await browser.close(); server.kill(); mock.close(); fs.rmSync(dataDir, { recursive: true, force: true }); }
