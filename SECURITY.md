# Security

## Reporting a vulnerability

Please do not open a public issue for a security problem.

Use GitHub's private reporting instead:
**[Report a vulnerability](https://github.com/sam-siavoshian/hoi4-irl/security/advisories/new)**
(repository → Security → Advisories → Report a vulnerability).

Include what you found, how to reproduce it, and what an attacker could do with it. You should get an
acknowledgement within a week. Fixes for confirmed problems are released as soon as they are ready, and
you will be credited in the advisory unless you prefer otherwise.

Only the latest release and the `main` branch are supported.

## Threat model, in plain words

Home Front is a personal app for **one person**, run on **a machine that person controls**. It is not a
multi-user service and was not designed to face the open internet without something in front of it.

### What the design protects

- **Your model keys stay on the host.** A key is yours: you paste it in Settings → General staff, or put
  it in `.env`. One set in the app is sent to the server once and stored in `ai.json` in the data folder
  (`~/.homefront/ai.json`, mode `0600`, written to a temporary file and renamed into place). From then on
  it is used only for outgoing calls to the provider it belongs to. It is never included in any response:
  the app learns that a key exists and, for one saved in the app, its last 4 characters. A key from `.env`
  cannot be read, shown or removed from the app at all. Keys are not in `state.json`, the journal, the
  dated backups, the app's Export, the server log or the files the service worker caches, and neither
  `.env` nor `ai.json` is a servable path. The tests search every response of a full session, the log and
  every other file in the data folder for the test keys, and fail if one appears.
- **Changing the provider settings needs the session, from the app itself.** `/api/ai` returns `401`
  without the session cookie, and the automation token does not open it. Writes are refused (`403`) when
  the browser reports another site as the sender (`Sec-Fetch-Site`, or `Origin` on older browsers), on
  top of the `SameSite=Lax` cookie. The other write endpoints rely on `SameSite=Lax` alone, as before.
- **A provider's error is summarised.** Providers often quote the key back when they reject it. The
  server replaces that with "The provider rejected the key." and cuts anything key-shaped out of any
  other provider message before it reaches the app, the automation API or the log.
- **A custom address must be `http://` or `https://`**, with no user name or password in it, and only
  the local model and the local speech server have one to set.
- **The password is the lock.** Until a device has logged in, the server returns only the login page,
  `robots.txt` and the icons needed for Home Screen install. The app's code, the map and every API
  endpoint return `401`.
- **Sessions are hard to steal from disk.** A session is a random 256-bit token in an `HttpOnly`,
  `SameSite=Lax` cookie (also `Secure` when the request arrived over HTTPS). Only its SHA-256 hash is
  stored, in `~/.homefront/sessions.json`. Sessions last one year; logging out deletes that device's session.
- **Guessing is slow.** Eight failed logins from one address in ten minutes lock that address out, each
  failure is delayed, and the password comparison is constant-time.
- **Files are allowlisted.** The server serves a fixed set of paths (`index.html`, `sw.js`, `css/*.css`,
  `js/*.js`, `data/scenarios.json`, `data/maps/*.json`, the manifest and icons). There is no directory listing and no way to reach
  `~/.homefront/`, `.env`, `server.mjs` or `package.json` over HTTP.
- **Data files are private to the user.** `~/.homefront/` is created with mode `0700` and its files with
  `0600`. Writes go to a temporary file and are renamed into place.
- **Request sizes are capped**, so a client cannot exhaust memory with one upload.
- **The app keeps out of search engines and frames**: `X-Robots-Tag: noindex`, a deny-all `robots.txt`,
  `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`.
- **The automation token is separate from the password.** `/api/report` and `/api/sitrep` accept only
  `Authorization: Bearer $HOMEFRONT_TOKEN`, and are disabled while no token is set. A leaked token lets
  someone file reports and read the summary; it does not open the app or reveal the key.

### What it does not protect

- **Transport.** The server speaks plain HTTP. Without HTTPS in front of it, the password, the session
  cookie and your reports cross the network in the clear. Put it behind Tailscale, Caddy or another TLS
  terminator for anything beyond `localhost`. See [docs/SELF_HOSTING.md](docs/SELF_HOSTING.md).
- **A weak password on a public address.** If you expose the port to the internet, the password is the
  only lock. Rate limiting slows guessing; it does not make a short password safe. Behind a reverse proxy
  every visitor shares one address, so one attacker can also lock you out for ten minutes at a time.
- **Other users and processes on the host.** Anyone who can read your files as you, or as root, can read
  `.env` and `~/.homefront/`. Data is not encrypted at rest.
- **More than one person.** There are no accounts, roles or per-user data. Everyone with the password
  sees and can change the same campaign.
- **The model provider.** The text of your reports, and your audio if you use voice, is sent to the
  provider you chose. That provider's retention policy applies to it. What leaves the machine, per
  provider:

  | Provider | Sent for judging | Sent for voice | Notes |
  |---|---|---|---|
  | OpenAI | the report text, the current state of the fronts and your last 8 dispatches, to `api.openai.com` | the recording, to the same host | sent with `store: false` |
  | Anthropic | the same text, to `api.anthropic.com` | nothing: Anthropic has no speech-to-text | |
  | Google Gemini | the same text, to `generativelanguage.googleapis.com` | the recording, to the same host | sent with `store: false` |
  | Groq | the same text, to `api.groq.com` | the recording, to the same host | |
  | Mistral | the same text, to `api.mistral.ai` | the recording, to the same host | |
  | OpenRouter | the same text, to `openrouter.ai`, which passes it to the model's host | nothing | OpenRouter's and that host's policies both apply |
  | Local model (Ollama, LM Studio, llama.cpp, any OpenAI-compatible server) | the same text, to the address you set | the recording, to the local speech server you set, if any | on your own machine or network nothing leaves it |
  | Offline judge | nothing | nothing | keywords, on your server |

  The key goes only to its own provider, in that provider's auth header. "On this device" voice uses the
  browser's speech recognition, which in some browsers sends audio to the browser's maker, or the
  keyboard's dictation. Use a local model or the offline judge to keep everything on your machine.
- **Finding local models touches this machine only.** `POST /api/ai/discover` tries a fixed list of
  well-known ports (11434, 1234, 9931, 8080, 8000, 1337, 5000, 5001) on `127.0.0.1` and
  `host.docker.internal`, once each, with a short timeout, and follows no redirect. It is not a network
  scan: every address it may try is checked against that list of hosts before it is contacted, and the
  test suite asserts it. It needs the session and is refused from another site's page, as the other
  `/api/ai` writes are; `GET /api/ai/models`, which calls the configured server, is refused from another
  site too.
- **A custom address is a request the server makes for you.** Whoever is signed in can point a local
  provider at any `http(s)` address the server can reach, and the server will post report text there.
  That person is you; it is one more reason the password matters.
- **A copy of the data folder carries the keys.** `ai.json` is plain text, owner-only. Data is not
  encrypted at rest, so treat a copy of `~/.homefront/` like the keys themselves.
- **A compromised device.** Someone holding your unlocked, logged-in phone has the app.
- **Prompt injection through your own reports.** The judge reads what you write. Its output is forced
  into a strict schema and sanitised (unknown fronts dropped, battle types checked against the outcome),
  so the worst case is an odd battle on your map, which you can delete.
- **`HOMEFRONT_OPEN=1`.** This switches the login off entirely. It exists for a machine nobody else can
  reach. Do not combine it with a public address.

### Sensible setup

1. Choose a long password. It is typed once per device.
2. Keep the server on a private network (a tailnet is the easy route) and serve it over HTTPS.
3. With a proxy or tunnel in front, set `HOST=127.0.0.1` so the port is not reachable directly.
4. Treat `HOMEFRONT_TOKEN` like a password: generate it randomly, and rotate it if a Shortcut or script
   that holds it is shared.
5. Keep `.env` and `~/.homefront/` (which holds `ai.json`, your keys) out of git (they are ignored by
   default) and out of shared folders. Give each provider key a spending limit at the provider.
6. Back up `~/.homefront/`.

## Scope

In scope: anything that lets someone without the password or token read or change the campaign, obtain
the API key, read files outside the allowlist, or take over a session.

Out of scope: attacks that need access to the host's filesystem, a deployment over plain HTTP on an
untrusted network, `HOMEFRONT_OPEN=1`, denial of service by flooding, and the behaviour of third-party
model providers.
