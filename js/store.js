// Persistence. Everything lives in localStorage on this device; export/import for backups.
const KEY = 'artesh.v1';
const blank = () => ({ v: 2, reports: [], labels: {}, notes: {}, off: [], ops: [], seen: [], settings: { apiKey: '', model: 'claude-opus-5-5', elevenKey: '', voice: 'auto', lang: '' }, mode: 'political', onboarded: false });

export function load() {
  try { const d = JSON.parse(localStorage.getItem(KEY) || 'null'); if (d && Array.isArray(d.reports)) { const b = blank(); return { ...b, ...d, settings: { ...b.settings, ...(d.settings || {}) } }; } } catch { /* corrupt → start fresh */ }
  return blank();
}
export function save(data) { try { localStorage.setItem(KEY, JSON.stringify(data)); return true; } catch { return false; } }
export function exportData(data, withKeys = false) {
  const d = JSON.parse(JSON.stringify(data)); if (!withKeys) { d.settings.apiKey = ''; d.settings.elevenKey = ''; }
  return JSON.stringify({ app: 'artesh', exported: new Date().toISOString(), ...d }, null, 2);
}
export function importData(text, current) {
  const d = JSON.parse(text);
  if (!d || !Array.isArray(d.reports)) throw new Error('This file is not an ARTESH backup.');
  for (const r of d.reports) if (typeof r.ts !== 'number' || (!r.kind && !Array.isArray(r.items))) throw new Error('Backup is damaged.');
  const b = blank();
  return { ...b, reports: d.reports, labels: d.labels || {}, notes: d.notes || {}, off: d.off || [], ops: d.ops || [], seen: d.seen || [], mode: d.mode || 'political', onboarded: true, settings: { ...b.settings, ...(d.settings || {}), apiKey: d.settings?.apiKey || current.settings.apiKey, elevenKey: d.settings?.elevenKey || current.settings.elevenKey } };
}
export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
export { blank };
