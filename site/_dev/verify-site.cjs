// The checks that cover every page of the built site, run by verify.cjs after its landing-page checks.
// Reads _site/ from disk for the list of pages, and loads each one from the preview server.
//   every page: a unique title (≤ 60) and description (50 to 160), its own absolute canonical address, lang, 1 h1,
//     headings that never skip a level, header, main and footer, alt text on every image, an Open Graph and Twitter
//     card, structured data that parses (a FAQPage that says exactly what the page shows), a Markdown copy,
//     no sideways scroll at 390 wide, scrolls when scrolled (and to the end on a desktop), no console errors, no game trademark, no exclamation mark
//   the site: the sitemap lists exactly the pages built, llms.txt and every internal link lead somewhere
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const SITE_DIR = path.join(__dirname, '..', '..', '_site');

function builtPages() {
  const pages = [];
  (function walk(dir) {
    for (const n of fs.readdirSync(dir).sort()) {
      const f = path.join(dir, n);
      if (fs.statSync(f).isDirectory()) { if (path.relative(SITE_DIR, f) !== 'demo') walk(f); }
      else if (n === 'index.html') pages.push(path.relative(SITE_DIR, dir).split(path.sep).join('/').replace(/^$/, '').replace(/([^/])$/, '$1/'));
    }
  })(SITE_DIR);
  return pages.sort((a, b) => (a === "" ? -1 : b === "" ? 1 : a.localeCompare(b)));
}

