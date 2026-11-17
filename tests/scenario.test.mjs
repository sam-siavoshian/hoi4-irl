// The runtime is scenario-driven: everything the first scenario (Iran) can do, any built scenario can do.
// Proved against tests/fixtures/testland.mjs, a small awkward country written to docs/SCENARIOS.md: another home tag,
// other front ids, the southern hemisphere, two naval fronts on one fleet and a META with most optional fields left out.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { simulate, statusOf, sitrep, ACTIONS, DAY, enemyForce, objective, frontCaps, frontNote, weatherOf, mapMeta, flavor, medalOf, medalsFor, medalProgress, lifetime, weeklyRecap, momentOf, headlineOf, commanderOf, ranksOf, orderText, MEDALS, COMMANDER_RANKS } from '../js/engine.js';
import { classifyLocal, buildSystem, buildUser, suggestFront, assess } from '../js/classify.js';
import { PRESETS, applyPreset } from '../js/presets.js';
import { ask } from '../js/ask.js';
import * as store from '../js/store.js';
import { testland, FIXTURES } from './fixtures/build.mjs';

const root = new URL('../', import.meta.url);
const iran = JSON.parse(fs.readFileSync(new URL('data/maps/iran.json', root)));
const map = await testland();
const ids = map.fronts.map(f => f.id);
const [LIT, ENT, QUA, CAM, LAG, PLA, ATL] = ids;
const T0 = Date.UTC(2026, 10, 1);
const rep = (i, items, dt = i) => ({ id: 'r' + i, ts: T0 + dt * DAY, text: 't', items });
const it = (front, outcome, severity, action) => ({ front, outcome, severity, action, headline: 'h' });
const texts = st => st.log.flatMap(l => l.fx.map(x => x.text));
const finite = st => { for (const f of Object.values(st.fronts)) for (const k of ['pos', 'air', 'sea', 'supply', 'entrench', 'enemyStr']) assert.ok(Number.isFinite(f[k]), `${f.id} ${k}`); for (const d of st.divisions) assert.ok(Number.isFinite(d.str) && Number.isFinite(d.org) && d.name && d.co, d.id); };

test('testland is a different country in every way that matters', () => {
  assert.equal(map.id, 'testland'); assert.equal(map.home, 'URU'); assert.equal(map.provinces[map.capital].n, 'Durazno');
  assert.equal(map.fronts.length, 7); assert.deepEqual(map.fronts.filter(f => f.naval).map(f => f.id), ['pla', 'atl']);
  for (const id of ids) assert.ok(!iran.fronts.some(f => f.id === id), `${id} is not one of Iran's ids`);
  assert.ok(map.extent.lat1 < 0, 'entirely south of the equator');
  for (const f of map.fronts) { assert.equal(f.iranOrder.at(-1)[0], map.capital, f.id + ' ends at the capital'); assert.equal(f.dCap, f.iranOrder.at(-1)[1]); }
  for (const k of ['commanders', 'officerNames', 'guard', 'wings', 'shipNames', 'stateStart', 'enemyAdjectives', 'medalNames', 'masthead', 'calendar', 'motto', 'capitalFalls', 'fightsOnFrom', 'pitch']) assert.equal(map.meta[k], undefined, `${k} is left out on purpose`);
});

test('flavor(map) fills every gap with a plain default, and reads what is there', () => {
  const F = flavor(map);
  assert.equal(F, flavor(map), 'memoised per map'); assert.equal(F.home, 'URU'); assert.equal(F.capital, 'Durazno'); assert.equal(F.name, 'Testland'); assert.equal(F.empire, 'Platine Confederation');
  assert.equal(F.fightsOnFrom, 'Montevideo', 'the largest other city'); assert.match(F.capitalFalls, /evacuates to Montevideo/); assert.match(F.capitalFreed, /^Durazno is free again/);
  assert.match(F.pitch, /1936 grand-strategy war map of Testland/); assert.match(F.masthead, /Testland/); assert.equal(F.calendar, null); assert.equal(F.south, true);
  assert.deepEqual(F.honor.lit, ['Salto', 'Daymán', 'Arapey']); assert.ok(F.honor.cam.length >= 3 && F.honor.cam.every(n => mapMeta(map).byName[n]?.t === 'URU'), 'unnamed fronts take the towns behind them');
  for (const f of map.fronts) { assert.match(F.commanders[f.id], f.naval ? /^Adm\. / : /^Gen\. /); assert.ok(F.oob[f.id].length >= 2); }
  assert.deepEqual(F.oob.atl, ['mar', 'inf', 'inf'], 'an unknown unit type becomes infantry');
  assert.equal(F.guard.length, 1); assert.equal(F.wings.length, 1); assert.equal(F.wings[0].base, 'Durazno'); assert.ok(F.shipNames.length > 10); assert.ok(F.enemyOperations.length && F.nicknames.length);
  assert.equal(F.fleets.length, 1); assert.deepEqual([F.fleetOf.pla, F.fleetOf.atl, F.fleetOf.lit], [0, 0, 0]); assert.equal(F.enemyAdj('BRA'), 'Brazil');
  // six ranks are stretched over the twelve levels, keeping the XP thresholds
  assert.equal(F.ranks.length, 12); assert.deepEqual(F.ranks.map(r => r[0]), COMMANDER_RANKS.map(r => r[0])); assert.deepEqual(F.ranks.slice(0, 3).map(r => r[1]), ['Soldado', 'Senior Soldado', 'Sargento']); assert.equal(F.ranks[11][1], 'Senior General'); assert.equal(new Set(F.ranks.map(r => r[1])).size, 12);
  assert.equal(commanderOf(0, map).title, 'Soldado'); assert.equal(commanderOf(1e6, map).title, 'Senior General'); assert.equal(commanderOf(0).title, 'Private'); assert.equal(ranksOf(iran)[4][1], 'Sarvan');
  // Iran says everything itself
  const I = flavor(iran); assert.equal(I.home, 'IRN'); assert.equal(I.capital, 'Tehran'); assert.equal(I.fightsOnFrom, 'Isfahan'); assert.equal(I.south, false); assert.equal(I.fleets.length, 2); assert.deepEqual([I.fleetOf.glf, I.fleetOf.cau, I.fleetOf.tks, I.fleetOf.irq], [0, 1, 1, 0]);
});

