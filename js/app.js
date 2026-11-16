// The interface is deliberately thin: a map, one report button, a list of fronts and a history.
// Everything else (objectives, commanders, satrapies, decorations, repairs) is worked out by engine.js.
import { simulate, sitrep, statusOf as statusFor, objective, frontNote, mapMeta, flavor, capitalOf, shortName, momentOf, headlineOf, weeklyRecap, medalProgress, medalOf, orderText, ACTIONS, WIN_ACTIONS, LOSS_ACTIONS, UNIT_TYPES, rankOf, rankIndex, DAY } from './engine.js';
import { MapView, frontColor } from './map.js';
import { classify, assess } from './classify.js';
import { ask } from './ask.js';
import { fx } from './fx.js';
import { renderBulletin, renderFrontPage, renderRecap, renderRankUp, shareCanvas } from './share.js';
import { PRESETS, applyPreset } from './presets.js';
import { pickEngine, startDictation } from './voice.js';
import * as store from './store.js';
import { UI_ICONS, FILLED_ICONS, UNIT_PATHS } from './icons.js';

const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtDate = (ts, o = { weekday: 'short', day: 'numeric', month: 'short' }) => new Date(ts).toLocaleDateString(undefined, o);
// the date in the scenario's own calendar (META.calendar), or '' when it has none or the browser cannot do it
const altDate = (ts, o = { day: 'numeric', month: 'long', year: 'numeric' }) => { const cal = F().calendar; if (!cal) return ''; try { const f = new Intl.DateTimeFormat(`en-u-ca-${cal}`, o); return f.resolvedOptions().calendar === cal ? f.format(ts).replace(/\s*(AP|AH|AM|BE|ERA\d)$/, '') : ''; } catch { return ''; } };
const dayKey = ts => Math.floor((ts - new Date(ts).getTimezoneOffset() * 60000) / DAY);

// Interface icons: Lucide (ISC). Unit silhouettes: Game-icons.net (CC BY 3.0). Both are generated into icons.js.
const I = (n, cls = '') => (FILLED_ICONS[n] ? `<svg class="ic fill ${cls}" viewBox="0 0 512 512" aria-hidden="true"><path d="${FILLED_ICONS[n]}"/></svg>` : `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true">${UI_ICONS[n] || UI_ICONS.info}</svg>`);
// every battle type has its own icon, matching what it means
const ACT_ICON = { offensive: 'arrowR', breakthrough: 'tank', encirclement: 'ring', air_superiority: 'plane', cas_strike: 'plane', naval_victory: 'anchor', infrastructure: 'factory', fortify: 'fort', reinforce: 'users',
  counterattack: 'swords', airborne: 'parachute', uprising: 'megaphone', intelligence: 'eye', lend_lease: 'gift', treaty: 'handshake', enemy_offensive: 'arrowL', enemy_breakthrough: 'tank', encircled: 'ring', enemy_cas: 'plane',
  strategic_bombing: 'bomb', port_strike: 'anchor', supply_hub_bombed: 'box', naval_defeat: 'anchor', attrition: 'users', rail_cut: 'train', sabotage: 'bomb', desertion: 'users', winter: 'snow', skirmish: 'swords' };
const actIcon = a => ACT_ICON[a] || 'swords';

let map, view, data, st, live, scenarios = [];
// everything the interface says about the country comes from the scenario being played
const F = () => flavor(map);
const statusOf = pos => statusFor(pos, map);
const fcol = id => frontColor(map, id); // colours go by front slot, whatever the ids are
let cfg = { server: false, judge: null, transcribe: null }; // what the private server offers
const ui = { ask: { q: '', busy: false, res: null }, sheet: null, arg: null, stack: [], report: null, dict: null, asOf: null, playing: null, assess: null, assessAt: 0, emblem: 0 };
const MODES = [['political', 'Map', 'flag'], ['life', 'Life areas', 'user'], ['infra', 'Infrastructure', 'factory'], ['supply', 'Supply', 'box'], ['air', 'Air', 'plane'], ['terrain', 'Terrain', 'terrain']];

async function boot() {
  data = store.load();
  try { const r = await fetch('api/config'); if (r.ok) cfg = await r.json(); } catch { /* static hosting: offline judge only */ }
  try { scenarios = await (await fetch('data/scenarios.json')).json(); } catch { scenarios = []; }
  if (cfg.server) { try { const remote = await store.pull(); if (remote) { data = remote; store.save(data); } else if (data.reports.length) store.push(() => data); } catch { /* offline: use the local copy */ } }
  // the country being played (Iran for saves from before there was a choice); one that is no longer offered falls back without losing its campaign
  try { map = await loadMap(data.scenario); }
  catch (e) { if (data.scenario === store.DEFAULT_SCENARIO) throw e; map = await loadMap(store.DEFAULT_SCENARIO); store.switchScenario(data, map.id); store.save(data); }
  // Static demo (…/demo/?demo=1): a first-time visitor finds a campaign already in progress.
  const demo = !cfg.server && new URLSearchParams(location.search).has('demo');
  if (demo && !data.reports.length && !data.onboarded) { data.reports = demoReports(); data.onboarded = true; store.save(data); }
  view = new MapView($('#base'), $('#over'), map);
  view.onTap = onMapTap;
  $('#nav').innerHTML = `<button data-act="open" data-sheet="fronts">${I('flag')}<span>Fronts</span></button><button class="report" data-act="open" data-sheet="report" aria-label="Report">${I('mic')}</button><button data-act="open" data-sheet="history">${I('book')}<span>History</span></button>`;
  $('#layers-btn').innerHTML = I('layers'); $('#home-btn').innerHTML = I('locate'); $('#zin-btn').innerHTML = I('plus'); $('#zout-btn').innerHTML = I('minus');
  $('#sheet .x').innerHTML = I('x'); $('#sheet .back').innerHTML = I('back');
  document.addEventListener('click', onClick); document.addEventListener('input', onInput); document.addEventListener('change', onInput);
  document.addEventListener('submit', e => { e.preventDefault(); if (e.target.dataset.form === 'ask') runAsk(); });
  window.addEventListener('resize', () => view.resize()); window.visualViewport?.addEventListener('resize', () => view.resize());
  document.addEventListener('visibilitychange', async () => { if (!document.hidden) { await resync(); refresh(); } });
  setInterval(() => { if (!ui.playing) refresh(); }, 60000);
  view.setMode(data.mode || 'political');
  fx.init({ root: $('#mapwrap') }); fx.configure({ sound: data.settings.sound !== false, motion: data.settings.motion !== false, haptics: true });
  document.addEventListener('pointerdown', () => fx.unlock(), { passive: true });
  refresh();
  if (!data.onboarded) openSheet(scenarios.length > 1 ? 'country' : 'welcome'); else greet();
  if (demo) demoNote();
  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});
  window.__artesh = { save: persist, get cfg() { return cfg; }, get st() { return st; }, get live() { return live; }, get data() { return data; }, get map() { return map; }, get scenarios() { return scenarios; }, view, commitReports, refresh, ui, chooseCountry };
}

// ---------- the country ----------
const mapCache = new Map();
function loadMap(id) {
  if (!/^[\w-]+$/.test(id)) return Promise.reject(new Error('Unknown country'));
  if (!mapCache.has(id)) mapCache.set(id, fetch(`data/maps/${id}.json`).then(r => { if (!r.ok) throw new Error(`The map of ${id} could not be loaded.`); return r.json(); }).catch(e => { mapCache.delete(id); throw e; }));
  return mapCache.get(id);
}
// the map on screen follows data.scenario: called after anything that may have changed it
async function followScenario() {
  if (map.id === data.scenario) return;
  let next; try { next = await loadMap(data.scenario); } catch { store.switchScenario(data, map.id); return; }
  map = next; view.setMap(map); iconCache.clear(); for (const k in cardCache) delete cardCache[k];
  ui.assess = null; ui.asOf = null; clearInterval(ui.playing); ui.playing = null; ui.ask = { q: '', busy: false, res: null }; ui.preset = null; lastCommit = [];
  view.setMode(view.mode);
}
// Play another country. The campaign of the one being left is kept and comes back when it is chosen again.
async function chooseCountry(id) {
  if (id !== data.scenario) {
    let next; try { next = await loadMap(id); } catch (e) { toast(e.message); return false; }
    store.switchScenario(data, id, map.fronts.map(f => f.id), next.fronts.map(f => f.id));
    await followScenario(); persist(); refresh();
  }
  return true;
}
// a small round flag from META.flag: three bands (h3 across, v3 upright) and an optional disc; a plain roundel without one
let flagSeq = 0;
function flagSVG(flag, cls = '') {
  const c = flag && Array.isArray(flag.colors) && flag.colors.length >= 3 ? flag.colors : ['#59636b', '#8b949b', '#59636b']; const id = `fc${++flagSeq}`;
  const bands = flag && flag.type === 'v3' ? `<rect width="14" height="40" fill="${esc(c[0])}"/><rect x="14" width="12" height="40" fill="${esc(c[1])}"/><rect x="26" width="14" height="40" fill="${esc(c[2])}"/>` : `<rect width="40" height="14" fill="${esc(c[0])}"/><rect y="14" width="40" height="12" fill="${esc(c[1])}"/><rect y="26" width="40" height="14" fill="${esc(c[2])}"/>`;
  return `<svg class="flag ${cls}" viewBox="0 0 40 40" aria-hidden="true"><defs><clipPath id="${id}"><circle cx="20" cy="20" r="18"/></clipPath></defs><g clip-path="url(#${id})">${bands}${flag && flag.disc ? `<circle cx="20" cy="20" r="4.6" fill="${esc(flag.disc)}"/>` : ''}</g></svg>`;
}

