// Home Front fx — the "juice" layer: synthesized sound, particles, flashes, shakes and haptics.
// No dependencies, no assets. Importable under Node (everything is then a no-op).
//
//   import { fx } from './fx.js';
//
//   fx.init({ root })            Create the overlay canvas (fixed, pointer-events:none, above everything) and the
//                                flash layer. Both are appended to <body>, not to `root`: `root` (default body) is
//                                the element celebrate() shakes, and a shaken ancestor would re-anchor a fixed
//                                overlay. Idempotent. Loads css/fx.css itself if the page has no <link> to it.
//   fx.configure({ sound, motion, haptics })
//                                Merge settings (all default true). The caller persists them. Motion is always off
//                                while the OS asks for reduced motion, whatever `motion` says. Returns the settings.
//   fx.unlock()                  Call from a user gesture (safe on every pointerdown). Creates/resumes the
//                                AudioContext. No sound is ever made before this.
//   fx.sound(name, { volume })   tap send win bigwin loss bigloss capture medal levelup streak order fallen empire error
//   fx.burst(x, y, { kind, color, colors, count, power, angle, spread })
//                                kind: confetti | sparks | smoke | embers | stars. x, y in viewport CSS px.
//                                `color` one colour, `colors` a palette; `angle` (radians, -PI/2 is up) and `spread`
//                                (radians) aim the burst; without them each kind uses its natural shape.
//   fx.rain({ kind, duration, colors, rate })
//                                kind: confetti | embers. Falls from the top edge for `duration` ms.
//   fx.shake(el, { strength, duration })   px, ms. Uses the CSS `translate` property, so `transform` is never touched.
//   fx.flash({ color, duration, opacity, vignette })   Full-screen tint that fades out; vignette:true tints the edges only.
//   fx.pulse(el, { scale, duration })      One scale "pop" (CSS `scale` property).
//   fx.countUp(el, from, to, { duration, format })     Tweens el.textContent. Returns a promise.
//   fx.typewriter(el, text, { cps })       Returns a promise; calling again on the same element cancels the first.
//   fx.haptic(pattern)           light | medium | heavy | success | error, or a navigator.vibrate array.
//   fx.celebrate({ tone, magnitude, kind, at, el })
//                                tone: good | bad | gold. magnitude 1–5. kind: normal | city_captured | city_lost |
//                                satrapy | medal | operation | levelup | streak | tehran_fallen | tehran_freed |
//                                empire | order_done. at: {x, y} viewport px or null for centre. el: optional element
//                                to pulse (good) or shake (bad). Sequences sound + particles + flash + haptic and
//                                resolves when the sequence ends (or at once on fx.stop()).
//   fx.stop()                    Cancel everything now: particles, timers, tweens, flashes, sound.
//
//   Debug / tests: fx._alive() live particle count, fx._running() is the rAF loop on, fx._audio() AudioContext state,
//   fx._render(name) renders a sound offline and resolves { peak, rms, duration }, fx.sounds / fx.kinds name lists.
//
// Rules: nothing throws. Before init, with no DOM, or while the tab is hidden every call is a no-op (countUp and
// typewriter still write their final text, so nothing is ever left blank). motion:false or reduced motion turns off
// particles, shake, flash, pulse and tween animation but keeps sound and haptics; sound:false silences.

const HAS_DOM = typeof window !== 'undefined' && typeof document !== 'undefined';
const TAU = Math.PI * 2;
const rnd = (a = 1, b) => b === undefined ? Math.random() * a : a + Math.random() * (b - a);
const pick = a => a[(Math.random() * a.length) | 0];
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const num = (v, d) => Number.isFinite(+v) ? +v : d;
const now = () => typeof performance !== 'undefined' ? performance.now() : Date.now();
const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k);

const PAL = {
  confetti: ['#e3b85c', '#f1d590', '#5bbf8a', '#efeadb', '#8bd8ae', '#e3b85c'],
  gold: ['#e3b85c', '#f4dc9c', '#efeadb', '#c9993f'],
  sparks: ['#ffd98a', '#ffc46b', '#ffeccb'],
  embers: ['#ff8a3c', '#ffb347', '#e5604d', '#ffd08a'],
  stars: ['#fff4d6', '#f1d590', '#e3b85c'],
  smoke: ['#6c7278', '#565b61', '#80868c'],
};
const KINDS = ['confetti', 'sparks', 'smoke', 'embers', 'stars'];
const MAX = 320;                      // pool cap

const S = {
  inited: false, root: null, canvas: null, ctx: null, flashEl: null,
  cfg: { sound: true, motion: true, haptics: true },
  mql: null, dpr: 1, w: 0, h: 0, dirty: true,
  pool: [], alive: 0, cursor: 0, emitters: [], running: false, rafId: 0, last: 0,
  timers: new Set(), pending: new Set(), classed: new Map(), tweens: new Map(),
  ac: null, graph: null, unlocked: false, resuming: null, sources: new Set(), lastPlayed: {},
};

const hidden = () => !HAS_DOM || document.visibilityState === 'hidden';
const reduced = () => !!(S.mql && S.mql.matches);
const motionOn = () => S.inited && S.cfg.motion && !reduced() && !hidden();
const vw = () => HAS_DOM ? window.innerWidth || document.documentElement.clientWidth || 0 : 0;
const vh = () => HAS_DOM ? window.innerHeight || document.documentElement.clientHeight || 0 : 0;

function later(ms, fn) {
  const id = setTimeout(() => { S.timers.delete(id); try { fn(); } catch { /* never throw */ } }, Math.max(0, ms));
  S.timers.add(id); return id;
}

// ───────────────────────────── init / settings ─────────────────────────────

function init({ root } = {}) {
  if (!HAS_DOM || S.inited) return;
  if (!document.body) return;
  S.root = root && root.classList ? root : document.body;   // what celebrate() shakes on bad news
  if (!document.querySelector('link[href*="fx.css"]')) {
    const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = new URL('../css/fx.css', import.meta.url).href; document.head.appendChild(l);
  }
  const c = document.createElement('canvas'); c.className = 'fx-canvas'; c.setAttribute('aria-hidden', 'true');
  // inline too, so the overlay can never intercept a tap even if the stylesheet is late
  c.style.cssText = 'position:fixed;left:0;top:0;width:100%;height:100%;pointer-events:none;display:none;z-index:2147483000';
  const f = document.createElement('div'); f.className = 'fx-flash'; f.setAttribute('aria-hidden', 'true');
  f.style.cssText = 'position:fixed;left:0;top:0;right:0;bottom:0;pointer-events:none;opacity:0;z-index:2147482999';
  document.body.appendChild(f); document.body.appendChild(c);   // on <body>, so shaking `root` never moves or re-anchors the overlay
  S.canvas = c; S.ctx = c.getContext('2d'); S.flashEl = f;
  for (let i = 0; i < MAX; i++) S.pool.push({ on: false });
  S.mql = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  const onMql = () => { if (reduced()) stopVisuals(); };
  if (S.mql) S.mql.addEventListener ? S.mql.addEventListener('change', onMql) : S.mql.addListener && S.mql.addListener(onMql);
  window.addEventListener('resize', () => { S.dirty = true; }, { passive: true });
  document.addEventListener('visibilitychange', () => { if (hidden()) stop(); });
  S.inited = true;
}

