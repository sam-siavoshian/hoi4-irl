// Renders a scenario's built map to PNG so an author can check it by eye.
//   node tools/preview-map.cjs <id>   →  tests/shots/map-<id>.png (whole theatre) and map-<id>-home.png (home country)
// Home provinces are tinted by the front that reaches them first; each front's objective zone is tinted in the same
// colour; border provinces of each front are outlined; named cities are labelled. Needs Playwright's Chromium.
const fs = require('fs'); const path = require('path'); const { chromium } = require('playwright');
const id = process.argv[2]; if (!id) { console.error('usage: node tools/preview-map.cjs <scenario id>'); process.exit(1); }
const m = JSON.parse(fs.readFileSync(path.join(__dirname, `../data/maps/${id}.json`)));
const COL = ['#4aa3c7', '#d0604e', '#dc8f3f', '#c2aa3e', '#cf5d84', '#a195dc', '#3fc0ab', '#8fbf5a', '#b07a52'];
const d = g => g.map(poly => poly.map(r => { let s = ''; for (let i = 0; i < r.length; i += 2) s += (i ? 'L' : 'M') + r[i] + ',' + r[i + 1]; return s + 'Z'; }).join('')).join('');
const line = (p, close) => { let s = ''; for (let i = 0; i < p.length; i += 2) s += (i ? 'L' : 'M') + p[i] + ',' + p[i + 1]; return s + (close ? 'Z' : ''); };
const owner = new Map(), obj = new Map(), border = new Map();
m.fronts.forEach((f, i) => { for (const [pid, dist] of f.iranOrder) { const v = dist / f.dTehran; const c = owner.get(pid); if (!c || v < c.v) owner.set(pid, { i, v }); } for (const [pid] of f.enemyOrder) if (!obj.has(pid)) obj.set(pid, i); for (const pid of f.border) border.set(pid, i); });
let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${m.w} ${m.h}" width="${m.w}" height="${m.h}" style="background:#172633;font-family:sans-serif">`;
for (const p of m.provinces) {
  const home = p.t === m.home; let fill = m.countries[p.t].color, op = 0.55;
  if (home) { const o = owner.get(p.id); fill = o ? COL[o.i % COL.length] : '#888'; op = o ? 0.95 - o.v * 0.45 : 1; } else if (obj.has(p.id)) { fill = COL[obj.get(p.id) % COL.length]; op = 0.5; }
  svg += `<path d="${d(p.g)}" fill="${fill}" fill-opacity="${op}" stroke="${border.has(p.id) ? '#fff' : '#0008'}" stroke-width="${border.has(p.id) ? 2.5 : 1}"/>`;
}
for (const [, c] of Object.entries(m.countries)) svg += `<path d="${d(c.shape)}" fill="none" stroke="#000" stroke-width="3"/>`;
for (const l of m.lakes) svg += `<path d="${line(l.p, true)}" fill="#172633"/>`;
for (const r of m.rivers) svg += `<path d="${line(r.p)}" fill="none" stroke="#5aa8e0" stroke-width="2.5"/>`;
for (const r of m.railways) svg += `<path d="${line(r.p)}" fill="none" stroke="${r.stage ? '#bbb' : '#111'}" stroke-width="2.5" stroke-dasharray="7 4"/>`;
if (m.achaemenid.length) svg += `<path d="${line(m.achaemenid, true)}" fill="none" stroke="#f2cf6b" stroke-width="4" stroke-dasharray="14 9"/>`;
for (const p of m.provinces) if (p.city) { const big = p.vp >= 10, cap = p.id === m.capital; svg += `<circle cx="${p.city[0]}" cy="${p.city[1]}" r="${cap ? 8 : big ? 5 : 3}" fill="${cap ? '#f2cf6b' : '#fff'}" stroke="#000"/><text x="${p.city[0] + 7}" y="${p.city[1] - 5}" font-size="${cap ? 24 : big ? 18 : 12}" font-weight="${big ? 700 : 400}" fill="#fff" stroke="#000" stroke-width="3" paint-order="stroke">${p.n.replace(/&/g, '&amp;')}${p.f ? ' [' + p.f + ']' : ''}</text>`; }
for (const l of m.labels.countries) svg += `<text x="${l.c[0]}" y="${l.c[1]}" font-size="${l.sz * 2.2}" text-anchor="middle" fill="#000" fill-opacity=".55" letter-spacing="6">${l.n}</text>`;
for (const [k, c] of Object.entries(m.fleetAt)) svg += `<rect x="${c[0] - 14}" y="${c[1] - 10}" width="28" height="20" fill="${k.startsWith('enemy') ? '#a33' : '#28587a'}" stroke="#fff"/><text x="${c[0]}" y="${c[1] + 26}" font-size="13" text-anchor="middle" fill="#fff">${k}</text>`;
for (const s of m.seas) svg += `<text x="${s.c[0]}" y="${s.c[1]}" font-size="${20 * s.sz}" text-anchor="middle" font-style="italic" fill="#9cc8ea" fill-opacity=".8">${s.n}</text>`;
m.fronts.forEach((f, i) => { svg += `<rect x="20" y="${20 + i * 34}" width="26" height="26" fill="${COL[i % COL.length]}"/><text x="56" y="${40 + i * 34}" font-size="22" fill="#fff" stroke="#000" stroke-width="3" paint-order="stroke">${f.id} · ${f.name} · vs ${f.enemyName}${f.naval ? ' (naval)' : ''} · ${f.iranOrder.length} home / ${f.enemyOrder.length} objective provinces · ${f.dTehran} km to capital</text>`; });
svg += '</svg>';
(async () => {
  const out = path.join(__dirname, '../tests/shots'); fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: m.w, height: m.h }, deviceScaleFactor: 0.5 });
  await pg.setContent(`<body style="margin:0">${svg}</body>`); await pg.screenshot({ path: path.join(out, `map-${id}.png`) });
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const p of m.provinces) if (p.t === m.home) { x0 = Math.min(x0, p.c[0]); x1 = Math.max(x1, p.c[0]); y0 = Math.min(y0, p.c[1]); y1 = Math.max(y1, p.c[1]); }
  const pad = 160; const clip = { x: Math.max(0, x0 - pad), y: Math.max(0, y0 - pad), width: Math.min(m.w, x1 + pad) - Math.max(0, x0 - pad), height: Math.min(m.h, y1 + pad) - Math.max(0, y0 - pad) };
  const p2 = await b.newPage({ viewport: { width: m.w, height: m.h }, deviceScaleFactor: Math.min(1.5, 2000 / clip.width) }); await p2.setContent(`<body style="margin:0">${svg}</body>`); await p2.screenshot({ path: path.join(out, `map-${id}-home.png`), clip });
  await b.close(); console.log(`tests/shots/map-${id}.png, tests/shots/map-${id}-home.png`);
})();
