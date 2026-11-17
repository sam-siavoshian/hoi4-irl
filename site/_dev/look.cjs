// Full-page pictures of the landing page for looking at: light and dark, 1440 and 390 wide, each also cut into
// sections a person can read. Not deployed.
//   PORT=8153 node tools/build-site.mjs --serve
//   node site/_dev/look.cjs http://localhost:8153/ <dir>
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const base = (process.argv[2] || 'http://localhost:8153/').replace(/\/*$/, '/');
const out = process.argv[3] || path.join(__dirname, 'look');
const SLICE = 1100; // CSS pixels per section

(async () => {
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch();
  for (const theme of ['light', 'dark']) for (const [name, width, height, scale] of [['1440', 1440, 900, 1], ['390', 390, 844, 2]]) {
    const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: scale, isMobile: width < 500, hasTouch: width < 500 });
    const p = await ctx.newPage();
    p.on('pageerror', e => console.log('PAGE ERROR', e.message));
    p.on('console', m => { if (m.type() === 'error') console.log('CONSOLE', m.text()); });
    await p.addInitScript(t => localStorage.setItem('lanes:appearance', t), theme);
    await p.goto(base, { waitUntil: 'load' });
    await p.waitForSelector('[data-testid=hero-map][data-country]', { timeout: 20000 });
    await p.evaluate(() => document.fonts.ready);
    await p.waitForTimeout(9000); // into the story: a sentence typed and judged
    const got = await p.evaluate(() => document.documentElement.dataset.theme);
    if (got !== theme) throw new Error(`theme is ${got}, wanted ${theme}`);
    const total = await p.evaluate(() => document.documentElement.scrollHeight);
    await p.screenshot({ path: path.join(out, `page-${theme}-${name}.png`), fullPage: true });
    for (let y = 0, n = 1; y < total; y += SLICE, n++) {
      await p.screenshot({ path: path.join(out, `page-${theme}-${name}-${n}.png`), fullPage: true, clip: { x: 0, y, width, height: Math.min(SLICE, total - y) } });
    }
    console.log(`${theme} ${name}: ${total}px tall, ${Math.ceil(total / SLICE)} sections`);
    await ctx.close();
  }
  await browser.close();
})().catch(e => { console.error('FAILED', e.message); process.exit(1); });