function configure(o = {}) {
  for (const k of ['sound', 'motion', 'haptics']) if (o && k in o) S.cfg[k] = !!o[k];
  if (!S.cfg.motion) stopVisuals();
  if (!S.cfg.sound) stopSound();
  return { ...S.cfg };
}

// ───────────────────────────── particles ─────────────────────────────

const sprites = new Map();
function sprite(color) {                                   // soft round dot, cached per colour
  let s = sprites.get(color); if (s) return s;
  s = document.createElement('canvas'); s.width = s.height = 64;
  const g = s.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.fillStyle = color; g.fillRect(0, 0, 64, 64);
  g.globalCompositeOperation = 'destination-in';
  gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(0.35, 'rgba(0,0,0,.55)'); gr.addColorStop(0.7, 'rgba(0,0,0,.14)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  sprites.set(color, s); return s;
}

function resize() {
  S.dirty = false; S.w = vw(); S.h = vh(); S.dpr = Math.min(2, window.devicePixelRatio || 1);
  const W = Math.round(S.w * S.dpr), H = Math.round(S.h * S.dpr);
  if (S.canvas.width !== W || S.canvas.height !== H) { S.canvas.width = W; S.canvas.height = H; }
}

function spawn() {
  for (let i = 0; i < MAX; i++) {
    const p = S.pool[S.cursor]; S.cursor = (S.cursor + 1) % MAX;
    if (!p.on) { p.on = true; S.alive++; p.life = 0; p.sway = 0; p.ph = 0; p.vph = 0; p.rot = 0; p.vr = 0; p.flip = 0; p.vflip = 0; p.a = 1; p.s1 = 0; return p; }
  }
  return null;                                             // pool full: drop, never grow
}

function emit(kind, x, y, vx, vy, color, power = 1) {
  const p = spawn(); if (!p) return;
  p.kind = kind; p.x = x; p.y = y; p.vx = vx; p.vy = vy; p.color = color;
  if (kind === 'confetti') {
    const ribbon = Math.random() < 0.22;
    p.w = ribbon ? rnd(12, 18) : rnd(7.5, 12); p.h = ribbon ? rnd(2.8, 3.8) : rnd(5, 8);
    p.g = 640; p.drag = rnd(2.2, 3.1); p.max = rnd(1.7, 2.7);
    p.rot = rnd(TAU); p.vr = rnd(-7, 7); p.flip = rnd(TAU); p.vflip = rnd(6, 13) * (Math.random() < 0.5 ? -1 : 1);
    p.ph = rnd(TAU); p.vph = rnd(3, 6); p.sway = rnd(20, 60);
  } else if (kind === 'sparks') {
    p.w = rnd(1.2, 2.3); p.g = 420; p.drag = rnd(1.7, 3.2); p.max = rnd(0.4, 0.95);
  } else if (kind === 'smoke') {
    p.s0 = rnd(14, 24) * power; p.s1 = rnd(52, 92) * power; p.g = -26; p.drag = 2.4; p.max = rnd(1.2, 2.2); p.a = rnd(0.11, 0.2); p.rot = rnd(TAU);
  } else if (kind === 'embers') {
    p.w = rnd(1.2, 2.6); p.g = -70; p.drag = 1.1; p.max = rnd(1.4, 2.8); p.ph = rnd(TAU); p.vph = rnd(2, 5); p.sway = rnd(10, 34);
  } else if (kind === 'stars') {
    p.w = rnd(5, 11) * (0.8 + 0.2 * power); p.g = 30; p.drag = 3.4; p.max = rnd(0.5, 1.1); p.rot = rnd(-0.3, 0.3); p.vr = rnd(-1.2, 1.2);
  } else {                                                 // 'glow': the hot core of a burst
    p.s0 = 36 * power; p.s1 = 170 * power; p.g = 0; p.drag = 0; p.max = 0.42; p.a = 0.75;
  }
  return p;
}

function burst(x, y, { kind = 'confetti', color, colors, count, power = 1, angle, spread } = {}) {
  if (!motionOn() || !KINDS.includes(kind)) return;
  x = num(x, vw() / 2); y = num(y, vh() / 2); power = clamp(num(power, 1), 0.2, 3);
  const pal = color ? [color] : Array.isArray(colors) && colors.length ? colors : PAL[kind];
  const base = { confetti: 36, sparks: 30, smoke: 8, embers: 16, stars: 10 }[kind];
  const n = clamp(Math.round(num(count, base)), 1, 140);
  const aimed = Number.isFinite(angle), sp = num(spread, aimed ? 0.9 : TAU);
  for (let i = 0; i < n; i++) {
    const a = aimed ? angle + rnd(-sp / 2, sp / 2) : rnd(TAU);
    let v, lift = 0, ox = 0, oy = 0;
    if (kind === 'confetti') { v = rnd(240, 760) * power * (aimed ? 1.35 : 1); lift = aimed ? 0 : -260 * power; }
    else if (kind === 'sparks') v = (Math.random() < 0.3 ? rnd(80, 260) : rnd(380, 820)) * power;
    else if (kind === 'smoke') { v = rnd(20, 120) * power; ox = rnd(-24, 24) * power; oy = rnd(-20, 20) * power; }
    else if (kind === 'embers') { v = rnd(20, 150) * power; lift = -40; ox = rnd(-8, 8); oy = rnd(-8, 8); }
    else { v = rnd(60, 300) * power; }
    emit(kind, x + ox, y + oy, Math.cos(a) * v, Math.sin(a) * v + lift, pick(pal), power);
  }
  if (kind === 'sparks' || kind === 'stars') emit('glow', x, y, 0, 0, pal[0], power * (kind === 'stars' ? 0.7 : 1));
  start();
}

function rain({ kind = 'confetti', duration = 1800, colors, rate } = {}) {
  if (!motionOn() || (kind !== 'confetti' && kind !== 'embers')) return;
  S.emitters.push({ kind, left: clamp(num(duration, 1800), 100, 8000) / 1000, acc: 0, rate: clamp(num(rate, kind === 'confetti' ? 55 : 22), 1, 120), pal: Array.isArray(colors) && colors.length ? colors : PAL[kind] });
  start();
}

function feed(e, dt) {
  e.left -= dt; e.acc += e.rate * dt * clamp(S.w / 400, 0.8, 2.2);
  while (e.acc >= 1) {
    e.acc -= 1;
    if (e.kind === 'confetti') { const p = emit('confetti', rnd(-10, S.w + 10), -14, rnd(-50, 50), rnd(60, 230), pick(e.pal)); if (p) { p.g = 420; p.max = rnd(3.2, 4.6); } }
    else { const p = emit('embers', rnd(-10, S.w + 10), rnd(-14, S.h * 0.25), rnd(-25, 25), rnd(60, 170), pick(e.pal)); if (p) { p.g = 14; p.drag = 0.25; p.max = rnd(3, 5); p.w = rnd(1.2, 3); } }
  }
}

function start() {
  if (S.running || !S.inited) return;
  if (S.dirty) resize();
  S.running = true; S.last = 0; S.canvas.style.display = 'block'; S.canvas.classList.add('fx-live');
  S.rafId = requestAnimationFrame(frame);
}
function halt() {
  S.running = false; if (S.rafId) cancelAnimationFrame(S.rafId); S.rafId = 0;
  if (S.ctx) { S.ctx.setTransform(1, 0, 0, 1, 0, 0); S.ctx.clearRect(0, 0, S.canvas.width, S.canvas.height); }
  if (S.canvas) { S.canvas.style.display = 'none'; S.canvas.classList.remove('fx-live'); }
}

function frame(t) {
  S.rafId = 0; if (!S.running) return;
  try {
    if (S.dirty) resize();
    const dt = S.last ? Math.min(0.034, (t - S.last) / 1000) : 0.016; S.last = t;
    for (let i = S.emitters.length - 1; i >= 0; i--) { const e = S.emitters[i]; feed(e, dt); if (e.left <= 0) S.emitters.splice(i, 1); }
    const W = S.w, H = S.h, pool = S.pool;
    for (let i = 0; i < MAX; i++) {
      const p = pool[i]; if (!p.on) continue;
      p.life += dt;
      if (p.life >= p.max || p.y > H + 60 || p.x < -80 || p.x > W + 80) { p.on = false; S.alive--; continue; }
      const d = Math.exp(-p.drag * dt);
      p.vx *= d; p.vy = p.vy * d + p.g * dt; p.ph += p.vph * dt;
      p.x += (p.vx + Math.sin(p.ph) * p.sway) * dt; p.y += p.vy * dt;
      p.rot += p.vr * dt; p.flip += p.vflip * dt;
    }
    draw();
    if (S.alive <= 0 && !S.emitters.length) { S.alive = 0; halt(); return; }
  } catch { halt(); return; }
  S.rafId = requestAnimationFrame(frame);
}

function draw() {
  const g = S.ctx, r = S.dpr, pool = S.pool;
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  g.clearRect(0, 0, S.canvas.width, S.canvas.height);
  // pass 1: smoke, under everything
  g.setTransform(r, 0, 0, r, 0, 0);
  for (let i = 0; i < MAX; i++) {
    const p = pool[i]; if (!p.on || p.kind !== 'smoke') continue;
    const t = p.life / p.max, s = p.s0 + (p.s1 - p.s0) * (1 - (1 - t) * (1 - t));
    g.globalAlpha = p.a * Math.min(1, t / 0.12) * (1 - t);
    g.drawImage(sprite(p.color), p.x - s, p.y - s, s * 2, s * 2);
  }
  // pass 2: confetti, opaque paper with a darker back face
  for (let i = 0; i < MAX; i++) {
    const p = pool[i]; if (!p.on || p.kind !== 'confetti') continue;
    const t = p.life / p.max, c = Math.cos(p.rot), s = Math.sin(p.rot), fy = Math.cos(p.flip);
    g.setTransform(r * c, r * s, -r * s * fy, r * c * fy, r * p.x, r * p.y);
    g.globalAlpha = t < 0.72 ? 1 : (1 - t) / 0.28;
    g.fillStyle = p.color; g.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    if (fy < 0) { g.fillStyle = 'rgba(8,10,12,.2)'; g.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); }
    else if (fy > 0.82) { g.fillStyle = 'rgba(255,255,255,.22)'; g.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); }
  }
  // pass 3: light — glow, sparks, embers, stars
  g.setTransform(r, 0, 0, r, 0, 0); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
  for (let i = 0; i < MAX; i++) {
    const p = pool[i]; if (!p.on) continue;
    const k = p.kind, t = p.life / p.max;
    if (k === 'glow') {
      const s = p.s0 + (p.s1 - p.s0) * (1 - (1 - t) * (1 - t)); g.globalAlpha = p.a * (1 - t) * (1 - t);
      g.drawImage(sprite(p.color), p.x - s, p.y - s, s * 2, s * 2);
    } else if (k === 'sparks') {
      // a streak along the velocity: long faint tail, shorter bright body, white-hot head
      const sp = Math.hypot(p.vx, p.vy) || 1, len = clamp(sp * 0.075, 2.5, 52), ux = p.vx / sp, uy = p.vy / sp, a = Math.pow(1 - t, 1.3);
      g.strokeStyle = p.color;
      g.globalAlpha = a * 0.35; g.lineWidth = p.w * 0.7; g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(p.x - ux * len, p.y - uy * len); g.stroke();
      g.globalAlpha = a; g.lineWidth = p.w; g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(p.x - ux * len * 0.45, p.y - uy * len * 0.45); g.stroke();
      g.globalAlpha = a * 0.9; g.fillStyle = '#fff'; g.beginPath(); g.arc(p.x, p.y, p.w * 0.62, 0, TAU); g.fill();
      const hs = p.w * 5; g.globalAlpha = a * 0.5; g.drawImage(sprite(p.color), p.x - hs, p.y - hs, hs * 2, hs * 2);
    } else if (k === 'embers') {
      const a = Math.min(1, t / 0.1) * Math.pow(1 - t, 0.8) * (0.72 + 0.28 * Math.sin(p.ph * 3.1)), s = p.w * 4.5;
      g.globalAlpha = a * 0.6; g.drawImage(sprite(p.color), p.x - s, p.y - s, s * 2, s * 2);
      g.globalAlpha = a; g.fillStyle = p.color; g.beginPath(); g.arc(p.x, p.y, p.w, 0, TAU); g.fill();
    } else if (k === 'stars') {
      const e = Math.sin(Math.PI * Math.min(1, t * 1.05)), R = p.w * (0.35 + 0.65 * e), c = Math.cos(p.rot), s = Math.sin(p.rot), gs = R * 2.4;
      g.globalAlpha = e * 0.4; g.drawImage(sprite(p.color), p.x - gs, p.y - gs, gs * 2, gs * 2);
      g.setTransform(r * c, r * s, -r * s, r * c, r * p.x, r * p.y); g.globalAlpha = e; g.fillStyle = p.color;
      g.beginPath(); g.moveTo(0, -R); g.quadraticCurveTo(0, 0, R, 0); g.quadraticCurveTo(0, 0, 0, R); g.quadraticCurveTo(0, 0, -R, 0); g.quadraticCurveTo(0, 0, 0, -R); g.fill();
      g.setTransform(r, 0, 0, r, 0, 0);
    }
  }
  g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
}

