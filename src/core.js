// What the interface does, with no markup in it: the campaign, the map view, which sheet is open, and every action.
// React reads it through useApp() and redraws after each change() (see main.jsx and App.jsx).
// The rules of the war are in js/engine.js; the map is drawn by js/map.js on the two canvases App.jsx owns.
import { useSyncExternalStore } from 'react';
import { toastManager } from '@sam/design-system';
import { setMotionPreference } from '@sam/design-system/theme';
import { simulate, sitrep, statusOf as statusFor, objective, flavor, capitalOf, momentOf, headlineOf, weeklyRecap, medalOf, ACTIONS, DAY } from '../js/engine.js';
import { MapView, frontColor } from '../js/map.js';
import { classify, assess } from '../js/classify.js';
import { ask } from '../js/ask.js';
import { fx } from '../js/fx.js';
import { renderBulletin, renderFrontPage, renderRecap, renderRankUp, shareCanvas } from '../js/share.js';
import { PRESETS, applyPreset } from '../js/presets.js';
import { pickEngine, startDictation } from '../js/voice.js';
import * as store from '../js/store.js';
import { UNIT_PATHS } from '../js/icons.js';

// ---------- state ----------
// `app` is one mutable object, as the old interface kept it; window.__artesh points into it for the tests.
export const app = {
  ready: false, error: null, demo: false,
  map: null, view: null, data: null, st: null, live: null, scenarios: [],
  cfg: { server: false, judge: null, transcribe: null }, // what the private server offers
  ui: { ask: { q: '', busy: false, res: null }, sheet: null, arg: null, stack: [], report: null, dict: null, edit: null, preset: null, asOf: null, playing: null, assess: null, assessAt: 0, assessN: 0, emblem: 0, confirm: null, demoNote: false },
};
const ui = app.ui;
let version = 0; const listeners = new Set();
export function change() { version++; for (const f of listeners) f(); }
const subscribe = f => { listeners.add(f); return () => listeners.delete(f); };
export function useApp() { useSyncExternalStore(subscribe, () => version); return app; }

// ---------- small helpers every screen uses ----------
export const F = () => flavor(app.map); // everything the interface says about the country comes from the scenario
export const statusOf = pos => statusFor(pos, app.map);
export const fcol = id => frontColor(app.map, id);
export const labels = () => Object.fromEntries(app.map.fronts.map(f => [f.id, app.data.labels[f.id] || f.defaultLabel]));
export const front = id => app.map.fronts.find(f => f.id === id);
export const activeFronts = () => app.map.fronts.filter(f => !app.data.off.includes(f.id));
export const fmtDate = (ts, o = { weekday: 'short', day: 'numeric', month: 'short' }) => new Date(ts).toLocaleDateString(undefined, o);
// the date in the scenario's own calendar (META.calendar), or '' when it has none or the browser cannot do it
export const altDate = (ts, o = { day: 'numeric', month: 'long', year: 'numeric' }) => { const cal = F().calendar; if (!cal) return ''; try { const f = new Intl.DateTimeFormat(`en-u-ca-${cal}`, o); return f.resolvedOptions().calendar === cal ? f.format(ts).replace(/\s*(AP|AH|AM|BE|ERA\d)$/, '') : ''; } catch { return ''; } };
export const dayKey = ts => Math.floor((ts - new Date(ts).getTimezoneOffset() * 60000) / DAY);
export const isWide = () => window.matchMedia('(min-width: 768px)').matches;
export const firstRun = () => !app.data.onboarded; // the country picker opens the welcome; later it is a page of Settings
export const MODES = [['political', 'Map'], ['life', 'Life areas'], ['infra', 'Infrastructure'], ['supply', 'Supply'], ['air', 'Air'], ['terrain', 'Terrain']];
export const CARDS = [['bulletin', 'Today’s bulletin'], ['frontpage', 'Front page'], ['recap', 'Week in review'], ['rank', 'Your rank']];

export function toast(title, ms = 3200, action = null, description = '') {
  toastManager.add({ title, ...(description ? { description } : {}), timeout: ms, ...(action ? { actionProps: { children: action.label, onClick: action.run } } : {}) });
}
// A question that needs an answer before something is destroyed: resolves true when the verb is pressed.
export function confirm(title, body, verb) { return new Promise(resolve => { ui.confirm = { title, body, verb, resolve }; change(); }); }
export function answer(yes) { const c = ui.confirm; ui.confirm = null; change(); c?.resolve(yes); }

