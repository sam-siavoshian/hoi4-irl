// Checks the built site in headless Chromium. Not deployed.
//   PORT=8153 node tools/build-site.mjs --serve
//   node site/_dev/verify.cjs http://localhost:8153/ [dir for screenshots]
const assert = require('node:assert/strict');
const path = require('node:path');
const { chromium } = require('playwright');
const base = process.argv[2] || 'http://localhost:8153/';
const out = process.argv[3] || __dirname;

// a cheap fingerprint of both hero canvases: non-blank, and different once the story moves on
const fingerprint = () => {
  const sample = c => { const x = c.getContext('2d'), w = c.width, h = c.height; let sum = 0, seen = new Set(); for (let i = 0; i < 400; i++) { const d = x.getImageData((i * 37) % w, (i * 53) % h, 1, 1).data; sum = (sum * 31 + d[0] * 65536 + d[1] * 256 + d[2] + d[3]) >>> 0; seen.add(d[0] << 16 | d[1] << 8 | d[2]); } return { sum, colours: seen.size }; };
  const b = sample(document.querySelector('#hero-base')), o = sample(document.querySelector('#hero-over'));
  return { sum: b.sum ^ o.sum, colours: b.colours, said: document.querySelector('#said').textContent, verdict: document.querySelector('#verdict').textContent.trim().replace(/\s+/g, ' ') };
};

(async () => {
  const browser = await chromium.launch();
  for (const [name, viewport, mobile] of [['mobile', { width: 390, height: 844 }, true], ['desktop', { width: 1440, height: 900 }, false]]) {
    const ctx = await browser.newContext({ viewport, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile });
    const p = await ctx.newPage();
    const errors = [], requests = [];
    p.on('pageerror', e => errors.push('pageerror: ' + e.message));
    p.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
    p.on('requestfailed', r => errors.push('failed: ' + r.url()));
    p.on('response', r => { if (r.status() >= 400) errors.push(r.status() + ' ' + r.url()); });
    p.on('request', r => requests.push(r.url()));
    await p.goto(base, { waitUntil: 'load' });
    await p.waitForSelector('#hero-map.live', { timeout: 15000 });
    await p.waitForTimeout(1200);
    const a = await p.evaluate(fingerprint);
    assert.ok(a.colours > 8, `${name}: hero canvas is blank (${a.colours} colours)`);
    await p.waitForTimeout(7000);
    const b = await p.evaluate(fingerprint);
    assert.notEqual(a.sum, b.sum, `${name}: hero canvas did not change over time`);
    await p.waitForTimeout(6000);
    const c = await p.evaluate(fingerprint);
    assert.ok(new Set([a.verdict, b.verdict, c.verdict]).size > 1, `${name}: the caption never changed`);
    assert.equal(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${name}: the page scrolls sideways`);
    const external = requests.filter(u => !u.startsWith(base));
    assert.deepEqual(external, [], `${name}: third-party requests`);
    // lazy images: scroll through once so the full-page screenshot has them
    await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 600) { scrollTo(0, y); await new Promise(r => setTimeout(r, 120)); } scrollTo(0, 0); });
    await p.waitForTimeout(1500);
    const broken = await p.evaluate(() => [...document.images].filter(i => !i.complete || !i.naturalWidth).map(i => i.getAttribute('src')));
    if (broken.length) console.log(`note ${name}: not loaded before the screenshot (lazy, off screen): ${broken.join(', ')}`);
    await p.screenshot({ path: path.join(out, `landing-${name}.png`), fullPage: true });
    await p.screenshot({ path: path.join(out, `landing-${name}-fold.png`) });
    assert.deepEqual(errors, [], `${name}: errors on the landing page`);
    // head metadata: one title, a description, a canonical URL, a social card that exists, structured data that parses
    const head = await p.evaluate(() => { const m = s => document.querySelector(s)?.getAttribute('content') || ''; return { titles: document.querySelectorAll('title').length, title: document.title, description: m('meta[name=description]'), canonical: document.querySelector('link[rel=canonical]')?.href || '', og: m('meta[property="og:image"]'), w: m('meta[property="og:image:width"]'), h: m('meta[property="og:image:height"]'), alt: m('meta[property="og:image:alt"]'), card: m('meta[name="twitter:card"]'), tw: m('meta[name="twitter:image"]'), ld: document.querySelector('script[type="application/ld+json"]')?.textContent || '', text: document.documentElement.outerHTML }; });
    assert.equal(head.titles, 1); assert.ok(head.title.length < 60, `${name}: title is ${head.title.length} characters`);
    assert.ok(head.description.length > 50 && head.description.length < 160, `${name}: description is ${head.description.length} characters`);
    assert.match(head.canonical, /^https?:\/\//, `${name}: canonical URL`);
    assert.equal(head.card, 'summary_large_image'); assert.ok(head.alt.length > 20); assert.equal(head.og, head.tw);
    const og = await p.evaluate(async src => { const i = new Image(); i.src = src; await i.decode(); return [i.naturalWidth, i.naturalHeight].join('x'); }, new URL(head.og, base).href);
    assert.equal(og, `${head.w}x${head.h}`, `${name}: og.png is not the size the page declares`);
    const ld = JSON.parse(head.ld); assert.equal(ld['@type'], 'SoftwareApplication'); assert.equal(ld.name, 'Home Front'); assert.equal(String(ld.offers.price), '0');
    assert.doesNotMatch(head.text, /hearts of iron/i);
    // every image is the size its tag declares, so nothing shifts as it loads
    const sizes = await p.evaluate(() => [...document.images].filter(i => i.naturalWidth && (i.naturalWidth !== Number(i.getAttribute('width')) || i.naturalHeight !== Number(i.getAttribute('height')))).map(i => `${i.getAttribute('src')} is ${i.naturalWidth}x${i.naturalHeight}`));
    assert.deepEqual(sizes, [], `${name}: image sizes`);
    for (const f of ['robots.txt', 'sitemap.xml']) assert.equal((await p.request.get(base + f)).status(), 200, `${name}: ${f}`);
    assert.equal(await p.locator('#countries .lands-list li').count(), 8, `${name}: eight countries listed`);
    console.log(`ok ${name}: canvas ${a.colours} colours, changed over time; verdicts seen: ${new Set([a.verdict, b.verdict, c.verdict]).size}`);

    // the demo link opens the app with a campaign in progress
    await Promise.all([p.waitForURL(/\/demo\/\?demo=1/), p.click('.hero a[data-demo]')]);
    await p.waitForFunction(() => window.__homefront?.st, null, { timeout: 15000 });
    const demo = await p.evaluate(() => ({ reports: window.__homefront.data.reports.length, sheet: window.__homefront.ui.sheet, canvases: document.querySelectorAll('#mapwrap canvas').length, bar: document.querySelectorAll('nav[aria-label=Main] button').length }));
    assert.ok(demo.reports > 5, `${name}: the demo opened without a campaign`);
    assert.equal(demo.sheet, null, `${name}: the demo opened on a sheet (${demo.sheet}), not the map`);
    assert.equal(demo.canvases, 2, `${name}: the map's two canvases`);
    assert.equal(demo.bar, 3, `${name}: Fronts, the microphone and History`);
    await p.waitForTimeout(1200);
    await p.screenshot({ path: path.join(out, `demo-${name}.png`) });
    console.log(`ok ${name}: demo link loads the app with ${demo.reports} reports`);
    await ctx.close();
  }
  await browser.close();
})().catch(e => { console.error('FAILED', e.message); process.exit(1); });