function stopVisuals() {
  for (const p of S.pool) p.on = false; S.alive = 0; S.emitters.length = 0;
  if (S.inited) halt();
  if (S.flashEl) S.flashEl.classList.remove('fx-on');
  for (const [el, c] of S.classed) { clearTimeout(c.timer); try { el.classList.remove(c.name); } catch { /* gone */ } }
  S.classed.clear();
  for (const tw of [...S.tweens.values()]) tw.finish();
}

// ───────────────────────────── DOM effects ─────────────────────────────

function runClass(el, name, ms, vars) {                    // restartable one-shot CSS animation
  if (!el || !el.classList || !el.style) return;
  const prev = S.classed.get(el); if (prev) { clearTimeout(prev.timer); el.classList.remove(prev.name); }
  for (const k in vars) el.style.setProperty(k, vars[k]);
  el.classList.remove(name); void el.offsetWidth; el.classList.add(name);
  const done = () => { el.classList.remove(name); for (const k in vars) el.style.removeProperty(k); if (S.classed.get(el) === rec) S.classed.delete(el); };
  const rec = { name, timer: setTimeout(done, ms + 40) };
  S.classed.set(el, rec);
}

function shake(el, { strength = 6, duration = 360 } = {}) {
  if (!motionOn()) return;
  runClass(el, 'fx-shake', clamp(num(duration, 360), 60, 3000), { '--fx-amp': clamp(num(strength, 6), 0, 40) + 'px', '--fx-dur': clamp(num(duration, 360), 60, 3000) + 'ms' });
}