const labels = () => Object.fromEntries(map.fronts.map(f => [f.id, data.labels[f.id] || f.defaultLabel]));
const front = id => map.fronts.find(f => f.id === id);
const activeFronts = () => map.fronts.filter(f => !data.off.includes(f.id));
function persist() {
  if (!store.save(data)) toast('Storage is full. Export a backup in Settings.');
  if (cfg.server) store.push(() => data, async newer => { if (newer) { data = newer; await followScenario(); store.save(data); refresh(); toast('Updated from another device.'); } });
}
async function resync() { if (!cfg.server || document.activeElement?.matches?.('input,textarea')) return; try { const remote = await store.pull(); if (remote && remote.scenario + JSON.stringify(remote.reports) + JSON.stringify(remote.labels) + remote.off !== data.scenario + JSON.stringify(data.reports) + JSON.stringify(data.labels) + data.off) { data = remote; await followScenario(); store.save(data); } } catch { /* offline */ } }

function refresh() {
  live = simulate(map, data.reports, Date.now(), { off: data.off });
  st = ui.asOf ? simulate(map, data.reports.filter(r => r.ts <= ui.asOf), ui.asOf, { off: data.off }) : live;
  view.off = data.off;
  view.pins = activeFronts().map(f => objective(map, st, f.id)).filter(o => o.prov != null).map(o => ({ prov: o.prov }));
  view.setState(st, labels());
  renderTop(); renderAlert(); renderLegend(); renderReplay();
  if (ui.sheet && !['report', 'welcome', 'edit'].includes(ui.sheet) && !document.activeElement?.matches?.('input,textarea,select')) renderSheet();
}
function greet() {
  const now = new Date(), day = F().days.find(d => d.month === now.getMonth() + 1 && d.day === now.getDate()); // the scenario's own days (META.days)
  if (day) toast(day.text, 6000);
}

// ---------- chrome ----------
function renderTop() {
  $('#nation-name').textContent = st.empire ? st.nation.name : F().name;
  const fl = $('#nation-flag'); if (fl.dataset.id !== map.id) { fl.dataset.id = map.id; fl.innerHTML = flagSVG(F().flag); }
  $('#nation-date').textContent = fmtDate(st.now, { weekday: 'short', day: 'numeric', month: 'short' });
  const v = st.nation.stability;
  $('#stats').innerHTML = `<span class="stat num ${v >= 60 ? 'good' : v >= 35 ? 'warn' : 'bad'}" title="How things are going overall">${v}%</span><span class="stat num ${st.dayStreak ? 'hot' : ''}" title="Day streak">${I('flame')}${st.dayStreak}</span>`;
}
function topAlert() {
  const L = labels();
  if (st.empire) return ['gold', `The ${F().empire} is restored`, 'overview'];
  if (st.tehranFallen) return ['crit', `${F().capital} has fallen`, `front:${st.terr.occ.get(capitalOf(map))}`];
  if (st.terr.threat && st.terr.threat.km < 300) return ['crit', `Enemy ${st.terr.threat.km} km from ${F().capital}`, `front:${st.terr.threat.front}`];
  const worst = activeFronts().slice().sort((a, b) => st.fronts[b.id].pos - st.fronts[a.id].pos)[0];
  if (worst && ['bad', 'crit'].includes(statusOf(st.fronts[worst.id].pos).tone)) return ['crit', `${L[worst.id]}: ${statusOf(st.fronts[worst.id].pos).text.toLowerCase()}`, `front:${worst.id}`];
  const run = activeFronts().find(f => st.fronts[f.id].streak <= -3); if (run) return ['warn', `${L[run.id]}: ${-st.fronts[run.id].streak} defeats in a row`, `front:${run.id}`];
  const up = activeFronts().find(f => st.fronts[f.id].streak >= 3); if (up) return ['good', `${L[up.id]}: ${st.fronts[up.id].streak} victories in a row`, `front:${up.id}`];
  if (!ui.asOf && st.log.length && !st.reportedToday && new Date().getHours() >= 18) return ['info', st.dayStreak ? `Report today to keep your ${st.dayStreak}-day streak` : 'Nothing reported today', 'report'];
  return null;
}
function renderAlert() {
  const a = topAlert();
  $('#alerts').innerHTML = !a || (ui.sheet && innerWidth < 900) ? '' : `<button class="alert glass ${a[0]}" data-act="go" data-go="${a[2]}"><i class="dot"></i>${esc(a[1])}</button>`;
}
function renderLegend() {
  const L = labels(); let h = ''; const sw = (c, n) => `<span><i style="background:${c}"></i>${esc(n)}</span>`;
  if (view.mode === 'life') h = activeFronts().map(f => sw(fcol(f.id), L[f.id])).join('');
  else if (view.mode === 'infra') h = sw('#5c4634', 'Undeveloped') + sw('#5abe78', 'Developed');
  else if (view.mode === 'supply') h = sw('#aa3c32', 'Starved') + sw('#46aa5f', 'Supplied');
  else if (view.mode === 'air') h = sw('#af3c37', 'Enemy skies') + sw('#4682c8', 'Ours');
  else if (view.mode === 'terrain') h = [['Plains', '#7f9a5a'], ['Hills', '#8c8a5c'], ['Mountain', '#6f6558'], ['Desert', '#c9b27a'], ['Forest', '#4f7d4d']].map(([n, c]) => sw(c, n)).join('');
  $('#legend').innerHTML = (ui.sheet && innerWidth < 900) || ui.asOf ? '' : h;
}
function renderModes() {
  $('#modes').innerHTML = MODES.map(([id, name, ic]) => `<button data-act="mode" data-mode="${id}" class="${view.mode === id ? 'on' : ''}">${I(ic)}${name}</button>`).join('') + `<hr><button data-act="mode" data-mode="empire" class="${view.showEmpire ? 'on' : ''}">${I('crown')}Old empire</button>`;
  $('#layers-btn').classList.toggle('on', view.mode !== 'political' || view.showEmpire);
}
function setMode(m) {
  if (m === 'empire') { view.showEmpire = !view.showEmpire; view.dirty = true; if (view.showEmpire) view.flyTo(map.w / 2, map.h / 2, view.minS * 1.02); }
  else { view.setMode(m); data.mode = m; persist(); }
  $('#modes').hidden = true; renderModes(); renderLegend();
}
let toastT;
function toast(msg, ms = 3200, action = null) { const t = $('#toast'); t.innerHTML = `<span>${esc(msg)}</span>${action ? `<button data-act="${action.act}">${esc(action.label)}</button>` : ''}`; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => (t.hidden = true), ms); }
function banner(title, sub, tone, extra = '') { if (ui.sheet) return; const b = $('#banner'); b.className = 'glass ' + tone; b.innerHTML = `<b>${esc(title)}</b>${sub ? `<span>${esc(sub)}</span>` : ''}${extra ? `<i>${esc(extra)}</i>` : ''}`; b.hidden = true; void b.offsetWidth; b.hidden = false; clearTimeout(banner.t); banner.t = setTimeout(() => (b.hidden = true), 3900); }

// ---------- replay ----------
const firstTs = () => (data.reports.length ? Math.min(...data.reports.map(r => r.ts)) - 3600000 : Date.now());
function renderReplay() {
  const el = $('#replay'); if (!ui.asOf) { el.hidden = true; return; }
  const a = firstTs(), b = Date.now(); el.hidden = false;
  if (!el.dataset.built) { el.dataset.built = 1; el.innerHTML = `<button class="play" data-act="replay-play" aria-label="Play"></button><input type="range" min="0" max="1000" step="1" data-bind="replay" aria-label="Date"><span class="when num"></span><button data-act="replay-exit" aria-label="Back to today">${I('x')}</button>`; }
  el.querySelector('.play').innerHTML = I(ui.playing ? 'pause' : 'play');
  const r = el.querySelector('input'); if (document.activeElement !== r || ui.playing) r.value = Math.round(((ui.asOf - a) / (b - a)) * 1000);
  el.querySelector('.when').textContent = fmtDate(ui.asOf, { day: 'numeric', month: 'short' });
}
function playReplay() {
  if (ui.playing) { clearInterval(ui.playing); ui.playing = null; renderReplay(); return; }
  const a = firstTs(); if (!ui.asOf || ui.asOf >= Date.now() - 1000) ui.asOf = a;
  ui.playing = setInterval(() => { const b = Date.now(); ui.asOf += (b - a) / 110; if (ui.asOf >= b) { exitReplay(); return; } refresh(); }, 80);
  renderReplay();
}
function exitReplay() { clearInterval(ui.playing); ui.playing = null; ui.asOf = null; refresh(); }

