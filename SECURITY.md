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

ARTESH is a personal app for **one person**, run on **a machine that person controls**. It is not a
multi-user service and was not designed to face the open internet without something in front of it.

### What the design protects

- **The API key stays on the host.** The key is read from `.env` or the environment by `server.mjs` and
  used only for outgoing calls to the model endpoint. It is never included in any response, and `.env` is
  not a servable path.
- **The password is the lock.** Until a device has logged in, the server returns only the login page,
  `robots.txt` and the icons needed for Home Screen install. The app's code, the map and every API
  endpoint return `401`.
- **Sessions are hard to steal from disk.** A session is a random 256-bit token in an `HttpOnly`,
  `SameSite=Lax` cookie (also `Secure` when the request arrived over HTTPS). Only its SHA-256 hash is
  stored, in `private/sessions.json`. Sessions last one year; logging out deletes that device's session.
- **Guessing is slow.** Eight failed logins from one address in ten minutes lock that address out, each
  failure is delayed, and the password comparison is constant-time.
- **Files are allowlisted.** The server serves a fixed set of paths (`index.html`, `sw.js`, `css/*.css`,
  `js/*.js`, `data/map.json`, the manifest and icons). There is no directory listing and no way to reach
  `private/`, `.env`, `server.mjs` or `package.json` over HTTP.
- **Data files are private to the user.** `private/` is created with mode `0700` and its files with
  `0600`. Writes go to a temporary file and are renamed into place.
- **Request sizes are capped**, so a client cannot exhaust memory with one upload.
- **The app keeps out of search engines and frames**: `X-Robots-Tag: noindex`, a deny-all `robots.txt`,
  `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`.
- **The automation token is separate from the password.** `/api/report` and `/api/sitrep` accept only
  `Authorization: Bearer $ARTESH_TOKEN`, and are disabled while no token is set. A leaked token lets
  someone file reports and read the summary; it does not open the app or reveal the key.

### What it does not protect

- **Transport.** The server speaks plain HTTP. Without HTTPS in front of it, the password, the session
  cookie and your reports cross the network in the clear. Put it behind Tailscale, Caddy or another TLS
  terminator for anything beyond `localhost`. See [docs/SELF_HOSTING.md](docs/SELF_HOSTING.md).
- **A weak password on a public address.** If you expose the port to the internet, the password is the
  only lock. Rate limiting slows guessing; it does not make a short password safe. Behind a reverse proxy
  every visitor shares one address, so one attacker can also lock you out for ten minutes at a time.
- **Other users and processes on the host.** Anyone who can read your files as you, or as root, can read
  `.env` and `private/`. Data is not encrypted at rest.
- **More than one person.** There are no accounts, roles or per-user data. Everyone with the password
  sees and can change the same campaign.
- **The model provider.** The text of your reports, and your audio if you use voice, is sent to the
  endpoint in `OPENAI_BASE_URL`. That provider's retention policy applies. Requests to OpenAI are sent
  with `store: false`. Use a local model to keep everything on your machine.
- **A compromised device.** Someone holding your unlocked, logged-in phone has the app.
- **Prompt injection through your own reports.** The judge reads what you write. Its output is forced
  into a strict schema and sanitised (unknown fronts dropped, battle types checked against the outcome),
  so the worst case is an odd battle on your map, which you can delete.
- **`ARTESH_OPEN=1`.** This switches the login off entirely. It exists for a machine nobody else can
  reach. Do not combine it with a public address.

### Sensible setup

1. Choose a long password. It is typed once per device.
2. Keep the server on a private network (a tailnet is the easy route) and serve it over HTTPS.
3. With a proxy or tunnel in front, set `HOST=127.0.0.1` so the port is not reachable directly.
4. Treat `ARTESH_TOKEN` like a password: generate it randomly, and rotate it if a Shortcut or script
   that holds it is shared.
5. Keep `.env` and `private/` out of git (they are ignored by default) and out of shared folders.
6. Back up `private/`.

## Scope

In scope: anything that lets someone without the password or token read or change the campaign, obtain
the API key, read files outside the allowlist, or take over a session.

Out of scope: attacks that need access to the host's filesystem, a deployment over plain HTTP on an
untrusted network, `ARTESH_OPEN=1`, denial of service by flooding, and the behaviour of third-party
model providers.