function pulse(el, { scale = 1.22, duration = 420 } = {}) {
  if (!motionOn()) return;
  runClass(el, 'fx-pop', clamp(num(duration, 420), 60, 3000), { '--fx-scale': String(clamp(num(scale, 1.22), 0.5, 3)), '--fx-dur': clamp(num(duration, 420), 60, 3000) + 'ms' });
}

function flash({ color = '#e5604d', duration = 120, opacity = 0.22, vignette = false } = {}) {
  if (!motionOn() || !S.flashEl) return;
  const f = S.flashEl, ms = clamp(num(duration, 120), 30, 4000);
  f.classList.remove('fx-on'); f.classList.toggle('fx-vignette', !!vignette);
  f.style.setProperty('--fx-color', String(color)); f.style.setProperty('--fx-peak', String(clamp(num(opacity, 0.22), 0, 1))); f.style.setProperty('--fx-dur', ms + 'ms');
  void f.offsetWidth; f.classList.add('fx-on');
  clearTimeout(f._fxT); f._fxT = setTimeout(() => f.classList.remove('fx-on'), ms + 40);
}

function setText(el, s) { try { if (el) el.textContent = s; } catch { /* ignore */ } }

function tween(el, ms, step, final) {                      // one tween per element; a new one cancels the old
  return new Promise(resolve => {
    const old = S.tweens.get(el); if (old) old.cancel();
    if (!el) return resolve();
    if (!motionOn() || !(ms > 0)) { final(); return resolve(); }
    let id = 0; const t0 = now();
    const end = () => { if (id) cancelAnimationFrame(id); id = 0; if (S.tweens.get(el) === rec) S.tweens.delete(el); resolve(); };
    const rec = { cancel: end, finish: () => { final(); end(); } };
    const tick = () => { id = 0; const k = (now() - t0) / ms; if (k >= 1 || hidden()) return rec.finish(); try { step(k); } catch { return rec.finish(); } id = requestAnimationFrame(tick); };
    S.tweens.set(el, rec); try { step(0); } catch { /* ignore */ } id = requestAnimationFrame(tick);
  });
}

function countUp(el, from, to, { duration = 700, format } = {}) {
  from = num(from, 0); to = num(to, 0);
  const fmt = v => { try { return String(typeof format === 'function' ? format(v) : Math.round(v)); } catch { return String(Math.round(v)); } };
  return tween(el, num(duration, 700), k => setText(el, fmt(from + (to - from) * (1 - Math.pow(1 - k, 3)))), () => setText(el, fmt(to)));
}

function typewriter(el, text, { cps = 45 } = {}) {
  const chars = Array.from(String(text ?? '')); cps = clamp(num(cps, 45), 1, 2000);
  let shown = -1;
  return tween(el, chars.length / cps * 1000, k => { const n = Math.floor(k * chars.length); if (n !== shown) { shown = n; setText(el, chars.slice(0, n).join('')); } }, () => setText(el, chars.join('')));
}

const HAPTICS = { light: [8], medium: [18], heavy: [34], success: [12, 50, 22], error: [28, 45, 28, 45, 28] };
function haptic(pattern = 'light') {
  if (!S.inited || !S.cfg.haptics || hidden() || typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
  const p = Array.isArray(pattern) ? pattern.map(v => clamp(num(v, 0), 0, 400)).slice(0, 12) : HAPTICS[pattern];
  if (p) navigator.vibrate(p);
}

// ───────────────────────────── sound ─────────────────────────────
// Everything is in F major / D minor. Signal path: voices → bus → highpass 70 Hz → gentle compressor →
// tanh soft clip → master gain. Big sounds also send to a small two-tap feedback delay ("room").

const hz = m => 440 * Math.pow(2, (m - 69) / 12);
const [A3, C3, D3, F3] = [57, 48, 50, 53];
const [D4, F4, A4, Bb4] = [62, 65, 69, 70];
const [C5, D5, E5, F5, G5, A5] = [72, 74, 76, 77, 79, 81];
const [C6, D6, F6, A6] = [84, 86, 89, 93];
const [C7, D7, F7] = [96, 98, 101];

function makeGraph(ac) {
  const bus = ac.createGain(), hp = ac.createBiquadFilter(), comp = ac.createDynamicsCompressor(), clip = ac.createWaveShaper(), master = ac.createGain();
  hp.type = 'highpass'; hp.frequency.value = 70; hp.Q.value = 0.5;
  comp.threshold.value = -16; comp.knee.value = 10; comp.ratio.value = 4; comp.attack.value = 0.004; comp.release.value = 0.16;
  const curve = new Float32Array(1024); for (let i = 0; i < 1024; i++) { const x = i / 511.5 - 1; curve[i] = Math.tanh(1.6 * x) / Math.tanh(1.6); }
  clip.curve = curve; clip.oversample = '2x'; master.gain.value = 0.5;
  bus.connect(hp); hp.connect(comp); comp.connect(clip); clip.connect(master); master.connect(ac.destination);
  const send = ac.createGain(), d1 = ac.createDelay(0.5), d2 = ac.createDelay(0.5), lp = ac.createBiquadFilter(), fb = ac.createGain(), ret = ac.createGain();
  d1.delayTime.value = 0.089; d2.delayTime.value = 0.151; lp.type = 'lowpass'; lp.frequency.value = 2600; fb.gain.value = 0.2; ret.gain.value = 0.42;
  send.connect(d1); d1.connect(lp); lp.connect(ret); lp.connect(d2); d2.connect(fb); fb.connect(d1); d2.connect(ret); ret.connect(bus);
  const len = Math.floor(ac.sampleRate * 2), buf = ac.createBuffer(1, len, ac.sampleRate), ch = buf.getChannelData(0);
  for (let i = 0; i < len; i++) ch[i] = Math.random() * 2 - 1;
  return { ac, bus, send, noiseBuf: buf, live: ac === S.ac };
}

function play(G, src, t, end) { src.start(t); src.stop(end); if (G.live) { S.sources.add(src); src.onended = () => S.sources.delete(src); } }

// amplitude envelope: 'exp' = pluck/decay to silence at t+dur, 'hold' = sustain then release r
function amp(G, t, dur, peak, dest, a = 0.004, shape = 'exp', r = 0.06) {
  const g = G.ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak, t + a);
  if (shape === 'hold') { g.gain.setValueAtTime(peak, Math.max(t + a, t + dur - r)); g.gain.linearRampToValueAtTime(0.0001, t + dur); }
  else g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  g.connect(dest); return g;
}

