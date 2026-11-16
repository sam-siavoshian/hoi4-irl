// Builds data/maps/<id>.json for every scenario in tools/scenarios/ from Natural Earth (world-atlas) + hand-authored seeds.
// Run: npm run build:map            (all scenarios)
//      node tools/build-map.mjs france   (one)
// See docs/SCENARIOS.md for the scenario file format.
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { feature, merge } from 'topojson-client';
import { presimplify, simplify, quantile } from 'topojson-simplify';
import { Delaunay } from 'd3-delaunay';
import pc from 'polygon-clipping';

const require = createRequire(import.meta.url);
const topoRaw = JSON.parse(fs.readFileSync(require.resolve('world-atlas/countries-10m.json'), 'utf8'));

async function build(S) {
const HOME = S.HOME; const problems = [];

// ---------- projection (Mercator → map units) ----------
const { lon0, lon1, lat0, lat1 } = S.EXTENT;
const W = 4000; const span = lon1 - lon0;
const K = W / (lon1 - lon0);
const merc = lat => Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360)) * 180 / Math.PI;
const yTop = merc(lat1);
const H = Math.round((yTop - merc(lat0)) * K);
const proj = ([lon, lat]) => [(lon - lon0) * K, (yTop - merc(lat)) * K];
const r1 = v => Math.round(v * 10) / 10;

