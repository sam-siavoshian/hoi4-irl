# Changelog

Notable changes to Home Front. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and versions follow [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [1.1.0] - 2026-11-16

The step from a personal tool to something anyone can self-host.

### Changed

- **Renamed to Home Front.** The project was called ARTESH. Settings named `ARTESH_*` are still read, and a
  browser with a saved campaign keeps it.
- **Data lives outside the source folder.** New installs store everything in `~/.homefront`; an install
  that already has `./private` keeps using it.
- **New interface.** Rebuilt as a React app on a vendored design system (`vendor/design-system`): light,
  dark and automatic appearance, a side panel on desktop, bottom sheets on a phone. The engine, map and
  server are unchanged. There is now a build step: `npm start` builds `dist/` when needed.

### Added

- **Long voice reports.** A recording runs up to 10 minutes with a running clock, keeps going while the
  screen stays on, and stops with a note if the microphone is lost or the app is hidden. Pressing Send while
  recording sends as soon as the words are in. A failed transcription keeps the audio, with a Retry button.
- **Transcription hints.** The fronts and the names used in earlier reports go with each recording, so they
  are spelled the same way every time. A provider that refuses hints gets one plain retry.
- **Every event keeps its details**, not just the headline: shown under each event, under "What you said"
  in History, and editable. Long reports no longer get cut off (judges have room for 16000 output tokens).
- **Crash-safe storage.** Saves are flushed to disk before they replace the old file; an unreadable campaign
  is restored from the newest good backup at start, and `/healthz` fails when the campaign cannot be read
  or the data folder cannot be written. The server stops cleanly on SIGTERM.
- **Mac service** (`deploy/install-macos.sh`): the server and a watchdog as LaunchDaemons that start at
  boot with nobody logged in, restart a stuck server, keep the private tailnet address and trim logs.
- **Country selection screen.** A full-screen "choose your country" step on first run and in Settings:
  the live map changes behind as you browse, with each nation's forces and seven fronts laid out.
- **Setup skill for coding agents** (`.claude/skills/setup-home-front`, `AGENTS.md`): install, verify,
  background service, HTTPS for a phone, backups and updates, asking before each system change.
- **Your own key, set in the app, and more providers.** Settings → General staff chooses who judges your
  reports: OpenAI, Anthropic, Google Gemini, Groq, Mistral, OpenRouter, Ollama, LM Studio, any other
  OpenAI-compatible server, or the offline judge. Paste your own key, press Test, and it works without a
  restart. Each provider starts on its small, cheap model (`gpt-6-luna`, `claude-haiku-5-5`,
  `gemini-3.5-flash-lite`, `openai/gpt-oss-20b`, `mistral-small-latest`), since judging a day needs no
  frontier model. Voice is chosen apart from the judge: the same provider when it can turn speech into
  text (Whisper on Groq, Voxtral on Mistral, Gemini itself), another provider with its own key, or the
  device. A first run offers the screen as an optional step.
- **Keys stay on your server.** They are stored in `ai.json` in the data folder (mode `0600`) and never
  sent back: the app sees only that a key exists and its last 4 characters. New endpoints: `GET` and
  `PUT /api/ai`, `DELETE /api/ai/key/<provider>`, `POST /api/ai/test`. `.env` remains the fallback, so
  existing installs keep working untouched; a key from `.env` shows as "set on the server".
- Provider marks from Simple Icons (CC0) where the project may ship them; a plain icon for OpenAI and Groq.

- **Eight countries.** Iran, Turkey, Greece, France, Ethiopia, Siam, Peru and Mexico, each with its own
  1936 map, seven fronts, order of battle, fleets, air wings, commanders, ranks, decorations and an
  empire to restore. Choose on first run or in Settings; each country keeps its own campaign. A country
  is one file in `tools/scenarios/` (`docs/SCENARIOS.md`).

- **Model providers.** Any OpenAI-compatible endpoint through `OPENAI_BASE_URL` (Ollama, LM Studio,
  OpenRouter, Groq), with a chat-completions fallback (`LLM_API=chat`) for servers without the Responses
  API. OpenAI remains the default (`gpt-6-luna` judge, `gpt-transcribe` voice). The offline keyword judge
  still covers the case of no key at all.
- **Persona presets** on first run (Student, Founder, Athlete, Creator, Parent and more) that name the
  fronts for you. Everything stays renameable, and fronts can be paused.
- **Journal and backups.** An append-only journal of every change (`~/.homefront/journal.ndjson`) and daily
  backups of the campaign.
- **Automation API.** Token-authenticated `POST /api/report` (plain text in, judged on the server, map
  updated) for iOS Shortcuts, Siri, scripts and cron; `GET /api/sitrep`; `GET /healthz`. A small
  command-line client, `bin/homefront.mjs`.
- **Progress.** Commander XP and ranks, three daily "orders of the day", combos for reporting several
  fronts in one day, 30+ decorations and a weekly recap.
- **Feedback.** Synthesised sound effects, confetti and sparks, screen shake, haptics and number
  roll-ups. All optional; all respect reduced-motion.
- **Shareable images.** A daily bulletin card, a newspaper front page for big events and a weekly recap
  card.
- **Ask the staff.** Question answering over your own history.
- **Landing page and offline demo** (`site/`), deployed to GitHub Pages.
- **Docker.** `Dockerfile`, `docker-compose.yml` and `npm run docker`.
- **Project files.** MIT licence, third-party notices, contributing guide, code of conduct, security
  policy, issue and pull request templates, CI (unit, server and browser tests), and documentation for
  architecture, self-hosting, the HTTP API and common questions.

### Changed

- README rewritten for a general audience. The self-hosting section moved to `docs/SELF_HOSTING.md`.
- `package.json` gained licence, repository, keywords, homepage and a `bin` entry.

## 1.0.0 - 2026-11-15

The first complete version: a private, self-hosted life tracker drawn as a 1936 grand-strategy map of
Iran.

### The map and the engine

- A generated map (`data/map.json`) built from Natural Earth borders regrouped into their 1936 shape,
  cut into provinces, with hand-authored cities, terrain, rivers, lakes and railways.
- Seven fronts, each standing for one area of life, that advance or retreat province by province between
  the enemy's objectives and Tehran.
- A pure, deterministic engine: the whole state is replayed from the list of reports, so deleting or
  editing an entry rewinds the war correctly.
- 29 battle types, each tied to a real-life meaning. Events respect geography: port strikes only where
  there is a port, naval battles only where there is sea, every strike drawn where it hit.
- Named divisions with commanders, experience, ranks, battle honours and nicknames. The right arm of
  service leads each kind of battle and pays for defeats.
- Named battles, operations after three wins in a row, a main effort, weather that follows the calendar,
  quiet fronts where the enemy masses, bombing damage and repairs over time, new divisions and ships.
- Satrapies restored under their Old Persian names, 16 decorations, and the restoration of the
  Achaemenid Empire when every objective is taken.

### Reporting

- Speak or type what happened and press Send. An LLM judge splits the report into events and returns,
  under a strict JSON schema, the front, win or loss, severity, the reason, the matching battle type, a
  headline and how many days ago it happened.
- The battle type follows from a stated reason, with a plain offensive as the fallback.
- An offline keyword judge for use without a key, and as the fallback when the model call fails.
- Voice: recording transcribed on the server, the browser's speech recognition, or the keyboard's
  dictation key, whichever is available.
- One question when a report is unclear, one-tap Win / Loss per front, and one-tap undo.

### The app

- Three places: the microphone, Fronts and History (calendar, edit, delete, replay of the whole war).
- An overview with the staff's assessment, decorations, share and settings. Fronts can be renamed,
  described and paused.
- Division and province pages, map layers, export and import of backups.
- Installs to the iPhone Home Screen and opens offline (service worker, network-first).
- Icons from Game-icons.net (units and buildings) and Lucide (interface).

### The server

- One dependency-free Node file. Password wall with year-long per-device sessions and login throttling.
- The OpenAI key stays on the host; judging and transcription are proxied.
- The campaign is stored in `~/.homefront/state.json` with a revision check, so the phone and the desktop
  show the same war and cannot silently overwrite each other.
- `noindex` headers and a deny-all `robots.txt`.
- Tests for the engine, the classifier and the server, and end-to-end browser tests at iPhone size.

[Unreleased]: https://github.com/sam-siavoshian/hoi4-irl/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/sam-siavoshian/hoi4-irl/releases/tag/v1.1.0
