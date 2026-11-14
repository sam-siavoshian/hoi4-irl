// ARTESH war engine — pure, deterministic. state = simulate(map, reports, now).
// Nothing here touches the DOM, so it runs under node for tests.

export const DAY = 86400000;
export const BASE = [0, 1.2, 2.5, 4, 6.5, 10]; // front movement (points of 100) by severity

export const ACTIONS = {
  // wins
  offensive:        { side: 'win',  adv: 1.0,  label: 'Ground Offensive',     icon: 'arrow' },
  breakthrough:     { side: 'win',  adv: 1.6,  label: 'Armoured Breakthrough', icon: 'armor' },
  encirclement:     { side: 'win',  adv: 1.2,  label: 'Encirclement',          icon: 'pocket' },
  air_superiority:  { side: 'win',  adv: 0.3,  label: 'Air Superiority',       icon: 'air' },
  cas_strike:       { side: 'win',  adv: 0.6,  label: 'Close Air Support',     icon: 'air' },
  naval_victory:    { side: 'win',  adv: 0.6,  label: 'Naval Victory',         icon: 'naval' },
  infrastructure:   { side: 'win',  adv: 0.15, label: 'Construction',          icon: 'build' },
  fortify:          { side: 'win',  adv: 0.1,  label: 'Fortification',         icon: 'fort' },
  reinforce:        { side: 'win',  adv: 0.2,  label: 'Reinforcement',         icon: 'unit' },
  // losses
  enemy_offensive:    { side: 'loss', adv: 1.0,  label: 'Enemy Offensive',       icon: 'arrow' },
  enemy_breakthrough: { side: 'loss', adv: 1.6,  label: 'Enemy Tank Breakthrough', icon: 'armor' },
  encircled:          { side: 'loss', adv: 1.1,  label: 'Divisions Encircled',   icon: 'pocket' },
  enemy_cas:          { side: 'loss', adv: 0.6,  label: 'Enemy Close Air Support', icon: 'air' },
  strategic_bombing:  { side: 'loss', adv: 0.2,  label: 'Strategic Bombing',     icon: 'bomb' },
  port_strike:        { side: 'loss', adv: 0.2,  label: 'Port Strike',           icon: 'naval' },
  supply_hub_bombed:  { side: 'loss', adv: 0.3,  label: 'Supply Hub Bombed',     icon: 'bomb' },
  naval_defeat:       { side: 'loss', adv: 0.5,  label: 'Naval Defeat',          icon: 'naval' },
  attrition:          { side: 'loss', adv: 0.25, label: 'Attrition',             icon: 'unit' },
  // neutral
  skirmish:           { side: 'neutral', adv: 0, label: 'Skirmish',              icon: 'unit' },
};
export const WIN_ACTIONS = Object.keys(ACTIONS).filter(k => ACTIONS[k].side === 'win');
export const LOSS_ACTIONS = Object.keys(ACTIONS).filter(k => ACTIONS[k].side === 'loss');

export const UNIT_TYPES = {
  inf: { name: 'Infantry', short: 'Inf' }, mtn: { name: 'Mountain', short: 'Mtn' }, cav: { name: 'Cavalry', short: 'Cav' },
  mot: { name: 'Motorised', short: 'Mot' }, arm: { name: 'Armoured', short: 'Arm' }, art: { name: 'Artillery', short: 'Art' },
  mar: { name: 'Marine', short: 'Mar' }, grd: { name: 'Imperial Guard', short: 'Grd' },
};
export const RANKS = [[0, 'Green'], [20, 'Trained'], [50, 'Regular'], [100, 'Seasoned'], [180, 'Veteran'], [300, 'Elite']];
export const rankOf = xp => { let r = RANKS[0]; for (const x of RANKS) if (xp >= x[0]) r = x; return r[1]; };
export const rankIndex = xp => { let i = 0; RANKS.forEach((x, k) => { if (xp >= x[0]) i = k; }); return i; };

const START_OOB = {
  afg: ['inf', 'inf', 'cav', 'art'], cau: ['inf', 'inf', 'mtn', 'arm'], tks: ['inf', 'cav', 'inf'], irq: ['inf', 'inf', 'mtn', 'art'],
  raj: ['inf', 'cav', 'inf'], tur: ['inf', 'mtn', 'inf'], glf: ['inf', 'mar', 'inf'],
};
const GROWTH = ['inf', 'art', 'mot', 'arm', 'inf', 'mtn', 'arm', 'mot', 'inf', 'arm'];
const HONOR = {
  afg: ['Khorasan', 'Mashhad', 'Birjand', 'Sistan', 'Toos', 'Nishapur', 'Qaen', 'Torbat', 'Sarakhs', 'Tabas'],
  cau: ['Azerbaijan', 'Tabriz', 'Ardabil', 'Aras', 'Sahand', 'Sabalan', 'Moghan', 'Maragheh', 'Khoy', 'Julfa'],
  tks: ['Gorgan', 'Mazandaran', 'Atrak', 'Bojnurd', 'Hyrcania', 'Shahrud', 'Quchan', 'Damghan', 'Dargaz', 'Alborz'],
  irq: ['Kermanshah', 'Khuzestan', 'Luristan', 'Ahvaz', 'Zagros', 'Kurdistan', 'Dezful', 'Ilam', 'Hamadan', 'Susa'],
  raj: ['Baluchistan', 'Kerman', 'Makran', 'Zahedan', 'Bam', 'Taftan', 'Iranshahr', 'Saravan', 'Jiroft', 'Lut'],
  tur: ['Urmia', 'Maku', 'Mahabad', 'Ararat', 'Salmas', 'Saqqez', 'Sanandaj', 'Zanjan', 'Bijar', 'Qazvin'],
  glf: ['Fars', 'Bushehr', 'Hormuz', 'Shiraz', 'Persepolis', 'Bandar Abbas', 'Lar', 'Qeshm', 'Kharg', 'Lengeh'],
};
const SHIP_NAMES = ['Homa', 'Azarbaijan', 'Khuzestan', 'Gilan', 'Mazandaran', 'Artemiz', 'Damavand', 'Sahand', 'Alvand', 'Zagros', 'Kaveh', 'Rostam',
  'Sohrab', 'Arash', 'Darius', 'Kourosh', 'Xerxes', 'Kambujiya', 'Bahram', 'Shapur', 'Anushirvan', 'Faramarz', 'Zal', 'Siavash'];
