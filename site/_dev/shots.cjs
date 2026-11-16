// Regenerates every image in site/img/ and docs/img/ from the running product. Not deployed (the build skips _dev/).
//   PORT=8153 node tools/build-site.mjs --serve      (in one terminal)
//   node site/_dev/shots.cjs http://localhost:8153/  (in another; needs Playwright with Chromium)
//   python3 site/_dev/optimize.py                    (palette-quantises the PNGs; needs Pillow)
// then build again so _site/ picks the new images up.
// A second argument picks groups: site,docs,hero,countries,cards (default: all of them).
//
//   site/img/  hero.png (the landing page's hero map), shot-*.png and step-map.png (phone, 390×664 @2x),
//              og.png (1200×630, from og.html), countries.png
//   docs/img/  hero.png (desktop, 1440×900 @2x), map/report/front/division/history.png (phone, 390×844 @2x),
//              countries.png, social-preview.png (1280×640, from social.html)
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { chromium } = require('playwright');
const base = (process.argv[2] || 'http://localhost:8153/').replace(/\/*$/, '/');
const only = (process.argv[3] || 'site,docs,hero,countries,cards').split(',');
const root = path.join(__dirname, '..', '..');
const SITE = path.join(root, 'site', 'img'), DOCS = path.join(root, 'docs', 'img');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'artesh-shots-'));
const scenarios = JSON.parse(fs.readFileSync(path.join(root, 'data', 'scenarios.json'), 'utf8'));

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
  async function app({ width, height, scale = 2, phone = true, scenario = 'iran', css = QUIET }) {
    const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: scale, ...(phone ? { isMobile: true, hasTouch: true, userAgent: PHONE_UA } : {}) });
    const p = await ctx.newPage();
    p.on('pageerror', e => console.log('PAGE ERROR', e.message));
    await p.addInitScript(([key, appearance, scenario]) => {
      localStorage.setItem(key, appearance);
      // an empty campaign in this country; ?demo=1 fills it with the demo reports
      if (!localStorage.getItem('artesh.v1')) localStorage.setItem('artesh.v1', JSON.stringify({ v: 3, scenario, reports: [], labels: {}, notes: {}, off: [], campaigns: {} }));
      sessionStorage.setItem('artesh.demo-note', '1');
    }, [APPEARANCE_KEY, APPEARANCE, scenario]);
    await p.goto(base + 'demo/?demo=1');
    await p.waitForFunction(() => window.__artesh?.st && window.__artesh.data.reports.length);
    await p.addStyleTag({ content: css });
    await p.evaluate(() => document.fonts.ready);
    await p.waitForTimeout(1200); // the first frame, the map's opening move
    const theme = await p.evaluate(() => document.documentElement.dataset.theme);
    if (theme !== APPEARANCE) throw new Error(`appearance is ${theme}, wanted ${APPEARANCE}`);
    return { ctx, p };
  }
  const settle = p => p.waitForTimeout(1100); // sheets slide and the map flies: wait them out
  const sheetOpen = p => p.evaluate(() => window.__artesh.ui.sheet != null);
  const shut = async p => { for (let i = 0; i < 3 && await sheetOpen(p); i++) { await p.click(`${SHEET} [aria-label=Close]`); await p.waitForTimeout(150); } await p.waitForSelector(SHEET, { state: 'detached' }); };
  const nav = async (p, name) => { await shut(p); await p.click(T(`nav-${name}`)); await p.waitForSelector(SHEET); };
  const front = async (p, id) => { await nav(p, 'fronts'); await p.click(`${T('front')}[data-front=${id}]`); await p.waitForSelector(T('sheet-back')); };

  // The five phone screens, at one viewport height, into one directory under one naming scheme.
  async function phoneSet(height, dir, name, extra) {
    const { ctx, p } = await app({ width: 390, height });
    const shot = async (n, clip) => { await settle(p); const file = path.join(dir, name(n) + '.png'); await p.screenshot({ path: file, clip }); wrote(file); };
    await shot('map');
    if (extra) await extra(p, shot);
    await nav(p, 'report');
    await p.fill('#report-text', 'Closed the second pilot today. Skipped the gym again, and I was up till three.');
    await shot('report');
    await front(p, 'irq');
    await shot('front');
    // the division with the best record, reached the way a person would: its front, then its row
    const best = await p.evaluate(() => { const d = window.__artesh.live.divisions.filter(d => d.front).sort((a, b) => b.honours.filter(h => h.win).length - a.honours.filter(h => h.win).length || b.honours.length - a.honours.length)[0]; return { front: d.front, name: d.name }; });
    await front(p, best.front);
    await p.click(`${T('division')}:has-text(${JSON.stringify(best.name)})`);
    await p.waitForFunction(() => window.__artesh.ui.sheet === 'division');
    await shot('division');
    await nav(p, 'history');
    await shot('history');
    await ctx.close();
  }

  if (only.includes('site')) {
    await phoneSet(664, SITE, n => 'shot-' + n, async (p, shot) => {
      // step 3 illustration: the eastern front, cropped
      await p.evaluate(() => window.__artesh.view.flyToFront('afg'));
      await shot('step-map', { x: 35, y: 150, width: 320, height: 200 });
      fs.renameSync(path.join(SITE, 'shot-step-map.png'), path.join(SITE, 'step-map.png'));
      await p.evaluate(() => window.__artesh.view.home(false));
    });
    // the still behind the live hero map: the landing page's own embed, at the end of its story
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 2, reducedMotion: 'reduce' });
    const p = await ctx.newPage();
    await p.goto(base);
    await p.waitForSelector('#hero-map.live');
    await p.waitForTimeout(1500);
    const box = await p.locator('#hero-map').boundingBox();
    const clip = { x: Math.round(box.x), y: Math.round(box.y), width: Math.floor(box.width), height: Math.floor(box.height) }; // whole pixels: 1130×904 at 2x, as index.html declares
    await p.screenshot({ path: path.join(SITE, 'hero.png'), clip });
    wrote(path.join(SITE, 'hero.png'), clip.width * 2 + 'x' + clip.height * 2);
    await ctx.close();
  }

  if (only.includes('docs')) await phoneSet(844, DOCS, n => n);

  if (only.includes('hero')) {
    // the README's first picture: the desktop layout, a front's panel open beside the map
    const { ctx, p } = await app({ width: 1440, height: 900, phone: false });
    await front(p, 'irq'); // opening a front also turns the map towards it
    await settle(p); await settle(p);
    await p.screenshot({ path: path.join(DOCS, 'hero.png') });
    wrote(path.join(DOCS, 'hero.png'));
    await ctx.close();
  }

  if (only.includes('countries')) {
    // one phone map per country, then a 4×2 sheet of them
    for (const s of scenarios) {
      const { ctx, p } = await app({ width: 390, height: 664, scenario: s.id, css: QUIET + NO_ALERT });
      const got = await p.evaluate(() => window.__artesh.map.id);
      if (got !== s.id) throw new Error(`wanted ${s.id}, the app loaded ${got}`);
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
    fs.copyFileSync(path.join(DOCS, 'countries.png'), path.join(SITE, 'countries.png'));
    wrote(path.join(DOCS, 'countries.png')); wrote(path.join(SITE, 'countries.png'));
    await ctx.close();
  }

  if (only.includes('cards')) {
    // og.png for the landing page: og.html, which frames site/img/hero.png
    let ctx = await browser.newContext({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
    let p = await ctx.newPage();
    await p.goto('file://' + path.join(__dirname, 'og.html'));
    await p.waitForFunction(() => [...document.images].every(i => i.complete && i.naturalWidth));
    await p.screenshot({ path: path.join(SITE, 'og.png') });
    wrote(path.join(SITE, 'og.png'));
    await ctx.close();
    // social-preview.png for the repository: the bare map at exactly the card's size, then social.html over it
    const bare = await app({ width: 1280, height: 640, scale: 1, phone: false, css: QUIET + BARE });
    await bare.p.evaluate(() => { const v = window.__artesh.view; v.home(false); });
    await settle(bare.p);
    await bare.p.screenshot({ path: path.join(tmp, 'social-map.png') });
    await bare.ctx.close();
    ctx = await browser.newContext({ viewport: { width: 1280, height: 640 }, deviceScaleFactor: 1 });
    p = await ctx.newPage();
    await p.goto('file://' + path.join(__dirname, 'social.html'));
    await p.evaluate(src => new Promise((ok, no) => { const i = document.querySelector('#bg'); i.onload = ok; i.onerror = no; i.src = src; }), 'file://' + path.join(tmp, 'social-map.png'));
    await p.screenshot({ path: path.join(DOCS, 'social-preview.png') });
    wrote(path.join(DOCS, 'social-preview.png'));
    await ctx.close();
  }
  await browser.close();
  fs.rmSync(tmp, { recursive: true, force: true });
})().catch(e => { console.error('FAILED', e.message); process.exit(1); });
