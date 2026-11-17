// What the landing page knows before any map has loaded, worked out at build time from the real scenarios and the real
// engine: each country's briefing (its divisions, ships, air wings and seven fronts on its first day) and the one entry
// "How it works" follows, judged and fought on Iran's map. The page imports it as `virtual:site-data`
// (vite.site.config.js), so the nation-select shows a country's numbers at once and fetches its 1 MB map only when the
// country is picked.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export async function siteData(root) {
  const { simulate, ACTIONS } = await import(pathToFileURL(path.join(root, 'js', 'engine.js')).href);
  const { STEPS, reportsFor, verdictOf } = await import(pathToFileURL(path.join(root, 'site', 'story.js')).href);
  const scenarios = JSON.parse(fs.readFileSync(path.join(root, 'data', 'scenarios.json'), 'utf8'));
  const now = Date.UTC(2026, 10, 16, 12); // a fixed day, so two builds of the same sources give the same page
  let example = null;
  const countries = scenarios.map(s => {
    const map = JSON.parse(fs.readFileSync(path.join(root, 'data', 'maps', `${s.id}.json`), 'utf8'));
    const st = simulate(map, [], now);
    if (!example) { // the first country is the one the page opens on
      const reports = reportsFor(map, now); const at = STEPS[STEPS.length - 1];
      example = { said: reports[at].text, ...verdictOf(map, simulate(map, reports.slice(0, at + 1), reports[at].ts + 2 * 3600000), ACTIONS) };
    }
    return {
      id: s.id, name: s.name, long: s.long, empire: s.empire, year: s.year, blurb: s.blurb || '', flag: s.flag || null,
      divisions: st.divisions.length, ships: st.fleets.reduce((n, fl) => n + fl.ships.length, 0), wings: st.wings.length,
      fronts: map.fronts.map(f => ({ id: f.id, name: f.name, enemy: f.enemyName, naval: !!f.naval, label: f.defaultLabel })),
    };
  });
  return { countries, example };
}
