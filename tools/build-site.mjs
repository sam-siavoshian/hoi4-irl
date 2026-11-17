// Builds _site/ for static hosting (Vercel, see vercel.json): the landing page at the root, the content pages under it
// (countries/, self-hosting/, ai-providers/, how-it-works/, faq/, compare/), and the app at /demo/.
// Every page is a small React page on the design system (site/, vite.site.config.js). Vite builds them for the
// browser, then builds site/prerender.jsx as a server bundle, and each page's HTML is written in, so it reads before
// any script runs and the browser only hydrates it. What each page says is data (site/content/pages.mjs), read from
// the scenarios, the engine, the provider registry and package.json (tools/content-data.mjs) at build time.
// Beside the pages, from the same data: a Markdown copy of each page (<page>/index.md), llms.txt and llms-full.txt,
// sitemap.xml, robots.txt, the setup skill as /SKILL.md and /skill.md, and each page's structured data (JSON-LD).
// The app is the built interface (dist/, made here with tools/ensure-build.mjs) plus the maps, icons and manifest; the
// landing page's hero reads its maps from there (demo/data/maps/).
// Every URL inside a page is relative, so it runs under any sub-path.
//   node tools/build-site.mjs            build
//   node tools/build-site.mjs --serve    build, then preview on http://localhost:$PORT (default 8080)
// SITE_URL (e.g. https://homefront-map.vercel.app/) is the address the site is published at: it makes the social-card
// images absolute, and is the base of the canonical addresses, the sitemap, llms.txt and the structured data
// (package.json's homepage when unset).
// Needs the dev dependencies (npm install); nothing else.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import zlib from 'node:zlib';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { contentData } from './content-data.mjs';
import { buildPages, linkOf, keyFacts, DEFINITION, NAME } from '../site/content/pages.mjs';
import { pageToMarkdown, blocksToMarkdown, wordCount } from '../site/content/markdown.mjs';
import { plain } from '../site/content/inline.mjs';
import { keywordsFor } from '../site/content/keywords.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, '_site');
const config = path.join(root, 'vite.site.config.js');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const fromEnv = (process.env.SITE_URL || '').trim();
const SITE = (fromEnv || pkg.homepage).replace(/\/*$/, '/');
const ABSOLUTE_IMAGES = fromEnv.length > 1;
// what is copied from site/ beside the built pages
const STATIC = ['img'];
// [from, to under demo/]: the built files first, then what the server would serve beside them
const APP = [['dist', ''], ['manifest.webmanifest', 'manifest.webmanifest'], ['data/maps', 'data/maps'], ['data/scenarios.json', 'data/scenarios.json'], ['icons', 'icons']];
const fail = msg => { console.error('build-site: ' + msg); process.exit(1); };
{ const r = spawnSync(process.execPath, [path.join(root, 'tools', 'ensure-build.mjs')], { stdio: 'inherit' }); if (r.status !== 0) process.exit(r.status || 1); }

// The day the sources last changed: the last commit's date, or today outside a repository.
const LASTMOD = (() => { const r = spawnSync('git', ['log', '-1', '--format=%cs'], { cwd: root, encoding: 'utf8' }); return r.status === 0 && /^\d{4}-\d\d-\d\d$/.test(r.stdout.trim()) ? r.stdout.trim() : new Date().toISOString().slice(0, 10); })();

// ---- what the pages say ----
const data = await contentData(root);
const pages = buildPages(data, SITE);
const byName = Object.fromEntries(pages.map(p => [p.name, p]));
const flags = Object.fromEntries(data.countries.map(c => [c.id, c]));
for (const p of pages) p.keywords = keywordsFor(p, data); // one list per page: meta keywords, article:tag, JSON-LD

// ---- the browser build, then the server bundle that renders each page ----
const { build } = await import('vite');
// The kit is one package with one stylesheet, and Tailwind makes classes for every file in it. The site loads only
// some of those files, so the rest are listed in site/kit-unused.css (`@source not`) and their classes are left out:
// the build learns which files it bundled, and when the list is out of date it writes it and builds once more.
const KIT = path.join(root, 'vendor', 'design-system', 'src');
const UNUSED = path.join(root, 'site', 'kit-unused.css');
async function client() {
  const bundled = new Set();
  const seen = { name: 'homefront-kit-files', generateBundle(_, bundle) { for (const c of Object.values(bundle)) if (c.type === 'chunk') for (const id of Object.keys(c.modules)) bundled.add(id.split('?')[0]); } };
  await build({ configFile: config, logLevel: 'warn', plugins: [seen] }); // empties _site/ first
  const files = [];
  (function walk(d) { for (const n of fs.readdirSync(d).sort()) { const f = path.join(d, n); if (fs.statSync(f).isDirectory()) walk(f); else if (/\.(?:tsx?|jsx?)$/.test(n) && !/\.d\.ts$/.test(n)) files.push(f); } })(KIT);
  const list = files.filter(f => !bundled.has(f)).map(f => `@source not "${path.relative(path.dirname(UNUSED), f).split(path.sep).join('/')}";`);
  return `/* Written by tools/build-site.mjs: the design system's files the site doesn't load (${list.length} of ${files.length}). */\n${list.join('\n')}\n`;
}
{
  const want = await client();
  if (!fs.existsSync(UNUSED) || fs.readFileSync(UNUSED, 'utf8') !== want) {
    fs.writeFileSync(UNUSED, want);
    console.log('build-site: site/kit-unused.css was out of date; written, building again');
    const again = await client();
    if (again !== want) fail('site/kit-unused.css does not settle: the bundle depends on the list');
  }
}
const ssr = path.join(root, 'node_modules', '.homefront-site-prerender'); // under node_modules so the bundle finds react
await build({ configFile: config, logLevel: 'warn', build: { ssr: 'prerender.jsx', outDir: ssr, emptyOutDir: true } });
const { render, renderDoc } = await import(pathToFileURL(path.join(ssr, 'prerender.js')).href);
fs.rmSync(ssr, { recursive: true, force: true });
const shells = { landing: fs.readFileSync(path.join(out, 'index.html'), 'utf8'), doc: fs.readFileSync(path.join(out, 'doc.html'), 'utf8') };
fs.rmSync(path.join(out, 'doc.html'));
for (const [k, html] of Object.entries(shells)) for (const mark of ['<!--head-->', '<!--prerender-->']) if (!html.includes(mark)) fail(`site/${k === 'landing' ? 'index' : 'doc'}.html has no ${mark} marker`);

// ---- each page's head ----
const attr = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const text = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const relOf = page => '../'.repeat(page.path.split('/').filter(Boolean).length) || './';
const imageOf = page => page.image || byName.landing.image;
const ID = { site: SITE + '#website', app: SITE + '#app', source: SITE + '#source' };
const FEATURES = [
  'Daily journal: 1 sentence a day, spoken or typed, filed and dated',
  'A 1936 war map with 7 fronts, each a part of your life',
  `${data.countries.length} countries: ${data.countries.map(c => c.name).join(', ')}`,
  `${data.actions.length} battle types, each tied to a real-life meaning`,
  'Any AI provider with your own key, local models, or an offline judge',
  'History with a calendar, editable entries, a weekly recap and a replay',
  'Ask questions about your own record',
  'Installs to the iPhone or Android home screen and works offline',
  'Self-hosted: 1 password, data in plain files, no telemetry',
  'HTTP API and command-line tool for Shortcuts, Siri or scheduled jobs',
];

function structuredData(page) {
  const url = SITE + page.path;
  const img = SITE + imageOf(page).src;
  const graph = [];
  const website = { '@type': 'WebSite', '@id': ID.site, name: NAME, url: SITE, description: DEFINITION, inLanguage: 'en' };
  const app = {
    '@type': 'SoftwareApplication', '@id': ID.app, name: NAME, url: SITE, description: DEFINITION.replace(/^Home Front is an? /, 'An '),
    applicationCategory: 'LifestyleApplication', applicationSubCategory: 'Productivity, journal, habit and life tracker',
    operatingSystem: 'Web browser; self-hosted on macOS, Linux, Raspberry Pi OS, Windows (WSL2) or Docker; installs on iOS and Android as a web app',
    softwareVersion: data.version, license: `https://opensource.org/licenses/${data.license}`, isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    image: SITE + byName.landing.image.src,
    screenshot: [SITE + 'img/hero.png', ...data.countries.map(c => `${SITE}img/countries/${c.id}.png`)],
    featureList: FEATURES, keywords: byName.landing.keywords.join(', '), softwareHelp: SITE + 'faq/', downloadUrl: data.repo, sameAs: [data.repo],
    subjectOf: { '@id': ID.source },
  };
  const source = {
    '@type': 'SoftwareSourceCode', '@id': ID.source, name: `${NAME} source code`, codeRepository: data.repo, url: data.repo,
    programmingLanguage: ['JavaScript'], runtimePlatform: `Node.js ${data.node} or newer`, license: `https://opensource.org/licenses/${data.license}`,
    version: data.version, targetProduct: { '@id': ID.app }, author: { '@type': 'Organization', name: pkg.author, url: data.repo },
  };
  if (page.kind === 'landing') {
    graph.push(website, app, source, { '@type': 'WebPage', '@id': url + '#page', url, name: page.title, description: page.description, isPartOf: { '@id': ID.site }, about: { '@id': ID.app }, primaryImageOfPage: img, inLanguage: 'en', dateModified: LASTMOD, keywords: page.keywords.join(', ') });
    return graph;
  }
  const crumbs = [{ name: NAME, item: SITE }, ...page.crumbs.map(([label, p]) => ({ name: label, item: p ? SITE + p : url }))];
  const web = { '@type': page.kind === 'TechArticle' ? 'TechArticle' : page.kind, '@id': url + '#page', url, name: page.title, headline: page.h1, description: page.description, isPartOf: { '@id': ID.site }, about: { '@id': ID.app }, image: img, inLanguage: 'en', dateModified: LASTMOD, keywords: page.keywords.join(', '), breadcrumb: { '@id': url + '#breadcrumb' } };
  if (page.kind === 'FAQPage') {
    web.mainEntity = page.blocks.filter(b => b.t === 'faq').flatMap(b => b.items).map(({ q, a }) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: plain(a) } }));
  }
  graph.push(web, { '@type': 'BreadcrumbList', '@id': url + '#breadcrumb', itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: c.item })) });
  if (page.howto) {
    graph.push({ '@type': 'HowTo', '@id': url + '#howto', name: `Install and run ${NAME}`, description: page.lead, tool: [{ '@type': 'HowToTool', name: `Node.js ${data.node} or newer` }], step: page.steps.map(([name, how], i) => ({ '@type': 'HowToStep', position: i + 1, name, text: how })) });
  }
  return graph;
}

