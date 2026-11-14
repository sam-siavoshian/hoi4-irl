import { simulate, sitrep, statusOf, enemyForce, mapMeta, ACTIONS, WIN_ACTIONS, LOSS_ACTIONS, UNIT_TYPES, rankOf, rankIndex, DAY, havKm } from './engine.js';
import { MapView, FRONT_COLORS } from './map.js';
import { classify, MODELS } from './classify.js';
import { pickEngine, startDictation, hasBrowserSTT, hasRecorder } from './voice.js';
import * as store from './store.js';

const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtDate = (ts, o = { weekday: 'short', day: 'numeric', month: 'short' }) => new Date(ts).toLocaleDateString(undefined, o);
const fmtTime = ts => new Date(ts).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
const num = n => n.toLocaleString();

let map, view, data, st;
const ui = { sheet: null, arg: null, tab: 'army', report: null, dict: null, logOpen: new Set() };

const MODES = [
  ['political', 'Political', '<path d="M4 20V5m0 1h11l-2 3.5 2 3.5H4"/>'],
  ['life', 'Life areas', '<circle cx="12" cy="8" r="3.5"/><path d="M5 20c1-4 4-6 7-6s6 2 7 6"/>'],
  ['infra', 'Infrastructure', '<path d="M3 20h18M5 20V10l5 3V10l5 3V6h4v14"/>'],
  ['supply', 'Supply', '<rect x="4" y="7" width="16" height="12" rx="1"/><path d="M4 12h16M12 7v12"/>'],
  ['air', 'Air', '<path d="M12 3v18M3 13l9-5 9 5M9 21h6"/>'],
  ['terrain', 'Terrain', '<path d="M2 19l6-10 4 6 3-4 7 8z"/>'],
  ['empire', 'Achaemenid borders', '<path d="M4 18l2-9 4 4 2-7 2 7 4-4 2 9zM4 21h16"/>'],
];
const ICONS = {
  stab: '<path d="M12 3v18M5 7h14M5 7l-3 7a3 3 0 006 0zM19 7l-3 7a3 3 0 006 0z"/>', war: '<path d="M4 20L18 6m0 0h-5m5 0v5M20 20L6 6m0 0h5M6 6v5"/>',
  man: '<circle cx="12" cy="7" r="3.5"/><path d="M5 21c0-5 3-8 7-8s7 3 7 8"/>', fac: '<path d="M3 20h18M5 20V10l5 3V10l5 3V6h4v14"/>',
  div: '<rect x="3" y="6" width="18" height="12" rx="1.5"/><path d="M3 6l18 12M21 6L3 18"/>', air: '<path d="M12 3v18M3 13l9-5 9 5M9 21h6"/>', nav: '<path d="M12 3v6M8 9h8l2 6H6zM3 18c2 2 4 2 6 0 2 2 4 2 6 0 2 2 4 2 6 0"/>',
};

// ---------- boot ----------
async function boot() {
  map = await (await fetch('data/map.json')).json();
  data = store.load();
  view = new MapView($('#base'), $('#over'), map);
  view.onTap = onMapTap;
  $('#modes').innerHTML = MODES.map(([id, name, d]) => `<button data-act="mode" data-mode="${id}" title="${name}" aria-label="${name}"><svg viewBox="0 0 24 24">${d}</svg></button>`).join('');
  document.addEventListener('click', onClick);
  document.addEventListener('input', onInput);
  document.addEventListener('change', onInput);
  window.addEventListener('resize', () => view.resize());
  window.visualViewport?.addEventListener('resize', () => view.resize());
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
  setInterval(refresh, 60000);
  setMode(data.mode || 'political');
  refresh();
  if (!data.onboarded) openSheet('welcome');
  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});
  window.__artesh = { get st() { return st; }, get data() { return data; }, view, map, commitReport, refresh };
}

const labels = () => Object.fromEntries(map.fronts.map(f => [f.id, data.labels[f.id] || f.defaultLabel]));
const front = id => map.fronts.find(f => f.id === id);
function persist() { if (!store.save(data)) toast('Storage is full — export a backup from Staff › Data.'); }

function refresh() {
  st = simulate(map, data.reports, Date.now());
  view.setState(st, labels());
  renderTop(); renderAlerts(); renderLegend();
  if (ui.sheet && !['report', 'welcome'].includes(ui.sheet) && !document.activeElement?.matches?.('input,textarea,select')) renderSheet();
}

// ---------- chrome ----------
function renderTop() {
  const n = st.nation;
  $('#nation-name').textContent = n.name;
  const d0 = data.reports.length ? Math.min(...data.reports.map(r => r.ts)) : null;
  $('#nation-date').textContent = `${fmtDate(st.now, { day: 'numeric', month: 'short', year: 'numeric' })}${d0 ? ` · Day ${Math.floor((st.now - d0) / DAY) + 1}` : ''}`;
  const tone = v => (v >= 60 ? 'good' : v >= 35 ? 'warn' : 'bad');
  const chip = (ic, val, lab, cls = '') => `<div class="chip ${cls}" role="listitem" title="${lab}"><svg viewBox="0 0 24 24">${ICONS[ic]}</svg><div class="v"><b>${val}</b><small>${lab}</small></div></div>`;
  $('#stats').innerHTML = chip('stab', n.stability + '%', 'Stability', tone(n.stability)) + chip('war', n.warSupport + '%', 'War support', tone(n.warSupport))
    + chip('div', n.divisions, 'Divisions') + chip('fac', `${n.civActive}/${n.milActive}/${n.dock}`, 'Factories') + chip('man', n.manpower >= 1000 ? Math.round(n.manpower / 1000) + 'K' : n.manpower, 'Manpower')
    + chip('air', n.planes, 'Aircraft') + chip('nav', n.ships, 'Ships');
}