test('fresh state holds the border', () => {
  const st = simulate(map, [], T0), F = flavor(map);
  assert.equal(st.terr.occ.size, 0); assert.equal(st.terr.lib.size, 0); finite(st);
  assert.equal(st.divisions.length, F.guard.length + ids.reduce((a, id) => a + F.oob[id].length, 0));
  for (const f of map.fronts) { assert.equal(statusOf(st.fronts[f.id].pos, map).key, 'holding'); assert.ok(st.lines[f.id].ours.length > 0, f.id); assert.ok(st.lines[f.id].theirs.length > 0, f.id); assert.equal(st.fronts[f.id].cmd.name, F.commanders[f.id]); }
  assert.equal(st.nation.name, 'Oriental Republic of Testland'); assert.equal(st.commander.title, 'Soldado'); assert.equal(st.fleets[0].name, 'River Plate Squadron'); assert.equal(st.fleets[0].ships.length, 3);
  assert.ok(st.divisions.filter(d => d.front === LIT).every(d => /Salto|Daymán|Arapey/.test(d.name))); assert.equal(st.divisions.find(d => !d.front).home, 'Durazno');
  for (const s of Object.values(st.states)) assert.ok(Number.isFinite(s.infra + s.civ + s.mil + s.dock));
  assert.ok(st.nation.civ >= 2, 'the capital region starts with some industry when the scenario gives no figures');
});

test('losses push the enemy in and reach the capital; recovery frees it', () => {
  const bad = simulate(map, [rep(1, [it(LIT, 'loss', 4, 'enemy_breakthrough'), it(CAM, 'loss', 3, 'enemy_offensive')])], T0 + 2 * DAY);
  assert.ok(bad.fronts[LIT].pos > 6); assert.ok([...bad.terr.occ.values()].includes(LIT)); assert.equal(bad.fronts[LAG].pos, 0);
  for (const id of bad.terr.occ.keys()) assert.equal(map.provinces[id].t, 'URU');
  const reps = []; for (let i = 0; i < 60; i++) reps.push(rep(i, [it(CAM, 'loss', 5, 'enemy_breakthrough')]));
  const st = simulate(map, reps, T0 + 61 * DAY);
  assert.equal(st.fronts[CAM].pos, 100); assert.ok(st.tehranFallen); assert.ok(st.terr.occ.has(map.capital)); finite(st);
  assert.equal(statusOf(100, map).text, 'Durazno has fallen'); assert.equal(statusOf(90, map).text, 'Enemy at the gates of Durazno'); assert.equal(statusOf(100).text, 'The capital has fallen');
  assert.ok(texts(st).includes('DURAZNO HAS FALLEN')); assert.ok(texts(st).includes('The government evacuates to Montevideo. The war goes on.'));
  const fall = st.log.find(l => l.fx.some(x => x.kind === 'tehran_fallen')); assert.deepEqual([momentOf(fall).title, momentOf(fall).sub], ['Durazno has fallen', 'The government fights on from Montevideo']);
  assert.match(sitrep(map, st), /Durazno has fallen\. The government fights on from Montevideo\./); assert.match(objective(map, st, CAM).text, /^Liberate /);
  for (let i = 60; i < 85; i++) reps.push(rep(i, [it(CAM, 'win', 5, 'breakthrough')]));
  const st2 = simulate(map, reps, T0 + 86 * DAY);
  assert.ok(!st2.tehranFallen); assert.ok(st2.ach.kaveh); assert.ok(texts(st2).some(t => /^Durazno is free again/.test(t)));
  assert.equal(medalOf('kaveh', map).desc, 'Free Durazno after it has fallen'); assert.equal(medalOf('defender', map).name, 'Defender of Durazno');
  for (const t of [...texts(st), ...texts(st2), sitrep(map, st)]) assert.doesNotMatch(t, /Tehran|Isfahan|Shah|Iran|Achaemenid|Satrap/i);
});

