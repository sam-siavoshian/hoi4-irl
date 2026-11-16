# Self-hosting

ARTESH runs as one small Node server (`server.mjs`, Node 20 or newer, nothing to install). It

- shows nothing but a password box until you log in (one password, remembered per device for a year),
- keeps the model API key on the host, so the browser never receives it,
- judges reports and transcribes voice through the provider you configure,
- stores the campaign in `private/`, so the phone and the desktop show the same war,
- tells search engines to stay away (`noindex`, `robots.txt`).

Contents: [Quick start](#quick-start) · [Mac](#mac-launchd) · [Linux](#linux-systemd) ·
[Docker](#docker) · [HTTPS](#https) · [iPhone](#iphone) · [Backups](#backups) ·
[Updating](#updating) · [Troubleshooting](#troubleshooting)

## Quick start

```bash
git clone https://github.com/sam-siavoshian/hoi4-irl.git artesh
cd artesh
cp .env.example .env      # then set ARTESH_PASSWORD (and OPENAI_API_KEY if you use a model)
npm start                 # http://localhost:8080
```

`.env` and `private/` are git-ignored. Keep them that way.

All settings are listed in the [README](../README.md#configuration). The ones that matter for hosting:

| Variable | Use |
|---|---|
| `ARTESH_PASSWORD` | Required. Choose a long one; you type it once per device. |
| `HOST` | `0.0.0.0` by default (all interfaces). Set `127.0.0.1` when a tunnel or reverse proxy sits in front. |
| `PORT` | `8080` by default. |
| `ARTESH_DATA_DIR` | Where data is stored. `./private` by default. |
| `ARTESH_TOKEN` | Enables the automation API. Generate one with `openssl rand -hex 32`. |

Without `OPENAI_API_KEY` the app still works, with the offline keyword judge and the keyboard's
dictation key.

## Mac (launchd)

A Mac Mini or any Mac that stays on is a good host. The repository ships a launchd agent,
`deploy/com.artesh.server.plist`, that starts the server at login and restarts it if it stops.

1. Find your paths:

   ```bash
   which node        # e.g. /opt/homebrew/bin/node
   pwd               # the repository, e.g. /Users/you/artesh
   ```

2. Open `deploy/com.artesh.server.plist` and replace each `/PATH/TO/node` and `/PATH/TO/hoi4-irl` with
   those values. launchd does not read your shell profile, so the path to `node` must be absolute.

3. Install and start it:

   ```bash
   mkdir -p private
   cp deploy/com.artesh.server.plist ~/Library/LaunchAgents/
   launchctl load ~/Library/LaunchAgents/com.artesh.server.plist
   ```

4. Check it:

   ```bash
   curl -s http://localhost:8080/robots.txt
   tail private/server.log
   ```

To stop it: `launchctl unload ~/Library/LaunchAgents/com.artesh.server.plist`. After changing `.env`,
unload and load again.

A launch agent runs while you are logged in. On a headless Mac, turn on automatic login, and set
*Prevent automatic sleeping* in System Settings → Energy.

## Linux (systemd)

Create a user and put the code somewhere it can read:

```bash
sudo useradd --system --home /opt/artesh --shell /usr/sbin/nologin artesh
sudo git clone https://github.com/sam-siavoshian/hoi4-irl.git /opt/artesh
sudo cp /opt/artesh/.env.example /opt/artesh/.env
sudo nano /opt/artesh/.env                      # set ARTESH_PASSWORD, HOST=127.0.0.1, ...
sudo chown -R artesh:artesh /opt/artesh
sudo chmod 600 /opt/artesh/.env
```

`/etc/systemd/system/artesh.service`:

```ini
[Unit]
Description=ARTESH
After=network-online.target
Wants=network-online.target

[Service]
User=artesh
Group=artesh
WorkingDirectory=/opt/artesh
ExecStart=/usr/bin/node /opt/artesh/server.mjs
Restart=always
RestartSec=3

# Hardening: the service can write only to its data folder.
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/opt/artesh/private
UMask=0077

[Install]
WantedBy=multi-user.target
```

```bash
sudo -u artesh mkdir -p /opt/artesh/private
sudo systemctl daemon-reload
sudo systemctl enable --now artesh
systemctl status artesh
journalctl -u artesh -f
```

The server reads `/opt/artesh/.env` by itself, so no `EnvironmentFile=` line is needed. Adjust
`ExecStart` if `which node` gives a different path. If you move the data with `ARTESH_DATA_DIR`, change
`ReadWritePaths` to match.

## Docker

```bash
cp .env.example .env       # set ARTESH_PASSWORD
docker compose up -d
docker compose logs -f
```

The compose file builds a small image (`node:22-alpine`, non-root), passes `.env` to the container,
keeps the data in a named volume (`artesh-data`, mounted at `/app/private`) and publishes port 8080 on
the host's loopback interface only. Put HTTPS in front of it as described below, or change the port
mapping to `"8080:8080"` if you want it reachable on your network directly.

Without compose:

```bash
npm run docker             # docker build -t artesh .
docker run -d --name artesh --restart unless-stopped \
  --env-file .env -p 127.0.0.1:8080:8080 \
  -v artesh-data:/app/private artesh
```

Notes:

- In a container, leave `HOST` and `ARTESH_DATA_DIR` alone; the image sets them (`0.0.0.0`,
  `/app/private`).
- `--env-file` passes values literally. Do not put quotes around them in `.env`.
- To use a model running on the host (Ollama, LM Studio), point `OPENAI_BASE_URL` at
  `http://host.docker.internal:11434/v1`. On Linux, add `--add-host=host.docker.internal:host-gateway`
  (or the matching `extra_hosts` entry in compose).
- The image has a health check against `/robots.txt`; `docker ps` shows `healthy` once it is up.
- To keep the data in a folder instead of a volume, use `-v "$PWD/private:/app/private"`. The container
  runs as uid 1000, so that folder must be writable by uid 1000.

## HTTPS

You need HTTPS for anything beyond `localhost`: browsers only allow the microphone, the service worker
(offline mode) and a `Secure` cookie on HTTPS, and without it your password crosses the network in the
clear.

### Tailscale (private, recommended)

A tailnet gives the host an HTTPS address that only your own devices can open. Nothing is exposed to the
internet.

1. Install [Tailscale](https://tailscale.com) on the host and on your phone, signed in to the same
   account. Enable HTTPS certificates in the Tailscale admin console.
2. On the host:

   ```bash
   tailscale serve --bg 8080
   ```

3. Open `https://<machine>.<tailnet>.ts.net` on any of your devices.
4. Set `HOST=127.0.0.1` in `.env` and restart, so the port is reachable only through Tailscale.

### Caddy (your own domain)

If you want a public address, [Caddy](https://caddyserver.com) obtains and renews certificates by
itself. `Caddyfile`:

```
artesh.example.com {
    reverse_proxy 127.0.0.1:8080
}
```

Set `HOST=127.0.0.1` in `.env`. Caddy sends `X-Forwarded-Proto`, which the server uses to mark the
session cookie `Secure`.

Read this before you expose it publicly: **the password is then the only lock.** Use a long random one.
Failed logins are throttled per client address, and behind a proxy every visitor arrives from the
proxy's address, so the throttle applies to all of them together. Prefer the tailnet unless you have a
reason not to.

### Other tunnels

Cloudflare Tunnel, ngrok and nginx work the same way: terminate TLS in front, forward to
`127.0.0.1:8080`, pass `X-Forwarded-Proto: https`, and bind the server to `127.0.0.1`.

Do not port-forward the plain HTTP port from your router.

## iPhone

1. Open your HTTPS address in Safari and log in.
2. Share → **Add to Home Screen**.

The app then opens full-screen and works offline. If you change the address later, add it again; the
installed app is tied to the address it came from.

To file reports from Shortcuts or Siri without opening the app, set `ARTESH_TOKEN` and follow
[API.md](API.md#ios-shortcuts-and-siri).

## Backups

Everything worth keeping is in the data folder (`private/` by default, or `ARTESH_DATA_DIR`):

| File | What it is |
|---|---|
| `state.json` | The whole campaign. This is the file that matters. |
| `journal.ndjson` | Append-only record of every change. Lets you see or recover what changed and when. |
| daily backups | Dated copies of the campaign, written by the server once a day. |
| `sessions.json` | Logged-in devices. Not worth backing up; losing it only means logging in again. |

The server's own daily backups protect you from a bad edit. They do not protect you from a dead disk,
because they live in the same folder. Copy the folder somewhere else as well.

A nightly copy with cron:

```cron
15 3 * * *  tar -czf "$HOME/backups/artesh-$(date +\%F).tar.gz" -C /opt/artesh private
```

From Docker:

```bash
docker run --rm -v artesh-data:/data -v "$PWD":/out alpine \
  tar -czf /out/artesh-$(date +%F).tar.gz -C /data .
```

On a Mac, Time Machine covers the folder if the repository is inside a backed-up location.

You can also export from the app: Settings › More › Export backup gives a single JSON file, and Import
restores it on any instance.

**Restoring.** Stop the server, put `state.json` back in the data folder, start the server. Devices pick
up the restored campaign the next time they open the app.

**Moving to another machine.** Copy `.env` and the data folder, start the server there. You will need to
log in again on each device only if you leave `sessions.json` behind.

## Updating

```bash
git pull
# then restart: launchctl unload/load, systemctl restart artesh, or docker compose up -d --build
```

There is nothing to migrate and nothing to build. Because the state is replayed from your reports, a new
version re-derives the map from the same history. Read the [changelog](../CHANGELOG.md) first: a change
to the engine's rules can shift where your fronts stand.

The installed app is network-first, so it picks up the new version the next time it is opened online.

## Troubleshooting

**"Refusing to start without ARTESH_PASSWORD."**
Set it in `.env`, or in the environment for Docker. The server will not run unlocked by accident.

**The microphone does nothing on the phone.**
You are on plain HTTP. Browsers only allow recording on HTTPS (or `localhost`).

**"Add to Home Screen" works but the app does not open offline.**
Same cause: the service worker only registers on HTTPS.

**Logged out after every restart, or the cookie does not stick.**
Check that the data folder is writable and persistent (in Docker, that the volume is mounted). Sessions
are stored in `sessions.json`.

**"Too many tries."**
Eight wrong passwords in ten minutes lock that address out for the rest of the ten minutes. Wait, or
restart the server.

**The judge fails and the app says it fell back to offline.**
Look at the server log. Usual causes: a wrong key, a model name the endpoint does not have, or an
endpoint without the Responses API (set `LLM_API=chat`).

**Port already in use.**
Set `PORT` in `.env`.

**The phone shows an older war than the desktop.**
Open the app while online; it pulls the server copy when it comes to the foreground. If two devices
both changed things while offline, the one that reached the server first wins and the other adopts it.
