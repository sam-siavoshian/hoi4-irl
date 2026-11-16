// Share images: bulletin, newspaper front page, weekly recap, promotion card.
// Pure canvas 2D. No dependencies, no network, no external fonts. Every renderer is synchronous, takes plain data
// and returns a canvas at a fixed pixel size (devicePixelRatio is ignored on purpose: these are export images).
// Each canvas carries `_textBoxes`: [{ role, text, x, y, w, h, clipped }] for every piece of text drawn (used by tests).

export const SERIF = '"Iowan Old Style","Palatino Linotype","Palatino","Book Antiqua","Georgia","Times New Roman",serif';
export const SANS = '-apple-system,BlinkMacSystemFont,"SF Pro Display","Inter Display","Inter","Segoe UI",system-ui,sans-serif';

const C = {
  bg: '#0b0e10', surface: '#14181b', raised: '#1b2024', line: 'rgba(255,255,255,.08)', lineStrong: 'rgba(255,255,255,.16)',
  text: '#eceae5', text2: '#a2a7ab', text3: '#6d7377', accent: '#e3b85c', good: '#5bbf8a', bad: '#e5604d', sea: '#0b1218',
};
const TONE = { good: { c: C.good, word: 'Advance' }, bad: { c: C.bad, word: 'Setback' }, gold: { c: C.accent, word: 'Triumph' }, none: { c: C.accent, word: 'Bulletin' } };
const toneOf = t => TONE[t] || TONE.none;