test('wins push out and restore the empire, with its regions and landmark decorations', () => {
  const good = simulate(map, [rep(1, [it(LIT, 'win', 4, 'breakthrough')])], T0 + 2 * DAY);
  assert.ok(good.fronts[LIT].pos < -6); assert.ok(good.terr.lib.size > 0); assert.equal(good.terr.occ.size, 0);
  const reps = []; for (let i = 0; i < 130; i++) reps.push(rep(i, ids.map(f => it(f, 'win', 5, 'breakthrough'))));
  const st = simulate(map, reps, T0 + 131 * DAY); finite(st);
  for (const f of ids) assert.equal(st.fronts[f].pos, -100, f);
  assert.ok(st.empire); assert.equal(st.nation.name, 'Platine Confederation'); assert.ok(texts(st).includes('THE PLATINE CONFEDERATION IS RESTORED'));
  for (const f of map.fronts) { assert.ok(st.lines[f.id].ours.length > 0); for (const id of st.lines[f.id].ours) assert.notEqual(map.provinces[id].t, 'URU', f.id + ' holds the far frontier'); }
  // regions: the scenario's word, its own names where it gives them, the plain name where it does not
  assert.ok(st.satrapies.some(x => x.name === 'the Land Between Rivers' && x.region === 'Entre Ríos')); assert.ok(st.satrapies.some(x => x.name === 'Santa Catarina'));
  assert.ok(texts(st).includes('Department of the Land Between Rivers restored (Entre Ríos)')); assert.ok(texts(st).includes('Department of Santa Catarina restored')); assert.ok(texts(st).includes('Department of the Campanha restored'));
  assert.equal(statusOf(-100, map).text, 'Department restored'); assert.match(sitrep(map, st), /The Platine Confederation is restored\. Every department is ours\./);
  // landmarks keep the ids Babylon and Sardis had; the combined one is there too
  assert.ok(st.ach.babylon && st.ach.sardis && st.ach.satrap && st.ach.empire && st.ach.abroad);
  assert.deepEqual(medalOf('babylon', map), { id: 'babylon', name: 'Keys of the Port', desc: 'Enter Buenos Aires', secret: false });
  assert.equal(medalOf('sardis', map).name, 'Conqueror of Porto Alegre'); assert.equal(medalOf('cyrus', map).desc, 'Take Buenos Aires and Porto Alegre within seven days'); assert.equal(medalOf('empire', map).desc, 'Restore the Platine Confederation');
  assert.ok(texts(st).includes('Decoration awarded: Keys of the Port'));
  const emp = st.log.find(l => l.fx.some(x => x.kind === 'empire')); assert.equal(momentOf(emp).title, 'The Platine Confederation is restored'); assert.equal(headlineOf(emp, {}, map), 'The Platine Confederation is restored');
  const sat = st.log.find(l => l.fx.some(x => x.kind === 'satrapy') && !l.fx.some(x => x.kind === 'empire')); assert.match(momentOf(sat).title, /^Department of /);
  assert.match(objective(map, st, CAM).text, /^The Campanha restored$/);
  // Iran's own still read as before
  assert.equal(medalOf('babylon', iran).name, 'Cyrus Cylinder'); assert.equal(medalOf('empire', iran).name, 'Shahanshah'); assert.equal(medalOf('decisive', iran).name, 'Order of Zolfaghar'); assert.equal(medalOf('nowruz', iran).name, 'Haft-Seen');
  assert.equal(medalsFor(iran).length, MEDALS.length); assert.deepEqual(medalsFor(iran).map(m => m[0]), MEDALS.map(m => m[0]));
});

test('a scenario without landmarks or national days simply has no such decorations', () => {
  const bare = { ...map, meta: { name: 'Bareland' } };
  const F = flavor(bare);
  for (const id of ['babylon', 'sardis', 'cyrus', 'nowruz']) assert.equal(medalOf(id, bare), null, id);
  assert.equal(F.empire, 'Greater Bareland'); assert.equal(F.regionWord, 'Province'); assert.equal(F.ranks[0][1], 'Private'); assert.equal(F.days.length, 0); assert.equal(F.south, true, 'guessed from the capital when the scenario does not say');
  const reps = []; for (let i = 0; i < 130; i++) reps.push(rep(i, ids.map(f => it(f, i % 5 ? 'win' : 'loss', 5, i % 5 ? 'breakthrough' : 'naval_defeat'))));
  const st = simulate(bare, reps, T0 + 131 * DAY); finite(st);
  assert.ok(!st.ach.babylon && !st.ach.sardis && !st.ach.cyrus && !st.ach.nowruz); assert.ok(st.log.every(l => l.medals.every(id => medalOf(id, bare))));
  assert.equal(lifetime(st).medalsTotal, medalsFor(bare).filter(m => !m[3]).length); assert.ok(medalProgress(st).every(m => m.name));
  // with a national day, a dispatch on it earns the secret decoration
  const day = simulate(map, [{ id: 'd', ts: new Date(2026, 7, 25, 12).getTime(), items: [it(LIT, 'win', 2, 'offensive')] }], new Date(2026, 7, 26).getTime());
  assert.ok(day.ach.nowruz); assert.ok(!simulate(map, [rep(1, [it(LIT, 'win', 2, 'offensive')])], T0 + 2 * DAY).ach.nowruz);
});