// ---------- seeded rng ----------
function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function rngFrom(seed) { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// ---------- simplify + extract ----------
const inBox = g => {
  const polys = g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
  for (const p of polys) for (const [x, y] of p[0]) if (x > lon0 - 1 && x < lon1 + 1 && y > lat0 - 1 && y < lat1 + 1) return true;
  return false;
};
let topo = presimplify(topoRaw);
topo = simplify(topo, quantile(topo, Math.max(0.04, Math.min(0.3, 0.3 * span / 52)))); // smaller theatres keep more coastline detail
const geoms = topo.objects.countries.geometries;
const byName = {};
for (const g of geoms) byName[g.properties.name] = g;

const BOX = [[[lon0, lat0], [lon1, lat0], [lon1, lat1], [lon0, lat1], [lon0, lat0]]];
const clipBox = mp => pc.intersection(mp, [BOX]);

// modern polygons (lon/lat) for sub lookup
const modern = {};
for (const g of geoms) {
  const f = feature(topo, g);
  if (!inBox(f.geometry)) continue;
  modern[g.properties.name] = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
}
function pip(pt, ring) {
  let inside = false; const [x, y] = pt;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
function inMP(pt, mp) { for (const poly of mp) { if (pip(pt, poly[0])) { let hole = false; for (let i = 1; i < poly.length; i++) if (pip(pt, poly[i])) hole = true; if (!hole) return true; } } return false; }
const subOf = pt => { for (const n in modern) if (inMP(pt, modern[n])) return n; return null; };

// densify ring so shared borders get many identical vertices (canonical direction)
function densify(ring, maxLen) {
  const out = [];
  for (let i = 0; i < ring.length - 1; i++) {
    let a = ring[i], b = ring[i + 1];
    const flip = a[0] > b[0] || (a[0] === b[0] && a[1] > b[1]);
    const [p, q] = flip ? [b, a] : [a, b];
    const n = Math.max(1, Math.ceil(Math.hypot(q[0] - p[0], q[1] - p[1]) / maxLen));
    const seg = [];
    for (let k = 0; k < n; k++) seg.push([r1(p[0] + ((q[0] - p[0]) * k) / n), r1(p[1] + ((q[1] - p[1]) * k) / n)]);
    seg.push([r1(q[0]), r1(q[1])]);
    if (flip) seg.reverse();
    seg.pop();
    out.push(...seg);
  }
  out.push(out[0].slice());
  return out;
}

const countries = {};
for (const [tag, c] of Object.entries(S.COUNTRIES)) {
  const gs = c.from.map(n => byName[n]).filter(Boolean);
  if (!gs.length) continue;
  const m = merge(topo, gs);
  let ll = clipBox(m.coordinates);
  if (!ll.length) continue;
  // drop tiny islands
  const area = r => { let s = 0; for (let i = 0; i < r.length - 1; i++) s += r[i][0] * r[i + 1][1] - r[i + 1][0] * r[i][1]; return Math.abs(s / 2); };
  const minIsland = (c.minIsland ?? 0.012) * (span / 52) ** 2;
  ll = ll.filter(p => area(p[0]) > minIsland);
  const xy = ll.map(poly => poly.map(ring => densify(ring.map(proj), 7)));
  countries[tag] = { tag, ...c, ll, xy };
}

// ---------- seeds ----------
const seeds = []; // {name, lon, lat, tag, state, vp, flags, named}
for (const [state, list] of Object.entries(S.HOME_STATES)) for (const [name, lon, lat, vp = 1, flags = ''] of list) seeds.push({ name, lon, lat, tag: HOME, state, vp, flags, named: true });
for (const [tag, regions] of Object.entries(S.FOREIGN)) for (const [state, list] of Object.entries(regions)) for (const [name, lon, lat, vp = 1, flags = ''] of list) seeds.push({ name, lon, lat, tag, state, vp, flags, named: true });

// snap named seeds into their country polygon
for (const s of seeds) {
  const c = countries[s.tag];
  if (!c) { s.drop = true; problems.push(`city ${s.name}: country ${s.tag} has no land in the extent`); continue; }
  if (inMP([s.lon, s.lat], c.ll)) continue;
  let best = null, bd = 1e9;
  for (const poly of c.ll) for (const v of poly[0]) { const d = Math.hypot(v[0] - s.lon, v[1] - s.lat); if (d < bd) { bd = d; best = v; } }
  if (bd > 1.2 * Math.max(0.4, span / 52)) { problems.push(`city ${s.name} (${s.tag}) is ${bd.toFixed(2)}° outside its country — wrong coordinates or wrong country?`); s.drop = true; continue; }
  // step inward along several directions
  let placed = false;
  for (let rad = 0.04; rad < 0.5 && !placed; rad += 0.04) for (let a = 0; a < 16 && !placed; a++) {
    const p = [best[0] + Math.cos(a * Math.PI / 8) * rad, best[1] + Math.sin(a * Math.PI / 8) * rad];
    if (inMP(p, c.ll)) { s.lon = p[0]; s.lat = p[1]; placed = true; }
  }
  if (!placed) { problems.push(`city ${s.name}: could not be placed inside ${s.tag}`); s.drop = true; }
}
let all = seeds.filter(s => !s.drop);

// filler seeds on jittered hex grid
const rnd = rngFrom(1936);
for (const [tag, c] of Object.entries(countries)) {
  const sp = c.spacing;
  const mine = all.filter(s => s.tag === tag);
  let row = 0;
  for (let lat = lat0 + 0.2; lat < lat1; lat += sp * 0.82, row++) {
    const cosl = Math.cos((lat * Math.PI) / 180);
    const dx = sp / Math.max(0.55, cosl) * 0.83;
    for (let lon = lon0 + (row % 2 ? dx / 2 : 0); lon < lon1; lon += dx) {
      const p = [lon + (rnd() - 0.5) * dx * 0.5, lat + (rnd() - 0.5) * sp * 0.45];
      if (p[0] <= lon0 + 0.05 || p[0] >= lon1 - 0.05 || p[1] <= lat0 + 0.05 || p[1] >= lat1 - 0.05) continue;
      if (!inMP(p, c.ll)) continue;
      let ok = true;
      for (const s of mine) { const d = Math.hypot((s.lon - p[0]) * cosl, s.lat - p[1]); if (d < sp * 0.62) { ok = false; break; } }
      if (!ok) continue;
      const s = { name: null, lon: p[0], lat: p[1], tag, vp: 0, flags: '', named: false };
      mine.push(s); all.push(s);
    }
  }
}
// name fillers after nearest named seed in same country
const DIRS = ['East', 'North-East', 'North', 'North-West', 'West', 'South-West', 'South', 'South-East'];
const usedNames = new Set(all.filter(s => s.named).map(s => s.name));
for (const s of all) {
  if (s.named) continue;
  let best = null, bd = 1e9;
  for (const t of all) if (t.named && t.tag === s.tag) { const d = Math.hypot((t.lon - s.lon) * 0.8, t.lat - s.lat); if (d < bd) { bd = d; best = t; } }
  if (!best) { s.state = countries[s.tag].name; s.name = countries[s.tag].name; continue; }
  s.state = best.state;
  const ang = Math.atan2(s.lat - best.lat, (s.lon - best.lon) * 0.8);
  const dir = DIRS[((Math.round(ang / (Math.PI / 4)) % 8) + 8) % 8];
  let nm = `${dir} of ${best.name}`; let k = 2;
  while (usedNames.has(nm)) nm = `${dir} of ${best.name} ${'II III IV V VI VII VIII IX X XI XII'.split(' ')[k++ - 2] || k}`;
  usedNames.add(nm); s.name = nm;
}

// ---------- voronoi per country with wiggly shared edges ----------
const edgeCache = new Map();
function wiggle(a, b) {
  const flip = a[0] > b[0] || (a[0] === b[0] && a[1] > b[1]);
  const [p, q] = flip ? [b, a] : [a, b];
  const key = `${r1(p[0])},${r1(p[1])}|${r1(q[0])},${r1(q[1])}`;
  let pts = edgeCache.get(key);
  if (!pts) {
    const rr = rngFrom(hashStr(key));
    const rec = (u, v, depth) => {
      const len = Math.hypot(v[0] - u[0], v[1] - u[1]);
      if (depth === 0 || len < 9) return [u];
      const nx = -(v[1] - u[1]) / len, ny = (v[0] - u[0]) / len;
      const off = (rr() - 0.5) * 2 * 0.17 * len;
      const t = 0.5 + (rr() - 0.5) * 0.2;
      const m = [u[0] + (v[0] - u[0]) * t + nx * off, u[1] + (v[1] - u[1]) * t + ny * off];
      return [...rec(u, m, depth - 1), ...rec(m, v, depth - 1)];
    };
    pts = [...rec(p, q, 4), q].map(v => [r1(v[0]), r1(v[1])]);
    edgeCache.set(key, pts);
  }
  return flip ? pts.slice().reverse() : pts;
}

const provinces = [];
for (const [tag, c] of Object.entries(countries)) {
  const mine = all.filter(s => s.tag === tag);
  if (!mine.length) { mine.push({ name: c.name, lon: 0, lat: 0, tag, state: c.name, vp: 0, flags: '', named: false, whole: true }); }
  const pts = mine.map(s => proj([s.lon, s.lat]));
  let cells;
  if (mine.length === 1) cells = [c.xy];
  else {
    const del = Delaunay.from(pts);
    const vor = del.voronoi([-50, -50, W + 50, H + 50]);
    cells = mine.map((s, i) => {
      const poly = vor.cellPolygon(i);
      if (!poly) return [];
      const ring = [];
      for (let k = 0; k < poly.length - 1; k++) {
        const a = poly[k], b = poly[k + 1];
        const onEdge = (Math.abs(a[0] - b[0]) < 1e-6 && (a[0] < -49 || a[0] > W + 49)) || (Math.abs(a[1] - b[1]) < 1e-6 && (a[1] < -49 || a[1] > H + 49));
        const seg = onEdge ? [a, b] : wiggle(a, b);
        for (let j = 0; j < seg.length - 1; j++) ring.push(seg[j]);
      }
      ring.push(ring[0].slice());
      try { return pc.intersection([[ring]], c.xy); } catch (e) { console.warn('clip fail', s.name, e.message); return []; }
    });
  }
  mine.forEach((s, i) => {
    let mp = cells[i];
    if (!mp || !mp.length) { if (s.named) console.warn('empty cell', s.name); return; }
    const areaOf = poly => { const r = poly[0]; let a = 0; for (let k = 0; k < r.length - 1; k++) a += r[k][0] * r[k + 1][1] - r[k + 1][0] * r[k][1]; return Math.abs(a / 2); };
    mp = mp.filter(p => areaOf(p) > 6).map(poly => poly.map(ring => ring.map(v => [r1(v[0]), r1(v[1])])));
    if (!mp.length) return;
    const area = mp.reduce((a, p) => a + areaOf(p), 0);
    // label point: seed if named, else centroid of largest part
    let big = mp[0]; for (const p of mp) if (areaOf(p) > areaOf(big)) big = p;
    let cx = 0, cy = 0, aa = 0; const r = big[0];
    for (let k = 0; k < r.length - 1; k++) { const f = r[k][0] * r[k + 1][1] - r[k + 1][0] * r[k][1]; cx += (r[k][0] + r[k + 1][0]) * f; cy += (r[k][1] + r[k + 1][1]) * f; aa += f; }
    cx /= 3 * aa; cy /= 3 * aa;
    let c0 = [cx, cy];
    const sp = s.whole ? c0 : proj([s.lon, s.lat]);
    if (!pip(c0, big[0])) c0 = sp;
    const inv = ([x, y]) => [x / K + lon0, (Math.atan(Math.exp(((yTop - y / K) * Math.PI) / 180)) * 360) / Math.PI - 90];
    const cll = inv(c0);
    provinces.push({ seed: s, tag, mp, area, c: c0.map(r1), city: s.named ? sp.map(r1) : null, ll: cll.map(v => Math.round(v * 1000) / 1000) });
  });
}
provinces.forEach((p, i) => (p.id = i));

// ---------- adjacency via shared vertices ----------
const vmap = new Map();
for (const p of provinces) {
  const seen = new Set();
  for (const poly of p.mp) for (const ring of poly) for (const v of ring) {
    const k = `${Math.round(v[0] * 5)},${Math.round(v[1] * 5)}`; // 0.2 unit grid
    if (seen.has(k)) continue; seen.add(k);
    let a = vmap.get(k); if (!a) vmap.set(k, (a = [])); a.push(p.id);
  }
}
const shareCount = new Map();
for (const ids of vmap.values()) if (ids.length > 1) for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
  const k = ids[i] < ids[j] ? ids[i] * 100000 + ids[j] : ids[j] * 100000 + ids[i];
  shareCount.set(k, (shareCount.get(k) || 0) + 1);
}
const adj = provinces.map(() => new Set());
for (const [k, n] of shareCount) if (n >= 2) { const a = Math.floor(k / 100000), b = k % 100000; adj[a].add(b); adj[b].add(a); }
// coastal detection: vertices used by only this province and not on bbox edge
for (const p of provinces) {
  let lone = 0; p.coastPts = [];
  for (const poly of p.mp) for (const v of poly[0]) {
    if (v[0] < 1 || v[0] > W - 1 || v[1] < 1 || v[1] > H - 1) continue;
    const k = `${Math.round(v[0] * 5)},${Math.round(v[1] * 5)}`;
    if (vmap.get(k).length === 1) { lone++; p.coastPts.push([v[0] / K + lon0, (Math.atan(Math.exp(((yTop - v[1] / K) * Math.PI) / 180)) * 360) / Math.PI - 90]); }
  }
  p.coastal = lone >= 4;
}

// ---------- terrain ----------
function distSeg(p, a, b) { const dx = b[0] - a[0], dy = b[1] - a[1]; const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy))); return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy); }
function terrainAt(ll) {
  let mt = 9;
  for (const r of S.RANGES || []) for (let i = 0; i < r.pts.length - 1; i++) mt = Math.min(mt, distSeg(ll, r.pts[i], r.pts[i + 1]) / r.w);
  if (mt < 0.55) return 'mountain';
  for (const [x, y, rx, ry] of S.MARSHES || []) if (((ll[0] - x) / rx) ** 2 + ((ll[1] - y) / ry) ** 2 < 1) return 'marsh';
  for (const [x, y, rx, ry] of S.FORESTS || []) if (((ll[0] - x) / rx) ** 2 + ((ll[1] - y) / ry) ** 2 < 1) return 'forest';
  if (mt < 1.1) return 'hills';
  for (const [x, y, rx, ry] of S.DESERTS || []) if (((ll[0] - x) / rx) ** 2 + ((ll[1] - y) / ry) ** 2 < 1) return 'desert';
  return 'plains';
}
for (const p of provinces) { p.terrain = p.seed.vp >= 15 ? 'urban' : terrainAt(p.ll); p.sub = p.seed.whole ? null : subOf([p.seed.lon, p.seed.lat]); }
// distance in km from a point to a polyline of [lon,lat]
const kmToLine = (pt, line) => { let best = Infinity; const kx = 111 * Math.cos((pt[1] * Math.PI) / 180), ky = 111; for (let i = 0; i < line.length - 1; i++) { const a = line[i], b = line[i + 1]; const ax = (a[0] - pt[0]) * kx, ay = (a[1] - pt[1]) * ky, bx = (b[0] - pt[0]) * kx, by = (b[1] - pt[1]) * ky; const dx = bx - ax, dy = by - ay; const t = Math.max(0, Math.min(1, -(ax * dx + ay * dy) / (dx * dx + dy * dy || 1))); best = Math.min(best, Math.hypot(ax + t * dx, ay + t * dy)); } return best; };

