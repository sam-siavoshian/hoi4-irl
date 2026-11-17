---
name: setup-home-front
description: Install, configure and self-host Home Front (this repository) on the user's own machine, then verify it works. Use when the user asks to set up, install, self-host, deploy, run, update, back up or troubleshoot Home Front, including keeping it running as a service, HTTPS for a phone, and choosing an AI provider.
---

# Set up and self-host Home Front

Home Front is a single-user web app: one Node server (`server.mjs`) that serves a built interface, keeps
the user's journal in a data folder, and calls an AI provider on their behalf. Your job is to get it
running on the user's machine, private and durable, and to prove each step worked before moving on.

This file is self-contained: an agent that has only this file can do the whole job. Fetch it with

```bash
curl -fsSL https://raw.githubusercontent.com/sam-siavoshian/hoi4-irl/main/SKILL.md
```

Once the repository is cloned, `docs/SELF_HOSTING.md` is the full reference. This file is the order to do things in and the rules to
keep. If the two disagree, read the code (`server.mjs`, `.env.example`) and trust that.

## Rules

- **Secrets never go in chat, in git, or in command output.** Do not ask the user to paste a password or
  an API key into the conversation. Generate the password yourself into `.env` without printing it, and
  have the user add their API key in the app (Settings → General staff) or edit `.env` themselves.
  Never `cat .env`, never echo a key, never commit `.env`.
- **The user's data stays out of the repository.** Data lives in `~/.homefront` by default (older
  installs: `./private`, git-ignored). Never move it into a tracked path, never `git add -f` it, and
  never delete or overwrite an existing data folder. Before any step that touches it, back it up.
- **Do not expose it to the internet by accident.** Bind to `127.0.0.1` whenever a tunnel or reverse
  proxy sits in front. Never set `HOMEFRONT_OPEN=1` unless the user asks for a no-login setup on a
  machine nobody else can reach.
- **Ask before anything that changes the system outside this folder**: installing Node, Docker or
  Tailscale, creating a service, opening a port, adding a cron job.
- **Verify, then report.** After each stage run its check. If a check fails, stop and diagnose; do not
  carry on and do not say it works.

## 1. Find out what you are working with

Run these and read the results before choosing a path:

```bash
uname -s && uname -m            # Darwin (Mac) or Linux
node --version                   # need v20 or newer
docker --version 2>/dev/null     # optional path
git -C . rev-parse --show-toplevel   # are we already inside the repository?
ls ~/.homefront ./private 2>/dev/null   # an existing install's data
```

### Where it can run

| Target | Works | How |
|---|---|---|
| Mac (a Mac mini that stays on is ideal) | Yes | Node + launchd (stages 2–4) |
| Linux PC, home server, NAS with Node or Docker | Yes | Node + systemd, or Docker |
| Raspberry Pi (3, 4, 5, Zero 2; 64-bit OS) | Yes | Node + systemd. The server is light; `npm install` and the first build take a few minutes on a Pi. Use a cloud or networked model, not a model on the Pi itself |
| Windows | Yes | Node in WSL2 (treat as Linux), or Docker Desktop |
| A VPS or a container host with a persistent disk (Fly.io, Railway, Render, a plain droplet) | Yes | Docker image from the `Dockerfile`; mount a volume at the data folder; set `HOMEFRONT_PASSWORD` as a secret; keep the login on |
| Vercel, Netlify, Cloudflare Pages, GitHub Pages | Demo only | These host static files and short-lived functions with no disk, so they cannot run the server, keep the journal or hold a key. `npm run build:site` produces `_site/` (the landing page plus the app as a browser-only demo: offline judge, data in that browser). `vercel.json` in the repository does this. Tell the user plainly that this is not the private, synced app |

If the user names a host not listed, the test is: can it run a long-lived Node 20 process (or a
container) with a folder that survives restarts? If yes, it works. If no, it is demo-only.

Then settle three things with the user, in one message, with a recommendation for each:

1. **Where it runs**: this machine with Node (recommended: simplest, easiest to update) or Docker.
2. **Who reaches it**: only this computer, or also their phone. A phone needs HTTPS (stage 5).
3. **Which AI provider**, if any: they can skip it and use the built-in offline judge, and add a key
   later in the app. A small, cheap model is enough.

If there is existing data, say so and confirm you will keep it.

## 2. Install (Node path)

```bash
git clone https://github.com/sam-siavoshian/hoi4-irl.git homefront   # skip if already inside it
cd homefront
npm install
```

