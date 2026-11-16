# Writing a scenario (a playable country)

A scenario is one file, `tools/scenarios/<id>.mjs`. `npm run build:map` turns every scenario into
`data/maps/<id>.json` and lists them in `data/scenarios.json`. Borders come from Natural Earth (modern admin-0
countries, via `world-atlas`); everything else is authored in the scenario file. `tools/scenarios/iran.mjs` together
with `tools/seeds.mjs` is the reference implementation: read both before you start.

```bash
node tools/build-map.mjs <id>        # build one scenario; prints per-front numbers and any PROBLEM lines
node tools/preview-map.cjs <id>      # writes tests/shots/map-<id>.png and map-<id>-home.png — look at them
```

A scenario is done when the build prints no `PROBLEM` lines and the preview looks right: cities where they belong,
every front touching the home country where it should, objective zones a sensible shape, the capital reachable.

## Rules that every scenario must follow

- **Exactly seven fronts.** The app has seven slots. A front is either a land border with one enemy, or a naval
  theatre (`naval: true`). Split a long border in two if you need to (as Iran does with the Soviet border), or
  group several small neighbours into one front.
- **The year is 1936.** Countries are assembled from modern polygons with `from: [...]`, so pick groupings that
  reproduce 1936 states where possible (colonial empires, the Soviet Union, etc.) and say so in `long`. Where modern
  borders cannot reproduce 1936 exactly, prefer the simpler honest approximation and note it in a comment.
- **The home country must be buildable from whole modern countries** (its `from` list).
- **Formable empire.** Each scenario has a historical empire to restore when every objective on every front is
  taken (Iran → Achaemenid Empire). Objectives are the provinces of the modern countries listed in each front's
  `subs`. Choose `subs` so that taking all of them roughly reproduces that empire at its height.
- Coordinates are `[lon, lat]` in degrees. Be accurate to about 0.1°. A city that falls in the sea or the wrong
  country is reported as a PROBLEM.
- Keep everything factual and neutral in tone. No real living people. Commanders and officers get plausible
  period names for the country, not the names of real historical figures.

## Exports

