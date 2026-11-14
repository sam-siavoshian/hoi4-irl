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

Rename or pause any of them in Settings.

## How you use it

Three places, one button.

- **The microphone** — say or type what happened and press Send. The staff sorts it by front, decides win or loss and how big,
  dates it ("yesterday I…") and applies it. Undo is one tap. If it cannot tell where something belongs it asks one question.
- **Fronts** — every front with its status, next objective, divisions and a one-tap Win / Loss.
- **History** — a calendar, every entry (edit or delete), and a replay of the whole war on the map.

Tap the flag at the top for the overview (how things are going, the staff's read, what you have earned, share, settings).

Everything else runs by itself in the engine: objectives, repairs, new divisions, commanders, battle names, satrapies
restored under their Old Persian names, decorations, railways.

## Self-hosting (private)

ARTESH runs as one small Node server (`server.mjs`, Node 20+, no dependencies to install). It

- shows nothing but a password box until you log in (one password, remembered per device for a year),
- keeps the OpenAI key on the host — the browser never receives it,
- judges reports with `gpt-6-luna` and transcribes voice with `gpt-transcribe` (both changeable in `.env`),
- stores the campaign in `private/state.json`, so the phone and the desktop show the same war,
- tells search engines to stay away (`noindex`, `robots.txt`).

```bash
cp .env.example .env      # then fill in OPENAI_API_KEY and ARTESH_PASSWORD
npm start                 # http://localhost:8080
```

**On a Mac Mini**

1. Clone the repo, create `.env` as above. `.env` and `private/` are git-ignored; keep them that way.
2. Keep it running with `deploy/com.artesh.server.plist` (launchd; instructions inside the file).
3. Put HTTPS in front of it. The iPhone microphone and "Add to Home Screen" offline mode only work over HTTPS.
   The private option is a tailnet: `tailscale serve --bg 8080` gives an `https://<mac>.<tailnet>.ts.net` address that only
   your own devices can open. With a tunnel or reverse proxy in front, set `HOST=127.0.0.1` in `.env`.
   Do not port-forward it to the open internet unless you accept that the password is then the only lock.
4. On the iPhone: open that address in Safari, log in, then Share → *Add to Home Screen*.

**Back up** `private/state.json` (it is the whole campaign), or use Settings › More › Export backup.

Without `OPENAI_API_KEY` the app still works with a simple offline keyword judge and the keyboard's dictation key.
`npm run serve` is a plain static server with no login and no OpenAI, for development only.

## Development

```bash
npm install
npm test             # engine, classifier and server tests (OpenAI is mocked)
npm run test:e2e     # headless-browser tests at iPhone size (needs Playwright's Chromium)
npm run build:map    # regenerate data/map.json from Natural Earth + tools/seeds.mjs
```

- `js/engine.js` — deterministic war engine; the whole state is replayed from the list of reports, so deleting a report rewinds it.
- `js/map.js` — canvas renderer. `js/classify.js` — prompts, schema and the offline classifier. `js/voice.js` — recording.
- `server.mjs` — login, OpenAI proxy (`/api/llm`, `/api/transcribe`), storage (`/api/state`).
- `tools/seeds.mjs` — cities, states, fronts, terrain, rivers, railways. Borders come from Natural Earth (public domain).