test('every action applies without NaN on every front', () => {
  for (const f of map.fronts) for (const [a, A] of Object.entries(ACTIONS)) {
    const st = simulate(map, [rep(1, [it(f.id, A.side, 3, a)]), rep(2, [it(f.id, A.side, 5, a)])], T0 + 3 * DAY);
    finite(st); const fr = st.fronts[f.id];
    if (A.side === 'win') assert.ok(fr.pos <= 0, `${f.id} ${a}`); if (A.side === 'loss') assert.ok(fr.pos >= 0, `${f.id} ${a}`);
    const foe = enemyForce(map, st, f.id); assert.ok(foe.length >= 2); assert.ok(foe.every(u => /^\d+\w+ (Argentina|Brazil) (Tank|Rifle) Division$/.test(u.name)), foe[0].name);
    for (const s of st.fleets.flatMap(x => x.ships)) assert.ok(Number.isFinite(s.hp)); for (const w of st.wings) assert.ok(Number.isFinite(w.planes));
  }
});

test('geography: ports and fleets where the scenario puts them, and one fleet for both seas', () => {
  const caps = Object.fromEntries(ids.map(id => [id, frontCaps(map, id)]));
  assert.deepEqual(ids.filter(id => caps[id].sea), [PLA, ATL]); assert.ok(caps[PLA].port && caps[ATL].port); assert.equal(caps[QUA].sea, false);
  const land = simulate(map, [rep(1, [it(CAM, 'loss', 3, 'port_strike'), it(QUA, 'win', 3, 'naval_victory'), it(CAM, 'loss', 2, 'naval_defeat')])], T0 + 2 * DAY);
  assert.deepEqual(land.log[0].items.map(i => i.action), [caps[CAM].port ? 'port_strike' : 'rail_cut', 'offensive', 'enemy_offensive'], 'no naval battles on a land front, whatever is reported');
  // victories on either sea commission ships into the same squadron
  const sea = simulate(map, [rep(1, [it(PLA, 'win', 5, 'naval_victory')]), rep(2, [it(ATL, 'win', 5, 'naval_victory')])], T0 + 3 * DAY);
  assert.deepEqual(sea.log.map(l => l.items[0].action), ['naval_victory', 'naval_victory']); assert.equal(sea.fleets.length, 1); assert.equal(sea.fleets[0].ships.length, 4);
  assert.ok(texts(sea).some(t => /commissioned into the River Plate Squadron$/.test(t))); assert.ok(sea.fronts[PLA].sea > 0 && sea.fronts[ATL].sea > 0);
  for (const f of [PLA, ATL]) { const d = simulate(map, [rep(1, [it(f, 'loss', 5, 'naval_defeat')])], T0 + 1.01 * DAY); assert.ok(d.fleets[0].ships.some(s => s.hp < 100), f); assert.ok(d.fronts[f].sea < 0); }
  for (const f of ids.filter(id => caps[id].port)) { const s = simulate(map, [rep(1, [it(f, 'loss', 3, 'port_strike')])], T0 + 2 * DAY).log[0].items[0]; assert.equal(s.action, 'port_strike'); assert.ok(/[P]/.test(map.provinces[s.at].f), f); }
  // Iran keeps its two fleets apart: the Caspian flotilla serves the northern fronts
  const ir = simulate(iran, [rep(1, [it('cau', 'win', 5, 'naval_victory'), it('tks', 'win', 5, 'naval_victory'), it('glf', 'loss', 5, 'naval_defeat')])], T0 + 1.01 * DAY);
  assert.equal(ir.fleets[1].ships.length, 5); assert.ok(ir.fleets[0].ships.some(s => s.hp < 100)); assert.ok(ir.fleets[1].ships.every(s => s.hp === 100));
});