| Export | Meaning |
|---|---|
| `ID` | The file name without `.mjs`. |
| `EXTENT` | `{ lon0, lon1, lat0, lat1 }`: the map rectangle. Must contain the home country with room around it, and every objective zone. Aim for a lon span of 25–55°. Avoid crossing the antimeridian. |
| `HOME` | The home country's tag, e.g. `'FRA'`. |
| `CAPITAL` | Name of the capital city; must be one of the home cities. |
| `COUNTRIES` | `{ TAG: { name, long, color, from: [modern country names], spacing, minIsland? } }` for every country that has land in the extent, including the home one. `from` uses Natural Earth names (run the snippet below to list them). `color` is a muted hex. `spacing` is the province size in degrees: about 0.5–0.9 for the home country (aim for 120–260 home provinces), 0.9–1.3 for enemies with objectives, 1.5–2 for bystanders. Every piece of land in the extent should belong to some country, or it will not be drawn. |
| `HOME_STATES` | `{ 'State name': [[city, lon, lat, victoryPoints, flags], …] }`. 8–14 historical regions of the home country, 60–130 named cities in total. `victoryPoints`: 1 minor, 3 notable, 5 regional centre, 10 major city, 15–20 very large, 30–50 the capital. `flags` (any combination of letters): `C` capital, `P` port, `N` naval base, `A` airbase, `S` supply hub, `R` refinery/oil/heavy industry, `F` fortress. Give the home country roughly 6–10 ports (if it has a coast), 2–4 naval bases, 6–10 airbases, 8–10 supply hubs spread so each front has one nearby, 8–15 forts along the borders, 1–3 `R`. |
| `FOREIGN` | `{ TAG: { 'Region name': [[city, lon, lat, vp], …] } }`. Cities for every other country: 10–40 for each enemy with objectives (the regions become restorable "provinces of the empire", so name regions historically), a handful for bystanders. A country with no cities still gets provinces. |
| `FRONTS` | Seven of `{ id, name, enemy, enemyName, subs, defaultLabel, satrapy, hq, naval?, coast?, coastKm?, box? }`. `id`: 3 lowercase letters, unique. `name`: e.g. `'Rhine Front'`. `enemy`: tag (used for colour and unit names). `subs`: modern country names forming this front's objective zone; the same modern country must not appear in two fronts unless you separate them with `box: [lon0, lat0, lon1, lat1]`. `defaultLabel`: leave as one of `'School', 'Family', 'Partner', 'Work', 'Health', 'Friends', 'Self'` in that order across the seven fronts. `satrapy`: name of what is restored when the whole zone is taken (e.g. `'the Rhineland & Westphalia'`). `hq`: a home city. Naval fronts: `naval: true` plus `coast`, a polyline of `[lon, lat]` points drawn along the stretch of the HOME coast that faces this sea (home coastal provinces within `coastKm`, default 70, of the line become the front's border); their objectives are ordered by distance across the water. |
| `RANGES`, `DESERTS`, `FORESTS`, `MARSHES` | Terrain, same shapes as in `tools/seeds.mjs` (ranges are polylines with a half-width in degrees; the others are ellipses `[lon, lat, rx, ry, name?]`). Cover the home country carefully and the neighbours roughly. |
| `LAKES`, `RIVERS` | `{ name, pts: [[lon, lat], …] }`. Major ones only; 6–15 rivers with 5–12 points each, traced with care. Lakes are closed outlines. Inland seas that Natural Earth already cuts out of the land (Caspian, Black Sea) need no lake. |
| `RAILWAYS` | `{ name, stage, via: [city names or [lon, lat] points] }`. `stage: 0` = existed in 1936; `1`–`4` = built later as the player's infrastructure grows. 8–12 lines linking home cities. Every named city must exist in `HOME_STATES`. |
| `SEA_LABELS` | `[text, lon, lat, size, rotation?]`. |
| `COUNTRY_LABELS` | `[tag, 'TEXT', lon, lat, size]` for the big neighbours. |
| `HOME_LABEL` | `[lon, lat]` where the home country's name is written. |
| `EMPIRE` | Outline polygon `[[lon, lat], …]` of the historical empire at its height (drawn as a dashed overlay). Keep it inside the extent. |
| `FLEET_AT` | `{ '<fleet id>': [lon, lat], 'enemy:<front id>': [lon, lat] }`: where fleet counters sit, in open water. One entry for each of the home fleets in `META.fleets` and one `enemy:` entry for each naval front. |
| `META` | Flavour used by the game; see below. |

List the modern country names available in your extent:

```bash
node -e "const t=require('world-atlas/countries-10m.json');const {feature}=require('topojson-client');for(const f of feature(t,t.objects.countries).features)console.log(f.properties.name)" | sort
```

## META

Everything the engine and interface say about the country. All fields are required unless marked optional.

