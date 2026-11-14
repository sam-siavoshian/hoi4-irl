// Canvas map renderer: provinces, borders, front lines, counters, buildings, battles.
import { ACTIONS, DAY, mapMeta, statusOf } from './engine.js';

export const FRONT_COLORS = { afg: '#4aa3c7', cau: '#d0604e', tks: '#dc8f3f', irq: '#c2aa3e', raj: '#cf5d84', tur: '#a195dc', glf: '#3fc0ab' };
const IRAN = '#3d8573';
const TERRAIN_COL = { plains: '#7f9a5a', hills: '#8c8a5c', mountain: '#6f6558', desert: '#c9b27a', forest: '#4f7d4d', marsh: '#5b8a86', urban: '#a8a39a' };

const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const rgb = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const shade = (c, k) => (k >= 0 ? mix(c, [255, 255, 255], k) : mix(c, [0, 0, 0], -k));
const hash = n => { let x = Math.imul(n + 1, 2654435761) >>> 0; x ^= x >>> 15; return (x % 1000) / 1000; };

export class MapView {
  constructor(base, overlay, map) {
    this.base = base; this.over = overlay; this.map = map;
    this.ctx = base.getContext('2d'); this.octx = overlay.getContext('2d');
    this.view = { x: 0, y: 0, s: 0.3 };
    this.mode = 'political'; this.showEmpire = false;
    this.st = null; this.labels = {}; this.selected = null; this.off = []; this.pins = [];
    this.hits = []; this.onTap = () => {}; this.onView = () => {};
    this.meta = mapMeta(map);
    this._prep(); this._bind();
    this.resize();
    this._tick = this._tick.bind(this);
    requestAnimationFrame(this._tick);
  }

  proj(lon, lat) {
    const { extent: e, k } = this.map; const merc = l => Math.log(Math.tan(Math.PI / 4 + (l * Math.PI) / 360)) * 180 / Math.PI;
    return [(lon - e.lon0) * k, (merc(e.lat1) - merc(lat)) * k];
  }

