// Campaign storage: state.json (the current copy), journal.ndjson (append-only history of every change)
// and backups/state-YYYY-MM-DD.json (the state as it stood at the start of each day it was changed).
import fs from 'node:fs';
import path from 'node:path';

const KEEP_BACKUPS = 30, JOURNAL_CAP = 5000;
const pad = n => String(n).padStart(2, '0');
export const localDay = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const obj = v => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const BACKUP = /^state-\d{4}-\d{2}-\d{2}\.json$/;
export const validState = s => !!s && Number.isInteger(s.rev) && s.rev >= 0 && (s.data === null || Array.isArray(s.data?.reports));

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
  // temp file, flushed to disk, then renamed: a crash or power cut leaves the old file or the new one, never half of one
  const writeJSON = (f, v) => { const p = at(f), fd = fs.openSync(p + '.tmp', 'w', 0o600); try { fs.fchmodSync(fd, 0o600); fs.writeSync(fd, JSON.stringify(v)); fs.fsyncSync(fd); } finally { fs.closeSync(fd); } fs.renameSync(p + '.tmp', p); };
  // A missing state.json is a new campaign. An unreadable one is never treated as empty: the next save (or a 409 handing
  // that "empty" copy to a device) would wipe the campaign. It throws instead, which the server answers with a 500.
  const read = () => {
    let raw; try { raw = fs.readFileSync(at('state.json'), 'utf8'); } catch (e) { if (e.code === 'ENOENT') return { rev: 0, data: null }; throw e; }
    let s; try { s = JSON.parse(raw); } catch { throw new Error('state.json is not valid JSON'); } // a server fault, not the client's "Bad JSON"
    if (!validState(s)) throw new Error('state.json has the wrong shape');
    return s;
  };
  const backups = () => { try { return fs.readdirSync(at('backups')).filter(f => BACKUP.test(f)).sort().reverse(); } catch { return []; } }; // newest first

  // every change to the state goes through this one queue, so two writers can never interleave
  let chain = Promise.resolve();
  const locked = fn => { const p = chain.then(fn); chain = p.then(() => {}, () => {}); return p; };

  function backup(now) {
    if (!fs.existsSync(at('state.json'))) return;
    const bdir = at('backups'), file = path.join(bdir, `state-${localDay(now)}.json`);
    if (fs.existsSync(file)) return;
    fs.mkdirSync(bdir, { recursive: true, mode: 0o700 });
    fs.copyFileSync(at('state.json'), file); fs.chmodSync(file, 0o600);
    for (const f of backups().slice(KEEP_BACKUPS)) fs.rmSync(path.join(bdir, f), { force: true });
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

  // At boot: a state.json that cannot be read is put aside and replaced by the newest backup that can. → null when nothing
  // was wrong, { from, rev, aside, why } after a restore; throws when no backup is usable, so the server refuses to start
  // rather than run on (and later overwrite) a broken campaign.
  function recover() {
    let why; try { read(); return null; } catch (e) { why = e.message; }
    for (const f of backups()) {
      let s; try { s = JSON.parse(fs.readFileSync(path.join(at('backups'), f), 'utf8')); } catch { continue; }
      if (!validState(s)) continue;
      const aside = `state.json.broken-${Date.now()}`; fs.renameSync(at('state.json'), at(aside)); writeJSON('state.json', s);
      return { from: `backups/${f}`, rev: s.rev, aside, why };
    }
    throw new Error(`state.json is unreadable (${why}) and there is no usable backup in ${at('backups')}. Refusing to start so the campaign is not overwritten. Fix or move ${at('state.json')} by hand.`);
  }

  return {
    readJSON, writeJSON, read, recover,
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