// ---------- division icons ----------
const iconCache = new Map();
function unitIcon(type, color, str = 100, o = {}) {
  const key = [type, color, Math.round(str / 10), o.num | 0, o.rank | 0, !!o.brigade].join();
  if (iconCache.has(key)) return iconCache.get(key);
  const c = document.createElement('canvas'); c.width = 96; c.height = 108; const x = c.getContext('2d');
  const saved = view.dpr; view.dpr = 1; view.token(x, 48, 45, 3, { type, color, str, num: o.num, rank: o.rank, brigade: o.brigade }); view.dpr = saved;
  const url = c.toDataURL(); iconCache.set(key, url); return url;
}
const divIcon = d => unitIcon(d.type, d.front ? view.homeTok : '#8a6a2a', d.str, { num: d.n, rank: rankIndex(d.xp), brigade: /Brigade/.test(d.name) });

// ---------- sheets ----------
const ROOTS = ['fronts', 'history', 'report', 'welcome', 'province', 'overview'];
const firstRun = () => !data.onboarded; // the country picker opens the welcome; later it is a page of Settings
const fromMap = new Set(['division']);
function openSheet(name, arg = null, push = true) {
  if (ui.dict) stopDictation();
  if (name === 'report' && ui.asOf) exitReplay();
  if (ROOTS.includes(name) || (fromMap.has(name) && !ui.sheet) || (name === 'country' && firstRun())) ui.stack = []; else if (push && ui.sheet && ui.sheet !== name) ui.stack.push([ui.sheet, ui.arg]);
  ui.sheet = name; ui.arg = arg;
  if (name === 'report' && !ui.report) ui.report = newReport();
  if (name === 'overview') autoAssess();
  $('#modes').hidden = true; $('#banner').hidden = true; $('#sheet').hidden = false; renderSheet(); $('#sheet-body').scrollTop = 0;
  const root = ui.stack[0]?.[0] || name;
  document.querySelectorAll('#nav button').forEach(b => b.classList.toggle('on', b.dataset.sheet === root || (b.dataset.sheet === 'fronts' && root === 'front')));
  renderLegend(); renderAlert();
}
function closeSheet() {
  if (ui.dict) stopDictation();
  if (ui.sheet === 'country' && firstRun()) { openSheet('welcome'); return; } // the picker is only the first step
  if (ui.sheet === 'welcome') { data.onboarded = true; persist(); }
  ui.sheet = null; ui.stack = []; $('#sheet').hidden = true; view.select(null);
  document.querySelectorAll('#nav button').forEach(b => b.classList.remove('on'));
  renderLegend(); renderAlert();
}
function back() { const p = ui.stack.pop(); if (p) openSheet(p[0], p[1], false); else closeSheet(); }
function renderSheet() {
  const R = { fronts: sFronts, front: sFront, history: sHistory, report: sReport, edit: sEdit, province: sProvince, overview: sOverview, welcome: sWelcome, country: sCountry, settings: sSettings, units: sUnits, division: sDivision, share: sShare }[ui.sheet];
  if (!R) return;
  const [title, html, tall] = R();
  $('#sheet-title').textContent = title; $('#sheet-body').innerHTML = html; $('#sheet').classList.toggle('tall', !!tall);
  $('#sheet .back').hidden = !ui.stack.length;
  if (ui.sheet === 'share') mountCards();
}
const row = ({ icon, lead, t, d, end = '', act, attrs = '', cls = '' }) => `<${act ? 'button' : 'div'} class="row ${cls}" ${act ? `data-act="${act}"` : ''} ${attrs}>${lead ?? (icon ? `<span class="lead">${I(icon)}</span>` : '')}<span class="main"><span class="t">${t}</span>${d ? `<div class="d">${d}</div>` : ''}</span>${end ? `<span class="end">${end}</span>` : ''}</${act ? 'button' : 'div'}>`;
const kpi = (k, v, cls = '') => `<div class="kpi"><small>${k}</small><b class="${cls}">${v}</b></div>`;

function frontBar(fr) {
  const x = 50 - fr.pos / 2;
  return `<div class="fbar">${fr.pos > 0 ? `<div class="fill bad" style="left:${x}%;width:${50 - x}%"></div>` : `<div class="fill good" style="left:50%;width:${x - 50}%"></div>`}<div class="mid"></div></div>`;
}
function frontCard(f) {
  const fr = st.fronts[f.id], s = statusOf(fr.pos), L = labels(); const off = data.off.includes(f.id);
  return `<button class="front" data-act="open" data-sheet="front" data-arg="${f.id}" style="--c:${fcol(f.id)}">
    <div class="hd"><i class="dotc"></i><span class="lab">${esc(L[f.id])}</span><span class="st ${off ? 'neutral' : s.tone}">${off ? 'Paused' : s.text}</span></div>${frontBar(fr)}</button>`;
}
function sFronts() {
  const order = map.fronts.slice().sort((a, b) => data.off.includes(a.id) - data.off.includes(b.id) || st.fronts[b.id].pos - st.fronts[a.id].pos);
  return ['Fronts', `<div class="rows">${order.map(frontCard).join('')}</div><p class="faint small" style="margin-top:14px">Red: the enemy is inside ${esc(F().name)}. Green: you are pushing out.</p>`, true];
}
function evRow(i, ts) {
  const L = labels();
  return `<div class="ev ${i.outcome}" style="--c:${fcol(i.front)}">${I(actIcon(i.action))}<div><div class="h">${esc(i.headline)}</div><div class="m"><b>${esc(L[i.front])}</b> · ${esc(i.battle ? `${ACTIONS[i.action].label} · ${i.battle}` : ACTIONS[i.action].label)}${i.unit ? ` · ${esc(i.unit.replace(/ (Division|Brigade).*$/, ''))}` : ''}${i.reason ? ` (${esc(i.reason)})` : ''}${i.at != null ? ` at ${esc(map.provinces[i.at].n)}` : ''}${ts ? ` · ${fmtDate(ts, { day: 'numeric', month: 'short' })}` : ''}</div></div></div>`;
}
const unitGrid = list => `<div class="units">${list.map(d => `<button class="unit" data-act="open" data-sheet="division" data-arg="${d.id}" aria-label="${esc(d.name)}"><img src="${divIcon(d)}" alt=""><span>${esc(d.home)}</span></button>`).join('')}</div>`;
function sFront() {
  const f = front(ui.arg), fr = st.fronts[f.id], s = statusOf(fr.pos), L = labels(); const off = data.off.includes(f.id);
  const divs = st.divisions.filter(d => d.front === f.id); const obj = objective(map, st, f.id);
  const disp = st.log.slice().reverse().flatMap(l => l.items.filter(i => i.front === f.id).map(i => [i, l.ts])).slice(0, 5); const note = off ? null : frontNote(map, st, f.id);
  return [L[f.id], `
    <div class="front" style="--c:${fcol(f.id)};padding:0"><div class="hd"><span class="nm">${esc(f.name)}</span><span class="st ${off ? 'neutral' : s.tone}">${off ? 'Paused' : s.text}</span></div>
    ${frontBar(fr)}<div class="fends"><span>${esc(F().capital)}</span><span>${esc(f.satrapy)}</span></div></div>
    ${note ? `<p class="small ${note.tone}" style="margin:12px 0 0">${esc(note.text)}</p>` : ''}
    <div class="rows" style="margin-top:14px">${row({ icon: 'target', t: esc(obj.text), d: 'Next objective', act: 'flyfront', attrs: `data-id="${f.id}"`, end: I('chev', 's') })}</div>
    <div class="btns"><button class="btn win" data-act="quick" data-id="${f.id}" data-o="win" ${off ? 'disabled' : ''}>${I('arrowR', 's')}Win</button><button class="btn loss" data-act="quick" data-id="${f.id}" data-o="loss" ${off ? 'disabled' : ''}>${I('arrowL', 's')}Loss</button></div>
    <h3>Divisions</h3>${unitGrid(divs)}
    <h3>Latest</h3>${disp.length ? disp.map(([i, ts]) => evRow(i, ts)).join('') : '<p class="faint small">Nothing reported here yet.</p>'}`, true];
}
function sUnits() {
  const L = labels();
  const urow = (type, color, str, name, sub) => row({ lead: `<img class="tok" src="${unitIcon(type, color, str)}" alt="">`, t: esc(name), d: esc(sub), end: `<span class="num">${Math.round(str)}%</span>` });
  if (ui.arg === 'air') return ['Air force', `<div class="rows">${st.wings.map(w => urow('air', '#4a5f8a', (w.planes / w.max) * 100, w.name, `${w.model} · ${w.base} · ${Math.round(w.planes)} aircraft`)).join('')}</div>`, true];
  if (ui.arg === 'navy') return ['Navy', st.fleets.map(fl => `<h3>${esc(fl.name)}</h3><div class="rows">${fl.ships.map(s => urow('ship', '#28587a', s.hp, s.name, s.cls)).join('')}</div>`).join(''), true];
  const list = st.divisions.filter(d => (ui.arg === 'guard' ? !d.front : d.front === ui.arg));
  return [ui.arg === 'guard' ? `${F().capital} garrison` : `${L[ui.arg]} · divisions`, `<div class="rows">${list.map(d => row({ lead: `<img class="tok" src="${divIcon(d)}" alt="">`, t: esc(d.name), d: `${UNIT_TYPES[d.type].name} · ${rankOf(d.xp)}`, end: I('chev', 's'), act: 'open', attrs: `data-sheet="division" data-arg="${d.id}"` })).join('')}</div>`, true];
}
function sDivision() {
  const d = st.divisions.find(x => x.id === ui.arg); const L = labels();
  if (!d) return ['Division', `<div class="empty">${I('shield')}<b>Struck from the order of battle</b>This division was destroyed.</div>`];
  const f = d.front ? front(d.front) : null; const refit = d.str < 30;
  const state = refit ? ['Pulled out of the line to refit', 'warn'] : d.led && st.now - d.led < 3 * DAY ? ['In action in the last few days', 'gold'] : [f ? `In the line on the ${f.name}` : 'Guarding the capital', 'dim'];
  return [shortName(d), `
    <div class="dhead"><img src="${divIcon(d)}" alt=""><div><b>${esc(d.name)}</b>${d.nick ? `<span class="gold">“${esc(d.nick)}”</span>` : ''}<span>${esc(d.co)} · raised at ${esc(d.home)}</span><span class="${state[1]}">${state[0]}</span></div></div>
    <div class="grid">${kpi('Strength', Math.round(d.str) + '%', d.str < 30 ? 'bad' : d.str < 66 ? 'warn' : '')}${kpi('Organisation', Math.round(d.org) + '%')}${kpi('Experience', rankOf(d.xp))}${kpi('Led to victory', d.w, d.w ? 'good' : '')}${kpi('Took the blow', d.l, d.l ? 'bad' : '')}${f ? kpi('Front', `<span style="color:${fcol(f.id)}">${esc(L[f.id])}</span>`) : kpi('Station', esc(F().capital))}</div>
    <h3>Battle honours</h3>${d.honours.length ? d.honours.slice().reverse().map(h => `<div class="ev ${h.win ? 'win' : 'loss'}">${I(h.win ? 'medal' : 'arrowL')}<div><div class="h">${esc(h.text)}</div><div class="m">${esc(h.headline || '')} · ${fmtDate(h.t, { day: 'numeric', month: 'short' })}</div></div></div>`).join('') : '<p class="faint small">None yet. Honours are earned in significant engagements this division leads.</p>'}
    ${f ? `<div class="btns"><button class="btn sm" data-act="flyfront" data-id="${f.id}">${I('locate', 's')}Show on the map</button></div>` : ''}`, true];
}