function tone(G, type, f, t, dur, peak, dest, { a, shape, r, f2, glide, detune = 0 } = {}) {
  const o = G.ac.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t); o.detune.value = detune;
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + (glide || dur));
  o.connect(amp(G, t, dur, peak, dest, a, shape, r)); play(G, o, t, t + dur + 0.03);
}

function noise(G, t, dur, peak, dest, { type = 'bandpass', f = 1000, f2, q = 1, a, shape, r } = {}) {
  const s = G.ac.createBufferSource(), fl = G.ac.createBiquadFilter(); s.buffer = G.noiseBuf; s.loop = true;
  fl.type = type; fl.Q.value = q; fl.frequency.setValueAtTime(f, t); if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t + dur);
  s.connect(fl); fl.connect(amp(G, t, dur, peak, dest, a, shape, r)); s.start(t, Math.random() * 1.5); s.stop(t + dur + 0.03);
  if (G.live) { S.sources.add(s); s.onended = () => S.sources.delete(s); }
}

// brass-like: two detuned saws + a sine body through a lowpass whose cutoff "blats" open then settles
function brass(G, midi, t, dur, peak, dest, { bright = 1, to, a = 0.022, r = 0.07 } = {}) {
  const f = hz(midi), fl = G.ac.createBiquadFilter(); fl.type = 'lowpass'; fl.Q.value = 0.9;
  fl.frequency.setValueAtTime(f * 1.3, t); fl.frequency.linearRampToValueAtTime(Math.min(f * 6 * bright, 5200), t + 0.04); fl.frequency.exponentialRampToValueAtTime(Math.min(f * 2.7 * bright, 3200), t + 0.22);
  fl.connect(amp(G, t, dur, peak, dest, a, 'hold', r));
  for (const [type, cents, lvl] of [['sawtooth', -7, 0.5], ['sawtooth', 7, 0.5], ['sine', 0, 0.35]]) {
    const o = G.ac.createOscillator(), g = G.ac.createGain(); o.type = type; o.detune.value = cents; g.gain.value = lvl;
    o.frequency.setValueAtTime(f, t); if (to) o.frequency.exponentialRampToValueAtTime(hz(to), t + dur * 0.85);
    o.connect(g); g.connect(fl); play(G, o, t, t + dur + 0.03);
  }
}
const chord = (G, notes, t, dur, peak, dest, o) => notes.forEach(n => brass(G, n, t, dur, peak / Math.sqrt(notes.length), dest, o));

const BELL = [[1, 1, 1], [2, 0.5, 0.7], [3.01, 0.26, 0.45], [4.2, 0.14, 0.3], [5.43, 0.07, 0.2]];
const TOLL = [[0.5, 0.3, 1], [1, 1, 0.9], [1.19, 0.5, 0.7], [1.5, 0.28, 0.55], [2, 0.5, 0.5], [2.51, 0.18, 0.35], [3.01, 0.12, 0.3]];
function bell(G, f, t, dur, peak, dest, partials = BELL) {
  for (const [ratio, lvl, life] of partials) if (f * ratio < 9000) tone(G, 'sine', f * ratio, t, dur * life, peak * lvl, dest, { a: 0.003 });
}
function snare(G, t, peak, dest) {
  noise(G, t, 0.075, peak, dest, { f: 2100, q: 0.7 }); noise(G, t, 0.04, peak * 0.5, dest, { type: 'highpass', f: 4800 });
  tone(G, 'triangle', 205, t, 0.05, peak * 0.5, dest, { f2: 160 });
}
function boom(G, t, peak, dest) {
  tone(G, 'sine', 135, t, 0.36, peak, dest, { f2: 58, a: 0.006 }); noise(G, t, 0.22, peak * 0.6, dest, { type: 'lowpass', f: 320, q: 0.5 });
}
function shimmer(G, midi, t, dur, peak, dest) {            // two slightly detuned sines beat against each other
  tone(G, 'sine', hz(midi), t, dur, peak, dest, { detune: -5 }); tone(G, 'sine', hz(midi), t, dur, peak, dest, { detune: 6 });
  tone(G, 'sine', hz(midi) * 2, t, dur * 0.5, peak * 0.3, dest, { a: 0.003 });
}