const SHIP_CLASSES = ['Gunboat', 'Sloop', 'Destroyer', 'Submarine', 'Destroyer', 'Light Cruiser', 'Submarine', 'Destroyer', 'Heavy Cruiser', 'Light Cruiser', 'Battlecruiser', 'Battleship'];
const ENEMY_NAMES = { AFG: 'Afghan', SOV: 'Soviet', IRQ: 'Iraqi', RAJ: 'British Indian', TUR: 'Turkish', GBR: 'British' };

// Iranian states: starting infrastructure (0-5), civilian factories, military factories, dockyards
const STATE_START = {
  'Tehran': [3, 3, 2, 0], 'Azerbaijan': [2, 1, 1, 0], 'Gilan': [2, 1, 0, 0], 'Mazandaran': [2, 1, 0, 0], 'Kurdistan': [1, 0, 0, 0],
  'Luristan': [1, 0, 0, 0], 'Khuzestan': [3, 1, 0, 1], 'Isfahan': [2, 1, 1, 0], 'Fars': [1, 1, 0, 0], 'Kerman': [1, 0, 0, 0],
  'Baluchistan': [0, 0, 0, 0], 'Khorasan': [1, 1, 0, 0],
};

function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function rngFrom(seed) { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const ord = n => { const s = ['th', 'st', 'nd', 'rd'], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); };
const R = 6371;
export const havKm = (a, b) => { const dLat = ((b[1] - a[1]) * Math.PI) / 180, dLon = ((b[0] - a[0]) * Math.PI) / 180; const s = Math.sin(dLat / 2) ** 2 + Math.cos((a[1] * Math.PI) / 180) * Math.cos((b[1] * Math.PI) / 180) * Math.sin(dLon / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(s)); };

// ---- static indexes derived from the map (cached per map object) ----
const metaCache = new WeakMap();
export function mapMeta(map) {
  let m = metaCache.get(map);
  if (m) return m;
  const P = map.provinces;
  const stateName = i => map.states[i].split(':')[1];
  const iranStates = [...new Set(P.filter(p => p.t === 'IRN').map(p => stateName(p.s)))];
  const buildings = []; // {id, kind, prov, name}
  for (const p of P) if (p.t === 'IRN' && p.f) {
    for (const ch of p.f) {
      const kind = { P: 'port', N: 'naval', A: 'airbase', S: 'hub', R: 'refinery', F: 'fort', C: 'capital' }[ch];
      if (kind && kind !== 'capital') buildings.push({ id: `${kind}:${p.id}`, kind, prov: p.id, name: p.n });
    }
  }
  const frontMeta = {};
  for (const f of map.fronts) {
    const dIr = new Map(f.iranOrder), dEn = new Map(f.enemyOrder);
    // home states: states containing border provinces, ranked by frequency
    const cnt = {};
    for (const id of f.border) { const s = stateName(P[id].s); cnt[s] = (cnt[s] || 0) + 1; }
    const home = Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a]);
    const near = kind => buildings.filter(b => b.kind === kind).map(b => ({ b, d: dIr.has(b.prov) ? dIr.get(b.prov) : 9999 })).sort((a, b) => a.d - b.d).map(x => x.b);
    frontMeta[f.id] = { dIr, dEn, home, ports: near('port'), hubs: near('hub'), airbases: near('airbase'), forts: near('fort') };
  }
  m = { stateName, iranStates, buildings, frontMeta, byName: Object.fromEntries(P.map(p => [p.n, p])) };
  metaCache.set(map, m);
  return m;
}

