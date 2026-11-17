// Records the README's demo loop from the real app (the static demo in _site/demo/), then makes docs/img/demo.gif,
// demo.mp4 and demo.webm with ffmpeg. Not deployed.
//   PORT=8153 node tools/build-site.mjs --serve
//   node site/_dev/demo-gif.cjs http://localhost:8153/
// Two takes, joined: a campaign in Mexico where an entry is typed and sent and its front moves, then the country
// picker browsing France, Siam and Mexico, each map loading behind it.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { chromium } = require('playwright');
const base = (process.argv[2] || 'http://localhost:8153/').replace(/\/*$/, '/');
const OUT = path.join(__dirname, '..', '..', 'docs', 'img');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'homefront-gif-'));
const SIZE = { width: 1200, height: 720 };
const T = id => `[data-testid=${id}]`;
const QUIET = '[data-slot=toast-viewport], [data-testid=demo-note] { display: none !important; }';
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function take(browser, name, setup, act) {
  const ctx = await browser.newContext({ viewport: SIZE, deviceScaleFactor: 1, recordVideo: { dir: path.join(tmp, name), size: SIZE } });
  const t0 = Date.now();
  const p = await ctx.newPage();
  p.on('pageerror', e => console.log('PAGE ERROR', e.message));
  await p.addInitScript(setup.init, setup.arg);
  await p.goto(base + setup.path);
  const marks = {};
  const mark = k => { marks[k] = (Date.now() - t0) / 1000; };
  await act(p, mark);
  await ctx.close();
  const video = fs.readdirSync(path.join(tmp, name)).find(f => f.endsWith('.webm'));
  return { file: path.join(tmp, name, video), ...marks };
}

(async () => {
  const browser = await chromium.launch();
  const init = ([scenario]) => {
    localStorage.setItem('lanes:appearance', 'dark');
    sessionStorage.setItem('homefront.demo-note', '1');
    if (scenario && !localStorage.getItem('homefront.v1')) localStorage.setItem('homefront.v1', JSON.stringify({ v: 3, scenario, reports: [], labels: {}, notes: {}, off: [], campaigns: {} }));
  };

  // 1. the picker: a first run, nothing chosen yet
  const picker = await take(browser, 'picker', { init, arg: [null], path: 'demo/' }, async (p, mark) => {
    await p.waitForSelector(T('picker'));
    await p.addStyleTag({ content: QUIET });
    await p.evaluate(() => document.fonts.ready);
    await p.waitForFunction(() => window.__homefront?.view?.map && !window.__homefront.ui.picker.busy);
    await sleep(500);
    mark('from');
    for (const id of ['france', 'siam', 'mexico']) {
      await p.click(`${T('country')}[data-id=${id}]`);
      await p.waitForFunction(i => window.__homefront.view.map.id === i && !window.__homefront.ui.picker.busy && document.querySelector('[data-testid=briefing]')?.dataset.id === i, id);
      await sleep(750);
    }
    mark('to');
  });

  // 2. a campaign in Mexico: say it, send it, the front moves
  const report = await take(browser, 'report', { init, arg: ['mexico'], path: 'demo/?demo=1' }, async (p, mark) => {
    await p.waitForFunction(() => window.__homefront?.st && window.__homefront.data.reports.length && window.__homefront.map.id === 'mexico');
    await p.addStyleTag({ content: QUIET });
    await p.evaluate(() => document.fonts.ready);
    await sleep(1800);
    mark('from');
    await p.click(T('nav-report'));
    await p.waitForSelector('#report-text');
    await sleep(300);
    await p.type('#report-text', 'Shipped the new onboarding flow at work. Skipped the gym again.', { delay: 12 });
    await sleep(350);
    await p.click(T('send'));
    await sleep(3300); // the sheet closes, the map turns to the fronts that moved and the battles play
    mark('to');
  });
  await browser.close();

  // join the two takes, then the three files
  const cut = (t, i) => `[${i}:v]trim=start=${t.from.toFixed(2)}:end=${t.to.toFixed(2)},setpts=PTS-STARTPTS[v${i}]`;
  const joined = path.join(tmp, 'joined.mp4');
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', report.file, '-i', picker.file, '-filter_complex', `${cut(report, 0)};${cut(picker, 1)};[v0][v1]concat=n=2:v=1[v]`, '-map', '[v]', '-r', '30', '-c:v', 'libx264', '-crf', '18', '-pix_fmt', 'yuv420p', joined]);
  const mp4 = path.join(OUT, 'demo.mp4'), webm = path.join(OUT, 'demo.webm'), gif = path.join(OUT, 'demo.gif');
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', joined, '-vf', 'scale=960:-2:flags=lanczos', '-c:v', 'libx264', '-crf', '26', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', mp4]);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', joined, '-vf', 'scale=960:-2:flags=lanczos', '-c:v', 'libvpx-vp9', '-crf', '38', '-b:v', '0', '-an', webm]);
  const palette = path.join(tmp, 'palette.png');
  const vf = 'fps=10,scale=760:-1:flags=lanczos';
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', joined, '-vf', `${vf},palettegen=max_colors=128:stats_mode=diff`, palette]);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', joined, '-i', palette, '-lavfi', `${vf}[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle`, '-loop', '0', gif]);
  const dur = (report.to - report.from) + (picker.to - picker.from);
  for (const f of [gif, mp4, webm]) console.log(`wrote ${path.relative(process.cwd(), f)}  ${(fs.statSync(f).size / 1024).toFixed(0)} kB`);
  console.log(`${dur.toFixed(1)} s: the entry ${(report.to - report.from).toFixed(1)} s, then the picker ${(picker.to - picker.from).toFixed(1)} s`);
  fs.rmSync(tmp, { recursive: true, force: true });
})().catch(e => { console.error('FAILED', e.message); process.exit(1); });