function renderAlerts() {
  const out = []; const L = labels();
  if (st.empire) out.push(['gold', '★', 'The Achaemenid Empire is restored', 'nation']);
  if (st.tehranFallen) out.push(['crit', '!', 'Tehran has fallen', `front:${st.terr.occ.get(map.tehran)}`]);
  else if (st.terr.threat && st.terr.threat.km < 300) out.push(['crit', '!', `Enemy ${st.terr.threat.km} km from Tehran`, `front:${st.terr.threat.front}`]);
  for (const f of map.fronts) {
    const fr = st.fronts[f.id], s = statusOf(fr.pos);
    if (s.tone === 'bad' || (s.tone === 'crit' && !st.tehranFallen && !(st.terr.threat?.front === f.id))) out.push(['crit', '!', `${L[f.id]}: ${s.text.toLowerCase()}`, `front:${f.id}`]);
    else if (fr.streak <= -3) out.push(['warn', '▼', `${L[f.id]}: ${-fr.streak} defeats in a row`, `front:${f.id}`]);
    else if (fr.streak >= 3) out.push(['good', '▲', `${L[f.id]}: ${fr.streak} victories in a row`, `front:${f.id}`]);
    else if (fr.supply < 55) out.push(['warn', '⛽', `${L[f.id]}: supply ${Math.round(fr.supply)}%`, `front:${f.id}`]);
  }
  const meta = mapMeta(map); const dmg = meta.buildings.filter(b => st.bld[b.id].dmg > 0.25).length + Object.values(st.states).filter(s => s.dmg > 0.25).length;
  if (dmg) out.push(['warn', '✹', `${dmg} site${dmg > 1 ? 's' : ''} bombed — repairs under way`, 'forces:industry']);
  const last = data.reports.length ? Math.max(...data.reports.map(r => r.ts)) : null;
  if (last && st.now - last > 3 * DAY) out.push(['info', '✎', `No dispatches for ${Math.floor((st.now - last) / DAY)} days`, 'report']);
  $('#alerts').innerHTML = out.slice(0, 4).map(([cls, ic, text, go]) => `<button class="alert ${cls}" data-act="go" data-go="${go}"><i>${ic}</i>${esc(text)}</button>`).join('');
}

function renderLegend() {
  const L = labels(); let h = '';
  if (view.mode === 'life') h = '<b>Life areas</b>' + map.fronts.map(f => `<span><i style="background:${FRONT_COLORS[f.id]}"></i>${esc(L[f.id])}</span>`).join('');
  else if (view.mode === 'infra') h = '<b>Infrastructure</b><span><i style="background:#5c4634"></i>None</span><span><i style="background:#5abe78"></i>Level 5</span><span>╌ planned rail</span>';
  else if (view.mode === 'supply') h = '<b>Supply</b><span><i style="background:#aa3c32"></i>Starved</span><span><i style="background:#46aa5f"></i>Full</span>';
  else if (view.mode === 'air') h = '<b>Air superiority</b><span><i style="background:#af3c37"></i>Enemy</span><span><i style="background:#6e6e6e"></i>Contested</span><span><i style="background:#4682c8"></i>Ours</span>';
  else if (view.mode === 'terrain') h = '<b>Terrain</b>' + [['Plains', '#7f9a5a'], ['Hills', '#8c8a5c'], ['Mountain', '#6f6558'], ['Desert', '#c9b27a'], ['Forest', '#4f7d4d'], ['Marsh', '#5b8a86']].map(([n, c]) => `<span><i style="background:${c}"></i>${n}</span>`).join('');
  $('#legend').innerHTML = ui.sheet && innerWidth < 900 ? '' : h;
}

function setMode(m) {
  if (m === 'empire') { view.showEmpire = !view.showEmpire; view.dirty = true; if (view.showEmpire) { const [x, y] = view.proj(50, 33); view.flyTo(x, y, view.minS * 1.02); } }
  else { view.setMode(m); data.mode = m; persist(); }
  document.querySelectorAll('#modes button').forEach(b => b.classList.toggle('on', b.dataset.mode === view.mode || (b.dataset.mode === 'empire' && view.showEmpire)));
  if (st) renderLegend();
}

let toastT;
function toast(msg, ms = 3200) { const t = $('#toast'); t.textContent = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => (t.hidden = true), ms); }
function banner(title, sub, tone) { const b = $('#banner'); b.className = tone; b.innerHTML = `<b>${esc(title)}</b><span>${esc(sub || '')}</span>`; b.hidden = true; void b.offsetWidth; b.hidden = false; setTimeout(() => (b.hidden = true), 4300); }

// ---------- unit icons ----------
const iconCache = new Map();
function unitIcon(type, color, opts = {}) {
  const key = JSON.stringify([type, color, opts.str | 0, opts.org | 0, opts.rank | 0, opts.n | 0]);
  if (iconCache.has(key)) return iconCache.get(key);
  const c = document.createElement('canvas'); c.width = 138; c.height = 90; const x = c.getContext('2d');
  const saved = view.dpr; view.dpr = 1; view.counter(x, 66, 48, 3, { type, color, str: opts.str ?? 100, org: opts.org ?? 100, rank: opts.rank || 0, n: opts.n || 1, enemy: !!opts.enemy }); view.dpr = saved;
  const url = c.toDataURL(); iconCache.set(key, url); return url;
}

