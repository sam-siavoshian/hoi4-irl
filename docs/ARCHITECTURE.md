# Architecture

Home Front has four parts. The engine, map and server run as written; only the interface in `src/` is built (Vite, into `dist/`).

```
            build time                               run time
  ┌──────────────────────────┐      ┌───────────────────────────────────────────────┐
  │ Natural Earth + seeds.mjs│      │ browser                                       │
  │        │                 │      │  app.js ── classify.js ── engine.js ── map.js │
  │   build-map.mjs          │      │    │            │            ▲                │
  │        ▼                 │      │  store.js    voice.js    data/maps/*          │
  │   data/maps/*   ─────────┼─────▶│    │            │                             │
  └──────────────────────────┘      └────┼────────────┼─────────────────────────────┘
                                         │ /api/state │ /api/llm, /api/transcribe
                                    ┌────▼────────────▼────┐        ┌──────────────┐
                                    │ server.mjs           │───────▶│ model        │
                                    │ login · proxy · store│        │ endpoint     │
                                    └────────┬─────────────┘        └──────────────┘
                                             ▼
                                         private/
```

The one idea that holds it together: **the campaign is a list of reports, and everything you see is
computed from that list.**

## 1. The map build

`data/maps/<id>.json` (one per country) is generated, committed, and never edited by hand.

`tools/build-map.mjs` (run with `npm run build:map`):

1. Loads Natural Earth 1:10m country polygons from the `world-atlas` package and simplifies them.
2. Projects them (Mercator) into a 4000-unit-wide map covering the extent set in `tools/seeds.mjs`.
3. Regroups modern countries into their 1936 political entities, as listed in `COUNTRIES` in the seeds
   (the Soviet Union from fifteen-odd modern states, the British Raj, and so on).
4. Scatters seed points with a seeded random generator, builds Voronoi cells (`d3-delaunay`) and clips
   them to the borders (`polygon-clipping`) to make provinces. Because the generator is seeded, the same
   seeds always give the same provinces.
5. Attaches hand-authored geography from `tools/seeds.mjs`: cities with victory points and buildings
   (port, naval base, airbase, supply hub, refinery, fort, capital), terrain, rivers, lakes, railways.
6. For each of the seven fronts, computes the border provinces and the order in which provinces fall, in
   both directions: outwards through the enemy's territory to its objectives, and inwards to the capital.

The output holds provinces (geometry, owner, terrain, centre, city), countries, fronts, rivers, lakes
and railways. The browser, the engine and the tests all read this one file.

`tools/build-icons-js.mjs` does the same kind of job for icons: it extracts only the icons the app uses
from the Game-icons and Lucide sets and writes them into `js/icons.js`.

## 2. The engine and the replay model

`js/engine.js` is a pure module with one main entry:

```js
state = simulate(map, reports, now)
```

It starts from the initial 1936 situation, sorts the reports by time and applies them one after another,
advancing the clock between them (units recover, damage is repaired, quiet fronts let the enemy mass).
It returns the full state: each front's position, territory, divisions, the log with its effects,
decorations, satrapies, totals.

Consequences of doing it this way:

- **Undo, edit and delete are trivial and correct.** Remove a report from the list and replay. There is
  no stored state to patch.
- **Devices agree.** The same reports produce the same war on the phone and on the desktop.
- **The engine is testable under plain Node.** It never touches the DOM, the network or storage.

For this to hold, the replay must be deterministic:

- Randomness comes from a generator seeded with the report's id (`rngFrom(hashStr(rep.id))`), so a given
  report always produces the same battle, the same leading division and the same damage.
- Time comes from the `now` argument and each report's `ts`, never from the clock.

A report looks like this:

```js
{ id, ts, text, summary,
  items: [{ front, outcome, severity, action, reason, headline }] }
```

- `front`: one of `afg`, `cau`, `tks`, `irq`, `raj`, `tur`, `glf`.
- `outcome`: `win`, `loss` or `neutral`. `severity`: 1 to 5.
- `action`: a key of `ACTIONS`, the table of battle types. Each has a side, a movement factor (`adv`), a
  label, a map glyph and `means`, the real-life situation it stands for.

A front's position runs from −100 (every objective taken) through 0 (the border) to +100 (the capital
falls). Severity sets the base movement, the action scales it, and the engine layers the rest on top:
which division leads (by arm of service), experience and honours, named battles at the nearest city,
operations after a run of wins, weather, strikes on buildings where the geography allows them,
satrapies and decorations.

Helpers such as `sitrep`, `objective`, `frontNote`, `territory` and `frontlines` derive what the
interface and the judge need from the state.

## 3. The judge

`js/classify.js` turns free text into report items. There are two judges behind one function,
`classify()`.

### The model judge

- `buildSystem(map, labels, notes, off)` writes the system prompt: the active fronts and the life area
  each stands for (with your own description of each, if you gave one), which fronts have a port or a
  fleet, the severity scale, and the list of battle types with their meanings, generated from `ACTIONS`.
- `buildUser(map, st, labels, text)` adds the current situation on every front, the last few dispatches
  for continuity, and your report.
- `schemaFor(map, off)` is a strict JSON schema: `summary` plus `items[]` with `front`, `outcome`,
  `severity`, `reason`, `action`, `headline` and `days_ago`. The enums are generated from the map and
  from `ACTIONS`, and paused fronts are left out, so the model cannot return a front or type that does
  not exist.

The order of the fields matters. The model must write `reason` ("was ill all week, nobody's fault")
before it picks `action`, and the prompt tells it to choose the type whose meaning matches that reason,
falling back to a plain offensive when nothing specific fits. This is what keeps battle types from being
chosen for colour.