// each recipe: (G, t, out, wet) — `out` is the dry gain for this sound, `wet` feeds the room
const SOUNDS = {
  tap(G, t, out) {
    tone(G, 'sine', 920, t, 0.06, 0.26, out, { f2: 620, a: 0.002 }); noise(G, t, 0.012, 0.07, out, { type: 'highpass', f: 3200 });
  },
  send(G, t, out) {                                        // key down, dit, dah, key up
    noise(G, t, 0.018, 0.32, out, { f: 2600, q: 2 });
    tone(G, 'triangle', hz(F5), t + 0.006, 0.055, 0.2, out, { a: 0.003, shape: 'hold', r: 0.008 });
    tone(G, 'triangle', hz(F5), t + 0.1, 0.12, 0.2, out, { a: 0.003, shape: 'hold', r: 0.01 });
    noise(G, t + 0.226, 0.014, 0.18, out, { f: 2000, q: 2 });
  },
  win(G, t, out, wet) {                                    // C5 → F5, a rising fourth
    brass(G, C5, t, 0.13, 0.26, out); brass(G, F5, t + 0.13, 0.34, 0.26, out); brass(G, C5, t + 0.13, 0.34, 0.1, out);
    brass(G, F5, t + 0.13, 0.3, 0.07, wet);
  },
  bigwin(G, t, out, wet) {                                 // F A C | F-major chord, snare roll into the downbeat
    [F4, A4, C5].forEach((n, i) => brass(G, n, t + i * 0.13, 0.12, 0.26, out));
    chord(G, [A4, C5, F5], t + 0.4, 0.58, 0.4, out); chord(G, [C5, F5], t + 0.4, 0.36, 0.1, wet);
    for (let i = 0; i < 9; i++) snare(G, t + i * 0.044, 0.04 + i * 0.013, out);
    snare(G, t + 0.4, 0.2, out); snare(G, t + 0.4, 0.06, wet);
  },
  loss(G, t, out) {                                        // thud, then D4 sagging to A3
    tone(G, 'sine', 175, t, 0.22, 0.5, out, { f2: 82 }); noise(G, t, 0.12, 0.28, out, { type: 'lowpass', f: 520, q: 0.5 });
    brass(G, D4, t + 0.06, 0.56, 0.2, out, { bright: 0.55, to: A3, a: 0.04, r: 0.2 });
  },
  bigloss(G, t, out, wet) {                                // distant guns over a low open fifth
    noise(G, t, 1.35, 0.42, out, { type: 'lowpass', f: 430, f2: 140, q: 0.5, a: 0.08 });
    [[0, 0.5], [0.21, 0.3], [0.5, 0.38], [0.82, 0.2]].forEach(([d, p]) => { boom(G, t + d, p, out); boom(G, t + d, p * 0.3, wet); });
    chord(G, [D3, A3, D4], t + 0.14, 1.12, 0.26, out, { bright: 0.6, a: 0.08, r: 0.4 });
  },
  capture(G, t, out, wet) {                                // bright bell over an F-major stab
    bell(G, hz(F6), t, 0.95, 0.2, out); bell(G, hz(C6), t, 0.8, 0.08, out); bell(G, hz(F6), t, 0.8, 0.1, wet);
    chord(G, [F4, A4, C5], t, 0.24, 0.32, out);
  },
  medal(G, t, out, wet) {                                  // F A C F A, shimmering
    [F5, A5, C6, F6, A6].forEach((n, i) => { const d = i === 4 ? 0.85 : 0.6; shimmer(G, n, t + i * 0.075, d, 0.11, out); shimmer(G, n, t + i * 0.075, d, 0.05, wet); });
  },
  levelup(G, t, out, wet) {                                // fast F-major run up two octaves, then sparkle
    [F4, A4, C5, F5, A5, C6].forEach((n, i) => { tone(G, 'triangle', hz(n), t + i * 0.065, 0.24, 0.22, out); tone(G, 'sine', hz(n) * 2, t + i * 0.065, 0.16, 0.06, out); });
    bell(G, hz(F6), t + 0.39, 0.7, 0.16, out); bell(G, hz(F6), t + 0.39, 0.7, 0.08, wet);
    [C7, F7, D7, A6, C7, F7].forEach((n, i) => tone(G, 'sine', hz(n), t + 0.43 + i * 0.07, 0.13, 0.05, i % 2 ? wet : out));
    noise(G, t + 0.36, 0.55, 0.03, out, { type: 'highpass', f: 6000, a: 0.15 });
  },
  streak(G, t, out) {                                      // flame whoosh, then a tick
    noise(G, t, 0.36, 0.3, out, { f: 480, f2: 3200, q: 1.4, a: 0.17 }); noise(G, t, 0.3, 0.1, out, { type: 'lowpass', f: 300, f2: 900, a: 0.14 });
    tone(G, 'sine', hz(A6), t + 0.3, 0.09, 0.17, out, { a: 0.002 }); noise(G, t + 0.3, 0.012, 0.1, out, { type: 'highpass', f: 4000 });
  },
  order(G, t, out) {                                       // rubber stamp, then A5 → D6
    tone(G, 'sine', 240, t, 0.09, 0.46, out, { f2: 112, a: 0.002 }); noise(G, t, 0.05, 0.3, out, { type: 'lowpass', f: 1500, q: 0.6 });
    tone(G, 'triangle', hz(A5), t + 0.09, 0.08, 0.17, out); tone(G, 'triangle', hz(D6), t + 0.16, 0.2, 0.17, out); tone(G, 'sine', hz(D6) * 2, t + 0.16, 0.12, 0.04, out);
  },
  fallen(G, t, out, wet) {                                 // three tolls of a D bell, each fainter
    [[0, 0.34, 1.5], [0.95, 0.28, 1.5], [1.9, 0.22, 0.95]].forEach(([d, p, len]) => { bell(G, hz(D4), t + d, len, p, out, TOLL); bell(G, hz(D4), t + d, len * 0.7, p * 0.25, wet, TOLL); noise(G, t + d, 0.05, p * 0.2, out, { f: 900, q: 0.8 }); });
    noise(G, t, 2.7, 0.1, out, { type: 'lowpass', f: 260, q: 0.5, a: 0.5 });
  },
  empire(G, t, out, wet) {                                 // C | F F F — | B♭ | C | F major, held
    const call = [[0, 0.26, [F4, C5]], [0.3, 0.11, [A4, F5]], [0.44, 0.11, [A4, F5]], [0.58, 0.42, [A4, C5, F5]], [1.08, 0.34, [Bb4, D5, F5]], [1.48, 0.38, [C5, E5, G5]]];
    for (const [d, len, notes] of call) { chord(G, notes, t + d, len, 0.38, out); snare(G, t + d, 0.12, out); }
    chord(G, [F4, C5, F5, A5, C6], t + 1.92, 1.55, 0.5, out, { r: 0.35 }); chord(G, [C5, F5, A5], t + 1.92, 1.2, 0.14, wet, { r: 0.35 });
    for (let i = 0; i < 10; i++) snare(G, t + 1.5 + i * 0.042, 0.04 + i * 0.014, out);
    snare(G, t + 1.92, 0.22, out); noise(G, t + 1.92, 1.4, 0.1, out, { type: 'highpass', f: 3600, a: 0.01 });
    [[0, F3], [0.58, F3], [1.48, C3], [1.92, F3]].forEach(([d, n]) => tone(G, 'sine', hz(n), t + d, 0.42, 0.3, out, { f2: hz(n) * 0.92, a: 0.005 }));
    [[1.92, F6], [2.1, C7], [2.28, A6], [2.46, F7]].forEach(([d, n]) => { bell(G, hz(n), t + d, 0.9, 0.08, out); bell(G, hz(n), t + d, 0.7, 0.05, wet); });
  },
  error(G, t, out) {                                       // two muted buzzes, F4 then D4
    for (const [d, n, len] of [[0, F4, 0.09], [0.13, D4, 0.17]]) {
      const o = G.ac.createOscillator(), fl = G.ac.createBiquadFilter(); o.type = 'square'; o.frequency.value = hz(n); fl.type = 'lowpass'; fl.frequency.value = 1100;
      o.connect(fl); fl.connect(amp(G, t + d, len, 0.15, out, 0.004, 'hold', 0.02)); play(G, o, t + d, t + d + len + 0.03);
    }
  },
};
const DUR = { tap: 0.08, send: 0.26, win: 0.55, bigwin: 1.3, loss: 0.7, bigloss: 1.45, capture: 1.1, medal: 1.25, levelup: 1.2, streak: 0.45, order: 0.4, fallen: 3, empire: 3.9, error: 0.35 };

function schedule(G, name, volume, t) {
  const out = G.ac.createGain(), wet = G.ac.createGain(); out.gain.value = volume; wet.gain.value = volume;
  out.connect(G.bus); wet.connect(G.send); SOUNDS[name](G, t, out, wet);
}