// ---------- sheets ----------
function openSheet(name, arg = null) {
  if (ui.dict) stopDictation();
  ui.sheet = name; ui.arg = arg;
  if (name === 'report' && !ui.report) ui.report = { stage: 'input', text: '', when: 'now', custom: '', result: null, busy: false, note: '' };
  if (name === 'forces' && arg) ui.tab = arg;
  $('#sheet').hidden = false; renderSheet(); $('#sheet-body').scrollTop = 0;
  document.querySelectorAll('#nav button').forEach(b => b.classList.toggle('on', b.dataset.sheet === name || (name === 'front' && b.dataset.sheet === 'fronts')));
  renderLegend();
}
function closeSheet() {
  if (ui.dict) stopDictation();
  if (ui.sheet === 'welcome') { data.onboarded = true; persist(); }
  ui.sheet = null; $('#sheet').hidden = true; view.select(null);
  document.querySelectorAll('#nav button').forEach(b => b.classList.remove('on'));
  renderLegend();
}
function renderSheet() {
  const R = { fronts: sFronts, front: sFront, forces: sForces, log: sLog, report: sReport, more: sMore, province: sProvince, nation: sNation, welcome: sWelcome, sitrep: sSitrep, settings: sSettings }[ui.sheet];
  if (!R) return;
  const [title, html, tall] = R();
  $('#sheet-title').textContent = title; $('#sheet-body').innerHTML = html; $('#sheet').classList.toggle('tall', !!tall);
}

function frontBar(fr) {
  const p = fr.pos; // left = Tehran (+100), right = objective (−100)
  const x = 50 - p / 2;
  const fill = p > 0 ? `<div class="fill bad" style="left:${x}%;width:${50 - x}%"></div>` : `<div class="fill good" style="left:50%;width:${x - 50}%"></div>`;
  return `<div class="fbar">${fill}<div class="mid"></div><div class="knob" style="left:${x}%"></div></div>`;
}
function frontCard(f) {
  const fr = st.fronts[f.id], s = statusOf(fr.pos), L = labels();
  const last = fr.last ? `${ACTIONS[fr.last.action].label} · ${fmtDate(fr.last.t, { day: 'numeric', month: 'short' })}` : 'No engagements yet';
  return `<button class="card" style="--c:${FRONT_COLORS[f.id]}" data-act="open" data-sheet="front" data-arg="${f.id}">
    <div class="row"><span class="t">${esc(f.name)}</span><span class="l">${esc(L[f.id])}</span><span class="s tone-${s.tone}">${s.text}</span></div>
    ${frontBar(fr)}<div class="fends"><span>◀ Tehran</span><span>${esc(last)}</span><span>${esc(f.satrapy.split(' ')[0])} ▶</span></div></button>`;
}
function sFronts() {
  const order = map.fronts.slice().sort((a, b) => st.fronts[b.id].pos - st.fronts[a.id].pos);
  return ['Fronts', `<p class="dim small">Each border is one part of your life. Red means the enemy is inside Iran; green means you are pushing out toward the old imperial frontier.</p>` + order.map(frontCard).join('')];
}

function spark(fid) {
  const pts = st.history.map(h => h.pos[fid]); if (pts.length < 2) return '';
  const all = [0, ...pts]; const W = 300, H = 54; const mx = Math.max(12, ...all.map(Math.abs));
  const y = v => H / 2 + (v / mx) * (H / 2 - 4); const x = i => (i / (all.length - 1)) * W;
  const d = all.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('');
  return `<svg class="spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><rect x="0" y="0" width="${W}" height="${H / 2}" fill="rgba(98,214,182,.07)"/><rect x="0" y="${H / 2}" width="${W}" height="${H / 2}" fill="rgba(232,91,71,.08)"/>
    <line x1="0" x2="${W}" y1="${H / 2}" y2="${H / 2}" stroke="#f4f1e6" stroke-opacity=".5" stroke-dasharray="3 3"/><path d="${d}" fill="none" stroke="${FRONT_COLORS[fid]}" stroke-width="2" vector-effect="non-scaling-stroke"/></svg>
    <div class="fends"><span>▲ advancing</span><span>front line over time</span><span>▼ retreating</span></div>`;
}
function unitRow(d, color = '#2f6e60', enemy = false) {
  const t = UNIT_TYPES[d.type] || { name: d.type };
  return `<div class="unit"><img src="${unitIcon(d.type, color, { str: d.str, org: d.org, rank: enemy ? 0 : rankIndex(d.xp || 0), enemy })}" alt="">
    <div><div class="n">${esc(d.name)}</div><div class="m">${enemy ? t.name : `${t.name} · ${rankOf(d.xp)} · ${Math.round(d.str)}% strength`}</div></div>
    ${enemy ? '' : `<div class="bars"><div class="bar org"><i style="width:${d.org}%"></i></div><div class="bar str"><i style="width:${d.str}%"></i></div></div>`}</div>`;
}
function sFront() {
  const f = front(ui.arg), fr = st.fronts[f.id], s = statusOf(fr.pos), L = labels(); const t = st.terr;
  const occ = [...t.occ.values()].filter(v => v === f.id).length, lib = [...t.lib.values()].filter(v => v === f.id).length;
  const teh = map.provinces[map.tehran]; let km = null;
  for (const [id, fid] of t.occ) if (fid === f.id) { const d = havKm(teh.ll, map.provinces[id].ll); if (km == null || d < km) km = d; }
  const divs = st.divisions.filter(d => d.front === f.id); const enemy = enemyForce(map, st, f.id); const ecol = map.countries[f.enemy].color;
  const disp = st.log.slice().reverse().flatMap(l => l.items.filter(i => i.front === f.id).map(i => ({ ...i, ts: l.ts }))).slice(0, 8);
  const kv = (k, v, m) => `<div><small>${k}</small><b>${v}</b>${m != null ? `<div class="meter"><i style="width:${Math.max(0, Math.min(100, m))}%;${m < 40 ? 'background:var(--bad)' : m < 70 ? 'background:var(--warn)' : ''}"></i></div>` : ''}</div>`;
  const sign = v => (v > 0 ? '+' : '') + Math.round(v);
  return [f.name, `
    <div class="row" style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><span class="card l" style="--c:${FRONT_COLORS[f.id]};display:inline-block;width:auto;margin:0;padding:3px 9px;font:700 13px var(--cond);letter-spacing:.1em;text-transform:uppercase;color:${FRONT_COLORS[f.id]}">${esc(L[f.id])}</span>
      <span class="dim small">vs ${esc(f.enemyName)}</span><b class="tone-${s.tone}" style="margin-left:auto;font:700 14px var(--cond);letter-spacing:.06em;text-transform:uppercase">${s.text}</b></div>
    ${frontBar(fr)}<div class="fends"><span>◀ Tehran falls</span><span>border</span><span>${esc(f.satrapy)} ▶</span></div>
    <div class="btnrow"><button class="btn sm" data-act="flyfront" data-id="${f.id}">Show on map</button><button class="btn sm primary" data-act="open" data-sheet="report">Report</button></div>
    <div class="kv">
      ${kv('Provinces lost', occ)}${kv('Provinces taken', lib)}${km != null ? kv('Enemy to Tehran', Math.round(km) + ' km') : kv('Record', `${fr.wins}W · ${fr.losses}L`)}
      ${kv('Supply', Math.round(fr.supply) + '%', fr.supply)}${kv(f.naval ? 'Sea control' : 'Air superiority', sign(f.naval ? fr.sea : fr.air) + '%', 50 + (f.naval ? fr.sea : fr.air) / 2)}${kv('Entrenchment', Math.round(fr.entrench) + ' / 10', fr.entrench * 10)}
      ${kv('Enemy strength', Math.round(fr.enemyStr) + '%')}${kv('Streak', fr.streak > 0 ? `${fr.streak} won` : fr.streak < 0 ? `${-fr.streak} lost` : '—')}${km != null ? kv('Record', `${fr.wins}W · ${fr.losses}L`) : ''}
    </div>
    ${spark(f.id)}
    <h3>Our forces · ${divs.length}</h3>${divs.map(d => unitRow(d)).join('')}
    <h3>Enemy forces · ${enemy.length}</h3>${enemy.map(d => unitRow(d, ecol, true)).join('')}
    <h3>Recent dispatches</h3>${disp.length ? disp.map(i => `<div class="li"><span class="badge ${i.outcome}">${i.outcome}</span><div>${esc(i.headline)}<small>${ACTIONS[i.action].label} · severity ${i.severity} · ${fmtDate(i.ts)}</small></div></div>`).join('') : '<p class="dim small">Nothing reported on this front yet.</p>'}
  `, true];
}

