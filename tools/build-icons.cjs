// Renders the app icons from the map data. Run: node tools/build-icons.cjs (needs Playwright's Chromium)
const fs = require('fs'); const path = require('path'); const { chromium } = require('playwright');
const m = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/maps/iran.json')));
const d = shape => shape.map(poly => poly.map(r => { let s = ''; for (let i = 0; i < r.length; i += 2) s += (i ? 'L' : 'M') + r[i] + ',' + r[i + 1]; return s + 'Z'; }).join('')).join('');
const others = Object.entries(m.countries).filter(([t]) => t !== 'IRN').map(([, c]) => `<path d="${d(c.shape)}" fill="${c.color}" opacity=".55" stroke="#0b0f12" stroke-width="5"/>`).join('');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
<defs><radialGradient id="g" cx="50%" cy="40%" r="75%"><stop offset="0" stop-color="#24405a"/><stop offset="1" stop-color="#0d1820"/></radialGradient><clipPath id="c"><rect width="512" height="512"/></clipPath></defs>
<rect width="512" height="512" fill="url(#g)"/>
<g clip-path="url(#c)"><g transform="translate(256 262) scale(0.265) translate(-2290 -1345)">${others}
<path d="${d(m.countries.IRN.shape)}" fill="#e85b47" stroke="#e85b47" stroke-width="34" stroke-linejoin="round"/>
<path d="${d(m.countries.IRN.shape)}" fill="#3f8f7a" stroke="#8ef0d8" stroke-width="12" stroke-linejoin="round"/></g></g>
<g transform="translate(256 262)"><rect x="-74" y="-48" width="148" height="96" rx="10" fill="#2f6e60" stroke="#0b1614" stroke-width="7"/><rect x="-52" y="-30" width="104" height="60" fill="none" stroke="#f6f3e8" stroke-width="7"/><path d="M-52-30L52 30M52-30L-52 30" stroke="#f6f3e8" stroke-width="7"/></g>
<rect x="10" y="10" width="492" height="492" fill="none" stroke="#c8a85a" stroke-width="10" opacity=".0"/></svg>`;
(async () => {
  const b = await chromium.launch();
  for (const [name, size] of [['icon-512', 512], ['icon-192', 192], ['apple-touch-icon', 180]]) {
    const p = await b.newPage({ viewport: { width: size, height: size } });
    await p.setContent(`<body style="margin:0">${svg.replace('width="512" height="512"', `width="${size}" height="${size}"`)}</body>`);
    await p.screenshot({ path: path.join(__dirname, `../icons/${name}.png`) }); await p.close();
  }
  await b.close(); console.log('icons written');
})();