// ---------- history ----------
function heatmap() {
  const today = dayKey(Date.now()); const dow = (new Date().getDay() + 6) % 7; const weeks = 20; const start = today - dow - (weeks - 1) * 7;
  const net = new Map(); for (const l of live.log) { if (l.kind) continue; const k = dayKey(l.ts); net.set(k, (net.get(k) || 0) + l.items.reduce((a, i) => a + (i.outcome === 'win' ? i.severity : i.outcome === 'loss' ? -i.severity : 0), 0)); }
  let h = '';
  for (let d = start; d < start + weeks * 7; d++) { const v = net.get(d); let bg = ''; if (v != null) { const a = Math.min(1, 0.35 + Math.abs(v) / 10); bg = v > 0 ? `rgba(91,191,138,${a})` : v < 0 ? `rgba(229,96,77,${a})` : 'rgba(162,167,171,.45)'; } h += `<i class="${d > today ? 'future' : ''}" ${bg ? `style="background:${bg}"` : ''}></i>`; }
  return `<div class="heat" style="grid-template-columns:repeat(${weeks},1fr)">${h}</div>`;
}
function entryHTML(l) {
  return `<div class="entry"><div class="when">${fmtDate(l.ts)}<span class="sp"></span><button data-act="editreport" data-id="${esc(l.id)}" aria-label="Edit">${I('edit', 's')}</button><button data-act="delreport" data-id="${esc(l.id)}" aria-label="Delete">${I('trash', 's')}</button></div>
    ${l.summary ? `<p class="quote">${esc(l.summary)}</p>` : ''}${l.items.map(i => evRow(i)).join('')}
    ${l.fx.some(x => x.tone) ? `<div class="fx">${l.fx.filter(x => x.tone).slice(0, 6).map(x => `<span class="${x.tone}">${esc(x.text)}</span>`).join('')}</div>` : ''}</div>`;
}
function askBlock() {
  const a = ui.ask; const res = a.res;
  const cited = res ? res.cited.map(id => live.log.find(l => l.id === id)).filter(Boolean) : [];
  return `<form class="askbar" data-form="ask"><input type="text" id="askq" enterkeyhint="search" autocomplete="off" placeholder="Ask about your history…" value="${esc(a.q)}"><button class="btn sm" ${a.busy ? 'disabled' : ''} aria-label="Ask">${I(a.busy ? 'clock' : 'search', 's')}</button></form>
    ${res ? `<div class="answer"><p class="quote">${esc(res.answer).replace(/\n/g, '<br>')}</p>
      ${res.warning ? `<p class="faint small">${esc(res.warning)}</p>` : ''}
      ${res.followups?.length ? `<div class="chips">${res.followups.map(f => `<button class="chip" data-act="askmore" data-q="${esc(f)}">${esc(f)}</button>`).join('')}</div>` : ''}
      ${cited.length ? `<h3>Based on</h3>${cited.slice(0, 6).map(entryHTML).join('')}` : ''}
      <div class="btns"><button class="btn sm quiet" data-act="askclear">Clear</button></div></div>` : ''}`;
}
async function runAsk(q) {
  q = (q ?? $('#askq')?.value ?? '').trim(); if (q.length < 3) return;
  ui.ask = { q, busy: true, res: null }; renderSheet();
  let res; try { res = await ask({ map, st: live, labels: labels(), question: q, remote: !!cfg.judge }); } catch (e) { res = { answer: 'The staff could not answer that.', cited: [], confidence: 'low', warning: e.message, followups: [] }; }
  ui.ask = { q, busy: false, res }; if (ui.sheet === 'history') { renderSheet(); $('#sheet-body').scrollTop = 0; }
}
function sHistory() {
  const list = live.log.filter(l => !l.kind).reverse();
  if (!list.length) return ['History', `<div class="empty">${I('book')}<b>Nothing yet</b>Tap the microphone and say how your day went.</div>`];
  return ['History', `${askBlock()}${ui.ask.res ? '' : `${heatmap()}
    <div class="btns"><button class="btn sm" data-act="replay">${I('play', 's')}Replay on the map</button></div>
    <div style="margin-top:12px">${list.map(entryHTML).join('')}</div>`}`, true];
}