module.exports = async function verifySite(browser, base) {
  const pages = builtPages();
  assert.ok(pages.length >= 15, `only ${pages.length} pages built`);
  const seen = { title: new Map(), description: new Map(), canonical: new Map() };
  const links = new Set();
  const keywordSets = new Map();
  let site = null;
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  const table = [];
  for (const pagePath of pages) {
    const p = await ctx.newPage();
    const errors = [];
    p.on('pageerror', e => errors.push('pageerror: ' + e.message));
    p.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
    p.on('response', r => { if (r.status() >= 400) errors.push(r.status() + ' ' + r.url()); });
    await p.goto(base + pagePath, { waitUntil: 'load' });
    await p.waitForTimeout(400); // hydration
    const info = await p.evaluate(() => {
      const m = s => document.querySelector(s)?.getAttribute('content') || '';
      const heads = [...document.querySelectorAll('h1, h2, h3, h4, h5, h6')].map(h => Number(h.tagName[1]));
      return {
        lang: document.documentElement.lang, titles: document.querySelectorAll('title').length, title: document.title,
        description: m('meta[name=description]'), keywords: m('meta[name=keywords]'), canonical: document.querySelector('link[rel=canonical]')?.getAttribute('href') || '',
        markdown: document.querySelector('link[rel=alternate][type="text/markdown"]')?.getAttribute('href') || '',
        og: { title: m('meta[property="og:title"]'), image: m('meta[property="og:image"]'), w: m('meta[property="og:image:width"]'), h: m('meta[property="og:image:height"]'), alt: m('meta[property="og:image:alt"]'), url: m('meta[property="og:url"]') },
        twitter: { card: m('meta[name="twitter:card"]'), image: m('meta[name="twitter:image"]') },
        ld: [...document.querySelectorAll('script[type="application/ld+json"]')].map(s => s.textContent),
        heads, h1: document.querySelectorAll('h1').length,
        landmarks: ['header', 'main', 'footer', 'nav'].filter(t => document.querySelector(t)),
        noAlt: [...document.images].filter(i => !i.hasAttribute('alt')).map(i => i.src),
        sideways: document.documentElement.scrollWidth > innerWidth || document.body.scrollWidth > innerWidth,
        words: document.body.innerText,
        hrefs: [...document.querySelectorAll('a[href]')].map(a => a.getAttribute('href')),
        faq: [...document.querySelectorAll('[data-testid=prose] section[aria-label]')].map(s => ({ q: s.querySelector('h3').textContent, a: s.querySelector('p').textContent })),
      };
    });
    const where = '/' + pagePath;
    assert.equal(info.lang, 'en', `${where}: lang`);
    assert.equal(info.titles, 1, `${where}: one <title>`);
    assert.ok(info.title.length > 10 && info.title.length <= 60, `${where}: title is ${info.title.length} characters`);
    assert.ok(info.description.length >= 50 && info.description.length <= 160, `${where}: description is ${info.description.length} characters`);
    for (const k of ['title', 'description', 'canonical']) { assert.ok(!seen[k].has(info[k]), `${where}: same ${k} as ${seen[k].get(info[k])}`); seen[k].set(info[k], where); }
    // keywords: 8 to 15 terms of its own, the same list in the structured data, no page's list a copy of another's
    const terms = info.keywords.split(',').map(t => t.trim()).filter(Boolean);
    assert.ok(terms.length >= 8 && terms.length <= 15, `${where}: ${terms.length} keywords`);
    assert.equal(new Set(terms.map(t => t.toLowerCase())).size, terms.length, `${where}: a keyword twice`);
    for (const [other, list] of keywordSets) {
      const shared = terms.filter(t => list.includes(t)).length;
      assert.ok(shared / Math.min(terms.length, list.length) < 0.75, `${where}: its keywords are mostly ${other}'s (${shared} shared)`);
    }
    keywordSets.set(where, terms);
    assert.ok(info.ld.some(t => t.includes(`"keywords":"${info.keywords.replace(/"/g, '\\"')}"`)), `${where}: the keywords are not in the structured data`);
    assert.match(info.canonical, /^https:\/\/.+\/$/, `${where}: canonical address`);
    if (!site) site = info.canonical; // the landing page is first
    assert.equal(info.canonical, site + pagePath, `${where}: canonical is the page's own address`);
    assert.equal(info.og.url, info.canonical, `${where}: og:url`);
    assert.equal(info.h1, 1, `${where}: ${info.h1} h1 elements`);
    assert.equal(info.heads[0], 1, `${where}: the first heading is the h1`);
    for (let i = 1; i < info.heads.length; i++) assert.ok(info.heads[i] <= info.heads[i - 1] + 1, `${where}: heading h${info.heads[i - 1]} is followed by h${info.heads[i]}`);
    for (const l of ['header', 'main', 'footer', 'nav']) assert.ok(info.landmarks.includes(l), `${where}: no <${l}>`);
    assert.deepEqual(info.noAlt, [], `${where}: images without alt text`);
    assert.equal(info.sideways, false, `${where}: scrolls sideways at 390 wide`);
    // a page taller than the window scrolls when someone scrolls it (the app shell's stylesheet pins body and #root)
    if (await p.evaluate(() => document.documentElement.scrollHeight > innerHeight + 50)) {
      await p.mouse.move(195, 400); await p.mouse.wheel(0, 700); await p.waitForTimeout(300);
      assert.ok(await p.evaluate(() => scrollY) > 0, `${where}: does not scroll`);
    }
    assert.ok(info.og.title && info.og.image && info.og.alt && info.og.w && info.og.h, `${where}: Open Graph card`);
    assert.equal(info.twitter.card, 'summary_large_image', `${where}: Twitter card`);
    assert.equal(info.twitter.image, info.og.image, `${where}: the two cards' images`);
    const ogImage = new URL(info.og.image, base + pagePath).href.replace(site, base);
    const img = await p.evaluate(async src => { const i = new Image(); i.src = src; try { await i.decode(); return `${i.naturalWidth}x${i.naturalHeight}`; } catch { return 'broken'; } }, ogImage);
    assert.equal(img, `${info.og.w}x${info.og.h}`, `${where}: og:image ${ogImage}`);
    assert.doesNotMatch(info.words.replace(/\S*github(?:usercontent)?\.(?:com|io)\S*/g, ''), /hearts of iron|\bhoi\s?4\b/i, `${where}: a game's trademark on the page`);
    assert.doesNotMatch(info.words, /!/, `${where}: an exclamation mark on the page`);
    // structured data
    assert.ok(info.ld.length >= 1, `${where}: no structured data`);
    const graph = info.ld.flatMap(t => { const j = JSON.parse(t); return j['@graph'] || [j]; });
    const types = graph.map(x => x['@type']);
    assert.ok(!info.ld.join('').includes('aggregateRating') && !info.ld.join('').includes('"review"'), `${where}: ratings or reviews in the structured data`);
    if (pagePath) {
      const crumbs = graph.find(x => x['@type'] === 'BreadcrumbList');
      assert.ok(crumbs, `${where}: BreadcrumbList`);
      assert.equal(crumbs.itemListElement.at(-1).item, info.canonical, `${where}: the last breadcrumb is the page`);
    } else {
      for (const t of ['WebSite', 'SoftwareApplication', 'SoftwareSourceCode']) assert.ok(types.includes(t), `${where}: ${t}`);
      const app = graph.find(x => x['@type'] === 'SoftwareApplication');
      for (const k of ['name', 'description', 'applicationCategory', 'operatingSystem', 'offers', 'license', 'url', 'softwareVersion', 'screenshot', 'featureList']) assert.ok(app[k], `SoftwareApplication.${k}`);
      assert.equal(app.softwareVersion, require('../../package.json').version);
      assert.ok(graph.find(x => x['@type'] === 'SoftwareSourceCode').codeRepository.startsWith('https://github.com/'));
    }
    const faqPage = graph.find(x => x['@type'] === 'FAQPage');
    if (faqPage || info.faq.length) {
      assert.ok(faqPage, `${where}: questions on the page but no FAQPage`);
      assert.deepEqual(faqPage.mainEntity.map(q => ({ q: q.name, a: q.acceptedAnswer.text })), info.faq, `${where}: the FAQPage and the questions on the page differ`);
    }
    if (pagePath === 'self-hosting/') assert.ok(types.includes('HowTo'), `${where}: HowTo`);
    // the Markdown copy
    assert.ok(info.markdown, `${where}: no Markdown copy linked`);
    const md = await p.request.get(new URL(info.markdown, base + pagePath).href);
    assert.equal(md.status(), 200, `${where}: Markdown copy`);
    assert.match(await md.text(), /^# /, `${where}: the Markdown copy starts with a heading`);
    assert.deepEqual(errors, [], `${where}: errors`);
    for (const h of info.hrefs) if (!/^(https?:|mailto:|#)/.test(h)) links.add(new URL(h, base + pagePath).href.split('#')[0]);
    table.push(`${where} (${types.join(', ')})`);
    await p.close();
  }
  { // and on a desktop window, to the very end of the page
    const d = await browser.newContext({ viewport: { width: 1440, height: 900 } }); const p = await d.newPage();
    await p.goto(base, { waitUntil: 'load' }); await p.waitForTimeout(400);
    await p.mouse.move(720, 450); for (let i = 0; i < 60; i++) await p.mouse.wheel(0, 1200);
    await p.waitForTimeout(500);
    const end = await p.evaluate(() => ({ y: scrollY, max: document.documentElement.scrollHeight - innerHeight }));
    assert.ok(end.max > 0 && end.y >= end.max - 2, `/: a desktop window does not scroll to the end (${end.y} of ${end.max})`);
    await d.close();
  }
  console.log(`ok ${pages.length} pages: unique titles, descriptions and canonical addresses; 1 h1 each; headings in order; cards, structured data and Markdown copies; no sideways scroll at 390; every page scrolls; no errors`);
  for (const t of table) console.log('   ' + t);

  // the appearance button says what it did, in a toast loaded on that first press, on the landing page and a content page
  for (const pagePath of ['', 'faq/']) {
    const p = await ctx.newPage();
    await p.goto(base + pagePath, { waitUntil: 'load' });
    await p.waitForTimeout(400);
    await p.click('[data-testid=appearance]');
    await p.waitForSelector('text=/^Appearance: (Light|Dark|Auto)$/', { timeout: 5000 });
    await p.close();
  }
  console.log('ok the appearance toast loads on the first press, on the landing page and a content page');

  // the sitemap lists exactly the pages built
  const sitemap = await (await fetch(base + 'sitemap.xml')).text();
  const listed = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1].replace(site, '')).sort();
  assert.deepEqual(listed, [...pages].sort(), 'the sitemap and the built pages differ');
  assert.ok([...sitemap.matchAll(/<lastmod>(\d{4}-\d\d-\d\d)<\/lastmod>/g)].length === pages.length, 'every sitemap entry has a lastmod');
  // robots.txt points at the sitemap and lets everyone in
  const robots = await (await fetch(base + 'robots.txt')).text();
  assert.ok(robots.includes(`Sitemap: ${site}sitemap.xml`), 'robots.txt names the sitemap');
  assert.doesNotMatch(robots, /^Disallow:\s*\/\s*$/m, 'robots.txt shuts something out');
  for (const bot of ['GPTBot', 'OAI-SearchBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended', 'Applebot-Extended', 'CCBot']) assert.ok(robots.includes(`User-agent: ${bot}`), `robots.txt names ${bot}`);
  // llms.txt: the format, and every link on this site leads somewhere
  const llms = await (await fetch(base + 'llms.txt')).text();
  assert.match(llms, /^# Home Front\n\n> .+\n/, 'llms.txt starts with the name and a summary');
  const llmsLinks = [...llms.matchAll(/\]\(([^)]+)\)/g)].map(m => m[1]);
  assert.ok(llmsLinks.length > 20, 'llms.txt links');
  for (const l of llmsLinks) if (l.startsWith(site)) links.add(l.replace(site, base));
  const full = await (await fetch(base + 'llms-full.txt')).text();
  assert.ok(full.length > 40000 && /^# Home Front/.test(full), 'llms-full.txt');
  for (const words of ['MIT', 'Ollama', 'Ethiopia', 'Siam', 'Raspberry Pi', 'offline judge']) assert.ok(full.includes(words), `llms-full.txt lacks ${words}`);
  for (const f of ['skill.md', 'SKILL.md']) assert.equal(await (await fetch(base + f)).text(), fs.readFileSync(path.join(__dirname, '..', '..', 'SKILL.md'), 'utf8'), `${f} is the repository's SKILL.md`);
  // every internal link
  const broken = [];
  for (const l of links) { const r = await fetch(l); if (r.status !== 200) broken.push(`${r.status} ${l}`); }
  assert.deepEqual(broken, [], 'internal links that lead nowhere');
  console.log(`ok site: the sitemap lists the ${pages.length} pages built; robots.txt, llms.txt (${(llms.length / 1024).toFixed(1)} kB), llms-full.txt (${(full.length / 1024).toFixed(1)} kB) and /skill.md; ${links.size} internal links all lead somewhere`);
  await ctx.close();
};

// on its own: node site/_dev/verify-site.cjs http://localhost:8153/
if (require.main === module) {
  (async () => {
    const browser = await require('playwright').chromium.launch();
    await module.exports(browser, (process.argv[2] || 'http://localhost:8153/').replace(/\/*$/, '/'));
    await browser.close();
  })().catch(e => { console.error('FAILED', e.message); process.exit(1); });
}