test('weather follows the hemisphere', () => {
  const jan = Date.UTC(2026, 0, 10), jul = Date.UTC(2026, 6, 10);
  assert.equal(weatherOf(map, CAM, jul).kind, 'snow'); assert.equal(weatherOf(map, CAM, jan), null);
  assert.equal(weatherOf(map, ATL, jan).kind, 'heat'); assert.equal(weatherOf(map, ATL, jul), null); assert.equal(weatherOf(map, LIT, jul), null); assert.equal(weatherOf(map, 'south', jul), null);
  assert.equal(weatherOf(iran, 'cau', jan).kind, 'snow'); assert.equal(weatherOf(iran, 'cau', jul), null); assert.equal(weatherOf(iran, 'glf', jul).kind, 'heat');
  const one = (m, f, t) => simulate(m, [{ id: 'w', ts: t, items: [it(f, 'win', 4, 'offensive')] }], t + 1000).fronts[f].pos;
  assert.ok(one(map, CAM, jul) > one(map, CAM, jan), 'the southern winter slows the advance'); assert.ok(one(iran, 'cau', jan) > one(iran, 'cau', jul));
  const cold = t => simulate(map, [{ id: 'w', ts: t, items: [it(CAM, 'loss', 3, 'winter')] }], t + 1000).log[0].fx.map(x => x.text);
  assert.ok(cold(jul).includes('A blizzard closes the roads')); assert.ok(cold(jan).includes('Heat and dust wear the columns down'));
  assert.equal(frontNote(map, simulate(map, [], jul), CAM).text, 'Snow in the passes');
});

test('orders, XP, ranks, the weekly recap and the profile all speak the scenario', () => {
  const labels = { [LIT]: 'Studies', [PLA]: 'Friends' };
  const fresh = simulate(map, [], T0, { labels }); assert.equal(fresh.orders.length, 3);
  for (const o of fresh.orders) { if (o.front) assert.ok(ids.includes(o.front)); assert.ok(orderText(o, labels, map).length > 5); }
  const reps = []; for (let i = 0; i < 40; i++) reps.push(rep(i, [it(ids[i % 7], i % 4 ? 'win' : 'loss', 3, i % 4 ? 'offensive' : 'attrition'), it(ids[(i + 3) % 7], 'win', 2, 'infrastructure')]));
  const st = simulate(map, reps, T0 + 39 * DAY + 1000, { labels }); finite(st);
  assert.ok(st.xp > 1000); assert.equal(st.dayStreak, 40); assert.ok(st.level >= 3); assert.equal(st.commander.title, flavor(map).ranks[st.level - 1][1]); assert.ok(st.log.some(l => l.levelUp && /^(Senior )?(Sargento|Teniente|Capitán)/.test(l.levelUp.title)));
  assert.ok(st.ach.week && st.ach.month && st.ach.ten && st.ach.thirty); assert.ok(st.stats.ordersDone > 10);
  const r = weeklyRecap(map, st, labels); assert.deepEqual(r.perFront.map(f => f.id), ids); assert.equal(r.perFront[0].label, 'Studies'); assert.equal(r.daysActive, 7); assert.equal(r.rankEnd, st.commander.title);
  assert.ok(r.medals.every(n => typeof n === 'string' && n.length)); assert.ok(r.verdict.length > 10);
  const life = lifetime(st); assert.equal(life.rank, st.commander.title); assert.ok(ids.includes(life.favouriteFront.id)); assert.ok(life.medals > 3);
  const next = medalProgress(st); assert.ok(next.length > 3); assert.equal(next.find(m => m.id === 'marshal').desc, 'Reach the rank of Senior General'); assert.ok(!next.some(m => /Sarvan|Sartip|Eran/.test(m.desc)));
  assert.match(sitrep(map, st, labels), /Littoral Front \(Studies\)/); assert.match(sitrep(map, st, labels), /River Plate Theatre \(Friends\)/);
  // three victories running open an operation with one of the scenario's four codenames
  const ops = simulate(map, [1, 2, 3].map(i => rep(i, [it(LAG, 'win', 2, 'offensive')])), T0 + 3.1 * DAY);
  assert.ok(ops.log[2].fx.some(x => /^Operation (Ceibo|Hornero|Pampero|Charrúa) is launched/.test(x.text)));
  // air superiority raises a new wing, numbered after the scenario's own
  const air = simulate(map, Array.from({ length: 4 }, (_, i) => rep(i, [it(LIT, 'win', 5, 'air_superiority')])), T0 + 5 * DAY);
  assert.equal(air.wings.length, 2); assert.equal(air.wings[1].name, '2nd Air Regiment'); assert.ok(air.wings[1].model);
});

