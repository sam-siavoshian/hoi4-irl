// Rasterises the countries' flags into icons/flags/. The artwork is Wikimedia Commons' (sources, authors and licences
// are in icons/flags/README.md and NOTICE.md); the vector files are not kept in this repository.
//   node tools/build-flags.cjs <dir>     <dir>/<id>/flag.svg (or flag.png), one folder per scenario id, downloaded by hand
// A source is the Commons file itself, or where Commons refuses the original, its own 1280 px PNG rendering of it.
// Each is drawn by headless Chromium (Playwright) as an <img>, where a browser runs no script and loads nothing else,
// at exactly the size it is saved: <id>.png is 320 px wide, <id>-128.png and <id>-64.png the smaller ones (true colour,
// re-saved by Pillow with zlib's best effort when python3 has it; the pixels do not change).
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const WIDTHS = [320, 128, 64];
const src = process.argv[2] && path.resolve(process.argv[2]);
if (!src || !fs.existsSync(src)) { console.error('usage: node tools/build-flags.cjs <dir with <id>/flag.svg>'); process.exit(1); }
const out = path.join(__dirname, '..', 'icons', 'flags');
fs.mkdirSync(out, { recursive: true });

function opaque(file) {
  const py = 'import sys, io\nfrom PIL import Image\nim = Image.open(sys.argv[1]).convert("RGBA")\na = im.getchannel("A")\nw, h = im.size\nb = h\nwhile b > 1 and min(a.crop((0, b - 1, w, b)).getdata()) < 255: b -= 1\nout = io.BytesIO(); im.crop((0, 0, w, b)).convert("RGB").save(out, "PNG"); sys.stdout.buffer.write(out.getvalue())\n';
  const r = require('node:child_process').spawnSync('python3', ['-I', '-c', py, file], { maxBuffer: 64 << 20 });
  if (r.status !== 0) throw new Error(`${file}: Pillow could not read it`);
  return r.stdout;
}

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ deviceScaleFactor: 1, javaScriptEnabled: false, offline: true });
  for (const id of fs.readdirSync(src).sort()) {
    const file = ['flag.svg', 'flag.png'].map(n => path.join(src, id, n)).find(f => fs.existsSync(f)); if (!file) continue;
    const bytes = fs.readFileSync(file), png = file.endsWith('.png');
    const ok = png ? bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) : /<svg[\s>]/.test(bytes.toString('utf8', 0, 4096));
    if (!ok) { console.error(`${id}: not ${png ? 'a PNG' : 'an SVG'}`); process.exitCode = 1; continue; }
    // A Commons PNG rendering ends in a half-covered row of pixels (732 rows for 731.4), which would tint the last row
    // of every size: Pillow cuts it off first (opaque rows only, nothing else changes).
    const clean = png ? opaque(file) : bytes;
    const uri = `data:image/${png ? 'png' : 'svg+xml'};base64,` + clean.toString('base64');
    const p = await ctx.newPage();
    await p.setContent(`<body style="margin:0;background:#fff"><img id="f" src="${uri}">`);
    await p.waitForFunction(() => { const i = document.getElementById('f'); return i.complete && i.naturalWidth > 0; });
    const [w, h] = await p.evaluate(() => { const i = document.getElementById('f'); return [i.naturalWidth, i.naturalHeight]; });
    for (const width of WIDTHS) {
      const height = Math.round(width * h / w);
      await p.setViewportSize({ width, height });
      await p.setContent(`<body style="margin:0;background:#fff"><img id="f" src="${uri}" style="display:block;width:${width}px;height:${height}px">`);
      await p.waitForFunction(() => { const i = document.getElementById('f'); return i.complete && i.naturalWidth > 0; });
      const name = width === WIDTHS[0] ? `${id}.png` : `${id}-${width}.png`;
      await p.screenshot({ path: path.join(out, name), clip: { x: 0, y: 0, width, height } });
      console.log(`${name}  ${width}x${height}  (source ${w}x${h})`);
    }
    await p.close();
  }
  await browser.close();
  const py = 'import sys\nfrom PIL import Image\nfor f in sys.argv[1:]:\n    Image.open(f).convert("RGB").save(f, optimize=True)\n';
  const r = require('node:child_process').spawnSync('python3', ['-I', '-c', py, ...fs.readdirSync(out).filter(n => n.endsWith('.png')).map(n => path.join(out, n))], { stdio: 'inherit' });
  if (r.status !== 0) console.log('(Pillow not available: the PNGs are left as Chromium wrote them)');
})().catch(e => { console.error('FAILED', e.message); process.exit(1); });