function sForces() {
  const tabs = [['army', 'Army'], ['air', 'Air force'], ['navy', 'Navy'], ['industry', 'Industry']];
  let h = `<div class="tabs">${tabs.map(([k, n]) => `<button class="${ui.tab === k ? 'on' : ''}" data-act="tab" data-tab="${k}">${n}</button>`).join('')}</div>`;
  const L = labels();
  if (ui.tab === 'army') {
    const guard = st.divisions.filter(d => !d.front);
    h += `<h3>Tehran garrison</h3>${guard.map(d => unitRow(d, '#7a5c22')).join('')}`;
    for (const f of map.fronts) { const ds = st.divisions.filter(d => d.front === f.id); h += `<h3 style="color:${FRONT_COLORS[f.id]}">${esc(f.name)} · ${esc(L[f.id])}</h3>${ds.map(d => unitRow(d)).join('')}`; }
  } else if (ui.tab === 'air') {
    h += `<p class="dim small">Imperial Iranian Air Force. Win the air war on a front (momentum, confidence, the upper hand) and new regiments form at its airbases.</p>`;
    h += st.wings.map(w => `<div class="unit"><img src="${unitIcon('air', '#4a5f8a', { str: (w.planes / w.max) * 100 })}" alt=""><div><div class="n">${esc(w.name)}</div><div class="m">${w.type === 'cas' ? 'Close air support' : w.type === 'bomber' ? 'Bomber' : 'Fighter'} · ${esc(w.model)} · ${esc(w.base)}</div></div><div class="bars"><b style="font:700 15px var(--cond);text-align:right">${Math.round(w.planes)}/${w.max}</b></div></div>`).join('');
    h += `<h3>Air superiority by front</h3><div class="kv">${map.fronts.map(f => `<div><small>${esc(L[f.id])}</small><b class="${st.fronts[f.id].air > 5 ? 'tone-good' : st.fronts[f.id].air < -5 ? 'tone-bad' : ''}">${st.fronts[f.id].air > 0 ? '+' : ''}${Math.round(st.fronts[f.id].air)}%</b></div>`).join('')}</div>`;
  } else if (ui.tab === 'navy') {
    for (const fl of st.fleets) h += `<h3>${esc(fl.name)} · ${esc(fl.base)}</h3>` + fl.ships.map(s => `<div class="unit"><img src="${unitIcon('ship', '#28587a', { str: s.hp, org: s.hp })}" alt=""><div><div class="n">${esc(s.name)}</div><div class="m">${esc(s.cls)}${s.hp < 60 ? ' · damaged' : ''}</div></div><div class="bars"><div class="bar str"><i style="width:${s.hp}%"></i></div></div></div>`).join('');
    h += `<h3>Sea control</h3><div class="kv"><div><small>Persian Gulf</small><b>${st.fronts.glf.sea > 0 ? '+' : ''}${Math.round(st.fronts.glf.sea)}%</b></div><div><small>Caspian</small><b>${Math.round((st.fronts.cau.sea + st.fronts.tks.sea) / 2)}%</b></div></div>`;
  } else {
    const meta = mapMeta(map);
    h += `<div class="kv"><div><small>Civilian factories</small><b>${st.nation.civActive} / ${st.nation.civ}</b></div><div><small>Military factories</small><b>${st.nation.milActive} / ${st.nation.mil}</b></div><div><small>Dockyards</small><b>${st.nation.dock}</b></div><div><small>Railway programme</small><b>Stage ${st.railStage} / 4</b></div></div>`;
    h += `<h3>States</h3>` + Object.entries(st.states).map(([n, s]) => `<div class="unit"><div style="flex:1"><div class="n">${esc(n)}${s.dmg > 0.05 ? ` <span class="tone-bad">· ${Math.round(s.dmg * 100)}% bombed</span>` : ''}</div><div class="m">Infrastructure ${'■'.repeat(Math.max(0, Math.floor(s.infra - s.infraDmg)))}${'□'.repeat(5 - Math.max(0, Math.floor(s.infra - s.infraDmg)))} · ${s.civ} civ · ${s.mil} mil${s.dock ? ` · ${s.dock} dock` : ''}</div></div></div>`).join('');
    const kinds = { port: 'Port', naval: 'Naval base', airbase: 'Airbase', hub: 'Supply hub', refinery: 'Refinery', fort: 'Fortress' };
    const dm = meta.buildings.filter(b => st.bld[b.id].dmg > 0.02);
    h += `<h3>Damaged sites</h3>` + (dm.length ? dm.map(b => `<div class="li"><span class="badge loss">${Math.round(st.bld[b.id].dmg * 100)}%</span><div>${kinds[b.kind]} at ${esc(b.name)}<small>Repair crews at work</small></div></div>`).join('') : '<p class="dim small">All ports, hubs and airbases are operational.</p>');
    h += `<h3>Railways</h3>` + map.railways.map(r => `<div class="li"><span class="badge ${r.stage <= st.railStage ? 'win' : 'neutral'}">${r.stage <= st.railStage ? 'Open' : 'Planned'}</span><div>${esc(r.n)}</div></div>`).join('');
  }
  return ['Armed forces', h, true];
}