test('no scenario is written into the runtime', () => {
  for (const f of ['js/engine.js', 'js/map.js', 'src/core.js', 'src/App.jsx', 'src/parts.jsx', 'src/sheets/fronts.jsx', 'src/sheets/history.jsx', 'src/sheets/report.jsx', 'src/sheets/nation.jsx', 'js/classify.js', 'server/automation.mjs']) {
    const src = fs.readFileSync(new URL(f, root), 'utf8');
    for (const word of ["'IRN'", 'Tehran', 'Isfahan', 'Achaemenid', 'Shah']) assert.ok(!src.includes(word), `${f} still says ${word}`);
  }
  const engine = fs.readFileSync(new URL('js/engine.js', root), 'utf8');
  for (const word of ["'cau'", "'tks'", "'glf'", 'Khorasan', 'Hawker', 'Sarbaz', 'Babylon', 'Nowruz']) assert.ok(!engine.includes(word), `engine.js still says ${word}`);
  for (const f of ['src/core.js', 'src/App.jsx', 'src/parts.jsx', 'src/sheets/fronts.jsx', 'src/sheets/history.jsx', 'src/sheets/report.jsx', 'src/sheets/nation.jsx', 'server/automation.mjs', 'sw.js', 'server.mjs', 'tools/build-map.mjs', 'tools/build-site.mjs']) assert.ok(!fs.readFileSync(new URL(f, root), 'utf8').includes('data/map.json'), `${f} still reads the old single map`);
  assert.ok(!fs.existsSync(new URL('data/map.json', root)));
  // Iran's META is complete: every documented field is there
  for (const k of ['name', 'long', 'empire', 'year', 'blurb', 'pitch', 'flag', 'regionWord', 'regions', 'capitalFalls', 'capitalFreed', 'fightsOnFrom', 'honor', 'commanders', 'oob', 'guard', 'officerNames', 'wings', 'newWingModels', 'fleets', 'shipNames', 'operations', 'enemyOperations', 'nicknames', 'stateStart', 'weather', 'enemyAdjectives', 'ranks', 'landmarks', 'medalNames', 'masthead', 'calendar', 'days', 'motto']) assert.ok(iran.meta[k] != null, `Iran's META.${k}`);
  for (const f of iran.fronts) for (const k of ['honor', 'commanders', 'oob']) assert.ok(iran.meta[k][f.id], `${k}.${f.id}`);
});

test('presets are by slot: the same seven labels on any map', () => {
  const p = PRESETS.find(x => x.id === 'founder') || PRESETS[0];
  const a = applyPreset(p, map), b = applyPreset(p, iran), old = applyPreset(p);
  assert.deepEqual(Object.keys(a.labels), ids); assert.deepEqual(Object.keys(a.notes), ids); assert.deepEqual(Object.values(a.labels), Object.values(b.labels)); assert.deepEqual(Object.values(a.labels), p.slots);
  assert.deepEqual(old, b, 'the old call shape is Iran'); assert.deepEqual(old.labels, p.labels); assert.deepEqual(a.off, []);
  assert.deepEqual(applyPreset({ ...p, off: ['glf', 1] }, map).off, ['atl', 'ent']); assert.deepEqual(applyPreset({ ...p, off: ['glf'] }).off, ['glf']);
  assert.equal(applyPreset(p.id, map).labels[LIT], p.slots[0]); a.labels[LIT] = 'x'; assert.notEqual(p.slots[0], 'x', 'fresh copies');
  for (const q of PRESETS) assert.equal(q.slots.length, 7, q.id);
});

test('the judge is briefed on the chosen country, its fronts and its seas', async () => {
  const labels = applyPreset('general', map).labels, notes = applyPreset('general', map).notes;
  const sys = buildSystem(map, labels, notes);
  assert.match(sys, /drawn as a 1936 grand-strategy war map of Testland\./); assert.doesNotMatch(sys, /Iran|Tehran|Persian/);
  for (const f of map.fronts) assert.ok(sys.includes(`- ${f.id}: ${f.name} (vs ${f.enemyName}) = "${labels[f.id]}"`), f.id);
  assert.match(sys, /Only these have a fleet: pla, atl\./); assert.match(sys, /only these fronts have a port: [a-z, ]*pla[a-z, ]*atl/);
  assert.doesNotMatch(buildSystem(map, labels, notes, [ATL]), /- atl:/);
  assert.match(buildSystem(iran, {}), /war map of Iran\./); assert.match(buildSystem(iran, {}), /Only these have a fleet: cau, tks, glf\./);
  const st = simulate(map, [rep(1, [it(LIT, 'loss', 5, 'enemy_breakthrough')])], T0 + 2 * DAY);
  const user = buildUser(map, st, labels, 'hello'); assert.match(user, /\+100 = Durazno falls/); for (const id of ids) assert.ok(user.includes(`${id} (`));
  // the offline judge, the front suggestion, the assessment and Ask all work on these ids
  const L = { ...Object.fromEntries(map.fronts.map(f => [f.id, f.defaultLabel])) };
  const r = classifyLocal({ map, labels: L, text: 'School is bad, I am failing this class. I had a great talk with my mother. The team at work crushed the launch.' });
  const by = Object.fromEntries(r.items.map(i => [i.front, i])); assert.equal(by[LIT]?.outcome, 'loss'); assert.equal(by[ENT]?.outcome, 'win'); assert.equal(by[CAM]?.outcome, 'win'); assert.match(r.summary, /Littoral Front/);
  assert.equal(classifyLocal({ map, labels: { ...L, [ATL]: 'Guitar' }, text: 'Guitar practice went great.' }).items[0].front, ATL);
  assert.equal(suggestFront({ map, labels: L, text: 'gym session and a long run' }).front, LAG);
  const a = await assess({ map, st, labels: L, off: [] }); assert.match(a.assessment, /School is the weakest sector/); assert.ok(a.orders.every(o => ids.includes(o.front)));
  const reps = [rep(1, [{ ...it(LIT, 'loss', 4, 'enemy_breakthrough'), headline: 'Failed the calculus exam' }]), rep(2, [{ ...it(LAG, 'win', 3, 'offensive'), headline: 'Ran ten kilometres' }])].map(x => ({ ...x, text: x.items[0].headline }));
  const ans = await ask({ map, st: simulate(map, reps, T0 + 3 * DAY), labels: L, question: 'How is school going?', now: T0 + 3 * DAY });
  assert.ok(ans.answer.length > 10); assert.ok(ans.cited.includes('r1'));
});

