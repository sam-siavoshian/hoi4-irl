import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { simulate, territory, statusOf, sitrep, ACTIONS, DAY, enemyForce, objective, frontCaps, frontNote, weatherOf, mapMeta, shortName } from '../js/engine.js';

const map = JSON.parse(fs.readFileSync(new URL('../data/maps/iran.json', import.meta.url)));
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

test('main effort, battle names, commanders, satrapies and decorations', () => {
  const base = [rep(1, [it('afg', 'win', 4, 'breakthrough')])];
  const plain = simulate(map, base, T0 + 2 * DAY);
  const focused = simulate(map, [{ id: 'f1', ts: T0, kind: 'focus', front: 'afg' }, ...base], T0 + 2 * DAY);
  assert.ok(focused.fronts.afg.pos < plain.fronts.afg.pos); assert.equal(focused.focus, 'afg'); assert.equal(focused.log[0].kind, 'focus');
  assert.match(plain.log[0].items[0].battle, /^Battle of /); assert.ok(plain.ach.first);
  const reps = []; for (let i = 0; i < 40; i++) reps.push(rep(i, [it('cau', 'win', 5, 'breakthrough')]));
  const st = simulate(map, reps, T0 + 41 * DAY);
  assert.ok(st.satrapies.some(x => x.name === 'Armina')); assert.ok(st.ach.satrap && st.ach.week && st.ach.month && st.ach.ten && st.ach.decisive && st.ach.abroad);
  assert.ok(st.fronts.cau.cmd.traits.includes('armour')); assert.ok(st.fronts.cau.cmd.level > 3); assert.equal(simulate(map, reps, T0 + 39 * DAY + 1000).dayStreak, 40); assert.equal(st.dayStreak, 0);
  assert.ok(st.log.some(l => l.items.some(i => /^Second Battle of/.test(i.battle || ''))));
  const cb = simulate(map, [rep(1, [it('tur', 'loss', 2, 'attrition')]), rep(2, [it('tur', 'loss', 2, 'attrition')]), rep(3, [it('tur', 'loss', 2, 'attrition')]), rep(4, [it('tur', 'win', 2, 'offensive')])], T0 + 5 * DAY);
  assert.ok(cb.ach.comeback);
});

test('the staff picks the next objective by itself', () => {
  assert.match(objective(map, simulate(map, [], T0), 'afg').text, /^Capture /);
  const lost = simulate(map, Array.from({ length: 12 }, (_, i) => rep(i, [it('afg', 'loss', 5, 'enemy_breakthrough')])), T0 + 13 * DAY);
  assert.match(objective(map, lost, 'afg').text, /^Liberate /);
});

