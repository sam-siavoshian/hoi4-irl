// The automation API behind POST /api/report and GET /api/sitrep: the same judging and bookkeeping the app does
// when you press Send, done on the server so a Shortcut, Siri or a script can file a report with one request.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { pathToFileURL } from 'node:url';

const DAY = 86400000;
const bad = (message, reason = 'bad_request') => Object.assign(new Error(message), { status: 400, reason });
const uid = () => Date.now().toString(36) + crypto.randomBytes(4).toString('hex').slice(0, 6);
const DEFAULT_SCENARIO = 'iran'; // a state saved before there was a choice of country is Iran's
const blank = () => ({ v: 3, scenario: DEFAULT_SCENARIO, reports: [], labels: {}, notes: {}, off: [], campaigns: {}, ops: [], seen: [], mode: 'political' });
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
const sentence = s => { const t = String(s || '').replace(/\s+/g, ' ').trim(); return !t ? '' : /[.!?…]$/.test(t) ? t : t + '.'; };

// Test hook (ARTESH_EXTRA_SCENARIOS): a directory of extra built maps, <id>.json, offered next to data/maps/.
// Ids are checked before they touch the file system, and only files directly inside the directory are ever read.
export function scenarioDir(dir) {
  if (!dir) return null;
  dir = path.resolve(dir);
  const file = id => (/^[\w-]+$/.test(id) && fs.existsSync(path.join(dir, `${id}.json`)) ? path.join(dir, `${id}.json`) : null);
  return {
    file: p => { const m = /^\/data\/maps\/([\w-]+)\.json$/.exec(p); return m ? file(m[1]) : null; },
    path: file,
    // the picker's index with the extra maps appended (a map already listed is left alone)
    index(list) {
      const out = Array.isArray(list) ? list.slice() : [];
      for (const f of fs.readdirSync(dir).filter(f => /^[\w-]+\.json$/.test(f)).sort()) {
        let m; try { m = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); } catch { continue; }
        const id = f.replace(/\.json$/, ''); if (!m || m.id !== id || !Array.isArray(m.fronts) || out.some(x => x.id === id)) continue;
        const t = m.meta || {}; out.push({ id, name: t.name || id, long: t.long || t.name || id, empire: t.empire || '', year: t.year || 1936, blurb: t.blurb || '', flag: t.flag || null });
      }
      return out;
    },
  };
}