function head(page) {
  const rel = relOf(page);
  const url = SITE + page.path;
  const img = imageOf(page);
  const imgUrl = ABSOLUTE_IMAGES ? SITE + img.src : rel + img.src;
  const ld = JSON.stringify({ '@context': 'https://schema.org', '@graph': structuredData(page) }).replace(/</g, '\\u003c');
  return [
    `<title>${text(page.title)}</title>`,
    `<meta name="description" content="${attr(page.description)}">`,
    `<meta name="keywords" content="${attr(page.keywords.join(', '))}">`,
    `<meta name="robots" content="index, follow, max-image-preview:large">`,
    `<link rel="canonical" href="${attr(url)}">`,
    `<link rel="alternate" type="text/markdown" href="${rel}${page.path}index.md" title="${attr(page.title)} (Markdown)">`,
    `<link rel="describedby" type="text/markdown" href="${rel}llms.txt">`,
    `<meta property="og:type" content="${page.kind === 'landing' ? 'website' : 'article'}">`,
    `<meta property="og:site_name" content="${NAME}">`,
    `<meta property="og:locale" content="en_US">`,
    `<meta property="og:title" content="${attr(page.title)}">`,
    `<meta property="og:description" content="${attr(page.description)}">`,
    `<meta property="og:url" content="${attr(url)}">`,
    ...(page.kind === 'landing' ? [] : page.keywords.map(k => `<meta property="article:tag" content="${attr(k)}">`)),
    ...(page.related || []).map(n => byName[n]).filter(Boolean).map(r => `<meta property="og:see_also" content="${attr(SITE + r.path)}">`),
    `<meta property="og:image" content="${attr(imgUrl)}">`,
    `<meta property="og:image:type" content="image/png">`,
    `<meta property="og:image:width" content="${img.w}">`,
    `<meta property="og:image:height" content="${img.h}">`,
    `<meta property="og:image:alt" content="${attr(img.alt)}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${attr(page.title)}">`,
    `<meta name="twitter:description" content="${attr(page.description)}">`,
    `<meta name="twitter:image" content="${attr(imgUrl)}">`,
    `<meta name="twitter:image:alt" content="${attr(img.alt)}">`,
    `<link rel="icon" type="image/png" sizes="192x192" href="${rel}demo/icons/icon-192.png">`,
    `<link rel="apple-touch-icon" href="${rel}demo/icons/apple-touch-icon.png">`,
    `<script type="application/ld+json">${ld}</script>`,
  ].join('\n');
}