function unlock() {
  if (!HAS_DOM || !S.inited) return;
  if (!S.ac) {
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    S.ac = new AC({ latencyHint: 'interactive' }); S.graph = makeGraph(S.ac);
    const b = S.ac.createBufferSource(); b.buffer = S.ac.createBuffer(1, 1, S.ac.sampleRate); b.connect(S.ac.destination); b.start(0);   // iOS wants a real start() inside the gesture
  }
  S.unlocked = true;
  if (S.ac.state !== 'running' && S.ac.state !== 'closed' && !S.resuming) {
    const done = () => { S.resuming = null; };
    S.resuming = Promise.resolve(S.ac.resume()).then(done, done);
  }
}

function sound(name, { volume = 1 } = {}) {
  if (!S.inited || !S.cfg.sound || !S.unlocked || !S.ac || hidden() || !has(SOUNDS, name)) return;
  const go = () => {
    if (S.ac.state !== 'running' || !S.cfg.sound || hidden()) return;
    const t = S.ac.currentTime; if (S.lastPlayed[name] !== undefined && t - S.lastPlayed[name] < 0.04) return;   // de-dupe double triggers
    S.lastPlayed[name] = t;
    try { schedule(S.graph, name, clamp(num(volume, 1), 0, 1.5), t + 0.012); } catch { /* never throw */ }
  };
  if (S.ac.state === 'running') go(); else if (S.resuming) S.resuming.then(go);
}

function stopSound() {
  for (const s of [...S.sources]) { try { s.onended = null; s.stop(); } catch { /* already stopped */ } }
  S.sources.clear();
}

// Offline render of one sound through the same graph (tests, tuning). Resolves { peak, rms, duration } or null.
async function render(name) {
  const OAC = HAS_DOM && (window.OfflineAudioContext || window.webkitOfflineAudioContext);
  if (!OAC || !has(SOUNDS, name)) return null;
  const sr = 44100, oc = new OAC(1, sr * 6, sr); schedule(makeGraph(oc), name, 1, 0.01);
  const d = (await oc.startRendering()).getChannelData(0); let peak = 0, sum = 0, last = 0;
  for (let i = 0; i < d.length; i++) { const v = Math.abs(d[i]); if (v > peak) peak = v; sum += v * v; if (v > 0.004) last = i; }
  const n = Math.max(1, last); return { peak, rms: Math.sqrt(sum / n), duration: last / sr };
}

// ───────────────────────────── celebrate ─────────────────────────────

const RED = '#e5604d', GOLD = '#e3b85c';

