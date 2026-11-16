// Regenerates the landing page's images from the running product. Not deployed (the build skips _dev/).
//   PORT=8153 node tools/build-site.mjs --serve      (in one terminal)
//   node site/_dev/shots.cjs http://localhost:8153/  (in another; needs Playwright with Chromium)
//   python3 site/_dev/optimize.py                    (palette-quantises the PNGs; needs Pillow)
// then build again so _site/ picks the new images up.
const path = require('node:path');
const { chromium } = require('playwright');
const base = process.argv[2] || 'http://localhost:8153/';
const only = process.argv[3] || 'app,hero,og';
const img = path.join(__dirname, '..', 'img');

(async () => {
  const browser = await chromium.launch();

  if (only.includes('app')) {
    // iPhone-sized (Safari's visible area), 2x: 780 px wide images
    const ctx = await browser.newContext({ viewport: { width: 390, height: 664 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' });
    const p = await ctx.newPage();
    p.on('pageerror', e => console.log('PAGE ERROR', e.message));
    // seed the campaign exactly as a visitor would: through the landing page's demo link
    await p.goto(base);
    await p.evaluate(() => { const a = document.querySelector('a[data-demo]'); a.addEventListener('click', e => e.preventDefault()); a.click(); });
    await p.goto(base + 'demo/?demo=1');
    await p.waitForFunction(() => window.__artesh?.st);
    const quiet = () => p.evaluate(() => { for (const s of ['#toast', '#banner', '#demo-note']) { const el = document.querySelector(s); if (el) el.hidden = true; } });
    const shot = async (n, clip) => { await p.waitForTimeout(1000); await quiet(); await p.screenshot({ path: path.join(img, n + '.png'), clip }); console.log('wrote', n + '.png'); };
    const close = async () => { if (await p.locator('#sheet:not([hidden]) .x').count()) await p.click('#sheet .x'); };
    await shot('shot-map');
    // step 3 illustration: the eastern front, cropped
    await p.evaluate(() => window.__artesh.view.flyToFront('afg'));
    await shot('step-map', { x: 60, y: 150, width: 320, height: 200 });
    await p.evaluate(() => window.__artesh.view.flyToFront('irq'));
    await p.waitForTimeout(800);
    await p.click('#nav .report');
    await p.fill('#rtext', 'Closed the second pilot today. Skipped the gym again, and I was up till three.');
    await shot('shot-report');
    await close();
    await p.click('#nav [data-sheet="fronts"]');
    await p.click('.front[data-arg="irq"]');
    await shot('shot-front');
    // the division with the best record
    const id = await p.evaluate(() => String(window.__artesh.live.divisions.filter(d => d.front).sort((a, b) => b.honours.filter(h => h.win).length - a.honours.filter(h => h.win).length || b.honours.length - a.honours.length)[0].id));
    await p.evaluate(id => { const x = document.createElement('button'); x.dataset.act = 'open'; x.dataset.sheet = 'division'; x.dataset.arg = id; x.hidden = true; document.body.append(x); x.click(); x.remove(); }, id);
    await shot('shot-division');
    await close();
    await p.click('#nav [data-sheet="history"]');
    await shot('shot-history');
    await ctx.close();
  }

  if (only.includes('hero')) {
    // the still behind the live hero map: the embed itself, at the end of the story
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 2, reducedMotion: 'reduce' });
    const p = await ctx.newPage();
    await p.goto(base);
    await p.waitForSelector('#hero-map.live');
    await p.waitForTimeout(1500);
    const box = await p.locator('#hero-map').boundingBox();
    await p.screenshot({ path: path.join(img, 'hero.png'), clip: box });
    console.log('wrote hero.png', Math.round(box.width * 2) + 'x' + Math.round(box.height * 2));
    await ctx.close();
  }

  if (only.includes('og')) {
    const ctx = await browser.newContext({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
    const p = await ctx.newPage();
    await p.goto('file://' + path.join(__dirname, 'og.html'));
    await p.waitForTimeout(400);
    await p.screenshot({ path: path.join(img, 'og.png') });
    console.log('wrote og.png');
    await ctx.close();
  }
  await browser.close();
})();