// ---------- boot ----------
const mapCache = new Map();
function loadMap(id) {
  if (!/^[\w-]+$/.test(id)) return Promise.reject(new Error('Unknown country'));
  if (!mapCache.has(id)) mapCache.set(id, fetch(`data/maps/${id}.json`).then(r => { if (!r.ok) throw new Error(`The map of ${id} couldn’t be loaded.`); return r.json(); }).catch(e => { mapCache.delete(id); throw e; }));
  return mapCache.get(id);
}
const fxSettings = () => ({ sound: app.data.settings.sound !== false, motion: app.data.settings.motion !== false });
// what was chosen on this device (sound, motion) is not part of the campaign the server keeps
const adopt = remote => { app.data = { ...remote, settings: { ...remote.settings, ...app.data.settings } }; };

let booted = false;
export async function boot(base, over, wrap) {
  if (booted) return; booted = true;
  let cfg = app.cfg;
  app.data = store.load();
  try { const r = await fetch('api/config'); if (r.ok) cfg = app.cfg = await r.json(); } catch { /* static hosting: offline judge only */ }
  try { app.scenarios = await (await fetch('data/scenarios.json')).json(); } catch { app.scenarios = []; }
  if (cfg.server) { try { const remote = await store.pull(); if (remote) { adopt(remote); store.save(app.data); } else if (app.data.reports.length) store.push(() => app.data); } catch { /* offline: use the local copy */ } }
  // the country being played (Iran for saves from before there was a choice); one that is no longer offered falls back without losing its campaign
  try { app.map = await loadMap(app.data.scenario); }
  catch (e) { if (app.data.scenario === store.DEFAULT_SCENARIO) throw e; app.map = await loadMap(store.DEFAULT_SCENARIO); store.switchScenario(app.data, app.map.id); store.save(app.data); }
  // Static demo (…/demo/?demo=1): a first-time visitor finds a campaign already in progress.
  app.demo = !cfg.server && new URLSearchParams(location.search).has('demo');
  if (app.demo && !app.data.reports.length && !app.data.onboarded) { app.data.reports = demoReports(); app.data.onboarded = true; store.save(app.data); }
  const view = app.view = new MapView(base, over, app.map); // once: the canvases are never re-created
  view.onTap = onMapTap;
  window.addEventListener('resize', () => view.resize()); window.visualViewport?.addEventListener('resize', () => view.resize());
  document.addEventListener('visibilitychange', async () => { if (!document.hidden) { await resync(); refresh(); } });
  setInterval(() => { if (!ui.playing) refresh(); }, 60000);
  view.setMode(app.data.mode || 'political');
  fx.init({ root: wrap }); fx.configure({ ...fxSettings(), haptics: true }); fxRoot = wrap;
  setMotionPreference(app.data.settings.motion === false ? 'reduce' : 'system');
  document.addEventListener('pointerdown', () => fx.unlock(), { passive: true });
  app.ready = true;
  refresh();
  if (firstRun()) openSheet(app.scenarios.length > 1 ? 'country' : 'welcome'); else greet();
  if (app.demo) { try { ui.demoNote = !sessionStorage.getItem('artesh.demo-note'); } catch { ui.demoNote = true; } change(); }
  if (import.meta.env.PROD && 'serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});
  window.__artesh = { save: persist, get cfg() { return app.cfg; }, get st() { return app.st; }, get live() { return app.live; }, get data() { return app.data; }, get map() { return app.map; }, get scenarios() { return app.scenarios; }, view, commitReports, refresh, ui, chooseCountry };
}
let fxRoot = null;
export function closeDemoNote() { ui.demoNote = false; try { sessionStorage.setItem('artesh.demo-note', '1'); } catch { /* fine */ } change(); }

// ---------- the country ----------
// the map on screen follows data.scenario: called after anything that may have changed it
async function followScenario() {
  const { data, view } = app;
  if (app.map.id === data.scenario) return;
  let next; try { next = await loadMap(data.scenario); } catch { store.switchScenario(data, app.map.id); return; }
  app.map = next; view.setMap(next); for (const k in cardCache) delete cardCache[k];
  ui.assess = null; ui.asOf = null; clearInterval(ui.playing); ui.playing = null; ui.ask = { q: '', busy: false, res: null }; ui.preset = null; lastCommit = [];
  view.setMode(view.mode);
}
// Play another country. The campaign of the one being left is kept and comes back when it is chosen again.
export async function chooseCountry(id) {
  if (id !== app.data.scenario) {
    let next; try { next = await loadMap(id); } catch (e) { toast(e.message); return false; }
    store.switchScenario(app.data, id, app.map.fronts.map(f => f.id), next.fronts.map(f => f.id));
    await followScenario(); persist(); refresh();
  }
  return true;
}
export function pickCountry(id) {
  chooseCountry(id).then(ok => { if (!ok) return; if (firstRun()) openSheet('welcome'); else { back(); app.view.home(false); toast(`Now playing ${F().name}.`); } });
}

export function persist() {
  if (!store.save(app.data)) toast('Storage is full.', 6000, null, 'Export a backup in Settings.');
  if (app.cfg.server) store.push(() => app.data, async newer => { if (newer) { adopt(newer); await followScenario(); store.save(app.data); refresh(); toast('Updated from another device.'); } });
}
async function resync() {
  const { data } = app;
  if (!app.cfg.server || document.activeElement?.matches?.('input,textarea')) return;
  try { const remote = await store.pull(); if (remote && remote.scenario + JSON.stringify(remote.reports) + JSON.stringify(remote.labels) + remote.off !== data.scenario + JSON.stringify(data.reports) + JSON.stringify(data.labels) + data.off) { adopt(remote); await followScenario(); store.save(app.data); } } catch { /* offline */ }
}

export function refresh() {
  const { map, data, view } = app;
  app.live = simulate(map, data.reports, Date.now(), { off: data.off });
  app.st = ui.asOf ? simulate(map, data.reports.filter(r => r.ts <= ui.asOf), ui.asOf, { off: data.off }) : app.live;
  view.off = data.off;
  view.pins = activeFronts().map(f => objective(map, app.st, f.id)).filter(o => o.prov != null).map(o => ({ prov: o.prov }));
  view.setState(app.st, labels());
  change();
}
function greet() {
  const now = new Date(), day = F().days.find(d => d.month === now.getMonth() + 1 && d.day === now.getDate()); // the scenario's own days (META.days)
  if (day) toast(day.text, 6000);
}

// The one thing worth saying over the map right now: [tone, words, where a press goes], or null.
export function topAlert() {
  const { st, map } = app; const L = labels();
  if (st.empire) return ['success', `The ${F().empire} is restored`, 'overview'];
  if (st.tehranFallen) return ['danger', `${F().capital} has fallen`, `front:${st.terr.occ.get(capitalOf(map))}`];
  if (st.terr.threat && st.terr.threat.km < 300) return ['danger', `Enemy ${st.terr.threat.km} km from ${F().capital}`, `front:${st.terr.threat.front}`];
  const worst = activeFronts().slice().sort((a, b) => st.fronts[b.id].pos - st.fronts[a.id].pos)[0];
  if (worst && ['bad', 'crit'].includes(statusOf(st.fronts[worst.id].pos).tone)) return ['danger', `${L[worst.id]}: ${statusOf(st.fronts[worst.id].pos).text.toLowerCase()}`, `front:${worst.id}`];
  const run = activeFronts().find(f => st.fronts[f.id].streak <= -3); if (run) return ['attention', `${L[run.id]}: ${-st.fronts[run.id].streak} defeats in a row`, `front:${run.id}`];
  const up = activeFronts().find(f => st.fronts[f.id].streak >= 3); if (up) return ['success', `${L[up.id]}: ${st.fronts[up.id].streak} victories in a row`, `front:${up.id}`];
  if (!ui.asOf && st.log.length && !st.reportedToday && new Date().getHours() >= 18) return ['neutral', st.dayStreak ? `Report today to keep your ${st.dayStreak}-day streak` : 'Nothing reported today', 'report'];
  return null;
}
export function go(target) { const [s, arg] = target.split(':'); openSheet(s, arg || null); if (s === 'front') app.view.flyToFront(arg); }
export function emblem() { if (++ui.emblem % 7 === 0) toast(F().motto, 5000); else openSheet('overview'); }

export function setMode(m) {
  const { view, map, data } = app;
  if (m === 'empire') { view.showEmpire = !view.showEmpire; view.dirty = true; if (view.showEmpire) view.flyTo(map.w / 2, map.h / 2, view.minS * 1.02); }
  else { view.setMode(m); data.mode = m; persist(); }
  change();
}

// ---------- replay ----------
export const firstTs = () => (app.data.reports.length ? Math.min(...app.data.reports.map(r => r.ts)) - 3600000 : Date.now());
export function playReplay() {
  if (ui.playing) { clearInterval(ui.playing); ui.playing = null; change(); return; }
  const a = firstTs(); if (!ui.asOf || ui.asOf >= Date.now() - 1000) ui.asOf = a;
  ui.playing = setInterval(() => { const b = Date.now(); ui.asOf += (b - a) / 110; if (ui.asOf >= b) { exitReplay(); return; } refresh(); }, 80);
  change();
}
export function exitReplay() { clearInterval(ui.playing); ui.playing = null; ui.asOf = null; refresh(); }
export function startReplay() { if (!app.data.reports.length) return; closeSheet(); ui.asOf = firstTs(); app.view.home(); refresh(); playReplay(); }
// the slider: 0 is the first report, 1000 is now
export function seekReplay(v) { clearInterval(ui.playing); ui.playing = null; const a = firstTs(), b = Date.now(); ui.asOf = Math.min(b - 1, a + (v / 1000) * (b - a)); refresh(); }
export const replayAt = () => { const a = firstTs(), b = Date.now(); return Math.round(((ui.asOf - a) / (b - a)) * 1000); };

// ---------- sheets ----------
const ROOTS = ['fronts', 'history', 'report', 'welcome', 'province', 'overview'];
const fromMap = new Set(['division']);
const newReport = () => ({ text: '', busy: false, note: '', pick: false });
export function openSheet(name, arg = null, push = true) {
  if (ui.dict) stopDictation();
  if (name === 'report' && ui.asOf) exitReplay();
  if (ROOTS.includes(name) || (fromMap.has(name) && !ui.sheet) || (name === 'country' && firstRun())) ui.stack = []; else if (push && ui.sheet && ui.sheet !== name) ui.stack.push([ui.sheet, ui.arg]);
  ui.sheet = name; ui.arg = arg;
  if (name === 'report' && !ui.report) ui.report = newReport();
  if (name === 'overview') autoAssess();
  change();
}
export function closeSheet() {
  if (ui.dict) stopDictation();
  if (ui.sheet === 'country' && firstRun()) { openSheet('welcome'); return; } // the picker is only the first step
  if (ui.sheet === 'welcome') { app.data.onboarded = true; persist(); }
  ui.sheet = null; ui.stack = []; app.view.select(null);
  change();
}
export function back() { const p = ui.stack.pop(); if (p) openSheet(p[0], p[1], false); else closeSheet(); }
// the bar's buttons: a second press on the one that is open closes it
export function toggleSheet(name) { if (ui.sheet === name) closeSheet(); else openSheet(name); }

function onMapTap(d) {
  if (['report', 'welcome', 'country', 'settings', 'edit'].includes(ui.sheet)) return;
  if (d.kind === 'province') { app.view.select(d.id); openSheet('province', d.id); }
  else if (d.kind === 'front') openSheet('front', d.id);
  else if (d.kind === 'division') openSheet('division', d.id);
  else if (d.kind === 'fleet') openSheet('units', 'navy');
  else if (d.kind === 'wing') openSheet('units', 'air');
  else if (ui.sheet === 'province') closeSheet();
}
export function flyFront(id) { app.view.flyToFront(id); if (!isWide()) closeSheet(); }

// ---------- report ----------
function stopDictation() { ui.dict?.ctl.stop(); ui.dict = null; }
export function setReportText(t) { ui.report.text = t; if (!ui.dict) ui.report.note = ''; change(); }
export function toggleMic(focusField) {
  const r = ui.report;
  if (ui.dict) { ui.dict.ctl.stop(); if (ui.dict?.state !== 'transcribing') { ui.dict = null; change(); } return; }
  const engine = pickEngine(app.cfg);
  if (engine === 'keyboard') { r.note = 'Use the microphone key on your keyboard.'; change(); focusField?.(); return; }
  const base = r.text ? r.text.replace(/\s+$/, '') + ' ' : ''; r.note = '';
  const d = { state: 'starting', ctl: null }; ui.dict = d;
  d.ctl = startDictation({
    engine,
    onText: t => { r.text = (base + t).trimStart(); change(); },
    onState: s => { if (ui.dict !== d) return; if (s === 'idle') ui.dict = null; else d.state = s; change(); },
    onError: (msg, o) => { r.note = msg; if (ui.dict === d) ui.dict = null; change(); if (o?.fallback) focusField?.(); },
  });
  change();
}
// Send: judge the text and apply it straight away. Undo is one press; History lets you edit.
export async function send() {
  const r = ui.report; const { map, data } = app; stopDictation(); fx.sound('send');
  r.text = r.text.trim();
  if (r.text.length < 3) { toast('Nothing to send yet.', 3200, null, 'Say or type what happened first.'); change(); return; }
  r.busy = true; r.pick = false; change();
  let res;
  try { res = await classify({ map, st: app.live, labels: labels(), notes: data.notes, off: data.off, text: r.text, remote: !!app.cfg.judge }); }
  catch (e) { r.busy = false; toast('Couldn’t judge that.', 5000, null, e.message); change(); return; }
  r.busy = false;
  if (!res.items.length) { r.pick = true; change(); return; }
  const now = Date.now(); const groups = new Map();
  for (const i of res.items) { const d = i.days_ago || 0; if (!groups.has(d)) groups.set(d, []); const { days_ago, ...item } = i; groups.get(d).push(item); }
  const first = Math.min(...groups.keys());
  const reps = [...groups].map(([d, items]) => { let ts = now; if (d > 0) { const x = new Date(now - d * DAY); x.setHours(20, 0, 0, 0); ts = x.getTime(); } return { id: store.uid(), ts, text: d === first ? r.text : '', summary: d === first ? res.summary : '', source: res.source, items }; });
  ui.report = null; closeSheet(); commitReports(reps, { warning: res.warning });
}
export function quick(fid, outcome) {
  const text = (ui.sheet === 'report' ? ui.report.text : '').trim();
  ui.report = null; closeSheet();
  commitReports([{ id: store.uid(), ts: Date.now(), text, summary: '', source: 'manual', items: [{ front: fid, outcome, severity: 2, action: outcome === 'win' ? 'offensive' : 'enemy_offensive', headline: text ? (text.length > 90 ? text.slice(0, 87) + '…' : text) : outcome === 'win' ? 'A good day' : 'A bad day' }] }]);
}

let lastCommit = [];
const KIND_RANK = ['empire', 'tehran_fallen', 'tehran_freed', 'satrapy', 'levelup', 'medal', 'operation', 'city_captured', 'city_lost', 'order_done', 'streak', 'normal'];
export function undo() { app.data.reports = app.data.reports.filter(x => !lastCommit.includes(x.id)); lastCommit = []; persist(); refresh(); toast('Undone.'); }
export function commitReports(reps, { quiet = false, warning = '' } = {}) {
  const { data, map, view } = app; const before = app.live;
  data.reports.push(...reps); lastCommit = reps.map(r => r.id); persist(); refresh();
  if (quiet) return;
  const live = app.live;
  const entries = live.log.filter(l => lastCommit.includes(l.id)); if (!entries.length) return;
  const fxs = entries.flatMap(e => e.fx), items = entries.flatMap(e => e.items);
  const main = items.slice().sort((a, b) => b.severity - a.severity)[0];
  const wins = items.filter(i => i.outcome === 'win').length, losses = items.filter(i => i.outcome === 'loss').length;
  // the single most important thing that happened decides the headline and the celebration
  const m = entries.map(momentOf).sort((x, y) => KIND_RANK.indexOf(x.kind) - KIND_RANK.indexOf(y.kind) || y.magnitude - x.magnitude)[0];
  const xp = entries.reduce((a, e) => a + (e.xp || 0), 0); const combo = entries.at(-1).combo?.mult || 1;
  const promoted = entries.find(e => e.levelUp)?.levelUp; const medalIds = entries.flatMap(e => e.medals || []);
  const tally = [wins ? `${wins} win${wins > 1 ? 's' : ''}` : '', losses ? `${losses} loss${losses > 1 ? 'es' : ''}` : ''].filter(Boolean).join(', ') || 'noted';
  const saved = `${warning ? 'Saved offline' : 'Saved'} · ${tally}${xp ? ` · +${xp} XP` : ''}${combo > 1 ? ` · ×${combo}` : ''}`;
  let title = saved, lines = [];
  if (main) {
    const big = m.kind !== 'normal' && m.kind !== 'levelup' && m.kind !== 'medal' && m.kind !== 'order_done' && m.kind !== 'streak';
    title = big ? m.title : main.headline;
    const extra = fxs.filter(x => x.front === main.front && x.text !== m.title && x.kind !== 'lead').map(x => x.text).slice(0, 2);
    lines = [`${labels()[main.front]} · ${main.battle || ACTIONS[main.action].label}${main.at != null ? ` at ${map.provinces[main.at].n}` : ''}`, ...extra, saved];
    fx.celebrate({ tone: big ? m.tone : wins >= losses ? 'good' : 'bad', magnitude: big ? m.magnitude : main.severity, kind: big ? m.kind : 'normal', at: null, el: fxRoot });
    setTimeout(() => view.flyToFront(main.front), 250);
  }
  // one toast says what happened and offers Undo
  toast(title, 7000, { label: 'Undo', run: undo }, lines.join('\n'));
  // rank, decorations and orders get their own beat a few seconds later
  const later = promoted ? { title: `Promoted to ${promoted.title}`, sub: promoted.gloss, kind: 'levelup' } : medalIds.length ? { title: medalOf(medalIds[0], map)?.name || 'Decoration awarded', sub: medalOf(medalIds[0], map)?.desc || '', kind: 'medal' }
    : before.nation.name !== live.nation.name ? { title: `Long live the ${live.nation.name}`, sub: `Every ${F().regionWord.toLowerCase()} is restored`, kind: 'empire' } : entries.some(e => e.allOrders) ? { title: 'All orders carried out', sub: '3 of 3 today', kind: 'order_done' } : null;
  if (later) setTimeout(() => { toast(later.title, 5000, null, later.sub); fx.celebrate({ tone: 'gold', magnitude: later.kind === 'empire' ? 5 : 4, kind: later.kind, at: null }); }, 4300);
  if (live.dayStreak > before.dayStreak) setTimeout(() => { fx.pulse(document.querySelector('[data-streak]')); if (!later) fx.sound('streak'); }, 900);
}

// ---------- history ----------
export function editReport(id) { const rep = app.data.reports.find(x => x.id === id); if (!rep) return; ui.edit = { id: rep.id, items: rep.items.map(i => ({ ...i })) }; openSheet('edit'); }
export function editItem(i, patch) {
  const it = ui.edit.items[i]; Object.assign(it, patch);
  if (patch.outcome) it.action = it.outcome === 'win' ? 'offensive' : 'enemy_offensive';
  change();
}
export function removeItem(i) { ui.edit.items.splice(i, 1); change(); }
export function saveEdit() {
  const old = app.data.reports.find(x => x.id === ui.edit.id);
  if (old) old.items = ui.edit.items.map(i => ({ front: i.front, outcome: i.outcome, severity: i.severity, action: i.action, headline: i.headline.trim() || ACTIONS[i.action].label, ...(i.reason && old.items.some(o => o.action === i.action && o.reason === i.reason) ? { reason: i.reason } : {}) }));
  persist(); refresh(); back(); toast('Saved.');
}
export async function deleteReport(id) {
  if (!(await confirm('Delete this entry?', 'Its effects on the map are rewound. The rest of your history stays.', 'Delete'))) return;
  app.data.reports = app.data.reports.filter(x => x.id !== id); persist(); refresh();
}
export async function runAsk(q) {
  q = (q ?? ui.ask.q ?? '').trim(); if (q.length < 3) return;
  ui.ask = { q, busy: true, res: null }; change();
  let res; try { res = await ask({ map: app.map, st: app.live, labels: labels(), question: q, remote: !!app.cfg.judge }); } catch (e) { res = { answer: 'The staff couldn’t answer that.', cited: [], confidence: 'low', warning: e.message, followups: [] }; }
  ui.ask = { q, busy: false, res }; change();
}
export function setAsk(q) { ui.ask.q = q; change(); }
export function clearAsk() { ui.ask = { q: '', busy: false, res: null }; change(); }

// ---------- overview ----------
function autoAssess() {
  const { data } = app;
  if (ui.assess && Date.now() - ui.assessAt < 6 * 3600000 && ui.assessN === data.reports.length) return;
  const n = data.reports.length;
  assess({ map: app.map, st: app.live, labels: labels(), off: data.off, remote: !!app.cfg.judge }).then(x => { ui.assess = x; ui.assessAt = Date.now(); ui.assessN = n; change(); }).catch(() => {});
}

// ---------- share cards (drawn by js/share.js on their own canvases) ----------
function mapShot() {
  const { view, map } = app;
  const c = document.createElement('canvas'); c.width = view.base.width; c.height = view.base.height; const x = c.getContext('2d'); x.drawImage(view.base, 0, 0); x.drawImage(view.over, 0, 0);
  const t = map.provinces[capitalOf(map)].city; const [sx, sy] = view.toScreen(t[0], t[1] + 260);
  return { canvas: c, focus: [Math.max(0.2, Math.min(0.8, sx / view.w)), Math.max(0.2, Math.min(0.8, sy / view.h))] };
}
function cardData(kind) {
  const { map, live } = app;
  const L = labels(); const e = live.log.filter(l => !l.kind).at(-1) || null; const m = e ? momentOf(e) : null; const shot = mapShot(); const c = live.commander;
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
const cardCache = {};
export function card(kind) { try { return (cardCache[kind] = cardData(kind)); } catch (err) { console.error(err); return null; } }
export function shareCard(kind) {
  const c = cardCache[kind]; if (!c) return;
  shareCanvas(c, { filename: `artesh-${kind}.png`, text: sitrep(app.map, app.live, labels()) }).then(r => { if (r === 'downloaded') toast('Image saved.', 3200, null, 'The report is copied too.'); });
}

// ---------- settings ----------
export function setLabel(id, value) { const v = value.trim(); if (v) app.data.labels[id] = v; else delete app.data.labels[id]; persist(); app.view.setState(app.st, labels()); change(); }
export function choosePreset(id) { const p = PRESETS.find(x => x.id === id); if (!p) return; const a = applyPreset(p, app.map); Object.assign(app.data, { labels: a.labels, notes: a.notes, off: a.off }); ui.preset = p.id; persist(); refresh(); }
export function toggleFront(id) {
  const { data } = app;
  if (data.off.includes(id)) data.off = data.off.filter(x => x !== id); else if (activeFronts().length > 1) data.off.push(id); else { toast('Keep at least 1 front.'); return; }
  persist(); refresh();
}
export function toggleFx(k) {
  const s = app.data.settings; s[k] = s[k] === false; persist(); fx.configure(fxSettings());
  if (k === 'sound' && s.sound !== false) fx.sound('order');
  if (k === 'motion') setMotionPreference(s.motion === false ? 'reduce' : 'system'); // the interface moves, or does not, with the celebrations
  change();
}
export function exportBackup() {
  const blob = new Blob([store.exportData(app.data)], { type: 'application/json' }); const url = URL.createObjectURL(blob);
  const el = Object.assign(document.createElement('a'), { href: url, download: `artesh-${new Date().toISOString().slice(0, 10)}.json` }); document.body.append(el); el.click(); el.remove(); setTimeout(() => URL.revokeObjectURL(url), 5000);
}
export function importBackup(file) {
  if (!file) return;
  file.text().then(async t => { const settings = app.data.settings; app.data = { ...store.importData(t), settings }; await followScenario(); persist(); refresh(); toast(`Imported ${app.data.reports.length} entries.`); }).catch(err => toast('Couldn’t import that file.', 5000, null, err.message));
}
export function logOut() { fetch('api/logout', { method: 'POST' }).finally(() => { window.caches?.keys().then(ks => ks.forEach(k => caches.delete(k))); location.reload(); }); }
export async function reset() {
  const many = Object.keys(app.data.campaigns || {}).length;
  if (!(await confirm(many ? `Erase everything in ${F().name}?` : 'Erase everything?', many ? 'Every report in this country goes. Other countries keep their campaigns. You can’t undo this.' : 'Every report goes. Your front names stay. You can’t undo this.', 'Erase'))) return;
  app.data.reports = []; ui.assess = null; persist(); refresh(); toast('Erased.', 3200, null, 'The borders are quiet.');
}
export async function loadDemo() {
  if (app.data.reports.length && !(await confirm('Replace your reports with the demo?', 'What you’ve reported in this country goes. Export a backup first to keep it.', 'Replace'))) return;
  app.data.reports = demoReports(); ui.assess = null; persist(); closeSheet(); refresh(); app.view.home(); toast('Demo loaded.');
}
// A campaign in progress for the demo. Fronts are named by slot (0–6), so it plays on whichever map is loaded.
function demoReports() {
  const ids = app.map.fronts.map(f => f.id);
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