// ---------- report ----------
const newReport = () => ({ text: '', busy: false, note: '', pick: false });
function sReport() {
  const r = ui.report; const eng = pickEngine(cfg); const L = labels();
  const hint = ui.dict ? (ui.dict.state === 'transcribing' ? 'Transcribing…' : 'Listening. Tap to stop.') : r.note || (r.text ? '' : eng === 'keyboard' ? 'Type, or use the keyboard microphone' : 'Tap the microphone and talk');
  return ['What happened?', `
    <div class="composer"><textarea id="rtext" data-bind="report.text" placeholder="Failed a quiz. Hit a PR at the gym. Great call with mom…">${esc(r.text)}</textarea>
      <div class="hint" id="micnote">${esc(hint)}</div>
      <button class="mic ${ui.dict ? (ui.dict.state === 'transcribing' ? 'busy' : 'live') : ''}" data-act="mic" aria-label="Dictate">${I('mic')}</button></div>
    <div class="btns"><button class="btn primary" data-act="send" ${r.busy ? 'disabled' : ''}>${r.busy ? 'Working…' : 'Send'}</button></div>
    ${r.pick ? '' : `<h3>Orders of the day</h3>${ordersHTML()}`}
    ${r.pick ? `<p class="small warn" style="margin:14px 0 8px">Not sure where that belongs. Pick a front:</p><div class="pick">${activeFronts().map(f => `<div class="pk" style="--c:${fcol(f.id)}"><span><i class="dotc"></i>${esc(L[f.id])}</span><button class="btn sm win" data-act="quick" data-id="${f.id}" data-o="win">Win</button><button class="btn sm loss" data-act="quick" data-id="${f.id}" data-o="loss">Loss</button></div>`).join('')}</div>` : ''}`, true];
}
function sEdit() {
  const res = ui.edit; const L = labels();
  const opt = (list, cur) => list.map(a => `<option value="${a}" ${a === cur ? 'selected' : ''}>${ACTIONS[a].label} — ${esc(ACTIONS[a].means)}</option>`).join('');
  return ['Edit', `${res.items.map((it, i) => `<div class="item" style="--c:${fcol(it.front)}">
      <div class="top"><select data-bind="item.front" data-i="${i}">${map.fronts.map(f => `<option value="${f.id}" ${f.id === it.front ? 'selected' : ''}>${esc(L[f.id])}</option>`).join('')}</select><button data-act="rmitem" data-i="${i}" aria-label="Remove">${I('x', 's')}</button></div>
      <input class="hl" type="text" data-bind="item.headline" data-i="${i}" value="${esc(it.headline)}" placeholder="What happened">
      <div class="ctl"><div class="seg">${[['win', 'Win'], ['loss', 'Loss']].map(([o, n]) => `<button class="${it.outcome === o ? 'on ' + o : ''}" data-act="outcome" data-i="${i}" data-o="${o}">${n}</button>`).join('')}</div>
        <div class="sev">${[1, 2, 3, 4, 5].map(n => `<button class="${it.severity === n ? 'on' : ''}" data-act="sev" data-i="${i}" data-n="${n}">${n}</button>`).join('')}</div></div>
      <select style="margin-top:8px" data-bind="item.action" data-i="${i}">${opt(it.outcome === 'win' ? WIN_ACTIONS : LOSS_ACTIONS, it.action)}</select></div>`).join('')}
    <div class="btns"><button class="btn" data-act="back">Cancel</button><button class="btn primary" data-act="saveedit" ${res.items.length ? '' : 'disabled'}>Save</button></div>`, true];
}

// ---------- overview & settings ----------
function autoAssess() {
  if (ui.assess && Date.now() - ui.assessAt < 6 * 3600000 && ui.assessN === data.reports.length) return;
  const n = data.reports.length;
  assess({ map, st: live, labels: labels(), off: data.off, remote: !!cfg.judge }).then(x => { ui.assess = x; ui.assessAt = Date.now(); ui.assessN = n; if (ui.sheet === 'overview') renderSheet(); }).catch(() => {});
}
const ordersHTML = () => `<div class="orders">${(live.orders || []).map(o => `<div class="ord ${o.done ? 'done' : ''}">${I(o.done ? 'check' : 'target', 's')}<span>${esc(orderText(o, labels(), map))}</span><b>+${o.reward}</b></div>`).join('')}</div>`;
function sOverview() {
  const n = st.nation; const L = labels(); const a = ui.assess; const c = st.commander;
  const earned = Object.keys(live.ach).map(id => medalOf(id, map)).filter(Boolean); const alt = altDate(st.now); const next = (medalProgress(live) || [])[0];
  const total = Math.round(map.fronts.reduce((s, f) => s + Math.max(0, -st.fronts[f.id].pos), 0) / map.fronts.length);
  return [n.name, `
    <p class="dim small">${fmtDate(st.now, { weekday: 'long', day: 'numeric', month: 'long' })} ${alt ? ` · ${esc(alt)}` : ''}</p>
    <div class="rank"><div class="rk"><b>${esc(c.title)}</b><span>${esc(c.gloss)}</span><em class="num">${c.xp.toLocaleString()} XP</em></div>
      <div class="meter"><i style="width:${Math.round(c.progress * 100)}%;background:var(--accent)"></i></div>
      ${c.next ? `<div class="fends"><span>${(c.nextAt - c.xp).toLocaleString()} XP to ${esc(c.next.title)}</span><span>${esc(c.next.gloss)}</span></div>` : ''}</div>
    <div class="grid">${kpi('Stability', n.stability + '%', n.stability >= 60 ? 'good' : n.stability < 35 ? 'bad' : '')}${kpi('Day streak', st.dayStreak, st.dayStreak ? 'gold' : '')}${kpi('Empire', total + '%')}</div>
    <h3>Orders of the day</h3>${ordersHTML()}
    ${a ? `<h3>Chief of staff</h3><p class="quote">${esc(a.assessment)}</p>${a.orders.map(o => `<div class="ev" style="--c:${fcol(o.front)}">${I('target')}<div><div class="h">${esc(o.order)}</div><div class="m"><b>${esc(L[o.front])}</b></div></div></div>`).join('')}` : ''}
    <h3>Decorations · ${earned.length}</h3>
    ${earned.length || st.satrapies.length ? `<div class="tags">${earned.map(md => `<span class="tag gold" title="${esc(md.desc)}">${I('medal', 's')}${esc(md.name)}</span>`).join('')}${st.satrapies.map(x => `<span class="tag" title="${esc(x.region)}">${esc(x.name)}</span>`).join('')}</div>` : ''}
    ${next ? `<div class="nextmedal"><span>Next: <b>${esc(next.name)}</b> · ${esc(next.desc)}</span><div class="meter"><i style="width:${Math.round(next.pct * 100)}%"></i></div></div>` : ''}
    <div class="btns"><button class="btn primary" data-act="open" data-sheet="share">${I('share', 's')}Share</button><button class="btn" data-act="open" data-sheet="settings">${I('gear', 's')}Settings</button></div>`, true];
}

// ---------- share cards ----------
function mapShot() {
  const c = document.createElement('canvas'); c.width = view.base.width; c.height = view.base.height; const x = c.getContext('2d'); x.drawImage(view.base, 0, 0); x.drawImage(view.over, 0, 0);
  const t = map.provinces[capitalOf(map)].city; const [sx, sy] = view.toScreen(t[0], t[1] + 260);
  return { canvas: c, focus: [Math.max(0.2, Math.min(0.8, sx / view.w)), Math.max(0.2, Math.min(0.8, sy / view.h))] };
}
function latestEntry() { return live.log.filter(l => !l.kind).at(-1) || null; }
function cardData(kind) {
  const L = labels(); const e = latestEntry(); const m = e ? momentOf(e) : null; const shot = mapShot(); const c = live.commander;
  const main = e?.items.slice().sort((a, b) => b.severity - a.severity)[0];
  const fronts = activeFronts().map(f => ({ label: L[f.id], status: statusOf(live.fronts[f.id].pos).text, pos: live.fronts[f.id].pos, color: fcol(f.id) }));
  const nation = live.empire ? live.nation.name : F().name;
  const fresh = e && live.now - e.ts < 3 * DAY;
  const headline = fresh ? (m.kind === 'normal' || m.kind === 'levelup' || m.kind === 'medal' ? main?.headline || headlineOf(e, L) : m.title) : 'All quiet on every front';
  const tone = fresh ? (m.kind === 'normal' ? (main?.outcome === 'loss' ? 'bad' : 'good') : m.tone) : 'gold';
  if (kind === 'bulletin') return renderBulletin({ map: shot.canvas, focus: shot.focus, nation, date: live.now, headline, sub: fresh && main ? `${L[main.front]} · ${main.battle || ACTIONS[main.action].label}` : `${live.nation.stability}% stability`, tone, stability: live.nation.stability, streak: live.dayStreak, rank: c.title, fronts });
  if (kind === 'frontpage') return renderFrontPage({ map: shot.canvas, date: live.now, persianDate: altDate(live.now), masthead: F().masthead, city: F().capital, nation, tone, headline: e ? (['levelup', 'medal', 'order_done', 'streak', 'normal'].includes(m.kind) ? main?.headline || headlineOf(e, L) : m.title) : 'All quiet on every front', deck: e?.summary || '',
    body: e ? [e.items.map(i => `**${L[i.front]}.** ${i.headline}.`).join(' '), e.fx.filter(x => x.tone).map(x => x.text).slice(0, 5).join('. ') + '.', sitrep(map, live, L).split('\n').slice(-1)[0]].filter(t => t.length > 3) : ['The borders are quiet.'],
    sidebar: fronts.map(f => `${f.label}: ${f.status.toLowerCase()}`) });
  if (kind === 'recap') { const r = weeklyRecap(map, live, L); const col = Object.fromEntries(map.fronts.map(f => [f.id, fcol(f.id)]));
    return renderRecap({ ...r, perFront: r.perFront.filter(f => !f.paused).map(f => ({ ...f, color: col[f.id] })), rankProgress: c.progress, mvp: r.mvp ? { ...r.mvp, iconPath: UNIT_PATHS[r.mvp.type] } : null }); }
  return renderRankUp({ kind: 'rank', title: c.title, gloss: c.gloss, sub: c.promotedAt ? `Promoted on ${fmtDate(c.promotedAt, { day: 'numeric', month: 'long', year: 'numeric' })}` : `${c.xp.toLocaleString()} XP`, streak: live.dayStreak, nation });
}
const CARDS = [['bulletin', 'Today\u2019s bulletin'], ['frontpage', 'Front page'], ['recap', 'Week in review'], ['rank', 'Your rank']];
function sShare() {
  return ['Share', `<p class="dim small">Tap a card to share or save it.</p><div class="cards">${CARDS.map(([k, n]) => `<button class="cardbtn" data-act="sharecard" data-kind="${k}"><div class="thumb" id="th-${k}"></div><span>${n}</span></button>`).join('')}</div>`, true];
}
const cardCache = {};
function mountCards() { for (const [k] of CARDS) { try { const c = cardCache[k] = cardData(k); c.style.cssText = 'width:100%;height:auto;display:block;border-radius:10px'; $(`#th-${k}`)?.replaceChildren(c); } catch (err) { console.error(err); } } }