  _prep() {
    const m = this.map;
    const ringPath = (path, r) => { path.moveTo(r[0], r[1]); for (let i = 2; i < r.length; i += 2) path.lineTo(r[i], r[i + 1]); path.closePath(); };
    for (const p of m.provinces) {
      const path = new Path2D(); let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
      for (const poly of p.g) for (const r of poly) { ringPath(path, r); for (let i = 0; i < r.length; i += 2) { x0 = Math.min(x0, r[i]); x1 = Math.max(x1, r[i]); y0 = Math.min(y0, r[i + 1]); y1 = Math.max(y1, r[i + 1]); } }
      p.path = path; p.bb = [x0, y0, x1, y1];
      const base = hex(m.countries[p.t].color);
      const tk = { mountain: -0.2, hills: -0.1, desert: 0.1, forest: -0.14, marsh: -0.06, urban: 0.16, plains: 0 }[p.tr] + (hash(p.id) - 0.5) * 0.07;
      const lum = base[0] * 0.3 + base[1] * 0.59 + base[2] * 0.11;
      p.col = shade(mix(base, [lum, lum, lum], p.t === 'IRN' ? 0.05 : 0.3), tk * 0.8 - (p.t === 'IRN' ? 0 : 0.1));
    }
    for (const [tag, c] of Object.entries(m.countries)) { const path = new Path2D(); for (const poly of c.shape) for (const r of poly) ringPath(path, r); c.path = path; c.rgb = hex(c.color); }
    const line = pts => { const p = new Path2D(); p.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) p.lineTo(pts[i], pts[i + 1]); return p; };
    const smooth = pts => { const p = new Path2D(); p.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length - 2; i += 2) { const mx = (pts[i] + pts[i + 2]) / 2, my = (pts[i + 1] + pts[i + 3]) / 2; p.quadraticCurveTo(pts[i], pts[i + 1], mx, my); } p.lineTo(pts[pts.length - 2], pts[pts.length - 1]); return p; };
    for (const r of m.rivers) r.path = smooth(r.p);
    for (const r of m.railways) r.path = line(r.p);
    for (const l of m.lakes) { l.path = smooth([...l.p, l.p[0], l.p[1], l.p[2], l.p[3]]); l.path.closePath(); }
    this.empirePath = line(m.achaemenid); this.empirePath.closePath();
    // which front each Iranian province "belongs" to (life-area map mode)
    this.sector = new Map();
    for (const f of m.fronts) for (const [id, d] of f.iranOrder) { const v = d / f.dTehran; const cur = this.sector.get(id); if (!cur || v < cur.v) this.sector.set(id, { f: f.id, v }); }
    this.hitCtx = document.createElement('canvas').getContext('2d');
    this.patterns = new Map();
    this.countryLabels = [['TUR', 'TURKEY', 34.2, 39.0, 15], ['SOV', 'SOVIET UNION', 61.5, 41.6, 19], ['IRQ', 'IRAQ', 43.3, 32.9, 13], ['AFG', 'AFGHANISTAN', 65.6, 33.3, 13],
      ['RAJ', 'BRITISH RAJ', 70.6, 27.4, 15], ['SAU', 'SAUDI ARABIA', 44.5, 24.6, 14], ['EGY', 'EGYPT', 29.2, 27.2, 14], ['FRA', 'SYRIA', 38.4, 35.0, 10], ['GBR', 'OMAN', 57.2, 22.6, 9]]
      .map(([t, n, lon, lat, sz]) => ({ t, n, c: this.proj(lon, lat), sz }));
    this.iranLabel = this.proj(54.6, 32.7);
  }

  pattern(a, b) {
    const key = a + '|' + b; let p = this.patterns.get(key);
    if (!p) {
      const c = document.createElement('canvas'); c.width = c.height = 12; const x = c.getContext('2d');
      x.fillStyle = a; x.fillRect(0, 0, 12, 12); x.strokeStyle = b; x.lineWidth = 3.4; x.lineCap = 'square';
      x.beginPath(); x.moveTo(-3, 9); x.lineTo(9, -3); x.moveTo(3, 15); x.lineTo(15, 3); x.stroke();
      p = this.ctx.createPattern(c, 'repeat'); this.patterns.set(key, p);
    }
    return p;
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const r = this.base.parentElement.getBoundingClientRect();
    this.w = Math.max(50, r.width); this.h = Math.max(50, r.height); this.dpr = dpr;
    for (const c of [this.base, this.over]) { c.width = Math.round(this.w * dpr); c.height = Math.round(this.h * dpr); c.style.width = this.w + 'px'; c.style.height = this.h + 'px'; }
    this.minS = Math.min(Math.max(this.w / this.map.w, this.h / this.map.h), this.w / 1640);
    if (!this._inited) { this._inited = true; this.home(false); }
    this._clamp(); this.dirty = true;
  }

  home(animate = true) {
    const [cx, cy] = this.proj(53.7, 32.5);
    const s = Math.max(this.minS, Math.min(this.w / 1600, this.h / 1250));
    this.flyTo(cx, cy, s, animate);
  }
  flyTo(cx, cy, s, animate = true) {
    s = Math.max(this.minS, Math.min(8, s ?? this.view.s));
    const target = { x: cx - this.w / 2 / s, y: cy - this.h / 2 / s, s };
    if (!animate) { this.view = target; this._clamp(); this.dirty = true; return; }
    this.anim = { from: { ...this.view }, to: target, t0: performance.now(), dur: 650 };
  }
  flyToFront(fid) {
    const ids = this.st?.lines[fid]?.ours || []; if (!ids.length) return;
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const id of [...ids, ...this.st.lines[fid].theirs]) { const c = this.map.provinces[id].c; x0 = Math.min(x0, c[0]); x1 = Math.max(x1, c[0]); y0 = Math.min(y0, c[1]); y1 = Math.max(y1, c[1]); }
    const s = Math.min(1.5, Math.min(this.w / (x1 - x0 + 420), this.h / (y1 - y0 + 420)));
    this.flyTo((x0 + x1) / 2, (y0 + y1) / 2 + (this.h * 0.12) / s, s);
  }
  _clamp() {
    const v = this.view; v.s = Math.max(this.minS, Math.min(8, v.s));
    const vw = this.w / v.s, vh = this.h / v.s;
    v.x = vw >= this.map.w ? (this.map.w - vw) / 2 : Math.max(0, Math.min(this.map.w - vw, v.x)); v.y = vh >= this.map.h ? (this.map.h - vh) / 2 : Math.max(0, Math.min(this.map.h - vh, v.y));
  }
  toMap(px, py) { return [this.view.x + px / this.view.s, this.view.y + py / this.view.s]; }
  toScreen(x, y) { return [(x - this.view.x) * this.view.s, (y - this.view.y) * this.view.s]; }

  _bind() {
    const el = this.over; const pts = new Map(); let moved = 0, start = null, pinch = null;
    el.addEventListener('pointerdown', e => { el.setPointerCapture(e.pointerId); pts.set(e.pointerId, [e.offsetX, e.offsetY]); this.anim = null; if (pts.size === 1) { moved = 0; start = [e.offsetX, e.offsetY, performance.now()]; } pinch = null; });
    el.addEventListener('pointermove', e => {
      if (!pts.has(e.pointerId)) return;
      const prev = pts.get(e.pointerId); const cur = [e.offsetX, e.offsetY]; pts.set(e.pointerId, cur);
      if (pts.size === 1) { const dx = cur[0] - prev[0], dy = cur[1] - prev[1]; moved += Math.abs(dx) + Math.abs(dy); this.view.x -= dx / this.view.s; this.view.y -= dy / this.view.s; }
      else if (pts.size === 2) {
        const [a, b] = [...pts.values()]; const d = Math.hypot(a[0] - b[0], a[1] - b[1]), cx = (a[0] + b[0]) / 2, cy = (a[1] + b[1]) / 2;
        if (pinch) { const [mx, my] = this.toMap(pinch.cx, pinch.cy); this.view.s = Math.max(this.minS, Math.min(8, this.view.s * (d / pinch.d))); this.view.x = mx - cx / this.view.s; this.view.y = my - cy / this.view.s; }
        pinch = { d, cx, cy }; moved += 20;
      }
      this._clamp(); this.dirty = true;
    });
    const up = e => {
      if (!pts.has(e.pointerId)) return; pts.delete(e.pointerId); pinch = null;
      if (pts.size === 0 && start && moved < 9 && performance.now() - start[2] < 600) this._tap(start[0], start[1]);
      if (pts.size === 0) this.onView(this.view);
    };
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
    el.addEventListener('wheel', e => {
      e.preventDefault(); const [mx, my] = this.toMap(e.offsetX, e.offsetY);
      this.view.s = Math.max(this.minS, Math.min(8, this.view.s * Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0016))));
      this.view.x = mx - e.offsetX / this.view.s; this.view.y = my - e.offsetY / this.view.s; this._clamp(); this.dirty = true; this.anim = null;
    }, { passive: false });
    el.addEventListener('dblclick', e => { const [mx, my] = this.toMap(e.offsetX, e.offsetY); this.flyTo(mx, my, this.view.s * 1.8); });
    for (const ev of ['gesturestart', 'gesturechange', 'gestureend']) el.addEventListener(ev, e => e.preventDefault());
  }
  zoomBy(k) { const [mx, my] = this.toMap(this.w / 2, this.h / 2); this.flyTo(mx, my, this.view.s * k); }

  _tap(px, py) {
    for (let i = this.hits.length - 1; i >= 0; i--) { const h = this.hits[i]; if (px >= h.x && px <= h.x + h.w && py >= h.y && py <= h.y + h.h) { this.onTap(h.data); return; } }
    const [x, y] = this.toMap(px, py);
    for (const p of this.map.provinces) { const b = p.bb; if (x < b[0] || x > b[2] || y < b[1] || y > b[3]) continue; if (this.hitCtx.isPointInPath(p.path, x, y)) { this.onTap({ kind: 'province', id: p.id }); return; } }
    this.onTap({ kind: 'sea' });
  }

  setState(st, labels) { this.st = st; this.labels = labels; this.dirty = true; }
  setMode(m) { this.mode = m; this.dirty = true; }
  select(id) { this.selected = id; this.dirty = true; }

  _tick(now) {
    if (this.anim) {
      const a = this.anim; let t = Math.min(1, (now - a.t0) / a.dur); const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      const ls = Math.log(a.from.s) + (Math.log(a.to.s) - Math.log(a.from.s)) * e; this.view.s = Math.exp(ls);
      const cx0 = a.from.x + this.w / 2 / a.from.s, cy0 = a.from.y + this.h / 2 / a.from.s, cx1 = a.to.x + this.w / 2 / a.to.s, cy1 = a.to.y + this.h / 2 / a.to.s;
      this.view.x = cx0 + (cx1 - cx0) * e - this.w / 2 / this.view.s; this.view.y = cy0 + (cy1 - cy0) * e - this.h / 2 / this.view.s;
      this._clamp(); this.dirty = true; if (t >= 1) { this.anim = null; this.onView(this.view); }
    }
    if (this.dirty && this.st) { this.dirty = false; this.draw(); }
    if (this.st && !document.hidden) this.drawOverlay(now);
    requestAnimationFrame(this._tick);
  }

  // ---------------- base layer ----------------
  provFill(p) {
    const st = this.st, t = st.terr, m = this.map;
    const occBy = p.t === 'IRN' ? t.occ.get(p.id) : null, libBy = p.t !== 'IRN' ? t.lib.get(p.id) : null;
    const iranCol = shade(hex(IRAN), { mountain: -0.2, hills: -0.1, desert: 0.1, forest: -0.14, marsh: -0.06, urban: 0.16, plains: 0 }[p.tr] + (hash(p.id) - 0.5) * 0.07);
    switch (this.mode) {
      case 'terrain': return rgb(shade(hex(TERRAIN_COL[p.tr]), (hash(p.id) - 0.5) * 0.1 - (p.t === 'IRN' ? 0 : 0.25)));
      case 'life': case 'supply': case 'air': case 'infra': {
        if (p.t !== 'IRN') { if (libBy) return rgb(mix(hex(FRONT_COLORS[libBy]), [30, 34, 38], 0.35)); return rgb(mix(p.col, [38, 42, 46], 0.72)); }
        if (occBy) return this.pattern(rgb(mix(hex(m.countries[m.fronts.find(f => f.id === occBy).enemy].color), [20, 20, 20], 0.35)), 'rgba(0,0,0,0.45)');
        if (this.mode === 'infra') { const S = st.states[this.meta.stateName(p.s)]; const v = Math.max(0, S.infra - S.infraDmg) / 5; return rgb(shade(mix([92, 70, 52], [90, 190, 120], v), (hash(p.id) - 0.5) * 0.08)); }
        const sec = this.sector.get(p.id); if (!sec) return rgb(iranCol);
        const fr = st.fronts[sec.f];
        if (this.mode === 'life') return rgb(shade(hex(FRONT_COLORS[sec.f]), -0.12 - sec.v * 0.3 + (hash(p.id) - 0.5) * 0.08));
        if (this.mode === 'supply') return rgb(shade(mix([170, 60, 50], [70, 170, 95], fr.supply / 100), -sec.v * 0.25 + (hash(p.id) - 0.5) * 0.06));
        return rgb(shade(mix(mix([175, 60, 55], [110, 110, 110], 0.5 + Math.min(0, fr.air) / 200 + 0.5), [70, 130, 200], Math.max(0, fr.air) / 100), -sec.v * 0.25 + (hash(p.id) - 0.5) * 0.06));
      }
      default:
        if (occBy) { const e = m.countries[m.fronts.find(f => f.id === occBy).enemy]; return this.pattern(rgb(shade(e.rgb, -0.08)), rgb(shade(e.rgb, -0.42))); }
        if (libBy) return this.pattern(rgb(iranCol), rgb(shade(p.col, -0.1), 0.75));
        return rgb(p.col);
    }
  }

  draw() {
    const { ctx, map: m, view: v, st } = this; const k = this.dpr * v.s;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const g = ctx.createLinearGradient(0, 0, 0, this.base.height); g.addColorStop(0, '#131f2b'); g.addColorStop(1, '#172633');
    ctx.fillStyle = '#0b1218'; ctx.fillRect(0, 0, this.base.width, this.base.height);
    ctx.setTransform(k, 0, 0, k, -v.x * k, -v.y * k);
    ctx.fillStyle = g; ctx.fillRect(0, 0, m.w, m.h);
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, m.w, m.h); ctx.clip();
    const px = 1 / v.s; // one css pixel in map units
    const vx0 = v.x - 20, vy0 = v.y - 20, vx1 = v.x + this.w / v.s + 20, vy1 = v.y + this.h / v.s + 20;
    const vis = p => !(p.bb[2] < vx0 || p.bb[0] > vx1 || p.bb[3] < vy0 || p.bb[1] > vy1);
    // graticule
    ctx.strokeStyle = 'rgba(140,180,210,0.07)'; ctx.lineWidth = px; ctx.beginPath();
    for (let lon = 25; lon < 76; lon += 5) { const [x] = this.proj(lon, 30); ctx.moveTo(x, 0); ctx.lineTo(x, m.h); }
    for (let lat = 25; lat < 47; lat += 5) { const [, y] = this.proj(30, lat); ctx.moveTo(0, y); ctx.lineTo(m.w, y); }
    ctx.stroke();
    // coastal glow
    ctx.save(); ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(120,170,200,0.10)'; ctx.lineWidth = 9 * px; for (const c of Object.values(m.countries)) ctx.stroke(c.path);
    ctx.strokeStyle = 'rgba(150,200,225,0.12)'; ctx.lineWidth = 4 * px; for (const c of Object.values(m.countries)) ctx.stroke(c.path); ctx.restore();
    // provinces
    const visible = m.provinces.filter(vis);
    for (const p of visible) { ctx.fillStyle = this.provFill(p); ctx.fill(p.path); }
    // seam filler + province borders
    const ba = Math.max(0, Math.min(0.5, (v.s - 0.22) * 1.2));
    ctx.lineJoin = 'round'; ctx.lineWidth = Math.min(1.1 * px, 1.6); ctx.strokeStyle = `rgba(12,16,20,${0.12 + ba})`;
    for (const p of visible) ctx.stroke(p.path);
    // terrain texture: mountains ticks when zoomed
    if (v.s > 0.55 && (this.mode === 'political' || this.mode === 'terrain')) {
      ctx.strokeStyle = 'rgba(0,0,0,0.22)'; ctx.lineWidth = 1.1 * px; ctx.beginPath();
      for (const p of visible) if (p.tr === 'mountain') { const n = 3; for (let i = 0; i < n; i++) { const x = p.c[0] + (hash(p.id * 7 + i) - 0.5) * 26, y = p.c[1] + (hash(p.id * 13 + i) - 0.5) * 20 + 6; ctx.moveTo(x - 5, y + 3); ctx.lineTo(x, y - 4); ctx.lineTo(x + 5, y + 3); } }
      ctx.stroke();
    }
    // lakes + rivers
    ctx.fillStyle = '#152330'; ctx.strokeStyle = 'rgba(150,200,225,0.2)'; ctx.lineWidth = 1.2 * px; for (const l of m.lakes) { ctx.fill(l.path); ctx.stroke(l.path); }
    ctx.strokeStyle = 'rgba(86,140,180,0.55)'; ctx.lineCap = 'round'; ctx.lineWidth = Math.max(1.1 * px, 1.3); for (const r of m.rivers) ctx.stroke(r.path);
    // country borders
    ctx.lineJoin = 'round';
    for (const [tag, c] of Object.entries(m.countries)) { ctx.strokeStyle = 'rgba(8,10,12,0.85)'; ctx.lineWidth = Math.max(1.4 * px, 1.8); ctx.stroke(c.path); }
    // railways
    const infra = this.mode === 'infra';
    for (const r of m.railways) {
      const built = r.stage <= st.railStage; if (!built && !infra) continue;
      ctx.setLineDash([]); ctx.strokeStyle = built ? 'rgba(20,20,22,0.9)' : 'rgba(20,20,22,0.35)'; ctx.lineWidth = (infra ? 3.2 : 2.4) * px; ctx.stroke(r.path);
      ctx.setLineDash([5 * px, 5 * px]); ctx.strokeStyle = built ? 'rgba(235,225,200,0.9)' : 'rgba(235,225,200,0.3)'; ctx.lineWidth = (infra ? 1.6 : 1.1) * px; ctx.stroke(r.path); ctx.setLineDash([]);
    }
    if (this.showEmpire || st.empire) { ctx.setLineDash([10 * px, 7 * px]); ctx.strokeStyle = 'rgba(232,196,104,0.9)'; ctx.lineWidth = 2.2 * px; ctx.stroke(this.empirePath); ctx.setLineDash([]); ctx.fillStyle = 'rgba(232,196,104,0.06)'; ctx.fill(this.empirePath); }
    this._frontLines(px);
    if (this.selected != null) { const p = m.provinces[this.selected]; ctx.strokeStyle = '#ffe9a8'; ctx.lineWidth = 2.5 * px; ctx.stroke(p.path); ctx.fillStyle = 'rgba(255,233,168,0.18)'; ctx.fill(p.path); }
    this._labels(px, visible);
    this._buildings(px, visible);
    this.hits = [];
    this._units(px);
    ctx.restore();
  }

  _frontLines(px) {
    const { ctx, map: m, st } = this; const P = m.provinces;
    for (const f of m.fronts) {
      if (this.off.includes(f.id)) continue;
      const L = st.lines[f.id]; const fr = st.fronts[f.id];
      const touching = L.ours.some(id => P[id].adj.some(a => L.theirs.includes(a)));
      if (!touching) continue;
      const ours = new Path2D(), theirs = new Path2D();
      for (const id of L.ours) ours.addPath(P[id].path); for (const id of L.theirs) theirs.addPath(P[id].path);
      const w = Math.max(2.3 * px, 2.2);
      const hot = fr.last && st.now - fr.last.t < 3 * DAY;
      ctx.save(); ctx.clip(theirs); ctx.lineJoin = 'round';
      ctx.strokeStyle = hot && fr.last.side === 'loss' ? 'rgba(240,84,66,1)' : 'rgba(214,74,60,0.95)'; ctx.lineWidth = w * 2; for (const id of L.ours) ctx.stroke(P[id].path);
      ctx.restore();
      ctx.save(); ctx.clip(ours); ctx.lineJoin = 'round';
      ctx.strokeStyle = 'rgba(150,232,214,0.95)'; ctx.lineWidth = w * 1.5; for (const id of L.theirs) ctx.stroke(P[id].path);
      ctx.restore();
    }
  }

  _spaced(text, x, y, size, color, spacing, px, rot = 0, italic = false) {
    const ctx = this.ctx; ctx.save(); ctx.translate(x, y); if (rot) ctx.rotate((rot * Math.PI) / 180);
    ctx.font = `${italic ? 'italic ' : ''}600 ${size * px}px -apple-system,BlinkMacSystemFont,"SF Pro Text","Inter","Segoe UI",Roboto,sans-serif`; ctx.fillStyle = color; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    const ws = [...text].map(ch => ctx.measureText(ch).width); const total = ws.reduce((a, b) => a + b, 0) + spacing * px * (text.length - 1); let cx = -total / 2;
    [...text].forEach((ch, i) => { ctx.fillText(ch, cx, 0); cx += ws[i] + spacing * px; }); ctx.restore();
  }

  _labels(px, visible) {
    const { ctx, map: m, view: v, st } = this;
    for (const s of m.seas) this._spaced(s.n, s.c[0], s.c[1], Math.max(9, 13 * s.sz * Math.min(1.6, 0.6 + v.s)), 'rgba(150,190,215,0.5)', 3 * s.sz, px, -s.rot, true);
    const fade = Math.max(0.15, Math.min(0.6, 0.75 - v.s * 0.35));
    for (const l of this.countryLabels) this._spaced(l.n, l.c[0], l.c[1], l.sz * Math.min(2.2, 0.7 + v.s * 1.2), `rgba(8,10,12,${fade})`, 5, px);
    this._spaced(st.empire ? 'ACHAEMENID EMPIRE' : 'IRAN', this.iranLabel[0], this.iranLabel[1], (st.empire ? 15 : 22) * Math.min(2.2, 0.7 + v.s * 1.2), `rgba(240,250,245,${fade * 0.75})`, st.empire ? 6 : 16, px);
    // cities
    const minVp = v.s > 1.5 ? 1 : v.s > 0.95 ? 3 : v.s > 0.55 ? 5 : v.s > 0.3 ? 10 : 15;
    ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    for (const p of visible) {
      if (!p.city || p.vp < minVp) continue;
      const [x, y] = p.city; const cap = p.id === m.tehran; const r = (p.vp >= 15 ? 3.6 : p.vp >= 5 ? 2.8 : 2.2) * px;
      const lost = p.t === 'IRN' ? st.terr.occ.has(p.id) : false;
      ctx.fillStyle = '#0d1114'; ctx.beginPath(); ctx.arc(x, y, r + 1.2 * px, 0, 7); ctx.fill();
      ctx.fillStyle = cap ? '#f2cf6b' : lost ? '#ff8a75' : '#f4f1e6';
      if (cap) { ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = (i % 2 ? 2.6 : 6) * px; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#0d1114'; ctx.lineWidth = px; ctx.stroke(); }
      else { ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); }
      const fs = (p.vp >= 15 ? 12.5 : p.vp >= 5 ? 11 : 10) * px;
      ctx.font = `${p.vp >= 10 ? 700 : 600} ${fs}px -apple-system,BlinkMacSystemFont,"SF Pro Text","Inter","Segoe UI",Roboto,sans-serif`;
      ctx.lineWidth = 2.6 * px; ctx.strokeStyle = 'rgba(8,10,12,0.85)'; ctx.lineJoin = 'round';
      const name = cap ? p.n.toUpperCase() : p.n;
      ctx.strokeText(name, x + 6 * px, y - 1 * px); ctx.fillStyle = cap ? '#f7dc8b' : lost ? '#ffb3a3' : '#f4f1e6'; ctx.fillText(name, x + 6 * px, y - 1 * px);
    }
  }

  _icon(kind, x, y, s, dmg) {
    const ctx = this.ctx; ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.fillStyle = 'rgba(14,18,22,0.92)'; ctx.strokeStyle = dmg > 0.05 ? '#ff6a4d' : '#cdb97a'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.roundRect(-8, -8, 16, 16, 3); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = ctx.fillStyle = dmg > 0.05 ? '#ffb09d' : '#efe3b8'; ctx.lineWidth = 1.5; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath();
    switch (kind) {
      case 'port': case 'naval': ctx.arc(0, -4, 1.6, 0, 7); ctx.moveTo(0, -2.4); ctx.lineTo(0, 5); ctx.moveTo(-3, -0.5); ctx.lineTo(3, -0.5); ctx.moveTo(-4.5, 2); ctx.quadraticCurveTo(-4, 5.5, 0, 5.5); ctx.quadraticCurveTo(4, 5.5, 4.5, 2); ctx.stroke(); break;
      case 'airbase': ctx.moveTo(0, -5.5); ctx.lineTo(0, 5); ctx.moveTo(-5.5, 0.5); ctx.lineTo(0, -2); ctx.lineTo(5.5, 0.5); ctx.moveTo(-2.2, 5); ctx.lineTo(2.2, 5); ctx.stroke(); break;
      case 'hub': ctx.rect(-4.5, -3.5, 9, 7); ctx.moveTo(-4.5, -0.5); ctx.lineTo(4.5, -0.5); ctx.moveTo(0, -3.5); ctx.lineTo(0, 3.5); ctx.stroke(); break;
      case 'refinery': ctx.moveTo(-4, 5); ctx.lineTo(-1.5, -5); ctx.lineTo(1.5, -5); ctx.lineTo(4, 5); ctx.moveTo(-3, 1); ctx.lineTo(3, 1); ctx.moveTo(-2.2, -2); ctx.lineTo(2.2, -2); ctx.stroke(); break;
      case 'fort': ctx.moveTo(-5, 4.5); ctx.lineTo(-5, -4); ctx.lineTo(-2.5, -4); ctx.lineTo(-2.5, -1.5); ctx.lineTo(-1, -1.5); ctx.lineTo(-1, -4); ctx.lineTo(1, -4); ctx.lineTo(1, -1.5); ctx.lineTo(2.5, -1.5); ctx.lineTo(2.5, -4); ctx.lineTo(5, -4); ctx.lineTo(5, 4.5); ctx.closePath(); ctx.stroke(); break;
    }
    if (dmg > 0.05) { ctx.fillStyle = '#ff5a36'; ctx.beginPath(); ctx.moveTo(8, -9); ctx.quadraticCurveTo(12, -4, 8.5, -1); ctx.quadraticCurveTo(4, -3, 6.5, -7); ctx.quadraticCurveTo(7.5, -6, 8, -9); ctx.fill(); }
    ctx.restore();
  }

  _buildings(px, visible) {
    const { view: v, st, map: m } = this; const infra = this.mode === 'infra' || this.mode === 'supply' || this.mode === 'air';
    if (v.s < 0.42 && !infra) {
      // only show damaged ones when zoomed out
      for (const b of this.meta.buildings) { const d = st.bld[b.id]; if (d.dmg > 0.05) { const p = m.provinces[b.prov]; this._icon(b.kind, p.city[0] - 10 * px, p.city[1] + 11 * px, px * 0.85, d.dmg); } }
      return;
    }
    const per = new Map();
    for (const b of this.meta.buildings) {
      if (b.kind === 'naval') continue; const p = m.provinces[b.prov]; if (!visible.includes(p)) continue;
      if (this.mode === 'air' && b.kind !== 'airbase') continue; if (this.mode === 'supply' && !['hub', 'port'].includes(b.kind)) continue;
      const i = per.get(b.prov) || 0; per.set(b.prov, i + 1);
      const s = px * (infra ? 1.05 : 0.9);
      this._icon(b.kind, p.city[0] - 2 * px + i * 17 * s, p.city[1] + 14 * px, s, st.bld[b.id].dmg);
    }
  }

  counter(ctx, x, y, s, { type, n = 1, str = 100, org = 100, enemy = false, color, rank = 0, tag = null }) {
    const W = 34, H = 22; ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    if (n > 1) { ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.beginPath(); ctx.roundRect(-W / 2 + 3, -H / 2 + 3, W, H, 2.5); ctx.fill(); ctx.fillStyle = color; ctx.strokeStyle = 'rgba(0,0,0,0.8)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.roundRect(-W / 2 + 2, -H / 2 + 2, W, H, 2.5); ctx.fill(); ctx.stroke(); }
    ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 3 * s * this.dpr; ctx.shadowOffsetY = 1 * s * this.dpr;
    ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(-W / 2, -H / 2, W, H, 2.5); ctx.fill(); ctx.shadowColor = 'transparent';
    ctx.strokeStyle = enemy ? '#1a0d0b' : '#0b1614'; ctx.lineWidth = 1.3; ctx.stroke();
    // bars
    ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(-W / 2 + 2, -H / 2 + 2.5, 5.4, H - 5);
    const bh = H - 6; ctx.fillStyle = '#63d06a'; ctx.fillRect(-W / 2 + 2.6, -H / 2 + 3 + bh * (1 - org / 100), 2, bh * org / 100);
    ctx.fillStyle = '#e8a23c'; ctx.fillRect(-W / 2 + 4.9, -H / 2 + 3 + bh * (1 - str / 100), 2, bh * str / 100);
    // symbol box
    const bx = -W / 2 + 10, by = -H / 2 + 4, bw = W - 14, bhh = H - 8;
    ctx.strokeStyle = ctx.fillStyle = '#f6f3e8'; ctx.lineWidth = 1.25; ctx.lineJoin = 'miter'; ctx.strokeRect(bx, by, bw, bhh);
    ctx.beginPath();
    const X = () => { ctx.moveTo(bx, by); ctx.lineTo(bx + bw, by + bhh); ctx.moveTo(bx + bw, by); ctx.lineTo(bx, by + bhh); };
    switch (type) {
      case 'inf': X(); ctx.stroke(); break;
      case 'grd': X(); ctx.stroke(); ctx.beginPath(); ctx.arc(bx + bw / 2, by + bhh / 2, 2.2, 0, 7); ctx.fill(); break;
      case 'cav': ctx.moveTo(bx, by + bhh); ctx.lineTo(bx + bw, by); ctx.stroke(); break;
      case 'arm': ctx.ellipse(bx + bw / 2, by + bhh / 2, bw / 2 - 3, bhh / 2 - 2.6, 0, 0, 7); ctx.stroke(); break;
      case 'mot': X(); ctx.stroke(); ctx.beginPath(); ctx.arc(bx + bw / 2 - 3.5, by + bhh + 1.6, 1.3, 0, 7); ctx.arc(bx + bw / 2 + 3.5, by + bhh + 1.6, 1.3, 0, 7); ctx.fill(); break;
      case 'art': ctx.arc(bx + bw / 2, by + bhh / 2, 2.8, 0, 7); ctx.fill(); break;
      case 'mtn': X(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(bx + bw / 2 - 3.2, by + bhh); ctx.lineTo(bx + bw / 2, by + bhh - 4.5); ctx.lineTo(bx + bw / 2 + 3.2, by + bhh); ctx.closePath(); ctx.fill(); break;
      case 'mar': X(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(bx + 2, by + bhh / 2); ctx.bezierCurveTo(bx + bw * 0.3, by + bhh / 2 - 4, bx + bw * 0.4, by + bhh / 2 + 4, bx + bw / 2, by + bhh / 2); ctx.bezierCurveTo(bx + bw * 0.6, by + bhh / 2 - 4, bx + bw * 0.7, by + bhh / 2 + 4, bx + bw - 2, by + bhh / 2); ctx.stroke(); break;
      case 'ship': ctx.moveTo(bx + 2, by + bhh / 2); ctx.lineTo(bx + bw - 2, by + bhh / 2); ctx.lineTo(bx + bw - 5, by + bhh - 2); ctx.lineTo(bx + 5, by + bhh - 2); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(bx + bw / 2, by + bhh / 2); ctx.lineTo(bx + bw / 2, by + 1.5); ctx.lineTo(bx + bw / 2 + 4, by + 4); ctx.stroke(); break;
      case 'air': ctx.moveTo(bx + bw / 2, by + 1.5); ctx.lineTo(bx + bw / 2, by + bhh - 1.5); ctx.moveTo(bx + 3, by + bhh / 2 + 1); ctx.lineTo(bx + bw / 2, by + bhh / 2 - 2); ctx.lineTo(bx + bw - 3, by + bhh / 2 + 1); ctx.stroke(); break;
    }
    if (rank > 1) { ctx.fillStyle = '#f2cf6b'; for (let i = 0; i < Math.min(4, rank - 1); i++) { ctx.beginPath(); ctx.arc(-W / 2 + 12 + i * 4.2, -H / 2 - 0.2, 1.5, 0, 7); ctx.fill(); } }
    if (n > 1) { ctx.fillStyle = '#10161a'; ctx.beginPath(); ctx.roundRect(W / 2 - 9, H / 2 - 6, 13, 10, 3); ctx.fill(); ctx.fillStyle = '#f6f3e8'; ctx.font = '700 8px system-ui,sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(n), W / 2 - 2.5, H / 2 - 0.7); }
    if (tag) {
      ctx.font = '650 8px -apple-system,BlinkMacSystemFont,"SF Pro Text","Inter","Segoe UI",Roboto,sans-serif'; const tw = ctx.measureText(tag.text).width + 9;
      ctx.fillStyle = 'rgba(12,15,18,0.88)'; ctx.beginPath(); ctx.roundRect(-tw / 2, -H / 2 - 15, tw, 11.5, 5.75); ctx.fill();
      ctx.fillStyle = tag.color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(tag.text, 0, -H / 2 - 9);
    }
    ctx.restore();
  }

  _slots(ids, n) { // pick n spread-out provinces along the line
    const P = this.map.provinces; const teh = P[this.map.tehran].c;
    const sorted = ids.slice().sort((a, b) => Math.atan2(P[a].c[1] - teh[1], P[a].c[0] - teh[0]) - Math.atan2(P[b].c[1] - teh[1], P[b].c[0] - teh[0]));
    // rotate so the largest angular gap is at the ends
    let gi = 0, gmax = -1; for (let i = 0; i < sorted.length; i++) { const a = P[sorted[i]].c, b = P[sorted[(i + 1) % sorted.length]].c; const d = Math.hypot(a[0] - b[0], a[1] - b[1]); if (d > gmax) { gmax = d; gi = i; } }
    const rot = [...sorted.slice(gi + 1), ...sorted.slice(0, gi + 1)];
    const out = []; n = Math.min(n, rot.length);
    for (let i = 0; i < n; i++) out.push(rot[Math.floor(((i + 0.5) * rot.length) / n)]);
    return out;
  }

  _units(px) {
    const { ctx, map: m, st, view: v } = this; const P = m.provinces;
    const spread = v.s > 0.62; const cs = px * Math.max(0.82, Math.min(1.25, 0.75 + v.s * 0.35));
    const place = (x, y, opts, data) => {
      this.counter(ctx, x, y, cs, opts);
      const [sx, sy] = this.toScreen(x, y); const w = 38 * cs * v.s, h = (opts.tag ? 42 : 26) * cs * v.s;
      this.hits.push({ x: sx - w / 2, y: sy - h + 13 * cs * v.s, w, h, data });
    };
    for (const f of m.fronts) {
      if (this.off.includes(f.id)) continue;
      const L = st.lines[f.id]; const fr = st.fronts[f.id];
      const en = m.countries[f.enemy]; const ecol = rgb(shade(en.rgb, -0.25));
      // enemy
      const eN = Math.max(2, Math.round(2 + fr.enemyStr / 30 + Math.max(0, fr.pos) / 25));
      const eslots = L.theirs.length ? this._slots(L.theirs, spread ? Math.min(eN, 4) : 1) : [];
      eslots.forEach((id, i) => { const c = P[id].c; const cnt = Math.ceil(eN / eslots.length); place(c[0], c[1], { type: fr.enemyArmor > 0.5 && i === 0 ? 'arm' : f.naval ? 'ship' : 'inf', n: cnt, str: Math.min(100, fr.enemyStr * 0.8), org: Math.min(100, fr.enemyStr * 0.75), enemy: true, color: ecol }, { kind: 'front', id: f.id }); });
      // ours
      const divs = st.divisions.filter(d => d.front === f.id);
      const slots = this._slots(L.ours, spread ? divs.length : 1);
      const groups = slots.map(() => []); divs.forEach((d, i) => groups[i % slots.length].push(d));
      const label = (this.labels[f.id] || f.defaultLabel).toUpperCase() + (st.focus === f.id ? ' ★' : '');
      slots.forEach((id, i) => {
        const g = groups[i]; if (!g.length) return; const c = P[id].c; const lead = g.slice().sort((a, b) => (b.type === 'arm') - (a.type === 'arm') || b.xp - a.xp)[0];
        const avg = k => g.reduce((a, d) => a + d[k], 0) / g.length;
        const mid = i === Math.floor(slots.length / 2);
        place(c[0], c[1], { type: lead.type, n: g.length, str: avg('str'), org: avg('org'), color: '#2c6557', rank: Math.max(...g.map(d => RANK(d.xp))), tag: mid ? { text: label, color: FRONT_COLORS[f.id] } : null }, { kind: 'front', id: f.id });
      });
    }
    // garrison
    const guard = st.divisions.filter(d => !d.front); const t = P[m.tehran].city;
    if (guard.length && !st.tehranFallen) place(t[0] - 4 * px, t[1] - 22 * px, { type: 'grd', n: guard.length, color: '#7a5c22', rank: 3 }, { kind: 'province', id: m.tehran });
    // fleets and air wings
    const at = n => this.meta.byName[n];
    const seaPos = { south: this.proj(50.4, 28.3), north: this.proj(50.6, 38.3) };
    for (const fl of st.fleets) { const [x, y] = seaPos[fl.id]; const hp = fl.ships.reduce((a, s) => a + s.hp, 0) / fl.ships.length; place(x, y, { type: 'ship', n: fl.ships.length, str: hp, org: hp, color: '#28587a', tag: v.s > 0.5 ? { text: fl.name.toUpperCase(), color: '#9cc8ea' } : null }, { kind: 'fleet', id: fl.id }); }
    const es = this.proj(56.9, 25.6); const g = st.fronts.glf; place(es[0], es[1], { type: 'ship', n: Math.max(2, Math.round(6 - g.sea / 25)), str: 90, org: 90, enemy: true, color: rgb(shade(m.countries.GBR.rgb, -0.25)) }, { kind: 'front', id: 'glf' });
    if (v.s > 0.5 || this.mode === 'air') for (const w of st.wings) { const p = at(w.base); if (!p) continue; const k = st.wings.filter(x => x.base === w.base).indexOf(w); place(p.city[0] + 26 * px + k * 6 * px, p.city[1] - 20 * px - k * 5 * px, { type: 'air', n: 1, str: (w.planes / w.max) * 100, org: 100, color: '#4a5f8a' }, { kind: 'wing', id: w.id }); }
  }

  // ---------------- animated overlay ----------------
  drawOverlay(now) {
    const { octx: ctx, map: m, st, view: v } = this; const P = m.provinces; const k = this.dpr * v.s;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, this.over.width, this.over.height);
    ctx.setTransform(k, 0, 0, k, -v.x * k, -v.y * k); const px = 1 / v.s; const t = now / 1000;
    for (const f of m.fronts) {
      const fr = st.fronts[f.id]; if (this.off.includes(f.id) || !fr.last || st.now - fr.last.t > 3 * DAY || fr.last.side === 'neutral') continue;
      const L = st.lines[f.id]; const mean = ids => { let x = 0, y = 0; for (const id of ids) { x += P[id].c[0]; y += P[id].c[1]; } return [x / ids.length, y / ids.length]; };
      const win = fr.last.side === 'win'; const A = ACTIONS[fr.last.action];
      // pick the contact point nearest to Tehran for losses / deepest for wins
      if (!L.theirs.length) continue;
      let o = mean(L.ours), e = mean(L.theirs);
      let best = null; for (const a of L.ours) for (const b of P[a].adj) if (L.theirs.includes(b)) { const d = Math.hypot(P[a].c[0] - o[0], P[a].c[1] - o[1]); if (!best || d < best.d) best = { d, a, b }; }
      if (best) { o = P[best.a].c; e = P[best.b].c; }
      const from = win ? o : e, to = win ? e : o; let dx = to[0] - from[0], dy = to[1] - from[1]; const len = Math.hypot(dx, dy) || 1; dx /= len; dy /= len;
      const col = win ? [110, 235, 200] : [255, 80, 60];
      if (A.adv >= 0.5) {
        const Lg = Math.max(46 * px, 34 + fr.last.sev * 12), wd = (5 + fr.last.sev * 1.6) * Math.max(px, 0.8);
        const sx = from[0] - dx * Lg * 0.35, sy = from[1] - dy * Lg * 0.35; const ph = (t * 0.6) % 1; const grow = 0.75 + 0.25 * Math.sin(t * 2.2);
        const ex = sx + dx * Lg * grow, ey = sy + dy * Lg * grow; const nx = -dy, ny = dx;
        ctx.beginPath(); ctx.moveTo(sx + nx * wd * 0.5, sy + ny * wd * 0.5); ctx.lineTo(ex - dx * wd * 1.6 + nx * wd * 0.5, ey - dy * wd * 1.6 + ny * wd * 0.5); ctx.lineTo(ex - dx * wd * 1.6 + nx * wd * 1.2, ey - dy * wd * 1.6 + ny * wd * 1.2);
        ctx.lineTo(ex, ey); ctx.lineTo(ex - dx * wd * 1.6 - nx * wd * 1.2, ey - dy * wd * 1.6 - ny * wd * 1.2); ctx.lineTo(ex - dx * wd * 1.6 - nx * wd * 0.5, ey - dy * wd * 1.6 - ny * wd * 0.5); ctx.lineTo(sx - nx * wd * 0.5, sy - ny * wd * 0.5); ctx.closePath();
        const gr = ctx.createLinearGradient(sx, sy, ex, ey); gr.addColorStop(0, rgb(col, 0.05)); gr.addColorStop(Math.max(0.05, ph * 0.8), rgb(col, 0.55)); gr.addColorStop(1, rgb(col, 0.9));
        ctx.fillStyle = gr; ctx.fill(); ctx.strokeStyle = 'rgba(10,12,14,0.8)'; ctx.lineWidth = 1.2 * px; ctx.stroke();
      }
      // battle marker
      const bx = (o[0] + e[0]) / 2, by = (o[1] + e[1]) / 2; const r = 10.5 * px; const pulse = (t * 0.9) % 1;
      ctx.beginPath(); ctx.arc(bx, by, r + pulse * 14 * px, 0, 7); ctx.strokeStyle = rgb(col, 0.6 * (1 - pulse)); ctx.lineWidth = 2 * px; ctx.stroke();
      ctx.beginPath(); ctx.arc(bx, by, r, 0, 7); ctx.fillStyle = win ? '#2f9e6a' : '#c23b2b'; ctx.fill(); ctx.strokeStyle = '#0c1014'; ctx.lineWidth = 1.6 * px; ctx.stroke();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5 * px; ctx.lineCap = 'round'; ctx.beginPath();
      const ic = A.icon;
      if (ic === 'bomb' || ic === 'air') { ctx.moveTo(bx, by - 5 * px); ctx.lineTo(bx, by + 5 * px); ctx.moveTo(bx - 5 * px, by + 0.5 * px); ctx.lineTo(bx, by - 2 * px); ctx.lineTo(bx + 5 * px, by + 0.5 * px); }
      else if (ic === 'naval') { ctx.moveTo(bx, by - 5 * px); ctx.lineTo(bx, by + 4.5 * px); ctx.moveTo(bx - 4 * px, by + 1.5 * px); ctx.quadraticCurveTo(bx, by + 7 * px, bx + 4 * px, by + 1.5 * px); ctx.moveTo(bx - 2.5 * px, by - 2.5 * px); ctx.lineTo(bx + 2.5 * px, by - 2.5 * px); }
      else { ctx.moveTo(bx - 4.5 * px, by - 4.5 * px); ctx.lineTo(bx + 4.5 * px, by + 4.5 * px); ctx.moveTo(bx + 4.5 * px, by - 4.5 * px); ctx.lineTo(bx - 4.5 * px, by + 4.5 * px); }
      ctx.stroke();
      this.hits = this.hits.filter(h => h.data.battle !== f.id);
      const [sx2, sy2] = this.toScreen(bx, by); this.hits.push({ x: sx2 - 16, y: sy2 - 16, w: 32, h: 32, data: { kind: 'front', id: f.id, battle: f.id } });
    }
    // operation objectives
    for (const pin of this.pins) {
      const p = P[pin.prov]; const c = p.city || p.c; const x = c[0], y = c[1]; const bob = Math.sin(t * 2 + pin.prov) * 1.5 * px;
      ctx.strokeStyle = '#0c1014'; ctx.lineWidth = 3 * px; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - 22 * px + bob); ctx.stroke();
      ctx.strokeStyle = '#f1ede4'; ctx.lineWidth = 1.5 * px; ctx.stroke();
      ctx.fillStyle = pin.done ? '#5bbf8a' : pin.failed ? '#8a8f94' : '#e3b85c'; ctx.strokeStyle = '#0c1014'; ctx.lineWidth = px;
      ctx.beginPath(); ctx.moveTo(x, y - 22 * px + bob); ctx.lineTo(x + 13 * px, y - 18 * px + bob); ctx.lineTo(x, y - 13.5 * px + bob); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    // fires on damaged buildings
    for (const b of this.meta.buildings) {
      const d = st.bld[b.id].dmg; if (d < 0.25) continue; const p = P[b.prov]; const fl = 0.6 + 0.4 * Math.sin(t * 9 + b.prov);
      const x = p.city[0], y = p.city[1] - 3 * px; const s = px * (4 + d * 5);
      ctx.fillStyle = `rgba(40,40,44,${0.35 * fl})`; ctx.beginPath(); ctx.arc(x + Math.sin(t + b.prov) * 2 * px, y - s * 2.2, s * 1.1, 0, 7); ctx.fill();
      ctx.fillStyle = `rgba(255,${120 + 60 * fl | 0},40,0.9)`; ctx.beginPath(); ctx.moveTo(x - s * 0.6, y); ctx.quadraticCurveTo(x - s * 0.8, y - s, x, y - s * (1.6 + 0.4 * fl)); ctx.quadraticCurveTo(x + s * 0.8, y - s, x + s * 0.6, y); ctx.closePath(); ctx.fill();
    }
    // Tehran threat ring
    if (st.terr.threat && st.terr.threat.km < 300 && !st.tehranFallen) { const c = P[m.tehran].city; const pulse = (t * 0.7) % 1; ctx.beginPath(); ctx.arc(c[0], c[1], (10 + pulse * 26) * px, 0, 7); ctx.strokeStyle = `rgba(255,80,60,${0.8 * (1 - pulse)})`; ctx.lineWidth = 2.2 * px; ctx.stroke(); }
  }
}
MapView.prototype.snapshot = function (lines = []) {
  const c = document.createElement('canvas'); const d = this.dpr; const foot = (34 + lines.length * 19) * d;
  c.width = this.base.width; c.height = this.base.height + foot; const x = c.getContext('2d');
  x.drawImage(this.base, 0, 0); x.drawImage(this.over, 0, 0);
  x.fillStyle = '#0e1113'; x.fillRect(0, this.base.height, c.width, foot);
  x.fillStyle = '#e8e6e1'; x.textBaseline = 'top';
  lines.forEach((l, i) => { x.font = `${i ? 500 : 700} ${(i ? 13 : 15) * d}px -apple-system,system-ui,sans-serif`; x.fillStyle = i ? '#9aa0a5' : '#e8e6e1'; x.fillText(l, 16 * d, this.base.height + (14 + i * 19) * d); });
  return c;
};
function RANK(xp) { return xp >= 300 ? 5 : xp >= 180 ? 4 : xp >= 100 ? 3 : xp >= 50 ? 2 : xp >= 20 ? 1 : 0; }
export { statusOf };