The browser builds the prompt and schema and posts them to the server's `/api/llm`. The server adds the
model name and the key and calls the provider. The result comes back through `sanitize()`, which drops
unknown or paused fronts, forces the action to agree with the outcome and clamps the numbers and string
lengths. The engine applies the geography rules itself (no port strike where there is no port), so a bad
answer cannot break the map. The model's answer is treated as untrusted input.

For reports that arrive through the automation API (`POST /api/report`), the same prompt, schema and
sanitising run on the server, which imports the same modules.

### The offline judge

`classifyLocal()` works with no network: it splits the text into clauses, routes each to a front by
matching your labels and a keyword table per life area, scores positive and negative words (with simple
negation handling), and uses small rule tables to pick a specific battle type when the cause is
recognisable. It is used when the server has no key, and as the fallback, with a visible warning, when a
model call fails.

## 4. The server

`server.mjs` is a single file using only Node's built-ins. In order, a request passes through:

1. **Public paths.** `robots.txt` and the manifest and icons needed to install to the Home Screen.
2. **Login.** `POST /api/login` checks the password (constant-time, throttled per address) and sets a
   session cookie. Only a hash of the session token is stored.
3. **The wall.** Without a valid session, API paths return `401` JSON and the root returns the login
   page, also with status `401`, so the service worker never caches the login page in place of the app.
4. **Authenticated API.** `/api/config`, `/api/state`, `/api/llm`, `/api/transcribe`, `/api/ai`, `/api/logout`.
5. **App files**, from an explicit allowlist.

The model proxy is deliberately thin. `/api/llm` accepts `{system, user, schema}` and makes one
structured-output call to the provider in force. `server/providers.mjs` holds the registry (OpenAI,
Anthropic, Gemini, Groq, Mistral, OpenRouter, a local model, a local speech server, offline), each with a
small default model and one of four ways to be called: OpenAI Responses, OpenAI-compatible Chat
Completions, Anthropic Messages, Gemini Interactions. Every answer is parsed and checked against the
schema on the server, whatever the provider enforced. A local model goes through `server/local.mjs`:
the runtime presets, discovery on loopback only (`POST /api/ai/discover`), model lists
(`GET /api/ai/models`), and structured output negotiated per address and model (strict schema, JSON mode,
plain text), with the answer mended and asked for once more before the offline judge takes over
(`docs/LOCAL_MODELS.md`). `/api/transcribe` forwards raw audio to the speech
model chosen (`/audio/transcriptions`, or Gemini with the recording as input). The choice and the keys
are set in the app through `/api/ai` and kept in `ai.json` in the data folder; `.env` is the fallback
(`server/llm.mjs` reads it). The keys exist only on the server.

Storage is a folder, `~/.homefront/`:

| File | Contents |
|---|---|
| `state.json` | `{rev, saved, data}`: the campaign and its revision number |
| `sessions.json` | hashes of live session tokens and their expiry |
| `journal.ndjson` | append-only record of every change |
| backups | daily copies of the campaign |

Writes go to a temporary file and are renamed into place, so a crash cannot leave a half-written file.

The automation endpoints (`/api/report`, `/api/sitrep`, `/healthz`) sit beside the session-protected
ones and use a bearer token instead of a cookie. See [API.md](API.md).

## 5. Sync

`js/store.js` keeps the campaign in `localStorage` (key `homefront.v1`) so the app works with no server at
all, and mirrors it to the server when there is one.

- On start, the app asks `/api/config` whether a server is present, then pulls `/api/state`. A server
  copy replaces the local one; if the server is empty and the device has reports, the device pushes.
- Every change is saved locally at once and pushed after a short debounce with the revision the device
  last saw.
- The server accepts a `PUT` only if that revision is the current one. Otherwise it answers `409` with
  the newer copy; the device adopts it and shows "Updated from another device."
- If the push fails because the device is offline, the local copy is kept and the push is retried.
- When the app returns to the foreground it pulls again.

This is optimistic concurrency on a single document: last writer to arrive with the right revision
wins. It is the right size for one person with two devices. It is not a merge: two devices that both
add reports while offline will end with one device's version. Device-only settings are never synced.

## 6. The service worker

`sw.js` makes the installed app open offline.

- On install it caches the shell: the page, styles, modules, map data, manifest and icons.
- For same-origin `GET` requests it is **network-first**: fetch, update the cache on success, and fall
  back to the cache only when the network fails. Updates therefore arrive on the next load, with no
  stale-version problem.
- It never touches `/api/` requests or non-`GET` requests.
- Bumping the `CACHE` name removes old caches on activation.

Any new file the browser loads must be added to `SHELL` in `sw.js`, or the installed app will fail
offline.

## 7. The interface

`src/` (a React app; `src/core.js` holds the state and actions) is a thin layer: it calls `simulate`, hands the state to `MapView` (`js/map.js`), renders
the current sheet as HTML, and turns taps and reports into changes to the report list. `MapView` draws
everything on one canvas: provinces by map mode, front lines, divisions with their arm's silhouette,
strikes at the place they hit, and the replay.

## Where to change what

| To change | Edit |
|---|---|
| What a kind of battle does | `ACTIONS` and `applyItem` in `js/engine.js` |
| How the judge reads a report | `buildSystem` in `js/classify.js` |
| What the offline judge recognises | keyword and rule tables in `js/classify.js` |
| Cities, terrain, fronts, railways | `tools/seeds.mjs`, then `npm run build:map` |
| How anything is drawn | `js/map.js` |
| Screens and flows | `src/App.jsx`, `src/sheets/`, `src/core.js`; components and tokens from `vendor/design-system` |
| Login, storage, model calls | `server.mjs` |