function sSettings() {
  const s = data.settings; const L = labels();
  return ['Settings', `
    <h3>Your fronts</h3>
    ${map.fronts.map(f => `<div class="frow" style="--c:${fcol(f.id)}"><i class="dotc"></i><input type="text" maxlength="28" data-bind="label" data-id="${f.id}" value="${esc(L[f.id])}" aria-label="${esc(f.name)}"><button class="switch ${data.off.includes(f.id) ? '' : 'on'}" data-act="togglefront" data-id="${f.id}" aria-label="Active"></button></div>`).join('')}
    <h3>Country</h3>
    <div class="rows">${row({ lead: flagSVG(F().flag, 'lead'), t: esc(F().name), d: scenarios.length > 1 ? 'Change country. Each one keeps its own campaign.' : esc(F().long), ...(scenarios.length > 1 ? { act: 'open', attrs: 'data-sheet="country"', end: I('chev', 's') } : {}) })}</div>
    <h3>Staff</h3>
    <div class="rows">${row({ icon: cfg.judge ? 'check' : 'info', t: cfg.judge ? `Judged by ${esc(cfg.judge)}` : 'Offline keyword judge', d: cfg.judge ? (cfg.transcribe ? `Voice transcribed by ${esc(cfg.transcribe)}` : 'Voice: keyboard dictation') : cfg.server ? 'Set OPENAI_API_KEY or OPENAI_BASE_URL in .env on the server' : 'Run the server to use an AI judge' })}</div>
    <h3>Feel</h3>
    <div class="frow"><span style="flex:1">Sound</span><button class="switch ${data.settings.sound !== false ? 'on' : ''}" data-act="togglefx" data-k="sound" aria-label="Sound"></button></div>
    <div class="frow"><span style="flex:1">Motion and confetti</span><button class="switch ${data.settings.motion !== false ? 'on' : ''}" data-act="togglefx" data-k="motion" aria-label="Motion"></button></div>
    <details><summary>More</summary>
      <div class="rows">${row({ icon: 'down', t: 'Export backup', act: 'export' })}${row({ icon: 'up', t: 'Import backup', act: 'import' })}${row({ icon: 'play', t: 'Load demo', act: 'demo' })}${row({ icon: 'trash', t: '<span class="bad">Reset everything</span>', act: 'reset' })}${cfg.login ? row({ icon: 'x', t: 'Log out', act: 'logout' }) : ''}</div>
      <input type="file" id="importfile" accept="application/json,.json" hidden>
      <p class="faint small" style="margin-top:16px">Unit icons by Game-icons.net (CC BY 3.0). Interface icons by Lucide. Borders from Natural Earth.</p>
    </details>`, true];
}
function sProvince() {
  const p = map.provinces[ui.arg]; const meta = mapMeta(map); const c = map.countries[p.t]; const t = st.terr;
  const occ = t.occ.get(p.id), lib = t.lib.get(p.id);
  const us = F().name;
  const ctl = p.t === F().home ? (occ ? front(occ).enemyName : us) : lib ? us : c.name;
  const kinds = { port: ['Port', 'anchor'], naval: ['Naval base', 'anchor'], airbase: ['Airbase', 'plane'], hub: ['Supply hub', 'box'], refinery: ['Oil refinery', 'factory'], fort: ['Fortress', 'fort'] };
  const bl = meta.buildings.filter(b => b.prov === p.id);
  const here = activeFronts().filter(f => st.lines[f.id].ours.includes(p.id) || st.lines[f.id].theirs.includes(p.id));
  return [p.n, `<p class="dim small">${esc(meta.stateName(p.s))} · ${esc(c.name)} · held by <span class="${occ ? 'bad' : lib ? 'good' : ''}">${esc(ctl)}</span></p>
    ${bl.length ? `<div class="rows">${bl.map(b => row({ icon: kinds[b.kind][1], t: kinds[b.kind][0], end: st.bld[b.id].dmg > 0.05 ? `<span class="bad num">${Math.round(st.bld[b.id].dmg * 100)}% damaged</span>` : '' })).join('')}</div>` : ''}
    ${p.id === capitalOf(map) ? `<div class="rows">${row({ icon: 'shield', t: `${esc(F().capital)} garrison`, act: 'open', attrs: 'data-sheet="units" data-arg="guard"', end: I('chev', 's') })}</div>` : ''}
    ${here.length ? `<div class="rows">${here.map(frontCard).join('')}</div>` : ''}`];
}
// The country picker: the first step of a first run, and "Change country" in Settings.
function sCountry() {
  return [firstRun() ? 'Choose your country' : 'Country', `<p class="dim">${firstRun() ? 'Seven borders, seven parts of your life. Pick the country whose map you want to fight on; you can change it later.' : 'Each country keeps its own campaign. Nothing is lost by switching.'}</p>
    <div class="rows countries">${scenarios.map(c => row({ lead: flagSVG(c.flag, 'lead'), t: `${esc(c.name)}${c.id === data.scenario && !firstRun() ? ' <span class="faint small">· playing</span>' : ''}`, d: `${c.empire ? `<span class="gold">${esc(c.empire)}</span>` : ''}${c.blurb ? `<span>${esc(c.blurb)}</span>` : ''}`, act: 'country', attrs: `data-id="${esc(c.id)}"`, end: I('chev', 's') })).join('')}</div>`, true];
}
function sWelcome() {
  const L = labels(); const cur = PRESETS.find(p => p.id === ui.preset);
  return ['Your fronts', `<p class="dim">Each border of ${esc(F().name)} is one part of your life. Pick a starting point, rename anything, then tell the staff what happened each day.</p>
    <div class="chips">${PRESETS.map(p => `<button class="chip ${ui.preset === p.id ? 'on' : ''}" data-act="preset" data-id="${p.id}">${esc(p.name)}</button>`).join('')}</div>
    ${cur ? `<p class="faint small">${esc(cur.blurb)}</p>` : ''}
    ${map.fronts.map(f => `<div class="frow" style="--c:${fcol(f.id)}"><i class="dotc"></i><input type="text" maxlength="28" data-bind="label" data-id="${f.id}" value="${esc(L[f.id])}" aria-label="${esc(f.name)}"></div>`).join('')}
    ${cur ? `<p class="faint small">Try saying: “${esc(cur.examples[0])}”</p>` : ''}
    <div class="btns"><button class="btn primary" data-act="close">Begin</button></div>`, true];
}

