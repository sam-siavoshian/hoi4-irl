// Regenerates every image in site/img/ and docs/img/ from the running product. Not deployed (the build skips _dev/).
//   PORT=8153 node tools/build-site.mjs --serve      (in one terminal)
//   node site/_dev/shots.cjs http://localhost:8153/  (in another; needs Playwright with Chromium)
//   python3 site/_dev/optimize.py                    (palette-quantises the PNGs; needs Pillow)
// then build again so _site/ picks the new images up.
// A second argument picks groups: site,docs,hero,countries,cards,select,pages (default: all of them).
//
//   site/img/  hero.png (the still the landing page shows without scripts: its own hero map at the end of its story,
//              for four countries in a 2×2 grid), og.png (1200×630, from og.html: four maps under the title)
//   docs/img/  hero.png (desktop, 1440×900 @2x), map/report/front/division/history.png (phone, 390×844 @2x),
//              countries.png, social-preview.png (1280×640, from social.html: four maps under the title),
//              select.png (phone) and select-desktop.png (1440×900 @2x): the first run's country picker, France highlighted
//   site/img/countries/<id>.png  each country's map during a demo campaign, 1200×630: the picture on its page and
//              its social card (pages)
// No one country is "the" example: each picture names its country in SHOW below, and no two phone shots share one.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { chromium } = require('playwright');
const base = (process.argv[2] || 'http://localhost:8153/').replace(/\/*$/, '/');
const only = (process.argv[3] || 'site,docs,hero,countries,cards,select,pages').split(',');
const root = path.join(__dirname, '..', '..');
const SITE = path.join(root, 'site', 'img'), DOCS = path.join(root, 'docs', 'img');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'homefront-shots-'));
const scenarios = JSON.parse(fs.readFileSync(path.join(root, 'data', 'scenarios.json'), 'utf8'));
// which country each picture shows
const SHOW = {
  hero: 'turkey', // the README's desktop picture
  phone: { map: 'greece', report: 'mexico', front: 'ethiopia', division: 'peru', history: 'siam' },
  still: ['ethiopia', 'france', 'greece', 'turkey'], // the landing page's still, 2×2
  cards: ['iran', 'peru', 'mexico', 'siam'], // og.png and social-preview.png, in a row
};

const APPEARANCE = 'dark'; // one appearance for every image, so they sit together; Settings stores it under this key
const APPEARANCE_KEY = 'lanes:appearance';
const PHONE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const T = id => `[data-testid=${id}]`;
const SHEET = T('sheet');
// transient things that must never be in a picture: toasts, and the demo's "this is a demo" note
const QUIET = '[data-slot=toast-viewport], [data-testid=demo-note] { display: none !important; }';
// the map alone, for the social card's background
// the capital-in-danger pill is see-through and sits on the map's own labels: left out of the small country tiles
const NO_ALERT = '[data-testid=alert] { display: none !important; }';
const BARE = 'body :not(#mapwrap):not(#mapwrap *):not(:has(#mapwrap)) { visibility: hidden !important; }';

(async () => {
  const browser = await chromium.launch();
  const wrote = (file, note = '') => console.log('wrote', path.relative(root, file), note);

  // The app on the static demo, with a demo campaign in progress in the given country.
  async function app({ width, height, scale = 2, phone = true, scenario, css = QUIET }) {
    if (!scenario) throw new Error('app() needs a scenario: say which country the picture shows');
    const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: scale, ...(phone ? { isMobile: true, hasTouch: true, userAgent: PHONE_UA } : {}) });
    const p = await ctx.newPage();
    p.on('pageerror', e => console.log('PAGE ERROR', e.message));
    await p.addInitScript(([key, appearance, scenario]) => {
      localStorage.setItem(key, appearance);
      // an empty campaign in this country; ?demo=1 fills it with the demo reports
      if (!localStorage.getItem('homefront.v1')) localStorage.setItem('homefront.v1', JSON.stringify({ v: 3, scenario, reports: [], labels: {}, notes: {}, off: [], campaigns: {} }));
      sessionStorage.setItem('homefront.demo-note', '1');
    }, [APPEARANCE_KEY, APPEARANCE, scenario]);
    await p.goto(base + 'demo/?demo=1');
    await p.waitForFunction(() => window.__homefront?.st && window.__homefront.data.reports.length);
    const got = await p.evaluate(() => window.__homefront.map.id); if (got !== scenario) throw new Error(`wanted ${scenario}, the app loaded ${got}`);
    await p.addStyleTag({ content: css });
    await p.evaluate(() => document.fonts.ready);
    await p.waitForTimeout(1200); // the first frame, the map's opening move
    const theme = await p.evaluate(() => document.documentElement.dataset.theme);
    if (theme !== APPEARANCE) throw new Error(`appearance is ${theme}, wanted ${APPEARANCE}`);
    return { ctx, p };
  }
  const settle = p => p.waitForTimeout(1100); // sheets slide and the map flies: wait them out
  const sheetOpen = p => p.evaluate(() => window.__homefront.ui.sheet != null);
  const shut = async p => { for (let i = 0; i < 3 && await sheetOpen(p); i++) { await p.click(`${SHEET} [aria-label=Close]`); await p.waitForTimeout(150); } await p.waitForSelector(SHEET, { state: 'detached' }); };
  const nav = async (p, name) => { await shut(p); await p.click(T(`nav-${name}`)); await p.waitForSelector(SHEET); };
  const front = async (p, id) => { await nav(p, 'fronts'); await p.click(`${T('front')}[data-front=${id}]`); await p.waitForSelector(T('sheet-back')); };
  const slot = (p, n) => p.evaluate(k => window.__homefront.map.fronts[k].id, n); // a front by its slot, on any map (3 is Work)

  // The five phone screens, at one viewport height, into one directory under one naming scheme: each in its own country.
  async function phoneSet(height, dir, name, extra) {
    const open = async (n, fn) => {
      const { ctx, p } = await app({ width: 390, height, scenario: SHOW.phone[n] });
      await fn(p); await settle(p);
      const file = path.join(dir, name(n) + '.png'); await p.screenshot({ path: file }); wrote(file, SHOW.phone[n]);
      await ctx.close();
    };
    await open('map', async p => { if (extra) await extra(p); });
    await open('report', async p => { await nav(p, 'report'); await p.fill('#report-text', 'Closed the second pilot today. Skipped the gym again, and I was up till three.'); });
    await open('front', async p => front(p, await slot(p, 3)));
    // the division with the best record, reached the way a person would: its front, then its row
    await open('division', async p => {
      const best = await p.evaluate(() => { const d = window.__homefront.live.divisions.filter(d => d.front).sort((a, b) => b.honours.filter(h => h.win).length - a.honours.filter(h => h.win).length || b.honours.length - a.honours.length)[0]; return { front: d.front, name: d.name }; });
      await front(p, best.front);
      await p.click(`${T('division')}:has-text(${JSON.stringify(best.name)})`);
      await p.waitForFunction(() => window.__homefront.ui.sheet === 'division');
    });
    await open('history', p => nav(p, 'history'));
  }
  // A country's bare map, framed whole, for the cards.
  async function bareMap(id, width, height) {
    const { ctx, p } = await app({ width, height, scale: 2, phone: false, scenario: id, css: QUIET + BARE });
    await p.evaluate(() => { const v = window.__homefront.view; v.home(false); });
    await settle(p);
    const file = path.join(tmp, `bare-${id}.png`); await p.screenshot({ path: file }); await ctx.close();
    return file;
  }
  // A template (og.html, social.html) with four maps and their names set in.
  async function card(template, out, width, height, ids, mapW, mapH) {
    const files = []; for (const id of ids) files.push(await bareMap(id, mapW, mapH));
    const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 });
    const p = await ctx.newPage();
    await p.goto('file://' + path.join(__dirname, template));
    await p.evaluate(([srcs, names]) => Promise.all(srcs.map((src, i) => new Promise((ok, no) => { const img = document.querySelector('#m' + i); img.onload = ok; img.onerror = no; img.src = src; img.nextElementSibling.textContent = names[i]; }))),
      [files.map(f => 'file://' + f), ids.map(id => scenarios.find(s => s.id === id).name)]);
    await p.evaluate(() => document.fonts.ready);
    await p.screenshot({ path: out }); wrote(out, ids.join(', '));
    await ctx.close();
  }

  if (only.includes('site')) {
    // the still behind the live hero map: the landing page's own embed at the end of its story, for four countries
    // (the page picks its country with Math.random, pinned here), then a 2×2 grid of them at the embed's size
    const ids = scenarios.map(s => s.id); let size = null; const tiles = [];
    for (const id of SHOW.still) {
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
      const p = await ctx.newPage();
      await p.addInitScript(([key, appearance, draw]) => { localStorage.setItem(key, appearance); Math.random = () => draw; }, [APPEARANCE_KEY, APPEARANCE, (ids.indexOf(id) + 0.5) / ids.length]);
      await p.goto(base);
      await p.waitForSelector(`[data-testid=hero-map][data-country=${id}]`);
      await p.waitForTimeout(1500);
      const box = await p.locator('[data-testid=hero-map]').boundingBox();
      const clip = { x: Math.round(box.x), y: Math.round(box.y), width: Math.floor(box.width), height: Math.floor(box.height) }; // whole pixels; Landing.jsx declares the size on its <img>
      size = clip; const file = path.join(tmp, `still-${id}.png`); await p.screenshot({ path: file, clip }); tiles.push(file);
      await ctx.close();
    }
    const ctx = await browser.newContext({ viewport: { width: size.width, height: size.height }, deviceScaleFactor: 1 });
    const p = await ctx.newPage();
    await p.setContent(`<body style="margin:0;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:4px;width:${size.width}px;height:${size.height}px;background:#0b1218">${tiles.map(() => '<div style="overflow:hidden;position:relative"><img style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover"></div>').join('')}</body>`);
    await p.evaluate(srcs => Promise.all([...document.images].map((img, i) => new Promise((ok, no) => { img.onload = ok; img.onerror = no; img.src = srcs[i]; }))), tiles.map(f => 'data:image/png;base64,' + fs.readFileSync(f).toString('base64')));
    await p.screenshot({ path: path.join(SITE, 'hero.png') });
    wrote(path.join(SITE, 'hero.png'), `${size.width}x${size.height}: ${SHOW.still.join(', ')}`);
    await ctx.close();
  }

  if (only.includes('docs')) await phoneSet(844, DOCS, n => n);

  if (only.includes('hero')) {
    // the README's first picture: the desktop layout, a front's panel open beside the map
    const { ctx, p } = await app({ width: 1440, height: 900, phone: false, scenario: SHOW.hero });
    await front(p, await slot(p, 3)); // opening a front (Work) also turns the map towards it
    await settle(p); await settle(p);
    await p.screenshot({ path: path.join(DOCS, 'hero.png') });
    wrote(path.join(DOCS, 'hero.png'), SHOW.hero);
    await ctx.close();
  }

  if (only.includes('countries')) {
    // one phone map per country, then a 4×2 sheet of them
    for (const s of scenarios) {
      const { ctx, p } = await app({ width: 390, height: 664, scenario: s.id, css: QUIET + NO_ALERT });
      await settle(p);
      await p.screenshot({ path: path.join(tmp, s.id + '.png') });
      await ctx.close();
    }
    const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const html = `<!doctype html><meta charset="utf-8"><style>
      * { box-sizing: border-box; margin: 0; }
      body { width: 1760px; padding: 40px; background: #0b0e10; color: #eceae5; font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", "Segoe UI", Roboto, sans-serif; -webkit-font-smoothing: antialiased; display: grid; grid-template-columns: repeat(4, 1fr); gap: 44px 32px; }
      img { display: block; width: 100%; border-radius: 22px; border: 1px solid rgba(255,255,255,.16); }
      b { display: block; margin-top: 18px; font-size: 30px; font-weight: 650; letter-spacing: -.01em; }
      span { display: block; margin-top: 4px; font-size: 23px; color: #a2a7ab; }
    </style>${scenarios.map(s => `<figure><img src="${s.id}.png" alt=""><figcaption><b>${esc(s.name)}</b><span>${esc(s.empire)}</span></figcaption></figure>`).join('')}`;
    fs.writeFileSync(path.join(tmp, 'countries.html'), html);
    const ctx = await browser.newContext({ viewport: { width: 1760, height: 1000 }, deviceScaleFactor: 1 });
    const p = await ctx.newPage();
    await p.goto('file://' + path.join(tmp, 'countries.html'));
    await p.waitForFunction(() => [...document.images].every(i => i.complete && i.naturalWidth));
    await p.screenshot({ path: path.join(DOCS, 'countries.png'), fullPage: true });
    wrote(path.join(DOCS, 'countries.png'));
    await ctx.close();
  }

  if (only.includes('pages')) {
    // each country's page: its map alone, a demo campaign under way, framed as the app frames the whole country
    fs.mkdirSync(path.join(SITE, 'countries'), { recursive: true });
    for (const s of scenarios) {
      const { ctx, p } = await app({ width: 1200, height: 630, scale: 1, phone: false, scenario: s.id, css: QUIET + NO_ALERT + BARE });
      const got = await p.evaluate(() => window.__homefront.map.id);
      if (got !== s.id) throw new Error(`wanted ${s.id}, the app loaded ${got}`);
      await p.evaluate(() => { const v = window.__homefront.view; v.frameWhole?.(true); v.home(false); });
      await settle(p); await settle(p);
      const file = path.join(SITE, 'countries', s.id + '.png');
      await p.screenshot({ path: file });
      wrote(file);
      await ctx.close();
    }
  }

  if (only.includes('select')) {
    // the first thing a first run shows: the country picker, with France highlighted and its map behind
    for (const [file, width, height, phone] of [['select.png', 390, 844, true], ['select-desktop.png', 1440, 900, false]]) {
      const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 2, ...(phone ? { isMobile: true, hasTouch: true, userAgent: PHONE_UA } : {}) });
      const p = await ctx.newPage();
      p.on('pageerror', e => console.log('PAGE ERROR', e.message));
      await p.addInitScript(([key, appearance]) => localStorage.setItem(key, appearance), [APPEARANCE_KEY, APPEARANCE]);
      await p.goto(base + 'demo/'); // no ?demo=1: nothing has been chosen yet
      await p.waitForSelector(T('picker'));
      await p.addStyleTag({ content: QUIET });
      await p.click(`${T('country')}[data-id=france]`);
      await p.waitForFunction(() => window.__homefront.view.map.id === 'france' && !window.__homefront.ui.picker.busy);
      await p.evaluate(() => document.fonts.ready);
      await settle(p);
      await p.screenshot({ path: path.join(DOCS, file) });
      wrote(path.join(DOCS, file));
      await ctx.close();
    }
  }

  if (only.includes('cards')) {
    // og.png for the landing page and social-preview.png for the repository: the title over four countries' maps
    await card('og.html', path.join(SITE, 'og.png'), 1200, 630, SHOW.cards, 520, 500);
    await card('social.html', path.join(DOCS, 'social-preview.png'), 1280, 640, SHOW.cards, 560, 460);
  }
  await browser.close();
  fs.rmSync(tmp, { recursive: true, force: true });
})().catch(e => { console.error('FAILED', e.message); process.exit(1); });
