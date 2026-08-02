#!/bin/bash
# Starts the Astro SSR server if it isn't already listening on its port.
# Meant to run on the cyberfolks VPS — via cron @reboot (see setup-cron.sh)
# and safe to re-run manually (idempotent: skips if already up).
set -u

APP_DIR="$HOME/apps/new-global-s-home"
NODE_BIN="/opt/alt/alt-nodejs22/root/usr/bin/node"
PORT=54322
HOST=127.0.0.1

cd "$APP_DIR" || exit 1

if curl -s --max-time 2 "http://$HOST:$PORT/" > /dev/null 2>&1; then
  echo "$(date -Iseconds) already running on port $PORT, skipping" >> start.log
else
  PORT=$PORT HOST=$HOST nohup "$NODE_BIN" server/entry.mjs >> app.log 2>&1 &
  echo "$(date -Iseconds) started (pid $!)" >> start.log
fi