function celebrate({ tone: mood = 'good', magnitude = 1, kind = 'normal', at = null, el = null } = {}) {
  if (!S.inited || hidden()) return Promise.resolve();
  const m = clamp(Math.round(num(magnitude, 1)), 1, 5), k = (m - 1) / 4, W = vw(), H = vh();
  const p = at && Number.isFinite(+at.x) && Number.isFinite(+at.y) ? { x: +at.x, y: +at.y } : { x: W / 2, y: H * 0.42 };
  const steps = []; const add = (ms, fn) => steps.push([ms, fn]);
  const vol = 0.7 + 0.3 * k, root = S.root;
  const B = (kind_, o = {}, q = p) => burst(q.x, q.y, { kind: kind_, ...o });
  const fountain = (n, pw, colors) => { burst(W * 0.08, H * 0.98, { count: n, power: pw, angle: -1.2, spread: 0.6, colors }); burst(W * 0.92, H * 0.98, { count: n, power: pw, angle: -1.94, spread: 0.6, colors }); };
  let dur = 600;

  const good = () => {
    const big = m >= 4; dur = big ? 1500 : 800;
    add(0, () => { sound(big ? 'bigwin' : 'win', { volume: vol }); haptic(m <= 2 ? 'light' : big ? 'success' : 'medium'); if (el) pulse(el); });
    add(big ? 400 : 130, () => { B('confetti', { count: 16 + m * 13, power: 0.65 + 0.13 * m }); if (m >= 2) B('stars', { count: 2 + m * 2, power: 0.6 + 0.15 * m }); if (m >= 5) rain({ duration: 1100, rate: 40 }); });
  };
  const bad = () => {
    const big = m >= 4; dur = big ? 1600 : 900;
    add(0, () => {
      sound(big ? 'bigloss' : 'loss', { volume: vol }); haptic(m >= 3 ? 'error' : 'medium');
      flash({ color: RED, duration: 160 + 60 * m, opacity: 0.12 + 0.05 * m, vignette: true });
      B('smoke', { count: 4 + m * 2, power: 0.7 + 0.12 * m }); B('sparks', { count: 6 + m * 5, power: 0.5 + 0.12 * m, colors: PAL.embers });
      if (m >= 2) shake(el || root, { strength: 2 + 1.6 * m, duration: 240 + 50 * m });
    });
    if (big) add(210, () => { B('smoke', { count: 5, power: 1 }, { x: p.x + rnd(-40, 40), y: p.y + rnd(-30, 30) }); B('embers', { count: 6 + m * 2, power: 1 }); });
  };
  const gold = () => {
    dur = 900;
    add(0, () => { sound('win', { volume: vol }); haptic(m >= 3 ? 'success' : 'light'); if (el) pulse(el); });
    add(130, () => { B('stars', { count: 5 + m * 3, power: 0.7 + 0.15 * m }); B('confetti', { count: 10 + m * 9, power: 0.6 + 0.12 * m, colors: PAL.gold }); });
  };

  switch (kind) {
    case 'city_captured':
      dur = 1500;
      add(0, () => { sound('capture', { volume: vol }); haptic('success'); flash({ color: GOLD, duration: 320, opacity: 0.07 + 0.03 * m }); B('stars', { count: 6 + m * 2, power: 0.8 + 0.12 * m }); B('sparks', { count: 10 + m * 4, power: 0.6 + 0.1 * m }); if (el) pulse(el); });
      add(90, () => B('confetti', { count: 26 + m * 12, power: 0.75 + 0.12 * m }));
      if (m >= 4) add(260, () => rain({ duration: 1000, rate: 38 }));
      break;
    case 'city_lost':
      dur = 1700;
      add(0, () => { sound('bigloss', { volume: vol }); haptic('error'); flash({ color: RED, duration: 320 + 60 * m, opacity: 0.2 + 0.04 * m, vignette: true }); shake(el || root, { strength: 4 + 1.6 * m, duration: 420 + 40 * m }); B('sparks', { count: 14 + m * 4, power: 0.7 + 0.1 * m, colors: PAL.embers }); B('smoke', { count: 7 + m * 2, power: 0.9 + 0.1 * m }); });
      add(220, () => { B('embers', { count: 10 + m * 3, power: 1 }); B('smoke', { count: 5, power: 1.1 }, { x: p.x + rnd(-50, 50), y: p.y + rnd(-30, 30) }); });
      if (m >= 4) add(500, () => rain({ kind: 'embers', duration: 1100, rate: 16 }));
      break;
    case 'satrapy':
      dur = 2300;
      add(0, () => { sound('bigwin', { volume: vol }); haptic('success'); if (el) pulse(el); });
      add(400, () => { flash({ color: GOLD, duration: 420, opacity: 0.12 }); B('confetti', { count: 50 + m * 8, power: 1.1 }); B('stars', { count: 12, power: 1.2 }); fountain(16 + m * 3, 1.15); rain({ duration: 1500, rate: 46 }); });
      break;
    case 'medal':
      dur = 1500;
      add(0, () => { sound('medal', { volume: vol }); haptic('success'); B('stars', { count: 8 + m * 2, power: 1 }); if (el) pulse(el, { scale: 1.3, duration: 520 }); });
      [150, 300, 450].forEach((d, i) => add(d, () => B('stars', { count: 4 + m, power: 0.8 + i * 0.25 })));
      add(300, () => B('confetti', { count: 14 + m * 6, power: 0.8, colors: PAL.gold }));
      break;
    case 'operation':
      if (mood === 'bad') { bad(); break; }
      dur = 1700;
      add(0, () => { sound('bigwin', { volume: vol }); haptic('success'); if (el) pulse(el); });
      add(400, () => { flash({ color: GOLD, duration: 300, opacity: 0.09 }); B('sparks', { count: 18 + m * 4, power: 0.9 }); B('confetti', { count: 34 + m * 10, power: 0.95 }); B('stars', { count: 5 + m, power: 1 }); });
      break;
    case 'levelup':
      dur = 1500;
      add(0, () => { sound('levelup', { volume: vol }); haptic('success'); if (el) pulse(el, { scale: 1.3, duration: 520 }); fountain(16 + m * 4, 1 + 0.06 * m); });
      [0, 130, 260, 390].forEach((d, i) => add(d, () => burst(p.x + (i - 1.5) * 34, p.y - i * 16, { kind: 'stars', count: 3 + m, power: 0.8 })));
      break;
    case 'streak':
      dur = 700;
      add(0, () => { sound('streak', { volume: vol }); haptic(m >= 3 ? 'medium' : 'light'); B('embers', { count: 8 + m * 3, power: 0.9 }); if (el) pulse(el, { scale: 1.2 + 0.04 * m }); });
      add(300, () => { B('sparks', { count: 8 + m * 4, power: 0.5 + 0.08 * m, angle: -Math.PI / 2, spread: 1.5 }); if (m >= 4) B('stars', { count: 4, power: 0.8 }); });
      break;
    case 'tehran_fallen':
      dur = 3200;
      add(0, () => { sound('fallen', { volume: 1 }); haptic('error'); flash({ color: '#b3261a', duration: 900, opacity: 0.38, vignette: true }); shake(root, { strength: 11, duration: 700 }); B('smoke', { count: 12, power: 1.3 }); B('sparks', { count: 22, power: 0.9, colors: PAL.embers }); rain({ kind: 'embers', duration: 2600, rate: 20 }); });
      [950, 1900].forEach(d => add(d, () => { haptic('heavy'); flash({ color: '#b3261a', duration: 700, opacity: 0.2, vignette: true }); shake(root, { strength: 4, duration: 300 }); burst(rnd(W * 0.2, W * 0.8), rnd(H * 0.3, H * 0.6), { kind: 'smoke', count: 7, power: 1.2 }); }));
      break;
    case 'tehran_freed':
      dur = 2900;
      add(0, () => { sound('bigwin', { volume: 1 }); haptic('success'); });
      add(400, () => { sound('capture', { volume: 0.8 }); flash({ color: GOLD, duration: 520, opacity: 0.16 }); B('confetti', { count: 60, power: 1.2 }); B('stars', { count: 14, power: 1.3 }); fountain(22, 1.2); rain({ duration: 2000, rate: 46 }); if (el) pulse(el); });
      [800, 1200].forEach(d => add(d, () => burst(rnd(W * 0.2, W * 0.8), rnd(H * 0.2, H * 0.5), { kind: 'stars', count: 8, power: 1 })));
      break;
    case 'empire':
      dur = 4200;
      add(0, () => { sound('empire', { volume: 1 }); haptic('medium'); fountain(14, 1.05, PAL.gold); });
      add(580, () => { haptic('medium'); B('stars', { count: 10, power: 1.1 }); });
      [1080, 1480].forEach((d, i) => add(d, () => burst(W * (i ? 0.72 : 0.28), H * 0.36, { kind: 'sparks', count: 18, power: 0.85 })));
      add(1920, () => { haptic('success'); flash({ color: GOLD, duration: 700, opacity: 0.2 }); B('confetti', { count: 60, power: 1.3 }); B('stars', { count: 16, power: 1.4 }); fountain(24, 1.25); rain({ duration: 2100, rate: 48 }); if (el) pulse(el, { scale: 1.3, duration: 600 }); });
      [2350, 2800].forEach(d => add(d, () => burst(rnd(W * 0.15, W * 0.85), rnd(H * 0.18, H * 0.5), { kind: 'stars', count: 9, power: 1.1, colors: PAL.gold })));
      break;
    case 'order_done':
      dur = 600;
      add(0, () => { sound('order', { volume: vol }); haptic(m >= 4 ? 'medium' : 'light'); if (el) pulse(el, { scale: 1.12, duration: 320 }); });
      add(90, () => { B('confetti', { count: 8 + m * 3, power: 0.5 + 0.06 * m, colors: PAL.gold }); B('stars', { count: 2 + (m >> 1), power: 0.6 }); });
      break;
    default:
      (mood === 'bad' ? bad : mood === 'gold' ? gold : good)();
  }

  return new Promise(resolve => {
    const fin = () => { S.pending.delete(fin); resolve(); };
    S.pending.add(fin);
    for (const [ms, fn] of steps) later(ms, fn);
    later(dur, fin);
  });
}

function stop() {
  for (const id of S.timers) clearTimeout(id); S.timers.clear();
  stopVisuals(); stopSound();
  if (HAS_DOM && typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function' && S.inited && S.cfg.haptics) { try { navigator.vibrate(0); } catch { /* ignore */ } }
  for (const fin of [...S.pending]) fin();
}

// ───────────────────────────── public surface ─────────────────────────────

const guard = (fn, fallback) => (...a) => { try { return fn(...a); } catch { return typeof fallback === 'function' ? fallback(...a) : fallback; } };
const settled = () => Promise.resolve();

export const fx = {
  init: guard(init), configure: guard(configure, () => ({ ...S.cfg })), unlock: guard(unlock),
  sound: guard(sound), burst: guard(burst), rain: guard(rain), shake: guard(shake), flash: guard(flash), pulse: guard(pulse),
  countUp: guard(countUp, settled), typewriter: guard(typewriter, settled), haptic: guard(haptic),
  celebrate: guard(celebrate, settled), stop: guard(stop),
  sounds: Object.keys(SOUNDS), kinds: KINDS, durations: DUR,
  _alive: () => S.alive, _running: () => S.running, _audio: () => S.ac ? S.ac.state : 'none',
  _render: guard(render, () => Promise.resolve(null)),
};
export default fx;
