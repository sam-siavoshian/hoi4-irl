// Every country in data/maps must be playable: a clean start, a lost war, a won war, and data the engine can use.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { simulate, DAY, flavor, mapMeta, statusOf, sitrep, weeklyRecap, lifetime, medalProgress, medalsFor, frontCaps } from '../js/engine.js';
import { buildSystem, classifyLocal } from '../js/classify.js';

const root = new URL('../', import.meta.url);
const index = JSON.parse(fs.readFileSync(new URL('data/scenarios.json', root)));
const T0 = Date.UTC(2026, 10, 1);
const rep = (i, items) => ({ id: 'r' + i, ts: T0 + i * DAY, text: 't', items });
const it = (front, outcome, severity, action) => ({ front, outcome, severity, action, headline: 'h' });

test('the index lists every built map', () => {
  const files = fs.readdirSync(new URL('data/maps/', root)).filter(f => f.endsWith('.json')).map(f => f.slice(0, -5)).sort();
  assert.deepEqual(index.map(s => s.id).sort(), files); assert.ok(index.length >= 8);
  for (const s of index) for (const k of ['name', 'long', 'empire', 'year', 'blurb', 'flag']) assert.ok(s[k], `${s.id}.${k}`);
});

for (const { id } of index) {
  const map = JSON.parse(fs.readFileSync(new URL(`data/maps/${id}.json`, root)));
  const F = flavor(map), M = mapMeta(map), ids = map.fronts.map(f => f.id);
  const objIds = new Set(map.fronts.flatMap(f => f.enemyOrder.map(e => e[0])));
  const home = n => M.byName[n] && M.byName[n].t === map.home;

  test(`${id}: data the engine relies on`, () => {
    assert.equal(map.fronts.length, 7);
    assert.equal(F.ranks.length, 12); assert.equal(new Set(F.ranks.map(r => r[1])).size, 12, 'twelve distinct ranks');
    assert.ok(!F.ranks.some(r => /^Senior /.test(r[1])) || !map.meta.ranks || map.meta.ranks.length === 12, 'ranks not stretched');
    for (const f of map.fronts) {
      assert.ok(F.commanders[f.id], f.id + ' commander'); assert.ok(F.oob[f.id].length >= 2, f.id + ' oob'); assert.ok(F.honor[f.id].length >= F.oob[f.id].length, f.id + ' honour names for every division');
      assert.ok(f.iranOrder.length > 5 && f.enemyOrder.length > 5, f.id + ' depth'); assert.equal(f.iranOrder.at(-1)[0], map.capital, f.id + ' reaches the capital');
      if (f.naval) assert.ok(F.fleets.some(fl => (fl.fronts || []).includes(f.id)), f.id + ' is served by a fleet');
      assert.ok(frontCaps(map, f.id));
      const fleet = F.fleets.find(fl => (fl.fronts || []).includes(f.id));
      if (frontCaps(map, f.id).sea && !f.naval && !/River|Amazon/.test(fleet?.sea || '')) assert.ok(f.border.some(b => map.provinces[b].co || map.provinces[b].adj.some(x => map.provinces[x].co)), f.id + ' has a fleet, so its border must touch water');
    }
    for (const fl of F.fleets) { assert.ok(home(fl.base), `fleet base ${fl.base}`); for (const x of fl.fronts || []) assert.ok(ids.includes(x), `fleet front ${x}`); }
    for (const w of F.wings) assert.ok(home(w.base), `wing base ${w.base}`);
    for (const l of map.meta.landmarks || []) { const p = M.byName[l.city]; assert.ok(p && objIds.has(p.id), `landmark ${l.city} is an objective`); }
    for (const k of Object.keys(map.meta.commanders || {})) assert.ok(ids.includes(k), 'commander of unknown front ' + k);
    for (const k of Object.keys(map.meta.oob || {})) assert.ok(ids.includes(k), 'oob of unknown front ' + k);
    assert.ok(home(F.fightsOnFrom), 'fightsOnFrom is a home city');
    assert.ok(medalsFor(map).length >= 20);
  });

  test(`${id}: a clean start, a lost war and a won war`, () => {
    const st0 = simulate(map, [], T0);
    assert.equal(st0.terr.occ.size, 0); assert.equal(st0.terr.lib.size, 0);
    for (const f of ids) assert.equal(statusOf(st0.fronts[f].pos, map).key, 'holding');
    assert.equal(new Set(st0.divisions.map(d => d.name)).size, st0.divisions.length, 'division names are unique');
    assert.ok(sitrep(map, st0).length || sitrep(map, st0));

    const bad = []; for (let i = 0; i < 70; i++) bad.push(rep(i, [it(ids[i % 2], 'loss', 5, 'enemy_breakthrough')]));
    const lost = simulate(map, bad, T0 + 71 * DAY);
    assert.ok(lost.tehranFallen || lost.nation.capitalFallen || Math.max(...ids.map(f => lost.fronts[f].pos)) >= 100, 'the capital can fall');
    for (const p of lost.terr.occ.keys()) assert.equal(map.provinces[p].t, map.home);

    const good = []; let n = 0;
    for (let i = 0; i < 80; i++) for (const f of ids) good.push(rep(n++, [it(f, 'win', 5, 'offensive')]));
    const won = simulate(map, good, T0 + (n + 1) * DAY);
    for (const f of ids) assert.equal(won.fronts[f].pos, -100, f + ' fully won');
    for (const f of map.fronts) { const want = f.enemyOrder.length, got = [...won.terr.lib.values()].filter(x => x === f.id).length; assert.ok(got >= want * 0.97, `${f.id} liberated ${got}/${want}`); }
    for (const d of won.divisions) assert.ok(Number.isFinite(d.str) && d.name && d.co);
    for (const l of won.log) for (const x of l.fx) assert.ok(!/undefined|NaN|\[object/.test(x.text), x.text);
    assert.ok(lifetime(won, map)); assert.ok(medalProgress(won, map)); assert.ok(weeklyRecap(map, won));
    for (const l of map.meta.landmarks || []) assert.ok(won.terr.lib.has(M.byName[l.city].id), l.city + ' is taken in a won war');
  });

  test(`${id}: the judge knows the country`, () => {
    const labels = Object.fromEntries(map.fronts.map(f => [f.id, f.defaultLabel]));
    const sys = buildSystem(map, labels, {}, []);
    if (id !== 'iran') assert.ok(!/Tehran|Achaemenid/.test(sys), 'no Iran in the prompt');
    const r = classifyLocal({ map, labels, text: 'Aced my exam at school today', off: [], notes: {} });
    assert.ok(r.items.length && ids.includes(r.items[0].front));
  });
}