// ---------- actions ----------
function onMapTap(d) {
  $('#modes').hidden = true;
  if (['report', 'welcome', 'country', 'settings', 'edit'].includes(ui.sheet)) return;
  if (d.kind === 'province') { view.select(d.id); openSheet('province', d.id); }
  else if (d.kind === 'front') openSheet('front', d.id);
  else if (d.kind === 'division') openSheet('division', d.id);
  else if (d.kind === 'fleet') openSheet('units', 'navy');
  else if (d.kind === 'wing') openSheet('units', 'air');
  else if (ui.sheet === 'province') closeSheet();
}
function stopDictation() { ui.dict?.ctl.stop(); ui.dict = null; }
function toggleMic() {
  const r = ui.report;
  if (ui.dict) { ui.dict.ctl.stop(); if (ui.dict?.state !== 'transcribing') { ui.dict = null; renderSheet(); } return; }
  const engine = pickEngine(cfg);
  if (engine === 'keyboard') { r.note = 'Use the microphone key on your keyboard.'; renderSheet(); $('#rtext')?.focus(); return; }
  const base = r.text ? r.text.replace(/\s+$/, '') + ' ' : ''; r.note = '';
  const d = { state: 'starting', ctl: null }; ui.dict = d;
  d.ctl = startDictation({
    engine,
    onText: t => { r.text = (base + t).trimStart(); const el = $('#rtext'); if (el) { el.value = r.text; el.scrollTop = el.scrollHeight; } },
    onState: s => { if (ui.dict !== d) return; if (s === 'idle') ui.dict = null; else d.state = s; if (ui.sheet === 'report') renderSheet(); },
    onError: (msg, o) => { r.note = msg; if (ui.dict === d) ui.dict = null; if (ui.sheet === 'report') { renderSheet(); if (o?.fallback) $('#rtext')?.focus(); } },
  });
  renderSheet();
}
// Send: judge the text and apply it straight away. Undo is one tap; History lets you edit.
async function send() {
  const r = ui.report; stopDictation(); fx.sound('send');
  r.text = ($('#rtext')?.value ?? r.text).trim();
  if (r.text.length < 3) { toast('Say or type what happened first.'); return; }
  r.busy = true; r.pick = false; renderSheet();
  let res;
  try { res = await classify({ map, st: live, labels: labels(), notes: data.notes, off: data.off, text: r.text, remote: !!cfg.judge }); }
  catch (e) { r.busy = false; toast(e.message); renderSheet(); return; }
  r.busy = false;
  if (!res.items.length) { r.pick = true; if (ui.sheet === 'report') renderSheet(); return; }
  const now = Date.now(); const groups = new Map();
  for (const i of res.items) { const d = i.days_ago || 0; if (!groups.has(d)) groups.set(d, []); const { days_ago, ...item } = i; groups.get(d).push(item); }
  const first = Math.min(...groups.keys());
  const reps = [...groups].map(([d, items]) => { let ts = now; if (d > 0) { const x = new Date(now - d * DAY); x.setHours(20, 0, 0, 0); ts = x.getTime(); } return { id: store.uid(), ts, text: d === first ? r.text : '', summary: d === first ? res.summary : '', source: res.source, items }; });
  ui.report = null; closeSheet(); commitReports(reps, { warning: res.warning });
}
function quick(fid, outcome) {
  const text = (ui.sheet === 'report' ? ($('#rtext')?.value ?? ui.report.text) : '').trim();
  ui.report = null; closeSheet();
  commitReports([{ id: store.uid(), ts: Date.now(), text, summary: '', source: 'manual', items: [{ front: fid, outcome, severity: 2, action: outcome === 'win' ? 'offensive' : 'enemy_offensive', headline: text ? (text.length > 90 ? text.slice(0, 87) + '…' : text) : outcome === 'win' ? 'A good day' : 'A bad day' }] }]);
}

let lastCommit = [];
const KIND_RANK = ['empire', 'tehran_fallen', 'tehran_freed', 'satrapy', 'levelup', 'medal', 'operation', 'city_captured', 'city_lost', 'order_done', 'streak', 'normal'];
export function commitReports(reps, { quiet = false, warning = '' } = {}) {
  const before = live;
  data.reports.push(...reps); lastCommit = reps.map(r => r.id); persist(); refresh();
  if (quiet) return;
  const entries = live.log.filter(l => lastCommit.includes(l.id)); if (!entries.length) return;
  const fxs = entries.flatMap(e => e.fx), items = entries.flatMap(e => e.items);
  const main = items.slice().sort((a, b) => b.severity - a.severity)[0];
  const wins = items.filter(i => i.outcome === 'win').length, losses = items.filter(i => i.outcome === 'loss').length;
  // the single most important thing that happened decides the banner and the celebration
  const m = entries.map(momentOf).sort((x, y) => KIND_RANK.indexOf(x.kind) - KIND_RANK.indexOf(y.kind) || y.magnitude - x.magnitude)[0];
  const xp = entries.reduce((a, e) => a + (e.xp || 0), 0); const combo = entries.at(-1).combo?.mult || 1;
  const promoted = entries.find(e => e.levelUp)?.levelUp; const medalIds = entries.flatMap(e => e.medals || []);
  if (main) {
    const sub = `${labels()[main.front]} · ${main.battle || ACTIONS[main.action].label}${main.at != null ? ` at ${map.provinces[main.at].n}` : ''}`;
    const extra = fxs.filter(x => x.front === main.front && x.text !== m.title && x.kind !== 'lead').map(x => x.text).slice(0, 2).join(' · ');
    const big = m.kind !== 'normal' && m.kind !== 'levelup' && m.kind !== 'medal' && m.kind !== 'order_done' && m.kind !== 'streak';
    banner(big ? m.title : main.headline, sub, big ? m.tone : wins > losses ? 'good' : losses > wins ? 'bad' : 'gold', extra);
    fx.celebrate({ tone: big ? m.tone : wins >= losses ? 'good' : 'bad', magnitude: big ? m.magnitude : main.severity, kind: big ? m.kind : 'normal', at: null, el: $('#mapwrap') });
    setTimeout(() => view.flyToFront(main.front), 250);
  }
  // rank, decorations and orders get their own beat a few seconds later
  const later = promoted ? { title: `Promoted to ${promoted.title}`, sub: promoted.gloss, kind: 'levelup' } : medalIds.length ? { title: medalOf(medalIds[0], map)?.name || 'Decoration awarded', sub: medalOf(medalIds[0], map)?.desc || '', kind: 'medal' }
    : before.nation.name !== live.nation.name ? { title: `Long live the ${live.nation.name}`, sub: `Every ${F().regionWord.toLowerCase()} is restored`, kind: 'empire' } : entries.some(e => e.allOrders) ? { title: 'All orders carried out', sub: 'Three of three today', kind: 'order_done' } : null;
  if (later) setTimeout(() => { banner(later.title, later.sub, 'gold'); fx.celebrate({ tone: 'gold', magnitude: later.kind === 'empire' ? 5 : 4, kind: later.kind, at: null }); }, 4300);
  if (live.dayStreak > before.dayStreak) setTimeout(() => { fx.pulse($('#stats .hot')); if (!later) fx.sound('streak'); }, 900);
  const tally = [wins ? `${wins} win${wins > 1 ? 's' : ''}` : '', losses ? `${losses} loss${losses > 1 ? 'es' : ''}` : ''].filter(Boolean).join(', ') || 'noted';
  toast(`${warning ? 'Saved offline' : 'Saved'} · ${tally}${xp ? ` · +${xp} XP` : ''}${combo > 1 ? ` · ×${combo}` : ''}`, 7000, { act: 'undo', label: 'Undo' });
}