test('storage: an Iran save from before scenarios migrates untouched', () => {
  const v2 = { v: 2, reports: [{ id: 'a', ts: 1, text: 'x', items: [it('afg', 'win', 2, 'offensive')] }], labels: { afg: 'School' }, notes: { afg: 'n' }, off: ['raj'], ops: [], seen: [], settings: { sound: false }, mode: 'life', onboarded: true };
  const d = store.migrate(JSON.parse(JSON.stringify(v2)));
  assert.equal(d.v, 3); assert.equal(d.scenario, 'iran'); assert.deepEqual(d.campaigns, {});
  for (const k of ['reports', 'labels', 'notes', 'off', 'mode', 'onboarded']) assert.deepEqual(d[k], v2[k], k); assert.equal(d.settings.sound, false);
  assert.ok(Array.isArray(d.reports), 'the server still finds data.reports');
  const b = store.blank(); assert.equal(b.v, 3); assert.equal(b.scenario, 'iran'); assert.deepEqual(b.campaigns, {});
  assert.equal(store.migrate({ reports: [], scenario: '../etc' }).scenario, 'iran'); assert.deepEqual(store.migrate({ reports: [], scenario: 'iran', campaigns: { iran: { reports: [1] }, x: null } }).campaigns, { x: { reports: [], labels: {}, notes: {}, off: [] } });
  // a backup from before scenarios imports as Iran; a new one keeps every campaign
  const imp = store.importData(JSON.stringify(v2)); assert.equal(imp.scenario, 'iran'); assert.equal(imp.reports.length, 1); assert.ok(imp.onboarded);
  assert.throws(() => store.importData(JSON.stringify({ reports: [], campaigns: { x: { reports: [{ nope: 1 }] } } })), /damaged/);
});

test('storage: switching country and back keeps both campaigns', () => {
  const iranIds = iran.fronts.map(f => f.id);
  const d = store.migrate({ v: 2, reports: [{ id: 'a', ts: 1, items: [it('afg', 'win', 2, 'offensive')] }], labels: { afg: 'Studies', glf: 'Me' }, notes: { afg: 'exams' }, off: ['raj'], settings: {}, onboarded: true });
  const before = JSON.parse(JSON.stringify(d));
  store.switchScenario(d, 'testland', iranIds, ids);
  assert.equal(d.scenario, 'testland'); assert.deepEqual(d.reports, []); assert.deepEqual(d.campaigns.iran, { reports: before.reports, labels: before.labels, notes: before.notes, off: before.off });
  // a country played for the first time inherits the life areas slot by slot
  assert.deepEqual(d.labels, { [LIT]: 'Studies', [ATL]: 'Me' }); assert.deepEqual(d.notes, { [LIT]: 'exams' }); assert.deepEqual(d.off, [LAG]); assert.ok(d.onboarded);
  d.reports.push({ id: 't1', ts: 2, items: [it(PLA, 'loss', 3, 'naval_defeat')] }); d.labels[PLA] = 'Mates';
  assert.ok(Number.isFinite(simulate(map, d.reports, 3 * DAY, { off: d.off }).fronts[PLA].pos));
  store.switchScenario(d, 'iran', ids, iranIds);
  assert.equal(d.scenario, 'iran'); for (const k of ['reports', 'labels', 'notes', 'off']) assert.deepEqual(d[k], before[k], k); assert.equal(d.campaigns.iran, undefined);
  assert.equal(d.campaigns.testland.reports[0].id, 't1'); assert.equal(d.campaigns.testland.labels[PLA], 'Mates');
  store.switchScenario(d, 'testland', iranIds, ids);
  assert.equal(d.reports[0].id, 't1'); assert.equal(d.labels[PLA], 'Mates'); assert.equal(d.labels[LIT], 'Studies', 'a campaign that exists is brought back as it was'); assert.equal(d.campaigns.iran.reports[0].id, 'a');
  assert.equal(store.switchScenario(d, 'testland'), d, 'choosing the current country changes nothing');
  // picking a country on a first run leaves no empty campaign behind for the one that was never played
  const first = store.switchScenario(store.blank(), 'testland', iranIds, ids); assert.equal(first.scenario, 'testland'); assert.deepEqual(first.campaigns, {}); assert.deepEqual(first.reports, []);
  // the whole thing survives a round trip through export and import
  const back = store.importData(store.exportData(d)); assert.equal(back.scenario, 'testland'); assert.equal(back.reports[0].id, 't1'); assert.equal(back.campaigns.iran.reports[0].id, 'a');
});