function initialState(map, t0) {
  const meta = mapMeta(map);
  const st = {
    t: t0, fronts: {}, divisions: [], wings: [], fleets: [], states: {}, bld: {}, log: [], history: [],
    divSeq: 0, infraPoints: 0, railStage: 0, navalMerit: 0, shipSeq: 0, tehranFallen: false, empire: false,
    totals: { wins: 0, losses: 0, neutral: 0, reports: 0 }, recent: [],
  };
  for (const s of meta.iranStates) { const [infra, civ, mil, dock] = STATE_START[s] || [1, 0, 0, 0]; st.states[s] = { infra, civ, mil, dock, dmg: 0, infraDmg: 0, bp: 0 }; }
  for (const b of meta.buildings) st.bld[b.id] = { lvl: b.kind === 'fort' ? 1 : b.kind === 'port' || b.kind === 'naval' ? 2 : 1, dmg: 0 };
  const guard = (type, name) => st.divisions.push({ id: `d${++st.divSeq}`, n: st.divSeq, name, type, front: null, str: 100, org: 100, xp: 60 });
  guard('grd', '1st Imperial Guard Division'); guard('arm', '2nd Guard Armoured Brigade');
  for (const f of map.fronts) {
    st.fronts[f.id] = { id: f.id, pos: 0, air: 0, sea: 0, supply: 100, entrench: 1, enemyStr: 100, streak: 0, merit: 0, wins: 0, losses: 0, last: null, lastT: null, honor: 0, enemyArmor: 0 };
    for (const type of START_OOB[f.id]) raise(st, f.id, type, 0, true);
  }
  st.wings = [
    { id: 'w1', name: '1st Air Regiment', type: 'fighter', model: 'Hawker Fury', base: 'Tehran', planes: 24, max: 24, xp: 20 },
    { id: 'w2', name: '2nd Air Regiment', type: 'cas', model: 'Hawker Hind', base: 'Tabriz', planes: 18, max: 18, xp: 10 },
    { id: 'w3', name: '3rd Air Regiment', type: 'cas', model: 'Hawker Audax', base: 'Mashhad', planes: 18, max: 18, xp: 10 },
    { id: 'w4', name: '4th Air Regiment', type: 'fighter', model: 'Hawker Fury', base: 'Ahvaz', planes: 16, max: 16, xp: 10 },
  ];
  const ship = (name, cls) => ({ name, cls, hp: 100 });
  st.fleets = [
    { id: 'south', name: 'Southern Fleet', base: 'Khorramshahr', sea: 'Persian Gulf', ships: [ship('Babr', 'Sloop'), ship('Palang', 'Sloop'), ship('Shahrokh', 'Gunboat'), ship('Simorgh', 'Gunboat'), ship('Karkas', 'Gunboat'), ship('Shahbaz', 'Gunboat')] },
    { id: 'north', name: 'Caspian Flotilla', base: 'Bandar Pahlavi', sea: 'Caspian Sea', ships: [ship('Shahsavar', 'Imperial Yacht'), ship('Sefidrud', 'Gunboat'), ship('Babolsar', 'Gunboat'), ship('Gorgan', 'Gunboat')] },
  ];
  return st;
}

function raise(st, fid, type, xp = 0, silent = false) {
  const fr = st.fronts[fid];
  const n = ++st.divSeq;
  const honor = HONOR[fid][fr.honor++ % HONOR[fid].length];
  const tn = UNIT_TYPES[type].name;
  const d = { id: `d${n}`, n, name: `${ord(n)} ${honor} ${tn} ${type === 'art' ? 'Brigade' : 'Division'}`, type, front: fid, str: silent ? 100 : 70, org: silent ? 100 : 60, xp };
  st.divisions.push(d);
  return d;
}

// ---- territory ----
export function territory(map, st) {
  const meta = mapMeta(map);
  const occ = new Map(); // iranian prov id → front id (occupied)
  const lib = new Map(); // foreign prov id → front id (liberated)
  const contested = []; // {prov, front, side}
  for (const f of map.fronts) {
    const pos = st.fronts[f.id].pos;
    if (pos > 0) {
      const thr = (pos / 100) * f.dTehran + (pos >= 100 ? 1 : 0);
      let next = null;
      for (const [id, d] of f.iranOrder) { if (d <= thr) { if (!occ.has(id)) occ.set(id, f.id); } else { next = id; break; } }
      if (next != null) contested.push({ prov: next, front: f.id, side: 'iran' });
    } else if (pos < 0) {
      const thr = (-pos / 100) * f.dMax + (pos <= -100 ? 1 : 0);
      let next = null;
      for (const [id, d] of f.enemyOrder) { if (d <= thr) lib.set(id, f.id); else { next = id; break; } }
      if (next != null) contested.push({ prov: next, front: f.id, side: 'enemy' });
    }
  }
  // distance from Tehran to nearest occupied province
  const teh = map.provinces[map.tehran];
  let threat = null;
  for (const [id, fid] of occ) { const d = havKm(teh.ll, map.provinces[id].ll); if (!threat || d < threat.km) threat = { km: Math.round(d), front: fid, prov: id }; }
  return { occ, lib, contested, threat, meta };
}

