// Persistence. Everything lives in localStorage on this device; export/import for backups.
const KEY = 'artesh.v1';
const blank = () => ({ v: 2, reports: [], labels: {}, notes: {}, off: [], ops: [], seen: [], settings: {}, mode: 'political', onboarded: false });

export function load() {
  try { const d = JSON.parse(localStorage.getItem(KEY) || 'null'); if (d && Array.isArray(d.reports)) { const b = blank(); return { ...b, ...d, settings: { ...b.settings, ...(d.settings || {}) } }; } } catch { /* corrupt → start fresh */ }
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
  for (const r of d.reports) if (typeof r.ts !== 'number' || (!r.kind && !Array.isArray(r.items))) throw new Error('Backup is damaged.');
  const b = blank();
  return { ...b, reports: d.reports, labels: d.labels || {}, notes: d.notes || {}, off: d.off || [], ops: d.ops || [], seen: d.seen || [], mode: d.mode || 'political', onboarded: true };
}
export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
export { blank };

// ---- sync with the private server (so the phone and the desktop show the same war) ----
let rev = 0, timer = null, busy = false, dirty = false;
export async function pull() { // → server copy or null
  const r = await fetch('api/state'); if (!r.ok) throw new Error('state ' + r.status);
  const j = await r.json(); rev = j.rev; return j.data ? { ...blank(), ...j.data, settings: {} } : null;
}
export function push(data, onConflict) {
  dirty = true; clearTimeout(timer);
  timer = setTimeout(async function go() {
    if (busy) { timer = setTimeout(go, 400); return; }
    busy = true; dirty = false;
    try {
      const r = await fetch('api/state', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ rev, data: { ...data(), settings: {} } }) });
      if (r.ok) rev = (await r.json()).rev;
      else if (r.status === 409) { const j = await r.json(); rev = j.rev; onConflict?.(j.data ? { ...blank(), ...j.data, settings: {} } : null); }
    } catch { dirty = true; /* offline: keep the local copy, retry on the next change */ }
    busy = false; if (dirty) timer = setTimeout(go, 3000);
  }, 500);
}
