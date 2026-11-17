// Checks the built site in headless Chromium. Not deployed.
//   PORT=8153 node tools/build-site.mjs --serve
//   node site/_dev/verify.cjs http://localhost:8153/ [dir for screenshots]
const assert = require('node:assert/strict');
const path = require('node:path');
const { chromium } = require('playwright');
const base = process.argv[2] || 'http://localhost:8153/';
const out = process.argv[3] || __dirname;
const MAP = '[data-testid=hero-map]';

// a cheap fingerprint of both hero canvases: non-blank, and different once the story moves on
const fingerprint = () => {
  const sample = c => { const x = c.getContext('2d'), w = c.width, h = c.height; let sum = 0, seen = new Set(); for (let i = 0; i < 400; i++) { const d = x.getImageData((i * 37) % w, (i * 53) % h, 1, 1).data; sum = (sum * 31 + d[0] * 65536 + d[1] * 256 + d[2] + d[3]) >>> 0; seen.add(d[0] << 16 | d[1] << 8 | d[2]); } return { sum, colours: seen.size }; };
  const [base, over] = document.querySelectorAll('[data-testid=hero-map] canvas');
  const b = sample(base), o = sample(over);
  return { sum: b.sum ^ o.sum, colours: b.colours, said: document.querySelector('[data-testid=said]').textContent, verdict: document.querySelector('[data-testid=verdict]').textContent.trim().replace(/\s+/g, ' ') };
};