```js
export const META = {
  name: 'Iran',                          // short name shown in the top bar
  long: 'Imperial State of Iran',        // formal 1936 name
  empire: 'Achaemenid Empire',           // what the country becomes when every objective is taken
  year: 1936,
  blurb: 'Seven borders from the Caucasus to the Gulf. Restore the empire of Cyrus.',   // one line for the country picker
  pitch: 'a 1936 grand-strategy war map of Iran',                                         // completes "a personal life tracker drawn as …"
  flag: { type: 'h3', colors: ['#3f9467', '#efeadb', '#cf4a39'], disc: '#e3b85c' },   // h3 | v3 (three bands, horizontal or vertical); optional `disc` colour for a centre emblem
  regionWord: 'Satrapy',                 // what a restored region is called: "Satrapy of Babirush restored"
  regions: { 'Mesopotamia': 'Babirush', … },   // FOREIGN region name → the name it had under the empire (optional per region; falls back to the region name)
  capitalFalls: 'The government evacuates to Isfahan. The war goes on.',
  capitalFreed: 'Tehran is free again. The Shah returns to the capital.',
  fightsOnFrom: 'Isfahan',               // a home city
  honor: { afg: ['Khorasan', 'Mashhad', …10 names], … },     // per front: place names used to name its divisions ("3rd Khorasan Infantry Division")
  commanders: { afg: 'Gen. Dariush Khorasani', … },           // per front: an invented period-plausible commander ("Adm." for naval fronts)
  oob: { afg: ['inf', 'inf', 'cav', 'art'], … },              // per front: 3–4 starting divisions. Types: inf, mtn, cav, mot, arm, art, mar. Keep armour rare in 1936 (1–2 in the whole army) and fit the terrain (mtn on mountain fronts, mar on naval ones).
  guard: [['grd', '1st Imperial Guard Division “Javidan”'], ['arm', '2nd Guard Armoured Brigade']],   // the capital garrison
  officerNames: { first: [16 given names], last: [16 surnames], ranks: { div: 'Brig. Gen.', bde: 'Col.', guard: 'Maj. Gen.' } },   // invented, period-plausible
  wings: [{ name: '1st Air Regiment', type: 'fighter', model: 'Hawker Fury', base: 'Tehran', planes: 24 }, …4],   // type: fighter | cas | bomber; real aircraft the country flew in 1936; base is a home city with an airbase
  newWingModels: { fighter: 'Hawker Hurricane', cas: 'Hawker Hind', bomber: 'Bristol Blenheim' },
  fleets: [{ id: 'south', name: 'Southern Fleet', base: 'Khorramshahr', sea: 'Persian Gulf', fronts: ['glf', 'irq', 'raj'], ships: [['Babr', 'Sloop'], …] }, …],   // 1–2 fleets; `fronts` lists which fronts' naval events use this fleet; real 1936 ship names where the navy had them; a landlocked country still needs one small river or lake flotilla
  shipNames: [24 names for ships commissioned later],
  operations: [16 codenames for the player's operations],        // drawn from the country's history and myth
  enemyOperations: [12 codenames for enemy operations],
  nicknames: ['Lions', 'Falcons', …8],                            // veteran divisions earn "Lions of Khorasan"
  stateStart: { 'Tehran': [3, 3, 2, 0], … },                      // per HOME state: [infrastructure 0–5, civilian factories, military factories, dockyards]; modest totals for a regional power (about 8–20 civilian, 3–8 military), more for a great power
  weather: { cau: 'snow', glf: 'heat', … },                       // per front, optional: 'snow' (hard winters, Dec–Feb in the north) or 'heat' (hard summers, Jun–Aug). Southern-hemisphere scenarios add `south: true` to flip the months.
  enemyAdjectives: { AFG: 'Afghan', SOV: 'Soviet', … },           // per enemy tag, for unit names
  ranks: [['Sarbaz', 'Private'], … 12 pairs],                     // the player's own rank ladder, lowest to highest, in the country's language with an English gloss
  landmarks: [{ city: 'Babylon', medal: 'Cyrus Cylinder', desc: 'Enter Babylon' }, { city: 'Sardis', medal: 'Royal Road', desc: 'Reach Sardis, the western end of the Royal Road' }],   // exactly two foreign objective cities with a decoration each
  medalNames: { week: 'Order of Homayoun', ten: 'Order of the Lion and Sun', … },   // optional: country-flavoured names for decorations, by id (see MEDALS in js/engine.js)
  masthead: "ETTELA'AT-E ARTESH",        // newspaper share card masthead, in the spirit of a period paper
  calendar: 'persian',                   // optional: an Intl calendar id to show a second date ('persian', 'hebrew', 'islamic-umalqura', 'ethiopic', 'japanese', 'buddhist'…)
  days: [{ month: 3, day: 21, text: 'Nowruz Pirouz. A new year on every front.' }, …],   // optional: 2–4 greetings on Gregorian dates
  motto: 'adam Kūruš, xšāyaθiya — “I am Cyrus, the king.”',   // easter egg line
};
```
