// Persistence. Everything lives in localStorage on this device; export/import for backups.
//
// Shape (v3): { v, scenario, reports, labels, notes, off, campaigns, ops, seen, settings, mode, onboarded }
// `scenario` is the country being played; reports, labels, notes and off at the top level are ITS campaign. Every other
// country that has been played keeps its own campaign under campaigns[<scenario id>] = { reports, labels, notes, off },
// so changing country never destroys anything. A save from before scenarios (v2, no `scenario`) is Iran's campaign.
const KEY = 'artesh.v1';
export const DEFAULT_SCENARIO = 'iran';
const CAMPAIGN_KEYS = ['reports', 'labels', 'notes', 'off'];
const blank = () => ({ v: 3, scenario: DEFAULT_SCENARIO, reports: [], labels: {}, notes: {}, off: [], campaigns: {}, ops: [], seen: [], settings: {}, mode: 'political', onboarded: false });
const obj = v => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});
const campaign = c => ({ reports: Array.isArray(c?.reports) ? c.reports : [], labels: obj(c?.labels), notes: obj(c?.notes), off: Array.isArray(c?.off) ? c.off : [] });

// Any saved object (old or new, local or from the server) → the current shape. Nothing is dropped.
export function migrate(d) {
  const b = blank(), out = { ...b, ...d, ...campaign(d), settings: { ...b.settings, ...obj(d.settings) } };
  out.scenario = typeof d.scenario === 'string' && /^[\w-]+$/.test(d.scenario) ? d.scenario : DEFAULT_SCENARIO;
  out.campaigns = Object.fromEntries(Object.entries(obj(d.campaigns)).filter(([id]) => id !== out.scenario).map(([id, c]) => [id, campaign(c)]));
  out.v = 3;
  return out;
}
// Put the current campaign away and bring out the one for another country (in place). A country played for the first time
// starts with no reports and inherits the names, notes and paused state of the current fronts, slot by slot: the user's life
// areas are the same whichever borders stand for them. `from` and `to` are the front ids of the two maps, in order.
export function switchScenario(data, id, from = [], to = []) {
  if (id === data.scenario) return data;
  data.campaigns = obj(data.campaigns);
  data.campaigns[data.scenario] = campaign(data);
  let next = data.campaigns[id];
  if (!next) {
    const carry = src => Object.fromEntries(from.map((f, i) => [to[i], src[f]]).filter(([k, v]) => k && v != null));
    next = { reports: [], labels: carry(data.labels), notes: carry(data.notes), off: data.off.map(f => to[from.indexOf(f)]).filter(Boolean) };
  }
  delete data.campaigns[id];
  for (const k of CAMPAIGN_KEYS) data[k] = campaign(next)[k];
  data.scenario = id; data.v = 3;
  return data;
}

export function load() {
  try { const d = JSON.parse(localStorage.getItem(KEY) || 'null'); if (d && Array.isArray(d.reports)) return migrate(d); } catch { /* corrupt → start fresh */ }
  return blank();
}
export function save(data) { try { localStorage.setItem(KEY, JSON.stringify(data)); return true; } catch { return false; } }
export function exportData(data) {
  const d = JSON.parse(JSON.stringify(data)); d.settings = {};
  return JSON.stringify({ app: 'artesh', exported: new Date().toISOString(), ...d }, null, 2);
}
export function importData(text) {
  const d = JSON.parse(text);
  if (!d || !Array.isArray(d.reports)) throw new Error('This file is not an ARTESH backup.');
  const check = list => { for (const r of list) if (!r || typeof r.ts !== 'number' || (!r.kind && !Array.isArray(r.items))) throw new Error('Backup is damaged.'); };
  check(d.reports); for (const c of Object.values(obj(d.campaigns))) check(Array.isArray(c?.reports) ? c.reports : []);
  const m = migrate(d);
  return { ...blank(), scenario: m.scenario, reports: m.reports, labels: m.labels, notes: m.notes, off: m.off, campaigns: m.campaigns, ops: d.ops || [], seen: d.seen || [], mode: d.mode || 'political', onboarded: true };
}
export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
export { blank };

// ---- sync with the private server (so the phone and the desktop show the same war) ----
let rev = 0, timer = null, busy = false, dirty = false;
export async function pull() { // → server copy or null
  const r = await fetch('api/state'); if (!r.ok) throw new Error('state ' + r.status);
  const j = await r.json(); rev = j.rev; return j.data ? { ...migrate(j.data), settings: {} } : null;
}
export function push(data, onConflict) {
  dirty = true; clearTimeout(timer);
  timer = setTimeout(async function go() {
    if (busy) { timer = setTimeout(go, 400); return; }
    busy = true; dirty = false;
    try {
      const r = await fetch('api/state', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ rev, data: { ...data(), settings: {} } }) });
      if (r.ok) rev = (await r.json()).rev;
      else if (r.status === 409) { const j = await r.json(); rev = j.rev; onConflict?.(j.data ? { ...migrate(j.data), settings: {} } : null); }
    } catch { dirty = true; /* offline: keep the local copy, retry on the next change */ }
    busy = false; if (dirty) timer = setTimeout(go, 3000);
  }, 500);
}