(async () => {
  const browser = await chromium.launch();

  // The page reads before any script runs: the HTML that is served already holds the words.
  {
    const html = await (await fetch(base)).text();
    for (const words of ['Your life as a war map', 'Choose your nation', 'How it works', 'Your data stays yours', 'Get it', 'npm start', 'Is it a game?', 'not affiliated with Paradox Interactive']) assert.ok(html.includes(words), `prerendered HTML lacks “${words}”`);
    assert.equal((html.match(/data-testid="country"/g) || []).length, 8, 'prerendered HTML: eight countries');
    assert.doesNotMatch(html, /hearts of iron/i);
    assert.doesNotMatch(html, /alt="[^"]*map of Iran/, 'the still behind the hero is not one country');
    assert.equal((html.match(/data-brand-mark=""/g) || []).length, 2, 'the product wears its own mark, not a flag, in the header and the foot');
    console.log(`ok prerendered: ${(html.length / 1024).toFixed(1)} kB of HTML with the page's words in it`);
  }

  // The hero is no one country's: two fresh visits with different (seeded) randomness show different countries, and
  // each loads that country's map alone. Math.random is pinned to the lowest and the highest draw.
  {
    const ids = (await (await fetch(new URL('demo/data/scenarios.json', base))).json()).map(s => s.id);
    const seen = [];
    for (const draw of [0.01, 0.99]) {
      const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } }); const p = await ctx.newPage(); const maps = [];
      p.on('request', r => { const m = r.url().match(/\/data\/maps\/([\w-]+)\.json/); if (m) maps.push(m[1]); });
      await p.addInitScript(d => { Math.random = () => d; }, draw);
      await p.goto(base, { waitUntil: 'load' });
      await p.waitForSelector(`${MAP}[data-country]`, { timeout: 20000 });
      const id = await p.getAttribute(MAP, 'data-country'); seen.push(id);
      assert.equal(id, ids[Math.floor(draw * ids.length)], `the hero picks among the ${ids.length} countries at random`);
      assert.deepEqual(maps, [id], 'only the hero country\'s map loads');
      assert.equal(await p.getAttribute('[data-testid=briefing]', 'data-id'), id, 'the briefing follows the hero');
      await ctx.close();
    }
    assert.notEqual(seen[0], seen[1], 'two visits, two countries');
    console.log(`ok hero: fresh visits show ${seen.join(' and ')}, each with its own map only`);
  }

  for (const [name, viewport, mobile] of [['mobile', { width: 390, height: 844 }, true], ['desktop', { width: 1440, height: 900 }, false]]) {
    const ctx = await browser.newContext({ viewport, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile });
    const p = await ctx.newPage();
    const errors = [], requests = [];
    p.on('pageerror', e => errors.push('pageerror: ' + e.message));
    p.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); }); // a hydration mismatch lands here
    // an image still loading when the page reloads (the theme check below) is cancelled, not failed
    p.on('requestfailed', r => { if (!(r.resourceType() === 'image' && /ERR_ABORTED/.test(r.failure()?.errorText || ''))) errors.push('failed: ' + r.url() + ' ' + (r.failure()?.errorText || '')); });
    p.on('response', r => { if (r.status() >= 400) errors.push(r.status() + ' ' + r.url()); });
    p.on('request', r => requests.push(r.url()));
    await p.goto(base, { waitUntil: 'load' });
    await p.waitForSelector(`${MAP}[data-country]`, { timeout: 20000 });
    const hero = await p.getAttribute(MAP, 'data-country');
    await p.waitForTimeout(1200);
    const a = await p.evaluate(fingerprint);
    assert.ok(a.colours > 8, `${name}: hero canvas is blank (${a.colours} colours)`);
    await p.waitForTimeout(7000);
    const b = await p.evaluate(fingerprint);
    assert.notEqual(a.sum, b.sum, `${name}: hero canvas did not change over time`);
    await p.waitForTimeout(6000);
    const c = await p.evaluate(fingerprint);
    assert.ok(new Set([a, b, c].map(s => s.said + '|' + s.verdict)).size > 1, `${name}: the caption never changed`);
    const sideways = () => p.evaluate(() => document.documentElement.scrollWidth > innerWidth || document.body.scrollWidth > innerWidth);
    assert.equal(await sideways(), false, `${name}: the page scrolls sideways`);
    const external = requests.filter(u => !u.startsWith(base));
    assert.deepEqual(external, [], `${name}: third-party requests`);
    // a country's map is fetched only when that country is shown
    const maps = () => requests.filter(u => /\/data\/maps\/[\w-]+\.json/.test(u)).map(u => u.match(/maps\/([\w-]+)\.json/)[1]);
    assert.deepEqual(maps(), [hero], `${name}: only the hero country's map loads with the page`);
    // every flag is a real picture that loaded (the requests themselves are checked for errors below)
    const flags = await p.evaluate(() => [...document.querySelectorAll('[data-flag] img')].map(i => ({ ok: i.complete && i.naturalWidth > 0 && i.naturalHeight > 0, src: i.currentSrc })));
    assert.ok(flags.length >= 9, `${name}: ${flags.length} flag images`); assert.deepEqual(flags.filter(f => !f.ok), [], `${name}: flags that did not load`);
    for (const f of new Set(flags.map(x => x.src))) assert.equal((await p.request.get(f)).status(), 200, f);
    await p.screenshot({ path: path.join(out, `landing-${name}-fold.png`) });

    // head metadata: one title, a description, a canonical URL, a social card that exists, structured data that parses
    const head = await p.evaluate(() => { const m = s => document.querySelector(s)?.getAttribute('content') || ''; return { titles: document.querySelectorAll('title').length, title: document.title, description: m('meta[name=description]'), canonical: document.querySelector('link[rel=canonical]')?.href || '', og: m('meta[property="og:image"]'), w: m('meta[property="og:image:width"]'), h: m('meta[property="og:image:height"]'), alt: m('meta[property="og:image:alt"]'), card: m('meta[name="twitter:card"]'), tw: m('meta[name="twitter:image"]'), ld: document.querySelector('script[type="application/ld+json"]')?.textContent || '', text: document.documentElement.outerHTML, seen: document.body.innerText }; });
    assert.equal(head.titles, 1); assert.ok(head.title.length < 60, `${name}: title is ${head.title.length} characters`);
    assert.ok(head.description.length > 50 && head.description.length < 160, `${name}: description is ${head.description.length} characters`);
    assert.match(head.canonical, /^https?:\/\//, `${name}: canonical URL`);
    assert.equal(head.card, 'summary_large_image'); assert.ok(head.alt.length > 20); assert.equal(head.og, head.tw);
    const og = await p.evaluate(async src => { const i = new Image(); i.src = src; await i.decode(); return [i.naturalWidth, i.naturalHeight].join('x'); }, new URL(head.og, base).href);
    assert.equal(og, `${head.w}x${head.h}`, `${name}: og.png is not the size the page declares`);
    const ld = JSON.parse(head.ld); assert.equal(ld['@type'], 'SoftwareApplication'); assert.equal(ld.name, 'Home Front'); assert.equal(String(ld.offers.price), '0');
    assert.doesNotMatch(head.text, /hearts of iron/i);
    // the words a visitor reads name no game; the repository's own address is the one place its old name shows
    assert.doesNotMatch(head.seen.replace(/\S*github\.com\S*/g, ''), /hearts of iron|\bhoi\s?4\b/i, `${name}: a game's trademark on the page`);
    assert.doesNotMatch(head.seen, /!/, `${name}: an exclamation mark on the page`);
    // every image is the size its tag declares, so nothing shifts as it loads
    const sizes = await p.evaluate(() => [...document.images].filter(i => !i.closest('[data-slot=flag-image]')).filter(i => i.naturalWidth && (i.naturalWidth !== Number(i.getAttribute('width')) || i.naturalHeight !== Number(i.getAttribute('height')))).map(i => `${i.getAttribute('src')} is ${i.naturalWidth}x${i.naturalHeight}`));
    assert.deepEqual(sizes, [], `${name}: image sizes`);
    for (const f of ['robots.txt', 'sitemap.xml', 'img/hero.png']) assert.equal((await p.request.get(base + f)).status(), 200, `${name}: ${f}`);
    assert.equal(await p.locator('[data-testid=nations] [data-testid=country]').count(), 8, `${name}: eight countries listed`);
    assert.equal(await p.locator('[data-testid=brief-front]').count(), 7, `${name}: the briefing's seven fronts`);
    assert.equal(await p.locator('[data-testid=providers] [data-provider-logo]').count(), 9, `${name}: provider marks`);
    console.log(`ok ${name}: canvas ${a.colours} colours, changed over time; captions seen: ${new Set([a, b, c].map(s => s.said + '|' + s.verdict)).size}; no sideways scroll`);

    // picking a second country: its briefing shows at once, its map loads (with the kit's loading state) and replaces the first
    const [other, Other, empire] = hero === 'france' ? ['greece', 'Greece', /Byzantine Empire/] : ['france', 'France', /French Empire/];
    const before = await p.evaluate(fingerprint);
    await p.locator(`[data-testid=country][data-id=${other}]`).scrollIntoViewIfNeeded();
    const y = await p.evaluate(() => scrollY);
    await p.click(`[data-testid=country][data-id=${other}]`);
    assert.equal(await p.textContent('[data-testid=brief-name]'), Other, `${name}: the briefing follows the pick`);
    assert.match(await p.textContent('[data-testid=brief-empire]'), empire);
    await p.waitForSelector(`${MAP}[data-country=${other}]`, { timeout: 20000 });
    await p.waitForTimeout(1500);
    const after = await p.evaluate(fingerprint);
    assert.notEqual(before.sum, after.sum, `${name}: the hero map did not change with the country`);
    assert.ok(after.colours > 8, `${name}: the second country's map is blank`);
    assert.deepEqual(maps(), [hero, other], `${name}: the second map loads when picked, and only it`);
    assert.equal(await sideways(), false, `${name}: the page scrolls sideways after a pick`);
    assert.match(await p.textContent('[data-testid=play]'), new RegExp(`Play as ${Other}`));
    assert.ok(Math.abs(await p.evaluate(() => scrollY) - y) < 4, `${name}: picking a country moved the page`);
    console.log(`ok ${name}: the hero opened on ${hero}; picking ${Other} swapped the map and its briefing; the page stayed where it was`);

    // the FAQ opens and closes
    const second = p.locator('[data-testid=faq] [data-slot=collapsible-trigger]').nth(1);
    await second.click();
    await p.waitForSelector('[data-testid=faq] [data-slot=settings-row]:nth-child(2) [data-slot=collapsible-panel]');
    // copy the install commands
    if (!mobile) {
      await ctx.grantPermissions(['clipboard-read', 'clipboard-write']);
      await p.click('[data-slot=code-block-copy]');
      const copied = await p.evaluate(() => navigator.clipboard.readText());
      assert.match(copied, /^git clone .*\ncd homefront\nnpm install\ncp \.env\.example \.env\nnpm start$/, `${name}: the copied commands`);
    }

    // both themes render: the appearance button cycles Auto, Light, Dark, and the page's own ink and paper swap
    const paint = () => p.evaluate(() => { const lum = c => { const [r, g, b] = c.match(/[\d.]+/g).map(Number); return 0.2126 * r + 0.7152 * g + 0.0722 * b; }; const x = document.createElement('canvas').getContext('2d'); const rgb = v => { x.fillStyle = v; x.fillRect(0, 0, 1, 1); const d = x.getImageData(0, 0, 1, 1).data; return `rgb(${d[0]},${d[1]},${d[2]})`; }; return { theme: document.documentElement.dataset.theme, paper: lum(rgb(getComputedStyle(document.body).backgroundColor)), ink: lum(rgb(getComputedStyle(document.querySelector('h1')).color)) }; });
    const seen = {};
    for (let i = 0; i < 3; i++) { await p.click('[data-testid=appearance]'); await p.waitForTimeout(250); const t = await paint(); seen[t.theme] = t; }
    assert.ok(seen.light && seen.dark, `${name}: both themes reached`);
    assert.ok(seen.light.paper > 200 && seen.light.ink < 80, `${name}: light theme is dark ink on light paper`);
    assert.ok(seen.dark.paper < 60 && seen.dark.ink > 200, `${name}: dark theme is light ink on dark paper`);
    for (const theme of ['light', 'dark']) {
      await p.evaluate(t => { localStorage.setItem('lanes:appearance', t); }, theme);
      await p.reload({ waitUntil: 'load' });
      await p.waitForSelector(`${MAP}[data-country]`, { timeout: 20000 });
      assert.equal((await paint()).theme, theme, `${name}: ${theme} is set before the first paint`);
      await p.waitForTimeout(800);
      await p.screenshot({ path: path.join(out, `landing-${name}-${theme}.png`), fullPage: true });
    }
    assert.deepEqual(errors, [], `${name}: errors on the landing page`);
    console.log(`ok ${name}: light and dark both render`);

    // the demo link opens the app with a campaign in progress
    await p.evaluate(() => localStorage.removeItem('homefront.v1'));
    await Promise.all([p.waitForURL(/\/demo\/\?demo=1/), p.click('[data-testid=try-demo]')]);
    await p.waitForFunction(() => window.__homefront?.st, null, { timeout: 15000 });
    const demo = await p.evaluate(() => ({ reports: window.__homefront.data.reports.length, sheet: window.__homefront.ui.sheet, picker: !!window.__homefront.ui.picker, canvases: document.querySelectorAll('#mapwrap canvas').length, bar: document.querySelectorAll('nav[aria-label=Main] button').length }));
    assert.ok(demo.reports > 5, `${name}: the demo opened without a campaign`);
    assert.equal(demo.sheet, null, `${name}: the demo opened on a sheet (${demo.sheet}), not the map`);
    assert.equal(demo.picker, false, `${name}: the demo opened on the country picker`);
    assert.equal(demo.canvases, 2, `${name}: the map's two canvases`);
    assert.equal(demo.bar, 3, `${name}: Fronts, the microphone and History`);
    await p.waitForTimeout(1200);
    await p.screenshot({ path: path.join(out, `demo-${name}.png`) });
    console.log(`ok ${name}: demo link loads the app with ${demo.reports} reports`);
    await ctx.close();
  }
  await browser.close();
})().catch(e => { console.error('FAILED', e.message); process.exit(1); });