// frontline provinces: ours (Iran-controlled, touching hostile ground) and theirs
export function frontlines(map, st, terr) {
  const P = map.provinces;
  const { occ, lib } = terr;
  const res = {};
  for (const f of map.fronts) {
    const fm = terr.meta.frontMeta[f.id];
    const iranCtl = p => (p.t === 'IRN' ? !occ.has(p.id) : lib.get(p.id) === f.id);
    const hostile = p => (p.t === 'IRN' ? occ.get(p.id) === f.id : fm.dEn.has(p.id) && !lib.has(p.id));
    const ours = new Set(), theirs = new Set();
    const scan = (id) => { const p = P[id]; if (!hostile(p)) return; for (const a of p.adj) if (iranCtl(P[a])) { ours.add(a); theirs.add(id); } };
    for (const [id] of f.iranOrder) scan(id);
    for (const [id] of f.enemyOrder) scan(id);
    const pos = st.fronts[f.id].pos;
    if (!ours.size && pos < 0) {
      // no land contact: hold the outermost ground taken (all objectives captured, or an overseas beachhead)
      const mine = f.enemyOrder.filter(([id]) => lib.get(id) === f.id).slice(-6).map(([id]) => id);
      for (const id of mine) { ours.add(id); for (const a of P[id].adj) { const q = P[a]; if (q.t !== 'IRN' && !lib.has(a)) theirs.add(a); } }
      if (f.naval && !theirs.size) for (const [id] of f.enemyOrder) if (!lib.has(id) && theirs.size < 6) theirs.add(id);
    }
    if (!ours.size && f.naval) { for (const id of f.border) if (!occ.has(id)) ours.add(id); for (const [id] of f.enemyOrder.slice(0, 8)) if (!lib.has(id)) theirs.add(id); }
    if (!ours.size) for (const id of f.border) if (!occ.has(id)) ours.add(id);
    if (!ours.size) ours.add(map.tehran);
    res[f.id] = { ours: [...ours], theirs: [...theirs] };
  }
  return res;
}

export function statusOf(pos) {
  if (pos <= -100) return { key: 'restored', text: 'Satrapy restored', tone: 'gold' };
  if (pos < -60) return { key: 'deep', text: 'Deep in enemy territory', tone: 'good' };
  if (pos < -25) return { key: 'advancing', text: 'Advancing', tone: 'good' };
  if (pos < -4) return { key: 'across', text: 'Across the border', tone: 'good' };
  if (pos <= 4) return { key: 'holding', text: 'Holding the border', tone: 'neutral' };
  if (pos < 25) return { key: 'breached', text: 'Border breached', tone: 'warn' };
  if (pos < 60) return { key: 'retreat', text: 'In retreat', tone: 'bad' };
  if (pos < 85) return { key: 'collapsing', text: 'Front collapsing', tone: 'bad' };
  if (pos < 100) return { key: 'gates', text: 'Enemy at the gates of Tehran', tone: 'crit' };
  return { key: 'fallen', text: 'Tehran has fallen', tone: 'crit' };
}

// ---- passage of time ----
function advanceTime(map, st, t) {
  const days = Math.max(0, (t - st.t) / DAY);
  if (days <= 0) return;
  const meta = mapMeta(map);
  const civ = Object.values(st.states).reduce((a, s) => a + s.civ * (1 - s.dmg), 0);
  const repair = days * (0.05 + civ * 0.006);
  for (const k in st.bld) st.bld[k].dmg = Math.max(0, st.bld[k].dmg - repair);
  for (const s of Object.values(st.states)) { s.dmg = Math.max(0, s.dmg - repair); s.infraDmg = Math.max(0, s.infraDmg - repair * 2); }
  for (const f of map.fronts) {
    const fr = st.fronts[f.id];
    const hubs = meta.frontMeta[f.id].hubs.slice(0, 2);
    const cap = 100 - hubs.reduce((a, h) => a + st.bld[h.id].dmg * 20, 0);
    fr.supply = fr.supply < cap ? Math.min(cap, fr.supply + days * 4) : cap;
    fr.entrench = Math.min(Math.max(fr.entrench, 5), fr.entrench + days * 0.3);
    fr.enemyStr += (100 - fr.enemyStr) * (1 - Math.pow(0.97, days));
    fr.enemyArmor = Math.max(0, fr.enemyArmor - days * 0.1);
  }
  for (const d of st.divisions) {
    const sup = d.front ? st.fronts[d.front].supply / 100 : 1;
    d.org = Math.min(100, d.org + days * 12 * sup);
    d.str = Math.min(100, d.str + days * 2.5 * sup);
  }
  for (const w of st.wings) w.planes = Math.min(w.max, w.planes + days * 0.4);
  for (const fl of st.fleets) for (const s of fl.ships) s.hp = Math.min(100, s.hp + days * 1.5);
  st.t = t;
}

function normalizeAction(f, item) {
  let a = item.action;
  const side = item.outcome;
  if (side === 'neutral') return 'skirmish';
  if (!ACTIONS[a] || ACTIONS[a].side !== side) a = side === 'win' ? 'offensive' : 'enemy_offensive';
  const hasSea = f.naval || f.id === 'cau' || f.id === 'tks';
  if (!hasSea) { if (a === 'naval_victory') a = 'offensive'; if (a === 'naval_defeat') a = 'enemy_offensive'; if (a === 'port_strike') a = 'supply_hub_bombed'; }
  return a;
}