function onClick(e) {
  const b = e.target.closest('[data-act]');
  if (!b) { if (!e.target.closest('#modes')) $('#modes').hidden = true; return; }
  const a = b.dataset.act;
  switch (a) {
    case 'open': if (ui.sheet === b.dataset.sheet && !b.dataset.arg && b.closest('#nav')) closeSheet(); else openSheet(b.dataset.sheet, b.dataset.arg || null); break;
    case 'close': closeSheet(); break;
    case 'back': back(); break;
    case 'emblem': if (++ui.emblem % 7 === 0) toast(F().motto, 5000); else openSheet('overview'); break;
    case 'country': chooseCountry(b.dataset.id).then(ok => { if (!ok) return; if (firstRun()) openSheet('welcome'); else { back(); view.home(false); toast(`Now playing ${F().name}.`); } }); break;
    case 'go': { const [s, arg] = b.dataset.go.split(':'); openSheet(s, arg || null); if (s === 'front') view.flyToFront(arg); break; }
    case 'modes': renderModes(); $('#modes').hidden = !$('#modes').hidden; break;
    case 'mode': setMode(b.dataset.mode); break;
    case 'zoom': view.zoomBy(Number(b.dataset.k)); break;
    case 'home': view.home(); break;
    case 'flyfront': view.flyToFront(b.dataset.id); if (innerWidth < 900) closeSheet(); break;
    case 'mic': toggleMic(); break;
    case 'send': send(); break;
    case 'quick': quick(b.dataset.id, b.dataset.o); break;
    case 'undo': data.reports = data.reports.filter(x => !lastCommit.includes(x.id)); lastCommit = []; persist(); refresh(); toast('Undone.'); break;
    case 'editreport': { const rep = data.reports.find(x => x.id === b.dataset.id); if (!rep) break; ui.edit = { id: rep.id, items: rep.items.map(i => ({ ...i })) }; openSheet('edit'); break; }
    case 'outcome': { const it = ui.edit.items[b.dataset.i]; it.outcome = b.dataset.o; it.action = it.outcome === 'win' ? 'offensive' : 'enemy_offensive'; renderSheet(); break; }
    case 'sev': ui.edit.items[b.dataset.i].severity = Number(b.dataset.n); renderSheet(); break;
    case 'rmitem': ui.edit.items.splice(b.dataset.i, 1); renderSheet(); break;
    case 'saveedit': { const old = data.reports.find(x => x.id === ui.edit.id); if (old) old.items = ui.edit.items.map(i => ({ front: i.front, outcome: i.outcome, severity: i.severity, action: i.action, headline: i.headline.trim() || ACTIONS[i.action].label, ...(i.reason && old.items.some(o => o.action === i.action && o.reason === i.reason) ? { reason: i.reason } : {}) })); persist(); refresh(); back(); toast('Updated.'); break; }
    case 'delreport': if (confirm('Delete this entry and rewind its effects?')) { data.reports = data.reports.filter(x => x.id !== b.dataset.id); persist(); refresh(); } break;
    case 'askmore': runAsk(b.dataset.q); break;
    case 'askclear': ui.ask = { q: '', busy: false, res: null }; renderSheet(); break;
    case 'replay': if (!data.reports.length) break; closeSheet(); ui.asOf = firstTs(); view.home(); refresh(); playReplay(); break;
    case 'replay-play': playReplay(); break;
    case 'replay-exit': exitReplay(); break;
    case 'sharemap': shareMap(); break;
    case 'sharecard': { const c = cardCache[b.dataset.kind]; if (c) shareCanvas(c, { filename: `artesh-${b.dataset.kind}.png`, text: sitrep(map, live, labels()) }).then(r => { if (r === 'downloaded') toast('Image saved. Report copied.'); }); break; }
    case 'preset': { const p = PRESETS.find(x => x.id === b.dataset.id); if (p) { const a = applyPreset(p, map); data.labels = a.labels; data.notes = a.notes; data.off = a.off; ui.preset = p.id; persist(); refresh(); renderSheet(); } break; }
    case 'togglefx': { const k = b.dataset.k; data.settings[k] = data.settings[k] === false; persist(); fx.configure({ sound: data.settings.sound !== false, motion: data.settings.motion !== false }); if (k === 'sound' && data.settings.sound !== false) fx.sound('order'); renderSheet(); break; }
    case 'togglefront': { const id = b.dataset.id; if (data.off.includes(id)) data.off = data.off.filter(x => x !== id); else if (activeFronts().length > 1) data.off.push(id); else { toast('Keep at least one front.'); break; } persist(); refresh(); renderSheet(); break; }
    case 'export': { const blob = new Blob([store.exportData(data)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const el = Object.assign(document.createElement('a'), { href: url, download: `artesh-${new Date().toISOString().slice(0, 10)}.json` }); document.body.append(el); el.click(); el.remove(); setTimeout(() => URL.revokeObjectURL(url), 5000); break; }
    case 'import': $('#importfile').click(); break;
    case 'logout': fetch('api/logout', { method: 'POST' }).finally(() => { caches?.keys().then(ks => ks.forEach(k => caches.delete(k))); location.reload(); }); break;
    case 'reset': if (confirm(Object.keys(data.campaigns || {}).length ? `Erase everything you have reported in ${F().name}? Other countries keep their campaigns. This cannot be undone.` : 'Erase everything you have reported? This cannot be undone.')) { data.reports = []; ui.assess = null; persist(); refresh(); toast('Reset. The borders are quiet.'); } break;
    case 'demo': if (!data.reports.length || confirm('Replace what you have with demo data?')) { data.reports = demoReports(); ui.assess = null; persist(); closeSheet(); refresh(); view.home(); toast('Demo loaded.'); } break;
  }
}
function onInput(e) {
  const el = e.target; const bind = el.dataset?.bind;
  if (el.id === 'importfile') { const file = el.files[0]; if (!file) return; file.text().then(async t => { data = store.importData(t); await followScenario(); persist(); refresh(); toast(`Imported ${data.reports.length} entries.`); }).catch(err => toast(err.message)); el.value = ''; return; }
  if (!bind) return;
  if (bind === 'replay') { clearInterval(ui.playing); ui.playing = null; const a = firstTs(), b = Date.now(); ui.asOf = Math.min(b - 1, a + (Number(el.value) / 1000) * (b - a)); refresh(); }
  else if (bind === 'report.text') { ui.report.text = el.value; const h = $('#micnote'); if (h && !ui.dict) h.textContent = ''; }
  else if (bind.startsWith('item.')) { const it = ui.edit.items[el.dataset.i]; it[bind.slice(5)] = el.value; if (bind === 'item.front' && e.type === 'change') renderSheet(); }
  else if (bind === 'label') { const v = el.value.trim(); if (v) data.labels[el.dataset.id] = v; else delete data.labels[el.dataset.id]; persist(); view.setState(st, labels()); }
}
async function shareMap() {
  const text = sitrep(map, st, labels());
  closeSheet(); await new Promise(r => setTimeout(r, 350));
  const c = view.snapshot([`${st.nation.name} — ${fmtDate(st.now, { day: 'numeric', month: 'long', year: 'numeric' })}`, ...text.split('\n').filter(l => l.startsWith('•')).slice(0, 7).map(l => l.slice(2))]);
  c.toBlob(async blob => {
    const file = new File([blob], 'artesh.png', { type: 'image/png' });
    if (navigator.canShare?.({ files: [file] })) { try { await navigator.share({ files: [file], text }); } catch { /* cancelled */ } return; }
    const url = URL.createObjectURL(blob); const el = Object.assign(document.createElement('a'), { href: url, download: 'artesh.png' }); document.body.append(el); el.click(); el.remove(); setTimeout(() => URL.revokeObjectURL(url), 5000);
    navigator.clipboard?.writeText(text).catch(() => {}); toast('Map saved. Report copied.');
  }, 'image/png');
}
function demoNote() {
  try { if (sessionStorage.getItem('artesh.demo-note')) return; } catch { /* no storage: show it */ }
  const n = document.createElement('div'); n.id = 'demo-note'; n.className = 'glass'; n.setAttribute('role', 'note');
  n.innerHTML = `<span><b>This is a demo.</b> Your entries stay in this browser. <a href="https://github.com/sam-siavoshian/hoi4-irl#readme" target="_blank" rel="noopener">Self-host</a> to keep them.</span><button aria-label="Dismiss">${I('x', 's')}</button>`;
  n.querySelector('button').addEventListener('click', e => { e.stopPropagation(); n.remove(); try { sessionStorage.setItem('artesh.demo-note', '1'); } catch { /* fine */ } });
  $('#app').append(n);
}
// A campaign in progress for the demo. Fronts are named by slot (0–6), so it plays on whichever map is loaded.
function demoReports() {
  const ids = map.fronts.map(f => f.id);
  const now = Date.now(); const R = (daysAgo, text, summary, items) => ({ id: 'demo' + daysAgo + items.length, ts: now - daysAgo * DAY, text, summary, source: 'demo', items: items.map(([slot, outcome, severity, action, headline]) => ({ front: ids[slot % ids.length], outcome, severity, action, headline })) });
  return [
    R(11, 'Finished the landing page and signed our first pilot customer.', 'Our columns cross the frontier and take ground beyond it.', [[3, 'win', 4, 'breakthrough', 'First pilot customer signed']]),
    R(9, 'Gym three days in a row, sleep is finally on a schedule.', 'Engineers lay the foundations for a long campaign.', [[4, 'win', 3, 'infrastructure', 'Three straight gym days'], [6, 'win', 2, 'fortify', 'Sleep schedule holding']]),
    R(7, 'Bombed the calculus midterm. Did not study enough.', 'The enemy breaks the line and pours through.', [[0, 'loss', 4, 'enemy_breakthrough', 'Calculus midterm failed']]),
    R(6, 'Great dinner with the family, long talk with dad.', 'The border is crossed.', [[1, 'win', 3, 'offensive', 'Long talk with dad']]),
    R(4, 'Fight with my girlfriend. Also slept 4 hours.', 'Enemy aircraft catch our columns in the open; supply dumps burn.', [[2, 'loss', 4, 'enemy_cas', 'Fight with girlfriend'], [6, 'loss', 3, 'supply_hub_bombed', 'Four hours of sleep']]),
    R(3, 'Still behind in school, missed two assignments.', 'The retreat continues.', [[0, 'loss', 3, 'enemy_offensive', 'Two assignments missed']]),
    R(2, 'Made up with her, went for a long walk. Friends came over.', 'The line is restored.', [[2, 'win', 3, 'encirclement', 'Made up after the fight'], [5, 'win', 2, 'offensive', 'Good night with friends']]),
    R(0.4, 'Shipped the new onboarding flow and two investors replied. Skipped the gym.', 'A second breakthrough.', [[3, 'win', 4, 'breakthrough', 'Onboarding shipped, investors replied'], [4, 'loss', 1, 'attrition', 'Skipped the gym']]),
  ];
}
boot().catch(err => { document.body.insertAdjacentHTML('beforeend', `<pre style="position:fixed;inset:auto 0 0 0;z-index:99;background:#400;color:#fff;padding:12px;white-space:pre-wrap">${esc(err.stack || err)}</pre>`); });
