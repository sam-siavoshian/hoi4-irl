#!/bin/bash
# Installs ARTESH as a private, self-restarting service on this Mac. Safe to run again after every update.
#   bash deploy/install-macos.sh          (asks for your password once, for sudo)
# The server and watchdog are system LaunchDaemons, so they start at boot with nobody logged in to the desktop,
# but they run as you, not root. Needs: Node 20+, a filled-in .env, Tailscale logged in.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DAEMONS=/Library/LaunchDaemons
NODE="$(command -v node || true)"
RUN_USER="$(id -un)"
sudo() { if [ -n "${SUDO_ASKPASS:-}" ]; then command sudo -A "$@"; else command sudo "$@"; fi; } # SUDO_ASKPASS: install over ssh with no terminal
env_value() { grep -E "^[[:space:]]*$1=" "$ROOT/.env" 2>/dev/null | tail -1 | cut -d= -f2- | tr -d "\"' "; }

[ "$(id -u)" -ne 0 ] || { echo "Run as your normal user, not root (it uses sudo where needed)."; exit 1; }
[ -n "$NODE" ] || { echo "node not found on PATH"; exit 1; }
[ "$("$NODE" -p 'process.versions.node.split(".")[0]')" -ge 20 ] || { echo "Node 20+ required"; exit 1; }
[ -f "$ROOT/.env" ] || { echo "Missing $ROOT/.env (copy .env.example)"; exit 1; }
[ -n "$(env_value ARTESH_PASSWORD)" ] || { echo "ARTESH_PASSWORD is empty in .env"; exit 1; }
[ "$(env_value HOST)" = "127.0.0.1" ] || echo "warning: HOST is not 127.0.0.1, so the server is reachable on the LAN too"
PORT="$(env_value PORT)"; PORT="${PORT:-8080}"
HTTPS_PORT="$(env_value ARTESH_HTTPS_PORT)"; HTTPS_PORT="${HTTPS_PORT:-8443}"

chmod 600 "$ROOT/.env"
mkdir -p "$ROOT/private"; chmod 700 "$ROOT/private"
chmod +x "$ROOT/deploy/watchdog.sh"

# the interface is built (Vite) into dist/; the server only serves dist/. Build tools are dev-only and never run in the server.
BUN="$(command -v bun || echo "$HOME/.bun/bin/bun")"
if [ -x "$BUN" ]; then (cd "$ROOT" && "$BUN" install --no-save >/dev/null); else (cd "$ROOT" && npm ci --no-audit --no-fund >/dev/null); fi
(cd "$ROOT" && "$NODE" tools/ensure-build.mjs --force)
[ -f "$ROOT/dist/index.html" ] || { echo "Build failed: dist/index.html is missing"; exit 1; }

for name in com.artesh.server com.artesh.watchdog; do
  tmp="$(mktemp)"
  sed -e "s#__ROOT__#$ROOT#g" -e "s#__NODE__#$NODE#g" -e "s#__USER__#$RUN_USER#g" -e "s#__HOME__#$HOME#g" "$ROOT/deploy/$name.plist" > "$tmp"
  plutil -lint "$tmp" >/dev/null
  sudo launchctl bootout "system/$name" 2>/dev/null || true
  sudo install -m 644 -o root -g wheel "$tmp" "$DAEMONS/$name.plist"; rm -f "$tmp"
  sudo launchctl bootstrap system "$DAEMONS/$name.plist"
  sudo launchctl enable "system/$name"
done

for _ in $(seq 1 30); do curl -fs --max-time 2 -o /dev/null "http://127.0.0.1:$PORT/healthz" && break; sleep 1; done
curl -fsS --max-time 2 -o /dev/null "http://127.0.0.1:$PORT/healthz" || { echo "Server did not come up. Last log lines:"; tail -20 "$ROOT/private/server.log"; exit 1; }

if command -v tailscale >/dev/null; then
  sudo tailscale serve --bg --https="$HTTPS_PORT" "http://127.0.0.1:$PORT" >/dev/null
  echo "ARTESH is up: $(tailscale serve status | grep -m1 -o "https://[^ ]*:$HTTPS_PORT") (your tailnet only)"
else
  echo "ARTESH is up on http://127.0.0.1:$PORT. Install Tailscale for a private HTTPS address."
fi