export function createAutomation({ root, store, llm, judgeOn, extraScenarios = null }) {
  // the engine and the classifier are loaded once, on first use (the app's own modules: no DOM in them); each country's map
  // is loaded the first time the stored state asks for it
  const extra = scenarioDir(extraScenarios);
  let libs = null; const maps = new Map();
  const load = () => libs ??= (async () => {
    const [engine, cls] = await Promise.all([import(pathToFileURL(path.join(root, 'js/engine.js')).href), import(pathToFileURL(path.join(root, 'js/classify.js')).href)]);
    return { engine, cls };
  })().catch(e => { libs = null; throw new Error(`Could not load the engine: ${e?.message || e}`); }); // a plain Error → 500, logged
  const mapOf = id => {
    if (typeof id !== 'string' || !/^[\w-]+$/.test(id)) id = DEFAULT_SCENARIO;
    if (!maps.has(id)) {
      const own = path.join(root, 'data/maps', `${id}.json`), file = fs.existsSync(own) ? own : extra?.path(id);
      if (!file) throw bad(`The saved campaign is for a country this server does not have a map of ("${id}").`, 'no_scenario');
      maps.set(id, fs.promises.readFile(file, 'utf8').then(JSON.parse).catch(e => { maps.delete(id); throw new Error(`Could not load the map of ${id}: ${e?.message || e}`); }));
    }
    return maps.get(id);
  };

  const shape = d => { const b = blank(), x = d && typeof d === 'object' ? d : {}; return { ...b, ...x, reports: Array.isArray(x.reports) ? x.reports : [], labels: x.labels && typeof x.labels === 'object' ? x.labels : {}, notes: x.notes && typeof x.notes === 'object' ? x.notes : {}, off: Array.isArray(x.off) ? x.off : [] }; };
  async function situation(now) {
    const { engine, cls } = await load(); const data = shape(store.read().data); const map = await mapOf(data.scenario); // the country being played
    const labels = Object.fromEntries(map.fronts.map(f => [f.id, data.labels[f.id] || f.defaultLabel]));
    const active = map.fronts.filter(f => !data.off.includes(f.id));
    const st = engine.simulate(map, data.reports, now, { off: data.off });
    return { engine, cls, map, data, labels, active, st };
  }

  // the judge call the classifier makes "over HTTP" is answered here, in-process
  const judgeFetch = async (_url, init) => {
    try { return Response.json({ result: await llm.judge(JSON.parse(init.body)) }); }
    catch (e) { return Response.json({ error: e.status ? e.message : 'Server error' }, { status: e.status || 500 }); }
  };

  function whenOf(v) {
    if (v == null || v === '') return Date.now();
    let t;
    if (typeof v === 'number') t = v;
    else if (/^\d{4}-\d{2}-\d{2}$/.test(String(v))) { const [y, m, d] = String(v).split('-').map(Number); const x = new Date(y, m - 1, d, 20, 0, 0, 0); t = localDayStart(x) === localDayStart(new Date()) ? Date.now() : x.getTime(); }
    else t = Date.parse(String(v));
    if (!Number.isFinite(t)) throw bad('"when" must be an ISO date or time.');
    if (t > Date.now() + 5 * 60e3) throw bad('"when" is in the future.');
    return Math.min(t, Date.now());
  }
  const localDayStart = d => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

  function speechFor(items, saved) {
    const w = items.filter(i => i.outcome === 'win').length, l = items.filter(i => i.outcome === 'loss').length, n = items.length - w - l;
    const tally = [w ? plural(w, 'win', 'wins') : '', l ? plural(l, 'loss', 'losses') : '', n ? `${n} neutral` : ''].filter(Boolean).join(' and ');
    const top = items.slice().sort((a, b) => b.severity - a.severity).slice(0, 3).map(i => `${i.label}: ${String(i.headline).replace(/[.!?…]+$/, '')}`).join('; ');
    return `Logged ${tally}${saved ? '' : ' (not saved)'}. ${sentence(top)}`.trim();
  }

  return {
    // body: Buffer, type: the request's content type. → { status, body }
    async report(buf, type) {
      let text, when, front, outcome;
      if (/json/i.test(type || '')) {
        let b; try { b = JSON.parse(buf.toString('utf8') || '{}'); } catch { throw bad('Bad JSON'); }
        if (!b || typeof b !== 'object' || Array.isArray(b)) throw bad('Send {"text": "..."} or plain text.');
        ({ text, when, front, outcome } = b);
      } else text = buf.toString('utf8');
      text = typeof text === 'string' ? text.trim() : '';
      const manual = front != null || outcome != null;
      if (text.length < 3 && !manual) throw bad('Say what happened: send the report as text.', 'empty');
      const now = whenOf(when);
      const { engine, cls, map, labels, active, data, st } = await situation(now);
      const fronts = active.map(f => ({ id: f.id, label: labels[f.id] }));
      if (!active.length) throw bad('Every front is paused. Turn one on in the app first.', 'no_fronts');

      let res;
      if (manual) {
        const want = String(front ?? '').trim().toLowerCase();
        const f = active.find(x => x.id === want) || active.find(x => labels[x.id].toLowerCase() === want || String(x.name).toLowerCase() === want);
        if (!f) throw Object.assign(bad('Unknown front. Use one of the ids in "fronts".', 'bad_front'), { extra: { fronts } });
        if (outcome !== 'win' && outcome !== 'loss') throw Object.assign(bad('"outcome" must be "win" or "loss".', 'bad_outcome'), { extra: { fronts } });
        const headline = text ? (text.length > 90 ? text.slice(0, 87) + '…' : text) : outcome === 'win' ? 'A good day' : 'A bad day';
        res = { summary: '', source: 'manual', items: [{ front: f.id, outcome, severity: 2, action: outcome === 'win' ? 'offensive' : 'enemy_offensive', headline }] };
      } else {
        const opts = { map, st, labels, notes: data.notes, off: data.off, text, remote: judgeOn, fetchImpl: judgeFetch };
        try { res = await cls.classify(opts); }
        catch (e) { res = cls.classifyLocal(opts); res.warning = `Judge unavailable (${e?.status ? e.message : 'internal error'}). Used the offline classifier instead.`; }
      }
      // never trust the judge's shape more than the engine can take
      const ids = new Set(active.map(f => f.id));
      const items = (Array.isArray(res?.items) ? res.items : []).filter(i => i && ids.has(i.front) && ['win', 'loss', 'neutral'].includes(i.outcome)).map(i => {
        const fallback = i.outcome === 'win' ? 'offensive' : i.outcome === 'loss' ? 'enemy_offensive' : 'skirmish';
        const action = engine.ACTIONS && !engine.ACTIONS[i.action] ? fallback : String(i.action || fallback);
        return { ...i, severity: Math.max(1, Math.min(5, Math.round(Number(i.severity) || 2))), action, headline: String(i.headline || text).slice(0, 160), days_ago: Math.max(0, Math.min(7, Math.round(Number(i.days_ago) || 0))) };
      });
      const summary = String(res?.summary || ''), source = String(res?.source || 'local');
      if (!items.length) return { status: 200, body: { ok: false, reason: 'unclear', summary, source, ...(res?.warning ? { warning: res.warning } : {}), fronts, speech: 'I could not tell which part of your life that belongs to. Say which front, and whether it was a win or a loss.' } };

      // one report per day mentioned, exactly as the app's Send does: today's keeps the text, earlier days land at 20:00 local
      const groups = new Map();
      for (const i of items) { const d = i.days_ago; if (!groups.has(d)) groups.set(d, []); const { days_ago, ...item } = i; groups.get(d).push(item); }
      const first = Math.min(...groups.keys());
      const reps = [...groups].map(([d, its]) => { let ts = now; if (d > 0) { const x = new Date(now - d * DAY); x.setHours(20, 0, 0, 0); ts = x.getTime(); } return { id: uid(), ts, text: d === first ? text : '', summary: d === first ? summary : '', source, items: its }; });
      const saved = await store.update(cur => { const next = shape(cur); return { ...next, reports: [...next.reports, ...reps] }; }, 'api');

      const out = items.map(i => ({ front: i.front, label: labels[i.front], outcome: i.outcome, severity: i.severity, action: i.action, headline: i.headline, days_ago: i.days_ago }));
      return { status: 200, body: { ok: true, summary, source, ...(res?.warning ? { warning: res.warning } : {}), items: out, speech: speechFor(out, true), rev: saved.rev, reports: reps.map(r => r.id) } };
    },
    async sitrep() { const { engine, map, st, labels } = await situation(Date.now()); return engine.sitrep(map, st, labels); },
  };
}
