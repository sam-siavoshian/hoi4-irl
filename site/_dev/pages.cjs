// Pictures of the site's content pages for looking at: light and dark, 1440 and 390 wide, full page. Not deployed.
//   PORT=8153 node tools/build-site.mjs --serve
//   node site/_dev/pages.cjs http://localhost:8153/ <dir> [page paths, comma separated: faq/,countries/peru/]
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const base = (process.argv[2] || 'http://localhost:8153/').replace(/\/*$/, '/');
const out = process.argv[3] || path.join(__dirname, 'look');
const only = (process.argv[4] || 'countries/france/,self-hosting/,ai-providers/,faq/').split(',');

(async () => {
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch();
  for (const page of only) for (const theme of ['light', 'dark']) for (const [name, width, height, scale] of [['1440', 1440, 900, 1], ['390', 390, 844, 2]]) {
    const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: scale, isMobile: width < 500, hasTouch: width < 500 });
    const p = await ctx.newPage();
    p.on('pageerror', e => console.log('PAGE ERROR', page, e.message));
    p.on('console', m => { if (m.type() === 'error') console.log('CONSOLE', page, m.text()); });
    await p.addInitScript(t => localStorage.setItem('lanes:appearance', t), theme);
    await p.goto(base + page, { waitUntil: 'load' });
    await p.evaluate(() => document.fonts.ready);
    await p.waitForTimeout(600);
    const file = path.join(out, `${page.replace(/\/$/, '').replace(/\//g, '-') || 'landing'}-${theme}-${name}.png`);
    const total = await p.evaluate(() => document.documentElement.scrollHeight);
    await p.screenshot({ path: file, fullPage: true });
    // and the first screen alone, at full resolution, for reading
    await p.screenshot({ path: file.replace(/\.png$/, '-top.png') });
    console.log(path.basename(file), total + 'px');
    await ctx.close();
  }
  await browser.close();
})().catch(e => { console.error('FAILED', e.message); process.exit(1); });
