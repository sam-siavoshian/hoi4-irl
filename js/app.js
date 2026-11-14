import { simulate, sitrep, statusOf, enemyForce, mapMeta, ACTIONS, WIN_ACTIONS, LOSS_ACTIONS, UNIT_TYPES, TRAITS, MEDALS, rankOf, rankIndex, DAY, havKm } from './engine.js';
import { MapView, FRONT_COLORS } from './map.js';
import { classify, assess, MODELS } from './classify.js';
import { pickEngine, startDictation, hasBrowserSTT, hasRecorder } from './voice.js';
import * as store from './store.js';

const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtDate = (ts, o = { weekday: 'short', day: 'numeric', month: 'short' }) => new Date(ts).toLocaleDateString(undefined, o);
const fmtTime = ts => new Date(ts).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
const persian = (ts, o = { day: 'numeric', month: 'long', year: 'numeric' }) => { try { return new Intl.DateTimeFormat('en-u-ca-persian', o).format(ts).replace(/\s*AP$/, ''); } catch { return ''; } };
const dayKey = ts => Math.floor((ts - new Date(ts).getTimezoneOffset() * 60000) / DAY);

// ---------- icons (24px grid, 1.6 stroke) ----------
const IC = {
  flag: 'M5 21V4m0 1h12l-2.5 4 2.5 4H5', book: 'M5 4h11a3 3 0 013 3v13H8a3 3 0 01-3-3zM5 17a3 3 0 013-3h11M9 8h6', mic: 'M12 3a3 3 0 00-3 3v5a3 3 0 006 0V6a3 3 0 00-3-3zM5.5 11a6.5 6.5 0 0013 0M12 17.5V21',
  shield: 'M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z', compass: 'M12 21a9 9 0 100-18 9 9 0 000 18zM15.5 8.5l-2 5-5 2 2-5z', layers: 'M12 4l9 5-9 5-9-5zM3 14l9 5 9-5',
  locate: 'M12 8a4 4 0 100 8 4 4 0 000-8zM12 2v3m0 14v3M2 12h3m14 0h3', plus: 'M12 5v14M5 12h14', minus: 'M5 12h14', x: 'M6 6l12 12M18 6L6 18', chev: 'M9 6l6 6-6 6', back: 'M15 6l-6 6 6 6',
  check: 'M5 12.5l4.5 4.5L19 7.5', trash: 'M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13', edit: 'M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4', share: 'M12 15V3m0 0L8 7m4-4l4 4M5 12v7a1 1 0 001 1h12a1 1 0 001-1v-7',
  copy: 'M9 9h10v11H9zM5 15V4h10', down: 'M12 4v12m0 0l-4-4m4 4l4-4M5 20h14', up: 'M12 20V8m0 0l-4 4m4-4l4 4M5 4h14', play: 'M8 5l11 7-11 7z', pause: 'M8 5v14M16 5v14',
  cal: 'M5 6h14v14H5zM5 10h14M9 3v4M15 3v4', target: 'M12 21a9 9 0 100-18 9 9 0 000 18zM12 16a4 4 0 100-8 4 4 0 000 8zM12 12h.01', medal: 'M8 3l4 7 4-7M12 21a5.5 5.5 0 100-11 5.5 5.5 0 000 11zM12 13.5v4',
  star: 'M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.9 6.8 19.6l1-5.8L3.5 9.7l5.9-.8z', bolt: 'M13 3L5 13h6l-1 8 8-10h-6z', scales: 'M12 4v16M6 20h12M5 8h14M5 8l-2.5 6a2.7 2.7 0 005 0zM19 8l-2.5 6a2.7 2.7 0 005 0z',
  flame: 'M12 21c-3.5 0-6-2.5-6-6 0-3 2-4.5 3-7 .5 2 1.5 3 2.5 3.5C11 8 12 5 14.5 3c0 4 3.5 5.5 3.5 10.5 0 4-2.5 7.500-6 7.500z', users: 'M9 11a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM2.500 20c0-3.500 3-6 6.500-6s6.500 2.500 6.500 6M16 4.500a3.500 3.500 0 010 6.500M18 14.500c2 .8 3.500 2.800 3.500 5.500',
  factory: 'M3 20h18M5 20V10l5 3v-3l5 3V6h4v14', plane: 'M12 3v18M3 13.500l9-5 9 5M9 21h6', anchor: 'M12 8a2 2 0 100-4 2 2 0 000 4zM12 8v13M5 13a7 7 0 0014 0M9 12h6', tank: 'M4 15a3 3 0 003 3h10a3 3 0 000-6H7a3 3 0 00-3 3zM8 12V8h7l2 4M15 8l5-1',
  arrowR: 'M4 12h15m0 0l-5-5m5 5l-5 5', arrowL: 'M20 12H5m0 0l5-5m-5 5l5 5', ring: 'M12 20a8 8 0 100-16 8 8 0 000 16zM12 9v6M9 12h6', bomb: 'M10 21a6 6 0 100-12 6 6 0 000 12zM14 10l3-3M17 4v2M20 7h-2M19.500 4.500L18.500 5.500',
  fort: 'M4 20V8h3v3h3V8h4v3h3V8h3v12zM10 20v-4h4v4', box: 'M4 8l8-4 8 4v8l-8 4-8-4zM4 8l8 4 8-4M12 12v8', swords: 'M5 4l10 10M4 4h3M4 4v3M19 4L9 14M20 4h-3M20 4v3M6 15l3 3M5 20l2.500-2.500M18 15l-3 3M19 20l-2.500-2.500',
  crown: 'M4 18l-1-10 5 4 4-7 4 7 5-4-1 10zM4 21h16', gear: 'M12 15a3 3 0 100-6 3 3 0 000 6zM12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10l2 2M19 5l-2 2M7 17l-2 2', clock: 'M12 21a9 9 0 100-18 9 9 0 000 18zM12 7v5l3 2',
  image: 'M4 5h16v14H4zM4 16l4.500-4.500 4 4 2.500-2.500 5 5M15 9.500h.01', spark: 'M12 3l1.800 5.200L19 10l-5.200 1.800L12 17l-1.800-5.200L5 10l5.200-1.800zM18.500 16l.7 1.800 1.800.7-1.800.7-.7 1.800-.7-1.800-1.800-.7 1.800-.7z',
  terrain: 'M2 19l6.500-10 4 6 3-4 6.500 8z', user: 'M12 11a4 4 0 100-8 4 4 0 000 8zM4.500 21c.5-4 3.500-6.500 7.500-6.500s7 2.500 7.500 6.500', undo: 'M8 5L4 9l4 4M4 9h10a5 5 0 010 10h-3', info: 'M12 21a9 9 0 100-18 9 9 0 000 18zM12 11v6M12 7.500h.01',
  globe: 'M12 21a9 9 0 100-18 9 9 0 000 18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18', pen: 'M5 19l1.500-5L16 4.500l3.500 3.500L10 17.500zM4 21h16', equal: 'M6 9h12M6 15h12',
};
const I = (n, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true"><path d="${IC[n] || IC.info}"/></svg>`;
const ACT_ICON = { arrow: 'arrowR', armor: 'tank', pocket: 'ring', air: 'plane', naval: 'anchor', build: 'factory', fort: 'fort', unit: 'shield', bomb: 'bomb' };
const actIcon = (a, outcome) => (ACTIONS[a].icon === 'arrow' && outcome === 'loss' ? 'arrowL' : ACT_ICON[ACTIONS[a].icon] || 'swords');

let map, view, data, st, live;
const ui = { sheet: null, arg: null, stack: [], tab: 'army', report: null, dict: null, logOpen: new Set(), filter: 'all', day: null, asOf: null, playing: null, assess: null, assessBusy: false, emblem: 0 };

const MODES = [['political', 'Political', 'flag'], ['life', 'Life areas', 'user'], ['infra', 'Infrastructure', 'factory'], ['supply', 'Supply', 'box'], ['air', 'Air', 'plane'], ['terrain', 'Terrain', 'terrain']];
const NAV = [['fronts', 'Fronts', 'flag'], ['chronicle', 'Chronicle', 'book'], ['report', '', 'mic'], ['forces', 'Forces', 'shield'], ['staff', 'Staff', 'compass']];
const OP_NAMES = ['Simorgh', 'Derafsh', 'Kaveh', 'Arash', 'Tondar', 'Alborz', 'Sepand', 'Homa', 'Zolfaghar', 'Atropat', 'Mehr', 'Anahita', 'Tishtar', 'Verethragna', 'Damavand', 'Rakhsh'];

// ---------- boot ----------
async function boot() {
  map = await (await fetch('data/map.json')).json();
  data = store.load();
  view = new MapView($('#base'), $('#over'), map);
  view.onTap = onMapTap;
  $('#nav').innerHTML = NAV.map(([id, name, ic]) => (id === 'report' ? `<button class="report" data-act="open" data-sheet="report" aria-label="Report">${I(ic)}</button>` : `<button data-act="open" data-sheet="${id}">${I(ic)}<span>${name}</span></button>`)).join('');
  $('#layers-btn').innerHTML = I('layers'); $('#home-btn').innerHTML = I('locate'); $('#zin-btn').innerHTML = I('plus'); $('#zout-btn').innerHTML = I('minus');
  $('#sheet .x').innerHTML = I('x'); $('#sheet .back').innerHTML = I('back');
  document.addEventListener('click', onClick);
  document.addEventListener('input', onInput);
  document.addEventListener('change', onInput);
  window.addEventListener('resize', () => view.resize());
  window.visualViewport?.addEventListener('resize', () => view.resize());
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
  setInterval(() => { if (!ui.playing) refresh(); }, 60000);
  view.setMode(data.mode || 'political');
  refresh();
  if (!data.onboarded) openSheet('welcome'); else greet();
  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});
  window.__artesh = { get st() { return st; }, get live() { return live; }, get data() { return data; }, view, map, commitReports, refresh, ui };
}

const labels = () => Object.fromEntries(map.fronts.map(f => [f.id, data.labels[f.id] || f.defaultLabel]));
const front = id => map.fronts.find(f => f.id === id);
const activeFronts = () => map.fronts.filter(f => !data.off.includes(f.id));
function persist() { if (!store.save(data)) toast('Storage is full — export a backup from Staff.'); }

