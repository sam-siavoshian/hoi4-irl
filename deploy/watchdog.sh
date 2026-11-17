#!/bin/bash
# Run by launchd every two minutes (com.artesh.watchdog).
# - restarts the server if /healthz fails twice in a row (hung process, unreadable campaign, full disk)
#   by stopping it: launchd (KeepAlive) starts a fresh one
# - puts the private tailnet HTTPS address back if it went missing
# - keeps the log files from growing without limit
set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PRIVATE="$ROOT/private"
env_value() { grep -E "^[[:space:]]*$1=" "$ROOT/.env" 2>/dev/null | tail -1 | cut -d= -f2- | tr -d "\"' "; }
PORT="$(env_value PORT)"; PORT="${PORT:-8080}"
HTTPS_PORT="$(env_value ARTESH_HTTPS_PORT)"; HTTPS_PORT="${HTTPS_PORT:-8443}"
FAILS="$PRIVATE/.watchdog-failures"
log() { echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) $*"; }

if curl -fs --max-time 5 -o /dev/null "http://127.0.0.1:$PORT/healthz"; then
  rm -f "$FAILS"
else
  n=$(( $(cat "$FAILS" 2>/dev/null || echo 0) + 1 )); echo "$n" > "$FAILS"
  log "health check failed ($n in a row)"
  if [ "$n" -ge 2 ]; then # stop it; launchd's KeepAlive starts a fresh one within seconds
    log "restarting the server"
    pkill -TERM -f "$ROOT/server.mjs"; sleep 10
    pkill -KILL -f "$ROOT/server.mjs" && log "server ignored SIGTERM, killed it"
    echo 0 > "$FAILS"
  fi
fi

if command -v tailscale >/dev/null && tailscale status >/dev/null 2>&1; then
  if ! tailscale serve status 2>/dev/null | grep -q ":$HTTPS_PORT "; then
    log "tailnet address on :$HTTPS_PORT missing, adding it back"
    tailscale serve --bg --https="$HTTPS_PORT" "http://127.0.0.1:$PORT" >/dev/null 2>&1 || log "tailscale serve failed"
  fi
fi

for f in "$PRIVATE"/*.log; do # truncate in place (launchd keeps the file open) to the last 1 MB once it passes 10 MB
  [ -f "$f" ] || continue
  if [ "$(stat -f%z "$f")" -gt 10485760 ]; then tail -c 1048576 "$f" > "$f.tmp" && cat "$f.tmp" > "$f"; rm -f "$f.tmp"; fi
done
exit 0