function applyItem(map, st, item, rnd, fx) {
  const meta = mapMeta(map);
  const f = map.fronts.find(x => x.id === item.front);
  if (!f) return;
  const fr = st.fronts[f.id];
  const fm = meta.frontMeta[f.id];
  const sev = clamp(Math.round(item.severity || 1), 1, 5);
  const action = normalizeAction(f, item);
  const A = ACTIONS[action];
  const divs = st.divisions.filter(d => d.front === f.id);
  const avg = k => (divs.length ? divs.reduce((a, d) => a + d[k], 0) / divs.length : 50);
  const before = fr.pos;
  const note = t => fx.push({ front: f.id, text: t });
  const fleet = st.fleets[f.id === 'cau' || f.id === 'tks' ? 1 : 0];
  item.action = action;

  if (A.side === 'neutral') { fr.last = { action, sev, t: st.t, side: 'neutral' }; fr.lastT = st.t; st.totals.neutral++; for (const d of divs) d.xp += 1; return; }

  if (A.side === 'win') {
    fr.streak = fr.streak >= 0 ? fr.streak + 1 : 1;
    fr.wins++; st.totals.wins++; fr.merit += sev;
    const armor = divs.filter(d => d.type === 'arm' || d.type === 'mot').length;
    let mod = 1 + 0.15 * (avg('str') / 100 - 0.7) + fr.air / 400 + (fr.supply - 70) / 250 - (fr.enemyStr - 100) / 200 + (action === 'breakthrough' ? Math.min(0.3, armor * 0.1) : 0) + (f.naval ? fr.sea / 400 : 0);
    mod = clamp(mod, 0.5, 1.7) * (1 + 0.1 * Math.min(5, fr.streak - 1));
    mod *= fr.pos > 0 ? 1.25 : 1 - 0.55 * (-fr.pos / 100);
    fr.pos = clamp(fr.pos - BASE[sev] * A.adv * mod, -100, 100);
    for (const d of divs) { d.xp += sev * 3; d.org = clamp(d.org - sev * 3 * rnd(), 5, 100); d.str = clamp(d.str - sev * 1.2 * rnd(), 5, 100); }
    fr.enemyStr = clamp(fr.enemyStr - sev * 2, 50, 160);
    if (fr.pos < before - 0.5) fr.entrench = Math.max(0, fr.entrench - 1);
    switch (action) {
      case 'encirclement': fr.enemyStr = clamp(fr.enemyStr - sev * 5, 50, 160); note(`${sev >= 4 ? 'Several' : 'An'} enemy division${sev >= 4 ? 's' : ''} trapped and destroyed`); break;
      case 'cas_strike': fr.enemyStr = clamp(fr.enemyStr - sev * 3, 50, 160); fr.air = clamp(fr.air + sev * 3, -100, 100); break;
      case 'air_superiority': {
        const was = fr.air; fr.air = clamp(fr.air + sev * 8, -100, 100);
        note(`Air superiority ${fr.air >= 0 ? '+' : ''}${Math.round(fr.air)}%`);
        if (was < 40 && fr.air >= 40 && st.wings.length < 14) {
          const base = fm.airbases[0]?.name || 'Tehran'; const n = st.wings.length + 1; const type = n % 3 === 0 ? 'bomber' : n % 2 ? 'cas' : 'fighter';
          st.wings.push({ id: `w${n}`, name: `${ord(n)} Air Regiment`, type, model: { fighter: 'Hawker Hurricane', cas: 'Hawker Hind', bomber: 'Bristol Blenheim' }[type], base, planes: 12, max: 24, xp: 0 });
          note(`${ord(n)} Air Regiment formed at ${base}`);
        }
        break;
      }
      case 'naval_victory': {
        fr.sea = clamp(fr.sea + sev * 8, -100, 100); st.navalMerit += sev;
        note(`Sea control ${fr.sea >= 0 ? '+' : ''}${Math.round(fr.sea)}%`);
        while (st.navalMerit >= 8 * (st.shipSeq + 1) && st.shipSeq < SHIP_NAMES.length) {
          const cls = SHIP_CLASSES[Math.min(SHIP_CLASSES.length - 1, st.shipSeq)], name = SHIP_NAMES[st.shipSeq++];
          fleet.ships.push({ name, cls, hp: 100 }); note(`${cls} ${name} commissioned into the ${fleet.name}`);
        }
        break;
      }
      case 'infrastructure': {
        const cands = fm.home.filter(s => st.states[s]);
        const target = cands.slice().sort((a, b) => st.states[a].infra - st.states[b].infra)[0] || 'Tehran';
        const S = st.states[target];
        const was = Math.floor(S.infra); S.infra = Math.min(5, S.infra + sev * 0.25); S.bp += sev; st.infraPoints += sev;
        if (Math.floor(S.infra) > was) note(`Infrastructure in ${target} upgraded to level ${Math.floor(S.infra)}`);
        while (S.bp >= 6) { S.bp -= 6; if ((S.civ + S.mil) % 3 === 2) { S.mil++; note(`Military factory completed in ${target}`); } else { S.civ++; note(`Civilian factory completed in ${target}`); } }
        for (const s of cands) { st.states[s].dmg = Math.max(0, st.states[s].dmg - sev * 0.2); st.states[s].infraDmg = Math.max(0, st.states[s].infraDmg - sev * 0.3); }
        for (const b of [...fm.hubs.slice(0, 2), ...fm.ports.slice(0, 2)]) st.bld[b.id].dmg = Math.max(0, st.bld[b.id].dmg - sev * 0.25);
        fr.supply = Math.min(100, fr.supply + sev * 5);
        const stage = Math.min(4, Math.floor(st.infraPoints / 12));
        if (stage > st.railStage) { st.railStage = stage; const r = map.railways.filter(x => x.stage === stage).map(x => x.n); if (r.length) note(`Railway opened: ${r.join(', ')}`); }
        break;
      }
      case 'fortify': {
        fr.entrench = Math.min(10, fr.entrench + sev); const fort = fm.forts[0];
        if (fort) { st.bld[fort.id].lvl = Math.min(10, st.bld[fort.id].lvl + (sev >= 3 ? 1 : 0.5)); st.bld[fort.id].dmg = 0; }
        for (const d of divs) d.org = clamp(d.org + sev * 5, 0, 100);
        note(`Entrenchment raised to ${Math.round(fr.entrench)}`);
        break;
      }
      case 'reinforce': {
        if (sev >= 3 && divs.length < 10) { const d = raise(st, f.id, GROWTH[(fr.honor - START_OOB[f.id].length + 20) % GROWTH.length], 10); note(`${d.name} raised`); }
        for (const d of divs) { d.str = clamp(d.str + sev * 6, 0, 100); d.org = clamp(d.org + sev * 6, 0, 100); }
        break;
      }
    }
    // veterans form new divisions as merit accumulates
    const want = START_OOB[f.id].length + Math.floor(fr.merit / 14);
    if (st.divisions.filter(d => d.front === f.id).length < Math.min(10, want) && action !== 'reinforce') {
      const d = raise(st, f.id, GROWTH[(fr.honor - START_OOB[f.id].length + 20) % GROWTH.length], 10); note(`${d.name} raised from veterans of the front`);
    }
  } else {
    fr.streak = fr.streak <= 0 ? fr.streak - 1 : -1;
    fr.losses++; st.totals.losses++;
    let mod = 1 - 0.04 * fr.entrench - 0.15 * (avg('org') / 100 - 0.5) + (100 - fr.supply) / 250 - fr.air / 400 + (fr.enemyStr - 100) / 200 - (f.naval ? fr.sea / 400 : 0);
    mod = clamp(mod, 0.5, 1.6) * (1 + 0.1 * Math.min(5, -fr.streak - 1));
    mod *= fr.pos < 0 ? 1.25 : 1 - 0.5 * (fr.pos / 100);
    fr.pos = clamp(fr.pos + BASE[sev] * A.adv * mod, -100, 100);
    for (const d of divs) { d.xp += sev; d.org = clamp(d.org - sev * (6 + 6 * rnd()), 0, 100); d.str = clamp(d.str - sev * (2 + 5 * rnd()) * (A.adv > 0.5 ? 1 : 0.5), 0, 100); }
    fr.enemyStr = clamp(fr.enemyStr + sev * 2, 50, 160);
    if (fr.pos > before + 0.5) fr.entrench = Math.max(0, fr.entrench - 2);
    switch (action) {
      case 'enemy_breakthrough': fr.enemyArmor = Math.min(4, fr.enemyArmor + 1 + sev / 2); break;
      case 'encircled': {
        const pool = divs.slice().sort((a, b) => a.str - b.str);
        const victim = pool[Math.floor(rnd() * Math.min(2, pool.length))];
        if (victim) { victim.str = sev >= 4 ? 0 : clamp(victim.str - 45, 0, 100); victim.org = 0; note(sev >= 4 ? `${victim.name} encircled` : `${victim.name} cut off and badly mauled`); }
        break;
      }
      case 'enemy_cas': {
        fr.air = clamp(fr.air - sev * 8, -100, 100);
        const w = st.wings.slice().sort((a, b) => b.planes - a.planes)[0]; const lost = Math.min(Math.round(w.planes), Math.round(sev * 1.5 * (0.5 + rnd())));
        if (lost > 0) { w.planes -= lost; note(`${w.name} lost ${lost} aircraft`); }
        note(`Air superiority ${fr.air >= 0 ? '+' : ''}${Math.round(fr.air)}%`);
        break;
      }
      case 'strategic_bombing': {
        const cands = fm.home.filter(s => st.states[s]); if (fr.pos > 50 && !cands.includes('Tehran')) cands.unshift('Tehran');
        const target = cands.slice().sort((a, b) => (st.states[b].civ + st.states[b].mil) - (st.states[a].civ + st.states[a].mil))[0] || 'Tehran';
        const S = st.states[target]; S.dmg = Math.min(1, S.dmg + sev * 0.18); S.infraDmg = Math.min(S.infra, S.infraDmg + sev * 0.35);
        fr.air = clamp(fr.air - sev * 3, -100, 100);
        note(`Factories and railways in ${target} bombed (${Math.round(S.dmg * 100)}% damaged)`);
        break;
      }
      case 'port_strike': {
        const port = fm.ports[0];
        if (port) { const b = st.bld[port.id]; b.dmg = Math.min(1, b.dmg + sev * 0.22); note(`Port of ${port.name} bombed (${Math.round(b.dmg * 100)}% damaged)`); }
        const ships = fleet.ships.filter(s => s.hp > 0);
        const s = ships[Math.floor(rnd() * ships.length)];
        if (s) { s.hp = Math.max(0, s.hp - sev * (12 + 10 * rnd())); if (s.hp <= 0 && fleet.ships.length > 2) { fleet.ships.splice(fleet.ships.indexOf(s), 1); note(`${s.cls} ${s.name} sunk at anchor`); } else note(`${s.cls} ${s.name} damaged`); }
        fr.sea = clamp(fr.sea - sev * 4, -100, 100); fr.supply = Math.max(0, fr.supply - sev * 4);
        break;
      }
      case 'supply_hub_bombed': {
        const hub = fm.hubs[0];
        if (hub) { const b = st.bld[hub.id]; b.dmg = Math.min(1, b.dmg + sev * 0.22); note(`Supply hub at ${hub.name} bombed (${Math.round(b.dmg * 100)}% damaged)`); }
        fr.supply = Math.max(0, fr.supply - sev * 10); note(`Front supply down to ${Math.round(fr.supply)}%`);
        break;
      }
      case 'naval_defeat': {
        fr.sea = clamp(fr.sea - sev * 8, -100, 100);
        const ships = fleet.ships.filter(s => s.hp > 0).sort(() => rnd() - 0.5).slice(0, sev >= 4 ? 2 : 1);
        for (const s of ships) { s.hp = Math.max(0, s.hp - sev * (14 + 8 * rnd())); if (s.hp <= 0 && fleet.ships.length > 2) { fleet.ships.splice(fleet.ships.indexOf(s), 1); note(`${s.cls} ${s.name} sunk`); } else note(`${s.cls} ${s.name} damaged`); }
        note(`Sea control ${fr.sea >= 0 ? '+' : ''}${Math.round(fr.sea)}%`);
        break;
      }
      case 'attrition': for (const d of divs) d.str = clamp(d.str - sev * 2, 0, 100); fr.supply = Math.max(0, fr.supply - sev * 3); break;
    }
    // destroyed divisions
    const mine = st.divisions.filter(d => d.front === f.id);
    for (const d of mine) if (d.str <= 5) {
      if (st.divisions.filter(x => x.front === f.id).length > 1) { st.divisions.splice(st.divisions.indexOf(d), 1); note(`${d.name} destroyed`); }
      else { d.str = 20; d.org = 10; note(`${d.name} shattered — remnants regroup`); }
    }
  }
  fr.last = { action, sev, t: st.t, side: A.side, delta: fr.pos - before };
  fr.lastT = st.t;
  item.delta = Math.round((fr.pos - before) * 10) / 10;
}