function refresh() {
  const now = Date.now();
  live = simulate(map, data.reports, now, { off: data.off });
  st = ui.asOf ? simulate(map, data.reports.filter(r => r.ts <= ui.asOf), ui.asOf, { off: data.off }) : live;
  checkOps();
  view.off = data.off; view.pins = data.ops.filter(o => o.prov != null && !o.archived).map(o => ({ prov: o.prov, done: !!o.doneTs, failed: !o.doneTs && now > o.due }));
  view.setState(st, labels());
  renderTop(); renderAlerts(); renderLegend(); renderReplay();
  if (ui.sheet && !['report', 'welcome', 'opnew'].includes(ui.sheet) && !document.activeElement?.matches?.('input,textarea,select')) renderSheet();
}

function greet() {
  const p = persian(Date.now(), { day: 'numeric', month: 'numeric' }); // month/day in the Solar Hijri calendar
  const [m, d] = p.split('/').map(Number);
  if (m === 1 && d <= 2) toast('Nowruz Pirouz. A new year on every front.', 6000);
  else if (m === 9 && d === 30) toast('Shab-e Yalda. The longest night ends at dawn.', 6000);
  else if (m === 8 && d === 7) toast('7 Aban — Cyrus the Great Day.', 6000);
}

// ---------- chrome ----------
function renderTop() {
  const n = st.nation;
  $('#nation-name').textContent = st.empire ? n.name : 'Iran';
  $('#nation-date').textContent = `${fmtDate(st.now, { day: 'numeric', month: 'short' })} · ${persian(st.now, { day: 'numeric', month: 'long' })}`;
  const tone = v => (v >= 60 ? 'good' : v >= 35 ? 'warn' : 'bad');
  const s = (ic, v, cls = '', title = '') => `<span class="stat num ${cls}" title="${title}">${I(ic)}${v}</span>`;
  $('#stats').innerHTML = s('scales', n.stability + '%', tone(n.stability), 'Stability') + s('bolt', n.warSupport + '%', tone(n.warSupport), 'War support') + s('flame', st.dayStreak, st.dayStreak ? 'hot' : '', 'Day streak')
    + s('shield', n.divisions, 'wide', 'Divisions') + s('factory', n.civActive + n.milActive, 'wide', 'Factories') + s('plane', n.planes, 'wide', 'Aircraft') + s('anchor', n.ships, 'wide', 'Ships');
}

function alertsList() {
  const out = []; const L = labels();
  if (st.empire) out.push(['gold', 'The Achaemenid Empire is restored', 'nation']);
  if (st.tehranFallen) out.push(['crit', 'Tehran has fallen', `front:${st.terr.occ.get(map.tehran)}`]);
  else if (st.terr.threat && st.terr.threat.km < 300) out.push(['crit', `Enemy ${st.terr.threat.km} km from Tehran`, `front:${st.terr.threat.front}`]);
  for (const f of activeFronts()) {
    const fr = st.fronts[f.id], s = statusOf(fr.pos);
    if (s.tone === 'bad' || (s.tone === 'crit' && !st.tehranFallen && st.terr.threat?.front !== f.id)) out.push(['crit', `${L[f.id]}: ${s.text.toLowerCase()}`, `front:${f.id}`]);
    else if (fr.streak <= -3) out.push(['warn', `${L[f.id]}: ${-fr.streak} defeats in a row`, `front:${f.id}`]);
    else if (fr.streak >= 3) out.push(['good', `${L[f.id]}: ${fr.streak} victories in a row`, `front:${f.id}`]);
    else if (fr.supply < 55) out.push(['warn', `${L[f.id]}: supply ${Math.round(fr.supply)}%`, `front:${f.id}`]);
  }
  for (const o of data.ops) if (!o.doneTs && !o.archived && o.due > st.now && o.due - st.now < 2 * DAY) out.push(['warn', `Operation ${o.name}: ${Math.max(1, Math.ceil((o.due - st.now) / 3600000))} h left`, 'ops']);
  const meta = mapMeta(map); const dmg = meta.buildings.filter(b => st.bld[b.id].dmg > 0.25).length + Object.values(st.states).filter(s => s.dmg > 0.25).length;
  if (dmg) out.push(['warn', `${dmg} site${dmg > 1 ? 's' : ''} bombed, repairs under way`, 'forces:industry']);
  if (!ui.asOf) {
    const quiet = activeFronts().filter(f => st.log.length > 3 && (!st.fronts[f.id].lastT || st.now - st.fronts[f.id].lastT > 10 * DAY));
    if (quiet.length) out.push(['info', `Quiet sector: ${quiet.map(f => L[f.id]).join(', ')}`, `front:${quiet[0].id}`]);
    if (st.log.length && !st.reportedToday && new Date().getHours() >= 18) out.push(['info', st.dayStreak ? `Report today to keep your ${st.dayStreak}-day streak` : 'No dispatch yet today', 'report']);
  }
  return out;
}
function renderAlerts() {
  const out = alertsList(); const max = innerWidth < 900 ? 2 : 4;
  $('#alerts').innerHTML = ui.sheet && innerWidth < 900 ? '' : out.slice(0, max).map(([cls, text, go]) => `<button class="alert glass ${cls}" data-act="go" data-go="${go}"><i class="dot"></i>${esc(text)}</button>`).join('')
    + (out.length > max ? `<button class="alert glass" data-act="open" data-sheet="briefing">+${out.length - max} more</button>` : '');
}

function renderLegend() {
  const L = labels(); let h = ''; const sw = (c, n) => `<span><i style="background:${c}"></i>${esc(n)}</span>`;
  if (view.mode === 'life') h = activeFronts().map(f => sw(FRONT_COLORS[f.id], L[f.id])).join('');
  else if (view.mode === 'infra') h = sw('#5c4634', 'Undeveloped') + sw('#5abe78', 'Level 5') + '<span>╌ planned railway</span>';
  else if (view.mode === 'supply') h = sw('#aa3c32', 'Starved') + sw('#46aa5f', 'Fully supplied');
  else if (view.mode === 'air') h = sw('#af3c37', 'Enemy skies') + sw('#6e6e6e', 'Contested') + sw('#4682c8', 'Ours');
  else if (view.mode === 'terrain') h = [['Plains', '#7f9a5a'], ['Hills', '#8c8a5c'], ['Mountain', '#6f6558'], ['Desert', '#c9b27a'], ['Forest', '#4f7d4d'], ['Marsh', '#5b8a86']].map(([n, c]) => sw(c, n)).join('');
  $('#legend').innerHTML = (ui.sheet && innerWidth < 900) || ui.asOf ? '' : h;
}
function renderModes() {
  $('#modes').innerHTML = MODES.map(([id, name, ic]) => `<button data-act="mode" data-mode="${id}" class="${view.mode === id ? 'on' : ''}">${I(ic)}${name}</button>`).join('')
    + `<hr><button data-act="mode" data-mode="empire" class="${view.showEmpire ? 'on' : ''}">${I('crown')}Achaemenid frontier</button>`;
  $('#layers-btn').classList.toggle('on', view.mode !== 'political' || view.showEmpire);
}
function setMode(m) {
  if (m === 'empire') { view.showEmpire = !view.showEmpire; view.dirty = true; if (view.showEmpire) { const [x, y] = view.proj(50, 33); view.flyTo(x, y, view.minS * 1.02); } }
  else { view.setMode(m); data.mode = m; persist(); }
  $('#modes').hidden = true; renderModes(); renderLegend();
}

let toastT;
function toast(msg, ms = 3200, action = null) {
  const t = $('#toast'); t.innerHTML = `<span>${esc(msg)}</span>${action ? `<button data-act="${action.act}">${esc(action.label)}</button>` : ''}`; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => (t.hidden = true), ms);
}
function banner(title, sub, tone) { const b = $('#banner'); b.className = 'glass ' + tone; b.innerHTML = `<b>${esc(title)}</b>${sub ? `<span>${esc(sub)}</span>` : ''}`; b.hidden = true; void b.offsetWidth; b.hidden = false; clearTimeout(banner.t); banner.t = setTimeout(() => (b.hidden = true), 3900); }

// ---------- replay ----------
function firstTs() { return data.reports.length ? Math.min(...data.reports.map(r => r.ts)) - 3600000 : Date.now(); }
function renderReplay() {
  const el = $('#replay'); if (!ui.asOf) { el.hidden = true; return; }
  const a = firstTs(), b = Date.now();
  el.hidden = false;
  if (!el.dataset.built) { el.dataset.built = 1; el.innerHTML = `<button class="play" data-act="replay-play" aria-label="Play"></button><input type="range" min="0" max="1000" step="1" data-bind="replay" aria-label="Date"><span class="when num"></span><button data-act="replay-exit" aria-label="Back to today">${I('x')}</button>`; }
  el.querySelector('.play').innerHTML = I(ui.playing ? 'pause' : 'play');
  const r = el.querySelector('input'); if (document.activeElement !== r || ui.playing) r.value = Math.round(((ui.asOf - a) / (b - a)) * 1000);
  el.querySelector('.when').textContent = fmtDate(ui.asOf, { day: 'numeric', month: 'short' });
}
function startReplay() {
  if (data.reports.length < 1) { toast('Nothing to replay yet.'); return; }
  closeSheet(); ui.asOf = firstTs(); view.home(); refresh(); playReplay();
}
function playReplay() {
  if (ui.playing) { clearInterval(ui.playing); ui.playing = null; renderReplay(); return; }
  const a = firstTs(); if (ui.asOf >= Date.now() - 1000) ui.asOf = a;
  ui.playing = setInterval(() => {
    const b = Date.now(); ui.asOf += (b - a) / 110;
    if (ui.asOf >= b) { clearInterval(ui.playing); ui.playing = null; ui.asOf = null; refresh(); toast('Back to today.'); return; }
    refresh();
  }, 80);
  renderReplay();
}
function exitReplay() { clearInterval(ui.playing); ui.playing = null; ui.asOf = null; refresh(); }

// ---------- unit icons ----------
const iconCache = new Map();
function unitIcon(type, color, o = {}) {
  const key = [type, color, o.str | 0, o.org | 0, o.rank | 0, !!o.enemy].join();
  if (iconCache.has(key)) return iconCache.get(key);
  const c = document.createElement('canvas'); c.width = 132; c.height = 87; const x = c.getContext('2d');
  const saved = view.dpr; view.dpr = 1; view.counter(x, 66, 46, 3, { type, color, str: o.str ?? 100, org: o.org ?? 100, rank: o.rank || 0, n: 1, enemy: !!o.enemy }); view.dpr = saved;
  const url = c.toDataURL(); iconCache.set(key, url); return url;
}