function entryHTML(l, open) {
  const L = labels();
  return `<div class="entry"><div class="when">${fmtDate(l.ts)} · ${fmtTime(l.ts)}<button data-act="delreport" data-id="${esc(l.id)}">Delete</button></div>
    ${l.summary ? `<div class="comm">${esc(l.summary)}</div>` : ''}
    ${l.items.map(i => `<div class="li"><span class="badge ${i.outcome}">${i.outcome}</span><div>${esc(i.headline)}<small style="color:${FRONT_COLORS[i.front]}">${esc(L[i.front])} · ${ACTIONS[i.action].label} · sev ${i.severity}${i.delta ? ` · line ${i.delta > 0 ? 'back' : 'forward'} ${Math.abs(i.delta)}` : ''}</small></div></div>`).join('')}
    ${l.fx.length ? `<div class="fx">${l.fx.map(x => `<div class="tone-${x.tone || 'neutral'}">${esc(x.text)}</div>`).join('')}</div>` : ''}
    ${l.text ? (open ? `<div class="raw">“${esc(l.text)}”</div>` : `<button class="btn sm" style="margin-top:8px" data-act="rawlog" data-id="${esc(l.id)}">What I said</button>`) : ''}</div>`;
}
function sLog() {
  if (!st.log.length) return ['War log', `<div class="empty"><b>No dispatches yet</b>Tap the gold microphone and tell the general staff how your day went.</div>`];
  return ['War log', `<p class="dim small">${st.totals.reports} dispatches · ${st.totals.wins} victories · ${st.totals.losses} defeats. Deleting a dispatch rewinds its effects.</p>` + st.log.slice().reverse().map(l => entryHTML(l, ui.logOpen.has(l.id))).join(''), true];
}