// ---------- fronts: ordering by path distance ----------
const R = 6371;
const hav = (a, b) => { const dLat = ((b[1] - a[1]) * Math.PI) / 180, dLon = ((b[0] - a[0]) * Math.PI) / 180; const s = Math.sin(dLat / 2) ** 2 + Math.cos((a[1] * Math.PI) / 180) * Math.cos((b[1] * Math.PI) / 180) * Math.sin(dLon / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(s)); };
function dijkstra(sources, allowed) { // sources: Map id→cost
  const dist = new Map(sources); const done = new Set();
  for (;;) {
    let u = -1, best = Infinity;
    for (const [id, d] of dist) if (!done.has(id) && d < best) { best = d; u = id; }
    if (u < 0) break; done.add(u);
    for (const v of adj[u]) { if (!allowed(provinces[v]) || done.has(v)) continue; const nd = best + hav(provinces[u].ll, provinces[v].ll); if (nd < (dist.get(v) ?? Infinity)) dist.set(v, nd); }
  }
  return dist;
}
const tehran = provinces.find(p => p.seed.name === S.CAPITAL && p.tag === HOME);
if (!tehran) throw new Error(`capital ${S.CAPITAL} not found among the home cities`);
const iran = provinces.filter(p => p.tag === HOME);
const jit = rngFrom(77);
const fronts = [];
for (const f of S.FRONTS) {
  const isObj = p => p.tag !== HOME && f.subs.includes(p.sub) && (!f.box || (p.ll[0] >= f.box[0] && p.ll[0] <= f.box[2] && p.ll[1] >= f.box[1] && p.ll[1] <= f.box[3]));
  const objs = provinces.filter(isObj);
  let iranSrc = new Map(), enemySrc = new Map();
  if (f.naval) {
    if (!f.coast) throw new Error(`naval front ${f.id} needs a coast polyline`);
    for (const p of iran) if (p.coastal && p.coastPts.filter(c => kmToLine(c, f.coast) < (f.coastKm || 70)).length >= 2) iranSrc.set(p.id, 15 + jit() * 50);
    const coastIr = [...iranSrc.keys()].map(i => provinces[i]);
    // enemy side: ordered by sea distance from the Iranian shore
    for (const p of objs) { let d = Infinity; for (const q of coastIr) d = Math.min(d, hav(p.ll, q.ll)); enemySrc.set(p.id, d); }
  } else {
    for (const p of iran) for (const v of adj[p.id]) if (isObj(provinces[v])) {
      iranSrc.set(p.id, 12 + jit() * 45);
      if (!enemySrc.has(v)) enemySrc.set(v, 12 + jit() * 45);
    }
  }
  if (!iranSrc.size) { problems.push(`front ${f.id}: no home province touches it (${f.naval ? 'check the coast polyline' : 'check subs: ' + f.subs.join(', ')})`); continue; }
  const dIr = dijkstra(iranSrc, p => p.tag === HOME);
  const dEn = f.naval ? enemySrc : dijkstra(enemySrc, isObj);
  const dTehran = dIr.get(tehran.id);
  if (dTehran == null) { problems.push(`front ${f.id}: the capital cannot be reached overland from it`); continue; }
  const iranOrder = [...dIr].filter(([id, d]) => d <= dTehran + 1e-6).sort((a, b) => a[1] - b[1]).map(([id, d]) => [id, Math.round(d)]);
  const enemyOrder = [...dEn].sort((a, b) => a[1] - b[1]).map(([id, d]) => [id, Math.round(d)]);
  const unreachable = objs.filter(p => !dEn.has(p.id)).map(p => p.seed.name);
  if (unreachable.length > objs.length * 0.5) problems.push(`front ${f.id}: ${unreachable.length} of ${objs.length} objective provinces are unreachable overland (islands? make it naval or trim subs)`);
  if (enemyOrder.length < 4) problems.push(`front ${f.id}: only ${enemyOrder.length} objective provinces`);
  if (iranOrder.length < 6) problems.push(`front ${f.id}: only ${iranOrder.length} home provinces between it and the capital`);
  const { subs, coast, box, ...rest } = f;
  fronts.push({ ...rest, iranOrder, enemyOrder, dTehran: Math.round(dTehran), dMax: enemyOrder.length ? enemyOrder[enemyOrder.length - 1][1] : 0, border: [...iranSrc.keys()] });
  console.log(' ', f.id.padEnd(5), 'home provs', String(iranOrder.length).padStart(3), 'dTehran', Math.round(dTehran), 'km | objectives', enemyOrder.length, 'dMax', fronts.at(-1).dMax, 'km');
}
// home front per Iranian province (nearest front border by path distance) – for building damage targeting
const homeDist = fronts.map(f => new Map(f.iranOrder));