function cityNews(map, a, b, fx) {
  const P = map.provinces;
  for (const f of map.fronts) {
    for (const [id] of f.iranOrder) {
      const p = P[id]; if (!p.city || p.vp < 3) continue;
      const was = a.occ.has(id), is = b.occ.has(id);
      if (!was && is && b.occ.get(id) === f.id) fx.push({ front: f.id, text: id === map.tehran ? 'TEHRAN HAS FALLEN' : `${p.n} has fallen to the enemy`, city: id, tone: 'bad' });
      if (was && !is && a.occ.get(id) === f.id) fx.push({ front: f.id, text: `${p.n} liberated`, city: id, tone: 'good' });
    }
    for (const [id] of f.enemyOrder) {
      const p = P[id]; if (!p.city || p.vp < 3) continue;
      const was = a.lib.has(id), is = b.lib.has(id);
      if (!was && is) fx.push({ front: f.id, text: `${p.n} captured`, city: id, tone: 'good' });
      if (was && !is) fx.push({ front: f.id, text: `${p.n} lost to an enemy counter-attack`, city: id, tone: 'bad' });
    }
  }
}

// ---- main entry ----
// reports: [{id, ts, text, summary, items:[{front, outcome, severity, action, headline}]}]
export function simulate(map, reports, now = Date.now()) {
  const sorted = reports.slice().sort((a, b) => a.ts - b.ts);
  const t0 = sorted.length ? Math.min(sorted[0].ts, now) : now;
  const st = initialState(map, t0);
  let terr = territory(map, st);
  for (const rep of sorted) {
    advanceTime(map, st, rep.ts);
    const rnd = rngFrom(hashStr(String(rep.id)));
    const fx = [];
    const items = (rep.items || []).map(i => ({ ...i }));
    const posBefore = Object.fromEntries(map.fronts.map(f => [f.id, st.fronts[f.id].pos]));
    for (const it of items) applyItem(map, st, it, rnd, fx);
    const t2 = territory(map, st);
    cityNews(map, terr, t2, fx);
    for (const f of map.fronts) {
      const a = posBefore[f.id], b = st.fronts[f.id].pos;
      if (a > -100 && b <= -100) fx.push({ front: f.id, text: `Satrapy of ${f.satrapy} restored`, tone: 'gold' });
      const count = m => { let n = 0; for (const v of m.values()) if (v === f.id) n++; return n; };
      const dOcc = count(t2.occ) - count(terr.occ), dLib = count(t2.lib) - count(terr.lib);
      if (dOcc > 0) fx.push({ front: f.id, text: `${dOcc} province${dOcc > 1 ? 's' : ''} lost`, tone: 'bad' });
      if (dOcc < 0) fx.push({ front: f.id, text: `${-dOcc} province${dOcc < -1 ? 's' : ''} liberated`, tone: 'good' });
      if (dLib > 0) fx.push({ front: f.id, text: `${dLib} province${dLib > 1 ? 's' : ''} captured`, tone: 'good' });
      if (dLib < 0) fx.push({ front: f.id, text: `${-dLib} captured province${dLib < -1 ? 's' : ''} lost`, tone: 'bad' });
    }
    const fallen = t2.occ.has(map.tehran);
    if (fallen && !st.tehranFallen) fx.push({ text: 'The government evacuates to Isfahan. The war goes on.', tone: 'bad' });
    if (!fallen && st.tehranFallen) fx.push({ text: 'Tehran is free again. The Shah returns to the capital.', tone: 'gold' });
    st.tehranFallen = fallen;
    const empire = map.fronts.every(f => st.fronts[f.id].pos <= -100);
    if (empire && !st.empire) fx.push({ text: 'THE ACHAEMENID EMPIRE IS RESTORED', tone: 'gold' });
    st.empire = empire;
    terr = t2;
    st.totals.reports++;
    st.log.push({ id: rep.id, ts: rep.ts, text: rep.text, summary: rep.summary, source: rep.source, items, fx });
    st.history.push({ ts: rep.ts, pos: Object.fromEntries(map.fronts.map(f => [f.id, Math.round(st.fronts[f.id].pos * 10) / 10])) });
  }
  advanceTime(map, st, Math.max(now, st.t));
  st.now = now;
  // national figures
  const fl = Object.values(st.fronts);
  const avgPos = fl.reduce((a, f) => a + f.pos, 0) / fl.length;
  const recent = st.log.filter(l => now - l.ts < 14 * DAY).flatMap(l => l.items);
  const rw = recent.filter(i => i.outcome === 'win').reduce((a, i) => a + i.severity, 0), rl = recent.filter(i => i.outcome === 'loss').reduce((a, i) => a + i.severity, 0);
  const S = Object.values(st.states);
  st.nation = {
    stability: Math.round(clamp(55 - avgPos * 0.45 + (rw - rl) * 0.8 - (st.tehranFallen ? 20 : 0), 2, 100)),
    warSupport: Math.round(clamp(50 + fl.reduce((a, f) => a + f.streak, 0) * 3 + (rw - rl) * 0.6 + (avgPos > 30 ? 10 : 0), 2, 100)),
    civ: S.reduce((a, s) => a + s.civ, 0), mil: S.reduce((a, s) => a + s.mil, 0), dock: S.reduce((a, s) => a + s.dock, 0),
    civActive: Math.round(S.reduce((a, s) => a + s.civ * (1 - s.dmg), 0)), milActive: Math.round(S.reduce((a, s) => a + s.mil * (1 - s.dmg), 0)),
    manpower: Math.round(st.divisions.reduce((a, d) => a + (d.type === 'art' || d.name.includes('Brigade') ? 4000 : 11000) * d.str / 100, 0)),
    divisions: st.divisions.length, planes: Math.round(st.wings.reduce((a, w) => a + w.planes, 0)), ships: st.fleets.reduce((a, f) => a + f.ships.length, 0),
    avgPos, name: st.empire ? 'Achaemenid Empire' : 'Imperial State of Iran',
  };
  st.terr = terr;
  st.lines = frontlines(map, st, terr);
  return st;
}