function sReport() {
  const r = ui.report; const eng = pickEngine(data.settings); const L = labels();
  if (r.stage === 'input') {
    const micNote = ui.dict ? (ui.dict.state === 'transcribing' ? 'Transcribing…' : 'Listening — tap to stop') : eng === 'keyboard' ? 'Tap the box, then use the microphone key on your keyboard to dictate.' : 'Tap to speak';
    return ['Report to the general staff', `
      <textarea id="rtext" data-bind="report.text" placeholder="What happened? e.g. “Failed my chem quiz, but hit a PR at the gym. Had a great call with mom.”">${esc(r.text)}</textarea>
      <div class="micwrap"><button class="mic ${ui.dict ? (ui.dict.state === 'transcribing' ? 'busy' : 'live') : ''}" data-act="mic" aria-label="Dictate"><svg viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0013 0M12 17.5V21m-3.5 0h7"/></svg></button><div class="micnote" id="micnote">${esc(r.note || micNote)}</div></div>
      <label class="f"><span>When did this happen</span><select data-bind="report.when">${[['now', 'Just now'], ['1', 'Yesterday'], ['2', 'Two days ago'], ['3', 'Three days ago'], ['custom', 'Pick a date…']].map(([v, n]) => `<option value="${v}" ${r.when === v ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
      ${r.when === 'custom' ? `<label class="f"><span>Date and time</span><input type="datetime-local" data-bind="report.custom" value="${esc(r.custom)}"></label>` : ''}
      <div class="btnrow"><button class="btn primary" data-act="analyse" ${r.busy ? 'disabled' : ''}>${r.busy ? 'The staff is deliberating…' : 'Analyse report'}</button></div>
      <p class="dim small" style="margin-top:10px">${data.settings.apiKey ? `Classified by Claude (${esc(data.settings.model)}).` : 'Using the offline keyword classifier. Add a Claude API key in Staff › Settings for real judgement.'}</p>`, true];
  }
  const res = r.result;
  const opt = (list, cur) => list.map(a => `<option value="${a}" ${a === cur ? 'selected' : ''}>${ACTIONS[a].label}</option>`).join('');
  return ['Confirm orders', `
    ${res.warning ? `<div class="note">${esc(res.warning)}</div>` : ''}
    <label class="f"><span>Communiqué</span><textarea style="min-height:74px" data-bind="result.summary">${esc(res.summary)}</textarea></label>
    ${res.items.length ? '' : '<div class="note">The staff found nothing to act on. Add an engagement by hand, or go back and say more.</div>'}
    ${res.items.map((it, i) => `<div class="item" style="--c:${FRONT_COLORS[it.front]}">
      <button class="rm" data-act="rmitem" data-i="${i}" aria-label="Remove">✕</button>
      <input class="hl" type="text" data-bind="item.headline" data-i="${i}" value="${esc(it.headline)}">
      <div class="ctl">
        <select data-bind="item.front" data-i="${i}">${map.fronts.map(f => `<option value="${f.id}" ${f.id === it.front ? 'selected' : ''}>${esc(L[f.id])} — ${esc(f.name)}</option>`).join('')}</select>
        <div class="seg">${['win', 'loss', 'neutral'].map(o => `<button class="${it.outcome === o ? 'on ' + o : ''}" data-act="outcome" data-i="${i}" data-o="${o}">${o === 'neutral' ? '—' : o}</button>`).join('')}</div>
        <select data-bind="item.action" data-i="${i}" ${it.outcome === 'neutral' ? 'disabled' : ''}>${it.outcome === 'neutral' ? '<option>Skirmish</option>' : opt(it.outcome === 'win' ? WIN_ACTIONS : LOSS_ACTIONS, it.action)}</select>
        <div class="sev">${[1, 2, 3, 4, 5].map(n => `<button class="${it.severity === n ? 'on' : ''}" data-act="sev" data-i="${i}" data-n="${n}">${n}</button>`).join('')}</div>
      </div></div>`).join('')}
    <button class="btn sm" data-act="additem">+ Add engagement</button>
    <div class="btnrow"><button class="btn" data-act="backreport">Back</button><button class="btn primary" data-act="commit" ${res.items.length ? '' : 'disabled'}>Issue orders</button></div>`, true];
}

function sMore() {
  return ['General staff', `
    <div class="btnrow"><button class="btn primary" data-act="open" data-sheet="sitrep">Situation report</button></div>
    <div class="btnrow"><button class="btn" data-act="open" data-sheet="settings">Settings</button><button class="btn" data-act="open" data-sheet="nation">Nation</button></div>
    <h3>Backup</h3><p class="dim small">Your campaign is stored only on this device. Export a backup now and then.</p>
    <div class="btnrow"><button class="btn sm" data-act="export">Export</button><button class="btn sm" data-act="import">Import</button><button class="btn sm" data-act="demo">Load demo</button><button class="btn sm danger" data-act="reset">Reset</button></div>
    <input type="file" id="importfile" accept="application/json,.json" hidden>
    <h3>How it works</h3>
    <ol class="how small"><li>Tap the gold microphone and say what happened, in your own words.</li><li>The staff sorts it by front, decides win or loss and how big, and you confirm.</li><li>Fronts move, divisions gain experience or get mauled, ports and supply hubs get bombed or rebuilt.</li><li>Time heals: units recover and damage is repaired between reports.</li><li>Take every objective on every front and the Achaemenid Empire is restored.</li></ol>
    <h3>Install on iPhone</h3><p class="dim small">Open this page in Safari, tap Share, then “Add to Home Screen”. It then opens full-screen like an app and works offline.</p>`];
}
function sSitrep() {
  return ['Situation report', `<pre class="sit" id="sittext">${esc(sitrep(map, st, labels()))}</pre><div class="btnrow"><button class="btn primary" data-act="share">Share</button><button class="btn" data-act="copy">Copy</button></div>`, true];
}
function sSettings() {
  const s = data.settings; const L = labels(); const eng = pickEngine(s);
  const engName = { browser: 'browser speech recognition', eleven: 'ElevenLabs Scribe', keyboard: 'keyboard dictation' }[eng];
  return ['Settings', `
    <h3>What each front means</h3>
    ${map.fronts.map(f => `<label class="f"><span style="color:${FRONT_COLORS[f.id]}">${esc(f.name)} · vs ${esc(f.enemyName)}</span><input type="text" maxlength="28" data-bind="label" data-id="${f.id}" value="${esc(L[f.id])}"></label>`).join('')}
    <h3>Judgement (Claude)</h3>
    <label class="f"><span>Claude API key</span><input type="password" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="sk-ant-…" data-bind="set.apiKey" value="${esc(s.apiKey)}"></label>
    <label class="f"><span>Model</span><select data-bind="set.model">${MODELS.map(([id, n]) => `<option value="${id}" ${s.model === id ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
    <p class="dim small">The key stays on this device and is sent only to api.anthropic.com. Without one, a simple offline keyword classifier is used.</p>
    <h3>Voice</h3>
    <label class="f"><span>Dictation engine</span><select data-bind="set.voice">${[['auto', 'Automatic'], ['browser', 'Browser speech recognition'], ['eleven', 'ElevenLabs Scribe'], ['keyboard', 'Keyboard microphone only']].map(([v, n]) => `<option value="${v}" ${s.voice === v ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
    <label class="f"><span>ElevenLabs API key (optional)</span><input type="password" autocomplete="off" autocapitalize="off" spellcheck="false" data-bind="set.elevenKey" value="${esc(s.elevenKey)}"></label>
    <p class="dim small">Currently using ${engName}. ${hasBrowserSTT() ? '' : 'This browser has no built-in speech recognition. '}${hasRecorder() ? '' : 'Recording is unavailable here. '}The microphone key on the iPhone keyboard always works.</p>
    <div class="btnrow"><button class="btn primary" data-act="open" data-sheet="more">Done</button></div>`, true];
}
function sNation() {
  const n = st.nation; const t = st.terr; const L = labels();
  const iranN = map.provinces.filter(p => p.t === 'IRN').length;
  return [n.name, `
    <div class="kv"><div><small>Stability</small><b>${n.stability}%</b><div class="meter"><i style="width:${n.stability}%"></i></div></div><div><small>War support</small><b>${n.warSupport}%</b><div class="meter"><i style="width:${n.warSupport}%"></i></div></div>
      <div><small>Home provinces held</small><b>${iranN - t.occ.size} / ${iranN}</b></div><div><small>Provinces conquered</small><b>${t.lib.size}</b></div>
      <div><small>Men under arms</small><b>${num(n.manpower)}</b></div><div><small>Record</small><b>${st.totals.wins}W · ${st.totals.losses}L</b></div></div>
    <h3>Road to empire</h3>
    ${map.fronts.map(f => { const p = Math.max(0, -st.fronts[f.id].pos); return `<div class="li"><span class="badge ${p >= 100 ? 'win' : 'neutral'}">${Math.round(p)}%</span><div>${esc(f.satrapy)}<small style="color:${FRONT_COLORS[f.id]}">${esc(L[f.id])}</small><div class="meter"><i style="width:${p}%;background:var(--gold)"></i></div></div></div>`; }).join('')}
    <p class="dim small" style="margin-top:10px">Restore every satrapy and Iran becomes the Achaemenid Empire. Toggle the crown button on the map to see the old imperial frontier.</p>`, true];
}
function sProvince() {
  const p = map.provinces[ui.arg]; const meta = mapMeta(map); const c = map.countries[p.t]; const t = st.terr;
  const occ = t.occ.get(p.id), lib = t.lib.get(p.id);
  const ctl = p.t === 'IRN' ? (occ ? `Occupied by ${front(occ).enemyName}` : 'Iran') : lib ? 'Iran (occupied)' : c.name;
  const state = meta.stateName(p.s); const S = p.t === 'IRN' ? st.states[state] : null;
  const kinds = { port: 'Port', naval: 'Naval base', airbase: 'Airbase', hub: 'Supply hub', refinery: 'Oil refinery', fort: 'Fortress' };
  const bl = meta.buildings.filter(b => b.prov === p.id);
  const sec = view.sector.get(p.id); const L = labels();
  const here = map.fronts.filter(f => st.lines[f.id].ours.includes(p.id));
  return [p.n, `
    <div class="kv"><div><small>State</small><b style="font-size:14px">${esc(state)}</b></div><div><small>Owner</small><b style="font-size:14px">${esc(c.name)}</b></div><div><small>Controller</small><b style="font-size:14px" class="${occ ? 'tone-bad' : lib ? 'tone-good' : ''}">${esc(ctl)}</b></div>
      <div><small>Terrain</small><b style="font-size:14px;text-transform:capitalize">${p.tr}</b></div>${p.vp ? `<div><small>Victory points</small><b>${p.vp}</b></div>` : ''}${sec ? `<div><small>Sector</small><b style="font-size:14px;color:${FRONT_COLORS[sec.f]}">${esc(L[sec.f])}</b></div>` : ''}</div>
    ${p.id === map.tehran ? '<p class="tone-gold small">Capital of the Imperial State. If any front reaches it, Tehran falls.</p>' : ''}
    ${S ? `<h3>${esc(state)} state</h3><div class="kv"><div><small>Infrastructure</small><b>${Math.max(0, Math.floor(S.infra - S.infraDmg))} / 5</b></div><div><small>Factories</small><b>${S.civ} civ · ${S.mil} mil</b></div>${S.dmg > 0.02 ? `<div><small>Bomb damage</small><b class="tone-bad">${Math.round(S.dmg * 100)}%</b></div>` : ''}</div>` : ''}
    ${bl.length ? `<h3>Buildings</h3>` + bl.map(b => `<div class="li"><span class="badge ${st.bld[b.id].dmg > 0.05 ? 'loss' : 'win'}">${st.bld[b.id].dmg > 0.05 ? Math.round(st.bld[b.id].dmg * 100) + '% dmg' : 'Lvl ' + Math.floor(st.bld[b.id].lvl)}</span><div>${kinds[b.kind]}</div></div>`).join('') : ''}
    ${here.length ? `<h3>Front line here</h3>` + here.map(f => frontCard(f)).join('') : ''}
    ${lib ? `<p class="tone-good small">Taken on the ${esc(front(lib).name)}.</p>` : ''}`];
}
function sWelcome() {
  const L = labels();
  return ['Welcome, Commander', `
    <p>This is a war map of <b>your life</b>. Iran, 1936. Every border is one part of your life; how it is going decides whether you push out toward the old empire or get driven back on Tehran.</p>
    <h3>Your fronts</h3><p class="dim small">Rename any of them now or later in Settings.</p>
    ${map.fronts.map(f => `<label class="f"><span style="color:${FRONT_COLORS[f.id]}">${esc(f.name)} · vs ${esc(f.enemyName)}</span><input type="text" maxlength="28" data-bind="label" data-id="${f.id}" value="${esc(L[f.id])}"></label>`).join('')}
    <p class="dim small">Then tap the gold microphone and report what happened today.</p>
    <div class="btnrow"><button class="btn primary" data-act="close">Take command</button></div>`, true];
}

// ---------- events ----------
function onMapTap(d) {
  if (ui.sheet === 'report' || ui.sheet === 'welcome' || ui.sheet === 'settings') return;
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
  if (engine === 'keyboard') { r.note = 'Tap the microphone key on your keyboard to dictate.'; renderSheet(); $('#rtext')?.focus(); return; }
  const base = r.text ? r.text.replace(/\s+$/, '') + ' ' : '';
  r.note = '';
  const d = { state: 'starting', ctl: null }; ui.dict = d;
  d.ctl = startDictation({
    engine, settings: data.settings,
    onText: (t, final) => { r.text = (base + t).trimStart(); const el = $('#rtext'); if (el) { el.value = r.text; el.scrollTop = el.scrollHeight; } },
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
  try {
    const res = await classify({ map, st, labels: labels(), text: r.text, apiKey: data.settings.apiKey, model: data.settings.model });
    r.result = res; r.stage = 'review';
  } catch (e) { toast(e.message); }
  r.busy = false; if (ui.sheet === 'report') { renderSheet(); $('#sheet-body').scrollTop = 0; }
}

export function commitReport(rep) {
  const before = st;
  data.reports.push(rep); persist(); refresh();
  const entry = st.log.find(l => l.id === rep.id); if (!entry) return;
  const pick = entry.fx.find(x => x.tone === 'gold') || entry.fx.find(x => x.city != null) || entry.fx.find(x => /province/.test(x.text));
  const wins = entry.items.filter(i => i.outcome === 'win').length, losses = entry.items.filter(i => i.outcome === 'loss').length;
  const tone = pick?.tone || (wins > losses ? 'good' : losses > wins ? 'bad' : 'gold');
  const main = entry.items.slice().sort((a, b) => b.severity - a.severity)[0];
  banner(pick ? pick.text : main ? ACTIONS[main.action].label : 'Dispatch filed', main ? `${labels()[main.front]} · ${front(main.front).name}` : '', tone);
  if (main) setTimeout(() => view.flyToFront(main.front), 250);
  if (before.nation.name !== st.nation.name) toast(`Long live the ${st.nation.name}!`, 6000);
}

function onClick(e) {
  const b = e.target.closest('[data-act]'); if (!b) return;
  const a = b.dataset.act; const r = ui.report;
  switch (a) {
    case 'open': if (ui.sheet === b.dataset.sheet && !b.dataset.arg && b.closest('#nav')) closeSheet(); else openSheet(b.dataset.sheet, b.dataset.arg || null); break;
    case 'close': closeSheet(); break;
    case 'go': { const [s, arg] = b.dataset.go.split(':'); openSheet(s, arg || null); if (s === 'front') view.flyToFront(arg); break; }
    case 'mode': setMode(b.dataset.mode); break;
    case 'zoom': view.zoomBy(Number(b.dataset.k)); break;
    case 'home': view.home(); break;
    case 'tab': ui.tab = b.dataset.tab; renderSheet(); break;
    case 'flyfront': view.flyToFront(b.dataset.id); if (innerWidth < 900) closeSheet(); break;
    case 'mic': toggleMic(); break;
    case 'analyse': analyse(); break;
    case 'backreport': r.stage = 'input'; renderSheet(); break;
    case 'outcome': { const it = r.result.items[b.dataset.i]; it.outcome = b.dataset.o; it.action = it.outcome === 'win' ? 'offensive' : it.outcome === 'loss' ? 'enemy_offensive' : 'skirmish'; renderSheet(); break; }
    case 'sev': r.result.items[b.dataset.i].severity = Number(b.dataset.n); renderSheet(); break;
    case 'rmitem': r.result.items.splice(b.dataset.i, 1); renderSheet(); break;
    case 'additem': r.result.items.push({ front: map.fronts[0].id, outcome: 'win', severity: 2, action: 'offensive', headline: 'New engagement' }); renderSheet(); break;
    case 'commit': {
      const rep = { id: store.uid(), ts: reportTs(r), text: r.text, summary: r.result.summary, source: r.result.source, items: r.result.items.map(i => ({ front: i.front, outcome: i.outcome, severity: i.severity, action: i.action, headline: i.headline })) };
      ui.report = null; closeSheet(); commitReport(rep); break;
    }
    case 'delreport': if (confirm('Delete this dispatch and rewind its effects?')) { data.reports = data.reports.filter(x => x.id !== b.dataset.id); persist(); refresh(); } break;
    case 'rawlog': ui.logOpen.add(b.dataset.id); renderSheet(); break;
    case 'share': { const text = sitrep(map, st, labels()); if (navigator.share) navigator.share({ text }).catch(() => {}); else navigator.clipboard?.writeText(text).then(() => toast('Copied.'), () => toast('Select the text to copy it.')); break; }
    case 'copy': navigator.clipboard?.writeText(sitrep(map, st, labels())).then(() => toast('Copied to clipboard.'), () => toast('Select the text to copy it.')); break;
    case 'export': {
      const blob = new Blob([store.exportData(data)], { type: 'application/json' }); const url = URL.createObjectURL(blob);
      const el = Object.assign(document.createElement('a'), { href: url, download: `artesh-backup-${new Date().toISOString().slice(0, 10)}.json` }); document.body.append(el); el.click(); el.remove(); setTimeout(() => URL.revokeObjectURL(url), 5000); break;
    }
    case 'import': $('#importfile').click(); break;
    case 'reset': if (confirm('Erase the whole campaign? This cannot be undone. (Front names and keys are kept.)')) { data.reports = []; persist(); refresh(); toast('Campaign reset. The borders are quiet.'); } break;
    case 'demo': if (!data.reports.length || confirm('Replace the current campaign with demo data?')) { data.reports = demoReports(); persist(); closeSheet(); refresh(); view.home(); toast('Demo campaign loaded. Reset it from Staff › Backup.'); } break;
  }
}

function onInput(e) {
  const el = e.target; const bind = el.dataset?.bind;
  if (el.id === 'importfile') {
    const file = el.files[0]; if (!file) return;
    file.text().then(t => { data = store.importData(t, data); persist(); refresh(); toast(`Imported ${data.reports.length} dispatches.`); }).catch(err => toast(err.message)); el.value = ''; return;
  }
  if (!bind) return;
  const r = ui.report;
  if (bind === 'report.text') r.text = el.value;
  else if (bind === 'report.when') { r.when = el.value; if (el.value === 'custom' && !r.custom) { const d = new Date(Date.now() - new Date().getTimezoneOffset() * 60000); r.custom = d.toISOString().slice(0, 16); } if (e.type === 'change') renderSheet(); }
  else if (bind === 'report.custom') r.custom = el.value;
  else if (bind === 'result.summary') r.result.summary = el.value;
  else if (bind.startsWith('item.')) { const it = r.result.items[el.dataset.i]; it[bind.slice(5)] = el.value; if (bind === 'item.front' && e.type === 'change') renderSheet(); }
  else if (bind === 'label') { const v = el.value.trim(); if (v) data.labels[el.dataset.id] = v; else delete data.labels[el.dataset.id]; persist(); view.setState(st, labels()); iconCache.clear(); renderAlerts(); }
  else if (bind.startsWith('set.')) { data.settings[bind.slice(4)] = el.value.trim(); persist(); if (e.type === 'change' && el.tagName === 'SELECT') renderSheet(); }
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
