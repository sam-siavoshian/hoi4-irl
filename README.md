# ARTESH — Life Front Command

A grand-strategy war map of your own life. Iran with its 1936 borders; every border is one part of your life.
Say what happened today, and the general staff turns it into battles: fronts advance or collapse, divisions gain
experience or get mauled, ports and supply hubs are bombed and rebuilt. Do well everywhere and you restore the
Achaemenid Empire; let things slide and the enemy reaches Tehran.

It is a tracker, not a game — nothing happens unless you report it (apart from units recovering and damage being repaired over time).

| Front | Enemy | Default meaning |
|---|---|---|
| Afghan Front | Afghanistan | School |
| Caucasus Front | Soviet Union | Family |
| Turkestan Front | Soviet Union | Girlfriend |
| Mesopotamian Front | Iraq | Startup |
| Baluchistan Front | British Raj | Gym & Health |
| Anatolian Front | Turkey | Friends & Social |
| Persian Gulf Theatre | Royal Navy | Personal Life |

Rename any of them in **Staff › Settings**, describe what belongs to each (the judge reads it), or sign an armistice to switch a front off.

## What is in it

- **Report** by voice or text; one report can hold several events, each on its own front and its own day ("yesterday I…").
  Or log by hand in two taps. Everything is reviewed before it is applied, and can be edited, undone or deleted later.
- **Fronts** move province by province. Divisions, air regiments, fleets, factories, ports, supply hubs and railways all react.
- **Main effort** — pick the front that matters most right now; wins there go further.
- **Operations** — a codename, an objective city and a deadline, pinned on the map.
- **Chronicle** — calendar heat-map, day streak, filters, and a replay of the whole war on the map.
- **Briefing** — the week's movement, an honest assessment with orders from the chief of staff (Claude, or a simple offline version),
  a shareable text report and a shareable map image.
- **Commanders** earn traits, big engagements get battle names, regions you fully retake are restored as satrapies under
  their Old Persian names, and there are sixteen decorations to earn.

## Run it

It is a static site with no build step.

```bash
npm run serve        # http://localhost:8080
```

**Hosting:** push to `main` and enable *Settings › Pages › Source: GitHub Actions* (the workflow in
`.github/workflows/pages.yml` publishes it), or drop the folder on any static host (Netlify, Vercel, Cloudflare Pages).
It must be served over HTTPS for the microphone and offline mode to work.

**iPhone:** open the URL in Safari → Share → *Add to Home Screen*. It opens full-screen and works offline.

## Judgement and voice

- **Claude (recommended):** paste a Claude API key in Staff › Settings. Reports are classified by Claude straight from
  the browser (default model `claude-opus-5-5`, changeable). The key is stored only on the device.
- **No key:** a simple offline keyword classifier is used. You always review and can edit the result before it is applied.
- **Voice:** uses the browser's speech recognition where available. iOS home-screen apps sometimes refuse it — in that
  case use the microphone key on the keyboard, or add an ElevenLabs key in Settings to record and transcribe with Scribe.

## Data

Everything is stored in `localStorage` on the device. Use **Staff › Backup › Export** regularly; a Safari tab and the
home-screen app keep separate storage, so export/import to move between them.

## Development

```bash
npm install
npm test             # engine + classifier unit tests
npm run test:e2e     # headless-browser tests at iPhone size (needs Playwright's Chromium)
npm run build:map    # regenerate data/map.json from Natural Earth + tools/seeds.mjs
```

- `js/engine.js` — deterministic war engine; the whole state is replayed from the list of reports, so deleting a report rewinds it.
- `js/map.js` — canvas renderer. `js/classify.js` — Claude + offline classifier. `js/voice.js` — dictation.
- `tools/seeds.mjs` — cities, states, fronts, terrain, rivers, railways. Borders come from Natural Earth (public domain).