// enemy order of battle on a front (derived, for display)
export function enemyForce(map, st, fid) {
  const f = map.fronts.find(x => x.id === fid), fr = st.fronts[fid];
  const n = clamp(Math.round(2 + fr.enemyStr / 30 + Math.max(0, fr.pos) / 25), 2, 10);
  const arm = Math.min(n - 1, Math.round(fr.enemyArmor + (f.enemy === 'SOV' ? 1 : 0)));
  const out = [];
  for (let i = 0; i < n; i++) out.push({ type: i < arm ? 'arm' : i === n - 1 && n > 3 ? 'art' : f.naval && i % 2 ? 'mar' : 'inf', name: `${ord(i + 1)} ${ENEMY_NAMES[f.enemy]} ${i < arm ? 'Tank' : 'Rifle'} Division` });
  return out;
}

// plain-language situation report, the way you'd say it to friends
export function sitrep(map, st, labels = {}) {
  const lines = [];
  const L = f => labels[f.id] || f.defaultLabel;
  const t = st.terr;
  lines.push(`⚔ SITUATION REPORT — ${new Date(st.now).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}`);
  if (st.empire) lines.push('The Achaemenid Empire is restored. Every satrapy is ours.');
  else if (st.tehranFallen) lines.push('Tehran has fallen. The government fights on from Isfahan.');
  else if (t.threat && t.threat.km < 250) lines.push(`Enemy spearheads are ${t.threat.km} km from Tehran.`);
  for (const f of map.fronts) {
    const fr = st.fronts[f.id], s = statusOf(fr.pos);
    let line = `• ${f.name} (${L(f)}): ${s.text.toLowerCase()}`;
    const occ = [...t.occ.values()].filter(v => v === f.id).length, lib = [...t.lib.values()].filter(v => v === f.id).length;
    if (occ) line += ` — ${occ} province${occ > 1 ? 's' : ''} occupied`;
    if (lib) line += ` — ${lib} province${lib > 1 ? 's' : ''} taken`;
    if (fr.last && st.now - fr.last.t < 3 * DAY) {
      const A = ACTIONS[fr.last.action];
      line += `. Latest: ${A.label.toLowerCase()}${fr.last.sev >= 4 ? ' (heavy)' : ''}`;
    }
    if (fr.streak >= 3) line += `. ${fr.streak} victories in a row`;
    if (fr.streak <= -3) line += `. ${-fr.streak} defeats in a row`;
    lines.push(line + '.');
  }
  lines.push(`Stability ${st.nation.stability}% · War support ${st.nation.warSupport}% · ${st.nation.divisions} divisions in the field.`);
  return lines.join('\n');
}
