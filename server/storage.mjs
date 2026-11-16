// Campaign storage: state.json (the current copy), journal.ndjson (append-only history of every change)
// and backups/state-YYYY-MM-DD.json (the state as it stood at the start of each day it was changed).
import fs from 'node:fs';
import path from 'node:path';

const KEEP_BACKUPS = 30, JOURNAL_CAP = 5000;
const pad = n => String(n).padStart(2, '0');
export const localDay = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const obj = v => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// A saved state holds the campaign of the country being played at the top level (reports, labels, notes, off) and every
// other country's campaign under campaigns[<id>]. A state from before there was a choice is Iran's.
const DEFAULT_SCENARIO = 'iran';
const scenarioOf = d => (d && typeof d.scenario === 'string' ? d.scenario : DEFAULT_SCENARIO);
const campaignOf = (d, id) => (!d ? null : scenarioOf(d) === id ? d : obj(d.campaigns)[id] || null);

// what changed between two saved states, as journal lines. Each country's campaign is compared with itself, wherever it sits,
// so changing country is one "scenario" line and not a campaign deleted and another added. Lines about a country other than
// the first carry its id.
export function diffState(prev, next, t, src) {
  const lines = []; const tag = src ? { src } : {};
  if (prev && scenarioOf(prev) !== scenarioOf(next)) lines.push({ t, op: 'scenario', from: scenarioOf(prev), to: scenarioOf(next), ...tag });
  const ids = new Set([...(prev ? [scenarioOf(prev)] : []), scenarioOf(next), ...Object.keys(obj(prev?.campaigns)), ...Object.keys(obj(next?.campaigns))]);
  for (const id of ids) lines.push(...diffCampaign(campaignOf(prev, id), campaignOf(next, id), t, id === DEFAULT_SCENARIO ? tag : { scenario: id, ...tag }));
  return lines;
}
function diffCampaign(prev, next, t, tag) {
  const lines = [];
  const index = d => { const m = new Map(); for (const r of Array.isArray(d?.reports) ? d.reports : []) if (r && typeof r === 'object') m.set(r.id != null ? String(r.id) : `ts:${r.ts}`, r); return m; };
  const a = index(prev), b = index(next);
  for (const [id, r] of a) if (!b.has(id)) lines.push({ t, op: 'delete', id, report: r, ...tag });
  for (const [id, r] of b) {
    if (!a.has(id)) lines.push({ t, op: 'add', id, report: r, ...tag });
    else if (!same(a.get(id), r)) lines.push({ t, op: 'edit', id, before: a.get(id), after: r, ...tag });
  }
  // settings: only what changed, as [before, after]
  const changes = {};
  for (const k of ['labels', 'notes']) {
    const x = obj(prev?.[k]), y = obj(next?.[k]); const ch = {};
    for (const id of new Set([...Object.keys(x), ...Object.keys(y)])) if (!same(x[id], y[id])) ch[id] = [x[id] ?? null, y[id] ?? null];
    if (Object.keys(ch).length) changes[k] = ch;
  }
  const off = d => (Array.isArray(d?.off) ? d.off.slice().sort() : []);
  if (!same(off(prev), off(next))) changes.off = [off(prev), off(next)];
  if (Object.keys(changes).length) lines.push({ t, op: 'settings', changes, ...tag });
  return lines;
}

export function createStore(dir) {
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  const at = f => path.join(dir, f);
  const readJSON = (f, d) => { try { return JSON.parse(fs.readFileSync(at(f), 'utf8')); } catch { return d; } };
  const writeJSON = (f, v) => { const p = at(f); fs.writeFileSync(p + '.tmp', JSON.stringify(v), { mode: 0o600 }); fs.renameSync(p + '.tmp', p); };
  const read = () => { const s = readJSON('state.json', null); return s && typeof s.rev === 'number' ? s : { rev: 0, data: null }; };

  // every change to the state goes through this one queue, so two writers can never interleave
  let chain = Promise.resolve();
  const locked = fn => { const p = chain.then(fn); chain = p.then(() => {}, () => {}); return p; };

  function backup(now) {
    if (!fs.existsSync(at('state.json'))) return;
    const bdir = at('backups'), file = path.join(bdir, `state-${localDay(now)}.json`);
    if (fs.existsSync(file)) return;
    fs.mkdirSync(bdir, { recursive: true, mode: 0o700 });
    fs.copyFileSync(at('state.json'), file); fs.chmodSync(file, 0o600);
    const all = fs.readdirSync(bdir).filter(f => /^state-\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort();
    for (const f of all.slice(0, Math.max(0, all.length - KEEP_BACKUPS))) fs.rmSync(path.join(bdir, f), { force: true });
  }
  function journal(lines) {
    if (!lines.length) return;
    const p = at('journal.ndjson'); const fresh = !fs.existsSync(p);
    fs.appendFileSync(p, lines.map(l => JSON.stringify(l) + '\n').join(''), { mode: 0o600 }); // append only: never rewritten
    if (fresh) fs.chmodSync(p, 0o600);
  }
  // synchronous on purpose: backup → journal → atomic replace, with nothing able to run in between
  function commit(cur, data, src) {
    const now = new Date();
    backup(now);
    journal(diffState(cur.data, data, now.toISOString(), src));
    const next = { rev: cur.rev + 1, saved: now.getTime(), data }; writeJSON('state.json', next);
    return next;
  }

  return {
    readJSON, writeJSON, read,
    // the app's save: refused when someone else saved first
    put: (rev, data, src = 'app') => locked(() => { const cur = read(); return rev !== cur.rev ? { conflict: cur } : { next: commit(cur, data, src) }; }),
    // read-modify-write on the newest copy; fn returns the new data
    update: (fn, src = 'api') => locked(() => { const cur = read(); return commit(cur, fn(cur.data), src); }),
    journalSince(since) {
      let text = ''; try { text = fs.readFileSync(at('journal.ndjson'), 'utf8'); } catch { return []; }
      const out = [];
      for (const line of text.split('\n')) { if (!line) continue; let j; try { j = JSON.parse(line); } catch { continue; } if (since == null || Date.parse(j.t) >= since) out.push(j); }
      return out.slice(-JOURNAL_CAP);
    },
  };
}