// ---------- assemble ----------
const stateSet = [...new Set(provinces.map(p => `${p.tag}:${p.seed.state}`))];
const P2 = v => proj(v).map(r1);
const cityXY = {}; for (const p of provinces) if (p.seed.named) cityXY[p.seed.name] = p.city;
const out = {
  id: S.ID, home: HOME, w: W, h: H, k: K, extent: S.EXTENT, meta: S.META || {},
  labels: { home: P2(S.HOME_LABEL || tehran.ll), countries: (S.COUNTRY_LABELS || []).map(([t, n, lon, lat, sz = 13]) => ({ t, n, c: P2([lon, lat]), sz })) },
  fleetAt: Object.fromEntries(Object.entries(S.FLEET_AT || {}).map(([k, v]) => [k, P2(v)])),
  countries: Object.fromEntries(Object.values(countries).map(c => [c.tag, { name: c.name, long: c.long, color: c.color, shape: c.xy.map(poly => poly.map(r => r.flat())) }])),
  states: stateSet,
  provinces: provinces.map(p => ({
    id: p.id, n: p.seed.name, t: p.tag, s: stateSet.indexOf(`${p.tag}:${p.seed.state}`), c: p.c, ll: p.ll,
    ...(p.seed.named ? { city: p.city, vp: p.seed.vp } : {}), ...(p.seed.flags ? { f: p.seed.flags } : {}),
    tr: p.terrain, a: Math.round(p.area), ...(p.coastal ? { co: 1 } : {}), adj: [...adj[p.id]].sort((a, b) => a - b),
    g: p.mp.map(poly => poly.map(r => r.flat())),
  })),
  fronts,
  tehran: tehran.id, capital: tehran.id,
  lakes: (S.LAKES || []).map(l => ({ n: l.name, p: l.pts.map(proj).map(v => v.map(r1)).flat() })),
  rivers: (S.RIVERS || []).map(l => ({ n: l.name, p: l.pts.map(proj).map(v => v.map(r1)).flat() })),
  railways: (S.RAILWAYS || []).map(r => ({ n: r.name, stage: r.stage, p: r.via.map(v => (typeof v === 'string' ? (cityXY[v] || (problems.push(`railway ${r.name}: unknown city ${v}`), tehran.city)) : proj(v).map(r1))).flat() })),
  ranges: (S.RANGES || []).map(r => ({ n: r.name, w: Math.round(r.w * K), p: r.pts.map(proj).map(v => v.map(r1)).flat() })),
  deserts: (S.DESERTS || []).map(([x, y, rx, ry, n]) => ({ n, c: proj([x, y]).map(r1), rx: Math.round(rx * K), ry: Math.round(ry * K * 1.2) })),
  seas: (S.SEA_LABELS || []).map(([n, x, y, sz, rot = 0]) => ({ n, c: proj([x, y]).map(r1), sz, rot })),
  achaemenid: (S.EMPIRE || []).map(proj).map(v => v.map(r1)).flat(),
};
// sanity
const isolated = provinces.filter(p => !adj[p.id].size && p.tag === HOME).map(p => p.seed.name);
if (isolated.length) problems.push(`home provinces with no neighbours: ${isolated.join(', ')}`);
if (iran.length < 40) problems.push(`only ${iran.length} home provinces — lower the home country's spacing`);
if (fronts.length !== S.FRONTS.length) problems.push('some fronts could not be built');
const json = JSON.stringify(out);
fs.mkdirSync(new URL('../data/maps/', import.meta.url), { recursive: true });
fs.writeFileSync(new URL(`../data/maps/${S.ID}.json`, import.meta.url), json);
if (S.ID === 'iran') fs.writeFileSync(new URL('../data/map.json', import.meta.url), json); // legacy path
console.log(`  ${S.ID}: ${provinces.length} provinces (${iran.length} home), ${(json.length / 1024).toFixed(0)} KB, ${W}x${H}`);
for (const pr of problems) console.log('  PROBLEM:', pr);
return { id: S.ID, problems, provinces: provinces.length, home: iran.length, meta: S.META || {} };
}

const dir = new URL('./scenarios/', import.meta.url);
const only = process.argv.slice(2);
const ids = fs.readdirSync(dir).filter(f => f.endsWith('.mjs')).map(f => f.replace(/\.mjs$/, '')).filter(id => !only.length || only.includes(id)).sort((a, b) => (a === 'iran' ? -1 : b === 'iran' ? 1 : a.localeCompare(b)));
let bad = 0; const index = [];
for (const id of ids) {
  console.log(id);
  try { const S = await import(new URL(`${id}.mjs`, dir)); if (S.ID !== id) throw new Error(`ID "${S.ID}" must match the file name`); const r = await build(S); bad += r.problems.length; const m = r.meta; index.push({ id, name: m.name, long: m.long, empire: m.empire, year: m.year || 1936, blurb: m.blurb || '', flag: m.flag || null }); }
  catch (e) { console.log('  FAILED:', e.message); bad++; }
}
if (!only.length) fs.writeFileSync(new URL('../data/scenarios.json', import.meta.url), JSON.stringify(index, null, 1));
if (bad) { console.log(`\n${bad} problem(s)`); process.exit(1); }