// ---------- sheets ----------
const ROOTS = ['fronts', 'chronicle', 'report', 'forces', 'staff', 'welcome', 'province', 'nation'];
function openSheet(name, arg = null, push = true) {
  if (ui.dict) stopDictation();
  if (name === 'report' && ui.asOf) exitReplay();
  if (ROOTS.includes(name) && name !== 'nation' && name !== 'province') ui.stack = []; else if (push && ui.sheet && ui.sheet !== name) ui.stack.push([ui.sheet, ui.arg]);
  if (ROOTS.includes(name)) { if (['nation', 'province'].includes(name)) ui.stack = []; }
  ui.sheet = name; ui.arg = arg;
  if (name === 'report' && !ui.report) ui.report = newReport();
  if (name === 'forces' && arg) ui.tab = arg;
  $('#modes').hidden = true; $('#sheet').hidden = false; renderSheet(); $('#sheet-body').scrollTop = 0;
  const root = ui.stack[0]?.[0] || name;
  document.querySelectorAll('#nav button').forEach(b => b.classList.toggle('on', b.dataset.sheet === root || (b.dataset.sheet === 'fronts' && root === 'front')));
  renderLegend(); renderAlerts();
}
function closeSheet() {
  if (ui.dict) stopDictation();
  if (ui.sheet === 'welcome') { data.onboarded = true; persist(); }
  ui.sheet = null; ui.stack = []; $('#sheet').hidden = true; view.select(null);
  document.querySelectorAll('#nav button').forEach(b => b.classList.remove('on'));
  renderLegend(); renderAlerts();
}
function back() { const p = ui.stack.pop(); if (p) openSheet(p[0], p[1], false); else closeSheet(); }
function renderSheet() {
  const R = { fronts: sFronts, front: sFront, forces: sForces, chronicle: sChronicle, report: sReport, staff: sStaff, province: sProvince, nation: sNation, welcome: sWelcome, briefing: sBriefing, settings: sSettings, ops: sOps, opnew: sOpNew, medals: sMedals, backup: sBackup }[ui.sheet];
  if (!R) return;
  const [title, html, tall] = R();
  $('#sheet-title').textContent = title; $('#sheet-body').innerHTML = html; $('#sheet').classList.toggle('tall', !!tall);
  $('#sheet .back').hidden = !ui.stack.length;
}

const row = ({ icon, lead, t, d, end = '', act, attrs = '', cls = '' }) => `<${act ? 'button' : 'div'} class="row ${cls}" ${act ? `data-act="${act}"` : ''} ${attrs}>${lead ?? (icon ? `<span class="lead">${I(icon)}</span>` : '')}<span class="main"><span class="t">${t}</span>${d ? `<div class="d">${d}</div>` : ''}</span>${end ? `<span class="end">${end}</span>` : ''}</${act ? 'button' : 'div'}>`;
const kpi = (k, v, cls = '') => `<div class="kpi"><small>${k}</small><b class="${cls}">${v}</b></div>`;
const empty = (ic, t, d) => `<div class="empty">${I(ic)}<b>${t}</b>${d}</div>`;

function frontBar(fr) {
  const x = 50 - fr.pos / 2;
  return `<div class="fbar">${fr.pos > 0 ? `<div class="fill bad" style="left:${x}%;width:${50 - x}%"></div>` : `<div class="fill good" style="left:50%;width:${x - 50}%"></div>`}<div class="mid"></div></div>`;
}
function frontCard(f) {
  const fr = st.fronts[f.id], s = statusOf(fr.pos), L = labels(); const off = data.off.includes(f.id);
  return `<button class="front" data-act="open" data-sheet="front" data-arg="${f.id}" style="--c:${FRONT_COLORS[f.id]}">
    <div class="hd"><i class="dotc"></i><span class="lab">${esc(L[f.id])}</span>${st.focus === f.id ? `<span class="gold">${I('star', 's')}</span>` : ''}<span class="nm">${esc(f.name)}</span><span class="st ${off ? 'neutral' : s.tone}">${off ? 'Armistice' : s.text}</span></div>
    ${frontBar(fr)}<div class="fends"><span>Tehran</span><span>${esc(f.satrapy)}</span></div></button>`;
}
function sFronts() {
  const order = map.fronts.slice().sort((a, b) => data.off.includes(a.id) - data.off.includes(b.id) || st.fronts[b.id].pos - st.fronts[a.id].pos);
  return ['Fronts', `<div class="rows">${order.map(frontCard).join('')}</div><p class="faint small" style="margin-top:16px">Red means the enemy is inside Iran. Green means you are pushing out toward the old imperial frontier.</p>`, true];
}