/* ───────────────────────── small utilities ───────────────────────── */
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const hex = h => { const s = h.replace('#', ''); const f = s.length === 3 ? s.split('').map(ch => ch + ch).join('') : s; return [parseInt(f.slice(0, 2), 16), parseInt(f.slice(2, 4), 16), parseInt(f.slice(4, 6), 16)]; };
const rgba = (h, a = 1) => { const c = hex(h); return `rgba(${c[0]},${c[1]},${c[2]},${a})`; };
const rng = seed => { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
const str = v => (v == null ? '' : String(v));
const num = v => (Number.isFinite(Number(v)) ? Number(v) : 0);
const list = v => (Array.isArray(v) ? v.filter(x => x != null && x !== '') : []);
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const asDate = v => { const d = v instanceof Date ? v : new Date(v == null ? Date.now() : v); return Number.isNaN(d.getTime()) ? new Date() : d; };
const longDate = v => { const d = asDate(v); return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`; };
const fullDate = v => `${DAYS[asDate(v).getDay()]}, ${longDate(v)}`;

/** Solar Hijri date, e.g. "25 Aban 1405". Empty string when the runtime has no Persian calendar. */
export function persianDate(v) {
  try {
    const parts = new Intl.DateTimeFormat('en-u-ca-persian', { day: 'numeric', month: 'long', year: 'numeric' }).formatToParts(asDate(v));
    const g = t => parts.find(p => p.type === t)?.value; const y = g('year');
    return g('day') && g('month') && y && Number(y) < 1700 ? `${g('day')} ${g('month')} ${y}` : '';
  } catch { return ''; }
}

function mk(w, h) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; c._textBoxes = [];
  const x = c.getContext('2d'); x.textBaseline = 'alphabetic'; x.textAlign = 'left'; x.lineJoin = 'round';
  return c;
}
function rr(ctx, x, y, w, h, r) {
  r = Math.max(0, Math.min(r, w / 2, h / 2)); ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
const fillRR = (ctx, x, y, w, h, r, col) => { rr(ctx, x, y, w, h, r); ctx.fillStyle = col; ctx.fill(); };
const hline = (ctx, x0, x1, y, col, lw = 1) => { ctx.fillStyle = col; ctx.fillRect(x0, y - lw / 2, x1 - x0, lw); };
const vline = (ctx, x, y0, y1, col, lw = 1) => { ctx.fillStyle = col; ctx.fillRect(x - lw / 2, y0, lw, y1 - y0); };
const imgSize = img => [img.videoWidth || img.naturalWidth || img.width || 0, img.videoHeight || img.naturalHeight || img.height || 0];
function cover(ctx, img, x, y, w, h, fx = 0.5, fy = 0.5) {
  const [iw, ih] = imgSize(img); if (!iw || !ih) return false;
  const s = Math.max(w / iw, h / ih), sw = w / s, sh = h / s;
  try { ctx.drawImage(img, clamp((iw - sw) * fx, 0, iw - sw), clamp((ih - sh) * fy, 0, ih - sh), sw, sh, x, y, w, h); return true; } catch { return false; }
}

/* ───────────────────────── text engine ───────────────────────── */
const HAS_LS = typeof CanvasRenderingContext2D !== 'undefined' && 'letterSpacing' in CanvasRenderingContext2D.prototype;
const fontStr = o => `${o.italic ? 'italic ' : ''}${o.weight || 400} ${o.size}px ${o.family || SANS}`;
function setFont(ctx, o) { ctx.font = fontStr(o); if (HAS_LS) ctx.letterSpacing = `${o.tracking || 0}px`; }
// Width of `text` in the style `o` (font must already be set with setFont). Tracking is counted between glyphs only.
function mw(ctx, text, o) {
  const n = Array.from(text).length; if (!n) return 0;
  let w = ctx.measureText(text).width; const tr = o.tracking || 0;
  if (tr) w += HAS_LS ? -tr : tr * (n - 1);
  return w * (o.sx || 1);
}
function ellipsizeWith(measure, text, maxWidth) {
  if (measure(text) <= maxWidth) return text;
  const chars = Array.from(text); let lo = 0, hi = chars.length;
  while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (measure(chars.slice(0, mid).join('').trimEnd() + '…') <= maxWidth) lo = mid; else hi = mid - 1; }
  return lo ? chars.slice(0, lo).join('').replace(/[\s,;:.\-–—·]+$/, '') + '…' : '…';
}
function wrapWith(measure, text, maxWidth) {
  const out = [];
  for (const para of str(text).split(/\n/)) {
    const words = para.trim().split(/\s+/).filter(Boolean); let line = '';
    for (let word of words) {
      const trial = line ? line + ' ' + word : word;
      if (measure(trial) <= maxWidth) { line = trial; continue; }
      if (line) { out.push(line); line = ''; }
      // a single word wider than the line: break it by characters (no hyphen is added)
      while (measure(word) > maxWidth && Array.from(word).length > 1) {
        const chars = Array.from(word); let k = chars.length - 1;
        while (k > 1 && measure(chars.slice(0, k).join('')) > maxWidth) k--;
        out.push(chars.slice(0, k).join('')); word = chars.slice(k).join('');
      }
      line = word;
    }
    if (line) out.push(line);
  }
  return out;
}

/** Greedy word wrap using the context's current font. Never hyphenates; over-long words are split by character. */
export function wrapLines(ctx, text, maxWidth) { return wrapWith(s => ctx.measureText(s).width, text, maxWidth); }

/** Largest font size in [minSize, maxSize] at which `text` fits `maxWidth` on one line, keeping the context's current
 *  weight and family. Leaves ctx.font at the returned size. Returns minSize when even that is too wide. */
export function fitText(ctx, text, maxWidth, maxSize, minSize = 8) {
  const withSize = s => ctx.font.replace(/(\d+(?:\.\d+)?)px/, `${s}px`);
  ctx.font = withSize(maxSize); const w = ctx.measureText(str(text)).width;
  let size = w <= maxWidth || !w ? maxSize : Math.max(minSize, Math.floor((maxSize * maxWidth / w) * 2) / 2);
  ctx.font = withSize(size);
  while (size > minSize && ctx.measureText(str(text)).width > maxWidth) { size = Math.max(minSize, size - 0.5); ctx.font = withSize(size); }
  return size;
}

// Fit a block of text: the largest size at which it wraps into <= maxLines (and maxHeight). At minSize the text is cut
// to maxLines with an ellipsis. Lines are balanced so a headline does not leave one orphan word.
function fitBlock(ctx, text, o) {
  const { maxWidth, maxSize, minSize = maxSize, maxLines = 3, lh = 1.1, maxHeight = Infinity, balance = true } = o;
  const style = s => ({ ...o, size: s, tracking: typeof o.trackEm === 'number' ? o.trackEm * s : o.tracking });
  let size = maxSize, lines = [], st = style(size), clipped = false;
  const m = s => mw(ctx, s, st);
  for (;;) {
    st = style(size); setFont(ctx, st); lines = wrapWith(m, text, maxWidth);
    const ok = lines.length <= maxLines && lines.length * size * lh <= maxHeight && lines.every(l => m(l) <= maxWidth);
    if (ok || size <= minSize) break;
    size = Math.max(minSize, Math.floor(size * 0.955));
  }
  let cap = maxLines; while (cap > 1 && cap * size * lh > maxHeight) cap--;
  if (lines.length > cap) { clipped = true; const rest = lines.slice(cap - 1).join(' '); lines = lines.slice(0, cap - 1).concat(ellipsizeWith(m, rest, maxWidth)); }
  else if (lines.some(l => m(l) > maxWidth)) { clipped = true; lines = lines.map(l => ellipsizeWith(m, l, maxWidth)); }
  else if (balance && lines.length > 1) {
    const n = lines.length; let lo = maxWidth * 0.45, hi = maxWidth;
    for (let i = 0; i < 12; i++) { const mid = (lo + hi) / 2; const t = wrapWith(m, text, mid); if (t.length <= n && t.every(l => m(l) <= mid)) hi = mid; else lo = mid; }
    const t = wrapWith(m, text, hi); if (t.length === n) lines = t;
  }
  return { size, lines, style: st, clipped, height: lines.length * size * lh, width: Math.max(0, ...lines.map(m)) };
}

// Draw one line of text. o: { size, weight, family, italic, color, align, tracking, sx, maxWidth, role, box:[asc,desc], alpha }
function draw(cv, text, x, y, o) {
  const ctx = cv.getContext('2d'); let s = str(text); setFont(ctx, o); let clipped = !!o.clipped;
  if (o.maxWidth) { const t = ellipsizeWith(q => mw(ctx, q, o), s, o.maxWidth); if (t !== s) { clipped = true; s = t; } }
  const w = mw(ctx, s, o), left = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x, sx = o.sx || 1;
  ctx.save(); ctx.fillStyle = o.color || C.text; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; if (o.alpha != null) ctx.globalAlpha = o.alpha;
  if (o.shadow) { ctx.shadowColor = o.shadow[0]; ctx.shadowBlur = o.shadow[1]; ctx.shadowOffsetY = o.shadow[2] || 0; }
  ctx.translate(left, y); if (sx !== 1) ctx.scale(sx, 1);
  if (HAS_LS || !o.tracking) ctx.fillText(s, 0, 0);
  else { let cx = 0; for (const ch of Array.from(s)) { ctx.fillText(ch, cx, 0); cx += ctx.measureText(ch).width + o.tracking; } }
  ctx.restore(); if (HAS_LS) ctx.letterSpacing = '0px';
  const [asc, desc] = o.box || [0.78, 0.22];
  if (s && !o.silent) cv._textBoxes.push({ role: o.role || 'text', text: s, x: left, y: y - o.size * asc, w, h: o.size * (asc + desc), clipped });
  return w;
}
// Draw a fitted block; `y` is the baseline of the first line. Returns the baseline of the last line.
function drawBlock(cv, blk, x, y, o) {
  const lh = (o.lh || 1.1) * blk.size;
  blk.lines.forEach((l, i) => draw(cv, l, x, y + i * lh, { ...o, ...blk.style, maxWidth: 0, clipped: blk.clipped && i === blk.lines.length - 1 }));
  return y + (blk.lines.length - 1) * lh;
}
const curly = s => str(s).replace(/(^|[\s(\[“])'/g, '$1‘').replace(/'/g, '’').replace(/(^|[\s(\[])"/g, '$1“').replace(/"/g, '”');
const caps = s => str(s).toUpperCase();
const LABEL = (size, color = C.text3, extra = {}) => ({ size, weight: 600, tracking: size * 0.14, color, ...extra });

/* ───────────────────────── shared drawing ───────────────────────── */
let grainTile = null;
function grain(ctx, w, h, alpha = 0.05) {
  if (!grainTile) {
    grainTile = document.createElement('canvas'); grainTile.width = grainTile.height = 256;
    const g = grainTile.getContext('2d'), im = g.createImageData(256, 256), r = rng(7);
    for (let i = 0; i < im.data.length; i += 4) { const v = (r() * 255) | 0; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; }
    g.putImageData(im, 0, 0);
  }
  ctx.save(); ctx.globalAlpha = alpha; ctx.globalCompositeOperation = 'overlay'; ctx.fillStyle = ctx.createPattern(grainTile, 'repeat'); ctx.fillRect(0, 0, w, h); ctx.restore();
}
const FLAME = 'M13.2 1.6c.5 3.2-1.2 5-2.9 6.9C8.5 10.5 6.4 12.6 6.4 16a5.9 5.9 0 0 0 11.8 0c0-2.3-.9-4-2.1-5.6-.4 1.5-1.3 2.4-2.6 2.7 1.2-3.4.9-8-0.3-11.5z';
function flame(ctx, x, y, size, color = '#f0913c') {
  ctx.save(); ctx.translate(x, y); ctx.scale(size / 24, size / 24); ctx.fillStyle = color; ctx.fill(new Path2D(FLAME));
  ctx.fillStyle = 'rgba(255,236,170,.9)'; ctx.translate(12.3, 17.4); ctx.scale(0.42, 0.42); ctx.translate(-12.3, -17.4); ctx.fill(new Path2D(FLAME)); ctx.restore();
}
function chevrons(ctx, cx, cy, w, color, n = 3, lw = w * 0.14) {
  ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.lineCap = 'butt'; ctx.lineJoin = 'miter';
  const step = lw * 1.9, top = cy - ((n - 1) * step) / 2 - w * 0.16;
  for (let i = 0; i < n; i++) { const y = top + i * step; ctx.beginPath(); ctx.moveTo(cx - w / 2, y + w * 0.32); ctx.lineTo(cx, y); ctx.lineTo(cx + w / 2, y + w * 0.32); ctx.stroke(); }
  ctx.restore();
}
function starPath(ctx, cx, cy, R, r, n = 5, rot = -Math.PI / 2) {
  ctx.beginPath(); for (let i = 0; i < n * 2; i++) { const a = rot + (i * Math.PI) / n, q = i % 2 ? r : R; ctx[i ? 'lineTo' : 'moveTo'](cx + Math.cos(a) * q, cy + Math.sin(a) * q); } ctx.closePath();
}
function tri(ctx, cx, cy, s, up, color) { ctx.beginPath(); const k = up ? -1 : 1; ctx.moveTo(cx, cy + k * s * 0.6); ctx.lineTo(cx - s * 0.62, cy - k * s * 0.5); ctx.lineTo(cx + s * 0.62, cy - k * s * 0.5); ctx.closePath(); ctx.fillStyle = color; ctx.fill(); }
// A 512×512 icon path (Game-icons) centred on cx,cy in a box of `size`.
function icon(ctx, path, cx, cy, size, fill) {
  if (!path) return false;
  try { const p = new Path2D(path); ctx.save(); ctx.translate(cx - size / 2, cy - size / 2); ctx.scale(size / 512, size / 512); ctx.fillStyle = fill; ctx.fill(p); ctx.restore(); return true; } catch { return false; }
}
// The wordmark: a small sun-star and ARTESH in wide tracking. Returns its width.
function wordmark(cv, x, y, size, color = C.accent, align = 'left', role = 'wordmark') {
  const ctx = cv.getContext('2d'), o = { size, weight: 800, tracking: size * 0.3, color, role };
  setFont(ctx, o); const tw = mw(ctx, 'ARTESH', o), mark = size * 0.86, gap = size * 0.5, total = mark + gap + tw;
  const left = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
  starPath(ctx, left + mark / 2, y - size * 0.36, mark / 2, mark * 0.2, 8); ctx.fillStyle = color; ctx.fill();
  draw(cv, 'ARTESH', left + mark + gap, y, o); return total;
}
// The app's centre-zero front bar. pos > 0: enemy inside the country, red from centre toward the capital (left).
// pos < 0: we are advancing, green from centre toward the objective (right).
function frontBar(ctx, x, y, w, h, pos, track = C.raised) {
  const p = clamp(num(pos), -100, 100), mid = x + w / 2, len = (Math.abs(p) / 100) * (w / 2);
  fillRR(ctx, x, y - h / 2, w, h, h / 2, track);
  if (len > 0.5) { const col = p > 0 ? C.bad : C.good, fx = p > 0 ? mid - len : mid; fillRR(ctx, fx, y - h / 2, Math.max(len, h), h, h / 2, col); if (p > 0) ctx.fillRect(mid - Math.min(len, h / 2), y - h / 2, Math.min(len, h / 2), h); else ctx.fillRect(mid, y - h / 2, Math.min(len, h / 2), h); }
  ctx.fillStyle = '#c9cdd0'; ctx.fillRect(mid - 1.5, y - h / 2 - 5, 3, h + 10);
}
// A stand-in when no map image is supplied: a staff-map plate with graticule, range rings and a tone glow.
function plate(ctx, x, y, w, h, tone, fy = 0.46) {
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  ctx.fillStyle = '#0c1318'; ctx.fillRect(x, y, w, h);
  const cx = x + w * 0.5, cy = y + h * fy, u = Math.min(w, h * 1.3) / 1080, g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.62);
  g.addColorStop(0, rgba(tone, 0.3)); g.addColorStop(0.5, rgba(tone, 0.08)); g.addColorStop(1, rgba(tone, 0)); ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(255,255,255,.05)'; ctx.lineWidth = 1; ctx.beginPath(); const step = 72 * u;
  for (let gx = cx % step; gx < x + w; gx += step) { ctx.moveTo(gx + 0.5, y); ctx.lineTo(gx + 0.5, y + h); }
  for (let gy = cy % step; gy < y + h; gy += step) { ctx.moveTo(x, gy + 0.5); ctx.lineTo(x + w, gy + 0.5); } ctx.stroke();
  for (let i = 1; i <= 7; i++) { ctx.beginPath(); ctx.arc(cx, cy, i * 105 * u, 0, Math.PI * 2); ctx.strokeStyle = rgba(tone, i % 2 ? 0.26 : 0.14); ctx.lineWidth = (i % 2 ? 2 : 1.5) * u; ctx.setLineDash(i % 2 ? [] : [5 * u, 11 * u]); ctx.stroke(); }
  ctx.setLineDash([]);
  // a front line with our counters behind it and theirs in front
  const r = rng(41), pts = []; for (let i = 0; i <= 14; i++) pts.push([cx + (190 + 70 * Math.sin(i * 1.3) + (r() - 0.5) * 60) * u, cy + (i - 7) * 78 * u]);
  ctx.beginPath(); pts.forEach((p, i) => { if (!i) ctx.moveTo(p[0], p[1]); else { const q = pts[i - 1]; ctx.quadraticCurveTo(q[0], q[1], (q[0] + p[0]) / 2, (q[1] + p[1]) / 2); } });
  ctx.strokeStyle = rgba(tone, 0.85); ctx.lineWidth = 5 * u; ctx.lineCap = 'round'; ctx.stroke();
  const counter = (px, py, ours) => { const cw = 58 * u, chh = 38 * u; ctx.lineWidth = 2.5 * u; ctx.strokeStyle = ours ? rgba(tone, 0.9) : 'rgba(236,234,229,.42)'; ctx.fillStyle = ours ? rgba(tone, 0.16) : 'rgba(236,234,229,.05)'; ctx.beginPath(); ctx.rect(px - cw / 2, py - chh / 2, cw, chh); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(px - cw / 2, py - chh / 2); ctx.lineTo(px + cw / 2, py + chh / 2); ctx.moveTo(px + cw / 2, py - chh / 2); ctx.lineTo(px - cw / 2, py + chh / 2); ctx.lineWidth = 1.5 * u; ctx.stroke(); };
  for (const i of [3, 5, 7, 9, 11]) { counter(pts[i][0] - (70 + r() * 30) * u, pts[i][1], true); if (i !== 7) counter(pts[i][0] + (74 + r() * 40) * u, pts[i][1] + 20 * u, false); }
  starPath(ctx, cx, cy, 24 * u, 10 * u, 8); ctx.fillStyle = rgba(tone, 0.95); ctx.fill();
  ctx.beginPath(); ctx.arc(cx, cy, 40 * u, 0, Math.PI * 2); ctx.strokeStyle = rgba(tone, 0.6); ctx.lineWidth = 2 * u; ctx.stroke();
  ctx.restore();
}

/* ═════════════════════════ 1. Bulletin (1080 × 1350) ═════════════════════════ */
export function renderBulletin(d = {}) {
  const W = 1080, H = 1350, M = 60, cv = mk(W, H), ctx = cv.getContext('2d');
  const tone = toneOf(d.tone), tc = tone.c;
  const fronts = list(d.fronts).slice(0, 7), n = fronts.length;
  ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);

  // ── layout, bottom up ──
  const footY = 1298, stats = [];
  if (d.stability != null) stats.push('stability'); if (d.streak != null) stats.push('streak'); if (d.rank) stats.push('rank');
  const statsH = stats.length ? 100 : 0, statsTop = 1240 - statsH;
  const rowH = n ? clamp(Math.floor(280 / n), 40, 52) : 0, legendH = n ? 34 : 0;
  const frontsH = n * rowH + legendH, frontsTop = statsTop - (stats.length ? 26 : 0) - frontsH;
  const ruleY = (n ? frontsTop : statsTop) - 22;
  const sub = str(d.sub), subY = ruleY - 34;
  const headBottom = sub ? subY - 62 : ruleY - 44;
  const bar = 30, textW = W - M * 2 - bar;
  const head = fitBlock(ctx, str(d.headline) || 'All quiet on every front', { maxWidth: textW, maxSize: n > 4 ? 112 : 124, minSize: 60, maxLines: 3, lh: 1.03, maxHeight: n > 4 ? 270 : 320, weight: 700, family: SERIF, trackEm: -0.012 });
  const headLH = head.size * 1.03, headTop = headBottom - (head.lines.length - 1) * headLH - head.size * 0.8, kickY = headTop - 30;

  // ── map: runs down behind the headline; the focus point of the source sits in the middle of the clear area ──
  const mapH = clamp(Math.round(kickY + 110), 640, 1120), clearMid = (96 + kickY - 70) / 2;
  let drawn = false;
  if (d.map) {
    const [iw, ih] = imgSize(d.map);
    if (iw && ih) { const k = Math.max(W / iw, mapH / ih), sw = W / k, sh = mapH / k; try { ctx.drawImage(d.map, clamp(iw * (d.focus?.[0] ?? 0.5) - sw / 2, 0, iw - sw), clamp(ih * (d.focus?.[1] ?? 0.5) - clearMid / k, 0, ih - sh), sw, sh, 0, 0, W, mapH); drawn = true; } catch { /* unusable image: fall back to the plate */ } }
  }
  if (!drawn) plate(ctx, 0, 0, W, mapH, tc, clearMid / mapH);

  // vignette, tone edge glow, fade into the page
  let g = ctx.createRadialGradient(W / 2, mapH * 0.42, mapH * 0.25, W / 2, mapH * 0.42, W * 0.85);
  g.addColorStop(0, 'rgba(6,9,11,0)'); g.addColorStop(1, 'rgba(6,9,11,.6)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, mapH);
  ctx.save(); ctx.globalCompositeOperation = 'screen';
  for (const [x0, y0, x1, y1, a] of [[0, 0, 110, 0, 0.22], [W, 0, W - 110, 0, 0.22], [0, 0, 0, 170, 0.34]]) { g = ctx.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, rgba(tc, a)); g.addColorStop(1, rgba(tc, 0)); ctx.fillStyle = g; ctx.fillRect(0, 0, W, mapH); }
  ctx.restore();
  g = ctx.createLinearGradient(0, 0, 0, 190); g.addColorStop(0, 'rgba(8,11,13,.8)'); g.addColorStop(1, 'rgba(8,11,13,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, 190);
  const fadeTop = Math.max(120, kickY - 190), solid = Math.min(mapH, kickY + 70);
  g = ctx.createLinearGradient(0, fadeTop, 0, solid); g.addColorStop(0, 'rgba(11,14,16,0)'); g.addColorStop(0.6, 'rgba(11,14,16,.7)'); g.addColorStop(1, 'rgba(11,14,16,1)');
  ctx.fillStyle = g; ctx.fillRect(0, fadeTop, W, solid - fadeTop); ctx.fillStyle = C.bg; ctx.fillRect(0, solid - 1, W, H - solid + 1);
  g = ctx.createRadialGradient(M, headBottom - 60, 0, M, headBottom - 60, 620); g.addColorStop(0, rgba(tc, 0.1)); g.addColorStop(1, rgba(tc, 0)); ctx.fillStyle = g; ctx.fillRect(0, fadeTop, W, H - fadeTop);
  ctx.fillStyle = tc; ctx.fillRect(0, 0, W, 8);

  // ── top line ──
  const nation = caps(d.nation || 'Iran');
  const dw = draw(cv, longDate(d.date), W - M, 76, { size: 26, weight: 500, color: 'rgba(236,234,229,.82)', align: 'right', role: 'meta' });
  const nw = draw(cv, nation, M, 76, { size: 26, weight: 800, tracking: 5.5, color: C.text, role: 'meta', maxWidth: W - M * 2 - dw - 40 });
  if (W - M * 2 - dw - nw - 60 > 250) draw(cv, 'WAR BULLETIN', M + nw + 20, 76, { size: 26, weight: 500, tracking: 5.5, color: 'rgba(236,234,229,.62)', role: 'meta' });

  // ── headline block ──
  ctx.fillStyle = tc; ctx.fillRect(M, headTop + head.size * 0.1, 8, headBottom - headTop - head.size * 0.1 + (sub ? 62 : 6));
  const kick = caps(d.kicker || tone.word);
  ctx.beginPath(); ctx.arc(M + bar + 9, kickY - 9, 9, 0, Math.PI * 2); ctx.fillStyle = tc; ctx.fill();
  draw(cv, kick, M + bar + 32, kickY, { size: 25, weight: 800, tracking: 5, color: tc, role: 'kicker', maxWidth: textW - 40 });
  drawBlock(cv, head, M + bar, headTop + head.size * 0.8, { lh: 1.03, color: '#f6f3ec', role: 'headline', shadow: ['rgba(0,0,0,.55)', 24, 2], box: [0.76, 0.2] });
  if (sub) draw(cv, sub, M + bar, subY, { size: 33, weight: 500, color: C.text2, maxWidth: textW, role: 'sub' });

  // ── fronts ──
  if (n) {
    hline(ctx, M, W - M, ruleY, C.line, 2);
    const fs = Math.min(31, Math.round(rowH * 0.6)), bx = 384, bw = 316, labelW = bx - M - 30 - 28;
    draw(cv, '← CAPITAL', bx, frontsTop + 16, LABEL(16, C.text3, { role: 'legend' }));
    draw(cv, 'OBJECTIVE →', bx + bw, frontsTop + 16, LABEL(16, C.text3, { align: 'right', role: 'legend' }));
    fronts.forEach((f, i) => {
      const cy = frontsTop + legendH + i * rowH + rowH / 2, base = cy + fs * 0.34, p = num(f.pos);
      ctx.beginPath(); ctx.arc(M + 9, cy, 9, 0, Math.PI * 2); ctx.fillStyle = f.color || C.text2; ctx.fill();
      draw(cv, str(f.label) || '—', M + 30, base, { size: fs, weight: 600, color: C.text, maxWidth: labelW, role: 'front-label' });
      frontBar(ctx, bx, cy, bw, Math.round(rowH * 0.24), p);
      draw(cv, str(f.status), W - M, base, { size: Math.min(27, Math.round(fs * 0.86)), weight: 500, color: p > 12 ? '#ee8b7b' : p < -12 ? '#86d3a8' : C.text2, align: 'right', maxWidth: W - M - (bx + bw) - 26, role: 'front-status' });
    });
  }

  // ── stats ──
  if (stats.length) {
    hline(ctx, M, W - M, statsTop, C.line, 2);
    const colW = (W - M * 2) / stats.length, vy = statsTop + 86, ly = statsTop + 38;
    stats.forEach((k, i) => {
      const x = M + i * colW + (i ? 30 : 0), maxW = colW - (i ? 30 : 0) - 24;
      if (i) vline(ctx, M + i * colW, statsTop + 20, statsTop + statsH - 2, C.line, 2);
      if (k === 'stability') {
        const v = clamp(Math.round(num(d.stability)), 0, 100), col = v >= 60 ? C.good : v >= 35 ? '#dba24a' : C.bad;
        draw(cv, 'STABILITY', x, ly, LABEL(19, C.text3, { role: 'stat-label' }));
        const w = draw(cv, `${v}%`, x, vy, { size: 46, weight: 700, color: C.text, role: 'stat' });
        const bx = x + w + 20, bw = Math.max(40, Math.min(150, maxW - w - 20)); fillRR(ctx, bx, vy - 22, bw, 10, 5, C.raised); if (v > 0) fillRR(ctx, bx, vy - 22, Math.max(10, (bw * v) / 100), 10, 5, col);
      } else if (k === 'streak') {
        const v = Math.max(0, Math.round(num(d.streak)));
        draw(cv, 'STREAK', x, ly, LABEL(19, C.text3, { role: 'stat-label' }));
        flame(ctx, x - 6, vy - 42, 48, v > 0 ? '#f0913c' : C.text3);
        const w = draw(cv, String(v), x + 44, vy, { size: 46, weight: 700, color: C.text, role: 'stat' });
        draw(cv, v === 1 ? 'day' : 'days', x + 44 + w + 10, vy, { size: 28, weight: 500, color: C.text2, role: 'stat', maxWidth: maxW - 54 - w });
      } else {
        draw(cv, 'RANK', x, ly, LABEL(19, C.text3, { role: 'stat-label' }));
        chevrons(ctx, x + 19, vy - 15, 34, C.accent, 3, 5);
        ctx.font = fontStr({ size: 46, weight: 700 }); const size = fitText(ctx, str(d.rank), maxW - 52, 46, 26);
        draw(cv, str(d.rank), x + 52, vy, { size, weight: 700, color: C.text, role: 'stat', maxWidth: maxW - 52 });
      }
    });
  }

  // ── footer ──
  hline(ctx, M, W - M, 1250, C.line, 2);
  const wm = wordmark(cv, M, footY, 24);
  draw(cv, str(d.footer ?? 'your life as a war map'), W - M, footY, { size: 23, weight: 500, color: C.text3, align: 'right', maxWidth: W - M * 2 - wm - 40, role: 'footer' });
  grain(ctx, W, H, 0.045);
  return cv;
}

/* ═════════════════════════ 2. Front page (1080 × 1350) ═════════════════════════ */
const INK = '#1a1713', PAPER = '#e9e0cb';
const SPOT = { gold: '#9a6b12', bad: '#8f1d16', good: '#1f5b40' };

function paper(ctx, W, H, seed = 11) {
  const r = rng(seed); ctx.fillStyle = PAPER; ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 46; i++) { // uneven pulp and foxing
    const x = r() * W, y = r() * H, rad = 90 + r() * 380, dark = r() < 0.62;
    const g = ctx.createRadialGradient(x, y, 0, x, y, rad); g.addColorStop(0, dark ? `rgba(128,98,48,${0.03 + r() * 0.05})` : `rgba(255,251,236,${0.05 + r() * 0.08})`); g.addColorStop(1, 'rgba(128,98,48,0)');
    ctx.fillStyle = g; ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  ctx.lineWidth = 1; // paper fibres
  for (let i = 0; i < 900; i++) { const x = r() * W, y = r() * H, a = r() * Math.PI, l = 6 + r() * 22; ctx.strokeStyle = r() < 0.5 ? 'rgba(96,74,40,.07)' : 'rgba(255,252,240,.11)'; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); ctx.stroke(); }
  for (let i = 0; i < 26; i++) { const x = r() * W, y = r() * H, rad = 1 + r() * 2.6; ctx.fillStyle = `rgba(112,78,34,${0.1 + r() * 0.16})`; ctx.beginPath(); ctx.arc(x, y, rad, 0, 7); ctx.fill(); }
  grain(ctx, W, H, 0.16);
}
function paperFinish(ctx, W, H) {
  // erode the ink a little with paper-coloured speckle, then age the edges and add the fold
  const r = rng(29); ctx.fillStyle = 'rgba(233,224,203,.5)';
  for (let i = 0; i < 5200; i++) { const s = r() < 0.9 ? 1.2 : 2.2; ctx.fillRect(r() * W, r() * H, s, s); }
  let g = ctx.createRadialGradient(W / 2, H / 2, H * 0.34, W / 2, H / 2, H * 0.78); g.addColorStop(0, 'rgba(96,66,24,0)'); g.addColorStop(1, 'rgba(96,66,24,.34)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  for (const [x0, y0, x1, y1] of [[0, 0, 26, 0], [W, 0, W - 26, 0], [0, 0, 0, 26], [0, H, 0, H - 26]]) { g = ctx.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, 'rgba(84,58,22,.2)'); g.addColorStop(1, 'rgba(84,58,22,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
  const fy = Math.round(H * 0.5); g = ctx.createLinearGradient(0, fy - 16, 0, fy + 16); g.addColorStop(0, 'rgba(70,50,20,0)'); g.addColorStop(0.46, 'rgba(70,50,20,.1)'); g.addColorStop(0.5, 'rgba(255,250,232,.2)'); g.addColorStop(0.56, 'rgba(70,50,20,.07)'); g.addColorStop(1, 'rgba(70,50,20,0)');
  ctx.fillStyle = g; ctx.fillRect(0, fy - 16, W, 32);
  grain(ctx, W, H, 0.1);
}
// Duotone + 45° halftone treatment of the map, as a printed press photograph.
function pressPhoto(src, w, h, tone) {
  const out = document.createElement('canvas'); out.width = w; out.height = h; const o = out.getContext('2d', { willReadFrequently: true });
  // soften first (down then up) so province mottling and small labels do not turn into noise
  const sm = document.createElement('canvas'); sm.width = Math.ceil(w / 2); sm.height = Math.ceil(h / 2); const so = sm.getContext('2d');
  const real = !!(src && cover(so, src, 0, 0, sm.width, sm.height, 0.5, 0.42)); if (!real) plate(so, 0, 0, sm.width, sm.height, '#e3b85c');
  o.imageSmoothingEnabled = true; o.imageSmoothingQuality = 'high'; o.drawImage(sm, 0, 0, w, h);
  let im; try { im = o.getImageData(0, 0, w, h); } catch { return out; } // tainted source: keep it as is
  const px = im.data, lum = new Float32Array(w * h), hist = new Uint32Array(256);
  // green-weighted grey: our land prints light, occupied land and sea print dark
  for (let i = 0, j = 0; i < px.length; i += 4, j++) { const v = (real ? clamp(px[i + 1] * 1.2 - px[i] * 0.42 + px[i + 2] * 0.2, 0, 255) : px[i] * 0.299 + px[i + 1] * 0.587 + px[i + 2] * 0.114) | 0; lum[j] = v; hist[v]++; }
  let lo = 0, hi = 255, acc = 0; const total = w * h;
  for (let v = 0; v < 256; v++) { acc += hist[v]; if (acc >= total * 0.02) { lo = v; break; } }
  acc = 0; for (let v = 255; v >= 0; v--) { acc += hist[v]; if (acc >= total * 0.02) { hi = v; break; } }
  const span = Math.max(24, hi - lo), ink = hex(INK), pap = hex('#e2d8c0');
  for (let j = 0; j < lum.length; j++) lum[j] = 0.08 + 0.92 * Math.pow(clamp((lum[j] - lo) / span, 0, 1), 0.9);
  for (let i = 0, j = 0; i < px.length; i += 4, j++) { const t = 0.3 + 0.7 * lum[j]; px[i] = ink[0] + (pap[0] - ink[0]) * t; px[i + 1] = ink[1] + (pap[1] - ink[1]) * t; px[i + 2] = ink[2] + (pap[2] - ink[2]) * t; px[i + 3] = 255; }
  o.putImageData(im, 0, 0);
  const cell = 4.6, c45 = Math.SQRT1_2, R = Math.ceil((w + h) / cell) + 2; o.fillStyle = INK; o.beginPath();
  for (let u = -R; u <= R; u++) for (let v = -R; v <= R; v++) {
    const x = (u - v) * cell * c45 + w / 2, y = (u + v) * cell * c45 + h / 2; if (x < -cell || y < -cell || x > w + cell || y > h + cell) continue;
    const l = lum[clamp(y | 0, 0, h - 1) * w + clamp(x | 0, 0, w - 1)], rad = cell * 0.66 * Math.sqrt(1 - l); if (rad < 0.35) continue;
    o.moveTo(x + rad, y); o.arc(x, y, rad, 0, Math.PI * 2);
  }
  o.fill();
  const g = o.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, w * 0.75); g.addColorStop(0, 'rgba(26,23,19,0)'); g.addColorStop(1, 'rgba(26,23,19,.3)'); o.fillStyle = g; o.fillRect(0, 0, w, h);
  return out;
}
// Body copy: words carry their own weight so a bold dateline can lead the first paragraph.
function setBody(ctx, paras, colW, size) {
  const reg = { size, family: SERIF, weight: 400 }, bold = { size, family: SERIF, weight: 700 };
  setFont(ctx, reg); const space = ctx.measureText(' ').width, indent = size * 1.1, lines = [];
  paras.forEach((p, pi) => {
    const words = []; let b = false;
    for (const tok of p.split(/\s+/).filter(Boolean)) { // **bold** spans
      let t = tok; if (t.startsWith('**')) { b = true; t = t.slice(2); } const end = t.endsWith('**'); if (end) t = t.slice(0, -2);
      setFont(ctx, b ? bold : reg); if (t) words.push({ t, w: ctx.measureText(t).width, bold: b }); if (end) b = false;
    }
    let cur = [], cw = 0, first = true; const avail = () => colW - (first && pi > 0 ? indent : 0);
    for (const wd of words) {
      const need = cur.length ? cw + space + wd.w : wd.w;
      if (cur.length && need > avail()) { lines.push({ words: cur, w: cw, indent: first && pi > 0 ? indent : 0, last: false }); first = false; cur = [wd]; cw = wd.w; } else { cur.push(wd); cw = need; }
    }
    if (cur.length) lines.push({ words: cur, w: cw, indent: first && pi > 0 ? indent : 0, last: true });
  });
  return { lines, space, reg, bold };
}
function drawBodyLine(cv, ln, x, y, colW, set, color) {
  const ctx = cv.getContext('2d'), avail = colW - ln.indent, sum = ln.words.reduce((a, w) => a + w.w, 0), gaps = ln.words.length - 1;
  let gap = set.space; if (!ln.last && gaps > 0) { const j = (avail - sum) / gaps; if (j <= set.space * 7) gap = j; }
  let cx = x + ln.indent; ctx.fillStyle = color; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  for (const w of ln.words) { setFont(ctx, w.bold ? set.bold : set.reg); ctx.fillText(w.t, cx, y); cx += w.w + gap; }
  const width = Math.min(avail, cx - gap - x - ln.indent);
  cv._textBoxes.push({ role: 'body', text: ln.words.map(w => w.t).join(' '), x: x + ln.indent, y: y - set.reg.size * 0.76, w: width, h: set.reg.size * 0.98, clipped: !!ln.clipped });
}

export function renderFrontPage(d = {}) {
  const W = 1080, H = 1350, M = 56, CW = W - M * 2, cv = mk(W, H), ctx = cv.getContext('2d');
  const spot = SPOT[d.tone] || SPOT.gold, date = asDate(d.date);
  paper(ctx, W, H);
  ctx.save(); ctx.shadowColor = 'rgba(26,23,19,.42)'; ctx.shadowBlur = 1.4; // slight ink spread on everything printed

  // ── ears and masthead ──
  const ear = { size: 17, weight: 700, family: SERIF, tracking: 2.6, color: INK, role: 'ear', box: [0.74, 0.06] };
  draw(cv, caps(d.edition || 'Late War Edition'), M, 84, { ...ear, maxWidth: 300 });
  draw(cv, caps(d.price || 'One Report a Day'), W - M, 84, { ...ear, align: 'right', maxWidth: 300 });
  hline(ctx, M, W - M, 62, INK, 2);
  const mast = caps(curly(d.masthead || "Ettela'at-e Artesh")), mo = { weight: 700, family: SERIF, sx: 0.86, color: INK, role: 'masthead', box: [0.74, 0.04] };
  let ms = 112; for (; ms > 40; ms -= 2) { setFont(ctx, { ...mo, size: ms, tracking: ms * 0.03 }); if (mw(ctx, mast, { ...mo, tracking: ms * 0.03 }) <= CW - 8) break; }
  const mastY = 100 + ms * 0.86;
  draw(cv, mast, W / 2, mastY, { ...mo, size: ms, tracking: ms * 0.03, align: 'center', maxWidth: CW });
  let y = mastY + 22; hline(ctx, M, W - M, y, INK, 5); hline(ctx, M, W - M, y + 7, INK, 1.5);
  // dateline strip
  const dl = { size: 18.5, weight: 700, family: SERIF, tracking: 2.4, color: INK, role: 'dateline', box: [0.74, 0.06] };
  y += 37; const pd = d.persianDate === true ? persianDate(date) : str(d.persianDate);
  const place = caps(d.city || 'Tehran'), lw_ = draw(cv, place, M, y, { ...dl, maxWidth: 220 });
  const rw_ = pd ? draw(cv, caps(pd), W - M, y, { ...dl, align: 'right', maxWidth: 300 }) : draw(cv, caps(d.nation || 'Iran'), W - M, y, { ...dl, align: 'right', maxWidth: 220 });
  draw(cv, caps(fullDate(date)), W / 2, y, { ...dl, align: 'center', maxWidth: CW - 2 * Math.max(lw_, rw_) - 50 });
  y += 15; hline(ctx, M, W - M, y, INK, 1.5); hline(ctx, M, W - M, y + 5, INK, 1.5);
  const stripBottom = y + 5;

  // ── kicker, headline, deck ──
  const kick = caps(d.kicker || (d.tone === 'bad' ? 'Extra' : d.tone === 'good' ? 'Dispatch' : d.tone === 'gold' ? 'Victory Extra' : 'Bulletin'));
  const ko = { size: 23, weight: 800, tracking: 7, color: spot, role: 'kicker', box: [0.74, 0.04] };
  y = stripBottom + 44; setFont(ctx, ko); const kw = Math.min(mw(ctx, kick, ko), CW - 240);
  draw(cv, kick, W / 2, y, { ...ko, align: 'center', maxWidth: CW - 240 });
  ctx.fillStyle = spot; for (const s of [-1, 1]) { const x0 = W / 2 + s * (kw / 2 + 22), x1 = s < 0 ? M : W - M; ctx.fillRect(Math.min(x0, x1), y - 12, Math.abs(x1 - x0), 3); ctx.fillRect(Math.min(x0, x1), y - 6, Math.abs(x1 - x0), 1); }
  const kickY = y;
  // ── footer (fixed) ──
  const footRule = H - 78; hline(ctx, M, W - M, footRule, INK, 1.5); hline(ctx, M, W - M, footRule + 5, INK, 4);
  const fo = { size: 17.5, weight: 700, family: SERIF, tracking: 2.6, color: INK, role: 'footer', box: [0.74, 0.06] };
  const fl = draw(cv, 'ARTESH', M, H - 40, { ...fo, weight: 700, tracking: 6 });
  const frw = draw(cv, caps(d.footerRight || 'Printed by hand, daily'), W - M, H - 40, { ...fo, align: 'right', maxWidth: 300 });
  draw(cv, str(d.footer ?? 'artesh — your life as a war map'), W / 2, H - 40, { size: 21, italic: true, family: SERIF, color: INK, align: 'center', role: 'footer', maxWidth: CW - 2 * Math.max(fl, frw) - 50 });
  const zoneBottom = footRule - 20;

  // ── headline, deck, photo + sidebar and two columns of copy are solved together: the headline gives way
  //    until the story fits at a readable size ──
  const headText = caps(curly(d.headline) || 'All quiet on every front'), deckText = curly(d.deck);
  const side = list(d.sidebar).map(curly), hasSide = side.length > 0, gut = 30;
  const sideW = hasSide ? 306 : 0, photoW = CW - (hasSide ? sideW + gut : 0), capH = 42;
  const colW = (CW - gut) / 2, lead = str(d.dateline ?? `${place}, ${date.getDate()} ${MONTHS[date.getMonth()].slice(0, 3)}. —`);
  const paras = list(d.body).map(curly).slice(0, 4); if (paras.length && lead) paras[0] = `**${lead}** ${paras[0]}`;
  const deck = deckText ? fitBlock(ctx, deckText, { maxWidth: CW - 70, maxSize: 34, minSize: 27, maxLines: 2, lh: 1.2, weight: 400, italic: true, family: SERIF }) : null;
  const plan = (budget, minBody, minPhoto) => {
    const head = fitBlock(ctx, headText, { maxWidth: CW, maxSize: 190, minSize: 58, maxLines: 3, lh: 0.9, maxHeight: budget, weight: 700, family: SERIF, sx: 0.7, trackEm: -0.01 });
    const headBase = kickY + 16 + head.size * 0.74, headEnd = headBase + (head.lines.length - 1) * head.size * 0.9 + 20;
    const deckBase = headEnd + (deck ? deck.size * 0.86 : 0), ruleY = deck ? deckBase + (deck.lines.length - 1) * deck.size * 1.2 + 22 : headEnd;
    const zoneTop = ruleY + 20, avail = zoneBottom - zoneTop, r = { head, headBase, deckBase, ruleY, zoneTop, avail, fits: true, set: null, rows: 0, lhB: 0, bodySize: 0 };
    if (!paras.length) { r.photoH = Math.min(avail - capH, 620); return r; }
    for (let s = 30; s >= minBody; s--) {
      r.set = setBody(ctx, paras, colW, s); r.lhB = Math.round(s * 1.3); r.rows = Math.ceil(r.set.lines.length / 2); r.bodySize = s;
      r.photoH = avail - r.rows * r.lhB - capH - 34; if (r.photoH >= minPhoto) { r.photoH = Math.min(r.photoH, 470); return r; }
    }
    r.fits = false; r.photoH = minPhoto; r.rows = Math.max(1, Math.floor((avail - minPhoto - capH - 34) / r.lhB)); return r;
  };
  let P = null; // an unclipped headline matters most, then a readable story, then the size of the headline
  search: for (const allowClip of [false, true]) for (const [minBody, minPhoto] of [[27, 320], [25, 320], [23, 290], [22, 260]]) for (const budget of [282, 250, 222, 196, 172]) {
    const t = plan(budget, minBody, minPhoto); if (t.fits && (allowClip || !t.head.clipped)) { P = t; break search; }
  }
  if (!P) P = plan(222, 22, 260);
  const { head, set, rows, lhB, bodySize, photoH, zoneTop, avail } = P;
  drawBlock(cv, head, W / 2, P.headBase, { lh: 0.9, color: INK, align: 'center', role: 'headline', box: [0.74, 0.02] });
  if (deck) drawBlock(cv, deck, W / 2, P.deckBase, { lh: 1.2, color: INK, align: 'center', role: 'deck' });
  hline(ctx, M, W - M, P.ruleY, INK, 1.5);
  const used = photoH + capH + (paras.length ? 34 + rows * lhB : 0), slack = Math.max(0, avail - used), pad = paras.length ? slack / 3 : slack / 2;

  // photo
  const py = Math.round(zoneTop + pad * (paras.length ? 0.6 : 1)), tc = toneOf(d.tone).c;
  ctx.restore(); // no ink-spread shadow on the halftone itself
  const photo = pressPhoto(d.map || null, Math.round(photoW), Math.round(photoH), tc);
  ctx.drawImage(photo, M, py); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.strokeRect(M + 1, py + 1, Math.round(photoW) - 2, Math.round(photoH) - 2);
  ctx.save(); ctx.shadowColor = 'rgba(26,23,19,.42)'; ctx.shadowBlur = 1.4;
  const capText = str(d.caption ?? 'The situation map issued by the General Staff this evening.');
  if (capText) {
    const cap = fitBlock(ctx, capText, { maxWidth: photoW - 4, maxSize: 20, minSize: 20, maxLines: 1, weight: 400, italic: true, family: SERIF, balance: false });
    drawBlock(cv, cap, M + 2, py + photoH + 28, { color: INK, role: 'caption' });
  }
  // sidebar
  if (hasSide) {
    const sx0 = M + photoW + gut, sh = photoH + capH - 8, bandH = 46;
    ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.strokeRect(sx0 + 1, py + 1, sideW - 2, sh - 2); ctx.lineWidth = 1; ctx.strokeRect(sx0 + 6.5, py + 6.5, sideW - 13, sh - 13);
    ctx.save(); ctx.shadowBlur = 0; ctx.fillStyle = spot; ctx.fillRect(sx0 + 7, py + 7, sideW - 14, bandH); ctx.restore();
    ctx.save(); ctx.shadowColor = 'transparent';
    draw(cv, caps(d.sidebarTitle || 'On Other Fronts'), sx0 + sideW / 2, py + 7 + bandH / 2 + 7.5, { size: 20, weight: 700, family: SERIF, tracking: 3, color: '#f1e9d6', align: 'center', maxWidth: sideW - 40, role: 'sidebar-title', box: [0.74, 0.06] });
    ctx.restore();
    const innerTop = py + 7 + bandH + 6, innerH = sh - 14 - bandH - 12, tw = sideW - 44;
    let fs = 25, blocks = [];
    for (; fs >= 19; fs--) {
      blocks = side.map(t => fitBlock(ctx, t, { maxWidth: tw, maxSize: fs, minSize: fs, maxLines: 3, lh: 1.2, weight: 400, family: SERIF, balance: false }));
      if (blocks.reduce((a, b) => a + b.height + fs * 0.9, 0) <= innerH) break;
    }
    const keep = []; let hSum = 0; for (const b of blocks) { const bh = b.height + fs * 0.9; if (hSum + bh > innerH && keep.length) break; if (hSum + bh > innerH) break; keep.push(b); hSum += bh; }
    const extra = keep.length ? Math.min(26, (innerH - hSum) / keep.length) : 0; let sy = innerTop + extra / 2;
    keep.forEach((b, i) => {
      const bh = b.height + fs * 0.9 + extra;
      if (i) { hline(ctx, sx0 + 22, sx0 + sideW - 22, sy - extra / 2, 'rgba(26,23,19,.55)', 1); }
      drawBlock(cv, b, sx0 + 22, sy + fs * 0.45 + fs * 0.8, { lh: 1.2, color: INK, role: 'sidebar' }); sy += bh;
    });
  }
  // body
  if (paras.length && set) {
    const by = py + photoH + capH + pad * 0.9 + 4; hline(ctx, M, W - M, by, INK, 1.5);
    let lines = set.lines; const cap = rows * 2;
    if (lines.length > cap) { // out of room: stop at a sentence if we can, else mark the cut
      lines = lines.slice(0, cap); const lastLn = { ...lines[cap - 1], words: lines[cap - 1].words.slice(), last: true, clipped: true }; const lw = lastLn.words[lastLn.words.length - 1];
      setFont(ctx, lw.bold ? set.bold : set.reg); const t = lw.t.replace(/[.,;:!?]+$/, '') + '…'; lastLn.words[lastLn.words.length - 1] = { ...lw, t, w: ctx.measureText(t).width };
      while (lastLn.words.length > 1 && lastLn.words.reduce((a, w) => a + w.w + set.space, -set.space) > colW - lastLn.indent) lastLn.words.splice(lastLn.words.length - 2, 1);
      lines[cap - 1] = lastLn;
    }
    const perCol = Math.ceil(lines.length / 2), ty = by + 16 + bodySize * 0.8;
    lines.forEach((ln, i) => { const col = i < perCol ? 0 : 1, row = col ? i - perCol : i; drawBodyLine(cv, ln, M + col * (colW + gut), ty + row * lhB, colW, set, INK); });
    vline(ctx, W / 2, by + 12, ty + (perCol - 1) * lhB + 10, 'rgba(26,23,19,.7)', 1);
  }
  ctx.restore();
  paperFinish(ctx, W, H);
  return cv;
}

/* ═════════════════════════ 3. Weekly recap (1080 × 1920) ═════════════════════════ */
function weekRange(from, to) {
  const a = asDate(from), b = asDate(to), m = d => MONTHS[d.getMonth()];
  if (a.getFullYear() !== b.getFullYear()) return [`${a.getDate()} ${m(a).slice(0, 3)} – ${b.getDate()} ${m(b).slice(0, 3)}`, `${a.getFullYear()}/${String(b.getFullYear()).slice(2)}`];
  if (a.getMonth() !== b.getMonth()) return [`${a.getDate()} ${m(a).slice(0, 3)} – ${b.getDate()} ${m(b).slice(0, 3)}`, String(b.getFullYear())];
  return [a.getDate() === b.getDate() ? `${a.getDate()} ${m(a)}` : `${a.getDate()}–${b.getDate()} ${m(a)}`, String(b.getFullYear())];
}
export function renderRecap(d = {}) {
  const W = 1080, H = 1920, M = 72, CW = W - M * 2, cv = mk(W, H), ctx = cv.getContext('2d');
  const wins = num(d.wins), losses = num(d.losses), mood = wins > losses ? C.good : losses > wins ? C.bad : C.accent;
  ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
  let g = ctx.createRadialGradient(W * 0.2, 80, 0, W * 0.2, 80, 1000); g.addColorStop(0, rgba(mood, 0.2)); g.addColorStop(0.55, rgba(mood, 0.045)); g.addColorStop(1, rgba(mood, 0)); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  g = ctx.createRadialGradient(W, H, 0, W, H, 900); g.addColorStop(0, rgba(C.accent, 0.08)); g.addColorStop(1, rgba(C.accent, 0)); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  // faint range rings behind the header
  ctx.save(); ctx.strokeStyle = rgba(mood, 0.09); ctx.lineWidth = 2; for (let i = 1; i <= 5; i++) { ctx.beginPath(); ctx.arc(W - 40, 250, i * 130, 0, Math.PI * 2); ctx.stroke(); } ctx.restore();
  ctx.fillStyle = mood; ctx.fillRect(0, 0, W, 8);

  const perFront = list(d.perFront).slice(0, 7), chipsAll = [
    ...list(d.citiesCaptured).map(t => ({ t: str(t), c: C.good, k: 'up' })), ...list(d.citiesLost).map(t => ({ t: str(t), c: C.bad, k: 'down' })),
    ...list(d.satrapies).map(t => ({ t: str(t), c: C.accent, k: 'sun' })), ...list(d.medals).map(t => ({ t: str(t), c: C.accent, k: 'star' })),
  ];
  const quotes = [d.biggestWin?.headline ? { ...d.biggestWin, label: 'BIGGEST VICTORY', c: C.good } : null, d.hardestLoss?.headline ? { ...d.hardestLoss, label: 'HARDEST LOSS', c: C.bad } : null].filter(Boolean);
  const card = (x, y, w, h) => { fillRR(ctx, x, y, w, h, 24, 'rgba(255,255,255,.045)'); rr(ctx, x + 0.5, y + 0.5, w - 1, h - 1, 24); ctx.strokeStyle = 'rgba(255,255,255,.07)'; ctx.lineWidth = 1; ctx.stroke(); };

  // Sections are built for a compaction level and report their height; the roomiest level that fits is drawn.
  const build = lvl => {
    const S = [];
    // header
    {
      const [range, year] = weekRange(d.from, d.to ?? d.from);
      ctx.font = fontStr({ size: 10, weight: 800 });
      const rs = lvl >= 2 ? 112 : 132, rb = fitBlock(ctx, range, { maxWidth: CW, maxSize: rs, minSize: 70, maxLines: 1, weight: 800, trackEm: -0.035 });
      const verdict = str(d.verdict), vb = verdict ? fitBlock(ctx, verdict, { maxWidth: CW - 20, maxSize: lvl >= 2 ? 44 : 50, minSize: 36, maxLines: lvl >= 3 ? 2 : 3, lh: 1.24, weight: 400, italic: true, family: SERIF }) : null;
      const h = 40 + 34 + rb.size * 0.82 + (vb ? 44 + vb.height : 0);
      S.push({ h, draw: y => {
        const wm = wordmark(cv, M, y + 26, 26);
        draw(cv, `THE WEEK IN REVIEW · ${year}`, W - M, y + 26, LABEL(23, C.text2, { align: 'right', role: 'meta', maxWidth: CW - wm - 40 }));
        const by = y + 40 + 34 + rb.size * 0.76; drawBlock(cv, rb, M - rb.size * 0.03, by, { color: '#f6f3ec', role: 'headline', box: [0.76, 0.2] });
        if (vb) drawBlock(cv, vb, M, by + 44 + vb.size * 0.98, { lh: 1.24, color: 'rgba(236,234,229,.86)', role: 'verdict' });
      } });
    }
    // giant numbers
    {
      const items = [['REPORTS', num(d.reports), C.text], ['VICTORIES', wins, C.good], ['DEFEATS', losses, C.bad], ['XP GAINED', `${num(d.xp) >= 0 ? '+' : '−'}${Math.abs(Math.round(num(d.xp)))}`, C.accent]];
      const grid = lvl === 0, cols = grid ? 2 : 4, cw = CW / cols, ns = grid ? 190 : 104, cellH = grid ? 262 : 168;
      S.push({ h: grid ? cellH * 2 + 8 : cellH, draw: y => {
        hline(ctx, M, W - M, y, C.lineStrong, 2); if (!grid) hline(ctx, M, W - M, y + cellH, C.lineStrong, 2);
        ctx.font = fontStr({ size: ns, weight: 800 }); const sz = Math.min(...items.map(it => fitText(ctx, String(it[1]), cw - (grid ? 44 : 26) - 16, ns, 48)));
        items.forEach(([label, value, col], i) => {
          const cx = i % cols, cyI = (i / cols) | 0, x = M + cx * cw + (cx ? (grid ? 44 : 26) : 0), top = y + cyI * (cellH + 8), maxW = cw - (cx ? (grid ? 44 : 26) : 0) - 16;
          if (cx) vline(ctx, M + cx * cw, top + 22, top + cellH - 22, C.line, 2);
          if (grid && cyI === 1 && cx === 0) hline(ctx, M, W - M, top - 4, C.line, 2);
                    const base = top + (grid ? 182 : 112);
          draw(cv, String(value), x - sz * 0.04, base, { size: sz, weight: 800, tracking: -sz * 0.035, color: col, role: 'stat', maxWidth: maxW + sz * 0.08, box: [0.74, 0.04] });
          draw(cv, label, x, base + (grid ? 50 : 36), LABEL(grid ? 24 : 19, C.text2, { role: 'stat-label', maxWidth: maxW }));
        });
        if (grid) hline(ctx, M, W - M, y + cellH * 2 + 8, C.lineStrong, 2);
      } });
    }
    // fronts
    if (perFront.length) {
      const rowH = [64, 58, 50, 46][lvl], fs = Math.round(rowH * 0.56), maxAbs = Math.max(10, ...perFront.map(f => Math.abs(num(f.delta))));
      S.push({ h: 44 + perFront.length * rowH, draw: y => {
        draw(cv, 'THE FRONTS THIS WEEK', M, y + 20, LABEL(21, C.text3, { role: 'section' }));
        draw(cv, 'LOST  ·  GAINED', 384 + 134, y + 20, LABEL(16, C.text3, { align: 'center', role: 'legend' }));
        const bx = 384, bw = 268, mid = bx + bw / 2;
        perFront.forEach((f, i) => {
          const cy = y + 44 + i * rowH + rowH / 2, base = cy + fs * 0.35, dl = num(f.delta), up = dl > 0, col = dl ? (up ? C.good : C.bad) : C.text3;
          ctx.beginPath(); ctx.arc(M + 10, cy, 10, 0, Math.PI * 2); ctx.fillStyle = f.color || C.text2; ctx.fill();
          draw(cv, str(f.label) || '—', M + 34, base, { size: fs, weight: 600, color: C.text, maxWidth: bx - M - 34 - 26, role: 'front-label' });
          const bh = Math.round(rowH * 0.22), len = (Math.abs(dl) / maxAbs) * (bw / 2 - 16);
          fillRR(ctx, bx, cy - bh / 2, bw, bh, bh / 2, 'rgba(255,255,255,.07)');
          if (dl) { ctx.fillStyle = col; const x0 = up ? mid : mid - len; fillRR(ctx, x0, cy - bh / 2, Math.max(len, bh), bh, bh / 2, col); ctx.beginPath(); const tip = up ? mid + len + 13 : mid - len - 13, bk = up ? mid + len - 3 : mid - len + 3; ctx.moveTo(tip, cy); ctx.lineTo(bk, cy - bh * 0.95); ctx.lineTo(bk, cy + bh * 0.95); ctx.closePath(); ctx.fill(); }
          ctx.fillStyle = '#c9cdd0'; ctx.fillRect(mid - 1.5, cy - bh / 2 - 6, 3, bh + 12);
          const nx = bx + bw + 24, ns = Math.round(fs * 0.9), txt = dl ? `${up ? '+' : '−'}${Math.abs(Math.round(dl))}` : '0';
          const nw = draw(cv, txt, nx, base, { size: ns, weight: 700, color: col, role: 'front-delta' });
          draw(cv, str(f.status), W - M, base, { size: Math.round(fs * 0.8), weight: 500, color: C.text2, align: 'right', maxWidth: W - M - nx - Math.max(nw, 66) - 20, role: 'front-status' });
        });
      } });
    }
    // quotes
    if (quotes.length) {
      const two = quotes.length === 2, qw = two ? (CW - 24) / 2 : CW, lines = two ? 3 : 2, qs = lvl >= 2 ? 34 : 38;
      const blocks = quotes.map(q => fitBlock(ctx, str(q.headline), { maxWidth: qw - 64, maxSize: two ? qs : qs + 6, minSize: 28, maxLines: lines, lh: 1.16, weight: 600, family: SERIF }));
      const bodyH = Math.max(...blocks.map(b => b.height)), h = 70 + bodyH + 60;
      S.push({ h, draw: y => quotes.forEach((q, i) => {
        const x = M + i * (qw + 24), b = blocks[i]; card(x, y, qw, h); fillRR(ctx, x, y + 26, 6, h - 52, 3, q.c);
        draw(cv, q.label, x + 32, y + 48, LABEL(19, q.c, { weight: 700, role: 'quote-label', maxWidth: qw - 64 }));
        drawBlock(cv, b, x + 32, y + 70 + b.size * 0.92, { lh: 1.16, color: '#f3f0e9', role: 'quote' });
        if (q.front) draw(cv, str(q.front), x + 32, y + h - 28, { size: 23, weight: 500, color: C.text3, maxWidth: qw - 64, role: 'quote-front' });
      }) });
    }
    // chips
    if (chipsAll.length) {
      const maxRows = [3, 3, 2, 1][lvl], ch = 52, fs = 25, gap = 12, rows = [[]]; let x = 0, hidden = 0;
      const o = { size: fs, weight: 600 }; setFont(ctx, o);
      const sized = chipsAll.map(c => { const t = ellipsizeWith(s => mw(ctx, s, o), c.t, 330); return { ...c, t, w: mw(ctx, t, o) + 68 }; });
      const moreW = n => mw(ctx, `+${n} more`, o) + 44;
      sized.forEach((c, i) => {
        if (hidden) { hidden++; return; }
        let row = rows[rows.length - 1];
        if (x + c.w > CW && row.length) { if (rows.length < maxRows) { rows.push(row = []); x = 0; } else { hidden = 1; return; } }
        const left = sized.length - i - 1; // keep room for the "+N more" chip on the last row
        if (rows.length === maxRows && left > 0 && x + c.w + gap + moreW(left) > CW && sized.slice(i).reduce((a, s) => a + s.w + gap, x - gap) > CW) { hidden = 1; return; }
        row.push({ ...c, x }); x += c.w + gap;
      });
      if (hidden) { const row = rows[rows.length - 1], w = moreW(hidden); while (row.length && x + w > CW) { const p = row.pop(); x = p.x; hidden++; } row.push({ t: `+${hidden} more`, c: C.text2, k: 'more', x, w: moreW(hidden) }); }
      S.push({ h: 40 + rows.length * ch + (rows.length - 1) * gap, draw: y => {
        draw(cv, 'CITIES & HONOURS', M, y + 20, LABEL(21, C.text3, { role: 'section' }));
        rows.forEach((row, ri) => row.forEach(c => {
          const cx = M + c.x, cy = y + 40 + ri * (ch + gap); fillRR(ctx, cx, cy, c.w, ch, ch / 2, rgba(c.c.startsWith('#') ? c.c : '#a2a7ab', 0.13)); rr(ctx, cx + 1, cy + 1, c.w - 2, ch - 2, ch / 2); ctx.strokeStyle = rgba(c.c.startsWith('#') ? c.c : '#a2a7ab', 0.5); ctx.lineWidth = 2; ctx.stroke();
          const ix = cx + 28, iy = cy + ch / 2;
          if (c.k === 'up' || c.k === 'down') tri(ctx, ix, iy, 15, c.k === 'up', c.c); else if (c.k === 'star') { starPath(ctx, ix, iy, 12, 5); ctx.fillStyle = c.c; ctx.fill(); } else if (c.k === 'sun') { starPath(ctx, ix, iy, 12, 6.5, 8); ctx.fillStyle = c.c; ctx.fill(); }
          draw(cv, c.t, c.k === 'more' ? cx + 22 : cx + 48, iy + fs * 0.35, { ...o, color: c.k === 'more' ? C.text2 : '#f0ede6', role: 'chip' });
        }));
      } });
    }
    // division of the week + rank
    {
      const mvp = d.mvp && d.mvp.name ? d.mvp : null, hasRank = d.rankEnd || d.rankStart || d.streak != null || d.rankProgress != null || d.ordersDone != null;
      if (mvp || hasRank) {
        const two = mvp && hasRank, cw = two ? (CW - 24) / 2 : CW, h = lvl >= 2 ? 196 : 216;
        S.push({ h, draw: y => {
          let x = M;
          if (mvp) {
            card(x, y, cw, h); const r = 54, icx = x + 32 + r, icy = y + h / 2 + 14;
            draw(cv, 'DIVISION OF THE WEEK', x + 32, y + 48, LABEL(19, C.accent, { weight: 700, role: 'section', maxWidth: cw - 64 }));
            ctx.beginPath(); ctx.arc(icx, icy, r, 0, Math.PI * 2); ctx.fillStyle = rgba(C.accent, 0.14); ctx.fill(); ctx.strokeStyle = rgba(C.accent, 0.6); ctx.lineWidth = 2; ctx.stroke();
            if (!icon(ctx, mvp.iconPath, icx, icy, r * 1.18, C.accent)) chevrons(ctx, icx, icy + 4, 46, C.accent, 3, 7);
            const tx = icx + r + 24, tw = x + cw - 28 - tx;
            const nb = fitBlock(ctx, str(mvp.name), { maxWidth: tw, maxSize: 36, minSize: 27, maxLines: 2, lh: 1.12, weight: 700 });
            const wtxt = mvp.w != null ? `${num(mvp.w)} ${num(mvp.w) === 1 ? 'victory' : 'victories'}` : '';
            const blockH = nb.height + (wtxt ? 34 : 0), ty = icy - blockH / 2 + nb.size * 0.84;
            const last = drawBlock(cv, nb, tx, ty, { lh: 1.12, color: C.text, role: 'mvp' });
            if (wtxt) draw(cv, wtxt, tx, last + 36, { size: 25, weight: 500, color: C.text2, maxWidth: tw, role: 'mvp-sub' });
            x += cw + 24;
          }
          if (hasRank) {
            card(x, y, cw, h); const ix = x + 32, iw = cw - 64, prog = clamp(num(d.rankProgress), 0, 1);
            const promoted = d.rankStart && d.rankEnd && d.rankStart !== d.rankEnd;
            draw(cv, promoted ? 'PROMOTED' : 'RANK', ix, y + 48, LABEL(19, promoted ? C.accent : C.text3, { weight: 700, role: 'section' }));
            const st = d.streak != null ? Math.max(0, Math.round(num(d.streak))) : null;
            if (st != null) { const t = `${st}-day streak`; ctx.font = fontStr({ size: 24, weight: 600 }); const w = ctx.measureText(t).width; flame(ctx, x + cw - 32 - w - 34, y + 22, 32, st ? '#f0913c' : C.text3); draw(cv, t, x + cw - 32, y + 48, { size: 24, weight: 600, color: C.text, align: 'right', role: 'stat' }); }
            const rank = promoted ? `${d.rankStart} → ${d.rankEnd}` : str(d.rankEnd || d.rankStart || '—');
            ctx.font = fontStr({ size: 44, weight: 700 }); const rsz = fitText(ctx, rank, iw, two ? 42 : 48, 26);
            draw(cv, rank, ix, y + 112, { size: rsz, weight: 700, color: C.text, maxWidth: iw, role: 'rank' });
            const by = y + 138; fillRR(ctx, ix, by, iw, 12, 6, 'rgba(255,255,255,.09)'); if (prog > 0) fillRR(ctx, ix, by, Math.max(12, iw * prog), 12, 6, C.accent);
            const od = d.ordersDone != null ? `${num(d.ordersDone)} ${num(d.ordersDone) === 1 ? 'order' : 'orders'} done` : '';
            const pw = draw(cv, `${Math.round(prog * 100)}% to next rank`, x + cw - 32, by + 46, { size: 22, weight: 500, color: C.text3, align: 'right', role: 'rank-sub' });
            if (od && lvl < 2 || od) draw(cv, od, ix, by + 46, { size: 22, weight: 500, color: C.text2, maxWidth: iw - pw - 20, role: 'rank-sub' });
          }
        } });
      }
    }
    return S;
  };

  const top = 130, footY = H - 96, bottom = footY - 70, minGap = [56, 44, 38, 32];
  let S = [], lvl = 0;
  for (; lvl < 4; lvl++) { S = build(lvl); const need = S.reduce((a, s) => a + s.h, 0) + (S.length - 1) * minGap[lvl]; if (need <= bottom - top) break; }
  if (lvl === 4) { lvl = 3; while (S.length > 2 && S.reduce((a, s) => a + s.h, 0) + (S.length - 1) * minGap[3] > bottom - top) S.splice(S.length - 2, 1); } // last resort: drop a middle section
  const sum = S.reduce((a, s) => a + s.h, 0), gapN = Math.max(1, S.length - 1), gap = Math.min(120, (bottom - top - sum) / gapN), slack = bottom - top - sum - gap * (S.length - 1);
  let y = top + Math.max(0, slack) * 0.4;
  for (const s of S) { s.draw(Math.round(y)); y += s.h + gap; }

  hline(ctx, M, W - M, footY - 44, C.line, 2);
  const wm = wordmark(cv, M, footY, 26);
  draw(cv, str(d.footer ?? 'your life as a war map'), W - M, footY, { size: 25, weight: 500, color: C.text3, align: 'right', maxWidth: CW - wm - 40, role: 'footer' });
  grain(ctx, W, H, 0.045);
  return cv;
}

/* ═════════════════════════ 4. Promotion / decoration (1080 × 1080) ═════════════════════════ */
function goldGrad(ctx, x0, y0, x1, y1) { const g = ctx.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, '#f8e3a4'); g.addColorStop(0.35, '#e3b85c'); g.addColorStop(0.7, '#b98a2f'); g.addColorStop(1, '#ecd08a'); return g; }
function laurel(ctx, cx, cy, R, fill) {
  for (const s of [-1, 1]) {
    ctx.save(); ctx.strokeStyle = fill; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath();
    const a0 = Math.PI / 2 + s * 0.2, a1 = Math.PI / 2 + s * 2.42; ctx.arc(cx, cy, R, Math.min(a0, a1), Math.max(a0, a1)); ctx.stroke();
    const n = 11; for (let i = 0; i < n; i++) {
      const t = i / (n - 1), a = Math.PI / 2 + s * (0.3 + t * 2.1), px = cx + Math.cos(a) * R, py = cy + Math.sin(a) * R, len = 50 - t * 16, wid = 15 - t * 4, tan = a + (s * Math.PI) / 2;
      for (const side of [-1, 1]) { ctx.save(); ctx.translate(px, py); ctx.rotate(tan + side * s * 0.62); ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(len * 0.5, -wid, len, 0); ctx.quadraticCurveTo(len * 0.5, wid, 0, 0); ctx.fillStyle = fill; ctx.fill(); ctx.restore(); }
    }
    const a = Math.PI / 2 + s * 2.42, px = cx + Math.cos(a) * R, py = cy + Math.sin(a) * R; ctx.translate(px, py); ctx.rotate(a + (s * Math.PI) / 2); ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(18, -10, 36, 0); ctx.quadraticCurveTo(18, 10, 0, 0); ctx.fillStyle = fill; ctx.fill();
    ctx.restore();
  }
}
export function renderRankUp(d = {}) {
  const W = 1080, H = 1080, cv = mk(W, H), ctx = cv.getContext('2d'), medal = d.kind === 'medal', cx = W / 2, cy = 372;
  ctx.fillStyle = '#090b0d'; ctx.fillRect(0, 0, W, H);
  let g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 820); g.addColorStop(0, '#2a2110'); g.addColorStop(0.4, '#15120c'); g.addColorStop(1, '#090b0d'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  // rays
  ctx.save(); ctx.translate(cx, cy); const N = 40; g = ctx.createRadialGradient(0, 0, 120, 0, 0, 780); g.addColorStop(0, rgba(C.accent, 0.3)); g.addColorStop(0.45, rgba(C.accent, 0.1)); g.addColorStop(1, rgba(C.accent, 0)); ctx.fillStyle = g;
  for (let i = 0; i < N; i++) { const a = (i / N) * Math.PI * 2 - Math.PI / 2, w = (Math.PI / N) * (i % 2 ? 0.34 : 0.62); ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 900, a - w, a + w); ctx.closePath(); ctx.fill(); }
  ctx.restore();
  g = ctx.createRadialGradient(cx, cy, 60, cx, cy, 330); g.addColorStop(0, 'rgba(9,11,13,.0)'); g.addColorStop(1, 'rgba(9,11,13,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  g = ctx.createLinearGradient(0, 560, 0, 760); g.addColorStop(0, 'rgba(9,11,13,0)'); g.addColorStop(1, 'rgba(9,11,13,.86)'); ctx.fillStyle = g; ctx.fillRect(0, 560, W, H - 560);

  const gold = goldGrad(ctx, cx - 240, cy - 240, cx + 240, cy + 240);
  // ribbon tails for a decoration
  if (medal) for (const s of [-1, 1]) {
    ctx.save(); ctx.translate(cx, cy + 96); ctx.rotate(s * -0.3); const rwd = 76, rl = 178;
    ctx.beginPath(); ctx.moveTo(-rwd / 2, 0); ctx.lineTo(rwd / 2, 0); ctx.lineTo(rwd / 2, rl); ctx.lineTo(0, rl - 30); ctx.lineTo(-rwd / 2, rl); ctx.closePath(); ctx.fillStyle = '#8f1d16'; ctx.fill();
    ctx.save(); ctx.clip(); ctx.fillStyle = '#e3b85c'; ctx.fillRect(-rwd / 2 + 9, 0, 8, rl); ctx.fillRect(rwd / 2 - 17, 0, 8, rl); ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.fillRect(s > 0 ? -rwd / 2 : 0, 0, rwd / 2, rl); ctx.restore();
    ctx.restore();
  }
  laurel(ctx, cx, cy, 232, gold);
  // rosette
  const R = 150; ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 12;
  ctx.beginPath(); const sc = 28; for (let i = 0; i <= sc * 16; i++) { const a = (i / (sc * 16)) * Math.PI * 2, q = R + 7 * Math.cos(a * sc); ctx[i ? 'lineTo' : 'moveTo'](cx + Math.cos(a) * q, cy + Math.sin(a) * q); } ctx.closePath(); ctx.fillStyle = gold; ctx.fill(); ctx.restore();
  ctx.beginPath(); ctx.arc(cx, cy, R - 18, 0, Math.PI * 2); g = ctx.createRadialGradient(cx, cy - 40, 10, cx, cy, R); g.addColorStop(0, '#2b2415'); g.addColorStop(1, '#100e0a'); ctx.fillStyle = g; ctx.fill();
  ctx.beginPath(); ctx.arc(cx, cy, R - 30, 0, Math.PI * 2); ctx.strokeStyle = gold; ctx.lineWidth = 3; ctx.stroke();
  ctx.save(); ctx.setLineDash([2, 9]); ctx.beginPath(); ctx.arc(cx, cy, R - 40, 0, Math.PI * 2); ctx.strokeStyle = rgba(C.accent, 0.7); ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
  if (!icon(ctx, d.iconPath, cx, cy, 150, gold)) {
    if (medal) { starPath(ctx, cx, cy + 2, 80, 34, 8); ctx.fillStyle = gold; ctx.fill(); starPath(ctx, cx, cy + 2, 40, 17, 8, -Math.PI / 2 + Math.PI / 8); ctx.fillStyle = '#17130b'; ctx.fill(); ctx.beginPath(); ctx.arc(cx, cy + 2, 11, 0, 7); ctx.fillStyle = gold; ctx.fill(); }
    else { ctx.save(); ctx.strokeStyle = gold; chevrons(ctx, cx, cy + 14, 124, gold, 3, 17); starPath(ctx, cx, cy - 62, 20, 8.5); ctx.fillStyle = gold; ctx.fill(); ctx.restore(); }
  }

  // text
  const M = 80, CW = W - M * 2;
  const kick = caps(d.kicker || (medal ? 'Decoration awarded' : 'Promoted'));
  const ko = { size: 27, weight: 700, tracking: 9, color: C.accent, role: 'kicker' }; setFont(ctx, ko); const kw = Math.min(mw(ctx, kick, ko), CW - 200);
  draw(cv, kick, cx, 700, { ...ko, align: 'center', maxWidth: CW - 200 });
  for (const s of [-1, 1]) { const x0 = cx + s * (kw / 2 + 26); g = ctx.createLinearGradient(x0, 0, x0 + s * 150, 0); g.addColorStop(0, rgba(C.accent, 0.8)); g.addColorStop(1, rgba(C.accent, 0)); ctx.fillStyle = g; ctx.fillRect(Math.min(x0, x0 + s * 150), 690, 150, 2); }
  const gloss = str(d.gloss), sub = str(d.sub);
  const tb = fitBlock(ctx, str(d.title) || (medal ? 'Decoration' : 'Promotion'), { maxWidth: CW, maxSize: 148, minSize: 60, maxLines: 2, lh: 1.0, maxHeight: gloss ? 156 : 200, weight: 700, family: SERIF, trackEm: -0.01 });
  const blockTop = 728, blockH = gloss ? 156 : 200, ty = blockTop + (blockH - tb.height) / 2 + tb.size * 0.8;
  ctx.save(); const tg = ctx.createLinearGradient(0, ty - tb.size, 0, ty + tb.height); tg.addColorStop(0, '#fbf3dc'); tg.addColorStop(1, '#e7c77a');
  drawBlock(cv, tb, cx, ty, { lh: 1.0, color: tg, align: 'center', role: 'headline', shadow: ['rgba(0,0,0,.5)', 18, 3], box: [0.76, 0.2] }); ctx.restore();
  if (gloss) draw(cv, gloss, cx, 928, { size: 44, italic: true, family: SERIF, color: 'rgba(236,234,229,.88)', align: 'center', maxWidth: CW, role: 'gloss' });
  if (sub) draw(cv, sub, cx, gloss ? 978 : 962, { size: 27, weight: 500, color: C.text2, align: 'center', maxWidth: CW, role: 'sub' });

  // footer: nation · streak, wordmark
  const fy = H - 44, left = [];
  if (d.nation) left.push(caps(d.nation));
  const wm = wordmark(cv, W - M, fy, 23, C.accent, 'right');
  let lx = M; if (left.length) lx += draw(cv, left.join(' · '), M, fy, LABEL(22, C.text2, { role: 'meta', maxWidth: 330 })) + 26;
  if (num(d.streak) > 0) { const st = Math.round(num(d.streak)); if (left.length) { ctx.fillStyle = C.text3; ctx.beginPath(); ctx.arc(lx - 13, fy - 8, 3, 0, 7); ctx.fill(); } flame(ctx, lx - 2, fy - 27, 32, st ? '#f0913c' : C.text3); draw(cv, `${st}-day streak`, lx + 34, fy, { size: 24, weight: 600, color: C.text2, role: 'stat', maxWidth: W - M - wm - lx - 70 }); }
  // corner ticks
  ctx.strokeStyle = rgba(C.accent, 0.5); ctx.lineWidth = 2; const k = 34, e = 34;
  for (const [x, y, dx, dy] of [[e, e, 1, 1], [W - e, e, -1, 1]]) { ctx.beginPath(); ctx.moveTo(x, y + dy * k); ctx.lineTo(x, y); ctx.lineTo(x + dx * k, y); ctx.stroke(); }
  grain(ctx, W, H, 0.05);
  return cv;
}

/* ═════════════════════════ 5. Sharing ═════════════════════════ */
/** Share a canvas as a PNG. Uses the system share sheet when files can be shared, otherwise downloads the image and
 *  copies `text` to the clipboard. Resolves 'shared' | 'downloaded' | 'cancelled'. Never throws. */
export async function shareCanvas(canvas, { filename = 'artesh.png', text = '' } = {}) {
  try {
    const blob = await new Promise(res => { try { canvas.toBlob(b => res(b), 'image/png'); } catch { res(null); } });
    if (!blob) return 'cancelled';
    const name = /\.png$/i.test(filename) ? filename : `${filename}.png`;
    let file = null; try { file = new File([blob], name, { type: 'image/png' }); } catch { /* no File constructor */ }
    let canShare = false; try { canShare = !!(file && typeof navigator !== 'undefined' && navigator.share && navigator.canShare?.({ files: [file] })); } catch { /* treat as unsupported */ }
    if (canShare) {
      try { await navigator.share(text ? { files: [file], text } : { files: [file] }); return 'shared'; }
      catch (e) { if (e && (e.name === 'AbortError' || e.name === 'NotAllowedError')) return 'cancelled'; /* otherwise fall through to a download */ }
    }
    const url = URL.createObjectURL(blob), a = Object.assign(document.createElement('a'), { href: url, download: name });
    a.style.display = 'none'; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 5000);
    if (text) { try { await navigator.clipboard?.writeText(text); } catch { /* clipboard is optional */ } }
    return 'downloaded';
  } catch { return 'cancelled'; }
}
