import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { simulate, territory, statusOf, sitrep, ACTIONS, DAY, enemyForce } from '../js/engine.js';

const map = JSON.parse(fs.readFileSync(new URL('../data/map.json', import.meta.url)));
const T0 = Date.UTC(2026, 10, 1);
const rep = (i, items, dt = i) => ({ id: 'r' + i, ts: T0 + dt * DAY, text: 't', items });
const it = (front, outcome, severity, action) => ({ front, outcome, severity, action, headline: 'h' });

test('map sanity', () => {
  assert.equal(map.fronts.length, 7);
  assert.equal(map.provinces[map.tehran].n, 'Tehran');
  for (const f of map.fronts) { assert.ok(f.iranOrder.length > 10, f.id); assert.ok(f.enemyOrder.length > 5, f.id); assert.equal(f.iranOrder.at(-1)[0], map.tehran, f.id + ' ends at Tehran'); }
  for (const p of map.provinces) for (const a of p.adj) assert.ok(map.provinces[a].adj.includes(p.id));
});

test('fresh state holds the border', () => {
  const st = simulate(map, [], T0);
  assert.equal(st.terr.occ.size, 0); assert.equal(st.terr.lib.size, 0);
  assert.equal(st.divisions.length, 2 + 4 + 4 + 3 + 4 + 3 + 3 + 3);
  for (const f of map.fronts) { assert.equal(statusOf(st.fronts[f.id].pos).key, 'holding'); assert.ok(st.lines[f.id].ours.length > 0); assert.ok(st.lines[f.id].theirs.length > 0); }
});

test('losses push the enemy in, wins push out', () => {
  const bad = simulate(map, [rep(1, [it('afg', 'loss', 4, 'enemy_breakthrough'), it('cau', 'loss', 3, 'enemy_offensive')])], T0 + 2 * DAY);
  assert.ok(bad.fronts.afg.pos > 6); assert.ok(bad.terr.occ.size > 0);
  assert.ok([...bad.terr.occ.values()].includes('afg'));
  assert.equal(bad.fronts.irq.pos, 0);
  const good = simulate(map, [rep(1, [it('afg', 'win', 4, 'breakthrough')])], T0 + 2 * DAY);
  assert.ok(good.fronts.afg.pos < -6); assert.ok(good.terr.lib.size > 0); assert.equal(good.terr.occ.size, 0);
  assert.ok(good.log[0].fx.some(x => /captured/.test(x.text)));
});

test('deterministic replay and undo', () => {
  const reps = [rep(1, [it('irq', 'loss', 5, 'encircled')]), rep(2, [it('irq', 'win', 3, 'offensive'), it('glf', 'loss', 4, 'port_strike')]), rep(3, [it('tks', 'win', 2, 'infrastructure')])];
  const a = simulate(map, reps, T0 + 5 * DAY), b = simulate(map, reps.slice().reverse(), T0 + 5 * DAY);
  assert.deepEqual(a.fronts, b.fronts); assert.deepEqual(a.divisions, b.divisions);
  const undone = simulate(map, reps.filter(r => r.id !== 'r1'), T0 + 5 * DAY);
  assert.ok(undone.fronts.irq.pos < a.fronts.irq.pos);
});

test('a catastrophic run reaches Tehran and is capped; recovery works', () => {
  const reps = []; for (let i = 0; i < 60; i++) reps.push(rep(i, [it('tks', 'loss', 5, 'enemy_breakthrough')]));
  const st = simulate(map, reps, T0 + 61 * DAY);
  assert.equal(st.fronts.tks.pos, 100); assert.ok(st.tehranFallen); assert.equal(statusOf(100).key, 'fallen');
  assert.ok(st.terr.occ.has(map.tehran)); assert.ok(st.divisions.filter(d => d.front === 'tks').length >= 1);
  assert.ok(st.log.some(l => l.fx.some(x => x.text === 'TEHRAN HAS FALLEN')));
  for (let i = 60; i < 80; i++) reps.push(rep(i, [it('tks', 'win', 5, 'breakthrough')]));
  const st2 = simulate(map, reps, T0 + 81 * DAY);
  assert.ok(st2.fronts.tks.pos < 50); assert.ok(!st2.tehranFallen);
});

test('total victory restores the empire', () => {
  const reps = []; let k = 0;
  for (let i = 0; i < 120; i++) reps.push(rep(k++, map.fronts.map(f => it(f.id, 'win', 5, 'breakthrough')), i));
  const st = simulate(map, reps, T0 + 121 * DAY);
  for (const f of map.fronts) assert.equal(st.fronts[f.id].pos, -100, f.id);
  assert.ok(st.empire); assert.equal(st.nation.name, 'Achaemenid Empire');
  for (const f of map.fronts) { assert.ok(st.lines[f.id].ours.length > 0); for (const id of st.lines[f.id].ours) assert.notEqual(map.provinces[id].t, 'IRN', f.id + ' holds the far frontier'); for (const id of st.lines[f.id].theirs) assert.ok(!st.terr.lib.has(id)); }
  assert.ok(st.divisions.length > 23);
});

test('every action applies without NaN on every front', () => {
  for (const f of map.fronts) for (const [a, A] of Object.entries(ACTIONS)) {
    const st = simulate(map, [rep(1, [it(f.id, A.side, 3, a)]), rep(2, [it(f.id, A.side, 5, a)])], T0 + 3 * DAY);
    const fr = st.fronts[f.id];
    for (const k of ['pos', 'air', 'sea', 'supply', 'entrench', 'enemyStr']) assert.ok(Number.isFinite(fr[k]), `${f.id} ${a} ${k}`);
    for (const d of st.divisions) assert.ok(Number.isFinite(d.str) && Number.isFinite(d.org));
    if (A.side === 'win') assert.ok(fr.pos <= 0, `${f.id} ${a}`); if (A.side === 'loss') assert.ok(fr.pos >= 0, `${f.id} ${a}`);
    assert.ok(enemyForce(map, st, f.id).length >= 2);
  }
});

test('bombing damages and time repairs; infrastructure builds', () => {
  const r = [rep(1, [it('cau', 'loss', 5, 'strategic_bombing'), it('cau', 'loss', 5, 'supply_hub_bombed'), it('glf', 'loss', 5, 'port_strike')])];
  const now = simulate(map, r, T0 + 1 * DAY + 1000), later = simulate(map, r, T0 + 60 * DAY);
  const dmg = s => Object.values(s.bld).reduce((a, b) => a + b.dmg, 0) + Object.values(s.states).reduce((a, b) => a + b.dmg, 0);
  assert.ok(dmg(now) > 1); assert.ok(dmg(later) < dmg(now)); assert.ok(now.fronts.cau.supply < 60); assert.ok(later.fronts.cau.supply > 90);
  const reps = []; for (let i = 0; i < 16; i++) reps.push(rep(i, [it('raj', 'win', 4, 'infrastructure')]));
  const b = simulate(map, reps, T0 + 20 * DAY);
  assert.ok(b.nation.civ + b.nation.mil > now.nation.civ + now.nation.mil); assert.equal(b.railStage, 4);
});

test('sitrep reads sensibly', () => {
  const st = simulate(map, [rep(1, [it('afg', 'loss', 5, 'enemy_breakthrough')])], T0 + 1.5 * DAY);
  const s = sitrep(map, st, { afg: 'School' });
  assert.match(s, /Afghan Front \(School\)/); assert.match(s, /occupied/);
});