// ---- the server: maps and the automation API follow the stored scenario ----
const PORT = 8147, U = `http://127.0.0.1:${PORT}`;
const clean = Object.fromEntries(Object.entries(process.env).filter(([k]) => !/^(OPENAI_|HOMEFRONT_|LLM_)/.test(k)));
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'homefront-scn-')); let proc;
const json = (p, init) => fetch(U + p, init).then(async r => ({ status: r.status, body: await r.json().catch(() => null) }));
const put = (rev, data) => json('/api/state', { method: 'PUT', body: JSON.stringify({ rev, data }) });
test.before(async () => {
  proc = spawn('node', ['server.mjs'], { cwd: new URL('.', root), env: { ...clean, PORT, HOST: '127.0.0.1', HOMEFRONT_OPEN: '1', HOMEFRONT_PASSWORD: '', HOMEFRONT_DATA_DIR: dir, HOMEFRONT_EXTRA_SCENARIOS: FIXTURES }, stdio: 'ignore' });
  for (let i = 0; i < 60; i++) { try { await fetch(U + '/healthz'); return; } catch { await new Promise(r => setTimeout(r, 100)); } } throw new Error('server did not start');
});
test.after(() => { proc?.kill(); fs.rmSync(dir, { recursive: true, force: true }); });

test('server: every built map is served, and nothing else under data/', async () => {
  const list = (await json('/data/scenarios.json')).body;
  assert.deepEqual(list.map(x => x.id).filter(id => id === 'iran' || id === 'testland'), ['iran', 'testland']); assert.equal(list[0].id, 'iran'); assert.equal(list.find(x => x.id === 'testland').empire, 'Platine Confederation'); assert.equal(list[0].flag.type, 'h3');
  assert.equal((await json('/data/maps/iran.json')).body.home, 'IRN'); assert.equal((await json('/data/maps/testland.json')).body.home, 'URU');
  for (const p of ['/data/map.json', '/data/maps/nope.json', '/data/maps/..%2F..%2Fpackage.json', '/data/maps/testland.mjs', '/data/maps/build.json', '/data/maps/', '/data/', '/tests/fixtures/testland.json', '/data/maps/iran.json/x']) assert.equal((await fetch(U + p)).status, 404, p);
});

test('server: /api/report and /api/sitrep play the country in the saved state', async () => {
  // no state yet, or a state from before scenarios: Iran
  let r = await json('/api/report', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text: 'Good day', front: 'afg', outcome: 'win' }) });
  assert.equal(r.body.ok, true); assert.match(await (await fetch(U + '/api/sitrep')).text(), /Afghan Front/);
  let s = (await json('/api/state')).body; assert.equal(s.data.reports.length, 1); assert.equal(s.data.scenario, 'iran');
  // the app switches to testland: Iran's campaign is put away, the API now files on testland's fronts
  const d = store.migrate(s.data); store.switchScenario(d, 'testland', iran.fronts.map(f => f.id), ids); d.labels[LIT] = 'Studies';
  assert.equal((await put(s.rev, d)).status, 200);
  r = await json('/api/report', { method: 'POST', headers: { 'content-type': 'text/plain' }, body: 'I failed my exam at school. Great gym session.' });
  assert.equal(r.body.ok, true); assert.deepEqual(r.body.items.map(i => [i.front, i.label, i.outcome]), [[LIT, 'Studies', 'loss'], [LAG, 'Health', 'win']]);
  r = await json('/api/report', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text: 'x', front: 'afg', outcome: 'win' }) });
  assert.equal(r.status, 400); assert.equal(r.body.reason, 'bad_front'); assert.deepEqual(r.body.fronts.map(f => f.id), ids);
  const sit = await (await fetch(U + '/api/sitrep')).text(); assert.match(sit, /Littoral Front \(Studies\)/); assert.doesNotMatch(sit, /Afghan|Tehran/);
  s = (await json('/api/state')).body; assert.equal(s.data.scenario, 'testland'); assert.equal(s.data.reports.length, 1); assert.equal(s.data.campaigns.iran.reports.length, 1, 'Iran is intact');
  // the journal records the change of country as one line, not as Iran's reports being deleted
  const j = (await json('/api/journal')).body; assert.equal(j.filter(l => l.op === 'delete').length, 0); assert.deepEqual(j.filter(l => l.op === 'scenario').map(l => [l.from, l.to]), [['iran', 'testland']]);
  assert.equal(j.filter(l => l.op === 'add').length, 2); assert.equal(j.filter(l => l.op === 'add' && l.scenario === 'testland').length, 1);
  // a state that names a country this server has no map of is refused, not mis-filed
  assert.equal((await put(s.rev, { ...s.data, scenario: 'atlantis', reports: [] })).status, 200);
  r = await json('/api/report', { method: 'POST', headers: { 'content-type': 'text/plain' }, body: 'Great gym session.' }); assert.equal(r.status, 400); assert.equal(r.body.reason, 'no_scenario');
  assert.equal((await fetch(U + '/api/sitrep')).status, 400);
});
