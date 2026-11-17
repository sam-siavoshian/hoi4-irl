// Renders the app icons: the product's own mark (Lucide's "map", as BrandMark in src/marks.jsx draws it) in the design
// system's light ink on its dark page. Home Front is about no one country, so the icon is none of their maps or flags.
// Run: node tools/build-icons.cjs (needs Playwright's Chromium)
const fs = require('fs'); const path = require('path'); const { chromium } = require('playwright');
const icons = fs.readFileSync(path.join(__dirname, '../js/icons.js'), 'utf8');
const map = /"map":"(.*?)(?<!\\)"/.exec(icons); if (!map) throw new Error('js/icons.js has no "map" icon: run node tools/build-icons-js.mjs');
const glyph = JSON.parse(`"${map[1]}"`).replace(/stroke="currentColor"/g, 'stroke="#f4f4f6"').replace(/stroke-width="2"/g, 'stroke-width="1.75"');
// the page and ink of the kit's dark theme (vendor/design-system), written out because nothing here loads the kit;
// the glyph sits in the middle 56%, inside the safe zone a maskable icon keeps
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
<rect width="512" height="512" fill="#1a1a1d"/>
<g transform="translate(112.64 112.64) scale(11.94)">${glyph}</g></svg>`;
(async () => {
  const b = await chromium.launch();
  for (const [name, size] of [['icon-512', 512], ['icon-192', 192], ['apple-touch-icon', 180]]) {
    const p = await b.newPage({ viewport: { width: size, height: size } });
    await p.setContent(`<body style="margin:0">${svg.replace('width="512" height="512"', `width="${size}" height="${size}"`)}</body>`);
    await p.screenshot({ path: path.join(__dirname, `../icons/${name}.png`) }); await p.close();
  }
  await b.close(); console.log('icons written');
})();