function spark(fid) {
  const pts = st.history.map(h => h.pos[fid]); if (pts.length < 2) return '';
  const all = [0, ...pts]; const W = 300, H = 64; const mx = Math.max(10, ...all.map(Math.abs));
  const y = v => H / 2 + (v / mx) * (H / 2 - 5), x = i => (i / (all.length - 1)) * W;
  return `<svg class="spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><line x1="0" x2="${W}" y1="${H / 2}" y2="${H / 2}" stroke="currentColor" stroke-opacity=".18" stroke-dasharray="2 4" vector-effect="non-scaling-stroke"/>
    <path d="${all.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('')}" fill="none" stroke="${FRONT_COLORS[fid]}" stroke-width="2" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>
    <div class="fends"><span>↑ advancing</span><span>↓ retreating</span></div>`;
}
function unitRow(d, color = '#2c6557', enemy = false) {
  const t = UNIT_TYPES[d.type] || { name: d.type };
  return row({ lead: `<img class="cnt" src="${unitIcon(d.type, color, { str: d.str, org: d.org, rank: enemy ? 0 : rankIndex(d.xp || 0), enemy })}" alt="">`, t: esc(d.name), d: enemy ? t.name : `${t.name} · ${rankOf(d.xp)}`,
    end: enemy ? '' : `<span class="bars"><span class="bar org"><i style="width:${d.org}%"></i></span><span class="bar str"><i style="width:${d.str}%"></i></span></span>` });
}
function evRow(i, ts) {
  const L = labels();
  return `<div class="ev ${i.outcome}" style="--c:${FRONT_COLORS[i.front]}">${I(actIcon(i.action, i.outcome))}<div><div class="h">${esc(i.headline)}</div><div class="m"><b>${esc(L[i.front])}</b> · ${ACTIONS[i.action].label}${i.battle ? ` · ${esc(i.battle)}` : ''} · ${'●'.repeat(i.severity)}${'○'.repeat(5 - i.severity)}${ts ? ` · ${fmtDate(ts, { day: 'numeric', month: 'short' })}` : ''}</div></div></div>`;
}
function sFront() {
  const f = front(ui.arg), fr = st.fronts[f.id], s = statusOf(fr.pos), L = labels(); const t = st.terr; const off = data.off.includes(f.id);
  const occ = [...t.occ.values()].filter(v => v === f.id).length, lib = [...t.lib.values()].filter(v => v === f.id).length;
  const teh = map.provinces[map.tehran]; let km = null;
  for (const [id, fid] of t.occ) if (fid === f.id) { const d = havKm(teh.ll, map.provinces[id].ll); if (km == null || d < km) km = d; }
  const divs = st.divisions.filter(d => d.front === f.id); const enemy = enemyForce(map, st, f.id); const ecol = map.countries[f.enemy].color;
  const disp = st.log.slice().reverse().flatMap(l => l.items.filter(i => i.front === f.id).map(i => [i, l.ts])).slice(0, 6);
  const sign = v => (v > 0 ? '+' : '') + Math.round(v);
  const traits = fr.cmd.traits.map(k => TRAITS.find(x => x[0] === k)).map(x => `<span class="tag gold" title="${esc(x[4])}">${x[3]}</span>`).join(' ');
  const sats = st.satrapies.filter(x => x.front === f.id);
  const focus = st.focus === f.id;
  return [L[f.id], `
    <div class="front" style="--c:${FRONT_COLORS[f.id]};padding:0 0 4px"><div class="hd"><i class="dotc"></i><span class="nm">${esc(f.name)} · against ${esc(f.enemyName)}</span><span class="st ${off ? 'neutral' : s.tone}">${off ? 'Armistice' : s.text}</span></div>
    ${frontBar(fr)}<div class="fends"><span>Tehran falls</span><span>border</span><span>${esc(f.satrapy)}</span></div></div>
    <div class="btns"><button class="btn sm" data-act="flyfront" data-id="${f.id}">${I('locate', 's')}Show</button><button class="btn sm" data-act="focus" data-id="${focus ? '' : f.id}" ${ui.asOf || off ? 'disabled' : ''}>${I('star', 's')}${focus ? 'Stand down' : 'Focus'}</button><button class="btn sm" data-act="quick" data-id="${f.id}" ${off ? 'disabled' : ''}>${I('pen', 's')}Log</button></div>
    ${focus ? '<p class="small gold" style="margin-top:10px">Main effort: victories here go 25% further and losses bite 15% less. Other fronts advance slightly slower.</p>' : ''}
    <div class="grid">
      ${kpi('Lost', occ, occ ? 'bad' : '')}${kpi('Taken', lib, lib ? 'good' : '')}${km != null ? kpi('To Tehran', `${Math.round(km)}<small> km</small>`, km < 300 ? 'bad' : '') : kpi('Record', `${fr.wins}<small>W</small> ${fr.losses}<small>L</small>`)}
      ${kpi('Supply', Math.round(fr.supply) + '%', fr.supply < 55 ? 'warn' : '')}${kpi(f.naval ? 'Sea control' : 'Air', sign(f.naval ? fr.sea : fr.air) + '%')}${kpi('Entrenched', `${Math.round(fr.entrench)}<small>/10</small>`)}
      ${kpi('Enemy strength', Math.round(fr.enemyStr) + '%')}${kpi('Streak', fr.streak > 0 ? `${fr.streak} won` : fr.streak < 0 ? `${-fr.streak} lost` : '—', fr.streak > 0 ? 'good' : fr.streak < 0 ? 'bad' : '')}${km != null ? kpi('Record', `${fr.wins}<small>W</small> ${fr.losses}<small>L</small>`) : ''}
    </div>
    ${spark(f.id)}
    <h3>Commander</h3><div class="rows">${row({ icon: 'user', t: esc(fr.cmd.name), d: `Skill ${fr.cmd.level} · headquarters at ${esc(f.hq)}`, end: `<span class="num">${'★'.repeat(Math.min(5, Math.ceil(fr.cmd.level / 2)))}</span>` })}</div>${traits ? `<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:4px">${traits}</div>` : ''}
    ${sats.length ? `<h3>Satrapies restored</h3><div style="display:flex;gap:6px;flex-wrap:wrap">${sats.map(x => `<span class="tag gold">${esc(x.name)}</span>`).join('')}</div>` : ''}
    <h3>Recent dispatches</h3>${disp.length ? disp.map(([i, ts]) => evRow(i, ts)).join('') : '<p class="faint small">Nothing reported here yet.</p>'}
    <h3>Our forces · ${divs.length}</h3><div class="rows">${divs.map(d => unitRow(d)).join('')}</div>
    <h3>Enemy · ${enemy.length}</h3><div class="rows">${enemy.map(d => unitRow(d, ecol, true)).join('')}</div>`, true];
}

function sForces() {
  const tabs = [['army', 'Army'], ['air', 'Air'], ['navy', 'Navy'], ['industry', 'Industry']]; const L = labels();
  let h = `<div class="seg" style="margin-bottom:8px">${tabs.map(([k, n]) => `<button class="${ui.tab === k ? 'on' : ''}" data-act="tab" data-tab="${k}">${n}</button>`).join('')}</div>`;
  if (ui.tab === 'army') {
    h += `<h3>Tehran garrison</h3><div class="rows">${st.divisions.filter(d => !d.front).map(d => unitRow(d, '#7a5c22')).join('')}</div>`;
    for (const f of activeFronts()) h += `<h3 style="color:${FRONT_COLORS[f.id]}">${esc(L[f.id])}</h3><div class="rows">${st.divisions.filter(d => d.front === f.id).map(d => unitRow(d)).join('')}</div>`;
    h += `<p class="faint small" style="margin-top:20px">Green bar: organisation. Amber: strength. Both recover with time and supply.</p>`;
  } else if (ui.tab === 'air') {
    h += `<div class="rows">${st.wings.map(w => row({ lead: `<img class="cnt" src="${unitIcon('air', '#4a5f8a', { str: (w.planes / w.max) * 100 })}" alt="">`, t: esc(w.name), d: `${w.type === 'cas' ? 'Close air support' : w.type === 'bomber' ? 'Bomber' : 'Fighter'} · ${esc(w.model)} · ${esc(w.base)}`, end: `<span class="num">${Math.round(w.planes)}/${w.max}</span>` })).join('')}</div>`;
    h += `<h3>Air superiority</h3><div class="grid">${activeFronts().map(f => kpi(esc(L[f.id]), `${st.fronts[f.id].air > 0 ? '+' : ''}${Math.round(st.fronts[f.id].air)}%`, st.fronts[f.id].air > 5 ? 'good' : st.fronts[f.id].air < -5 ? 'bad' : '')).join('')}</div>`;
  } else if (ui.tab === 'navy') {
    for (const fl of st.fleets) h += `<h3>${esc(fl.name)} · ${esc(fl.base)}</h3><div class="rows">` + fl.ships.map(s => row({ lead: `<img class="cnt" src="${unitIcon('ship', '#28587a', { str: s.hp, org: s.hp })}" alt="">`, t: esc(s.name), d: esc(s.cls) + (s.hp < 60 ? ' · damaged' : ''), end: `<span class="bars"><span class="bar str"><i style="width:${s.hp}%"></i></span></span>` })).join('') + '</div>';
    h += `<h3>Sea control</h3><div class="grid two">${kpi('Persian Gulf', `${st.fronts.glf.sea > 0 ? '+' : ''}${Math.round(st.fronts.glf.sea)}%`)}${kpi('Caspian', `${Math.round((st.fronts.cau.sea + st.fronts.tks.sea) / 2)}%`)}</div>`;
  } else {
    const meta = mapMeta(map); const kinds = { port: 'Port', naval: 'Naval base', airbase: 'Airbase', hub: 'Supply hub', refinery: 'Refinery', fort: 'Fortress' };
    h += `<div class="grid">${kpi('Civilian', `${st.nation.civActive}<small>/${st.nation.civ}</small>`)}${kpi('Military', `${st.nation.milActive}<small>/${st.nation.mil}</small>`)}${kpi('Railways', `${st.railStage}<small>/4</small>`)}</div>`;
    const dm = meta.buildings.filter(b => st.bld[b.id].dmg > 0.02);
    if (dm.length) h += `<h3>Under repair</h3><div class="rows">${dm.map(b => row({ icon: 'bomb', t: `${kinds[b.kind]} at ${esc(b.name)}`, end: `<span class="bad num">${Math.round(st.bld[b.id].dmg * 100)}%</span>` })).join('')}</div>`;
    h += `<h3>States</h3><div class="rows">` + Object.entries(st.states).map(([n, s]) => { const lv = Math.max(0, Math.floor(s.infra - s.infraDmg)); return row({ t: esc(n), d: `${s.civ} civilian · ${s.mil} military${s.dock ? ` · ${s.dock} dockyard` : ''}${s.dmg > 0.05 ? ` · <span class="bad">${Math.round(s.dmg * 100)}% bombed</span>` : ''}`, end: `<span class="num">${'●'.repeat(lv)}${'○'.repeat(5 - lv)}</span>` }); }).join('') + '</div>';
    h += `<h3>Railways</h3><div class="rows">${map.railways.map(r => row({ icon: r.stage <= st.railStage ? 'check' : 'clock', t: esc(r.n), end: r.stage <= st.railStage ? '' : 'planned' })).join('')}</div>`;
  }
  return ['Forces', h, true];
}

// ---------- chronicle ----------
function heatmap() {
  const today = dayKey(Date.now()); const dow = (new Date().getDay() + 6) % 7; const weeks = 20; const start = today - dow - (weeks - 1) * 7;
  const net = new Map(); for (const l of live.log) { if (l.kind) continue; const k = dayKey(l.ts); let v = net.get(k) || { n: 0, c: 0 }; for (const i of l.items) v.n += i.outcome === 'win' ? i.severity : i.outcome === 'loss' ? -i.severity : 0; v.c++; net.set(k, v); }
  let h = '';
  for (let d = start; d < start + weeks * 7; d++) {
    const v = net.get(d); let bg = '';
    if (v) { const a = Math.min(1, 0.3 + Math.abs(v.n) / 10); bg = v.n > 0 ? `rgba(91,191,138,${a})` : v.n < 0 ? `rgba(229,96,77,${a})` : 'rgba(162,167,171,.45)'; }
    h += `<button class="${d > today ? 'future' : ''} ${ui.day === d ? 'sel' : ''}" ${bg ? `style="background:${bg}"` : ''} data-act="day" data-d="${d}" aria-label="day"></button>`;
  }
  return `<div class="heat" style="grid-template-columns:repeat(${weeks},1fr)">${h}</div>`;
}
function entryHTML(l) {
  if (l.kind === 'focus') return `<div class="entry"><div class="when">${fmtDate(l.ts)} · ${fmtTime(l.ts)}<span class="sp"></span><button data-act="delreport" data-id="${esc(l.id)}" aria-label="Delete">${I('trash', 's')}</button></div><div class="ev" style="color:var(--accent)">${I('star')}<div class="h">${esc(l.fx[0].text)}</div></div></div>`;
  const open = ui.logOpen.has(l.id);
  return `<div class="entry"><div class="when">${fmtDate(l.ts)} · ${fmtTime(l.ts)}<span class="sp"></span>${l.text ? `<button data-act="rawlog" data-id="${esc(l.id)}" aria-label="What I said">${I('mic', 's')}</button>` : ''}<button data-act="editreport" data-id="${esc(l.id)}" aria-label="Edit">${I('edit', 's')}</button><button data-act="delreport" data-id="${esc(l.id)}" aria-label="Delete">${I('trash', 's')}</button></div>
    ${l.summary ? `<p class="quote">${esc(l.summary)}</p>` : ''}${l.items.map(i => evRow(i)).join('')}
    ${l.fx.length ? `<div class="fx">${l.fx.map(x => `<span class="${x.tone || ''}">${esc(x.text)}</span>`).join('')}</div>` : ''}${open ? `<div class="raw">“${esc(l.text)}”</div>` : ''}</div>`;
}
function sChronicle() {
  if (!live.log.length) return ['Chronicle', empty('book', 'No dispatches yet', 'Tap the microphone and tell the staff how your day went.')];
  const L = labels(); let list = live.log.slice().reverse();
  if (ui.day != null) list = list.filter(l => dayKey(l.ts) === ui.day);
  if (ui.filter === 'win' || ui.filter === 'loss') list = list.filter(l => l.items.some(i => i.outcome === ui.filter));
  else if (ui.filter !== 'all') list = list.filter(l => l.items.some(i => i.front === ui.filter) || l.front === ui.filter);
  const chip = (id, n, c) => `<button class="chip ${ui.filter === id ? 'on' : ''}" data-act="filter" data-f="${id}">${c ? `<i class="dotc" style="--c:${c}"></i>` : ''}${esc(n)}</button>`;
  return ['Chronicle', `
    <div class="grid" style="margin-top:8px">${kpi('Day streak', live.dayStreak, live.dayStreak ? 'gold' : '')}${kpi('Victories', live.totals.wins, 'good')}${kpi('Defeats', live.totals.losses, 'bad')}</div>
    ${heatmap()}<div class="fends"><span>20 weeks</span><span>${ui.day != null ? `<button class="gold" data-act="day" data-d="">Show all days</button>` : 'tap a day'}</span></div>
    <div class="btns"><button class="btn sm" data-act="replay">${I('play', 's')}Replay the war</button></div>
    <h3>Dispatches</h3>
    <div class="chips">${chip('all', 'All')}${chip('win', 'Victories')}${chip('loss', 'Defeats')}${activeFronts().map(f => chip(f.id, L[f.id], FRONT_COLORS[f.id])).join('')}</div>
    ${list.length ? list.map(entryHTML).join('') : '<p class="faint small">Nothing matches.</p>'}`, true];
}

// ---------- report ----------
const newReport = () => ({ stage: 'input', text: '', when: 'now', custom: '', result: null, busy: false, note: '', editId: null });
const DAYS_AGO = ['Today', 'Yesterday', '2 days ago', '3 days ago', '4 days ago', '5 days ago', '6 days ago', 'A week ago'];
function sReport() {
  const r = ui.report; const eng = pickEngine(data.settings); const L = labels();
  if (r.stage === 'input') {
    const hint = ui.dict ? (ui.dict.state === 'transcribing' ? 'Transcribing…' : 'Listening. Tap to stop.') : r.note || (r.text ? '' : eng === 'keyboard' ? 'Type, or use the keyboard microphone' : '');
    return ['Report', `
      <div class="composer"><textarea id="rtext" data-bind="report.text" placeholder="What happened? Failed a quiz, hit a PR, great call with mom…">${esc(r.text)}</textarea>
        <div class="hint" id="micnote">${esc(hint)}</div>
        <button class="mic ${ui.dict ? (ui.dict.state === 'transcribing' ? 'busy' : 'live') : ''}" data-act="mic" aria-label="Dictate">${I('mic')}</button></div>
      <div class="btns"><button class="btn primary" data-act="analyse" ${r.busy ? 'disabled' : ''}>${r.busy ? 'Deliberating…' : 'Analyse'}</button><button class="btn" style="flex:0 0 auto" data-act="manual" aria-label="Enter by hand">${I('pen')}</button></div>
      <label class="f" style="margin-top:16px"><span>When</span><select data-bind="report.when">${[['now', 'Just now'], ['1', 'Yesterday evening'], ['2', 'Two days ago'], ['3', 'Three days ago'], ['custom', 'Pick a date…']].map(([v, n]) => `<option value="${v}" ${r.when === v ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
      ${r.when === 'custom' ? `<label class="f"><input type="datetime-local" data-bind="report.custom" value="${esc(r.custom)}"></label>` : ''}
      <p class="faint small">${data.settings.apiKey ? `Judged by Claude · ${esc(data.settings.model)}` : 'Offline keyword judge. Add a Claude key in Staff › Settings for real judgement.'}</p>`, true];
  }
  const res = r.result;
  const opt = (list, cur) => list.map(a => `<option value="${a}" ${a === cur ? 'selected' : ''}>${ACTIONS[a].label}</option>`).join('');
  return [r.editId ? 'Edit dispatch' : 'Confirm', `
    ${res.warning ? `<div class="note">${I('info', 's')}<span>${esc(res.warning)}</span></div>` : ''}
    ${res.items.length ? '' : `<div class="note">${I('info', 's')}<span>Nothing to act on. Add an engagement, or go back and say more.</span></div>`}
    ${res.items.map((it, i) => `<div class="item" style="--c:${FRONT_COLORS[it.front]}">
      <div class="top"><select data-bind="item.front" data-i="${i}">${activeFronts().concat(data.off.includes(it.front) ? [front(it.front)] : []).map(f => `<option value="${f.id}" ${f.id === it.front ? 'selected' : ''}>${esc(L[f.id])}</option>`).join('')}</select><button data-act="rmitem" data-i="${i}" aria-label="Remove">${I('x', 's')}</button></div>
      <input class="hl" type="text" data-bind="item.headline" data-i="${i}" value="${esc(it.headline)}" placeholder="What happened">
      <div class="ctl">
        <div class="seg">${[['win', 'Win'], ['loss', 'Loss'], ['neutral', '—']].map(([o, n]) => `<button class="${it.outcome === o ? 'on ' + o : ''}" data-act="outcome" data-i="${i}" data-o="${o}">${n}</button>`).join('')}</div>
        <div class="sev">${[1, 2, 3, 4, 5].map(n => `<button class="${it.severity === n ? 'on' : ''}" data-act="sev" data-i="${i}" data-n="${n}">${n}</button>`).join('')}</div>
        <select data-bind="item.action" data-i="${i}" ${it.outcome === 'neutral' ? 'disabled' : ''}>${it.outcome === 'neutral' ? '<option>Skirmish</option>' : opt(it.outcome === 'win' ? WIN_ACTIONS : LOSS_ACTIONS, it.action)}</select>
        ${r.editId ? '<span></span>' : `<select data-bind="item.days_ago" data-i="${i}">${DAYS_AGO.map((n, d) => `<option value="${d}" ${(it.days_ago || 0) === d ? 'selected' : ''}>${n}</option>`).join('')}</select>`}
      </div></div>`).join('')}
    <button class="btn sm quiet" data-act="additem">${I('plus', 's')}Add engagement</button>
    <label class="f" style="margin-top:16px"><span>Communiqué</span><textarea style="min-height:84px" data-bind="result.summary">${esc(res.summary)}</textarea></label>
    <div class="btns"><button class="btn" data-act="backreport">${r.editId ? 'Cancel' : 'Back'}</button><button class="btn primary" data-act="commit" ${res.items.length ? '' : 'disabled'}>${r.editId ? 'Save' : 'Issue orders'}</button></div>`, true];
}

// ---------- staff ----------
function sStaff() {
  const earned = Object.keys(live.ach).length; const ops = data.ops.filter(o => !o.doneTs && !o.archived && o.due > Date.now()).length;
  const chev = I('chev', 's');
  return ['Staff', `<div class="rows">
    ${row({ icon: 'spark', t: 'Briefing', d: 'The week, the staff’s assessment, share', end: chev, act: 'open', attrs: 'data-sheet="briefing"' })}
    ${row({ icon: 'target', t: 'Operations', d: ops ? `${ops} under way` : 'Set an objective and a deadline', end: chev, act: 'open', attrs: 'data-sheet="ops"' })}
    ${row({ icon: 'medal', t: 'Decorations', d: `${earned} of ${MEDALS.length} awarded`, end: chev, act: 'open', attrs: 'data-sheet="medals"' })}
    ${row({ icon: 'crown', t: 'Nation', d: `${live.satrapies.length} satrapies restored`, end: chev, act: 'open', attrs: 'data-sheet="nation"' })}
    ${row({ icon: 'gear', t: 'Settings', d: 'Fronts, Claude, voice', end: chev, act: 'open', attrs: 'data-sheet="settings"' })}
    ${row({ icon: 'down', t: 'Backup', d: 'Export, import, reset', end: chev, act: 'open', attrs: 'data-sheet="backup"' })}</div>`];
}
function weekDelta(fid) { const cut = st.now - 7 * DAY; let then = 0; for (const h of st.history) if (h.ts <= cut) then = h.pos[fid]; return st.fronts[fid].pos - then; }
function sBriefing() {
  const L = labels(); const a = ui.assess; const al = alertsList();
  const rows = activeFronts().map(f => { const d = weekDelta(f.id); const fr = st.fronts[f.id]; return row({ lead: `<span class="lead" style="color:${FRONT_COLORS[f.id]}">${I(d < -0.2 ? 'arrowR' : d > 0.2 ? 'arrowL' : 'equal')}</span>`, t: esc(L[f.id]), d: statusOf(fr.pos).text, end: `<span class="num ${d < -0.2 ? 'good' : d > 0.2 ? 'bad' : ''}">${Math.abs(d) < 0.2 ? 'no change' : `${d < 0 ? 'forward' : 'back'} ${Math.abs(d).toFixed(1)}`}</span>`, act: 'open', attrs: `data-sheet="front" data-arg="${f.id}"` }); }).join('');
  return ['Briefing', `
    <h3>This week</h3><div class="rows">${rows}</div>
    ${al.length ? `<h3>Attention</h3><div class="rows">${al.map(([cls, t, go]) => row({ lead: `<span class="lead ${cls}">${I(cls === 'good' || cls === 'gold' ? 'check' : 'info')}</span>`, t: esc(t), act: 'go', attrs: `data-go="${go}"` })).join('')}</div>` : ''}
    <h3>Chief of staff</h3>
    ${a ? `${a.warning ? `<div class="note">${I('info', 's')}<span>${esc(a.warning)}</span></div>` : ''}<p class="quote">${esc(a.assessment)}</p>${a.orders.length ? `<div class="rows">${a.orders.map((o, i) => row({ lead: `<span class="lead num" style="color:${FRONT_COLORS[o.front]}">${i + 1}</span>`, t: esc(o.order), d: esc(L[o.front]) })).join('')}</div>` : ''}` : '<p class="dim small">An honest read of how things are going, and up to three orders for the week.</p>'}
    <div class="btns"><button class="btn" data-act="assess" ${ui.assessBusy ? 'disabled' : ''}>${I('spark', 's')}${ui.assessBusy ? 'Thinking…' : a ? 'Ask again' : 'Ask for an assessment'}</button></div>
    <h3>Situation report</h3><pre class="sit" id="sittext">${esc(sitrep(map, st, L))}</pre>
    <div class="btns"><button class="btn" data-act="share">${I('share', 's')}Text</button><button class="btn" data-act="sharemap">${I('image', 's')}Map</button><button class="btn" data-act="copy" aria-label="Copy" style="flex:0 0 auto">${I('copy', 's')}</button></div>`, true];
}

// operations
function opTargets(f) {
  const fr = live.fronts[f.id]; const out = [];
  if (fr.pos > 1) out.push({ v: 'border', n: 'Restore the border' });
  for (const [id, d] of f.enemyOrder) { const p = map.provinces[id]; if (p.city && p.vp >= 3 && !live.terr.lib.has(id)) out.push({ v: String(id), n: `Capture ${p.n}`, d }); if (out.length >= 9) break; }
  for (const [id] of f.iranOrder) { const p = map.provinces[id]; if (p.city && p.vp >= 3 && live.terr.occ.get(id) === f.id) out.unshift({ v: String(id), n: `Liberate ${p.n}` }); }
  return out;
}
function opState(o, s = live) {
  const f = front(o.front), fr = s.fronts[o.front]; let done, prog;
  if (o.prov == null) { done = fr.pos <= 0.5; prog = o.pos0 > 0 ? 1 - fr.pos / o.pos0 : 1; }
  else if (map.provinces[o.prov].t === 'IRN') { done = !s.terr.occ.has(o.prov); const d = new Map(f.iranOrder).get(o.prov) || 1; prog = 1 - ((fr.pos / 100) * f.dTehran - d) / Math.max(1, (o.pos0 / 100) * f.dTehran - d); }
  else { done = s.terr.lib.has(o.prov); const d = new Map(f.enemyOrder).get(o.prov) || 1; prog = (Math.pow(Math.max(0, -fr.pos) / 100, 1.3) * f.dMax) / d; }
  return { done, prog: Math.max(0, Math.min(1, done ? 1 : prog)) };
}
function checkOps() {
  let changed = false;
  for (const o of data.ops) if (!o.doneTs && !o.failTs) {
    const s = opState(o);
    if (s.done && Date.now() <= o.due + DAY) { o.doneTs = Date.now(); changed = true; setTimeout(() => banner(`Operation ${o.name} accomplished`, o.goal, 'gold'), 600); }
    else if (Date.now() > o.due) { o.failTs = o.due; changed = true; }
  }
  if (changed) persist();
}
function sOps() {
  const L = labels(); const list = data.ops.filter(o => !o.archived).slice().reverse();
  const body = list.length ? `<div class="rows">${list.map(o => { const s = opState(o); const left = o.due - Date.now(); const state = o.doneTs ? ['Accomplished', 'good', 'check'] : o.failTs ? ['Deadline passed', 'neutral', 'x'] : [left < DAY ? `${Math.max(1, Math.ceil(left / 3600000))} h left` : `${Math.ceil(left / DAY)} days left`, left < 2 * DAY ? 'warn' : '', 'target'];
    return row({ lead: `<span class="lead ${state[1]}">${I(state[2])}</span>`, t: `Operation ${esc(o.name)}`, d: `${esc(o.goal)} · <span style="color:${FRONT_COLORS[o.front]}">${esc(L[o.front])}</span><div class="meter"><i style="width:${Math.round(s.prog * 100)}%;${o.doneTs ? 'background:var(--good)' : ''}"></i></div><span class="${state[1]}">${state[0]}</span>`, end: `<button data-act="oparchive" data-id="${o.id}" aria-label="Remove">${I('x', 's')}</button>` }); }).join('')}</div>` : empty('target', 'No operations', 'Pick a front, an objective and a deadline. The staff will hold you to it.');
  return ['Operations', `${body}<div class="btns"><button class="btn primary" data-act="open" data-sheet="opnew">${I('plus', 's')}Plan an operation</button></div>`, true];
}
function sOpNew() {
  const L = labels(); const d = (ui.op ||= { front: activeFronts()[0].id, target: '', days: '14', name: OP_NAMES[Math.floor(Math.random() * OP_NAMES.length)] });
  const targets = opTargets(front(d.front)); if (!targets.some(t => t.v === d.target)) d.target = targets[0]?.v || '';
  return ['Plan an operation', `
    <label class="f"><span>Codename</span><input type="text" maxlength="24" data-bind="op.name" value="${esc(d.name)}"></label>
    <label class="f"><span>Front</span><select data-bind="op.front">${activeFronts().map(f => `<option value="${f.id}" ${f.id === d.front ? 'selected' : ''}>${esc(L[f.id])} — ${esc(f.name)}</option>`).join('')}</select></label>
    <label class="f"><span>Objective</span><select data-bind="op.target">${targets.map(t => `<option value="${t.v}" ${t.v === d.target ? 'selected' : ''}>${esc(t.n)}</option>`).join('') || '<option value="">Every objective on this front is taken</option>'}</select></label>
    <label class="f"><span>Deadline</span><select data-bind="op.days">${[['3', 'Three days'], ['7', 'One week'], ['14', 'Two weeks'], ['30', 'One month'], ['90', 'Three months']].map(([v, n]) => `<option value="${v}" ${v === d.days ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
    <p class="faint small">Further objectives take sustained wins. A city near the border is a week’s work; a capital is a campaign.</p>
    <div class="btns"><button class="btn primary" data-act="opsave" ${d.target ? '' : 'disabled'}>Launch</button></div>`, true];
}
function sMedals() {
  return ['Decorations', `<div class="rows">${MEDALS.map(([id, name, desc]) => { const t = live.ach[id]; return row({ icon: 'medal', cls: 'medal' + (t ? ' on' : ''), t: esc(name), d: esc(desc), end: t ? fmtDate(t, { day: 'numeric', month: 'short' }) : '' }); }).join('')}</div>`, true];
}
function sBackup() {
  return ['Backup', `<p class="dim small">Your campaign lives only on this device. The Safari tab and the home-screen app keep separate copies.</p>
    <div class="rows">${row({ icon: 'down', t: 'Export', d: `${data.reports.length} dispatches, without API keys`, act: 'export' })}${row({ icon: 'up', t: 'Import', d: 'Replace this campaign with a backup file', act: 'import' })}
    ${row({ icon: 'play', t: 'Load the demo campaign', d: 'Twelve sample days', act: 'demo' })}${row({ icon: 'trash', t: '<span class="bad">Reset the campaign</span>', d: 'Front names and keys are kept', act: 'reset' })}</div>
    <input type="file" id="importfile" accept="application/json,.json" hidden>
    <h3>Install on iPhone</h3><p class="dim small">In Safari: Share, then “Add to Home Screen”. It opens full-screen and works offline.</p>`];
}
function sSettings() {
  const s = data.settings; const L = labels(); const eng = pickEngine(s);
  return ['Settings', `
    <h3>Fronts</h3><p class="faint small">Name each one, say what belongs to it, or sign an armistice to switch it off.</p>
    ${map.fronts.map(f => `<div class="item" style="--c:${FRONT_COLORS[f.id]}"><div class="top"><i class="dotc"></i><span class="dim small" style="flex:1">${esc(f.name)}</span><button class="switch ${data.off.includes(f.id) ? '' : 'on'}" data-act="togglefront" data-id="${f.id}" aria-label="Active" style="width:44px;height:26px"></button></div>
      <div class="two-col"><input type="text" maxlength="28" data-bind="label" data-id="${f.id}" value="${esc(L[f.id])}" aria-label="Name"><input type="text" maxlength="120" data-bind="note" data-id="${f.id}" value="${esc(data.notes[f.id] || '')}" placeholder="What counts (optional)" aria-label="Notes"></div></div>`).join('')}
    <h3>Judgement</h3>
    <label class="f"><span>Claude API key</span><input type="password" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="sk-ant-…" data-bind="set.apiKey" value="${esc(s.apiKey)}"></label>
    <label class="f"><span>Model</span><select data-bind="set.model">${MODELS.map(([id, n]) => `<option value="${id}" ${s.model === id ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
    <p class="faint small">The key stays on this device and is sent only to api.anthropic.com.</p>
    <h3>Voice</h3>
    <label class="f"><span>Engine</span><select data-bind="set.voice">${[['auto', 'Automatic'], ['browser', 'Browser speech recognition'], ['eleven', 'ElevenLabs Scribe'], ['keyboard', 'Keyboard microphone only']].map(([v, n]) => `<option value="${v}" ${s.voice === v ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
    <label class="f"><span>Language</span><select data-bind="set.lang">${[['', 'Device language'], ['en-US', 'English (US)'], ['en-GB', 'English (UK)'], ['fa-IR', 'Persian'], ['fr-FR', 'French'], ['de-DE', 'German'], ['es-ES', 'Spanish'], ['tr-TR', 'Turkish'], ['ar-SA', 'Arabic']].map(([v, n]) => `<option value="${v}" ${s.lang === v ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
    <label class="f"><span>ElevenLabs API key (optional)</span><input type="password" autocomplete="off" autocapitalize="off" spellcheck="false" data-bind="set.elevenKey" value="${esc(s.elevenKey)}"></label>
    <p class="faint small">Now using ${{ browser: 'browser speech recognition', eleven: 'ElevenLabs Scribe', keyboard: 'the keyboard microphone' }[eng]}.${hasBrowserSTT() ? '' : ' This browser has no built-in recognition.'}${hasRecorder() ? '' : ' Recording is unavailable here.'}</p>`, true];
}
function sNation() {
  const n = st.nation; const t = st.terr; const L = labels(); const iranN = map.provinces.filter(p => p.t === 'IRN').length;
  return [n.name, `
    <p class="dim small">${fmtDate(st.now, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · ${persian(st.now)}</p>
    <div class="grid">${kpi('Stability', n.stability + '%')}${kpi('War support', n.warSupport + '%')}${kpi('Day streak', st.dayStreak)}
      ${kpi('Home provinces', `${iranN - t.occ.size}<small>/${iranN}</small>`, t.occ.size ? 'bad' : '')}${kpi('Conquered', t.lib.size, t.lib.size ? 'good' : '')}${kpi('Under arms', `${Math.round(n.manpower / 1000)}<small>K</small>`)}
      ${kpi('Divisions', n.divisions)}${kpi('Aircraft', n.planes)}${kpi('Ships', n.ships)}</div>
    <h3>Road to empire</h3><div class="rows">
    ${map.fronts.map(f => { const p = Math.max(0, -st.fronts[f.id].pos); return row({ lead: `<span class="lead" style="color:${FRONT_COLORS[f.id]}">${I(p >= 100 ? 'check' : 'flag')}</span>`, t: esc(f.satrapy), d: `${esc(L[f.id])}<div class="meter"><i style="width:${p}%;background:${FRONT_COLORS[f.id]}"></i></div>`, end: `<span class="num">${Math.round(p)}%</span>` }); }).join('')}</div>
    ${st.satrapies.length ? `<h3>Satrapies restored</h3><div style="display:flex;gap:6px;flex-wrap:wrap">${st.satrapies.map(x => `<span class="tag gold" title="${esc(x.region)}">${esc(x.name)}</span>`).join('')}</div>` : ''}
    <p class="faint small" style="margin-top:20px">Restore every satrapy and Iran becomes the Achaemenid Empire.</p>`, true];
}
function sProvince() {
  const p = map.provinces[ui.arg]; const meta = mapMeta(map); const c = map.countries[p.t]; const t = st.terr;
  const occ = t.occ.get(p.id), lib = t.lib.get(p.id);
  const ctl = p.t === 'IRN' ? (occ ? front(occ).enemyName : 'Iran') : lib ? 'Iran' : c.name;
  const state = meta.stateName(p.s); const S = p.t === 'IRN' ? st.states[state] : null;
  const kinds = { port: ['Port', 'anchor'], naval: ['Naval base', 'anchor'], airbase: ['Airbase', 'plane'], hub: ['Supply hub', 'box'], refinery: ['Oil refinery', 'factory'], fort: ['Fortress', 'fort'] };
  const bl = meta.buildings.filter(b => b.prov === p.id); const sec = view.sector.get(p.id); const L = labels();
  const here = activeFronts().filter(f => st.lines[f.id].ours.includes(p.id) || st.lines[f.id].theirs.includes(p.id));
  return [p.n, `
    <p class="dim small">${esc(state)} · ${esc(c.name)}${p.id === map.tehran ? ' · capital' : ''}</p>
    <div class="grid">${kpi('Held by', esc(ctl), occ ? 'bad' : lib ? 'good' : '')}${kpi('Terrain', p.tr[0].toUpperCase() + p.tr.slice(1))}${p.vp ? kpi('Victory points', p.vp) : sec ? kpi('Sector', `<span style="color:${FRONT_COLORS[sec.f]}">${esc(L[sec.f])}</span>`) : ''}
    ${S ? kpi('Infrastructure', `${Math.max(0, Math.floor(S.infra - S.infraDmg))}<small>/5</small>`) + kpi('Factories', S.civ + S.mil) + (S.dmg > 0.02 ? kpi('Bombed', Math.round(S.dmg * 100) + '%', 'bad') : '') : ''}</div>
    ${bl.length ? `<h3>Buildings</h3><div class="rows">${bl.map(b => row({ icon: kinds[b.kind][1], t: kinds[b.kind][0], end: st.bld[b.id].dmg > 0.05 ? `<span class="bad num">${Math.round(st.bld[b.id].dmg * 100)}% damaged</span>` : `<span class="num">Level ${Math.floor(st.bld[b.id].lvl)}</span>` })).join('')}</div>` : ''}
    ${here.length ? `<h3>Front line</h3><div class="rows">${here.map(frontCard).join('')}</div>` : ''}`];
}
function sWelcome() {
  const L = labels();
  return ['Take command', `
    <p>This is a war map of your life. Each border of Iran is one part of it. Tell the staff what happened and the fronts move.</p>
    <h3>Your fronts</h3>
    ${map.fronts.map(f => `<label class="f" style="--c:${FRONT_COLORS[f.id]}"><span><i class="dotc"></i> ${esc(f.name)} · against ${esc(f.enemyName)}</span><input type="text" maxlength="28" data-bind="label" data-id="${f.id}" value="${esc(L[f.id])}"></label>`).join('')}
    <div class="btns"><button class="btn primary" data-act="close">Begin</button></div>`, true];
}

// ---------- events ----------
function onMapTap(d) {
  $('#modes').hidden = true;
  if (['report', 'welcome', 'settings', 'opnew'].includes(ui.sheet)) return;
  if (d.kind === 'province') { view.select(d.id); openSheet('province', d.id); }
  else if (d.kind === 'front') openSheet('front', d.id);
  else if (d.kind === 'fleet') openSheet('forces', 'navy');
  else if (d.kind === 'wing') openSheet('forces', 'air');
  else if (ui.sheet === 'province') closeSheet();
}

function reportTs(r) {
  if (r.when === 'now') return Date.now();
  if (r.when === 'custom') { const t = new Date(r.custom).getTime(); return Number.isFinite(t) ? Math.min(t, Date.now()) : Date.now(); }
  const d = new Date(Date.now() - Number(r.when) * DAY); d.setHours(20, 0, 0, 0); return d.getTime();
}
function stopDictation() { ui.dict?.ctl.stop(); ui.dict = null; }
function toggleMic() {
  const r = ui.report;
  if (ui.dict) { ui.dict.ctl.stop(); if (ui.dict?.state !== 'transcribing') { ui.dict = null; renderSheet(); } return; }
  const engine = pickEngine(data.settings);
  if (engine === 'keyboard') { r.note = 'Use the microphone key on your keyboard.'; renderSheet(); $('#rtext')?.focus(); return; }
  const base = r.text ? r.text.replace(/\s+$/, '') + ' ' : ''; r.note = '';
  const d = { state: 'starting', ctl: null }; ui.dict = d;
  d.ctl = startDictation({
    engine, settings: data.settings,
    onText: t => { r.text = (base + t).trimStart(); const el = $('#rtext'); if (el) { el.value = r.text; el.scrollTop = el.scrollHeight; } },
    onState: s => { if (ui.dict !== d) return; if (s === 'idle') ui.dict = null; else d.state = s; if (ui.sheet === 'report' && r.stage === 'input') renderSheet(); },
    onError: (msg, o) => { r.note = msg; if (ui.dict === d) ui.dict = null; if (ui.sheet === 'report' && r.stage === 'input') { renderSheet(); if (o?.fallback) $('#rtext')?.focus(); } },
  });
  renderSheet();
}
async function analyse() {
  const r = ui.report; stopDictation();
  r.text = ($('#rtext')?.value ?? r.text).trim();
  if (r.text.length < 3) { toast('Say or type what happened first.'); return; }
  r.busy = true; renderSheet();
  try { r.result = await classify({ map, st: live, labels: labels(), notes: data.notes, off: data.off, text: r.text, apiKey: data.settings.apiKey, model: data.settings.model }); r.stage = 'review'; }
  catch (e) { toast(e.message); }
  r.busy = false; if (ui.sheet === 'report') { renderSheet(); $('#sheet-body').scrollTop = 0; }
}
function blankItem(fid) { return { front: fid || activeFronts()[0].id, outcome: 'win', severity: 2, action: 'offensive', headline: '', days_ago: 0 }; }

let lastCommit = [];
export function commitReports(reps, { quiet = false } = {}) {
  const before = live; const seen = new Set(Object.keys(before.ach));
  data.reports.push(...reps); lastCommit = reps.map(r => r.id); persist(); refresh();
  if (quiet) return;
  const entries = live.log.filter(l => lastCommit.includes(l.id)); if (!entries.length) return;
  const fx = entries.flatMap(e => e.fx), items = entries.flatMap(e => e.items);
  const medal = MEDALS.find(([id]) => live.ach[id] && !seen.has(id));
  const pick = fx.find(x => x.tone === 'gold') || fx.find(x => x.city != null) || null;
  const main = items.slice().sort((a, b) => b.severity - a.severity)[0];
  const wins = items.filter(i => i.outcome === 'win').length, losses = items.filter(i => i.outcome === 'loss').length;
  const tone = pick?.tone || (wins > losses ? 'good' : losses > wins ? 'bad' : 'gold');
  if (main) { banner(pick ? pick.text : main.battle || ACTIONS[main.action].label, `${labels()[main.front]} · ${front(main.front).name}`, tone); setTimeout(() => view.flyToFront(main.front), 250); }
  if (before.nation.name !== live.nation.name) setTimeout(() => banner(`Long live the ${live.nation.name}`, 'Every satrapy is restored', 'gold'), 4200);
  else if (medal) setTimeout(() => banner(medal[1], 'Decoration awarded', 'gold'), 4200);
  toast('Dispatch filed.', 6000, { act: 'undo', label: 'Undo' });
}

function onClick(e) {
  const b = e.target.closest('[data-act]');
  if (!b) { if (!e.target.closest('#modes')) $('#modes').hidden = true; return; }
  const a = b.dataset.act; const r = ui.report;
  switch (a) {
    case 'open': if (ui.sheet === b.dataset.sheet && !b.dataset.arg && b.closest('#nav')) closeSheet(); else openSheet(b.dataset.sheet, b.dataset.arg || null); break;
    case 'close': closeSheet(); break;
    case 'back': back(); break;
    case 'emblem': if (++ui.emblem % 7 === 0) toast('adam Kūruš, xšāyaθiya — “I am Cyrus, the king.”', 5000); else openSheet('nation'); break;
    case 'go': { const [s, arg] = b.dataset.go.split(':'); openSheet(s, arg || null); if (s === 'front') view.flyToFront(arg); break; }
    case 'modes': renderModes(); $('#modes').hidden = !$('#modes').hidden; break;
    case 'mode': setMode(b.dataset.mode); break;
    case 'zoom': view.zoomBy(Number(b.dataset.k)); break;
    case 'home': view.home(); break;
    case 'tab': ui.tab = b.dataset.tab; renderSheet(); break;
    case 'flyfront': view.flyToFront(b.dataset.id); if (innerWidth < 900) closeSheet(); break;
    case 'focus': commitReports([{ id: store.uid(), ts: Date.now(), kind: 'focus', front: b.dataset.id || null }], { quiet: true }); toast(b.dataset.id ? `Main effort: ${labels()[b.dataset.id]}.` : 'Main effort stood down.'); break;
    case 'quick': ui.report = { ...newReport(), stage: 'review', result: { summary: '', items: [blankItem(b.dataset.id)], source: 'manual' } }; openSheet('report'); break;
    case 'manual': r.text = ($('#rtext')?.value ?? r.text).trim(); r.result = { summary: '', items: [blankItem()], source: 'manual' }; r.stage = 'review'; renderSheet(); break;
    case 'mic': toggleMic(); break;
    case 'analyse': analyse(); break;
    case 'backreport': if (r.editId) { ui.report = null; openSheet('chronicle'); } else { r.stage = 'input'; renderSheet(); } break;
    case 'outcome': { const it = r.result.items[b.dataset.i]; it.outcome = b.dataset.o; it.action = it.outcome === 'win' ? 'offensive' : it.outcome === 'loss' ? 'enemy_offensive' : 'skirmish'; renderSheet(); break; }
    case 'sev': r.result.items[b.dataset.i].severity = Number(b.dataset.n); renderSheet(); break;
    case 'rmitem': r.result.items.splice(b.dataset.i, 1); renderSheet(); break;
    case 'additem': r.result.items.push(blankItem(r.result.items.at(-1)?.front)); renderSheet(); break;
    case 'commit': {
      const clean = i => ({ front: i.front, outcome: i.outcome, severity: i.severity, action: i.action, headline: i.headline.trim() || ACTIONS[i.action].label });
      if (r.editId) { const old = data.reports.find(x => x.id === r.editId); if (old) { old.items = r.result.items.map(clean); old.summary = r.result.summary; } ui.report = null; persist(); refresh(); openSheet('chronicle'); toast('Dispatch updated.'); break; }
      const base = reportTs(r); const groups = new Map();
      for (const i of r.result.items) { const d = Number(i.days_ago) || 0; if (!groups.has(d)) groups.set(d, []); groups.get(d).push(clean(i)); }
      const reps = [...groups].map(([d, items]) => { let ts = base; if (d > 0) { const x = new Date(base - d * DAY); x.setHours(20, 0, 0, 0); ts = x.getTime(); } return { id: store.uid(), ts, text: d === 0 || groups.size === 1 ? r.text : '', summary: d === Math.min(...groups.keys()) ? r.result.summary : '', source: r.result.source, items }; });
      ui.report = null; closeSheet(); commitReports(reps); break;
    }
    case 'undo': data.reports = data.reports.filter(x => !lastCommit.includes(x.id)); lastCommit = []; persist(); refresh(); toast('Undone.'); break;
    case 'editreport': { const rep = data.reports.find(x => x.id === b.dataset.id); if (!rep) break; ui.report = { ...newReport(), stage: 'review', editId: rep.id, text: rep.text || '', result: { summary: rep.summary || '', items: rep.items.map(i => ({ ...i, days_ago: 0 })), source: rep.source } }; openSheet('report'); break; }
    case 'delreport': if (confirm('Delete this dispatch and rewind its effects?')) { data.reports = data.reports.filter(x => x.id !== b.dataset.id); persist(); refresh(); } break;
    case 'rawlog': ui.logOpen.has(b.dataset.id) ? ui.logOpen.delete(b.dataset.id) : ui.logOpen.add(b.dataset.id); renderSheet(); break;
    case 'filter': ui.filter = b.dataset.f; renderSheet(); break;
    case 'day': ui.day = b.dataset.d === '' ? null : ui.day === Number(b.dataset.d) ? null : Number(b.dataset.d); renderSheet(); break;
    case 'replay': startReplay(); break;
    case 'replay-play': playReplay(); break;
    case 'replay-exit': exitReplay(); break;
    case 'assess': ui.assessBusy = true; renderSheet(); assess({ map, st: live, labels: labels(), off: data.off, apiKey: data.settings.apiKey, model: data.settings.model }).then(x => { ui.assess = x; }).catch(err => toast(err.message)).finally(() => { ui.assessBusy = false; if (ui.sheet === 'briefing') renderSheet(); }); break;
    case 'share': { const text = sitrep(map, st, labels()); if (navigator.share) navigator.share({ text }).catch(() => {}); else navigator.clipboard?.writeText(text).then(() => toast('Copied.'), () => toast('Select the text to copy it.')); break; }
    case 'copy': navigator.clipboard?.writeText(sitrep(map, st, labels())).then(() => toast('Copied.'), () => toast('Select the text to copy it.')); break;
    case 'sharemap': shareMap(); break;
    case 'togglefront': { const id = b.dataset.id; if (data.off.includes(id)) data.off = data.off.filter(x => x !== id); else if (activeFronts().length > 1) data.off.push(id); else { toast('At least one front must stay active.'); break; } persist(); refresh(); renderSheet(); break; }
    case 'opsave': { const d = ui.op; const f = front(d.front); const t = opTargets(f).find(x => x.v === d.target); if (!t) break; data.ops.push({ id: store.uid(), name: d.name.trim() || 'Simorgh', front: d.front, prov: d.target === 'border' ? null : Number(d.target), goal: t.n, created: Date.now(), due: Date.now() + Number(d.days) * DAY, pos0: live.fronts[d.front].pos }); ui.op = null; persist(); refresh(); back(); toast('Operation launched.'); break; }
    case 'oparchive': { const o = data.ops.find(x => x.id === b.dataset.id); if (o) o.archived = true; persist(); refresh(); break; }
    case 'export': { const blob = new Blob([store.exportData(data)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const el = Object.assign(document.createElement('a'), { href: url, download: `artesh-${new Date().toISOString().slice(0, 10)}.json` }); document.body.append(el); el.click(); el.remove(); setTimeout(() => URL.revokeObjectURL(url), 5000); break; }
    case 'import': $('#importfile').click(); break;
    case 'reset': if (confirm('Erase the whole campaign? This cannot be undone.')) { data.reports = []; data.ops = []; ui.assess = null; persist(); refresh(); toast('Campaign reset. The borders are quiet.'); } break;
    case 'demo': if (!data.reports.length || confirm('Replace the current campaign with demo data?')) { data.reports = demoReports(); ui.assess = null; persist(); closeSheet(); refresh(); view.home(); toast('Demo campaign loaded.'); } break;
  }
}

function onInput(e) {
  const el = e.target; const bind = el.dataset?.bind;
  if (el.id === 'importfile') { const file = el.files[0]; if (!file) return; file.text().then(t => { data = store.importData(t, data); persist(); refresh(); toast(`Imported ${data.reports.length} dispatches.`); }).catch(err => toast(err.message)); el.value = ''; return; }
  if (!bind) return;
  const r = ui.report;
  if (bind === 'replay') { clearInterval(ui.playing); ui.playing = null; const a = firstTs(), b = Date.now(); ui.asOf = Math.min(b - 1, a + (Number(el.value) / 1000) * (b - a)); refresh(); }
  else if (bind === 'report.text') { r.text = el.value; const h = $('#micnote'); if (h && !ui.dict) h.textContent = ''; }
  else if (bind === 'report.when') { r.when = el.value; if (el.value === 'custom' && !r.custom) r.custom = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16); if (e.type === 'change') renderSheet(); }
  else if (bind === 'report.custom') r.custom = el.value;
  else if (bind === 'result.summary') r.result.summary = el.value;
  else if (bind.startsWith('item.')) { const it = r.result.items[el.dataset.i]; const k = bind.slice(5); it[k] = k === 'days_ago' ? Number(el.value) : el.value; if (k === 'front' && e.type === 'change') renderSheet(); }
  else if (bind.startsWith('op.')) { ui.op[bind.slice(3)] = el.value; if (bind === 'op.front' && e.type === 'change') renderSheet(); }
  else if (bind === 'label') { const v = el.value.trim(); if (v) data.labels[el.dataset.id] = v; else delete data.labels[el.dataset.id]; persist(); view.setState(st, labels()); }
  else if (bind === 'note') { const v = el.value.trim(); if (v) data.notes[el.dataset.id] = v; else delete data.notes[el.dataset.id]; persist(); }
  else if (bind.startsWith('set.')) { data.settings[bind.slice(4)] = el.value.trim(); persist(); if (e.type === 'change' && el.tagName === 'SELECT') renderSheet(); }
}

async function shareMap() {
  const L = labels(); const worst = activeFronts().slice().sort((a, b) => st.fronts[b.id].pos - st.fronts[a.id].pos)[0], best = activeFronts().slice().sort((a, b) => st.fronts[a.id].pos - st.fronts[b.id].pos)[0];
  const lines = [`${st.nation.name} — ${fmtDate(st.now, { day: 'numeric', month: 'long', year: 'numeric' })}`, `${L[worst.id]}: ${statusOf(st.fronts[worst.id].pos).text.toLowerCase()}`, `${L[best.id]}: ${statusOf(st.fronts[best.id].pos).text.toLowerCase()}`];
  closeSheet(); await new Promise(r => setTimeout(r, 350));
  const c = view.snapshot(lines);
  c.toBlob(async blob => {
    const file = new File([blob], 'artesh-front.png', { type: 'image/png' });
    if (navigator.canShare?.({ files: [file] })) { try { await navigator.share({ files: [file] }); return; } catch { return; } }
    const url = URL.createObjectURL(blob); const el = Object.assign(document.createElement('a'), { href: url, download: 'artesh-front.png' }); document.body.append(el); el.click(); el.remove(); setTimeout(() => URL.revokeObjectURL(url), 5000); toast('Map saved as an image.');
  }, 'image/png');
}

function demoReports() {
  const now = Date.now(); const R = (daysAgo, text, summary, items) => ({ id: 'demo' + daysAgo + items.length, ts: now - daysAgo * DAY, text, summary, source: 'demo', items: items.map(([front, outcome, severity, action, headline]) => ({ front, outcome, severity, action, headline })) });
  return [
    R(11, 'Good start to the month. Finished the landing page and signed our first pilot customer.', 'Mesopotamian Front: our columns cross the Zagros passes and take ground beyond the frontier.', [['irq', 'win', 4, 'breakthrough', 'First pilot customer signed — armour breaks out toward Khanaqin']]),
    R(9, 'Gym three days in a row, sleep is finally on a schedule.', 'Baluchistan Front: engineers lay the foundations for a long campaign.', [['raj', 'win', 3, 'infrastructure', 'Three straight gym days — supply roads built in Baluchistan'], ['glf', 'win', 2, 'fortify', 'Sleep schedule holding — coastal batteries dug in']]),
    R(7, 'Bombed the calculus midterm. Did not study enough.', 'Afghan Front: the enemy breaks the line east of Birjand.', [['afg', 'loss', 4, 'enemy_breakthrough', 'Calculus midterm failed — enemy armour breaks the line']]),
    R(6, 'Had a great dinner with the family, long talk with dad.', 'Caucasus Front: the Aras is crossed.', [['cau', 'win', 3, 'offensive', 'Long talk with dad — infantry cross the Aras']]),
    R(4, 'Fight with my girlfriend, we did not talk all day. Also slept 4 hours.', 'Turkestan Front: enemy aircraft catch our columns in the open; supply dumps burn.', [['tks', 'loss', 4, 'enemy_cas', 'Fight with girlfriend — enemy close air support hits our lines'], ['glf', 'loss', 3, 'supply_hub_bombed', 'Four hours of sleep — supply hub bombed']]),
    R(3, 'Still behind in school, missed two assignments.', 'Afghan Front: the retreat continues.', [['afg', 'loss', 3, 'enemy_offensive', 'Two assignments missed — enemy pushes on']]),
    R(2, 'Made up with her, went for a long walk. Friends came over, good night.', 'Turkestan Front: the line is restored. Anatolian Front: patrols push forward.', [['tks', 'win', 3, 'encirclement', 'Made up after the fight — enemy spearhead cut off'], ['tur', 'win', 2, 'offensive', 'Good night with friends — patrols advance']]),
    R(0.4, 'Shipped the new onboarding flow and two investors replied. Skipped the gym though.', 'Mesopotamian Front: a second breakthrough. Baluchistan: minor ground lost.', [['irq', 'win', 4, 'breakthrough', 'Onboarding shipped, investors replied — breakthrough toward Baghdad'], ['raj', 'loss', 1, 'attrition', 'Skipped the gym — attrition on the line']]),
  ];
}

boot().catch(err => { document.body.insertAdjacentHTML('beforeend', `<pre style="position:fixed;inset:auto 0 0 0;z-index:99;background:#400;color:#fff;padding:12px;white-space:pre-wrap">${esc(err.stack || err)}</pre>`); });