test('geography: no port strikes or naval battles where there is no water', () => {
  const caps = Object.fromEntries(map.fronts.map(f => [f.id, frontCaps(map, f.id)]));
  assert.equal(caps.afg.port, false); assert.equal(caps.tur.port, false); assert.equal(caps.afg.sea, false); assert.equal(caps.glf.sea, true); assert.equal(caps.irq.sea, false);
  const land = simulate(map, [rep(1, [it('afg', 'loss', 3, 'port_strike'), it('tur', 'win', 3, 'naval_victory'), it('afg', 'loss', 2, 'naval_defeat')])], T0 + 2 * DAY);
  assert.deepEqual(land.log[0].items.map(i => i.action), ['rail_cut', 'offensive', 'enemy_offensive']);
  assert.ok(!land.log[0].fx.some(x => /Port of/.test(x.text)));
  // where a port strike is allowed it lands on a real port close to that front, never on the land line
  const P = map.provinces; const meta = mapMeta(map);
  for (const f of map.fronts.filter(f => caps[f.id].port)) {
    const st = simulate(map, [rep(1, [it(f.id, 'loss', 3, 'port_strike')])], T0 + 2 * DAY); const i = st.log[0].items[0];
    assert.equal(i.action, 'port_strike', f.id); assert.ok(P[i.at].f.includes('P'), `${f.id} strike at ${P[i.at].n}`); assert.equal(st.fronts[f.id].last.at, i.at);
    if (!f.naval) assert.ok(meta.frontMeta[f.id].dIr.get(i.at) <= 280, `${P[i.at].n} is near the ${f.id} front`);
  }
  if (caps.tks.port) assert.equal(P[simulate(map, [rep(1, [it('tks', 'loss', 3, 'port_strike')])], T0 + 2 * DAY).log[0].items[0].at].n, 'Bandar Shah');
});
test('new events, operations, nicknames, weather and quiet fronts', () => {
  const base = simulate(map, [rep(1, [it('irq', 'win', 3, 'offensive')])], T0 + 2 * DAY);
  const intel = simulate(map, [rep(0, [it('irq', 'win', 3, 'intelligence')], 0.5), rep(1, [it('irq', 'win', 3, 'offensive')])], T0 + 2 * DAY);
  assert.ok(intel.fronts.irq.pos < base.fronts.irq.pos - 1, 'captured plans make the next attack go further'); assert.ok(!intel.fronts.irq.intel);
  const hit = [rep(1, [it('afg', 'loss', 5, 'supply_hub_bombed')])];
  assert.ok(simulate(map, [...hit, rep(2, [it('afg', 'win', 4, 'lend_lease')])], T0 + 2.01 * DAY).fronts.afg.supply > simulate(map, hit, T0 + 2.01 * DAY).fronts.afg.supply + 20);
  const ops = simulate(map, [1, 2, 3].map(i => rep(i, [it('raj', 'win', 2, 'offensive')])), T0 + 3.1 * DAY);
  assert.ok(ops.log[2].fx.some(x => /^Operation \w+ is launched/.test(x.text))); assert.match(frontNote(map, ops, 'raj').text, /Operation \w+ under way/);
  const bad = simulate(map, [1, 2, 3].map(i => rep(i, [it('raj', 'loss', 2, 'desertion')])), T0 + 3.1 * DAY);
  assert.ok(bad.log[2].fx.some(x => /The enemy opens Operation/.test(x.text)));
  const vets = simulate(map, Array.from({ length: 30 }, (_, i) => rep(i, [it('cau', 'win', 3, 'offensive')])), T0 + 31 * DAY);
  assert.ok(vets.divisions.some(d => d.nick)); assert.ok(vets.log.some(l => l.fx.some(x => /earns the name/.test(x.text))));
  assert.equal(weatherOf(map, 'cau', Date.UTC(2026, 0, 10)).kind, 'snow'); assert.equal(weatherOf(map, 'glf', Date.UTC(2026, 6, 10)).kind, 'heat'); assert.equal(weatherOf(map, 'irq', Date.UTC(2026, 0, 10)), null);
  const one = t => simulate(map, [{ id: 'w', ts: t, items: [it('cau', 'win', 4, 'offensive')] }], t + 1000).fronts.cau.pos;
  assert.ok(one(Date.UTC(2027, 0, 10)) > one(Date.UTC(2027, 4, 10)), 'snow slows the advance');
  const quiet = simulate(map, [rep(1, [it('tur', 'win', 2, 'offensive')])], T0 + 40 * DAY);
  assert.ok(quiet.fronts.tur.enemyStr > 110); assert.match(frontNote(map, quiet, 'tur').text, /enemy is massing/);
});

test('divisions do the fighting: the right arm leads, earns honours, and pays for defeats', () => {
  const st = simulate(map, [rep(1, [it('cau', 'win', 4, 'breakthrough')]), rep(2, [it('cau', 'win', 2, 'fortify')]), rep(3, [it('cau', 'loss', 4, 'enemy_breakthrough')])], T0 + 3.01 * DAY);
  const [a, b, c] = st.log.map(l => l.items[0]); const by = id => st.divisions.find(d => d.id === id);
  assert.equal(by(a.unitId).type, 'arm', 'the armoured division leads the breakthrough'); assert.match(st.log[0].fx[0].text, /Armoured breaks through the enemy line/);
  assert.equal(by(a.unitId).w, 1); assert.match(by(a.unitId).honours[0].text, /^Battle of /); assert.ok(by(a.unitId).co && by(a.unitId).home);
  assert.equal(by(b.unitId).type, 'inf'); assert.match(st.log[1].fx[0].text, /digs in and holds/);
  assert.ok(['inf', 'cav'].includes(by(c.unitId).type)); assert.equal(by(c.unitId).l, 1); assert.ok(by(c.unitId).str < 90, 'the overrun division takes the losses');
  for (const l of st.log) assert.ok(l.items[0].unit.includes(shortName(by(l.items[0].unitId))));
  // no armour on the Afghan front: a breakthrough goes in on foot and gets less far than with tanks
  const foot = simulate(map, [rep(1, [it('afg', 'win', 4, 'breakthrough')])], T0 + 1.01 * DAY); assert.ok(foot.log[0].fx.some(x => /on foot/.test(x.text)));
  assert.ok(foot.fronts.afg.pos > simulate(map, [rep(1, [it('cau', 'win', 4, 'breakthrough')])], T0 + 1.01 * DAY).fronts.cau.pos);
  // strikes on ports and depots are not pinned on a division
  assert.equal(simulate(map, [rep(1, [it('glf', 'loss', 3, 'port_strike')])], T0 + 1.01 * DAY).log[0].items[0].unit, undefined);
});