Node missing or older than 20: propose installing it (Homebrew `brew install node` on a Mac, the
distribution's package or nvm on Linux) and wait for a yes.

Create the configuration without showing the secret:

```bash
[ -f .env ] || cp .env.example .env
chmod 600 .env
# set a strong password only if none is set; do not print it
grep -q '^HOMEFRONT_PASSWORD=.\+' .env || \
  node -e "const fs=require('fs'),c=require('crypto');let s=fs.readFileSync('.env','utf8');s=s.replace(/^HOMEFRONT_PASSWORD=.*$/m,'HOMEFRONT_PASSWORD='+c.randomBytes(18).toString('base64url'));fs.writeFileSync('.env',s)"
```

Tell the user the password is in `.env` on the line `HOMEFRONT_PASSWORD=` and that they can open the
file to read or change it. Do not read it out.

If they will put a proxy or tunnel in front (stage 5), set `HOST=127.0.0.1` in `.env` now.

## 3. Start it and check it

```bash
npm start        # builds the interface if needed, then serves on http://localhost:8080
```

Run it in the background or a second terminal, then check:

```bash
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8080/healthz      # 200
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8080/api/state    # 401: the login wall is up
```

Read the server's first lines of output. They say which address it listens on and where the data is
kept (`Your data is kept in …`). Confirm that folder is outside the repository, or is `./private`.

Common failures:
- *"The interface has not been built yet"*: run `npm run build`, then start again.
- *Refuses to start, mentions the password*: `HOMEFRONT_PASSWORD` is empty in `.env`.
- *Port in use*: set `PORT=` in `.env` to a free port and use it in every later step.

Ask the user to open the address, log in, choose a country and file one test report. That is the real
acceptance test; a 200 from curl is not.

## 4. Keep it running

Pick by platform, and get a yes first. Use absolute paths; services do not have your shell's PATH.

**Mac (launchd)**: follow "Mac (launchd)" in `docs/SELF_HOSTING.md`. In short: copy
`deploy/com.homefront.server.plist` to `~/Library/LaunchAgents/`, replace `/PATH/TO/node` (from
`which node`) and `/PATH/TO/hoi4-irl` (this folder), then
`launchctl load ~/Library/LaunchAgents/com.homefront.server.plist`.

**Linux (systemd)**: follow "Linux (systemd)" in the same file. If the unit uses `ProtectSystem` or
`ReadWritePaths`, make sure the data folder actually in use is writable by the service user, and set
`HOMEFRONT_DATA_DIR` explicitly in `.env` so it does not depend on that user's home.

**A cloud host with a disk** (Fly.io, Railway, Render, a VPS): build from the `Dockerfile`. The image
listens on `0.0.0.0:8080` and keeps data in `/app/private`; attach a persistent volume there, set
`HOMEFRONT_PASSWORD` through the host's secrets (never in the image or the repository), and let the
host provide HTTPS. The login page is then on the public internet: the password must be long and random.
Deploying creates resources on the user's account, so confirm the plan and the cost with them first.

**Vercel or another static host** (demo only): `npx vercel deploy --prod` from the repository uses
`vercel.json` (`npm run build:site`, output `_site`). No password, no server, no key; say so.

**Docker**: `cp .env.example .env`, set the password as in stage 2, then `docker compose up -d`. Data
lives in the `homefront-data` volume. Check with `docker compose ps` (healthy) and the two curl checks.

Afterwards stop the copy you started by hand, re-run the stage 3 checks, and confirm the service
survives a restart of itself (`launchctl kickstart -k …`, `systemctl restart homefront`, or
`docker compose restart`).

## 5. Phone access over HTTPS (only if they want it)

The microphone and offline mode need HTTPS. The private way is Tailscale: nothing is exposed publicly.

1. Tailscale installed and signed in on the host and the phone (the user does the sign-in).
2. `HOST=127.0.0.1` in `.env`, restart the service.
3. `tailscale serve --bg 8080`, then `tailscale serve status` to read the `https://…ts.net` address.
4. The user opens that address on the phone, logs in, and uses Share → Add to Home Screen.

A public domain (Caddy) is in `docs/SELF_HOSTING.md`. Only go that way if the user asks for it, and say
plainly that the login page will then be reachable by anyone.

## 6. The AI provider

Preferred: the user opens **Settings → General staff** in the app, picks a provider, pastes their own
key and presses Test. The key is stored on their server and never shown again. You do not handle it.

If that screen is not present in their version, the provider is set in `.env`
(`OPENAI_API_KEY`, `OPENAI_BASE_URL`, `OPENAI_MODEL`, `LLM_API`; see the comments in `.env.example`).
Have the user put the key in the file themselves, then restart.

A local model keeps every word on the machine: start a model server (e.g. `ollama pull llama3.2`), then in the app
**Local model → Find local models**, pick one, **Test**. Hardware, runtimes, Docker, `.env`: `docs/LOCAL_MODELS.md`.

No provider at all is a supported setup: the offline keyword judge handles reports.

## 7. Backups

Everything worth keeping is the data folder. Offer a daily copy and get a yes before adding a cron job
or launchd timer:

```bash
mkdir -p "$HOME/backups" && tar -czf "$HOME/backups/homefront-$(date +%F).tar.gz" -C "$HOME" .homefront
```

Adjust the path if `HOMEFRONT_DATA_DIR` or `./private` is in use. The app also exports a backup file
from Settings. Test a restore once by listing the archive (`tar -tzf`), not by overwriting live data.

## 8. Updating

```bash
tar -czf "$HOME/backups/homefront-before-update-$(date +%F).tar.gz" -C "$HOME" .homefront   # first
git pull
npm install
npm run build
# restart: launchctl kickstart -k …, systemctl restart homefront, or docker compose up -d --build
```

Then re-run the stage 3 checks. If the working tree has local changes, stop and ask; do not reset them.

## 9. Hand over

Finish with a short summary the user can keep:

- the address (and the phone address, if set up);
- where the password is (`.env`, `HOMEFRONT_PASSWORD`), not the password itself;
- where the data is and how it is backed up;
- how to stop, start and update it on their platform;
- which AI provider is active, or that it is running on the offline judge;
- anything you could not verify, stated as such.