// what a content page is drawn from, in the browser as at build time
function viewOf(page) {
  const c = page.country ? flags[page.country] : null;
  return {
    root: relOf(page),
    page: { name: page.name, h1: page.h1, lead: page.lead, blocks: page.blocks, crumbs: page.crumbs, country: page.country || null, countryName: c ? c.name : null, flag: c ? c.flag : null },
    related: (page.related || []).map(n => byName[n]).filter(Boolean).map(r => ({ href: r.path, ...linkOf(r) })),
  };
}

// ---- write every page ----
const report = [];
for (const page of pages) {
  const rel = relOf(page);
  const landing = page.kind === 'landing';
  // the shell's own relative addresses (the built CSS and JS, the theme boot script) from this page's depth
  let html = (landing ? shells.landing : shells.doc).replace(/(\s(?:src|href)=")\.\//g, `$1${rel}`).replace(/src="theme-boot\.js"/, `src="${rel}theme-boot.js"`);
  html = html.replace('<!--head-->', () => head(page));
  const view = landing ? null : viewOf(page);
  const body = landing ? render() : renderDoc(view);
  if (body.length < 2000) fail(`the prerendered ${page.path || 'landing'} page is empty`);
  html = html.replace('<!--prerender-->', () => body);
  if (!landing) html = html.replace('<!--page-data-->', () => `<script type="application/json" id="page-data">${JSON.stringify(view).replace(/</g, '\\u003c')}</script>`);
  const dir = path.join(out, page.path);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  fs.writeFileSync(path.join(dir, 'index.md'), pageToMarkdown(page, SITE));
  report.push([page.path || '/', page.title, wordCount(page)]);
}

// ---- for search engines and assistants ----
fs.writeFileSync(path.join(out, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(p => `  <url><loc>${SITE}${p.path}</loc><lastmod>${LASTMOD}</lastmod></url>`).join('\n')}
</urlset>
`);

// The owner wants the site found, so search engines and AI assistants are let in by name as well as by the catch-all.
// Tokens from each operator's own documentation, read 2026-11-17:
//   OpenAI      https://developers.openai.com/api/docs/bots                       GPTBot, OAI-SearchBot, ChatGPT-User
//   Anthropic   https://support.claude.com/en/articles/8896518                    ClaudeBot, Claude-SearchBot, Claude-User
//   Perplexity  https://docs.perplexity.ai/guides/bots                            PerplexityBot, Perplexity-User
//   Google      https://developers.google.com/search/docs/crawling-indexing/google-common-crawlers   Googlebot, Google-Extended
//   Apple       https://support.apple.com/en-us/119829                            Applebot, Applebot-Extended
//   Common Crawl https://commoncrawl.org/ccbot                                    CCBot
//   Microsoft   Bingbot (Bing and Copilot): not re-read, its help page would not load here.
// The app itself (server.mjs, a private instance) serves its own robots.txt that disallows everything; this file is
// only the public site.
const BOTS = ['Googlebot', 'Google-Extended', 'Bingbot', 'GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-SearchBot', 'Claude-User', 'PerplexityBot', 'Perplexity-User', 'Applebot', 'Applebot-Extended', 'CCBot'];
fs.writeFileSync(path.join(out, 'robots.txt'), `# Home Front's public site: everything here may be crawled, indexed, quoted and used to answer questions.
# Search engines and AI assistants are named below as well, so a rule elsewhere can't shut them out by accident.
# Tokens from each operator's documentation, read 2026-11-17:
#   OpenAI https://developers.openai.com/api/docs/bots
#   Anthropic https://support.claude.com/en/articles/8896518
#   Perplexity https://docs.perplexity.ai/guides/bots
#   Google https://developers.google.com/search/docs/crawling-indexing/google-common-crawlers
#   Apple https://support.apple.com/en-us/119829
#   Common Crawl https://commoncrawl.org/ccbot
# A summary for language models: ${SITE}llms.txt (everything in 1 file: ${SITE}llms-full.txt)

User-agent: *
Allow: /

${BOTS.map(b => `User-agent: ${b}`).join('\n')}
Allow: /

Sitemap: ${SITE}sitemap.xml
`);

// llms.txt (https://llmstxt.org): the name, a summary, then lists of links with a line each, to the Markdown copies.
const RAW = data.repo.replace('https://github.com/', 'https://raw.githubusercontent.com/') + '/main/';
const md = p => `${SITE}${p.path}index.md`;
const item = (label, url, line) => `- [${label}](${url}): ${line}`;
const pageList = names => names.map(n => byName[n]).map(p => item(linkOf(p).label, md(p), p.description)).join('\n');
const DOCS = [
  ['README', 'README.md', 'What it is, who it is for, features, countries, providers, configuration, privacy and development.'],
  ['Self-hosting guide', 'docs/SELF_HOSTING.md', 'Every way to run it: launchd, systemd, Docker, HTTPS, backups, updating, troubleshooting.'],
  ['FAQ (long form)', 'docs/FAQ.md', 'The idea, using it, models and cost, offline and sync, data and privacy.'],
  ['API', 'docs/API.md', 'The token-authenticated HTTP API and the command-line tool, with an iOS Shortcuts recipe.'],
  ['Architecture', 'docs/ARCHITECTURE.md', 'The map build, the replay engine, the judge, the server and storage.'],
  ['Writing a country', 'docs/SCENARIOS.md', 'The scenario file format for adding a country.'],
  ['Security policy', 'SECURITY.md', 'The threat model and how to report a problem privately.'],
  ['Contributing', 'CONTRIBUTING.md', 'The layout, the conventions and how to add a battle type, a decoration or a persona.'],
];
const summary = `${DEFINITION} You tell it what happened today in a sentence, by voice or by typing. It files a dated entry, judges whether it went well or badly and how much it mattered, and the front for that part of your life advances or gives ground. ${data.countries.length} countries with 7 fronts each, any AI provider or none, ${data.license} licence.`;
fs.writeFileSync(path.join(out, 'llms.txt'), `# ${NAME}

> ${summary}

${keyFacts(data).map(f => '- ' + f).join('\n')}

Every page of this site has a Markdown copy at the same address followed by \`index.md\`. The site is built from the same sources as the app (the scenarios, the engine and the provider list), so the facts here match the code. The app itself runs on the owner's own machine: there is no hosted service and no account.

## Pages

${pageList(['how-it-works', 'ai-providers', 'self-hosting', 'faq', 'compare'])}

## Countries

${pageList(['countries', ...data.countries.map(c => `country-${c.id}`)])}

## Repository and docs

- [Source code on GitHub](${data.repo}): ${data.license} licence, Node ${data.node} or newer, no runtime dependencies.
${DOCS.map(([label, f, line]) => item(label, RAW + f, line)).join('\n')}
- [SKILL.md](${SITE}skill.md): a self-contained setup guide for coding agents (install, service, HTTPS, backups, updates). Also at ${SITE}SKILL.md.

## Optional

- [llms-full.txt](${SITE}llms-full.txt): every page of this site in 1 Markdown file.
- [Demo](${SITE}demo/?demo=1): the app in the browser with the offline judge and no sign-up. Data stays in that browser.
- [Changelog](${RAW}CHANGELOG.md): what changed in each version.
`);

// llms-full.txt: the whole site as 1 Markdown document, built from the same blocks as the pages.
const order = ['landing', 'how-it-works', 'ai-providers', 'self-hosting', 'compare', 'faq', 'countries', ...data.countries.map(c => `country-${c.id}`)];
const full = [
  `# ${NAME}`, '', `> ${summary}`, '',
  `This file is every page of ${SITE} in 1 document, generated from the same sources as the site and the app. Source code: ${data.repo}. Version ${data.version}, built ${LASTMOD}.`, '',
  ...order.map(n => byName[n]).map(p => [`## ${p.kind === 'landing' ? 'Overview' : p.h1}`, '', `Page: ${SITE}${p.path}`, '', p.lead, '', blocksToMarkdown(p.blocks.filter((b, i) => !(i === 0 && b.t === 'p' && p.kind !== 'landing' && b.text.startsWith(DEFINITION))), SITE, 1), ''].join('\n')),
  '## Licence and credits', '',
  `${NAME} is open source under the ${data.license} licence. Unit silhouettes come from Game-icons.net (CC BY 3.0), interface icons from Lucide (ISC), provider marks from Simple Icons (CC0), borders from Natural Earth (public domain) and the flags from Wikimedia Commons (public domain). It is an original project inspired by grand-strategy games. It is not affiliated with or endorsed by Paradox Interactive, and it uses none of their code, art or data.`, '',
].join('\n');
fs.writeFileSync(path.join(out, 'llms-full.txt'), full);

// the setup skill, so `curl <site>/skill.md` works as well as the raw GitHub address
for (const n of ['SKILL.md', 'skill.md']) fs.copyFileSync(path.join(root, 'SKILL.md'), path.join(out, n));

// ---- everything else is copied ----
function copy(from, to) {
  const st = fs.statSync(from);
  if (st.isDirectory()) { for (const n of fs.readdirSync(from).sort()) if (!n.startsWith('_') && !n.startsWith('.')) copy(path.join(from, n), path.join(to, n)); return; }
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
}
for (const p of STATIC) copy(path.join(root, 'site', p), path.join(out, p));
// site/root/: files that must sit at the site's root as they are, such as a search engine's verification file
if (fs.existsSync(path.join(root, 'site', 'root'))) copy(path.join(root, 'site', 'root'), out);
for (const [p, to] of APP) {
  const from = path.join(root, p);
  if (!fs.existsSync(from)) fail(`missing ${p}`);
  copy(from, path.join(out, 'demo', to));
}
for (const c of data.countries) if (!fs.existsSync(path.join(out, 'img', 'countries', `${c.id}.png`))) console.warn(`build-site: no picture for ${c.name} (site/img/countries/${c.id}.png); run site/_dev/shots.cjs <url> pages`);
fs.writeFileSync(path.join(out, '.nojekyll'), '');

// ---- what was written, and what a first visit to the landing page downloads ----
const written = [];
(function walk(dir) { for (const n of fs.readdirSync(dir).sort()) { const f = path.join(dir, n); const st = fs.statSync(f); if (st.isDirectory()) walk(f); else written.push([path.relative(out, f).split(path.sep).join('/'), st.size]); } })(out);
const kb = n => (n / 1024).toFixed(1).padStart(8) + ' kB';
const gz = f => zlib.gzipSync(fs.readFileSync(path.join(out, f))).length;
for (const [f, n] of written) if (!f.startsWith('demo/')) console.log(`${kb(n)}  ${f}`);
const sum = pred => written.filter(([f]) => pred(f)).reduce((a, [, n]) => a + n, 0);
// what the landing page itself asks for: its HTML, then the stylesheet and scripts its HTML names (fonts, images and maps aside)
const landingHtml = fs.readFileSync(path.join(out, 'index.html'), 'utf8');
const named = [...landingHtml.matchAll(/(?:src|href)="\.\/(assets\/[^"]+\.(?:css|js))"/g)].map(m => m[1]);
const first = ['index.html', ...new Set(named)];
console.log(`\n_site/  ${written.length} files, ${kb(sum(() => true)).trim()}`);
console.log(`landing page, first load (HTML + the CSS and JS it names): ${kb(first.reduce((a, f) => a + fs.statSync(path.join(out, f)).size, 0)).trim()}, ${kb(first.reduce((a, f) => a + gz(f), 0)).trim()} gzipped  [${first.join(', ')}]`);
console.log(`images: ${kb(sum(f => f.startsWith('img/'))).trim()}   demo app: ${kb(sum(f => f.startsWith('demo/'))).trim()}   llms.txt ${kb(fs.statSync(path.join(out, 'llms.txt')).size).trim()}   llms-full.txt ${kb(full.length).trim()}`);
console.log('\npages:');
for (const [p, title, words] of report) console.log(`  ${String(words).padStart(5)} words  ${p.padEnd(22)} ${title}`);

if (process.argv.includes('--serve')) {
  const port = Number(process.env.PORT || 8080);
  const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8', '.md': 'text/markdown; charset=utf-8', '.xml': 'application/xml' };
  http.createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html';
    const file = path.join(out, p);
    if (!file.startsWith(out + path.sep) || !fs.existsSync(file)) { res.writeHead(404); res.end('Not found'); return; }
    if (fs.statSync(file).isDirectory()) { res.writeHead(302, { location: p + '/' }); res.end(); return; } // as GitHub Pages does
    res.writeHead(200, { 'content-type': types[path.extname(file)] || 'application/octet-stream', 'cache-control': 'no-cache' }); fs.createReadStream(file).pipe(res);
  }).listen(port, () => console.log(`\npreview: http://localhost:${port}/   demo: http://localhost:${port}/demo/?demo=1`));
}
