// What the site's content pages know (site/pages/), read at build time from the same sources the product runs on:
// each country in full (its 1936 setting, fronts, order of battle and the approximations its scenario file admits
// to), the provider registry as the server has it (server/providers.mjs), the engine's battle types (js/engine.js),
// and three entries carried through the engine on three different maps. Nothing here is typed by hand, so a page
// can't drift from the product. Used by vite.site.config.js (`virtual:content-data`) and tools/build-site.mjs.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const UNIT = { inf: 'Infantry', mtn: 'Mountain', cav: 'Cavalry', mot: 'Motorised', arm: 'Armoured', art: 'Artillery', mar: 'Marine', grd: 'Guard' };
const WING = { fighter: 'Fighters', cas: 'Close air support', bomber: 'Bombers' };

// The list under "Approximations …" in a comment of tools/scenarios/<id>.mjs, one entry per bullet.
function approximations(root, id) {
  const file = path.join(root, 'tools', 'scenarios', `${id}.mjs`);
  if (!fs.existsSync(file)) return [];
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  const at = lines.findIndex(l => /^\s*\/\/.*approximations/i.test(l));
  if (at < 0) return [];
  const out = [];
  for (const raw of lines.slice(at + 1)) {
    if (!/^\s*\/\//.test(raw)) break;
    const line = raw.replace(/^\s*\/\/ ?/, '');
    if (/^\s*[-*]\s+/.test(line)) out.push(line.replace(/^\s*[-*]\s+/, '').trim());
    else if (line.trim() && out.length) out[out.length - 1] += ' ' + line.trim();
    else if (out.length) break;
  }
  return out.map(t => t.replace(/`/g, '').replace(/\s+/g, ' '));
}

// How each 1936 state on the map is put together from modern outlines (COUNTRIES in the scenario file).
async function builtFrom(root, id) {
  try {
    const mod = await import(pathToFileURL(path.join(root, 'tools', 'scenarios', `${id}.mjs`)).href);
    return Object.entries(mod.COUNTRIES || {}).filter(([, c]) => Array.isArray(c.from) && c.from.length)
      .map(([tag, c]) => ({ tag, name: c.name, from: c.from.filter(n => !/U\.N\.|Buffer|Dhekelia|Akrotiri|Baikonur|Siachen/.test(n)) }));
  } catch { return []; }
}

export async function contentData(root) {
  const { simulate, ACTIONS, BASE } = await import(pathToFileURL(path.join(root, 'js', 'engine.js')).href);
  const { STEPS, reportsFor, verdictOf } = await import(pathToFileURL(path.join(root, 'site', 'story.js')).href);
  const { PROVIDERS } = await import(pathToFileURL(path.join(root, 'server', 'providers.mjs')).href);
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  const scenarios = JSON.parse(fs.readFileSync(path.join(root, 'data', 'scenarios.json'), 'utf8'));
  const now = Date.UTC(2026, 10, 16, 12); // a fixed day, so two builds of the same sources give the same pages
  const maps = {};
  const countries = [];
  for (const s of scenarios) {
    const map = maps[s.id] = JSON.parse(fs.readFileSync(path.join(root, 'data', 'maps', `${s.id}.json`), 'utf8'));
    const m = map.meta || {};
    const st = simulate(map, [], now);
    const fronts = map.fronts.map(f => {
      const cities = (f.enemyOrder || []).map(([p]) => map.provinces[p]).filter(p => p && p.city && p.vp >= 5);
      const top = new Set([...cities].sort((a, b) => b.vp - a.vp).slice(0, 4).map(p => p.n));
      return {
        id: f.id, name: f.name, enemy: f.enemyName, naval: !!f.naval, label: f.defaultLabel, hq: f.hq || '', restores: f.satrapy || '',
        commander: (m.commanders || {})[f.id] || '',
        objectives: [...new Set(cities.filter(p => top.has(p.n)).map(p => p.n))],
        divisions: st.divisions.filter(d => d.front === f.id).map(d => ({ name: d.name, type: UNIT[d.type] || d.type })),
      };
    });
    countries.push({
      id: s.id, name: s.name, long: s.long, empire: s.empire, year: s.year, blurb: s.blurb || '', flag: s.flag || null,
      capital: map.provinces[map.capital].n, fightsOnFrom: m.fightsOnFrom || '',
      homeStates: map.states.filter(x => x.startsWith(map.home + ':')).length, provinces: map.provinces.length,
      regionWord: m.regionWord || 'Region', regions: Object.keys(m.regions || {}).length, regionNames: Object.values(m.regions || {}).slice(0, 6),
      motto: m.motto || '', ranks: (m.ranks || []).map(([native, english]) => ({ native, english })),
      landmarks: (m.landmarks || []).map(l => ({ medal: l.medal, desc: l.desc })), operations: (m.operations || []).slice(0, 4),
      fronts, land: fronts.filter(f => !f.naval).length, naval: fronts.filter(f => f.naval).length,
      reserve: st.divisions.filter(d => !d.front).map(d => ({ name: d.name, type: UNIT[d.type] || d.type })),
      divisions: st.divisions.length,
      fleets: st.fleets.map(fl => ({ name: fl.name, base: fl.base, sea: fl.sea, ships: fl.ships.map(x => ({ name: x.name, cls: x.cls })) })),
      ships: st.fleets.reduce((n, fl) => n + fl.ships.length, 0),
      wings: st.wings.map(w => ({ name: w.name, type: WING[w.type] || w.type, model: w.model, base: w.base, planes: w.planes })),
      approximations: approximations(root, s.id), builtFrom: await builtFrom(root, s.id),
    });
  }
  // three entries from the landing page's story, each fought on a different country's map, in the engine's own words
  const examples = [];
  for (const [id, step] of [['france', STEPS.length - 1], ['mexico', 0], ['siam', 2]]) {
    const at = STEPS[Math.min(step, STEPS.length - 1)];
    const map = maps[id]; if (!map) continue;
    try {
      const reports = reportsFor(map, now);
      const v = verdictOf(map, simulate(map, reports.slice(0, at + 1), reports[at].ts + 2 * 3600000), ACTIONS);
      examples.push({ country: scenarios.find(s => s.id === id).name, said: reports[at].text, ...v });
    } catch { /* the story changed shape: the page goes without this example */ }
  }
  return {
    version: pkg.version, node: (pkg.engines?.node || '>=20').replace(/[^\d.]/g, ''), license: pkg.license,
    repo: pkg.repository.url.replace(/^git\+/, '').replace(/\.git$/, ''),
    countries, examples, base: BASE.slice(1),
    actions: Object.entries(ACTIONS).map(([id, a]) => ({ id, side: a.side, label: a.label, means: a.means, weight: a.adv })),
    providers: PROVIDERS.map(p => ({
      id: p.id, name: p.name, needsKey: !!p.needsKey, keyOptional: !!p.keyOptional, local: !!p.local, api: p.api || '', base: p.base || '',
      model: p.model || '', stt: p.stt || '', keyUrl: p.keyUrl || '', envKey: (p.envKey || [])[0] || '',
    })),
  };
}
